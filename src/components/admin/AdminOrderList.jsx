import PropTypes from "prop-types";
import { Link } from "react-router-dom";

// Helper to format currency
const formatCurrency = (amount) => `$${Number(amount || 0).toFixed(2)}`;

// Helper for delivery badge derived from order items
const getDeliveryBadge = (orderItems) => {
  if (!orderItems?.length)
    return { label: "Sin ítems", color: "#6b7280", bg: "rgba(107,114,128,0.1)" };

  const statuses = orderItems.map((i) => i.delivery_status);
  const allDelivered = statuses.every((s) => s === "delivered");
  const someShipped = statuses.some((s) => ["shipped", "picked_up", "arrived"].includes(s));
  const allCancelled = statuses.every((s) => s === "cancelled");
  const allPending = statuses.every((s) => s === "pending" || s === "confirmed");

  if (allDelivered) return { label: "Entregado", color: "#059669", bg: "rgba(16,185,129,0.1)" };
  if (allCancelled) return { label: "Cancelado", color: "#dc2626", bg: "rgba(220,38,38,0.1)" };
  if (someShipped) return { label: "En Camino", color: "#2563eb", bg: "rgba(37,99,235,0.1)" };
  if (allPending) return { label: "Pendiente", color: "#9ca3af", bg: "rgba(107,114,128,0.1)" };
  
  return { label: "Parcial", color: "#d97706", bg: "rgba(245,158,11,0.1)" };
};

// Helper adapted to design system
const getStatusBadge = (status) => {
  switch (status) {
    case "approved":
      return { label: "Aprobado", color: "#059669", bg: "rgba(16,185,129,0.1)", icon: "✅" };
    case "to_refund":
      return { label: "Por Reembolsar", color: "#d97706", bg: "rgba(245,158,11,0.15)", icon: "💸" };
    case "refunded":
      return { label: "Reembolsado", color: "#059669", bg: "rgba(16,185,129,0.1)", icon: "🔄" };
    case "under_review":
      return { label: "En Revisión", color: "#d97706", bg: "rgba(245,158,11,0.1)", icon: "🔍" };
    case "pending":
      return { label: "Pendiente", color: "#6b7280", bg: "rgba(107,114,128,0.1)", icon: "⏳" };
    case "rejected":
      return { label: "Rechazado", color: "#dc2626", bg: "rgba(220,38,38,0.1)", icon: "❌" };
    default:
      return { label: status, color: "#6b7280", bg: "rgba(107,114,128,0.1)", icon: "•" };
  }
};

const getMethodIcon = (method) => {
  switch (method) {
    case "pago_movil": return "📱 pago móvil";
    case "transferencia": return "🏦 transferencia";
    case "zelle": return "🟩 zelle";
    case "binance": return "🟨 binance";
    case "paypal": return "🟦 paypal";
    default: return "💳 " + method;
  }
};

