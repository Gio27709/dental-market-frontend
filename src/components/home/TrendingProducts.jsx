import PropTypes from "prop-types";
import ProductCard from "../ProductCard";
import { useState, useRef, useEffect } from "react";

export default function TrendingProducts({ products }) {
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Consideramos los primeros 6 productos para este carrusel
  const trendingProducts = products?.slice(0, 6) || [];

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 5);
    }
  };

  useEffect(() => {
    handleScroll();
    window.addEventListener("resize", handleScroll);
    return () => window.removeEventListener("resize", handleScroll);
  }, [trendingProducts.length]);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = direction === "left" ? -300 : 300;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  if (trendingProducts.length === 0) return null;

  return (
    <div className="relative group mb-16">
      {/* Botón Scroll Izquierdo */}
      {canScrollLeft && (
        <button
          onClick={() => scroll("left")}
          className="absolute -left-4 top-[calc(50%-10px)] -translate-y-1/2 z-10 w-12 h-12 bg-white rounded-full shadow-lg border border-gray-100 flex items-center justify-center text-gray-600 hover:text-primary-600 hover:scale-105 transition-all focus:outline-none hidden md:flex"
          aria-label="Anterior"
        >
          <span className="material-symbols-outlined">chevron_left</span>
        </button>
      )}

      {/* Contenedor de Productos */}
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex gap-6 overflow-x-auto snap-x snap-mandatory pb-6 px-1 pt-2"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {trendingProducts.map((product) => (
          <div key={product.id} className="snap-start flex-shrink-0 w-[280px] sm:w-[320px] lg:w-[calc(25%-18px)]">
            <ProductCard product={product} />
          </div>
        ))}
      </div>

      {/* Botón Scroll Derecho */}
      {canScrollRight && trendingProducts.length >= 4 && (
        <button
          onClick={() => scroll("right")}
          className="absolute -right-4 top-[calc(50%-10px)] -translate-y-1/2 z-10 w-12 h-12 bg-white rounded-full shadow-lg border border-gray-100 flex items-center justify-center text-gray-600 hover:text-primary-600 hover:scale-105 transition-all focus:outline-none hidden md:flex"
          aria-label="Siguiente"
        >
          <span className="material-symbols-outlined">chevron_right</span>
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

TrendingProducts.propTypes = {
  products: PropTypes.array,
};
