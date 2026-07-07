import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useOrder } from "../../context/OrderContext";
import LoadingSkeleton from "../../components/LoadingSkeleton";
import OrderItemDetail from "../../components/orders/OrderItemDetail";
import ShippingEvidenceGallery from "../../components/orders/ShippingEvidenceGallery";
import { formatOrderNumber, formatOrderDateTime, formatCurrencyUSD, formatCurrencyVES } from "../../utils/formatters";
import { ORDER_STATUS, PAYMENT_METHODS } from "../../utils/constants";

export default function AdminOrderDetail() {
  const { id } = useParams();
  const { fetchOrderById } = useOrder();
  
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

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <LoadingSkeleton variant="title" count={1} />
        <LoadingSkeleton variant="text" count={3} />
        <LoadingSkeleton variant="product-card" count={2} />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm mx-auto max-w-2xl mt-10">
        <div className="text-5xl mb-4">😔</div>
        <h2 className="text-xl font-bold mb-2 text-gray-900">Orden no encontrada</h2>
        <p className="text-sm text-gray-500 mb-6">{error || "No se pudo cargar esta orden"}</p>
        <Link to="/admin/orders" className="text-sm font-bold text-primary-600 hover:underline">
          &larr; Volver a todas las órdenes
        </Link>
      </div>
    );
  }

  const getOverallDeliveryStatus = () => {
    if (!order) return "pending";
    if (order.status === "cancelled" || order.status === "rejected" || order.payment_status === "failed") {
      return order.payment_status === "failed" ? "failed" : order.status;
    }
    const items = order.order_items || [];
    if (items.length > 0 && items.every((i) => i.delivery_status === "delivered")) return "delivered";
    const statuses = items.map((i) => i.delivery_status);
    if (statuses.some((s) => ["shipped", "picked_up", "arrived", "delivered"].includes(s))) return "shipped";
    if (statuses.some((s) => s === "approved") || order.payment_status === "approved") return "approved";
    return "pending";
  };

  const overallStatus = getOverallDeliveryStatus();
  const displayStatusInfo = ORDER_STATUS[overallStatus] || ORDER_STATUS.pending;
  const storeNames = [...new Set((order.order_items || []).map((item) => item.store_profiles?.business_name).filter(Boolean))];

  return (
    <div className="w-full mx-auto animate-fade-in-up" style={{ minHeight: "100%" }}>
      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <Link to="/admin/orders" style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: 600, color: "#6b1e96", textDecoration: "none", marginBottom: "12px", transition: "opacity 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.opacity = 0.8} onMouseLeave={(e) => e.currentTarget.style.opacity = 1}>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Volver a órdenes
          </Link>
          <h2 style={{ fontSize: "22px", fontWeight: 800, color: "#1a0a2e", margin: 0, letterSpacing: "-0.02em", display: "flex", alignItems: "center", gap: "10px" }}>
            Detalle de Orden {formatOrderNumber(order.id)}
          </h2>
          <p style={{ fontSize: "13px", color: "#9ca3af", margin: "4px 0 0 0" }}>
            Creada el {formatOrderDateTime(order.created_at)}
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
           <div style={{ padding: "6px 14px", borderRadius: "20px", background: order.payment_status === 'approved' ? "rgba(16,185,129,0.1)" : order.payment_status === 'rejected' ? "rgba(220,38,38,0.1)" : "rgba(245,158,11,0.1)", color: order.payment_status === 'approved' ? "#059669" : order.payment_status === 'rejected' ? "#dc2626" : "#d97706", fontSize: "12px", fontWeight: 700 }}>
             Pago: {order.payment_status === 'approved' ? 'Aprobado' : order.payment_status === 'rejected' ? 'Rechazado' : 'Pendiente / Revisión'}
           </div>
           <div style={{ padding: "6px 14px", borderRadius: "20px", background: "rgba(107,30,150,0.1)", color: "#6b1e96", fontSize: "12px", fontWeight: 700 }}>
             Envío: {displayStatusInfo.label}
           </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "24px", alignItems: "start" }}>
        {/* Left Column (Products, Notes, Customer) */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", flex: "1 1 60%" }}>
          
          {/* Products */}
          <div style={{ background: "#fff", borderRadius: "16px", padding: "24px", border: "1px solid #f0f0f0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
            <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#1a0a2e", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#6b1e96" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
              </svg>
              Productos ({order.order_items?.length || 0})
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {order.order_items?.map((item) => (
                <div key={item.id} style={{ borderBottom: "1px dashed #e5e7eb", paddingBottom: "16px" }}>
                  <OrderItemDetail item={item} />
                  
                  {/* EVIDENCE GALLERY */}
                  <div style={{ paddingLeft: "72px", marginTop: "12px" }}>
                    <ShippingEvidenceGallery item={item} />
                  </div>

                  {item.tracking_code && (
                     <div style={{ marginTop: "12px", paddingLeft: "72px", fontSize: "12px", color: "#4b5563" }}>
                       <strong>Tracking:</strong> {item.tracking_code} ({item.shipping_carrier || 'No especificado'})
                     </div>
                  )}
                  {item.shipped_at && (
                     <div style={{ marginTop: "6px", paddingLeft: "72px", fontSize: "11px", color: "#6b7280", display: "flex", alignItems: "center", gap: "6px" }}>
                       <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                         <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                       </svg>
                       <span>Despachado: <strong style={{ color: "#1f2937" }}>{new Date(item.shipped_at).toLocaleString("es-VE", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</strong></span>
                     </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          {order.notes && (
            <div style={{ background: "#fff", borderRadius: "16px", padding: "24px", border: "1px solid #f0f0f0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#1a0a2e", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#6b1e96" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
                Notas del Pedido
              </h3>
              <p style={{ fontSize: "13px", color: "#4b5563", margin: 0, lineHeight: 1.5 }}>{order.notes}</p>
            </div>
          )}

          {/* Customer info */}
          <div style={{ background: "#fff", borderRadius: "16px", padding: "24px", border: "1px solid #f0f0f0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
            <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#1a0a2e", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#6b1e96" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
              Cliente
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", fontSize: "13px" }}>
              <div>
                <div style={{ color: "#9ca3af", marginBottom: "4px" }}>Nombre Comprador</div>
                <div style={{ fontWeight: 600, color: "#1f2937" }}>{order.users?.full_name || "N/A"}</div>
              </div>
              <div>
                <div style={{ color: "#9ca3af", marginBottom: "4px" }}>Email Comprador</div>
                <div style={{ fontWeight: 600, color: "#1f2937" }}>{order.users?.email || "N/A"}</div>
              </div>
              <div>
                <div style={{ color: "#9ca3af", marginBottom: "4px" }}>Nombre Destinatario</div>
                <div style={{ fontWeight: 600, color: "#1f2937" }}>{order.receiver_name || order.users?.full_name || "N/A"}</div>
              </div>
              {order.receiver_cedula && (
                <div>
                  <div style={{ color: "#9ca3af", marginBottom: "4px" }}>Cédula / RIF Destinatario</div>
                  <div style={{ fontWeight: 600, color: "#1f2937" }}>{order.receiver_cedula}</div>
                </div>
              )}
              <div>
                <div style={{ color: "#9ca3af", marginBottom: "4px" }}>Email Destinatario</div>
                <div style={{ fontWeight: 600, color: "#1f2937" }}>{order.receiver_email || order.users?.email || "N/A"}</div>
              </div>
              <div>
                <div style={{ color: "#9ca3af", marginBottom: "4px" }}>Teléfono de Contacto</div>
                <div style={{ fontWeight: 600, color: "#1f2937" }}>{order.contact_phone || "N/A"}</div>
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <div style={{ color: "#9ca3af", marginBottom: "4px" }}>Dirección de Envío</div>
                <div style={{ fontWeight: 600, color: "#1f2937" }}>{order.shipping_address || "N/A"}</div>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column (Summary & Payer) */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", flex: "1 1 340px" }}>
          
          {/* Summary Card */}
          <div style={{ background: "#fff", borderRadius: "16px", padding: "24px", border: "1px solid #f0f0f0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
            <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#1a0a2e", marginBottom: "16px" }}>Resumen de Pago</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "13px" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#6b7280" }}>Tiendas</span>
                <span style={{ fontWeight: 600, color: "#1f2937", textAlign: "right" }}>{storeNames.length > 0 ? storeNames.join(", ") : "—"}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#6b7280" }}>Método Pago</span>
                <span style={{ fontWeight: 600, color: "#1f2937", textTransform: "capitalize" }}>{PAYMENT_METHODS[order.payment_method]?.label || order.payment_method || "—"}</span>
              </div>
              <div style={{ height: "1px", background: "#e5e7eb", margin: "4px 0" }}></div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: 700, color: "#111827" }}>Total USD</span>
                <span style={{ fontSize: "18px", fontWeight: 800, color: "#6b1e96" }}>{formatCurrencyUSD(order.total_usd)}</span>
              </div>
              {order.total_ves && (
                 <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "-8px" }}>
                   <span style={{ fontSize: "12px", color: "#6b7280" }}>Eq. {formatCurrencyVES(order.total_ves)}</span>
                 </div>
              )}
            </div>

            {order.payment_proof_url && (
              <a
                href={order.payment_proof_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", width: "100%", padding: "10px", marginTop: "20px", borderRadius: "8px", background: "rgba(107,30,150,0.05)", border: "1px solid rgba(107,30,150,0.1)", color: "#6b1e96", fontSize: "12px", fontWeight: 700, textDecoration: "none", transition: "all 0.2s"
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#6b1e96"; e.currentTarget.style.color = "#c3ff00"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(107,30,150,0.05)"; e.currentTarget.style.color = "#6b1e96"; }}
              >
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                </svg>
                Ver Comprobante
              </a>
            )}
          </div>

          {/* Payer Info */}
          {(order.payer_name || order.reference_number) && (
            <div style={{ background: "#fff", borderRadius: "16px", padding: "24px", border: "1px solid #f0f0f0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
              <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#1a0a2e", marginBottom: "16px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Datos del Pagador</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "12px" }}>
                {order.payer_name && (
                  <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
                    <span style={{ color: "#6b7280" }}>Titular</span>
                    <span style={{ fontWeight: 600, color: "#1f2937", textAlign: "right" }}>{order.payer_name}</span>
                  </div>
                )}
                {order.payer_cedula && (
                  <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
                    <span style={{ color: "#6b7280" }}>Cédula</span>
                    <span style={{ fontWeight: 600, color: "#1f2937", fontFamily: "monospace", textAlign: "right" }}>{order.payer_cedula}</span>
                  </div>
                )}
                {order.reference_number && (
                  <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
                    <span style={{ color: "#6b7280" }}>Referencia</span>
                    <span style={{ fontWeight: 700, color: "#6b1e96", fontFamily: "monospace", textAlign: "right" }}>{order.reference_number}</span>
                  </div>
                )}
                {order.payment_date && (
                  <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
                    <span style={{ color: "#6b7280" }}>Fecha Reportada</span>
                    <span style={{ fontWeight: 600, color: "#1f2937", textAlign: "right" }}>{new Date(order.payment_date).toLocaleDateString("es-VE")}</span>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
