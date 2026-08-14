import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import {
  getClinicSubscriptionsAPI,
  createClinicSubscriptionAPI,
  updateClinicSubscriptionStatusAPI,
  deleteClinicSubscriptionAPI,
  getProducts,
} from "../../services/api";

export default function ClinicSubscriptions() {
  const [loading, setLoading] = useState(true);
  const [subscriptions, setSubscriptions] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [catalogProducts, setCatalogProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [frequencyDays, setFrequencyDays] = useState(30);

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const res = await getClinicSubscriptionsAPI();
      if (res.data.success) {
        setSubscriptions(res.data.data);
      }
    } catch (err) {
      console.error("Error al cargar suscripciones:", err);
      toast.error("Error al obtener suscripciones recurrentes.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchCatalog = async (query) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setCatalogProducts([]);
      return;
    }

    try {
      // El catálogo responde en `data`, no en `products`.
      const res = await getProducts({ search: query, limit: 6 });
      setCatalogProducts(res.data?.data || []);
    } catch (err) {
      console.error("Error buscando productos:", err);
    }
  };

  const handleCreateSubscription = async () => {
    if (!selectedProduct) {
      toast.error("Selecciona un producto para la suscripción");
      return;
    }

    try {
      const res = await createClinicSubscriptionAPI({
        productId: selectedProduct.id,
        quantity,
        frequencyDays,
      });

      if (res.data.success) {
        toast.success(res.data.message);
        setIsModalOpen(false);
        setSelectedProduct(null);
        setSearchQuery("");
        fetchSubscriptions();
      }
    } catch (err) {
      console.error("Error al crear suscripción:", err);
      toast.error("No se pudo crear la suscripción.");
    }
  };

  const handleToggleStatus = async (sub) => {
    const newStatus = sub.status === "ACTIVE" ? "PAUSED" : "ACTIVE";
    try {
      const res = await updateClinicSubscriptionStatusAPI(sub.id, newStatus);

      if (res.data.success) {
        toast.success(res.data.message);
        fetchSubscriptions();
      }
    } catch (err) {
      console.error("Error al actualizar estado:", err);
      toast.error("Error al cambiar estado de la suscripción.");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("¿Deseas cancelar esta suscripción de compra recurrente?")) return;

    try {
      const res = await deleteClinicSubscriptionAPI(id);

      if (res.data.success) {
        toast.success(res.data.message);
        fetchSubscriptions();
      }
    } catch (err) {
      console.error("Error al eliminar suscripción:", err);
      toast.error("No se pudo eliminar la suscripción.");
    }
  };

  return (
    <div className="space-y-8">
      {/* ── HEADER ── */}
      <div className="bg-white p-8 rounded-3xl border border-[#cdc3d4]/20 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#541a97]"></span>
            <span className="text-xs font-bold text-[#541a97]/80 tracking-widest uppercase">
              Compras Recurrentes
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-[#111c2c] tracking-tight flex items-center gap-3">
            <span className="material-symbols-outlined text-[32px] text-[#541a97]">
              sync
            </span>
            Suscripciones Recurrentes B2B
          </h1>
          <p className="text-base text-[#4b4452] mt-1 max-w-xl">
            Programa el reabastecimiento periódico de tus insumos esenciales sin necesidad de ordenarlos manualmente.
          </p>
        </div>

        <button
          onClick={() => {
            setSelectedProduct(null);
            setSearchQuery("");
            setQuantity(1);
            setFrequencyDays(30);
            setIsModalOpen(true);
          }}
          className="flex items-center justify-center gap-2 px-6 py-3.5 bg-[#541a97] hover:bg-[#6c38b0] text-white rounded-2xl font-bold text-sm shadow-md transition-all cursor-pointer"
        >
          <span className="material-symbols-outlined text-[20px]">add_circle</span>
          <span>Nueva Suscripción</span>
        </button>
      </div>

      {/* ── LISTADO DE SUSCRIPCIONES ── */}
      <div className="bg-white rounded-3xl border border-[#cdc3d4]/20 overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 text-center text-[#4b4452] font-medium">Cargando suscripciones...</div>
        ) : subscriptions.length === 0 ? (
          <div className="p-16 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-[#541a97]/5 border border-[#541a97]/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-[32px] text-[#541a97]">
                sync
              </span>
            </div>
            <h3 className="text-lg font-bold text-[#111c2c]">No tienes suscripciones activas</h3>
            <p className="text-sm text-[#4b4452] max-w-md mx-auto">
              Las suscripciones te permiten programar reposiciones automáticas (ej. cada 15, 30 o 60 días) para los insumos esenciales que nunca deben faltar en tu clínica.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#cdc3d4]/20">
            {subscriptions.map((sub) => (
              <div
                key={sub.id}
                className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-[#f0f3ff]/40 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <img
                    src={sub.productImage || "/placeholder.png"}
                    alt={sub.productName}
                    className="w-16 h-16 object-cover rounded-2xl border border-[#cdc3d4]/30 flex-shrink-0"
                  />
                  <div>
                    <h3 className="font-bold text-[#111c2c] text-base">{sub.productName}</h3>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-[#4b4452] mt-1.5">
                      <span className="flex items-center gap-1 font-medium">
                        <span className="material-symbols-outlined text-[16px] text-[#4b4452]">storefront</span>
                        {sub.storeName || "Tienda Proveedora"}
                      </span>
                      <span>•</span>
                      <span className="font-semibold text-[#111c2c]">Cantidad: {sub.quantity} unidad(es)</span>
                      <span>•</span>
                      <span className="font-bold text-[#541a97]">Frecuencia: Cada {sub.frequencyDays} días</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 pt-4 md:pt-0 border-[#cdc3d4]/20">
                  <div className="text-left md:text-right">
                    <p className="text-xs text-[#4b4452] flex items-center gap-1 font-semibold">
                      <span className="material-symbols-outlined text-[16px] text-[#541a97]">calendar_today</span>
                      Próximo Despacho:
                    </p>
                    <p className="text-sm font-extrabold text-[#111c2c] mt-0.5">
                      {new Date(sub.nextDeliveryDate).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleStatus(sub)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                        sub.status === "ACTIVE"
                          ? "bg-[#ffddb9]/40 text-[#7a4b00] border border-[#ffb961]/40 hover:bg-[#ffddb9]/60"
                          : "bg-[#006d37]/10 text-[#006d37] border border-[#006d37]/30 hover:bg-[#006d37]/20"
                      }`}
                    >
                      {sub.status === "ACTIVE" ? (
                        <>
                          <span className="material-symbols-outlined text-[16px]">pause_circle</span>
                          <span>Pausar</span>
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-[16px]">play_circle</span>
                          <span>Reanudar</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleDelete(sub.id)}
                      className="p-2 text-[#ba1a1a] hover:bg-[#ba1a1a]/10 rounded-xl transition-colors cursor-pointer"
                      title="Cancelar Suscripción"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── MODAL NUEVA SUSCRIPCIÓN ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-[#cdc3d4]/30">
            <div className="flex items-center justify-between border-b border-[#cdc3d4]/20 pb-3">
              <h3 className="text-lg font-bold text-[#111c2c] flex items-center gap-2">
                <span className="material-symbols-outlined text-[#541a97]">sync</span>
                Nueva Suscripción Recurrente
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-[#4b4452] hover:text-[#111c2c]">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Buscador */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#111c2c]">Buscar Producto en FORCEPX</label>
              <div className="relative">
                <span className="material-symbols-outlined text-[#4b4452] absolute left-3.5 top-3 text-[20px]">search</span>
                <input
                  type="text"
                  placeholder="Ej. Anestésico 2%, Guantes de Nitrilo..."
                  value={searchQuery}
                  onChange={(e) => handleSearchCatalog(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-[#f9f9ff] border border-[#cdc3d4]/40 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#541a97]/30"
                />
              </div>

              {catalogProducts.length > 0 && (
                <div className="max-h-40 overflow-y-auto border border-[#cdc3d4]/30 rounded-2xl divide-y divide-[#cdc3d4]/20 bg-white">
                  {catalogProducts.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => {
                        setSelectedProduct(p);
                        setCatalogProducts([]);
                        setSearchQuery(p.name);
                      }}
                      className="p-3 flex items-center gap-3 cursor-pointer hover:bg-[#f0f3ff]"
                    >
                      <img src={p.images?.[0] || "/placeholder.png"} alt={p.name} className="w-9 h-9 rounded-lg object-cover" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-[#111c2c] truncate">{p.name}</p>
                        <p className="text-[10px] text-[#4b4452]">${p.price?.toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-[#111c2c]">Cantidad por Entrega</label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full mt-1.5 px-3 py-2.5 bg-[#f9f9ff] border border-[#cdc3d4]/40 rounded-2xl text-sm font-semibold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#111c2c]">Frecuencia (Días)</label>
                <select
                  value={frequencyDays}
                  onChange={(e) => setFrequencyDays(e.target.value)}
                  className="w-full mt-1.5 px-3 py-2.5 bg-[#f9f9ff] border border-[#cdc3d4]/40 rounded-2xl text-sm font-semibold"
                >
                  <option value={15}>Cada 15 días</option>
                  <option value={30}>Cada 30 días (Mensual)</option>
                  <option value={45}>Cada 45 días</option>
                  <option value={60}>Cada 60 días (Bimensual)</option>
                  <option value={90}>Cada 90 días (Trimestral)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2.5 border border-[#cdc3d4]/40 rounded-2xl text-xs font-bold text-[#4b4452]"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateSubscription}
                className="px-6 py-2.5 bg-[#541a97] hover:bg-[#6c38b0] text-white rounded-2xl text-xs font-bold shadow-md cursor-pointer"
              >
                Crear Suscripción
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
