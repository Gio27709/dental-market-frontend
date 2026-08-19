import { useState, useEffect, useCallback, useRef } from "react";
import { getAdminPayoutsAPI, processAdminPayoutAPI } from "../../services/api";
import Pagination from "../../components/admin/Pagination";
import toast from "react-hot-toast";
import { useAdminStats } from "../../context/AdminStatsContext";

const STATUS_CONFIG = {
  pending: { label: "Pendiente", bg: "bg-yellow-50 text-yellow-700 border-yellow-100", dot: "bg-yellow-500" },
  processing: { label: "En Proceso", bg: "bg-blue-50 text-blue-700 border-blue-100", dot: "bg-blue-500" },
  completed: { label: "Aprobado", bg: "bg-green-50 text-green-700 border-green-100", dot: "bg-green-500" },
  rejected: { label: "Rechazado", bg: "bg-red-50 text-red-700 border-red-100", dot: "bg-red-500" },
};

const VENEZUELAN_BANKS_MAP = {
  "0102": "Banco de Venezuela",
  "0134": "Banesco",
  "0105": "Banco Mercantil",
  "0108": "BBVA Provincial",
  "0172": "Bancamiga",
  "0114": "Bancaribe",
  "0115": "Banco Exterior",
  "0128": "Banco Caroní",
  "0137": "Sofitasa",
  "0138": "Banco Plaza",
  "0151": "BFC Banco Fondo Común",
  "0156": "100% Banco",
  "0157": "Del Sur",
  "0163": "Banco del Tesoro",
  "0166": "Banco Agrícola de Venezuela",
  "0168": "Bancrecer",
  "0169": "Mi Banco",
  "0174": "Banplus",
  "0175": "Banco Bicentenario",
  "0177": "BANFANB",
  "0191": "Banco Activo"
};

const TABS = [
  { id: "pending", label: "Pendientes", icon: "⏳" },
  { id: "completed", label: "Aprobados", icon: "✅" },
  { id: "rejected", label: "Rechazados", icon: "❌" },
  { id: "all", label: "Todos", icon: "📒" },
];

const PAYOUT_METHODS = [
  { value: "pago_movil", label: "Pago Móvil" },
  { value: "transferencia", label: "Transferencia" },
  { value: "zelle", label: "Zelle" },
];

const PER_PAGE = 20;

const EMPTY_COUNTS = { all: 0, pending: 0, processing: 0, completed: 0, rejected: 0 };
const EMPTY_SUMMARY = { pending_usd: 0, processing_usd: 0, completed_usd: 0, rejected_usd: 0 };

