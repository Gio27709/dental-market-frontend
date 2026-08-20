import { useState, useEffect, useRef } from "react";
import {
  getMyAddressesAPI,
  createAddressAPI,
  updateAddressAPI,
  deleteAddressAPI,
  setDefaultAddressAPI,
  reverseGeocodeAPI,
} from "../../services/api";
import { VENEZUELA_STATES } from "../../utils/venezuelaStates";
import toast from "react-hot-toast";
import MapAddressPicker from "../../components/common/MapAddressPicker";

export default function Addresses() {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [label, setLabel] = useState("");
  const [fullAddress, setFullAddress] = useState("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [reference, setReference] = useState("");
  const [lat, setLat] = useState(null);
  const [lng, setLng] = useState(null);
  const reverseTimer = useRef(null);

  // Pin del mapa: guarda coordenadas y autocompleta estado/ciudad si están vacíos
  const handleMapChange = (newLat, newLng) => {
    setLat(newLat);
    setLng(newLng);
    if (reverseTimer.current) clearTimeout(reverseTimer.current);
    reverseTimer.current = setTimeout(async () => {
      try {
        const res = await reverseGeocodeAPI(newLat, newLng);
        const d = res.data?.data;
        if (!d) return;
        setState((prev) => prev || d.state || "");
        setCity((prev) => prev || d.city || "");
      } catch { /* el autocompletado es un extra */ }
    }, 700);
  };

  const fetchAddresses = async () => {
    try {
      setLoading(true);
      const res = await getMyAddressesAPI();
      if (res.data && res.data.success) {
        setAddresses(res.data.data || []);
      }
    } catch (error) {
      console.error(error);
      toast.error("Error al cargar las direcciones.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  const openAddModal = () => {
    setEditingAddress(null);
    setLabel("");
    setFullAddress("");
    setState("");
    setCity("");
    setReference("");
    setLat(null);
    setLng(null);
    setIsModalOpen(true);
  };

  const openEditModal = (addr) => {
    setEditingAddress(addr);
    setLabel(addr.label);
    setFullAddress(addr.full_address);
    setState(addr.state);
    setCity(addr.city);
    setReference(addr.reference || "");
    setLat(addr.lat ?? null);
    setLng(addr.lng ?? null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!label.trim()) return toast.error("La etiqueta es requerida.");
    if (!fullAddress.trim()) return toast.error("La dirección completa es requerida.");
    if (!state) return toast.error("Selecciona un estado.");
    if (!city.trim()) return toast.error("La ciudad es requerida.");

    const payload = {
      label: label.trim(),
      full_address: fullAddress.trim(),
      state,
      city: city.trim(),
      reference: reference.trim() || null,
      lat,
      lng,
    };

    try {
      setSubmitting(true);
      if (editingAddress) {
        // Update
        const res = await updateAddressAPI(editingAddress.id, payload);
        if (res.data && res.data.success) {
          toast.success("Dirección actualizada exitosamente.");
          setIsModalOpen(false);
          fetchAddresses();
        }
      } else {
        // Create
        const res = await createAddressAPI(payload);
        if (res.data && res.data.success) {
          toast.success("Dirección agregada exitosamente.");
          setIsModalOpen(false);
          fetchAddresses();
        }
      }
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Error al procesar la dirección.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar esta dirección?")) return;
    try {
      const res = await deleteAddressAPI(id);
      if (res.data && res.data.success) {
        toast.success("Dirección eliminada exitosamente.");
        fetchAddresses();
      }
    } catch (error) {
      console.error(error);
      toast.error("Error al eliminar la dirección.");
    }
  };

  const handleSetDefault = async (id) => {
    try {
      const res = await setDefaultAddressAPI(id);
      if (res.data && res.data.success) {
        toast.success("Dirección establecida como predeterminada.");
        fetchAddresses();
      }
    } catch (error) {
      console.error(error);
      toast.error("Error al cambiar la dirección predeterminada.");
    }
  };

  // Helper function to return icon based on address label
  const getAddressIcon = (lbl) => {
    const lowercase = lbl.toLowerCase();
    if (lowercase.includes("casa") || lowercase.includes("home") || lowercase.includes("hogar")) return "home";
    if (lowercase.includes("trabajo") || lowercase.includes("oficina") || lowercase.includes("work") || lowercase.includes("clinica") || lowercase.includes("consultorio")) return "work";
    return "location_on";
  };

  return (
    <div className="space-y-8 animate-fade-in pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "#191c23" }}>
            Mis Direcciones
          </h1>
          <p className="text-sm mt-1" style={{ color: "#727785" }}>
            Gestiona tus direcciones de envío para agilizar tus compras en Forcepx.
          </p>
        </div>
        <div>
          <button
            onClick={openAddModal}
            disabled={addresses.length >= 10}
            className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold text-white transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            style={{ background: "#6b1e96" }}
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Agregar Dirección
          </button>
        </div>
      </div>

      {loading ? (
        // Skeletons
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map((n) => (
            <div
              key={n}
              className="rounded-2xl p-6 h-48 animate-pulse border border-slate-100"
              style={{ background: "#ffffff" }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-slate-200" />
                <div className="h-5 w-24 bg-slate-200 rounded" />
              </div>
              <div className="space-y-2.5">
                <div className="h-4 w-full bg-slate-200 rounded" />
                <div className="h-4 w-5/6 bg-slate-200 rounded" />
                <div className="h-4 w-3/4 bg-slate-200 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : addresses.length === 0 ? (
        // Empty state
        <div
          className="rounded-2xl p-12 text-center border border-dashed border-gray-200 flex flex-col items-center justify-center max-w-lg mx-auto mt-6"
          style={{ background: "#ffffff" }}
        >
          <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: "#f3e8ff", color: "#6b1e96" }}>
            <span className="material-symbols-outlined text-[32px]">pin_drop</span>
          </div>
          <h3 className="text-lg font-bold mb-2" style={{ color: "#191c23" }}>No tienes direcciones guardadas</h3>
          <p className="text-sm mb-6 max-w-sm" style={{ color: "#727785" }}>
            Guarda tus direcciones de casa, consultorio u oficina para que comprar sea mucho más rápido y sencillo.
          </p>
          <button
            onClick={openAddModal}
            className="px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all shadow-sm hover:shadow-md cursor-pointer"
            style={{ background: "#6b1e96" }}
          >
            Agregar mi primera dirección
          </button>
        </div>
      ) : (
        // Grid of Address Cards
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {addresses.map((addr) => {
            const isDefault = addr.is_default;
            return (
              <div
                key={addr.id}
                className={`rounded-2xl p-6 border transition-all duration-300 relative flex flex-col justify-between ${
                  isDefault ? "shadow-md" : "hover:shadow-xs"
                }`}
                style={{
                  background: "#ffffff",
                  borderColor: isDefault ? "#6b1e96" : "rgba(0,0,0,0.06)",
                  borderWidth: isDefault ? "2px" : "1px",
                }}
              >
                {isDefault && (
                  <span
                    className="absolute -top-3 left-6 px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-full text-white shadow-sm"
                    style={{ background: "#6b1e96" }}
                  >
                    Predeterminada
                  </span>
                )}

                <div>
                  {/* Card Header */}
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{
                        background: isDefault ? "#6b1e96" : "#f3e8ff",
                        color: isDefault ? "#ffffff" : "#6b1e96",
                      }}
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        {getAddressIcon(addr.label)}
                      </span>
                    </div>
                    <h3 className="font-extrabold text-base" style={{ color: "#191c23" }}>
                      {addr.label}
                    </h3>
                  </div>

                  {/* Card Body */}
                  <div className="space-y-2 text-sm leading-relaxed" style={{ color: "#4b5563" }}>
                    <p className="font-medium">{addr.full_address}</p>
                    <p className="text-xs font-semibold flex items-center gap-2 flex-wrap" style={{ color: "#727785" }}>
                      <span>📍 {addr.city}, {addr.state}</span>
                      {addr.lat != null && addr.lng != null && (
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
                          Pin GPS
                        </span>
                      )}
                    </p>
                    {addr.reference && (
                      <p className="text-xs mt-1.5 italic bg-slate-50 p-2 rounded-lg border border-slate-100 flex items-start gap-1">
                        <span className="material-symbols-outlined text-[14px] text-slate-400 mt-0.5">info</span>
                        <span>Ref: {addr.reference}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditModal(addr)}
                      className="text-xs font-bold hover:underline flex items-center gap-1 cursor-pointer"
                      style={{ color: "#6b1e96" }}
                    >
                      <span className="material-symbols-outlined text-[14px]">edit</span>
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(addr.id)}
                      className="text-xs font-bold hover:underline flex items-center gap-1 text-red-500 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[14px]">delete</span>
                      Eliminar
                    </button>
                  </div>

                  {!isDefault && (
                    <button
                      onClick={() => handleSetDefault(addr.id)}
                      className="text-xs font-bold px-3 py-1.5 rounded-lg border hover:bg-purple-50 transition-colors cursor-pointer"
                      style={{ color: "#6b1e96", borderColor: "#6b1e96" }}
                    >
                      Usar por defecto
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal - Add / Edit Address */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
          <div
            className="w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl animate-scale-in"
            style={{ background: "#ffffff" }}
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-bold" style={{ color: "#191c23" }}>
                {editingAddress ? "Editar Dirección" : "Nueva Dirección"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit}>
              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                {/* Label */}
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: "#727785" }}>
                    Etiqueta de la dirección *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Casa, Oficina, Consultorio, Clínica..."
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    className="w-full pl-4 pr-4 py-3 rounded-xl text-sm font-medium outline-none transition-all duration-200 focus:ring-2 focus:ring-[#6b1e96]/30 bg-slate-50 border border-slate-100 focus:border-[#6b1e96]"
                  />
                </div>

                {/* State & City (2 Columns) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: "#727785" }}>
                      Estado *
                    </label>
                    <select
                      required
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="w-full pl-4 pr-4 py-3 rounded-xl text-sm font-medium outline-none transition-all duration-200 focus:ring-2 focus:ring-[#6b1e96]/30 bg-slate-50 border border-slate-100 focus:border-[#6b1e96] appearance-none"
                    >
                      <option value="">Selecciona un estado</option>
                      {VENEZUELA_STATES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: "#727785" }}>
                      Ciudad *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: Caracas, Maracaibo..."
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full pl-4 pr-4 py-3 rounded-xl text-sm font-medium outline-none transition-all duration-200 focus:ring-2 focus:ring-[#6b1e96]/30 bg-slate-50 border border-slate-100 focus:border-[#6b1e96]"
                    />
                  </div>
                </div>

                {/* Full Address */}
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: "#727785" }}>
                    Dirección Detallada *
                  </label>
                  <textarea
                    required
                    rows="3"
                    placeholder="Calle, avenida, edificio, número de casa, apartamento, urbanización..."
                    value={fullAddress}
                    onChange={(e) => setFullAddress(e.target.value)}
                    className="w-full pl-4 pr-4 py-3 rounded-xl text-sm font-medium outline-none transition-all duration-200 focus:ring-2 focus:ring-[#6b1e96]/30 bg-slate-50 border border-slate-100 focus:border-[#6b1e96]"
                  />
                </div>

                {/* Reference */}
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: "#727785" }}>
                    Punto de Referencia (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Frente a la plaza Bolívar, al lado de la farmacia..."
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    className="w-full pl-4 pr-4 py-3 rounded-xl text-sm font-medium outline-none transition-all duration-200 focus:ring-2 focus:ring-[#6b1e96]/30 bg-slate-50 border border-slate-100 focus:border-[#6b1e96]"
                  />
                </div>

                {/* Map pin */}
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: "#727785" }}>
                    Ubicación Exacta en el Mapa (Recomendado)
                  </label>
                  <MapAddressPicker
                    value={lat != null && lng != null ? { lat, lng } : null}
                    onChange={handleMapChange}
                    height="240px"
                  />
                  {lat != null && lng != null ? (
                    <p className="text-[11px] font-bold mt-2 flex items-center gap-1.5 text-emerald-600">
                      ✓ Pin fijado ({Number(lat).toFixed(5)}, {Number(lng).toFixed(5)})
                      <button
                        type="button"
                        onClick={() => { setLat(null); setLng(null); }}
                        className="text-red-500 underline font-bold cursor-pointer"
                      >
                        Quitar
                      </button>
                    </p>
                  ) : (
                    <p className="text-[11px] font-medium mt-2" style={{ color: "#727785" }}>
                      Con el pin, el repartidor llega directo a tu puerta en los delivery locales.
                    </p>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-gray-100 flex items-center justify-end gap-3 bg-slate-50/50">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all shadow-sm hover:shadow-md disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
                  style={{ background: "#6b1e96" }}
                >
                  {submitting ? "Guardando..." : "Guardar Dirección"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
