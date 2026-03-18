import PropTypes from "prop-types";
import { formatCurrencyUSD, formatCurrencyVES } from "../../utils/formatters";

export default function PaymentApprovalQueue({
  orders,
  onViewProof,
  onApprove,
  onReject,
}) {
  if (!orders || orders.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-lg shadow-sm border border-gray-200">
        <svg
          className="mx-auto h-16 w-16 text-gray-400 mb-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <h3 className="text-lg font-medium text-gray-900">
          No hay pagos pendientes
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          La bandeja de Escrow está limpia. Buen trabajo.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
        <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
          <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
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
                    Cliente / Pago
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
                    Recibo
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Acciones</span>
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
                        {new Date(order.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 font-medium">
                        {order.users?.full_name ||
                          order.users?.email ||
                          "Usuario desconocido"}
                      </div>
                      <div className="text-xs text-gray-500">
                        {order.users?.email || ""}
                      </div>
                      <div className="text-xs text-gray-500 uppercase flex items-center gap-1 mt-1">
                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                        {order.payment_method?.replace("_", " ")}
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
                      {order.payment_proof_url ? (
                        <button
                          onClick={() => onViewProof(order.payment_proof_url)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 border border-primary-500 text-primary-700 bg-primary-50 hover:bg-primary-100 text-xs font-medium rounded-md transition"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </svg>
                          Ver Pago
                        </button>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Sin Evidencia
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onApprove(order.id)}
                          disabled={!order.payment_proof_url}
                          className="text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed px-3 py-1.5 rounded transition"
                        >
                          Aprobar
                        </button>
                        <button
                          onClick={() => onReject(order.id)}
                          className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded transition"
                        >
                          Rechazar
                        </button>
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

PaymentApprovalQueue.propTypes = {
  orders: PropTypes.array.isRequired,
  onViewProof: PropTypes.func.isRequired,
  onApprove: PropTypes.func.isRequired,
  onReject: PropTypes.func.isRequired,
};
