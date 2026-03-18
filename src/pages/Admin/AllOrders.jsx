import { useEffect } from "react";
import { useOrder } from "../../context/OrderContext";
import AdminOrderList from "../../components/admin/AdminOrderList";

export default function AllOrders() {
  const { orders, fetchOrders, loading } = useOrder();

  useEffect(() => {
    // Request global admin view WITHOUT a payment_status filter, so it returns everything
    fetchOrders({ admin_view: "true" });
  }, [fetchOrders]);

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
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
            Historial Global de Pedidos
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Vista general de absolutamente todos los pedidos procesados en la
            plataforma.
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <button
            onClick={() => fetchOrders({ admin_view: "true" })}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            {loading ? "Actualizando..." : "Refrescar Panel"}
          </button>
        </div>
      </div>

      {loading && !orders.length ? (
        <div className="flex justify-center items-center h-48">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <AdminOrderList orders={orders} />
      )}
    </div>
  );
}
