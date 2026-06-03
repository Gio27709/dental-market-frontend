import { useState, useMemo } from "react";
import PropTypes from "prop-types";
import { formatCurrencyUSD, formatCurrencyVES } from "../../utils/formatters";

export default function PaymentReviewSlideOver({
  order,
  allOrders = [],
  onClose,
  onApprove,
  onReject,
}) {
  const [rejectMode, setRejectMode] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);

  if (!order) return null;

  // ── Find all sibling orders in the same group ──
  const groupOrders = useMemo(() => {
    if (order.order_group_id && allOrders.length > 0) {
      const siblings = allOrders.filter(
        (o) => o.order_group_id === order.order_group_id
      );
      return siblings.length > 1 ? siblings : [order];
    }
    return [order];
  }, [order, allOrders]);

  const isGroup = groupOrders.length > 1;
  const groupTotalUsd = groupOrders.reduce((acc, o) => acc + (o.total_usd || 0), 0);
  const groupTotalVes = groupOrders.reduce((acc, o) => acc + (o.total_ves || 0), 0);

  const handleApprove = async () => {
    setIsProcessing(true);
    await onApprove(order.id);
    setIsProcessing(false);
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) return;
    setIsProcessing(true);
    await onReject(order.id, rejectionReason);
    setIsProcessing(false);
  };

  // Close when clicking outside
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      if (!isProcessing) onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm transition-opacity flex justify-end"
      onClick={handleBackdropClick}
      aria-labelledby="slide-over-title"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-4xl h-full bg-gray-50 shadow-2xl flex flex-col sm:flex-row animate-slide-in-right relative">
        {/* Close Button (Mobile/Top) */}
        <button
          onClick={onClose}
          disabled={isProcessing}
          className="absolute top-4 right-4 z-10 sm:hidden bg-white rounded-full p-2 text-gray-500 hover:text-gray-700 shadow"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* LEFT PANEL: Image Viewer */}
        <div className="w-full sm:w-3/5 h-64 sm:h-full bg-black relative flex items-center justify-center border-b sm:border-b-0 sm:border-r border-gray-200">
          {order.payment_proof_url ? (
            <img
              src={order.payment_proof_url}
              alt="Comprobante de pago"
              className={`transition-all duration-300 ease-in-out cursor-pointer ${
                isZoomed ? "object-contain w-full h-full scale-150" : "object-contain w-full h-full max-h-screen p-4"
              }`}
              onClick={() => setIsZoomed(!isZoomed)}
            />
          ) : (
            <div className="text-gray-500 flex flex-col items-center">
              <svg className="w-16 h-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>Sin comprobante</span>
            </div>
          )}
          {/* Zoom hint */}
          {order.payment_proof_url && (
            <div className="absolute bottom-4 left-4 bg-black/50 text-white text-xs px-3 py-1.5 rounded-full pointer-events-none flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
              </svg>
              Clic para {isZoomed ? "alejar" : "acercar"}
            </div>
          )}
        </div>

        {/* RIGHT PANEL: Details & Actions */}
        <div className="w-full sm:w-2/5 h-full flex flex-col bg-white">
          <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900" id="slide-over-title">
              Revisión de Pago
            </h2>
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="hidden sm:block text-gray-400 hover:text-gray-600 focus:outline-none"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
            {/* ── GROUP INDICATOR ── */}
            {isGroup && (
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-5 h-5 text-[#6b1e96]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  <span className="text-sm font-bold text-[#6b1e96]">
                    Pedido agrupado · {groupOrders.length} órdenes
                  </span>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Este comprobante cubre <strong>{groupOrders.length} órdenes</strong> del mismo checkout (multi-tienda).
                  Al aprobar o rechazar, se aplica a <strong>todas</strong> las órdenes del grupo.
                </p>
              </div>
            )}

            {/* ── Per-order breakdown (for groups) ── */}
            {isGroup && (
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide border-b pb-2">
                  Desglose por Tienda
                </h3>
                <div className="space-y-2">
                  {groupOrders.map((gOrder) => {
                    // Extract store name from items
                    const storeName = [...new Set(
                      (gOrder.order_items || [])
                        .map((item) => item.store_profiles?.business_name)
                        .filter(Boolean)
                    )].join(", ") || "Tienda";

                    return (
                      <div key={gOrder.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-[#6b1e96] uppercase">
                            🏪 {storeName}
                          </span>
                          <span className="text-[10px] font-mono text-gray-400 mt-0.5">
                            #{gOrder.id.split("-")[0].toUpperCase()}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-bold text-gray-900">{formatCurrencyUSD(gOrder.total_usd)}</span>
                          <span className="block text-[10px] text-gray-500">Bs {formatCurrencyVES(gOrder.total_ves)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Order Info */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {isGroup ? "Grupo ID" : "Orden ID"}
                </span>
                <span className="text-sm font-mono font-bold text-primary-700 bg-primary-50 px-2 py-0.5 rounded">
                  #{order.id.split("-")[0].toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
                <span className="text-sm text-gray-600">
                  {isGroup ? "Total grupo a validar:" : "Total a validar:"}
                </span>
                <div className="text-right">
                  <div className="text-xl font-bold text-gray-900">
                    {formatCurrencyUSD(isGroup ? groupTotalUsd : order.total_usd)}
                  </div>
                  <div className="text-xs text-gray-500">
                    Bs {formatCurrencyVES(isGroup ? groupTotalVes : order.total_ves)}
                  </div>
                </div>
              </div>
            </div>

            {/* Payer Details */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide border-b pb-2">Datos del Pagador</h3>
              <dl className="space-y-3 text-sm">
                <div className="grid grid-cols-3 gap-2">
                  <dt className="text-gray-500">Método</dt>
                  <dd className="col-span-2 font-medium text-gray-900 uppercase flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    {order.payment_method?.replace("_", " ")}
                  </dd>
                </div>
                {(order.payer_name || order.users?.full_name) && (
                  <div className="grid grid-cols-3 gap-2">
                    <dt className="text-gray-500">Titular</dt>
                    <dd className="col-span-2 font-medium text-gray-900">{order.payer_name || order.users?.full_name}</dd>
                  </div>
                )}
                {order.payer_cedula && (
                  <div className="grid grid-cols-3 gap-2">
                    <dt className="text-gray-500">Cédula/RIF</dt>
                    <dd className="col-span-2 font-mono text-gray-800">{order.payer_cedula}</dd>
                  </div>
                )}
                {order.payer_phone && (
                  <div className="grid grid-cols-3 gap-2">
                    <dt className="text-gray-500">Teléfono</dt>
                    <dd className="col-span-2 text-gray-900">{order.payer_phone}</dd>
                  </div>
                )}
                {order.payer_email && (
                  <div className="grid grid-cols-3 gap-2">
                    <dt className="text-gray-500">Email</dt>
                    <dd className="col-span-2 text-gray-900 break-all">{order.payer_email}</dd>
                  </div>
                )}
                {order.reference_number && (
                  <div className="grid grid-cols-3 gap-2">
                    <dt className="text-gray-500">Referencia</dt>
                    <dd className="col-span-2 font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded inline-block w-max">
                      {order.reference_number}
                    </dd>
                  </div>
                )}
                {order.payment_date && (
                  <div className="grid grid-cols-3 gap-2">
                    <dt className="text-gray-500">Fecha Pago</dt>
                    <dd className="col-span-2 text-gray-900">{new Date(order.payment_date).toLocaleDateString("es-VE")}</dd>
                  </div>
                )}
              </dl>
            </div>
            
            {/* Account Info (Fallback if payer details missing) */}
            {(!order.payer_name && !order.reference_number) && (
              <div className="bg-yellow-50 text-yellow-800 text-xs p-3 rounded-md border border-yellow-200">
                <strong>Atención:</strong> Esta orden se realizó antes de la actualización del sistema de pagos y no posee metadata detallada del pagador. Verifica la imagen del comprobante manualmente.
              </div>
            )}
          </div>

          {/* Action Footer */}
          <div className="border-t border-gray-200 px-6 py-5 bg-gray-50">
            {/* Group approval note */}
            {isGroup && !rejectMode && (
              <div className="mb-4 text-xs text-[#6b1e96] bg-purple-50 px-3 py-2 rounded-lg border border-purple-100 flex items-center gap-2">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>La acción se aplica a las <strong>{groupOrders.length} órdenes</strong> del grupo automáticamente.</span>
              </div>
            )}

            {rejectMode ? (
              <div className="space-y-4 animate-fade-in">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Motivo de Rechazo <span className="text-red-500">*</span></label>
                  <textarea
                    rows="2"
                    className="w-full border border-gray-300 rounded-md p-2.5 text-sm focus:ring-red-500 focus:border-red-500 shadow-sm"
                    placeholder="Ej. La referencia no aparece en el estado de cuenta."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    disabled={isProcessing}
                  ></textarea>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => { setRejectMode(false); setRejectionReason(""); }}
                    disabled={isProcessing}
                    className="w-1/3 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50 transition"
                  >
                    Volver
                  </button>
                  <button
                    onClick={handleReject}
                    disabled={isProcessing || !rejectionReason.trim()}
                    className="w-2/3 flex justify-center items-center px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition shadow-sm"
                  >
                    {isProcessing ? (
                      <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      isGroup ? `Rechazar ${groupOrders.length} Órdenes` : "Confirmar Rechazo"
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex gap-3">
                <button
                  onClick={() => setRejectMode(true)}
                  disabled={isProcessing || !order.payment_proof_url}
                  className="w-1/2 flex justify-center items-center px-4 py-3 bg-white border border-red-200 text-red-600 rounded-md text-sm font-semibold hover:bg-red-50 disabled:opacity-50 transition"
                >
                  <svg className="w-5 h-5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Rechazar Pago
                </button>
                <button
                  onClick={handleApprove}
                  disabled={isProcessing || !order.payment_proof_url}
                  className="w-1/2 flex justify-center items-center px-4 py-3 bg-green-600 text-white rounded-md text-sm font-semibold hover:bg-green-700 disabled:opacity-50 transition shadow-sm"
                >
                  {isProcessing ? (
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      {isGroup ? `Aprobar ${groupOrders.length} Órdenes` : "Aprobar Pago"}
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

PaymentReviewSlideOver.propTypes = {
  order: PropTypes.object.isRequired,
  allOrders: PropTypes.array,
  onClose: PropTypes.func.isRequired,
  onApprove: PropTypes.func.isRequired,
  onReject: PropTypes.func.isRequired,
};
