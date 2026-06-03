import PropTypes from "prop-types";

const STATUS_CONFIG = {
  pending: { label: "Pendiente", color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
  processing: { label: "Procesando", color: "#3b82f6", bg: "rgba(59,130,246,0.1)" },
  shipped: { label: "Enviado", color: "#8b5cf6", bg: "rgba(139,92,246,0.1)" },
  delivered: { label: "Entregado", color: "#10b981", bg: "rgba(16,185,129,0.1)" },
  cancelled: { label: "Cancelado", color: "#ef4444", bg: "rgba(239,68,68,0.1)" },
};

export default function OrderStatusGlobal({ statusCounts = {}, loading = false }) {
  if (loading) {
    return (
      <div className="rounded-2xl p-5 animate-pulse" style={{ background: "rgba(255,255,255,0.97)", border: "1px solid rgba(107,30,150,0.06)" }}>
        <div className="h-4 w-40 bg-gray-200 rounded mb-4" />
        <div className="h-4 bg-gray-100 rounded-full mb-4" />
        <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-5 bg-gray-50 rounded" />)}</div>
      </div>
    );
  }

  const entries = Object.entries(statusCounts).filter(([, c]) => c > 0);
  const total = entries.reduce((sum, [, c]) => sum + c, 0);

  return (
    <div className="rounded-2xl p-5 md:p-6" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.97) 0%, rgba(250,248,255,0.97) 100%)", border: "1px solid rgba(107,30,150,0.06)" }}>
      <div className="flex items-center gap-2 mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-emerald-400">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25Z" />
        </svg>
        <h3 className="text-sm font-bold text-gray-700">Estados de Órdenes</h3>
        {total > 0 && <span className="text-[10px] text-gray-400 ml-auto">{total} items</span>}
      </div>

      {total === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">Sin órdenes en este periodo</p>
      ) : (
        <>
          {/* Stacked bar */}
          <div className="flex h-3 rounded-full overflow-hidden mb-4 bg-gray-100">
            {entries.map(([status, count]) => {
              const cfg = STATUS_CONFIG[status] || { color: "#94a3b8" };
              const pct = (count / total) * 100;
              return <div key={status} title={`${cfg.label || status}: ${count}`} className="transition-all duration-500" style={{ width: `${pct}%`, background: cfg.color }} />;
            })}
          </div>
          {/* Legend */}
          <div className="space-y-2">
            {entries.map(([status, count]) => {
              const cfg = STATUS_CONFIG[status] || { label: status, color: "#94a3b8", bg: "rgba(148,163,184,0.1)" };
              const pct = Math.round((count / total) * 1000) / 10;
              return (
                <div key={status} className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: cfg.color }} />
                    <span className="text-xs text-gray-600">{cfg.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-md" style={{ background: cfg.bg, color: cfg.color }}>{count}</span>
                    <span className="text-[10px] text-gray-400 w-10 text-right">{pct}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

OrderStatusGlobal.propTypes = {
  statusCounts: PropTypes.object,
  loading: PropTypes.bool,
};
