import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { useState, memo } from "react";
import ComparePricesModal from "./products/ComparePricesModal";
import PriceDisplay from "./products/PriceDisplay";
import { useCurrency } from "../context/CurrencyContext";
import { useProducts } from "../context/ProductContext";
import { formatCurrencyUSD, formatCurrencyVES } from "../utils/formatters";

const ProductCardInner = memo(function ProductCardInner({
  product,
  isOwnProduct,
  isFavorite,
  isTrending,
  proximityLabel,
  isAvailable,
  isCartAtMax,
  isAdding,
  onAddToCart,
  onToggleFavorite,
}) {
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const { isVES } = useCurrency();
  const { bcvRate } = useProducts();

  const discount = product.active_discount;

  const storeName =
    product.store?.business_name ||
    product.store_profiles?.business_name ||
    "TIENDA OFICIAL";
  const hasImage = product.images && product.images.length > 0;

  return (
    <>
      <article className="w-full max-w-[342px] mx-auto sm:mx-0 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col group hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
        {/* Sección de la Imagen con Altura Fija Uniforme */}
        <div className="relative h-[220px] w-full bg-white border-b border-slate-50 overflow-hidden">
          <Link
            to={`/product/${product.id}`}
            className="block w-full h-full p-6 flex items-center justify-center"
          >
            {hasImage ? (
              <img
                src={product.images[0]}
                alt={product.name}
                loading="lazy"
                className="max-w-full max-h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <span className="text-slate-300 italic text-sm">Sin Imagen</span>
            )}
          </Link>

          {/* Acciones Superiores Derechas (Favoritos) */}
          <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
            <button
              onClick={onToggleFavorite}
              className={`p-2 bg-white/90 backdrop-blur-sm border rounded-full shadow-sm transition-colors ${
                isFavorite
                  ? "border-rose-200 bg-rose-50 text-rose-500"
                  : "border-slate-100 hover:bg-rose-50 hover:text-rose-500 hover:border-rose-100 text-slate-400"
              }`}
              title={
                isFavorite ? "Quitar de favoritos" : "Agregar a favoritos"
              }
            >
              <svg
                className={`h-4 w-4 transition-all duration-300 ${isFavorite ? "fill-current scale-110" : "fill-none scale-100"}`}
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                ></path>
              </svg>
            </button>

            {!isOwnProduct && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  setIsCompareOpen(true);
                }}
                className="p-2 bg-white/90 backdrop-blur-sm border border-slate-100 rounded-full shadow-sm text-slate-400 hover:text-[#2563eb] hover:border-[#2563eb]/30 hover:bg-blue-50 transition-colors"
                title="Comparar Precios"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 6l3 1m0 0l-3 9a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0022.5 16l-3-9m-3-1l-3 1m0 0l3 9"
                  />
                </svg>
              </button>
            )}
          </div>

          {/* Badge Vendedor Superior Izquierdo y Tendencia */}
          <div className="absolute top-4 left-4 z-10 max-w-[70%] flex flex-col gap-2">
            {isTrending && (
              <span className="px-2 py-1 text-[9px] font-bold tracking-wider uppercase bg-orange-500 text-white shadow-sm rounded-md block w-max flex items-center gap-1">
                <span className="material-symbols-outlined text-[10px]">
                  local_fire_department
                </span>
                MÁS VENDIDO
              </span>
            )}
            <Link
              to={`/store/${product.store_id}`}
              onClick={(e) => e.stopPropagation()}
              className="px-2.5 py-1 text-[9.5px] font-extrabold tracking-wider uppercase bg-white/95 backdrop-blur-sm text-[#6b1e96] shadow-sm border border-slate-200/50 rounded-md block whitespace-nowrap overflow-hidden text-ellipsis hover:bg-[#6b1e96] hover:text-white transition-all duration-300 w-max"
            >
              {storeName}
            </Link>
          </div>

          {/* Discount Badge */}
          {discount && (
            <div className="absolute bottom-3 left-3 z-10">
              <span className="px-2.5 py-1 text-[11px] font-black uppercase tracking-wide bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-lg rounded-lg flex items-center gap-1 animate-[fadeIn_0.3s_ease-out]">
                <span className="material-symbols-outlined" style={{ fontSize: "13px" }}>local_offer</span>
                {discount.discount_type === "percentage" ? `-${discount.discount_value}%` : `-$${discount.discount_value}`}
              </span>
            </div>
          )}
        </div>

        {/* Sección de Contenido Inferior */}
        <div className="p-5 flex flex-col flex-grow bg-white">
          {/* Indicador de Disponibilidad + Proximidad */}
          <div className="mb-2 flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5">
              <div
                className={`h-1.5 w-1.5 rounded-full ${isAvailable ? "bg-emerald-500" : "bg-amber-500"}`}
              ></div>
              <span
                className={`text-[11px] font-medium tracking-wide uppercase ${isAvailable ? "text-emerald-600" : "text-amber-600"}`}
              >
                {isAvailable ? "Disponible" : "Sin Stock"}
              </span>
            </div>

            {/* Proximity Badges */}
            {proximityLabel === "same_state" && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-bold tracking-wide uppercase bg-emerald-50 text-emerald-700 border border-emerald-200/60 rounded-md animate-[fadeIn_0.3s_ease-out]">
                <span className="material-symbols-outlined text-[10px]">
                  location_on
                </span>
                En tu estado
              </span>
            )}
            {proximityLabel === "neighbor" && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-bold tracking-wide uppercase bg-blue-50 text-blue-600 border border-blue-200/60 rounded-md animate-[fadeIn_0.3s_ease-out]">
                <span className="material-symbols-outlined text-[10px]">
                  near_me
                </span>
                Cerca de ti
              </span>
            )}
            {proximityLabel === "regional" && product.store?.state && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-medium tracking-wide uppercase bg-slate-50 text-slate-500 border border-slate-200/60 rounded-md">
                <span className="material-symbols-outlined text-[10px]">
                  local_shipping
                </span>
                {product.store.state}
              </span>
            )}
          </div>

          {/* Título de Producto linkeado */}
          <Link to={`/product/${product.id}`}>
            <h2
              className="text-[16px] font-medium text-slate-900 leading-tight mb-2 hover:text-[#6b1e96] cursor-pointer transition-colors line-clamp-2"
              title={product.name}
            >
              {product.name}
            </h2>
          </Link>

          {/* Product Rating */}
          <div className="flex items-center mb-4 text-[#facc15] gap-0.5">
            {[...Array(5)].map((_, i) => (
              <span
                key={i}
                className={`material-symbols-outlined text-[14px] ${i < Math.round(product.rating_avg || 0) ? "text-[#facc15]" : "text-slate-200"}`}
              >
                star
              </span>
            ))}
            <span className="ml-2 text-[10px] font-medium text-slate-400">
              {product.review_count || 0} valoraciones
            </span>
          </div>

          {/* Precio */}
          <div className="mb-4">
            {discount ? (
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-black text-[#6b1e96]">
                    {isVES
                      ? formatCurrencyVES(discount.final_price * (Number(bcvRate) || 1))
                      : formatCurrencyUSD(discount.final_price)}
                  </span>
                  <span className="text-sm text-slate-400 line-through font-medium">
                    {isVES
                      ? formatCurrencyVES(discount.original_price * (Number(bcvRate) || 1))
                      : formatCurrencyUSD(discount.original_price)}
                  </span>
                </div>
                {discount.ends_at && (
                  <span className="text-[9px] font-bold text-red-500 uppercase tracking-wide flex items-center gap-0.5">
                    <span className="material-symbols-outlined" style={{ fontSize: "11px" }}>timer</span>
                    Oferta limitada
                  </span>
                )}
              </div>
            ) : (
              <PriceDisplay amountUSD={product.price} />
            )}
          </div>

          {/* Botón de Agregar al carrito */}
          <div className="mt-auto">
            {!isAvailable ? (
              <button
                disabled
                className="w-full bg-gray-100 text-gray-400 font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 cursor-not-allowed text-sm uppercase tracking-wider"
                title="Agotado"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Agotado
              </button>
            ) : isOwnProduct ? (
              <button
                disabled
                className="w-full bg-slate-50 text-slate-400 border border-slate-200 font-medium py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 cursor-not-allowed text-sm"
                title="Este es tu producto"
              >
                Producto Propio
              </button>
            ) : (
              <button
                onClick={onAddToCart}
                disabled={isAdding || isCartAtMax}
                className={`w-full font-medium py-2 px-4 rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 text-sm ${
                  isCartAtMax
                    ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                    : isAdding
                    ? "bg-[#531575] text-white cursor-wait"
                    : "bg-[#6b1e96] hover:bg-[#531575] active:bg-[#43105e] text-white group"
                }`}
                title={isCartAtMax ? "Máximo en carrito" : "Agregar al carrito"}
              >
                {isAdding ? (
                  <>
                    <svg
                      className="animate-spin h-4 w-4"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Agregando...
                  </>
                ) : isCartAtMax ? (
                  <>
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Máximo en carrito
                  </>
                ) : (
                  <>
                    <svg
                      className="h-4 w-4 group-hover:scale-110 transition-transform"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                      ></path>
                    </svg>
                    Al Carrito
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </article>

      <ComparePricesModal
        isOpen={isCompareOpen}
        onClose={() => setIsCompareOpen(false)}
        baseProduct={product}
      />
    </>
  );
});

ProductCardInner.propTypes = {
  product: PropTypes.object.isRequired,
  isOwnProduct: PropTypes.bool.isRequired,
  isFavorite: PropTypes.bool.isRequired,
  isTrending: PropTypes.bool.isRequired,
  proximityLabel: PropTypes.string,
  isAvailable: PropTypes.bool.isRequired,
  isCartAtMax: PropTypes.bool.isRequired,
  isAdding: PropTypes.bool.isRequired,
  onAddToCart: PropTypes.func.isRequired,
  onToggleFavorite: PropTypes.func.isRequired,
};

export default ProductCardInner;
