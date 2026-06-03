import PropTypes from "prop-types";

export default function ReputationWidget({ reputation = {}, loading = false }) {
  if (loading) {
    return (
      <div className="rounded-2xl p-5 animate-pulse" style={{ background: "rgba(107,30,150,0.04)", border: "1px solid rgba(107,30,150,0.06)" }}>
        <div className="h-4 w-24 bg-gray-200 rounded mb-4" />
        <div className="h-12 w-20 bg-gray-200 rounded mx-auto mb-3" />
        <div className="h-3 w-32 bg-gray-100 rounded mx-auto" />
      </div>
    );
  }

  const { avgRating = 0, totalReviews = 0, unansweredQuestions = 0, cancellationsThisMonth = 0 } = reputation;
  const fullStars = Math.floor(avgRating);
  const hasHalf = avgRating - fullStars >= 0.3;
  const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0);

  const getRatingLabel = (r) => {
    if (r >= 4.5) return { text: "Excelente", color: "#10b981" };
    if (r >= 4.0) return { text: "Muy bueno", color: "#3b82f6" };
    if (r >= 3.0) return { text: "Bueno", color: "#f59e0b" };
    if (r > 0) return { text: "Mejorable", color: "#ef4444" };
    return { text: "Sin reseñas", color: "#9ca3af" };
  };
  const ratingInfo = getRatingLabel(avgRating);

  const StarFilled = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-amber-400">
      <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z" clipRule="evenodd" />
    </svg>
  );
  const StarEmpty = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-gray-300">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
    </svg>
  );

  return (
    <div className="rounded-2xl p-5" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.97) 0%, rgba(250,248,255,0.97) 100%)", border: "1px solid rgba(107,30,150,0.06)" }}>
      <div className="flex items-center gap-2 mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-amber-400">
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
        </svg>
        <h3 className="text-sm font-bold text-gray-700">Reputación</h3>
      </div>

      <div className="text-center mb-3">
        <p className="text-4xl font-extrabold text-gray-800 mb-1">{avgRating > 0 ? avgRating.toFixed(1) : "—"}</p>
        <div className="flex items-center justify-center gap-0.5 mb-1.5">
          {Array.from({ length: fullStars }).map((_, i) => <StarFilled key={`f${i}`} />)}
          {hasHalf && <StarFilled />}
          {Array.from({ length: emptyStars }).map((_, i) => <StarEmpty key={`e${i}`} />)}
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full" style={{ background: `${ratingInfo.color}15`, color: ratingInfo.color }}>
          {ratingInfo.text}
        </span>
      </div>

      <div className="space-y-2 pt-3 border-t border-gray-100">
        <div className="flex items-center justify-between px-2">
          <span className="text-xs text-gray-500">Reseñas totales</span>
          <span className="text-xs font-bold text-gray-700">{totalReviews}</span>
        </div>
        <div className="flex items-center justify-between px-2">
          <span className="text-xs text-gray-500">Preguntas sin responder</span>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${unansweredQuestions > 0 ? "bg-red-50 text-red-600" : "text-gray-400"}`}>
            {unansweredQuestions}
          </span>
        </div>
        <div className="flex items-center justify-between px-2">
          <span className="text-xs text-gray-500">Cancelaciones (mes)</span>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${cancellationsThisMonth >= 5 ? "bg-red-50 text-red-600" : cancellationsThisMonth > 0 ? "bg-amber-50 text-amber-600" : "text-gray-400"}`}>
            {cancellationsThisMonth}
          </span>
        </div>
        {cancellationsThisMonth >= 5 && (
          <div className="mt-2 mx-1 px-3 py-2 rounded-lg text-[10px] font-bold" style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.12)", color: "#dc2626" }}>
            ⚠️ Índice de cancelaciones alto. Esto puede afectar la reputación de tu tienda.
          </div>
        )}
      </div>
    </div>
  );
}

ReputationWidget.propTypes = {
  reputation: PropTypes.shape({ avgRating: PropTypes.number, totalReviews: PropTypes.number, unansweredQuestions: PropTypes.number, cancellationsThisMonth: PropTypes.number }),
  loading: PropTypes.bool,
};
