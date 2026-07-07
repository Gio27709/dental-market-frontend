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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Multi-store indicator badge */}
      {isMultiStore && (
        <div className="mb-6 text-center">
          <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold"
            style={{ background: "rgba(107,30,150,0.08)", color: "#6b1e96" }}>
            <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>storefront</span>
            {orders.length} tiendas · Cada una preparará su envío por separado
          </span>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Columna Izquierda: Acción de Pago / Éxito */}
        <div className="w-full lg:w-[55%] xl:w-[60%] flex-shrink-0">
          {isPendingProof ? (
            <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-slate-100 p-5 md:p-6 mb-6 text-left">
              <h3 className="text-base font-black text-gray-900 mb-1">
                Paso 2: Confirma tu pago
              </h3>
              <p className="text-slate-400 text-xs font-semibold mb-6">
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
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-5 md:p-6 rounded-2xl mb-6 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <span className="material-symbols-outlined text-emerald-600 text-2xl">check_circle</span>
                <h3 className="font-black text-emerald-950 text-base">¡Comprobante enviado!</h3>
              </div>
              <p className="text-xs font-medium text-emerald-800 leading-relaxed">
                Hemos recibido tu comprobante de pago exitosamente. Un administrador lo validará pronto y tu pedido pasará al área de despacho.
              </p>
            </div>
          )}
        </div>

        {/* Columna Derecha: Resumen de Órdenes y Acciones */}
        <div className="w-full lg:w-[45%] xl:w-[40%] flex-shrink-0 space-y-5">
          <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-5 md:p-6">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-4">Resumen de Compra</h3>
            
            {/* Per-store order cards */}
            <div className="space-y-4">
              {orders.map((order, index) => {
                const storeName = [...new Set(
                  (order.order_items || [])
                    .map((item) => item.store_profiles?.business_name)
                    .filter(Boolean)
                )].join(", ") || `Tienda ${index + 1}`;

                return (
                  <div key={order.id} className="bg-white rounded-xl border border-slate-100 p-4 text-gray-900">
                    <div className="flex items-center justify-between gap-3 mb-3 pb-2.5 border-b border-slate-100">
                      <div>
                        {isMultiStore && (
                          <p className="text-[10px] font-extrabold uppercase tracking-widest" style={{ color: "#6b1e96" }}>
                            🏪 {storeName}
                          </p>
                        )}
                        <h4 className="text-xs font-black text-slate-800 mt-0.5">
                          {isMultiStore ? `Envío ${index + 1} de ${orders.length}` : "Pedido Registrado"}
                        </h4>
                        <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
                          Ref: #{order.id.split("-")[0].toUpperCase()}
                        </span>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <div className="px-2 py-1 rounded-md font-extrabold text-[9px] uppercase tracking-wider flex items-center gap-1 border bg-blue-50/50 text-blue-700 border-blue-100/50">
                          <span className="w-1 h-1 rounded-full bg-blue-500 animate-pulse"></span>
                          Pendiente
                        </div>
                      </div>
                    </div>

                    {/* Order items */}
                    <div className="space-y-1.5 text-xs text-slate-600 mb-3">
                      {order.order_items?.map((item) => (
                        <div key={item.id} className="flex justify-between">
                          <span className="truncate max-w-[200px]">
                            <span className="font-black text-slate-800">{item.quantity}x</span> {item.products?.name}
                          </span>
                          <span className="font-semibold text-slate-800">{formatCurrencyUSD(item.unit_price * item.quantity)}</span>
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-slate-100/80 pt-2.5 mt-2 flex justify-between items-center text-xs font-bold">
                      <span className="text-slate-500">Monto Orden:</span>
                      <span className="text-slate-800">{formatCurrencyUSD(order.total_usd)}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Grand total for multi-store */}
            {isMultiStore && (
              <div className="bg-gradient-to-r from-[#6b1e96] to-[#531575] rounded-xl p-4 mt-4 text-center text-white">
                <p className="text-[10px] font-black uppercase tracking-wider opacity-85 mb-0.5">Total de la Compra</p>
                <p className="text-xl font-extrabold">{formatCurrencyUSD(grandTotalUsd)}</p>
                <p className="text-[10px] opacity-75 mt-0.5">Eq. {formatCurrencyVES(grandTotalVes)}</p>
              </div>
            )}
            
            {!isMultiStore && (
              <div className="bg-[#6b1e96]/5 border border-[#6b1e96]/10 rounded-xl p-4 mt-4 text-center">
                <p className="text-[10px] font-black uppercase tracking-wider text-[#6b1e96] mb-0.5">Total a Pagar</p>
                <p className="text-xl font-black text-[#6b1e96]">{formatCurrencyUSD(grandTotalUsd)}</p>
                <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Eq. {formatCurrencyVES(grandTotalVes)}</p>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/account/orders"
              className="flex-1 inline-flex justify-center items-center py-2.5 px-4 border border-slate-200 text-xs font-bold rounded-xl text-slate-600 bg-white hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Ver mis órdenes
            </Link>
            <Link
              to="/"
              className="flex-1 inline-flex justify-center items-center py-2.5 px-4 text-xs font-bold rounded-xl text-white bg-gradient-to-r from-[#6b1e96] to-[#8b2fc9] hover:from-[#7b24ab] hover:to-[#9c3ce0] transition-all cursor-pointer"
            >
              Seguir comprando
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
