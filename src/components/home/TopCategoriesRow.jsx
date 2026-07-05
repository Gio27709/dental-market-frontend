import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { getTrendingAPI } from "../../services/api";
import useHomeSections from "../../hooks/useHomeSections";
import useDragScroll from "../../hooks/useDragScroll";

export default function TopCategoriesRow() {
  const { sections } = useHomeSections();
  const data = sections?.top_categories || {};
  const heading = data.heading || "Categorías Destacadas y Tendencias";
  const subheading = data.subheading || "Explora las líneas de productos más solicitadas por clínicas dentales.";
  
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const categoriesScrollRef = useRef(null);
  const { handlers: dragHandlers } = useDragScroll({ externalRef: categoriesScrollRef });

  // Helper para asignar iconos dinámicos a las categorías
  const getCategoryIcon = (name) => {
    if (!name) return "category";
    const lowerName = name.toLowerCase();
    if (lowerName.includes("resina") || lowerName.includes("composite")) return "science";
    if (lowerName.includes("instrumental") || lowerName.includes("herramienta") || lowerName.includes("quirurgico")) return "handyman";
    if (lowerName.includes("anestesia")) return "vaccines";
    if (lowerName.includes("descartable")) return "medication";
    if (lowerName.includes("ortodoncia")) return "airline_seat_flat_angled";
    if (lowerName.includes("equipo") || lowerName.includes("mayor")) return "devices_other";
    if (lowerName.includes("biomaterial") || lowerName.includes("hueso")) return "biotech";
    return "category";
  };

  useEffect(() => {
    getTrendingAPI({ cat_limit: 7 })
      .then((res) => {
        const trending = res.data?.data?.trending_categories || [];
        setCategories(trending);
      })
      .catch(() => console.error("Error loading trending categories"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div>
            <div className="h-7 bg-gray-100 rounded w-80 animate-pulse" />
            <div className="h-4 bg-gray-100 rounded w-96 mt-2 animate-pulse" />
          </div>
        </div>
        <div className="flex gap-4 overflow-hidden pb-4">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className="flex-shrink-0 w-[140px] md:w-[160px] h-[120px] bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (categories.length === 0) return null;

  return (
    <div className="mb-8">
      <div className="flex flex-col mb-8 relative">
        <div className="absolute -left-6 sm:-left-10 top-1 w-1.5 h-[80%] bg-[#6b1e96] rounded-r-md hidden md:block"></div>
        <h2 className="text-3xl md:text-4xl font-extrabold text-[#163152] tracking-tight flex items-center gap-3">
          {heading}
          <span className="text-[#c3ff00] material-symbols-outlined text-3xl">hotel_class</span>
        </h2>
        <p className="mt-2 text-base text-slate-500 font-medium max-w-2xl">
          {subheading}
        </p>
      </div>

      {/* Fila de Categorías en Tendencia (máx 7, ordenadas por ventas) */}
      <div 
        ref={categoriesScrollRef}
        {...dragHandlers}
        className="grid grid-cols-2 sm:grid-cols-3 md:flex md:overflow-x-auto pb-4 gap-4 snap-x drag-scroll-container"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {categories.map((cat, idx) => {
          const isExtraForGrid = idx >= 6;
          return (
            <Link
              key={cat.id}
              to={`/store-catalog?category=${cat.id}`}
              className={`${isExtraForGrid ? 'hidden md:flex' : 'flex'} w-full md:w-[160px] flex-shrink-0 snap-start flex flex-col items-center justify-center p-4 sm:p-6 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-[0_15px_30px_-5px_rgba(107,30,150,0.15)] hover:-translate-y-1.5 transition-all duration-300 group relative overflow-hidden`}
            >
            {/* Subtle glow background on hover */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#6b1e96]/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

            <div className="relative z-10 w-12 h-12 sm:w-16 sm:h-16 mb-3 sm:mb-4 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-[#6b1e96]/5 transition-colors duration-300">
              <span className="material-symbols-outlined text-3xl sm:text-4xl text-slate-400 group-hover:text-[#6b1e96] transition-colors">
                {cat.icon || getCategoryIcon(cat.name)}
              </span>
            </div>
            
            <span className="relative z-10 text-xs sm:text-[14px] font-bold text-[#163152] group-hover:text-[#6b1e96] text-center leading-tight">
              {cat.name}
            </span>

            {/* Badge de ventas premium estilo Glassmorphism */}
            {cat.total_sold > 0 && (
              <div className="absolute top-3 right-3 z-20">
                <div className="flex items-center gap-1 bg-gradient-to-r from-orange-500 to-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-md transform group-hover:scale-105 transition-transform duration-300">
                  <span className="material-symbols-outlined text-[11px] leading-none">local_fire_department</span>
                  {cat.total_sold}
                </div>
              </div>
            )}
          </Link>
        );
      })}
      </div>
    </div>
  );
}
