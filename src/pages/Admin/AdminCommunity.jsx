import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import PropTypes from "prop-types";
import toast from "react-hot-toast";
import {
  getAdminCommunityReviewsAPI,
  hideCommunityReviewAPI,
  unhideCommunityReviewAPI,
  deleteCommunityReviewAPI,
  getAdminCommunityQuestionsAPI,
  updateCommunityQuestionStatusAPI,
  deleteCommunityQuestionAPI,
} from "../../services/api";

const PAGE_SIZE = 20;

const BTN_PRIMARY =
  "bg-[#6b1e96] hover:bg-[#4f0077] text-white font-bold rounded-xl px-5 py-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6b1e96] focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
const BTN_SECONDARY =
  "border border-[#6b1e96] text-[#6b1e96] hover:bg-[#6b1e96]/5 font-semibold rounded-xl px-5 py-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6b1e96]";
const BTN_ROW =
  "inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6b1e96] disabled:opacity-50 disabled:cursor-not-allowed";

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString("es-VE", { day: "2-digit", month: "short", year: "numeric" })
    : "—";

const serverError = (err, fallback) => err?.response?.data?.error || err?.response?.data?.message || fallback;

// El backend puede mandar las relaciones con distintos alias; tomamos el primero que exista.
const productOf = (row) => row.product || row.products || null;
const storeOf = (row) =>
  row.store || row.store_profiles || productOf(row)?.store_profiles || productOf(row)?.store || null;
const authorOf = (row) =>
  row.author || row.user || row.users || row.asker ||
  (row.author_name || row.asker_name ? { full_name: row.author_name || row.asker_name } : null);
const isHidden = (row) => Boolean(row.is_hidden ?? row.hidden ?? row.hidden_at);

const QUESTION_STATUS = {
  pending: { label: "Sin responder", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  answered: { label: "Respondida", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  rejected: { label: "Rechazada", cls: "bg-red-50 text-red-700 border-red-200" },
};

// ─────────────────────────────────────────────────────────────
// Lista paginada genérica: carga, error, vacío y paginación
// ─────────────────────────────────────────────────────────────
function usePagedList(fetcher, filterParams) {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetcher({ ...filterParams, page, limit: PAGE_SIZE });
      setRows(res.data?.data || []);
      setTotal(typeof res.data?.total === "number" ? res.data.total : null);
    } catch (err) {
      setError(serverError(err, "No pudimos cargar la lista."));
    } finally {
      setLoading(false);
    }
    // filterParams se serializa para no recargar por identidad del objeto
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetcher, page, JSON.stringify(filterParams)]);

  useEffect(() => {
    load();
  }, [load]);

  const totalPages = total != null ? Math.max(1, Math.ceil(total / PAGE_SIZE)) : null;
  const hasNext = totalPages != null ? page < totalPages : rows.length === PAGE_SIZE;

  return { rows, total, page, setPage, loading, error, reload: load, totalPages, hasNext };
}

function Pagination({ page, setPage, totalPages, hasNext, total }) {
  if (page === 1 && !hasNext) return null;
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 sm:px-6 py-4 border-t border-gray-100">
      <p className="text-xs text-gray-500">
        Página {page}
        {totalPages != null && ` de ${totalPages}`}
        {total != null && ` · ${total} en total`}
      </p>
      <div className="flex gap-2">
        <button type="button" onClick={() => setPage(page - 1)} disabled={page <= 1} className={`${BTN_ROW} border-gray-200 text-gray-600 hover:bg-gray-50`}>
          Anterior
        </button>
        <button type="button" onClick={() => setPage(page + 1)} disabled={!hasNext} className={`${BTN_ROW} border-gray-200 text-gray-600 hover:bg-gray-50`}>
          Siguiente
        </button>
      </div>
    </div>
  );
}
Pagination.propTypes = {
  page: PropTypes.number.isRequired,
  setPage: PropTypes.func.isRequired,
  totalPages: PropTypes.number,
  hasNext: PropTypes.bool,
  total: PropTypes.number,
};

