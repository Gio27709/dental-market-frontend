/**
 * Formato y constantes compartidas por el historial de publicaciones y la
 * ficha de una sola. Viven fuera de los componentes para que cada archivo de
 * componente exporte solo componentes (react-refresh se queja si no).
 */

export const PERIODS = [
  { id: "7d", label: "7 días" },
  { id: "30d", label: "30 días" },
  { id: "90d", label: "90 días" },
];

export const formatCount = (n) =>
  typeof n === "number" ? new Intl.NumberFormat("es-VE").format(n) : n ?? 0;

/** Etiqueta corta "12 ago" para el eje: las fechas ISO no caben. */
export const shortDate = (iso) => {
  const [y, m, d] = String(iso).split("-").map(Number);
  if (!y) return iso;
  return new Date(y, m - 1, d).toLocaleDateString("es-VE", { day: "numeric", month: "short" });
};
