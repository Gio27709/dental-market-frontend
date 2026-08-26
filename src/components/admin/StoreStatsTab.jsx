import { useState, useEffect, useMemo, useCallback } from "react";
import PropTypes from "prop-types";
import { getAdminStoreStatsAPI } from "../../services/api";
import SearchableSelect from "../ui/SearchableSelect";
import "../ui/SearchableSelect.css";
import { ClockIcon, TagIcon, ShoppingCartIcon, CubeIcon, ShieldCheckIcon } from "../ui/FilterIcons";
import {
  DORMANCY,
  COLUMNS,
  COLUMN_GROUPS,
  DEFAULT_SORT,
  PAGE_SIZES,
  DEFAULT_PAGE_SIZE,
  paginate,
  EXTRA_FILTERS,
  NEUTRAL_FILTERS,
  filterStores,
  sortStores,
  nextSort,
  computeTotals,
  buildChips,
  money,
  pct,
  int,
  mins,
  fmtDateTime,
  deltaPct,
  fmtDelta,
  buildCsv,
  csvFilename,
} from "../../utils/storeStats";

/**
 * Pestaña "Estadísticas" de /admin/store-applications.
 *
 * Deliberadamente NO reusa los componentes de `components/admin/analytics/`
 * (KpiCard, DataTable): esos son de tema oscuro (`fx-card`, `--color-fx-text:
 * #33243d`) y esta página es clara. Montarlos aquí da texto casi blanco sobre
 * fondo blanco. Lo que se comparte con /admin/analytics es la fuente de datos
 * (`rpc_get_store_performance_matrix`), que es donde importa no divergir.
 *
 * El backend devuelve la matriz completa del período; filtrar, ordenar y sumar
 * ocurre aquí en memoria. Sin viajes al servidor por cada clic.
 */

// El período por defecto NO es 30 días: con el volumen actual, en 30 días casi
// ninguna tienda registra ventas y la tabla parece rota. 90 da una foto legible.
const DEFAULT_PERIOD = "90d";

// Mismo criterio que el Catálogo: SVG en el botón —coherente con el resto del
// panel— y emoji dentro del desplegable, donde el color distingue una opción de
// otra. El mapa vive aquí porque `storeStats.js` es JS puro, sin JSX.
const FILTER_ICONS = {
  clock: ClockIcon,
  tag: TagIcon,
  cart: ShoppingCartIcon,
  cube: CubeIcon,
  shield: ShieldCheckIcon,
};

const filterIcon = (f) => {
  const Icono = FILTER_ICONS[f.iconKey];
  return Icono ? <Icono className="w-4 h-4" /> : null;
};

const PERIODS = [
  { key: "7d", label: "7D" },
  { key: "15d", label: "15D" },
  { key: "30d", label: "30D" },
  { key: "90d", label: "90D" },
  { key: "365d", label: "1 Año" },
];

const AVATAR_TINTS = [
  "bg-violet-100 text-violet-700",
  "bg-sky-100 text-sky-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
  "bg-indigo-100 text-indigo-700",
];

/**
 * El anillo lleva el estado operativo: ámbar si está suspendida, neutro si no. Así
 * se ahorra una columna entera que repetiría "Activa" en cada fila.
 */
const Avatar = ({ name, src, suspended = false }) => {
  const tint = AVATAR_TINTS[(name || "").length % AVATAR_TINTS.length];
  const ring = suspended ? "ring-2 ring-fx-warn" : "ring-1 ring-slate-900/5";
  return src ? (
    <img src={src} alt="" className={`w-7 h-7 shrink-0 rounded-full object-cover ${ring}`} />
  ) : (
    <span className={`w-7 h-7 shrink-0 rounded-full flex items-center justify-center text-xs font-semibold ${tint} ${ring}`}>
      {(name || "?").trim().charAt(0).toUpperCase()}
    </span>
  );
};

Avatar.propTypes = { name: PropTypes.string, src: PropTypes.string, suspended: PropTypes.bool };

