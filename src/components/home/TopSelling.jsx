import PropTypes from "prop-types";
import { useState, useRef, useEffect } from "react";
import ProductCard from "../ProductCard";
import useHomeSections from "../../hooks/useHomeSections";
import useDragScroll from "../../hooks/useDragScroll";
import { getCategoriesShared } from "../../services/sharedRequests";

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
  const [categories, setCategories] = useState([]);

  // Fetch categories on mount
  useEffect(() => {
    getCategoriesShared()
      .then((res) => {
        if (res.data?.success) {
          setCategories(res.data.data || []);
        }
      })
      .catch((err) => {
        console.error("Error loading categories for TopSelling:", err);
      });
  }, []);

  // Helper to slugify category names for robust matching
  const generateSlug = (name) => {
    if (!name) return "";
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  // Filter logic: real database queries based on product category_id and subcategories
  const getFilteredProducts = () => {
    if (!available.length) return [];
    if (activeTab === "all") return available;

    // Map tab id to category slug
    const tabToSlugMap = {
      instruments: "instrumental",
      biomaterials: "biomateriales",
      orthodontics: "ortodoncia",
      equipment: "equipos",
    };
    const targetSlug = tabToSlugMap[activeTab];
    if (!targetSlug) return [];

    // Find the category matching the slug or name (case-insensitive)
    const categoryObj = categories.find(
      (c) =>
        c.slug === targetSlug ||
        c.name.toLowerCase().includes(targetSlug) ||
        generateSlug(c.name) === targetSlug
    );
    if (!categoryObj) return [];

    // Generate list of target category IDs (parent category + children subcategories)
    const childIds = (categoryObj.children || []).map((child) => child.id);
    const targetIds = [categoryObj.id, ...childIds];

    // Filter available products
    return available.filter((p) => targetIds.includes(p.category_id));
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

      {displayProducts.length === 0 ? (
        <div className="py-12 text-center w-full bg-slate-50 rounded-2xl border border-slate-100">
          <span className="material-symbols-outlined text-slate-300 text-4xl mb-2">inventory_2</span>
          <p className="text-slate-400 text-sm font-semibold">No hay productos en esta categoría</p>
        </div>
      ) : (
        <div className="relative group/slider">
          {/* Flecha Izquierda Flotante */}
          {displayProducts.length >= 5 && (
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
          )}

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
          {displayProducts.length >= 5 && (
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
          )}
        </div>
      )}
    </section>
  );
}

TopSelling.propTypes = {
  products: PropTypes.array,
};
