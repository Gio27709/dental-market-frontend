/**
 * Lógica de la pestaña Estadísticas de tiendas: formato, filtros, orden y totales.
 *
 * Vive fuera del componente por dos razones: se puede ejecutar y comprobar sin
 * montar React, y deja `StoreStatsTab.jsx` conteniendo solo la vista.
 *
 * El backend manda la matriz completa del período; todo lo de aquí trabaja en
 * memoria sobre esa respuesta.
 */

export const DORMANCY = {
  active: { tone: "text-emerald-600", label: "Activa" },
  cooling: { tone: "text-amber-600", label: "Enfriándose" },
  dormant: { tone: "text-orange-600", label: "Dormida" },
  abandoned: { tone: "text-red-600", label: "Abandonada" },
  unknown: { tone: "text-slate-300", label: "Sin señal" },
};

// ── Formato ────────────────────────────────────────────────────────────────

export const money = (n) =>
  n === null || n === undefined
    ? "—"
    : `$${Number(n).toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const pct = (n) => (n === null || n === undefined ? "—" : `${Number(n).toFixed(1)}%`);

export const int = (n) => Number(n || 0).toLocaleString("es-VE");

/** 95 → "1 h 35 min". Los minutos sueltos se leen mal por encima de la hora. */
export const mins = (n) => {
  const m = Math.round(Number(n) || 0);
  if (!m) return "—";
  return m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${m % 60} min`;
};

export const fmtDateTime = (iso) =>
  iso
    ? new Date(iso).toLocaleString("es-VE", {
        day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
      })
    : "Sin señal registrada";

// ── Columnas ───────────────────────────────────────────────────────────────

/**
 * `value` alimenta el orden, así que ordenar por una columna ordena exactamente
 * por lo que esa columna muestra.
 *
 * `group` agrupa las columnas bajo una cabecera común. Once columnas seguidas se
 * leen como una lista indiferenciada; separadas en tres bloques (quién es, qué
 * hace, qué vende) el ojo encuentra la que busca sin recorrerlas todas.
 *
 * No hay columna de estado: se pinta dentro de la celda de la tienda. Con todas
 * las tiendas activas, una columna que repite "Activa" ocho veces es ancho
 * gastado en no decir nada; lo que importa es que salte la que está suspendida.
 */
export const COLUMNS = [
  { key: "businessName", group: "", header: "Tienda", align: "left", value: (s) => (s.businessName || "").toLowerCase() },
  { key: "inactive", group: "Actividad del titular", header: "Inactiva", align: "right", value: (s) => s.activity.days },
  { key: "activity", group: "Actividad del titular", header: "Min/día", align: "right", value: (s) => s.avgMinutesPerActiveDay },
  { key: "gmv", group: "Comercial", header: "GMV", align: "right", value: (s) => s.gmv },
  { key: "orders", group: "Comercial", header: "Pedidos", align: "right", value: (s) => s.orders },
  { key: "avgTicket", group: "Comercial", header: "Ticket", align: "right", value: (s) => s.avgTicket },
  { key: "cancelRatePct", group: "Comercial", header: "Cancel.", align: "right", value: (s) => s.cancelRatePct },
  { key: "slaPct", group: "Comercial", header: "SLA", align: "right", value: (s) => s.slaPct },
  { key: "ratingAvg", group: "Comercial", header: "Rating", align: "right", value: (s) => s.ratingAvg },
  { key: "products", group: "Catálogo", header: "Vendibles", align: "right", value: (s) => s.activeProducts },
];

/** Cabecera superior: [nombre del grupo, cuántas columnas ocupa], en orden. */
export const COLUMN_GROUPS = COLUMNS.reduce((acc, c) => {
  const last = acc[acc.length - 1];
  if (last && last[0] === c.group) last[1] += 1;
  else acc.push([c.group, 1]);
  return acc;
}, []);

export const DEFAULT_SORT = { key: "gmv", dir: "desc" };

export const PAGE_SIZES = [10, 25, 50, 100];
export const DEFAULT_PAGE_SIZE = 25;

