/* eslint-disable react-refresh/only-export-components */
import PropTypes from "prop-types";
import { createContext, useState, useEffect, useContext, useRef } from "react";
import { useAuth } from "./AuthContext";
import { useProducts } from "./ProductContext";
import {
  generateCartItemUniqueId,
  validateCartItemQuantity,
} from "../utils/cartHelpers";
import toast from "react-hot-toast";
import {
  fetchCart,
  addCartItem,
  updateCartItemAPI,
  removeCartItemAPI,
  clearCartAPI,
  mergeCartAPI,
  updateCartItemVariationAPI,
} from "../services/api";

const CartContext = createContext();
const CART_STORAGE_KEY = "dental_market_cart";

export const CartProvider = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const { bcvRate, products: allProducts } = useProducts();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Totals
  const [totalUsd, setTotalUsd] = useState(0);
  const [totalVes, setTotalVes] = useState(0);
  const [itemCount, setItemCount] = useState(0);

  // UI State (Cart Drawer)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const toggleDrawer = () => setIsDrawerOpen((prev) => !prev);

  // 1. Initial State Load (Local or Remote) and Merge logic
  useEffect(() => {
    if (authLoading) return;

    const initializeCart = async () => {
      setLoading(true);
      try {
        if (user) {
          // Verify if we have a lingering local cart that needs to be merged into the DB
          const savedLocal = localStorage.getItem(CART_STORAGE_KEY);
          if (savedLocal) {
            const localItems = JSON.parse(savedLocal);
            // Even if authenticated, we might have freshly logged in or reloaded the tab

            // Filter local items that don't have a db_id (meaning they were added while logged out)
            const anonymousItems = localItems.filter((item) => !item.db_id);

            if (anonymousItems.length > 0) {
              console.log(
                "Merging anonymous local cart to DB:",
                anonymousItems,
              );
              // Clear the local storage cache early to avoid React StrictMode double-firing
              localStorage.removeItem(CART_STORAGE_KEY);
              try {
                await mergeCartAPI(anonymousItems);
              } catch (mergeErr) {
                console.error("Error merging carts:", mergeErr);
                // Restore in case of failure so items aren't lost
                localStorage.setItem(
                  CART_STORAGE_KEY,
                  JSON.stringify(localItems),
                );
              }
            } else {
              // Render what we have locally safely while remote loads
              setItems(localItems);
            }
          }

          // Fetch remote cart to overwrite/sync
          await loadRemoteCart();
        } else {
          // Anonymous User Flow
          const savedLocal = localStorage.getItem(CART_STORAGE_KEY);
          if (savedLocal) {
            setItems(JSON.parse(savedLocal));
          } else {
            setItems([]);
          }
        }
      } catch (err) {
        console.error("Failed to initialize cart:", err);
      } finally {
        setLoading(false);
      }
    };

    initializeCart();
  }, [user, authLoading]);

  // 2. Fetch Remote Helper
  const loadRemoteCart = async () => {
    try {
      const { data } = await fetchCart();
      // Remap and deduplicate by frontend_id
      const mapped = data.map((item) => ({
        ...item,
        id: item.frontend_id || item.id,
        db_id: item.id,
      }));

      // Deduplicate: merge items with same frontend_id (same product+variation)
      const deduped = [];
      const seen = new Map();
      for (const item of mapped) {
        if (seen.has(item.id)) {
          const existing = seen.get(item.id);
          existing.quantity += item.quantity;
        } else {
          seen.set(item.id, { ...item });
          deduped.push(seen.get(item.id));
        }
      }

      setItems(deduped);
    } catch (err) {
      console.error("Error fetching remote cart", err);
    }
  };

  // 3. Keep Totals and Local Storage in Sync
  useEffect(() => {
    if (loading) return;

    // Persist to localStorage regardless of auth state to ensure fast reload across tabs
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));

    const calculateTotals = () => {
      const calculatedUsd = items.reduce(
        (acc, item) => acc + item.price_usd * item.quantity,
        0,
      );

      const calculatedCount = items.reduce(
        (acc, item) => acc + Number(item.quantity),
        0,
      );

      setTotalUsd(calculatedUsd);
      setTotalVes(calculatedUsd * (bcvRate || 1));
      setItemCount(calculatedCount);
    };

    calculateTotals();
  }, [items, bcvRate, loading]);

  // 4. Actions
  // Mutex to prevent concurrent addToCart/updateQuantity calls from rapid button clicks
  const isAddingRef = useRef(false);
  const isUpdatingRef = useRef(false);

  const resolveMaxStock = (product, variation) => {
    let maxStock;
    if (variation && variation.stock != null) {
      maxStock = variation.stock;
    } else {
      const defaultVar = product?.variations?.find(
        (v) =>
          v.attribute_name === "default" ||
          v.attribute_value === '{"_default":"default"}' ||
          v.attribute_value === "default",
      );
      if (defaultVar && defaultVar.stock != null) {
        maxStock = defaultVar.stock;
      } else if (
        product?.product_variations?.length > 0 &&
        product.product_variations[0].stock != null
      ) {
        maxStock = product.product_variations[0].stock;
      } else if (product?.stock != null) {
        maxStock = product.stock;
      } else {
        // No stock source found — use a safe cap and let the backend enforce the real limit.
        // Using 0 would incorrectly block available products that simply lack frontend stock data.
        maxStock = 99;
        console.warn(
          "[CartContext] resolveMaxStock: No stock source found for product",
          product?.id,
          "— using safe cap 99, backend will enforce actual limit",
        );
      }
    }
    if (product?.stock_status === "Sin stock") {
      maxStock = 0;
    }
    return maxStock;
  };

  /**
   * Resolves maxStock for a cart item by looking up the full product in the catalog.
   * This ensures items added before the fix (with max_stock=999) get correct limits.
   */
  const resolveMaxStockForCartItem = (cartItem) => {
    // Try to find the real product data from the catalog
    const product = allProducts?.find((p) => p.id === cartItem.product_id);
    if (product) {
      // Find the specific variation if the cart item has one
      const variation = cartItem.variation_id
        ? product.variations?.find((v) => v.id === cartItem.variation_id) ||
          cartItem.variation
        : cartItem.variation;
      return resolveMaxStock(product, variation);
    }
    // Fallback to cart item's stored data — use safe cap so backend enforces real limit
    const fallbackStock = cartItem.variation?.stock ?? cartItem.max_stock ?? 99;
    if (fallbackStock === 99)
      console.warn(
        "[CartContext] resolveMaxStockForCartItem: No catalog match for cart item",
        cartItem.product_id,
        "— using safe cap 99",
      );
    return fallbackStock;
  };

  const addToCart = async (product, variation, quantity = 1) => {
    // MUTEX: Block concurrent calls from rapid clicking
    if (isAddingRef.current) {
      return false;
    }
    isAddingRef.current = true;

    try {
      const variationId = variation?.id || "default";
      const frontendId = generateCartItemUniqueId(product.id, variationId);

      // STOCK FIX: Properly resolve maxStock from default variation
      let maxStock = resolveMaxStock(product, variation);

      const safeQuantity = validateCartItemQuantity(quantity, maxStock);

      if (maxStock === 0 || safeQuantity === 0) {
        toast.error("Este producto está agotado.");
        return false;
      }

      // Pre-check: does adding this exceed stock?
      // DEDUP FIX: Search by product_id to catch items with different variation_id formats
      // (e.g., StoreCatalog sends null → "default", ProductDetail sends real UUID)
      const existingByFrontendId = items.find((item) => item.id === frontendId);
      const existingByProductId = !existingByFrontendId
        ? items.find((item) => item.product_id === product.id)
        : null;
      const existingItem = existingByFrontendId || existingByProductId;

      if (existingItem) {
        const projectedQty =
          Number(existingItem.quantity) + Number(safeQuantity);
        if (projectedQty > maxStock) {
          toast.error(
            `Stock insuficiente. Disponible: ${maxStock}, ya tienes ${existingItem.quantity} en tu carrito.`,
          );
          return false;
        }
      }

      // Calculate new item shape
      const newItem = {
        id: frontendId,
        product_id: product.id,
        store_id: product.store_id,
        variation_id: variation?.id || null,
        name: product.name,
        price_usd: product.price + (variation?.price_modifier || 0),
        quantity: safeQuantity,
        image: product.images?.[0] || null,
        variation: variation || null,
        max_stock: maxStock,
        offers_local_delivery: product.store?.offers_local_delivery || false,
        delivery_fee: product.delivery_fee || product.store?.default_delivery_fee || 0,
        store_name: product.store?.business_name || product.store_name || null,
        store_state: product.store?.state || product.store_state || null,
      };

      if (user) {
        // SERVER-FIRST: Wait for backend confirmation before updating UI
        try {
          const response = await addCartItem({
            productId: product.id,
            variationId: variation?.id || null,
            quantity: safeQuantity,
          });

          // Backend confirmed — now safely update local state
          setItems((prev) => {
            const existing = prev.find((item) => item.id === frontendId);
            if (existing) {
              return prev.map((item) =>
                item.id === frontendId
                  ? {
                      ...item,
                      quantity: validateCartItemQuantity(
                        Number(item.quantity) + Number(safeQuantity),
                        maxStock,
                      ),
                      db_id: response?.data?.item?.id || item.db_id,
                    }
                  : item,
              );
            }
            return [
              ...prev,
              { ...newItem, db_id: response?.data?.item?.id || null },
            ];
          });

          return true; // Success
        } catch (err) {
          console.error("Add to cart failed:", err);
          const serverMessage = err.response?.data?.error;
          toast.error(serverMessage || "No se pudo agregar al carrito.");
          return false;
        }
      } else {
        // Local Cart Logic — stock already validated above
        setItems((prev) => {
          const existing = prev.find((item) => item.id === frontendId);
          if (existing) {
            return prev.map((item) =>
              item.id === frontendId
                ? {
                    ...item,
                    quantity: validateCartItemQuantity(
                      Number(item.quantity) + Number(safeQuantity),
                      maxStock,
                    ),
                  }
                : item,
            );
          }
          return [...prev, newItem];
        });
        return true;
      }
    } finally {
      isAddingRef.current = false;
    }
  };

  const removeFromCart = async (itemId) => {
    const previousItems = [...items]; // Save for rollback
    const itemToDelete = items.find((i) => i.id === itemId);

    // Optimistic Delete (Works identical for remote and local)
    setItems((prev) => prev.filter((item) => item.id !== itemId));

    if (user && itemToDelete && itemToDelete.db_id) {
      try {
        await removeCartItemAPI(itemToDelete.db_id);
      } catch (err) {
        console.error("Optimistic Delete Failed, rolling back", err);
        setItems(previousItems); // Rollback
      }
    }
  };

  const updateQuantity = async (itemId, requestedQuantity) => {
    // MUTEX: Block concurrent calls from rapid clicking
    if (isUpdatingRef.current) return;
    isUpdatingRef.current = true;

    try {
      const itemToUpdate = items.find((i) => i.id === itemId);
      if (!itemToUpdate) return;

      // STOCK FIX: Resolve real maxStock from catalog, not from stale cart item data
      const maxStock = resolveMaxStockForCartItem(itemToUpdate);
      const safeQuantity = validateCartItemQuantity(
        Number(requestedQuantity),
        maxStock,
      );

      // If already at this quantity, no-op
      if (safeQuantity === Number(itemToUpdate.quantity)) return;

      if (user) {
        // SERVER-FIRST: Wait for backend confirmation
        try {
          if (itemToUpdate.db_id) {
            await updateCartItemAPI(itemToUpdate.db_id, {
              quantity: safeQuantity,
            });
            // Backend confirmed — now update local state
            setItems((prev) =>
              prev.map((item) =>
                item.id === itemId
                  ? { ...item, quantity: safeQuantity, max_stock: maxStock }
                  : item,
              ),
            );
          }
        } catch (err) {
          console.error("Error updating quantity:", err);
          const serverMessage = err.response?.data?.error;
          toast.error(serverMessage || "No se pudo actualizar la cantidad.");
        }
      } else {
        setItems((prev) =>
          prev.map((item) => {
            if (item.id === itemId)
              return { ...item, quantity: safeQuantity, max_stock: maxStock };
            return item;
          }),
        );
      }
    } finally {
      isUpdatingRef.current = false;
    }
  };

  const changeItemVariation = async (itemId, newVariation) => {
    const itemToUpdate = items.find((i) => i.id === itemId);
    if (!itemToUpdate || !newVariation) return;

    const newFrontendId = generateCartItemUniqueId(
      itemToUpdate.product_id,
      newVariation.id,
    );
    const maxStock = resolveMaxStock(null, newVariation);
    const safeQuantity = validateCartItemQuantity(
      Number(itemToUpdate.quantity),
      maxStock,
    );
    const newPriceUsd =
      itemToUpdate.price_usd -
      (itemToUpdate.variation?.price_modifier || 0) +
      (newVariation.price_modifier || 0);

    if (user) {
      if (itemToUpdate.db_id) {
        try {
          const response = await updateCartItemVariationAPI(
            itemToUpdate.db_id,
            {
              variationId: newVariation.id,
            },
          );

          if (response.data?.merged) {
            setItems((prev) => {
              const withoutOld = prev.filter((i) => i.id !== itemId);
              return withoutOld.map((i) =>
                i.id === newFrontendId
                  ? { ...i, quantity: response.data.item.quantity }
                  : i,
              );
            });
          } else {
            setItems((prev) =>
              prev.map((i) =>
                i.id === itemId
                  ? {
                      ...i,
                      id: newFrontendId,
                      variation_id: newVariation.id,
                      variation: newVariation,
                      price_usd: newPriceUsd,
                      max_stock: maxStock,
                      quantity: safeQuantity,
                    }
                  : i,
              ),
            );
          }
        } catch (err) {
          console.error("Error changing variation, rolling back", err);
          await loadRemoteCart();
        }
      }
    } else {
      setItems((prev) => {
        const existingTargetIndex = prev.findIndex(
          (i) => i.id === newFrontendId && i.id !== itemId,
        );
        if (existingTargetIndex > -1) {
          const withoutOld = prev.filter((i) => i.id !== itemId);
          return withoutOld.map((i) =>
            i.id === newFrontendId
              ? {
                  ...i,
                  quantity: validateCartItemQuantity(
                    Number(i.quantity) + Number(safeQuantity),
                    maxStock,
                  ),
                }
              : i,
          );
        } else {
          return prev.map((i) =>
            i.id === itemId
              ? {
                  ...i,
                  id: newFrontendId,
                  variation_id: newVariation.id,
                  variation: newVariation,
                  price_usd: newPriceUsd,
                  max_stock: maxStock,
                  quantity: safeQuantity,
                }
              : i,
          );
        }
      });
    }
  };

  const clearCart = async () => {
    if (user) {
      try {
        await clearCartAPI(); // Sends DELETE /api/cart
        setItems([]);
      } catch (err) {
        console.error("Error clearing remote cart", err);
      }
    } else {
      setItems([]);
    }
  };

  // Used exclusively for logging out, avoiding 401 Unauthorized API calls
  const wipeLocalCartOnly = () => {
    setItems([]);
    setTotalUsd(0);
    setTotalVes(0);
    setItemCount(0);
  };

  return (
    <CartContext.Provider
      value={{
        items,
        total_usd: totalUsd,
        total_ves: totalVes,
        itemCount,
        loading,
        isDrawerOpen,
        toggleDrawer,
        addToCart,
        removeFromCart,
        updateQuantity,
        changeItemVariation,
        clearCart,
        wipeLocalCartOnly,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

CartProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
export const useCart = () => useContext(CartContext);
