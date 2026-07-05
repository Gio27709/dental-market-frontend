import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import useHomeSections from "../../hooks/useHomeSections";

/* ────────────────────────────────────────────
   Tarjeta compacta interna — estilo premium y minimalista
   ──────────────────────────────────────────── */
function DealCard({ product, badge }) {
  const imageUrl = typeof product?.images?.[0] === 'string' ? product.images[0] : product?.images?.[0]?.url || product?.image || null;
  
  const discount = product?.active_discount;
  const price = discount ? (discount.final_price ?? 0) : (product?.price ?? 0);
  const originalPrice = discount ? (discount.original_price ?? 0) : null;
  const name = product?.name || "Producto";

  const discountBadgeText = discount 
    ? (discount.discount_type === "percentage" ? `-${discount.discount_value}%` : `-$${discount.discount_value}`)
    : null;

  // Simular rating
  const rating = Math.floor(Math.random() * 2) + 3; // 3-4

  return (
    <Link
      to={`/product/${product?.id || product?._id || ""}`}
      className="group bg-white rounded-xl border border-slate-100 hover:border-purple-200 hover:shadow-[0_8px_20px_rgba(83,21,117,0.04)] hover:-translate-y-0.5 transition-all duration-300 p-2.5 flex flex-col relative overflow-hidden"
    >
      {/* Badge Premium */}
      {(discountBadgeText || badge) && (
        <span className="absolute top-2 left-2 z-10 bg-rose-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-md shadow-sm uppercase tracking-wider">
          {discountBadgeText || badge}
        </span>
      )}

      {/* Imagen */}
      <div className="bg-gradient-to-br from-slate-50 to-purple-50/10 rounded-lg flex items-center justify-center h-20 sm:h-24 mb-2 overflow-hidden relative group-hover:from-purple-50 group-hover:to-white transition-colors duration-500">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            className="max-h-full max-w-full object-contain p-2 group-hover:scale-102 transition-transform duration-500 ease-out"
          />
        ) : (
          <span className="material-symbols-outlined text-2xl text-gray-300 group-hover:text-purple-200 transition-colors duration-500">
            inventory_2
          </span>
        )}
      </div>

      {/* Info */}
      <h4 className="text-[11px] sm:text-xs font-bold text-slate-700 group-hover:text-[#531575] leading-snug line-clamp-2 h-8 mb-1.5 transition-colors">
        {name}
      </h4>

      {/* Estrellas */}
      <div className="flex items-center gap-0.5 mb-1.5 mt-auto">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`w-2.5 h-2.5 ${star <= rating ? "text-amber-400 drop-shadow-sm" : "text-gray-200"}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>

      {/* Precio y Acción */}
      <div className="flex items-center justify-between pt-0.5">
        <div className="flex items-baseline gap-1 flex-wrap">
          <p className="text-xs sm:text-sm font-extrabold text-[#531575] transition-colors">
            ${price.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </p>
          {originalPrice > 0 && (
            <p className="text-[9px] text-slate-400 line-through">
              ${originalPrice.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </p>
          )}
        </div>
        <div className="w-7 h-7 rounded-full bg-purple-50 text-[#531575] hover:bg-[#531575] hover:text-white flex items-center justify-center transition-all duration-300 shadow-sm active:scale-90 flex-shrink-0">
          <span className="material-symbols-outlined text-[13px] font-bold">add_shopping_cart</span>
        </div>
      </div>
    </Link>
  );
}

DealCard.propTypes = {
  product: PropTypes.object.isRequired,
  badge: PropTypes.string,
};

/* ────────────────────────────────────────────
   Componente principal — Deal Of The Day
   ──────────────────────────────────────────── */
export default function DealOfTheDay({ products }) {
  const { sections } = useHomeSections();
  const data = sections?.deal_of_the_day || {};

  // Textos dinámicos con fallback
  const sectionTitle = data.section_title || "Oferta del Día";
  const gridTitle = data.grid_title || "Ofertas Destacadas";
  const badgeText = data.badge_text || "Equipos Premium";
  const promoHeading = data.promo_heading || "15% OFF en\nórdenes mayores\na $500";
  const promoLines = promoHeading.split('\n');
  const promoSubtext = data.promo_subtext || "Válido hasta agotar existencias";
  const buttonText = data.button_text || "Comprar Ahora";
  const buttonLink = data.button_link || "/catalogo";

  const available = products || [];

  // Dynamic badge helper to avoid duplicates and handle arbitrary list lengths
  const getBadge = (index) => {
    const badgesList = [null, "HOT", null, null, "NEW", null, "SALE", null];
    return badgesList[index % badgesList.length];
  };

  if (available.length === 0) return null;

  // Producto destacado para el banner
  const featuredProduct = available[0];
  const featuredImage = typeof featuredProduct?.images?.[0] === 'string'
    ? featuredProduct.images[0]
    : featuredProduct?.images?.[0]?.url || featuredProduct?.image || null;

  return (
    <section className="mb-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 shadow-xl shadow-purple-900/5 rounded-2xl overflow-hidden bg-white border border-gray-100 relative z-10">
        
        {/* =========== BANNER IZQUIERDO (PREMIUM DARK MODE) =========== */}
        <div className="lg:col-span-4 flex flex-col relative overflow-hidden bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 p-5 sm:p-6 text-white min-h-[300px] lg:min-h-full">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-purple-500/20 blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 rounded-full bg-pink-500/20 blur-3xl pointer-events-none"></div>

          {/* Encabezado interno del banner */}
          <div className="relative z-10 mb-4 flex justify-between items-start">
            <h2 className="text-base font-bold tracking-tight text-white/90">
              {sectionTitle}
            </h2>
            <span className="inline-flex items-center gap-1 bg-white/10 backdrop-blur-md border border-white/20 text-[10px] font-semibold px-2 py-0.5 rounded-full shadow-[0_0_10px_rgba(255,255,255,0.1)]">
              <span className="material-symbols-outlined text-[10px]">workspace_premium</span>
              {badgeText}
            </span>
          </div>

          {/* Texto promocional */}
          <div className="relative z-10 flex flex-col flex-1">
            <h3 className="text-xl sm:text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-purple-200 leading-tight mb-2 drop-shadow-sm">
              {promoLines.map((line, i) => (
                <span key={i} className="block">
                  {line}
                </span>
              ))}
            </h3>

            <p className="text-[11px] text-purple-200 font-medium mb-4 max-w-xs">
              {promoSubtext}
            </p>

            {/* Botón */}
            <Link
              to={buttonLink}
              className="inline-flex items-center self-start gap-1.5 bg-white text-purple-900 font-bold text-[11px] px-4 py-2 rounded-full hover:bg-purple-50 hover:shadow-[0_0_15px_rgba(255,255,255,0.2)] hover:scale-105 transition-all duration-300 group mt-auto z-20"
            >
              {buttonText}
              <span className="material-symbols-outlined text-[11px] group-hover:translate-x-1 transition-transform duration-300">
                arrow_forward
              </span>
            </Link>
          </div>

          {/* Imagen del producto grande */}
          <div className="absolute bottom-[-5%] right-[-5%] w-[50%] h-[50%] opacity-85 group hover:opacity-100 transition-opacity duration-500 z-10 flex items-end justify-end">
            {featuredImage ? (
              <img
                src={featuredImage}
                alt={featuredProduct?.name || "Producto"}
                className="max-h-full object-contain drop-shadow-2xl origin-bottom-right hover:scale-105 hover:-rotate-2 transition-transform duration-700 ease-out"
              />
            ) : (
              <div className="w-32 h-32 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(0,0,0,0.3)] mb-6 mr-6">
                <span className="material-symbols-outlined text-4xl text-white/40">dentistry</span>
              </div>
            )}
          </div>
        </div>

        {/* =========== GRID DERECHO (ESTÁTICO Y CENTRADO COMPACTO) =========== */}
        <div className="lg:col-span-8 flex flex-col bg-gray-50/50 relative">
          {/* Encabezado sin flechas de navegación */}
          <div className="flex items-center justify-between p-4 pb-3 border-b border-gray-100 bg-white">
            <h2 className="text-lg font-bold text-gray-900 tracking-tight flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-500 text-lg">flash_on</span>
              {gridTitle}
            </h2>
          </div>

          {/* Grid de 3 columnas horizontales y hasta 2 filas verticales (6 productos máx) */}
          <div className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 w-full">
              {available.slice(0, 6).map((product, index) => (
                <DealCard
                  key={`deal-${product?.id || product?._id || index}-${index}`}
                  product={product}
                  badge={getBadge(index)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

DealOfTheDay.propTypes = {
  products: PropTypes.array,
};
