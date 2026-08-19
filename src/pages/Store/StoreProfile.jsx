import { useEffect, useState, useCallback, useRef } from "react";
import { useStore } from "../../context/StoreContext";
import { useAuth } from "../../context/AuthContext";
import { checkStoreNameAPI } from "../../services/api";
import toast from "react-hot-toast";
import { VENEZUELA_STATES } from "../../utils/venezuelaStates";
import MapAddressPicker from "../../components/common/MapAddressPicker";

export default function StoreProfile() {
  const { storeProfile, loading, updateProfile, uploadImage } = useStore();
  const { refreshSession } = useAuth();
  const [form, setForm] = useState({
    business_name: "",
    rif: "",
    business_phone: "",
    business_address: "",
    state: "",
    description: "",
    logo_url: "",
    offers_local_delivery: false,
    default_delivery_fee: "",
    delivery_coverage_description: "",
    is_open: true,
    business_hours: "",
    lat: null,
    lng: null,
  });
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);
  // Name availability check state
  const [nameStatus, setNameStatus] = useState(null); // null | 'checking' | 'available' | 'taken'
  const nameCheckTimer = useRef(null);
  const originalName = useRef("");

  // Poblar el formulario desde el contexto (ya cargado por StoreLayout)
  useEffect(() => {
    if (storeProfile) {
      setForm({
        business_name: storeProfile.business_name || "",
        rif: storeProfile.rif || "",
        business_phone: storeProfile.business_phone || "",
        business_address: storeProfile.business_address || "",
        state: storeProfile.state || "",
        description: storeProfile.description || "",
        logo_url: storeProfile.logo_url || "",
        offers_local_delivery: storeProfile.offers_local_delivery || false,
        default_delivery_fee: storeProfile.default_delivery_fee || "",
        delivery_coverage_description: storeProfile.delivery_coverage_description || "",
        is_open: storeProfile.is_open ?? true,
        business_hours: storeProfile.business_hours || "",
        lat: storeProfile.lat ?? null,
        lng: storeProfile.lng ?? null,
      });
      originalName.current = storeProfile.business_name || "";
    }
  }, [storeProfile]);

  // Check store name availability (debounced)
  const checkNameAvailability = useCallback(async (name) => {
    const trimmed = name.trim();
    // If unchanged from the saved name, mark as available
    if (trimmed.toLowerCase() === originalName.current.toLowerCase()) {
      setNameStatus(null);
      return;
    }
    if (trimmed.length < 2) {
      setNameStatus(null);
      return;
    }
    setNameStatus("checking");
    try {
      const res = await checkStoreNameAPI(trimmed);
      setNameStatus(res.data.available ? "available" : "taken");
    } catch {
      setNameStatus(null);
    }
  }, []);

  const handleNameBlur = () => {
    if (nameCheckTimer.current) clearTimeout(nameCheckTimer.current);
    nameCheckTimer.current = setTimeout(() => {
      checkNameAvailability(form.business_name);
    }, 300);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    setSaved(false);
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const result = await uploadImage(file);
    setUploading(false);
    if (result.success) {
      setForm((prev) => ({ ...prev, logo_url: result.url }));
      toast.success("Logo subido exitosamente");
    } else {
      toast.error(result.error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (nameStatus === "taken") {
      toast.error("El nombre de tienda ya está en uso. Elige otro nombre.");
      return;
    }
    const result = await updateProfile(form);
    if (result.success) {
      await refreshSession();
      originalName.current = form.business_name.trim();
      setNameStatus(null);
      toast.success("Perfil de tienda actualizado");
      setSaved(true);
    } else {
      // Handle specific error for name collision (409)
      if (result.error?.includes("nombre") && result.error?.includes("uso")) {
        setNameStatus("taken");
      }
      toast.error(result.error);
    }
  };

  // Shared input styles
  const inputStyle = {
    width: "100%",
    padding: "9px 12px",
    borderRadius: "8px",
    border: "1.5px solid #e5e7eb",
    fontSize: "13px",
    outline: "none",
    transition: "border-color 0.2s, box-shadow 0.2s",
    background: "#fafafa",
    color: "#1f2937",
    boxSizing: "border-box",
  };

  const labelStyle = {
    display: "block",
    fontSize: "12px",
    fontWeight: 700,
    color: "#374151",
    marginBottom: "6px",
  };

  const focusHandlers = {
    onFocus: (e) => {
      e.target.style.borderColor = "#6b1e96";
      e.target.style.boxShadow = "0 0 0 3px rgba(107,30,150,0.08)";
    },
    onBlur: (e) => {
      e.target.style.borderColor = "#e5e7eb";
      e.target.style.boxShadow = "none";
    },
  };

  return (
    <div style={{ minHeight: "100%", maxWidth: "1000px", marginTop: "16px" }}>
      {/* ── Header ── */}
      <div style={{ marginBottom: "24px" }}>
        <h2 style={{ fontSize: "22px", fontWeight: 800, color: "#1a0a2e", margin: 0, letterSpacing: "-0.02em" }}>
          Perfil de Tienda
        </h2>
        <p style={{ fontSize: "13px", color: "#9ca3af", margin: "4px 0 0 0" }}>
          Esta información aparecerá junto a tus productos
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* ── Section 1: Identity ── */}
        <div
          style={{
            background: "#fff",
            borderRadius: "16px",
            border: "1px solid #f0f0f0",
            overflow: "hidden",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            marginBottom: "16px",
          }}
        >
          {/* Section header */}
          <div
            style={{
              background: "linear-gradient(135deg, #1a0a2e, #2d1248)",
              padding: "14px 20px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <div style={{
              width: "28px", height: "28px", borderRadius: "8px",
              background: "rgba(195,255,0,0.1)", display: "flex",
              alignItems: "center", justifyContent: "center",
            }}>
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#c3ff00" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z" />
              </svg>
            </div>
            <div>
              <h3 style={{ fontSize: "13px", fontWeight: 800, color: "#c3ff00", margin: 0 }}>
                Identidad del Negocio
              </h3>
              <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", margin: "2px 0 0 0" }}>
                Información principal visible para compradores
              </p>
            </div>
          </div>

          <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "18px" }}>
            {/* Logo Section */}
            <div style={{ display: "flex", gap: "20px", alignItems: "flex-start" }}>
              {/* Logo Preview */}
              <div style={{ flexShrink: 0 }}>
                <div
                  style={{
                    width: "80px",
                    height: "80px",
                    borderRadius: "14px",
                    overflow: "hidden",
                    background: form.logo_url ? "transparent" : "linear-gradient(135deg, #f3f4f6, #e5e7eb)",
                    border: "2px dashed #e5e7eb",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    position: "relative",
                  }}
                >
                  {form.logo_url ? (
                    <>
                      <img
                        src={form.logo_url}
                        alt="Logo"
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                      <button
                        type="button"
                        onClick={() => setForm((prev) => ({ ...prev, logo_url: "" }))}
                        style={{
                          position: "absolute",
                          top: "4px",
                          right: "4px",
                          width: "20px",
                          height: "20px",
                          borderRadius: "50%",
                          background: "rgba(220,38,38,0.9)",
                          color: "#fff",
                          border: "none",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "11px",
                          fontWeight: 800,
                        }}
                      >
                        ✕
                      </button>
                    </>
                  ) : (
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: "24px", marginBottom: "2px" }}>🏪</div>
                      <span style={{ fontSize: "8px", color: "#9ca3af", fontWeight: 600 }}>SIN LOGO</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Logo upload controls */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={labelStyle}>Logo de tu tienda</span>

                <label
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "8px 16px",
                    borderRadius: "8px",
                    border: "1.5px dashed rgba(107,30,150,0.25)",
                    background: "rgba(107,30,150,0.03)",
                    color: "#6b1e96",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: uploading ? "not-allowed" : "pointer",
                    transition: "all 0.2s",
                    marginBottom: "8px",
                  }}
                >
                  {uploading ? (
                    <>
                      <div style={{ width: "14px", height: "14px", border: "2px solid rgba(107,30,150,0.2)", borderTop: "2px solid #6b1e96", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                      Subiendo...
                    </>
                  ) : (
                    <>
                      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                      </svg>
                      Subir imagen
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    disabled={uploading}
                    style={{ display: "none" }}
                  />
                </label>

                <p style={{ fontSize: "10px", color: "#9ca3af", marginTop: "6px" }}>
                  Formatos aceptados: JPG, PNG, WEBP. Máx. 5MB.
                </p>
              </div>
            </div>

            {/* Grid for Inputs */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
              {/* Store Code (Read-only) */}
              {storeProfile?.store_code && (
                <div>
                  <label style={labelStyle}>
                    Código de Tienda
                  </label>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <input
                      type="text"
                      value={storeProfile.store_code}
                      readOnly
                      style={{
                        ...inputStyle,
                        background: "#f3f4f6",
                        fontWeight: 800,
                        fontSize: "15px",
                        letterSpacing: "0.15em",
                        color: "#6b1e96",
                        cursor: "default",
                        textAlign: "center",
                        maxWidth: "140px",
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(storeProfile.store_code);
                        toast.success("Código copiado");
                      }}
                      style={{
                        padding: "8px 12px",
                        borderRadius: "8px",
                        border: "1.5px solid #e5e7eb",
                        background: "#fff",
                        cursor: "pointer",
                        fontSize: "11px",
                        color: "#6b7280",
                        fontWeight: 600,
                        transition: "all 0.15s",
                      }}
                      title="Copiar código"
                    >
                      📋 Copiar
                    </button>
                  </div>
                  <span style={{ fontSize: "10px", color: "#9ca3af", marginTop: "4px", display: "block" }}>
                    Identificador único de tu tienda
                  </span>
                </div>
              )}

              {/* Business Name */}
              <div>
                <label style={labelStyle}>
                  Nombre del Negocio <span style={{ color: "#dc2626" }}>*</span>
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type="text"
                    name="business_name"
                    value={form.business_name}
                    onChange={(e) => {
                      handleChange(e);
                      setNameStatus(null);
                    }}
                    onBlur={(e) => {
                      focusHandlers.onBlur(e);
                      handleNameBlur();
                    }}
                    onFocus={focusHandlers.onFocus}
                    required
                    style={{
                      ...inputStyle,
                      paddingRight: "36px",
                      borderColor: nameStatus === "taken" ? "#dc2626" : nameStatus === "available" ? "#16a34a" : inputStyle.border?.split(" ").pop() || "#e5e7eb",
                    }}
                    placeholder="Ej: Dental Express Venezuela"
                  />
                  {/* Status indicator */}
                  {nameStatus && (
                    <span style={{
                      position: "absolute",
                      right: "10px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      fontSize: "14px",
                      lineHeight: 1,
                    }}>
                      {nameStatus === "checking" && (
                        <span style={{ display: "inline-block", width: "14px", height: "14px", border: "2px solid rgba(107,30,150,0.2)", borderTop: "2px solid #6b1e96", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                      )}
                      {nameStatus === "available" && "✅"}
                      {nameStatus === "taken" && "❌"}
                    </span>
                  )}
                </div>
                {nameStatus === "taken" && (
                  <span style={{ fontSize: "11px", color: "#dc2626", marginTop: "4px", display: "block", fontWeight: 600 }}>
                    Este nombre ya está en uso por otra tienda
                  </span>
                )}
                {nameStatus === "available" && (
                  <span style={{ fontSize: "11px", color: "#16a34a", marginTop: "4px", display: "block", fontWeight: 600 }}>
                    ✓ Nombre disponible
                  </span>
                )}
              </div>

              {/* RIF */}
              <div>
                <label style={labelStyle}>
                  RIF de la Empresa <span style={{ color: "#dc2626" }}>*</span>
                </label>
                <input
                  type="text"
                  name="rif"
                  value={form.rif}
                  onChange={handleChange}
                  required
                  style={inputStyle}
                  placeholder="Ej: J-12345678-9"
                  {...focusHandlers}
                />
              </div>

              {/* Business Phone */}
              <div>
                <label style={labelStyle}>
                  Teléfono de Contacto (Ventas) <span style={{ color: "#dc2626" }}>*</span>
                </label>
                <input
                  type="tel"
                  name="business_phone"
                  value={form.business_phone}
                  onChange={handleChange}
                  required
                  style={inputStyle}
                  placeholder="Ej: 0414-1234567"
                  {...focusHandlers}
                />
              </div>

              {/* Business Address */}
              <div>
                <label style={labelStyle}>
                  Dirección Física <span style={{ color: "#dc2626" }}>*</span>
                </label>
                <input
                  type="text"
                  name="business_address"
                  value={form.business_address}
                  onChange={handleChange}
                  required
                  style={inputStyle}
                  placeholder="Ej: Av. Principal, Edificio Plaza, Local 3"
                  {...focusHandlers}
                />
              </div>

              {/* State */}
              <div>
                <label style={labelStyle}>
                  Ubicación (Estado) <span style={{ color: "#dc2626" }}>*</span>
                </label>
                <select
                  name="state"
                  value={form.state}
                  onChange={handleChange}
                  required
                  style={{ ...inputStyle, cursor: "pointer", color: form.state ? "#1f2937" : "#9ca3af" }}
                >
                  <option value="" disabled>Selecciona un estado...</option>
                  {VENEZUELA_STATES.map((stateName) => (
                    <option key={stateName} value={stateName}>
                      {stateName}
                    </option>
                  ))}
                </select>
                <p style={{ margin: "4px 0 0 0", fontSize: "10px", color: "#9ca3af", display: "flex", alignItems: "center", gap: "4px" }}>
                  <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
                  </svg>
                  Odontólogos locales verán tus productos con prioridad.
                </p>
              </div>
            </div>

            {/* Ubicación exacta (pin en el mapa) */}
            <div>
              <label style={labelStyle}>
                Ubicación exacta en el mapa
              </label>
              <p style={{ fontSize: "11px", color: "#6b7280", margin: "0 0 10px 0" }}>
                Coloca el pin en la entrada de tu local. Tus repartidores navegarán a este punto
                exacto, no a la dirección escrita.
              </p>
              <MapAddressPicker
                value={form.lat != null && form.lng != null ? { lat: form.lat, lng: form.lng } : null}
                onChange={(lat, lng) => {
                  setForm((prev) => ({ ...prev, lat, lng }));
                  setSaved(false);
                }}
                height="300px"
              />
              {form.lat != null && form.lng != null ? (
                <p style={{ fontSize: "11px", color: "#059669", margin: "8px 0 0 0", fontWeight: 600, display: "flex", alignItems: "center", gap: "6px" }}>
                  ✓ Pin fijado ({Number(form.lat).toFixed(5)}, {Number(form.lng).toFixed(5)})
                  <button
                    type="button"
                    onClick={() => { setForm((prev) => ({ ...prev, lat: null, lng: null })); setSaved(false); }}
                    style={{ border: "none", background: "none", color: "#dc2626", fontSize: "11px", fontWeight: 700, cursor: "pointer", padding: 0, textDecoration: "underline" }}
                  >
                    Quitar pin
                  </button>
                </p>
              ) : (
                <p style={{ fontSize: "11px", color: "#d97706", margin: "8px 0 0 0", fontWeight: 600 }}>
                  Sin pin: tus repartidores solo verán la dirección escrita.
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <label style={labelStyle}>Descripción</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={3}
                style={{ ...inputStyle, resize: "none", fontFamily: "inherit" }}
                placeholder="Describe tu tienda y lo que ofreces..."
                {...focusHandlers}
              />
            </div>
          </div>
        </div>

        {/* ── Section 2: Operatividad ── */}
        <div
          style={{
            background: "#fff",
            borderRadius: "16px",
            border: "1px solid #f0f0f0",
            overflow: "hidden",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            marginBottom: "16px",
          }}
        >
          <div
            style={{
              background: "linear-gradient(135deg, #1a0a2e, #2d1248)",
              padding: "14px 20px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <div style={{
              width: "28px", height: "28px", borderRadius: "8px",
              background: "rgba(195,255,0,0.1)", display: "flex",
              alignItems: "center", justifyContent: "center",
            }}>
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#c3ff00" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
            </div>
            <div>
              <h3 style={{ fontSize: "13px", fontWeight: 800, color: "#c3ff00", margin: 0 }}>
                Estado Operativo
              </h3>
              <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", margin: "2px 0 0 0" }}>
                Informa a los clientes si estás atendiendo pedidos
              </p>
            </div>
          </div>

          <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "18px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: form.is_open ? "rgba(16, 185, 129, 0.05)" : "rgba(220, 38, 38, 0.05)", borderRadius: "12px", border: `1px solid ${form.is_open ? "rgba(16, 185, 129, 0.2)" : "rgba(220, 38, 38, 0.2)"}`, transition: "all 0.3s" }}>
              <div>
                <h4 style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: form.is_open ? "#059669" : "#dc2626", display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "50%", background: form.is_open ? "#10b981" : "#ef4444", boxShadow: form.is_open ? "0 0 8px rgba(16,185,129,0.5)" : "none" }}></span>
                  {form.is_open ? "Tienda Abierta" : "Tienda Cerrada"}
                </h4>
                <p style={{ margin: "4px 0 0 0", fontSize: "11px", color: "#6b7280" }}>
                  {form.is_open ? "Los clientes verán que procesas pedidos con normalidad." : "Se notificará a los clientes que los envíos se procesarán luego."}
                </p>
              </div>
              <label style={{ position: "relative", display: "inline-block", width: "48px", height: "26px", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  name="is_open"
                  checked={form.is_open}
                  onChange={handleChange}
                  style={{ opacity: 0, width: 0, height: 0 }}
                />
                <span style={{
                  position: "absolute", cursor: "pointer", top: 0, left: 0, right: 0, bottom: 0,
                  backgroundColor: form.is_open ? "#10b981" : "#d1d5db", borderRadius: "26px", transition: "0.3s"
                }}>
                  <span style={{
                    position: "absolute", content: '""', height: "20px", width: "20px",
                    left: form.is_open ? "24px" : "3px", bottom: "3px", backgroundColor: "white", borderRadius: "50%", transition: "0.3s", boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
                  }}></span>
                </span>
              </label>
            </div>

            <div>
              <label style={labelStyle}>
                Horario Comercial (Opcional)
              </label>
              <input
                type="text"
                name="business_hours"
                value={form.business_hours}
                onChange={handleChange}
                style={inputStyle}
                placeholder="Ej: Lunes a Viernes 8:00 AM - 5:00 PM"
                {...focusHandlers}
              />
              <p style={{ margin: "4px 0 0 0", fontSize: "11px", color: "#9ca3af" }}>
                Este texto se mostrará a los clientes cuando la tienda esté cerrada.
              </p>
            </div>
          </div>
        </div>

        {/* ── Save Button ── */}
        <button
          type="submit"
          disabled={loading || uploading}
          style={{
            width: "100%",
            padding: "13px",
            background: saved
              ? "linear-gradient(135deg, #059669, #10b981)"
              : loading || uploading
                ? "rgba(107,30,150,0.4)"
                : "linear-gradient(135deg, #531575, #6b1e96)",
            color: saved ? "#fff" : "#c3ff00",
            borderRadius: "12px",
            border: "none",
            fontWeight: 800,
            fontSize: "14px",
            cursor: loading || uploading ? "not-allowed" : "pointer",
            transition: "all 0.3s",
            boxShadow: saved
              ? "0 4px 15px rgba(16,185,129,0.3)"
              : "0 4px 15px rgba(107,30,150,0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
          }}
        >
          {loading ? (
            <>
              <div style={{ width: "16px", height: "16px", border: "2px solid rgba(195,255,0,0.3)", borderTop: "2px solid #c3ff00", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
              Guardando...
            </>
          ) : saved ? (
            <>
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
              Guardado exitosamente
            </>
          ) : (
            <>
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 3.75H6.912a2.25 2.25 0 0 0-2.15 1.588L2.35 13.177a2.25 2.25 0 0 0-.1.661V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 0 0-2.15-1.588H15M2.25 13.5h3.86a2.25 2.25 0 0 1 2.012 1.244l.256.512a2.25 2.25 0 0 0 2.013 1.244h3.218a2.25 2.25 0 0 0 2.013-1.244l.256-.512a2.25 2.25 0 0 1 2.013-1.244h3.859M12 3v8.25m0 0-3-3m3 3 3-3" />
              </svg>
              Guardar Perfil
            </>
          )}
        </button>
      </form>

      {/* Keyframe animations */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
