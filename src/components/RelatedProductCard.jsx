import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { memo } from "react";
import { formatCurrencyUSD, formatCurrencyVES } from "../utils/formatters";
import { useCurrency } from "../context/CurrencyContext";
import { useProducts } from "../context/ProductContext";
import StarRating from "./StarRating";

const RelatedProductCard = memo(function RelatedProductCard({ product, badge }) {
  const { isVES } = useCurrency();
  const { bcvRate, trendingProductIds } = useProducts();
  const isTrending = trendingProductIds?.has(product.id);
  const hasImage = product.images && product.images.length > 0;
  
  const discount = product.active_discount;
  const price = discount ? Number(discount.final_price) : (Number(product.price) || 0);
  const originalPrice = discount ? Number(discount.original_price) : (product.compare_at_price || Math.round(price * 1.35 * 100) / 100);

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
      className="flex flex-col bg-white rounded-md border border-gray-200 p-4 hover:shadow-md transition-shadow group relative min-h-[300px]"
    >
      {/* Badge (SALE / NEW / HOT / DISCOUNT) */}
      {(discountBadgeText || badge || isTrending) && (
        <span
          className={`absolute top-3 left-3 px-2 py-0.5 text-[10px] font-bold uppercase rounded text-white z-10 flex items-center gap-0.5 ${
            discountBadgeText
              ? "bg-gradient-to-r from-red-500 to-rose-600 shadow-md font-black"
              : badge === "SALE"
              ? "bg-[#ef4444]" // red
              : badge === "NEW"
              ? "bg-[#2563eb]" // blue
              : isTrending
              ? "bg-orange-500" // orange
              : "bg-emerald-500"
          }`}
        >
          {discountBadgeText ? (
            <>
              <span className="material-symbols-outlined text-[11px] leading-none">local_offer</span>
              {discountBadgeText}
            </>
          ) : (
            <>
              {isTrending && !badge && <span className="material-symbols-outlined text-[11px] leading-none">local_fire_department</span>}
              {badge || "HOT"}
            </>
          )}
        </span>
      )}

      {/* Imagen */}
      <div className="w-full h-[180px] bg-white flex items-center justify-center mb-4">
        {hasImage ? (
          <img
            src={product.images[0]}
            alt={product.name}
            loading="lazy"
            className="max-w-full max-h-[160px] object-contain group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <span className="text-gray-200 text-sm italic">Sin Imagen</span>
        )}
      </div>

      {/* Info del producto */}
      <div className="flex flex-col flex-grow">
        {/* Título de Producto */}
        <h3
          className="text-[14px] font-medium text-gray-700 leading-snug line-clamp-2 mb-2 group-hover:text-[#2563eb] transition-colors flex-grow"
          title={product.name}
        >
          {product.name}
        </h3>

        {/* Estrellas reales del producto (antes eran 4 fijas escritas a mano) */}
        <StarRating
          className="mb-2.5"
          average={Number(product.rating_avg) || 0}
          count={product.review_count || 0}
          size="sm"
        />

        {/* Precios ajustados a la imagen */}
        <div className="flex items-baseline gap-2 mt-auto">
          <span className="text-[16px] font-medium text-[#2563eb]">
            {formatPrice(price)}
          </span>
          {originalPrice > price && (
            <span className="text-[12px] text-gray-400 line-through">
              {formatPrice(originalPrice)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
})

export default RelatedProductCard;

RelatedProductCard.propTypes = {
  product: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    name: PropTypes.string.isRequired,
    price: PropTypes.number.isRequired,
    compare_at_price: PropTypes.number,
    images: PropTypes.arrayOf(PropTypes.string),
    rating_avg: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    review_count: PropTypes.number,
    active_discount: PropTypes.shape({
      final_price: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      original_price: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      discount_type: PropTypes.string,
      discount_value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    }),
  }).isRequired,
  badge: PropTypes.oneOf(["SALE", "NEW"]),
};
