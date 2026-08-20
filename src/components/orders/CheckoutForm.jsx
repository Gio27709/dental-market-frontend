import { useState, useEffect, useMemo, useRef } from "react";
import PropTypes from "prop-types";
import { validatePhone, validateAddress } from "../../utils/validators";
import PaymentMethodSelector from "./PaymentMethodSelector";
import PaymentInstructions from "./PaymentInstructions";
import toast from "react-hot-toast";
import { VENEZUELA_STATES } from "../../utils/venezuelaStates";
import { useAuth } from "../../context/AuthContext";
import MapAddressPicker from "../common/MapAddressPicker";
import { getMyAddressesAPI, createAddressAPI, reverseGeocodeAPI, getShippingOfficesAPI } from "../../services/api";

export default function CheckoutForm({
  cartItems,
  onSubmit,
  loading,
  onDeliveryTypeChange
}) {
  const { user } = useAuth();

  const [formData, setFormData] = useState(() => {
    const saved = sessionStorage.getItem("checkout_form_data");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          receiver_name: "",
          receiver_cedula: "",
          receiver_email: "",
          preferred_shipping_carrier: "",
          ...parsed
        };
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
      receiver_name: "",
      receiver_cedula: "",
      receiver_email: "",
      preferred_shipping_carrier: "",
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

  const [cedulaPrefix, setCedulaPrefix] = useState("V");
  const [cedulaNumber, setCedulaNumber] = useState("");

  const hasPrefilledRef = useRef(false);

  // Al montar, separar la cédula inicial si existe
  useEffect(() => {
    if (formData.receiver_cedula) {
      const match = formData.receiver_cedula.match(/^([VEJGP])-(.+)$/i);
      if (match) {
        setCedulaPrefix(match[1].toUpperCase());
        setCedulaNumber(match[2]);
      } else if (/^\d+$/.test(formData.receiver_cedula)) {
        setCedulaNumber(formData.receiver_cedula);
        setFormData(prev => ({ ...prev, receiver_cedula: `V-${formData.receiver_cedula}` }));
      }
    }
  }, []);

  const handlePrefixChange = (e) => {
    const prefix = e.target.value;
    setCedulaPrefix(prefix);
    const fullCedula = prefix && cedulaNumber ? `${prefix}-${cedulaNumber.trim()}` : "";
    setFormData(prev => ({ ...prev, receiver_cedula: fullCedula }));
    if (formErrors.receiver_cedula) {
      setFormErrors(prev => ({ ...prev, receiver_cedula: null }));
    }
  };

  const handleCedulaNumberChange = (e) => {
    const num = e.target.value.replace(/[^0-9-]/g, "");
    setCedulaNumber(num);
    const fullCedula = cedulaPrefix && num ? `${cedulaPrefix}-${num.trim()}` : "";
    setFormData(prev => ({ ...prev, receiver_cedula: fullCedula }));
    if (formErrors.receiver_cedula) {
      setFormErrors(prev => ({ ...prev, receiver_cedula: null }));
    }
  };

  // Precargar datos del usuario logueado
  useEffect(() => {
    if (user && !hasPrefilledRef.current) {
      setFormData(prev => {
        const defaultCedula = prev.receiver_cedula || user.user_metadata?.cedula || "";
        if (defaultCedula) {
          const match = defaultCedula.match(/^([VEJGP])-(.+)$/i);
          if (match) {
            setCedulaPrefix(match[1].toUpperCase());
            setCedulaNumber(match[2]);
          } else if (/^\d+$/.test(defaultCedula)) {
            setCedulaNumber(defaultCedula);
          }
        }
        const updated = {
          ...prev,
          receiver_name: prev.receiver_name || user.user_metadata?.full_name || "",
          receiver_email: prev.receiver_email || user.email || "",
          phone: prev.phone || user.phone || user.user_metadata?.phone || "",
          receiver_cedula: defaultCedula ? (defaultCedula.includes("-") ? defaultCedula : `V-${defaultCedula}`) : prev.receiver_cedula,
        };
        if (user.email || user.user_metadata?.full_name) {
          hasPrefilledRef.current = true;
        }
        return updated;
      });
    }
  }, [user]);

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

  // ── Libreta de direcciones ──
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [saveAddress, setSaveAddress] = useState(false);
  const [addressLabel, setAddressLabel] = useState("");
  const reverseTimer = useRef(null);

  const applyAddress = (addr) => {
    setSelectedAddressId(addr.id);
    setFormData((prev) => ({
      ...prev,
      address: addr.full_address,
      destination_state: addr.state || prev.destination_state,
      destination_city: addr.city || prev.destination_city,
      delivery_reference: addr.reference || "",
      delivery_lat: addr.lat ?? null,
      delivery_lng: addr.lng ?? null,
    }));
    setFormErrors((prev) => ({ ...prev, address: null, location: null, destination_state: null }));
  };

  useEffect(() => {
    if (!user) return;
    let alive = true;
    getMyAddressesAPI()
      .then((res) => {
        if (!alive) return;
        const list = res.data?.data || [];
        setSavedAddresses(list);
        // El borrador de sessionStorage gana sobre la predeterminada:
        // no pisar una dirección que el usuario ya venía escribiendo.
        let draftHasAddress = false;
        try {
          draftHasAddress = Boolean(JSON.parse(sessionStorage.getItem("checkout_form_data") || "{}").address);
        } catch { /* borrador corrupto = no hay borrador */ }
        const def = list.find((a) => a.is_default) || list[0];
        if (def && !draftHasAddress) applyAddress(def);
      })
      .catch(() => { /* sin libreta el formulario manual sigue funcionando */ });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Pin del mapa: fija coordenadas y autocompleta estado/ciudad (best effort)
  const handleMapChange = (lat, lng) => {
    setFormData((prev) => ({ ...prev, delivery_lat: lat, delivery_lng: lng }));
    setSelectedAddressId(null);
    if (formErrors.location) setFormErrors((prev) => ({ ...prev, location: null }));
    if (reverseTimer.current) clearTimeout(reverseTimer.current);
    reverseTimer.current = setTimeout(async () => {
      try {
        const res = await reverseGeocodeAPI(lat, lng);
        const d = res.data?.data;
        if (!d) return;
        setFormData((prev) => ({
          ...prev,
          destination_state: d.state || prev.destination_state,
          destination_city: prev.destination_city || d.city || "",
          address: prev.address || [d.road, d.suburb, d.city].filter(Boolean).join(", "),
        }));
      } catch { /* el autocompletado es un extra, nunca bloquea */ }
    }, 700);
  };

  // ── Oficinas Zoom (envío nacional) ──
  const [offices, setOffices] = useState([]);
  const [officesLoading, setOfficesLoading] = useState(false);
  const [selectedOfficeId, setSelectedOfficeId] = useState(null);
  const [officeFilter, setOfficeFilter] = useState("");

  const showOffices =
    formData.preferred_shipping_carrier === "zoom" && Boolean(formData.destination_state);

  useEffect(() => {
    if (!showOffices) {
      setOffices([]);
      setSelectedOfficeId(null);
      return;
    }
    let alive = true;
    setOfficesLoading(true);
    const params = { carrier: "zoom", state: formData.destination_state };
    if (formData.delivery_lat != null && formData.delivery_lng != null) {
      params.lat = formData.delivery_lat;
      params.lng = formData.delivery_lng;
    }
    getShippingOfficesAPI(params)
      .then((res) => {
        if (!alive) return;
        setOffices(res.data?.data || []);
        setOfficeFilter("");
      })
      .catch(() => { /* sin listado el campo manual sigue funcionando */ })
      .finally(() => alive && setOfficesLoading(false));
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showOffices, formData.destination_state]);

  const applyOffice = (office) => {
    setSelectedOfficeId(office.id);
    setSelectedAddressId(null);
    setFormData((prev) => ({
      ...prev,
      address: `Oficina ${office.name} — ${office.address}${office.city ? `, ${office.city}` : ""}`,
      destination_city: office.city || prev.destination_city,
    }));
    setFormErrors((prev) => ({ ...prev, address: null }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === "address") {
      setSelectedAddressId(null);
      setSelectedOfficeId(null);
    }
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
        errors.location = "Para usar Delivery Local necesitamos tu ubicación: coloca el pin en el mapa.";
      }
    } else {
      if (!validateAddress(formData.address)) {
        errors.address =
          "La dirección debe ser clara y tener más de 10 caracteres.";
      }
    }

    if (needsShippingFields) {
      if (!formData.destination_state) {
        errors.destination_state = isMultiStore
          ? "Selecciona el estado de destino para las tiendas con encomienda nacional."
          : "Selecciona el estado de destino para la encomienda.";
      }
      if (!formData.preferred_shipping_carrier) {
        errors.preferred_shipping_carrier = "Selecciona la agencia de envío de tu preferencia.";
      }
    }

    if (!validatePhone(formData.phone)) {
      errors.phone =
        "El número telefónico debe tener un formato válido (Ej. 0412-1234567).";
    }
    if (!formData.payment_method) {
      errors.payment_method = "Debe seleccionar un método de pago.";
    }
    if (!formData.receiver_name || formData.receiver_name.trim().length < 3) {
      errors.receiver_name = "El nombre del destinatario es obligatorio (mínimo 3 caracteres).";
    }
    if (!formData.receiver_email || !/\S+@\S+\.\S+/.test(formData.receiver_email)) {
      errors.receiver_email = "Por favor introduce un correo electrónico válido.";
    }
    if (!formData.receiver_cedula || !/^[VEJGP]-\d{6,10}(-\d)?$/i.test(formData.receiver_cedula.trim())) {
      errors.receiver_cedula = "La cédula o RIF es requerida (Ej. V-12345678).";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      // Guardado en libreta: fire-and-forget, nunca bloquea el pedido
      if (saveAddress && addressLabel.trim() && !selectedAddressId) {
        if (!formData.destination_state || !formData.destination_city) {
          toast("No se guardó en tu libreta (faltó estado/ciudad); el pedido sigue normal.", { icon: "📒" });
        } else {
          createAddressAPI({
            label: addressLabel.trim(),
            full_address: formData.address,
            state: formData.destination_state,
            city: formData.destination_city,
            reference: formData.delivery_reference || null,
            lat: formData.delivery_lat,
            lng: formData.delivery_lng,
          })
            .then(() => toast.success("Dirección guardada en tu libreta."))
            .catch((err) => {
              toast(err.response?.data?.error || "No se pudo guardar la dirección en tu libreta.", { icon: "⚠️" });
            });
        }
      }
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
          {savedAddresses.length > 0 && (
            <div className="col-span-6">
              <label className="block text-xs font-extrabold text-slate-600 uppercase tracking-wider mb-2">
                Mis Direcciones Guardadas
              </label>
              <div className="flex flex-wrap gap-2.5">
                {savedAddresses.map((addr) => (
                  <button
                    key={addr.id}
                    type="button"
                    disabled={loading}
                    onClick={() => applyAddress(addr)}
                    title={addr.full_address}
                    className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-xs transition-all cursor-pointer ${
                      selectedAddressId === addr.id
                        ? "border-[#6b1e96] bg-purple-50/40 ring-1 ring-[#6b1e96] text-[#6b1e96]"
                        : "border-slate-200 bg-slate-50/50 hover:bg-white text-slate-700"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {selectedAddressId === addr.id ? "check_circle" : "location_on"}
                    </span>
                    <span className="font-black">{addr.label}</span>
                    <span className="font-semibold text-slate-400">· {addr.city}</span>
                    {addr.lat != null && <span title="Con ubicación GPS">📍</span>}
                    {addr.is_default && (
                      <span className="text-[9px] font-black uppercase tracking-wider bg-[#6b1e96] text-white px-1.5 py-0.5 rounded-full">
                        Def
                      </span>
                    )}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-slate-400 mt-2 font-medium">
                Toca una para rellenar los campos, o escribe otra dirección abajo.
              </p>
            </div>
          )}

          <div className="col-span-6 sm:col-span-3">
            <label htmlFor="receiver_name" className="block text-xs font-extrabold text-slate-600 uppercase tracking-wider mb-1.5">
              Nombre Completo del Destinatario *
            </label>
            <input
              type="text"
              name="receiver_name"
              id="receiver_name"
              disabled={loading}
              value={formData.receiver_name}
              onChange={handleChange}
              placeholder="Ej. Juan Pérez"
              className={`block w-full shadow-xs sm:text-sm rounded-xl p-3 border focus:outline-none focus:ring-2 transition-all ${
                formErrors.receiver_name
                  ? "border-red-300 bg-red-50/30 focus:ring-red-100 focus:border-red-400"
                  : "border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-[#6b1e96]/15 focus:border-[#6b1e96]"
              }`}
            />
            {formErrors.receiver_name && (
              <p className="text-red-500 text-xs font-bold mt-1.5 flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">error</span>
                {formErrors.receiver_name}
              </p>
            )}
          </div>

          <div className="col-span-6 sm:col-span-3">
            <label htmlFor="cedula_number" className="block text-xs font-extrabold text-slate-600 uppercase tracking-wider mb-1.5">
              Cédula / RIF del Destinatario *
            </label>
            <div className={`flex rounded-xl shadow-xs border transition-all focus-within:ring-2 focus-within:ring-[#6b1e96]/15 ${
              formErrors.receiver_cedula
                ? "border-red-300 bg-red-50/30 focus-within:border-red-400"
                : "border-slate-200 bg-slate-50/50 focus-within:bg-white focus-within:border-[#6b1e96]"
            }`}>
              <select
                value={cedulaPrefix}
                onChange={handlePrefixChange}
                disabled={loading}
                className="bg-transparent pl-3 pr-2 py-3 text-sm font-bold text-slate-700 outline-none border-r border-slate-200 cursor-pointer focus:outline-none"
              >
                <option value="V">V</option>
                <option value="E">E</option>
                <option value="J">J</option>
                <option value="G">G</option>
                <option value="P">P</option>
              </select>
              <input
                type="text"
                name="cedula_number"
                id="cedula_number"
                disabled={loading}
                value={cedulaNumber}
                onChange={handleCedulaNumberChange}
                placeholder="Ej. 27709480"
                className="block w-full bg-transparent p-3 text-sm outline-none border-0 text-slate-800 placeholder:text-slate-400 focus:ring-0 focus:outline-none focus:border-0"
              />
            </div>
            {formErrors.receiver_cedula && (
              <p className="text-red-500 text-xs font-bold mt-1.5 flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">error</span>
                {formErrors.receiver_cedula}
              </p>
            )}
          </div>

          <div className="col-span-6 sm:col-span-3">
            <label htmlFor="receiver_email" className="block text-xs font-extrabold text-slate-600 uppercase tracking-wider mb-1.5">
              Correo Electrónico *
            </label>
            <input
              type="email"
              name="receiver_email"
              id="receiver_email"
              disabled={loading}
              value={formData.receiver_email}
              onChange={handleChange}
              placeholder="Ej. juan@correo.com"
              className={`block w-full shadow-xs sm:text-sm rounded-xl p-3 border focus:outline-none focus:ring-2 transition-all ${
                formErrors.receiver_email
                  ? "border-red-300 bg-red-50/30 focus:ring-red-100 focus:border-red-400"
                  : "border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-[#6b1e96]/15 focus:border-[#6b1e96]"
              }`}
            />
            {formErrors.receiver_email && (
              <p className="text-red-500 text-xs font-bold mt-1.5 flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">error</span>
                {formErrors.receiver_email}
              </p>
            )}
          </div>

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
            {user && !selectedAddressId && savedAddresses.length < 10 && (
              <div className="mt-3 bg-slate-50/70 border border-slate-100 rounded-xl p-3.5">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={saveAddress}
                    onChange={(e) => setSaveAddress(e.target.checked)}
                    disabled={loading}
                    className="w-4 h-4 accent-[#6b1e96] cursor-pointer"
                  />
                  <span className="text-xs font-bold text-slate-700">
                    Guardar esta dirección en mi libreta para futuras compras
                  </span>
                </label>
                {saveAddress && (
                  <input
                    type="text"
                    value={addressLabel}
                    onChange={(e) => setAddressLabel(e.target.value)}
                    disabled={loading}
                    placeholder="Etiqueta: Casa, Consultorio, Oficina..."
                    className="mt-2.5 block w-full sm:text-sm rounded-xl border-slate-200 bg-white p-2.5 border focus:outline-none focus:ring-2 focus:ring-[#6b1e96]/15 focus:border-[#6b1e96] transition-all"
                  />
                )}
              </div>
            )}
          </div>

          {hasAnyLocalDelivery && (
            <>
              <div className="col-span-6">
                <label className="block text-xs font-extrabold text-slate-600 uppercase tracking-wider mb-2">
                  Ubicación Exacta en el Mapa *
                </label>
                <MapAddressPicker
                  value={
                    formData.delivery_lat != null && formData.delivery_lng != null
                      ? { lat: formData.delivery_lat, lng: formData.delivery_lng }
                      : null
                  }
                  onChange={handleMapChange}
                  height="300px"
                />
                {formData.delivery_lat && (
                  <span className="inline-flex mt-2.5 text-xs text-emerald-600 font-extrabold items-center gap-1 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">
                    <span className="material-symbols-outlined text-[15px] text-emerald-600">check_circle</span>
                    ¡Ubicación fijada! ({formData.delivery_lat.toFixed(4)}, {formData.delivery_lng.toFixed(4)})
                  </span>
                )}
                {formErrors.location && (
                  <p className="text-red-500 text-xs font-bold mt-1.5 flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">error</span>
                    {formErrors.location}
                  </p>
                )}
                <p className="text-[11px] text-slate-400 mt-2.5 font-medium italic">
                  Mueve el pin hasta tu puerta: el repartidor llegará exactamente a ese punto.
                </p>
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
              <div className="col-span-6">
                <label htmlFor="preferred_shipping_carrier" className="block text-xs font-extrabold text-slate-600 uppercase tracking-wider mb-1.5">
                  Agencia de Envío de Preferencia *
                </label>
                <select
                  id="preferred_shipping_carrier"
                  name="preferred_shipping_carrier"
                  disabled={loading}
                  value={formData.preferred_shipping_carrier}
                  onChange={handleChange}
                  className={`block w-full shadow-xs sm:text-sm rounded-xl p-3 border focus:outline-none focus:ring-2 transition-all bg-white ${
                    formErrors.preferred_shipping_carrier
                      ? "border-red-300 bg-red-50/30 focus:ring-red-100 focus:border-red-400"
                      : "border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-[#6b1e96]/15 focus:border-[#6b1e96]"
                  }`}
                >
                  <option value="">Selecciona una agencia de envío</option>
                  <option value="zoom">Zoom (Cobro a destino)</option>
                  <option value="mrw">MRW (Cobro a destino)</option>
                  <option value="tealca">Tealca (Cobro a destino)</option>
                </select>
                {formErrors.preferred_shipping_carrier && (
                  <p className="text-red-500 text-xs font-bold mt-1.5 flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">error</span>
                    {formErrors.preferred_shipping_carrier}
                  </p>
                )}
              </div>

              {showOffices && (
                <div className="col-span-6">
                  <label className="block text-xs font-extrabold text-slate-600 uppercase tracking-wider mb-2">
                    Oficinas Zoom en {formData.destination_state}
                    {offices.length > 0 && (
                      <span className="ml-2 text-[10px] font-black bg-purple-50 text-[#6b1e96] px-2 py-0.5 rounded-full normal-case tracking-normal">
                        {offices.length} disponibles
                      </span>
                    )}
                  </label>
                  {officesLoading ? (
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400 p-4 bg-slate-50/70 rounded-xl border border-slate-100">
                      <span className="w-4 h-4 border-2 border-slate-200 border-t-[#6b1e96] rounded-full animate-spin" />
                      Buscando oficinas...
                    </div>
                  ) : offices.length === 0 ? (
                    <p className="text-xs font-semibold text-slate-400 p-4 bg-slate-50/70 rounded-xl border border-slate-100">
                      No tenemos oficinas Zoom registradas en este estado. Escribe la sede de tu preferencia en la dirección.
                    </p>
                  ) : (
                    <>
                      {offices.length > 6 && (
                        <input
                          type="text"
                          value={officeFilter}
                          onChange={(e) => setOfficeFilter(e.target.value)}
                          placeholder="Filtrar por ciudad, sector o nombre..."
                          className="block w-full mb-2.5 sm:text-sm rounded-xl border-slate-200 bg-slate-50/50 p-2.5 border focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#6b1e96]/15 focus:border-[#6b1e96] transition-all"
                        />
                      )}
                      <div className="max-h-64 overflow-y-auto rounded-xl border border-slate-100 divide-y divide-slate-100">
                        {offices
                          .filter((o) => {
                            const q = officeFilter.trim().toLowerCase();
                            if (!q) return true;
                            return `${o.name} ${o.city || ""} ${o.address}`.toLowerCase().includes(q);
                          })
                          .map((office) => (
                            <button
                              key={office.id}
                              type="button"
                              disabled={loading}
                              onClick={() => applyOffice(office)}
                              className={`w-full text-left p-3.5 flex items-start gap-3 transition-colors cursor-pointer ${
                                selectedOfficeId === office.id
                                  ? "bg-purple-50/50 ring-1 ring-inset ring-[#6b1e96]"
                                  : "bg-white hover:bg-slate-50"
                              }`}
                            >
                              <span className={`material-symbols-outlined text-[20px] mt-0.5 ${
                                selectedOfficeId === office.id ? "text-[#6b1e96]" : "text-slate-300"
                              }`}>
                                {selectedOfficeId === office.id ? "check_circle" : "package_2"}
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block text-sm font-black text-slate-900">
                                  {office.name}
                                  {office.distance_km != null && (
                                    <span className="ml-2 text-[10px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                                      a {office.distance_km} km
                                    </span>
                                  )}
                                </span>
                                <span className="block text-xs font-semibold text-slate-500 mt-0.5 leading-relaxed">
                                  {office.address}{office.city ? ` · ${office.city}` : ""}
                                </span>
                                {office.phone && (
                                  <span className="block text-[11px] font-bold text-slate-400 mt-0.5">📞 {office.phone}</span>
                                )}
                              </span>
                            </button>
                          ))}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-2 font-medium">
                        Elige tu oficina de retiro y la pondremos como dirección de envío. El cobro del flete es a destino, en la oficina.
                      </p>
                    </>
                  )}
                </div>
              )}
            </>
          )}



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
