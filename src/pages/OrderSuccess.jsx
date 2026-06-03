import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useOrder } from "../context/OrderContext";
import PaymentProofUploader from "../components/orders/PaymentProofUploader";
import { formatCurrencyVES, formatCurrencyUSD } from "../utils/formatters";

export default function OrderSuccess() {
  const { id } = useParams(); // This can be an order_group_id OR a single order_id
  const { fetchOrdersByGroup, fetchOrderById } = useOrder();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadOrders = async () => {
      setLoading(true);

      // Try fetching as a group first (new multi-store flow)
      const groupResult = await fetchOrdersByGroup(id);
      if (groupResult.success && groupResult.orders.length > 0) {
        setOrders(groupResult.orders);
      } else {
        // Fallback: single order (backward compat with old URLs)
        const singleResult = await fetchOrderById(id);
        if (singleResult.success) {
          setOrders([singleResult.order]);
        } else {
          setError(singleResult.error || "No pudimos cargar los detalles de tu orden.");
        }
      }
      setLoading(false);
    };

    if (id) loadOrders();
  }, [id, fetchOrdersByGroup, fetchOrderById]);

  const handleProofUploaded = async () => {
    // Refresh all orders to show the uploaded state
    const groupResult = await fetchOrdersByGroup(id);
    if (groupResult.success && groupResult.orders.length > 0) {
      setOrders(groupResult.orders);
    } else {
      const singleResult = await fetchOrderById(id);
      if (singleResult.success) setOrders([singleResult.order]);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error || orders.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-2">Error</h2>
          <p className="text-gray-600">{error || "Orden no encontrada"}</p>
          <Link to="/account" className="mt-4 text-primary-600 hover:underline">
            Ir a mi cuenta
          </Link>
        </div>
      </div>
    );
  }

  // Calculate grand totals
  const grandTotalUsd = orders.reduce((acc, o) => acc + (o.total_usd || 0), 0);
  const grandTotalVes = orders.reduce((acc, o) => acc + (o.total_ves || 0), 0);
  const primaryOrder = orders[0];
  const isPendingProof = !primaryOrder.payment_proof_url;
  const isMultiStore = orders.length > 1;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

      {/* Multi-store indicator badge */}
      {isMultiStore && (
        <div className="mb-4 text-center">
          <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold"
            style={{ background: "rgba(107,30,150,0.08)", color: "#6b1e96" }}>
            <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>storefront</span>
            {orders.length} tiendas · Cada una preparará su envío por separado
          </span>
        </div>
      )}

      {/* Per-store order cards */}
      {orders.map((order, index) => {
        // Extract store name from order items
        const storeName = [...new Set(
          (order.order_items || [])
            .map((item) => item.store_profiles?.business_name)
            .filter(Boolean)
        )].join(", ") || `Tienda ${index + 1}`;

        return (
          <div key={order.id}
            className="bg-white rounded-lg shadow-sm border p-6 md:p-8 mb-6 text-gray-900"
            style={{ borderLeft: isMultiStore ? "4px solid #6b1e96" : undefined }}>

            {/* Order Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <div>
                {isMultiStore && (
                  <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: "#6b1e96" }}>
                    🏪 {storeName}
                  </p>
                )}
                <h2 className="text-xl font-extrabold text-gray-900">
                  {isMultiStore ? `Envío ${index + 1} de ${orders.length}` : "Resumen de Orden"}
                </h2>
                <p className="text-sm text-gray-500 font-mono bg-gray-100 px-2 py-0.5 rounded inline-block mt-1">
                  {order.id.split("-")[0]}
                </p>
              </div>

              {/* Status badges */}
              <div className="flex flex-col gap-1.5">
                <div className={`px-3 py-1.5 rounded-md font-medium text-xs flex items-center gap-1.5 border ${
                  order.payment_status === "approved"
                    ? "bg-green-50 text-green-800 border-green-100"
                    : order.payment_status === "rejected"
                    ? "bg-red-50 text-red-800 border-red-100"
                    : "bg-blue-50 text-blue-800 border-blue-100"
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    order.payment_status === "approved" ? "bg-green-500" :
                    order.payment_status === "rejected" ? "bg-red-500" :
                    "bg-blue-500 animate-pulse"
                  }`}></span>
                  {order.payment_status === "pending"
                    ? "Pendiente"
                    : order.payment_status === "under_review"
                    ? "En revisión"
                    : order.payment_status === "approved"
                    ? "Aprobado"
                    : order.payment_status === "rejected"
                    ? "Rechazado"
                    : order.payment_status}
                </div>
              </div>
            </div>

            {/* Order items */}
            <div className="text-left bg-gray-50 p-4 rounded-lg border border-gray-100">
              <div className="space-y-2 mb-4">
                {order.order_items?.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between text-sm border-b border-gray-100 pb-2 last:border-0 last:pb-0"
                  >
                    <span className="text-gray-600">
                      <span className="font-semibold">{item.quantity}x</span>{" "}
                      {item.products?.name}
                    </span>
                    <span className="font-medium text-gray-900">
                      {formatCurrencyUSD(item.unit_price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Delivery fee row */}
              {order.delivery_fee_total > 0 && (
                <div className="flex justify-between text-sm border-t border-gray-200 pt-2 mb-2">
                  <span className="text-gray-500">🚗 Delivery</span>
                  <span className="font-medium text-gray-700">
                    {formatCurrencyUSD(order.delivery_fee_total)}
                  </span>
                </div>
              )}

              {/* Buyer fee row */}
              {order.buyer_fee_amount_usd > 0 && (
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-500">Tarifa de servicio</span>
                  <span className="font-medium text-gray-700">
                    {formatCurrencyUSD(order.buyer_fee_amount_usd)}
                  </span>
                </div>
              )}

              <div className="flex justify-between font-bold text-base border-t pt-3">
                <span>Total:</span>
                <div className="text-right">
                  <span className="block text-primary-600">
                    {formatCurrencyUSD(order.total_usd)}
                  </span>
                  <span className="block text-xs text-gray-500 font-normal">
                    Eq. {formatCurrencyVES(order.total_ves)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* Grand total for multi-store */}
      {isMultiStore && (
        <div className="bg-gradient-to-r from-[#6b1e96] to-[#531575] rounded-lg p-5 mb-6 text-center text-white">
          <p className="text-sm font-medium opacity-80 mb-1">Total General ({orders.length} envíos)</p>
          <p className="text-2xl font-extrabold">{formatCurrencyUSD(grandTotalUsd)}</p>
          <p className="text-xs opacity-70 mt-0.5">Eq. {formatCurrencyVES(grandTotalVes)}</p>
        </div>
      )}

      {/* Payment proof section — single upload for all orders */}
      {isPendingProof ? (
        <div className="bg-white rounded-lg shadow-sm border p-6 md:p-8 mb-6 text-left">
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            Paso 2: Confirma tu pago
          </h3>
          <p className="text-gray-500 text-sm mb-6">
            {isMultiStore
              ? "Un solo comprobante cubrirá todas tus órdenes. Adjunta tu recibo de transferencia, Pago Móvil o Zelle."
              : "Para acelerar el envío de tu paquete bajo el esquema Escrow, por favor adjunta tu recibo de transferencia, Pago Móvil o Zelle."}
          </p>
          <PaymentProofUploader
            orderId={primaryOrder.id}
            paymentMethod={primaryOrder.payment_method}
            onUploadComplete={handleProofUploaded}
          />
        </div>
      ) : (
        <div className="bg-green-50 border border-green-200 text-green-800 p-6 rounded-lg mb-6 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <svg
              className="w-6 h-6 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <h3 className="font-bold text-lg">¡Comprobante enviado!</h3>
          </div>
          <p className="text-sm">
            Hemos recibido tu comprobante de pago exitosamente. Un
            administrador lo validará pronto y tu pedido pasará al área de
            despacho.
          </p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link
          to="/account/orders"
          className="inline-flex justify-center px-6 py-3 border border-gray-300 shadow-sm text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition"
        >
          Ver mis órdenes
        </Link>
        <Link
          to="/"
          className="inline-flex justify-center px-6 py-3 border border-transparent shadow-md text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition"
        >
          Seguir comprando
        </Link>
      </div>
    </div>
  );
}
