import { useEffect, useState, useRef } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import LoadingSkeleton from "../../components/LoadingSkeleton";
import { useParams, Link } from "react-router-dom";
import { useOrder } from "../../context/OrderContext";
import OrderTimeline from "../../components/orders/OrderTimeline";
import TrackingInfo from "../../components/orders/TrackingInfo";
import DeliveryConfirmation from "../../components/orders/DeliveryConfirmation";
import OrderItemDetail from "../../components/orders/OrderItemDetail";
import OrderReceiptTemplate from "../../components/orders/OrderReceiptTemplate";
import {
  formatOrderNumber,
  formatOrderDateTime,
  formatCurrencyUSD,
  formatCurrencyVES,
} from "../../utils/formatters";
import { ORDER_STATUS, PAYMENT_METHODS } from "../../utils/constants";

const STATUS_BADGE_STYLES = {
  yellow: { bg: "#fef9c3", text: "#ca8a04", dot: "#ca8a04" },
  blue: { bg: "#eff6ff", text: "#2563eb", dot: "#2563eb" },
  green: { bg: "#f0fdf4", text: "#16a34a", dot: "#16a34a" },
  emerald: { bg: "#dcfce7", text: "#059669", dot: "#059669" },
  red: { bg: "#fef2f2", text: "#dc2626", dot: "#dc2626" },
  gray: { bg: "#f3f4f6", text: "#4b5563", dot: "#4b5563" },
};

