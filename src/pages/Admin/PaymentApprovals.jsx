import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import PropTypes from "prop-types";
import { useOrder } from "../../context/OrderContext";
import PaymentApprovalQueue from "../../components/admin/PaymentApprovalQueue";
import PaymentReviewSlideOver from "../../components/admin/PaymentReviewSlideOver";
import Pagination from "../../components/admin/Pagination";
import { getPaymentHistoryAPI } from "../../services/api";
import { formatCurrencyUSD, formatCurrencyVES, formatOrderDateTime } from "../../utils/formatters";
import toast from "react-hot-toast";
import { useAdminStats } from "../../context/AdminStatsContext";

const TABS = [
  { id: "under_review", label: "Por revisar" },
  { id: "approved", label: "Aprobados" },
  { id: "rejected", label: "Rechazados" },
];

const RESOLVED_PER_PAGE = 10;

const BADGES = {
  approved: { label: "Aprobado", bg: "#dcfce7", color: "#166534", dot: "#22c55e" },
  rejected: { label: "Rechazado", bg: "#fee2e2", color: "#991b1b", dot: "#ef4444" },
  under_review: { label: "En Revisión", bg: "#fef9c3", color: "#854d0e", dot: "#eab308" },
};

function StatusBadge({ status }) {
  const c = BADGES[status] || BADGES.under_review;
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
      style={{ background: c.bg, color: c.color }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: c.dot }} />
      {c.label}
    </span>
  );
}

StatusBadge.propTypes = { status: PropTypes.string.isRequired };

