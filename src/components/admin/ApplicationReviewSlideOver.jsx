import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { getStoreApplicationReviewAPI } from "../../services/api";

const STATUS_LABEL = {
  pending: { text: "Pendiente", cls: "bg-amber-50 text-amber-700" },
  approved: { text: "Aprobada", cls: "bg-green-50 text-green-700" },
  rejected: { text: "Rechazada", cls: "bg-red-50 text-red-600" },
};

const fmtDate = (iso) =>
  new Date(iso).toLocaleDateString("es-VE", { day: "2-digit", month: "short", year: "numeric" });

/**
 * Ficha completa de una solicitud antes de decidir. Además de los datos sin
 * truncar, adelanta los choques que harían fallar la aprobación con un 409
 * (RIF o nombre ya registrados por otra tienda) para no descubrirlos al pulsar.
 */
export default function ApplicationReviewSlideOver({ application, onClose, onApprove, onReject }) {
  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!application?.id) return;
    setLoading(true);
    getStoreApplicationReviewAPI(application.id)
      .then((res) => setReview(res.data?.data || null))
      .catch(() => setReview(null))
      .finally(() => setLoading(false));
  }, [application?.id]);

  const app = review?.application || application;
  const user = review?.user;
  const blockers = review?.blockers || {};
  const others = review?.other_applications || [];

  const blocking = [
    blockers.rif_taken_by && `El RIF ${app.rif} ya está registrado por "${blockers.rif_taken_by}".`,
    blockers.name_taken_by && `El nombre "${app.business_name}" ya está registrado por otra tienda.`,
    blockers.already_has_store &&
      `Este usuario ya tiene una tienda operativa: "${blockers.already_has_store.business_name}".`,
  ].filter(Boolean);

  const isPending = app.status === "pending";

  return (
    <div className="fixed inset-0 z-[200] flex justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-[#6b1e96]/5 to-transparent">
          <h2 className="text-lg font-bold text-gray-900">Revisar Solicitud</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Identidad */}
          <div>
            <h3 className="text-lg font-bold text-gray-900">{app.business_name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  STATUS_LABEL[app.status]?.cls || "bg-gray-100 text-gray-500"
                }`}
              >
                {STATUS_LABEL[app.status]?.text || app.status}
              </span>
              <span className="text-xs text-gray-400">Solicitada el {fmtDate(app.created_at)}</span>
            </div>
          </div>

          {loading ? (
            <div className="py-10 flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6b1e96]" />
            </div>
          ) : (
            <>
              {blocking.length > 0 && (
                <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                  <p className="text-xs font-bold text-red-700 mb-1.5">No se podrá aprobar</p>
                  <ul className="space-y-1">
                    {blocking.map((msg) => (
                      <li key={msg} className="text-xs text-red-600 leading-relaxed">
                        {msg}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="space-y-2">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Negocio</h4>
                <div className="bg-gray-50 rounded-xl p-4 space-y-2.5 text-sm">
                  {[
                    ["RIF", app.rif],
                    ["Teléfono", app.business_phone],
                    ["Dirección", app.business_address],
                  ].map(([label, val]) => (
                    <div key={label} className="flex gap-4">
                      <span className="text-gray-500 shrink-0 w-24">{label}</span>
                      <span className="font-medium text-gray-900 break-words min-w-0">{val || "—"}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Titular</h4>
                <div className="bg-gray-50 rounded-xl p-4 space-y-2.5 text-sm">
                  {[
                    ["Nombre", user?.full_name],
                    ["Email", user?.email],
                    ["Rol actual", user?.roles?.name],
                    ["Registrado", user?.created_at && fmtDate(user.created_at)],
                  ].map(([label, val]) => (
                    <div key={label} className="flex gap-4">
                      <span className="text-gray-500 shrink-0 w-24">{label}</span>
                      <span className="font-medium text-gray-900 break-words min-w-0">{val || "—"}</span>
                    </div>
                  ))}
                </div>
              </div>

              {others.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Otras solicitudes de este usuario
                  </h4>
                  <div className="bg-gray-50 rounded-xl divide-y divide-gray-200/70">
                    {others.map((o) => (
                      <div key={o.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{o.business_name}</p>
                          <p className="text-[11px] text-gray-400">{fmtDate(o.created_at)}</p>
                        </div>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                            STATUS_LABEL[o.status]?.cls || "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {STATUS_LABEL[o.status]?.text || o.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {isPending && !loading && (
          <div className="border-t border-gray-100 px-6 py-4 flex gap-3">
            <button
              onClick={() => onReject(app)}
              className="flex-1 px-4 py-2.5 bg-red-50 text-red-600 font-medium rounded-xl hover:bg-red-100 transition-colors"
            >
              Rechazar
            </button>
            <button
              onClick={() => onApprove(app)}
              disabled={blocking.length > 0}
              title={blocking.length > 0 ? "Hay conflictos que impiden aprobar esta solicitud" : undefined}
              className="flex-1 px-4 py-2.5 bg-[#c3ff00] text-[#531575] font-bold rounded-xl hover:bg-[#aade00] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Aprobar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

ApplicationReviewSlideOver.propTypes = {
  application: PropTypes.shape({
    id: PropTypes.string.isRequired,
    business_name: PropTypes.string,
    rif: PropTypes.string,
    status: PropTypes.string,
    created_at: PropTypes.string,
  }).isRequired,
  onClose: PropTypes.func.isRequired,
  onApprove: PropTypes.func.isRequired,
  onReject: PropTypes.func.isRequired,
};
