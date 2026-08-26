import { useState, useEffect, useCallback, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api, { getStorePenaltiesAPI, appealPenaltyAPI, acknowledgePenaltyAPI } from "../../services/api";
import {
  typeOf, statusOf, parseReason, hasAppeal, needsStoreAction, canAppeal, formatDelay,
  hasLostReason,
} from "../../utils/penalties";
import { useStore } from "../../context/StoreContext";
import toast from "react-hot-toast";

const PAGE_SIZE = 20;

export default function StorePenalties() {
  const { storeProfile, fetchStoreStats } = useStore();
  const isSuspended = storeProfile?.is_suspended;
  const [penalties, setPenalties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("");
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);
  // Los totales los calcula el backend sobre TODAS las sanciones de la tienda. Antes se
  // calculaban aquí sobre el array ya filtrado: al filtrar por "Amonestaciones", el
  // "Total de multas cobradas" se ponía en $0.00.
  const [summary, setSummary] = useState({ total: 0, pending: 0, applied: 0, finesTotal: 0 });
  const [activeTab, setActiveTab] = useState("pending"); // pending | all

  // Deep link desde notificaciones: ?penalty=<uuid>
  const [searchParams, setSearchParams] = useSearchParams();
  const deepLinkHandled = useRef(false);
  const [highlightId, setHighlightId] = useState(null);

  // Info guide expand
  const [showGuide, setShowGuide] = useState(true);

  // Las reglas del SLA las fija el administrador en `global_settings`, y esta guía las
  // tenía escritas a mano ("24 horas", "Multa ($3.00)"). Coincidían por casualidad: el día
  // que cambie la multa, la tienda estaría leyendo una cifra falsa en la misma pantalla
  // donde se le cobra. Ambas claves son públicas en `PUBLIC_SETTINGS_KEYS`.
  const [slaRules, setSlaRules] = useState(null);

  useEffect(() => {
    api.get("/admin/settings")
      .then(({ data }) => {
        const hours = Number(data?.data?.shipping_sla_hours?.hours);
        const fine = Number(data?.data?.shipping_fine_amount_usd?.amount);
        if (Number.isFinite(hours) && hours > 0 && Number.isFinite(fine)) {
          setSlaRules({ hours, fine });
        }
      })
      .catch(() => { /* sin conexión la guía se muestra en genérico, nunca con cifras inventadas */ });
  }, []);

  // Con multiplicador: el nivel 2 se dispara al doble del SLA, el 3 al triple, el 4 al cuádruple.
  const slaPlazo = (mult) => (slaRules ? `${slaRules.hours * mult} horas` : `${mult}× el SLA`);
  const slaMulta = slaRules ? `$${slaRules.fine.toFixed(2)}` : "el importe vigente";

  // Appeal modal
  const [appealModal, setAppealModal] = useState({ open: false, penaltyId: null });
  const [appealNote, setAppealNote] = useState("");
  const [appealLoading, setAppealLoading] = useState(false);

  // Acknowledge loading state map
  const [ackLoading, setAckLoading] = useState({});

  const fetchPenalties = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit: PAGE_SIZE, offset };
      if (filterType) params.type = filterType;
      // La pestaña filtra en el servidor: si no, el contador y la lista no cuadran al paginar.
      if (activeTab === "pending") params.pending_only = "true";
      const { data } = await getStorePenaltiesAPI(params);
      setPenalties(data?.data || []);
      setTotal(data?.count ?? 0);
      if (data?.summary) setSummary(data.summary);
    } catch (err) {
      toast.error("Error cargando sanciones: " + err.message);
    } finally {
      setLoading(false);
    }
  }, [filterType, offset, activeTab]);

  useEffect(() => {
    fetchPenalties();
  }, [fetchPenalties]);

  // Aplica el deep link una sola vez, cuando termina la primera carga.
  useEffect(() => {
    if (deepLinkHandled.current || loading) return;
    const penaltyId = searchParams.get("penalty");
    if (!penaltyId) return;
    deepLinkHandled.current = true;

    setSearchParams({}, { replace: true });

    const reveal = (target) => {
      if (!needsStoreAction(target)) setActiveTab("all");
      setHighlightId(target.id);
      setTimeout(() => {
        document.getElementById(`row-${target.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 100);
      setTimeout(() => setHighlightId(null), 3000);
    };

    const inPage = penalties.find((p) => p.id === penaltyId);
    if (inPage) {
      reveal(inPage);
      return;
    }

    // No está en la página cargada: se pide al endpoint (filtra por id) y se antepone.
    (async () => {
      try {
        const { data } = await getStorePenaltiesAPI({ id: penaltyId });
        const found = data?.data?.[0];
        if (!found) {
          toast.error("No se encontró el elemento indicado");
          return;
        }
        setPenalties((prev) => [found, ...prev.filter((p) => p.id !== found.id)]);
        reveal(found);
      } catch {
        toast.error("No se encontró el elemento indicado");
      }
    })();
  }, [loading, penalties, searchParams, setSearchParams]);

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

  const handleAcknowledge = async (id) => {
    setAckLoading(prev => ({ ...prev, [id]: true }));
    try {
      await acknowledgePenaltyAPI(id);
      toast.success("Sanción aceptada y archivada. Notificación resuelta.");
      fetchPenalties();
      fetchStoreStats();
    } catch (err) {
      toast.error("Error: " + err.message);
    } finally {
      setAckLoading(prev => ({ ...prev, [id]: false }));
    }
  };

  const formatDate = (d) =>
    d ? new Date(d).toLocaleDateString("es-VE", {
      day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
    }) : "—";

  // `summary` viene del servidor y no depende ni del filtro ni de la página.
  const counts = summary;

  // Filter list based on active tab
  // El servidor ya devuelve la lista de la pestaña activa (`pending_only`).
  const displayedPenalties = penalties;

  return (
    <div className="pb-10 font-['Manrope']">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Mis Sanciones y SLA
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Historial de amonestaciones y sanciones de tu tienda. Gestiona tus apelaciones y archiva las notificaciones leídas.
          </p>
        </div>
        <button
          onClick={() => setShowGuide(!showGuide)}
          className="text-xs font-bold px-3 py-2 bg-gradient-to-r from-[#6b1e96]/10 to-[#6b1e96]/20 text-[#6b1e96] border border-[#6b1e96]/20 rounded-xl hover:from-[#6b1e96]/20 hover:to-[#6b1e96]/30 transition-all flex items-center gap-1.5"
        >
          <span>📖</span> {showGuide ? "Ocultar Guía" : "Ver Guía del Sistema"}
        </button>
      </div>

      {/* Suspension Info Banner */}
      {isSuspended && (
        <div className="bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-2xl p-5 mb-6 flex items-start gap-4 shadow-sm animate-pulse">
          <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0 text-xl">
            🚨
          </div>
          <div>
            <p className="text-base font-extrabold text-red-900 mb-1">Tu tienda está suspendida</p>
            <p className="text-sm text-red-700 leading-relaxed max-w-2xl">
              Has recibido una suspensión administrativa debido a infracciones graves o acumuladas de SLA. 
              Puedes apelar la suspensión escribiendo una justificación clara. Un administrador la evaluará para restaurar tus ventas.
            </p>
          </div>
        </div>
      )}

      {/* SLA Guide Panel */}
      {showGuide && (
        <div className="bg-white rounded-2xl border border-gray-150 p-5 mb-6 shadow-sm relative overflow-hidden transition-all duration-300">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#c3ff00]/10 rounded-full blur-2xl pointer-events-none" />
          <h3 className="text-sm font-extrabold text-[#6b1e96] uppercase tracking-wider mb-3 flex items-center gap-2">
            <span>⚙️</span> Guía de Reglas de Despacho (SLA)
          </h3>
          <p className="text-xs text-gray-600 mb-4 leading-relaxed">
            Para garantizar una experiencia premium, todos los comercios tienen plazos máximos para colocar los pedidos en el correo (SLA).
            El retraso en el envío genera penalizaciones automáticas progresivas por pedido:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-3">
              <span className="text-xs font-black text-amber-800 block mb-1">⚠️ 1. Advertencia</span>
              <p className="text-[11px] text-amber-700/95 leading-snug">Se genera al exceder las <strong>{slaPlazo(1)}</strong> de SLA inicial sin despachar el producto.</p>
            </div>
            <div className="bg-orange-50/50 border border-orange-100 rounded-xl p-3">
              <span className="text-xs font-black text-orange-800 block mb-1">💸 2. Multa ({slaMulta})</span>
              <p className="text-[11px] text-orange-700/95 leading-snug">Se aplica al superar el doble del SLA (<strong>{slaPlazo(2)}</strong>). Se descuenta de tu saldo disponible una vez que un administrador la aprueba; si no alcanza, queda como deuda y se cobra de tus próximas ventas.</p>
            </div>
            <div className="bg-red-50/50 border border-red-100 rounded-xl p-3">
              <span className="text-xs font-black text-red-800 block mb-1">🚨 3. Suspensión</span>
              <p className="text-[11px] text-red-700/95 leading-snug">Se activa al superar el triple del SLA (<strong>{slaPlazo(3)}</strong>). Tu tienda se inhabilita para recibir nuevas ventas.</p>
            </div>
            <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-3">
              <span className="text-xs font-black text-slate-800 block mb-1">🚫 4. Cancelación</span>
              <p className="text-[11px] text-slate-700/95 leading-snug">Al exceder el cuádruple del SLA (<strong>{slaPlazo(4)}</strong>), la orden se cancela de forma automática y se reembolsa al cliente.</p>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 flex flex-wrap gap-x-6 gap-y-2 text-[11px] text-gray-500">
            <span className="flex items-center gap-1"><strong>Apelaciones:</strong> Tienes derecho a justificar retrasos causados por problemas de transporte o fuerza mayor.</span>
            <span className="flex items-center gap-1"><strong>Archivado:</strong> Acepta las amonestaciones ya cobradas o vistas para quitarlas de tus notificaciones.</span>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Total acumulado</p>
          <p className="text-3xl font-black text-gray-900 mt-1">{counts.total}</p>
        </div>
        <div className={`rounded-2xl border p-4 shadow-sm transition-all ${counts.pending > 0 ? "bg-amber-50/50 border-amber-200 shadow-amber-50/10" : "bg-white border-gray-200"}`}>
          <p className={`text-[10px] font-bold uppercase tracking-wider ${counts.pending > 0 ? "text-amber-600" : "text-gray-400"}`}>Acciones pendientes</p>
          <div className="flex items-baseline gap-2 mt-1">
            <p className={`text-3xl font-black ${counts.pending > 0 ? "text-amber-700" : "text-gray-900"}`}>{counts.pending}</p>
            {counts.pending > 0 && <span className="text-[10px] font-bold bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded-md animate-bounce">Atención</span>}
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Sanciones aplicadas</p>
          <p className="text-3xl font-black text-rose-700 mt-1">{counts.applied}</p>
        </div>
        <div className="bg-[#1a0a2e] rounded-2xl border border-white/[0.06] p-4 shadow-lg text-white">
          <p className="text-[10px] text-[#c3ff00]/70 font-bold uppercase tracking-wider">Total en multas cobradas</p>
          <p className="text-3xl font-black text-[#c3ff00] mt-1">${counts.finesTotal.toFixed(2)}</p>
        </div>
      </div>

      {/* Tabs & Filter Bar */}
      <div className="flex flex-wrap justify-between items-center gap-4 mb-5 border-b border-gray-200 pb-3">
        {/* Tabs */}
        <div className="flex gap-2 p-1 bg-gray-150 rounded-xl">
          <button
            onClick={() => { setActiveTab("pending"); setOffset(0); }}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === "pending" ? "bg-white text-[#6b1e96] shadow-sm" : "text-gray-500 hover:text-gray-800"}`}
          >
            📋 Acciones requeridas ({counts.pending})
          </button>
          <button
            onClick={() => { setActiveTab("all"); setOffset(0); }}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === "all" ? "bg-white text-[#6b1e96] shadow-sm" : "text-gray-500 hover:text-gray-800"}`}
          >
            🗂️ Historial completo ({counts.total})
          </button>
        </div>

        {/* Dropdown Filter */}
        <div className="flex items-center gap-3">
          <select
            value={filterType}
            onChange={(e) => { setFilterType(e.target.value); setOffset(0); }}
            className="border border-gray-300 rounded-xl px-4 py-2 text-xs bg-white font-bold text-gray-700 focus:ring-2 focus:ring-[#6b1e96]/20 focus:border-[#6b1e96] outline-none cursor-pointer"
          >
            <option value="">Filtrar Tipo: Todos</option>
            <option value="warning">⚠️ Amonestaciones</option>
            <option value="fine">💸 Multas</option>
            <option value="suspension">🚨 Suspensiones</option>
            <option value="cancellation">🚫 Cancelaciones</option>
          </select>
          <button
            onClick={fetchPenalties}
            className="text-xs text-[#6b1e96] hover:text-[#8b2bc0] font-black border border-[#6b1e96]/20 hover:bg-[#6b1e96]/5 px-3 py-2 rounded-xl transition-colors"
          >
            Actualizar
          </button>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="w-10 h-10 border-4 border-[#c3ff00] border-t-[#6b1e96] rounded-full animate-spin mb-3" />
          <p className="text-xs font-bold text-gray-400">Cargando tus amonestaciones...</p>
        </div>
      ) : displayedPenalties.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-150 p-12 text-center shadow-sm">
          <div className="text-5xl mb-4">🎉</div>
          <h3 className="text-lg font-extrabold text-gray-900 mb-1">¡No hay nada pendiente!</h3>
          <p className="text-sm text-gray-400 max-w-sm mx-auto">
            {activeTab === "pending"
              ? "No tienes amonestaciones o notificaciones que requieran atención en este momento. ¡Sigue así!"
              : "No se encontraron registros de sanciones en tu historial."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayedPenalties.map((p) => {
            const typeConf = typeOf(p.type);
            const statusConf = statusOf(p.status);
            const apelada = hasAppeal(p);
            // Un solo parseador del motivo, compartido con el panel de administración.
            // Aquí se partía el texto a mano y allí con expresiones regulares: cualquier
            // cambio de formato rompía uno de los dos sin que nadie se enterara.
            const { system: displayReason, appeal: appealText, resolution: adminResponse } = parseReason(p.reason);
            const isPendingAction = needsStoreAction(p);
            const retraso = formatDelay(p.delay_hours);
            const producto = p.order_items?.products?.name;

            return (
              <div
                key={p.id}
                id={`row-${p.id}`}
                className={`bg-white rounded-2xl border overflow-hidden transition-all duration-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 ${
                  p.is_acknowledged ? "border-gray-200 opacity-70" : isPendingAction ? "border-amber-200 bg-amber-50/[0.08]" : "border-gray-200"
                } ${highlightId === p.id ? "ring-2 ring-[#6b1e96] ring-offset-2" : ""}`}
              >
                <div className="p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black border ${typeConf.chip}`}>
                        {typeConf.icon} {typeConf.label}
                      </span>
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border ${statusConf.chip}`}>
                        {statusConf.label}
                      </span>
                      {Number(p.amount) > 0 && (
                        <span className="text-sm font-black text-orange-700 bg-orange-50 border border-orange-200 px-2.5 py-0.5 rounded-lg">
                          -${Number(p.amount).toFixed(2)} USD
                        </span>
                      )}
                      {p.is_acknowledged && (
                        <span className="text-[10px] font-black text-gray-500 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-md">
                          ✓ Archivada
                        </span>
                      )}
                    </div>

                    {hasLostReason(p) ? (
                      <p className="text-sm text-amber-800 font-medium leading-relaxed mt-2 bg-amber-50 border border-amber-100 rounded-xl p-3">
                        El detalle de esta sanción se perdió por un fallo del sistema ya corregido.
                        Fue una suspensión automática por retraso en el despacho
                        {formatDelay(p.delay_hours) ? ` (${formatDelay(p.delay_hours)} de retraso)` : ""} y ya está descartada.
                      </p>
                    ) : (
                      <p className="text-sm text-gray-800 font-medium leading-relaxed mt-2">{displayReason}</p>
                    )}

                    {/* Appeal text subsegment */}
                    {appealText && (
                      <div className="mt-3 bg-blue-50/50 border border-blue-100 rounded-xl p-3 text-xs leading-relaxed text-blue-800">
                        <strong className="block font-black mb-1">📝 Tu Justificación de Apelación:</strong>
                        &quot;{appealText}&quot;
                      </div>
                    )}

                    {/* Admin response subsegment */}
                    {adminResponse && (
                      <div className="mt-3 bg-emerald-50/50 border border-emerald-100 rounded-xl p-3 text-xs leading-relaxed text-emerald-800">
                        <strong className="block font-black mb-1">💬 Respuesta del Administrador:</strong>
                        &quot;{adminResponse}&quot;
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-4 text-[11px] text-gray-400 mt-4">
                      {p.order_id && (
                        <span className="font-bold flex items-center gap-1 text-gray-500">
                          Orden: #{p.order_id?.substring(0, 8)}
                        </span>
                      )}
                      {producto && (
                        <>
                          <span>&middot;</span>
                          <span className="text-gray-500 truncate max-w-[220px]" title={producto}>
                            {producto}
                            {p.order_items?.quantity > 1 && ` ×${p.order_items.quantity}`}
                          </span>
                        </>
                      )}
                      {retraso && (
                        <>
                          <span>&middot;</span>
                          <span>{retraso} de retraso</span>
                        </>
                      )}
                      <span>&middot;</span>
                      <span>Registrada: {formatDate(p.created_at)}</span>
                      {/* Cuándo se cobró de verdad: la tienda veía el importe pero no la
                          fecha, ni forma de cuadrarlo con su billetera. */}
                      {p.status === "applied" && p.applied_at && (
                        <>
                          <span>&middot;</span>
                          <span className="text-gray-500">
                            {p.type === "fine" ? "Cobrada" : "Aplicada"}: {formatDate(p.applied_at)}
                          </span>
                        </>
                      )}
                    </div>
                    {p.type === "fine" && p.status === "applied" && (
                      <Link
                        to="/store/wallet"
                        className="inline-flex items-center gap-1 mt-2 text-[11px] font-bold text-[#6b1e96] hover:underline"
                      >
                        Ver el movimiento en mi billetera →
                      </Link>
                    )}
                  </div>

                  {/* Actions Column */}
                  <div className="flex sm:flex-col items-stretch gap-2 flex-wrap sm:min-w-[140px]">
                    {/* View Order Link */}
                    {p.order_id && (
                      <Link
                        to={`/store/orders?search=${p.order_id}`}
                        className="text-center text-xs font-black px-4 py-2 bg-gray-50 hover:bg-[#6b1e96]/10 text-gray-600 hover:text-[#6b1e96] border border-gray-200 hover:border-[#6b1e96]/30 rounded-xl transition-all"
                      >
                        🔍 Ver Orden
                      </Link>
                    )}

                    {/* Action buttons: if not appealed, not resolved, and not acknowledged */}
                    {isPendingAction && (
                      <>
                        {/* Appeal button: available for pending_review OR applied suspensions/cancellations */}
                        {canAppeal(p) && (
                          <button
                            onClick={() => handleAppealOpen(p.id)}
                            className="text-xs font-black px-4 py-2 bg-[#6b1e96] hover:bg-[#8b2bc0] text-white rounded-xl transition-all shadow-sm shadow-[#6b1e96]/20"
                          >
                            📝 Apelar
                          </button>
                        )}

                        {/* Acknowledge (Aceptar y Archivar) button */}
                        <button
                          onClick={() => handleAcknowledge(p.id)}
                          disabled={ackLoading[p.id]}
                          className="text-xs font-black px-4 py-2 bg-white hover:bg-amber-50 text-amber-700 border border-amber-200 hover:border-amber-300 rounded-xl transition-all disabled:opacity-50"
                          title="Aceptar la amonestación y archivar la notificación"
                        >
                          {ackLoading[p.id] ? "Archivando..." : "✔️ Aceptar Sanción"}
                        </button>
                      </>
                    )}

                    {/* Appeal statuses */}
                    {apelada && !p.resolved_by && (
                      <span className="text-center text-[10px] font-bold px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-100 flex items-center justify-center gap-1.5 animate-pulse">
                        ⏳ Apelada en curso
                      </span>
                    )}

                    {p.resolved_by && p.status === "applied" && (
                      <span className="text-center text-[10px] font-bold px-3 py-1.5 rounded-xl bg-red-50 text-red-700 border border-red-100 flex items-center justify-center gap-1.5">
                        ❌ Rechazada por Admin
                      </span>
                    )}

                    {p.resolved_by && p.status === "dismissed" && (
                      <span className="text-center text-[10px] font-bold px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center gap-1.5">
                        ✅ Condonada / Exenta
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Paginación. Antes se pedían 50 filas fijas y sin contador: a partir de la 51 las
          sanciones simplemente no existían para la tienda, sin ningún aviso. */}
      {!loading && total > PAGE_SIZE && (
        <div className="flex flex-wrap items-center justify-between gap-3 mt-5 px-1">
          <p className="text-xs text-gray-500">
            Mostrando{" "}
            <span className="font-bold text-gray-800">
              {offset + 1}–{Math.min(offset + penalties.length, total)}
            </span>{" "}
            de <span className="font-bold text-gray-800">{total}</span>
            {filterType ? " (con el filtro aplicado)" : ""}

          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
              disabled={offset === 0}
              className="px-3 py-1.5 text-xs font-bold border border-gray-200 bg-white rounded-xl hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              ← Anterior
            </button>
            <button
              onClick={() => setOffset(offset + PAGE_SIZE)}
              disabled={offset + penalties.length >= total}
              className="px-3 py-1.5 text-xs font-bold border border-gray-200 bg-white rounded-xl hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              Siguiente →
            </button>
          </div>
        </div>
      )}

      {/* Appeal Modal */}
      {appealModal.open && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4" onClick={() => setAppealModal({ open: false, penaltyId: null })}>
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl animate-scaleIn border border-gray-100" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-[#6b1e96]/10 text-[#6b1e96] flex items-center justify-center text-lg">📝</div>
              <h3 className="text-lg font-extrabold text-gray-900">Apelar Sanción</h3>
            </div>
            <p className="text-xs text-gray-500 mb-4 leading-relaxed">
              Explica claramente los motivos externos o de fuerza mayor por los cuales consideras que esta penalización debe ser condonada. Un administrador revisará las evidencias y responderá en un plazo máximo de 48 horas.
            </p>
            <textarea
              value={appealNote}
              onChange={(e) => setAppealNote(e.target.value)}
              placeholder="Escribe aquí tu justificación detallada..."
              rows={4}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-xs focus:ring-2 focus:ring-[#6b1e96]/20 focus:border-[#6b1e96] outline-none resize-none font-medium placeholder:text-gray-400"
            />
            <div className="flex justify-end gap-3 mt-5">
              <button
                onClick={() => setAppealModal({ open: false, penaltyId: null })}
                className="px-4 py-2.5 text-xs font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleAppealSubmit}
                disabled={appealLoading}
                className="px-5 py-2.5 text-xs font-black rounded-xl transition-all disabled:opacity-50 flex items-center gap-2"
                style={{ background: 'linear-gradient(135deg, #531575, #6b1e96)', color: '#c3ff00' }}
              >
                {appealLoading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    Enviando...
                  </>
                ) : "Enviar Apelación"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
