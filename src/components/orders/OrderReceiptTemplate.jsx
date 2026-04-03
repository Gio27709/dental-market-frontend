import { forwardRef } from "react";
import PropTypes from "prop-types";
import { formatCurrencyUSD, formatCurrencyVES, formatOrderDate } from "../../utils/formatters";
import { PAYMENT_METHODS } from "../../utils/constants";

// This component is strictly designed for A4 paper proportions (approx 794x1123 pixels at 96DPI)
// We use inline styles heavily to ensure perfect rendering in html2canvas.
const OrderReceiptTemplate = forwardRef(({ order }, ref) => {
  if (!order) return null;

  const totalItems = order.order_items?.reduce((acc, item) => acc + item.quantity, 0) || 0;

  return (
    // Invisible container that stays mounted in the DOM to be captured
    <div style={{ position: "absolute", top: "-9999px", left: "-9999px" }}>
      {/* The actual A4 page container */}
      <div
        ref={ref}
        style={{
          width: "794px",
          minHeight: "1123px",
          backgroundColor: "#ffffff",
          padding: "50px",
          fontFamily: "'Manrope', Helvetica, sans-serif",
          color: "#191c23",
          boxSizing: "border-box",
        }}
      >
        {/* HEADER */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "40px" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: "28px", color: "#6A0DAD", fontWeight: 800, letterSpacing: "-0.5px" }}>
              Digital Atrium
            </h1>
            <p style={{ margin: "4px 0 0 0", fontSize: "14px", color: "#727785" }}>
              Marketplace de Suministros Odontológicos
            </p>
          </div>
          <div style={{ textAlign: "right" }}>
            <h2 style={{ margin: 0, fontSize: "24px", color: "#191c23", fontWeight: 800 }}>RECIBO DE PAGO</h2>
            <p style={{ margin: "4px 0 0 0", fontSize: "14px", color: "#727785", fontWeight: 700 }}>
              ORD-{order.id.substring(0, 6).toUpperCase()}
            </p>
          </div>
        </div>

        <hr style={{ border: "none", borderTop: "2px solid #f3f3f4", marginBottom: "40px" }} />

        {/* ORDER INFO & CUSTOMER INFO */}
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "40px" }}>
          <div>
            <p style={{ margin: "0 0 4px 0", fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px", color: "#727785", fontWeight: 700 }}>Facturar a</p>
            <p style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: "#191c23", textTransform: "capitalize" }}>
              {order.users?.full_name || "Cliente"}
            </p>
            <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "#4d4353", maxWidth: "250px", lineHeight: "1.4" }}>
              {order.shipping_address || "Dirección no especificada"}
            </p>
            <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "#4d4353" }}>
              Tel: {order.contact_phone || "—"}
            </p>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ marginBottom: "15px" }}>
              <p style={{ margin: "0 0 4px 0", fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px", color: "#727785", fontWeight: 700 }}>Fecha de Emisión</p>
              <p style={{ margin: 0, fontSize: "14px", fontWeight: 600 }}>{formatOrderDate(order.created_at)}</p>
            </div>
            <div style={{ marginBottom: "15px" }}>
              <p style={{ margin: "0 0 4px 0", fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px", color: "#727785", fontWeight: 700 }}>Método de Pago</p>
              <p style={{ margin: 0, fontSize: "14px", fontWeight: 600 }}>{PAYMENT_METHODS[order.payment_method]?.label || order.payment_method || "—"}</p>
            </div>
            <div>
              <p style={{ margin: "0 0 4px 0", fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px", color: "#727785", fontWeight: 700 }}>Estado</p>
              <div style={{ 
                display: "inline-block", 
                backgroundColor: order.payment_status === "approved" ? "#dcfce7" : "#fef9c3", 
                color: order.payment_status === "approved" ? "#16a34a" : "#ca8a04", 
                padding: "4px 12px", 
                borderRadius: "100px", 
                fontSize: "12px", 
                fontWeight: 800 
              }}>
                {order.payment_status === "approved" ? "PAGADO" : "PENDIENTE"}
              </div>
            </div>
          </div>
        </div>

        {/* ITEMS TABLE */}
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "40px" }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", padding: "12px 0", borderBottom: "2px solid #e2e2e2", fontSize: "12px", textTransform: "uppercase", color: "#727785", fontWeight: 800 }}>Descripción</th>
              <th style={{ textAlign: "center", padding: "12px 10px", borderBottom: "2px solid #e2e2e2", fontSize: "12px", textTransform: "uppercase", color: "#727785", fontWeight: 800 }}>Cant.</th>
              <th style={{ textAlign: "right", padding: "12px 10px", borderBottom: "2px solid #e2e2e2", fontSize: "12px", textTransform: "uppercase", color: "#727785", fontWeight: 800 }}>Precio Unitario</th>
              <th style={{ textAlign: "right", padding: "12px 0", borderBottom: "2px solid #e2e2e2", fontSize: "12px", textTransform: "uppercase", color: "#727785", fontWeight: 800 }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {order.order_items?.map((item) => (
              <tr key={item.id}>
                <td style={{ padding: "16px 0", borderBottom: "1px solid #f3f3f4" }}>
                  <p style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: "#191c23" }}>{item.products?.name}</p>
                  <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "#727785" }}>Tienda: {item.store_profiles?.business_name || "—"}</p>
                </td>
                <td style={{ padding: "16px 10px", borderBottom: "1px solid #f3f3f4", textAlign: "center", fontSize: "14px", fontWeight: 600 }}>
                  {item.quantity}
                </td>
                <td style={{ padding: "16px 10px", borderBottom: "1px solid #f3f3f4", textAlign: "right", fontSize: "14px" }}>
                  {formatCurrencyUSD(item.unit_price)}
                </td>
                <td style={{ padding: "16px 0", borderBottom: "1px solid #f3f3f4", textAlign: "right", fontSize: "14px", fontWeight: 700 }}>
                  {formatCurrencyUSD(item.unit_price * item.quantity)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* TOTALS */}
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <div style={{ width: "350px", backgroundColor: "#f9f9ff", borderRadius: "16px", padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
              <span style={{ fontSize: "14px", color: "#727785", fontWeight: 600 }}>Subtotal ({totalItems} items)</span>
              <span style={{ fontSize: "14px", fontWeight: 600 }}>{formatCurrencyUSD(order.total_usd)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
              <span style={{ fontSize: "14px", color: "#727785", fontWeight: 600 }}>Tasa de Cambio BCV</span>
              <span style={{ fontSize: "14px", fontWeight: 600 }}>Bs. {order.exchange_rate_at_purchase?.toFixed(2) || "—"}</span>
            </div>
            <hr style={{ border: "none", borderTop: "1px solid #dfb7ff", marginBottom: "16px" }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
              <span style={{ fontSize: "16px", color: "#191c23", fontWeight: 800 }}>Total a Pagar</span>
              <div style={{ textAlign: "right" }}>
                <span style={{ display: "block", fontSize: "28px", color: "#6A0DAD", fontWeight: 800, lineHeight: 1 }}>
                  {formatCurrencyUSD(order.total_usd)}
                </span>
                {order.total_ves && (
                  <span style={{ display: "block", marginTop: "6px", fontSize: "13px", color: "#727785", fontWeight: 700 }}>
                    Equivalent a {formatCurrencyVES(order.total_ves)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER MESSAGE */}
        <div style={{ marginTop: "60px", textAlign: "center" }}>
          <p style={{ fontSize: "12px", color: "#7e7384", margin: "0 0 4px 0" }}>
            Gracias por su compra en Digital Atrium.
          </p>
          <p style={{ fontSize: "11px", color: "#cfc2d5", margin: 0 }}>
            Este es un recibo generado electrónicamente.
          </p>
        </div>
      </div>
    </div>
  );
});

OrderReceiptTemplate.displayName = "OrderReceiptTemplate";

OrderReceiptTemplate.propTypes = {
  order: PropTypes.shape({
    id: PropTypes.string.isRequired,
    created_at: PropTypes.string.isRequired,
    shipping_address: PropTypes.string,
    contact_phone: PropTypes.string,
    payment_method: PropTypes.string,
    payment_status: PropTypes.string,
    total_usd: PropTypes.number,
    total_ves: PropTypes.number,
    exchange_rate_at_purchase: PropTypes.number,
    users: PropTypes.shape({
      full_name: PropTypes.string,
    }),
    order_items: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string,
        quantity: PropTypes.number,
        unit_price: PropTypes.number,
        products: PropTypes.shape({
          name: PropTypes.string,
        }),
        store_profiles: PropTypes.shape({
          business_name: PropTypes.string,
        }),
      })
    ),
  }),
};

export default OrderReceiptTemplate;
