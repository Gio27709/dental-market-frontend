import PropTypes from "prop-types";

export default function Pagination({ page, totalPages, total, limit, onPageChange }) {
  if (totalPages <= 1) return null;

  const pages = [];
  const showEllipsis = totalPages > 7;

  if (showEllipsis) {
    if (page <= 4) {
      for (let i = 1; i <= Math.min(5, totalPages); i++) pages.push(i);
      if (totalPages > 5) pages.push("...", totalPages);
    } else if (page >= totalPages - 3) {
      pages.push(1, "...");
      for (let i = Math.max(totalPages - 4, 2); i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1, "...", page - 1, page, page + 1, "...", totalPages);
    }
  } else {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  }

  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-6">
      <p className="text-xs text-gray-500">
        Mostrando <span className="font-semibold text-gray-700">{from}–{to}</span> de{" "}
        <span className="font-semibold text-gray-700">{total}</span> registros
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </button>
        {pages.map((p, idx) =>
          p === "..." ? (
            <span key={`dots-${idx}`} className="px-2 text-gray-400 text-sm">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className="min-w-[36px] h-9 rounded-lg text-sm font-medium transition-all duration-200"
              style={{
                background: p === page ? 'linear-gradient(135deg, #531575 0%, #6b1e96 100%)' : 'transparent',
                color: p === page ? '#ffffff' : '#6b7280',
              }}
            >
              {p}
            </button>
          )
        )}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      </div>
    </div>
  );
}

Pagination.propTypes = {
  page: PropTypes.number.isRequired,
  totalPages: PropTypes.number.isRequired,
  total: PropTypes.number.isRequired,
  limit: PropTypes.number.isRequired,
  onPageChange: PropTypes.func.isRequired,
};
