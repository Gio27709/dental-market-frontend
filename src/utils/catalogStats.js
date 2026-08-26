/**
 * Lógica del Centro de Catálogo: vistas, filtros, orden, totales y export.
 *
 * Fuera del componente para poder ejecutarla y comprobarla sin montar React, igual
 * que `storeStats.js`. El backend manda la matriz completa; todo lo de aquí trabaja
 * en memoria sobre esa respuesta.
 */

// Con extensión a propósito: Vite resuelve sin ella, pero Node no, y este módulo
// se ejecuta también fuera del navegador para poder comprobarlo sin montar React.
import { rejectionLabel } from "./productModeration.js";

export { rejectionLabel };

// ── Problemas detectables ──────────────────────────────────────────────────

/**
 * Catálogo de problemas que devuelve el backend en `product.issues`.
 * `severity` ordena la vista Problemas: primero lo que cuesta dinero, después lo
 * que cuesta ventas, al final lo que cuesta calidad.
 */
export const ISSUES = {
  margen_negativo:          { severity: 1, label: "Vende bajo coste",        tone: "bad",  fix: "Revisar precio o coste con la tienda" },
  publicado_sin_stock:      { severity: 2, label: "Publicado sin stock",     tone: "bad",  fix: "Reponer o despublicar" },
  descuento_falso:          { severity: 2, label: "Descuento falso",         tone: "bad",  fix: "El precio tachado no supera al real" },
  despublicado_con_ventas:  { severity: 3, label: "Despublicado y vendía",   tone: "warn", fix: "Confirmar con la tienda si es a propósito" },
  margen_bajo:              { severity: 4, label: "Margen bajo",             tone: "warn", fix: "Menos del 20% sobre el precio de venta" },
  visitas_sin_ventas:       { severity: 5, label: "Visitas sin ventas",      tone: "warn", fix: "Se ve pero no se compra: precio o ficha" },
  sin_imagen:               { severity: 6, label: "Sin imagen",              tone: "warn", fix: "Pedir fotos a la tienda" },
  sin_descripcion:          { severity: 7, label: "Sin descripción",         tone: "soft", fix: "Menos de 40 caracteres" },
  sin_marca:                { severity: 8, label: "Sin marca",               tone: "soft", fix: "Asignar marca para que busque mejor" },
  sin_coste:                { severity: 9, label: "Sin coste cargado",       tone: "soft", fix: "Sin coste no se puede medir el margen" },
};

export const issueLabel = (key) => ISSUES[key]?.label || key;

/**
 * Corte entre lo que cuesta dinero o ventas y lo que solo es ficha a medias. Sin él,
 * el KPI contaba 16 de 17 productos "con problemas" —casi todos por no tener marca—
 * y un número que señala a todo el catálogo no señala nada.
 */
export const SEVERE_THRESHOLD = 5;
export const isSevere = (key) => (ISSUES[key]?.severity ?? 99) <= SEVERE_THRESHOLD;
export const countSevere = (products) =>
  products.filter((p) => p.issues.some(isSevere)).length;

/** Severidad del problema más grave. Los sanos van al final al ordenar. */
export const worstSeverity = (issues = []) =>
  issues.length ? Math.min(...issues.map((i) => ISSUES[i]?.severity ?? 99)) : 99;

// ── Formato ────────────────────────────────────────────────────────────────

