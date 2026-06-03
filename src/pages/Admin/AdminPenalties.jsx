import { useState, useEffect, useCallback, useMemo } from "react";
import { getPenaltiesAPI, resolvePenaltyAPI, getPenaltyStatsAPI, reactivateStoreAPI } from "../../services/api";
import toast from "react-hot-toast";
import SearchableSelect from "../../components/ui/SearchableSelect";
import "../../components/ui/SearchableSelect.css";
import { supabase } from "../../lib/supabaseClient";

// ── SVG Icon Components for premium feel ──
/* eslint-disable react/prop-types */
const StorefrontIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72L4.318 3.44A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72m-13.5 8.65h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .415.336.75.75.75Z" />
  </svg>
);

const GavelIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.249-8.25-3.286Zm0 13.036h.008v.008H12v-.008Z" />
  </svg>
);

const ShieldAlertIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
  </svg>
);

const TYPE_CONFIG = {
  warning:      { label: "Advertencia",  bg: "bg-amber-50 text-amber-700 border border-amber-200/60", icon: "warning" },
  fine:         { label: "Multa",        bg: "bg-orange-50 text-orange-700 border border-orange-200/60", icon: "payments" },
  suspension:   { label: "Suspensión",   bg: "bg-red-50 text-red-700 border border-red-200/60", icon: "block" },
  cancellation: { label: "Cancelación",  bg: "bg-slate-50 text-slate-700 border border-slate-200/60", icon: "cancel" },
};

const STATUS_CONFIG = {
  pending_review: { label: "Pendiente", bg: "bg-yellow-50 text-yellow-700 border border-yellow-200/60", dot: "bg-yellow-500" },
  applied:        { label: "Aplicada",  bg: "bg-emerald-50 text-emerald-700 border border-emerald-200/60", dot: "bg-emerald-500" },
  dismissed:      { label: "Descartada",bg: "bg-slate-50 text-slate-500 border border-slate-200/60", dot: "bg-slate-400" },
};

const TYPE_OPTIONS = [
  { value: "", label: "Todos los Tipos" },
  { value: "warning", label: "⚠️ Advertencias" },
  { value: "fine", label: "💸 Multas" },
  { value: "suspension", label: "🚨 Suspensiones" },
  { value: "cancellation", label: "🚫 Cancelaciones" },
];

const STATUS_OPTIONS = [
  { value: "", label: "Todos los Estados" },
  { value: "pending_review", label: "⏳ Pendientes" },
  { value: "applied", label: "✅ Aplicadas" },
  { value: "dismissed", label: "❌ Descartadas" },
];

