import { useEffect, useState, useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import LoadingSkeleton from "../../components/LoadingSkeleton";
import { useStore } from "../../context/StoreContext";
import {
  formatCurrencyUSD,
  formatOrderNumber,
  formatOrderDate,
} from "../../utils/formatters";
import { ORDER_STATUS, CARRIER_ICONS } from "../../utils/constants";
import toast from "react-hot-toast";
import ShippingEvidenceUploader from "../../components/orders/ShippingEvidenceUploader";
import { getStoreRidersAPI } from "../../services/api";

const CARRIERS = [
  { value: "zoom", label: "Zoom" },
  { value: "mrw", label: "MRW" },
  { value: "tealca", label: "Tealca" },
  { value: "other", label: "Otro" },
];

const PAGE_OPTIONS = [10, 20, 30];

const TABS = [
  { id: "actionable", label: "Pendientes de Envío", icon: "📦", color: "bg-[#6b1e96] text-white", inactive: "bg-white text-gray-500 hover:text-gray-800" },
  { id: "completed", label: "Historial de Envíos", icon: "✅", color: "bg-emerald-600 text-white", inactive: "bg-white text-gray-500 hover:text-gray-800" },
  { id: "under_review", label: "Validando Pago", icon: "⏳", color: "bg-amber-500 text-white", inactive: "bg-white text-gray-500 hover:text-gray-800" },
  { id: "abandoned", label: "Abandonados", icon: "🗑️", color: "bg-gray-800 text-white", inactive: "bg-white text-gray-500 hover:text-gray-800" },
  { id: "cancelled", label: "Cancelados", icon: "❌", color: "bg-red-600 text-white", inactive: "bg-white text-gray-500 hover:text-gray-800" },
];

export default function StoreOrders() {
  const { storeOrders, loading, error, fetchStoreOrders, shipItem, cancelAbandonedStoreOrder, cancelItem, cancelStoreOrder } = useStore();
  const [searchParams] = useSearchParams();
  const urlSearch = searchParams.get("search") || "";

  const [shipModal, setShipModal] = useState(null);
  const [cancelModal, setCancelModal] = useState(null); // { type: 'item'|'order', id, productName }
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [cancellingMap, setCancellingMap] = useState({});
  const [trackingForm, setTrackingForm] = useState({
    tracking_code: "",
    shipping_carrier: "zoom",
    shipping_evidence_urls: [],
    assigned_rider_id: null,
  });
  const [shipping, setShipping] = useState(false);
  const [riders, setRiders] = useState([]);

  // Filter & pagination state
  const [searchTerm, setSearchTerm] = useState(urlSearch);
  const [activeTab, setActiveTab] = useState("actionable");
  const [perPage, setPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState("cards"); // cards | table

  useEffect(() => {
    if (urlSearch) {
      setSearchTerm(urlSearch);
    }
  }, [urlSearch]);
  
  // Invoice modal for order detail
  const [invoiceOrder, setInvoiceOrder] = useState(null);

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
    const isLocalDelivery = shipModal?.order?.delivery_type === "local_delivery";

    if (!isLocalDelivery && !trackingForm.tracking_code.trim()) {
      toast.error("Ingresa el código de tracking");
      return;
    }
    setShipping(true);
    
    const itemsToShip = Array.isArray(shipModal.itemId) ? shipModal.itemId : [shipModal.itemId];
    
    let allSuccess = true;
    for (const id of itemsToShip) {
      const payload = { ...trackingForm };
      if (isLocalDelivery) {
        payload.shipping_carrier = "local";
        payload.tracking_code = "";
      }
      // Riders solo aplican para delivery local, nunca para encomiendas nacionales
      if (!isLocalDelivery) {
        payload.assigned_rider_id = null;
      }
      const result = await shipItem(id, payload);
      if (!result.success) {
        toast.error(`Error enviando ítem: ${result.error}`);
        allSuccess = false;
        break;
      }
    }
    
    setShipping(false);

    if (allSuccess) {
      toast.success(itemsToShip.length > 1 ? "Productos marcados como enviados" : "Producto marcado como enviado");
      setShipModal(null);
      setTrackingForm({ tracking_code: "", shipping_carrier: "zoom", shipping_evidence_urls: [], assigned_rider_id: null });
    }
  };

  // Load riders for ship modal selector
  useEffect(() => {
    getStoreRidersAPI()
      .then(res => setRiders((res.data?.data || res.data || []).filter(r => r.is_active)))
      .catch(() => {});
  }, []);

  // Handle cancel item/order
  const handleCancelConfirm = async () => {
    if (!cancelReason.trim() || cancelReason.trim().length < 5) {
      toast.error("El motivo debe tener al menos 5 caracteres");
      return;
    }
    setCancelling(true);
    let result;
    if (cancelModal.type === "item") {
      result = await cancelItem(cancelModal.id, cancelReason.trim());
    } else {
      result = await cancelStoreOrder(cancelModal.id, cancelReason.trim());
    }
    setCancelling(false);
    if (result.success) {
      toast.success(cancelModal.type === "item" ? "Ítem cancelado. Stock restaurado." : "Orden cancelada. Stock restaurado.");
      setCancelModal(null);
      setCancelReason("");
    } else {
      toast.error(result.error);
    }
  };

  // Group flat items by order_id
  const ordersMap = useMemo(() => (storeOrders || []).reduce((acc, item) => {
    const orderId = item.orders?.id || item.order_id;
    if (!acc[orderId]) {
      const o = item.orders || {};
      acc[orderId] = {
        order_id: orderId,
        order_created_at: o.created_at || item.created_at,
        buyer_name: o.users?.full_name || "Comprador",
        buyer_address: o.shipping_address || null,
        payment_status: o.payment_status || "pending",
        delivery_type: o.delivery_type || "shipping",
        destination_state: o.destination_state || null,
        destination_city: o.destination_city || null,
        delivery_address: o.delivery_address || null,
        delivery_reference: o.delivery_reference || null,
        delivery_lat: o.delivery_lat || null,
        delivery_lng: o.delivery_lng || null,
        notes: o.notes || null,
        items: []
      };
    }
    acc[orderId].items.push(item);
    return acc;
  }, {}), [storeOrders]);

  // Convert to array and sort by date descending
  const allOrders = useMemo(() => Object.values(ordersMap).sort(
    (a, b) => new Date(b.order_created_at) - new Date(a.order_created_at)
  ), [ordersMap]);

  // Categorize orders
  const categorizeOrder = useCallback((order) => {
    const activeItems = order.items.filter(i => i.delivery_status !== "cancelled" && i.delivery_status !== "returned");
    const isCompleted = activeItems.length > 0 && activeItems.every(i => ["shipped", "picked_up", "arrived", "delivered"].includes(i.delivery_status));
    const isFullyCancelled = order.items.length > 0 && activeItems.length === 0;

    if (isFullyCancelled) {
      return "cancelled";
    }

    if (isCompleted) {
      return "completed";
    }

    if (
      order.payment_status === "approved" ||
      order.payment_status === "processing"
    ) {
      return "actionable";
    }
    if (order.payment_status === "under_review") {
      return "under_review";
    }
    if (order.payment_status === "pending") {
      return "abandoned";
    }
    return "other";
  }, []);

  // Apply filters
  const filtered = useMemo(() => {
    let result = [...allOrders];

    // Search by order number or buyer name
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter((o) => {
        const orderNum = formatOrderNumber(o.order_id).toLowerCase();
        const buyerName = (o.buyer_name || "").toLowerCase();
        return orderNum.includes(term) || buyerName.includes(term) || o.order_id.toLowerCase().includes(term);
      });
    }

    // Filter by active tab (skip tab filter if searching)
    if (!searchTerm.trim()) {
      result = result.filter((o) => categorizeOrder(o) === activeTab);
    }

    return result;
  }, [allOrders, searchTerm, activeTab, categorizeOrder]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * perPage;
    return filtered.slice(start, start + perPage);
  }, [filtered, currentPage, perPage]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, activeTab, perPage]);

  const clearFilters = () => {
    setSearchTerm("");
    setActiveTab("actionable");
    setPerPage(10);
    setCurrentPage(1);
  };

  const hasActiveFilters = searchTerm !== "";

  // Status counts for filter badges
  const statusCounts = useMemo(() => {
    const counts = { actionable: 0, completed: 0, under_review: 0, abandoned: 0, cancelled: 0 };
    allOrders.forEach((o) => {
      const cat = categorizeOrder(o);
      if (counts[cat] !== undefined) counts[cat]++;
    });
    return counts;
  }, [allOrders, categorizeOrder]);

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
    const shippableItems = order.items.filter(
      (item) =>
        item.delivery_status !== "shipped" &&
        item.delivery_status !== "delivered" &&
        item.delivery_status !== "cancelled" &&
        item.delivery_status !== "returned" &&
        (order.payment_status === "approved" ||
          order.payment_status === "processing")
    );

    const canShipAny = shippableItems.length > 0;
    const category = categorizeOrder(order);
    const isAbandoned = category === "abandoned";

    return (
      <div
        key={order.order_id}
        className={`bg-white rounded-3xl border border-gray-100 overflow-hidden transition-all duration-300 ${isAbandoned ? 'opacity-60 hover:opacity-100 grayscale-[0.2] shadow-sm' : 'shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(107,30,150,0.06)] hover:-translate-y-1'}`}
      >
        {/* Order Header */}
        <div className="p-5 flex flex-col gap-4 border-b border-gray-100">
          <div>
            <span className={`inline-flex mb-2 text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider ${order.delivery_type === "local_delivery" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-blue-50 text-blue-700 border border-blue-100"}`}>
              {order.delivery_type === "local_delivery" ? "🏍️ Delivery Local" : "🚚 Encomienda Nacional"}
            </span>
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-black text-gray-900 m-0 tracking-tight leading-none">
                #{formatOrderNumber(order.order_id)}
              </h3>
              <button
                onClick={() => setInvoiceOrder(order)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-[#6b1e96]/10 text-gray-600 hover:text-[#6b1e96] border border-gray-200 hover:border-[#6b1e96]/30 rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all"
                title="Ver recibo completo"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                </svg>
                Ver Orden
              </button>
            </div>
            <span className="text-xs text-gray-400 font-medium mt-1.5 flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
              {formatOrderDate(order.order_created_at)}
            </span>
          </div>

          {canShipAny && (
            <button
              onClick={() =>
                setShipModal({
                  itemId: shippableItems.map(i => i.id),
                  productName: `Toda la orden (${shippableItems.length} ítems)`,
                  order,
                })
              }
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#6b1e96] to-[#8b2bc0] text-white font-black flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform shadow-lg shadow-[#6b1e96]/30 text-[13px] uppercase tracking-wide"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
              </svg>
              Preparar Envío {shippableItems.length > 1 ? `(${shippableItems.length} ítems)` : ''}
            </button>
          )}

          {/* Buyer Info */}
          <div className="bg-gray-50/50 rounded-2xl p-3 border border-gray-100">
            {order.buyer_name && (
              <div className="flex items-center gap-2 text-sm font-bold text-gray-800 mb-1">
                <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px]">
                  {order.buyer_name.charAt(0).toUpperCase()}
                </div>
                {order.buyer_name}
              </div>
            )}
            {(order.destination_state || order.buyer_address) && (
              <div className="ml-8 text-[11px] text-gray-600 leading-snug">
                {order.destination_state && <span className="block font-bold text-gray-700 mb-0.5">{order.destination_city ? `${order.destination_city}, ` : ""}{order.destination_state}</span>}
                {order.buyer_address && <span className="line-clamp-2">{order.buyer_address}</span>}
              </div>
            )}
          </div>
        </div>

        {/* Order Items */}
        <div className="bg-white">
          {order.items.map((item, idx) => {
            const product = item.products || {};
            const variation = item.product_variations;
            const statusInfo = ORDER_STATUS[item.delivery_status] || ORDER_STATUS.pending;
            const isShipped = item.delivery_status === "shipped";
            const isDelivered = item.delivery_status === "delivered";
            const canShipThisItem =
              item.delivery_status !== "shipped" &&
              item.delivery_status !== "delivered" &&
              item.delivery_status !== "cancelled" &&
              item.delivery_status !== "returned" &&
              (order.payment_status === "approved" ||
                order.payment_status === "processing");

            return (
              <div
                key={item.id}
                className={`px-5 py-4 flex flex-col gap-3 group transition-colors hover:bg-[#6b1e96]/[0.02] ${idx !== 0 ? 'border-t border-dashed border-gray-100' : ''}`}
              >
                <div className="flex gap-4">
                  {/* Product thumbnail */}
                  <div
                    onClick={() => setInvoiceOrder(order)}
                    className="w-12 h-12 rounded-xl overflow-hidden bg-gray-50 flex-shrink-0 cursor-zoom-in relative transition-transform shadow-sm"
                  >
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

                  {/* Item info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 text-sm m-0 truncate group-hover:text-[#6b1e96] transition-colors leading-tight">
                      {product.name || "Producto desconocido"}
                    </h3>
                    <div className="mt-1 flex flex-wrap gap-x-2 gap-y-1 text-[11px] text-gray-500 items-center">
                      <span>Cant: <strong className="text-gray-900">{item.quantity}</strong></span>
                      <span className="text-gray-300">•</span>
                      <span className="font-bold text-[#6b1e96]">{formatCurrencyUSD(item.unit_price)}</span>
                      
                      {getVariationText(variation) && (
                        <>
                          <span className="text-gray-300">•</span>
                          <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">
                            {getVariationText(variation)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Status + Actions Row */}
                <div className="flex items-center justify-between gap-2 mt-1">
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${
                      item.delivery_status === "cancelled"
                        ? "bg-red-50 text-red-600 border-red-100"
                        : isDelivered
                          ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                          : isShipped
                            ? "bg-blue-50 text-blue-600 border-blue-100"
                            : canShipThisItem
                              ? "bg-transparent text-gray-400 border-gray-200"
                              : "bg-amber-50 text-amber-600 border-amber-100"
                    }`}
                  >
                    {item.delivery_status === "cancelled" ? "Cancelado" : isDelivered ? "Entregado" : isShipped ? "Enviado" : canShipThisItem ? "Pendiente" : statusInfo.label}
                  </span>

                  <div className="flex gap-2">
                    {canShipThisItem && shippableItems.length > 1 && (
                      <button
                        onClick={() =>
                          setShipModal({
                            itemId: [item.id],
                            productName: product.name,
                            order,
                          })
                        }
                        className="text-[10px] px-3 py-1.5 bg-[#6b1e96] text-white font-bold uppercase tracking-wide rounded-lg hover:bg-[#8b2bc0] transition-colors shadow-sm shadow-[#6b1e96]/20"
                      >
                        Enviar Ítem
                      </button>
                    )}

                    {canShipThisItem && (
                      <button
                        onClick={() => setCancelModal({ type: "item", id: item.id, productName: product.name || "Producto" })}
                        className="text-[10px] px-2.5 py-1 bg-white border border-red-100 text-red-500 font-bold uppercase tracking-wide rounded-lg hover:bg-red-50 transition-colors"
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                </div>
                
                {/* Tracking Code + Shipped At inline */}
                {(isShipped || isDelivered) && (item.tracking_code || item.shipped_at) && (
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                    {item.tracking_code && (
                      <div className="flex items-center gap-1.5 text-[10px] text-[#6b1e96] font-bold">
                        <span>{CARRIER_ICONS[item.shipping_carrier?.toLowerCase()]?.icon || "📦"}</span>
                        {item.tracking_code}
                      </div>
                    )}
                    {item.shipped_at && (
                      <div className="flex items-center gap-1 text-[10px] text-gray-500 font-medium bg-gray-100 px-2 py-0.5 rounded-md">
                        <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                        </svg>
                        Despachado: {new Date(item.shipped_at).toLocaleString("es-VE", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Abandoned cancel button */}
        {isAbandoned && (
          <div className="bg-gray-50/50 px-5 py-3 border-t border-gray-100 flex justify-end">
            <button
              onClick={() => handleCancelAbandoned(order.order_id)}
              disabled={cancellingMap[order.order_id]}
              className={`text-[11px] px-4 py-2 bg-white border border-red-200 text-red-600 font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-sm hover:bg-red-50 hover:border-red-300 ${cancellingMap[order.order_id] ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
            >
              {cancellingMap[order.order_id] ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-red-200 border-t-red-600 rounded-full animate-spin" />
                  Liberando Inventario...
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                  </svg>
                  Cancelar Orden y Liberar Stock
                </>
              )}
            </button>
          </div>
        )}
      </div>
    );
  };

  // ── TABLE VIEW ──
  const renderTableView = () => {
    const getOrderStatusLabel = (order) => {
      const activeItems = order.items.filter(i => i.delivery_status !== "cancelled" && i.delivery_status !== "returned");
      const isFullyCancelled = order.items.length > 0 && activeItems.length === 0;
      if (isFullyCancelled) return { label: "Cancelado", cls: "bg-red-50 text-red-700 border-red-200" };

      const allShipped = activeItems.length > 0 && activeItems.every(i => ["shipped", "picked_up", "arrived", "delivered"].includes(i.delivery_status));
      const allDelivered = activeItems.length > 0 && activeItems.every(i => i.delivery_status === "delivered");
      if (allDelivered) return { label: "Entregado", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" };
      if (allShipped) return { label: "Enviado", cls: "bg-blue-50 text-blue-700 border-blue-200" };
      if (order.payment_status === "approved" || order.payment_status === "processing") return { label: "Por Enviar", cls: "bg-amber-50 text-amber-700 border-amber-200" };
      if (order.payment_status === "under_review") return { label: "Validando", cls: "bg-yellow-50 text-yellow-700 border-yellow-200" };
      if (order.payment_status === "pending") return { label: "Abandonado", cls: "bg-gray-100 text-gray-500 border-gray-200" };
      return { label: order.payment_status, cls: "bg-gray-100 text-gray-500 border-gray-200" };
    };

    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-fadeIn">
        <div className="overflow-x-auto">
          <table className="w-full text-left" style={{ borderCollapse: "separate", borderSpacing: 0 }}>
            <thead>
              <tr className="bg-gradient-to-r from-[#1a0a2e] to-[#2d1248] text-white">
                <th className="px-5 py-3.5 text-[11px] font-black uppercase tracking-wider">Orden</th>
                <th className="px-4 py-3.5 text-[11px] font-black uppercase tracking-wider">Fecha</th>
                <th className="px-4 py-3.5 text-[11px] font-black uppercase tracking-wider">Comprador</th>
                <th className="px-4 py-3.5 text-[11px] font-black uppercase tracking-wider">Destino</th>
                <th className="px-4 py-3.5 text-[11px] font-black uppercase tracking-wider text-center">Ítems</th>
                <th className="px-4 py-3.5 text-[11px] font-black uppercase tracking-wider">Tipo</th>
                <th className="px-4 py-3.5 text-[11px] font-black uppercase tracking-wider">Estado</th>
                <th className="px-4 py-3.5 text-[11px] font-black uppercase tracking-wider text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((order, idx) => {
                const shippableItems = order.items.filter(
                  (item) => item.delivery_status !== "shipped" && item.delivery_status !== "delivered" && item.delivery_status !== "cancelled" && item.delivery_status !== "returned" && (order.payment_status === "approved" || order.payment_status === "processing")
                );
                const canShipAny = shippableItems.length > 0;
                const status = getOrderStatusLabel(order);
                const totalItems = order.items.reduce((acc, i) => acc + (i.quantity || 1), 0);
                const category = categorizeOrder(order);
                const isAbandoned = category === "abandoned";

                return (
                  <tr
                    key={order.order_id}
                    className={`border-b border-gray-50 transition-colors ${isAbandoned ? "opacity-50" : "hover:bg-[#6b1e96]/[0.02]"} ${idx % 2 === 0 ? "" : "bg-gray-50/30"}`}
                  >
                    <td className="px-5 py-3.5">
                      <span className="font-black text-[13px] text-gray-900">#{formatOrderNumber(order.order_id)}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-[12px] text-gray-500 font-medium">{formatOrderDate(order.order_created_at)}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[9px] font-black flex-shrink-0">
                          {(order.buyer_name || "C").charAt(0).toUpperCase()}
                        </div>
                        <span className="text-[12px] font-bold text-gray-800 truncate max-w-[120px]">{order.buyer_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-[12px] text-gray-600 font-medium truncate block max-w-[140px]">
                        {order.destination_city ? `${order.destination_city}, ${order.destination_state || ""}` : order.destination_state || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-[#6b1e96]/10 text-[#6b1e96] text-[12px] font-black">{totalItems}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-wider ${order.delivery_type === "local_delivery" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-blue-50 text-blue-700 border border-blue-100"}`}>
                        {order.delivery_type === "local_delivery" ? "🏍️ Local" : "🚚 Nacional"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex text-[10px] font-bold px-2.5 py-1 rounded-lg border ${status.cls}`}>{status.label}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setInvoiceOrder(order)}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-gray-50 hover:bg-[#6b1e96]/10 text-gray-600 hover:text-[#6b1e96] border border-gray-200 hover:border-[#6b1e96]/30 rounded-lg text-[10px] font-bold transition-all"
                          title="Ver recibo"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                          </svg>
                          Ver
                        </button>
                        {canShipAny && (
                          <>
                            <button
                              onClick={() => setShipModal({ itemId: shippableItems.map(i => i.id), productName: `Toda la orden (${shippableItems.length} ítems)`, order })}
                              className="flex items-center gap-1 px-2.5 py-1.5 bg-[#6b1e96] hover:bg-[#8b2bc0] text-white rounded-lg text-[10px] font-bold transition-all shadow-sm shadow-[#6b1e96]/20"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
                              </svg>
                              Enviar
                            </button>
                            <button
                              onClick={() => setCancelModal({ type: "order", id: order.order_id, productName: `Orden #${formatOrderNumber(order.order_id)}` })}
                              className="flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-red-50 text-red-600 border border-red-200 rounded-lg text-[10px] font-bold transition-all"
                              title="Cancelar orden por falta de stock u otras razones"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                              </svg>
                              Cancelar
                            </button>
                          </>
                        )}
                        {isAbandoned && (
                          <button
                            onClick={() => handleCancelAbandoned(order.order_id)}
                            disabled={cancellingMap[order.order_id]}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg text-[10px] font-bold transition-all"
                          >
                            {cancellingMap[order.order_id] ? <div className="w-3 h-3 border-2 border-red-200 border-t-red-600 rounded-full animate-spin" /> : "✕"} Cancelar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderPaginatedOrders = () => {
    if (viewMode === "table") {
      return renderTableView();
    }
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-fadeIn">
        {paginated.map(renderOrder)}
      </div>
    );
  };

  return (
    <div className="min-h-full pb-8">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-3xl font-black text-gray-900 m-0 tracking-tight">
            Órdenes de mi Tienda
          </h2>
          <p className="text-sm text-gray-500 mt-1.5 font-medium">
            Gestiona los pedidos de tus clientes de forma eficiente.
          </p>
        </div>
      </div>

      {/* ── Tabs & Search Bar ── */}
      <div className="mb-8 flex flex-col gap-5">
        {/* Tabs */}
        <div className="flex flex-wrap items-center gap-2 bg-gray-100/50 p-1.5 rounded-2xl w-max border border-gray-200 shadow-sm">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm ${activeTab === tab.id ? tab.color : tab.inactive}`}
            >
              <span className="text-lg">{tab.icon}</span>
              {tab.label}
              <span className={`ml-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black ${activeTab === tab.id ? 'bg-white/20' : 'bg-gray-200 text-gray-500'}`}>
                {statusCounts[tab.id] || 0}
              </span>
            </button>
          ))}
        </div>

        {/* Search & Actions */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[280px]">
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
            <input
              type="text"
              placeholder="Buscar por número de orden o comprador..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full py-3 pl-11 pr-4 bg-white border border-gray-200 rounded-xl text-[13px] text-gray-900 outline-none transition-all focus:border-[#6b1e96] focus:shadow-[0_0_0_4px_rgba(107,30,150,0.1)] placeholder:text-gray-400 font-medium shadow-sm"
            />
          </div>

          <div className="flex-none">
            <select
              value={perPage}
              onChange={(e) => setPerPage(Number(e.target.value))}
              className="py-3 px-4 bg-white border border-gray-200 rounded-xl text-[13px] outline-none transition-all focus:border-[#6b1e96] focus:shadow-[0_0_0_4px_rgba(107,30,150,0.1)] cursor-pointer font-bold text-gray-700 appearance-none pr-10 shadow-sm"
              style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: `right 0.75rem center`, backgroundRepeat: `no-repeat`, backgroundSize: `1.5em 1.5em` }}
            >
              {PAGE_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n} por página
                </option>
              ))}
            </select>
          </div>

          {/* View Toggle */}
          <div className="flex-none flex bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <button
              onClick={() => setViewMode("cards")}
              className={`p-3 transition-all ${viewMode === "cards" ? "bg-[#6b1e96] text-white" : "text-gray-400 hover:text-gray-700 hover:bg-gray-50"}`}
              title="Vista de tarjetas"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25a2.25 2.25 0 0 1-2.25-2.25v-2.25Z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-3 transition-all ${viewMode === "table" ? "bg-[#6b1e96] text-white" : "text-gray-400 hover:text-gray-700 hover:bg-gray-50"}`}
              title="Vista de tabla"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 0 1 0 3.75H5.625a1.875 1.875 0 0 1 0-3.75Z" />
              </svg>
            </button>
          </div>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex-none px-4 py-3 bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 rounded-xl text-[13px] font-bold transition-colors shadow-sm"
            >
              ✕ Limpiar
            </button>
          )}
        </div>
      </div>

      {/* ── Content ── */}
      {error ? (
        <div style={{ background: "#fff", borderRadius: "16px", border: "1px solid rgba(239,68,68,0.2)", padding: "48px 24px", textAlign: "center" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>⚠️</div>
          <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#dc2626", marginBottom: "8px" }}>Error al cargar órdenes</h3>
          <p style={{ color: "#9ca3af", fontSize: "13px", marginBottom: "24px", maxWidth: "400px", margin: "0 auto 24px" }}>{error}</p>
          <button
            onClick={() => fetchStoreOrders()}
            style={{ padding: "10px 24px", background: "linear-gradient(135deg, #531575, #6b1e96)", color: "#fff", borderRadius: "10px", border: "none", fontWeight: 600, fontSize: "13px", cursor: "pointer" }}
          >
            Reintentar
          </button>
        </div>
      ) : loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <LoadingSkeleton variant="order-card" count={3} />
        </div>
      ) : allOrders.length === 0 ? (
        <div style={{ background: "#fff", borderRadius: "16px", border: "1px solid #f0f0f0", padding: "64px 24px", textAlign: "center" }}>
          <div style={{ fontSize: "56px", marginBottom: "16px" }}>🛒</div>
          <h3 style={{ fontSize: "17px", fontWeight: 700, color: "#1a0a2e", marginBottom: "8px" }}>Sin órdenes aún</h3>
          <p style={{ color: "#9ca3af", fontSize: "13px", maxWidth: "400px", margin: "0 auto" }}>
            Cuando un comprador adquiera tus productos, los pedidos aparecerán aquí.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ background: "#fff", borderRadius: "16px", border: "1px solid #f0f0f0", padding: "48px 24px", textAlign: "center" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>🔍</div>
          <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#374151", marginBottom: "8px" }}>Sin resultados</h3>
          <p style={{ color: "#9ca3af", fontSize: "13px", marginBottom: "20px" }}>
            No se encontraron órdenes con los filtros aplicados.
          </p>
          <button
            onClick={clearFilters}
            style={{ padding: "9px 20px", background: "rgba(107,30,150,0.08)", color: "#6b1e96", borderRadius: "8px", border: "1.5px solid rgba(107,30,150,0.15)", fontWeight: 600, fontSize: "12px", cursor: "pointer" }}
          >
            Limpiar filtros
          </button>
        </div>
      ) : (
        <>
          {renderPaginatedOrders()}

          {/* ── Footer: Count + Pagination ── */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: "14px",
              padding: "14px 20px",
              background: "#fff",
              borderRadius: "12px",
              border: "1px solid #f0f0f0",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              flexWrap: "wrap",
              gap: "12px",
            }}
          >
            {/* Order Count */}
            <div style={{ fontSize: "12px", color: "#6b7280" }}>
              Mostrando{" "}
              <span style={{ fontWeight: 700, color: "#1a0a2e" }}>
                {Math.min((currentPage - 1) * perPage + 1, filtered.length)}–
                {Math.min(currentPage * perPage, filtered.length)}
              </span>{" "}
              de{" "}
              <span style={{ fontWeight: 700, color: "#1a0a2e" }}>
                {filtered.length}
              </span>{" "}
              orden{filtered.length !== 1 ? "es" : ""}
              {hasActiveFilters && (
                <span style={{ color: "#9ca3af" }}>
                  {" "}(total: {allOrders.length})
                </span>
              )}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  style={{
                    width: "32px", height: "32px", borderRadius: "8px",
                    border: "1px solid #e5e7eb",
                    background: currentPage === 1 ? "#f9fafb" : "#fff",
                    color: currentPage === 1 ? "#d1d5db" : "#374151",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: currentPage === 1 ? "not-allowed" : "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                  </svg>
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                  .reduce((acc, p, i, arr) => {
                    if (i > 0 && p - arr[i - 1] > 1) acc.push("...");
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p, i) =>
                    p === "..." ? (
                      <span key={`dots-${i}`} style={{ fontSize: "12px", color: "#9ca3af", padding: "0 2px" }}>⋯</span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => setCurrentPage(p)}
                        style={{
                          width: "32px", height: "32px", borderRadius: "8px",
                          border: p === currentPage ? "1.5px solid #6b1e96" : "1px solid #e5e7eb",
                          background: p === currentPage ? "linear-gradient(135deg, #531575, #6b1e96)" : "#fff",
                          color: p === currentPage ? "#c3ff00" : "#374151",
                          fontSize: "12px", fontWeight: p === currentPage ? 700 : 500,
                          cursor: "pointer", transition: "all 0.15s",
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}
                      >
                        {p}
                      </button>
                    ),
                  )}

                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  style={{
                    width: "32px", height: "32px", borderRadius: "8px",
                    border: "1px solid #e5e7eb",
                    background: currentPage === totalPages ? "#f9fafb" : "#fff",
                    color: currentPage === totalPages ? "#d1d5db" : "#374151",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── Invoice / Receipt Modal ── */}
      {invoiceOrder && (() => {
        const totalProductos = invoiceOrder.items.reduce((acc, i) => acc + (i.quantity || 1), 0);
        const subtotal = invoiceOrder.items.reduce((acc, i) => acc + (i.quantity * i.unit_price), 0);
        return (
          <div
            onClick={() => setInvoiceOrder(null)}
            style={{
              position: "fixed", inset: 0, zIndex: 9999,
              background: "rgba(10,5,20,0.85)", backdropFilter: "blur(8px)",
              display: "flex", alignItems: "center", justifyContent: "center",
              padding: "16px", animation: "fadeIn 0.2s ease-out",
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                background: "#fff", borderRadius: "20px",
                maxWidth: "600px", width: "100%", overflow: "hidden",
                boxShadow: "0 25px 60px rgba(0,0,0,0.4)",
                animation: "scaleIn 0.25s ease-out", maxHeight: "90vh", overflowY: "auto",
              }}
            >
              {/* Invoice Header */}
              <div style={{
                background: "linear-gradient(135deg, #1a0a2e, #2d1248)",
                padding: "24px 28px", position: "relative",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontSize: "10px", color: "rgba(195,255,0,0.7)", fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "6px" }}>
                      Recibo de Orden
                    </div>
                    <h3 style={{ fontSize: "22px", fontWeight: 900, color: "#c3ff00", margin: "0 0 4px 0", letterSpacing: "-0.02em" }}>
                      #{formatOrderNumber(invoiceOrder.order_id)}
                    </h3>
                    <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", margin: 0 }}>
                      {formatOrderDate(invoiceOrder.order_created_at)}
                    </p>
                  </div>
                  <span style={{
                    fontSize: "10px", fontWeight: 800, padding: "4px 12px", borderRadius: "20px",
                    background: invoiceOrder.delivery_type === "local_delivery" ? "rgba(16,185,129,0.2)" : "rgba(59,130,246,0.2)",
                    color: invoiceOrder.delivery_type === "local_delivery" ? "#6ee7b7" : "#93c5fd",
                  }}>
                    {invoiceOrder.delivery_type === "local_delivery" ? "🏍️ Delivery" : "🚚 Encomienda"}
                  </span>
                </div>
              </div>

              {/* Buyer & Destination Info */}
              <div style={{ padding: "16px 28px", borderBottom: "1px solid #f0f0f0" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", fontSize: "12px" }}>
                  <div>
                    <div style={{ color: "#9ca3af", fontWeight: 700, fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>Comprador</div>
                    <div style={{ fontWeight: 700, color: "#1a0a2e" }}>{invoiceOrder.buyer_name}</div>
                  </div>
                  {invoiceOrder.destination_state && (
                    <div>
                      <div style={{ color: "#9ca3af", fontWeight: 700, fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>Destino</div>
                      <div style={{ fontWeight: 700, color: "#1a0a2e" }}>{invoiceOrder.destination_city ? `${invoiceOrder.destination_city}, ` : ""}{invoiceOrder.destination_state}</div>
                    </div>
                  )}
                </div>
                {(invoiceOrder.buyer_address || invoiceOrder.delivery_address) && (
                  <div style={{ marginTop: "10px", padding: "8px 12px", background: "#f9fafb", borderRadius: "8px", border: "1px solid #f0f0f0" }}>
                    <div style={{ color: "#9ca3af", fontWeight: 700, fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "3px" }}>Dirección</div>
                    <div style={{ fontWeight: 600, color: "#374151", fontSize: "12px" }}>
                      {invoiceOrder.delivery_type === "local_delivery" ? invoiceOrder.delivery_address : invoiceOrder.buyer_address}
                    </div>
                    {invoiceOrder.delivery_reference && (
                      <div style={{ color: "#6b7280", marginTop: "3px", fontSize: "11px" }}>Ref: {invoiceOrder.delivery_reference}</div>
                    )}
                  </div>
                )}
                {invoiceOrder.notes && (
                  <div style={{ marginTop: "8px", padding: "6px 12px", background: "rgba(245,158,11,0.06)", borderRadius: "8px", fontSize: "11px", color: "#92400e", fontWeight: 500, border: "1px solid rgba(245,158,11,0.12)" }}>
                    💬 {invoiceOrder.notes}
                  </div>
                )}
              </div>

              {/* Product List — PACKING TABLE */}
              <div style={{ padding: "16px 28px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <div style={{ fontSize: "11px", fontWeight: 800, color: "#6b1e96", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    Lista de Productos
                  </div>
                  <div style={{ fontSize: "11px", fontWeight: 700, color: "#9ca3af" }}>
                    {totalProductos} {totalProductos === 1 ? "unidad" : "unidades"} · {invoiceOrder.items.length} {invoiceOrder.items.length === 1 ? "producto" : "productos"}
                  </div>
                </div>

                {/* Table Header */}
                <div style={{
                  display: "grid", gridTemplateColumns: "48px 1fr 60px 70px 80px",
                  gap: "8px", padding: "8px 0", borderBottom: "2px solid #e5e7eb",
                  fontSize: "10px", fontWeight: 800, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em",
                }}>
                  <div></div>
                  <div>Producto</div>
                  <div style={{ textAlign: "center" }}>Cant.</div>
                  <div style={{ textAlign: "right" }}>P/U</div>
                  <div style={{ textAlign: "right" }}>Subtotal</div>
                </div>

                {/* Product Rows */}
                {invoiceOrder.items.map((item, idx) => {
                  const product = item.products || {};
                  const variationText = getVariationText(item.product_variations);
                  const itemSubtotal = item.quantity * item.unit_price;
                  const statusLabel = item.delivery_status === "delivered" ? "Entregado" : item.delivery_status === "shipped" ? "Enviado" : item.delivery_status === "cancelled" ? "Cancelado" : "Pendiente";
                  const statusColor = item.delivery_status === "delivered" ? "#059669" : item.delivery_status === "shipped" ? "#2563eb" : item.delivery_status === "cancelled" ? "#dc2626" : "#d97706";

                  return (
                    <div
                      key={item.id}
                      style={{
                        display: "grid", gridTemplateColumns: "48px 1fr 60px 70px 80px",
                        gap: "8px", padding: "12px 0", alignItems: "center",
                        borderBottom: idx < invoiceOrder.items.length - 1 ? "1px solid #f5f5f5" : "none",
                      }}
                    >
                      {/* Thumbnail */}
                      <div style={{ width: "48px", height: "48px", borderRadius: "10px", overflow: "hidden", background: "#f9fafb", border: "1px solid #f0f0f0", flexShrink: 0 }}>
                        {product.images?.[0] ? (
                          <img src={product.images[0]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", color: "#d1d5db" }}>🦷</div>
                        )}
                      </div>

                      {/* Product Name + Variation */}
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: "13px", color: "#1a0a2e", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {product.name || "Producto desconocido"}
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "3px" }}>
                          {variationText && (
                            <span style={{ fontSize: "10px", background: "#f3f4f6", padding: "1px 6px", borderRadius: "4px", color: "#6b7280", fontWeight: 600 }}>
                              {variationText}
                            </span>
                          )}
                          <span style={{ fontSize: "10px", padding: "1px 6px", borderRadius: "4px", fontWeight: 700, color: statusColor, background: `${statusColor}11` }}>
                            {statusLabel}
                          </span>
                        </div>
                      </div>

                      {/* Quantity — prominent */}
                      <div style={{ textAlign: "center" }}>
                        <span style={{
                          display: "inline-flex", alignItems: "center", justifyContent: "center",
                          width: "32px", height: "32px", borderRadius: "8px",
                          background: "linear-gradient(135deg, #6b1e96, #8b2bc0)", color: "#c3ff00",
                          fontSize: "14px", fontWeight: 900, boxShadow: "0 2px 6px rgba(107,30,150,0.2)",
                        }}>
                          {item.quantity}
                        </span>
                      </div>

                      {/* Unit Price */}
                      <div style={{ textAlign: "right", fontSize: "12px", color: "#6b7280", fontWeight: 600 }}>
                        {formatCurrencyUSD(item.unit_price)}
                      </div>

                      {/* Subtotal */}
                      <div style={{ textAlign: "right", fontSize: "13px", color: "#1a0a2e", fontWeight: 800 }}>
                        {formatCurrencyUSD(itemSubtotal)}
                      </div>
                    </div>
                  );
                })}

                {/* Totals */}
                <div style={{
                  marginTop: "12px", padding: "14px 0", borderTop: "2px solid #1a0a2e",
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                }}>
                  <div style={{ fontSize: "14px", fontWeight: 800, color: "#1a0a2e" }}>
                    Total ({totalProductos} {totalProductos === 1 ? "unidad" : "unidades"})
                  </div>
                  <div style={{ fontSize: "20px", fontWeight: 900, color: "#6b1e96" }}>
                    {formatCurrencyUSD(subtotal)}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div style={{ padding: "12px 28px 24px", display: "flex", gap: "10px" }}>
                <button
                  onClick={() => setInvoiceOrder(null)}
                  style={{
                    flex: 1, padding: "11px",
                    background: "#f3f4f6", color: "#6b7280",
                    borderRadius: "10px", border: "none",
                    fontWeight: 700, fontSize: "13px", cursor: "pointer",
                  }}
                >
                  Cerrar
                </button>
                <button
                  onClick={() => {
                    const printArea = document.getElementById("invoice-print-area");
                    if (printArea) {
                      const w = window.open("", "_blank");
                      w.document.write(`<html><head><title>Orden ${formatOrderNumber(invoiceOrder.order_id)}</title><style>body{font-family:system-ui,-apple-system,sans-serif;margin:20px;color:#1a0a2e}table{width:100%;border-collapse:collapse}th,td{padding:8px 10px;text-align:left;border-bottom:1px solid #e5e7eb}th{font-size:11px;text-transform:uppercase;color:#6b7280;font-weight:800}td{font-size:13px}.qty{text-align:center;font-weight:900;font-size:16px;color:#6b1e96}.price{text-align:right;font-weight:700}.total-row td{border-top:2px solid #1a0a2e;font-weight:900;font-size:15px}h1{margin:0 0 4px;font-size:20px}p{color:#6b7280;font-size:12px;margin:0}@media print{body{margin:10px}}</style></head><body>`);
                      w.document.write(printArea.innerHTML);
                      w.document.write("</body></html>");
                      w.document.close();
                      w.print();
                    }
                  }}
                  style={{
                    flex: 2, padding: "11px",
                    background: "linear-gradient(135deg, #531575, #6b1e96)",
                    color: "#c3ff00", borderRadius: "10px", border: "none",
                    fontWeight: 700, fontSize: "13px", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                    boxShadow: "0 4px 15px rgba(107,30,150,0.3)",
                  }}
                >
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0 0 21 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 0 0-1.913-.247M6.34 18H5.25A2.25 2.25 0 0 1 3 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 0 1 1.913-.247m10.5 0a48.536 48.536 0 0 0-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18.75 12h.008v.008h-.008V12Zm-3 0h.008v.008h-.008V12Z" />
                  </svg>
                  Imprimir Recibo
                </button>
              </div>

              {/* Hidden printable area */}
              <div id="invoice-print-area" style={{ display: "none" }}>
                <h1>Orden {formatOrderNumber(invoiceOrder.order_id)}</h1>
                <p>{formatOrderDate(invoiceOrder.order_created_at)} · {invoiceOrder.buyer_name}</p>
                <p>{invoiceOrder.destination_city ? `${invoiceOrder.destination_city}, ` : ""}{invoiceOrder.destination_state || ""}</p>
                <p>{invoiceOrder.delivery_type === "local_delivery" ? invoiceOrder.delivery_address : invoiceOrder.buyer_address}</p>
                {invoiceOrder.notes && <p><strong>Nota:</strong> {invoiceOrder.notes}</p>}
                <br/>
                <table>
                  <thead><tr><th>Producto</th><th>Variación</th><th style={{textAlign:"center"}}>Cant.</th><th style={{textAlign:"right"}}>P/U</th><th style={{textAlign:"right"}}>Subtotal</th></tr></thead>
                  <tbody>
                    {invoiceOrder.items.map(item => {
                      const p = item.products || {};
                      return (
                        <tr key={item.id}>
                          <td>{p.name || "Producto"}</td>
                          <td>{getVariationText(item.product_variations) || "—"}</td>
                          <td className="qty" style={{textAlign:"center",fontWeight:900}}>{item.quantity}</td>
                          <td className="price" style={{textAlign:"right"}}>${item.unit_price.toFixed(2)}</td>
                          <td className="price" style={{textAlign:"right"}}>${(item.quantity * item.unit_price).toFixed(2)}</td>
                        </tr>
                      );
                    })}
                    <tr className="total-row">
                      <td colSpan={2}><strong>TOTAL ({totalProductos} unidades)</strong></td>
                      <td></td>
                      <td></td>
                      <td style={{textAlign:"right"}}><strong>${subtotal.toFixed(2)}</strong></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Ship Modal (Mejorado) ── */}
      {shipModal && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 9999,
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "16px",
          }}
        >
          <div
            style={{ position: "absolute", inset: 0, background: "rgba(10,5,20,0.7)", backdropFilter: "blur(6px)" }}
            onClick={() => !shipping && setShipModal(null)}
          />
          <div
            style={{
              position: "relative", background: "#fff", borderRadius: "20px",
              boxShadow: "0 25px 60px rgba(0,0,0,0.4)",
              maxWidth: "480px", width: "100%", padding: "28px",
              animation: "scaleIn 0.25s ease-out",
              maxHeight: "90vh", overflowY: "auto",
            }}
          >
            <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#1a0a2e", margin: "0 0 4px 0" }}>
              Confirmar Envío
            </h3>
            <p style={{
              fontSize: "12px", color: "#6b7280", margin: "12px 0 16px 0",
              background: "#faf5ff", padding: "10px 14px", borderRadius: "10px",
              border: "1px solid rgba(107,30,150,0.1)", fontWeight: 600,
            }}>
              📦 {shipModal.productName}
            </p>

            {/* ── Destination Info Card ── */}
            {shipModal.order && (
              <div style={{
                background: "linear-gradient(135deg, #f0f9ff, #f5f3ff)", padding: "14px",
                borderRadius: "12px", border: "1px solid rgba(107,30,150,0.08)",
                marginBottom: "16px", fontSize: "12px",
              }}>
                <div style={{ fontWeight: 800, color: "#1a0a2e", marginBottom: "10px", fontSize: "13px", display: "flex", alignItems: "center", gap: "6px" }}>
                  📍 Destino del envío
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <span style={{ color: "#6b7280", fontWeight: 600 }}>Comprador:</span>
                    <div style={{ fontWeight: 700, color: "#1a0a2e" }}>{shipModal.order.buyer_name}</div>
                  </div>
                  {shipModal.order.destination_state && (
                    <div>
                      <span style={{ color: "#6b7280", fontWeight: 600 }}>Estado:</span>
                      <div style={{ fontWeight: 700, color: "#6b1e96" }}>{shipModal.order.destination_state}</div>
                    </div>
                  )}
                  {shipModal.order.destination_city && (
                    <div>
                      <span style={{ color: "#6b7280", fontWeight: 600 }}>Ciudad:</span>
                      <div style={{ fontWeight: 700, color: "#6b1e96" }}>{shipModal.order.destination_city}</div>
                    </div>
                  )}
                  <div style={{ gridColumn: "1 / -1" }}>
                    <span style={{ color: "#6b7280", fontWeight: 600 }}>Tipo entrega:</span>
                    <div style={{ fontWeight: 700, color: shipModal.order.delivery_type === "local_delivery" ? "#10b981" : "#3b82f6" }}>
                      {shipModal.order.delivery_type === "local_delivery" ? "🏍️ Delivery Local" : "🚚 Encomienda"}
                    </div>
                  </div>
                </div>
                {(shipModal.order.buyer_address || shipModal.order.delivery_address) && (
                  <div style={{ marginTop: "10px", padding: "8px 10px", background: "rgba(255,255,255,0.7)", borderRadius: "8px", border: "1px solid rgba(0,0,0,0.05)" }}>
                    <span style={{ color: "#6b7280", fontWeight: 600, fontSize: "11px" }}>Dirección:</span>
                    <div style={{ fontWeight: 600, color: "#1a0a2e", marginTop: "2px" }}>
                      {shipModal.order.delivery_type === "local_delivery"
                        ? shipModal.order.delivery_address
                        : shipModal.order.buyer_address}
                    </div>
                    {shipModal.order.delivery_reference && (
                      <div style={{ color: "#6b7280", marginTop: "4px", fontSize: "11px" }}>
                        Ref: {shipModal.order.delivery_reference}
                      </div>
                    )}
                  </div>
                )}
                {shipModal.order.notes && (
                  <div style={{ marginTop: "8px", padding: "6px 10px", background: "rgba(245,158,11,0.08)", borderRadius: "8px", fontSize: "11px", color: "#92400e" }}>
                    💬 Nota del comprador: {shipModal.order.notes}
                  </div>
                )}
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {shipModal.order?.delivery_type !== "local_delivery" ? (
                <>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#374151", marginBottom: "6px" }}>
                      Empresa de Envío
                    </label>
                    <select
                      value={trackingForm.shipping_carrier}
                      onChange={(e) => setTrackingForm((prev) => ({ ...prev, shipping_carrier: e.target.value }))}
                      style={{
                        width: "100%", padding: "10px 14px",
                        border: "1.5px solid #e5e7eb", borderRadius: "10px",
                        fontSize: "13px", outline: "none", background: "#fafafa",
                        boxSizing: "border-box",
                      }}
                    >
                      {CARRIERS.map((c) => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#374151", marginBottom: "6px" }}>
                      Código de Tracking (Guía) <span style={{ color: "#dc2626" }}>*</span>
                    </label>
                    <input
                      type="text"
                      value={trackingForm.tracking_code}
                      onChange={(e) => setTrackingForm((prev) => ({ ...prev, tracking_code: e.target.value }))}
                      style={{
                        width: "100%", padding: "10px 14px",
                        border: "1.5px solid #e5e7eb", borderRadius: "10px",
                        fontSize: "13px", outline: "none", background: "#fafafa",
                        boxSizing: "border-box",
                      }}
                      placeholder="Ej: ZM-123456789"
                      autoFocus
                      onFocus={(e) => { e.target.style.borderColor = "#6b1e96"; e.target.style.boxShadow = "0 0 0 3px rgba(107,30,150,0.08)"; }}
                      onBlur={(e) => { e.target.style.borderColor = "#e5e7eb"; e.target.style.boxShadow = "none"; }}
                    />
                  </div>
                </>
              ) : (
                <div style={{
                  padding: "12px", background: "rgba(16,185,129,0.08)",
                  borderRadius: "10px", border: "1px solid rgba(16,185,129,0.2)"
                }}>
                  <p style={{ margin: 0, fontSize: "13px", color: "#065f46", fontWeight: 600, display: "flex", alignItems: "center", gap: "6px" }}>
                    <span>🏍️</span> Envío Local Activo
                  </p>
                  <p style={{ margin: "4px 0 0 0", fontSize: "11px", color: "#047857" }}>
                    No necesitas ingresar guía de tracking nacional. Puedes asignar un rider o despachar el pedido tú mismo.
                  </p>
                </div>
              )}

              {/* Rider Selector — Solo visible para Delivery Local */}
              {riders.length > 0 && shipModal.order?.delivery_type === "local_delivery" && (
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#374151", marginBottom: "6px" }}>
                    Asignar Rider (Opcional)
                  </label>
                  <select
                    value={trackingForm.assigned_rider_id || ""}
                    onChange={(e) => setTrackingForm((prev) => ({ ...prev, assigned_rider_id: e.target.value || null }))}
                    style={{
                      width: "100%", padding: "10px 14px",
                      border: "1.5px solid #e5e7eb", borderRadius: "10px",
                      fontSize: "13px", outline: "none", background: "#fafafa",
                      boxSizing: "border-box",
                    }}
                  >
                    <option value="">Sin asignar / Entrega propia</option>
                    {riders.map((r) => (
                      <option key={r.rider_id || r.id} value={r.rider_id || r.id}>
                        {r.users?.full_name || r.rider_name || r.email || "Rider"}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Evidence Uploader */}
            <div style={{ marginTop: "16px" }}>
              <ShippingEvidenceUploader
                onEvidenceChange={(urls) => setTrackingForm(prev => ({ ...prev, shipping_evidence_urls: urls }))}
              />
            </div>

            <div style={{ display: "flex", gap: "10px", marginTop: "24px" }}>
              <button
                onClick={() => setShipModal(null)}
                disabled={shipping}
                style={{
                  flex: 1, padding: "10px",
                  background: "#f3f4f6", color: "#6b7280",
                  borderRadius: "10px", border: "none",
                  fontWeight: 700, fontSize: "13px",
                  cursor: "pointer",
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleShip}
                disabled={shipping || (shipModal.order?.delivery_type !== "local_delivery" && !trackingForm.tracking_code.trim()) || trackingForm.shipping_evidence_urls.length < 1}
                style={{
                  flex: 2, padding: "10px",
                  background: shipping || (shipModal.order?.delivery_type !== "local_delivery" && !trackingForm.tracking_code.trim()) || trackingForm.shipping_evidence_urls.length < 1
                    ? "rgba(107,30,150,0.4)"
                    : "linear-gradient(135deg, #531575, #6b1e96)",
                  color: "#c3ff00", borderRadius: "10px", border: "none",
                  fontWeight: 700, fontSize: "13px",
                  cursor: shipping ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                  boxShadow: "0 4px 15px rgba(107,30,150,0.3)",
                }}
              >
                {shipping ? (
                  <>
                    <div style={{ width: "16px", height: "16px", border: "2px solid rgba(195,255,0,0.3)", borderTop: "2px solid #c3ff00", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                    Procesando...
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
                    </svg>
                    Confirmar Envío
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Cancel Modal ── */}
      {cancelModal && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 9999,
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "16px",
          }}
        >
          <div
            style={{ position: "absolute", inset: 0, background: "rgba(10,5,20,0.7)", backdropFilter: "blur(6px)" }}
            onClick={() => !cancelling && (setCancelModal(null), setCancelReason(""))}
          />
          <div
            style={{
              position: "relative", background: "#fff", borderRadius: "20px",
              boxShadow: "0 25px 60px rgba(0,0,0,0.4)",
              maxWidth: "420px", width: "100%", padding: "28px",
              animation: "scaleIn 0.25s ease-out",
            }}
          >
            <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#dc2626", margin: "0 0 4px 0" }}>
              ⚠️ Cancelar {cancelModal.type === "item" ? "Ítem" : "Orden"}
            </h3>
            <p style={{
              fontSize: "12px", color: "#6b7280", margin: "12px 0 16px 0",
              background: "rgba(239,68,68,0.05)", padding: "10px 14px", borderRadius: "10px",
              border: "1px solid rgba(239,68,68,0.15)", fontWeight: 600,
            }}>
              {cancelModal.productName}
            </p>

            <div style={{
              background: "#fffbeb", padding: "10px 14px", borderRadius: "10px",
              border: "1px solid rgba(245,158,11,0.2)", marginBottom: "16px",
              fontSize: "11px", color: "#92400e", fontWeight: 500,
            }}>
              ⚡ Al cancelar, el stock se restaurará automáticamente y el comprador será notificado.
            </div>

            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#374151", marginBottom: "6px" }}>
                Motivo de cancelación <span style={{ color: "#dc2626" }}>*</span>
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                style={{
                  width: "100%", padding: "10px 14px",
                  border: "1.5px solid #e5e7eb", borderRadius: "10px",
                  fontSize: "13px", outline: "none", background: "#fafafa",
                  boxSizing: "border-box", resize: "vertical", minHeight: "80px",
                }}
                placeholder="Ej: Producto agotado en inventario físico..."
                autoFocus
                onFocus={(e) => { e.target.style.borderColor = "#dc2626"; e.target.style.boxShadow = "0 0 0 3px rgba(239,68,68,0.08)"; }}
                onBlur={(e) => { e.target.style.borderColor = "#e5e7eb"; e.target.style.boxShadow = "none"; }}
              />
              <p style={{ fontSize: "10px", color: "#9ca3af", marginTop: "4px" }}>
                Mínimo 5 caracteres. Este motivo quedará registrado y será visible para el comprador.
              </p>
            </div>

            <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
              <button
                onClick={() => { setCancelModal(null); setCancelReason(""); }}
                disabled={cancelling}
                style={{
                  flex: 1, padding: "10px",
                  background: "#f3f4f6", color: "#6b7280",
                  borderRadius: "10px", border: "none",
                  fontWeight: 700, fontSize: "13px",
                  cursor: "pointer",
                }}
              >
                Volver
              </button>
              <button
                onClick={handleCancelConfirm}
                disabled={cancelling || cancelReason.trim().length < 5}
                style={{
                  flex: 2, padding: "10px",
                  background: cancelling || cancelReason.trim().length < 5
                    ? "rgba(239,68,68,0.4)"
                    : "linear-gradient(135deg, #dc2626, #b91c1c)",
                  color: "#fff", borderRadius: "10px", border: "none",
                  fontWeight: 700, fontSize: "13px",
                  cursor: cancelling ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                  boxShadow: "0 4px 15px rgba(239,68,68,0.3)",
                }}
              >
                {cancelling ? (
                  <>
                    <div style={{ width: "16px", height: "16px", border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid #fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                    Cancelando...
                  </>
                ) : (
                  <>
                    ✕ Confirmar Cancelación
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Keyframe animations */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
