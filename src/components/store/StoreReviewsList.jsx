import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import PropTypes from "prop-types";

export default function StoreReviewsList({ data, onClose }) {
  const [starFilter, setStarFilter] = useState("all");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [sortBy, setSortBy] = useState("recent");

  const reviews = useMemo(() => data?.reviews || [], [data?.reviews]);

  // Filter & Sort
  const filteredReviews = useMemo(() => {
    let result = [...reviews];

    // Star filter
    if (starFilter !== "all") {
      result = result.filter((r) => r.rating === parseInt(starFilter));
    }

    // Verified filter
    if (verifiedOnly) {
      result = result.filter((r) => r.is_verified_purchase);
    }

    // Sort
    if (sortBy === "recent") {
      result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    } else if (sortBy === "highest") {
      result.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === "lowest") {
      result.sort((a, b) => a.rating - b.rating);
    }

    return result;
  }, [reviews, starFilter, verifiedOnly, sortBy]);

  const filterChips = [
    { key: "all", label: "Todas" },
    { key: "5", label: "5 ⭐" },
    { key: "4", label: "4 ⭐" },
    { key: "3", label: "3 ⭐" },
    { key: "2", label: "2 ⭐" },
    { key: "1", label: "1 ⭐" },
  ];

  if (!data) return null;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_8px_30px_rgba(107,30,150,0.08)] overflow-hidden animate-in">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px] text-[#6b1e96]">reviews</span>
          <h3 className="text-lg font-bold text-[#160a22] font-['Manrope']">
            Todas las Reseñas de la Tienda
          </h3>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Cerrar panel"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="px-6 py-4 border-b border-gray-50 flex flex-col sm:flex-row items-start sm:items-center gap-3">
        {/* Star Chips */}
        <div className="flex flex-wrap gap-2 flex-1">
          {filterChips.map((chip) => (
            <button
              key={chip.key}
              onClick={() => setStarFilter(chip.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                starFilter === chip.key
                  ? "bg-[#6b1e96] text-white shadow-sm"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              {chip.label}
            </button>
          ))}
          <button
            onClick={() => setVerifiedOnly(!verifiedOnly)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1 ${
              verifiedOnly
                ? "bg-emerald-500 text-white shadow-sm"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            }`}
          >
            <span className="material-symbols-outlined text-[12px]">verified</span>
            Verificadas
          </button>
        </div>

        {/* Sort Dropdown */}
        <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-1.5 border border-gray-100">
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider whitespace-nowrap">Ordenar:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="text-xs font-bold text-gray-700 bg-transparent focus:outline-none cursor-pointer appearance-none pr-4"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23666'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='3' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right center",
              backgroundSize: "0.8rem",
            }}
          >
            <option value="recent">Más recientes</option>
            <option value="highest">Mayor calificación</option>
            <option value="lowest">Menor calificación</option>
          </select>
        </div>
      </div>

      {/* Results Count */}
      <div className="px-6 pt-4 pb-2">
        <p className="text-xs text-gray-400 font-medium">
          Mostrando <span className="text-[#6b1e96] font-bold">{filteredReviews.length}</span> de {reviews.length} reseña{reviews.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Reviews List */}
      <div className="px-6 pb-6">
        {filteredReviews.length === 0 ? (
          <div className="text-center py-10">
            <span className="material-symbols-outlined text-gray-200 text-[48px] mb-2">sentiment_neutral</span>
            <p className="text-gray-400 font-medium">No hay reseñas con estos filtros.</p>
            <button
              onClick={() => { setStarFilter("all"); setVerifiedOnly(false); }}
              className="mt-3 text-sm text-[#6b1e96] font-bold hover:underline"
            >
              Restablecer filtros
            </button>
          </div>
        ) : (
          <div className="space-y-4 mt-2">
            {filteredReviews.map((review) => (
              <div
                key={review.id}
                className="p-4 rounded-xl bg-gray-50/60 border border-gray-100/80 hover:border-gray-200 transition-colors"
              >
                <div className="flex items-start gap-4">
                  {/* Product Thumbnail */}
                  <Link
                    to={`/product/${review.product.id}`}
                    className="w-14 h-14 rounded-lg bg-white border border-gray-100 overflow-hidden flex-shrink-0 flex items-center justify-center hover:border-[#6b1e96]/30 transition-colors"
                  >
                    {review.product.images[0] ? (
                      <img
                        src={review.product.images[0]}
                        alt={review.product.name}
                        className="w-full h-full object-contain p-1.5"
                      />
                    ) : (
                      <span className="material-symbols-outlined text-gray-300 text-[24px]">inventory_2</span>
                    )}
                  </Link>

                  {/* Review Content */}
                  <div className="flex-1 min-w-0">
                    {/* Top Row: Product name + Verified badge */}
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <Link
                        to={`/product/${review.product.id}`}
                        className="text-xs font-bold text-[#6b1e96] hover:underline truncate"
                      >
                        {review.product.name}
                      </Link>
                      {review.is_verified_purchase && (
                        <span className="flex-shrink-0 text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[11px]">verified</span>
                          Verificada
                        </span>
                      )}
                    </div>

                    {/* Reviewer info */}
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-full bg-[#6b1e96]/10 flex items-center justify-center text-[#6b1e96] text-[10px] font-bold flex-shrink-0">
                        {review.user.full_name?.charAt(0)?.toUpperCase() || "U"}
                      </div>
                      <span className="text-sm font-medium text-gray-700">{review.user.full_name}</span>
                      <span className="text-gray-300">·</span>
                      <span className="text-xs text-gray-400">
                        {new Date(review.created_at).toLocaleDateString("es-VE", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>

                    {/* Stars */}
                    <div className="flex gap-0.5 mb-2">
                      {[...Array(5)].map((_, i) => (
                        <span
                          key={i}
                          className={`material-symbols-outlined text-[16px] ${
                            i < review.rating ? "text-[#facc15]" : "text-gray-200"
                          }`}
                        >
                          star
                        </span>
                      ))}
                    </div>

                    {/* Comment */}
                    {review.comment && (
                      <p className="text-sm text-gray-600 leading-relaxed">
                        &ldquo;{review.comment}&rdquo;
                      </p>
                    )}
                    {!review.comment && (
                      <p className="text-sm text-gray-300 italic">Sin comentario</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

StoreReviewsList.propTypes = {
  data: PropTypes.shape({
    reviews: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        rating: PropTypes.number.isRequired,
        comment: PropTypes.string,
        is_verified_purchase: PropTypes.bool,
        created_at: PropTypes.string.isRequired,
        user: PropTypes.shape({
          full_name: PropTypes.string,
        }).isRequired,
        product: PropTypes.shape({
          id: PropTypes.string.isRequired,
          name: PropTypes.string.isRequired,
          images: PropTypes.array,
        }).isRequired,
      })
    ).isRequired,
  }),
  onClose: PropTypes.func.isRequired,
};
