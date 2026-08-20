import { useState, useEffect, useCallback, useRef } from "react";
import { getRefundRequestsAPI, processRefundAPI } from "../../services/api";
import { formatOrderNumber, formatOrderDateTime, formatCurrencyUSD } from "../../utils/formatters";
import { Link, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import LoadingSkeleton from "../../components/LoadingSkeleton";
import { useAdminStats } from "../../context/AdminStatsContext";

const STATUS_CONFIG = {
  pending: { label: "Pendiente", bg: "#fef9c3", text: "#ca8a04", dot: "#eab308" },
  processing: { label: "En Proceso", bg: "#eff6ff", text: "#2563eb", dot: "#3b82f6" },
  completed: { label: "Completado", bg: "#f0fdf4", text: "#16a34a", dot: "#22c55e" },
  denied: { label: "Denegado", bg: "#fef2f2", text: "#dc2626", dot: "#ef4444" },
};

const TABS = [
  { id: "", label: "Todos", icon: "📋" },
  { id: "processing", label: "Listos para Pagar", icon: "💰" },
  { id: "pending", label: "Esperando Cliente", icon: "⏳" },
  { id: "completed", label: "Completados", icon: "✅" },
  { id: "denied", label: "Denegados", icon: "❌" },
];

export default function AdminRefunds() {
  const { refreshStats } = useAdminStats();
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({ total: 0, pending: 0, processing: 0, completed: 0, denied: 0, totalPendingUsd: 0 });
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [activeTab, setActiveTab] = useState("processing");
  const [page, setPage] = useState(1);

  // Process modal
  const [processModal, setProcessModal] = useState(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [processing, setProcessing] = useState(false);

  // Deep link desde notificaciones: /admin/refunds?order=<uuid>. Se resalta la(s)
  // fila(s) de ese pedido una sola vez. phase: 0 = primera carga, 1 = ya se saltó
  // de pestaña, 2 = resuelto. awaitingLoad evita evaluar la lista vieja justo
  // después de cambiar de pestaña, antes de que `loading` pase a true.
  const [searchParams, setSearchParams] = useSearchParams();
  const deepLink = useRef({ orderId: searchParams.get("order"), phase: 0, awaitingLoad: false });
  const [highlightedOrderId, setHighlightedOrderId] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15 };
      if (activeTab) params.status = activeTab;
      const res = await getRefundRequestsAPI(params);
      const d = res.data;
      setRefunds(d.data || []);
      setPagination(d.pagination || { page: 1, totalPages: 1, total: 0 });
      setSummary(prev => d.summary || prev);
    } catch (err) {
      toast.error("Error al cargar reembolsos");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, activeTab]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { setPage(1); }, [activeTab]);

  useEffect(() => {
    const dl = deepLink.current;
    if (!dl.orderId || dl.phase === 2) return;
    if (loading) {
      dl.awaitingLoad = false;
      return;
    }
    if (dl.awaitingLoad) return;

    const finish = () => {
      dl.phase = 2;
      setSearchParams({}, { replace: true });
    };

    const match = refunds.find((r) => r.order_id === dl.orderId);
    if (match) {
      finish();
      setHighlightedOrderId(dl.orderId);
      document.getElementById(`row-${match.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      setTimeout(() => setHighlightedOrderId(null), 3000);
      return;
    }
    if (dl.phase === 1) {
      finish();
      toast.error("No se encontró el reembolso indicado");
      return;
    }

    // No está en la pestaña actual: el endpoint no filtra por pedido, así que se
    // busca su estado entre los últimos 50 reembolsos y se salta a esa pestaña.
    dl.phase = 1;
    (async () => {
      try {
        const res = await getRefundRequestsAPI({ limit: 50 });
        const found = (res.data?.data || []).find((r) => r.order_id === dl.orderId);
        if (found && found.status !== activeTab) {
          dl.awaitingLoad = true;
          setActiveTab(found.status);
          return;
        }
      } catch {
        // Sin datos: se avisa abajo.
      }
      finish();
      toast.error("No se encontró el reembolso indicado");
    })();
  }, [loading, refunds, activeTab, setSearchParams]);

  const handleProcess = async (action) => {
    if (!processModal) return;

    if (action === "complete" && !referenceNumber.trim()) {
      toast.error("El número de referencia de la transferencia es obligatorio para completar el reembolso.");
      return;
    }

    setProcessing(true);
    try {
      const notes = action === "complete"
        ? `Ref: #${referenceNumber.trim()}${adminNotes.trim() ? ` - ${adminNotes.trim()}` : ""}`
        : adminNotes.trim() || null;

      await processRefundAPI(processModal.id, action, notes);
      toast.success(action === "complete" ? "Reembolso marcado como completado" : "Reembolso denegado");
      setProcessModal(null);
      setAdminNotes("");
      setReferenceNumber("");
      fetchData();
      refreshStats();
    } catch (err) {
      toast.error(err.response?.data?.error || "Error al procesar");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-full pb-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-3xl font-black text-gray-900 m-0 tracking-tight">
            Gestión de Reembolsos
          </h2>
          <p className="text-sm text-gray-500 mt-1.5 font-medium">
            Administra las solicitudes de reembolso por cancelaciones de tiendas.
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Pendientes</div>
          <div className="text-3xl font-black text-amber-600">{summary.pending}</div>
          <div className="text-xs text-gray-500 mt-1 font-semibold">
            Total: {formatCurrencyUSD(summary.totalPendingUsd)}
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">En Proceso</div>
          <div className="text-3xl font-black text-blue-600">{summary.processing}</div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Completados</div>
          <div className="text-3xl font-black text-emerald-600">{summary.completed}</div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Denegados</div>
          <div className="text-3xl font-black text-red-600">{summary.denied}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 mb-6 bg-gray-100/50 p-1.5 rounded-2xl w-max border border-gray-200 shadow-sm">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm ${
              activeTab === tab.id
                ? "bg-[#6b1e96] text-white"
                : "bg-white text-gray-500 hover:text-gray-800"
            }`}
          >
            <span className="text-lg">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-4">
          <LoadingSkeleton variant="order-card" count={3} />
        </div>
      ) : refunds.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
          <div className="text-5xl mb-4">💸</div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Sin reembolsos</h3>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            No hay solicitudes de reembolso {activeTab ? `con estado "${STATUS_CONFIG[activeTab]?.label || activeTab}"` : ""}.
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {refunds.map((r) => {
              const status = STATUS_CONFIG[r.status] || STATUS_CONFIG.pending;
              const product = r.order_items?.products;
              const storeName = r.order_items?.store_profiles?.business_name;
              const buyer = r.orders?.users;

              return (
                <div
                  key={r.id}
                  id={`row-${r.id}`}
                  className={`bg-white rounded-2xl border shadow-sm hover:shadow-md transition-shadow overflow-hidden ${
                    r.order_id === highlightedOrderId
                      ? "border-[#6b1e96] ring-2 ring-[#6b1e96]/30"
                      : "border-gray-100"
                  }`}
                >
                  <div className="p-5 flex flex-col md:flex-row md:items-center gap-4">
                    {/* Product thumbnail */}
                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-50 flex-shrink-0 border border-gray-100">
                      {product?.images?.[0] ? (
                        <img src={product.images[0]} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xl text-gray-300">📦</div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <Link
                          to={`/admin/orders/${r.order_id}`}
                          className="text-sm font-black text-gray-900 hover:text-[#6b1e96] transition-colors"
                        >
                          #{formatOrderNumber(r.order_id)}
                        </Link>
                        <span
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                          style={{ background: status.bg, color: status.text }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full" style={{ background: status.dot }} />
                          {status.label}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mb-0.5">
                        <span className="font-bold text-gray-700">{product?.name || "Producto desconocido"}</span>
                        {storeName && <> · <span className="text-[#6b1e96]">{storeName}</span></>}
                        {r.requested_by === "system" && (
                          <span className="ml-1.5 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-orange-100 text-orange-700 border border-orange-200">
                            ⚡ Auto-SLA
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-gray-400">
                        Comprador: {buyer?.full_name || "N/A"} · {formatOrderDateTime(r.created_at)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1 italic">
                        <span className="font-semibold">Motivo:</span> {r.reason}
                      </p>
                    </div>

                    {/* Amount */}
                    <div className="text-right flex-shrink-0">
                      <div className="text-lg font-black text-[#6b1e96]">{formatCurrencyUSD(r.amount_usd)}</div>
                      {r.amount_ves && (
                        <div className="text-[11px] text-gray-400">≈ Bs. {r.amount_ves?.toFixed(2)}</div>
                      )}
                    </div>

                    {/* Actions */}
                    {(r.status === "pending" || r.status === "processing") && (
                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          onClick={() => setProcessModal(r)}
                          className="px-4 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-sm hover:shadow-md transition-shadow"
                        >
                          ✅ Procesar
                        </button>
                        <button
                          onClick={() => { setProcessModal(r); setTimeout(() => handleProcess("deny"), 0); }}
                          className="px-4 py-2.5 rounded-xl text-xs font-bold bg-white border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
                        >
                          Denegar
                        </button>
                      </div>
                    )}

                    {r.status === "completed" && r.processed_at && (
                      <div className="text-xs text-emerald-600 font-bold flex-shrink-0">
                        Procesado: {formatOrderDateTime(r.processed_at)}
                      </div>
                    )}
                  </div>

                  {r.refund_details && (
                    <div className="px-5 pb-4 -mt-1 flex flex-col gap-2">
                      <div className="bg-[#fcf8ff] rounded-xl border border-purple-100 p-3.5 text-xs">
                        <div className="flex items-center justify-between mb-2 pb-1.5" style={{ borderBottom: "1px dashed rgba(107,30,150,0.15)" }}>
                          <span className="font-extrabold text-[#6b1e96] flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[16px]">account_balance_wallet</span>
                            Datos de Reembolso ({r.refund_details.method === 'pago_movil' ? 'Pago Móvil' : r.refund_details.method === 'transferencia' ? 'Transferencia' : 'Zelle'})
                          </span>
                          <button
                            onClick={() => {
                              const textToCopy = r.refund_details.method === 'pago_movil' 
                                ? `Banco: ${r.refund_details.bank}, CI: ${r.refund_details.ci}, Telf: ${r.refund_details.phone}`
                                : r.refund_details.method === 'transferencia'
                                ? `Banco: ${r.refund_details.bank}, Cuenta: ${r.refund_details.accountNumber}, Titular: ${r.refund_details.holder}, CI: ${r.refund_details.ci}`
                                : `Zelle: ${r.refund_details.email}, Titular: ${r.refund_details.holder}`;
                              navigator.clipboard.writeText(textToCopy);
                              toast.success("¡Datos copiados!");
                            }}
                            className="text-[#6b1e96] hover:text-[#531575] font-bold flex items-center gap-0.5 text-[10px] bg-purple-50 px-2 py-1 rounded"
                          >
                            <span className="material-symbols-outlined text-[12px]">content_copy</span>
                            Copiar Todo
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-gray-700">
                          {r.refund_details.method === 'pago_movil' && (
                            <>
                              <div><span className="font-semibold text-gray-500">Banco:</span> {r.refund_details.bank}</div>
                              <div><span className="font-semibold text-gray-500">Cédula:</span> {r.refund_details.ci}</div>
                              <div><span className="font-semibold text-gray-500">Teléfono:</span> {r.refund_details.phone}</div>
                            </>
                          )}
                          {r.refund_details.method === 'transferencia' && (
                            <>
                              <div className="col-span-1 sm:col-span-2 md:col-span-3 font-mono text-[11px] bg-white border border-gray-100 p-2 rounded flex justify-between items-center">
                                <span><span className="font-bold font-sans text-gray-500">Cuenta:</span> {r.refund_details.accountNumber}</span>
                                <button 
                                  onClick={() => {
                                    navigator.clipboard.writeText(r.refund_details.accountNumber);
                                    toast.success("¡Cuenta copiada!");
                                  }}
                                  className="text-gray-400 hover:text-[#6b1e96]"
                                >
                                  <span className="material-symbols-outlined text-[14px]">content_copy</span>
                                </button>
                              </div>
                              <div><span className="font-semibold text-gray-500">Banco:</span> {r.refund_details.bank}</div>
                              <div><span className="font-semibold text-gray-500">Titular:</span> {r.refund_details.holder}</div>
                              <div><span className="font-semibold text-gray-500">Cédula:</span> {r.refund_details.ci}</div>
                            </>
                          )}
                          {r.refund_details.method === 'zelle' && (
                            <>
                              <div><span className="font-semibold text-gray-500">Zelle Correo:</span> {r.refund_details.email}</div>
                              <div><span className="font-semibold text-gray-500">Titular:</span> {r.refund_details.holder}</div>
                              {r.refund_details.phone && <div><span className="font-semibold text-gray-500">Teléfono:</span> {r.refund_details.phone}</div>}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {r.admin_notes && (
                    <div className="px-5 pb-4 -mt-1">
                      <div className="bg-gray-50 rounded-lg px-3 py-2 text-xs text-gray-600">
                        <span className="font-bold">Notas Admin:</span> {r.admin_notes}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-6">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 rounded-lg text-sm font-bold bg-white border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
              >
                ← Anterior
              </button>
              <span className="text-sm text-gray-500 font-semibold">
                Página {page} de {pagination.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={page === pagination.totalPages}
                className="px-4 py-2 rounded-lg text-sm font-bold bg-white border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
              >
                Siguiente →
              </button>
            </div>
          )}
        </>
      )}

      {/* Process Modal */}
      {processModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => !processing && (setProcessModal(null), setAdminNotes(""), setReferenceNumber(""))}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-fade-in-up">
            <div
              className="p-6"
              style={{ background: "linear-gradient(135deg, #1a0a2e, #2d1248)" }}
            >
              <h3 className="text-lg font-black" style={{ color: "#c3ff00" }}>
                Procesar Reembolso
              </h3>
              <p className="text-xs text-white/50 mt-1">
                Orden {formatOrderNumber(processModal.order_id)} · {formatCurrencyUSD(processModal.amount_usd)}
              </p>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs text-amber-800 font-medium">
                <strong>Motivo de cancelación:</strong> {processModal.reason}
              </div>

              {processModal.refund_details && (
                <div className="bg-purple-50 border border-purple-100 rounded-xl p-3 text-xs">
                  <div className="font-extrabold text-[#6b1e96] mb-1.5 flex items-center gap-1">
                    <span>💰 Datos de Transferencia:</span>
                    <span className="font-bold px-1.5 py-0.5 rounded bg-purple-100 uppercase text-[9px]">
                      {processModal.refund_details.method === 'pago_movil' ? 'Pago Móvil' : processModal.refund_details.method === 'transferencia' ? 'Transferencia' : 'Zelle'}
                    </span>
                  </div>
                  <div className="space-y-1 text-gray-700">
                    {processModal.refund_details.method === 'pago_movil' && (
                      <>
                        <div><strong>Banco:</strong> {processModal.refund_details.bank}</div>
                        <div><strong>Cédula:</strong> {processModal.refund_details.ci}</div>
                        <div><strong>Teléfono:</strong> {processModal.refund_details.phone}</div>
                      </>
                    )}
                    {processModal.refund_details.method === 'transferencia' && (
                      <>
                        <div><strong>Banco:</strong> {processModal.refund_details.bank}</div>
                        <div><strong>Titular:</strong> {processModal.refund_details.holder}</div>
                        <div><strong>Cédula:</strong> {processModal.refund_details.ci}</div>
                        <div className="font-mono bg-white p-2 rounded mt-1.5 border border-purple-100 select-all text-center flex justify-between items-center">
                          <strong>Cuenta:</strong> <span>{processModal.refund_details.accountNumber}</span>
                          <button 
                            onClick={() => {
                              navigator.clipboard.writeText(processModal.refund_details.accountNumber);
                              toast.success("¡Cuenta copiada!");
                            }}
                            className="text-[#6b1e96] hover:text-[#531575]"
                          >
                            <span className="material-symbols-outlined text-[14px]">content_copy</span>
                          </button>
                        </div>
                      </>
                    )}
                    {processModal.refund_details.method === 'zelle' && (
                      <>
                        <div><strong>Titular:</strong> {processModal.refund_details.holder}</div>
                        <div><strong>Correo:</strong> {processModal.refund_details.email}</div>
                        {processModal.refund_details.phone && <div><strong>Teléfono:</strong> {processModal.refund_details.phone}</div>}
                      </>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Número de Referencia de Transferencia *
                  </label>
                  <input
                    type="text"
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value)}
                    className="w-full p-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#6b1e96] focus:ring-2 focus:ring-[#6b1e96]/10"
                    placeholder="Ej: 123456 o Ref# 987654"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Notas del admin (opcional)
                  </label>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    className="w-full p-3 border border-gray-200 rounded-xl text-sm outline-none resize-none focus:border-[#6b1e96] focus:ring-2 focus:ring-[#6b1e96]/10"
                    rows={3}
                    placeholder="Detalles extras de la transferencia, banco, etc."
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => { setProcessModal(null); setAdminNotes(""); setReferenceNumber(""); }}
                  disabled={processing}
                  className="flex-1 py-3 rounded-xl text-sm font-bold bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleProcess("deny")}
                  disabled={processing}
                  className="flex-1 py-3 rounded-xl text-sm font-bold bg-white border-2 border-red-200 text-red-600 hover:bg-red-50 transition-colors"
                >
                  Denegar
                </button>
                <button
                  onClick={() => handleProcess("complete")}
                  disabled={processing}
                  className="flex-[2] py-3 rounded-xl text-sm font-bold text-white transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ background: "linear-gradient(135deg, #059669, #10b981)" }}
                >
                  {processing ? (
                    <span className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin" />
                  ) : null}
                  {processing ? "Procesando..." : "✅ Marcar Completado"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