/**
 * `delta` es la variación contra el período anterior y `higherIsBetter` decide de
 * qué color se pinta: en cancelación, subir es malo.
 */
const Kpi = ({ label, value, detail, tone = "", delta = null, higherIsBetter = true }) => {
  const txt = fmtDelta(delta);
  const good = delta === null ? null : higherIsBetter ? delta >= 0 : delta <= 0;
  return (
    <div className="px-4 py-3 border-r border-slate-100 last:border-r-0">
      <p className="text-[10.5px] font-semibold uppercase tracking-wider text-slate-400 whitespace-nowrap">{label}</p>
      <div className="flex items-baseline gap-1.5 mt-1 flex-wrap">
        <p className={`text-xl font-semibold tracking-tight tabular-nums ${tone || "text-slate-900"}`}>{value}</p>
        {txt && (
          <span
            title="Variación contra el período anterior del mismo largo"
            className={`text-[11px] font-semibold tabular-nums ${good ? "text-fx-pos" : "text-fx-neg"}`}
          >
            {txt}
          </span>
        )}
      </div>
      {detail && <p className="text-[11px] text-slate-400 tabular-nums mt-0.5">{detail}</p>}
    </div>
  );
};

Kpi.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.node.isRequired,
  detail: PropTypes.node,
  tone: PropTypes.string,
  delta: PropTypes.number,
  higherIsBetter: PropTypes.bool,
};

