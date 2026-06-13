import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getMyReviewsAPI, getStoreProductReviewsAPI, updateMyReviewAPI, deleteMyReviewAPI } from "../../services/api";
import toast from "react-hot-toast";

export default function Reviews() {
  const { user } = useAuth();
  const isStoreUser = user?.role === "store" || user?.role === "owner";
  const [activeTab, setActiveTab] = useState(isStoreUser ? "received" : "sent");

  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalReviews, setTotalReviews] = useState(0);

  const [editingId, setEditingId] = useState(null);
  const [editRating, setEditRating] = useState(0);
  const [editComment, setEditComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [hoveredStar, setHoveredStar] = useState(0);

  const fetchReviews = async (pageNum = 1, append = false) => {
    try {
      if (pageNum === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      // Depende de la pestaña activa para llamar al endpoint correspondiente
      const apiCall = activeTab === "received" ? getStoreProductReviewsAPI : getMyReviewsAPI;
      const res = await apiCall({ page: pageNum, limit: 5 });

      if (res.data && res.data.success) {
        const newReviews = res.data.data || [];
        setReviews((prev) => (append ? [...prev, ...newReviews] : newReviews));
        setHasMore(res.data.hasMore || false);
        setTotalReviews(res.data.total || 0);
        setPage(pageNum);
      }
    } catch (err) {
      console.error("Error loading reviews:", err);
      toast.error("Error al cargar las reseñas");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    setReviews([]);
    setHasMore(false);
    setTotalReviews(0);
    fetchReviews(1, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const handleLoadMore = () => {
    fetchReviews(page + 1, true);
  };

  const handleStartEdit = (review) => {
    setEditingId(review.id);
    setEditRating(review.rating);
    setEditComment(review.comment || "");
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditRating(0);
    setEditComment("");
    setHoveredStar(0);
  };

  const handleSaveEdit = async (reviewId) => {
    if (editRating < 1 || editRating > 5) {
      toast.error("Selecciona una calificación entre 1 y 5 estrellas.");
      return;
    }
    setSaving(true);
    try {
      await updateMyReviewAPI(reviewId, {
        rating: editRating,
        comment: editComment.trim() || null,
      });
      toast.success("Reseña actualizada correctamente");
      setEditingId(null);
      // Recargar la lista manteniendo la página actual
      fetchReviews(1, false);
    } catch (err) {
      toast.error(err.response?.data?.error || "Error al actualizar la reseña");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar esta reseña? Esta acción no se puede deshacer y actualizará las estadísticas del producto.")) {
      return;
    }
    try {
      toast.loading("Eliminando reseña...", { id: "delete-review" });
      await deleteMyReviewAPI(reviewId);
      toast.success("Reseña eliminada correctamente", { id: "delete-review" });
      fetchReviews(1, false);
    } catch (err) {
      toast.error(err.response?.data?.error || "Error al eliminar la reseña", { id: "delete-review" });
    }
  };

  const renderStars = (rating, interactive = false, size = 18) => {
    return (
      <div className="flex gap-1 items-center">
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = interactive
            ? star <= (hoveredStar || editRating)
            : star <= rating;
          return (
            <button
              key={star}
              type="button"
              onClick={interactive ? () => setEditRating(star) : undefined}
              onMouseEnter={interactive ? () => setHoveredStar(star) : undefined}
              onMouseLeave={interactive ? () => setHoveredStar(0) : undefined}
              disabled={!interactive}
              className={`p-0 bg-transparent border-none line-height-[1] transition-transform duration-150 ${
                interactive ? "cursor-pointer hover:scale-115" : "cursor-default"
              }`}
            >
              <span
                className="material-symbols-outlined select-none"
                style={{
                  fontSize: `${size}px`,
                  color: isFilled ? "#f59e0b" : "#e5e7eb",
                  fontVariationSettings: isFilled ? "'FILL' 1" : "'FILL' 0",
                }}
              >
                star
              </span>
            </button>
          );
        })}
      </div>
    );
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("es-VE", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {/* Header */}
      <div className="flex items-center justify-between bg-white rounded-2xl p-6 md:p-8 shadow-xs border border-gray-100">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-amber-50 text-amber-500">
            <span className="material-symbols-outlined text-[28px] fill-current">star</span>
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-800">
              {activeTab === "received" ? "Reseñas de mis Productos" : "Opiniones que he Escrito"}
            </h1>
            <p className="text-sm text-slate-400 mt-0.5">
              {activeTab === "received"
                ? `${totalReviews} ${totalReviews === 1 ? "reseña recibida" : "reseñas recibidas"} de clientes`
                : `${totalReviews} ${totalReviews === 1 ? "opinión escrita" : "opiniones escritas"}`}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs para usuarios de tipo tienda */}
      {isStoreUser && (
        <div className="flex border-b border-gray-100 bg-white rounded-2xl p-1 shadow-xs gap-1">
          <button
            onClick={() => setActiveTab("received")}
            className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === "received"
                ? "bg-purple-50 text-[#6b1e96]"
                : "text-slate-400 hover:text-slate-600 hover:bg-slate-50/50"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">
              rate_review
            </span>
            Reseñas de mis Productos
          </button>
          <button
            onClick={() => setActiveTab("sent")}
            className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === "sent"
                ? "bg-purple-50 text-[#6b1e96]"
                : "text-slate-400 hover:text-slate-600 hover:bg-slate-50/50"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">
              edit_note
            </span>
            Opiniones que he Escrito
          </button>
        </div>
      )}

      {/* Content */}
      {loading ? (
        // Skeletons
        <div className="space-y-4">
          {[1, 2].map((n) => (
            <div key={n} className="bg-white rounded-2xl p-6 border border-gray-100 animate-pulse space-y-4">
              <div className="flex gap-4">
                <div className="w-16 h-16 rounded-xl bg-slate-100 flex-shrink-0" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-1/4 bg-slate-100 rounded" />
                  <div className="h-4 w-3/4 bg-slate-100 rounded" />
                  <div className="h-3 w-1/5 bg-slate-100 rounded" />
                </div>
              </div>
              <div className="h-4 w-full bg-slate-100 rounded" />
            </div>
          ))}
        </div>
      ) : reviews.length === 0 ? (
        // Empty State
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-100 flex flex-col items-center justify-center max-w-lg mx-auto mt-6">
          <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center mb-4 text-amber-500">
            <span className="material-symbols-outlined text-[32px]">rate_review</span>
          </div>
          <h3 className="text-lg font-bold mb-2 text-slate-800">
            {activeTab === "received" ? "Aún no has recibido reseñas" : "Aún no has escrito opiniones"}
          </h3>
          <p className="text-sm mb-6 max-w-sm text-slate-400 leading-relaxed">
            {activeTab === "received"
              ? "Cuando los clientes dejen opiniones sobre tus productos, aparecerán aquí. Esto te ayudará a mejorar tu catálogo y reputación."
              : "Comparte tu experiencia con los productos que has comprado. Tus opiniones ayudan a otros profesionales odontológicos a elegir lo mejor."}
          </p>
          {activeTab === "sent" && (
            <Link
              to="/account/orders"
              className="px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all shadow-sm hover:shadow-md cursor-pointer"
              style={{ background: "#6b1e96" }}
            >
              Ver Mis Pedidos
            </Link>
          )}
        </div>
      ) : (
        // Reviews List
        <div className="space-y-4">
          {reviews.map((review) => {
            const isEditing = editingId === review.id;
            const product = review.product;

            return (
              <div
                key={review.id}
                className={`bg-white rounded-2xl p-5 md:p-6 border transition-all duration-300 ${
                  isEditing ? "border-[#6b1e96] ring-2 ring-[#6b1e96]/10" : "border-gray-100 shadow-xs"
                }`}
              >
                {/* Top Row: Product Info + Actions */}
                <div className="flex gap-4 items-start justify-between flex-wrap md:flex-nowrap mb-4">
                  <div className="flex gap-4">
                    {/* Product Image */}
                    {product?.image && (
                      <Link
                        to={`/product/${product.id}`}
                        className="w-16 h-16 rounded-xl bg-slate-50 border border-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden"
                      >
                        <img
                          src={product.image}
                          alt={product.name}
                          className="max-w-full max-h-full object-contain mix-blend-multiply"
                        />
                      </Link>
                    )}

                    {/* Product Details */}
                    <div>
                      {/* Received reviews mode: show reviewer name; Sent reviews mode: show store name */}
                      {activeTab === "received" && review.reviewer_name && (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 block mb-0.5">
                          <span className="material-symbols-outlined text-[11px] align-middle mr-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
                          {review.reviewer_name}
                        </span>
                      )}
                      {activeTab === "sent" && product?.store_name && (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#6b1e96] block mb-0.5">
                          {product.store_name}
                        </span>
                      )}
                      <Link
                        to={product ? `/product/${product.id}` : "#"}
                        className="font-bold text-sm md:text-base text-slate-800 hover:text-[#6b1e96] transition-colors line-clamp-2 leading-snug"
                      >
                        {product?.name || "Producto eliminado"}
                      </Link>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className="text-xs text-slate-400">
                          {formatDate(review.created_at)}
                        </span>
                        {review.is_verified_purchase && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100/50">
                            <span className="material-symbols-outlined text-[12px] fill-current">verified</span>
                            Compra verificada
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions: only for sent reviews (buyer mode) */}
                  {activeTab === "sent" && !isEditing && (
                    <div className="flex items-center gap-2 mt-2 md:mt-0 ml-auto md:ml-0 flex-shrink-0">
                      <button
                        onClick={() => handleStartEdit(review)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-[#6b1e96] bg-purple-50 hover:bg-purple-100 border border-purple-100 transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[14px]">edit</span>
                        Editar
                      </button>
                      <button
                        onClick={() => handleDeleteReview(review.id)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-100 transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[14px]">delete</span>
                        Eliminar
                      </button>
                    </div>
                  )}
                </div>

                {/* Rating & Comment */}
                {isEditing ? (
                  /* Edit Mode Form */
                  <div className="bg-slate-50/70 border border-slate-100 rounded-xl p-4 mt-3 space-y-4">
                    {/* Star Rating */}
                    <div>
                      <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                        Tu calificación *
                      </span>
                      {renderStars(editRating, true, 26)}
                    </div>

                    {/* Comment Area */}
                    <div>
                      <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                        Tu comentario (Opcional)
                      </span>
                      <textarea
                        value={editComment}
                        onChange={(e) => setEditComment(e.target.value)}
                        placeholder="Escribe tu opinión sobre el producto..."
                        rows={3}
                        className="w-full pl-4 pr-4 py-3 rounded-xl text-sm font-medium outline-none transition-all duration-200 focus:ring-2 focus:ring-[#6b1e96]/30 bg-white border border-slate-200 focus:border-[#6b1e96] resize-y"
                      />
                    </div>

                    {/* Action buttons */}
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={handleCancelEdit}
                        disabled={saving}
                        className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 bg-slate-200/80 hover:bg-slate-200 transition-colors cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={() => handleSaveEdit(review.id)}
                        disabled={saving}
                        className="flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-black text-white transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        style={{ background: "#6b1e96" }}
                      >
                        {saving ? (
                          <>
                            <span className="material-symbols-outlined text-[14px] animate-spin">sync</span>
                            Guardando...
                          </>
                        ) : (
                          <>
                            <span className="material-symbols-outlined text-[14px]">check</span>
                            Guardar
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Read Mode Layout */
                  <div className="mt-2 pl-0.5">
                    <div className="mb-2">
                      {renderStars(review.rating, false, 18)}
                    </div>
                    {review.comment ? (
                      <p className="text-sm text-slate-600 leading-relaxed bg-slate-50/40 p-3 rounded-xl border border-slate-100/50">
                        {review.comment}
                      </p>
                    ) : (
                      <p className="text-xs text-slate-350 italic">Sin comentario escrito.</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Load More Button */}
          {hasMore && (
            <div className="text-center pt-4">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold border border-slate-200 bg-white text-[#6b1e96] hover:bg-purple-50 transition-all shadow-xs cursor-pointer"
              >
                {loadingMore ? (
                  <>
                    <span className="material-symbols-outlined text-[18px] animate-spin">sync</span>
                    Cargando...
                  </>
                ) : (
                  <>
                    Cargar más reseñas
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
