import { useState, useEffect } from "react";
import { useStore } from "../../context/StoreContext";
import { 
  getStoreRidersAPI, 
  affiliateRiderAPI, 
  updateRiderStatusAPI, 
  removeRiderAPI 
} from "../../services/api";
import { toast } from "react-hot-toast";
import LoadingSkeleton from "../../components/LoadingSkeleton";

export default function StoreRiders() {
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [emailToAfiliate, setEmailToAfiliate] = useState("");
  const [riderName, setRiderName] = useState("");
  const [riderPhone, setRiderPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const { storeProfile, fetchProfile, updateProfile } = useStore();
  const [deliveryForm, setDeliveryForm] = useState({
    offers_local_delivery: false,
    offers_pickup: false,
    default_delivery_fee: "",
    delivery_coverage_description: "",
  });
  const [savingDelivery, setSavingDelivery] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    if (storeProfile) {
      setDeliveryForm({
        offers_local_delivery: storeProfile.offers_local_delivery || false,
        offers_pickup: storeProfile.offers_pickup || false,
        default_delivery_fee: storeProfile.default_delivery_fee || "",
        delivery_coverage_description: storeProfile.delivery_coverage_description || "",
      });
    }
  }, [storeProfile]);

  const handleDeliveryChange = (e) => {
    const { name, value, type, checked } = e.target;
    setDeliveryForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleDeliverySubmit = async (e) => {
    e.preventDefault();
    setSavingDelivery(true);
    const payload = {
      ...storeProfile,
      ...deliveryForm
    };
    const res = await updateProfile(payload);
    setSavingDelivery(false);
    if (res.success) {
      toast.success("Configuración de delivery actualizada");
    } else {
      toast.error(res.error || "Error al actualizar configuración");
    }
  };

  const fetchRiders = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getStoreRidersAPI();
      setRiders(res.data?.data || res.data || []);
    } catch (err) {
      setError(err.message || "Error al cargar los repartidores");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRiders();
  }, []);

  const handleAffiliate = async (e) => {
    e.preventDefault();
    if (!emailToAfiliate.trim()) return;

    try {
      setSubmitting(true);
      const payload = { email: emailToAfiliate.trim() };
      if (riderName.trim()) payload.full_name = riderName.trim();
      if (riderPhone.trim()) payload.phone = riderPhone.trim();
      const res = await affiliateRiderAPI(payload);
      toast.success(res.data?.data?.full_name
        ? `${res.data.data.full_name} afiliado con éxito`
        : "Repartidor afiliado con éxito");
      setEmailToAfiliate("");
      setRiderName("");
      setRiderPhone("");
      fetchRiders();
    } catch (err) {
      toast.error(err.message || "No se pudo afiliar. Verifique el correo o que tenga app_metadata.role='delivery'");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      await updateRiderStatusAPI(id);
      toast.success(`Rider ${!currentStatus ? 'activado' : 'desactivado'}`);
      setRiders(prev => prev.map(r => r.id === id ? { ...r, is_active: !currentStatus } : r));
    } catch (err) {
      toast.error(err.message || "Error actualizando el estado");
    }
  };

  const handleRemove = async (id) => {
    if (!window.confirm("¿Estás seguro de eliminar este repartidor de tu flota?")) return;
    try {
      await removeRiderAPI(id);
      toast.success("Repartidor desvinculado de tu tienda");
      setRiders(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      toast.error(err.message || "Error al eliminar");
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Gestión de Repartidores (Fleet)</h2>
        <p className="text-sm text-gray-500 mt-1">
          Afilia usuarios registrados como &quot;Rider&quot; para enviarles tus órdenes locales.
        </p>
      </div>

      {/* Configuración de Delivery Local */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="bg-gray-50 px-5 py-4 border-b border-gray-200">
          <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-indigo-600">local_shipping</span>
            Configuración de Delivery Local
          </h3>
        </div>
        <div className="p-6">
          <form onSubmit={handleDeliverySubmit} className="space-y-4">
            <label className="flex items-start gap-4 cursor-pointer p-4 rounded-xl border transition-all duration-200 bg-gray-50 border-gray-200">
              <div className="mt-1">
                <input
                  type="checkbox"
                  name="offers_local_delivery"
                  checked={deliveryForm.offers_local_delivery}
                  onChange={handleDeliveryChange}
                  className="w-5 h-5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 cursor-pointer"
                />
              </div>
              <div>
                <span className="font-bold text-gray-900 text-sm block">Ofrezco Delivery Local en mi Ciudad</span>
                <span className="text-xs text-gray-500 block mt-1">
                  Los compradores podrán elegir &quot;Delivery Local&quot; y tus repartidores afiliados gestionarán la entrega.
                </span>
              </div>
            </label>

            {deliveryForm.offers_local_delivery && (
              <div className="pl-4 border-l-2 border-indigo-100 ml-2 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Tarifa base de Delivery (USD)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">$</span>
                    <input
                      type="number"
                      name="default_delivery_fee"
                      value={deliveryForm.default_delivery_fee}
                      onChange={handleDeliveryChange}
                      min="0"
                      step="0.01"
                      className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                      placeholder="0.00 = Delivery Gratis"
                    />
                  </div>
                  <p className="text-[10px] text-gray-500 mt-1">$0 = Gratis. Este valor es referencial.</p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Zona de Cobertura</label>
                  <input
                    type="text"
                    name="delivery_coverage_description"
                    value={deliveryForm.delivery_coverage_description}
                    onChange={handleDeliveryChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    placeholder="Ej: Centro y norte de la ciudad"
                  />
                </div>
              </div>
            )}

            <label className="flex items-start gap-4 cursor-pointer p-4 rounded-xl border transition-all duration-200 bg-gray-50 border-gray-200">
              <div className="mt-1">
                <input
                  type="checkbox"
                  name="offers_pickup"
                  checked={deliveryForm.offers_pickup}
                  onChange={handleDeliveryChange}
                  className="w-5 h-5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 cursor-pointer"
                />
              </div>
              <div>
                <span className="font-bold text-gray-900 text-sm block">Ofrezco Retiro en Tienda (Pickup)</span>
                <span className="text-xs text-gray-500 block mt-1">
                  Los compradores podrán retirar su pedido en tu local, sin costo de envío. En mostrador,
                  verifica el N° de orden y la cédula del destinatario antes de entregar. Asegúrate de tener
                  la dirección y el pin del mapa actualizados en tu Perfil de Tienda.
                </span>
              </div>
            </label>

            <button
              type="submit"
              disabled={savingDelivery}
              className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-lg text-sm hover:bg-indigo-700 transition disabled:opacity-50 flex items-center gap-2"
            >
              {savingDelivery ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              ) : (
                <span className="material-symbols-outlined text-[18px]">save</span>
              )}
              Guardar Configuración
            </button>
          </form>
        </div>
      </div>

      {/* Afilitate Box */}
      <div className="bg-white rounded-2xl border border-indigo-100 p-6 shadow-sm">
        <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px] text-indigo-600">person_add</span>
          Afiliar Nuevo Repartidor
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          Ingrese el correo electrónico del repartidor. Este debe haber creado una cuenta asignando su rol como Delivery en nuestra plataforma. Nombre y teléfono son opcionales; si no se indican, se tomarán del perfil del usuario.
        </p>
        <form onSubmit={handleAffiliate} className="space-y-3">
          <div className="flex gap-3">
            <input
              type="email"
              value={emailToAfiliate}
              onChange={(e) => setEmailToAfiliate(e.target.value)}
              placeholder="Correo electrónico *"
              required
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors outline-none"
            />
          </div>
          <div className="flex gap-3">
            <input
              type="text"
              value={riderName}
              onChange={(e) => setRiderName(e.target.value)}
              placeholder="Nombre completo (opcional)"
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors outline-none"
            />
            <input
              type="tel"
              value={riderPhone}
              onChange={(e) => setRiderPhone(e.target.value)}
              placeholder="Teléfono (opcional)"
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={submitting || !emailToAfiliate.trim()}
            className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
          >
            {submitting ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (
              <>
                <span className="material-symbols-outlined text-[18px]">add_link</span>
                Vincular
              </>
            )}
          </button>
        </form>
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="bg-gray-50 px-5 py-4 border-b border-gray-200">
          <h3 className="font-bold text-gray-900 text-sm">Mi Flota Actual</h3>
        </div>

        {error ? (
          <div className="p-10 text-center text-red-600">
            <p className="font-bold">{error}</p>
            <button onClick={fetchRiders} className="mt-4 px-4 py-2 bg-red-50 text-red-700 rounded-lg text-sm font-bold">Reintentar</button>
          </div>
        ) : loading ? (
          <div className="p-6">
            <LoadingSkeleton variant="order-card" count={2} />
          </div>
        ) : riders.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-indigo-50 text-indigo-300 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-[32px]">two_wheeler</span>
            </div>
            <h4 className="font-bold text-gray-900 mb-2">Aún no tienes repartidores afiliados</h4>
            <p className="text-gray-500 text-sm max-w-sm mx-auto">
              Empieza buscando a tu Rider de confianza y vincúlalo para gestionar los envíos a los usuarios de tu misma ciudad.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {riders.map((r) => (
              <div key={r.id} className="p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center hover:bg-gray-50/50 transition-colors">
                <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 flex-shrink-0">
                  <span className="material-symbols-outlined">two_wheeler</span>
                </div>
                
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 tracking-tight flex items-center gap-2">
                    {r.full_name || "Rider"}
                    {r.is_active ? (
                      <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-green-100 text-green-700 rounded-full">Activo</span>
                    ) : (
                      <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-700 rounded-full">Inactivo / Bloqueado</span>
                    )}
                  </h3>
                  <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-1">
                    <span className="material-symbols-outlined text-[16px]">call</span> {r.phone || "Sin teléfono"}
                    {r.zone && <span className="ml-2 text-xs bg-gray-100 px-2 py-0.5 rounded-full">{r.zone}</span>}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Afiliado el: {new Date(r.created_at).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex flex-row sm:flex-col gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => handleToggleStatus(r.id, r.is_active)}
                    className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      r.is_active ? "bg-amber-50 text-amber-700 hover:bg-amber-100" : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                    }`}
                  >
                    {r.is_active ? "Desactivar" : "Activar"}
                  </button>
                  <button
                    onClick={() => handleRemove(r.id)}
                    className="flex-1 sm:flex-none px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    Desvincular
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