export default function OrderDetail() {
  const { id } = useParams();
  const { fetchOrderById, confirmDelivery, loading: ctxLoading } = useOrder();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const receiptRef = useRef(null);

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
      const refreshed = await fetchOrderById(id);
      if (refreshed.success) setOrder(refreshed.order);
    }
    return result;
  };

  const handleDownloadPDF = async () => {
    const input = receiptRef.current;
    if (!input) return;

    setGeneratingPdf(true);
    try {
      const canvas = await html2canvas(input, {
        scale: 2, // Higher quality
        useCORS: true, 
      });
      const imgData = canvas.toDataURL("image/jpeg", 1.0);
      
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "pt",
        format: "a4",
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Recibo_ORD-${order.id.substring(0,6).toUpperCase()}.pdf`);
    } catch (err) {
      console.error("Error generating PDF:", err);
    } finally {
      setGeneratingPdf(false);
    }
  };

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
    if (statuses.some((s) => s === "shipped" || s === "delivered")) return "shipped";
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
      <div className="text-center py-20 rounded-2xl bg-white" style={{ boxShadow: "0 4px 24px rgba(107,30,150,0.04)" }}>
        <div className="text-5xl mb-4">😔</div>
        <h2 className="text-xl font-bold mb-2" style={{ color: "#191c23" }}>
          Orden no encontrada
        </h2>
        <p className="text-sm mb-6" style={{ color: "#727785" }}>
          {error || "No se pudo cargar esta orden"}
        </p>
        <Link
          to="/account/orders"
          className="text-sm font-bold"
          style={{ color: "#6b1e96" }}
        >
          ← Volver a mis órdenes
        </Link>
      </div>
    );
  }

  const displayStatusInfo = ORDER_STATUS[overallStatus] || ORDER_STATUS.pending;
  const badgeStyle = STATUS_BADGE_STYLES[displayStatusInfo.color] || STATUS_BADGE_STYLES.gray;

  const shippedItems = order?.order_items?.filter((i) => i.delivery_status === "shipped") || [];
  const allDelivered =
    order?.order_items?.length > 0 &&
    order.order_items.every((item) => item.delivery_status === "delivered");

  // Extract store names from order items
  const storeNames = [...new Set(
    (order.order_items || [])
      .map((item) => item.store_profiles?.business_name)
      .filter(Boolean)
  )];

  // Find first tracking info
  const firstTracking = order.order_items?.find((i) => i.tracking_code);

  return (
    <div className="flex flex-col gap-4">
      {/* ─── Back Action ─── */}
      <div>
        <Link
          to="/account/orders"
          className="inline-flex items-center gap-1.5 text-sm font-bold hover:opacity-80 transition-opacity"
          style={{ color: "#6b1e96" }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>arrow_back</span>
          Volver a mis órdenes
        </Link>
      </div>

      <div className="flex flex-col xl:flex-row gap-5 items-start">
        {/* ================= LEFT COLUMN ================= */}
        <div className="w-full xl:flex-1 space-y-4">
          
          {/* Header & Timeline */}
          <div className="bg-white rounded-2xl p-5 sm:p-6" style={{ boxShadow: "0 4px 24px rgba(107,30,150,0.04)" }}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight" style={{ color: "#191c23" }}>
                  {formatOrderNumber(order.id)}
                </h1>
                <p className="text-sm mt-1 flex items-center gap-1.5" style={{ color: "#727785" }}>
                  <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>calendar_today</span>
                  {formatOrderDateTime(order.created_at)}
                </p>
              </div>
              <span
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold self-start"
                style={{ backgroundColor: badgeStyle.bg, color: badgeStyle.text }}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: badgeStyle.dot }}></span>
                {displayStatusInfo.label}
              </span>
            </div>
            <OrderTimeline status={overallStatus} />
          </div>

          {/* Tracking */}
          {shippedItems.length > 0 &&
            shippedItems.map(
              (item) =>
                item.tracking_code && (
                  <div key={`tracking-${item.id}`}>
                    <TrackingInfo
                      tracking_code={item.tracking_code}
                      shipping_carrier={item.shipping_carrier}
                    />
                  </div>
                ),
            )}

          {/* Products */}
          <div className="bg-white rounded-2xl p-5 sm:p-6" style={{ boxShadow: "0 4px 24px rgba(107,30,150,0.04)" }}>
            <h2 className="text-base sm:text-lg font-bold mb-4 flex items-center gap-2" style={{ color: "#191c23" }}>
              <span className="material-symbols-outlined text-[18px]" style={{ color: "#6b1e96" }}>inventory_2</span>
              Productos ({order.order_items?.length || 0})
            </h2>
            <div className="space-y-4">
              {order.order_items?.map((item) => (
                <div key={item.id} style={{ borderBottom: "1px dashed rgba(207,194,213,0.3)" }} className="pb-4 last:border-0 last:pb-0">
                  <OrderItemDetail item={item} />
                  {(item.delivery_status === "approved" ||
                    item.delivery_status === "shipped") && (
                    <div className="pl-16 md:pl-20 mt-2">
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

          {/* Order Notes / Alerts */}
          {order.notes && order.payment_status !== "rejected" && (
            <div className="bg-white rounded-2xl p-5 sm:p-6" style={{ boxShadow: "0 4px 24px rgba(107,30,150,0.04)" }}>
              <h2 className="text-base font-bold mb-3 flex items-center gap-2" style={{ color: "#191c23" }}>
                <span className="material-symbols-outlined text-[18px]" style={{ color: "#6b1e96" }}>sticky_note_2</span>
                Notas del Pedido
              </h2>
              <p className="text-sm" style={{ color: "#727785" }}>{order.notes}</p>
            </div>
          )}

          {allDelivered && (
            <div className="rounded-2xl p-6 text-center" style={{ background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)" }}>
              <div className="text-3xl mb-2">🎉</div>
              <h3 className="font-bold text-base mb-1" style={{ color: "#16a34a" }}>¡Entrega completada!</h3>
              <p className="text-sm" style={{ color: "#15803d" }}>Todos los productos han sido entregados.</p>
            </div>
          )}

          {order.payment_status === "rejected" && order.notes && (
            <div className="rounded-2xl p-6" style={{ background: "linear-gradient(135deg, #fef2f2 0%, #fecaca 100%)" }}>
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined mt-0.5" style={{ color: "#dc2626" }}>error</span>
                <div>
                  <p className="font-bold text-sm mb-1" style={{ color: "#dc2626" }}>Motivo de rechazo</p>
                  <p className="text-sm" style={{ color: "#991b1b" }}>{order.notes.replace(/^Pago rechazado:\s*/, "")}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ================= RIGHT COLUMN (Sticky) ================= */}
        <div className="w-full xl:w-[320px] 2xl:w-[340px] space-y-4 xl:sticky xl:top-24 flex-shrink-0">
          
          {/* Summary */}
          <div className="bg-white rounded-2xl p-5 sm:p-6" style={{ boxShadow: "0 4px 24px rgba(107,30,150,0.04)" }}>
            <h2 className="text-base font-bold mb-4 flex items-center gap-2" style={{ color: "#191c23" }}>
              <span className="material-symbols-outlined text-[18px]" style={{ color: "#6b1e96" }}>receipt_long</span>
              Resumen
            </h2>
            <ul className="space-y-3 text-sm">
              <li className="flex justify-between items-start gap-4">
                <span style={{ color: "#727785" }}>Tienda</span>
                <span className="font-medium text-right" style={{ color: "#191c23" }}>{storeNames.length > 0 ? storeNames.join(", ") : "—"}</span>
              </li>
              <li className="flex justify-between items-start gap-4">
                <span style={{ color: "#727785" }}>Método Pago</span>
                <span className="font-medium text-right capitalize" style={{ color: "#191c23" }}>{PAYMENT_METHODS[order.payment_method]?.label || order.payment_method || "—"}</span>
              </li>
              <li className="flex justify-between items-start gap-4">
                <span style={{ color: "#727785" }}>Estado Pago</span>
                <span className="font-medium text-right" style={{ color: "#191c23" }}>{order.payment_status === "approved" ? "Aprobado" : displayStatusInfo.label}</span>
              </li>
              <li className="flex justify-between items-start gap-4">
                <span style={{ color: "#727785" }}>Tracking</span>
                <span className="font-medium text-right" style={{ color: "#191c23" }}>{firstTracking?.tracking_code || "—"}</span>
              </li>
              <li className="flex justify-between items-start gap-4">
                <span style={{ color: "#727785" }}>ID Referencia</span>
                <span className="font-medium text-right font-mono" style={{ color: "#191c23" }}>{order.id.split('-')[0]}</span>
              </li>
              <li className="flex justify-between items-start gap-4">
                <span style={{ color: "#727785" }}>Teléfono</span>
                <span className="font-medium text-right" style={{ color: "#191c23" }}>{order.contact_phone || "—"}</span>
              </li>
            </ul>
            <div className="mt-4 pt-4" style={{ borderTop: "1px solid rgba(207,194,213,0.3)" }}>
              <span className="block text-[10px] uppercase font-bold mb-1" style={{ color: "#727785" }}>Dirección de Envío</span>
              <span className="text-xs leading-relaxed" style={{ color: "#191c23" }}>{order.shipping_address || "—"}</span>
            </div>
          </div>

          {/* Payment Receipt */}
          <div className="bg-white rounded-2xl p-5 sm:p-6" style={{ boxShadow: "0 4px 24px rgba(107,30,150,0.04)" }}>
            <h2 className="text-base font-bold mb-4 flex items-center gap-2" style={{ color: "#191c23" }}>
              <span className="material-symbols-outlined text-[18px]" style={{ color: "#6b1e96" }}>account_balance_wallet</span>
              Pagos
            </h2>
            <div className="space-y-2">
              <div className="flex justify-between text-sm" style={{ color: "#727785" }}>
                <span>Subtotal</span>
                <span className="font-medium" style={{ color: "#191c23" }}>{formatCurrencyUSD(order.total_usd)}</span>
              </div>
              <div className="flex justify-between text-sm" style={{ color: "#727785" }}>
                <span>Envío</span>
                <span className="font-medium" style={{ color: "#191c23" }}>—</span>
              </div>
              <div className="my-3" style={{ borderTop: "1px solid rgba(207,194,213,0.3)" }}></div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold" style={{ color: "#191c23" }}>Total</span>
                <div className="text-right">
                  <p className="text-xl font-bold" style={{ color: "#6b1e96" }}>
                    {formatCurrencyUSD(order.total_usd)}
                  </p>
                  {order.total_ves && (
                    <p className="text-xs mt-0.5" style={{ color: "#727785" }}>
                      Eq. {formatCurrencyVES(order.total_ves)}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {order.payment_proof_url && (
              <a
                href={order.payment_proof_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 pt-4 flex justify-between items-center text-xs font-bold hover:opacity-80 transition-opacity"
                style={{ color: "#6b1e96", borderTop: "1px solid rgba(207,194,213,0.3)" }}
              >
                <span>Ver comprobante imagen</span>
                <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>open_in_new</span>
              </a>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <button
              onClick={handleDownloadPDF}
              disabled={generatingPdf}
              className="w-full flex justify-center items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-opacity disabled:opacity-50"
              style={{ background: "#f1daff", color: "#6b1e96", cursor: generatingPdf ? "wait" : "pointer" }}
            >
              {generatingPdf ? (
                <span className="w-4 h-4 border-2 border-t-transparent border-[#6b1e96] rounded-full animate-spin"></span>
              ) : (
                <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>download</span>
              )}
              {generatingPdf ? "Generando PDF..." : "Descargar Recibo"}
            </button>
            <button
              className="w-full flex justify-center items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #6b1e96 0%, #531575 100%)" }}
              onClick={() => window.open(`mailto:soporte@dentix.com?subject=Orden ${formatOrderNumber(order.id)}`, '_blank')}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>support_agent</span>
              Contactar Vendedor
            </button>
          </div>

        </div>
      </div>

      {/* Hidden PDF Template */}
      <OrderReceiptTemplate ref={receiptRef} order={order} />
    </div>
  );
}
