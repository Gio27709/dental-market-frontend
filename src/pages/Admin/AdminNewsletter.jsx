import { useState, useEffect } from "react";
import {
  getNewsletterSubscribersAPI,
  deleteNewsletterSubscriberAPI,
  updateNewsletterDiscountAPI,
  updateNewsletterLimitAPI,
  updateNewsletterEnabledAPI,
  getWeeklyPromotionsPreviewAPI,
  sendWeeklyPromotionsNewsletterAPI
} from "../../services/api";
import api from "../../services/api";
import toast from "react-hot-toast";

export default function AdminNewsletter() {
  const [subscribers, setSubscribers] = useState([]);
  const [discountPercent, setDiscountPercent] = useState("");
  const [discountInput, setDiscountInput] = useState("");
  const [limitOnce, setLimitOnce] = useState(true);
  const [newsletterEnabled, setNewsletterEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [savingDiscount, setSavingDiscount] = useState(false);
  const [savingLimit, setSavingLimit] = useState(false);
  const [savingEnabled, setSavingEnabled] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Weekly Promotions Newsletter States
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [sendingNewsletter, setSendingNewsletter] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [subscribersRes, settingsRes] = await Promise.all([
        getNewsletterSubscribersAPI(),
        api.get("/admin/settings")
      ]);

      setSubscribers(subscribersRes.data?.data || []);

      const discountValue = settingsRes.data?.data?.newsletter_discount;
      if (discountValue?.percentage !== undefined) {
        setDiscountPercent(String(discountValue.percentage));
        setDiscountInput(String(discountValue.percentage));
      } else {
        setDiscountPercent("10");
        setDiscountInput("10");
      }

      const limitValue = settingsRes.data?.data?.newsletter_limit_once;
      if (limitValue?.enabled !== undefined) {
        setLimitOnce(Boolean(limitValue.enabled));
      } else {
        setLimitOnce(true);
      }

      const enabledValue = settingsRes.data?.data?.newsletter_enabled;
      if (enabledValue?.enabled !== undefined) {
        setNewsletterEnabled(Boolean(enabledValue.enabled));
      } else {
        setNewsletterEnabled(true);
      }
    } catch (error) {
      console.error("Error loading newsletter data:", error);
      toast.error("Error al cargar los datos del boletín.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleLimit = async () => {
    const newValue = !limitOnce;
    setLimitOnce(newValue);

    try {
      setSavingLimit(true);
      const res = await updateNewsletterLimitAPI(newValue);
      if (res.data?.success) {
        toast.success(`Restricción de suscripción única ${newValue ? "activada" : "desactivada"}.`);
      } else {
        setLimitOnce(!newValue);
        toast.error("Error al actualizar la restricción.");
      }
    } catch (error) {
      setLimitOnce(!newValue);
      console.error("Error updating limit:", error);
      toast.error(error.response?.data?.error || "Error al actualizar la restricción.");
    } finally {
      setSavingLimit(false);
    }
  };

  const handleToggleEnabled = async () => {
    const newValue = !newsletterEnabled;
    setNewsletterEnabled(newValue);

    try {
      setSavingEnabled(true);
      const res = await updateNewsletterEnabledAPI(newValue);
      if (res.data?.success) {
        toast.success(`Boletín en el footer ${newValue ? "activado" : "desactivado"} correctamente.`);
      } else {
        setNewsletterEnabled(!newValue);
        toast.error("Error al actualizar la visibilidad del boletín.");
      }
    } catch (error) {
      setNewsletterEnabled(!newValue);
      console.error("Error updating newsletter visibility:", error);
      toast.error(error.response?.data?.error || "Error al actualizar la visibilidad.");
    } finally {
      setSavingEnabled(false);
    }
  };

  const handleSaveDiscount = async (e) => {
    e.preventDefault();
    const percent = parseFloat(discountInput);
    if (isNaN(percent) || percent < 0 || percent > 100) {
      toast.error("Por favor, ingresa un porcentaje válido (0-100).");
      return;
    }

    setSavingDiscount(true);
    try {
      const res = await updateNewsletterDiscountAPI(percent);
      if (res.data?.success) {
        setDiscountPercent(String(percent));
        toast.success(`Descuento de suscripción actualizado al ${percent}%`);
      } else {
        toast.error("Error al actualizar el descuento.");
      }
    } catch (error) {
      console.error("Error saving discount:", error);
      toast.error(error.response?.data?.error || "Error al actualizar el descuento.");
    } finally {
      setSavingDiscount(false);
    }
  };

  const handleDeleteSubscriber = async (id, email) => {
    const confirmed = window.confirm(`¿Estás seguro de que deseas dar de baja y eliminar a "${email}" del boletín?`);
    if (!confirmed) return;

    setDeletingId(id);
    try {
      const res = await deleteNewsletterSubscriberAPI(id);
      if (res.data?.success) {
        toast.success(`Suscripción de "${email}" eliminada.`);
        setSubscribers((prev) => prev.filter((s) => s.id !== id));
      } else {
        toast.error("Error al eliminar la suscripción.");
      }
    } catch (error) {
      console.error("Error deleting subscriber:", error);
      toast.error(error.response?.data?.error || "Error al eliminar la suscripción.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleOpenPreview = async () => {
    setShowPreviewModal(true);
    setLoadingPreview(true);
    setPreviewData(null);
    try {
      const res = await getWeeklyPromotionsPreviewAPI();
      if (res.data?.success) {
        setPreviewData(res.data.data);
      } else {
        toast.error("Error al obtener la previsualización del boletín.");
        setShowPreviewModal(false);
      }
    } catch (error) {
      console.error("Error loading newsletter preview:", error);
      toast.error(error.response?.data?.error || "Error al cargar la previsualización.");
      setShowPreviewModal(false);
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleSendWeeklyNewsletter = async () => {
    const confirmed = window.confirm(
      `¿Estás seguro de que deseas enviar el boletín de promociones de la semana a todos los suscriptores activos (${subscribers.length})?`
    );
    if (!confirmed) return;

    setSendingNewsletter(true);
    try {
      const res = await sendWeeklyPromotionsNewsletterAPI();
      if (res.data?.success) {
        toast.success(res.data.message || "¡Boletín semanal de promociones enviado exitosamente!");
        setShowPreviewModal(false);
      } else {
        toast.error("Error al enviar el boletín semanal.");
      }
    } catch (error) {
      console.error("Error sending weekly newsletter:", error);
      toast.error(error.response?.data?.error || "Error al enviar el boletín.");
    } finally {
      setSendingNewsletter(false);
    }
  };  const filteredSubscribers = subscribers.filter((s) =>
    s.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const thStyle = {
    padding: "14px 16px",
    fontSize: "11px",
    fontWeight: 700,
    color: "rgba(195,255,0,0.9)",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    whiteSpace: "nowrap",
  };

  const inputFocusHandlers = {
    onFocus: (e) => {
      e.target.style.borderColor = "#6b1e96";
      e.target.style.boxShadow = "0 0 0 3px rgba(107,30,150,0.08)";
    },
    onBlur: (e) => {
      e.target.style.borderColor = "#e5e7eb";
      e.target.style.boxShadow = "none";
    },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="w-10 h-10 border-4 border-[#c3ff00] border-t-[#6b1e96] rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="w-full mx-auto animate-fade-in-up space-y-6">
      
      {/* Header */}
      <div className="bg-[#6b1e96] p-8 text-white rounded-xl shadow-sm relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
        <h1 className="text-3xl font-bold font-['Manrope'] mb-2 relative z-10">Boletín y Suscriptores</h1>
        <p className="text-purple-200 text-sm max-w-2xl relative z-10 leading-relaxed">
          Administra la lista de correos del boletín promocional de DentalMarket y cambia dinámicamente la oferta de suscripción de bienvenida.
        </p>
      </div>

      {/* Grid: Configuración Descuento + Restricción + Visibilidad + Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Card Descuento Boletín */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-purple-100 text-[#6b1e96] flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">percent</span>
              </div>
              <h2 className="text-lg font-bold text-gray-900 font-['Manrope']">Descuento de Bienvenida</h2>
            </div>
            <p className="text-gray-500 text-xs leading-relaxed mb-4">
              Porcentaje ofrecido al suscribirse. Se reflejará dinámicamente en el Footer y en el email de bienvenida.
            </p>
          </div>

          <form onSubmit={handleSaveDiscount} className="flex gap-2 items-end mt-2">
            <div className="flex-1 relative">
              <input
                type="number"
                step="0.5"
                min="0"
                max="100"
                value={discountInput}
                onChange={(e) => setDiscountInput(e.target.value)}
                placeholder="Ej: 10"
                className="w-full pl-3 pr-8 py-2 border border-gray-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#6b1e96]/30 focus:border-[#6b1e96] transition-all"
                {...inputFocusHandlers}
              />
              <span className="absolute right-3 bottom-2 text-gray-400 font-bold text-sm">%</span>
            </div>
            <button
              type="submit"
              disabled={savingDiscount || !discountInput || discountInput === discountPercent}
              className={`px-4 py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 whitespace-nowrap ${
                savingDiscount || !discountInput || discountInput === discountPercent
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
                  : "bg-[#6b1e96] text-white hover:bg-[#531575] shadow-sm active:scale-[0.98]"
              }`}
            >
              {savingDiscount ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <span className="material-symbols-outlined text-[16px]">save</span>
              )}
              Guardar
            </button>
          </form>
        </div>

        {/* Card Restricción Boletín */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">verified_user</span>
              </div>
              <h2 className="text-lg font-bold text-gray-900 font-['Manrope']">Regla de Registro</h2>
            </div>
            <p className="text-gray-500 text-xs leading-relaxed mb-4">
              Controla si un correo electrónico puede registrarse múltiples veces o si se limita a una sola vez por cuenta/correo.
            </p>
          </div>

          <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-50">
            <span className="text-sm font-semibold text-gray-700">Suscripción única</span>
            <button
              onClick={handleToggleLimit}
              disabled={savingLimit}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#c3ff00] focus:ring-offset-2 ${
                savingLimit ? "opacity-50 cursor-not-allowed" : ""
              } ${limitOnce ? "bg-[#c3ff00]" : "bg-gray-300"}`}
              aria-pressed={limitOnce}
            >
              <span className="sr-only">Restringir suscripción</span>
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 shadow-sm ${
                  limitOnce ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Card Estado de Visibilidad Boletín */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">visibility</span>
              </div>
              <h2 className="text-lg font-bold text-gray-900 font-['Manrope']">Visibilidad en Web</h2>
            </div>
            <p className="text-gray-500 text-xs leading-relaxed mb-4">
              Muestra u oculta por completo la sección del boletín en el pie de página (Footer) de la tienda pública.
            </p>
          </div>

          <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-50">
            <span className="text-sm font-semibold text-gray-700">Mostrar Boletín</span>
            <button
              onClick={handleToggleEnabled}
              disabled={savingEnabled}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#c3ff00] focus:ring-offset-2 ${
                savingEnabled ? "opacity-50 cursor-not-allowed" : ""
              } ${newsletterEnabled ? "bg-[#c3ff00]" : "bg-gray-300"}`}
              aria-pressed={newsletterEnabled}
            >
              <span className="sr-only">Alternar visibilidad del boletín</span>
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 shadow-sm ${
                  newsletterEnabled ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Card Resumen Rápido */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-green-100 text-green-700 flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">group</span>
              </div>
              <h2 className="text-lg font-bold text-gray-900 font-['Manrope']">Resumen del Canal</h2>
            </div>
            <p className="text-gray-500 text-sm leading-relaxed mb-4">
              Estadísticas rápidas de tu lista de correo.
            </p>
          </div>

          <div className="space-y-3 mt-2">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-xs font-semibold text-gray-500">Suscriptores Totales</span>
              <span className="text-base font-bold text-[#6b1e96]">{subscribers.length}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-xs font-semibold text-gray-500">Oferta Activa</span>
              <span className="text-base font-bold text-[#557300] bg-green-50 px-2 py-0.5 rounded text-[13px]">{discountPercent}% OFF</span>
            </div>
          </div>
        </div>

      </div>

      {/* Panel Premium Boletín Semanal */}
      <div className="bg-gradient-to-r from-[#1a0a2e] to-[#451066] rounded-2xl shadow-lg p-6 text-white flex flex-col md:flex-row items-center justify-between gap-6 hover:shadow-xl transition-all relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-12 h-12 rounded-xl bg-[#c3ff00]/10 flex items-center justify-center text-[#c3ff00] shrink-0 animate-pulse">
            <span className="material-symbols-outlined text-[28px]">campaign</span>
          </div>
          <div>
            <h2 className="text-xl font-bold font-['Manrope'] mb-1">Boletín de Promociones de la Semana</h2>
            <p className="text-purple-200 text-xs leading-relaxed max-w-xl">
              Genera y despacha el correo semanal a todos los suscriptores activos. El contenido se alimenta de forma dinámica de las promociones globales vigentes y los 6 productos con mejores descuentos de la semana.
            </p>
          </div>
        </div>
        <div className="flex gap-3 shrink-0 relative z-10 w-full md:w-auto">
          <button
            onClick={handleOpenPreview}
            className="flex-1 md:flex-none border border-[#c3ff00] text-[#c3ff00] hover:bg-[#c3ff00]/10 active:scale-[0.98] px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[16px]">visibility</span>
            Previsualizar
          </button>
          <button
            onClick={handleSendWeeklyNewsletter}
            disabled={subscribers.length === 0}
            className={`flex-1 md:flex-none bg-[#c3ff00] text-[#1a0a2e] hover:bg-[#b0e600] active:scale-[0.98] px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-sm ${
              subscribers.length === 0 ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">send</span>
            Enviar Boletín
          </button>
        </div>
      </div>

      {/* Buscador de Suscriptores */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 select-none">
            <span className="material-symbols-outlined text-[20px] align-middle">search</span>
          </span>
          <input
            type="text"
            placeholder="Buscar suscriptor por dirección de correo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#6b1e96]/30 focus:border-[#6b1e96] transition-all bg-gray-50/50"
            {...inputFocusHandlers}
          />
        </div>
      </div>

      {/* Tabla de Suscriptores */}
      {filteredSubscribers.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center shadow-sm">
          <span className="material-symbols-outlined text-[64px] text-gray-300 mb-4 block">mail</span>
          <h3 className="text-base font-bold text-gray-700 mb-1">Sin suscriptores</h3>
          <p className="text-gray-400 text-sm max-w-md mx-auto">
            {searchTerm ? "No se encontraron suscriptores que coincidan con tu búsqueda." : "Aún nadie se ha suscrito al boletín informativo."}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left min-w-[500px]">
              <thead>
                <tr className="bg-gradient-to-r from-[#1a0a2e] to-[#2d1248]">
                  <th style={thStyle}>Correo Electrónico</th>
                  <th style={thStyle}>Fecha de Registro</th>
                  <th style={thStyle}>Estado</th>
                  <th style={{ ...thStyle, textAlign: "center" }}>Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredSubscribers.map((sub) => {
                  const subDate = sub.created_at
                    ? new Date(sub.created_at).toLocaleDateString("es-VE", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      })
                    : "—";

                  const isDeleting = deletingId === sub.id;

                  return (
                    <tr
                      key={sub.id}
                      className="hover:bg-purple-50/30 transition-colors bg-white"
                    >
                      {/* EMAIL */}
                      <td className="px-6 py-4.5 align-middle text-sm font-semibold text-gray-800">
                        {sub.email}
                      </td>

                      {/* DATE */}
                      <td className="px-6 py-4.5 align-middle text-xs font-medium text-gray-500">
                        {subDate}
                      </td>

                      {/* STATUS */}
                      <td className="px-6 py-4.5 align-middle">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-green-50 text-green-700 border border-green-200">
                          Activo
                        </span>
                      </td>

                      {/* ACTIONS */}
                      <td className="px-6 py-4.5 align-middle text-center">
                        <button
                          onClick={() => handleDeleteSubscriber(sub.id, sub.email)}
                          disabled={isDeleting}
                          className={`inline-flex items-center justify-center p-2 rounded-lg transition-colors border-none cursor-pointer hover:bg-red-50 text-red-500 hover:text-red-700 bg-transparent ${
                            isDeleting ? "opacity-50 cursor-not-allowed" : ""
                          }`}
                          title="Eliminar suscriptor"
                        >
                          {isDeleting ? (
                            <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <span className="material-symbols-outlined text-[20px]">delete_forever</span>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal de Previsualización de Correo Semanal */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-scale-up border border-gray-100">
            {/* Header del Modal */}
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900 font-['Manrope'] flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#6b1e96]">preview</span>
                  Previsualización del Boletín Semanal
                </h3>
                <p className="text-xs text-gray-500">Simulación del correo electrónico que recibirán los suscriptores</p>
              </div>
              <button
                onClick={() => setShowPreviewModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100 border-none cursor-pointer bg-transparent"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Contenido / Simulación de Email */}
            <div className="flex-1 overflow-y-auto p-6 bg-gray-100/50 flex justify-center">
              {loadingPreview ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="w-10 h-10 border-4 border-[#c3ff00] border-t-[#6b1e96] rounded-full animate-spin mb-3"></div>
                  <p className="text-sm text-gray-500 font-medium">Analizando promociones y cargando productos...</p>
                </div>
              ) : previewData ? (
                <div className="w-full max-w-[600px] bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden text-left font-sans text-gray-700">
                  {/* Email Header */}
                  <div className="bg-gradient-to-br from-[#531575] to-[#6b1e96] p-6 text-center text-white">
                    <div className="inline-block w-8 h-8 rounded-lg bg-[#c3ff00] text-[#531575] text-center font-bold text-lg leading-8 align-middle">
                      +
                    </div>
                    <span className="text-xl font-extrabold tracking-widest text-white ml-2 align-middle">DENTIX</span>
                    <div className="mt-2 text-[10px] font-bold text-purple-200 uppercase tracking-widest">
                      Boletín Semanal de Promociones
                    </div>
                  </div>

                  {/* Email Body */}
                  <div className="p-8">
                    <h1 className="text-lg font-bold text-gray-800 text-center mb-2">🦷 ¡Las ofertas más calientes de la semana!</h1>
                    <p className="text-xs text-gray-500 text-center leading-relaxed mb-6">
                      Estimado profesional de la salud oral, hemos reunido para ti los descuentos más importantes y las campañas activas esta semana en <strong>Dental Market</strong>. ¡Adquiere tus insumos clínicos al mejor precio hoy mismo!
                    </p>

                    {/* Campañas de la Semana */}
                    {previewData.promotions?.length > 0 && (
                      <div className="mb-6">
                        <h2 className="text-xs font-bold text-[#531575] border-b-2 border-gray-100 pb-1.5 uppercase tracking-wider mb-3">🔥 Campañas de la Semana</h2>
                        <div className="space-y-3">
                          {previewData.promotions.map((p) => (
                            <div key={p.id} className="border-l-4 border-[#6b1e96] bg-gray-50 p-3.5 rounded-r-lg">
                              <span className="inline-block text-[8px] font-bold text-white px-2 py-0.5 rounded-full mb-1.5 uppercase" style={{ backgroundColor: p.badge_color || '#ef4444' }}>
                                {p.badge_text || 'OFERTA'}
                              </span>
                              <h3 className="text-xs font-bold text-gray-900 mb-0.5">{p.title}</h3>
                              {p.subtitle && <p className="text-[10px] text-[#6b1e96] font-semibold mb-1">{p.subtitle}</p>}
                              {p.description && <p className="text-[10px] text-gray-500 leading-normal">{p.description}</p>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Productos en Promoción */}
                    {previewData.products?.length > 0 ? (
                      <div className="mb-4">
                        <h2 className="text-xs font-bold text-[#531575] border-b-2 border-gray-100 pb-1.5 uppercase tracking-wider mb-4">⭐ Ofertas Destacadas</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {previewData.products.map((p) => {
                            let imgUrl = "https://via.placeholder.com/150?text=Producto";
                            if (p.images && p.images.length > 0) {
                              const firstImg = p.images[0];
                              imgUrl = firstImg.startsWith("http")
                                ? firstImg
                                : `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/products/${firstImg}`;
                            }

                            const discountBadge = p.active_discount.discount_type === "percentage"
                              ? `-${p.active_discount.discount_value}%`
                              : `-$${p.active_discount.discount_value}`;

                            return (
                              <div key={p.id} className="border border-gray-100 rounded-xl p-3 bg-white flex flex-col justify-between shadow-sm hover:shadow-md transition-all">
                                <div>
                                  <div className="relative bg-gray-50/50 rounded-lg h-28 flex items-center justify-center overflow-hidden mb-2.5">
                                    <img src={imgUrl} alt={p.name} className="max-h-24 max-w-full object-contain" />
                                    <span className="absolute top-1.5 right-1.5 bg-red-500 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full">
                                      {discountBadge}
                                    </span>
                                  </div>
                                  <span className="text-[9px] font-semibold text-gray-400 uppercase tracking-wide block mb-0.5">
                                    {p.store_profiles?.business_name || "Tienda"}
                                  </span>
                                  <h4 className="text-xs font-bold text-gray-800 line-clamp-2 leading-tight mb-2 h-7">
                                    {p.name}
                                  </h4>
                                </div>
                                <div>
                                  <div className="mb-2">
                                    <span className="text-[10px] text-gray-400 line-through mr-1.5">${Number(p.price).toFixed(2)}</span>
                                    <span className="text-xs font-extrabold text-[#6b1e96]">${Number(p.active_discount.final_price).toFixed(2)}</span>
                                  </div>
                                  <span className="block text-center bg-[#6b1e96] text-white text-[9px] font-bold py-1.5 rounded-lg uppercase tracking-wider">
                                    Ver Oferta
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-6 border border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                        <span className="material-symbols-outlined text-[36px] text-gray-300 mb-1 block">shopping_bag</span>
                        <p className="text-xs text-gray-400 font-medium">No se detectaron productos rebajados esta semana.</p>
                      </div>
                    )}

                    {/* Botón CTA general */}
                    <div className="mt-8 mb-4 text-center">
                      <span className="inline-block bg-gradient-to-r from-[#531575] to-[#6b1e96] text-white font-bold text-xs px-6 py-3 rounded-lg uppercase tracking-wider shadow-sm">
                        Explorar Todas las Promociones
                      </span>
                    </div>

                  </div>

                  {/* Email Footer */}
                  <div className="bg-gray-50 border-t border-gray-100 p-6 text-center text-[10px] text-gray-400 leading-normal">
                    <p className="m-0 mb-1.5">Este correo fue enviado por Dental Market a sus suscriptores activos.<br />Si ya no deseas recibir este boletín semanal, puedes darte de baja en la plataforma.</p>
                    <p className="m-0 text-[#6b1e96] font-semibold">© 2026 Dental Market. Todos los derechos reservados.</p>
                  </div>

                </div>
              ) : (
                <div className="text-center py-10">
                  <p className="text-sm text-red-500 font-bold">Error al cargar la previsualización.</p>
                </div>
              )}
            </div>

            {/* Footer del Modal */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowPreviewModal(false)}
                disabled={sendingNewsletter}
                className="px-4 py-2 border border-gray-300 text-gray-700 bg-white rounded-lg text-sm font-semibold hover:bg-gray-50 active:scale-95 transition-all border-none cursor-pointer"
              >
                Cerrar
              </button>
              <button
                onClick={handleSendWeeklyNewsletter}
                disabled={sendingNewsletter || !previewData || (previewData.promotions?.length === 0 && previewData.products?.length === 0)}
                className={`px-5 py-2 bg-[#6b1e96] text-white rounded-lg text-sm font-semibold hover:bg-[#531575] active:scale-95 transition-all flex items-center gap-2 border-none cursor-pointer ${
                  sendingNewsletter || !previewData || (previewData.promotions?.length === 0 && previewData.products?.length === 0)
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
              >
                {sendingNewsletter ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Despachando...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">send</span>
                    Enviar Boletín Ahora
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
