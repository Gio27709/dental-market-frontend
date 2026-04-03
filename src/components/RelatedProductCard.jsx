import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { formatCurrencyUSD } from "../utils/formatters";

export default function RelatedProductCard({ product, badge }) {
  const hasImage = product.images && product.images.length > 0;
  const price = Number(product.price) || 0;
  // Simula un precio original más alto para mostrar tachado si no hay uno real
  const originalPrice = product.compare_at_price || Math.round(price * 1.35 * 100) / 100;

  return (
    <Link
      to={`/product/${product.id}`}
      className="flex flex-col bg-white rounded-md border border-gray-200 p-4 hover:shadow-md transition-shadow group relative min-h-[300px]"
    >
      {/* Badge (SALE / NEW) */}
      {badge && (
        <span
          className={`absolute top-3 left-3 px-2 py-0.5 text-[10px] font-bold uppercase rounded text-white z-10 ${
            badge === "SALE"
              ? "bg-[#ef4444]" // red
              : badge === "NEW"
              ? "bg-[#2563eb]" // blue
              : "bg-emerald-500"
          }`}
        >
          {badge}
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

        {/* Estrellas Mock */}
        <div className="flex items-center gap-0.5 mb-2.5">
          {[1, 2, 3, 4].map((star) => (
            <svg
              key={star}
              className="w-3.5 h-3.5 text-[#facc15] fill-current"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
            </svg>
          ))}
          <svg className="w-3.5 h-3.5 text-gray-400 fill-current" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
          </svg>
        </div>

        {/* Precios ajustados a la imagen */}
        <div className="flex items-baseline gap-2 mt-auto">
          <span className="text-[16px] font-medium text-[#2563eb]">
            {formatCurrencyUSD(price)}
          </span>
          {originalPrice > price && (
            <span className="text-[12px] text-gray-400 line-through">
              {formatCurrencyUSD(originalPrice)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

RelatedProductCard.propTypes = {
  product: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    name: PropTypes.string.isRequired,
    price: PropTypes.number.isRequired,
    compare_at_price: PropTypes.number,
    images: PropTypes.arrayOf(PropTypes.string),
  }).isRequired,
  badge: PropTypes.oneOf(["SALE", "NEW"]),
};
