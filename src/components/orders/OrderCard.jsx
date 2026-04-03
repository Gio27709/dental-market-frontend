import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import {
  formatOrderNumber,
  formatOrderDate,
  formatCurrencyUSD,
} from "../../utils/formatters";
import { ORDER_STATUS } from "../../utils/constants";

// Adaptation to Royal Meridian palette based on the Stitch horizontal design
const STATUS_BADGE_STYLES = {
  yellow: { bg: "#fef9c3", text: "#ca8a04", dot: "#ca8a04" }, // Pending / In Review
  blue: { bg: "#eff6ff", text: "#2563eb", dot: "#2563eb" },   // Shipped
  green: { bg: "#f0fdf4", text: "#16a34a", dot: "#16a34a" },  // Delivered
  emerald: { bg: "#dcfce7", text: "#059669", dot: "#059669" },
  red: { bg: "#fef2f2", text: "#dc2626", dot: "#dc2626" },    // Cancelled / Rejected
  gray: { bg: "#f3f4f6", text: "#4b5563", dot: "#4b5563" },
};

export default function OrderCard({ order }) {
  const navigate = useNavigate();

  // Check delivery statuses
  const allDelivered =
    order.order_items?.length > 0 &&
    order.order_items.every((i) => i.delivery_status === "delivered");
  const anyShipped = order.order_items?.some(
    (i) => i.delivery_status === "shipped",
  );

  let statusKey = "pending";
  if (order.status === "cancelled" || order.status === "rejected") {
    statusKey = order.status;
  } else if (allDelivered) {
    statusKey = "delivered";
  } else if (anyShipped) {
    statusKey = "shipped";
  } else if (order.payment_status === "approved") {
    statusKey = "approved";
  } else {
    statusKey = order.payment_status || order.order_status || "pending";
  }

  const statusInfo = ORDER_STATUS[statusKey] || ORDER_STATUS.pending;
  const badgeStyle = STATUS_BADGE_STYLES[statusInfo.color] || STATUS_BADGE_STYLES.gray;
  const itemCount = order.order_items?.length || 0;

  return (
    <div
      onClick={() => navigate(`/account/orders/${order.id}`)}
      className="rounded-2xl bg-white hover:bg-gray-50 transition-colors duration-200 cursor-pointer px-6 py-5 flex flex-col md:flex-row md:items-center justify-between gap-6"
      style={{ boxShadow: "0 4px 24px rgba(107,30,150,0.04)" }}
    >
      {/* Datos grid principal (Horizontal Layout) */}
      <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
        {/* Order ID */}
        <div>
          <p className="text-[10px] uppercase tracking-wider font-bold mb-1" style={{ color: "#727785" }}>Order ID</p>
          <p className="font-bold text-sm" style={{ color: "#191c23" }}>{formatOrderNumber(order.id)}</p>
        </div>

        {/* Placed On */}
        <div>
          <p className="text-[10px] uppercase tracking-wider font-bold mb-1" style={{ color: "#727785" }}>Placed On</p>
          <p className="font-bold text-sm" style={{ color: "#191c23" }}>{formatOrderDate(order.created_at)}</p>
        </div>

        {/* Total */}
        <div>
          <p className="text-[10px] uppercase tracking-wider font-bold mb-1" style={{ color: "#727785" }}>Total</p>
          <p className="font-bold text-base" style={{ color: "#191c23" }}>
            {formatCurrencyUSD(order.total_usd ?? order.total ?? 0)}
          </p>
        </div>

        {/* Items */}
        <div>
          <p className="text-[10px] uppercase tracking-wider font-bold mb-1" style={{ color: "#727785" }}>Items</p>
          <p className="font-bold text-sm" style={{ color: "#191c23" }}>
            {itemCount} {itemCount === 1 ? "item" : "items"}
          </p>
        </div>
      </div>

      {/* Action Area (Badge + Link) */}
      <div className="flex items-center gap-6 md:w-auto w-full justify-between md:justify-end">
        {/* Status Badge */}
        <span
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
          style={{ backgroundColor: badgeStyle.bg, color: badgeStyle.text }}
        >
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: badgeStyle.dot }}></span>
          {statusInfo.label}
        </span>

        {/* View Details CTA */}
        <div className="flex items-center gap-1 text-sm font-bold" style={{ color: "#6b1e96" }}>
          Ver detalle
          <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>arrow_forward_ios</span>
        </div>
      </div>
    </div>
  );
}

OrderCard.propTypes = {
  order: PropTypes.shape({
    id: PropTypes.string.isRequired,
    created_at: PropTypes.string,
    total_usd: PropTypes.number,
    total: PropTypes.number,
    status: PropTypes.string,
    payment_status: PropTypes.string,
    order_status: PropTypes.string,
    order_items: PropTypes.array,
  }).isRequired,
};
