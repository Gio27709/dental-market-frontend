import { useEffect, useState } from "react";
import LoadingSkeleton from "../../components/LoadingSkeleton";
import { useStore } from "../../context/StoreContext";
import {
  formatCurrencyUSD,
  formatOrderNumber,
  formatOrderDate,
} from "../../utils/formatters";
import { ORDER_STATUS, CARRIER_ICONS } from "../../utils/constants";
import toast from "react-hot-toast";

const CARRIERS = [
  { value: "zoom", label: "Zoom" },
  { value: "mrw", label: "MRW" },
  { value: "tealca", label: "Tealca" },
  { value: "other", label: "Otro" },
];

export default function StoreOrders() {
  const { storeOrders, loading, fetchStoreOrders, shipItem, cancelAbandonedStoreOrder } = useStore();
  const [shipModal, setShipModal] = useState(null);
  const [cancellingMap, setCancellingMap] = useState({});
  const [trackingForm, setTrackingForm] = useState({
    tracking_code: "",
    shipping_carrier: "zoom",
  });
  const [shipping, setShipping] = useState(false);

  const handleCancelAbandoned = async (orderId) => {
    setCancellingMap(prev => ({ ...prev, [orderId]: true }));
    const result = await cancelAbandonedStoreOrder(orderId);
    if (result.success) {
      toast.success("Inventario liberado exitosamente");
    } else {
      toast.error(result.error || "No se pudo cancelar. ¿Pasaron 2 horas?");
    }
    setCancellingMap(prev => ({ ...prev, [orderId]: false }));
  };

  useEffect(() => {
    fetchStoreOrders();
  }, [fetchStoreOrders]);

  const handleShip = async () => {
    if (!trackingForm.tracking_code.trim()) {
      toast.error("Ingresa el código de tracking");
      return;
    }
    setShipping(true);
    
    // Support single item or multiple items (Array)
    const itemsToShip = Array.isArray(shipModal.itemId) ? shipModal.itemId : [shipModal.itemId];
    
    let allSuccess = true;
    for (const id of itemsToShip) {
      const result = await shipItem(id, trackingForm);
      if (!result.success) {
        toast.error(`Error enviando ítem: ${result.error}`);
        allSuccess = false;
        break; // Stop on first error to prevent partial shipments if possible
      }
    }
    
    setShipping(false);

    if (allSuccess) {
      toast.success(itemsToShip.length > 1 ? "Productos marcados como enviados" : "Producto marcado como enviado");
      setShipModal(null);
      setTrackingForm({ tracking_code: "", shipping_carrier: "zoom" });
    }
  };

  // Group flat items by order_id
  const ordersMap = (storeOrders || []).reduce((acc, item) => {
    const orderId = item.orders?.id || item.order_id;
    if (!acc[orderId]) {
      acc[orderId] = {
        order_id: orderId,
        order_created_at: item.orders?.created_at || item.created_at,
        buyer_name: item.orders?.users?.full_name || "Comprador",
        buyer_address: item.orders?.shipping_address || null,
        buyer_phone: item.orders?.contact_phone || null,
        payment_status: item.orders?.payment_status || "pending",
        items: []
      };
    }
    acc[orderId].items.push(item);
    return acc;
  }, {});

  // Convert to array and sort by date descending
  const allOrders = Object.values(ordersMap).sort(
    (a, b) => new Date(b.order_created_at) - new Date(a.order_created_at)
  );

  const actionableOrders = allOrders.filter(
    (order) =>
      order.payment_status === "approved" || 
      order.payment_status === "processing" ||
      order.items.some(i => i.delivery_status === "shipped" || i.delivery_status === "delivered")
  );

  const underReviewOrders = allOrders.filter(
    (order) =>
      order.payment_status === "under_review" &&
      !order.items.some(i => i.delivery_status === "shipped" || i.delivery_status === "delivered")
  );

  const abandonedOrders = allOrders.filter(
    (order) =>
      order.payment_status === "pending" &&
      !order.items.some(i => i.delivery_status === "shipped" || i.delivery_status === "delivered")
  );

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

  const renderOrder = (order) => {
    // Unshipped items that can be shipped right now
    const shippableItems = order.items.filter(
      (item) =>
        item.delivery_status !== "shipped" &&
        item.delivery_status !== "delivered" &&
        (order.payment_status === "approved" ||
          order.payment_status === "processing")
    );

    const canShipAny = shippableItems.length > 0;

    return (
      <div key={order.order_id} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        {/* Order Header */}
        <div className="bg-gray-50 px-5 py-4 border-b border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-bold text-gray-900 text-sm">
                Orden {formatOrderNumber(order.order_id)}
              </h3>
              <span className="text-xs text-gray-400">•</span>
              <span className="text-xs text-gray-500 font-medium tracking-wide flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                {formatOrderDate(order.order_created_at)}
              </span>
            </div>
            
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              {order.buyer_name && (
                <p className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-gray-400">person</span>
                  {order.buyer_name}
                </p>
              )}
              {order.buyer_phone && (
                <p className="text-sm text-gray-600 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-gray-400">call</span>
                  {order.buyer_phone}
                </p>
              )}
            </div>

            {order.buyer_address && (
              <p className="text-sm text-gray-600 flex items-start gap-1.5 mt-2 bg-white px-3 py-2 rounded-lg border border-gray-100 shadow-sm inline-flex max-w-xl">
                <span className="material-symbols-outlined text-[16px] text-indigo-500 mt-0.5">location_on</span>
                {order.buyer_address}
              </p>
            )}
          </div>
          
          <div className="text-right w-full md:w-auto mt-2 md:mt-0 flex flex-col items-end gap-2 text-sm">
             <span className="font-medium text-gray-500">Total ítems: <strong className="text-gray-900">{order.items.length}</strong></span>
            {canShipAny && (
              <button
                onClick={() =>
                  setShipModal({
                    itemId: shippableItems.map(i => i.id),
                    productName: `Toda la orden (${shippableItems.length} ítems pendientes)`,
                  })
                }
                className="w-full md:w-auto inline-flex justify-center items-center gap-1.5 text-sm px-4 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition shadow-sm"
              >
                <span className="material-symbols-outlined text-[18px]">local_shipping</span>
                Enviar {shippableItems.length > 1 ? "Todo" : "Ítem"}
              </button>
            )}
          </div>
        </div>

        {/* Order Items */}
        <div className="divide-y divide-gray-100">
          {order.items.map((item) => {
            const product = item.products || {};
            const variation = item.product_variations;
            const statusInfo = ORDER_STATUS[item.delivery_status] || ORDER_STATUS.pending;
            const isShipped = item.delivery_status === "shipped";
            const isDelivered = item.delivery_status === "delivered";
            const canShipThisItem = 
              item.delivery_status !== "shipped" &&
              item.delivery_status !== "delivered" &&
              (order.payment_status === "approved" ||
                order.payment_status === "processing");

            return (
              <div key={item.id} className="p-5 flex flex-col sm:flex-row gap-5 items-start sm:items-center hover:bg-gray-50/50 transition-colors">
                {/* Product thumbnail */}
                <div className="w-14 h-14 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0 border border-gray-200">
                  {product.images?.[0] ? (
                    <img
                      src={product.images[0]}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-lg text-gray-300">
                      🦷
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 text-sm truncate">
                    {product.name || "Producto desconocido"}
                  </h3>
                  {getVariationText(variation) && (
                    <p className="text-xs font-semibold text-indigo-600 mt-1">
                      {getVariationText(variation)}
                    </p>
                  )}
                  <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                    <span className="font-medium">Cant: <strong className="text-gray-900">{item.quantity}</strong></span>
                    <span className="text-gray-300">|</span>
                    <span className="font-medium pr-1">{formatCurrencyUSD(item.unit_price)}</span>
                  </div>

                  {/* Tracking info if shipped */}
                  {isShipped && item.tracking_code && (
                    <div className="mt-2 inline-flex items-center gap-1.5 text-xs text-blue-700 bg-blue-50 px-2 py-1 rounded-md border border-blue-100 font-medium tracking-wide">
                      <span className="text-sm">{CARRIER_ICONS[item.shipping_carrier?.toLowerCase()]?.icon || "📦"}</span>
                      {item.tracking_code}
                    </div>
                  )}
                </div>

                {/* Status + Action */}
                <div className="sm:text-right flex-shrink-0 flex flex-row sm:flex-col items-center sm:items-end gap-3 sm:gap-2 w-full sm:w-auto mt-3 sm:mt-0">
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                      isDelivered
                        ? "bg-emerald-100 text-emerald-800"
                        : isShipped
                          ? "bg-green-100 text-green-800"
                          : canShipThisItem
                            ? "bg-blue-100 text-blue-800"
                            : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {isDelivered
                      ? "Entregado ✅"
                      : isShipped
                        ? "Enviado 🚚"
                        : canShipThisItem
                          ? "Listo para enviar"
                          : statusInfo.label}
                  </span>

                  {canShipThisItem && shippableItems.length > 1 && (
                    <button
                      onClick={() =>
                        setShipModal({
                          itemId: [item.id],
                          productName: product.name,
                        })
                      }
                      className="text-xs px-3 py-1.5 bg-white border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition shadow-sm"
                    >
                      Enviar Individual
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
          Órdenes de mi Tienda
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          {allOrders.length} orden{allOrders.length !== 1 ? "es" : ""} en total
        </p>
      </div>

      {loading ? (
        <div className="space-y-4">
          <LoadingSkeleton variant="order-card" count={2} />
        </div>
      ) : allOrders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-sm">
          <div className="text-6xl mb-4 opacity-80">🛒</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Sin órdenes aún
          </h3>
          <p className="text-gray-500 text-sm max-w-sm mx-auto leading-relaxed">
            Cuando un comprador adquiera tus productos o se aprueben sus pagos, los pedidos listos para despachar aparecerán aquí.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Actionable items - ready to ship or already shipped */}
          {actionableOrders.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2 uppercase tracking-wider">
                <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full" />
                Listos para gestionar ({actionableOrders.length})
              </h3>
              <div className="space-y-4">{actionableOrders.map(renderOrder)}</div>
            </div>
          )}

          {/* Under Review items (Escrow wait) */}
          {underReviewOrders.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2 uppercase tracking-wider mt-8">
                <span className="w-2.5 h-2.5 bg-yellow-400 rounded-full" />
                Validando Pago en Escrow ({underReviewOrders.length})
              </h3>
              <div className="space-y-4">
                {underReviewOrders.map(renderOrder)}
              </div>
            </div>
          )}

          {/* Pending / Abandoned items */}
          {abandonedOrders.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-gray-500 mb-4 flex items-center gap-2 uppercase tracking-wider mt-10">
                <span className="w-2.5 h-2.5 bg-gray-400 rounded-full" />
                Checkout Abandonado / Sin Pago ({abandonedOrders.length})
              </h3>
              <p className="text-xs text-gray-400 my-2 bg-gray-50 p-2 rounded inline-block">
                Estos compradores retuvieron stock pero no subieron el pago a tiempo.
              </p>
              <div className="space-y-6">
                {abandonedOrders.map(order => (
                  <div key={order.order_id} className="relative mt-2">
                    <div className="opacity-60 grayscale-[40%] transition-opacity hover:opacity-100 hover:grayscale-0">
                      {renderOrder(order)}
                    </div>
                    {/* Boton de cancelacion para liberar stock */}
                    <div className="mt-3 flex justify-end">
                      <button 
                         onClick={() => handleCancelAbandoned(order.order_id)}
                         disabled={cancellingMap[order.order_id]}
                         className="text-xs px-4 py-2 bg-red-50 text-red-600 font-bold rounded-lg hover:bg-red-100 border border-red-200 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                       >
                         {cancellingMap[order.order_id] ? (
                           <>
                             <div className="w-3.5 h-3.5 border border-red-200 border-t-red-600 rounded-full animate-spin"></div>
                             Liberando Inventario...
                           </>
                         ) : (
                           <>
                             <span className="material-symbols-outlined text-[16px]">remove_shopping_cart</span>
                             Cancelar Orden y Liberar Stock
                           </>
                         )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Ship Modal */}
      {shipModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity"
            onClick={() => !shipping && setShipModal(null)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-bold text-gray-900 mb-1">
              Confirmar Envío
            </h3>
            <p className="text-sm text-gray-500 mb-6 font-medium bg-gray-50 p-3 rounded-lg border border-gray-100 mt-3">
              📦 {shipModal.productName}
            </p>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">
                  Empresa de Envío
                </label>
                <select
                  value={trackingForm.shipping_carrier}
                  onChange={(e) =>
                    setTrackingForm((prev) => ({
                      ...prev,
                      shipping_carrier: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow outline-none"
                >
                  {CARRIERS.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">
                  Código de Tracking (Guía) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={trackingForm.tracking_code}
                  onChange={(e) =>
                    setTrackingForm((prev) => ({
                      ...prev,
                      tracking_code: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow outline-none"
                  placeholder="Ej: ZM-123456789"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setShipModal(null)}
                disabled={shipping}
                className="flex-[1] px-4 py-2.5 border border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition text-sm outline-none"
              >
                Cancelar
              </button>
              <button
                onClick={handleShip}
                disabled={shipping || !trackingForm.tracking_code.trim()}
                className="flex-[2] px-4 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition text-sm disabled:opacity-50 disabled:hover:bg-indigo-600 flex items-center justify-center gap-2 outline-none shadow-sm"
              >
                {shipping ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">send</span>
                    Confirmar Envío
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