/** Recorta la página pedida al rango que existe: filtrar puede dejarte fuera. */
export function paginate(rows, page, perPage) {
  const pages = Math.max(1, Math.ceil(rows.length / perPage));
  const safePage = Math.min(Math.max(1, page), pages);
  const start = (safePage - 1) * perPage;
  return {
    rows: rows.slice(start, start + perPage),
    page: safePage,
    pages,
    from: rows.length ? start + 1 : 0,
    to: Math.min(start + perPage, rows.length),
    total: rows.length,
  };
}

// ── Filtros ────────────────────────────────────────────────────────────────

/**
 * Cada filtro declara cómo evalúa una tienda y cómo se rotula su chip, para que
 * añadir uno sea una entrada en esta tabla y no cinco cambios repartidos por el
 * componente. `todas` es siempre el valor neutro: no filtra, no cuenta, no pinta chip.
 */
export const EXTRA_FILTERS = [
  {
    key: "sleep",
    iconKey: "clock",
    label: "Nivel de sueño",
    options: [
      { value: "todas", label: "Cualquier nivel", icon: "⏱️" },
      { value: "active", label: "Activa (< 7 d)", icon: "🟢" },
      { value: "cooling", label: "Enfriándose (7–29 d)", icon: "🟡" },
      { value: "dormant", label: "Dormida (30–89 d)", icon: "🟠" },
      { value: "abandoned", label: "Abandonada (≥ 90 d)", icon: "🔴" },
      { value: "unknown", label: "Sin señal", icon: "⚪" },
    ],
    test: (s, v) => s.activity.level === v,
  },
  {
    key: "status",
    iconKey: "tag",
    label: "Estado operativo",
    options: [
      { value: "todas", label: "Cualquier estado", icon: "🏷️" },
      { value: "active", label: "Activas", icon: "🟢" },
      { value: "suspended", label: "Suspendidas", icon: "⚠️" },
    ],
    test: (s, v) => (v === "suspended" ? s.isSuspended : !s.isSuspended),
  },
  {
    key: "sales",
    iconKey: "cart",
    label: "Ventas en el período",
    options: [
      { value: "todas", label: "Vendan o no", icon: "🛒" },
      { value: "con", label: "Con ventas", icon: "✅" },
      { value: "sin", label: "Sin ventas", icon: "⭕" },
    ],
    test: (s, v) => (v === "con" ? s.orders > 0 : s.orders === 0),
  },
  {
    key: "catalog",
    iconKey: "cube",
    label: "Catálogo",
    options: [
      { value: "todas", label: "Cualquier catálogo", icon: "📦" },
      { value: "vendibles", label: "Con productos vendibles", icon: "✅" },
      { value: "publicados", label: "Publicados pero ninguno vendible", icon: "⚠️" },
      { value: "vacio", label: "Sin productos", icon: "🚫" },
    ],
    test: (s, v) =>
      v === "vendibles"
        ? s.activeProducts > 0
        : v === "publicados"
          ? s.products > 0 && s.activeProducts === 0
          : s.products === 0,
  },
  {
    key: "verified",
    iconKey: "shield",
    label: "Verificación",
    options: [
      { value: "todas", label: "Verificadas o no", icon: "🛡️" },
      { value: "si", label: "Verificadas", icon: "✅" },
      { value: "no", label: "Sin verificar", icon: "❔" },
    ],
    test: (s, v) => (v === "si" ? s.isVerified : !s.isVerified),
  },
];

export const NEUTRAL_FILTERS = Object.fromEntries(EXTRA_FILTERS.map((f) => [f.key, "todas"]));

const SEARCH_FIELDS = ["businessName", "storeCode", "rif", "ownerName", "ownerEmail"];

export function filterStores(stores, { search = "", extra = NEUTRAL_FILTERS, signedFrom = "", signedTo = "" } = {}) {
  const term = search.trim().toLowerCase();
  let out = term
    ? stores.filter((s) => SEARCH_FIELDS.some((f) => (s[f] || "").toLowerCase().includes(term)))
    : stores;

  for (const f of EXTRA_FILTERS) {
    const v = extra[f.key];
    if (v && v !== "todas") out = out.filter((s) => f.test(s, v));
  }

  // La cohorte compara instantes, no cadenas: por HTTP `createdAt` llega como texto
  // ISO, pero desde el driver de Postgres es un Date, y `Date >= "2026-01-01"` es
  // siempre false. Normalizar a milisegundos funciona con las dos formas.
  // `signedTo` incluye el día entero, que es lo que espera quien escribe "hasta el 24".
  const at = (v) => new Date(v).getTime();
  if (signedFrom) {
    const min = at(`${signedFrom}T00:00:00`);
    out = out.filter((s) => s.createdAt && at(s.createdAt) >= min);
  }
  if (signedTo) {
    const max = at(`${signedTo}T23:59:59.999`);
    out = out.filter((s) => s.createdAt && at(s.createdAt) <= max);
  }

  return out;
}

