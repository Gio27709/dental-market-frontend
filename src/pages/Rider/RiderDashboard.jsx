import { useState, useEffect, useCallback } from "react";
import {
  getMyDeliveriesAPI,
  markDeliveryCompletedAPI,
  markPickedUpAPI,
  markArrivedAPI,
  markDeliveryFailedAPI,
} from "../../services/api";
import { toast } from "react-hot-toast";
import LoadingSkeleton from "../../components/LoadingSkeleton";
import DeliveryFailedModal from "../../components/rider/DeliveryFailedModal";
import ConfirmDeliveryModal from "../../components/rider/ConfirmDeliveryModal";
import RiderStats from "../../components/rider/RiderStats";

// ─── Status Config ───
const STATUS_CONFIG = {
  shipped: { label: "Asignado", color: "bg-blue-100 text-blue-800", dot: "bg-blue-500", icon: "inventory_2" },
  picked_up: { label: "En camino", color: "bg-indigo-100 text-indigo-800", dot: "bg-indigo-500", icon: "local_shipping" },
  arrived: { label: "En destino", color: "bg-amber-100 text-amber-800", dot: "bg-amber-500", icon: "location_on" },
  delivered: { label: "Entregado", color: "bg-green-100 text-green-800", dot: "bg-green-500", icon: "check_circle" },
  failed: { label: "No completada", color: "bg-red-100 text-red-800", dot: "bg-red-500", icon: "error" },
};

