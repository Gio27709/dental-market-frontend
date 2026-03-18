import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import {
  formatOrderNumber,
  formatOrderDate,
  formatCurrencyUSD,
} from "../../utils/formatters";
import { ORDER_STATUS } from "../../utils/constants";

const STATUS_BADGE_CLASSES = {
  yellow: "bg-yellow-100 text-yellow-800 border-yellow-200",
  blue: "bg-blue-100 text-blue-800 border-blue-200",
  green: "bg-green-100 text-green-800 border-green-200",
  emerald: "bg-emerald-100 text-emerald-800 border-emerald-200",
  red: "bg-red-100 text-red-800 border-red-200",
  gray: "bg-gray-100 text-gray-700 border-gray-200",
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
  const badgeClass =
    STATUS_BADGE_CLASSES[statusInfo.color] || STATUS_BADGE_CLASSES.gray;
  const itemCount = order.order_items?.length || 0;

  return (
    <div
      id={`order-card-${order.id}`}
      className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden cursor-pointer group"
      onClick={() => navigate(`/account/orders/${order.id}`)}
    >
      <div className="p-5">
        {/* Header: Order Number + Date */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-gray-900 text-sm tracking-wide">
            {formatOrderNumber(order.id)}
          </h3>
          <span className="text-xs text-gray-400">
            {formatOrderDate(order.created_at)}
          </span>
        </div>

        {/* Status Badge */}
        <div className="mb-4">
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${badgeClass}`}
          >
            {statusInfo.label}
          </span>
        </div>

        {/* Total + Item count */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Total</p>
            <p className="text-lg font-bold text-primary-600">
              {formatCurrencyUSD(order.total_usd ?? order.total ?? 0)}
            </p>
          </div>
          <p className="text-xs text-gray-500">
            {itemCount} {itemCount === 1 ? "producto" : "productos"}
          </p>
        </div>
      </div>

      {/* Footer Button */}
      <div className="border-t border-gray-100 px-5 py-3 bg-gray-50 group-hover:bg-primary-50 transition-colors">
        <span className="text-sm font-medium text-primary-600 group-hover:text-primary-700 flex items-center gap-1">
          Ver detalle
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </span>
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