export function sortStores(stores, sort = DEFAULT_SORT) {
  const col = COLUMNS.find((c) => c.key === sort.key) || COLUMNS.find((c) => c.key === "gmv");
  const factor = sort.dir === "asc" ? 1 : -1;
  return [...stores].sort((a, b) => {
    const va = col.value(a);
    const vb = col.value(b);
    // Los nulos van siempre al final, se ordene ascendente o descendente: son "no
    // hay dato", no "el valor más bajo".
    const na = va === null || va === undefined;
    const nb = vb === null || vb === undefined;
    if (na && nb) return 0;
    if (na) return 1;
    if (nb) return -1;
    if (typeof va === "string") return va.localeCompare(vb) * factor;
    return (va - vb) * factor;
  });
}

export const nextSort = (current, key) =>
  current.key === key
    ? { key, dir: current.dir === "asc" ? "desc" : "asc" }
    // Al estrenar una columna, el orden útil es de mayor a menor salvo en el nombre.
    : { key, dir: key === "businessName" ? "asc" : "desc" };

// ── Totales ────────────────────────────────────────────────────────────────

const median = (nums) => {
  if (!nums.length) return null;
  const s = [...nums].sort((a, b) => a - b);
  const mid = s.length / 2;
  return s.length % 2 ? s[(s.length - 1) / 2] : Math.round((s[mid - 1] + s[mid]) / 2);
};

/**
 * Totales de lo que estás viendo, no del período completo: si filtras a tres
 * tiendas, el pie suma esas tres, o contradiría a la tabla que tiene encima.
 *
 * Cancelación se pondera por pedidos; un promedio simple de porcentajes daría el
 * mismo peso a una tienda con un pedido que a otra con treinta. La inactividad usa
 * mediana porque dos tiendas abandonadas arrastran la media de todo el grupo.
 */
export function computeTotals(stores) {
  const gmv = stores.reduce((a, s) => a + s.gmv, 0);
  const orders = stores.reduce((a, s) => a + s.orders, 0);
  const cancelled = stores.reduce((a, s) => a + s.cancelledOrders, 0);
  const rated = stores.filter((s) => s.ratingAvg !== null);
  const slaOk = stores.filter((s) => s.slaPct !== null);
  const withActivity = stores.filter((s) => s.avgMinutesPerActiveDay > 0);

  return {
    count: stores.length,
    gmv,
    orders,
    cancelledOrders: cancelled,
    cancelRatePct: orders ? (cancelled / orders) * 100 : null,
    avgTicket: orders ? gmv / orders : null,
    medianInactiveDays: median(stores.filter((s) => s.activity.days !== null).map((s) => s.activity.days)),
    avgMinutes: withActivity.length
      ? withActivity.reduce((a, s) => a + s.avgMinutesPerActiveDay, 0) / withActivity.length
      : 0,
    slaPct: slaOk.length ? slaOk.reduce((a, s) => a + s.slaPct, 0) / slaOk.length : null,
    ratingAvg: rated.length ? rated.reduce((a, s) => a + s.ratingAvg, 0) / rated.length : null,
    products: stores.reduce((a, s) => a + s.products, 0),
    activeProducts: stores.reduce((a, s) => a + s.activeProducts, 0),
  };
}

// ── Comparación con el período anterior ────────────────────────────────────

/**
 * Variación porcentual entre dos períodos. Devuelve null cuando no hay nada con
 * qué comparar: pasar de 0 a 300 no es "+∞ %" ni "+100 %", es un arranque, y
 * pintarlo como porcentaje miente sobre la magnitud.
 */
export function deltaPct(current, previous) {
  if (previous === null || previous === undefined || previous === 0) return null;
  if (current === null || current === undefined) return null;
  return ((current - previous) / Math.abs(previous)) * 100;
}

