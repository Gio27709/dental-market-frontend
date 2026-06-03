import { Link } from "react-router-dom";
import PropTypes from "prop-types";

const STATUS_BADGE = {
  pending: { label: "Pendiente", bg: "rgba(245,158,11,0.1)", color: "#d97706" },
  processing: { label: "Procesando", bg: "rgba(59,130,246,0.1)", color: "#2563eb" },
  shipped: { label: "Enviado", bg: "rgba(139,92,246,0.1)", color: "#7c3aed" },
  delivered: { label: "Entregado", bg: "rgba(16,185,129,0.1)", color: "#059669" },
  cancelled: { label: "Cancelado", bg: "rgba(239,68,68,0.1)", color: "#dc2626" },
};

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "ahora";
  if (mins < 60) return `hace ${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `hace ${days}d`;
}

export default function RecentOrdersGlobal({ orders = [], loading = false }) {
  if (loading) {
    return (
      <div className="rounded-2xl p-5 animate-pulse" style={{ background: "rgba(255,255,255,0.97)", border: "1px solid rgba(107,30,150,0.06)" }}>
        <div className="h-4 w-44 bg-gray-200 rounded mb-4" />
        {[1,2,3,4,5].map(i => (
          <div key={i} className="flex items-center gap-3 py-3">
            <div className="w-8 h-8 bg-gray-100 rounded-lg" />
            <div className="flex-1"><div className="h-3 w-32 bg-gray-100 rounded mb-1" /><div className="h-2 w-20 bg-gray-50 rounded" /></div>
            <div className="h-3 w-14 bg-gray-100 rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="rounded-2xl p-5 md:p-6" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.97) 0%, rgba(250,248,255,0.97) 100%)", border: "1px solid rgba(107,30,150,0.06)" }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-gray-400">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
          <h3 className="text-sm font-bold text-gray-700">Últimas Órdenes</h3>
        </div>
        <Link to="/admin/orders" className="text-[10px] font-semibold text-purple-500 hover:text-purple-700">Ver todas →</Link>
      </div>

      {orders.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">Sin órdenes recientes</p>
      ) : (
        <div className="space-y-1">
          {orders.map((order) => {
            const badge = STATUS_BADGE[order.status] || STATUS_BADGE.pending;
            const imgUrl = order.product_image || `https://ui-avatars.com/api/?name=${encodeURIComponent(order.product_name?.substring(0,2) || "P")}&background=f3f4f6&color=6b7280&size=32`;
            return (
              <div key={order.id} className="flex items-center gap-3 px-2 py-2.5 rounded-lg hover:bg-gray-50/80 transition-colors">
                <img src={imgUrl} alt="" className="w-8 h-8 rounded-lg object-cover flex-shrink-0 border border-gray-100" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-800 truncate">{order.product_name}</p>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] text-purple-500 font-medium truncate">{order.store_name}</span>
                    <span className="text-[9px] text-gray-300">·</span>
                    <span className="text-[9px] text-gray-400 truncate">{order.customer_name}</span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs font-bold text-gray-800">${order.total.toFixed(2)}</p>
                  <div className="flex items-center justify-end gap-1 mt-0.5">
                    <span className="text-[8px] font-bold px-1.5 py-0.5 rounded" style={{ background: badge.bg, color: badge.color }}>{badge.label}</span>
                    <span className="text-[9px] text-gray-400">{timeAgo(order.created_at)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

RecentOrdersGlobal.propTypes = {
  orders: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string, product_name: PropTypes.string, product_image: PropTypes.string,
    store_name: PropTypes.string, customer_name: PropTypes.string,
    total: PropTypes.number, status: PropTypes.string, created_at: PropTypes.string,
  })),
  loading: PropTypes.bool,
};
