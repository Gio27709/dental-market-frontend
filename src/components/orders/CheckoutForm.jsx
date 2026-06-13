import { useState, useEffect, useMemo } from "react";
import PropTypes from "prop-types";
import { validatePhone, validateAddress } from "../../utils/validators";
import PaymentMethodSelector from "./PaymentMethodSelector";
import PaymentInstructions from "./PaymentInstructions";
import toast from "react-hot-toast";
import { VENEZUELA_STATES } from "../../utils/venezuelaStates";

export default function CheckoutForm({
  cartItems,
  onSubmit,
  loading,
  onDeliveryTypeChange
}) {
  const [formData, setFormData] = useState(() => {
    const saved = sessionStorage.getItem("checkout_form_data");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Error parsing checkout form data:", e);
      }
    }
    return {
      delivery_type: "shipping",
      address: "",
      phone: "",
      payment_method: "",
      notes: "",
      delivery_reference: "",
      delivery_lat: null,
      delivery_lng: null,
      destination_state: "",
      destination_city: "",
    };
  });

  // ── GROUP items by store for multi-store awareness ──
  const storeGroups = useMemo(() => {
    const groups = {};
    cartItems.forEach(item => {
      const sid = item.store_id;
      if (!groups[sid]) {
        groups[sid] = {
          store_id: sid,
          store_name: item.store_name || `Tienda ${sid?.substring(0, 6) || "?"}`,
          store_state: item.store_state || null,
          offers_local_delivery: item.offers_local_delivery || false,
          items: [],
        };
      }
      groups[sid].items.push(item);
      // If ANY item in this store offers delivery, the store does
      if (item.offers_local_delivery) {
        groups[sid].offers_local_delivery = true;
      }
    });
    return Object.values(groups);
  }, [cartItems]);

  const isMultiStore = storeGroups.length > 1;

  // ── Per-store delivery types (only for multi-store) ──
  const [perStoreDelivery, setPerStoreDelivery] = useState(() => {
    const saved = sessionStorage.getItem("checkout_per_store_delivery");
    if (saved) {
      try { return JSON.parse(saved); } catch { /* ignore */ }
    }
    return {};
  });

  // Initialize per-store delivery defaults
  useEffect(() => {
    if (isMultiStore) {
      setPerStoreDelivery(prev => {
        const updated = { ...prev };
        let changed = false;
        storeGroups.forEach(g => {
          if (!(g.store_id in updated)) {
            updated[g.store_id] = g.offers_local_delivery ? "local_delivery" : "shipping";
            changed = true;
          }
          // Force shipping if store doesn't offer delivery
          if (!g.offers_local_delivery && updated[g.store_id] === "local_delivery") {
            updated[g.store_id] = "shipping";
            changed = true;
          }
        });
        return changed ? updated : prev;
      });
    }
  }, [isMultiStore, storeGroups]);

  // Persist per-store delivery
  useEffect(() => {
    sessionStorage.setItem("checkout_per_store_delivery", JSON.stringify(perStoreDelivery));
  }, [perStoreDelivery]);

  // Single-store delivery logic (backward compat)
  const canUseLocalDelivery = !isMultiStore && storeGroups.length === 1 && storeGroups[0].offers_local_delivery;

  // If user had local_delivery saved but the single store doesn't support it
  useEffect(() => {
    if (!isMultiStore && formData.delivery_type === "local_delivery" && !canUseLocalDelivery) {
      setFormData(prev => ({ ...prev, delivery_type: "shipping" }));
      toast('Tu carrito cambió y contiene tiendas sin Delivery Local. Hemos ajustado tu método a Encomienda Nacional.', { icon: '📦' });
    }
  }, [canUseLocalDelivery, formData.delivery_type, isMultiStore]);

  // Persist form data to survive tab switching or HMR
  useEffect(() => {
    sessionStorage.setItem("checkout_form_data", JSON.stringify(formData));
  }, [formData]);

  // Provide delivery_type backward sync and initial render emit
  useEffect(() => {
    if (onDeliveryTypeChange) {
      if (isMultiStore) {
        // For multi-store, determine if ANY store uses local_delivery
        const anyLocalDelivery = Object.values(perStoreDelivery).some(t => t === "local_delivery");
        onDeliveryTypeChange(anyLocalDelivery ? "mixed" : "shipping");
      } else {
        onDeliveryTypeChange(formData.delivery_type);
      }
    }
  }, [formData.delivery_type, perStoreDelivery, onDeliveryTypeChange, isMultiStore]);

  const [formErrors, setFormErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: null }));
    }
    if (name === "delivery_type" && onDeliveryTypeChange) {
      onDeliveryTypeChange(value);
    }
  };

  const handleMethodChange = (method) => {
    setFormData((prev) => ({ ...prev, payment_method: method }));
    setFormErrors((prev) => ({ ...prev, payment_method: null }));
  };

  const handleStoreDeliveryChange = (storeId, type) => {
    setPerStoreDelivery(prev => ({ ...prev, [storeId]: type }));
  };

  // Check if ANY store (multi or single) uses local delivery
  const hasAnyLocalDelivery = isMultiStore
    ? Object.values(perStoreDelivery).some(t => t === "local_delivery")
    : formData.delivery_type === "local_delivery";

  const validate = () => {
    const errors = {};
    if (hasAnyLocalDelivery) {
      if (!formData.address || formData.address.length < 15) {
        errors.address = "Para delivery local, bríndenos la zona y avenida exacta (min 15 chars).";
      }
      if (!formData.delivery_lat || !formData.delivery_lng) {
        errors.location = "Para usar Delivery Local necesitamos sus coordenadas. Presione 'Usar ubicación GPS'.";
      }
    } else {
      if (!validateAddress(formData.address)) {
        errors.address =
          "La dirección debe ser clara y tener más de 10 caracteres.";
      }
      if (!formData.destination_state) {
        errors.destination_state = "Selecciona el estado de destino para la encomienda.";
      }
    }

    // If multi-store with mixed: need address for both shipping and local parts
    if (isMultiStore && hasAnyLocalDelivery) {
      const hasShipping = Object.values(perStoreDelivery).some(t => t === "shipping");
      if (hasShipping && !formData.destination_state) {
        errors.destination_state = "Selecciona el estado de destino para las tiendas con encomienda nacional.";
      }
    }

    if (!validatePhone(formData.phone)) {
      errors.phone =
        "El número telefónico debe tener un formato válido (Ej. 0412-1234567).";
    }
    if (!formData.payment_method) {
      errors.payment_method = "Debe seleccionar un método de pago.";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleGetLocation = (e) => {
    e.preventDefault();
    if ("geolocation" in navigator) {
      toast("Solicitando GPS...", { icon: '📡' });
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData((prev) => ({
            ...prev,
            delivery_lat: position.coords.latitude,
            delivery_lng: position.coords.longitude,
          }));
          toast.success("Ubicación fijada con exactitud.");
          if (formErrors.location) setFormErrors(prev => ({...prev, location: null}));
        },
        () => {
          toast.error("Error al obtener ubicación. Por favor, revisa tus permisos.");
        }
      );
    } else {
      toast.error("Tu navegador no soporta geolocalización.");
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      // Build submit payload
      const payload = { ...formData };
      if (isMultiStore) {
        payload.delivery_types = perStoreDelivery;
        // Set global delivery_type to "shipping" as fallback for backward compat
        payload.delivery_type = "shipping";
      }
      onSubmit(payload, cartItems);
    } else {
      toast.error("Por favor, corrige los errores en el formulario");
    }
  };

  // Determine if we need to show the shipping fields (state/city)
  const needsShippingFields = isMultiStore
    ? Object.values(perStoreDelivery).some(t => t === "shipping")
    : formData.delivery_type === "shipping";

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-6">
      {/* ── CARD 1: TIPO DE ENTREGA ── */}
      <div className="bg-white rounded-2xl border border-slate-100/80 shadow-xs p-5 sm:p-6 transition-all duration-300">
        <div className="flex items-start gap-3.5 mb-6 pb-4 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-[#6b1e96]">
            <span className="material-symbols-outlined text-[22px]">local_shipping</span>
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900">Tipo de Entrega</h3>
            <p className="text-xs font-semibold text-slate-400 mt-0.5">
              {isMultiStore
                ? "Tu carrito tiene productos de varias tiendas. Elige cómo recibir los de cada una."
                : "Seleccione cómo desea recibir sus productos."
              }
            </p>
          </div>
        </div>

        {isMultiStore ? (
          /* ── MULTI-STORE: Per-store delivery selector ── */
          <div className="flex flex-col gap-4">
            {storeGroups.map((group) => {
              const selectedType = perStoreDelivery[group.store_id] || "shipping";
              return (
                <div key={group.store_id} className="border border-slate-100 rounded-xl p-4 bg-slate-50/50">
                  {/* Store header */}
                  <div className="flex items-center gap-2 mb-3.5 pb-3 border-b border-slate-200/60">
                    <span className="material-symbols-outlined text-[18px] text-[#6b1e96]">storefront</span>
                    <span className="font-bold text-slate-900 text-sm">{group.store_name}</span>
                    {group.store_state && (
                      <span className="text-[10px] font-bold text-[#6b1e96] bg-purple-50 px-2 py-0.5 rounded-full">
                        📍 {group.store_state}
                      </span>
                    )}
                    <span className="text-xs text-slate-400 ml-auto">
                      {group.items.length} {group.items.length === 1 ? "producto" : "productos"}
                    </span>
                  </div>

                  {/* Delivery options for this store */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <label className={`flex items-center gap-3 flex-1 p-3.5 border rounded-xl cursor-pointer transition-all duration-200 text-sm ${
                      selectedType === 'shipping'
                        ? 'border-[#6b1e96] bg-purple-50/20 ring-1 ring-[#6b1e96]'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}>
                      <input
                        type="radio"
                        name={`delivery_${group.store_id}`}
                        value="shipping"
                        checked={selectedType === "shipping"}
                        onChange={() => handleStoreDeliveryChange(group.store_id, "shipping")}
                        className="sr-only"
                      />
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                        selectedType === "shipping" ? "border-[#6b1e96] bg-white" : "border-slate-300 bg-white"
                      }`}>
                        {selectedType === "shipping" && <div className="w-2.5 h-2.5 rounded-full bg-[#6b1e96]" />}
                      </div>
                      <span className="material-symbols-outlined text-[18px] text-slate-500">local_shipping</span>
                      <span className="font-bold text-slate-800">Encomienda</span>
                    </label>

                    <label className={`flex items-center gap-3 flex-1 p-3.5 border rounded-xl transition-all duration-200 text-sm ${
                      !group.offers_local_delivery
                        ? 'opacity-45 cursor-not-allowed bg-slate-50 border-slate-200'
                        : selectedType === 'local_delivery'
                        ? 'border-[#6b1e96] bg-purple-50/20 ring-1 ring-[#6b1e96] cursor-pointer'
                        : 'border-slate-200 bg-white hover:bg-slate-50 cursor-pointer'
                    }`}>
                      <input
                        type="radio"
                        name={`delivery_${group.store_id}`}
                        value="local_delivery"
                        checked={selectedType === "local_delivery"}
                        onChange={() => handleStoreDeliveryChange(group.store_id, "local_delivery")}
                        disabled={!group.offers_local_delivery}
                        className="sr-only"
                      />
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                        selectedType === "local_delivery" ? "border-[#6b1e96] bg-white" : "border-slate-300 bg-white"
                      }`}>
                        {selectedType === "local_delivery" && <div className="w-2.5 h-2.5 rounded-full bg-[#6b1e96]" />}
                      </div>
                      <span className="material-symbols-outlined text-[18px] text-slate-500">two_wheeler</span>
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800">Delivery Local</span>
                        {!group.offers_local_delivery && (
                          <span className="text-[10px] text-rose-500 font-extrabold mt-0.5">No disponible en esta tienda</span>
                        )}
                      </div>
                    </label>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* ── SINGLE STORE: Original global selector ── */
          <div className="flex flex-col gap-4">
            <label className={`flex items-start gap-4.5 p-4.5 border rounded-2xl cursor-pointer transition-all duration-200 ${
              formData.delivery_type === 'shipping'
                ? 'border-[#6b1e96] bg-purple-50/20 ring-1 ring-[#6b1e96]'
                : 'border-slate-200 bg-white hover:bg-slate-50/80 shadow-xs'
            }`}>
              <input
                type="radio"
                name="delivery_type"
                value="shipping"
                checked={formData.delivery_type === 'shipping'}
                onChange={handleChange}
                className="sr-only"
              />
              <div className={`mt-1.5 w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                formData.delivery_type === "shipping" ? "border-[#6b1e96] bg-white" : "border-slate-300 bg-white"
              }`}>
                {formData.delivery_type === "shipping" && <div className="w-3 h-3 rounded-full bg-[#6b1e96]" />}
              </div>
              <div className="flex-1">
                <span className="font-black text-slate-900 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[20px] text-slate-500">local_shipping</span>
                  Encomienda Nacional
                </span>
                <span className="text-xs font-semibold text-slate-400 block mt-1 leading-relaxed">
                  Envío mediante MRW, Zoom o Tealca a nivel nacional. (Cobro a destino en la agencia o domicilio).
                </span>
              </div>
            </label>

            <label className={`flex items-start gap-4.5 p-4.5 border rounded-2xl transition-all duration-200 ${
              !canUseLocalDelivery
                ? 'opacity-45 cursor-not-allowed bg-slate-50 border-slate-200'
                : formData.delivery_type === 'local_delivery'
                ? 'border-[#6b1e96] bg-purple-50/20 ring-1 ring-[#6b1e96] cursor-pointer'
                : 'border-slate-200 bg-white hover:bg-slate-50/80 cursor-pointer shadow-xs'
            }`}>
              <input
                type="radio"
                name="delivery_type"
                value="local_delivery"
                checked={formData.delivery_type === 'local_delivery'}
                onChange={handleChange}
                disabled={!canUseLocalDelivery}
                className="sr-only"
              />
              <div className={`mt-1.5 w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                formData.delivery_type === "local_delivery" ? "border-[#6b1e96] bg-white" : "border-slate-300 bg-white"
              }`}>
                {formData.delivery_type === "local_delivery" && <div className="w-3 h-3 rounded-full bg-[#6b1e96]" />}
              </div>
              <div className="flex-1">
                <span className="font-black text-slate-900 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[20px] text-slate-500">two_wheeler</span>
                  Delivery Local Express
                </span>
                <span className="text-xs font-semibold text-slate-400 block mt-1 leading-relaxed">
                  La tienda le enviará su pedido directamente.
                  {!canUseLocalDelivery && (
                    <strong className="text-rose-500 block mt-1 font-bold">No disponible porque esta tienda no ofrece envíos directos.</strong>
                  )}
                </span>
              </div>
            </label>
          </div>
        )}
      </div>

      {/* ── CARD 2: DATOS DE DESTINO Y CONTACTO ── */}
      <div className="bg-white rounded-2xl border border-slate-100/80 shadow-xs p-5 sm:p-6 transition-all duration-300">
        <div className="flex items-start gap-3.5 mb-6 pb-4 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-[#6b1e96]">
            <span className="material-symbols-outlined text-[22px]">distance</span>
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900">Datos de Destino y Contacto</h3>
            <p className="text-xs font-semibold text-slate-400 mt-0.5">¿A dónde enviaremos tu pedido?</p>
          </div>
        </div>

        <div className="grid grid-cols-6 gap-5">
          <div className="col-span-6">
            <label htmlFor="address" className="block text-xs font-extrabold text-slate-600 uppercase tracking-wider mb-1.5">
              Dirección Exacta de Entrega *
            </label>
            <textarea
              id="address"
              name="address"
              rows="3"
              disabled={loading}
              value={formData.address}
              onChange={handleChange}
              placeholder={hasAnyLocalDelivery ? "Ej. Av. Romulo Gallegos, Urb. Sebucan, Edf. X, Piso Y" : "Ej. Sede MRW Los Dos Caminos / O dirección personal detallada."}
              className={`block w-full shadow-xs sm:text-sm rounded-xl p-3 border focus:outline-none focus:ring-2 transition-all ${
                formErrors.address
                  ? "border-red-300 bg-red-50/30 focus:ring-red-100 focus:border-red-400"
                  : "border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-[#6b1e96]/15 focus:border-[#6b1e96]"
              }`}
            />
            {formErrors.address && (
              <p className="text-red-500 text-xs font-bold mt-1.5 flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">error</span>
                {formErrors.address}
              </p>
            )}
          </div>

          {hasAnyLocalDelivery && (
            <>
              <div className="col-span-6">
                <label className="block text-xs font-extrabold text-slate-600 uppercase tracking-wider mb-2">
                  Ubicación Satelital (GPS) *
                </label>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={handleGetLocation}
                    className="flex items-center gap-2 px-4 py-3 bg-slate-100 hover:bg-slate-200/80 text-slate-800 rounded-xl text-xs font-black transition-all border border-slate-200 active:scale-98 shadow-xs cursor-pointer"
                  >
                    <span className={`material-symbols-outlined text-[18px] ${formData.delivery_lat ? "text-emerald-600 animate-pulse" : "text-slate-500"}`}>
                      my_location
                    </span>
                    {formData.delivery_lat ? "Actualizar Coordenadas" : "Usar mi ubicación"}
                  </button>
                  {formData.delivery_lat && (
                    <span className="text-xs text-emerald-600 font-extrabold flex items-center gap-1 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">
                      <span className="material-symbols-outlined text-[15px] text-emerald-600">check_circle</span>
                      ¡Ubicación fijada! ({formData.delivery_lat.toFixed(4)}, {formData.delivery_lng.toFixed(4)})
                    </span>
                  )}
                </div>
                {formErrors.location && (
                  <p className="text-red-500 text-xs font-bold mt-1.5 flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">error</span>
                    {formErrors.location}
                  </p>
                )}
                <p className="text-[11px] text-slate-400 mt-2.5 font-medium italic">Permítele acceso al GPS al navegador. Cerraremos la distancia exacta entre tú y el Rider.</p>
              </div>

              <div className="col-span-6">
                <label htmlFor="delivery_reference" className="block text-xs font-extrabold text-slate-600 uppercase tracking-wider mb-1.5">
                  Punto de Referencia (Opcional)
                </label>
                <input
                  type="text"
                  name="delivery_reference"
                  id="delivery_reference"
                  disabled={loading}
                  value={formData.delivery_reference}
                  onChange={handleChange}
                  placeholder="Ej. Frente a la panadería central, portón negro"
                  className="block w-full shadow-xs sm:text-sm rounded-xl border-slate-200 bg-slate-50/50 p-3 border focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#6b1e96]/15 focus:border-[#6b1e96] transition-all"
                />
              </div>
            </>
          )}

          {/* State and City selectors (shown if ANY store uses shipping) */}
          {needsShippingFields && (
            <>
              <div className="col-span-6 sm:col-span-3">
                <label htmlFor="destination_state" className="block text-xs font-extrabold text-slate-600 uppercase tracking-wider mb-1.5">
                  Estado de Destino *
                </label>
                <select
                  id="destination_state"
                  name="destination_state"
                  disabled={loading}
                  value={formData.destination_state}
                  onChange={handleChange}
                  className={`block w-full shadow-xs sm:text-sm rounded-xl p-3 border focus:outline-none focus:ring-2 transition-all bg-white ${
                    formErrors.destination_state
                      ? "border-red-300 bg-red-50/30 focus:ring-red-100 focus:border-red-400"
                      : "border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-[#6b1e96]/15 focus:border-[#6b1e96]"
                  }`}
                >
                  <option value="">Selecciona un estado</option>
                  {VENEZUELA_STATES.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                {formErrors.destination_state && (
                  <p className="text-red-500 text-xs font-bold mt-1.5 flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">error</span>
                    {formErrors.destination_state}
                  </p>
                )}
              </div>
              <div className="col-span-6 sm:col-span-3">
                <label htmlFor="destination_city" className="block text-xs font-extrabold text-slate-600 uppercase tracking-wider mb-1.5">
                  Ciudad de Destino
                </label>
                <input
                  type="text"
                  id="destination_city"
                  name="destination_city"
                  disabled={loading}
                  value={formData.destination_city}
                  onChange={handleChange}
                  placeholder="Ej. Maracaibo, Lechería, etc."
                  className="block w-full shadow-xs sm:text-sm rounded-xl border-slate-200 bg-slate-50/50 p-3 border focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#6b1e96]/15 focus:border-[#6b1e96] transition-all"
                />
              </div>
            </>
          )}

          <div className="col-span-6 sm:col-span-3">
            <label htmlFor="phone" className="block text-xs font-extrabold text-slate-600 uppercase tracking-wider mb-1.5">
              Teléfono Contacto *
            </label>
            <input
              type="text"
              name="phone"
              id="phone"
              disabled={loading}
              value={formData.phone}
              onChange={handleChange}
              placeholder="0412-0000000"
              className={`block w-full shadow-xs sm:text-sm rounded-xl p-3 border focus:outline-none focus:ring-2 transition-all ${
                formErrors.phone
                  ? "border-red-300 bg-red-50/30 focus:ring-red-100 focus:border-red-400"
                  : "border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-[#6b1e96]/15 focus:border-[#6b1e96]"
              }`}
            />
            {formErrors.phone && (
              <p className="text-red-500 text-xs font-bold mt-1.5 flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">error</span>
                {formErrors.phone}
              </p>
            )}
          </div>

          <div className="col-span-6">
            <label htmlFor="notes" className="block text-xs font-extrabold text-slate-600 uppercase tracking-wider mb-1.5">
              Notas Adicionales (Opcional)
            </label>
            <input
              type="text"
              name="notes"
              id="notes"
              disabled={loading}
              value={formData.notes}
              onChange={handleChange}
              placeholder="Punto de referencia o instrucciones al repartidor"
              className="block w-full shadow-xs sm:text-sm rounded-xl border-slate-200 bg-slate-50/50 p-3 border focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#6b1e96]/15 focus:border-[#6b1e96] transition-all"
            />
          </div>
        </div>
      </div>

      {/* ── CARD 3: METODOS DE PAGO ── */}
      <div className="bg-white rounded-2xl border border-slate-100/80 shadow-xs p-5 sm:p-6 transition-all duration-300">
        <div className="flex items-start gap-3.5 mb-6 pb-4 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-[#6b1e96]">
            <span className="material-symbols-outlined text-[22px]">payments</span>
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900">Métodos de Pago</h3>
            <p className="text-xs font-semibold text-slate-400 mt-0.5">Nuestros fondos se consolidan con seguridad.</p>
          </div>
        </div>

        <PaymentMethodSelector
          selectedMethod={formData.payment_method}
          onChange={handleMethodChange}
          error={formErrors.payment_method}
        />
        <PaymentInstructions paymentMethod={formData.payment_method} />
      </div>

      {/* Obsolete Resumen de Cuenta block removed */}

      <div className="mt-8">
        <button
          type="submit"
          disabled={loading}
          className="w-full inline-flex justify-center items-center py-4 px-8 border border-transparent shadow-md shadow-purple-600/10 text-base font-black rounded-xl text-white bg-gradient-to-r from-[#6b1e96] to-[#8b2fc9] hover:from-[#7b24ab] hover:to-[#9c3ce0] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#6b1e96] disabled:opacity-70 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-purple-500/20 active:scale-[0.99] transition-all duration-200 uppercase tracking-wide cursor-pointer"
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Procesando Orden...
            </>
          ) : (
            "Completar Pago Seguro"
          )}
        </button>
      </div>
    </form>
  );
}

CheckoutForm.propTypes = {
  cartItems: PropTypes.array.isRequired,
  onSubmit: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  onDeliveryTypeChange: PropTypes.func,
};
