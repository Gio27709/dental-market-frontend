import PropTypes from "prop-types";
import { useState, useRef, useEffect } from "react";
import ProductCard from "../ProductCard";
import useHomeSections from "../../hooks/useHomeSections";
import useDragScroll from "../../hooks/useDragScroll";

const DEFAULT_TABS = [
  { id: "all", label: "Todos" },
  { id: "instruments", label: "Instrumental" },
  { id: "biomaterials", label: "Biomateriales" },
  { id: "orthodontics", label: "Ortodoncia" },
  { id: "equipment", label: "Equipos" },
];

export default function TopSelling({ products }) {
  const { sections } = useHomeSections();
  const data = sections?.top_selling || {};

  // Título y tabs dinámicos con fallback
  const heading = data.heading || "Lo Más Vendido";
  const tabs = data.tabs || DEFAULT_TABS;

  const available = products || [];
  const scrollRef = useRef(null);
  const { handlers: dragHandlers } = useDragScroll({ externalRef: scrollRef });

  const [activeTab, setActiveTab] = useState("all");
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Filter logic (simulated for now by shuffling/slicing since we only have mock DB)
  const getFilteredProducts = () => {
    if (!available.length) return [];
    if (activeTab === "all") return available;
    
    // Simulate filtering by picking a subset based on lengths to make it look realistic
    const subsetLen = Math.max(5, Math.floor(available.length * 0.7));
    // Simple deterministic shuffle based on tab string length so tabs look different
    const shift = activeTab.length;
    return [...available].sort((a, b) => 
      ((a.name?.length || 0) + shift) % 2 - ((b.name?.length || 0) + shift) % 2
    ).slice(0, subsetLen);
  };

  const filteredProducts = getFilteredProducts();

  // If there are less than 5 products, duplicate them to show the slider working
  const displayProducts = filteredProducts.length >= 5 
    ? filteredProducts 
    : Array.from({ length: 8 }, (_, i) => filteredProducts[i % filteredProducts.length]).filter(Boolean);

  const updateScrollButtons = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 5);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 5);
  };

  useEffect(() => {
    // Reset scroll when tab changes
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = 0;
    }
    updateScrollButtons();
  }, [activeTab]);

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
    // Scroll exact width of one card + gap (e.g. 240px + 16px) or just clientWidth
    const amount = el.clientWidth * 0.75;
    el.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  };

  if (available.length === 0) return null;

  return (
    <section className="mb-16 relative">
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-gray-200 mb-6 gap-4">
        {/* Título */}
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 pb-0 border-b-[3px] border-purple-600 inline-block -mb-[2px] pr-4">
          {heading}
        </h2>

        {/* Pestañas / Tabs */}
        <div className="flex overflow-x-auto scrollbar-hide gap-1 sm:gap-4 -mb-[1px]">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap pb-3 px-2 text-sm md:text-base font-medium transition-colors relative ${
                activeTab === tab.id
                  ? "text-purple-600"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <span className="absolute bottom-0 left-0 w-full h-[3px] bg-purple-600 rounded-t-sm" />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="relative group/slider">
        {/* Flecha Izquierda Flotante */}
        <button
          onClick={() => scroll("left")}
          disabled={!canScrollLeft}
          className={`absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-20 w-11 h-11 flex items-center justify-center rounded-full bg-white shadow-[0_4px_12px_rgba(0,0,0,0.1)] border border-gray-100 transition-all duration-300 ${
            canScrollLeft
              ? "text-gray-600 hover:text-purple-600 hover:scale-110 active:scale-95"
              : "opacity-0 pointer-events-none"
          }`}
        >
          <span className="material-symbols-outlined text-xl">chevron_left</span>
        </button>

        {/* Contenedor del Carrusel (5 items por vista) */}
        <div
          ref={scrollRef}
          {...dragHandlers}
          className="flex overflow-x-auto gap-4 scrollbar-hide snap-x snap-mandatory pt-2 pb-6 px-1 md:px-0 drag-scroll-container"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {displayProducts.map((product, index) => (
            <div
              key={`top-selling-${product?._id || index}-${index}`}
              className="snap-start flex-none w-[200px] sm:w-[240px] md:w-[calc(25%-12px)] lg:w-[calc(20%-13px)] flex flex-col"
            >
              <ProductCard product={product} />
            </div>
          ))}
        </div>

        {/* Flecha Derecha Flotante */}
        <button
          onClick={() => scroll("right")}
          disabled={!canScrollRight}
          className={`absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-20 w-11 h-11 flex items-center justify-center rounded-full bg-white shadow-[0_4px_12px_rgba(0,0,0,0.1)] border border-gray-100 transition-all duration-300 ${
            canScrollRight
              ? "text-gray-600 hover:text-purple-600 hover:scale-110 active:scale-95 opacity-100"
              : "opacity-0 pointer-events-none"
          }`}
        >
          <span className="material-symbols-outlined text-xl">chevron_right</span>
        </button>
      </div>
    </section>
  );
}

TopSelling.propTypes = {
  products: PropTypes.array,
};
