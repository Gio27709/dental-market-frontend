import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { formatCurrencyUSD } from "../utils/formatters";

export default function SmallProductCard({ product, badge }) {
  const hasImage = product.images && product.images.length > 0;
  const price = Number(product.price) || 0;
  // Simula un precio original más alto para mostrar tachado
  const originalPrice = product.originalPrice || Math.round(price * 1.35 * 100) / 100;

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
        {/* Badge (SALE / NEW) */}
        {badge && (
          <span
            className={`absolute top-0.5 left-0.5 px-1.5 py-0.5 text-[9px] font-bold uppercase rounded-md text-white leading-none ${
              badge === "SALE"
                ? "bg-red-500"
                : badge === "NEW"
                ? "bg-blue-500"
                : "bg-emerald-500"
            }`}
          >
            {badge}
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

        {/* Estrellas */}
        <div className="flex items-center gap-0.5 mt-1">
          {[1, 2, 3, 4].map((star) => (
            <svg
              key={star}
              className="w-3 h-3 fill-amber-400"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
            </svg>
          ))}
          <svg className="w-3 h-3 fill-gray-200" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
          </svg>
        </div>

        {/* Precios */}
        <div className="flex items-center gap-2 mt-1.5">
          <span className="text-[15px] font-bold text-[#6b1e96]">
            {formatCurrencyUSD(price)}
          </span>
          <span className="text-[11px] text-gray-400 line-through">
            {formatCurrencyUSD(originalPrice)}
          </span>
        </div>
      </div>
    </Link>
  );
}

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
  }).isRequired,
  badge: PropTypes.oneOf(["SALE", "NEW", "HOT"]),
};
