import { useEffect, useState } from "react";
import { useOrder } from "../../context/OrderContext";
import PaymentApprovalQueue from "../../components/admin/PaymentApprovalQueue";
import PaymentReviewSlideOver from "../../components/admin/PaymentReviewSlideOver";
import toast from "react-hot-toast";
import { useAdminStats } from "../../context/AdminStatsContext";

export default function PaymentApprovals() {
  const { orders, fetchOrders, approvePayment, rejectPayment, loading } =
    useOrder();
  const { refreshStats } = useAdminStats();

  // Active review state
  const [activeOrder, setActiveOrder] = useState(null);

  useEffect(() => {
    // Only fetch orders that are awaiting payment validation
    // Request global admin view to see everyone's orders
    fetchOrders({ payment_status: "under_review", admin_view: "true" });
  }, [fetchOrders]);

  const handleReviewOrder = (order) => {
    setActiveOrder(order);
  };

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
      fetchOrders({ payment_status: "under_review", admin_view: "true" });
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
      fetchOrders({ payment_status: "under_review", admin_view: "true" });
      refreshStats();
    } else {
      toast.error(res.error || "Error al rechazar pago");
    }
  };

  // Filter orders manually on frontend just in case backend ignores param temporarily
  const pendingOrders = orders.filter(
    (o) => o.payment_status === "under_review",
  );

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
            onClick={() =>
              fetchOrders({
                payment_status: "under_review",
                admin_view: "true",
              })
            }
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            {loading ? "Actualizando..." : "Refrescar Cola"}
          </button>
        </div>
      </div>

      {loading && !pendingOrders.length ? (
        <div className="flex justify-center items-center h-48">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <PaymentApprovalQueue
          orders={pendingOrders}
          onReviewOrder={handleReviewOrder}
        />
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
    </div>
  );
}
