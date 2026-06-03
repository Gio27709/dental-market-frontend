import { useState } from "react";

const FAILURE_REASONS = [
  { value: "no_one_home", label: "Nadie en el domicilio", icon: "door_front" },
  { value: "wrong_address", label: "Dirección incorrecta", icon: "wrong_location" },
  { value: "client_refused", label: "Cliente rechazó la entrega", icon: "do_not_disturb_on" },
  { value: "access_restricted", label: "Zona restringida", icon: "block" },
  { value: "other", label: "Otro motivo", icon: "more_horiz" },
];

export default function DeliveryFailedModal({ isOpen, onClose, onSubmit, loading }) {
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!reason) return;
    if (reason === "other" && notes.trim().length < 5) return;
    onSubmit({ reason, notes: notes.trim() });
  };

  const selectedReason = FAILURE_REASONS.find(r => r.value === reason);
  const isValid = reason && (reason !== "other" || notes.trim().length >= 5);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-300">
        {/* Header */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-sm px-6 pt-6 pb-4 border-b border-gray-100 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center">
                <span className="material-symbols-outlined text-amber-600 text-[22px]">warning</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Entrega No Completada</h3>
                <p className="text-xs text-gray-500 font-medium">Selecciona el motivo</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
            >
              <span className="material-symbols-outlined text-[18px] text-gray-500">close</span>
            </button>
          </div>
        </div>

        {/* Reason Selection */}
        <div className="px-6 py-5 space-y-3">
          {FAILURE_REASONS.map((r) => (
            <button
              key={r.value}
              onClick={() => setReason(r.value)}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all duration-200 text-left ${
                reason === r.value
                  ? "border-[#6b1e96] bg-[#f3e8ff] ring-2 ring-[#6b1e96]/20"
                  : "border-gray-100 bg-gray-50/50 hover:border-gray-200 hover:bg-gray-50"
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                reason === r.value ? "bg-[#6b1e96] text-white" : "bg-white text-gray-400 shadow-sm"
              }`}>
                <span className="material-symbols-outlined text-[20px]">{r.icon}</span>
              </div>
              <span className={`text-sm font-semibold ${reason === r.value ? "text-[#6b1e96]" : "text-gray-700"}`}>
                {r.label}
              </span>
              {reason === r.value && (
                <span className="material-symbols-outlined text-[#6b1e96] ml-auto text-[20px]">check_circle</span>
              )}
            </button>
          ))}
        </div>

        {/* Notes Field (always visible, required for "other") */}
        {reason && (
          <div className="px-6 pb-4 animate-in fade-in duration-200">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
              {reason === "other" ? "Describe la situación *" : "Notas adicionales (opcional)"}
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={reason === "other" ? "Escribe qué pasó (mín. 5 caracteres)..." : "Agrega detalles si lo deseas..."}
              rows={3}
              maxLength={500}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#6b1e96] focus:ring-2 focus:ring-[#6b1e96]/10 transition-all resize-none"
            />
            <p className="text-right text-[11px] text-gray-400 mt-1">{notes.length}/500</p>
          </div>
        )}

        {/* Actions */}
        <div className="sticky bottom-0 bg-white/95 backdrop-blur-sm px-6 py-5 border-t border-gray-100 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-2xl text-sm transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={!isValid || loading}
            className="flex-1 py-3.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-2xl text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/30"
          >
            {loading ? (
              <span className="w-5 h-5 border-[3px] border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span className="material-symbols-outlined text-[18px]">report_problem</span>
                Reportar
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
