import { Link } from "react-router-dom";
import PropTypes from "prop-types";

export default function StoreRatingBreakdown({ data, onClose }) {
  if (!data) return null;

  const { ratingBreakdown, ratedProducts, summary } = data;
  const maxCount = Math.max(...Object.values(ratingBreakdown), 1);

  const starLabels = [5, 4, 3, 2, 1];
  const barColors = {
    5: "bg-emerald-500",
    4: "bg-lime-500",
    3: "bg-yellow-400",
    2: "bg-orange-400",
    1: "bg-red-400",
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_8px_30px_rgba(107,30,150,0.08)] overflow-hidden animate-in">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px] text-[#c3ff00]">insights</span>
          <h3 className="text-lg font-bold text-[#160a22] font-['Manrope']">Desglose de Reputación</h3>
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

      <div className="p-6">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Left: Rating Summary */}
          <div className="flex flex-col items-center justify-center min-w-[140px]">
            <span className="text-5xl font-bold text-[#6b1e96] font-['Manrope'] leading-none">
              {summary.globalRating.toFixed(1)}
            </span>
            <div className="flex gap-0.5 mt-2 mb-1">
              {[...Array(5)].map((_, i) => (
                <span
                  key={i}
                  className={`material-symbols-outlined text-[20px] ${
                    i < Math.round(summary.globalRating) ? "text-[#facc15]" : "text-gray-200"
                  }`}
                >
                  star
                </span>
              ))}
            </div>
            <p className="text-xs text-gray-400 font-medium text-center mt-1">
              Basado en {summary.totalReviews} reseña{summary.totalReviews !== 1 ? "s" : ""}
            </p>
          </div>

          {/* Right: Bar Chart */}
          <div className="flex-1 space-y-2.5">
            {starLabels.map((stars) => {
              const count = ratingBreakdown[stars] || 0;
              const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;

              return (
                <div key={stars} className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-gray-500 w-6 text-right">{stars}</span>
                  <span className="material-symbols-outlined text-[14px] text-[#facc15]">star</span>
                  <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ease-out ${barColors[stars]}`}
                      style={{ width: `${percentage}%`, minWidth: count > 0 ? "8px" : "0" }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-400 w-8 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Rated Products */}
        {ratedProducts.length > 0 && (
          <div className="mt-8 pt-6 border-t border-gray-50">
            <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 font-['Inter']">
              Productos con Reseñas
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {ratedProducts.map((product) => (
                <Link
                  key={product.id}
                  to={`/product/${product.id}`}
                  className="flex items-center gap-3 p-3 rounded-xl bg-gray-50/70 hover:bg-[#6b1e96]/5 border border-transparent hover:border-[#6b1e96]/10 transition-all group"
                >
                  <div className="w-12 h-12 rounded-lg bg-white border border-gray-100 overflow-hidden flex-shrink-0 flex items-center justify-center">
                    {product.images[0] ? (
                      <img src={product.images[0]} alt={product.name} className="w-full h-full object-contain p-1" />
                    ) : (
                      <span className="material-symbols-outlined text-gray-300 text-[20px]">inventory_2</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate group-hover:text-[#6b1e96] transition-colors">
                      {product.name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="flex gap-px">
                        {[...Array(5)].map((_, i) => (
                          <span
                            key={i}
                            className={`material-symbols-outlined text-[12px] ${
                              i < Math.round(product.rating_avg) ? "text-[#facc15]" : "text-gray-200"
                            }`}
                          >
                            star
                          </span>
                        ))}
                      </div>
                      <span className="text-[10px] text-gray-400 font-medium">
                        {product.review_count} reseña{product.review_count !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-[16px] text-gray-300 group-hover:text-[#6b1e96] transition-colors">
                    chevron_right
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

StoreRatingBreakdown.propTypes = {
  data: PropTypes.shape({
    ratingBreakdown: PropTypes.object.isRequired,
    ratedProducts: PropTypes.array.isRequired,
    summary: PropTypes.shape({
      totalReviews: PropTypes.number.isRequired,
      globalRating: PropTypes.number.isRequired,
    }).isRequired,
  }),
  onClose: PropTypes.func.isRequired,
};
