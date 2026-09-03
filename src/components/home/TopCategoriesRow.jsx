import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getTrendingShared } from "../../services/sharedRequests";
import useHomeSections from "../../hooks/useHomeSections";

export default function TopCategoriesRow() {
  const { sections } = useHomeSections();
  const data = sections?.top_categories || {};
  const heading = data.heading || "Categorías Destacadas y Tendencias";
  const subheading = data.subheading || "Explora las líneas de productos más solicitadas por clínicas dentales.";

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

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
    getTrendingShared()
      .then((res) => {
        const trending = res.data?.data?.trending_categories || [];
        setCategories(trending);
      })
      .catch(() => console.error("Error loading trending categories"))
      .finally(() => setLoading(false));
  }, []);

  const Header = (
    <div className="flex flex-col mb-8 relative">
      <div className="absolute -left-6 sm:-left-10 top-1 w-1.5 h-[80%] bg-gradient-to-b from-[#6b1e96] to-[#c3ff00] rounded-r-md hidden md:block"></div>
      <div className="flex items-center gap-2.5 mb-2.5">
        <span className="w-7 h-[3px] rounded-full bg-gradient-to-r from-[#6b1e96] to-[#c3ff00]"></span>
        <span className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#6b1e96]">
          Lo más buscado
        </span>
      </div>
      <h2 className="text-3xl md:text-4xl font-extrabold text-[#163152] tracking-tight flex items-center gap-3">
        {heading}
        <span className="text-[#c3ff00] material-symbols-outlined text-3xl">hotel_class</span>
      </h2>
      <p className="mt-2 text-base text-slate-500 font-medium max-w-2xl">{subheading}</p>
    </div>
  );

  if (loading) {
    return (
      <div className="mb-8">
        <div className="flex flex-col mb-8">
          <div className="h-3 bg-gray-100 rounded w-28 animate-pulse" />
          <div className="h-9 bg-gray-100 rounded w-80 mt-3 animate-pulse" />
          <div className="h-4 bg-gray-100 rounded w-96 mt-3 animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-[92px] bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (categories.length === 0) return null;

  return (
    <div className="mb-8">
      {Header}

      {/* Categorías en tendencia (máx 7, ordenadas por ventas) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((cat, idx) => {
          const isExtraForMobile = idx >= 4;
          return (
            <Link
              key={cat.id}
              to={`/store-catalog?category=${cat.id}`}
              className={`${isExtraForMobile ? "hidden sm:flex" : "flex"} items-center gap-4 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:border-[#6b1e96]/30 hover:shadow-[0_15px_30px_-10px_rgba(107,30,150,0.25)] hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden`}
            >
              {/* Halo sutil al pasar el mouse */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#6b1e96]/[0.04] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>

              {/* Icono */}
              <div className="relative z-10 flex-shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br from-[#6b1e96]/10 to-[#c3ff00]/15 flex items-center justify-center group-hover:from-[#6b1e96]/20 group-hover:to-[#c3ff00]/25 transition-colors duration-300">
                <span className="material-symbols-outlined text-[28px] text-[#6b1e96]">
                  {cat.icon || getCategoryIcon(cat.name)}
                </span>
              </div>

              {/* Nombre + ventas */}
              <div className="relative z-10 min-w-0 flex-1">
                <p className="text-[15px] font-bold text-[#163152] leading-tight group-hover:text-[#6b1e96] transition-colors line-clamp-2">
                  {cat.name}
                </p>
                {cat.total_sold > 0 && (
                  <span className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-bold text-orange-600">
                    <span className="material-symbols-outlined text-[13px] leading-none">local_fire_department</span>
                    {cat.total_sold} {cat.total_sold === 1 ? "vendido" : "vendidos"}
                  </span>
                )}
              </div>

              {/* Flecha */}
              <span className="relative z-10 material-symbols-outlined text-xl text-slate-300 group-hover:text-[#6b1e96] group-hover:translate-x-0.5 transition-all duration-300 flex-shrink-0">
                arrow_forward
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
