import PropTypes from "prop-types";
import { Link } from "react-router-dom";

export default function InventoryWidget({ inventory = {}, loading = false }) {
  if (loading) {
    return (
      <div className="rounded-2xl p-5 animate-pulse" style={{ background: "rgba(107,30,150,0.04)", border: "1px solid rgba(107,30,150,0.06)" }}>
        <div className="h-4 w-28 bg-gray-200 rounded mb-4" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-6 bg-gray-100 rounded" />
          ))}
        </div>
      </div>
    );
  }

  const {
    totalProducts = 0,
    activeProducts = 0,
    inactiveProducts = 0,
    totalStock = 0,
    lowStockCount = 0,
    lowStockProducts = [],
    outOfStockCount = 0,
    outOfStockProducts = [],
  } = inventory;

  const hasAlerts = lowStockCount > 0 || outOfStockCount > 0;

  return (
    <div
      className="rounded-2xl p-5"
      style={{
        background: "linear-gradient(135deg, rgba(255,255,255,0.97) 0%, rgba(250,248,255,0.97) 100%)",
        border: `1px solid ${hasAlerts ? "rgba(245,158,11,0.15)" : "rgba(107,30,150,0.06)"}`,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-amber-500">
            <path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
          </svg>
          <h3 className="text-sm font-bold text-gray-700">Inventario</h3>
        </div>
        <Link to="/store/products" className="text-[10px] font-semibold text-purple-500 hover:text-purple-700 transition-colors">
          Ver todo →
        </Link>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="px-3 py-2 rounded-xl" style={{ background: "rgba(107,30,150,0.04)" }}>
          <p className="text-[10px] text-gray-400 font-medium">Total</p>
          <p className="text-lg font-bold text-gray-800">{totalProducts}</p>
        </div>
        <div className="px-3 py-2 rounded-xl" style={{ background: "rgba(16,185,129,0.06)" }}>
          <p className="text-[10px] text-gray-400 font-medium">Activos</p>
          <p className="text-lg font-bold text-emerald-600">{activeProducts}</p>
        </div>
        <div className="px-3 py-2 rounded-xl" style={{ background: "rgba(148,163,184,0.08)" }}>
          <p className="text-[10px] text-gray-400 font-medium">Inactivos</p>
          <p className="text-lg font-bold text-gray-500">{inactiveProducts}</p>
        </div>
        <div className="px-3 py-2 rounded-xl" style={{ background: "rgba(59,130,246,0.06)" }}>
          <p className="text-[10px] text-gray-400 font-medium">Stock Total</p>
          <p className="text-lg font-bold text-blue-600">{totalStock}</p>
        </div>
      </div>

      {/* Alerts */}
      {hasAlerts && (
        <div className="space-y-2 pt-2 border-t border-gray-100">
          {outOfStockCount > 0 && (
            <div className="flex items-start gap-2 px-2.5 py-2 rounded-lg" style={{ background: "rgba(239,68,68,0.05)" }}>
              <span className="text-xs mt-0.5">🔴</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-red-600">{outOfStockCount} sin stock</p>
                {outOfStockProducts.slice(0, 2).map((p) => (
                  <p key={p.id} className="text-[10px] text-red-400 truncate">{p.name}</p>
                ))}
              </div>
            </div>
          )}
          {lowStockCount > 0 && (
            <div className="flex items-start gap-2 px-2.5 py-2 rounded-lg" style={{ background: "rgba(245,158,11,0.05)" }}>
              <span className="text-xs mt-0.5">⚠️</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-amber-600">{lowStockCount} stock bajo (≤5)</p>
                {lowStockProducts.slice(0, 2).map((p) => (
                  <p key={p.id} className="text-[10px] text-amber-500 truncate">{p.name} ({p.stock} uds)</p>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

InventoryWidget.propTypes = {
  inventory: PropTypes.shape({
    totalProducts: PropTypes.number,
    activeProducts: PropTypes.number,
    inactiveProducts: PropTypes.number,
    totalStock: PropTypes.number,
    lowStockCount: PropTypes.number,
    lowStockProducts: PropTypes.array,
    outOfStockCount: PropTypes.number,
    outOfStockProducts: PropTypes.array,
  }),
  loading: PropTypes.bool,
};
