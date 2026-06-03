import PropTypes from "prop-types";

const STATUS_CONFIG = {
  pending: { label: "Pendiente", color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
  processing: { label: "Procesando", color: "#6b1e96", bg: "rgba(107,30,150,0.08)" },
  shipped: { label: "Enviado", color: "#3b82f6", bg: "rgba(59,130,246,0.1)" },
  delivered: { label: "Entregado", color: "#10b981", bg: "rgba(16,185,129,0.1)" },
  cancelled: { label: "Cancelado", color: "#ef4444", bg: "rgba(239,68,68,0.08)" },
};

export default function OrderStatusWidget({ statusCounts = {}, loading = false }) {
  if (loading) {
    return (
      <div className="rounded-2xl p-5 animate-pulse" style={{ background: "rgba(107,30,150,0.04)", border: "1px solid rgba(107,30,150,0.06)" }}>
        <div className="h-4 w-32 bg-gray-200 rounded mb-4" />
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-3 py-2">
            <div className="w-3 h-3 rounded-full bg-gray-200" />
            <div className="h-3 w-20 bg-gray-200 rounded" />
            <div className="flex-1" />
            <div className="h-4 w-8 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
    );
  }

  const total = Object.values(statusCounts).reduce((sum, v) => sum + v, 0);

  return (
    <div
      className="rounded-2xl p-5"
      style={{
        background: "linear-gradient(135deg, rgba(255,255,255,0.97) 0%, rgba(250,248,255,0.97) 100%)",
        border: "1px solid rgba(107,30,150,0.06)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-blue-400">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 0 1 0 3.75H5.625a1.875 1.875 0 0 1 0-3.75Z" />
          </svg>
          <h3 className="text-sm font-bold text-gray-700">Pedidos por Estado</h3>
        </div>
        <span className="text-xs font-bold text-gray-400">{total} total</span>
      </div>

      {/* Stacked bar */}
      {total > 0 && (
        <div className="flex h-2.5 rounded-full overflow-hidden mb-4 gap-0.5">
          {Object.entries(STATUS_CONFIG).map(([key, config]) => {
            const count = statusCounts[key] || 0;
            if (count === 0) return null;
            const pct = (count / total) * 100;
            return (
              <div
                key={key}
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${pct}%`, background: config.color, minWidth: "4px" }}
                title={`${config.label}: ${count}`}
              />
            );
          })}
        </div>
      )}

      {/* Status rows */}
      <div className="space-y-1.5">
        {Object.entries(STATUS_CONFIG).map(([key, config]) => {
          const count = statusCounts[key] || 0;
          const pct = total > 0 ? ((count / total) * 100).toFixed(0) : 0;
          return (
            <div key={key} className="flex items-center gap-3 py-1.5 px-2 rounded-lg hover:bg-gray-50/50 transition-colors">
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: config.color }} />
              <span className="text-xs font-medium text-gray-600 flex-1">{config.label}</span>
              <span
                className="text-xs font-bold px-2 py-0.5 rounded-md"
                style={{ background: config.bg, color: config.color }}
              >
                {count}
              </span>
              <span className="text-[10px] text-gray-400 w-8 text-right">{pct}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

OrderStatusWidget.propTypes = {
  statusCounts: PropTypes.shape({
    pending: PropTypes.number,
    processing: PropTypes.number,
    shipped: PropTypes.number,
    delivered: PropTypes.number,
    cancelled: PropTypes.number,
  }),
  loading: PropTypes.bool,
};
