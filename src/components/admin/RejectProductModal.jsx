import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { REJECTION_REASONS } from "../../utils/productModeration";

/**
 * Modal de rechazo de producto.
 *
 * Sustituye al `window.confirm` que había: rechazar sin dejar constancia del motivo
 * es lo que dejó todo el histórico sin auditoría. El backend ya lo exige (400 si
 * falta), esto solo evita que el admin se coma el error.
 *
 * La lista es cerrada a propósito. Un motivo escrito a mano no se puede contar ni
 * agrupar; con estos siete se puede responder "¿por qué rechazamos tanto?" con una
 * cifra. El detalle concreto va en la nota, que sí es libre y la lee la tienda en su
 * notificación.
 */

export default function RejectProductModal({ product, action, onCancel, onConfirm }) {
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  // Abrir el modal para otro producto no puede heredar el motivo del anterior.
  useEffect(() => {
    setReason("");
    setNote("");
    setSaving(false);
  }, [product?.id, action]);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && !saving && onCancel();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel, saving]);

  if (!product) return null;

  const esBan = action === "ban";
  const notaObligatoria = reason === "otro";
  const puedeEnviar = Boolean(reason) && (!notaObligatoria || note.trim().length > 0) && !saving;

  const submit = async () => {
    if (!puedeEnviar) return;
    setSaving(true);
    try {
      await onConfirm({ reason, note: note.trim() });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !saving && onCancel()} />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="reject-title"
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
      >
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 id="reject-title" className="text-base font-semibold text-slate-900">
            {esBan ? "Banear producto" : "Rechazar producto"}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 truncate">{product.name}</p>
        </div>

        <div className="px-5 py-4 space-y-4 overflow-y-auto">
          <fieldset className="space-y-1.5">
            <legend className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Motivo
            </legend>
            {REJECTION_REASONS.map((r) => (
              <label
                key={r.value}
                className={`flex gap-2.5 items-start p-2.5 rounded-xl cursor-pointer transition-colors ring-1 ${
                  reason === r.value
                    ? "bg-[#6b1e96]/[0.06] ring-[#6b1e96]/30"
                    : "ring-transparent hover:bg-slate-50"
                }`}
              >
                <input
                  type="radio"
                  name="rejection-reason"
                  value={r.value}
                  checked={reason === r.value}
                  onChange={(e) => setReason(e.target.value)}
                  className="mt-0.5 w-3.5 h-3.5 text-[#6b1e96] focus:ring-[#6b1e96]/30"
                />
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-slate-800">{r.label}</span>
                  <span className="block text-xs text-slate-400 leading-snug">{r.hint}</span>
                </span>
              </label>
            ))}
          </fieldset>

          <label className="block space-y-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Nota para la tienda {notaObligatoria ? "(obligatoria)" : "(opcional)"}
            </span>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value.slice(0, 1000))}
              placeholder="Qué tiene que corregir para que se apruebe…"
              className={`w-full bg-slate-50 rounded-xl p-3 text-sm text-slate-800 resize-none h-24 ring-1 focus:outline-none focus:bg-white transition-colors ${
                notaObligatoria && !note.trim()
                  ? "ring-amber-300 focus:ring-amber-400"
                  : "ring-slate-900/5 focus:ring-[#6b1e96]/40"
              }`}
            />
            <span className="flex justify-between text-[11px] text-slate-400">
              <span>La tienda la recibe en su notificación.</span>
              <span className="tabular-nums">{note.length}/1000</span>
            </span>
          </label>
        </div>

        <div className="px-5 py-3.5 border-t border-slate-100 flex items-center justify-end gap-2 bg-slate-50/60">
          <button
            onClick={onCancel}
            disabled={saving}
            className="px-3.5 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-200/60 transition-colors disabled:opacity-40"
          >
            Cancelar
          </button>
          <button
            onClick={submit}
            disabled={!puedeEnviar}
            className="px-3.5 py-2 rounded-xl text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saving ? "Guardando…" : esBan ? "Banear" : "Rechazar"}
          </button>
        </div>
      </div>
    </div>
  );
}

RejectProductModal.propTypes = {
  product: PropTypes.shape({ id: PropTypes.string, name: PropTypes.string }),
  action: PropTypes.oneOf(["reject", "ban"]).isRequired,
  onCancel: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
};
