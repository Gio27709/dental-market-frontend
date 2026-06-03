import { useState } from "react";
import PropTypes from "prop-types";

const POSITION_STYLES = [
  { bg: "linear-gradient(135deg, #c3ff00 0%, #a8e600 100%)", color: "#1a0a2e", shadow: "0 2px 8px rgba(195,255,0,0.3)" },
  { bg: "linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)", color: "#334155", shadow: "none" },
  { bg: "linear-gradient(135deg, #fbbf24 0%, #d97706 100%)", color: "#451a03", shadow: "none" },
  { bg: "rgba(107,30,150,0.08)", color: "#6b1e96", shadow: "none" },
  { bg: "rgba(107,30,150,0.05)", color: "#6b1e96", shadow: "none" },
];

export default function TopProducts({ products = {}, loading = false }) {
  const [activeTab, setActiveTab] = useState("revenue");
  if (loading) {
    return (
      <div
        className="rounded-2xl p-5 animate-pulse"
        style={{ background: "rgba(107,30,150,0.04)", border: "1px solid rgba(107,30,150,0.06)" }}
      >
        <div className="h-4 w-36 bg-gray-200 rounded mb-4" />
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-3 py-3">
            <div className="w-7 h-7 rounded-lg bg-gray-200" />
            <div className="w-10 h-10 rounded-lg bg-gray-200" />
            <div className="flex-1">
              <div className="h-3 w-32 bg-gray-200 rounded mb-1.5" />
              <div className="h-2.5 w-20 bg-gray-100 rounded" />
            </div>
            <div className="h-4 w-16 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl p-5 md:p-6"
      style={{
        background: "linear-gradient(135deg, rgba(255,255,255,0.97) 0%, rgba(250,248,255,0.97) 100%)",
        border: "1px solid rgba(107,30,150,0.06)",
      }}
    >
      {/* Header with Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-amber-500">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 0 1-.982-3.172M9.497 14.25a7.454 7.454 0 0 0 .982-3.172M8.25 8.25a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0Z" />
          </svg>
          <h3 className="text-sm font-bold text-gray-800">Top Productos</h3>
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

      {/* Products List */}
      {(() => {
        const displayList = Array.isArray(products) 
          ? products 
          : (products[activeTab === 'revenue' ? 'byRevenue' : activeTab === 'units' ? 'byUnits' : 'byRating'] || []);

        if (displayList.length === 0) {
          return (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-10 h-10 text-gray-200 mb-2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H2.25c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
              </svg>
              <p className="text-sm font-medium text-gray-400">Sin datos para mostrar</p>
              <p className="text-xs text-gray-300 mt-1">Intenta con otro periodo u otra pestaña</p>
            </div>
          );
        }

        return (
          <div className="space-y-1">
            {displayList.map((product, index) => {
            const style = POSITION_STYLES[index] || POSITION_STYLES[4];
            return (
              <div
                key={product.id}
                className="flex items-center gap-3 py-2.5 px-2 rounded-xl transition-all duration-200 hover:bg-gray-50/80 group"
              >
                {/* Position Badge */}
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-extrabold"
                  style={{ background: style.bg, color: style.color, boxShadow: style.shadow }}
                >
                  {index + 1}
                </div>

                {/* Product Image */}
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-10 h-10 rounded-lg object-cover flex-shrink-0 border border-gray-100"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-5 h-5 text-gray-300">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5a1.5 1.5 0 0 0 1.5-1.5V5.25a1.5 1.5 0 0 0-1.5-1.5H3.75a1.5 1.5 0 0 0-1.5 1.5v14.25c0 .828.672 1.5 1.5 1.5Z" />
                    </svg>
                  </div>
                )}

                {/* Product Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate group-hover:text-gray-900">
                    {product.name}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-gray-400">{product.units} uds</span>
                    <span className="text-[10px] text-gray-300">•</span>
                    <span className="text-[10px] text-gray-400">{product.orders} órdenes</span>
                    {product.rating > 0 && (
                      <>
                        <span className="text-[10px] text-gray-300">•</span>
                        <span className="text-[10px] text-amber-500">★ {product.rating}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Right Stat */}
                <div className="text-right flex-shrink-0">
                  {activeTab === "revenue" && (
                    <p className="text-sm font-bold text-gray-800">
                      ${product.revenue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  )}
                  {activeTab === "units" && (
                    <p className="text-sm font-bold text-[#6b1e96]">
                      {product.units} <span className="text-xs font-medium text-gray-400">uds</span>
                    </p>
                  )}
                  {activeTab === "rating" && (
                    <p className="text-sm font-bold text-amber-500 flex items-center justify-end gap-1">
                      {product.rating.toFixed(1)}
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                        <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z" clipRule="evenodd" />
                      </svg>
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
  id: PropTypes.string,
  name: PropTypes.string,
  image_url: PropTypes.string,
  revenue: PropTypes.number,
  units: PropTypes.number,
  orders: PropTypes.number,
  rating: PropTypes.number,
});

TopProducts.propTypes = {
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
