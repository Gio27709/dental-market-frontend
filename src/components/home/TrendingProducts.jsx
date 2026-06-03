import ProductCard from "../ProductCard";
import { useState, useRef, useEffect, useCallback } from "react";
import { getTrendingAPI } from "../../services/api";
import useHomeSections from "../../hooks/useHomeSections";
import { useLocationContext } from "../../hooks/useLocationContext";

export default function TrendingProducts() {
  const { sections } = useHomeSections();
  const data = sections?.trending_products || {};
  const heading = data.heading || "Productos en Tendencia";
  const { buyerState } = useLocationContext();

  const scrollRef = useRef(null);
  const [trendingProducts, setTrendingProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Fetch trending products with geo-boost (Phase 3)
  useEffect(() => {
    getTrendingAPI({ prod_limit: 8, buyer_state: buyerState || "" })
      .then((res) => {
        const products = res.data?.data?.trending_products || [];
        setTrendingProducts(products);
      })
      .catch(() => console.error("Error loading trending products"))
      .finally(() => setLoading(false));
  }, [buyerState]);


  const handleScroll = useCallback(() => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 5);
    }
  }, []);

  useEffect(() => {
    handleScroll();
    window.addEventListener("resize", handleScroll);
    return () => window.removeEventListener("resize", handleScroll);
  }, [trendingProducts.length, handleScroll]);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = direction === "left" ? -300 : 300;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  if (loading) {
    return (
      <div className="relative mb-16">
        <div className="mb-6">
          <div className="h-7 bg-gray-100 rounded w-64 animate-pulse" />
        </div>
        <div className="flex gap-6 overflow-hidden pb-6 px-1 pt-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex-shrink-0 w-[280px] sm:w-[320px] h-[380px] bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (trendingProducts.length === 0) return null;

  return (
    <div className="relative group mb-16">
      {/* Título Dinámico Premium */}
      <div className="flex flex-col mb-8 relative">
        <div className="absolute -left-6 sm:-left-10 top-1 w-1.5 h-[80%] bg-[#c3ff00] rounded-r-md hidden md:block"></div>
        <h2 className="text-3xl md:text-4xl font-extrabold text-[#163152] tracking-tight flex items-center gap-3">
          {heading}
          <span className="text-orange-500 material-symbols-outlined text-3xl animate-pulse">local_fire_department</span>
        </h2>
        <p className="mt-2 text-base text-slate-500 font-medium max-w-2xl">
          Basado en ventas y valoraciones reales de nuestros clientes
        </p>
      </div>

      {/* Botón Scroll Izquierdo Premium */}
      {canScrollLeft && (
        <button
          onClick={() => scroll("left")}
          className="absolute -left-5 top-[calc(50%+15px)] -translate-y-1/2 z-20 w-14 h-14 bg-white/80 backdrop-blur-md rounded-full shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-white/50 flex items-center justify-center text-slate-700 hover:bg-[#6b1e96] hover:text-white hover:border-[#6b1e96] hover:scale-110 transition-all duration-300 focus:outline-none hidden md:flex group"
          aria-label="Anterior"
        >
          <span className="material-symbols-outlined text-3xl group-hover:-translate-x-0.5 transition-transform">chevron_left</span>
        </button>
      )}

      {/* Contenedor de Productos */}
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex gap-6 overflow-x-auto snap-x snap-mandatory pb-10 px-4 pt-4 -mx-4"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {trendingProducts.map((product) => (
          <div key={product.id} className="snap-start flex-shrink-0 w-[280px] sm:w-[320px] lg:w-[calc(25%-18px)]">
            <ProductCard product={product} />
          </div>
        ))}
      </div>

      {/* Botón Scroll Derecho Premium */}
      {canScrollRight && trendingProducts.length >= 4 && (
        <button
          onClick={() => scroll("right")}
          className="absolute -right-5 top-[calc(50%+15px)] -translate-y-1/2 z-20 w-14 h-14 bg-white/80 backdrop-blur-md rounded-full shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-white/50 flex items-center justify-center text-slate-700 hover:bg-[#6b1e96] hover:text-white hover:border-[#6b1e96] hover:scale-110 transition-all duration-300 focus:outline-none hidden md:flex group"
          aria-label="Siguiente"
        >
          <span className="material-symbols-outlined text-3xl group-hover:translate-x-0.5 transition-transform">chevron_right</span>
        </button>
      )}
      
      {/* Estilo global para ocultar scrollbar webkit (Chrome/Safari) */}
      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