export default function AdminPenalties() {
  const [penalties, setPenalties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [storeIdFilter, setStoreIdFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [onlyAppeals, setOnlyAppeals] = useState(false);
  const [offset, setOffset] = useState(0);
  const [actionLoading, setActionLoading] = useState(null);
  const [knownStores, setKnownStores] = useState([]);

  // Dismiss modal
  const [dismissModal, setDismissModal] = useState({ open: false, penaltyId: null });
  const [dismissReason, setDismissReason] = useState("");

  // KPIs
  const [kpis, setKpis] = useState({ pending: 0, finesTotal: 0, suspended: 0, cancellations: 0 });

  const LIMIT = 30;

  const fetchPenalties = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit: LIMIT, offset };
      if (filterType) params.type = filterType;
      if (filterStatus) params.status = filterStatus;
      if (storeIdFilter) params.store_id = storeIdFilter;

      const { data } = await getPenaltiesAPI(params);
      setPenalties(data?.data || []);
    } catch (err) {
      toast.error("Error cargando sanciones: " + err.message);
    } finally {
      setLoading(false);
    }
  }, [filterType, filterStatus, storeIdFilter, offset]);

  const fetchKPIs = useCallback(async () => {
    try {
      const { data } = await getPenaltyStatsAPI();
      if (data?.data) {
        setKpis(data.data);
      }
    } catch { /* KPIs are non-critical */ }
  }, []);

  // Fetch store list on mount (one-time)
  useEffect(() => {
    const fetchStores = async () => {
      try {
        const { data } = await supabase
          .from("store_profiles")
          .select("user_id, business_name")
          .order("business_name", { ascending: true });
        setKnownStores(data || []);
      } catch { /* silent */ }
    };
    fetchStores();
  }, []);

  useEffect(() => { fetchPenalties(); }, [fetchPenalties]);
  useEffect(() => { fetchKPIs(); }, [fetchKPIs]);

  // Reset offset when filters change
  useEffect(() => { setOffset(0); }, [filterType, filterStatus, storeIdFilter, onlyAppeals]);

  const handleApprove = async (id) => {
    setActionLoading(id);
    try {
      await resolvePenaltyAPI(id, "applied");
      toast.success("Sanción aprobada exitosamente");
      fetchPenalties();
      fetchKPIs();
    } catch (err) {
      toast.error("Error: " + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDismissOpen = (id) => {
    setDismissModal({ open: true, penaltyId: id });
    setDismissReason("");
  };

  const handleDismissConfirm = async () => {
    if (!dismissReason.trim()) {
      toast.error("Debes proporcionar una razón para descartar");
      return;
    }
    setActionLoading(dismissModal.penaltyId);
    try {
      await resolvePenaltyAPI(dismissModal.penaltyId, "dismissed", dismissReason.trim());
      toast.success("Sanción descartada exitosamente");
      setDismissModal({ open: false, penaltyId: null });
      fetchPenalties();
      fetchKPIs();
    } catch (err) {
      toast.error("Error: " + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReactivateStore = async (storeId, storeName) => {
    setActionLoading(storeId);
    try {
      const res = await reactivateStoreAPI(storeId);
      toast.success(res.data?.message || `Tienda "${storeName || "desconocida"}" reactivada exitosamente`);
      fetchPenalties();
      fetchKPIs();
    } catch (err) {
      toast.error("Error al reactivar: " + (err.response?.data?.error || err.message));
    } finally {
      setActionLoading(null);
    }
  };

  const handleDismissApplied = async (id) => {
    setActionLoading(id);
    try {
      await resolvePenaltyAPI(id, "dismissed", "Descartada por admin desde panel de sanciones");
      toast.success("Suspensión descartada y tienda reactivada");
      fetchPenalties();
      fetchKPIs();
    } catch (err) {
      toast.error("Error: " + (err.response?.data?.error || err.message));
    } finally {
      setActionLoading(null);
    }
  };

  const clearFilters = () => {
    setFilterType("");
    setFilterStatus("");
    setStoreIdFilter("");
    setSearchTerm("");
    setOnlyAppeals(false);
    setOffset(0);
  };

  const hasActiveFilters = filterType || filterStatus || storeIdFilter || searchTerm || onlyAppeals;

  const storeOptions = useMemo(() => {
    const opts = [{ value: "", label: "Todas las Tiendas" }];
    knownStores.forEach((s) => {
      opts.push({
        value: s.user_id,
        label: s.business_name || "Sin nombre",
      });
    });
    return opts;
  }, [knownStores]);

  const filteredPenalties = useMemo(() => {
    return penalties
      .filter(p => !onlyAppeals || p.reason?.includes("📝 Apelación"))
      .filter(p => {
        if (!searchTerm.trim()) return true;
        const search = searchTerm.toLowerCase();
        const storeName = p.store_profiles?.business_name?.toLowerCase() || "";
        const orderId = p.order_id?.toLowerCase() || "";
        const reason = p.reason?.toLowerCase() || "";
        return storeName.includes(search) || orderId.includes(search) || reason.includes(search);
      });
  }, [penalties, onlyAppeals, searchTerm]);

  const formatDate = (d) =>
    d ? new Date(d).toLocaleDateString("es-VE", {
      day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
    }) : "—";

  return (
    <div className="min-h-screen bg-gray-50/60 pb-12 animate-fade-in-up">
      {/* Header */}
      <div className="bg-[#6b1e96] p-8 text-white relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-52 h-52 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-24 bottom-[-20px] w-36 h-36 bg-[#c3ff00]/10 rounded-full blur-2xl pointer-events-none" />
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <h1 className="text-3xl font-extrabold font-['Manrope'] mb-2 flex items-center gap-2.5">
              <span className="material-symbols-outlined text-[30px] bg-white/15 p-1.5 rounded-2xl align-middle text-[#c3ff00]">gavel</span>
              Gestión de Sanciones
            </h1>
            <p className="text-purple-200 text-sm max-w-2xl leading-relaxed">
              Revisa, aprueba o descarta las sanciones generadas automáticamente por el sistema de SLA.
              Las multas aprobadas se deducen automáticamente del wallet de la tienda.
            </p>
          </div>
          <button
            onClick={() => { fetchPenalties(); fetchKPIs(); }}
            className="flex items-center justify-center gap-2 bg-[#c3ff00] text-slate-900 px-5 py-2.5 rounded-full text-xs font-bold hover:bg-[#b0e600] active:scale-[0.97] transition-all shadow-md self-start md:self-auto"
          >
            <span className="material-symbols-outlined text-[16px]">refresh</span>
            Refrescar Panel
          </button>
        </div>
      </div>

      <div className="p-6 max-w-7xl mx-auto">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
                <span className="material-symbols-outlined text-[20px] font-bold">pending_actions</span>
              </div>
              <span className="text-sm text-gray-500 font-bold">Pendientes</span>
            </div>
            <p className="text-3xl font-black text-gray-900 font-['Manrope'] mt-2">{kpis.pending}</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                <span className="material-symbols-outlined text-[20px] font-bold">payments</span>
              </div>
              <span className="text-sm text-gray-500 font-bold">Multas Cobradas</span>
            </div>
            <p className="text-3xl font-black text-gray-900 font-['Manrope'] mt-2">${kpis.finesTotal.toFixed(2)}</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
                <span className="material-symbols-outlined text-[20px] font-bold">block</span>
              </div>
              <span className="text-sm text-gray-500 font-bold">Tiendas Suspendidas</span>
            </div>
            <p className="text-3xl font-black text-gray-900 font-['Manrope'] mt-2">{kpis.suspended}</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-2xl bg-slate-50 text-slate-600 flex items-center justify-center border border-slate-100">
                <span className="material-symbols-outlined text-[20px] font-bold">cancel</span>
              </div>
              <span className="text-sm text-gray-500 font-bold">Cancelaciones</span>
            </div>
            <p className="text-3xl font-black text-gray-900 font-['Manrope'] mt-2">{kpis.cancellations}</p>
          </div>
        </div>

        {/* Search & Filters Bar */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm mb-6">
          {/* Search bar */}
          <div className="relative mb-4">
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#9ca3af" strokeWidth={2.5} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
            <input
              type="text"
              placeholder="Buscar por nombre de tienda, ID de orden o motivo de sanción..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm bg-gray-50/50 hover:bg-white focus:bg-white focus:ring-2 focus:ring-[#6b1e96]/10 focus:border-[#6b1e96] outline-none transition-all"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Store search filter */}
            <div className="flex-1 min-w-[200px]">
              <SearchableSelect
                options={storeOptions}
                value={storeIdFilter}
                onChange={(val) => setStoreIdFilter(val)}
                placeholder="Tienda: Todas"
                searchPlaceholder="Buscar tienda..."
                icon={<StorefrontIcon className="h-4 w-4" />}
              />
            </div>

            {/* Type Filter */}
            <div className="flex-1 min-w-[180px]">
              <SearchableSelect
                options={TYPE_OPTIONS}
                value={filterType}
                onChange={(val) => setFilterType(val)}
                placeholder="Tipo: Todos"
                searchPlaceholder="Buscar tipo..."
                icon={<GavelIcon className="h-4 w-4" />}
              />
            </div>

            {/* Status Filter */}
            <div className="flex-1 min-w-[180px]">
              <SearchableSelect
                options={STATUS_OPTIONS}
                value={filterStatus}
                onChange={(val) => setFilterStatus(val)}
                placeholder="Estado: Todos"
                searchPlaceholder="Buscar estado..."
                icon={<ShieldAlertIcon className="h-4 w-4" />}
              />
            </div>

            {/* Appeal only toggler */}
            <button
              onClick={() => setOnlyAppeals(!onlyAppeals)}
              className={`flex items-center gap-2 px-4.5 py-2.5 rounded-xl text-sm font-semibold transition-all border ${
                onlyAppeals 
                  ? "bg-blue-50 border-blue-200 text-blue-700 shadow-sm" 
                  : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300"
              }`}
            >
              <span>📝</span>
              Solo Apelaciones
            </button>

            {/* Clear filters trigger */}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1.5 px-4.5 py-2.5 rounded-xl border border-purple-200/50 bg-purple-50/40 text-[#6b1e96] hover:bg-purple-100/50 text-sm font-bold transition-all"
              >
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
                Limpiar
              </button>
            )}
          </div>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="flex flex-col items-center justify-center p-20 bg-white border border-gray-200 rounded-2xl shadow-sm">
            <div className="w-10 h-10 border-4 border-[#c3ff00] border-t-[#6b1e96] rounded-full animate-spin" />
            <p className="text-gray-400 text-xs mt-3.5 font-bold">Cargando sanciones registradas...</p>
          </div>
        ) : filteredPenalties.length === 0 ? (
          /* Empty State */
          <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center shadow-sm">
            <div className="w-16 h-16 rounded-full bg-green-50 border border-green-100 text-green-600 flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-[32px] font-bold">check_circle</span>
            </div>
            <h3 className="text-lg font-bold text-gray-900 font-['Manrope'] mb-2">Sin Sanciones</h3>
            <p className="text-sm text-gray-500 max-w-sm mx-auto">No se encontraron sanciones registradas que coincidan con los filtros aplicados en este momento.</p>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="mt-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-4.5 py-2.5 rounded-xl transition-all shadow-sm">
                Limpiar Filtros
              </button>
            )}
          </div>
        ) : (
          /* Table container with high quality layout */
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden transition-all duration-200">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200/80">
                    <th className="text-left px-5 py-4 font-bold text-gray-500 text-xs uppercase tracking-wider">Tienda</th>
                    <th className="text-left px-5 py-4 font-bold text-gray-500 text-xs uppercase tracking-wider">Orden</th>
                    <th className="text-left px-5 py-4 font-bold text-gray-500 text-xs uppercase tracking-wider">Tipo</th>
                    <th className="text-left px-5 py-4 font-bold text-gray-500 text-xs uppercase tracking-wider">Monto</th>
                    <th className="text-left px-5 py-4 font-bold text-gray-500 text-xs uppercase tracking-wider">Estado</th>
                    <th className="text-left px-5 py-4 font-bold text-gray-500 text-xs uppercase tracking-wider">Fecha</th>
                    <th className="text-left px-5 py-4 font-bold text-gray-500 text-xs uppercase tracking-wider max-w-[220px]">Razón</th>
                    <th className="text-right px-5 py-4 font-bold text-gray-500 text-xs uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredPenalties.map((p) => {
                    const typeConf = TYPE_CONFIG[p.type] || TYPE_CONFIG.warning;
                    const statusConf = STATUS_CONFIG[p.status] || STATUS_CONFIG.pending_review;

                    return (
                      <tr 
                        key={p.id} 
                        className="group border-b border-gray-100 border-l-4 border-l-transparent hover:bg-purple-50/20 hover:border-l-[#6b1e96] transition-all duration-200"
                      >
                        <td className="px-5 py-4.5 font-bold text-gray-900 whitespace-nowrap">
                          {p.store_profiles?.business_name || p.store_id?.substring(0, 8)}
                        </td>
                        <td className="px-5 py-4.5 text-gray-500 font-mono text-xs">
                          #{p.order_id?.substring(0, 8)}
                        </td>
                        <td className="px-5 py-4.5">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${typeConf.bg}`}>
                            <span className="material-symbols-outlined text-[15px] align-middle">{typeConf.icon}</span>
                            {typeConf.label}
                          </span>
                        </td>
                        <td className="px-5 py-4.5 font-black text-gray-900">
                          {Number(p.amount) > 0 ? `$${Number(p.amount).toFixed(2)}` : "—"}
                        </td>
                        <td className="px-5 py-4.5">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${statusConf.bg}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${statusConf.dot}`} />
                            {statusConf.label}
                          </span>
                        </td>
                        <td className="px-5 py-4.5 text-gray-500 text-xs whitespace-nowrap font-medium">
                          {formatDate(p.created_at)}
                        </td>
                        <td className="px-5 py-4.5 text-gray-600 text-xs max-w-[220px] truncate" title={p.reason}>
                          {p.reason || "—"}
                        </td>
                        <td className="px-5 py-4.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end flex-wrap gap-2">
                            {/* Appeal badge */}
                            {p.reason?.includes("📝 Apelación") && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-50 text-blue-600 border border-blue-100 whitespace-nowrap">
                                📝 Apelada
                              </span>
                            )}
                            {p.status === "pending_review" ? (
                              <>
                                <button
                                  onClick={() => handleApprove(p.id)}
                                  disabled={actionLoading === p.id}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3.5 py-2 rounded-xl font-bold transition-all shadow-sm hover:shadow active:scale-95 flex items-center gap-1 disabled:opacity-50"
                                >
                                  {actionLoading === p.id ? "..." : (
                                    <>
                                      <span className="material-symbols-outlined text-[14px]">done</span>
                                      {p.type === "fine" ? "Cobrar" : "Aprobar"}
                                    </>
                                  )}
                                </button>
                                <button
                                  onClick={() => handleDismissOpen(p.id)}
                                  disabled={actionLoading === p.id}
                                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs px-3.5 py-2 rounded-xl font-bold transition-all shadow-sm active:scale-95 flex items-center gap-1 disabled:opacity-50"
                                >
                                  <span className="material-symbols-outlined text-[14px]">close</span>
                                  Descartar
                                </button>
                              </>
                            ) : p.status === "applied" && p.type === "suspension" ? (
                              <>
                                <button
                                  onClick={() => handleDismissApplied(p.id)}
                                  disabled={actionLoading === p.id}
                                  className="bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs px-3.5 py-2 border border-amber-200 rounded-xl font-bold transition-all shadow-sm active:scale-95 flex items-center gap-1 disabled:opacity-50"
                                >
                                  {actionLoading === p.id ? "..." : (
                                    <>
                                      <span className="material-symbols-outlined text-[14px]">lock_open</span>
                                      Descartar
                                    </>
                                  )}
                                </button>
                                <button
                                  onClick={() => handleReactivateStore(p.store_id, p.store_profiles?.business_name)}
                                  disabled={actionLoading === p.store_id}
                                  className="bg-[#6b1e96] hover:bg-[#5a1a7e] text-white text-xs px-3.5 py-2 rounded-xl font-bold transition-all shadow-sm hover:shadow active:scale-95 flex items-center gap-1 disabled:opacity-50"
                                >
                                  {actionLoading === p.store_id ? "..." : (
                                    <>
                                      <span className="material-symbols-outlined text-[14px]">check_circle</span>
                                      Reactivar
                                    </>
                                  )}
                                </button>
                              </>
                            ) : (
                              <span className="text-gray-400 text-xs font-bold italic bg-gray-50 border border-gray-100 px-3 py-1 rounded-full">Resuelta</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination / Count summary */}
            <div className="flex items-center justify-between px-5 py-4 border-t border-gray-200/80 bg-gray-50/50">
              <p className="text-xs text-gray-500 font-medium">
                Mostrando <span className="font-bold text-gray-800">{filteredPenalties.length}</span> de <span className="font-bold text-gray-800">{penalties.length}</span> sanción{penalties.length !== 1 ? "es" : ""} recuperada{penalties.length !== 1 ? "s" : ""}
                {offset > 0 && ` (página ${Math.floor(offset / LIMIT) + 1})`}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setOffset(Math.max(0, offset - LIMIT))}
                  disabled={offset === 0}
                  className="px-3.5 py-2 text-xs font-bold border border-gray-300 bg-white rounded-xl hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-white disabled:cursor-not-allowed transition-all shadow-sm"
                >
                  ← Anterior
                </button>
                <button
                  onClick={() => setOffset(offset + LIMIT)}
                  disabled={penalties.length < LIMIT}
                  className="px-3.5 py-2 text-xs font-bold border border-gray-300 bg-white rounded-xl hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-white disabled:cursor-not-allowed transition-all shadow-sm"
                >
                  Siguiente →
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Dismiss Modal */}
      {dismissModal.open && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all" onClick={() => setDismissModal({ open: false, penaltyId: null })}>
          <div className="bg-white rounded-3xl p-6.5 max-w-md w-full shadow-2xl border border-gray-100 animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3.5 mb-4">
              <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
                <span className="material-symbols-outlined text-[22px] font-bold">gavel</span>
              </div>
              <h3 className="text-xl font-extrabold font-['Manrope'] text-gray-900">Descartar Sanción</h3>
            </div>
            <p className="text-xs text-gray-500 mb-4.5 leading-relaxed">
              Por favor, proporciona el motivo detallado de por qué descartarás esta sanción. Este comentario quedará registrado para auditoría en el wallet y perfil de la tienda.
            </p>
            <textarea
              value={dismissReason}
              onChange={(e) => setDismissReason(e.target.value)}
              placeholder="Escribe aquí el motivo del descarte..."
              rows={3}
              className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:ring-4 focus:ring-[#6b1e96]/10 focus:border-[#6b1e96] outline-none resize-none transition-all bg-gray-50"
            />
            <div className="flex justify-end gap-3 mt-5">
              <button
                onClick={() => setDismissModal({ open: false, penaltyId: null })}
                className="px-4 py-2.5 text-xs font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleDismissConfirm}
                disabled={actionLoading}
                className="bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 text-xs rounded-xl font-bold transition-all shadow-sm active:scale-95 disabled:opacity-50"
              >
                {actionLoading ? "Procesando..." : "Confirmar Descarte"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
