import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { memo, useMemo } from "react";
import { formatCurrencyUSD, formatCurrencyVES } from "../utils/formatters";
import { useCurrency } from "../context/CurrencyContext";
import { useProducts } from "../context/ProductContext";
import StarRating from "./StarRating";

const SmallProductCard = memo(function SmallProductCard({ product, badge }) {
  const { isVES } = useCurrency();
  const { bcvRate, trendingProductIds } = useProducts();
  const isTrending = trendingProductIds?.has(product.id);
  const hasImage = product.images && product.images.length > 0;
  
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
  const price = isRange ? cardPriceDetails.minFinal : (discount ? Number(discount.final_price) : (Number(product.price) || 0));
  const originalPrice = isRange ? cardPriceDetails.minOrig : (discount ? Number(discount.original_price) : (product.originalPrice || Math.round(price * 1.35 * 100) / 100));

  const discountBadgeText = discount 
    ? (discount.discount_type === "percentage" ? `-${discount.discount_value}%` : `-$${discount.discount_value}`)
    : null;

  const formatPrice = (amount) => {
    if (isVES) return formatCurrencyVES(amount * Number(bcvRate || 1));
    return formatCurrencyUSD(amount);
  };

  return (
    <Link
      to={`/product/${product.id}`}
      className="flex items-center gap-3 py-3 px-2 rounded-xl hover:bg-gray-50 transition-colors group"
    >
      {/* Imagen pequeña con badge opcional */}
      <div className="relative w-[72px] h-[72px] flex-shrink-0 bg-white rounded-lg border border-gray-100 flex items-center justify-center overflow-hidden">
        {hasImage ? (
          <img
            src={product.images[0]}
            alt={product.name}
            loading="lazy"
            className="max-w-[90%] max-h-[90%] object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-300"
          />
        ) : (
          <span className="material-symbols-outlined text-2xl text-gray-300">
            image
          </span>
        )}
        {/* Badge (SALE / NEW / HOT / DISCOUNT) */}
        {(discountBadgeText || badge || isTrending) && (
          <span
            className={`absolute top-0.5 left-0.5 px-1.5 py-0.5 text-[9px] font-bold uppercase rounded-md text-white leading-none flex items-center gap-0.5 z-10 ${
              discountBadgeText
                ? "bg-red-500 font-extrabold"
                : badge === "SALE"
                ? "bg-red-500"
                : badge === "NEW"
                ? "bg-blue-500"
                : isTrending
                ? "bg-orange-500"
                : "bg-emerald-500"
            }`}
          >
            {discountBadgeText ? (
              <>
                <span className="material-symbols-outlined text-[10px] leading-none">local_offer</span>
                {discountBadgeText}
              </>
            ) : (
              <>
                {isTrending && !badge && <span className="material-symbols-outlined text-[10px] leading-none">local_fire_department</span>}
                {badge || "HOT"}
              </>
            )}
          </span>
        )}
      </div>

      {/* Info del producto */}
      <div className="flex-1 min-w-0">
        <h4 className="text-[13px] font-medium text-gray-800 leading-snug line-clamp-2 group-hover:text-[#6b1e96] transition-colors">
          {product.name}
        </h4>

        {/* Local Shipping Badge */}
        {product.store_profiles?.state && product.store_profiles?.state === (localStorage.getItem("buyer_state") || "") && (
          <div className="inline-flex mt-1 items-center gap-0.5 text-emerald-600 bg-emerald-50 px-1 py-0.5 rounded text-[10px] font-bold tracking-wide border border-emerald-100">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
              <path fillRule="evenodd" d="m11.54 22.351.07.04.028.016a.76.76 0 0 0 .723 0l.028-.015.071-.041a16.975 16.975 0 0 0 1.144-.742 19.58 19.58 0 0 0 2.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 0 0-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 0 0 2.682 2.282 16.975 16.975 0 0 0 1.145.742ZM12 13.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" clipRule="evenodd" />
            </svg>
            Envío Local
          </div>
        )}

        {/* Estrellas reales del producto (antes eran 4 fijas escritas a mano) */}
        <StarRating
          className="mt-1"
          average={Number(product.rating_avg) || 0}
          count={product.review_count || 0}
          size="xs"
        />

        {/* Precios */}
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          <span className="text-[15px] font-bold text-[#6b1e96]">
            {isRange ? (
              isVES ? (
                `${formatCurrencyVES(cardPriceDetails.minFinal * (Number(bcvRate) || 1))} - ${formatCurrencyVES(cardPriceDetails.maxFinal * (Number(bcvRate) || 1))}`
              ) : (
                `${formatCurrencyUSD(cardPriceDetails.minFinal)} - ${formatCurrencyUSD(cardPriceDetails.maxFinal)}`
              )
            ) : (
              formatPrice(price)
            )}
          </span>
          {isRange ? (
            cardPriceDetails.minOrig !== cardPriceDetails.minFinal && (
              <span className="text-[11px] text-gray-400 line-through">
                {isVES ? (
                  `${formatCurrencyVES(cardPriceDetails.minOrig * (Number(bcvRate) || 1))} - ${formatCurrencyVES(cardPriceDetails.maxOrig * (Number(bcvRate) || 1))}`
                ) : (
                  `${formatCurrencyUSD(cardPriceDetails.minOrig)} - ${formatCurrencyUSD(cardPriceDetails.maxOrig)}`
                )}
              </span>
            )
          ) : (
            (discount || originalPrice > price) && (
              <span className="text-[11px] text-gray-400 line-through">
                {formatPrice(originalPrice)}
              </span>
            )
          )}
        </div>
      </div>
    </Link>
  );
})

export default SmallProductCard;

SmallProductCard.propTypes = {
  product: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    name: PropTypes.string.isRequired,
    price: PropTypes.number.isRequired,
    originalPrice: PropTypes.number,
    images: PropTypes.arrayOf(PropTypes.string),
    store_profiles: PropTypes.shape({
      state: PropTypes.string,
    }),
    rating_avg: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    review_count: PropTypes.number,
    variations: PropTypes.array,
    product_variations: PropTypes.array,
    active_discount: PropTypes.shape({
      final_price: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      original_price: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      discount_type: PropTypes.string,
      discount_value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    }),
  }).isRequired,
  badge: PropTypes.oneOf(["SALE", "NEW", "HOT"]),
};
