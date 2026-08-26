import { useState, useEffect, useMemo, useCallback } from "react";
import PropTypes from "prop-types";
import { getAdminCatalogAPI } from "../../services/api";
import SearchableSelect from "../ui/SearchableSelect";
import "../ui/SearchableSelect.css";
import {
  TagIcon, FolderIcon, StorefrontIcon, BookmarkIcon, CurrencyDollarIcon,
  CubeIcon, ShoppingCartIcon, EyeIcon, PhotoIcon, NoSymbolIcon,
} from "../ui/FilterIcons";
import {
  VIEWS, viewByKey, FILTERS, BAR_FILTERS, NEUTRAL_FILTERS, buildFilterOptions,
  filterProducts, sortProducts, nextSort, computeTotals, paginate, buildChips,
  buildCsv, csvFilename, COLUMNS, COLUMN_GROUPS, ISSUES, issueLabel, rejectionLabel,
  PAGE_SIZES, DEFAULT_PAGE_SIZE, money, int, fmtDate, fmtDateTime, countSevere,
} from "../../utils/catalogStats";

/**
 * Centro de Catálogo: las cuatro vistas sobre la matriz de productos.
 *
 * Mismo criterio que `StoreStatsTab`: no reusa los componentes de
 * `components/admin/analytics/` porque son de tema oscuro y esta página es clara.
 * Toda la lógica (vistas, filtros, orden, totales, export) vive en
 * `utils/catalogStats.js` para poder comprobarla sin montar React.
 */

const PERIODS = [
  { key: "7d", label: "7D" },
  { key: "30d", label: "30D" },
  { key: "90d", label: "90D" },
  { key: "365d", label: "1 Año" },
  { key: "all", label: "Todo" },
];

// "Todo" por defecto: el catálogo es pequeño y la pregunta habitual aquí es
// "¿qué se ha vendido alguna vez?", no "¿qué se vendió esta semana?".
const DEFAULT_PERIOD = "all";

/**
 * El botón del filtro lleva SVG, igual que el resto del panel (`FilterIcons`); los
 * emoji se quedan dentro del desplegable, donde el color sí distingue una opción de
 * otra (🔻 negativo, ✅ sano). El mapa vive aquí y no en `catalogStats.js` para que
 * ese módulo siga siendo JS puro y se pueda ejecutar sin JSX.
 */
const FILTER_ICONS = {
  tag: TagIcon,
  folder: FolderIcon,
  storefront: StorefrontIcon,
  bookmark: BookmarkIcon,
  money: CurrencyDollarIcon,
  cube: CubeIcon,
  cart: ShoppingCartIcon,
  eye: EyeIcon,
  photo: PhotoIcon,
  ban: NoSymbolIcon,
};

const filterIcon = (f) => {
  const Icono = FILTER_ICONS[f.iconKey];
  return Icono ? <Icono className="w-4 h-4" /> : null;
};

const ISSUE_TONES = {
  bad: "bg-red-50 text-red-700",
  warn: "bg-amber-50 text-amber-700",
  soft: "bg-slate-100 text-slate-500",
};

/**
 * Miniatura del producto. Tres estados, no dos: sin foto cargada, foto que existe, y
 * foto cuya URL ya no responde — este último se marca aparte porque no es lo mismo
 * que la tienda no haya subido nada.
 */
const Thumb = ({ src, empty }) => {
  const [roto, setRoto] = useState(false);

  if (empty || !src || roto) {
    return (
      <span
        title={empty || !src ? "El producto no tiene ninguna imagen" : "La imagen no se pudo cargar"}
        className="w-8 h-8 shrink-0 rounded-md bg-red-50 text-red-500 grid place-items-center text-[8px] font-bold leading-tight text-center"
      >
        {empty || !src ? <>SIN<br />FOTO</> : "ROTA"}
      </span>
    );
  }
  return (
    <img
      src={src}
      alt=""
      loading="lazy"
      onError={() => setRoto(true)}
      className="w-8 h-8 shrink-0 rounded-md object-cover bg-slate-100 ring-1 ring-slate-900/5"
    />
  );
};