export default function StoreStatsTab({ onOpenStore }) {
  const [period, setPeriod] = useState(DEFAULT_PERIOD);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sort, setSort] = useState(DEFAULT_SORT);

  // Cohorte de alta. Es un filtro distinto del período de medición: aquel dice de
  // qué rango se calcula el GMV, este de qué rango son las tiendas que se miran.
  const [signedFrom, setSignedFrom] = useState("");
  const [signedTo, setSignedTo] = useState("");
  const [extra, setExtra] = useState(NEUTRAL_FILTERS);
  const [panelOpen, setPanelOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PAGE_SIZE);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim().toLowerCase()), 250);
    return () => clearTimeout(t);
  }, [search]);

  const fetchStats = useCallback(
    (refresh = false) => {
      setLoading(true);
      setError(null);
      getAdminStoreStatsAPI({ period, ...(refresh ? { refresh: "true" } : {}) })
        .then((res) => setData(res.data?.data || null))
        .catch((err) =>
          setError(err.response?.data?.message || err.response?.data?.error || "No se pudieron cargar las estadísticas")
        )
        .finally(() => setLoading(false));
    },
    [period]
  );

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const stores = useMemo(
    () =>
      sortStores(
        filterStores(data?.stores || [], { search: debouncedSearch, extra, signedFrom, signedTo }),
        sort
      ),
    [data, debouncedSearch, sort, extra, signedFrom, signedTo]
  );

  /**
   * Totales de lo que estás viendo, no del período completo. Si filtras a tres
   * tiendas, el pie suma esas tres — si no, el pie contradiría a la tabla.
   * Cancelación y SLA se ponderan; un promedio simple daría el mismo peso a una
   * tienda con un pedido que a otra con treinta.
   */
  const totals = useMemo(() => computeTotals(stores), [stores]);

  // `paginate` recorta la página al rango que existe: filtrar hasta dejar dos filas
  // estando en la página 5 devolvería una tabla vacía en vez de la única página.
  const pageInfo = useMemo(() => paginate(stores, page, perPage), [stores, page, perPage]);
  const pageRows = pageInfo.rows;

  // Cualquier cambio en lo que se lista invalida la página en la que estabas.
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, extra, signedFrom, signedTo, period, perPage]);

  // Chips de lo que está filtrando ahora mismo, con cómo deshacerlo.
  const activeChips = useMemo(
    () => buildChips({ extra, signedFrom, signedTo }, { setExtra, setSignedFrom, setSignedTo }),
    [extra, signedFrom, signedTo]
  );

  const clearAll = () => {
    setExtra(NEUTRAL_FILTERS);
    setSignedFrom("");
    setSignedTo("");
    setSearch("");
  };

  const toggleSort = (key) => setSort((cur) => nextSort(cur, key));

  /**
   * La descarga se arma en el navegador desde lo que ya está en memoria: no hay
   * endpoint de exportación que mantener ni segunda consulta que pueda devolver algo
   * distinto de lo que el admin está viendo.
   */
  const downloadCsv = () => {
    const blob = new Blob([buildCsv(stores, { period: data.period })], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = csvFilename(data.period);
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const k = data?.kpis;
  const prevKpis = data?.previous;

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-xl ring-1 ring-slate-900/[0.07] shadow-sm shadow-slate-900/[0.03] overflow-hidden">

        {/* ── Filtros ── */}
        <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b border-slate-100">
          <div className="inline-flex items-center gap-0.5 p-0.5 rounded-lg bg-slate-100">
            {PERIODS.map((p) => (
              <button
                key={p.key}
                onClick={() => setPeriod(p.key)}
                className={`px-2.5 py-1 rounded-[7px] text-xs font-medium tabular-nums transition-all ${
                  period === p.key ? "bg-[#6b1e96] text-white shadow-sm" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="relative flex-1 min-w-[200px]">
            <svg
              className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2"
              fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
            <input
              type="text"
              placeholder="Buscar por nombre, RIF, código o titular…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 ring-1 ring-transparent focus:outline-none focus:bg-white focus:ring-slate-900/10 transition-colors"
            />
          </div>

          <button
            onClick={() => setPanelOpen((o) => !o)}
            aria-expanded={panelOpen}
            className={`px-2.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              activeChips.length
                ? "bg-[#6b1e96]/10 text-[#6b1e96]"
                : "bg-slate-50 text-slate-600 hover:bg-slate-100"
            }`}
          >
            Más filtros
            <span className="ml-1.5 text-xs tabular-nums opacity-70">
              {activeChips.length ? activeChips.length : ""} {panelOpen ? "▴" : "▾"}
            </span>
          </button>

          <button
            onClick={downloadCsv}
            disabled={loading || !stores.length}
            title="Descarga exactamente las filas que estás viendo, con los filtros y el orden aplicados"
            className="px-2.5 py-1.5 rounded-lg text-sm font-medium bg-slate-50 text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-40"
          >
            Exportar CSV
          </button>

          <button
            onClick={() => fetchStats(true)}
            disabled={loading}
            title="Vuelve a calcular sin usar la caché de 2 minutos"
            className="px-2.5 py-1.5 rounded-lg text-sm font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors disabled:opacity-40"
          >
            {loading ? "Cargando…" : "Actualizar"}
          </button>
        </div>

        {/* ── Panel desplegable de filtros ── */}
        {panelOpen && (
          <div className="px-4 py-3 bg-slate-50/70 border-b border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {EXTRA_FILTERS.map((f) => (
              <div key={f.key} className="flex flex-col gap-1">
                <span className="text-[10.5px] font-semibold uppercase tracking-wider text-slate-400">{f.label}</span>
                <SearchableSelect
                  options={f.options}
                  value={extra[f.key]}
                  onChange={(v) => setExtra((prev) => ({ ...prev, [f.key]: v }))}
                  placeholder={f.label}
                  searchPlaceholder={`Buscar ${f.label.toLowerCase()}…`}
                  icon={filterIcon(f)}
                  maxVisible={6}
                  className={extra[f.key] !== "todas" ? "ss-active" : ""}
                />
              </div>
            ))}

            <div className="flex flex-col gap-1">
              <span
                className="text-[10.5px] font-semibold uppercase tracking-wider text-slate-400"
                title="Cohorte de alta de la tienda. No cambia el período del que se calculan las ventas."
              >
                Registradas entre
              </span>
              <div className="flex items-center gap-1.5">
                {[
                  [signedFrom, setSignedFrom, "Desde"],
                  [signedTo, setSignedTo, "Hasta"],
                ].map(([value, setter, ph]) => (
                  <input
                    key={ph}
                    type="date"
                    aria-label={`${ph} (fecha de registro)`}
                    value={value}
                    onChange={(e) => setter(e.target.value)}
                    className="flex-1 min-w-0 bg-white rounded-lg px-2 py-1.5 text-sm text-slate-700 ring-1 ring-slate-900/10 focus:outline-none focus:ring-[#6b1e96]/40"
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Chips de filtro activo ── */}
        {activeChips.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 px-4 py-2.5 border-b border-slate-100">
            {activeChips.map((c) => (
              <button
                key={c.id}
                onClick={c.clear}
                className="inline-flex items-center gap-1.5 bg-[#6b1e96]/10 text-[#6b1e96] rounded-md px-2 py-1 text-xs font-medium hover:bg-[#6b1e96]/15 transition-colors"
              >
                {c.text}
                <span aria-hidden="true" className="opacity-60">×</span>
                <span className="sr-only">Quitar filtro</span>
              </button>
            ))}
            <button
              onClick={clearAll}
              className="px-2 py-1 text-xs font-medium text-slate-400 hover:text-slate-800 transition-colors"
            >
              Limpiar todo
            </button>
          </div>
        )}

        {error ? (
          <div className="px-4 py-14 text-center">
            <p className="text-sm text-slate-700 font-medium">{error}</p>
            <button
              onClick={() => fetchStats(true)}
              className="mt-3 px-3 py-1.5 rounded-lg bg-[#6b1e96] text-white text-xs font-medium"
            >
              Reintentar
            </button>
          </div>
        ) : loading && !data ? (
          <div className="px-4 py-20 flex justify-center">
            <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-[#6b1e96]" />
          </div>
        ) : (
          <>
            {/* ── KPIs del período ── */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 border-b border-slate-100">
              {/* La variación es de las tiendas QUE VENDEN, no del total, que no se
                  mueve de un período a otro. Colgada del "8" se leía como si hubieran
                  desaparecido las ocho tiendas. */}
              <Kpi
                label="Tiendas con ventas"
                value={`${int(k.storesWithSales)} / ${int(k.stores)}`}
                detail={`${k.pctWithSales}% del total`}
                delta={deltaPct(k.storesWithSales, prevKpis?.storesWithSales)}
              />
              <Kpi
                label="GMV"
                value={money(k.gmv)}
                detail={`${int(k.orders)} pedidos`}
                delta={deltaPct(k.gmv, prevKpis?.gmv)}
              />
              <Kpi
                label="Ticket medio"
                value={money(k.avgTicket)}
                detail="por pedido"
                delta={deltaPct(k.avgTicket, prevKpis?.avgTicket)}
              />
              <Kpi
                label="Cancelación"
                value={pct(k.cancelRatePct)}
                detail={k.orders ? `${int(k.cancelledOrders)} de ${int(k.orders)}` : "sin pedidos"}
                tone={k.cancelRatePct >= 20 ? "text-fx-neg" : ""}
                delta={deltaPct(k.cancelRatePct, prevKpis?.cancelRatePct)}
                higherIsBetter={false}
              />
              <Kpi
                label="Dormidas"
                value={int(k.dormantStores)}
                detail={k.noSignalStores ? `+${int(k.noSignalStores)} sin señal` : "≥ 30 días"}
                tone={k.dormantStores > 0 ? "text-fx-warn" : ""}
              />
              <Kpi
                label="SLA despacho"
                value={pct(k.slaPct)}
                detail={k.slaMeasurable ? `solo ${k.slaMeasurable} medibles` : "sin datos medibles"}
              />
            </div>

            {prevKpis && (
              <p className="px-4 py-1.5 text-[11px] text-slate-400 border-b border-slate-100">
                Las variaciones comparan con {prevKpis.from.slice(0, 10)} – {prevKpis.to.slice(0, 10)}, el bloque
                anterior del mismo largo. Sin datos previos no se muestra variación.
              </p>
            )}

            {/* ── Aviso de período sin ventas ── */}
            {k.orders === 0 && (
              <p className="px-4 py-2.5 bg-amber-50/70 text-amber-900 text-xs border-b border-amber-100">
                Ninguna tienda vendió en estos {data.period.days} días, por eso las columnas comerciales están
                vacías. No es un fallo: la actividad de los titulares sí se sigue midiendo. Prueba un período más
                largo para ver ventas.
              </p>
            )}

            {/* ── Matriz ── */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse hidden md:table">
                <thead>
                  {/* Cabecera de grupos: separa quién es la tienda, qué hace y qué vende. */}
                  <tr className="border-b border-slate-100">
                    {COLUMN_GROUPS.map(([name, span], i) => (
                      <th
                        key={name || `g${i}`}
                        colSpan={span}
                        className={`px-3 pt-2.5 pb-1 text-[9.5px] font-semibold uppercase tracking-[0.12em] text-slate-300 ${
                          i > 0 ? "border-l border-slate-100 text-right" : ""
                        }`}
                      >
                        {name}
                      </th>
                    ))}
                  </tr>
                  <tr className="border-b border-slate-200">
                    {COLUMNS.map((c, i) => {
                      const startsGroup = i > 0 && COLUMNS[i - 1].group !== c.group;
                      return (
                        <th
                          key={c.key}
                          className={`px-3 pb-2 ${c.align === "right" ? "text-right" : ""} ${
                            startsGroup ? "border-l border-slate-100" : ""
                          }`}
                        >
                          <button
                            onClick={() => toggleSort(c.key)}
                            className={`text-[10.5px] font-medium uppercase tracking-wider whitespace-nowrap transition-colors ${
                              sort.key === c.key ? "text-[#6b1e96]" : "text-slate-400 hover:text-slate-700"
                            }`}
                          >
                            {c.header}
                            <span className="ml-1 text-[9px]">
                              {sort.key === c.key ? (sort.dir === "asc" ? "▲" : "▼") : ""}
                            </span>
                          </button>
                        </th>
                      );
                    })}
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {pageRows.map((s) => {
                    const d = DORMANCY[s.activity.level] || DORMANCY.unknown;
                    return (
                      <tr
                        key={s.storeId}
                        onClick={() => onOpenStore?.(s)}
                        className="cursor-pointer hover:bg-slate-50/70 transition-colors"
                      >
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Avatar name={s.businessName} src={s.logoUrl} suspended={s.isSuspended} />
                            <div className="min-w-0">
                              <span className="flex items-center gap-1.5 min-w-0">
                                <span className="text-[13px] font-medium text-slate-900 truncate max-w-[200px]">
                                  {s.businessName}
                                </span>
                                {/* Solo se rotula la excepción: repetir "Activa" en cada fila es ruido. */}
                                {s.isSuspended && (
                                  <span className="shrink-0 text-[9.5px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-amber-50 text-amber-700">
                                    Suspendida
                                  </span>
                                )}
                              </span>
                              {s.storeCode && (
                                <span className="block text-[10.5px] text-[#6b1e96]/70 font-medium tabular-nums">
                                  #{s.storeCode}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        <td
                          className={`px-3 py-2 text-[13px] font-medium tabular-nums text-right whitespace-nowrap border-l border-slate-100 ${d.tone}`}
                          title={`${d.label} · Última señal: ${fmtDateTime(s.activity.lastAt)}`}
                        >
                          {s.activity.days === null ? "Sin señal" : s.activity.days === 0 ? "Hoy" : `${s.activity.days} d`}
                        </td>
                        <td
                          className="px-3 py-2 text-[13px] text-right text-slate-600 tabular-nums whitespace-nowrap"
                          title={
                            s.activeDaysInPeriod
                              ? `${mins(s.totalMinutes)} en ${s.activeDaysInPeriod} día(s) con actividad · ${mins(s.avgMinutesPerDay)}/día sobre el período completo`
                              : "Sin actividad medida en el período"
                          }
                        >
                          {s.avgMinutesPerActiveDay > 0 ? mins(s.avgMinutesPerActiveDay) : <span className="text-slate-300">—</span>}
                        </td>

                        <td className={`px-3 py-2 text-[13px] text-right tabular-nums whitespace-nowrap border-l border-slate-100 ${s.gmv > 0 ? "text-slate-900 font-medium" : "text-slate-300"}`}>
                          {money(s.gmv)}
                        </td>
                        <td className={`px-3 py-2 text-[13px] text-right tabular-nums ${s.orders ? "text-slate-700" : "text-slate-300"}`}>
                          {int(s.orders)}
                        </td>
                        <td className="px-3 py-2 text-[13px] text-right tabular-nums whitespace-nowrap text-slate-700">
                          {s.avgTicket === null ? <span className="text-slate-300">—</span> : money(s.avgTicket)}
                        </td>
                        <td className={`px-3 py-2 text-[13px] text-right tabular-nums ${
                          s.cancelRatePct === null ? "text-slate-300" : s.cancelRatePct >= 20 ? "text-fx-neg font-medium" : "text-slate-700"
                        }`}>
                          {pct(s.cancelRatePct)}
                        </td>
                        <td className={`px-3 py-2 text-[13px] text-right tabular-nums ${s.slaPct === null ? "text-slate-300" : "text-slate-700"}`}>
                          {pct(s.slaPct)}
                        </td>
                        <td className={`px-3 py-2 text-[13px] text-right tabular-nums ${s.ratingAvg === null ? "text-slate-300" : "text-slate-700"}`}>
                          {s.ratingAvg === null ? "—" : s.ratingAvg.toFixed(2)}
                        </td>

                        <td className={`px-3 py-2 text-[13px] text-right tabular-nums whitespace-nowrap border-l border-slate-100 ${s.products ? "text-slate-700" : "text-slate-300"}`}>
                          {s.activeProducts}&thinsp;/&thinsp;{s.products}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>

                {stores.length > 0 && (
                  <tfoot>
                    <tr className="bg-slate-50 border-t border-slate-200 text-[13px] font-semibold text-slate-900">
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        Total de {int(totals.count)} tienda{totals.count === 1 ? "" : "s"}
                      </td>
                      <td
                        className="px-3 py-2.5 text-right tabular-nums whitespace-nowrap border-l border-slate-100"
                        title="Mediana, no promedio: dos tiendas abandonadas arrastrarían la media de todo el grupo."
                      >
                        {totals.medianInactiveDays === null ? "—" : `~${totals.medianInactiveDays} d`}
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums whitespace-nowrap">{mins(totals.avgMinutes)}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums whitespace-nowrap border-l border-slate-100">{money(totals.gmv)}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums">{int(totals.orders)}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums whitespace-nowrap">{money(totals.avgTicket)}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums">{pct(totals.cancelRatePct)}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums">{pct(totals.slaPct)}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums">
                        {totals.ratingAvg === null ? "—" : totals.ratingAvg.toFixed(2)}
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums whitespace-nowrap border-l border-slate-100">
                        {totals.activeProducts}&thinsp;/&thinsp;{totals.products}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>

              {/* ── Tarjetas en móvil ── */}
              <div className="grid grid-cols-1 gap-3 p-4 md:hidden">
                {pageRows.map((s) => {
                  const d = DORMANCY[s.activity.level] || DORMANCY.unknown;
                  return (
                    <button
                      key={s.storeId}
                      onClick={() => onOpenStore?.(s)}
                      className="text-left rounded-xl ring-1 ring-slate-900/[0.07] p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Avatar name={s.businessName} src={s.logoUrl} suspended={s.isSuspended} />
                          <span className="font-medium text-slate-900 truncate">{s.businessName}</span>
                        </div>
                        <span className={`text-xs font-medium whitespace-nowrap ${d.tone}`}>
                          {s.activity.days === null ? "Sin señal" : `${s.activity.days} d`}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center border-t border-slate-100 pt-3">
                        {[
                          ["GMV", money(s.gmv)],
                          ["Pedidos", int(s.orders)],
                          ["Cancel.", pct(s.cancelRatePct)],
                          ["Ticket", s.avgTicket === null ? "—" : money(s.avgTicket)],
                          ["Min/día", s.avgMinutesPerActiveDay > 0 ? mins(s.avgMinutesPerActiveDay) : "—"],
                          ["Vendibles", `${s.activeProducts}/${s.products}`],
                        ].map(([label, val]) => (
                          <div key={label}>
                            <p className="text-[13px] font-medium text-slate-900 tabular-nums">{val}</p>
                            <p className="text-[10px] text-slate-400">{label}</p>
                          </div>
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {stores.length === 0 && (
              <div className="px-4 py-14 text-center space-y-2">
                <p className="text-sm text-slate-500">
                  Ninguna tienda coincide con {activeChips.length ? "los filtros aplicados" : "la búsqueda"}.
                </p>
                {(activeChips.length > 0 || search) && (
                  <button onClick={clearAll} className="text-xs font-medium text-[#6b1e96] hover:underline">
                    Limpiar filtros
                  </button>
                )}
              </div>
            )}

            {/* ── Paginación ── */}
            {stores.length > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 border-t border-slate-100">
                <div className="flex items-center gap-2 text-[11.5px] text-slate-400">
                  <span className="tabular-nums">
                    {pageInfo.from}–{pageInfo.to} de {pageInfo.total}
                    {stores.length !== data.stores.length ? ` (${data.stores.length} sin filtrar)` : ""}
                  </span>
                  <label className="flex items-center gap-1.5">
                    <span className="sr-only">Tiendas por página</span>
                    <select
                      value={perPage}
                      onChange={(e) => setPerPage(Number(e.target.value))}
                      className="bg-slate-50 rounded-md px-1.5 py-1 text-[11.5px] text-slate-600 ring-1 ring-transparent hover:ring-slate-900/10 focus:outline-none focus:ring-[#6b1e96]/40"
                    >
                      {PAGE_SIZES.map((n) => (
                        <option key={n} value={n}>{n} por página</option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="flex items-center gap-1">
                  <span className="text-[11.5px] text-slate-400 tabular-nums mr-1.5">
                    Página {pageInfo.page} de {pageInfo.pages}
                  </span>
                  <button
                    onClick={() => setPage(1)}
                    disabled={pageInfo.page <= 1}
                    title="Primera página"
                    aria-label="Primera página"
                    className="px-2 py-1 rounded-md text-slate-400 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    ‹‹
                  </button>
                  <button
                    onClick={() => setPage((p) => p - 1)}
                    disabled={pageInfo.page <= 1}
                    title="Página anterior"
                    aria-label="Página anterior"
                    className="px-2 py-1 rounded-md text-slate-400 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    ‹
                  </button>
                  <button
                    onClick={() => setPage((p) => p + 1)}
                    disabled={pageInfo.page >= pageInfo.pages}
                    title="Página siguiente"
                    aria-label="Página siguiente"
                    className="px-2 py-1 rounded-md text-slate-400 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    ›
                  </button>
                  <button
                    onClick={() => setPage(pageInfo.pages)}
                    disabled={pageInfo.page >= pageInfo.pages}
                    title="Última página"
                    aria-label="Última página"
                    className="px-2 py-1 rounded-md text-slate-400 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    ››
                  </button>
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 border-t border-slate-100 text-[11px] text-slate-400">
              <span>Clic en una fila abre el detalle con la ficha de actividad</span>
              <span>La fila de totales suma todo lo filtrado, no solo esta página</span>
            </div>

            {data.truncated && (
              <p className="px-4 py-2 bg-amber-50 text-amber-800 text-[11.5px] border-t border-amber-100">
                Hay más de {data.storeCap} tiendas: la matriz muestra las {data.storeCap} más antiguas. Hay que mover el
                filtrado al backend.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

StoreStatsTab.propTypes = {
  onOpenStore: PropTypes.func,
};
