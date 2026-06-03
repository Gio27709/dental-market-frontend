import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { getStoreProfile, updateMyProfileAPI, uploadAvatarAPI } from "../services/api";
import { supabase } from "../lib/supabaseClient";
import toast from "react-hot-toast";
import { COUNTRY_CODES } from "../utils/constants";
import { validateLocalPhone, parsePhoneWithCountryCode } from "../utils/validators";

export default function Account() {
  const { user, refreshSession } = useAuth();
  const navigate = useNavigate();
  const [storeProfile, setStoreProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  const fullName = user?.firstName
    ? `${user.firstName} ${user.lastName || ""}`
    : "No configurado";

  const [isEditing, setIsEditing] = useState(false);
  const [editNameProfile, setEditNameProfile] = useState(fullName);
  const [editPhoneProfile, setEditPhoneProfile] = useState("");
  const [countryCode, setCountryCode] = useState("+58");
  const [phoneError, setPhoneError] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  useEffect(() => {
    // Curar la enfermedad: Auto-sincronizar siempre la metadata más fresca de la BD al cargar el perfil
    if (refreshSession) {
      refreshSession();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (user?.role === "store" || user?.role === "owner") {
      fetchStoreProfile().then((profile) => {
        // Auto-sincronizar: si la tienda tiene teléfono pero Account no, pre-popular
        if (profile && profile.business_phone && !user?.phone) {
          const parsed = parsePhoneWithCountryCode(profile.business_phone);
          setCountryCode(parsed.countryCode);
          setEditPhoneProfile(parsed.localNumber);
        }
      });
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      setEditNameProfile(user.firstName ? `${user.firstName} ${user.lastName || ""}` : "");
      const parsed = parsePhoneWithCountryCode(user.phone);
      setCountryCode(parsed.countryCode);
      setEditPhoneProfile(parsed.localNumber);
    }
  }, [user]);

  if (!user) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6b1e96]"></div>
      </div>
    );
  }

  let ObjectDaysLeftNameChange = 0;
  let ObjectCanChangeName = true;
  if (user?.lastNameChange) {
    const lastChange = new Date(user.lastNameChange);
    const diffDays = (new Date() - lastChange) / (1000 * 60 * 60 * 24);
    if (diffDays < 15) {
      ObjectCanChangeName = false;
      ObjectDaysLeftNameChange = Math.ceil(15 - diffDays);
    }
  }

  const handlePhoneChange = (value) => {
    // Filtrar todo lo que no sea dígito en tiempo real
    const digitsOnly = value.replace(/\D/g, "");
    setEditPhoneProfile(digitsOnly);
    // Limpiar error mientras escribe
    if (phoneError) setPhoneError(null);
  };

  const handleSaveProfile = async () => {
    try {
      setIsUpdating(true);

      // Validar teléfono antes de enviar
      if (editPhoneProfile) {
        const phoneValidation = validateLocalPhone(editPhoneProfile, countryCode);
        if (!phoneValidation.valid) {
          setPhoneError(phoneValidation.error);
          setIsUpdating(false);
          return;
        }
      }

      // Construir número completo: +584141234567
      const fullPhone = editPhoneProfile ? `${countryCode}${editPhoneProfile}` : "";

      await updateMyProfileAPI({ full_name: editNameProfile, phone: fullPhone });
      
      // Force token refresh to auto-update latest user_metadata across the entire app
      await supabase.auth.refreshSession();
      
      toast.success("Perfil actualizado correctamente");
      setPhoneError(null);
      setIsEditing(false);
    } catch (err) {
      toast.error(err.message || "Error al actualizar perfil");
    } finally {
      setIsUpdating(false);
    }
  };

  const fetchStoreProfile = async () => {
    try {
      setLoadingProfile(true);
      const res = await getStoreProfile();
      const profile = res.data?.data;
      setStoreProfile(profile);
      return profile;
    } catch (err) {
      console.error("Error al cargar perfil de tienda:", err.message);
      return null;
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validación básica
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Formato no soportado. Usa JPG o PNG.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("La imagen es muy pesada (Máximo 5MB).");
      return;
    }

    try {
      setIsUploadingAvatar(true);
      const formData = new FormData();
      formData.append("image", file);

      await uploadAvatarAPI(formData);
      
      // Force token refresh to auto-update session user metadata across the app
      await supabase.auth.refreshSession();
      toast.success("Foto de perfil actualizada con éxito.");
    } catch (err) {
      toast.error(err.message || "Error al subir avatar");
    } finally {
      setIsUploadingAvatar(false);
      // Reset file input so re-selecting the same file triggers onChange
      e.target.value = "";
    }
  };

  const handleSecurityCheck = async () => {
    if (!user?.email) return;
    try {
      toast.loading("Enviando enlace seguro...", { id: "reset-pw" });
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/account/password`,
      });
      if (error) throw error;
      toast.success("Te hemos enviado un correo seguro para revisar tu cuenta.", { id: "reset-pw" });
    } catch (err) {
      console.error("Error en security check:", err);
      toast.error("Error al solicitar revisión de seguridad.", { id: "reset-pw" });
    }
  };



  return (
    <div className="space-y-8">
      {/* ── Layout Editorial: 2/3 + 1/3 ── */}
      <div className="flex flex-col lg:flex-row gap-8">
        {/* ── Columna Izquierda (2/3) ── */}
        <div className="flex-1 space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: "#191c23" }}>
              Información Personal
            </h1>
            <p className="text-sm mt-1" style={{ color: "#727785" }}>
              Información sobre ti y tus preferencias en Dentix. Esta información nos ayuda a brindarte una experiencia más personalizada.
            </p>
          </div>

          {/* ── Basic Info Card ── */}
          <div className="rounded-2xl p-6" style={{ background: "#ffffff", boxShadow: "0 4px 24px rgba(107,30,150,0.04)" }}>
            <div className="flex items-center gap-2 mb-5">
              <span className="material-symbols-outlined" style={{ fontSize: "20px", color: "#6b1e96" }}>
                badge
              </span>
              <h2 className="text-base font-bold" style={{ color: "#191c23" }}>
                Datos Básicos
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Nombre */}
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: "#727785" }}>
                  Nombre Completo
                </label>
                {isEditing ? (
                  <>
                    <input
                      type="text"
                      className="w-full px-4 py-2.5 rounded-xl text-sm font-medium outline-none transition-all duration-200 focus:ring-2 focus:ring-[#6b1e96]/30"
                      style={{ background: ObjectCanChangeName ? "#ffffff" : "#f3f4f6", color: ObjectCanChangeName ? "#191c23" : "#9ca3af", border: "1px solid rgba(0,0,0,0.15)" }}
                      value={editNameProfile}
                      onChange={(e) => setEditNameProfile(e.target.value)}
                      disabled={!ObjectCanChangeName}
                    />
                    {!ObjectCanChangeName && (
                      <p className="text-[10px] mt-1.5 text-amber-600 font-medium">
                        * Solo puedes cambiar el nombre 1 vez cada 15 días. Te faltan {ObjectDaysLeftNameChange} días.
                      </p>
                    )}
                  </>
                ) : (
                  <div className="px-4 py-3 rounded-xl text-sm font-medium" style={{ background: "#f9f9ff", color: "#191c23", border: "1px solid rgba(0,0,0,0.06)" }}>
                    {fullName}
                  </div>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: "#727785" }}>
                  Correo Electrónico
                </label>
                <div className="px-4 py-3 rounded-xl text-sm font-medium" style={{ background: "#f9f9ff", color: "#191c23", border: "1px solid rgba(0,0,0,0.06)" }}>
                  {user.email}
                </div>
              </div>

              {/* Rol */}
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: "#727785" }}>
                  Rol en Dentix
                </label>
                <div className="px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2" style={{ background: "#f9f9ff", color: "#6b1e96", border: "1px solid rgba(0,0,0,0.06)" }}>
                  <span className="w-2 h-2 rounded-full" style={{ background: "#6b1e96" }}></span>
                  {user.role === 'buyer' ? 'Usuario' : user.role === 'admin' ? 'Administrador' : user.role === 'owner' ? 'Owner 👑' : (user.role === 'store' || user.role === 'store/owner') ? 'Tienda' : user.role}
                </div>
              </div>
            </div>
          </div>

          {/* ── Contact Info Card ── */}
          <div className="rounded-2xl p-6" style={{ background: "#ffffff", boxShadow: "0 4px 24px rgba(107,30,150,0.04)" }}>
            <div className="flex items-center gap-2 mb-5">
              <span className="material-symbols-outlined" style={{ fontSize: "20px", color: "#6b1e96" }}>
                contact_mail
              </span>
              <h2 className="text-base font-bold" style={{ color: "#191c23" }}>
                Información de Contacto
              </h2>
            </div>
            <p className="text-xs mb-5" style={{ color: "#727785" }}>
              Gestiona tu correo electrónico y opciones de recuperación.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: "#727785" }}>
                  Email
                </label>
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium" style={{ background: "#f9f9ff", color: "#191c23", border: "1px solid rgba(0,0,0,0.06)" }}>
                  <span className="material-symbols-outlined" style={{ fontSize: "16px", color: "#9ca3af" }}>mail</span>
                  {user.email}
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: "#727785" }}>
                  Teléfono
                </label>
                {isEditing ? (
                  <div>
                    <div className="flex gap-0 rounded-xl overflow-hidden" style={{ border: phoneError ? "1.5px solid #ef4444" : "1px solid rgba(0,0,0,0.15)" }}>
                      {/* Selector de código de país */}
                      <select
                        value={countryCode}
                        onChange={(e) => {
                          setCountryCode(e.target.value);
                          if (phoneError) setPhoneError(null);
                        }}
                        className="pl-2 pr-1 py-2.5 text-sm font-semibold outline-none cursor-pointer flex-shrink-0"
                        style={{
                          background: "#f3f4f6",
                          color: "#191c23",
                          borderRight: "1px solid rgba(0,0,0,0.1)",
                          minWidth: "105px",
                          appearance: "none",
                          WebkitAppearance: "none",
                          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24'%3E%3Cpath fill='%23727785' d='M7 10l5 5 5-5z'/%3E%3C/svg%3E")`,
                          backgroundRepeat: "no-repeat",
                          backgroundPosition: "right 6px center",
                          paddingRight: "22px",
                        }}
                      >
                        {COUNTRY_CODES.map((c) => (
                          <option key={c.code} value={c.code}>
                            {c.flag} {c.code}
                          </option>
                        ))}
                      </select>
                      {/* Input numérico */}
                      <input
                        type="tel"
                        inputMode="numeric"
                        className="flex-1 px-3 py-2.5 text-sm font-medium outline-none transition-all duration-200"
                        style={{ background: "#ffffff", color: "#191c23", minWidth: 0 }}
                        value={editPhoneProfile}
                        onChange={(e) => handlePhoneChange(e.target.value)}
                        placeholder={(() => {
                          const c = COUNTRY_CODES.find(cc => cc.code === countryCode);
                          return c ? "0".repeat(c.minDigits) : "4141234567";
                        })()}
                        maxLength={11}
                      />
                    </div>
                    {phoneError && (
                      <p className="text-[11px] mt-1.5 text-red-500 font-medium flex items-center gap-1">
                        <span className="material-symbols-outlined" style={{ fontSize: "13px" }}>error</span>
                        {phoneError}
                      </p>
                    )}
                    {!phoneError && editPhoneProfile && (
                      <p className="text-[10px] mt-1.5 font-medium" style={{ color: "#9ca3af" }}>
                        Se guardará como: {countryCode}{editPhoneProfile}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm" style={{ background: "#f9f9ff", color: (user.phone || storeProfile?.business_phone) ? "#191c23" : "#9ca3af", border: "1px solid rgba(0,0,0,0.06)" }}>
                    <span className="material-symbols-outlined" style={{ fontSize: "16px", color: "#9ca3af" }}>phone</span>
                    {(user.phone || storeProfile?.business_phone) ? (
                      <span className="font-medium">
                        {(() => {
                          const displayPhone = user.phone || storeProfile?.business_phone;
                          const parsed = parsePhoneWithCountryCode(displayPhone);
                          const country = COUNTRY_CODES.find(c => c.code === parsed.countryCode);
                          return `${country ? country.flag + " " : ""}${parsed.countryCode} ${parsed.localNumber}`;
                        })()}
                      </span>
                    ) : (
                      <span className="italic">No configurado</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Sección Comercial (Condicional) ── */}
          {(user?.role === "store") && (
            <div className="rounded-2xl p-6" style={{ background: "#ffffff", boxShadow: "0 4px 24px rgba(107,30,150,0.04)" }}>
              <div className="flex items-center gap-2 mb-5">
                <span className="material-symbols-outlined" style={{ fontSize: "20px", color: "#6b1e96" }}>
                  storefront
                </span>
                <h2 className="text-base font-bold" style={{ color: "#191c23" }}>
                  Información Comercial
                </h2>
              </div>

              {loadingProfile ? (
                <div className="animate-pulse space-y-3">
                  <div className="h-4 rounded-lg w-3/4" style={{ background: "#e0e2ec" }}></div>
                  <div className="h-4 rounded-lg" style={{ background: "#e0e2ec" }}></div>
                  <div className="h-4 rounded-lg w-5/6" style={{ background: "#e0e2ec" }}></div>
                </div>
              ) : storeProfile ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* Store Code */}
                  {storeProfile.store_code && (
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: "#727785" }}>
                        Código de Tienda
                      </label>
                      <div className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: "#f3e8ff", border: "1px solid rgba(107,30,150,0.1)" }}>
                        <span className="text-lg font-black tracking-[0.15em]" style={{ color: "#6b1e96" }}>
                          {storeProfile.store_code}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(storeProfile.store_code);
                            toast.success("Código copiado");
                          }}
                          className="px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors"
                          style={{ background: "rgba(107,30,150,0.1)", color: "#6b1e96" }}
                        >
                          📋 Copiar
                        </button>
                        <span className="text-[10px] ml-auto" style={{ color: "#9ca3af" }}>
                          Identificador único de tu tienda
                        </span>
                      </div>
                    </div>
                  )}
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: "#727785" }}>
                      Razón Social
                    </label>
                    <div className="px-4 py-3 rounded-xl text-sm font-medium" style={{ background: "#f9f9ff", color: "#191c23", border: "1px solid rgba(0,0,0,0.06)" }}>
                      {storeProfile.business_name || "N/A"}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: "#727785" }}>
                      RIF
                    </label>
                    <div className="px-4 py-3 rounded-xl text-sm font-medium" style={{ background: "#f9f9ff", color: "#191c23", border: "1px solid rgba(0,0,0,0.06)" }}>
                      {storeProfile.rif || "N/A"}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: "#727785" }}>
                      Teléfono Comercial
                    </label>
                    <div className="px-4 py-3 rounded-xl text-sm font-medium" style={{ background: "#f9f9ff", color: "#191c23", border: "1px solid rgba(0,0,0,0.06)" }}>
                      {storeProfile.business_phone || "N/A"}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: "#727785" }}>
                      Dirección Fiscal
                    </label>
                    <div className="px-4 py-3 rounded-xl text-sm font-medium" style={{ background: "#f9f9ff", color: "#191c23", border: "1px solid rgba(0,0,0,0.06)" }}>
                      {storeProfile.business_address || "N/A"}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm px-4 py-3 rounded-xl text-center" style={{ background: "#f9f9ff", color: "#727785" }}>
                  No se pudieron cargar los datos comerciales.
                </p>
              )}
            </div>
          )}

          {/* ── Botones de Edición Abajo ── */}
          <div className="flex items-center justify-end pt-4 mt-6 border-t border-gray-100">
            {!isEditing ? (
              <button
                onClick={() => {
                  if (user?.role === 'store') {
                    navigate('/store/profile');
                  } else {
                    setIsEditing(true);
                  }
                }}
                className="px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-black/5 transition-colors whitespace-nowrap w-full sm:w-auto flex items-center justify-center gap-2"
                style={{ color: "#6b1e96", border: "1px solid rgba(107,30,150,0.2)" }}
              >
                Editar Perfil
                {user?.role === 'store' && (
                  <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>open_in_new</span>
                )}
              </button>
            ) : (
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto mt-2">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-6 py-2.5 rounded-xl text-sm font-bold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors whitespace-nowrap w-full sm:w-auto"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveProfile}
                  disabled={isUpdating}
                  className="px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-opacity whitespace-nowrap w-full sm:w-auto"
                  style={{ background: "#6b1e96", opacity: isUpdating ? 0.7 : 1 }}
                >
                  {isUpdating ? "Guardando..." : "Guardar Cambios"}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Columna Derecha (1/3) — Tarjetas de Perfil ── */}
        <div className="w-full lg:w-80 flex-shrink-0 space-y-6">
          {/* Profile Card */}
          <div className="rounded-2xl p-6 text-center" style={{ background: "#ffffff", boxShadow: "0 4px 24px rgba(107,30,150,0.06)" }}>
            <div 
              className="relative w-20 h-20 mx-auto mb-4 group cursor-pointer transition-transform hover:scale-105" 
              onClick={() => !isUploadingAvatar && document.getElementById('avatarUpload').click()}
              title="Cambiar foto de perfil"
            >
              {user.avatarUrl ? (
                <img 
                  src={user.avatarUrl} 
                  alt="Avatar" 
                  className="w-full h-full object-cover rounded-full shadow-md border-2 border-transparent group-hover:border-[#6b1e96]/30 transition-colors" 
                  onError={(e) => {
                    e.target.style.display = 'none';
                    if (e.target.nextSibling) {
                      e.target.nextSibling.style.display = 'flex';
                    }
                  }}
                />
              ) : null}
              
              <div 
                className="w-full h-full rounded-full flex items-center justify-center text-2xl font-bold shadow-md border-2 border-transparent group-hover:border-[#6b1e96]/30 transition-colors" 
                style={{ 
                  background: "linear-gradient(135deg, #6b1e96 0%, #531575 100%)", 
                  color: "#c3ff00",
                  display: user.avatarUrl ? "none" : "flex"
                }}
              >
                {user.firstName ? user.firstName.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
              </div>
              <div className={`absolute inset-0 bg-black/40 rounded-full flex items-center justify-center transition-opacity ${isUploadingAvatar ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
                 {isUploadingAvatar ? (
                   <span className="material-symbols-outlined text-white animate-spin">sync</span>
                 ) : (
                   <span className="material-symbols-outlined text-white">photo_camera</span>
                 )}
              </div>
              <input type="file" id="avatarUpload" className="hidden" accept="image/png, image/jpeg, image/webp" onChange={handleAvatarChange} disabled={isUploadingAvatar} />
            </div>
            <h3 className="text-lg font-bold" style={{ color: "#191c23" }}>
              {fullName}
            </h3>
            <span className="inline-block mt-1 px-3 py-1 rounded-full text-xs font-semibold" style={{ background: "#f3e8ff", color: "#6b1e96" }}>
              {user.role === 'buyer' ? 'Usuario' : user.role === 'admin' ? 'Administrador' : user.role === 'owner' ? 'Owner 👑' : (user.role === 'store' || user.role === 'store/owner') ? 'Tienda' : user.role}
            </span>
          </div>

          {/* Security Checkup Card */}
          <div className="rounded-2xl p-5" style={{ background: "#ffffff", boxShadow: "0 4px 24px rgba(107,30,150,0.06)" }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "#f0fdf4" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "22px", color: "#16a34a" }}>
                  verified_user
                </span>
              </div>
              <div>
                <h4 className="text-sm font-bold" style={{ color: "#191c23" }}>Chequeo de Seguridad</h4>
                <p className="text-xs" style={{ color: "#727785" }}>Tu cuenta está protegida</p>
              </div>
            </div>
            <p className="text-xs mb-3" style={{ color: "#727785" }}>
              No encontramos problemas críticos en tu cuenta. Revisa tus ajustes de seguridad periódicamente.
            </p>
            <button
              onClick={handleSecurityCheck}
              className="w-full flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200"
              style={{ background: "#f3e8ff", color: "#6b1e96" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#e9d5ff")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#f3e8ff")}
            >
              Revisar Seguridad
              <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>open_in_new</span>
            </button>
          </div>

          {/* Member Since Card */}
          <div className="rounded-2xl p-5" style={{ background: "#ffffff", boxShadow: "0 4px 24px rgba(107,30,150,0.06)" }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "#f3e8ff" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "22px", color: "#6b1e96" }}>
                  calendar_month
                </span>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#727785" }}>Miembro desde</p>
                <p className="text-sm font-bold" style={{ color: "#191c23" }}>
                  {user.createdAt
                    ? new Date(user.createdAt).toLocaleDateString("es-ES", { month: "long", year: "numeric" })
                    : "—"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
