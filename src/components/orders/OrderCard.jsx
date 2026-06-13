import PropTypes from "prop-types";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  formatOrderNumber,
  formatOrderDate,
  formatCurrencyUSD,
} from "../../utils/formatters";
import { ORDER_STATUS } from "../../utils/constants";
import ShippedBadge from "./ShippedBadge";

// Styled decorations matching the Tailwind setup
const STATUS_DECORATIONS = {
  gray: { bgClass: "bg-gray-50 text-gray-600 border-gray-200", icon: "help" },
  yellow: { bgClass: "bg-amber-50 text-amber-700 border-amber-200", icon: "schedule" },
  blue: { bgClass: "bg-blue-50 text-blue-700 border-blue-200", icon: "pending" },
  green: { bgClass: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: "local_shipping" },
  emerald: { bgClass: "bg-emerald-50 text-emerald-700 border-emerald-250", icon: "task_alt" },
  red: { bgClass: "bg-rose-50 text-rose-700 border-rose-200", icon: "cancel" },
};

export default function OrderCard({ order }) {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  // Check delivery statuses
  const allDelivered =
    order.order_items?.length > 0 &&
    order.order_items.every((i) => i.delivery_status === "delivered");
  const allCancelled =
    order.order_items?.length > 0 &&
    order.order_items.every((i) => i.delivery_status === "cancelled");
  const anyShipped = order.order_items?.some(
    (i) => ["shipped", "picked_up", "arrived"].includes(i.delivery_status),
  );

  const ageInHours = (Date.now() - new Date(order.created_at).getTime()) / (1000 * 60 * 60);
  const isExpired = order.payment_status === "pending" && !order.payment_proof_url && ageInHours >= 2;

  let statusKey = "pending";
  if (order.status === "cancelled" || order.status === "rejected" || order.payment_status === "failed" || allCancelled) {
    statusKey = order.payment_status === "failed" ? "failed" : (allCancelled ? "cancelled" : order.status);
  } else if (allDelivered) {
    statusKey = "delivered";
  } else if (anyShipped) {
    statusKey = "shipped";
  } else if (order.payment_status === "approved") {
    statusKey = "approved";
  } else if (isExpired) {
    statusKey = "expired";
  } else {
    statusKey = order.payment_status || order.order_status || "pending";
  }

  const statusInfo = ORDER_STATUS[statusKey] || ORDER_STATUS.pending;
  const decoration = STATUS_DECORATIONS[statusInfo.color] || STATUS_DECORATIONS.gray;
  const badgeStyleClass = decoration.bgClass;

  // Custom icons overrides for statuses
  let statusIconName = decoration.icon;
  if (statusKey === "approved") {
    statusIconName = "check_circle";
  } else if (statusKey === "delivered") {
    statusIconName = "task_alt";
  } else if (statusKey === "shipped") {
    statusIconName = "local_shipping";
  } else if (statusKey === "cancelled" || statusKey === "rejected" || statusKey === "failed") {
    statusIconName = "cancel";
  } else if (statusKey === "under_review") {
    statusIconName = "rate_review";
  } else if (statusKey === "pending") {
    statusIconName = "schedule";
  } else if (statusKey === "expired") {
    statusIconName = "history_toggle_off";
  }

  const items = order.order_items || [];
  const itemsCount = items.length;
  const isCompletablePayment = !order.payment_proof_url && order.payment_status === "pending" && !isExpired;

  const handleCopy = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(order.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getVariationText = (variation) => {
    if (!variation || !variation.attribute_value || variation.attribute_name === "default" || variation.attribute_value === '{"_default":"default"}') return null;
    try {
      const parsed = JSON.parse(variation.attribute_value);
      if (parsed._default === "default") return null;
      return Object.entries(parsed)
        .map(([key, val]) => {
          const cleanVal = typeof val === 'string' && val.includes('|') ? val.split('|')[0] : val;
          return `${key}: ${cleanVal}`;
        })
        .join(" | ");
    } catch {
      let cleanVal = variation.attribute_value;
      if (typeof cleanVal === 'string' && cleanVal.includes('|')) cleanVal = cleanVal.split('|')[0];

      if (variation.attribute_name && variation.attribute_name !== "Matrix") {
        return `${variation.attribute_name}: ${cleanVal}`;
      }
      return cleanVal;
    }
  };

  return (
    <div
      onClick={() => {
        if (!order.payment_proof_url && order.payment_status === "pending") {
          navigate(`/order-success/${order.id}`);
        } else {
          navigate(`/account/orders/${order.id}`);
        }
      }}
      className="group rounded-2xl bg-white border border-gray-100 overflow-hidden hover:border-[#6b1e96]/30 hover:shadow-[0_8px_30px_rgb(107,30,150,0.03)] transition-all duration-250 cursor-pointer flex flex-col"
    >
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-50/80 px-6 py-3 border-b border-gray-100/80">
        <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 font-medium">
          <span>Pedido</span>
          <span className="font-mono font-bold text-[#191c23] bg-gray-200/60 px-2 py-0.5 rounded">
            {formatOrderNumber(order.id)}
          </span>
          <button
            onClick={handleCopy}
            className="flex items-center justify-center p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors border-none bg-transparent cursor-pointer"
            title="Copiar ID de pedido"
          >
            <span className="material-symbols-outlined text-[15px] pointer-events-none">
              {copied ? "check" : "content_copy"}
            </span>
          </button>
          <span className="text-gray-300 mx-0.5">•</span>
          <span>{formatOrderDate(order.created_at)}</span>
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          <span className="text-xs text-gray-500 font-medium">Total:</span>
          <span className="font-extrabold text-sm md:text-base text-[#6b1e96]">
            {formatCurrencyUSD(order.total_usd ?? order.total ?? 0)}
          </span>
        </div>
      </div>

      {/* Body Content */}
      <div className="px-6 py-4 flex-1 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex-1">
          {itemsCount === 1 ? (
            // Single Item Layout
            (() => {
              const item = items[0];
              const product = item.products || {};
              const imageUrl = product.images?.[0] || product.image_url;
              const variationText = getVariationText(item.product_variations);
              return (
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-gray-50 border border-gray-100 flex-shrink-0 overflow-hidden flex items-center justify-center shadow-xs">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={product.name || "Producto"}
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl">🦷</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-xs md:text-sm text-[#191c23] truncate group-hover:text-[#6b1e96] transition-colors duration-200">
                      {product.name || "Producto Dental"}
                    </h4>
                    {variationText && (
                      <p className="text-[10px] text-gray-400 mt-0.5 truncate max-w-sm">
                        {variationText}
                      </p>
                    )}
                    <p className="text-[11px] font-bold text-gray-500 mt-1 uppercase tracking-wider">
                      {item.quantity} {item.quantity === 1 ? "unidad" : "unidades"} × {formatCurrencyUSD(item.unit_price)}
                    </p>
                  </div>
                </div>
              );
            })()
          ) : (
            // Multiple Items Layout
            <div className="flex flex-col gap-2.5">
              <div className="flex flex-wrap items-center gap-3">
                {items.slice(0, 3).map((item, idx) => {
                  const product = item.products || {};
                  const imageUrl = product.images?.[0] || product.image_url;
                  return (
                    <div
                      key={item.id || idx}
                      className="w-14 h-14 rounded-xl bg-gray-50 border border-gray-100 flex-shrink-0 overflow-hidden flex items-center justify-center relative shadow-xs group-hover:scale-[1.02] transition-transform duration-200"
                    >
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={product.name || "Producto"}
                          loading="lazy"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-2xl">🦷</span>
                      )}
                      <span className="absolute -top-1.5 -right-1.5 bg-[#6b1e96] text-white text-[9px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center border border-white shadow-xs">
                        x{item.quantity}
                      </span>
                    </div>
                  );
                })}
                {itemsCount > 3 && (
                  <div className="w-14 h-14 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-center text-xs font-bold text-gray-500 shadow-xs">
                    +{itemsCount - 3}
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 font-medium">
                Este pedido contiene <span className="font-bold text-[#191c23]">{itemsCount} productos</span> diferentes.
              </p>
            </div>
          )}
        </div>

        {/* Action Area */}
        <div className="flex flex-col sm:flex-row md:flex-col items-start sm:items-center md:items-end justify-between md:justify-center gap-4 border-t border-gray-100 md:border-t-0 pt-4 md:pt-0">
          <div className="flex flex-wrap items-center gap-2">
            {/* Status Badge */}
            {statusKey === "shipped" ? (
              <ShippedBadge size="md" label={statusInfo.label} />
            ) : (
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-extrabold border ${badgeStyleClass}`}
              >
                <span className="material-symbols-outlined text-[15px]">{statusIconName}</span>
                {statusInfo.label}
              </span>
            )}

            {/* Refunded Badge */}
            {(statusKey === "cancelled" || order.status === "cancelled" || allCancelled) && order.escrow_status === "refunded" && (
              <span
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-extrabold bg-[#dcfce7] text-[#059669] border border-[#bbf7d0]"
              >
                💵 Reembolsado
              </span>
            )}
          </div>

          <div
            className={`inline-flex items-center gap-1 text-xs font-extrabold transition-all duration-200 ${
              isCompletablePayment
                ? "bg-[#6b1e96] hover:bg-[#531575] text-white px-4 py-2.5 rounded-xl shadow-sm shadow-[#6b1e96]/10"
                : "text-[#6b1e96] group-hover:translate-x-1"
            }`}
          >
            {isCompletablePayment ? "Completar Pago" : "Ver detalle"}
            {!isCompletablePayment && (
              <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            )}
          </div>
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
    escrow_status: PropTypes.string,
    order_items: PropTypes.array,
    payment_proof_url: PropTypes.string,
  }).isRequired,
};