Thumb.propTypes = { src: PropTypes.string, empty: PropTypes.bool };

const StatusPill = ({ p }) => {
  const [cls, label] =
    p.moderationStatus === "pending" ? ["bg-amber-50 text-amber-700", "Pendiente"]
    : p.moderationStatus === "rejected" ? ["bg-red-50 text-red-700", "Rechazado"]
    : p.stockStatus === "Borrador" ? ["bg-slate-100 text-slate-500", "Borrador"]
    : p.stock === 0 ? ["bg-orange-50 text-orange-700", "Sin stock"]
    : ["bg-emerald-50 text-emerald-700", "Publicado"];
  return <span className={`inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded ${cls}`}>{label}</span>;
};

StatusPill.propTypes = { p: PropTypes.object.isRequired };

const Kpi = ({ label, value, detail, tone = "" }) => (
  <div className="px-4 py-3 border-r border-slate-100 last:border-r-0">
    <p className="text-[10.5px] font-semibold uppercase tracking-wider text-slate-400 whitespace-nowrap">{label}</p>
    <p className={`text-xl font-semibold tracking-tight tabular-nums mt-1 ${tone || "text-slate-900"}`}>{value}</p>
    {detail && <p className="text-[11px] text-slate-400 tabular-nums mt-0.5">{detail}</p>}
  </div>
);

Kpi.propTypes = { label: PropTypes.string, value: PropTypes.node, detail: PropTypes.node, tone: PropTypes.string };

