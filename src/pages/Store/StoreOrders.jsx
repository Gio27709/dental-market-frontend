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
  const { storeOrders, loading, fetchStoreOrders, shipItem } = useStore();
  const [shipModal, setShipModal] = useState(null);
  const [trackingForm, setTrackingForm] = useState({
    tracking_code: "",
    shipping_carrier: "zoom",
  });
  const [shipping, setShipping] = useState(false);

  useEffect(() => {
    fetchStoreOrders();
  }, [fetchStoreOrders]);

  const handleShip = async () => {
    if (!trackingForm.tracking_code.trim()) {
      toast.error("Ingresa el código de tracking");
      return;
    }
    setShipping(true);
    const result = await shipItem(shipModal.itemId, trackingForm);
    setShipping(false);

    if (result.success) {
      toast.success("Producto marcado como enviado");
      setShipModal(null);
      setTrackingForm({ tracking_code: "", shipping_carrier: "zoom" });
    } else {
      toast.error(result.error);
    }
  };

  // Backend returns flat order_items for stores (not orders with nested items).
  // Each item has nested `orders` (the parent order) and `product_variations`.
  // We use the items directly — no flatMap needed.
  const allItems = (storeOrders || []).map((item) => ({
    ...item,
    // The nested `orders` relation contains the parent order data
    order_id: item.orders?.id || item.order_id,
    order_created_at: item.orders?.created_at || item.created_at,
    buyer_address: item.orders?.shipping_address || null,
    buyer_phone: item.orders?.contact_phone || null,
    payment_status: item.orders?.payment_status || "pending",
  }));

  // Filter to only show items where payment has been approved (ready to ship)
  const actionableItems = allItems.filter(
    (item) =>
      item.payment_status === "approved" ||
      item.payment_status === "processing" ||
      item.delivery_status === "shipped" ||
      item.delivery_status === "delivered",
  );

  // Also show pending items in a separate section
  const pendingPaymentItems = allItems.filter(
    (item) =>
      item.payment_status !== "approved" &&
      item.payment_status !== "processing" &&
      item.delivery_status !== "shipped" &&
      item.delivery_status !== "delivered",
  );

  const renderItem = (item) => {
    const product = item.products || {};
    const statusInfo =
      ORDER_STATUS[item.delivery_status] || ORDER_STATUS.pending;
    const canShip =
      item.delivery_status !== "shipped" &&
      item.delivery_status !== "delivered" &&
      (item.payment_status === "approved" ||
        item.payment_status === "processing");
    const isShipped = item.delivery_status === "shipped";
    const isDelivered = item.delivery_status === "delivered";

    const variation = item.product_variations || {};
    const getVariationText = () => {
      if (!variation.attribute_value || variation.attribute_name === "default" || variation.attribute_value === '{"_default":"default"}') return null;
      try {
        const parsed = JSON.parse(variation.attribute_value);
        if (parsed._default === "default") return null;
        return Object.entries(parsed)
          .map(([key, val]) => `${key}: ${val}`)
          .join(" | ");
      } catch {
        if (variation.attribute_name && variation.attribute_name !== "Matrix") {
          return `${variation.attribute_name}: ${variation.attribute_value}`;
        }
        return variation.attribute_value;
      }
    };

    return (
      <div
        key={item.id}
        className="bg-white rounded-lg border border-gray-200 p-4"
      >
        <div className="flex items-start gap-4">
          {/* Product thumbnail */}
          <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
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
            <h3 className="font-semibold text-gray-900 text-sm truncate">
              {product.name || "Producto"}
            </h3>
            {getVariationText() && (
              <p className="text-xs font-semibold text-indigo-600 mt-0.5">
                {getVariationText()}
              </p>
            )}
            <p className="text-xs text-gray-500 mt-0.5">
              Orden {formatOrderNumber(item.order_id)} ·{" "}
              {formatOrderDate(item.order_created_at)}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              Cant: {item.quantity} × {formatCurrencyUSD(item.unit_price)}
            </p>

            {/* Buyer address */}
            {item.buyer_address && canShip && (
              <p className="text-xs text-gray-500 mt-1 bg-gray-50 px-2 py-1 rounded">
                📍 {item.buyer_address}
              </p>
            )}

            {/* Tracking info if shipped */}
            {isShipped && item.tracking_code && (
              <p className="text-xs text-blue-600 mt-1">
                {CARRIER_ICONS[item.shipping_carrier?.toLowerCase()]?.icon ||
                  "📦"}{" "}
                {item.tracking_code}
              </p>
            )}
          </div>

          {/* Status + Action */}
          <div className="text-right flex-shrink-0 space-y-2">
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                isDelivered
                  ? "bg-emerald-100 text-emerald-800"
                  : isShipped
                    ? "bg-green-100 text-green-800"
                    : canShip
                      ? "bg-blue-100 text-blue-800"
                      : "bg-yellow-100 text-yellow-800"
              }`}
            >
              {isDelivered
                ? "Entregado ✅"
                : isShipped
                  ? "Enviado"
                  : canShip
                    ? "Listo para enviar"
                    : statusInfo.label}
            </span>

            {canShip && (
              <button
                onClick={() =>
                  setShipModal({
                    itemId: item.id,
                    productName: product.name,
                  })
                }
                className="block w-full text-xs px-3 py-1.5 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition"
              >
                🚚 Enviar
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">
          Órdenes de mi Tienda
        </h2>
        <p className="text-sm text-gray-500">
          {allItems.length} item{allItems.length !== 1 ? "s" : ""} en total
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <LoadingSkeleton variant="order-card" count={2} />
        </div>
      ) : allItems.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="text-5xl mb-4">🛒</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Sin órdenes aún
          </h3>
          <p className="text-gray-500 text-sm">
            Cuando un comprador adquiera tus productos, las órdenes aparecerán
            aquí.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Actionable items - ready to ship or already shipped */}
          {actionableItems.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full" />
                Listos para gestionar ({actionableItems.length})
              </h3>
              <div className="space-y-3">{actionableItems.map(renderItem)}</div>
            </div>
          )}

          {/* Pending payment items */}
          {pendingPaymentItems.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-500 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-yellow-400 rounded-full" />
                Pendientes de pago ({pendingPaymentItems.length})
              </h3>
              <div className="space-y-3 opacity-70">
                {pendingPaymentItems.map(renderItem)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Ship Modal */}
      {shipModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => !shipping && setShipModal(null)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-1">
              Enviar Producto
            </h3>
            <p className="text-sm text-gray-500 mb-5">
              {shipModal.productName}
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  {CARRIERS.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Código de Tracking *
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  placeholder="Ej: ZM-123456789"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShipModal(null)}
                disabled={shipping}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={handleShip}
                disabled={shipping || !trackingForm.tracking_code.trim()}
                className="flex-1 px-4 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition text-sm disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {shipping ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Enviando...
                  </>
                ) : (
                  "🚚 Marcar Enviado"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