export default function AdminOrderList({ orders }) {
  if (!orders || orders.length === 0) return null; // Empty state handled by parent

  const thStyle = { padding: "12px 14px", fontSize: "11px", fontWeight: 600, color: "rgba(195,255,0,0.8)", textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" };

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: "16px",
        border: "1px solid #f0f0f0",
        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
        overflow: "hidden",
      }}
    >
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", minWidth: "1020px" }}>
          <thead>
            <tr style={{ background: "linear-gradient(135deg, #1a0a2e, #2d1248)" }}>
              <th style={thStyle}>Orden</th>
              <th style={thStyle}>Cliente</th>
              <th style={thStyle}>Productos</th>
              <th style={thStyle}>Envío</th>
              <th style={thStyle}>Tienda</th>
              <th style={thStyle}>Monto</th>
              <th style={thStyle}>Estado Pago</th>
              <th style={thStyle}>Método</th>
              <th style={{ ...thStyle, textAlign: "center" }}></th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order, idx) => {
              const borderBottom = idx !== orders.length - 1 ? "1px solid #f3f4f6" : "none";
              const dateObj = new Date(order.created_at);
              const formattedDate = dateObj.toLocaleDateString("es-VE", { day: "2-digit", month: "numeric", year: "numeric" });
              const formattedTime = dateObj.toLocaleTimeString("es-VE", { hour: "2-digit", minute: "2-digit" });
              
              const allCancelled = order.order_items?.length > 0 && order.order_items.every(i => i.delivery_status === "cancelled");
              
              let computedPaymentStatus = order.payment_status;
              if (allCancelled && order.payment_status === "approved") {
                computedPaymentStatus = order.escrow_status === "refunded" ? "refunded" : "to_refund";
              }

              const statusBadge = getStatusBadge(computedPaymentStatus);
              const deliveryBadge = getDeliveryBadge(order.order_items);
              
              const totalItemsCount = order.order_items?.reduce((acc, current) => acc + (current.quantity || 1), 0) || 0;
              const firstProductName = order.order_items?.[0]?.products?.name || "—";

              // Extract store names uniquely
              const storesSet = new Set();
              order.order_items?.forEach((item) => {
                if (item.store_profiles?.business_name) {
                  storesSet.add(item.store_profiles.business_name);
                }
              });
              const storeNames = Array.from(storesSet);
              const storeDisplay = storeNames.length === 0 ? "N/A" : storeNames.length === 1 ? storeNames[0] : `${storeNames[0]} (+${storeNames.length - 1})`;

              return (
                <tr
                  key={order.id}
                  style={{ borderBottom, transition: "background 0.15s", background: "#fff" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#faf5ff")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}
                >
                  {/* ORDEN */}
                  <td style={{ padding: "10px 14px", verticalAlign: "middle" }}>
                    <span style={{ fontSize: "13px", fontWeight: 700, color: "#111827", fontFamily: "monospace", letterSpacing: "0.5px" }}>
                      {order.id.split("-")[0].toUpperCase()}
                    </span>
                    <div style={{ fontSize: "10px", color: "#9ca3af", marginTop: "2px" }}>
                      {formattedDate} · {formattedTime}
                    </div>
                  </td>

                  {/* CLIENTE */}
                  <td style={{ padding: "10px 14px", verticalAlign: "middle" }}>
                    <div style={{ fontSize: "12px", fontWeight: 600, color: "#1f2937", lineHeight: 1.3 }}>
                      {order.users?.full_name || "Eliminado"}
                    </div>
                    <div style={{ fontSize: "10px", color: "#9ca3af", marginTop: "1px" }}>
                      {order.users?.email || ""}
                    </div>
                  </td>

                  {/* PRODUCTOS */}
                  <td style={{ padding: "10px 14px", verticalAlign: "middle", maxWidth: "180px" }}>
                    <div style={{ fontSize: "11px", color: "#374151", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      <span style={{ fontWeight: 700, color: "#6b1e96" }}>{totalItemsCount}</span> ítem{totalItemsCount !== 1 ? "s" : ""} · {firstProductName}
                    </div>
                  </td>

                  {/* ENVÍO */}
                  <td style={{ padding: "10px 14px", verticalAlign: "middle" }}>
                    <div style={{ display: "inline-flex", alignItems: "center", padding: "3px 8px", borderRadius: "10px", background: deliveryBadge.bg, color: deliveryBadge.color, fontSize: "10px", fontWeight: 700, whiteSpace: "nowrap" }}>
                      {deliveryBadge.label}
                    </div>
                  </td>

                  {/* TIENDA */}
                  <td style={{ padding: "10px 14px", verticalAlign: "middle" }}>
                    <span style={{ fontSize: "11px", fontWeight: 600, color: "#4b5563" }}>{storeDisplay}</span>
                  </td>

                  {/* MONTO */}
                  <td style={{ padding: "10px 14px", verticalAlign: "middle" }}>
                    <div style={{ fontSize: "12px", fontWeight: 700, color: "#111827" }}>
                      {formatCurrency(order.total_usd)}
                    </div>
                    <div style={{ fontSize: "10px", color: "#9ca3af", marginTop: "1px" }}>
                      Bs {Number(order.total_ves || 0).toLocaleString("es-VE", { minimumFractionDigits: 2 })}
                    </div>
                  </td>

                  {/* ESTADO PAGO */}
                  <td style={{ padding: "10px 14px", verticalAlign: "middle" }}>
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "5px",
                        padding: "4px 10px",
                        borderRadius: "16px",
                        background: statusBadge.bg,
                        color: statusBadge.color,
                        fontSize: "10px",
                        fontWeight: 700,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {statusBadge.icon && <span style={{ fontSize: "11px" }}>{statusBadge.icon}</span>}
                      {statusBadge.label}
                    </div>
                  </td>

                  {/* MÉTODO DE PAGO */}
                  <td style={{ padding: "10px 14px", verticalAlign: "middle" }}>
                    <span style={{ fontSize: "11px", color: "#6b7280", textTransform: "capitalize", whiteSpace: "nowrap" }}>
                      {getMethodIcon(order.payment_method)}
                    </span>
                  </td>

                  {/* ACCIONES */}
                  <td style={{ padding: "10px 14px", verticalAlign: "middle", textAlign: "center" }}>
                    <Link
                      to={`/admin/orders/${order.id}`}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        padding: "6px 12px",
                        borderRadius: "8px",
                        background: "rgba(107, 30, 150, 0.05)",
                        border: "1px solid rgba(107, 30, 150, 0.15)",
                        color: "#6b1e96",
                        fontSize: "11px",
                        fontWeight: 600,
                        textDecoration: "none",
                        transition: "all 0.2s",
                        whiteSpace: "nowrap",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "#6b1e96";
                        e.currentTarget.style.color = "#c3ff00";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "rgba(107, 30, 150, 0.05)";
                        e.currentTarget.style.color = "#6b1e96";
                      }}
                    >
                      Ver
                      <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                      </svg>
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

AdminOrderList.propTypes = {
  orders: PropTypes.array.isRequired,
};

