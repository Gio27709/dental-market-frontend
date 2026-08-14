import { useMemo, useState } from "react";
import PropTypes from "prop-types";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";

export default function DataTable({
  title,
  subtitle,
  columns = [],
  data = [],
  searchPlaceholder = "Buscar...",
  emptyMessage = "Sin registros que coincidan."
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const filteredData = useMemo(
    () =>
      data.filter((row) =>
        columns.some((col) => {
          const val = row[col.accessor];
          return val ? String(val).toLowerCase().includes(searchTerm.toLowerCase()) : false;
        })
      ),
    [data, columns, searchTerm]
  );

  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
  const currentPage = Math.min(page, totalPages);
  const paginatedData = filteredData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="fx-surface mb-5 overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 pb-4">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-fx-text leading-snug">{title}</h3>
          {subtitle && <p className="text-xs text-fx-muted mt-1 leading-relaxed">{subtitle}</p>}
        </div>

        <div className="relative shrink-0">
          <Search
            className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-fx-faint pointer-events-none"
            aria-hidden="true"
          />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            className="bg-fx-inset border border-fx-line rounded-lg pl-8 pr-3 py-1.5 text-xs text-fx-text placeholder:text-fx-faint focus:outline-none focus:border-fx-line-strong transition-colors w-full sm:w-56"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-y border-fx-line bg-fx-inset/60">
              {columns.map((col, idx) => (
                <th
                  key={col.accessor || idx}
                  scope="col"
                  className="py-2.5 px-5 text-[10px] font-semibold text-fx-faint uppercase tracking-[0.1em] whitespace-nowrap"
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-10 px-5 text-center text-fx-faint">
                  {data.length === 0 ? emptyMessage : "Sin registros que coincidan."}
                </td>
              </tr>
            ) : (
              paginatedData.map((row, rIdx) => (
                <tr
                  key={row.id || rIdx}
                  className="border-b border-fx-line last:border-0 text-fx-muted hover:bg-fx-raised/60 transition-colors"
                >
                  {columns.map((col, cIdx) => (
                    <td key={cIdx} className="py-2.5 px-5 fx-num align-middle">
                      {col.render ? col.render(row) : row[col.accessor]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-3 px-5 py-3 border-t border-fx-line text-xs text-fx-faint">
          <span className="fx-num">
            {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filteredData.length)} de {filteredData.length}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              aria-label="Página anterior"
              className="p-1.5 rounded-md border border-fx-line text-fx-muted enabled:hover:text-fx-text enabled:hover:border-fx-line-strong disabled:opacity-35 transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
            <span className="fx-num px-1 text-fx-muted">{currentPage} / {totalPages}</span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              aria-label="Página siguiente"
              className="p-1.5 rounded-md border border-fx-line text-fx-muted enabled:hover:text-fx-text enabled:hover:border-fx-line-strong disabled:opacity-35 transition-colors"
            >
              <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

DataTable.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      header: PropTypes.string.isRequired,
      accessor: PropTypes.string,
      render: PropTypes.func
    })
  ).isRequired,
  data: PropTypes.array.isRequired,
  searchPlaceholder: PropTypes.string,
  emptyMessage: PropTypes.string
};
