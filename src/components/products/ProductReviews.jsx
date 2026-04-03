import { useState, useEffect } from "react";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";
import PropTypes from "prop-types";

export default function ProductReviews({ productId, onReviewAdded }) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [canReviewState, setCanReviewState] = useState({ loading: true, canReview: false, reason: null });

  useEffect(() => {
    if (!productId) return;
    const fetchReviews = async () => {
      try {
        const res = await api.get(`/products/${productId}/reviews`);
        setReviews(res.data.data || []);
      } catch (error) {
        console.error("Error cargando reseñas:", error);
      } finally {
        setLoading(false);
      }
    };

    const fetchCanReview = async () => {
      if (!user) {
        setCanReviewState({ loading: false, canReview: false, reason: "needs_auth" });
        return;
      }
      try {
        const res = await api.get(`/products/${productId}/reviews/can-review`);
        setCanReviewState({ loading: false, canReview: res.data.canReview, reason: res.data.reason });
      } catch {
        setCanReviewState({ loading: false, canReview: false, reason: "error" });
      }
    };

    fetchReviews();
    fetchCanReview();
  }, [productId, user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error("Debes iniciar sesión para calificar.");
      return;
    }

    try {
      setIsSubmitting(true);
      await api.post(`/products/${productId}/reviews`, { rating, comment });
      toast.success("Reseña publicada con éxito.");
      setComment("");
      setRating(5);
      
      // Reload reviews
      const res = await api.get(`/products/${productId}/reviews`);
      setReviews(res.data.data || []);
      
      if (onReviewAdded) onReviewAdded(); // trigger parent update for avg stars
    } catch (error) {
      toast.error(error.response?.data?.error || "Error al publicar la reseña.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-12">
      {/* SECCIÓN CREAR RESEÑA */}
      {user ? (
        canReviewState.loading ? (
           <div className="bg-white p-6 rounded-2xl border border-gray-100 animate-pulse h-32"></div>
        ) : canReviewState.canReview ? (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-xl font-bold font-['Manrope'] mb-4 text-[#160a22]">Deja tu reseña</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Calificación</label>
                <div className="flex gap-1 text-[#facc15]">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setRating(star)}
                      className="focus:outline-none transition-transform hover:scale-110"
                    >
                       <span className={`material-symbols-outlined text-[32px] ${star <= rating ? 'text-[#facc15]' : 'text-gray-200'}`}>star</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Comentario (opcional)</label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={3}
                  placeholder="¿Qué te pareció este producto? Tu opinión ayuda a otros profesionales."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#6b1e96] focus:ring-1 focus:ring-[#6b1e96] outline-none transition-colors text-sm text-gray-700"
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-[#c3ff00] text-[#4d6600] font-bold py-3 px-8 rounded-xl shadow-sm hover:shadow-md transition-all disabled:opacity-50"
              >
                {isSubmitting ? "Publicando..." : "Publicar Reseña"}
              </button>
            </form>
          </div>
        ) : (
          <div className="bg-yellow-50 p-6 rounded-2xl border border-yellow-200 flex items-center gap-4 shadow-sm">
             <span className="material-symbols-outlined text-yellow-600 text-[32px]">warning</span>
             <div>
                <h4 className="text-yellow-800 font-bold mb-1">Reseñas Restringidas</h4>
                <p className="text-yellow-700 text-sm">
                   El administrador de la plataforma ha activado el modo <strong>&quot;Solo Compras Verificadas&quot;</strong>. 
                   Debes comprar este producto y que tu orden sea aprobada para poder calificarlo.
                </p>
             </div>
          </div>
        )
      ) : (
        <div className="bg-purple-50 p-6 rounded-2xl border border-purple-100 flex items-center justify-between">
          <p className="text-[#6b1e96] font-medium">Inicia sesión como comprador para calificar e interactuar.</p>
        </div>
      )}

      {/* SECCIÓN LISTA DE RESEÑAS */}
      <div className="space-y-6">
        <h3 className="text-xl font-bold font-['Manrope'] text-[#160a22] border-b pb-4">
          Reseñas de la Comunidad ({reviews.length})
        </h3>
        
        {loading ? (
          <p className="text-gray-400">Cargando opiniones...</p>
        ) : reviews.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-2xl">
            <span className="material-symbols-outlined text-gray-300 text-[48px] mb-2">rate_review</span>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Aún no hay reseñas visibles</h3>
            <p className="text-gray-500 text-sm">Sé el primero en calificar este artículo.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {reviews.map((rev) => (
              <div key={rev.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 relative">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
                       {rev.users?.full_name?.charAt(0) || "U"}
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-gray-900">{rev.users?.full_name || "Usuario verificado"}</p>
                      <p className="text-xs text-gray-400">{new Date(rev.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  {rev.is_verified_purchase && (
                    <span className="text-xs bg-green-50 text-green-700 font-bold px-2 py-1 rounded border border-green-200 flex items-center gap-1">
                       <span className="material-symbols-outlined text-[14px]">verified</span>
                       Compra Verificada
                    </span>
                  )}
                </div>
                
                <div className="flex gap-0.5 text-[#facc15] mb-2">
                  {[...Array(5)].map((_, i) => (
                     <span key={i} className={`material-symbols-outlined text-[16px] ${i < rev.rating ? 'text-[#facc15]' : 'text-gray-200'}`}>star</span>
                  ))}
                </div>
                
                {rev.comment && (
                  <p className="text-sm text-gray-600 leading-relaxed italic">
                    &quot;{rev.comment}&quot;
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

ProductReviews.propTypes = {
  productId: PropTypes.string.isRequired,
  onReviewAdded: PropTypes.func,
};
