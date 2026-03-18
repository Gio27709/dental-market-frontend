import { useEffect, useState } from "react";
import { useOrder } from "../../context/OrderContext";
import PaymentApprovalQueue from "../../components/admin/PaymentApprovalQueue";
import PaymentProofViewer from "../../components/admin/PaymentProofViewer";
import toast from "react-hot-toast";

export default function PaymentApprovals() {
  const { orders, fetchOrders, approvePayment, rejectPayment, loading } =
    useOrder();

  // Modal states
  const [activeProofUrl, setActiveProofUrl] = useState(null);

  // Rejection logic states
  const [rejectingOrderId, setRejectingOrderId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    // Only fetch orders that are awaiting payment validation
    // Request global admin view to see everyone's orders
    fetchOrders({ payment_status: "under_review", admin_view: "true" });
  }, [fetchOrders]);

  const handleViewProof = (url) => {
    setActiveProofUrl(url);
  };

  const handleCloseViewer = () => {
    setActiveProofUrl(null);
  };

  const handleApprove = async (orderId) => {
    if (
      !window.confirm(
        "¿Estás seguro de que deseas APROBAR este pago de Escrow y enviar la orden?",
      )
    )
      return;

    const res = await approvePayment(orderId);
    if (res.success) {
      toast.success(
        `Pago de la orden ${orderId.split("-")[0].toUpperCase()} aprobado con éxito.`,
      );
      fetchOrders({ payment_status: "under_review" }); // Refresh queue
    } else {
      toast.error(res.error || "No se pudo aprobar la orden.");
    }
  };

  const initReject = (orderId) => {
    setRejectingOrderId(orderId);
    setRejectionReason("");
  };

  const confirmReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error("Debes suministrar un motivo válido para rechazar el pago.");
      return;
    }

    const res = await rejectPayment(rejectingOrderId, rejectionReason);
    if (res.success) {
      toast.success(`Orden rechazada`);
      setRejectingOrderId(null);
      fetchOrders({ payment_status: "under_review" }); // Refresh queue
    } else {
      toast.error(res.error || "Error al rechazar pago");
    }
  };

  const cancelReject = () => {
    setRejectingOrderId(null);
    setRejectionReason("");
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
          onViewProof={handleViewProof}
          onApprove={handleApprove}
          onReject={initReject}
        />
      )}

      {/* Proof Viewer Overlay */}
      {activeProofUrl && (
        <PaymentProofViewer
          proofUrl={activeProofUrl}
          onClose={handleCloseViewer}
        />
      )}

      {/* Rejection Modal (Tailwind v4 Safe) */}
      {rejectingOrderId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg p-6 overflow-hidden transform transition-all">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-full bg-red-100">
                <svg
                  className="h-6 w-6 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900">
                Rechazar Pago de Orden
              </h3>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Por favor, especifica el motivo por el cual se rechaza el pago
              recibido. Esto se enviará al cliente.
            </p>
            <textarea
              rows="3"
              className="w-full border border-gray-300 rounded-md p-3 shadow-sm focus:ring-red-500 focus:border-red-500"
              placeholder="Ej. La referencia enviada no concuerda con nuestro estado de cuenta."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            ></textarea>
            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={cancelReject}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md font-medium hover:bg-gray-200 transition"
              >
                Cancelar
              </button>
              <button
                onClick={confirmReject}
                className="px-4 py-2 bg-red-600 text-white rounded-md font-medium hover:bg-red-700 transition shadow-sm"
              >
                Confirmar Rechazo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
