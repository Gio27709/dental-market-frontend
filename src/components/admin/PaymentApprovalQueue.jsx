import { useMemo } from "react";
import PropTypes from "prop-types";
import { formatCurrencyUSD, formatCurrencyVES } from "../../utils/formatters";

export default function PaymentApprovalQueue({
  orders,
  onReviewOrder,
}) {
  // ── Group orders by order_group_id ──
  // Orders with same group_id are from the same checkout session (multi-store)
  const groupedOrders = useMemo(() => {
    const groups = {};
    const standalone = [];

    orders.forEach(order => {
      if (order.order_group_id) {
        if (!groups[order.order_group_id]) {
          groups[order.order_group_id] = [];
        }
        groups[order.order_group_id].push(order);
      } else {
        standalone.push({ orders: [order], isGroup: false });
      }
    });

    const result = [];
    // Add grouped orders
    Object.values(groups).forEach(groupOrders => {
      result.push({ orders: groupOrders, isGroup: groupOrders.length > 1 });
    });
    // Add standalone orders
    result.push(...standalone);

    // Sort by most recent first
    result.sort((a, b) => {
      const dateA = new Date(a.orders[0].created_at);
      const dateB = new Date(b.orders[0].created_at);
      return dateB - dateA;
    });

    return result;
  }, [orders]);

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
    <div className="flex flex-col gap-4">
      {groupedOrders.map((group) => {
        const primaryOrder = group.orders[0];
        const isGroup = group.isGroup;

        // Calculate group totals
        const groupTotalUsd = group.orders.reduce((acc, o) => acc + (o.total_usd || 0), 0);
        const groupTotalVes = group.orders.reduce((acc, o) => acc + (o.total_ves || 0), 0);

        const initial = (primaryOrder.users?.full_name || primaryOrder.users?.email || "U").charAt(0).toUpperCase();
        const isZelle = primaryOrder.payment_method === 'zelle';

        return (
          <div
            key={primaryOrder.order_group_id || primaryOrder.id}
            className={`bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 border overflow-hidden ${isGroup ? "border-purple-200" : "border-gray-100 hover:border-gray-200"}`}
          >
            {/* Group badge */}
            {isGroup && (
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 px-6 py-2.5 border-b border-purple-100 flex items-center gap-2">
                <svg className="w-4 h-4 text-[#6b1e96]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                <span className="text-xs font-bold text-[#6b1e96]">
                  Pedido agrupado · {group.orders.length} órdenes del mismo checkout
                </span>
                <span className="text-xs text-gray-500 ml-auto">
                  Un solo comprobante
                </span>
              </div>
            )}

            <div className="px-6 py-5">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                {/* Order IDs */}
                <div className="flex flex-col gap-1 min-w-[120px]">
                  {group.orders.map((order) => (
                    <span key={order.id} className="text-sm font-bold text-primary-700 bg-primary-50 px-2.5 py-1 rounded-md w-fit font-mono border border-primary-100">
                      #{order.id.split("-")[0].toUpperCase()}
                    </span>
                  ))}
                  <span className="text-xs text-gray-400 flex items-center gap-1 font-medium mt-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                    {new Date(primaryOrder.created_at).toLocaleDateString()}
                  </span>
                </div>

                {/* Buyer */}
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center text-primary-700 font-bold shadow-inner border border-primary-200">
                    {initial}
                  </div>
                  <div className="ml-3">
                    <div className="text-sm font-bold text-gray-900">{primaryOrder.users?.full_name || "Usuario Desconocido"}</div>
                    <div className="text-xs text-gray-500 font-medium">{primaryOrder.users?.email}</div>
                  </div>
                </div>

                {/* Payment Info */}
                <div className="flex flex-col gap-1.5 min-w-[180px]">
                  {primaryOrder.payer_name || primaryOrder.reference_number ? (
                    <>
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${isZelle ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                          {primaryOrder.payment_method?.replace("_", " ")}
                        </span>
                        {primaryOrder.reference_number && (
                          <span className="text-xs font-mono font-semibold text-gray-700 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-200 shadow-sm">
                            Ref: {primaryOrder.reference_number}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-600 space-y-0.5">
                        {primaryOrder.payer_name && <div className="truncate max-w-[200px]"><span className="text-gray-400 font-medium">Titular:</span> <span className="font-semibold text-gray-800">{primaryOrder.payer_name}</span></div>}
                        {primaryOrder.payer_cedula && <div><span className="text-gray-400 font-medium">CI/RIF:</span> <span className="text-gray-800">{primaryOrder.payer_cedula}</span></div>}
                      </div>
                    </>
                  ) : (
                    <span className="text-xs text-gray-400 italic bg-gray-50 px-2 py-1 rounded border border-gray-100">Sin datos de pagador...</span>
                  )}
                </div>

                {/* Total */}
                <div className="flex flex-col ml-auto text-right">
                  <span className="text-sm font-extrabold text-gray-900">
                    {formatCurrencyUSD(isGroup ? groupTotalUsd : primaryOrder.total_usd)}
                  </span>
                  <span className="text-xs font-semibold text-gray-500">
                    Bs {formatCurrencyVES(isGroup ? groupTotalVes : primaryOrder.total_ves)}
                  </span>
                  {isGroup && (
                    <span className="text-[10px] text-gray-400 mt-0.5">
                      ({group.orders.map(o => formatCurrencyUSD(o.total_usd)).join(" + ")})
                    </span>
                  )}
                </div>

                {/* Status */}
                <div className="flex flex-col items-center gap-2">
                  {primaryOrder.payment_proof_url ? (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      Recibido
                    </div>
                  ) : (
                    <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                      Pendiente
                    </div>
                  )}
                </div>

                {/* Action */}
                <button
                  onClick={() => onReviewOrder(primaryOrder)}
                  className="inline-flex items-center gap-2 text-gray-700 bg-white border border-gray-300 hover:bg-gray-900 hover:text-white hover:border-gray-900 px-4 py-2 rounded-lg transition-all shadow-sm font-bold text-sm hover:shadow-md whitespace-nowrap"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  {isGroup ? "Revisar Grupo" : "Revisar"}
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

PaymentApprovalQueue.propTypes = {
  orders: PropTypes.array.isRequired,
  onReviewOrder: PropTypes.func.isRequired,
};
