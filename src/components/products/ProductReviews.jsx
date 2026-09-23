import { useState, useEffect, useCallback, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";
import PropTypes from "prop-types";

const MAX_COMMENT = 1000;
const PAGE_SIZE = 10;

const BTN_PRIMARY =
  "bg-[#6b1e96] hover:bg-[#4f0077] text-white font-bold rounded-xl px-5 py-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6b1e96] focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
const BTN_SECONDARY =
  "border border-[#6b1e96] text-[#6b1e96] hover:bg-[#6b1e96]/5 font-semibold rounded-xl px-5 py-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6b1e96]";

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString("es-VE", { day: "2-digit", month: "short", year: "numeric" })
    : "";

// Más recientes primero, aunque el servidor cambie el orden.
const sortRecent = (list) =>
  [...list].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

export default function ProductReviews({ productId, onReviewAdded }) {
  const { user } = useAuth();
  const location = useLocation();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Formulario
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [canReviewState, setCanReviewState] = useState({ loading: true, canReview: false, reason: null });
  const starRefs = useRef([]);

  const fetchReviews = useCallback(async () => {
    if (!productId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/products/${productId}/reviews`);
      setReviews(sortRecent(res.data?.data || []));
    } catch (err) {
      console.error("Error cargando reseñas:", err);
      setError(err.response?.data?.error || "No pudimos cargar las reseñas.");
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
    fetchReviews();
  }, [fetchReviews]);

  useEffect(() => {
    if (!productId) return;
    if (!user) {
      setCanReviewState({ loading: false, canReview: false, reason: "needs_auth" });
      return;
    }
    let cancelled = false;
    setCanReviewState({ loading: true, canReview: false, reason: null });
    api
      .get(`/products/${productId}/reviews/can-review`)
      .then((res) => {
        if (!cancelled) setCanReviewState({ loading: false, canReview: res.data.canReview, reason: res.data.reason });
      })
      .catch(() => {
        if (!cancelled) setCanReviewState({ loading: false, canReview: false, reason: "error" });
      });
    return () => {
      cancelled = true;
    };
  }, [productId, user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error("Inicia sesión para calificar.");
      return;
    }
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      setSubmitError(null);
      await api.post(`/products/${productId}/reviews`, { rating, comment: comment.trim() });
      toast.success("Reseña publicada.");
      setComment("");
      setRating(5);
      await fetchReviews();
      if (onReviewAdded) onReviewAdded();
    } catch (err) {
      const data = err.response?.data;
      const msg = data?.error || "No pudimos publicar la reseña.";
      // La tienda dueña no puede reseñar su producto: mostramos el aviso fijo en el formulario.
      if (data?.code === "OWN_PRODUCT" || err.response?.status === 403) {
        setSubmitError(msg);
      }
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStarKeyDown = (e, star) => {
    let next = null;
    if (e.key === "ArrowRight" || e.key === "ArrowUp") next = Math.min(5, star + 1);
    else if (e.key === "ArrowLeft" || e.key === "ArrowDown") next = Math.max(1, star - 1);
    else if (e.key === "Home") next = 1;
    else if (e.key === "End") next = 5;
    if (next == null) return;
    e.preventDefault();
    setRating(next);
    starRefs.current[next - 1]?.focus();
  };

  const visibleReviews = reviews.slice(0, visibleCount);
  const loginHref = `/login?redirect=${encodeURIComponent(location.pathname + location.search)}`;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-12">
      {/* CREAR RESEÑA */}
      {user ? (
        canReviewState.loading ? (
          <div className="bg-white p-6 rounded-2xl border border-gray-100 animate-pulse h-32" />
        ) : canReviewState.canReview ? (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-xl font-bold font-['Manrope'] mb-4 text-[#191c20]">Deja tu reseña</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <span id="review-rating-label" className="block text-sm font-medium text-gray-700 mb-2">
                  Calificación
                </span>
                <div role="group" aria-labelledby="review-rating-label" className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      ref={(el) => (starRefs.current[star - 1] = el)}
                      onClick={() => setRating(star)}
                      onKeyDown={(e) => handleStarKeyDown(e, star)}
                      aria-label={`${star} ${star === 1 ? "estrella" : "estrellas"}`}
                      aria-pressed={star === rating}
                      tabIndex={star === rating ? 0 : -1}
                      className="rounded-lg transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6b1e96] focus-visible:ring-offset-2"
                    >
                      <span
                        aria-hidden="true"
                        className={`material-symbols-outlined text-[32px] ${star <= rating ? "text-[#facc15]" : "text-gray-200"}`}
                      >
                        star
                      </span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label htmlFor="review-comment" className="block text-sm font-medium text-gray-700 mb-2">
                  Comentario (opcional)
                </label>
                <textarea
                  id="review-comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value.slice(0, MAX_COMMENT))}
                  maxLength={MAX_COMMENT}
                  rows={3}
                  placeholder="¿Qué te pareció este producto? Tu opinión ayuda a otros profesionales."
                  aria-describedby="review-comment-count"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#6b1e96] focus:ring-1 focus:ring-[#6b1e96] outline-none transition-colors text-sm text-[#191c20]"
                />
                <p id="review-comment-count" className="mt-1 text-right text-xs text-gray-400">
                  {comment.length}/{MAX_COMMENT}
                </p>
              </div>
              {submitError && (
                <p role="alert" className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                  {submitError}
                </p>
              )}
              <button type="submit" disabled={isSubmitting} className={BTN_PRIMARY}>
                {isSubmitting ? "Publicando..." : "Publicar reseña"}
              </button>
            </form>
          </div>
        ) : canReviewState.reason === "error" ? (
          <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
            <p className="text-sm text-gray-600">No pudimos comprobar si puedes reseñar este producto. Recarga la página en un momento.</p>
          </div>
        ) : canReviewState.reason === "own_product" ? (
          <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
            <p className="text-sm text-gray-600">Este producto es de tu tienda, así que no puedes reseñarlo.</p>
          </div>
        ) : (
          <div className="bg-[#6b1e96]/5 p-6 rounded-2xl border border-[#6b1e96]/15 flex items-center gap-4">
            <span className="material-symbols-outlined text-[#6b1e96] text-[32px]" aria-hidden="true">info</span>
            <div>
              <h4 className="text-[#191c20] font-bold font-['Manrope'] mb-1">Reseñas solo con compra verificada</h4>
              <p className="text-gray-600 text-sm">
                Para calificar este producto necesitas haberlo comprado y que tu pedido esté aprobado.
              </p>
            </div>
          </div>
        )
      ) : (
        <div className="bg-[#6b1e96]/5 p-6 rounded-2xl border border-[#6b1e96]/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-[#6b1e96] font-medium">Inicia sesión para calificar este producto.</p>
          <Link to={loginHref} className={`${BTN_SECONDARY} text-sm text-center`}>
            Iniciar sesión
          </Link>
        </div>
      )}

      {/* LISTA DE RESEÑAS */}
      <div className="space-y-6">
        <h3 className="text-xl font-bold font-['Manrope'] text-[#191c20] border-b pb-4">
          Reseñas de la comunidad {!loading && !error && `(${reviews.length})`}
        </h3>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6" aria-busy="true">
            {[0, 1].map((i) => (
              <div key={i} className="bg-white p-5 rounded-2xl border border-gray-100 animate-pulse h-32" />
            ))}
          </div>
        ) : error ? (
          <div role="alert" className="text-center py-10 bg-gray-50 rounded-2xl">
            <span className="material-symbols-outlined text-gray-300 text-[48px] mb-2" aria-hidden="true">cloud_off</span>
            <p className="text-[#191c20] font-bold mb-1">No pudimos cargar las reseñas</p>
            <p className="text-gray-500 text-sm mb-4">{error}</p>
            <button type="button" onClick={fetchReviews} className={BTN_SECONDARY}>
              Reintentar
            </button>
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-2xl">
            <span className="material-symbols-outlined text-gray-300 text-[48px] mb-2" aria-hidden="true">rate_review</span>
            <h4 className="text-lg font-bold font-['Manrope'] text-[#191c20] mb-1">Aún no hay reseñas</h4>
            <p className="text-gray-500 text-sm">Cuando alguien califique este producto, lo verás aquí.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {visibleReviews.map((rev) => (
                <div key={rev.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-10 h-10 shrink-0 rounded-full bg-[#6b1e96]/10 flex items-center justify-center text-[#6b1e96] font-bold"
                        aria-hidden="true"
                      >
                        {rev.users?.full_name?.charAt(0)?.toUpperCase() || "U"}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-[#191c20] truncate">{rev.users?.full_name || "Usuario"}</p>
                        <p className="text-xs text-gray-400">{formatDate(rev.created_at)}</p>
                      </div>
                    </div>
                    {rev.is_verified_purchase && (
                      <span className="shrink-0 text-[11px] text-[#6b1e96] bg-[#6b1e96]/5 font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]" aria-hidden="true">verified</span>
                        Compra verificada
                      </span>
                    )}
                  </div>

                  <div className="flex gap-0.5 mb-2" role="img" aria-label={`${rev.rating} de 5 estrellas`}>
                    {[...Array(5)].map((_, i) => (
                      <span
                        key={i}
                        aria-hidden="true"
                        className={`material-symbols-outlined text-[16px] ${i < rev.rating ? "text-[#facc15]" : "text-gray-200"}`}
                      >
                        star
                      </span>
                    ))}
                  </div>

                  {rev.comment && (
                    <p className="text-sm text-gray-600 leading-relaxed break-words">{rev.comment}</p>
                  )}
                </div>
              ))}
            </div>
            {reviews.length > visibleCount && (
              <div className="text-center">
                <button type="button" onClick={() => setVisibleCount((c) => c + PAGE_SIZE)} className={BTN_SECONDARY}>
                  Ver más
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

ProductReviews.propTypes = {
  productId: PropTypes.string.isRequired,
  onReviewAdded: PropTypes.func,
};
