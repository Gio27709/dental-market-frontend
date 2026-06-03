import { useState, useEffect, useCallback } from "react";
import { getStorePenaltiesAPI, appealPenaltyAPI } from "../../services/api";
import { useStore } from "../../context/StoreContext";
import toast from "react-hot-toast";

const TYPE_CONFIG = {
  warning:      { label: "Advertencia",  bg: "bg-yellow-100", text: "text-yellow-800", icon: "⚠️" },
  fine:         { label: "Multa",        bg: "bg-orange-100", text: "text-orange-800", icon: "💸" },
  suspension:   { label: "Suspensión",   bg: "bg-red-100",    text: "text-red-800",    icon: "🚨" },
  cancellation: { label: "Cancelación",  bg: "bg-gray-100",   text: "text-gray-800",   icon: "🚫" },
};

const STATUS_CONFIG = {
  pending_review: { label: "Pendiente",   bg: "bg-yellow-100", text: "text-yellow-700" },
  applied:        { label: "Aplicada",    bg: "bg-green-100",  text: "text-green-700" },
  dismissed:      { label: "Descartada",  bg: "bg-gray-100",   text: "text-gray-500" },
};

export default function StorePenalties() {
  const { storeProfile, fetchStoreStats } = useStore();
  const isSuspended = storeProfile?.is_suspended;
  const [penalties, setPenalties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("");

  // Appeal modal
  const [appealModal, setAppealModal] = useState({ open: false, penaltyId: null });
  const [appealNote, setAppealNote] = useState("");
  const [appealLoading, setAppealLoading] = useState(false);

  const fetchPenalties = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit: 50 };
      if (filterType) params.type = filterType;
      const { data } = await getStorePenaltiesAPI(params);
      setPenalties(data?.data || []);
    } catch (err) {
      toast.error("Error cargando sanciones: " + err.message);
    } finally {
      setLoading(false);
    }
  }, [filterType]);

  useEffect(() => { fetchPenalties(); }, [fetchPenalties]);

  const handleAppealOpen = (id) => {
    setAppealModal({ open: true, penaltyId: id });
    setAppealNote("");
  };

  const handleAppealSubmit = async () => {
    if (!appealNote.trim()) {
      toast.error("Debes escribir una justificación");
      return;
    }
    setAppealLoading(true);
    try {
      await appealPenaltyAPI(appealModal.penaltyId, appealNote.trim());
      toast.success("Apelación enviada. Un administrador revisará tu caso.");
      setAppealModal({ open: false, penaltyId: null });
      fetchPenalties();
      fetchStoreStats();
    } catch (err) {
      toast.error("Error: " + err.message);
    } finally {
      setAppealLoading(false);
    }
  };

  const formatDate = (d) =>
    d ? new Date(d).toLocaleDateString("es-VE", {
      day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
    }) : "—";

  // Summary counts
  const counts = {
    total: penalties.length,
    pending: penalties.filter(p => p.status === "pending_review").length,
    applied: penalties.filter(p => p.status === "applied").length,
    finesTotal: penalties
      .filter(p => p.type === "fine" && p.status === "applied")
      .reduce((sum, p) => sum + Number(p.amount || 0), 0),
  };

  const hasPendingAppeal = penalties.some(p => p.reason?.includes("📝 Apelación") && !p.resolved_by);


  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight font-['Manrope']">
          Mis Sanciones
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Historial de sanciones administrativas de tu tienda. Puedes apelar las que estén pendientes.
        </p>
      </div>

      {/* Suspension Info Banner */}
      {isSuspended && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-base">🚨</span>
          </div>
          <div>
            <p className="text-sm font-bold text-red-800 mb-0.5">Tu tienda está suspendida</p>
            <p className="text-xs text-red-600/80 leading-relaxed">
              Puedes apelar las sanciones de tipo suspensión directamente desde aquí.
              Un administrador revisará tu caso y decidirá si reactivar tu tienda.
            </p>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center shadow-sm">
          <p className="text-2xl font-bold text-gray-900">{counts.total}</p>
          <p className="text-[10px] text-gray-500 font-medium uppercase">Total</p>
        </div>
        <div className="bg-white rounded-xl border border-yellow-200 p-4 text-center shadow-sm">
          <p className="text-2xl font-bold text-yellow-700">{counts.pending}</p>
          <p className="text-[10px] text-yellow-600 font-medium uppercase">Pendientes</p>
        </div>
        <div className="bg-white rounded-xl border border-green-200 p-4 text-center shadow-sm">
          <p className="text-2xl font-bold text-green-700">{counts.applied}</p>
          <p className="text-[10px] text-green-600 font-medium uppercase">Aplicadas</p>
        </div>
        <div className="bg-white rounded-xl border border-orange-200 p-4 text-center shadow-sm">
          <p className="text-2xl font-bold text-orange-700">${counts.finesTotal.toFixed(2)}</p>
          <p className="text-[10px] text-orange-600 font-medium uppercase">Multas Cobradas</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3 mb-4">
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="border border-gray-300 rounded-xl px-4 py-2.5 text-sm bg-white focus:ring-2 focus:ring-[#6b1e96]/20 focus:border-[#6b1e96] outline-none"
        >
          <option value="">Todos los tipos</option>
          <option value="warning">⚠️ Advertencias</option>
          <option value="fine">💸 Multas</option>
          <option value="suspension">🚨 Suspensiones</option>
          <option value="cancellation">🚫 Cancelaciones</option>
        </select>
        <button
          onClick={fetchPenalties}
          className="ml-auto text-sm text-[#6b1e96] hover:underline font-medium"
        >
          Actualizar
        </button>
      </div>

      {/* Loading / Empty / List */}
      {loading ? (
        <div className="flex items-center justify-center p-16">
          <div className="w-10 h-10 border-4 border-[#c3ff00] border-t-[#6b1e96] rounded-full animate-spin" />
        </div>
      ) : penalties.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-sm">
          <div className="text-4xl mb-3">✅</div>
          <h3 className="text-lg font-bold text-gray-900 font-['Manrope'] mb-1">¡Todo en orden!</h3>
          <p className="text-sm text-gray-500">No tienes sanciones registradas.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {penalties.map((p) => {
            const typeConf = TYPE_CONFIG[p.type] || TYPE_CONFIG.warning;
            const statusConf = STATUS_CONFIG[p.status] || STATUS_CONFIG.pending_review;
            const hasAppeal = p.reason?.includes("📝 Apelación");

            return (
              <div key={p.id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${typeConf.bg} ${typeConf.text}`}>
                        {typeConf.icon} {typeConf.label}
                      </span>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConf.bg} ${statusConf.text}`}>
                        {statusConf.label}
                      </span>
                      {Number(p.amount) > 0 && (
                        <span className="text-sm font-bold text-orange-700">${Number(p.amount).toFixed(2)}</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">{p.reason}</p>
                    <p className="text-[10px] text-gray-400 mt-2">
                      Orden: #{p.order_id?.substring(0, 8)} &middot; {formatDate(p.created_at)}
                    </p>
                  </div>

                  {/* Appeal button: pending_review OR applied suspensions/cancellations (BUG-E fix) */}
                  {!hasAppeal && !p.resolved_by && !hasPendingAppeal && (
                    (p.status === "pending_review" || 
                     ((p.type === "suspension" || p.type === "cancellation") && p.status === "applied")
                    ) && (
                      <button
                        onClick={() => handleAppealOpen(p.id)}
                        className="flex-shrink-0 text-xs font-medium px-3 py-1.5 rounded-lg border border-[#6b1e96]/30 text-[#6b1e96] hover:bg-[#6b1e96]/5 transition-colors whitespace-nowrap"
                      >
                        📝 Apelar
                      </button>
                    )
                  )}
                  {hasAppeal && (
                    <span className="flex-shrink-0 text-[10px] font-medium px-2 py-1 rounded-full bg-blue-50 text-blue-600">
                      ✓ Apelada
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Appeal Modal */}
      {appealModal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setAppealModal({ open: false, penaltyId: null })}>
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-[#6b1e96]/10 text-[#6b1e96] flex items-center justify-center text-lg">📝</div>
              <h3 className="text-lg font-bold font-['Manrope']">Apelar Sanción</h3>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Explica por qué consideras que esta sanción no es justa. Un administrador revisará tu caso.
            </p>
            <textarea
              value={appealNote}
              onChange={(e) => setAppealNote(e.target.value)}
              placeholder="Escribe tu justificación aquí..."
              rows={4}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#6b1e96]/20 focus:border-[#6b1e96] outline-none resize-none"
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setAppealModal({ open: false, penaltyId: null })}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleAppealSubmit}
                disabled={appealLoading}
                className="px-4 py-2 text-sm rounded-xl font-medium transition-colors disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #531575, #6b1e96)', color: '#c3ff00' }}
              >
                {appealLoading ? "Enviando..." : "Enviar Apelación"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
