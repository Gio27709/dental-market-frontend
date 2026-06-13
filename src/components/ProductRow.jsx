import PropTypes from "prop-types";
import { useState, useCallback, useMemo } from "react";
import { useCart } from "../context/CartContext";
import { useFavorites } from "../context/FavoriteContext";
import { useAuth } from "../context/AuthContext";
import { useProducts } from "../context/ProductContext";
import { useLocationContext } from "../hooks/useLocationContext";
import { useCurrency } from "../context/CurrencyContext";
import { formatCurrencyUSD, formatCurrencyVES } from "../utils/formatters";
import { getProximityLabel } from "../utils/stateProximity";
import ProductRowInner from "./ProductRowInner";

export default function ProductRow({ product }) {
  const { addToCart, items: cartItems } = useCart();
  const { toggleFavorite, favoriteIds } = useFavorites();
  const { user } = useAuth();
  const { bcvRate, allProducts, trendingProductIds } = useProducts();
  const { buyerState } = useLocationContext();
  const { isVES } = useCurrency();

  const [isAdding, setIsAdding] = useState(false);

  const isOwnProduct = user?.id === product.store_id;
  const isFavorite = useMemo(() => favoriteIds?.has(product.id) || false, [favoriteIds, product.id]);
  const isTrending = useMemo(() => trendingProductIds?.has(product.id) || false, [trendingProductIds, product.id]);

  const discount = product.active_discount;
  const finalPrice = discount ? discount.final_price : (product.price || 0);
  const originalPrice = discount ? discount.original_price : null;

  const vesEquiv = useMemo(() => finalPrice * Number(bcvRate || 1), [finalPrice, bcvRate]);
  const originalVesEquiv = useMemo(() => originalPrice ? originalPrice * Number(bcvRate || 1) : 0, [originalPrice, bcvRate]);

  // Format prices
  const formattedPrice = useMemo(() => {
    return isVES ? formatCurrencyVES(vesEquiv) : formatCurrencyUSD(finalPrice);
  }, [isVES, vesEquiv, finalPrice]);

  const formattedEquivPrice = useMemo(() => {
    return isVES ? `≈ ${formatCurrencyUSD(finalPrice)}` : `≈ ${formatCurrencyVES(vesEquiv)}`;
  }, [isVES, vesEquiv, finalPrice]);

  const formattedOriginalPrice = useMemo(() => {
    if (!originalPrice) return "";
    return isVES ? formatCurrencyVES(originalVesEquiv) : formatCurrencyUSD(originalPrice);
  }, [isVES, originalVesEquiv, originalPrice]);



  // Compute proximity label
  const proximityLabel = useMemo(() => {
    const storeState = product.store?.state || null;
    return buyerState && storeState ? getProximityLabel(buyerState, storeState) : "";
  }, [buyerState, product.store?.state]);

  // Resolve max stock
  const maxStock = useMemo(() => {
    const fullProduct = allProducts?.find((p) => p.id === product.id) || product;
    const defaultVariation = fullProduct?.variations?.[0];
    if (defaultVariation?.stock != null) return defaultVariation.stock;
    const defaultVar = fullProduct?.variations?.find(
      (v) =>
        v.attribute_name === "default" ||
        v.attribute_value === '{"_default":"default"}' ||
        v.attribute_value === "default"
    );
    if (defaultVar?.stock != null) return defaultVar.stock;
    if (
      fullProduct?.product_variations?.length > 0 &&
      fullProduct.product_variations[0].stock != null
    ) {
      return fullProduct.product_variations[0].stock;
    }
    if (fullProduct?.stock != null) return fullProduct.stock;
    return 99;
  }, [allProducts, product]);

  // Determine cart max
  const isCartAtMax = useMemo(() => {
    if (maxStock <= 0) return true;
    const totalCartQtyForProduct = cartItems
      .filter((ci) => ci.product_id === product.id)
      .reduce((sum, ci) => sum + Number(ci.quantity), 0);
    return totalCartQtyForProduct >= maxStock;
  }, [cartItems, product.id, maxStock]);

  // Clean description
  const cleanDescription = useMemo(() => {
    return product.description
      ? product.description.replace(/<[^>]*>?/gm, "").trim()
      : "";
  }, [product.description]);

  // Determine availability
  const isAvailable = useMemo(() => {
    if (product?.stock_status === "Sin stock") return false;
    const variations = product?.product_variations || product?.variations || [];
    if (variations.length > 0) return variations.some((v) => v.stock > 0);
    return (
      product?.stock !== 0 &&
      product?.stock !== null &&
      product?.stock !== undefined
    );
  }, [product]);

  const handleAddToCart = useCallback(async () => {
    if (isOwnProduct || isAdding || isCartAtMax) return;
    setIsAdding(true);
    try {
      await addToCart(product, product.variations?.[0] || null, 1);
    } finally {
      setIsAdding(false);
    }
  }, [isOwnProduct, isAdding, isCartAtMax, addToCart, product]);

  const handleToggleFavorite = useCallback(
    (e) => {
      e.preventDefault();
      toggleFavorite(product.id);
    },
    [toggleFavorite, product.id]
  );

  return (
    <ProductRowInner
      product={product}
      isOwnProduct={isOwnProduct}
      isFavorite={isFavorite}
      isTrending={isTrending}
      proximityLabel={proximityLabel}
      isAvailable={isAvailable}
      isCartAtMax={isCartAtMax}
      isAdding={isAdding}
      formattedPrice={formattedPrice}
      formattedEquivPrice={formattedEquivPrice}
      formattedOriginalPrice={formattedOriginalPrice}
      discount={discount}
      cleanDescription={cleanDescription}
      onAddToCart={handleAddToCart}
      onToggleFavorite={handleToggleFavorite}
    />
  );
}

ProductRow.propTypes = {
  product: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    name: PropTypes.string.isRequired,
    price: PropTypes.number,
    stock: PropTypes.number,
    stock_status: PropTypes.string,
    store_id: PropTypes.string,
    description: PropTypes.string,
    images: PropTypes.arrayOf(PropTypes.string),
    variations: PropTypes.array,
    product_variations: PropTypes.array,
    store: PropTypes.shape({
      business_name: PropTypes.string,
      state: PropTypes.string,
    }),
    active_discount: PropTypes.shape({
      final_price: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      original_price: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      discount_type: PropTypes.string,
      discount_value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    }),
  }).isRequired,
};