export const money = (n) =>
  n === null || n === undefined
    ? "—"
    : `$${Number(n).toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const pct = (n) => (n === null || n === undefined ? "—" : `${Number(n).toFixed(1)}%`);
export const int = (n) => Number(n || 0).toLocaleString("es-VE");

export const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString("es-VE", { day: "2-digit", month: "short", year: "numeric" }) : "—";

export const fmtDateTime = (iso) =>
  iso
    ? new Date(iso).toLocaleString("es-VE", {
        day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
      })
    : "Sin registrar";

// ── Vistas ─────────────────────────────────────────────────────────────────

/**
 * Cada vista es una pregunta con su propio subconjunto y su propio orden. El panel
 * anterior intentaba ser bandeja y catálogo a la vez y no era ninguna de las dos.
 */
export const VIEWS = [
  {
    key: "queue",
    label: "Cola",
    empty: "No hay nada esperando decisión.",
    // Lo que lleva más tiempo esperando va primero: es deuda operativa.
    sort: { key: "createdAt", dir: "asc" },
    filter: (p) => p.moderationStatus === "pending",
  },
  {
    key: "performance",
    label: "Rendimiento",
    empty: "No hay productos que medir.",
    sort: { key: "revenue", dir: "desc" },
    filter: () => true,
  },
  {
    key: "issues",
    label: "Problemas",
    empty: "Ningún producto tiene problemas detectados.",
    sort: { key: "severity", dir: "asc" },
    filter: (p) => p.issues.length > 0,
  },
  {
    key: "audit",
    label: "Auditoría",
    empty: "Todavía no se ha registrado ninguna decisión de moderación.",
    sort: { key: "moderatedAt", dir: "desc" },
    // Incluye los rechazos anteriores a la migración: no tienen fecha, pero
    // esconderlos daría la impresión de que nunca se rechazó nada.
    filter: (p) => Boolean(p.moderation.at) || p.moderationStatus === "rejected",
  },
];

export const viewByKey = (key) => VIEWS.find((v) => v.key === key) || VIEWS[1];

// ── Columnas ───────────────────────────────────────────────────────────────

const VAL = {
  name: (p) => (p.name || "").trim().toLowerCase(),
  store: (p) => (p.storeName || "").toLowerCase(),
  status: (p) => (p.isPublished ? 0 : p.moderationStatus === "pending" ? 1 : 2),
  price: (p) => p.price,
  cost: (p) => p.costPrice,
  margin: (p) => p.margin,
  views: (p) => p.views,
  addToCart: (p) => p.addToCart,
  units: (p) => p.units,
  revenue: (p) => p.revenue,
  conversion: (p) => p.conversionPct,
  stock: (p) => p.stock,
  rating: (p) => p.ratingAvg,
  severity: (p) => worstSeverity(p.issues),
  createdAt: (p) => new Date(p.createdAt).getTime(),
  moderatedAt: (p) => (p.moderation.at ? new Date(p.moderation.at).getTime() : null),
};

/** Columnas de la vista Rendimiento, agrupadas como en el diseño. */
export const COLUMNS = [
  { key: "name",       group: "",                 header: "Producto", align: "left", value: VAL.name },
  { key: "status",     group: "",                 header: "Estado",   align: "left", value: VAL.status },
  { key: "price",      group: "Precio y margen",  header: "Precio",   align: "right", value: VAL.price },
  { key: "cost",       group: "Precio y margen",  header: "Coste",    align: "right", value: VAL.cost },
  { key: "margin",     group: "Precio y margen",  header: "Margen",   align: "right", value: VAL.margin },
  { key: "views",      group: "Embudo",           header: "Vistas",   align: "right", value: VAL.views },
  { key: "addToCart",  group: "Embudo",           header: "Carrito",  align: "right", value: VAL.addToCart },
  { key: "units",      group: "Embudo",           header: "Vendidas", align: "right", value: VAL.units },
  { key: "revenue",    group: "Embudo",           header: "Ingresos", align: "right", value: VAL.revenue },
  { key: "stock",      group: "Catálogo",         header: "Stock",    align: "right", value: VAL.stock },
];

export const COLUMN_GROUPS = COLUMNS.reduce((acc, c) => {
  const last = acc[acc.length - 1];
  if (last && last[0] === c.group) last[1] += 1;
  else acc.push([c.group, 1]);
  return acc;
}, []);

export const SORTABLE = { ...VAL };

// ── Filtros ────────────────────────────────────────────────────────────────

export const BAR_FILTERS = ["status", "category", "store"];

/**
 * Igual que en la matriz de tiendas: cada filtro declara cómo evalúa un producto y
 * cómo se rotula su chip. `todas` es el valor neutro. Los de `options: "dynamic"`
 * se rellenan con lo que traiga el catálogo.
 */
export const FILTERS = [
  {
    key: "status",
    iconKey: "tag",
    label: "Estado",
    icon: "🏷️",
    options: [
      { value: "todas", label: "Todos los estados", icon: "🏷️" },
      { value: "published", label: "Publicado", icon: "🟢" },
      { value: "pending", label: "Pendiente", icon: "⏳" },
      { value: "draft", label: "Borrador", icon: "📝" },
      { value: "rejected", label: "Rechazado", icon: "⛔" },
      { value: "nostock", label: "Sin stock", icon: "📦" },
    ],
    test: (p, v) =>
      v === "published" ? p.isPublished
      : v === "pending" ? p.moderationStatus === "pending"
      : v === "draft" ? p.stockStatus === "Borrador"
      : v === "rejected" ? p.moderationStatus === "rejected"
      : p.stock === 0,
  },
  {
    key: "category",
    iconKey: "folder",
    label: "Categoría",
    icon: "🗂️",
    dynamic: "categoryName",
    catalog: "categories",
    allLabel: "Todas las categorías",
    test: (p, v) => p.categoryName === v,
  },
  {
    key: "store",
    iconKey: "storefront",
    label: "Tienda",
    icon: "🏪",
    dynamic: "storeName",
    catalog: "stores",
    allLabel: "Todas las tiendas",
    test: (p, v) => p.storeName === v,
  },
  {
    key: "brand",
    iconKey: "bookmark",
    label: "Marca",
    icon: "🔖",
    dynamic: "brandName",
    catalog: "brands",
    allLabel: "Todas las marcas",
    // "sin_marca" es un valor de primera: hoy son 8 de 17 y es justo lo que se busca.
    extraOptions: [{ value: "sin_marca", label: "Sin marca", icon: "⚠️" }],
    test: (p, v) => (v === "sin_marca" ? !p.brandName : p.brandName === v),
  },
  {
    key: "margin",
    iconKey: "money",
    label: "Margen",
    icon: "💰",
    options: [
      { value: "todas", label: "Cualquier margen", icon: "💰" },
      { value: "negativo", label: "Negativo", icon: "🔻" },
      { value: "bajo", label: "Bajo (menos del 20%)", icon: "⚠️" },
      { value: "sano", label: "Sano (20% o más)", icon: "✅" },
      { value: "sin_coste", label: "Sin coste cargado", icon: "❔" },
    ],
    test: (p, v) =>
      v === "sin_coste" ? p.costPrice === null
      : p.margin === null ? false
      : v === "negativo" ? p.margin < 0
      : v === "bajo" ? p.margin >= 0 && p.margin < 20
      : p.margin >= 20,
  },
  {
    key: "stock",
    iconKey: "cube",
    label: "Stock",
    icon: "📦",
    options: [
      { value: "todas", label: "Cualquier stock", icon: "📦" },
      { value: "agotado", label: "Agotado", icon: "🔴" },
      { value: "bajo", label: "Bajo (5 o menos)", icon: "🟠" },
      { value: "con", label: "Con stock", icon: "🟢" },
    ],
    test: (p, v) => (v === "agotado" ? p.stock === 0 : v === "bajo" ? p.stock > 0 && p.stock <= 5 : p.stock > 5),
  },
  {
    key: "sales",
    iconKey: "cart",
    label: "Ventas en el período",
    icon: "🛒",
    options: [
      { value: "todas", label: "Vendan o no", icon: "🛒" },
      { value: "con", label: "Con ventas", icon: "✅" },
      { value: "sin", label: "Sin ventas", icon: "⭕" },
    ],
    test: (p, v) => (v === "con" ? p.units > 0 : p.units === 0),
  },
  {
    key: "funnel",
    iconKey: "eye",
    label: "Embudo",
    icon: "👁️",
    options: [
      { value: "todas", label: "Todo el embudo", icon: "👁️" },
      { value: "visitas_sin_ventas", label: "Con visitas y sin ventas", icon: "👀" },
      { value: "sin_visitas", label: "Sin visitas", icon: "🚫" },
      { value: "convierte", label: "Convierte", icon: "✅" },
    ],
    // Mismo criterio que `detectIssues` en el backend: el embudo se mide con las
    // ventas de la ventana en la que hay visitas (`unitsTracked`), no con las de
    // todo el histórico. Con `units` un producto que vendió hace meses y hoy no
    // convierte salía clasificado como "convierte" mientras su ficha decía 0%.
    test: (p, v) =>
      v === "visitas_sin_ventas" ? p.views > 0 && p.unitsTracked === 0
      : v === "sin_visitas" ? p.views === 0
      : p.views > 0 && p.unitsTracked > 0,
  },
  {
    key: "quality",
    iconKey: "photo",
    label: "Calidad de ficha",
    icon: "🖼️",
    options: [
      { value: "todas", label: "Cualquier ficha", icon: "🖼️" },
      { value: "sin_imagen", label: "Sin imagen", icon: "🚫" },
      { value: "sin_marca", label: "Sin marca", icon: "🔖" },
      { value: "sin_descripcion", label: "Sin descripción", icon: "📄" },
      { value: "completa", label: "Ficha completa", icon: "✅" },
    ],
    test: (p, v) =>
      v === "completa"
        ? p.images > 0 && Boolean(p.brandName) && p.hasDescription
        : p.issues.includes(v),
  },
  {
    key: "reason",
    iconKey: "ban",
    label: "Motivo de rechazo",
    icon: "⛔",
    dynamic: "__reason",
    allLabel: "Cualquier motivo",
    test: (p, v) => p.moderation.reason === v,
  },
];

export const NEUTRAL_FILTERS = Object.fromEntries(FILTERS.map((f) => [f.key, "todas"]));

/** Rellena las opciones de los filtros dinámicos con lo que haya en el catálogo. */
/**
 * Opciones de cada desplegable.
 *
 * Las listas dinámicas salen de los catálogos MAESTROS que manda el backend, no de
 * los productos cargados. Sacarlas de los productos dejaba el filtro de marcas con
 * 4 de las 67 creadas —solo las que alguien había llegado a asignar— y hacía
 * imposible preguntar "¿cuántos productos tengo de ULTRADENT?". Que la respuesta sea
 * cero también es una respuesta.
 *
 * Cada opción lleva su recuento, y las que no tienen ningún producto se marcan para
 * que se distingan de un vistazo sin sacarlas de la lista.
 */
export function buildFilterOptions(products, catalogs = {}) {
  const out = {};
  for (const f of FILTERS) {
    if (!f.dynamic) {
      out[f.key] = f.options;
      continue;
    }

    let valores;
    if (f.catalog && Array.isArray(catalogs[f.catalog])) {
      // Una marca desactivada que todavía tiene productos sigue en la lista: es
      // justo la que hay que encontrar para reasignarla.
      valores = catalogs[f.catalog]
        .filter((c) => c.isActive !== false || c.products > 0)
        .map((c) => ({
          value: c.name,
          label: c.products > 0 ? `${c.name} (${c.products})` : c.name,
          count: c.products,
          muted: c.products === 0,
        }));
    } else if (f.dynamic === "__reason") {
      valores = [...new Set(products.map((p) => p.moderation.reason).filter(Boolean))]
        .sort()
        .map((v) => ({ value: v, label: rejectionLabel(v) }));
    } else {
      valores = [...new Set(products.map((p) => p[f.dynamic]).filter(Boolean))]
        .sort((a, b) => a.localeCompare(b))
        .map((v) => ({ value: v, label: v }));
    }

    out[f.key] = [
      { value: "todas", label: f.allLabel || `Todas: ${f.label}` },
      ...(f.extraOptions || []),
      ...valores,
    ];
  }
  return out;
}

const SEARCH_FIELDS = ["name", "storeName", "storeCode", "brandName", "categoryName"];

export function filterProducts(products, { view = "performance", search = "", filters = NEUTRAL_FILTERS, priceMin = "", priceMax = "" } = {}) {
  let out = products.filter(viewByKey(view).filter);

  const term = search.trim().toLowerCase();
  if (term) out = out.filter((p) => SEARCH_FIELDS.some((f) => (p[f] || "").toLowerCase().includes(term)));

  for (const f of FILTERS) {
    const v = filters[f.key];
    if (v && v !== "todas") out = out.filter((p) => f.test(p, v));
  }

  // Los límites vacíos no filtran; un 0 explícito sí, por eso se compara con "".
  if (priceMin !== "" && priceMin !== null) out = out.filter((p) => p.price >= Number(priceMin));
  if (priceMax !== "" && priceMax !== null) out = out.filter((p) => p.price <= Number(priceMax));

  return out;
}

export function sortProducts(products, sort) {
  const get = SORTABLE[sort.key] || SORTABLE.revenue;
  const factor = sort.dir === "asc" ? 1 : -1;
  return [...products].sort((a, b) => {
    const va = get(a);
    const vb = get(b);
    // Nulos al final se ordene como se ordene: son "no hay dato", no "el más bajo".
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
    : { key, dir: key === "name" || key === "store" ? "asc" : "desc" };

// ── Totales ────────────────────────────────────────────────────────────────

export function computeTotals(products) {
  const withMargin = products.filter((p) => p.margin !== null);
  const revenue = products.reduce((a, p) => a + p.revenue, 0);
  const views = products.reduce((a, p) => a + p.views, 0);
  const units = products.reduce((a, p) => a + p.units, 0);
  const r2 = (n) => Math.round(n * 100) / 100;

  return {
    count: products.length,
    revenue: r2(revenue),
    units,
    views,
    addToCart: products.reduce((a, p) => a + p.addToCart, 0),
    stock: products.reduce((a, p) => a + p.stock, 0),
    avgPrice: products.length ? r2(products.reduce((a, p) => a + p.price, 0) / products.length) : null,
    // Media simple sobre los que tienen coste: ponderar por ingresos escondería el
    // producto que pierde dinero justo porque casi no vende.
    avgMargin: withMargin.length
      ? Math.round((withMargin.reduce((a, p) => a + p.margin, 0) / withMargin.length) * 10) / 10
      : null,
    conversionPct: views > 0 ? Math.round((units / views) * 1000) / 10 : null,
    withIssues: products.filter((p) => p.issues.length > 0).length,
  };
}

// ── Paginación ─────────────────────────────────────────────────────────────

export const PAGE_SIZES = [10, 25, 50, 100];
export const DEFAULT_PAGE_SIZE = 25;

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

// ── Chips y export ─────────────────────────────────────────────────────────

export function buildChips({ filters, priceMin, priceMax }, { setFilters, setPriceMin, setPriceMax }, options = {}) {
  const chips = FILTERS.filter((f) => filters[f.key] !== "todas").map((f) => {
    const opts = options[f.key] || f.options || [];
    const found = opts.find((o) => o.value === filters[f.key]);
    return {
      id: f.key,
      text: `${f.label}: ${found?.label ?? filters[f.key]}`,
      clear: () => setFilters((prev) => ({ ...prev, [f.key]: "todas" })),
    };
  });
  if (priceMin !== "") chips.push({ id: "pmin", text: `Precio desde $${priceMin}`, clear: () => setPriceMin("") });
  if (priceMax !== "") chips.push({ id: "pmax", text: `Precio hasta $${priceMax}`, clear: () => setPriceMax("") });
  return chips;
}

const csvCell = (v) => {
  if (v === null || v === undefined) return "";
  let s = String(v);
  // Excel ejecuta lo que empieza por = + - @; un nombre de producto no debe correr.
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
};

const CSV_COLUMNS = [
  ["Producto", (p) => (p.name || "").trim()],
  ["Tienda", (p) => p.storeName],
  ["Código tienda", (p) => p.storeCode],
  ["Categoría", (p) => p.categoryName],
  ["Marca", (p) => p.brandName],
  ["Estado", (p) => (p.isPublished ? "Publicado" : p.moderationStatus === "pending" ? "Pendiente" : p.moderationStatus === "rejected" ? "Rechazado" : "Borrador")],
  ["Precio", (p) => p.price],
  ["Coste", (p) => p.costPrice],
  ["Margen %", (p) => p.margin],
  ["Stock", (p) => p.stock],
  ["Vistas", (p) => p.views],
  ["Al carrito", (p) => p.addToCart],
  ["Vendidas", (p) => p.units],
  ["Ingresos", (p) => p.revenue],
  ["Conversión %", (p) => p.conversionPct],
  ["Rating", (p) => p.ratingAvg],
  ["Reseñas", (p) => p.reviewCount],
  ["Problemas", (p) => p.issues.map(issueLabel).join(" · ")],
  ["Moderado el", (p) => (p.moderation.at ? new Date(p.moderation.at).toISOString() : "")],
  ["Moderado por", (p) => p.moderation.byName],
  ["Motivo rechazo", (p) => rejectionLabel(p.moderation.reason)],
  ["Nota", (p) => p.moderation.note],
  ["Creado", (p) => (p.createdAt ? new Date(p.createdAt).toISOString().slice(0, 10) : "")],
];

const BOM = "\uFEFF";

/** BOM para que Excel lea los acentos, `;` porque la coma es decimal en es-VE. */
export function buildCsv(products, { view, period } = {}) {
  const sep = ";";
  const head = CSV_COLUMNS.map(([h]) => csvCell(h)).join(sep);
  const rows = products.map((p) => CSV_COLUMNS.map(([, get]) => csvCell(get(p))).join(sep));
  const meta = csvCell(
    `Vista: ${viewByKey(view).label} · Período: ${period?.from ? `${period.from.slice(0, 10)} a ${period.to.slice(0, 10)}` : "todo el histórico"}`
  );
  return `${BOM}${meta}\n${head}\n${rows.join("\n")}\n`;
}

export const csvFilename = (view) => `catalogo-${viewByKey(view).key}-${new Date().toISOString().slice(0, 10)}.csv`;
