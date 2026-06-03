import { useState } from "react";
import PropTypes from "prop-types";

export default function TopProductsGlobal({ products = {}, loading = false }) {
  const [activeTab, setActiveTab] = useState("revenue");
  if (loading) {
    return (
      <div className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.97)", border: "1px solid rgba(107,30,150,0.06)" }}>
        <div className="h-4 w-44 bg-gray-200 rounded mb-4 animate-pulse" />
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-3 py-3 animate-pulse">
            <div className="w-6 h-4 bg-gray-100 rounded" />
            <div className="w-10 h-10 bg-gray-100 rounded-lg" />
            <div className="flex-1"><div className="h-3 w-32 bg-gray-100 rounded mb-1" /><div className="h-2 w-20 bg-gray-50 rounded" /></div>
            <div className="h-3 w-14 bg-gray-100 rounded" />
          </div>
        ))}
      </div>
    );
  }

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div className="rounded-2xl p-5 md:p-6" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.97) 0%, rgba(250,248,255,0.97) 100%)", border: "1px solid rgba(107,30,150,0.06)" }}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-amber-400">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 0 1-.982-3.172M9.497 14.25a7.454 7.454 0 0 0 .982-3.172M8.25 8.625c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125h-5.25a1.125 1.125 0 0 1-1.125-1.125v-1.5Z" />
          </svg>
          <h3 className="text-sm font-bold text-gray-800">Top Productos Global</h3>
        </div>

        {/* Tabs */}
        <div className="flex p-1 bg-gray-100/80 rounded-lg max-w-fit">
          <button
            onClick={() => setActiveTab("revenue")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all duration-200 ${
              activeTab === "revenue"
                ? "bg-white text-[#6b1e96] shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Mayor Ingreso
          </button>
          <button
            onClick={() => setActiveTab("units")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all duration-200 ${
              activeTab === "units"
                ? "bg-white text-[#6b1e96] shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Más Vendidos
          </button>
          <button
            onClick={() => setActiveTab("rating")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all duration-200 ${
              activeTab === "rating"
                ? "bg-white text-[#6b1e96] shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Mejor Valorados
          </button>
        </div>
      </div>

      {(() => {
        const displayList = Array.isArray(products) 
          ? products 
          : (products[activeTab === 'revenue' ? 'byRevenue' : activeTab === 'units' ? 'byUnits' : 'byRating'] || []);

        if (displayList.length === 0) {
          return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-sm text-gray-400">Sin datos para mostrar en esta pestaña</p>
            </div>
          );
        }

        return (
          <div className="space-y-1">
            {displayList.map((product, index) => {
              const imgUrl = product.image_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(product.name?.substring(0, 2) || "P")}&background=f3f4f6&color=6b7280&size=40`;
              return (
                <div key={product.id || index} className="flex items-center gap-3 px-2 py-2.5 rounded-lg transition-all hover:bg-amber-50/40">
                  {/* Rank */}
                  <div className="w-6 flex items-center justify-center flex-shrink-0">
                    {index < 3 ? (
                      <span className="text-base">{medals[index]}</span>
                    ) : (
                      <span className="text-xs font-bold text-gray-300">{index + 1}</span>
                    )}
                  </div>

                  {/* Image */}
                  <img src={imgUrl} alt={product.name} className="w-9 h-9 rounded-lg object-cover flex-shrink-0 border border-gray-100" />

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-800 truncate">{product.name}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] text-purple-500 font-medium truncate">{product.store_name}</span>
                      {product.rating > 0 && (
                        <span className="text-[9px] text-yellow-500">★ {product.rating.toFixed(1)}</span>
                      )}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="text-right flex-shrink-0">
                    {activeTab === "revenue" && (
                      <p className="text-xs font-bold text-gray-800">${product.revenue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    )}
                    {activeTab === "units" && (
                      <p className="text-xs font-bold text-[#6b1e96]">{product.units} <span className="text-[10px] text-gray-400 font-medium">uds</span></p>
                    )}
                    {activeTab === "rating" && (
                      <p className="text-xs font-bold text-amber-500 flex items-center justify-end gap-1">
                        {product.rating.toFixed(1)} ★
                      </p>
                    )}
                    {(activeTab === "revenue" || activeTab === "units") && (
                      <p className="text-[9px] text-gray-400">
                        {activeTab === "revenue" ? `${product.units} uds · ${product.orders} órd` : `${product.orders} órd`}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })()}
    </div>
  );
}

const ProductShape = PropTypes.shape({
  id: PropTypes.string, name: PropTypes.string, image_url: PropTypes.string,
  store_name: PropTypes.string, rating: PropTypes.number,
  revenue: PropTypes.number, units: PropTypes.number, orders: PropTypes.number,
});

TopProductsGlobal.propTypes = {
  products: PropTypes.oneOfType([
    PropTypes.arrayOf(ProductShape),
    PropTypes.shape({
      byRevenue: PropTypes.arrayOf(ProductShape),
      byUnits: PropTypes.arrayOf(ProductShape),
      byRating: PropTypes.arrayOf(ProductShape),
    })
  ]),
  loading: PropTypes.bool,
};
