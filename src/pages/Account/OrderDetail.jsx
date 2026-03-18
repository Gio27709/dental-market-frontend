import { useEffect, useState } from "react";
import LoadingSkeleton from "../../components/LoadingSkeleton";
import { useParams, Link } from "react-router-dom";
import { useOrder } from "../../context/OrderContext";
import OrderTimeline from "../../components/orders/OrderTimeline";
import TrackingInfo from "../../components/orders/TrackingInfo";
import DeliveryConfirmation from "../../components/orders/DeliveryConfirmation";
import OrderItemDetail from "../../components/orders/OrderItemDetail";
import {
  formatOrderNumber,
  formatOrderDate,
  formatCurrencyUSD,
  formatCurrencyVES,
} from "../../utils/formatters";
import { ORDER_STATUS } from "../../utils/constants";

const STATUS_BADGE_CLASSES = {
  yellow: "bg-yellow-100 text-yellow-800",
  blue: "bg-blue-100 text-blue-800",
  green: "bg-green-100 text-green-800",
  emerald: "bg-emerald-100 text-emerald-800",
  red: "bg-red-100 text-red-800",
  gray: "bg-gray-100 text-gray-700",
};

export default function OrderDetail() {
  const { id } = useParams();
  const { fetchOrderById, confirmDelivery, loading: ctxLoading } = useOrder();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const result = await fetchOrderById(id);
      if (result.success) {
        setOrder(result.order);
      } else {
        setError(result.error || "No se encontró la orden");
      }
      setLoading(false);
    };
    if (id) load();
  }, [id, fetchOrderById]);

  const handleConfirmDelivery = async (itemId) => {
    const result = await confirmDelivery(itemId);
    if (result.success) {
      // Refresh the order data
      const refreshed = await fetchOrderById(id);
      if (refreshed.success) setOrder(refreshed.order);
    }
    return result;
  };

  // Determine overall delivery status from items (use the "lowest" status for the timeline)
  const getOverallDeliveryStatus = () => {
    if (!order) return "pending";
    if (order.status === "cancelled" || order.status === "rejected")
      return order.status;

    const items = order.order_items || [];
    if (
      items.length > 0 &&
      items.every((i) => i.delivery_status === "delivered")
    ) {
      return "delivered";
    }

    const statuses = items.map((i) => i.delivery_status);
    if (statuses.some((s) => s === "shipped")) return "shipped";
    if (
      statuses.some((s) => s === "approved") ||
      order.payment_status === "approved"
    )
      return "approved";
    return "pending";
  };

  const overallStatus = order ? getOverallDeliveryStatus() : "pending";

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <LoadingSkeleton variant="text" count={2} />
        <LoadingSkeleton variant="title" count={1} />
        <LoadingSkeleton variant="product-card" count={1} />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="text-5xl mb-4">😔</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Orden no encontrada
        </h2>
        <p className="text-gray-500 mb-6">
          {error || "No se pudo cargar esta orden"}
        </p>
        <Link
          to="/account/orders"
          className="text-primary-600 hover:text-primary-700 font-medium"
        >
          ← Volver a mis órdenes
        </Link>
      </div>
    );
  }

  const displayStatusInfo = ORDER_STATUS[overallStatus] || ORDER_STATUS.pending;
  const displayBadgeClass =
    STATUS_BADGE_CLASSES[displayStatusInfo.color] || STATUS_BADGE_CLASSES.gray;

  // Check if any item has tracking info (shipped status)
  const shippedItems =
    order?.order_items?.filter((i) => i.delivery_status === "shipped") || [];

  // Determine if all items have been delivered
  const allDelivered =
    order?.order_items?.length > 0 &&
    order.order_items.every((item) => item.delivery_status === "delivered");
  return (
    <div className="bg-white shadow rounded-lg p-6 border border-gray-100">

      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
              {formatOrderNumber(order.id)}
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">
              {formatOrderDate(order.created_at)}
            </p>
          </div>
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold self-start ${displayBadgeClass}`}
          >
            {displayStatusInfo.label}
          </span>
        </div>

        {/* Timeline */}
        <OrderTimeline status={overallStatus} />
      </div>

      {/* Tracking Info (if any item is shipped) */}
      {shippedItems.length > 0 &&
        shippedItems.map(
          (item) =>
            item.tracking_code && (
              <div key={`tracking-${item.id}`} className="mb-6">
                <TrackingInfo
                  tracking_code={item.tracking_code}
                  shipping_carrier={item.shipping_carrier}
                />
              </div>
            ),
        )}

      {/* Order Items */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
        <h3 className="font-bold text-gray-900 mb-4">Productos</h3>
        <div className="divide-y divide-gray-100">
          {order.order_items?.map((item) => (
            <div key={item.id}>
              <OrderItemDetail item={item} />
              {/* Per-item delivery confirmation */}
              {(item.delivery_status === "approved" ||
                item.delivery_status === "shipped") && (
                <div className="pb-4 pl-20 md:pl-24">
                  <DeliveryConfirmation
                    itemId={item.id}
                    onConfirm={handleConfirmDelivery}
                    disabled={ctxLoading}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Totals */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Subtotal</span>
          <span>{formatCurrencyUSD(order.total_usd)}</span>
        </div>
        <div className="flex justify-between font-bold text-lg text-gray-900 border-t pt-3">
          <span>Total</span>
          <div className="text-right">
            <span className="block text-primary-600">
              {formatCurrencyUSD(order.total_usd)}
            </span>
            {order.total_ves && (
              <span className="block text-sm font-normal text-gray-400">
                Eq. {formatCurrencyVES(order.total_ves)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Delivered success message */}
      {allDelivered && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 mb-6 text-center">
          <div className="text-3xl mb-2">🎉</div>
          <h3 className="font-bold text-emerald-800 mb-1">
            ¡Entrega completada!
          </h3>
          <p className="text-sm text-emerald-700">
            Todos los productos de esta orden han sido entregados. ¡Gracias por
            tu compra!
          </p>
        </div>
      )}

      {/* Rejected notice */}
      {order.payment_status === "rejected" && order.notes && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-5 mb-6">
          <p className="font-semibold text-red-700 mb-1">Motivo de rechazo:</p>
          <p className="text-sm text-red-600">
            {order.notes.replace(/^Pago rechazado:\s*/, "")}
          </p>
        </div>
      )}

      {/* Back button */}
      <div className="text-center">
        <Link
          to="/account/orders"
          className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-700 font-medium text-sm"
        >
          ← Volver a mis órdenes
        </Link>
      </div>
    </div>
  );
}