/** "+12,4 %" / "−8,0 %". El signo va delante porque es lo primero que se lee. */
export const fmtDelta = (d) =>
  d === null || d === undefined ? null : `${d >= 0 ? "+" : "−"}${Math.abs(d).toFixed(1)} %`;

// ── Exportación ────────────────────────────────────────────────────────────

/**
 * Una celda CSV segura. Además del entrecomillado normal, neutraliza las fórmulas:
 * Excel interpreta un valor que empieza por = + - @ como fórmula, y un nombre de
 * tienda que empiece por "=" acabaría ejecutándose al abrir el archivo.
 */
const csvCell = (v) => {
  if (v === null || v === undefined) return "";
  let s = String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
};

const CSV_COLUMNS = [
  ["Tienda", (s) => s.businessName],
  ["Código", (s) => s.storeCode],
  ["RIF", (s) => s.rif],
  ["Titular", (s) => s.ownerName],
  ["Email", (s) => s.ownerEmail],
  ["Estado", (s) => (s.isSuspended ? "Suspendida" : "Activa")],
  ["Verificada", (s) => (s.isVerified ? "Sí" : "No")],
  ["Registrada", (s) => (s.createdAt ? new Date(s.createdAt).toISOString().slice(0, 10) : "")],
  ["Días inactiva", (s) => s.activity.days],
  ["Nivel de sueño", (s) => (DORMANCY[s.activity.level] || DORMANCY.unknown).label],
  ["Última señal", (s) => (s.activity.lastAt ? new Date(s.activity.lastAt).toISOString() : "")],
  ["Min por día activo", (s) => s.avgMinutesPerActiveDay],
  ["Días con actividad", (s) => s.activeDaysInPeriod],
  ["GMV", (s) => s.gmv],
  ["Pedidos", (s) => s.orders],
  ["Pedidos cancelados", (s) => s.cancelledOrders],
  ["Ticket medio", (s) => s.avgTicket],
  ["Cancelación %", (s) => s.cancelRatePct],
  ["SLA %", (s) => s.slaPct],
  ["Rating", (s) => s.ratingAvg],
  ["Productos", (s) => s.products],
  ["Productos vendibles", (s) => s.activeProducts],
];

/**
 * CSV de lo que está en pantalla, filtrado y ordenado igual. Lleva BOM porque sin
 * él Excel en Windows abre los acentos rotos, y separador `;` porque en la
 * configuración regional de Venezuela la coma es el separador decimal.
 */
// Escapado, no literal: un BOM crudo en el fuente es un carácter invisible que
// ESLint marca y que cualquier editor puede comerse sin avisar.
const BOM = "\uFEFF";

export function buildCsv(stores, { period } = {}) {
  const sep = ";";
  const head = CSV_COLUMNS.map(([h]) => csvCell(h)).join(sep);
  const rows = stores.map((s) => CSV_COLUMNS.map(([, get]) => csvCell(get(s))).join(sep));
  const meta = period
    ? `${csvCell(`Período: ${period.from?.slice(0, 10)} a ${period.to?.slice(0, 10)} (${period.days} días)`)}\n`
    : "";
  return `${BOM}${meta}${head}\n${rows.join("\n")}\n`;
}

export const csvFilename = (period) =>
  `tiendas-estadisticas-${period?.from?.slice(0, 10) || "periodo"}_${period?.to?.slice(0, 10) || ""}.csv`;

/** Chips de lo que se está filtrando ahora, con cómo deshacer cada uno. */
export function buildChips({ extra, signedFrom, signedTo }, { setExtra, setSignedFrom, setSignedTo }) {
  const chips = EXTRA_FILTERS.filter((f) => extra[f.key] !== "todas").map((f) => ({
    id: f.key,
    text: `${f.label}: ${f.options.find((o) => o.value === extra[f.key])?.label}`,
    clear: () => setExtra((e) => ({ ...e, [f.key]: "todas" })),
  }));
  if (signedFrom) chips.push({ id: "from", text: `Registradas desde ${signedFrom}`, clear: () => setSignedFrom("") });
  if (signedTo) chips.push({ id: "to", text: `Registradas hasta ${signedTo}`, clear: () => setSignedTo("") });
  return chips;
}
