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

  const cardPriceDetails = useMemo(() => {
    const variations = product?.product_variations || product?.variations || [];
    const validVars = variations.filter((v) => {
      const isLegacyDefault =
        v.attribute_name === "default" ||
        v.attribute_value === '{"_default":"default"}' ||
        v.attribute_value === "default";
      return !isLegacyDefault;
    });

    const getFinalPrice = (origPrice) => {
      if (!discount) return origPrice;
      let discountAmount = 0;
      if (discount.discount_type === "percentage") {
        discountAmount = (origPrice * discount.discount_value) / 100;
      } else {
        discountAmount = Math.min(discount.discount_value, origPrice);
      }
      return Math.max(0, Math.round((origPrice - discountAmount) * 100) / 100);
    };

    if (validVars.length > 0) {
      const prices = validVars.map((v) => {
        const orig = Number(product.price) + Number(v.price_modifier || 0);
        const final = getFinalPrice(orig);
        return { orig, final };
      });

      const finalPrices = prices.map((p) => p.final);
      const origPrices = prices.map((p) => p.orig);

      const minFinal = Math.min(...finalPrices);
      const maxFinal = Math.max(...finalPrices);
      const minOrig = Math.min(...origPrices);
      const maxOrig = Math.max(...origPrices);

      const isRange = minFinal !== maxFinal;

      return {
        isRange,
        minFinal,
        maxFinal,
        minOrig,
        maxOrig,
        discount
      };
    } else {
      const originalPrice = Number(product.price);
      const finalPrice = discount ? Number(discount.final_price) : originalPrice;

      return {
        isRange: false,
        originalPrice,
        finalPrice,
        discount
      };
    }
  }, [product, discount]);

  const isRange = cardPriceDetails.isRange;

  // Format prices
  const formattedPrice = useMemo(() => {
    if (isRange) {
      const minUSD = cardPriceDetails.minFinal;
      const maxUSD = cardPriceDetails.maxFinal;
      const minVES = minUSD * Number(bcvRate || 1);
      const maxVES = maxUSD * Number(bcvRate || 1);
      return isVES
        ? `${formatCurrencyVES(minVES)} - ${formatCurrencyVES(maxVES)}`
        : `${formatCurrencyUSD(minUSD)} - ${formatCurrencyUSD(maxUSD)}`;
    } else {
      const finalPrice = discount ? Number(discount.final_price) : (Number(product.price) || 0);
      const vesEquiv = finalPrice * Number(bcvRate || 1);
      return isVES ? formatCurrencyVES(vesEquiv) : formatCurrencyUSD(finalPrice);
    }
  }, [isVES, isRange, cardPriceDetails, bcvRate, discount, product.price]);

  const formattedEquivPrice = useMemo(() => {
    if (isRange) {
      const minUSD = cardPriceDetails.minFinal;
      const maxUSD = cardPriceDetails.maxFinal;
      const minVES = minUSD * Number(bcvRate || 1);
      const maxVES = maxUSD * Number(bcvRate || 1);
      return isVES
        ? `≈ ${formatCurrencyUSD(minUSD)} - ${formatCurrencyUSD(maxUSD)}`
        : `≈ ${formatCurrencyVES(minVES)} - ${formatCurrencyVES(maxVES)}`;
    } else {
      const finalPrice = discount ? Number(discount.final_price) : (Number(product.price) || 0);
      const vesEquiv = finalPrice * Number(bcvRate || 1);
      return isVES ? `≈ ${formatCurrencyUSD(finalPrice)}` : `≈ ${formatCurrencyVES(vesEquiv)}`;
    }
  }, [isVES, isRange, cardPriceDetails, bcvRate, discount, product.price]);

  const formattedOriginalPrice = useMemo(() => {
    if (isRange) {
      const minUSD = cardPriceDetails.minOrig;
      const maxUSD = cardPriceDetails.maxOrig;
      const minVES = minUSD * Number(bcvRate || 1);
      const maxVES = maxUSD * Number(bcvRate || 1);
      return isVES
        ? `${formatCurrencyVES(minVES)} - ${formatCurrencyVES(maxVES)}`
        : `${formatCurrencyUSD(minUSD)} - ${formatCurrencyUSD(maxUSD)}`;
    } else {
      const originalPrice = discount ? Number(discount.original_price) : null;
      if (!originalPrice) return "";
      const originalVesEquiv = originalPrice * Number(bcvRate || 1);
      return isVES ? formatCurrencyVES(originalVesEquiv) : formatCurrencyUSD(originalPrice);
    }
  }, [isVES, isRange, cardPriceDetails, bcvRate, discount]);



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

  const hasRealVariations = useMemo(() => {
    const variations = product?.product_variations || product?.variations || [];
    return variations.filter((v) => {
      const isLegacyDefault =
        v.attribute_name === "default" ||
        v.attribute_value === '{"_default":"default"}' ||
        v.attribute_value === "default";
      return !isLegacyDefault;
    }).length > 0;
  }, [product]);

  const targetVariation = product?.variations?.[0] || null;

  // Determine cart max
  const isCartAtMax = useMemo(() => {
    if (maxStock <= 0) return true;
    let totalQty = 0;
    if (hasRealVariations && targetVariation) {
      totalQty = cartItems
        .filter((ci) => ci.product_id === product.id && ci.variation_id === targetVariation.id)
        .reduce((sum, ci) => sum + Number(ci.quantity), 0);
    } else {
      totalQty = cartItems
        .filter((ci) => ci.product_id === product.id)
        .reduce((sum, ci) => sum + Number(ci.quantity), 0);
    }
    return totalQty >= maxStock;
  }, [cartItems, product.id, maxStock, hasRealVariations, targetVariation]);

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
