import PropTypes from "prop-types";
import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import useHomeSections from "../../hooks/useHomeSections";

/* ────────────────────────────────────────────
   Tarjeta compacta interna — estilo premium
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
      className="group bg-white rounded-2xl border border-gray-100 hover:border-purple-200 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 p-4 flex flex-col relative overflow-hidden"
    >
      {/* Badge Premium */}
      {(discountBadgeText || badge) && (
        <span className="absolute top-3 right-3 z-10 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-md uppercase tracking-wider">
          {discountBadgeText || badge}
        </span>
      )}

      {/* Imagen */}
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl flex items-center justify-center h-36 md:h-40 mb-4 overflow-hidden relative group-hover:from-purple-50 group-hover:to-white transition-colors duration-500">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            className="max-h-full max-w-full object-contain group-hover:scale-110 transition-transform duration-700 ease-out"
          />
        ) : (
          <span className="material-symbols-outlined text-4xl text-gray-300 group-hover:text-purple-200 transition-colors duration-500">
            inventory_2
          </span>
        )}
      </div>

      {/* Info */}
      <h4 className="text-sm font-semibold text-gray-800 line-clamp-2 leading-snug mb-2 group-hover:text-purple-700 transition-colors">
        {name}
      </h4>

      {/* Estrellas */}
      <div className="flex items-center gap-0.5 mb-3 mt-auto">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`w-3.5 h-3.5 ${star <= rating ? "text-amber-400 drop-shadow-sm" : "text-gray-200"}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>

      {/* Precio y Acción */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <p className="text-lg font-extrabold text-gray-900 group-hover:text-purple-800 transition-colors">
            ${price.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </p>
          {originalPrice > 0 && (
            <p className="text-xs text-gray-400 line-through">
              ${originalPrice.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </p>
          )}
        </div>
        <div className="w-8 h-8 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
          <span className="material-symbols-outlined text-sm font-bold">add_shopping_cart</span>
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
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Llenar hasta 6 slots repitiendo si hay pocos
  const filled = available.length > 0
    ? Array.from({ length: 6 }, (_, i) => available[i % available.length])
    : [];

  const badges = [null, "HOT", null, null, "NEW", null];

  const updateScrollButtons = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 5);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 5);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateScrollButtons();
    el.addEventListener("scroll", updateScrollButtons);
    return () => el.removeEventListener("scroll", updateScrollButtons);
  }, []);

  const scroll = (dir) => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.8;
    el.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  };

  if (available.length === 0) return null;

  // Producto destacado para el banner
  const featuredProduct = available[0];
  const featuredImage = typeof featuredProduct?.images?.[0] === 'string'
    ? featuredProduct.images[0]
    : featuredProduct?.images?.[0]?.url || featuredProduct?.image || null;
    null;

  return (
    <section className="mb-20">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 shadow-2xl shadow-purple-900/5 rounded-2xl overflow-hidden bg-white border border-gray-100 relative z-10">
        
        {/* =========== BANNER IZQUIERDO (PREMIUM DARK MODE) =========== */}
        <div className="lg:col-span-4 flex flex-col relative overflow-hidden bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 p-8 md:p-10 text-white">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-purple-500/20 blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 rounded-full bg-pink-500/20 blur-3xl pointer-events-none"></div>

          {/* Encabezado interno del banner */}
          <div className="relative z-10 mb-8 flex justify-between items-start">
            <h2 className="text-xl font-bold tracking-tight text-white/90">
              {sectionTitle}
            </h2>
            <span className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-[0_0_15px_rgba(255,255,255,0.1)]">
              <span className="material-symbols-outlined text-sm">workspace_premium</span>
              {badgeText}
            </span>
          </div>

          {/* Texto promocional */}
          <div className="relative z-10 flex flex-col flex-1">
            <h3 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-purple-200 leading-tight mb-4 drop-shadow-sm">
              {promoLines.map((line, i) => (
                <span key={i} className="block">
                  {line}
                </span>
              ))}
            </h3>

            <p className="text-sm text-purple-200 font-medium mb-8 max-w-xs">
              {promoSubtext}
            </p>

            {/* Botón */}
            <Link
              to={buttonLink}
              className="inline-flex items-center self-start gap-2 bg-white text-purple-900 font-bold text-sm px-7 py-3 rounded-full hover:bg-purple-50 hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:scale-105 transition-all duration-300 group mt-auto z-20"
            >
              {buttonText}
              <span className="material-symbols-outlined text-base group-hover:translate-x-1.5 transition-transform duration-300">
                arrow_forward
              </span>
            </Link>
          </div>

          {/* Imagen del producto grande */}
          <div className="absolute bottom-[-10%] right-[-5%] w-3/5 h-3/5 opacity-80 group hover:opacity-100 transition-opacity duration-500 z-10 flex items-end justify-end">
            {featuredImage ? (
              <img
                src={featuredImage}
                alt={featuredProduct?.name || "Producto"}
                className="max-h-full object-contain drop-shadow-2xl origin-bottom-right hover:scale-110 hover:-rotate-3 transition-transform duration-700 ease-out"
              />
            ) : (
              <div className="w-40 h-40 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(0,0,0,0.3)] mb-8 mr-8">
                <span className="material-symbols-outlined text-6xl text-white/40">dentistry</span>
              </div>
            )}
          </div>
        </div>

        {/* =========== GRID DERECHO =========== */}
        <div className="lg:col-span-8 flex flex-col bg-gray-50/50 relative">
          {/* Encabezado con flechas */}
          <div className="flex items-center justify-between p-6 pb-4 border-b border-gray-100 bg-white">
            <h2 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-500">flash_on</span>
              {gridTitle}
            </h2>

            <div className="flex gap-2">
              <button
                onClick={() => scroll("left")}
                disabled={!canScrollLeft}
                className={`w-9 h-9 flex items-center justify-center rounded-full transition-all duration-200 ${
                  canScrollLeft
                    ? "bg-white border border-gray-200 text-gray-700 hover:bg-purple-600 hover:text-white hover:border-purple-600 shadow-sm active:scale-95"
                    : "bg-gray-50 border border-gray-100 text-gray-300 cursor-not-allowed"
                }`}
              >
                <span className="material-symbols-outlined text-lg">chevron_left</span>
              </button>
              <button
                onClick={() => scroll("right")}
                disabled={!canScrollRight}
                className={`w-9 h-9 flex items-center justify-center rounded-full transition-all duration-200 ${
                  canScrollRight
                    ? "bg-white border border-gray-200 text-gray-700 hover:bg-purple-600 hover:text-white hover:border-purple-600 shadow-sm active:scale-95"
                    : "bg-gray-50 border border-gray-100 text-gray-300 cursor-not-allowed"
                }`}
              >
                <span className="material-symbols-outlined text-lg">chevron_right</span>
              </button>
            </div>
          </div>

          {/* Grid 2 filas × 3 columnas, deslizable */}
          <div
            ref={scrollRef}
            className="overflow-x-auto scrollbar-hide p-6"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            <div className="grid grid-rows-2 grid-flow-col auto-cols-[minmax(200px,1fr)] gap-5 min-w-max">
              {filled.map((product, index) => (
                <DealCard
                  key={`deal-${product?._id || index}-${index}`}
                  product={product}
                  badge={badges[index]}
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
