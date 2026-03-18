import PropTypes from "prop-types";
import { formatCurrencyUSD, formatCurrencyVES } from "../../utils/formatters";

export default function AdminOrderList({ orders }) {
  if (!orders || orders.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-lg shadow-sm border border-gray-200">
        <svg
          className="mx-auto h-16 w-16 text-gray-400 mb-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
          />
        </svg>
        <h3 className="text-lg font-medium text-gray-900">
          No hay pedidos registrados
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Aún no se han realizado compras en la plataforma.
        </p>
      </div>
    );
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case "approved":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Aprobado
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            Rechazado
          </span>
        );
      case "under_review":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            En Revisión
          </span>
        );
      case "pending":
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            Pendiente
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col">
      <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
        <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
          <div className="shadow overflow-hidden border border-gray-200 sm:rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Orden
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Cliente
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Monto
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Estado Pago
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Detalles Adicionales
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-gray-900 font-mono">
                        {order.id.split("-")[0].toUpperCase()}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(order.created_at).toLocaleDateString()} a las{" "}
                        {new Date(order.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 font-medium">
                        {order.users?.full_name || "Usuario desconocido"}
                      </div>
                      <div className="text-xs text-gray-500">
                        {order.users?.email || ""}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 font-bold">
                        {formatCurrencyUSD(order.total_usd)}
                      </div>
                      <div className="text-xs text-gray-500">
                        Bs {formatCurrencyVES(order.total_ves)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(order.payment_status)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs text-gray-500 max-w-xs truncate">
                        <span className="font-medium">Método:</span>{" "}
                        {order.payment_method?.replace("_", " ") || "N/A"}
                        <br />
                        {order.notes && (
                          <span className="text-gray-400 italic">
                            &quot;{order.notes}&quot;
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

AdminOrderList.propTypes = {
  orders: PropTypes.array.isRequired,
};
