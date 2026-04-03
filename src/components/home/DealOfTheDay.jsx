import PropTypes from "prop-types";
import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";

/* ────────────────────────────────────────────
   Tarjeta compacta interna — estilo referencia
   Imagen arriba, nombre, estrellas, precio
   ──────────────────────────────────────────── */
function DealCard({ product, badge }) {
  const imageUrl =
    product?.images?.[0]?.url ||
    product?.image ||
    null;

  const price = product?.price ?? 0;
  const name = product?.name || "Producto";

  // Simular rating
  const rating = Math.floor(Math.random() * 2) + 3; // 3-4

  return (
    <Link
      to={`/producto/${product?._id || product?.id || ""}`}
      className="group bg-white rounded-xl border border-gray-100 hover:border-blue-200 hover:shadow-lg transition-all duration-300 p-3 flex flex-col relative overflow-hidden"
    >
      {/* Badge */}
      {badge && (
        <span className="absolute top-2 right-2 z-10 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded">
          {badge}
        </span>
      )}

      {/* Imagen */}
      <div className="bg-gray-50 rounded-lg flex items-center justify-center h-32 md:h-36 mb-3 overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            className="max-h-full max-w-full object-contain group-hover:scale-110 transition-transform duration-500"
          />
        ) : (
          <span className="material-symbols-rounded text-4xl text-gray-300">
            inventory_2
          </span>
        )}
      </div>

      {/* Info */}
      <h4 className="text-sm font-medium text-gray-800 line-clamp-2 leading-snug mb-1.5 group-hover:text-blue-600 transition-colors">
        {name}
      </h4>

      {/* Estrellas */}
      <div className="flex items-center gap-0.5 mb-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`w-3.5 h-3.5 ${star <= rating ? "text-amber-400" : "text-gray-200"}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>

      {/* Precio */}
      <p className="text-base font-bold text-gray-900">
        ${price.toLocaleString("en-US", { minimumFractionDigits: 2 })}
      </p>
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
  const available = products || [];
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Llenar hasta 6 slots repitiendo si hay pocos
  const filled = available.length > 0
    ? Array.from({ length: 6 }, (_, i) => available[i % available.length])
    : [];

  const badges = [null, "NEW", null, null, "NEW", null];

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
  const featuredImage =
    featuredProduct?.images?.[0]?.url ||
    featuredProduct?.image ||
    null;

  return (
    <section className="mb-16">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
        {/* =========== BANNER IZQUIERDO =========== */}
        <div className="lg:col-span-4 flex flex-col">
          {/* Título con barra inferior azul */}
          <div className="pb-3 mb-0 border-b border-gray-200">
            <h2 className="text-base font-bold text-gray-900 border-b-[3px] border-blue-600 pb-3 inline-block -mb-[3px]">
              Oferta del Día
            </h2>
          </div>

          {/* Banner container */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-b-2xl lg:rounded-bl-2xl lg:rounded-br-none p-6 md:p-8 flex flex-col flex-1 border border-t-0 border-gray-100">
            {/* Badge */}
            <span className="inline-flex self-start items-center gap-1.5 bg-blue-600 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-md mb-5">
              <span className="material-symbols-rounded text-sm">local_offer</span>
              Equipos Premium
            </span>

            {/* Texto promocional */}
            <h3 className="text-2xl md:text-[28px] font-extrabold text-gray-900 leading-tight mb-2">
              15% OFF en
              <br />
              órdenes mayores
              <br />
              a $500
            </h3>

            <p className="text-sm text-gray-500 mb-6">
              Válido hasta agotar existencias
            </p>

            {/* Botón */}
            <Link
              to="/catalogo"
              className="inline-flex items-center self-start gap-2 bg-white text-gray-800 font-semibold text-sm px-6 py-2.5 rounded-full border-2 border-gray-200 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all duration-300 shadow-sm group mb-6"
            >
              Comprar Ahora
              <span className="material-symbols-rounded text-base group-hover:translate-x-1 transition-transform">
                arrow_forward
              </span>
            </Link>

            {/* Imagen del producto grande */}
            <div className="flex justify-center mt-auto pt-4">
              {featuredImage ? (
                <img
                  src={featuredImage}
                  alt={featuredProduct?.name || "Producto"}
                  className="max-h-48 md:max-h-56 object-contain drop-shadow-xl hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="w-48 h-48 bg-gray-200 rounded-xl flex items-center justify-center">
                  <span className="material-symbols-rounded text-6xl text-gray-300">dentistry</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* =========== GRID DERECHO =========== */}
        <div className="lg:col-span-8 flex flex-col">
          {/* Encabezado con flechas */}
          <div className="flex items-center justify-between pb-3 mb-0 border-b border-gray-200">
            <h2 className="text-base font-bold text-gray-900 border-b-[3px] border-blue-600 pb-3 inline-block -mb-[3px]">
              Ofertas Destacadas
            </h2>

            <div className="flex gap-1.5">
              <button
                onClick={() => scroll("left")}
                disabled={!canScrollLeft}
                className={`w-8 h-8 flex items-center justify-center rounded-full border transition-all duration-200 ${
                  canScrollLeft
                    ? "border-gray-300 text-gray-600 hover:bg-blue-600 hover:text-white hover:border-blue-600 active:scale-90"
                    : "border-gray-200 text-gray-300 cursor-not-allowed"
                }`}
              >
                <span className="material-symbols-rounded text-base">chevron_left</span>
              </button>
              <button
                onClick={() => scroll("right")}
                disabled={!canScrollRight}
                className={`w-8 h-8 flex items-center justify-center rounded-full border transition-all duration-200 ${
                  canScrollRight
                    ? "border-gray-300 text-gray-600 hover:bg-blue-600 hover:text-white hover:border-blue-600 active:scale-90"
                    : "border-gray-200 text-gray-300 cursor-not-allowed"
                }`}
              >
                <span className="material-symbols-rounded text-base">chevron_right</span>
              </button>
            </div>
          </div>

          {/* Grid 2 filas × 3 columnas, deslizable */}
          <div
            ref={scrollRef}
            className="overflow-x-auto scrollbar-hide border border-t-0 border-gray-100 rounded-b-2xl lg:rounded-br-2xl lg:rounded-bl-none p-4"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            <div className="grid grid-rows-2 grid-flow-col auto-cols-[minmax(180px,1fr)] gap-3 min-w-max">
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
