import { useEffect } from "react";
import LoadingSkeleton from "../../components/LoadingSkeleton";
import { Link } from "react-router-dom";
import { useOrder } from "../../context/OrderContext";
import OrderCard from "../../components/orders/OrderCard";

export default function Orders() {
  const { orders, loading, error, fetchOrders } = useOrder();

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return (
    <div className="bg-white shadow rounded-lg p-6 border border-gray-100">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Mis Órdenes
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Revisa el estado de tus compras
        </p>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <LoadingSkeleton variant="order-card" count={3} />
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={() => fetchOrders()}
            className="text-primary-600 hover:text-primary-700 font-medium"
          >
            Reintentar
          </button>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <div className="text-5xl mb-4">📦</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Aún no has realizado compras
          </h3>
          <p className="text-gray-500 text-sm mb-6">
            Cuando realices tu primera compra, aparecerá aquí.
          </p>
          <Link
            to="/"
            className="inline-flex items-center px-5 py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
          >
            Explorar productos
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  );
}
