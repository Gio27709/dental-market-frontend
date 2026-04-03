import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getCategoriesAPI } from "../../services/api";

export default function TopCategoriesRow() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCategoriesAPI()
      .then((res) => {
        // Solo categorías raíz (el backend ya las retorna como árbol, las raíces son el nivel top)
        const roots = (res.data.data || []).slice(0, 8);
        setCategories(roots);
      })
      .catch(() => console.error("Error loading categories"))
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
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="flex-shrink-0 w-[140px] md:w-[160px] h-[120px] bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (categories.length === 0) return null;

  return (
    <div className="mb-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Categorías Destacadas y Tendencias
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Explora las líneas de productos más solicitadas por clínicas dentales.
          </p>
        </div>
      </div>

      {/* Fila de Categorías con Íconos */}
      <div 
        className="flex gap-4 overflow-x-auto pb-4 snap-x"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {categories.map((cat) => (
          <Link
            key={cat.id}
            to={`/store-catalog?category=${cat.id}`}
            className="flex-shrink-0 snap-start w-[140px] md:w-[160px] flex flex-col items-center justify-center p-6 bg-white rounded-2xl border border-gray-200 shadow-sm hover:border-primary-500 hover:shadow-md transition-all group"
          >
            <span className="material-symbols-outlined text-5xl text-gray-400 group-hover:text-primary-600 transition-colors mb-3">
              {cat.icon || "category"}
            </span>
            <span className="text-sm font-semibold text-gray-700 group-hover:text-primary-700 text-center">
              {cat.name}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