export default function CatalogMatrix({ onModerate, onBulk }) {
  const [view, setView] = useState("performance");
  const [period, setPeriod] = useState(DEFAULT_PERIOD);
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [filters, setFilters] = useState(NEUTRAL_FILTERS);
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [panelOpen, setPanelOpen] = useState(false);
  const [sort, setSort] = useState(viewByKey("performance").sort);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PAGE_SIZE);
  const [selected, setSelected] = useState(() => new Set());

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 250);
    return () => clearTimeout(t);
  }, [search]);

  const fetchData = useCallback(
    (refresh = false) => {
      setLoading(true);
      setError(null);
      getAdminCatalogAPI({ period, ...(refresh ? { refresh: "true" } : {}) })
        .then((res) => setData(res.data?.data || null))
        .catch((err) =>
          setError(err.response?.data?.message || err.response?.data?.error || "No se pudo cargar el catálogo")
        )
        .finally(() => setLoading(false));
    },
    [period]
  );

  useEffect(() => { fetchData(); }, [fetchData]);

  // Cambiar de vista trae su propio orden por defecto: en Cola importa la antigüedad,
  // en Rendimiento el dinero, en Problemas la gravedad.
  const changeView = (key) => {
    setView(key);
    setSort(viewByKey(key).sort);
    setPage(1);
  };

  const all = useMemo(() => data?.products || [], [data]);
  const options = useMemo(() => buildFilterOptions(all, data?.catalogs), [all, data]);

  const rows = useMemo(
    () => sortProducts(filterProducts(all, { view, search: debounced, filters, priceMin, priceMax }), sort),
    [all, view, debounced, filters, priceMin, priceMax, sort]
  );

  const totals = useMemo(() => computeTotals(rows), [rows]);
  const pageInfo = useMemo(() => paginate(rows, page, perPage), [rows, page, perPage]);

  useEffect(() => { setPage(1); }, [debounced, filters, priceMin, priceMax, period, perPage, view]);

  // La selección no sobrevive a un cambio de vista o de filtro: aprobar en lote lo
  // que ya no está en pantalla es la manera más fácil de moderar algo sin querer.
  useEffect(() => { setSelected(new Set()); }, [view, debounced, filters, priceMin, priceMax, period]);

  const toggleOne = (id) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });

  const pageIds = pageInfo.rows.map((p) => p.id);
  const pageAllSelected = pageIds.length > 0 && pageIds.every((id) => selected.has(id));
  const togglePage = () =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (pageAllSelected) pageIds.forEach((id) => next.delete(id));
      else pageIds.forEach((id) => next.add(id));
      return next;
    });

  const chips = useMemo(
    () => buildChips({ filters, priceMin, priceMax }, { setFilters, setPriceMin, setPriceMax }, options),
    [filters, priceMin, priceMax, options]
  );

  const clearAll = () => {
    setFilters(NEUTRAL_FILTERS);
    setPriceMin("");
    setPriceMax("");
    setSearch("");
  };

  const downloadCsv = () => {
    const blob = new Blob([buildCsv(rows, { view, period: data.period })], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = csvFilename(view);
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const k = data?.kpis;
  const counts = data?.viewCounts || {};
  const severos = all.length ? countSevere(all) : 0;
  const barFilters = FILTERS.filter((f) => BAR_FILTERS.includes(f.key));
  const panelFilters = FILTERS.filter((f) => !BAR_FILTERS.includes(f.key));
  const esAuditoria = view === "audit";
  const esProblemas = view === "issues";

  return (
    <div className="bg-white rounded-xl ring-1 ring-slate-900/[0.07] shadow-sm shadow-slate-900/[0.03] overflow-hidden">

      {/* ── Vistas ── */}
      <div className="flex flex-wrap items-center gap-2 px-4 pt-3">
        <div className="inline-flex items-center gap-0.5 p-0.5 rounded-lg bg-slate-100">
          {VIEWS.map((v) => (
            <button
              key={v.key}
              onClick={() => changeView(v.key)}
              className={`px-3 py-1.5 rounded-[7px] text-[13px] font-medium transition-all ${
                view === v.key ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {v.label}
              {counts[v.key] !== undefined && (
                <span className={`ml-1.5 tabular-nums text-xs ${
                  v.key === "issues" && counts.issues > 0 ? "text-red-500 font-bold"
                  : view === v.key ? "text-[#6b1e96]" : "text-slate-400"
                }`}>
                  {counts[v.key]}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Filtros de barra ── */}
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

        <div className="relative flex-1 min-w-[190px]">
          <svg className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input
            type="text"
            placeholder="Buscar por producto, tienda, marca o categoría…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 ring-1 ring-transparent focus:outline-none focus:bg-white focus:ring-slate-900/10 transition-colors"
          />
        </div>

        {barFilters.map((f) => (
          <SearchableSelect
            key={f.key}
            options={options[f.key] || []}
            value={filters[f.key]}
            onChange={(v) => setFilters((prev) => ({ ...prev, [f.key]: v }))}
            placeholder={f.label}
            searchPlaceholder={`Buscar ${f.label.toLowerCase()}…`}
            icon={filterIcon(f)}
            maxVisible={6}
            className={`ss-inline ${filters[f.key] !== "todas" ? "ss-active" : ""}`}
          />
        ))}

        <button
          onClick={() => setPanelOpen((o) => !o)}
          aria-expanded={panelOpen}
          className={`px-2.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            chips.length ? "bg-[#6b1e96]/10 text-[#6b1e96]" : "bg-slate-50 text-slate-600 hover:bg-slate-100"
          }`}
        >
          Más filtros
          <span className="ml-1.5 text-xs tabular-nums opacity-70">
            {chips.length || ""} {panelOpen ? "▴" : "▾"}
          </span>
        </button>

        <button
          onClick={downloadCsv}
          disabled={loading || !rows.length}
          title="Descarga las filas que estás viendo, con la vista, los filtros y el orden aplicados"
          className="px-2.5 py-1.5 rounded-lg text-sm font-medium bg-slate-50 text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-40"
        >
          Exportar CSV
        </button>

        <button
          onClick={() => fetchData(true)}
          disabled={loading}
          title="Recalcula sin usar la caché de 2 minutos"
          className="px-2.5 py-1.5 rounded-lg text-sm font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors disabled:opacity-40"
        >
          {loading ? "Cargando…" : "Actualizar"}
        </button>
      </div>

      {/* ── Panel de filtros finos ── */}
      {panelOpen && (
        <div className="px-4 py-3 bg-slate-50/70 border-b border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {panelFilters.map((f) => (
            <div key={f.key} className="flex flex-col gap-1">
              <span className="text-[10.5px] font-semibold uppercase tracking-wider text-slate-400">{f.label}</span>
              <SearchableSelect
                options={options[f.key] || []}
                value={filters[f.key]}
                onChange={(v) => setFilters((prev) => ({ ...prev, [f.key]: v }))}
                placeholder={f.label}
                searchPlaceholder={`Buscar ${f.label.toLowerCase()}…`}
                icon={filterIcon(f)}
                maxVisible={6}
                className={filters[f.key] !== "todas" ? "ss-active" : ""}
              />
            </div>
          ))}
          <div className="flex flex-col gap-1">
            <span className="text-[10.5px] font-semibold uppercase tracking-wider text-slate-400">Rango de precio</span>
            <div className="flex items-center gap-1.5">
              {[
                [priceMin, setPriceMin, "Mín"],
                [priceMax, setPriceMax, "Máx"],
              ].map(([value, setter, ph]) => (
                <input
                  key={ph}
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder={ph}
                  aria-label={`Precio ${ph}`}
                  value={value}
                  onChange={(e) => setter(e.target.value)}
                  className="w-full min-w-0 bg-white rounded-lg px-2 py-1.5 text-sm text-slate-700 tabular-nums ring-1 ring-slate-900/10 focus:outline-none focus:ring-[#6b1e96]/40"
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Chips ── */}
      {chips.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 px-4 py-2.5 border-b border-slate-100">
          {chips.map((c) => (
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
          <button onClick={clearAll} className="px-2 py-1 text-xs font-medium text-slate-400 hover:text-slate-800 transition-colors">
            Limpiar todo
          </button>
        </div>
      )}

      {error ? (
        <div className="px-4 py-14 text-center">
          <p className="text-sm text-slate-700 font-medium">{error}</p>
          <button onClick={() => fetchData(true)} className="mt-3 px-3 py-1.5 rounded-lg bg-[#6b1e96] text-white text-xs font-medium">
            Reintentar
          </button>
        </div>
      ) : loading && !data ? (
        <div className="px-4 py-20 flex justify-center">
          <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-[#6b1e96]" />
        </div>
      ) : (
        <>
          {/* ── KPIs ── */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 border-b border-slate-100">
            <Kpi label="Publicados" value={`${int(k.published)} / ${int(k.total)}`} detail={`${int(k.drafts)} borrador · ${int(k.rejected)} rechazado`} />
            <Kpi label="Ingresos" value={money(k.revenue)} detail={`${int(k.units)} unidades`} />
            <Kpi
              label="Margen medio"
              value={k.avgMargin === null ? "—" : `${k.avgMargin}%`}
              detail={k.negativeMargin ? `${k.negativeMargin} en negativo` : `${int(k.withoutCost)} sin coste`}
              tone={k.avgMargin === null ? "" : k.avgMargin < 0 ? "text-red-600" : k.avgMargin < 20 ? "text-orange-600" : "text-emerald-600"}
            />
            <Kpi label="Sin vender" value={int(k.neverSold)} detail={`de ${int(k.total)} productos`} tone={k.neverSold > 0 ? "text-orange-600" : ""} />
            <Kpi
              label="Problemas graves"
              value={int(severos)}
              detail={k.withIssues - severos > 0 ? `+${int(k.withIssues - severos)} de calidad de ficha` : "clic en Problemas"}
              tone={severos > 0 ? "text-red-600" : ""}
            />
            <Kpi
              label="Conversión"
              value={k.conversionPct === null ? "—" : `${k.conversionPct}%`}
              detail={`${int(k.views)} vistas · ${int(k.addToCart)} al carrito`}
            />
          </div>

          {k.trackingSince && (
            <p className="px-4 py-1.5 text-[11px] text-slate-400 border-b border-slate-100">
              Las visitas y la conversión se miden desde el {fmtDate(k.trackingSince)}, que es cuando empezó a
              registrarse la navegación. Las ventas anteriores a esa fecha cuentan en ingresos y unidades, pero no
              en la conversión: no tienen visitas con las que compararse.
            </p>
          )}

          {/* ── Tabla ── */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse hidden md:table">
              <thead>
                {!esAuditoria && !esProblemas && (
                  <tr className="border-b border-slate-100">
                    <th className="w-9" />
                    {COLUMN_GROUPS.map(([name, span], i) => (
                      <th
                        key={name || `g${i}`}
                        colSpan={span}
                        className={`px-3 pt-2.5 pb-1 text-[9.5px] font-semibold uppercase tracking-[0.12em] text-slate-300 ${i > 0 ? "border-l border-slate-100 text-right" : ""}`}
                      >
                        {name}
                      </th>
                    ))}
                  </tr>
                )}
                <tr className="border-b border-slate-200">
                  <th className="pl-4 pr-1 pb-2 w-9">
                    <input
                      type="checkbox"
                      checked={pageAllSelected}
                      onChange={togglePage}
                      title="Seleccionar los productos de esta página"
                      aria-label="Seleccionar los productos de esta página"
                      className="w-3.5 h-3.5 rounded border-slate-300 text-[#6b1e96] focus:ring-[#6b1e96]/30 cursor-pointer"
                    />
                  </th>
                  {esAuditoria ? (
                    ["Producto", "Estado", "Decisión", "Motivo", "Quién", "Nota"].map((h) => (
                      <th key={h} className="px-3 py-2 text-[10.5px] font-medium uppercase tracking-wider text-slate-400 whitespace-nowrap">{h}</th>
                    ))
                  ) : esProblemas ? (
                    ["Producto", "Estado", "Problemas detectados", "Qué hacer"].map((h) => (
                      <th key={h} className="px-3 py-2 text-[10.5px] font-medium uppercase tracking-wider text-slate-400 whitespace-nowrap">{h}</th>
                    ))
                  ) : (
                    COLUMNS.map((c, i) => {
                      const startsGroup = i > 0 && COLUMNS[i - 1].group !== c.group;
                      return (
                        <th key={c.key} className={`px-3 pb-2 ${c.align === "right" ? "text-right" : ""} ${startsGroup ? "border-l border-slate-100" : ""}`}>
                          <button
                            onClick={() => setSort((cur) => nextSort(cur, c.key))}
                            className={`text-[10.5px] font-medium uppercase tracking-wider whitespace-nowrap transition-colors ${
                              sort.key === c.key ? "text-[#6b1e96]" : "text-slate-400 hover:text-slate-700"
                            }`}
                          >
                            {c.header}
                            <span className="ml-1 text-[9px]">{sort.key === c.key ? (sort.dir === "asc" ? "▲" : "▼") : ""}</span>
                          </button>
                        </th>
                      );
                    })
                  )}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {pageInfo.rows.map((p) => {
                  const nombre = (
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Thumb src={p.imageUrl} empty={p.images === 0} />
                      <div className="min-w-0">
                        <span className="block text-[13px] font-medium text-slate-900 truncate max-w-[230px]">{(p.name || "").trim()}</span>
                        <span className="block text-[10.5px] text-slate-400 truncate max-w-[230px]">
                          {p.storeName || "—"} · {p.brandName || <span className="text-amber-600">sin marca</span>}
                        </span>
                      </div>
                    </div>
                  );

                  if (esAuditoria) {
                    return (
                      <tr key={p.id} onClick={() => onModerate?.(p)} className="cursor-pointer hover:bg-slate-50/70 transition-colors">
                        <td className="pl-4 pr-1 py-2 w-9" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selected.has(p.id)}
                            onChange={() => toggleOne(p.id)}
                            aria-label={`Seleccionar ${(p.name || "").trim()}`}
                            className="w-3.5 h-3.5 rounded border-slate-300 text-[#6b1e96] focus:ring-[#6b1e96]/30 cursor-pointer"
                          />
                        </td>
                        <td className="px-3 py-2">{nombre}</td>
                        <td className="px-3 py-2"><StatusPill p={p} /></td>
                        <td className="px-3 py-2 text-[12.5px] text-slate-600 whitespace-nowrap" title={fmtDateTime(p.moderation.at)}>
                          {p.moderation.at ? fmtDate(p.moderation.at) : <span className="text-slate-300">Sin registrar</span>}
                          {p.moderation.decisions > 1 && (
                            <span className="ml-1.5 text-[10px] text-slate-400">({p.moderation.decisions} decisiones)</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-[12.5px] text-slate-600">
                          {p.moderation.reason ? rejectionLabel(p.moderation.reason) : <span className="text-slate-300">—</span>}
                        </td>
                        <td className="px-3 py-2 text-[12.5px] text-slate-600 whitespace-nowrap">
                          {p.moderation.byName || <span className="text-slate-300">—</span>}
                        </td>
                        <td className="px-3 py-2 text-[12.5px] text-slate-500 max-w-[240px] truncate" title={p.moderation.note || ""}>
                          {p.moderation.note || <span className="text-slate-300">—</span>}
                        </td>
                      </tr>
                    );
                  }

                  if (esProblemas) {
                    const peor = p.issues[0];
                    return (
                      <tr key={p.id} onClick={() => onModerate?.(p)} className="cursor-pointer hover:bg-slate-50/70 transition-colors">
                        <td className="pl-4 pr-1 py-2 w-9" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selected.has(p.id)}
                            onChange={() => toggleOne(p.id)}
                            aria-label={`Seleccionar ${(p.name || "").trim()}`}
                            className="w-3.5 h-3.5 rounded border-slate-300 text-[#6b1e96] focus:ring-[#6b1e96]/30 cursor-pointer"
                          />
                        </td>
                        <td className="px-3 py-2">{nombre}</td>
                        <td className="px-3 py-2"><StatusPill p={p} /></td>
                        <td className="px-3 py-2">
                          <span className="flex flex-wrap gap-1">
                            {p.issues.map((i) => (
                              <span key={i} className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${ISSUE_TONES[ISSUES[i]?.tone] || ISSUE_TONES.soft}`}>
                                {issueLabel(i)}
                              </span>
                            ))}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-[12.5px] text-slate-500 max-w-[260px]">{ISSUES[peor]?.fix || "—"}</td>
                      </tr>
                    );
                  }

                  return (
                    <tr key={p.id} onClick={() => onModerate?.(p)} className="cursor-pointer hover:bg-slate-50/70 transition-colors">
                      <td className="pl-4 pr-1 py-2 w-9" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selected.has(p.id)}
                          onChange={() => toggleOne(p.id)}
                          aria-label={`Seleccionar ${(p.name || "").trim()}`}
                          className="w-3.5 h-3.5 rounded border-slate-300 text-[#6b1e96] focus:ring-[#6b1e96]/30 cursor-pointer"
                        />
                      </td>
                      <td className="px-3 py-2">{nombre}</td>
                      <td className="px-3 py-2"><StatusPill p={p} /></td>
                      <td className="px-3 py-2 text-[13px] text-right tabular-nums whitespace-nowrap border-l border-slate-100 text-slate-700">{money(p.price)}</td>
                      <td className={`px-3 py-2 text-[13px] text-right tabular-nums whitespace-nowrap ${p.costPrice === null ? "text-slate-300" : "text-slate-600"}`}>
                        {p.costPrice === null ? "—" : money(p.costPrice)}
                      </td>
                      <td className={`px-3 py-2 text-[13px] text-right tabular-nums font-medium ${
                        p.margin === null ? "text-slate-300" : p.margin < 0 ? "text-red-600" : p.margin < 20 ? "text-orange-600" : "text-emerald-600"
                      }`}>
                        {p.margin === null ? "—" : `${p.margin}%`}
                      </td>
                      <td className={`px-3 py-2 text-[13px] text-right tabular-nums border-l border-slate-100 ${p.views ? "text-slate-700" : "text-slate-300"}`}>{int(p.views)}</td>
                      <td className={`px-3 py-2 text-[13px] text-right tabular-nums ${p.addToCart ? "text-slate-700" : "text-slate-300"}`}>{int(p.addToCart)}</td>
                      <td className={`px-3 py-2 text-[13px] text-right tabular-nums ${p.units ? "text-slate-900 font-medium" : "text-slate-300"}`}>{int(p.units)}</td>
                      <td className={`px-3 py-2 text-[13px] text-right tabular-nums whitespace-nowrap ${p.revenue ? "text-slate-900 font-medium" : "text-slate-300"}`}>{money(p.revenue)}</td>
                      <td className={`px-3 py-2 text-[13px] text-right tabular-nums border-l border-slate-100 ${
                        p.stock === 0 ? "text-red-600 font-medium" : p.stock <= 5 ? "text-orange-600" : "text-slate-700"
                      }`}>
                        {int(p.stock)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              {rows.length > 0 && !esAuditoria && !esProblemas && (
                <tfoot>
                  <tr className="bg-slate-50 border-t border-slate-200 text-[13px] font-semibold text-slate-900">
                    <td className="w-9" />
                    <td className="px-3 py-2.5 whitespace-nowrap">Total de {int(totals.count)} producto{totals.count === 1 ? "" : "s"}</td>
                    <td className="px-3 py-2.5" />
                    <td className="px-3 py-2.5 text-right tabular-nums whitespace-nowrap border-l border-slate-100">{money(totals.avgPrice)} medio</td>
                    <td className="px-3 py-2.5" />
                    <td className="px-3 py-2.5 text-right tabular-nums">{totals.avgMargin === null ? "—" : `${totals.avgMargin}%`}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums border-l border-slate-100">{int(totals.views)}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{int(totals.addToCart)}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{int(totals.units)}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums whitespace-nowrap">{money(totals.revenue)}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums border-l border-slate-100">{int(totals.stock)}</td>
                  </tr>
                </tfoot>
              )}
            </table>

            {/* ── Tarjetas en móvil ── */}
            <div className="grid grid-cols-1 gap-3 p-4 md:hidden">
              {pageInfo.rows.map((p) => (
                <button key={p.id} onClick={() => onModerate?.(p)} className="text-left rounded-xl ring-1 ring-slate-900/[0.07] p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Thumb src={p.imageUrl} empty={p.images === 0} />
                      <span className="min-w-0">
                        <span className="block font-medium text-slate-900 truncate">{(p.name || "").trim()}</span>
                        <span className="block text-[11px] text-slate-400 truncate">{p.storeName}</span>
                      </span>
                    </div>
                    <StatusPill p={p} />
                  </div>
                  {p.issues.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {p.issues.map((i) => (
                        <span key={i} className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${ISSUE_TONES[ISSUES[i]?.tone] || ISSUE_TONES.soft}`}>
                          {issueLabel(i)}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="grid grid-cols-3 gap-2 text-center border-t border-slate-100 pt-3">
                    {[
                      ["Precio", money(p.price)],
                      ["Margen", p.margin === null ? "—" : `${p.margin}%`],
                      ["Stock", int(p.stock)],
                      ["Vistas", int(p.views)],
                      ["Vendidas", int(p.units)],
                      ["Ingresos", money(p.revenue)],
                    ].map(([label, val]) => (
                      <div key={label}>
                        <p className="text-[13px] font-medium text-slate-900 tabular-nums">{val}</p>
                        <p className="text-[10px] text-slate-400">{label}</p>
                      </div>
                    ))}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {rows.length === 0 && (
            <div className="px-4 py-14 text-center space-y-2">
              <p className="text-sm text-slate-500">
                {chips.length || debounced ? "Ningún producto coincide con los filtros." : viewByKey(view).empty}
              </p>
              {(chips.length > 0 || search) && (
                <button onClick={clearAll} className="text-xs font-medium text-[#6b1e96] hover:underline">Limpiar filtros</button>
              )}
            </div>
          )}

          {/* ── Paginación ── */}
          {rows.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 border-t border-slate-100">
              <div className="flex items-center gap-2 text-[11.5px] text-slate-400">
                <span className="tabular-nums">
                  {pageInfo.from}–{pageInfo.to} de {pageInfo.total}
                  {rows.length !== all.length ? ` (${all.length} en el catálogo)` : ""}
                </span>
                <label>
                  <span className="sr-only">Productos por página</span>
                  <select
                    value={perPage}
                    onChange={(e) => setPerPage(Number(e.target.value))}
                    className="bg-slate-50 rounded-md px-1.5 py-1 text-[11.5px] text-slate-600 ring-1 ring-transparent hover:ring-slate-900/10 focus:outline-none focus:ring-[#6b1e96]/40"
                  >
                    {PAGE_SIZES.map((n) => <option key={n} value={n}>{n} por página</option>)}
                  </select>
                </label>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[11.5px] text-slate-400 tabular-nums mr-1.5">Página {pageInfo.page} de {pageInfo.pages}</span>
                {[
                  { t: "‹‹", to: () => 1, off: pageInfo.page <= 1, l: "Primera página" },
                  { t: "‹", to: (x) => x - 1, off: pageInfo.page <= 1, l: "Página anterior" },
                  { t: "›", to: (x) => x + 1, off: pageInfo.page >= pageInfo.pages, l: "Página siguiente" },
                  { t: "››", to: () => pageInfo.pages, off: pageInfo.page >= pageInfo.pages, l: "Última página" },
                ].map((b) => (
                  <button
                    key={b.l}
                    onClick={() => setPage(b.to)}
                    disabled={b.off}
                    title={b.l}
                    aria-label={b.l}
                    className="px-2 py-1 rounded-md text-slate-400 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    {b.t}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 border-t border-slate-100 text-[11px] text-slate-400">
            <span>Clic en una fila abre el producto para moderarlo</span>
            <span>Los totales suman todo lo filtrado, no solo esta página</span>
          </div>

          {data.truncated && (
            <p className="px-4 py-2 bg-amber-50 text-amber-800 text-[11.5px] border-t border-amber-100">
              El catálogo supera los {data.cap} productos: la matriz muestra los {data.cap} más recientes.
            </p>
          )}

          {/* Barra de selección. Flota sobre la página para no perderse al hacer
              scroll por una tabla larga. */}
          {selected.size > 0 && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[90] bg-[#1e1e2e] text-white rounded-2xl shadow-2xl px-5 py-3 flex items-center gap-4 border border-white/10">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-full bg-[#6b1e96] flex items-center justify-center text-sm font-bold tabular-nums">
                  {selected.size}
                </span>
                <span className="text-sm text-slate-300">
                  seleccionado{selected.size > 1 ? "s" : ""}
                </span>
              </div>
              <span className="w-px h-6 bg-white/15" />
              <button
                onClick={() => onBulk?.("approve", [...selected], all.filter((p) => selected.has(p.id)))}
                className="px-3 py-1.5 rounded-lg text-sm font-medium bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 transition-colors"
              >
                Aprobar
              </button>
              <button
                onClick={() => onBulk?.("reject", [...selected], all.filter((p) => selected.has(p.id)))}
                className="px-3 py-1.5 rounded-lg text-sm font-medium bg-red-500/15 text-red-300 hover:bg-red-500/25 transition-colors"
              >
                Rechazar
              </button>
              <button
                onClick={() => setSelected(new Set())}
                className="text-sm text-slate-400 hover:text-white transition-colors"
              >
                Cancelar
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

CatalogMatrix.propTypes = { onModerate: PropTypes.func, onBulk: PropTypes.func };
