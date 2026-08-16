import { useState, useEffect, useCallback, useMemo, Fragment } from "react";
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

// El tipo se lee como texto con un punto de color: el estado es lo que lleva
// pastilla, así las dos columnas no compiten por la misma atención.
const TYPE_CONFIG = {
  warning:      { label: "Advertencia",  text: "text-amber-700",  dot: "bg-amber-500" },
  fine:         { label: "Multa",        text: "text-orange-700", dot: "bg-orange-500" },
  suspension:   { label: "Suspensión",   text: "text-rose-700",   dot: "bg-rose-500" },
  cancellation: { label: "Cancelación",  text: "text-slate-600",  dot: "bg-slate-400" },
};

// El color dice qué le pasó a la TIENDA, no si la gestión salió bien:
// aplicada = el castigo surtió efecto (rojo), descartada = anulada (gris).
const STATUS_CONFIG = {
  pending_review: {
    label: "Pendiente",
    hint: "Propuesta por el sistema. Espera tu decisión y todavía no afecta a la tienda.",
    bg: "bg-amber-100/70 text-amber-800",
  },
  applied: {
    label: "Aplicada",
    hint: "Ejecutada: la multa ya se descontó del wallet o la suspensión ya está activa.",
    bg: "bg-rose-100/70 text-rose-800",
  },
  dismissed: {
    label: "Descartada",
    hint: "Anulada por un administrador. No tiene ningún efecto sobre la tienda.",
    bg: "bg-slate-100 text-slate-500",
  },
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

// El campo `reason` acumula tres voces separadas por " | ": el motivo que escribió
// el cron de SLA, la apelación de la tienda y la resolución del administrador.
const REASON_SEGMENTS = [
  { key: "appeal", re: /^📝\s*Apelación de tienda:\s*/ },
  { key: "resolution", re: /^Resuelto por Admin:\s*/ },
];

const parseReason = (raw) => {
  const parsed = { system: "", appeal: "", resolution: "" };
  String(raw || "").split(/\s*\|\s*/).forEach((segment) => {
    const match = REASON_SEGMENTS.find((s) => s.re.test(segment));
    if (match) parsed[match.key] = segment.replace(match.re, "");
    else if (segment.trim()) parsed.system = parsed.system ? `${parsed.system} | ${segment}` : segment;
  });
  return parsed;
};

// Qué hace de verdad "aplicar" según el tipo, para no prometer más de lo que ocurre.
const applyAction = (p) => {
  switch (p.type) {
    case "fine":
      return {
        label: `Cobrar $${Number(p.amount).toFixed(2)}`,
        hint: "Descuenta el monto del wallet de la tienda de inmediato.",
        toast: `Multa de $${Number(p.amount).toFixed(2)} cobrada del wallet de la tienda`,
      };
    case "suspension":
      return {
        label: "Suspender tienda",
        hint: "Bloquea la operación de la tienda hasta que se levante la suspensión.",
        toast: "Suspensión aplicada: la tienda queda bloqueada",
      };
    default:
      return {
        label: "Aplicar",
        hint: "Deja la sanción registrada como ejecutada en el historial de la tienda.",
        toast: "Sanción aplicada",
      };
  }
};

const EMPTY_FILTERS = { type: "", status: "", storeId: "", search: "", appeals: false };

const PAGE_SIZES = [10, 25, 50, 100];

// Cada KPI es un atajo a la vista de la tabla que lo explica: pulsarlo filtra.
const KPI_CARDS = [
  {
    key: "pending",
    label: "Pendientes",
    icon: "pending_actions",
    iconClass: "bg-amber-50 text-amber-600 border-amber-100",
    context: "esperan tu decisión",
    filter: { type: "", status: "pending_review" },
    format: (v) => String(v ?? 0),
  },
  {
    key: "finesTotal",
    label: "Multas cobradas",
    icon: "payments",
    iconClass: "bg-emerald-50 text-emerald-600 border-emerald-100",
    context: "descontado de los wallets",
    filter: { type: "fine", status: "applied" },
    format: (v) => `$${Number(v || 0).toFixed(2)}`,
  },
  {
    key: "suspended",
    label: "Tiendas suspendidas",
    icon: "block",
    iconClass: "bg-rose-50 text-rose-600 border-rose-100",
    context: "no pueden vender ahora",
    filter: { type: "suspension", status: "applied" },
    format: (v) => String(v ?? 0),
  },
  {
    key: "cancellations",
    label: "Cancelaciones",
    icon: "cancel",
    iconClass: "bg-slate-100 text-slate-600 border-slate-200",
    context: "órdenes anuladas por el SLA",
    filter: { type: "cancellation", status: "" },
    format: (v) => String(v ?? 0),
  },
];

export default function AdminPenalties() {
  const [penalties, setPenalties] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [searchInput, setSearchInput] = useState("");
  const [offset, setOffset] = useState(0);
  const [limit, setLimit] = useState(25);
  const [actionLoading, setActionLoading] = useState(null);
  const [knownStores, setKnownStores] = useState([]);
  const [expandedId, setExpandedId] = useState(null);

  // Dismiss modal
  const [dismissModal, setDismissModal] = useState({ open: false, penaltyId: null });
  const [dismissReason, setDismissReason] = useState("");

  // KPIs
  const [kpis, setKpis] = useState({ pending: 0, finesTotal: 0, suspended: 0, cancellations: 0 });

  const updateFilters = useCallback((patch) => {
    setFilters((prev) => ({ ...prev, ...patch }));
    setOffset(0);
  }, []);

  // El buscador va al servidor, así que se espera a que el admin deje de escribir.
  useEffect(() => {
    if (searchInput === filters.search) return;
    const timer = setTimeout(() => updateFilters({ search: searchInput }), 350);
    return () => clearTimeout(timer);
  }, [searchInput, filters.search, updateFilters]);

  const fetchPenalties = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit, offset };
      if (filters.type) params.type = filters.type;
      if (filters.status) params.status = filters.status;
      if (filters.storeId) params.store_id = filters.storeId;
      if (filters.search.trim()) params.search = filters.search.trim();
      if (filters.appeals) params.appeals_only = "true";

      const { data } = await getPenaltiesAPI(params);
      setPenalties(data?.data || []);
      setTotal(data?.count ?? 0);
    } catch (err) {
      toast.error("Error cargando sanciones: " + err.message);
    } finally {
      setLoading(false);
    }
  }, [filters, offset, limit]);

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

  const refreshAll = () => { fetchPenalties(); fetchKPIs(); };

  const handleApply = async (penalty) => {
    setActionLoading(penalty.id);
    try {
      await resolvePenaltyAPI(penalty.id, "applied");
      toast.success(applyAction(penalty).toast);
      refreshAll();
    } catch (err) {
      toast.error("Error: " + (err.response?.data?.error || err.message));
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
      refreshAll();
    } catch (err) {
      toast.error("Error: " + (err.response?.data?.error || err.message));
    } finally {
      setActionLoading(null);
    }
  };

  // Descarta ESTA suspensión. El backend reactiva la tienda solo si no le queda
  // ninguna otra suspensión activa.
  const handleLiftSuspension = async (id) => {
    setActionLoading(id);
    try {
      await resolvePenaltyAPI(id, "dismissed", "Suspensión levantada por admin desde el panel de sanciones");
      toast.success("Suspensión levantada");
      refreshAll();
    } catch (err) {
      toast.error("Error: " + (err.response?.data?.error || err.message));
    } finally {
      setActionLoading(null);
    }
  };

  // Acción de fuerza bruta: reactiva la tienda y descarta TODAS sus suspensiones.
  const handleReactivateStore = async (storeId, storeName) => {
    const label = storeName || "esta tienda";
    if (!window.confirm(`Se reactivará "${label}" y se descartarán TODAS sus suspensiones, incluidas las que no ves en pantalla. ¿Continuar?`)) return;
    setActionLoading(storeId);
    try {
      const res = await reactivateStoreAPI(storeId);
      toast.success(res.data?.message || `Tienda "${label}" reactivada exitosamente`);
      refreshAll();
    } catch (err) {
      toast.error("Error al reactivar: " + (err.response?.data?.error || err.message));
    } finally {
      setActionLoading(null);
    }
  };

  const clearFilters = () => {
    setFilters(EMPTY_FILTERS);
    setSearchInput("");
    setOffset(0);
  };

  const hasActiveFilters =
    filters.type || filters.status || filters.storeId || filters.search || filters.appeals;

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

  const formatDate = (d) => {
    if (!d) return { day: "—", time: "" };
    const date = new Date(d);
    return {
      day: date.toLocaleDateString("es-VE", { day: "numeric", month: "short", year: "numeric" }),
      time: date.toLocaleTimeString("es-VE", { hour: "2-digit", minute: "2-digit" }),
    };
  };

  const pageStart = total === 0 ? 0 : offset + 1;
  const pageEnd = offset + penalties.length;
  const hasNextPage = pageEnd < total;

  const toggleKpiFilter = (card) => {
    const active = filters.type === card.filter.type && filters.status === card.filter.status;
    updateFilters(active ? { type: "", status: "" } : card.filter);
  };

  return (
    <div className="pb-10 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-7">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#6b1e96]/70 mb-1.5">Sanciones</p>
          <h1 className="text-[32px] leading-tight font-extrabold font-['Manrope'] tracking-tight text-slate-900">
            Gestión de Sanciones
          </h1>
          <p className="text-sm text-slate-500 mt-2 max-w-2xl leading-relaxed">
            Revisa, aplica o descarta las sanciones generadas automáticamente por el sistema de SLA.
            Las multas que apliques se descuentan al instante del wallet de la tienda.
          </p>
        </div>
        <button
          onClick={refreshAll}
          className="flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-600 px-4 py-2.5 rounded-xl text-xs font-bold hover:border-[#6b1e96]/30 hover:text-[#6b1e96] active:scale-[0.97] transition-all shadow-sm self-start md:self-auto"
        >
          <span className="material-symbols-outlined text-[16px]">refresh</span>
          Refrescar
        </button>
      </div>

      <>
        {/* KPI Cards — cada uno filtra la tabla */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {KPI_CARDS.map((card) => {
            const active = filters.type === card.filter.type && filters.status === card.filter.status;
            return (
              <button
                key={card.key}
                onClick={() => toggleKpiFilter(card)}
                aria-pressed={active}
                title={active ? "Quitar este filtro" : `Filtrar la tabla por ${card.label.toLowerCase()}`}
                className={`text-left bg-white rounded-2xl border p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                  active
                    ? "border-[#6b1e96] ring-2 ring-[#6b1e96]/15 shadow-md"
                    : "border-slate-200 shadow-sm hover:border-slate-300"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 truncate">{card.label}</p>
                    <p className="text-[28px] leading-none font-extrabold font-['Manrope'] tracking-tight text-slate-900 mt-2 tabular-nums">
                      {card.format(kpis[card.key])}
                    </p>
                  </div>
                  <div className={`w-9 h-9 shrink-0 rounded-xl flex items-center justify-center border ${card.iconClass}`}>
                    <span className="material-symbols-outlined text-[18px]">{card.icon}</span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 mt-2.5 truncate">
                  {active ? "Filtro activo · pulsa para quitarlo" : card.context}
                </p>
              </button>
            );
          })}
        </div>

        {/* Tabla, con su barra de filtros integrada en la misma tarjeta */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="flex flex-wrap items-center gap-2.5 p-4 border-b border-gray-200/80">
            <div className="relative flex-1 min-w-[220px]">
              <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="#9ca3af" strokeWidth={2.5} style={{ position: "absolute", left: "13px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
              <input
                type="text"
                placeholder="Buscar en el motivo, la apelación o la resolución..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm bg-gray-50/60 hover:bg-white focus:bg-white focus:ring-2 focus:ring-[#6b1e96]/10 focus:border-[#6b1e96] outline-none transition-all"
              />
            </div>

            <div className="w-[190px]">
              <SearchableSelect
                options={storeOptions}
                value={filters.storeId}
                onChange={(val) => updateFilters({ storeId: val })}
                placeholder="Tienda: Todas"
                searchPlaceholder="Buscar tienda..."
                icon={<StorefrontIcon className="h-4 w-4" />}
              />
            </div>

            <div className="w-[170px]">
              <SearchableSelect
                options={TYPE_OPTIONS}
                value={filters.type}
                onChange={(val) => updateFilters({ type: val })}
                placeholder="Tipo: Todos"
                searchPlaceholder="Buscar tipo..."
                icon={<GavelIcon className="h-4 w-4" />}
              />
            </div>

            <div className="w-[170px]">
              <SearchableSelect
                options={STATUS_OPTIONS}
                value={filters.status}
                onChange={(val) => updateFilters({ status: val })}
                placeholder="Estado: Todos"
                searchPlaceholder="Buscar estado..."
                icon={<ShieldAlertIcon className="h-4 w-4" />}
              />
            </div>

            <button
              onClick={() => updateFilters({ appeals: !filters.appeals })}
              title="Muestra solo las sanciones que la tienda ha apelado"
              className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all border ${
                filters.appeals
                  ? "bg-blue-50 border-blue-200 text-blue-700"
                  : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300"
              }`}
            >
              <span>📝</span>
              Apeladas
            </button>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-[#6b1e96] hover:bg-purple-50 transition-all"
              >
                <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
                Limpiar
              </button>
            )}
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-10 h-10 border-4 border-[#c3ff00] border-t-[#6b1e96] rounded-full animate-spin" />
              <p className="text-gray-400 text-xs mt-3.5 font-bold">Cargando sanciones registradas...</p>
            </div>
          ) : penalties.length === 0 ? (
            <div className="py-16 px-6 text-center">
              <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-[28px]">check_circle</span>
              </div>
              <h3 className="text-base font-bold text-gray-900 font-['Manrope'] mb-1.5">
                {hasActiveFilters ? "Sin resultados" : "Sin sanciones"}
              </h3>
              <p className="text-sm text-gray-500 max-w-sm mx-auto">
                {hasActiveFilters
                  ? "Ninguna sanción coincide con los filtros aplicados."
                  : "El sistema de SLA no ha generado ninguna sanción todavía."}
              </p>
              {hasActiveFilters && (
                <button onClick={clearFilters} className="mt-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-4 py-2.5 rounded-xl transition-all">
                  Limpiar filtros
                </button>
              )}
            </div>
          ) : (
            <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200/80">
                    <th className="w-9" />
                    <th className="text-left px-4 py-2.5 font-bold text-gray-400 text-[11px] uppercase tracking-wider">Tienda / Orden</th>
                    <th className="text-left px-4 py-2.5 font-bold text-gray-400 text-[11px] uppercase tracking-wider">Sanción</th>
                    <th className="text-left px-4 py-2.5 font-bold text-gray-400 text-[11px] uppercase tracking-wider">Estado</th>
                    <th className="text-left px-4 py-2.5 font-bold text-gray-400 text-[11px] uppercase tracking-wider">Fecha</th>
                    <th className="sticky right-0 z-10 bg-gray-50 border-l border-gray-200/80 text-right px-4 py-2.5 font-bold text-gray-400 text-[11px] uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {penalties.map((p) => {
                    const typeConf = TYPE_CONFIG[p.type] || TYPE_CONFIG.warning;
                    const statusConf = STATUS_CONFIG[p.status] || STATUS_CONFIG.pending_review;
                    const reason = parseReason(p.reason);
                    const date = formatDate(p.created_at);
                    const isExpanded = expandedId === p.id;
                    const isPending = p.status === "pending_review";
                    const isActiveSuspension = p.status === "applied" && p.type === "suspension";
                    const busy = actionLoading === p.id || actionLoading === p.store_id;
                    const storeName = p.store_profiles?.business_name || p.store_id?.substring(0, 8);

                    return (
                      <Fragment key={p.id}>
                        <tr className="group border-l-2 border-l-transparent hover:bg-purple-50/20 hover:border-l-[#6b1e96] transition-colors">
                          <td className="pl-2.5 pr-0 py-2.5 align-middle">
                            <button
                              onClick={() => setExpandedId(isExpanded ? null : p.id)}
                              aria-label={isExpanded ? "Ocultar detalle" : "Ver detalle"}
                              className={`w-6 h-6 rounded-md flex items-center justify-center text-gray-300 hover:bg-gray-100 hover:text-[#6b1e96] transition-all ${isExpanded ? "bg-purple-50 text-[#6b1e96]" : ""}`}
                            >
                              <span className={`material-symbols-outlined text-[17px] transition-transform ${isExpanded ? "rotate-90" : ""}`}>chevron_right</span>
                            </button>
                          </td>
                          <td className="px-4 py-2.5 align-middle">
                            <p className="font-semibold text-gray-900 leading-tight">{storeName}</p>
                            <p className="text-gray-400 font-mono text-[11px]" title={p.order_id}>
                              #{p.order_id?.substring(0, 8)}
                            </p>
                          </td>
                          <td className="px-4 py-2.5 align-middle whitespace-nowrap">
                            <span className={`inline-flex items-center gap-2 text-[13px] font-semibold ${typeConf.text}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${typeConf.dot}`} />
                              {typeConf.label}
                            </span>
                            {Number(p.amount) > 0 && (
                              <span className="ml-2 text-[13px] font-bold text-gray-900 tabular-nums">${Number(p.amount).toFixed(2)}</span>
                            )}
                          </td>
                          <td className="px-4 py-2.5 align-middle whitespace-nowrap">
                            <span title={statusConf.hint} className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold cursor-help ${statusConf.bg}`}>
                              {statusConf.label}
                            </span>
                            {reason.appeal && (
                              <span className="ml-1.5 inline-flex items-center px-2 py-1 rounded-md text-[11px] font-bold bg-blue-100/70 text-blue-800">
                                Apelada
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-2.5 align-middle text-gray-500 text-xs whitespace-nowrap">
                            {date.day} <span className="text-gray-300">·</span> {date.time}
                          </td>
                          <td className="sticky right-0 z-10 bg-white group-hover:bg-[#faf7fd] border-l border-gray-100 px-4 py-2.5 align-middle text-right whitespace-nowrap transition-colors">
                            {isPending ? (
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleApply(p)}
                                  disabled={busy}
                                  title={applyAction(p).hint}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3 py-1.5 rounded-lg font-bold transition-all active:scale-95 flex items-center gap-1 disabled:opacity-50"
                                >
                                  {busy ? "..." : (
                                    <>
                                      <span className="material-symbols-outlined text-[14px]">done</span>
                                      {applyAction(p).label}
                                    </>
                                  )}
                                </button>
                                <button
                                  onClick={() => handleDismissOpen(p.id)}
                                  disabled={busy}
                                  title="Anula la sanción: la tienda no sufre ninguna consecuencia"
                                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs px-3 py-1.5 rounded-lg font-bold transition-all active:scale-95 flex items-center gap-1 disabled:opacity-50"
                                >
                                  <span className="material-symbols-outlined text-[14px]">close</span>
                                  Descartar
                                </button>
                              </div>
                            ) : isActiveSuspension ? (
                              <button
                                onClick={() => handleLiftSuspension(p.id)}
                                disabled={busy}
                                title="Descarta esta suspensión. La tienda vuelve a operar si no le queda ninguna otra activa."
                                className="bg-[#6b1e96] hover:bg-[#5a1a7e] text-white text-xs px-3 py-1.5 rounded-lg font-bold transition-all active:scale-95 inline-flex items-center gap-1 disabled:opacity-50"
                              >
                                {busy ? "..." : (
                                  <>
                                    <span className="material-symbols-outlined text-[14px]">lock_open</span>
                                    Levantar suspensión
                                  </>
                                )}
                              </button>
                            ) : (
                              <span className="text-gray-300 select-none" aria-label="Sin acciones disponibles">—</span>
                            )}
                          </td>
                        </tr>

                        {isExpanded && (
                          <tr className="bg-gray-50/70">
                            <td colSpan={6} className="px-6 py-5">
                              <div className="grid gap-4 md:grid-cols-3">
                                <div>
                                  <p className="text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1">Motivo del sistema</p>
                                  <p className="text-xs text-gray-700 leading-relaxed">{reason.system || "—"}</p>
                                </div>
                                <div>
                                  <p className="text-[10px] font-black uppercase tracking-wider text-blue-500 mb-1">Apelación de la tienda</p>
                                  <p className="text-xs text-gray-700 leading-relaxed">{reason.appeal || <span className="text-gray-400 italic">Sin apelación</span>}</p>
                                </div>
                                <div>
                                  <p className="text-[10px] font-black uppercase tracking-wider text-[#6b1e96] mb-1">Resolución del administrador</p>
                                  <p className="text-xs text-gray-700 leading-relaxed">{reason.resolution || <span className="text-gray-400 italic">Sin resolver</span>}</p>
                                </div>
                              </div>

                              <div className="mt-4 pt-4 border-t border-gray-200/70 flex flex-wrap items-center justify-between gap-3">
                                <p className="text-[11px] text-gray-400 font-mono">Orden {p.order_id} · Sanción {p.id}</p>
                                {isActiveSuspension && (
                                  <button
                                    onClick={() => handleReactivateStore(p.store_id, p.store_profiles?.business_name)}
                                    disabled={busy}
                                    className="text-xs px-3.5 py-2 rounded-xl font-bold border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 transition-all inline-flex items-center gap-1.5 disabled:opacity-50"
                                  >
                                    <span className="material-symbols-outlined text-[14px]">restart_alt</span>
                                    Reactivar tienda y descartar todas sus suspensiones
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination / Count summary */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t border-gray-200/80 bg-gray-50/50">
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 text-xs text-gray-500">
                  Mostrar
                  <select
                    value={limit}
                    onChange={(e) => { setLimit(Number(e.target.value)); setOffset(0); }}
                    className="border border-gray-200 bg-white rounded-lg px-2 py-1 text-xs font-bold text-gray-700 focus:ring-2 focus:ring-[#6b1e96]/10 focus:border-[#6b1e96] outline-none cursor-pointer"
                  >
                    {PAGE_SIZES.map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                </label>
                <p className="text-xs text-gray-500">
                  <span className="font-bold text-gray-800">{pageStart}–{pageEnd}</span> de{" "}
                  <span className="font-bold text-gray-800">{total}</span> sanción{total !== 1 ? "es" : ""}
                  {hasActiveFilters && " con los filtros aplicados"}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setOffset(Math.max(0, offset - limit))}
                  disabled={offset === 0}
                  className="px-3 py-1.5 text-xs font-bold border border-gray-200 bg-white rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-white disabled:cursor-not-allowed transition-all"
                >
                  ← Anterior
                </button>
                <button
                  onClick={() => setOffset(offset + limit)}
                  disabled={!hasNextPage}
                  className="px-3 py-1.5 text-xs font-bold border border-gray-200 bg-white rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-white disabled:cursor-not-allowed transition-all"
                >
                  Siguiente →
                </button>
              </div>
            </div>
            </>
          )}
        </div>
      </>

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
              La sanción quedará anulada y la tienda no sufrirá ninguna consecuencia. Indica el motivo:
              se guardará en el historial de la sanción y lo verá la tienda.
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
                disabled={!!actionLoading}
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
