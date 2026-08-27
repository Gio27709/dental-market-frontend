import { useState, useEffect, useCallback, useMemo } from "react";
import PropTypes from "prop-types";
import { getDrilldownAPI } from "../../../services/api";
import ModalOverlay from "./ModalOverlay";

/**
 * Modal genérico de drill-down.
 *
 * No conoce ningún dataset en concreto: el backend devuelve la definición de columnas
 * junto con las filas, así que este componente sirve para cualquier métrica presente o
 * futura sin tocar su código. Paginación y orden se resuelven en el servidor porque el
 * detalle puede tener miles de filas.
 */

const formatCell = (value, format) => {
  if (value === null || value === undefined || value === "") return <span className="text-gray-600">—</span>;

  switch (format) {
    case "currency":
      return `$${parseFloat(value).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    case "percent":
      return `${parseFloat(value).toFixed(2)}%`;
    case "number":
      return parseFloat(value).toLocaleString("en-US");
    case "date":
      return new Date(value).toLocaleDateString("es-VE");
    case "datetime":
      return new Date(value).toLocaleString("es-VE");
    case "bool":
      return value ? (
        <span className="text-fx-pos font-bold">Sí</span>
      ) : (
        <span className="text-fx-neg font-bold">No</span>
      );
    case "stars":
      return (
        <span className="text-fx-warn font-bold whitespace-nowrap">
          {"★".repeat(Math.round(value))}
          <span className="text-gray-600">{"★".repeat(Math.max(0, 5 - Math.round(value)))}</span>
        </span>
      );
    case "badge":
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-fx-raised text-fx-muted border border-fx-line-strong whitespace-nowrap">
          {value}
        </span>
      );
    case "mono":
      return <span className="font-mono text-[11px] text-fx-faint">{value}</span>;
    default:
      return <span className="text-fx-muted">{String(value)}</span>;
  }
};

const toCsvCell = (value) => {
  if (value === null || value === undefined) return "";
  const s = String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export default function DrilldownModal({ isOpen, onClose, dataset, title, subtitle, filters = {}, period = "30d", storeIds = [] }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [payload, setPayload] = useState(null);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState(null);
  const [dir, setDir] = useState("desc");
  const [search, setSearch] = useState("");

  // `filters` suele llegar como objeto literal desde el JSX del padre, que cambia de
  // identidad en cada render. Sin esto el efecto de carga se dispararía en bucle.
  const filtersKey = JSON.stringify(filters);
  const storeIdsKey = storeIds.join(",");

  const fetchRows = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getDrilldownAPI(dataset, {
        ...JSON.parse(filtersKey),
        period,
        ...(storeIdsKey ? { store_ids: storeIdsKey } : {}),
        page,
        pageSize: 50,
        ...(sort ? { sort, dir } : {})
      });
      if (res.data?.success) setPayload(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "No se pudo cargar el detalle.");
    } finally {
      setLoading(false);
    }
  }, [dataset, filtersKey, storeIdsKey, period, page, sort, dir]);

  useEffect(() => {
    if (isOpen) fetchRows();
  }, [isOpen, fetchRows]);

  // Volver a la primera página cuando cambian los criterios, si no se pediría una
  // página que puede ya no existir en el nuevo conjunto de resultados.
  useEffect(() => {
    setPage(1);
  }, [dataset, filtersKey, storeIdsKey, period]);

  const columns = useMemo(() => payload?.columns || [], [payload]);
  const rows = useMemo(() => payload?.rows || [], [payload]);
  const pagination = payload?.pagination || { page: 1, totalPages: 1, total: 0 };

  // El buscador filtra solo la página visible; sirve para localizar algo a la vista,
  // no para consultar el conjunto completo (eso se hace con los filtros del servidor).
  const visibleRows = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter((r) => Object.values(r).some((v) => String(v ?? "").toLowerCase().includes(term)));
  }, [rows, search]);

  const toggleSort = (key) => {
    if (sort === key) {
      setDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSort(key);
      setDir("desc");
    }
    setPage(1);
  };

  const exportCsv = () => {
    const header = columns.map((c) => toCsvCell(c.label)).join(",");
    const body = rows.map((r) => columns.map((c) => toCsvCell(r[c.key])).join(",")).join("\n");
    const blob = new Blob([`\ufeff${header}\n${body}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${dataset}-pagina-${pagination.page}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <ModalOverlay>
      <div className="bg-fx-panel border border-fx-line-strong rounded-xl p-6 max-w-7xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-fx-line mb-4 gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 shrink-0 rounded-2xl bg-[#6b1e96]/10 border border-fx-accent/30 flex items-center justify-center text-fx-accent text-xl">
              🔍
            </div>
            <div className="min-w-0">
              <h3 className="text-lg font-bold text-fx-text truncate">{title || payload?.label || "Detalle"}</h3>
              <p className="text-fx-muted text-xs truncate">
                {subtitle || `${pagination.total.toLocaleString("en-US")} registros encontrados`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <input
              type="text"
              placeholder="Buscar en esta página..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-purple-950/80 border border-fx-line-strong rounded-xl px-3 py-1.5 text-xs text-fx-text outline-none w-52 placeholder-gray-400"
            />
            <button
              onClick={exportCsv}
              disabled={rows.length === 0}
              className="px-3 py-1.5 bg-[#6b1e96]/10 hover:bg-[#6b1e96]/20 border border-fx-accent/30 text-fx-accent rounded-xl text-xs font-bold transition-all disabled:opacity-40"
            >
              ↓ CSV
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-fx-inset hover:bg-fx-raised border border-fx-line-strong flex items-center justify-center text-fx-muted font-bold transition-all"
            >
              ✕
            </button>
          </div>
        </div>

        {payload?.storeScope?.requested && !payload.storeScope.applied && (
          <div className="mb-4 px-3 py-2 rounded-xl bg-fx-warn/10 border border-fx-warn/30 text-fx-warn text-xs">
            {payload.storeScope.exempt
              ? "Este detalle no se acota por tienda: la métrica que lo abre es de toda la plataforma."
              : "Este detalle no puede acotarse por tienda, así que muestra todos los comercios aunque haya un filtro activo."}
          </div>
        )}

        {/* Cuerpo */}
        <div className="flex-1 overflow-auto min-h-[200px]">
          {loading ? (
            <div className="py-20 text-center text-fx-faint text-sm font-semibold animate-pulse">
              Consultando registros individuales...
            </div>
          ) : error ? (
            <div className="py-16 text-center">
              <p className="text-fx-neg text-sm font-bold mb-2">No se pudo cargar el detalle</p>
              <p className="text-fx-muted text-xs mb-4">{error}</p>
              <button
                onClick={fetchRows}
                className="px-4 py-2 bg-[#6b1e96] hover:bg-[#531575] text-white rounded-xl text-xs font-bold transition-all"
              >
                Reintentar
              </button>
            </div>
          ) : visibleRows.length === 0 ? (
            <div className="py-16 text-center text-fx-muted text-xs">
              {rows.length === 0
                ? "No hay registros para este criterio en el período seleccionado."
                : "Ningún registro de esta página coincide con la búsqueda."}
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 bg-fx-panel z-10">
                <tr className="border-b border-fx-line text-fx-faint uppercase tracking-wider text-[10px]">
                  {columns.map((c) => (
                    <th
                      key={c.key}
                      onClick={() => toggleSort(c.key)}
                      className="py-3 px-3 cursor-pointer hover:text-fx-accent transition-colors select-none whitespace-nowrap"
                    >
                      {c.label}
                      {sort === c.key && <span className="ml-1">{dir === "asc" ? "▲" : "▼"}</span>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-500/10">
                {visibleRows.map((row, i) => (
                  <tr key={row.id || i} className="hover:bg-purple-900/30 transition-colors">
                    {columns.map((c) => (
                      <td key={c.key} className="py-2.5 px-3 align-top max-w-xs truncate">
                        {formatCell(row[c.key], c.format)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer con paginación */}
        <div className="pt-4 mt-4 border-t border-fx-line flex items-center justify-between gap-3">
          <span className="text-[11px] text-fx-muted">
            Página {pagination.page} de {pagination.totalPages} · {pagination.total.toLocaleString("en-US")} registros
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={pagination.page <= 1 || loading}
              className="px-3 py-1.5 bg-fx-inset hover:bg-fx-raised border border-fx-line-strong text-fx-muted rounded-xl text-xs font-bold transition-all disabled:opacity-30"
            >
              ← Anterior
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={pagination.page >= pagination.totalPages || loading}
              className="px-3 py-1.5 bg-fx-inset hover:bg-fx-raised border border-fx-line-strong text-fx-muted rounded-xl text-xs font-bold transition-all disabled:opacity-30"
            >
              Siguiente →
            </button>
            <button
              onClick={onClose}
              className="px-5 py-1.5 bg-[#6b1e96] hover:bg-[#531575] text-white rounded-xl text-xs font-bold transition-all shadow-lg"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </ModalOverlay>
  );
}

DrilldownModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  dataset: PropTypes.string.isRequired,
  title: PropTypes.string,
  subtitle: PropTypes.string,
  storeIds: PropTypes.arrayOf(PropTypes.string),
  filters: PropTypes.object,
  period: PropTypes.string
};
