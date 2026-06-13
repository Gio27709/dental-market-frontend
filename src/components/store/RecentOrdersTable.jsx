import PropTypes from "prop-types";
import { Link } from "react-router-dom";

const STATUS_BADGES = {
  pending: { label: "Pendiente", bg: "rgba(245,158,11,0.1)", color: "#d97706" },
  processing: { label: "Procesando", bg: "rgba(107,30,150,0.08)", color: "#6b1e96" },
  shipped: { label: "Enviado", bg: "rgba(59,130,246,0.1)", color: "#2563eb" },
  delivered: { label: "Entregado", bg: "rgba(16,185,129,0.1)", color: "#059669" },
  cancelled: { label: "Cancelado", bg: "rgba(239,68,68,0.08)", color: "#dc2626" },
};

function timeAgo(dateStr) {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now - date;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "ahora";
  if (mins < 60) return `hace ${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `hace ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `hace ${days}d`;
  return `hace ${Math.floor(days / 30)}mes`;
}

export default function RecentOrdersTable({ orders = [], loading = false }) {
  if (loading) {
    return (
      <div className="rounded-2xl p-5 animate-pulse" style={{ background: "rgba(107,30,150,0.04)", border: "1px solid rgba(107,30,150,0.06)" }}>
        <div className="h-4 w-36 bg-gray-200 rounded mb-4" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 py-3 border-b border-gray-100 last:border-0">
            <div className="w-8 h-8 bg-gray-200 rounded-lg" />
            <div className="flex-1"><div className="h-3 w-28 bg-gray-200 rounded mb-1" /><div className="h-2.5 w-20 bg-gray-100 rounded" /></div>
            <div className="h-4 w-14 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="rounded-2xl p-5 md:p-6" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.97) 0%, rgba(250,248,255,0.97) 100%)", border: "1px solid rgba(107,30,150,0.06)" }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-purple-400">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
          </svg>
          <h3 className="text-sm font-bold text-gray-700">Órdenes Recientes</h3>
        </div>
        <Link to="/store/orders" className="text-[10px] font-semibold text-purple-500 hover:text-purple-700 transition-colors">
          Ver todas →
        </Link>
      </div>

      {orders.length > 0 ? (
        <div className="space-y-0">
          {orders.map((order) => {
            const badge = STATUS_BADGES[order.status] || STATUS_BADGES.pending;
            return (
              <div key={order.id} className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50/50 rounded-lg px-2 transition-colors">
                {/* Product image */}
                {order.product_image ? (
                  <img src={order.product_image} alt="" className="w-9 h-9 rounded-lg object-cover flex-shrink-0 border border-gray-100" loading="lazy" />
                ) : (
                  <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-4 h-4 text-gray-300">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25" />
                    </svg>
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-800 truncate">{order.product_name}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] text-gray-400">{order.customer_name}</span>
                    <span className="text-[10px] text-gray-300">•</span>
                    <span className="text-[10px] text-gray-400">{order.quantity}x</span>
                    <span className="text-[10px] text-gray-300">•</span>
                    <span className="text-[10px] text-gray-400">{timeAgo(order.created_at)}</span>
                  </div>
                </div>

                {/* Status + Price */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md" style={{ background: badge.bg, color: badge.color }}>
                    {badge.label}
                  </span>
                  <span className="text-xs font-bold text-gray-700">${Number(order.total).toFixed(2)}</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-sm text-gray-400">Aún no tienes órdenes</p>
          <p className="text-xs text-gray-300 mt-1">Las órdenes aparecerán aquí cuando lleguen</p>
        </div>
      )}
    </div>
  );
}

RecentOrdersTable.propTypes = {
  orders: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string, product_name: PropTypes.string, product_image: PropTypes.string,
    customer_name: PropTypes.string, quantity: PropTypes.number, total: PropTypes.number,
    status: PropTypes.string, created_at: PropTypes.string,
  })),
  loading: PropTypes.bool,
};