function FilterChips({ options, value, onChange }) {
  return (
    <div className="flex flex-wrap gap-1 p-1 bg-gray-100 rounded-xl w-fit border border-gray-200">
      {options.map((opt) => (
        <button
          key={opt.key}
          type="button"
          onClick={() => onChange(opt.key)}
          aria-pressed={value === opt.key}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6b1e96] ${
            value === opt.key ? "bg-white text-[#6b1e96] shadow-sm" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
FilterChips.propTypes = {
  options: PropTypes.arrayOf(PropTypes.shape({ key: PropTypes.string, label: PropTypes.string })).isRequired,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
};

function ListState({ loading, error, empty, emptyText, onRetry }) {
  if (loading) {
    return (
      <div className="p-6 space-y-3 animate-pulse" aria-busy="true">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-14 bg-gray-100 rounded-xl" />
        ))}
      </div>
    );
  }
  if (error) {
    return (
      <div role="alert" className="p-10 text-center">
        <p className="font-bold text-[#191c20] mb-1">No pudimos cargar la lista</p>
        <p className="text-sm text-gray-500 mb-4">{error}</p>
        <button type="button" onClick={onRetry} className={BTN_SECONDARY}>
          Reintentar
        </button>
      </div>
    );
  }
  if (empty) {
    return <p className="p-10 text-center text-sm text-gray-500">{emptyText}</p>;
  }
  return null;
}
ListState.propTypes = {
  loading: PropTypes.bool,
  error: PropTypes.string,
  empty: PropTypes.bool,
  emptyText: PropTypes.string,
  onRetry: PropTypes.func,
};

function Modal({ title, children, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold font-['Manrope'] text-[#191c20] mb-3">{title}</h2>
        {children}
      </div>
    </div>
  );
}
Modal.propTypes = { title: PropTypes.string.isRequired, children: PropTypes.node, onClose: PropTypes.func.isRequired };

function ConfirmModal({ title, message, confirmLabel, busy, onConfirm, onClose }) {
  return (
    <Modal title={title} onClose={busy ? () => {} : onClose}>
      <p className="text-sm text-gray-600 mb-6">{message}</p>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onClose} disabled={busy} className={BTN_SECONDARY}>
          Cancelar
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={busy}
          className="bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl px-5 py-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {busy ? "Eliminando..." : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
ConfirmModal.propTypes = {
  title: PropTypes.string.isRequired,
  message: PropTypes.string.isRequired,
  confirmLabel: PropTypes.string.isRequired,
  busy: PropTypes.bool,
  onConfirm: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};

const Stars = ({ rating }) => (
  <span className="inline-flex" role="img" aria-label={`${rating} de 5 estrellas`}>
    {[1, 2, 3, 4, 5].map((i) => (
      <span key={i} aria-hidden="true" className={`material-symbols-outlined text-[16px] ${i <= rating ? "text-[#facc15]" : "text-gray-200"}`}>
        star
      </span>
    ))}
  </span>
);
Stars.propTypes = { rating: PropTypes.number };

const ProductCell = ({ row }) => {
  const product = productOf(row);
  const id = product?.id || row.product_id;
  const name = product?.name || "Producto";
  return id ? (
    <Link to={`/product/${id}`} target="_blank" rel="noreferrer" className="font-semibold text-[#6b1e96] hover:underline line-clamp-2">
      {name}
    </Link>
  ) : (
    <span className="text-gray-500">{name}</span>
  );
};
ProductCell.propTypes = { row: PropTypes.object.isRequired };

// ─────────────────────────────────────────────────────────────
// Pestaña Reseñas
// ─────────────────────────────────────────────────────────────
function ReviewsTab() {
  const [filter, setFilter] = useState("all");
  const params = filter === "all" ? {} : { hidden: filter === "hidden" ? "true" : "false" };
  const list = usePagedList(getAdminCommunityReviewsAPI, params);
  const [busyId, setBusyId] = useState(null);
  const [hideTarget, setHideTarget] = useState(null);
  const [hideReason, setHideReason] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);

  const changeFilter = (key) => {
    setFilter(key);
    list.setPage(1);
  };

  const run = async (id, action, okMsg, failMsg) => {
    setBusyId(id);
    try {
      const res = await action();
      toast.success(res?.data?.message || okMsg);
      await list.reload();
      return true;
    } catch (err) {
      toast.error(serverError(err, failMsg));
      return false;
    } finally {
      setBusyId(null);
    }
  };

  const confirmHide = async () => {
    if (!hideReason.trim()) return;
    const ok = await run(hideTarget.id, () => hideCommunityReviewAPI(hideTarget.id, hideReason.trim()), "Reseña oculta.", "No pudimos ocultar la reseña.");
    if (ok) {
      setHideTarget(null);
      setHideReason("");
    }
  };

  const confirmDelete = async () => {
    const ok = await run(deleteTarget.id, () => deleteCommunityReviewAPI(deleteTarget.id), "Reseña eliminada.", "No pudimos eliminar la reseña.");
    if (ok) setDeleteTarget(null);
  };

  return (
    <div className="space-y-4">
      <FilterChips
        options={[
          { key: "all", label: "Todas" },
          { key: "visible", label: "Visibles" },
          { key: "hidden", label: "Ocultas" },
        ]}
        value={filter}
        onChange={changeFilter}
      />

      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
        <ListState
          loading={list.loading}
          error={list.error}
          empty={list.rows.length === 0}
          emptyText="No hay reseñas con este filtro."
          onRetry={list.reload}
        />
        {!list.loading && !list.error && list.rows.length > 0 && (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-200/70 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    <th className="py-3.5 pl-6 pr-4">Producto</th>
                    <th className="py-3.5 px-4">Tienda</th>
                    <th className="py-3.5 px-4">Autor</th>
                    <th className="py-3.5 px-4">Estrellas</th>
                    <th className="py-3.5 px-4 min-w-[16rem]">Comentario</th>
                    <th className="py-3.5 px-4">Fecha</th>
                    <th className="py-3.5 px-4 text-center">Estado</th>
                    <th className="py-3.5 pl-4 pr-6 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {list.rows.map((row) => {
                    const hidden = isHidden(row);
                    const busy = busyId === row.id;
                    return (
                      <tr key={row.id} className="align-top hover:bg-[#6b1e96]/[0.02] transition-colors">
                        <td className="py-3.5 pl-6 pr-4 max-w-[14rem]"><ProductCell row={row} /></td>
                        <td className="py-3.5 px-4 text-gray-600">{storeOf(row)?.business_name || "—"}</td>
                        <td className="py-3.5 px-4 text-gray-600">{authorOf(row)?.full_name || "—"}</td>
                        <td className="py-3.5 px-4 whitespace-nowrap"><Stars rating={row.rating} /></td>
                        <td className="py-3.5 px-4 text-gray-600">
                          <p className="line-clamp-3 break-words">{row.comment || <span className="italic text-gray-400">Sin comentario</span>}</p>
                          {hidden && row.hidden_reason && (
                            <p className="mt-1 text-xs text-red-600">Motivo: {row.hidden_reason}</p>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-gray-500 whitespace-nowrap">{formatDate(row.created_at)}</td>
                        <td className="py-3.5 px-4 text-center">
                          <span className={`inline-block text-[11px] font-bold px-2 py-0.5 rounded-full border ${hidden ? "bg-gray-100 text-gray-600 border-gray-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"}`}>
                            {hidden ? "Oculta" : "Visible"}
                          </span>
                        </td>
                        <td className="py-3.5 pl-4 pr-6 text-right whitespace-nowrap">
                          <div className="inline-flex gap-2">
                            {hidden ? (
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => run(row.id, () => unhideCommunityReviewAPI(row.id), "Reseña visible de nuevo.", "No pudimos mostrar la reseña.")}
                                className={`${BTN_ROW} border-[#6b1e96]/30 text-[#6b1e96] hover:bg-[#6b1e96]/5`}
                              >
                                Mostrar
                              </button>
                            ) : (
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => {
                                  setHideTarget(row);
                                  setHideReason("");
                                }}
                                className={`${BTN_ROW} border-amber-200 text-amber-700 hover:bg-amber-50`}
                              >
                                Ocultar
                              </button>
                            )}
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => setDeleteTarget(row)}
                              className={`${BTN_ROW} border-red-200 text-red-600 hover:bg-red-50`}
                            >
                              Eliminar
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Pagination {...list} />
          </>
        )}
      </div>

      {hideTarget && (
        <Modal title="Ocultar reseña" onClose={() => busyId == null && setHideTarget(null)}>
          <p className="text-sm text-gray-600 mb-3">
            La reseña dejará de verse en la ficha del producto. Escribe el motivo para dejar constancia.
          </p>
          <label htmlFor="hide-reason" className="block text-sm font-medium text-gray-700 mb-1">
            Motivo
          </label>
          <textarea
            id="hide-reason"
            autoFocus
            rows={3}
            maxLength={500}
            value={hideReason}
            onChange={(e) => setHideReason(e.target.value)}
            placeholder="Ej: lenguaje ofensivo, spam, datos personales..."
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#6b1e96] focus:ring-1 focus:ring-[#6b1e96] outline-none text-sm"
          />
          <div className="flex justify-end gap-2 mt-4">
            <button type="button" onClick={() => setHideTarget(null)} disabled={busyId != null} className={BTN_SECONDARY}>
              Cancelar
            </button>
            <button type="button" onClick={confirmHide} disabled={busyId != null || !hideReason.trim()} className={BTN_PRIMARY}>
              {busyId != null ? "Ocultando..." : "Ocultar"}
            </button>
          </div>
        </Modal>
      )}

      {deleteTarget && (
        <ConfirmModal
          title="Eliminar reseña"
          message="La reseña se borrará para siempre y el promedio del producto se recalculará. Si solo quieres que no se vea, puedes ocultarla."
          confirmLabel="Eliminar"
          busy={busyId != null}
          onConfirm={confirmDelete}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Pestaña Preguntas
// ─────────────────────────────────────────────────────────────
function QuestionsTab() {
  const [filter, setFilter] = useState("all");
  const params = filter === "all" ? {} : { status: filter };
  const list = usePagedList(getAdminCommunityQuestionsAPI, params);
  const [busyId, setBusyId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const changeFilter = (key) => {
    setFilter(key);
    list.setPage(1);
  };

  const run = async (id, action, okMsg, failMsg) => {
    setBusyId(id);
    try {
      const res = await action();
      toast.success(res?.data?.message || okMsg);
      await list.reload();
      return true;
    } catch (err) {
      toast.error(serverError(err, failMsg));
      return false;
    } finally {
      setBusyId(null);
    }
  };

  const confirmDelete = async () => {
    const ok = await run(deleteTarget.id, () => deleteCommunityQuestionAPI(deleteTarget.id), "Pregunta eliminada.", "No pudimos eliminar la pregunta.");
    if (ok) setDeleteTarget(null);
  };

  return (
    <div className="space-y-4">
      <FilterChips
        options={[
          { key: "all", label: "Todas" },
          { key: "pending", label: "Sin responder" },
          { key: "answered", label: "Respondidas" },
          { key: "rejected", label: "Rechazadas" },
        ]}
        value={filter}
        onChange={changeFilter}
      />

      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
        <ListState
          loading={list.loading}
          error={list.error}
          empty={list.rows.length === 0}
          emptyText="No hay preguntas con este filtro."
          onRetry={list.reload}
        />
        {!list.loading && !list.error && list.rows.length > 0 && (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-200/70 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    <th className="py-3.5 pl-6 pr-4">Producto</th>
                    <th className="py-3.5 px-4">Autor</th>
                    <th className="py-3.5 px-4 min-w-[14rem]">Pregunta</th>
                    <th className="py-3.5 px-4 min-w-[14rem]">Respuesta</th>
                    <th className="py-3.5 px-4 text-center">Estado</th>
                    <th className="py-3.5 pl-4 pr-6 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {list.rows.map((row) => {
                    const status = row.status || (row.answer ? "answered" : "pending");
                    const meta = QUESTION_STATUS[status] || { label: status, cls: "bg-gray-100 text-gray-600 border-gray-200" };
                    const busy = busyId === row.id;
                    return (
                      <tr key={row.id} className="align-top hover:bg-[#6b1e96]/[0.02] transition-colors">
                        <td className="py-3.5 pl-6 pr-4 max-w-[14rem]"><ProductCell row={row} /></td>
                        <td className="py-3.5 px-4 text-gray-600">
                          {authorOf(row)?.full_name || "—"}
                          <p className="text-xs text-gray-400 mt-0.5">{formatDate(row.created_at)}</p>
                        </td>
                        <td className="py-3.5 px-4 text-gray-700"><p className="line-clamp-3 break-words">{row.question}</p></td>
                        <td className="py-3.5 px-4 text-gray-600">
                          {row.answer ? (
                            <>
                              <p className="line-clamp-3 break-words">{row.answer}</p>
                              <p className="text-xs text-gray-400 mt-0.5">
                                {row.responder_role === "admin" ? "Forcepx" : "Tienda"} · {formatDate(row.answered_at)}
                              </p>
                            </>
                          ) : (
                            <span className="italic text-gray-400">Sin respuesta</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className={`inline-block text-[11px] font-bold px-2 py-0.5 rounded-full border ${meta.cls}`}>{meta.label}</span>
                        </td>
                        <td className="py-3.5 pl-4 pr-6 text-right whitespace-nowrap">
                          <div className="inline-flex gap-2">
                            {status === "rejected" ? (
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => run(row.id, () => updateCommunityQuestionStatusAPI(row.id, row.answer ? "answered" : "pending"), "Pregunta reabierta.", "No pudimos reabrir la pregunta.")}
                                className={`${BTN_ROW} border-[#6b1e96]/30 text-[#6b1e96] hover:bg-[#6b1e96]/5`}
                              >
                                Reabrir
                              </button>
                            ) : (
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => run(row.id, () => updateCommunityQuestionStatusAPI(row.id, "rejected"), "Pregunta rechazada.", "No pudimos rechazar la pregunta.")}
                                className={`${BTN_ROW} border-amber-200 text-amber-700 hover:bg-amber-50`}
                              >
                                Rechazar
                              </button>
                            )}
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => setDeleteTarget(row)}
                              className={`${BTN_ROW} border-red-200 text-red-600 hover:bg-red-50`}
                            >
                              Eliminar
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Pagination {...list} />
          </>
        )}
      </div>

      {deleteTarget && (
        <ConfirmModal
          title="Eliminar pregunta"
          message="La pregunta y su respuesta se borrarán para siempre. Si solo quieres que no se vea, puedes rechazarla."
          confirmLabel="Eliminar"
          busy={busyId != null}
          onConfirm={confirmDelete}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Página
// ─────────────────────────────────────────────────────────────
export default function AdminCommunity() {
  const [activeTab, setActiveTab] = useState("reviews");
  const tabs = [
    { key: "reviews", label: "Reseñas", icon: "reviews" },
    { key: "questions", label: "Preguntas", icon: "forum" },
  ];

  return (
    <div className="w-full pb-12 space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold font-['Manrope'] text-[#191c20] tracking-tight">Reseñas y preguntas</h1>
        <p className="text-sm text-gray-500 mt-2">
          Revisa lo que publica la comunidad en las fichas de producto: oculta reseñas inapropiadas y modera las preguntas.
        </p>
      </div>

      <div className="flex gap-2 border-b border-gray-200 pb-px" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-5 py-3 border-b-2 font-bold text-sm transition-colors -mb-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6b1e96] ${
              activeTab === tab.key
                ? "border-[#6b1e96] text-[#6b1e96]"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "reviews" ? <ReviewsTab /> : <QuestionsTab />}
    </div>
  );
}
