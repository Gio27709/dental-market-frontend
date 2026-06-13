import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { useState, memo } from "react";
import ComparePricesModal from "./products/ComparePricesModal";

const ProductRowInner = memo(function ProductRowInner({
  product,
  isOwnProduct,
  isFavorite,
  isTrending,
  proximityLabel,
  isAvailable,
  isCartAtMax,
  isAdding,
  formattedPrice,
  formattedEquivPrice,
  formattedOriginalPrice,
  discount,
  cleanDescription,
  onAddToCart,
  onToggleFavorite,
}) {
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const storeName = product.store?.business_name || "Tienda Oficial";
  const hasImage = product.images && product.images.length > 0;

  return (
    <>
      <article className="bg-white rounded-2xl border border-slate-200/80 hover:border-slate-300 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 flex overflow-hidden group relative">
        {/* 🖼 Contenedor de Imagen y Overlay Favoritos */}
        <div className="relative flex-shrink-0 w-[210px] h-[210px] bg-white overflow-hidden">
          {/* ♥ Heart Button — Overlay sobre la imagen */}
          {/* Discount Badge */}
          {discount && (
            <div className="absolute bottom-3.5 left-3.5 z-10">
              <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wide bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-md rounded-md flex items-center gap-0.5">
                <span className="material-symbols-outlined text-[12px]">local_offer</span>
                {discount.discount_type === "percentage" ? `-${discount.discount_value}%` : `-$${discount.discount_value}`}
              </span>
            </div>
          )}

          <button
            onClick={onToggleFavorite}
            className={`absolute top-3.5 left-3.5 z-10 p-2 rounded-full backdrop-blur-sm border transition-all duration-200 ${
              isFavorite
                ? "text-rose-500 bg-rose-50/90 border-rose-200 shadow-sm"
                : "text-slate-400 bg-white/80 border-slate-200/60 hover:text-rose-400 hover:bg-rose-50/90 hover:border-rose-200"
            }`}
            title={isFavorite ? "Quitar de favoritos" : "Agregar a favoritos"}
          >
            <svg
              className={`w-4 h-4 transition-all duration-300 ${isFavorite ? "fill-current scale-110" : "fill-none scale-100"}`}
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

          <Link
            to={`/product/${product.id}`}
            className="block w-full h-full flex items-center justify-center p-6"
          >
            {hasImage ? (
              <img
                src={product.images[0]}
                alt={product.name}
                loading="lazy"
                className="max-w-full max-h-full object-contain mix-blend-multiply group-hover:scale-108 transition-transform duration-500"
              />
            ) : (
              <div className="flex flex-col items-center gap-2 text-slate-300">
                <svg
                  className="w-10 h-10"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z"
                  />
                </svg>
                <span className="text-xs italic">Sin Imagen</span>
              </div>
            )}
          </Link>
        </div>

        {/* 📋 Info Central */}
        <div className="flex-1 py-5 pr-4 flex flex-col justify-between min-w-0">
          <div>
            {/* Badges: Tienda y Tendencia */}
            <div className="mb-2 flex items-center gap-2 flex-wrap">
              {isTrending && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase bg-orange-500 text-white shadow-sm rounded-md">
                  <span className="material-symbols-outlined text-[12px]">
                    local_fire_department
                  </span>
                  Más Vendido
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase bg-[#6b1e96]/10 text-[#6b1e96] border border-[#6b1e96]/15 rounded-md">
                <svg
                  className="w-3 h-3 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z"
                  />
                </svg>
                {storeName}
              </span>

              {/* Geo-Proximity Badges */}
              {proximityLabel === "same_state" && (
                <span className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-bold tracking-wider uppercase bg-emerald-50 text-emerald-700 border border-emerald-200/60 rounded-md">
                  <span className="material-symbols-outlined text-[11px]">
                    location_on
                  </span>
                  En tu estado
                </span>
              )}
              {proximityLabel === "neighbor" && (
                <span className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-bold tracking-wider uppercase bg-blue-50 text-blue-600 border border-blue-200/60 rounded-md">
                  <span className="material-symbols-outlined text-[11px]">
                    near_me
                  </span>
                  Cerca de ti
                </span>
              )}
              {proximityLabel === "regional" && product.store?.state && (
                <span className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-medium tracking-wider uppercase bg-slate-50 text-slate-500 border border-slate-200/60 rounded-md">
                  <span className="material-symbols-outlined text-[11px]">
                    local_shipping
                  </span>
                  {product.store.state}
                </span>
              )}
            </div>

            {/* Título del Producto */}
            <Link to={`/product/${product.id}`}>
              <h3 className="text-lg font-bold text-slate-900 leading-snug hover:text-[#6b1e96] transition-colors line-clamp-2 mb-1.5">
                {product.name}
              </h3>
            </Link>

            {/* Descripción */}
            {cleanDescription && (
              <p className="text-[13px] text-slate-500 leading-relaxed line-clamp-2 mb-3">
                {cleanDescription}
              </p>
            )}

            {/* Estrellas + Disponibilidad en una línea */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <div className="flex text-amber-400 gap-px">
                  {[1, 2, 3, 4].map((s) => (
                    <svg key={s} className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                  <svg className="w-3.5 h-3.5 fill-slate-200" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </div>
                <span className="text-[10px] text-slate-400 font-medium">(128)</span>
              </div>
              <span className="text-slate-300 text-xs">·</span>
              <div className="flex items-center gap-1.5">
                <div
                  className={`h-1.5 w-1.5 rounded-full ${isAvailable ? "bg-emerald-500" : "bg-rose-500"}`}
                ></div>
                <span
                  className={`text-[11px] font-semibold uppercase tracking-wide ${isAvailable ? "text-emerald-600" : "text-rose-600"}`}
                >
                  {isAvailable ? "Disponible" : "Sin Stock"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 💰 Precio + CTA */}
        <div className="flex-shrink-0 w-[190px] p-5 flex flex-col items-end justify-between">
          <div className="text-right flex flex-col items-end">
            {discount ? (
              <>
                <span className="text-2xl font-bold text-[#6b1e96]">{formattedPrice}</span>
                <p className="text-[11px] text-slate-400 mt-0.5 font-medium line-through">
                  {formattedOriginalPrice}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5 font-medium">
                  {formattedEquivPrice}
                </p>
                {discount.ends_at && (
                  <span className="text-[9px] font-bold text-red-500 uppercase tracking-wide flex items-center gap-0.5 mt-1">
                    <span className="material-symbols-outlined text-[11px]">timer</span>
                    Oferta limitada
                  </span>
                )}
              </>
            ) : (
              <>
                <span className="text-2xl font-bold text-[#6b1e96]">{formattedPrice}</span>
                <p className="text-[11px] text-slate-400 mt-0.5 font-medium">
                  {formattedEquivPrice}
                </p>
              </>
            )}
          </div>

          {/* Botón CTA */}
          <div className="w-full mt-auto">
            {!isAvailable ? (
              <button
                disabled
                className="w-full bg-gray-100 text-gray-400 font-medium py-2.5 px-4 rounded-xl text-xs cursor-not-allowed"
              >
                Agotado
              </button>
            ) : isOwnProduct ? (
              <button
                disabled
                className="w-full bg-slate-50 text-slate-400 border border-slate-200 font-medium py-2.5 px-4 rounded-xl text-xs cursor-not-allowed"
              >
                Producto Propio
              </button>
            ) : (
              <button
                onClick={onAddToCart}
                disabled={isAdding || isCartAtMax}
                className={`w-full font-semibold py-2.5 px-4 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 text-sm ${
                  isCartAtMax
                    ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                    : isAdding
                    ? "bg-[#531575] text-white cursor-wait"
                    : "bg-[#6b1e96] hover:bg-[#531575] active:bg-[#43105e] text-white hover:shadow-md"
                }`}
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
                    Máximo
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                      />
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

ProductRowInner.propTypes = {
  product: PropTypes.object.isRequired,
  isOwnProduct: PropTypes.bool.isRequired,
  isFavorite: PropTypes.bool.isRequired,
  isTrending: PropTypes.bool.isRequired,
  proximityLabel: PropTypes.string,
  isAvailable: PropTypes.bool.isRequired,
  isCartAtMax: PropTypes.bool.isRequired,
  isAdding: PropTypes.bool.isRequired,
  formattedPrice: PropTypes.string.isRequired,
  formattedEquivPrice: PropTypes.string.isRequired,
  formattedOriginalPrice: PropTypes.string,
  discount: PropTypes.object,
  cleanDescription: PropTypes.string.isRequired,
  onAddToCart: PropTypes.func.isRequired,
  onToggleFavorite: PropTypes.func.isRequired,
};

export default ProductRowInner;