export default function AdminPayouts() {
  const { refreshStats } = useAdminStats();

  const latestRequest = useRef(0);
  const [payouts, setPayouts] = useState([]);
  const [total, setTotal] = useState(0);
  const [counts, setCounts] = useState(EMPTY_COUNTS);
  const [summary, setSummary] = useState(EMPTY_SUMMARY);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  // Filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [method, setMethod] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);

  // Modal control
  const [selectedPayout, setSelectedPayout] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null); // 'approve' or 'reject'
  const [submitting, setSubmitting] = useState(false);
  const [receiptFile, setReceiptFile] = useState(null); // Payout screenshot file

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm.trim()), 350);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const fetchPayouts = useCallback(async () => {
    // Cambiar de pestaña rápido deja que una respuesta lenta pise a la buena.
    const requestId = ++latestRequest.current;
    setLoading(true);
    try {
      const { data } = await getAdminPayoutsAPI({
        status: activeTab,
        search: debouncedSearch || undefined,
        method: method || undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        limit: PER_PAGE,
        offset: (page - 1) * PER_PAGE,
      });
      if (requestId !== latestRequest.current) return;
      if (data?.success) {
        setPayouts(data.data || []);
        setTotal(data.count || 0);
        setCounts({ ...EMPTY_COUNTS, ...(data.counts || {}) });
        setSummary({ ...EMPTY_SUMMARY, ...(data.summary || {}) });
      }
    } catch (err) {
      if (requestId !== latestRequest.current) return;
      toast.error("Error al cargar solicitudes de retiro: " + err.message);
      console.error(err);
    } finally {
      if (requestId === latestRequest.current) setLoading(false);
    }
  }, [activeTab, debouncedSearch, method, startDate, endDate, page]);

  useEffect(() => {
    fetchPayouts();
  }, [fetchPayouts]);

  // Cualquier cambio de filtro invalida la página en la que estabas.
  useEffect(() => {
    setPage(1);
  }, [activeTab, debouncedSearch, method, startDate, endDate]);

  // Las filas de la pestaña anterior no pueden quedarse en pantalla mientras carga
  // la nueva: la columna de acción se pinta según el estado de cada fila y se verían
  // retiros ya resueltos bajo la pestaña de pendientes.
  useEffect(() => {
    setPayouts([]);
    setTotal(0);
  }, [activeTab]);

  const hasFilters = Boolean(searchTerm || method || startDate || endDate);

  const handleClearFilters = () => {
    setSearchTerm("");
    setMethod("");
    setStartDate("");
    setEndDate("");
  };

  const handleOpenDetails = (payout) => {
    setSelectedPayout(payout);
    setConfirmAction(null);
  };

  const handleCloseDetails = () => {
    if (!submitting) {
      setSelectedPayout(null);
      setConfirmAction(null);
      setReceiptFile(null); // Reset receipt file
    }
  };

  const handleProcessPayout = async () => {
    if (!selectedPayout || !confirmAction) return;

    if (confirmAction === "approve" && !receiptFile) {
      toast.error("Por favor, adjunta la captura o comprobante de la transferencia.");
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("action", confirmAction);
      if (receiptFile) {
        formData.append("receipt", receiptFile);
      }

      const { data } = await processAdminPayoutAPI(selectedPayout.id, formData);
      if (data?.success) {
        toast.success(data.message || `Retiro ${confirmAction === "approve" ? "aprobado" : "rechazado"} con éxito.`);
        handleCloseDetails();
        fetchPayouts();
        refreshStats();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || "Error al procesar el retiro");
    } finally {
      setSubmitting(false);
    }
  };

  const getBankName = (code) => {
    return VENEZUELAN_BANKS_MAP[code] || `Banco desconocido (${code})`;
  };

  const formatMethodLabel = (method) => {
    if (method === "zelle") return "Zelle";
    if (method === "pago_movil") return "Pago Móvil";
    if (method === "transferencia") return "Transferencia";
    return method;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("es-VE", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-full pb-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight font-['Manrope']">
            Gestión de Retiros
          </h2>
          <p className="text-sm text-gray-500 mt-1 font-medium">
            Administra, audita y aprueba o rechaza los retiros de fondos de las billeteras de las tiendas.
          </p>
        </div>
        <button
          onClick={fetchPayouts}
          className="self-start md:self-auto text-xs font-bold text-[#6b1e96] hover:bg-[#6b1e96]/10 px-4 py-2.5 rounded-xl transition-colors border border-[#6b1e96]/20 flex items-center gap-1.5 bg-white shadow-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
          Sincronizar
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 mb-6 bg-gray-100/50 p-1.5 rounded-2xl w-max max-w-full border border-gray-200 shadow-sm">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm ${
              activeTab === tab.id
                ? "bg-[#6b1e96] text-white"
                : "bg-white text-gray-500 hover:text-gray-800"
            }`}
          >
            <span className="text-lg">{tab.icon}</span>
            {tab.label}
            <span
              className={`px-1.5 py-0.5 rounded-md text-[10px] font-black tabular-nums ${
                activeTab === tab.id ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
              }`}
            >
              {counts[tab.id] ?? 0}
            </span>
          </button>
        ))}
      </div>

      {/* KPIs contables: sólo en el historial completo */}
      {activeTab === "all" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Pagado", amount: summary.completed_usd, n: counts.completed, cls: "border-green-100 bg-green-50/60", text: "text-green-700" },
            { label: "Pendiente", amount: summary.pending_usd, n: counts.pending, cls: "border-yellow-100 bg-yellow-50/60", text: "text-yellow-700" },
            { label: "En proceso", amount: summary.processing_usd, n: counts.processing, cls: "border-blue-100 bg-blue-50/60", text: "text-blue-700" },
            { label: "Rechazado", amount: summary.rejected_usd, n: counts.rejected, cls: "border-red-100 bg-red-50/60", text: "text-red-700" },
          ].map((kpi) => (
            <div key={kpi.label} className={`rounded-2xl border p-4 shadow-sm ${kpi.cls}`}>
              <span className={`block text-[10px] font-bold uppercase tracking-widest ${kpi.text}`}>{kpi.label}</span>
              <div className="text-2xl font-black text-gray-900 font-mono mt-1">
                ${Number(kpi.amount || 0).toFixed(2)}
              </div>
              <span className="text-xs text-gray-500 font-medium">
                {kpi.n} {kpi.n === 1 ? "retiro" : "retiros"}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="lg:col-span-2">
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Buscar tienda</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Nombre comercial o RIF…"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400 transition-all"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Desde</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400 transition-all"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Hasta</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400 transition-all"
              />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Método</label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400 transition-all"
            >
              <option value="">Todos los métodos</option>
              {PAYOUT_METHODS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
        </div>
        {hasFilters && (
          <button
            onClick={handleClearFilters}
            className="mt-3 text-xs font-semibold text-red-500 hover:text-red-700 transition-colors"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center p-24 bg-white rounded-2xl border border-gray-200">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-gray-200 border-t-[#6b1e96] rounded-full animate-spin" />
            <p className="text-sm text-gray-500 font-semibold">Cargando solicitudes...</p>
          </div>
        </div>
      ) : payouts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center shadow-sm">
          <div className="text-5xl mb-4">💸</div>
          <h3 className="text-lg font-bold text-gray-900 font-['Manrope']">Sin solicitudes registradas</h3>
          <p className="text-sm text-gray-400 mt-1 max-w-sm mx-auto">
            {activeTab === "all"
              ? "No se encontraron solicitudes de retiro con los filtros aplicados."
              : <>No se encontraron solicitudes de retiro con estado <span className="font-semibold text-gray-600">&ldquo;{STATUS_CONFIG[activeTab]?.label}&rdquo;</span>.</>}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse hidden md:table">
              <thead>
                <tr className="bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">
                  <th className="px-6 py-4">Solicitado</th>
                  <th className="px-6 py-4">Tienda</th>
                  <th className="px-6 py-4">Método</th>
                  <th className="px-6 py-4">Monto (USD)</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4">Resuelto</th>
                  <th className="px-6 py-4">Por</th>
                  <th className="px-6 py-4 text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                {payouts.map((p) => {
                  const status = STATUS_CONFIG[p.status] || { label: p.status, bg: "bg-gray-100 text-gray-600 border-gray-200", dot: "bg-gray-400" };
                  return (
                    <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4.5 whitespace-nowrap text-xs text-gray-500 font-medium">
                        {formatDate(p.created_at)}
                      </td>
                      <td className="px-6 py-4.5">
                        <div>
                          <div className="font-bold text-gray-900">{p.store?.business_name || "Tienda Desconocida"}</div>
                          <div className="text-xs text-gray-400 font-mono mt-0.5">RIF: {p.store?.rif || "N/A"}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4.5 whitespace-nowrap">
                        <span className="font-semibold text-gray-700">{formatMethodLabel(p.method)}</span>
                      </td>
                      <td className="px-6 py-4.5 whitespace-nowrap font-mono font-bold text-[#6b1e96] text-base">
                        ${Number(p.amount).toFixed(2)}
                      </td>
                      <td className="px-6 py-4.5 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${status.bg}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-4.5 whitespace-nowrap text-xs text-gray-500 font-medium">
                        {p.status === "pending" ? (
                          "—"
                        ) : (
                          <div className="flex flex-col gap-0.5">
                            <span>{formatDate(p.updated_at)}</span>
                            {p.payment_details?.receipt_url && (
                              <a
                                href={p.payment_details.receipt_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[#6b1e96] font-bold hover:underline"
                              >
                                Comprobante ↗
                              </a>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4.5 whitespace-nowrap text-xs text-gray-600 font-semibold">
                        {p.processed_by_name || "—"}
                      </td>
                      <td className="px-6 py-4.5 whitespace-nowrap text-center">
                        <button
                          onClick={() => handleOpenDetails(p)}
                          className="px-4 py-2 text-xs font-bold text-[#6b1e96] hover:bg-[#6b1e96]/10 rounded-xl transition-colors border border-[#6b1e96]/20 bg-white"
                        >
                          {p.status === "pending" || p.status === "processing" ? "Procesar" : "Ver Detalle"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Vista responsiva de tarjetas en móvil */}
            <div className="grid grid-cols-1 gap-4 p-4 md:hidden">
              {payouts.map((p) => {
                const status = STATUS_CONFIG[p.status] || { label: p.status, bg: "bg-gray-100 text-gray-600 border-gray-200", dot: "bg-gray-400" };
                return (
                  <div 
                    key={p.id} 
                    className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm space-y-3"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex flex-col">
                        <span className="text-xs text-gray-400 font-semibold">{formatDate(p.created_at)}</span>
                        <span className="font-bold text-gray-900 text-sm mt-1">{p.store?.business_name || "Tienda Desconocida"}</span>
                        <span className="text-[10px] text-gray-400 font-mono">RIF: {p.store?.rif || "N/A"}</span>
                      </div>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${status.bg}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                        {status.label}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-xs pt-2 border-t border-gray-100">
                      <div className="flex flex-col">
                        <span className="text-gray-400">Método:</span>
                        <span className="font-bold text-gray-700 mt-0.5">{formatMethodLabel(p.method)}</span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-gray-400">Monto:</span>
                        <span className="font-black text-[#6b1e96] font-mono text-sm mt-0.5">${Number(p.amount).toFixed(2)}</span>
                      </div>
                    </div>

                    {p.status !== "pending" && (
                      <div className="flex justify-between items-center text-xs pt-2 border-t border-gray-100">
                        <div className="flex flex-col">
                          <span className="text-gray-400">Resuelto:</span>
                          <span className="font-semibold text-gray-600 mt-0.5">{formatDate(p.updated_at)}</span>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-gray-400">Por:</span>
                          <span className="font-semibold text-gray-600 mt-0.5">{p.processed_by_name || "—"}</span>
                        </div>
                      </div>
                    )}

                    {p.payment_details?.receipt_url && (
                      <a
                        href={p.payment_details.receipt_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-xs font-bold text-[#6b1e96] hover:underline"
                      >
                        📄 Ver comprobante ↗
                      </a>
                    )}

                    <div className="pt-2">
                      <button
                        onClick={() => handleOpenDetails(p)}
                        className="w-full py-2 text-center text-xs font-bold text-[#6b1e96] hover:bg-[#6b1e96]/10 rounded-xl transition-colors border border-[#6b1e96]/20 bg-white"
                      >
                        {p.status === "pending" || p.status === "processing" ? "Procesar" : "Ver Detalle"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="px-5 pb-5">
            <Pagination
              page={page}
              totalPages={Math.max(1, Math.ceil(total / PER_PAGE))}
              total={total}
              limit={PER_PAGE}
              onPageChange={setPage}
            />
          </div>
        </div>
      )}

      {/* Details / Processing Modal */}
      {selectedPayout && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[150] p-4 animate-in fade-in duration-250" onClick={handleCloseDetails}>
          <div
            className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-100 text-[#6b1e96] flex items-center justify-center text-lg">
                  🏦
                </div>
                <div>
                  <h3 className="text-xl font-bold font-['Manrope'] text-gray-900">Detalles de la Solicitud</h3>
                  <p className="text-xs text-gray-400 mt-0.5">ID: #{selectedPayout.id.substring(0, 8).toUpperCase()}</p>
                </div>
              </div>
              <button
                onClick={handleCloseDetails}
                disabled={submitting}
                className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-all disabled:opacity-50"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 overflow-y-auto flex-1 admin-scrollbar-light">
              {/* Store & Request general info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Comercio Solicitante</label>
                  <p className="font-bold text-gray-900 mt-0.5">{selectedPayout.store?.business_name}</p>
                  <p className="text-xs text-gray-500 font-mono mt-0.5">{selectedPayout.store?.rif}</p>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Fecha de Solicitud</label>
                  <p className="text-sm font-semibold text-gray-700 mt-0.5">{formatDate(selectedPayout.created_at)}</p>
                </div>
              </div>

              {/* Amount USD details */}
              <div className="p-4 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-[#6b1e96] uppercase tracking-wider">Monto a Liquidar</span>
                  <div className="text-2xl font-black text-gray-900 font-mono mt-0.5">
                    ${Number(selectedPayout.amount).toFixed(2)}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Método</span>
                  <div className="text-base font-bold text-gray-800 mt-0.5">
                    {formatMethodLabel(selectedPayout.method)}
                  </div>
                </div>
              </div>

              {/* Prominent Bolívares (VES) equivalency banner if available */}
              {selectedPayout.payment_details?.amount_ves && (
                <div className="p-4.5 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-950 flex flex-col gap-1.5 shadow-sm">
                  <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest">💰 Monto a Liquidar en Bolívares (VES)</span>
                  <div className="text-3xl font-black font-mono text-emerald-900">
                    {Number(selectedPayout.payment_details.amount_ves).toLocaleString("es-VE", { minimumFractionDigits: 2 })} VES
                  </div>
                  <div className="text-[10px] text-emerald-700/85 font-medium mt-0.5">
                    Tasa BCV oficial congelada al solicitar: <span className="font-bold font-mono">{selectedPayout.payment_details.exchange_rate_at_request} VES/USD</span> (Monto USD base: ${Number(selectedPayout.amount).toFixed(2)})
                  </div>
                </div>
              )}

              {/* Payment Details Formatted */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Datos de Pago Destino</label>
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 space-y-3.5">
                  {selectedPayout.method === "zelle" && (
                    <>
                      <div>
                        <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Correo Electrónico Zelle</span>
                        <span className="text-sm font-bold text-gray-900 select-all font-mono">{selectedPayout.payment_details?.email}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Nombre del Titular</span>
                        <span className="text-sm font-bold text-gray-800">{selectedPayout.payment_details?.holder_name}</span>
                      </div>
                    </>
                  )}

                  {selectedPayout.method === "pago_movil" && (
                    <>
                      <div>
                        <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Banco Receptor</span>
                        <span className="text-sm font-bold text-gray-900">
                          {selectedPayout.payment_details?.bank_code} - {getBankName(selectedPayout.payment_details?.bank_code)}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Teléfono Asociado</span>
                          <span className="text-sm font-bold text-gray-900 select-all font-mono">{selectedPayout.payment_details?.phone}</span>
                        </div>
                        <div>
                          <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Cédula / RIF</span>
                          <span className="text-sm font-bold text-gray-900 select-all font-mono">{selectedPayout.payment_details?.dni}</span>
                        </div>
                      </div>
                    </>
                  )}

                  {selectedPayout.method === "transferencia" && (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Banco Receptor</span>
                          <span className="text-sm font-bold text-gray-800">{selectedPayout.payment_details?.bank_name}</span>
                        </div>
                        <div>
                          <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Cédula / RIF</span>
                          <span className="text-sm font-bold text-gray-900 select-all font-mono">{selectedPayout.payment_details?.dni}</span>
                        </div>
                      </div>
                      <div>
                        <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Número de Cuenta (20 dígitos)</span>
                        <span className="text-sm font-bold text-gray-900 select-all font-mono block bg-white border border-gray-100 p-2 rounded-lg mt-1 tracking-wider text-center">
                          {selectedPayout.payment_details?.account_number}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Nombre del Titular</span>
                        <span className="text-sm font-bold text-gray-800">{selectedPayout.payment_details?.holder_name}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Status details when processed */}
              {selectedPayout.status !== "pending" && selectedPayout.status !== "processing" && (
                <div className="p-4 rounded-xl border flex flex-col gap-2.5 bg-gray-50 border-gray-100">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Resultado del Procesamiento:</span>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_CONFIG[selectedPayout.status]?.bg}`}>
                      {STATUS_CONFIG[selectedPayout.status]?.dot && <span className={`w-1.5 h-1.5 rounded-full ${STATUS_CONFIG[selectedPayout.status].dot}`} />}
                      {STATUS_CONFIG[selectedPayout.status]?.label}
                    </span>
                  </div>
                  {selectedPayout.payment_details?.processed_at && (
                    <span className="text-xs text-gray-500 font-medium">
                      Procesado el: {formatDate(selectedPayout.payment_details.processed_at)}
                    </span>
                  )}
                  {selectedPayout.payment_details?.receipt_url && (
                    <div className="mt-1 pt-2 border-t border-gray-100">
                      <span className="block text-[10px] font-bold text-[#6b1e96] uppercase tracking-wider mb-1.5">📸 Comprobante de Transferencia</span>
                      <a
                        href={selectedPayout.payment_details.receipt_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-[#6b1e96] bg-purple-50 hover:bg-purple-100 border border-purple-100 transition-colors"
                      >
                        <span>📄 Ver captura de transacción</span>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                        </svg>
                      </a>
                    </div>
                  )}
                </div>
              )}

              {/* Interactive flow: Confirmation alert message */}
              {confirmAction && (
                <div className="space-y-4">
                  <div className={`p-4 rounded-xl border text-xs font-medium animate-in slide-in-from-top-4 duration-200 ${
                    confirmAction === "approve"
                      ? "bg-green-50 border-green-100 text-green-800"
                      : "bg-red-50 border-red-100 text-red-800"
                  }`}>
                    {confirmAction === "approve" ? (
                      <>
                        <span className="font-bold block mb-1">⚠️ Confirmación de Aprobación</span>
                        Al aprobar esta solicitud, indicas que ya realizaste manualmente la transferencia de fondos (Pago Móvil o Transferencia) hacia las coordenadas indicadas arriba. Los fondos serán deducidos definitivamente de la billetera de la tienda.
                      </>
                    ) : (
                      <>
                        <span className="font-bold block mb-1">⚠️ Confirmación de Rechazo</span>
                        Al rechazar esta solicitud, los fondos retenidos (${Number(selectedPayout.amount).toFixed(2)}) serán liberados de forma inmediata y devueltos al saldo disponible de la billetera de la tienda, permitiendo que hagan una nueva solicitud corregida.
                      </>
                    )}
                  </div>

                  {confirmAction === "approve" && (
                    <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/50 space-y-3.5 animate-in slide-in-from-top-4 duration-200">
                      <span className="block text-xs font-bold text-[#6b1e96] uppercase tracking-wider">📎 Adjuntar Captura / Comprobante de Transferencia (Obligatorio)</span>
                      <div className="relative border-2 border-dashed border-[#6b1e96]/20 hover:border-[#6b1e96]/40 transition-colors bg-white rounded-xl p-5 flex flex-col items-center justify-center gap-2 cursor-pointer shadow-sm">
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                              setReceiptFile(file);
                            }
                          }}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        />
                        <div className="w-9 h-9 rounded-full bg-purple-100 text-[#6b1e96] flex items-center justify-center text-base">
                          📸
                        </div>
                        <span className="text-xs text-gray-700 font-bold text-center">
                          {receiptFile ? `✅ ${receiptFile.name}` : "Selecciona o arrastra la captura aquí"}
                        </span>
                        <span className="text-[9px] text-gray-400 font-medium">Formatos soportados: JPG, PNG, WEBP, PDF (Máx 10MB)</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              {!confirmAction ? (
                <>
                  <button
                    type="button"
                    onClick={handleCloseDetails}
                    className="px-5 py-2.5 text-sm text-gray-600 hover:bg-gray-200/50 rounded-xl transition-all font-medium"
                  >
                    Cerrar
                  </button>

                  {(selectedPayout.status === "pending" || selectedPayout.status === "processing") && (
                    <>
                      <button
                        type="button"
                        onClick={() => setConfirmAction("reject")}
                        className="px-5 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 border border-red-200 rounded-xl transition-all"
                      >
                        Rechazar
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmAction("approve")}
                        className="px-6 py-2.5 text-sm font-bold text-white rounded-xl transition-all shadow-md"
                        style={{
                          background: "linear-gradient(135deg, #10b981, #059669)",
                        }}
                      >
                        Aprobar Liquidación
                      </button>
                    </>
                  )}
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setConfirmAction(null)}
                    disabled={submitting}
                    className="px-5 py-2.5 text-sm text-gray-600 hover:bg-gray-200/50 rounded-xl transition-all font-medium"
                  >
                    Atrás
                  </button>
                  <button
                    type="button"
                    onClick={handleProcessPayout}
                    disabled={submitting}
                    className="px-6 py-2.5 text-sm font-bold text-white rounded-xl transition-all shadow-md flex items-center gap-2"
                    style={{
                      background: confirmAction === "approve"
                        ? "linear-gradient(135deg, #10b981, #059669)"
                        : "linear-gradient(135deg, #ef4444, #dc2626)",
                    }}
                  >
                    {submitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Procesando...
                      </>
                    ) : (
                      <>
                        {confirmAction === "approve" ? "Confirmar Aprobación" : "Confirmar Rechazo"}
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
