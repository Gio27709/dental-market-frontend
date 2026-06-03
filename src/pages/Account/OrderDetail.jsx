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
import ShippedBadge from "../../components/orders/ShippedBadge";
import OrderReceiptTemplate from "../../components/orders/OrderReceiptTemplate";
import ShippingEvidenceGallery from "../../components/orders/ShippingEvidenceGallery";
import { createReturnRequestAPI, submitRefundDetailsAPI } from "../../services/api";
import toast from "react-hot-toast";
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
  indigo: { bg: "#eef2ff", text: "#4f46e5", dot: "#4f46e5" },
  gray: { bg: "#f3f4f6", text: "#4b5563", dot: "#4b5563" },
};

function RefundRequestBox({ item, order, refundReq, onRefresh }) {
  const isZellePayment = order.payment_method === "zelle";
  const [method, setMethod] = useState(isZellePayment ? "zelle" : "pago_movil"); // pago_movil, transferencia, zelle
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    bank: "",
    ci: "",
    phone: "",
    accountNumber: "",
    holder: "",
    email: "",
  });

  const VENEZUELAN_BANKS = [
    "Banesco", "Banco de Venezuela", "Mercantil", "Provincial", 
    "BNC", "Bancaribe", "Exterior", "Banplus"
  ];

  useEffect(() => {
    if (isZellePayment) {
      setMethod("zelle");
    } else {
      setMethod("pago_movil");
    }
  }, [isZellePayment]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const details = {
        method,
        bank: formData.bank,
        ci: formData.ci,
        phone: formData.phone,
        accountNumber: formData.accountNumber,
        holder: formData.holder,
        email: formData.email,
      };

      // Basic validations
      if (method === "pago_movil") {
        if (!details.bank || !details.ci || !details.phone) {
          toast.error("Por favor completa todos los campos de Pago Móvil.");
          setLoading(false);
          return;
        }
      } else if (method === "transferencia") {
        if (!details.bank || !details.accountNumber || !details.holder || !details.ci) {
          toast.error("Por favor completa todos los campos de Transferencia.");
          setLoading(false);
          return;
        }
        if (details.accountNumber.replace(/\D/g, "").length !== 20) {
          toast.error("El número de cuenta debe tener exactamente 20 dígitos.");
          setLoading(false);
          return;
        }
      } else if (method === "zelle") {
        if (!details.email || !details.holder) {
          toast.error("Por favor completa los campos de Zelle.");
          setLoading(false);
          return;
        }
      }

      await submitRefundDetailsAPI(refundReq.id, details);
      toast.success("¡Datos de reembolso registrados exitosamente!");
      if (onRefresh) onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.error || "Error al enviar los datos.");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, val) => {
    setFormData(prev => ({ ...prev, [field]: val }));
  };

  if (!refundReq) {
    return (
      <div className="flex items-center gap-1.5 mt-2 px-2.5 py-1.5 rounded-lg" style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)" }}>
        <span className="text-xs">⏳</span>
        <span className="text-[11px] font-bold" style={{ color: "#92400e" }}>
          Reembolso en proceso — te notificaremos cuando se complete.
        </span>
      </div>
    );
  }

  const { status, refund_details, amount_usd, amount_ves, admin_notes, processed_at } = refundReq;

  return (
    <div className="mt-3 rounded-2xl p-4 bg-white border border-purple-100 shadow-sm transition-all duration-200 hover:shadow-md">
      {/* Estado: PENDIENTE (Formulario) */}
      {status === "pending" && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5" style={{ borderBottom: "1px solid rgba(107,30,150,0.08)" }}>
            <div>
              <h4 className="font-extrabold text-sm text-[#1a0a2e] flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[#6b1e96]">monetization_on</span>
                Completar Datos de Reembolso
              </h4>
              <p className="text-[11px] text-gray-500 mt-0.5">
                Ingresa los datos para recibir tu transferencia manual por administración.
              </p>
            </div>
            <div className="text-right self-start sm:self-auto">
              <span className="block font-black text-[#6b1e96] text-sm">
                ${amount_usd?.toFixed(2)}
              </span>
              {amount_ves && (
                <span className="block text-[10px] text-gray-400">
                  ≈ Bs. {amount_ves?.toFixed(2)}
                </span>
              )}
            </div>
          </div>

          {/* Selector de Método Dinámico y Aestetic */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">
              Método de Reembolso
            </label>
            {isZellePayment ? (
              <div className="bg-purple-50/70 border border-purple-100 rounded-xl p-3.5 flex items-start gap-3">
                <span className="material-symbols-outlined text-[#6b1e96] mt-0.5" style={{ fontSize: "20px" }}>alternate_email</span>
                <div>
                  <span className="block text-xs font-black text-[#6b1e96]">Reembolso exclusivo vía Zelle</span>
                  <span className="block text-[10px] text-gray-500 mt-1 leading-relaxed">
                    Debido a que tu pago original fue procesado mediante Zelle, tu reembolso se emitirá únicamente por esta misma vía.
                  </span>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { id: "pago_movil", label: "Pago Móvil", icon: "phone_iphone" },
                  { id: "transferencia", label: "Transferencia Bancaria", icon: "account_balance" }
                ].map(m => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMethod(m.id)}
                    className={`flex flex-col sm:flex-row items-center justify-center gap-2 py-3 px-3 rounded-xl text-xs font-bold transition-all border ${
                      method === m.id
                        ? "bg-[#6b1e96] text-white border-[#6b1e96] shadow-sm scale-[1.01]"
                        : "bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">{m.icon}</span>
                    <span>{m.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Form Fields */}
          <div className="space-y-3 pt-1">
            {method === "pago_movil" && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-600 mb-1">Banco *</label>
                  <select
                    value={formData.bank}
                    onChange={e => handleInputChange("bank", e.target.value)}
                    className="w-full p-2.5 border border-gray-200 rounded-xl text-xs outline-none focus:border-[#6b1e96]"
                    required
                  >
                    <option value="">Selecciona...</option>
                    {VENEZUELAN_BANKS.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-600 mb-1">Cédula *</label>
                  <input
                    type="text"
                    placeholder="V-12345678"
                    value={formData.ci}
                    onChange={e => handleInputChange("ci", e.target.value)}
                    className="w-full p-2.5 border border-gray-200 rounded-xl text-xs outline-none focus:border-[#6b1e96]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-600 mb-1">Teléfono Pago Móvil *</label>
                  <input
                    type="tel"
                    placeholder="04141234567"
                    value={formData.phone}
                    onChange={e => handleInputChange("phone", e.target.value)}
                    className="w-full p-2.5 border border-gray-200 rounded-xl text-xs outline-none focus:border-[#6b1e96]"
                    required
                  />
                </div>
              </div>
            )}

            {method === "transferencia" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold text-gray-600 mb-1">Número de Cuenta (20 dígitos) *</label>
                  <input
                    type="text"
                    maxLength={20}
                    placeholder="01020000000000000000"
                    value={formData.accountNumber}
                    onChange={e => handleInputChange("accountNumber", e.target.value.replace(/\D/g, ""))}
                    className="w-full p-2.5 border border-gray-200 rounded-xl text-xs outline-none focus:border-[#6b1e96] font-mono tracking-widest text-center"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-600 mb-1">Banco *</label>
                  <select
                    value={formData.bank}
                    onChange={e => handleInputChange("bank", e.target.value)}
                    className="w-full p-2.5 border border-gray-200 rounded-xl text-xs outline-none focus:border-[#6b1e96]"
                    required
                  >
                    <option value="">Selecciona...</option>
                    {VENEZUELAN_BANKS.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-600 mb-1">Titular de Cuenta *</label>
                  <input
                    type="text"
                    placeholder="Nombre Completo"
                    value={formData.holder}
                    onChange={e => handleInputChange("holder", e.target.value)}
                    className="w-full p-2.5 border border-gray-200 rounded-xl text-xs outline-none focus:border-[#6b1e96]"
                    required
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold text-gray-600 mb-1">Cédula del Titular *</label>
                  <input
                    type="text"
                    placeholder="V-12345678"
                    value={formData.ci}
                    onChange={e => handleInputChange("ci", e.target.value)}
                    className="w-full p-2.5 border border-gray-200 rounded-xl text-xs outline-none focus:border-[#6b1e96]"
                    required
                  />
                </div>
              </div>
            )}

            {method === "zelle" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-600 mb-1">Correo de Zelle *</label>
                  <input
                    type="email"
                    placeholder="ejemplo@correo.com"
                    value={formData.email}
                    onChange={e => handleInputChange("email", e.target.value)}
                    className="w-full p-2.5 border border-gray-200 rounded-xl text-xs outline-none focus:border-[#6b1e96]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-600 mb-1">Titular de Zelle *</label>
                  <input
                    type="text"
                    placeholder="Nombre Completo"
                    value={formData.holder}
                    onChange={e => handleInputChange("holder", e.target.value)}
                    className="w-full p-2.5 border border-gray-200 rounded-xl text-xs outline-none focus:border-[#6b1e96]"
                    required
                  />
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider text-white transition-all shadow-sm hover:opacity-90 flex items-center justify-center gap-1.5 disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, #6b1e96, #531575)" }}
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin"></span>
            ) : (
              <span className="material-symbols-outlined text-[14px]">send</span>
            )}
            {loading ? "Enviando..." : "Enviar Datos de Reembolso"}
          </button>
        </form>
      )}

      {/* Estado: PROCESSING */}
      {status === "processing" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-2" style={{ borderBottom: "1px dashed rgba(107,30,150,0.1)" }}>
            <span className="text-xs font-bold text-[#6b1e96] flex items-center gap-1.5">
              <span className="material-symbols-outlined animate-pulse text-[16px]">hourglass_empty</span>
              Reembolso en Proceso
            </span>
            <span className="font-extrabold text-sm text-gray-800">${amount_usd?.toFixed(2)}</span>
          </div>
          <p className="text-[11px] leading-relaxed text-gray-500">
            Hemos recibido tus datos. El equipo de administración procesará tu transferencia manual y te notificaremos cuando esté lista.
          </p>
          {refund_details && (
            <div className="bg-[#fcf8ff] p-3 rounded-xl border border-purple-50 text-[10px] text-gray-700 space-y-1">
              <div className="font-bold text-[#6b1e96] uppercase text-[9px] mb-1.5 pb-1" style={{ borderBottom: "1px dashed rgba(107,30,150,0.1)" }}>
                Datos Registrados ({refund_details.method === 'pago_movil' ? 'Pago Móvil' : refund_details.method === 'transferencia' ? 'Transferencia' : 'Zelle'})
              </div>
              {refund_details.method === 'pago_movil' && (
                <>
                  <div><strong>Banco:</strong> {refund_details.bank}</div>
                  <div><strong>Cédula:</strong> {refund_details.ci}</div>
                  <div><strong>Teléfono:</strong> {refund_details.phone}</div>
                </>
              )}
              {refund_details.method === 'transferencia' && (
                <>
                  <div><strong>Banco:</strong> {refund_details.bank}</div>
                  <div><strong>Titular:</strong> {refund_details.holder}</div>
                  <div><strong>Cédula:</strong> {refund_details.ci}</div>
                  <div className="font-mono bg-white p-2 rounded-lg mt-1.5 text-[10px] text-center border border-purple-50 select-all">
                    {refund_details.accountNumber}
                  </div>
                </>
              )}
              {refund_details.method === 'zelle' && (
                <>
                  <div><strong>Titular:</strong> {refund_details.holder}</div>
                  <div><strong>Correo:</strong> {refund_details.email}</div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Estado: COMPLETED */}
      {status === "completed" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-2" style={{ borderBottom: "1px dashed rgba(16,185,129,0.15)" }}>
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">check_circle</span>
              Reembolso Completado
            </span>
            <span className="font-extrabold text-sm text-emerald-600">${amount_usd?.toFixed(2)}</span>
          </div>
          <p className="text-[11px] leading-relaxed text-gray-500">
            Tu reembolso fue procesado exitosamente{processed_at ? ` el ${new Date(processed_at).toLocaleDateString("es-VE")}` : ""}.
          </p>
          {admin_notes && (
            <div className="bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100 text-[10px] text-emerald-800">
              <strong>Referencia de Pago:</strong> {admin_notes}
            </div>
          )}
        </div>
      )}

      {/* Estado: DENIED */}
      {status === "denied" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-2" style={{ borderBottom: "1px dashed rgba(239,68,68,0.15)" }}>
            <span className="text-xs font-bold text-red-600 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">cancel</span>
              Reembolso Denegado
            </span>
            <span className="font-extrabold text-sm text-red-600">${amount_usd?.toFixed(2)}</span>
          </div>
          <p className="text-[11px] leading-relaxed text-gray-500">
            Tu solicitud de reembolso fue denegada por administración.
          </p>
          {admin_notes && (
            <div className="bg-red-50 p-2.5 rounded-xl border border-red-100 text-[10px] text-red-800">
              <strong>Motivo:</strong> {admin_notes}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function OrderDetail() {
  const { id } = useParams();
  const { fetchOrderById, confirmDelivery, loading: ctxLoading } = useOrder();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [returnModal, setReturnModal] = useState(null); // { item_id, product_name }
  const [returnReason, setReturnReason] = useState("");
  const [submittingReturn, setSubmittingReturn] = useState(false);
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

  const handleReturnRequest = async () => {
    if (returnReason.trim().length < 10) {
      toast.error("El motivo debe tener al menos 10 caracteres.");
      return;
    }
    setSubmittingReturn(true);
    try {
      await createReturnRequestAPI({
        order_item_id: returnModal.item_id,
        reason: returnReason.trim(),
      });
      toast.success("Solicitud de devolución enviada. Te notificaremos cuando sea revisada.");
      setReturnModal(null);
      setReturnReason("");
    } catch (err) {
      toast.error(err.response?.data?.error || "Error al enviar la solicitud.");
    } finally {
      setSubmittingReturn(false);
    }
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
    if (order.status === "cancelled" || order.status === "rejected" || order.payment_status === "failed") {
      return order.payment_status === "failed" ? "failed" : order.status;
    }

    const items = order.order_items || [];
    
    // Si todos los artículos están cancelados, la orden se considera cancelada
    if (
      items.length > 0 &&
      items.every((i) => i.delivery_status === "cancelled")
    ) {
      return "cancelled";
    }

    if (
      items.length > 0 &&
      items.every((i) => i.delivery_status === "delivered")
    ) {
      return "delivered";
    }

    const ageInHours = (Date.now() - new Date(order.created_at).getTime()) / (1000 * 60 * 60);
    const isExpired = order.payment_status === "pending" && !order.payment_proof_url && ageInHours >= 2;

    const statuses = items.map((i) => i.delivery_status);
    if (statuses.some((s) => s === "shipped" || s === "delivered")) return "shipped";
    if (
      statuses.some((s) => s === "approved") ||
      order.payment_status === "approved"
    )
      return "approved";
      
    if (isExpired) return "expired";
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

  const ageInHours = order ? (Date.now() - new Date(order.created_at).getTime()) / (1000 * 60 * 60) : 0;
  const isExpired = order?.payment_status === "pending" && !order.payment_proof_url && ageInHours >= 2;

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
              <div className="flex flex-wrap items-center gap-2 self-start">
                {overallStatus === "shipped" ? (
                  <ShippedBadge size="md" label={displayStatusInfo.label} />
                ) : (
                  <span
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold"
                    style={{ backgroundColor: badgeStyle.bg, color: badgeStyle.text }}
                  >
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: badgeStyle.dot }}></span>
                    {displayStatusInfo.label}
                  </span>
                )}

                {overallStatus === "cancelled" && order.escrow_status === "refunded" && (
                  <span
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-extrabold"
                    style={{ backgroundColor: "#dcfce7", color: "#059669" }}
                  >
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "#059669" }}></span>
                    💵 Reembolsado
                  </span>
                )}
              </div>
            </div>
            <OrderTimeline status={overallStatus} />
          </div>

          {/* Pending Proof Alert Banner */}
          {!order.payment_proof_url && order.payment_status === "pending" && !isExpired && (
            <div className="rounded-2xl p-5 sm:p-6 mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4" style={{ background: "linear-gradient(135deg, #fefce8 0%, #fef9c3 100%)", border: "1px solid #fde68a" }}>
              <div className="flex items-start gap-4">
                <span className="material-symbols-outlined mt-0.5 flex-shrink-0" style={{ color: "#ca8a04", fontSize: "24px" }}>warning</span>
                <div className="flex-1">
                  <h3 className="font-bold text-sm mb-1" style={{ color: "#92400e" }}>Comprobante de pago requerido</h3>
                  <p className="text-xs leading-relaxed" style={{ color: "#a16207" }}>
                    Tu orden está reservada pero aún no has subido tu comprobante. Haz clic en &quot;Completar Pago&quot; para acceder a las instrucciones y enviar tu captura para confirmar tu pedido.
                  </p>
                </div>
              </div>
              <Link 
                to={`/order-success/${order.order_group_id || order.id}`}
                className="w-full sm:w-auto text-center px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-opacity hover:opacity-90 flex-shrink-0"
                style={{ background: "#6b1e96", color: "#c3ff00" }}
              >
                Completar Pago Ahora
              </Link>
            </div>
          )}

          {/* Expired Order Banner */}
          {isExpired && (
            <div className="rounded-2xl p-5 sm:p-6 mb-4 flex flex-col items-start gap-4" style={{ background: "linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)", border: "1px solid #fca5a5" }}>
              <div className="flex items-start gap-4">
                <span className="material-symbols-outlined mt-0.5 flex-shrink-0" style={{ color: "#dc2626", fontSize: "24px" }}>timer_off</span>
                <div className="flex-1">
                  <h3 className="font-bold text-sm mb-1" style={{ color: "#991b1b" }}>Plazo de pago agotado</h3>
                  <p className="text-xs leading-relaxed" style={{ color: "#b91c1c" }}>
                    El tiempo de gracia de 2 horas para recibir tu pago ha expirado. Si ya hiciste el pago, por favor contacta a soporte inmediatamente para restaurar la validez de esta orden.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tracking */}
          {shippedItems.length > 0 &&
            shippedItems.map(
              (item) =>
                (item.tracking_code || item.shipped_at) && (
                  <div key={`tracking-${item.id}`}>
                    {item.tracking_code && (
                      <TrackingInfo
                        tracking_code={item.tracking_code}
                        shipping_carrier={item.shipping_carrier}
                      />
                    )}
                    {item.shipped_at && (
                      <div className="mt-2 bg-white rounded-2xl px-5 py-3 flex items-center gap-2" style={{ boxShadow: "0 4px 24px rgba(107,30,150,0.04)" }}>
                        <span className="material-symbols-outlined text-[16px]" style={{ color: "#6b1e96" }}>schedule</span>
                        <span className="text-xs font-medium" style={{ color: "#727785" }}>Despachado el</span>
                        <span className="text-xs font-bold" style={{ color: "#191c23" }}>
                          {new Date(item.shipped_at).toLocaleString("es-VE", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    )}
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
                  
                  {/* CANCELLED ITEM ALERT */}
                  {item.delivery_status === "cancelled" && (
                    <div className="ml-[68px] sm:ml-20 mt-2 rounded-xl p-3" style={{ background: "linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)", border: "1px solid #fca5a5" }}>
                      <div className="flex items-start gap-2">
                        <span className="text-base flex-shrink-0">🚫</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold" style={{ color: "#991b1b" }}>
                            Producto cancelado{item.cancelled_by === "store" ? " por la tienda" : ""}
                          </p>
                          {item.cancellation_reason && (
                            <p className="text-xs mt-0.5" style={{ color: "#b91c1c" }}>
                              Motivo: {item.cancellation_reason}
                            </p>
                          )}
                          {item.cancelled_at && (
                            <p className="text-[10px] mt-1" style={{ color: "#dc2626", opacity: 0.7 }}>
                              {new Date(item.cancelled_at).toLocaleDateString("es-VE", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                            </p>
                          )}
                          {order.payment_status === "approved" && (
                            <RefundRequestBox
                              item={item}
                              order={order}
                              refundReq={order.refund_requests?.find(r => r.item_id === item.id)}
                              onRefresh={async () => {
                                const refreshed = await fetchOrderById(id);
                                if (refreshed.success) setOrder(refreshed.order);
                              }}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* EVIDENCE GALLERY (If present) */}
                  <div className="pl-[68px] sm:pl-20">
                    <ShippingEvidenceGallery item={item} />
                  </div>

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

                  {/* Return Request Button */}
                  {(item.delivery_status === "shipped" || item.delivery_status === "delivered") && (
                    <div className="pl-16 md:pl-20 mt-2">
                      <button
                        onClick={() => setReturnModal({ item_id: item.id, product_name: item.products?.name || "Producto" })}
                        className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                        style={{ color: "#dc2626", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)" }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>undo</span>
                        Solicitar Devolución
                      </button>
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
              {order.order_items?.find(i => i.shipped_at) && (
                <li className="flex justify-between items-start gap-4">
                  <span style={{ color: "#727785" }}>Fecha Despacho</span>
                  <span className="font-medium text-right" style={{ color: "#191c23" }}>
                    {new Date(order.order_items.find(i => i.shipped_at).shipped_at).toLocaleString("es-VE", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </span>
                </li>
              )}
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

            {/* ── Datos del Pagador ── */}
            {(order.payer_name || order.reference_number) && (
              <div className="mt-4 pt-4" style={{ borderTop: "1px solid rgba(207,194,213,0.3)" }}>
                <span className="block text-[10px] uppercase font-bold mb-2" style={{ color: "#727785" }}>
                  Datos del Pagador
                </span>
                <div className="space-y-1.5 text-xs">
                  {order.payer_name && (
                    <div className="flex justify-between gap-2">
                      <span style={{ color: "#727785" }}>Titular</span>
                      <span className="font-medium text-right" style={{ color: "#191c23" }}>{order.payer_name}</span>
                    </div>
                  )}
                  {order.payer_phone && (
                    <div className="flex justify-between gap-2">
                      <span style={{ color: "#727785" }}>Teléfono</span>
                      <span className="font-medium" style={{ color: "#191c23" }}>{order.payer_phone}</span>
                    </div>
                  )}
                  {order.payer_cedula && (
                    <div className="flex justify-between gap-2">
                      <span style={{ color: "#727785" }}>Cédula</span>
                      <span className="font-medium font-mono" style={{ color: "#191c23" }}>{order.payer_cedula}</span>
                    </div>
                  )}
                  {order.payer_email && (
                    <div className="flex justify-between gap-2">
                      <span style={{ color: "#727785" }}>Email</span>
                      <span className="font-medium" style={{ color: "#191c23" }}>{order.payer_email}</span>
                    </div>
                  )}
                  {order.reference_number && (
                    <div className="flex justify-between gap-2">
                      <span style={{ color: "#727785" }}>Referencia</span>
                      <span className="font-bold font-mono" style={{ color: "#6b1e96" }}>{order.reference_number}</span>
                    </div>
                  )}
                  {order.payment_date && (
                    <div className="flex justify-between gap-2">
                      <span style={{ color: "#727785" }}>Fecha Pago</span>
                      <span className="font-medium" style={{ color: "#191c23" }}>
                        {new Date(order.payment_date).toLocaleDateString("es-VE")}
                      </span>
                    </div>
                  )}
                </div>
              </div>
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

      {/* ── Return Request Modal ── */}
      {returnModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => !submittingReturn && (setReturnModal(null), setReturnReason(""))}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-7 animate-fade-in-up">
            <h3 className="text-lg font-extrabold mb-1" style={{ color: "#1a0a2e" }}>
              🔄 Solicitar Devolución
            </h3>
            <p className="text-xs font-semibold mb-4 px-3 py-2 rounded-lg" style={{ background: "rgba(107,30,150,0.06)", color: "#6b1e96" }}>
              {returnModal.product_name}
            </p>

            <div className="mb-4 px-3 py-2 rounded-lg text-xs font-medium" style={{ background: "#fffbeb", border: "1px solid rgba(245,158,11,0.2)", color: "#92400e" }}>
              Tu solicitud será revisada por el equipo de administración. Te notificaremos el resultado.
            </div>

            <div>
              <label className="block text-xs font-bold mb-1.5" style={{ color: "#374151" }}>
                Motivo de la devolución <span style={{ color: "#dc2626" }}>*</span>
              </label>
              <textarea
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
                className="w-full p-3 border rounded-xl text-sm outline-none resize-vertical"
                style={{ borderColor: "#e5e7eb", minHeight: "90px" }}
                placeholder="Describe el motivo: producto defectuoso, no corresponde con la descripción, etc."
                autoFocus
                onFocus={(e) => { e.target.style.borderColor = "#6b1e96"; e.target.style.boxShadow = "0 0 0 3px rgba(107,30,150,0.08)"; }}
                onBlur={(e) => { e.target.style.borderColor = "#e5e7eb"; e.target.style.boxShadow = "none"; }}
              />
              <p className="text-[10px] mt-1" style={{ color: "#9ca3af" }}>Mínimo 10 caracteres.</p>
            </div>

            <div className="flex gap-3 mt-5">
              <button
                onClick={() => { setReturnModal(null); setReturnReason(""); }}
                disabled={submittingReturn}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold"
                style={{ background: "#f3f4f6", color: "#6b7280" }}
              >
                Cancelar
              </button>
              <button
                onClick={handleReturnRequest}
                disabled={submittingReturn || returnReason.trim().length < 10}
                className="flex-[2] py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-opacity"
                style={{
                  background: submittingReturn || returnReason.trim().length < 10
                    ? "rgba(107,30,150,0.4)"
                    : "linear-gradient(135deg, #6b1e96, #531575)",
                  color: "#c3ff00",
                  cursor: submittingReturn ? "not-allowed" : "pointer",
                }}
              >
                {submittingReturn ? (
                  <>
                    <span className="w-4 h-4 border-2 border-t-transparent border-[#c3ff00] rounded-full animate-spin" />
                    Enviando...
                  </>
                ) : (
                  "Enviar Solicitud"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