export default function RiderDashboard() {
  const [deliveries, setDeliveries] = useState([]);
  const [riderInfo, setRiderInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notAffiliated, setNotAffiliated] = useState(false);
  const [tab, setTab] = useState("active");
  const [actionLoading, setActionLoading] = useState(null); // { itemId, action }
  const [failedModal, setFailedModal] = useState({ open: false, itemId: null });
  const [confirmModal, setConfirmModal] = useState({ open: false, itemId: null });
  const [statsKey, setStatsKey] = useState(0); // For refreshing stats

  const [missingData, setMissingData] = useState(false);
  const [formData, setFormData] = useState({ full_name: "", cedula: "", phone: "", city: "", vehicle_type: "" });
  const [submittingData, setSubmittingData] = useState(false);

  const fetchDeliveries = useCallback(async () => {
    try {
      setLoading(true);
      setNotAffiliated(false);
      setMissingData(false);

      // Check if they have an application (their basic rider data)
      try {
        const appRes = await import("../../services/api").then(m => m.getMyRiderApplicationAPI());
        if (!appRes.data.data) {
          setMissingData(true);
          setLoading(false);
          return;
        }
      } catch (appErr) {
        if (appErr.response?.status === 404) {
          setMissingData(true);
          setLoading(false);
          return;
        }
      }

      const res = await getMyDeliveriesAPI();
      setDeliveries(res.data.data || []);
      setRiderInfo(res.data.rider || null);
    } catch (err) {
      const status = err.response?.status;
      const message = err.response?.data?.error || "";
      if (status === 404 && message.toLowerCase().includes("no afiliado")) {
        setNotAffiliated(true);
      } else {
        toast.error(message || "Error cargando asignaciones");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDeliveries(); }, [fetchDeliveries]);

  // ─── Filtered Lists ───
  const activeDeliveries = deliveries.filter(d => ["shipped", "picked_up", "arrived"].includes(d.delivery_status));
  const completedDeliveries = deliveries.filter(d => d.delivery_status === "delivered");
  const failedDeliveries = deliveries.filter(d => d.delivery_status === "failed");

  const tabCounts = {
    active: activeDeliveries.length,
    completed: completedDeliveries.length,
    failed: failedDeliveries.length,
  };

  const currentList = tab === "active" ? activeDeliveries : tab === "completed" ? completedDeliveries : failedDeliveries;

  // ─── Action Handlers ───
  const handleAction = async (itemId, action, apiCall, successMsg) => {
    try {
      setActionLoading({ itemId, action });
      await apiCall;
      toast.success(successMsg);
      await fetchDeliveries();
      setStatsKey(k => k + 1);
    } catch (err) {
      const msg = err.response?.data?.error || err.message;
      if (err.response?.status === 429) {
        toast(msg, { icon: "⏳" });
      } else {
        toast.error(msg || "Error en la operación");
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handlePickup = (itemId) => {
    handleAction(itemId, "pickup", markPickedUpAPI(itemId), "📦 ¡Paquete recogido y en ruta!");
  };

  const handleArrived = (itemId) => {
    // Set loading state immediately to prevent double-clicks while waiting for GPS
    setActionLoading({ itemId, action: "arrived" });

    // Try to get GPS coordinates
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          handleAction(itemId, "arrived",
            markArrivedAPI(itemId, { latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
            "🏍️ ¡Cliente notificado! Estás afuera."
          );
        },
        () => {
          // GPS failed — send without coords
          handleAction(itemId, "arrived", markArrivedAPI(itemId, {}), "🏍️ ¡Cliente notificado! Estás afuera.");
        },
        { timeout: 5000 }
      );
    } else {
      handleAction(itemId, "arrived", markArrivedAPI(itemId, {}), "🏍️ ¡Cliente notificado! Estás afuera.");
    }
  };

  const handleCompletedSubmit = async () => {
    await handleAction(confirmModal.itemId, "complete", markDeliveryCompletedAPI(confirmModal.itemId), "✅ ¡Entrega finalizada con éxito!");
    setConfirmModal({ open: false, itemId: null });
  };

  const handleFailedSubmit = async ({ reason, notes }) => {
    await handleAction(
      failedModal.itemId,
      "failed",
      markDeliveryFailedAPI(failedModal.itemId, { reason, notes }),
      "Entrega reportada como no completada."
    );
    setFailedModal({ open: false, itemId: null });
  };

  const openMap = (lat, lng, address) => {
    if (lat && lng) {
      window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`, "_blank");
    } else if (address) {
      // Pedidos sin GPS: buscar por la dirección escrita en vez de un botón muerto
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${address}, Venezuela`)}`, "_blank");
      toast("Sin GPS exacto: buscando por la dirección escrita.", { icon: "🗺️" });
    } else {
      toast.error("Coordenadas no proporcionadas.");
    }
  };

  const callClient = (phone) => {
    if (phone) {
      window.open(`tel:${phone}`, "_self");
    } else {
      toast.error("Número de teléfono no disponible.");
    }
  };

  const isActionLoading = (itemId, action) => actionLoading?.itemId === itemId && actionLoading?.action === action;

  // ─── Submit Missing Data ───
  const handleSubmitMissingData = async (e) => {
    e.preventDefault();
    try {
      setSubmittingData(true);
      const api = await import("../../services/api");
      await api.applyForRiderAPI(formData);
      toast.success("¡Datos actualizados correctamente!");
      fetchDeliveries(); // Reload, now missingData will be false
    } catch (error) {
      toast.error(error.response?.data?.error || "Error al enviar los datos.");
    } finally {
      setSubmittingData(false);
    }
  };

  // ─── Loading State ───
  if (loading) {
    return <div className="p-4"><LoadingSkeleton variant="order-card" count={3} /></div>;
  }

  // ─── Missing Data State ───
  if (missingData) {
    return (
      <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
        <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-black/[0.03] relative overflow-hidden">
          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-3xl bg-[#f3e8ff] flex items-center justify-center mb-6">
              <span className="material-symbols-outlined text-[40px] text-[#6b1e96]">badge</span>
            </div>
            
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900 mb-3">
              Completa tu Perfil
            </h2>
            <p className="text-gray-500 text-sm sm:text-base leading-relaxed mb-8">
              Para empezar a trabajar como Repartidor, necesitamos unos datos básicos sobre ti y tu vehículo.
            </p>

            <form onSubmit={handleSubmitMissingData} className="w-full text-left space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-gray-700">Nombre Completo</label>
                  <input required type="text" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#6b1e96]/20 focus:border-[#6b1e96] transition-all outline-none" placeholder="Ej. Juan Pérez" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-gray-700">Cédula</label>
                  <input required type="text" value={formData.cedula} onChange={e => setFormData({...formData, cedula: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#6b1e96]/20 focus:border-[#6b1e96] transition-all outline-none" placeholder="Ej. V-12345678" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-gray-700">Teléfono</label>
                  <input required type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#6b1e96]/20 focus:border-[#6b1e96] transition-all outline-none" placeholder="Ej. 04141234567" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-gray-700">Ciudad de Trabajo</label>
                  <input required type="text" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#6b1e96]/20 focus:border-[#6b1e96] transition-all outline-none" placeholder="Ej. San Cristóbal" />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-sm font-bold text-gray-700">Tipo de Vehículo</label>
                  <select required value={formData.vehicle_type} onChange={e => setFormData({...formData, vehicle_type: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#6b1e96]/20 focus:border-[#6b1e96] transition-all outline-none text-gray-700">
                    <option value="">Selecciona tu vehículo</option>
                    <option value="Moto">Motocicleta</option>
                    <option value="Bicicleta">Bicicleta</option>
                    <option value="Auto">Automóvil</option>
                  </select>
                </div>
              </div>

              <button disabled={submittingData} type="submit" className="w-full mt-6 flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-[#6b1e96] to-[#531575] hover:from-[#531575] hover:to-[#380e4f] text-white font-bold rounded-2xl text-sm uppercase tracking-wide transition-all shadow-lg shadow-purple-500/30 active:scale-[0.98] disabled:opacity-50">
                {submittingData ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Guardar mis datos"}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // ─── Not Affiliated State ───
  if (notAffiliated) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="bg-gradient-to-br from-[#6b1e96] to-[#380e4f] rounded-3xl p-8 sm:p-12 text-white shadow-xl shadow-purple-900/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-[#c3ff00]/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4"></div>
          
          <div className="relative z-10 flex flex-col items-center text-center max-w-md mx-auto">
            <div className="w-20 h-20 rounded-3xl bg-white/10 flex items-center justify-center backdrop-blur-sm border border-white/20 mb-6">
              <span className="material-symbols-outlined text-[40px] text-[#c3ff00]">two_wheeler</span>
            </div>
            
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-3">
              ¡Bienvenido, Repartidor!
            </h2>
            <p className="text-white/70 text-sm sm:text-base leading-relaxed mb-6">
              Tu cuenta está lista con el rol de <strong className="text-[#c3ff00]">Delivery</strong>, pero aún no estás afiliado a ninguna tienda.
            </p>

            <div className="w-full bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10 text-left space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-widest text-[#c3ff00]/90 flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">checklist</span>
                ¿Cómo empezar?
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-[#c3ff00] text-[#531575] flex items-center justify-center text-xs font-black flex-shrink-0 mt-0.5">1</div>
                  <p className="text-sm text-white/80 leading-relaxed">
                    <strong className="text-white">Contacta a una tienda</strong> registrada en la plataforma y comparte tu correo electrónico.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-[#c3ff00] text-[#531575] flex items-center justify-center text-xs font-black flex-shrink-0 mt-0.5">2</div>
                  <p className="text-sm text-white/80 leading-relaxed">
                    <strong className="text-white">La tienda te afiliará</strong> desde su panel de gestión de riders.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-[#c3ff00] text-[#531575] flex items-center justify-center text-xs font-black flex-shrink-0 mt-0.5">3</div>
                  <p className="text-sm text-white/80 leading-relaxed">
                    <strong className="text-white">¡Listo!</strong> Vuelve aquí y verás tus entregas asignadas.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={fetchDeliveries}
              className="mt-6 flex items-center gap-2 px-6 py-3 bg-[#c3ff00] hover:bg-[#aee600] text-[#531575] font-bold rounded-2xl text-sm uppercase tracking-wide transition-all shadow-lg shadow-[#c3ff00]/20 active:scale-95"
            >
              <span className="material-symbols-outlined text-[18px]">refresh</span>
              Verificar afiliación
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Render Action Buttons per status ───
  const renderActions = (job) => {
    const status = job.delivery_status;
    const phone = job.buyer?.phone;

    return (
      <div className="flex flex-col gap-2.5 mt-auto">
        {/* Top Row: Navigation + Call */}
        <div className="flex gap-2.5">
          <button
            onClick={() => openMap(job.orders?.delivery_lat, job.orders?.delivery_lng, job.orders?.delivery_address)}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-2xl text-[12px] uppercase tracking-wide transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">map</span>
            Navegar
          </button>

          {phone && status !== "delivered" && (
            <button
              onClick={() => callClient(phone)}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-50 hover:bg-green-100 text-green-700 font-bold rounded-2xl text-[12px] uppercase tracking-wide transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">call</span>
              Llamar
            </button>
          )}
        </div>

        {/* State-specific action buttons */}
        {status === "shipped" && (
          <button
            disabled={isActionLoading(job.id, "pickup")}
            onClick={() => handlePickup(job.id)}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-2xl text-[12px] uppercase tracking-wide transition-all shadow-lg shadow-indigo-500/30 active:scale-[0.98]"
          >
            {isActionLoading(job.id, "pickup") ? (
              <span className="w-5 h-5 border-[3px] border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span className="material-symbols-outlined text-[18px]">inventory_2</span>
                Recogido - En Camino
              </>
            )}
          </button>
        )}

        {(status === "shipped" || status === "picked_up") && (
          <button
            disabled={isActionLoading(job.id, "arrived")}
            onClick={() => handleArrived(job.id)}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-2xl text-[12px] uppercase tracking-wide transition-all shadow-lg shadow-amber-500/30 active:scale-[0.98]"
          >
            {isActionLoading(job.id, "arrived") ? (
              <span className="w-5 h-5 border-[3px] border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span className="material-symbols-outlined text-[18px]">location_on</span>
                Estoy Afuera
              </>
            )}
          </button>
        )}

        {(status === "shipped" || status === "picked_up" || status === "arrived") && (
          <div className="flex gap-2.5">
            <button
              disabled={isActionLoading(job.id, "complete")}
              onClick={() => setConfirmModal({ open: true, itemId: job.id })}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-gradient-to-b from-[#6b1e96] to-[#531575] hover:from-[#531575] hover:to-[#380e4f] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-2xl text-[12px] uppercase tracking-wide transition-all shadow-lg shadow-purple-500/30 active:scale-[0.98]"
            >
              {isActionLoading(job.id, "complete") ? (
                <span className="w-5 h-5 border-[3px] border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">done_all</span>
                  Entregado
                </>
              )}
            </button>
            <button
              onClick={() => setFailedModal({ open: true, itemId: job.id })}
              className="flex items-center justify-center gap-2 py-3.5 px-4 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-2xl text-[12px] uppercase tracking-wide transition-colors border border-red-200"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
              <span className="hidden sm:inline">No Completada</span>
            </button>
          </div>
        )}
      </div>
    );
  };

  // ─── Affiliated: Full Dashboard ───
  return (
    <div className="space-y-5 animate-fade-in relative">
      {/* Store Affiliation Badge */}
      <div className="bg-gradient-to-r from-[#6b1e96] to-[#531575] rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-purple-900/20 relative overflow-hidden">
         <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
         <div className="relative z-10 flex flex-col sm:flex-row items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-sm border border-white/20 shadow-inner">
               {riderInfo?.store?.logo_url ? (
                  <img src={riderInfo.store.logo_url} alt="Store Logo" className="w-full h-full object-cover rounded-2xl" />
               ) : (
                  <span className="material-symbols-outlined text-[32px] text-[#c3ff00]">storefront</span>
               )}
            </div>
            <div className="text-center sm:text-left">
               <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#c3ff00]/90">
                 Tienda Asignada (Afiliación)
               </span>
               <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">
                 {riderInfo?.store?.business_name || "Tienda"}
               </h2>
               <p className="text-sm font-medium text-white/70 mt-1">
                 ID Contratista: #{riderInfo?.id?.split('-')[0]?.toUpperCase() || "—"}
               </p>
            </div>
         </div>

         {/* Punto de recogida */}
         {(riderInfo?.store?.business_address || riderInfo?.store?.business_phone || (riderInfo?.store?.lat && riderInfo?.store?.lng)) && (
           <div className="relative z-10 mt-5 pt-5 border-t border-white/15 flex flex-col sm:flex-row sm:items-center gap-4">
             <div className="flex items-start gap-2.5 flex-1 min-w-0 text-center sm:text-left justify-center sm:justify-start">
               <span className="material-symbols-outlined text-[18px] text-[#c3ff00] mt-0.5 hidden sm:block">storefront</span>
               <div className="min-w-0">
                 <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#c3ff00]/90">Punto de recogida</span>
                 <p className="text-sm font-medium text-white/85 leading-relaxed mt-0.5">
                   {riderInfo?.store?.business_address
                     ? `${riderInfo.store.business_address}${riderInfo.store.state ? `, ${riderInfo.store.state}` : ""}`
                     : "Dirección no registrada por la tienda"}
                 </p>
               </div>
             </div>
             <div className="flex gap-2.5 justify-center sm:justify-end shrink-0">
               {(riderInfo?.store?.business_address || (riderInfo?.store?.lat && riderInfo?.store?.lng)) && (
                 <button
                   onClick={() => {
                     // El pin de la tienda manda; la dirección escrita es el fallback
                     const s = riderInfo.store;
                     const query = s.lat && s.lng
                       ? `${s.lat},${s.lng}`
                       : encodeURIComponent(`${s.business_address}${s.state ? `, ${s.state}` : ""}, Venezuela`);
                     window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, "_blank");
                   }}
                   className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold rounded-2xl text-[11px] uppercase tracking-wide transition-colors backdrop-blur-sm"
                 >
                   <span className="material-symbols-outlined text-[16px]">near_me</span>
                   Cómo llegar
                 </button>
               )}
               {riderInfo?.store?.business_phone && (
                 <button
                   onClick={() => window.open(`tel:${riderInfo.store.business_phone}`, "_self")}
                   className="flex items-center gap-2 px-4 py-2.5 bg-[#c3ff00] hover:bg-[#aee600] text-[#531575] font-bold rounded-2xl text-[11px] uppercase tracking-wide transition-colors"
                 >
                   <span className="material-symbols-outlined text-[16px]">call</span>
                   Llamar tienda
                 </button>
               )}
             </div>
           </div>
         )}
      </div>

      {/* Stats */}
      <RiderStats key={statsKey} />

      {/* Tabs — 3 tabs now */}
      <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-black/[0.03] overflow-hidden flex p-1.5 gap-1">
        {[
          { key: "active", label: "En Curso", count: tabCounts.active },
          { key: "completed", label: "Completadas", count: tabCounts.completed },
          { key: "failed", label: "Fallidas", count: tabCounts.failed },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 py-3 text-[12px] font-bold uppercase tracking-wider rounded-xl transition-all duration-300 ${
              tab === t.key 
                ? t.key === "failed" 
                  ? "bg-red-100 text-red-700 shadow-sm transform scale-[1.02]"
                  : "bg-[#c3ff00] text-[#531575] shadow-sm transform scale-[1.02]" 
                : "bg-transparent text-gray-500 hover:bg-gray-50"
            }`}
          >
            {t.label} ({t.count})
          </button>
        ))}
      </div>

      {/* Cards */}
      {currentList.length === 0 ? (
        <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-black/[0.03] p-16 text-center">
          <div className="w-24 h-24 mx-auto bg-gray-50 rounded-full flex items-center justify-center mb-6">
             <span className="material-symbols-outlined text-[48px] text-gray-300">two_wheeler</span>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Bandeja Vacía</h3>
          <p className="text-gray-500 font-medium">
            {tab === "active" ? "No hay entregas pendientes." : tab === "completed" ? "No hay entregas finalizadas aún." : "No hay entregas fallidas."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {currentList.map((job) => {
            const statusCfg = STATUS_CONFIG[job.delivery_status] || STATUS_CONFIG.shipped;
            return (
              <div key={job.id} className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-black/[0.05] transition-all hover:shadow-lg flex flex-col h-full relative overflow-hidden group">
                {/* Decoration Line */}
                <div className={`absolute top-0 left-0 w-full h-1.5 ${
                  job.delivery_status === "delivered" ? "bg-green-500" :
                  job.delivery_status === "failed" ? "bg-red-500" :
                  job.delivery_status === "arrived" ? "bg-amber-500" : "bg-[#6b1e96]"
                }`} />
                
                {/* Header: Order ID + Status Badge */}
                <div className="flex justify-between items-start mb-4">
                  <span className="bg-gray-100 text-gray-800 text-[10px] font-bold uppercase tracking-widest py-1.5 px-3 rounded-full">
                    Orden #{job.order_id.split("-")[0]}
                  </span>
                  <span className={`${statusCfg.color} text-[10px] font-bold uppercase tracking-widest py-1.5 px-3 rounded-full flex items-center gap-1.5`}>
                    <span className={`w-2 h-2 rounded-full ${statusCfg.dot} ${job.delivery_status === "arrived" ? "animate-pulse" : ""}`} />
                    {statusCfg.label}
                  </span>
                </div>

                {job.shipped_at && (
                  <div className="text-[11px] text-gray-400 font-medium mb-3 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                    <span>Asignado: {new Date(job.shipped_at).toLocaleString("es-VE", {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true
                    })}</span>
                  </div>
                )}

                {/* Product Info */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-[#f3e8ff] flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-[#6b1e96] text-[20px]">package_2</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{job.product_name}</p>
                    <p className="text-xs text-gray-500 font-medium">Cantidad: {job.quantity}</p>
                  </div>
                </div>
                
                {/* Delivery Info Card */}
                <div className="flex-grow space-y-3 mb-5">
                  <div className="p-4 bg-gray-50/80 rounded-2xl border border-gray-100 space-y-3">
                    {/* Address */}
                    <div>
                      <strong className="flex items-center gap-2 text-gray-900 mb-1.5 text-[10px] uppercase tracking-widest font-bold">
                         <span className="material-symbols-outlined text-[14px] text-[#6b1e96]">location_on</span>
                         Dirección
                      </strong>
                      <p className="text-gray-700 text-sm leading-relaxed font-medium pl-5">
                         {job.orders?.delivery_address || "Sin dirección"}
                      </p>
                    </div>

                    {/* Reference */}
                    {job.orders?.delivery_reference && (
                      <div className="text-xs text-amber-800 bg-amber-50 p-3 rounded-xl border border-amber-100/50 flex gap-2 items-start">
                        <span className="material-symbols-outlined text-[16px] shrink-0">info</span>
                        <p className="font-semibold leading-relaxed">{job.orders.delivery_reference}</p>
                      </div>
                    )}

                    {/* Buyer Contact */}
                    {job.buyer && job.delivery_status !== "delivered" && (
                      <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
                        <div className="w-8 h-8 rounded-full bg-[#6b1e96]/10 flex items-center justify-center flex-shrink-0">
                          <span className="material-symbols-outlined text-[16px] text-[#6b1e96]">person</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-gray-900 truncate">{job.buyer.first_name}</p>
                          {job.buyer.phone && (
                            <p className="text-[11px] text-gray-500 font-mono">{job.buyer.phone}</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Failure Reason (for failed tab) */}
                    {job.delivery_status === "failed" && job.last_failure_reason && (
                      <div className="text-xs text-red-700 bg-red-50 p-3 rounded-xl border border-red-200 flex gap-2 items-start">
                        <span className="material-symbols-outlined text-[16px] shrink-0">error</span>
                        <div>
                          <p className="font-bold mb-0.5">Motivo del fallo (intento #{job.delivery_attempts || 1})</p>
                          <p className="font-medium leading-relaxed">{job.last_failure_reason}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons — context-sensitive */}
                {renderActions(job)}
              </div>
            );
          })}
        </div>
      )}

      {/* Failed Delivery Modal */}
      <DeliveryFailedModal
        isOpen={failedModal.open}
        onClose={() => setFailedModal({ open: false, itemId: null })}
        onSubmit={handleFailedSubmit}
        loading={actionLoading?.action === "failed"}
      />

      {/* Confirm Delivery Modal */}
      <ConfirmDeliveryModal
        isOpen={confirmModal.open}
        onClose={() => setConfirmModal({ open: false, itemId: null })}
        onSubmit={handleCompletedSubmit}
        loading={actionLoading?.action === "complete"}
      />
    </div>
  );
}