export default function PaymentApprovals() {
  const { orders, fetchOrders, approvePayment, rejectPayment, loading } =
    useOrder();
  const { refreshStats } = useAdminStats();

  const [activeTab, setActiveTab] = useState("under_review");

  // Active review state
  const [activeOrder, setActiveOrder] = useState(null);
  const [reviewOrder, setReviewOrder] = useState(null);

  // Historial resuelto (pestañas Aprobados / Rechazados)
  const latestResolved = useRef(0);
  const [resolved, setResolved] = useState([]);
  const [resolvedPage, setResolvedPage] = useState(1);
  const [resolvedTotal, setResolvedTotal] = useState(0);
  const [resolvedLoading, setResolvedLoading] = useState(false);

  const [counts, setCounts] = useState({});

  // Deep link desde notificaciones: /admin/payment-approvals?order=<uuid>.
  // Se resuelve una sola vez, cuando la cola termina su primera carga.
  const [searchParams, setSearchParams] = useSearchParams();
  const deepLinkHandled = useRef(false);
  const queueRequested = useRef(false);

  const refreshQueue = useCallback(() => {
    fetchOrders({ payment_status: "under_review", admin_view: "true" });
  }, [fetchOrders]);

  // Los tres contadores de una sola llamada. No sirve reutilizar la consulta de la
  // pestaña activa: getPaymentHistory aplica el filtro de estado también al resumen,
  // así que un countByStatus filtrado sólo traería una clave.
  const refreshCounts = useCallback(async () => {
    try {
      const res = await getPaymentHistoryAPI({ limit: 1 });
      setCounts(res.data?.summary?.countByStatus || {});
    } catch {
      // Los contadores son accesorios: si fallan, la cola sigue usable.
    }
  }, []);

  useEffect(() => {
    refreshQueue();
    refreshCounts();
  }, [refreshQueue, refreshCounts]);

  useEffect(() => {
    setResolvedPage(1);
  }, [activeTab]);

  const fetchResolved = useCallback(async () => {
    if (activeTab === "under_review") return;
    const requestId = ++latestResolved.current;
    setResolvedLoading(true);
    setResolved([]);
    try {
      const res = await getPaymentHistoryAPI({
        payment_status: activeTab,
        page: resolvedPage,
        limit: RESOLVED_PER_PAGE,
      });
      if (requestId !== latestResolved.current) return;
      setResolved(res.data?.data || []);
      setResolvedTotal(res.data?.pagination?.total || 0);
    } catch (err) {
      if (requestId !== latestResolved.current) return;
      toast.error(err.message || "Error cargando el historial de pagos");
    } finally {
      if (requestId === latestResolved.current) setResolvedLoading(false);
    }
  }, [activeTab, resolvedPage]);

  useEffect(() => {
    fetchResolved();
  }, [fetchResolved]);

  useEffect(() => {
    // `loading` arranca en false: hay que ver pasar la carga de la cola antes de buscar.
    if (loading) {
      queueRequested.current = true;
      return;
    }
    if (!queueRequested.current || deepLinkHandled.current) return;
    const targetId = searchParams.get("order");
    if (!targetId) return;
    deepLinkHandled.current = true;
    setSearchParams({}, { replace: true });

    const queued = orders.find(
      (o) => o.id === targetId && o.payment_status === "under_review",
    );
    if (queued) {
      setActiveOrder(queued);
      return;
    }

    // No está en la cola: el historial no filtra por id, así que se revisan los
    // últimos 100 pagos de cualquier estado y se salta a la pestaña que corresponda.
    (async () => {
      try {
        const res = await getPaymentHistoryAPI({ limit: 100 });
        const found = (res.data?.data || []).find((o) => o.id === targetId);
        if (!found) {
          toast.error("No se encontró el pago indicado");
          return;
        }
        if (found.payment_status === "under_review") {
          setActiveOrder(found);
          return;
        }
        if (TABS.some((t) => t.id === found.payment_status)) {
          setActiveTab(found.payment_status);
        }
        setReviewOrder(found);
      } catch {
        toast.error("No se encontró el pago indicado");
      }
    })();
  }, [loading, orders, searchParams, setSearchParams]);

  const confirmApprove = async (orderId) => {
    const res = await approvePayment(orderId);
    if (res.success) {
      const count = res.approved_count || 1;
      toast.success(
        count > 1
          ? `Pago aprobado con éxito. ${count} órdenes del grupo pasaron a procesamiento.`
          : `Pago de la orden ${orderId.split("-")[0].toUpperCase()} aprobado con éxito.`
      );
      setActiveOrder(null);
      refreshQueue();
      refreshCounts();
      refreshStats();
    } else {
      toast.error(res.error || "No se pudo aprobar la orden.");
    }
  };

  const confirmReject = async (orderId, reason) => {
    const res = await rejectPayment(orderId, reason);
    if (res.success) {
      const count = res.rejected_count || 1;
      toast.success(
        count > 1
          ? `${count} órdenes del grupo rechazadas con éxito.`
          : `Orden rechazada con éxito.`
      );
      setActiveOrder(null);
      refreshQueue();
      refreshCounts();
      refreshStats();
    } else {
      toast.error(res.error || "Error al rechazar pago");
    }
  };

  // Filter orders manually on frontend just in case backend ignores param temporarily
  const pendingOrders = orders.filter(
    (o) => o.payment_status === "under_review",
  );

  const tabCount = (id) =>
    id === "under_review" ? pendingOrders.length : counts[id] || 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in-up">
      <div className="md:flex md:items-center md:justify-between mb-8">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate flex items-center gap-3">
            <svg
              className="w-8 h-8 text-primary-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              ></path>
            </svg>
            Panel de Aprobación Escrow
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Valida depósitos y transferencias antes de liberar despachos para
            garantizar ventas 100% seguras.
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <button
            onClick={() => {
              if (activeTab === "under_review") refreshQueue();
              else fetchResolved();
              refreshCounts();
            }}
            disabled={loading || resolvedLoading}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            {loading || resolvedLoading ? "Actualizando..." : "Refrescar Cola"}
          </button>
        </div>
      </div>

      {/* Pestañas */}
      <div className="flex flex-wrap items-center gap-2 mb-6 border-b border-gray-200">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 -mb-px text-sm font-semibold border-b-2 transition-colors ${
              activeTab === tab.id
                ? "border-[#6b1e96] text-[#6b1e96]"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            {tab.label}
            <span className="px-1.5 py-0.5 rounded-md text-[10px] font-black tabular-nums bg-gray-100 text-gray-500">
              {tabCount(tab.id)}
            </span>
          </button>
        ))}
      </div>

      {activeTab === "under_review" ? (
        loading && !pendingOrders.length ? (
          <div className="flex justify-center items-center h-48">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <PaymentApprovalQueue
            orders={pendingOrders}
            onReviewOrder={setActiveOrder}
          />
        )
      ) : resolvedLoading ? (
        <div className="flex justify-center items-center h-48">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
        </div>
      ) : resolved.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-700">Sin pagos {activeTab === "approved" ? "aprobados" : "rechazados"}</h3>
          <p className="mt-1 text-sm text-gray-400">Todavía no se ha resuelto ningún pago con este resultado.</p>
        </div>
      ) : (
        <div className="md:bg-white md:rounded-2xl md:border md:border-gray-100 md:shadow-sm md:overflow-hidden">
          {/* Móvil: tarjetas */}
          <div className="md:hidden space-y-3">
            {resolved.map((order) => (
              <div key={order.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <span className="text-sm font-bold font-mono tracking-wide" style={{ color: "#531575" }}>
                      {order.id.split("-")[0].toUpperCase()}
                    </span>
                    <div className="text-xs text-gray-500 mt-0.5">{formatOrderDateTime(order.created_at)}</div>
                  </div>
                  <StatusBadge status={order.payment_status} />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">{order.users?.full_name || "—"}</div>
                  <div className="text-xs text-gray-400 truncate">{order.users?.email || ""}</div>
                </div>
                <div className="text-right pt-3 border-t border-gray-100">
                  <div className="text-sm font-bold text-gray-900">{formatCurrencyUSD(order.total_usd)}</div>
                  <div className="text-xs text-gray-400">{formatCurrencyVES(order.total_ves)}</div>
                </div>
                <button
                  onClick={() => setReviewOrder(order)}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-semibold text-[#531575] bg-[#531575]/8 active:bg-[#531575]/15 transition-colors"
                >
                  Ver comprobante y detalle
                </button>
              </div>
            ))}
          </div>

          {/* Escritorio: tabla */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100 hidden md:table">
              <thead>
                <tr style={{ background: "linear-gradient(135deg, #f8f5fc 0%, #f5f3ff 100%)" }}>
                  <th className="px-5 py-3.5 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">Orden</th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">Cliente</th>
                  <th className="px-5 py-3.5 text-right text-[11px] font-bold text-gray-500 uppercase tracking-wider">Monto</th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">Fecha</th>
                  <th className="px-5 py-3.5 text-center text-[11px] font-bold text-gray-500 uppercase tracking-wider">Detalle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {resolved.map((order) => (
                  <tr key={order.id} className="transition-colors duration-150 hover:bg-purple-50/30">
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="text-sm font-bold font-mono tracking-wide" style={{ color: "#531575" }}>
                        {order.id.split("-")[0].toUpperCase()}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-sm font-medium text-gray-900">{order.users?.full_name || "—"}</div>
                      <div className="text-xs text-gray-400">{order.users?.email || ""}</div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-right">
                      <div className="text-sm font-bold text-gray-900">{formatCurrencyUSD(order.total_usd)}</div>
                      <div className="text-xs text-gray-400">{formatCurrencyVES(order.total_ves)}</div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-700">
                      {formatOrderDateTime(order.created_at)}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-center">
                      <button
                        onClick={() => setReviewOrder(order)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#531575] bg-[#531575]/8 hover:bg-[#531575]/15 transition-colors"
                      >
                        Ver comprobante y detalle
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="px-5 md:pb-5">
            <Pagination
              page={resolvedPage}
              totalPages={Math.max(1, Math.ceil(resolvedTotal / RESOLVED_PER_PAGE))}
              total={resolvedTotal}
              limit={RESOLVED_PER_PAGE}
              onPageChange={setResolvedPage}
            />
          </div>
        </div>
      )}

      {activeTab !== "under_review" && (
        <div className="mt-4 text-center">
          <Link to="/admin/payment-history" className="text-sm font-semibold text-[#531575] hover:underline">
            Ver libro completo con filtros →
          </Link>
        </div>
      )}

      {/* Payment Review Slide-Over */}
      {activeOrder && (
        <PaymentReviewSlideOver
          order={activeOrder}
          allOrders={pendingOrders}
          onClose={() => setActiveOrder(null)}
          onApprove={confirmApprove}
          onReject={confirmReject}
        />
      )}

      {/* Consulta de un pago ya resuelto. Sin `allOrders`: aquí sólo tengo la página
          actual, y el aviso de "pedido agrupado" saldría con un número falso. */}
      {reviewOrder && (
        <PaymentReviewSlideOver
          order={reviewOrder}
          readOnly
          statusBadge={<StatusBadge status={reviewOrder.payment_status} />}
          onClose={() => setReviewOrder(null)}
        />
      )}
    </div>
  );
}
