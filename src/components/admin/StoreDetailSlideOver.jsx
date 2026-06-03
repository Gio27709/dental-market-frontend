import { useState, useEffect } from "react";
import { getStoreDetailsAPI, getPenaltiesAPI } from "../../services/api";
import PropTypes from "prop-types";

export default function StoreDetailSlideOver({ store, onClose }) {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [penalties, setPenalties] = useState([]);

  useEffect(() => {
    if (!store?.user_id) return;
    getPenaltiesAPI({ store_id: store.user_id, limit: 100 })
      .then((res) => setPenalties(res.data?.data || []))
      .catch(() => setPenalties([]));
  }, [store?.user_id]);

  useEffect(() => {
    if (!store?.user_id) return;
    setLoading(true);
    getStoreDetailsAPI(store.user_id)
      .then((res) => setDetails(res.data?.data))
      .catch(() => setDetails(null))
      .finally(() => setLoading(false));
  }, [store?.user_id]);

  if (!store) return null;

  const p = details?.profile || store;
  const m = details?.metrics || {};
  const w = details?.wallet || {};
  const auth = details?.auth || {};

  return (
    <div className="fixed inset-0 z-[200] flex justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-[#6b1e96]/5 to-transparent">
          <h2 className="text-lg font-bold text-gray-900">Detalle de Tienda</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6b1e96]" />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
            {/* Store Identity */}
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-[#6b1e96]/10 flex items-center justify-center text-[#6b1e96] text-xl font-bold flex-shrink-0 overflow-hidden">
                {p.logo_url ? <img src={p.logo_url} alt="" className="w-full h-full object-cover" /> : p.business_name?.charAt(0)}
              </div>
              <div className="min-w-0">
                <h3 className="text-lg font-bold text-gray-900 truncate">{p.business_name}</h3>
                <div className="flex items-center gap-2 mt-0.5">
                  {p.store_code && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#f3e8ff] text-[#6b1e96]">#{p.store_code}</span>}
                  {p.is_suspended ? (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-50 text-red-600">⚠ Suspendida</span>
                  ) : (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-green-50 text-green-600">● Activa</span>
                  )}
                </div>
              </div>
            </div>

            {/* Suspension Banner */}
            {p.is_suspended && p.suspension_reason && (
              <div className="bg-red-50 border border-red-100 rounded-xl p-3">
                <p className="text-xs font-semibold text-red-700 mb-0.5">Motivo de suspensión:</p>
                <p className="text-xs text-red-600">{p.suspension_reason}</p>
                {p.suspended_at && <p className="text-[10px] text-red-400 mt-1">Desde: {new Date(p.suspended_at).toLocaleDateString("es-VE")}</p>}
              </div>
            )}

            {/* Contact Info */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Contacto</h4>
              <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
                {[
                  ["RIF", p.rif],
                  ["Teléfono", p.business_phone],
                  ["Dirección", p.business_address],
                  ["Estado", p.state],
                  ["Email", auth.email],
                  ["Titular", auth.full_name],
                ].map(([label, val]) => val && (
                  <div key={label} className="flex justify-between">
                    <span className="text-gray-500">{label}</span>
                    <span className="font-medium text-gray-900 text-right max-w-[60%] truncate">{val}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Métricas</h4>
              <div className="grid grid-cols-2 gap-3">
                {[
                  ["Productos Totales", m.totalProducts, "📦"],
                  ["Prod. Activos", m.activeProducts, "✅"],
                  ["Pedidos Totales", m.totalOrderItems, "🛒"],
                  ["Pendientes", m.pendingOrderItems, "⏳"],
                  ["Entregados", m.deliveredItems, "🚚"],
                  ["Rating", p.rating_avg?.toFixed(1) || "N/A", "⭐"],
                ].map(([label, val, icon]) => (
                  <div key={label} className="bg-gray-50 rounded-xl p-3 text-center">
                    <span className="text-lg">{icon}</span>
                    <p className="text-xl font-bold text-gray-900 mt-1">{val}</p>
                    <p className="text-[10px] text-gray-500 font-medium">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Wallet */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Wallet</h4>
              <div className="bg-gradient-to-r from-[#6b1e96]/5 to-[#c3ff00]/10 rounded-xl p-4 flex justify-between">
                <div>
                  <p className="text-[10px] text-gray-500 font-medium">Disponible</p>
                  <p className="text-lg font-bold text-[#6b1e96]">${(w.balance_available || 0).toFixed(2)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-gray-500 font-medium">Pendiente</p>
                  <p className="text-lg font-bold text-gray-700">${(w.balance_pending || 0).toFixed(2)}</p>
                </div>
              </div>
            </div>

            {/* Sanctions Summary (OMI-3) */}
            {penalties.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Sanciones</h4>
                <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                  <div className="grid grid-cols-2 gap-2 text-center">
                    {[
                      ["⚠️", "Advertencias", penalties.filter(p => p.type === "warning").length],
                      ["💸", "Multas", penalties.filter(p => p.type === "fine").length],
                      ["🚨", "Suspensiones", penalties.filter(p => p.type === "suspension").length],
                      ["🚫", "Cancelaciones", penalties.filter(p => p.type === "cancellation").length],
                    ].filter(([,,count]) => count > 0).map(([icon, label, count]) => (
                      <div key={label} className="bg-white rounded-lg p-2 border border-gray-100">
                        <span className="text-sm">{icon}</span>
                        <p className="text-lg font-bold text-gray-900">{count}</p>
                        <p className="text-[10px] text-gray-500">{label}</p>
                      </div>
                    ))}
                  </div>
                  {penalties.filter(p => p.status === "pending_review").length > 0 && (
                    <p className="text-[10px] text-yellow-700 bg-yellow-50 rounded-lg px-2 py-1 text-center font-medium">
                      ⏳ {penalties.filter(p => p.status === "pending_review").length} pendiente(s) de revisión
                    </p>
                  )}
                  <a
                    href={`/admin/penalties?store_id=${store.user_id}`}
                    className="block text-center text-[10px] text-[#6b1e96] font-semibold hover:underline mt-1"
                  >
                    Ver todas las sanciones →
                  </a>
                </div>
              </div>
            )}

            {/* Auth Info */}
            {auth.last_sign_in_at && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Actividad</h4>
                <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Último Login</span>
                    <span className="font-medium text-gray-900">{new Date(auth.last_sign_in_at).toLocaleDateString("es-VE")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Registrado</span>
                    <span className="font-medium text-gray-900">{new Date(p.created_at).toLocaleDateString("es-VE")}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Public Link */}
            <a
              href={`/store/${store.user_id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-2.5 text-sm font-medium text-[#6b1e96] bg-[#6b1e96]/5 rounded-xl hover:bg-[#6b1e96]/10 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
              Ver Perfil Público
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

StoreDetailSlideOver.propTypes = {
  store: PropTypes.shape({
    user_id: PropTypes.string.isRequired,
  }).isRequired,
  onClose: PropTypes.func.isRequired,
};
