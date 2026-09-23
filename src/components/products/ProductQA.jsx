import { useState, useEffect, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";
import PropTypes from "prop-types";

const MAX_QUESTION = 500;
const MAX_ANSWER = 2000;
const PAGE_SIZE = 10;

const BTN_PRIMARY =
  "bg-[#6b1e96] hover:bg-[#4f0077] text-white font-bold rounded-xl px-5 py-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6b1e96] focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
const BTN_SECONDARY =
  "border border-[#6b1e96] text-[#6b1e96] hover:bg-[#6b1e96]/5 font-semibold rounded-xl px-5 py-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6b1e96]";

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString("es-VE", { day: "2-digit", month: "short", year: "numeric" })
    : "";

export default function ProductQA({ productId, storeOwnerId }) {
  const { user } = useAuth();
  const location = useLocation();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const [newQuestion, setNewQuestion] = useState("");
  const [isSubmittingQ, setIsSubmittingQ] = useState(false);

  // Responder
  const [replyText, setReplyText] = useState("");
  const [activeReplyId, setActiveReplyId] = useState(null);
  const [isReplying, setIsReplying] = useState(false);

  const isStoreOwner = !!user && !!storeOwnerId && user.id === storeOwnerId;
  const isStaff = user?.role === "admin" || user?.role === "owner";
  const canAnswer = isStoreOwner || isStaff;

  const fetchPage = useCallback(
    async (pageToLoad) => {
      const res = await api.get(`/products/${productId}/questions`, {
        params: { page: pageToLoad, limit: PAGE_SIZE },
      });
      const data = res.data?.data || [];
      const total = typeof res.data?.total === "number" ? res.data.total : null;
      return { data, total };
    },
    [productId],
  );

  const loadFirstPage = useCallback(async () => {
    if (!productId) return;
    setLoading(true);
    setError(null);
    try {
      const { data, total } = await fetchPage(1);
      setQuestions(data);
      setPage(1);
      setHasMore(total != null ? data.length < total : false);
    } catch (err) {
      console.error("Error cargando preguntas:", err);
      setError(err.response?.data?.error || "No pudimos cargar las preguntas.");
    } finally {
      setLoading(false);
    }
  }, [productId, fetchPage]);

  useEffect(() => {
    loadFirstPage();
  }, [loadFirstPage]);

  const handleLoadMore = async () => {
    if (loadingMore) return;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const { data, total } = await fetchPage(nextPage);
      // Si el servidor ignora la paginación y repite filas, no las duplicamos.
      const seen = new Set(questions.map((q) => q.id));
      const fresh = data.filter((q) => !seen.has(q.id));
      const merged = [...questions, ...fresh];
      setQuestions(merged);
      setPage(nextPage);
      setHasMore(fresh.length > 0 && (total != null ? merged.length < total : data.length === PAGE_SIZE));
    } catch (err) {
      toast.error(err.response?.data?.error || "No pudimos cargar más preguntas.");
    } finally {
      setLoadingMore(false);
    }
  };

  const handleAsk = async (e) => {
    e.preventDefault();
    if (!user) return toast.error("Inicia sesión para preguntar.");
    if (isSubmittingQ || !newQuestion.trim()) return;

    try {
      setIsSubmittingQ(true);
      await api.post(`/products/${productId}/questions`, { question: newQuestion.trim() });
      toast.success("Tu pregunta fue publicada.");
      setNewQuestion("");
      await loadFirstPage();
    } catch (err) {
      const msg =
        err.response?.status === 429
          ? err.response?.data?.error || "Has enviado muchas preguntas seguidas. Inténtalo de nuevo en unos minutos."
          : err.response?.data?.error || "No pudimos publicar tu pregunta.";
      toast.error(msg);
    } finally {
      setIsSubmittingQ(false);
    }
  };

  const handleReply = async (questionId) => {
    if (!replyText.trim() || isReplying) return;

    try {
      setIsReplying(true);
      await api.post(`/products/questions/${questionId}/reply`, { answer: replyText.trim() });
      toast.success("Respuesta publicada");
      setReplyText("");
      setActiveReplyId(null);
      await loadFirstPage();
    } catch (err) {
      toast.error(err.response?.data?.error || "No pudimos publicar la respuesta.");
    } finally {
      setIsReplying(false);
    }
  };

  const loginHref = `/login?redirect=${encodeURIComponent(location.pathname + location.search)}`;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-12">
      {/* HACER PREGUNTA */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-xl font-bold font-['Manrope'] mb-2 text-[#191c20]">Pregúntale a la tienda</h3>
        <p className="text-sm text-gray-500 mb-4">
          ¿Tienes dudas sobre disponibilidad, especificaciones o envíos? Deja tu pregunta aquí.
        </p>
        {user ? (
          <form onSubmit={handleAsk} className="space-y-1">
            <div className="flex flex-col sm:flex-row gap-3">
              <label htmlFor="qa-new-question" className="sr-only">
                Tu pregunta
              </label>
              <input
                id="qa-new-question"
                type="text"
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value.slice(0, MAX_QUESTION))}
                maxLength={MAX_QUESTION}
                placeholder="Ej: ¿Sirven para lámparas halógenas?"
                aria-describedby="qa-new-question-count"
                className="flex-1 min-w-0 px-4 py-3 rounded-xl border border-gray-200 focus:border-[#6b1e96] focus:ring-1 focus:ring-[#6b1e96] outline-none text-sm text-[#191c20]"
              />
              <button
                type="submit"
                disabled={isSubmittingQ || !newQuestion.trim()}
                className={`${BTN_PRIMARY} whitespace-nowrap`}
              >
                {isSubmittingQ ? "Enviando..." : "Preguntar"}
              </button>
            </div>
            <p id="qa-new-question-count" className="text-xs text-gray-400">
              {newQuestion.length}/{MAX_QUESTION}
            </p>
          </form>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#6b1e96]/5 border border-[#6b1e96]/15 rounded-xl p-4">
            <p className="text-sm text-[#6b1e96] font-medium">Inicia sesión para preguntar.</p>
            <Link to={loginHref} className={`${BTN_SECONDARY} text-sm text-center`}>
              Iniciar sesión
            </Link>
          </div>
        )}
      </div>

      {/* LISTA DE PREGUNTAS */}
      <div className="space-y-6">
        <h3 className="text-xl font-bold font-['Manrope'] text-[#191c20] border-b pb-4">Preguntas y respuestas</h3>

        {loading ? (
          <div className="space-y-4" aria-busy="true">
            {[0, 1].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 animate-pulse h-24" />
            ))}
          </div>
        ) : error ? (
          <div role="alert" className="text-center py-10 bg-gray-50 rounded-2xl">
            <span className="material-symbols-outlined text-gray-300 text-[48px] mb-2" aria-hidden="true">cloud_off</span>
            <p className="text-[#191c20] font-bold mb-1">No pudimos cargar las preguntas</p>
            <p className="text-gray-500 text-sm mb-4">{error}</p>
            <button type="button" onClick={loadFirstPage} className={BTN_SECONDARY}>
              Reintentar
            </button>
          </div>
        ) : questions.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-2xl">
            <span className="material-symbols-outlined text-gray-300 text-[48px] mb-2" aria-hidden="true">forum</span>
            <h4 className="text-lg font-bold font-['Manrope'] text-[#191c20] mb-1">Aún no hay preguntas</h4>
            <p className="text-gray-500 text-sm">Si tienes una duda, puedes ser la primera persona en preguntar.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {questions.map((q) => {
              const askerName = q.asker?.full_name || "Comprador";
              const answerLabel = q.responder_role === "admin" ? "Respuesta de Forcepx" : "Respuesta de la tienda";
              const isReplyOpen = activeReplyId === q.id;

              return (
                <div key={q.id} className="bg-white border text-sm border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                  {/* Pregunta */}
                  <div className="p-5 flex gap-4 items-start">
                    <span className="material-symbols-outlined text-gray-300 mt-0.5" aria-hidden="true">help</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[#191c20] leading-relaxed break-words">{q.question}</p>
                      <p className="text-xs text-gray-400 mt-2">
                        Preguntado por {askerName} · {formatDate(q.created_at)}
                      </p>
                    </div>
                  </div>

                  {/* Respuesta */}
                  {q.answer ? (
                    <div className="p-5 sm:pl-14 pt-4 border-t bg-[#6b1e96]/5 border-[#6b1e96]/10">
                      <div className="flex gap-4 items-start">
                        <span className="material-symbols-outlined mt-0.5 text-[#6b1e96]" aria-hidden="true">forum</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <p className="font-bold text-[#6b1e96]">{answerLabel}</p>
                            <span className="material-symbols-outlined text-[#6b1e96] text-[16px]" aria-hidden="true">verified</span>
                          </div>
                          <p className="text-gray-700 leading-relaxed break-words whitespace-pre-line">{q.answer}</p>
                          {q.answered_at && <p className="text-xs text-gray-500 mt-2">{formatDate(q.answered_at)}</p>}
                        </div>
                      </div>
                    </div>
                  ) : (
                    canAnswer && (
                      <div className="p-5 sm:pl-14 pt-4 border-t bg-gray-50 border-gray-100 flex gap-4">
                        <span className="material-symbols-outlined text-gray-300" aria-hidden="true">reply</span>
                        <div className="flex-1 min-w-0">
                          {isReplyOpen ? (
                            <div className="space-y-2">
                              <label htmlFor={`qa-reply-${q.id}`} className="sr-only">
                                Tu respuesta
                              </label>
                              <textarea
                                id={`qa-reply-${q.id}`}
                                autoFocus
                                rows={3}
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value.slice(0, MAX_ANSWER))}
                                maxLength={MAX_ANSWER}
                                placeholder="Escribe la respuesta..."
                                aria-describedby={`qa-reply-count-${q.id}`}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#6b1e96] focus:ring-1 focus:ring-[#6b1e96] outline-none text-sm text-[#191c20]"
                              />
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <p id={`qa-reply-count-${q.id}`} className="text-xs text-gray-400">
                                  {replyText.length}/{MAX_ANSWER}
                                </p>
                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveReplyId(null);
                                      setReplyText("");
                                    }}
                                    disabled={isReplying}
                                    className="text-gray-500 hover:text-gray-700 px-3 font-medium rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6b1e96] disabled:opacity-50"
                                  >
                                    Cancelar
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleReply(q.id)}
                                    disabled={isReplying || !replyText.trim()}
                                    className={BTN_PRIMARY}
                                  >
                                    {isReplying ? "Publicando..." : "Publicar respuesta"}
                                  </button>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setActiveReplyId(q.id);
                                setReplyText("");
                              }}
                              className="text-[#6b1e96] font-semibold hover:underline rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6b1e96]"
                            >
                              {isStoreOwner ? "Responder como tienda" : "Responder como Forcepx"}
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  )}
                </div>
              );
            })}

            {hasMore && (
              <div className="text-center">
                <button type="button" onClick={handleLoadMore} disabled={loadingMore} className={BTN_SECONDARY}>
                  {loadingMore ? "Cargando..." : "Ver más"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

ProductQA.propTypes = {
  productId: PropTypes.string.isRequired,
  storeOwnerId: PropTypes.string,
};
