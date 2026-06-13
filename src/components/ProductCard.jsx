import PropTypes from "prop-types";
import { useState, useCallback, useMemo } from "react";
import { useCart } from "../context/CartContext";
import { useFavorites } from "../context/FavoriteContext";
import { useAuth } from "../context/AuthContext";
import { useProducts } from "../context/ProductContext";
import { useLocationContext } from "../hooks/useLocationContext";
import { getProximityLabel } from "../utils/stateProximity";
import ProductCardInner from "./ProductCardInner";

export default function ProductCard({ product }) {
  const { addToCart, items: cartItems } = useCart();
  const { toggleFavorite, favoriteIds } = useFavorites();
  const { user } = useAuth();
  const { allProducts, trendingProductIds } = useProducts();
  const { buyerState } = useLocationContext();

  const [isAdding, setIsAdding] = useState(false);

  const isOwnProduct = user?.id === product.store_id;
  const isFavorite = useMemo(() => favoriteIds?.has(product.id) || false, [favoriteIds, product.id]);
  const isTrending = useMemo(() => trendingProductIds?.has(product.id) || false, [trendingProductIds, product.id]);

  // Compute proximity label for geo-badge
  const proximityLabel = useMemo(() => {
    const storeState = product.store?.state || product.store_profiles?.state || null;
    return buyerState && storeState ? getProximityLabel(buyerState, storeState) : "";
  }, [buyerState, product.store?.state, product.store_profiles?.state]);

  // Resolve max stock for this product (consistent with CartContext logic)
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
    return 99; // Safe cap — backend enforces actual limit
  }, [allProducts, product]);

  // Determine if cart has reached max stock
  const isCartAtMax = useMemo(() => {
    if (maxStock <= 0) return true;
    const totalCartQtyForProduct = cartItems
      .filter((ci) => ci.product_id === product.id)
      .reduce((sum, ci) => sum + Number(ci.quantity), 0);
    return totalCartQtyForProduct >= maxStock;
  }, [cartItems, product.id, maxStock]);

  // Determine availability
  const isAvailable = useMemo(() => {
    if (product?.stock_status === "Sin stock") return false;

    const variations = product?.product_variations || product?.variations || [];
    if (variations.length > 0) {
      return variations.some((v) => v.stock > 0);
    }
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
      const defaultVar = product.product_variations?.[0] || product.variations?.[0] || null;
      await addToCart(product, defaultVar, 1);
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
    <ProductCardInner
      product={product}
      isOwnProduct={isOwnProduct}
      isFavorite={isFavorite}
      isTrending={isTrending}
      proximityLabel={proximityLabel}
      isAvailable={isAvailable}
      isCartAtMax={isCartAtMax}
      isAdding={isAdding}
      onAddToCart={handleAddToCart}
      onToggleFavorite={handleToggleFavorite}
    />
  );
}

ProductCard.propTypes = {
  product: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    name: PropTypes.string.isRequired,
    price: PropTypes.number.isRequired,
    images: PropTypes.arrayOf(PropTypes.string),
    store_id: PropTypes.string,
    stock: PropTypes.number,
    stock_status: PropTypes.string,
    store: PropTypes.shape({
      business_name: PropTypes.string,
      state: PropTypes.string,
    }),
    store_profiles: PropTypes.shape({
      business_name: PropTypes.string,
      state: PropTypes.string,
    }),
    rating_avg: PropTypes.number,
    review_count: PropTypes.number,
    variations: PropTypes.array,
    product_variations: PropTypes.array,
  }).isRequired,
};
