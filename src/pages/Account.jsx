import { useAuth } from "../context/AuthContext";
import { useState, useEffect } from "react";
import { getStoreProfile } from "../services/api";

export default function Account() {
  const { user } = useAuth();
  const [storeProfile, setStoreProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  useEffect(() => {
    if (user?.role === "store" || user?.role === "owner") {
      fetchStoreProfile();
    }
  }, [user]);

  if (!user) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6b1e96]"></div>
      </div>
    );
  }

  const fetchStoreProfile = async () => {
    try {
      setLoadingProfile(true);
      const res = await getStoreProfile();
      setStoreProfile(res.data?.data);
    } catch (err) {
      console.error("Error al cargar perfil de tienda:", err.message);
    } finally {
      setLoadingProfile(false);
    }
  };

  const fullName = user.firstName
    ? `${user.firstName} ${user.lastName || ""}`
    : "No configurado";

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
                <div className="px-4 py-3 rounded-xl text-sm font-medium" style={{ background: "#f9f9ff", color: "#191c23", border: "1px solid rgba(0,0,0,0.06)" }}>
                  {fullName}
                </div>
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
                <div className="px-4 py-3 rounded-xl text-sm font-medium capitalize flex items-center gap-2" style={{ background: "#f9f9ff", color: "#6b1e96", border: "1px solid rgba(0,0,0,0.06)" }}>
                  <span className="w-2 h-2 rounded-full" style={{ background: "#6b1e96" }}></span>
                  {user.role === 'buyer' ? 'Usuario' : user.role === 'admin' ? 'Administrador' : (user.role === 'store' || user.role === 'owner' || user.role === 'store/owner') ? 'Tienda' : user.role}
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
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm" style={{ background: "#f9f9ff", color: "#9ca3af", border: "1px solid rgba(0,0,0,0.06)" }}>
                  <span className="material-symbols-outlined" style={{ fontSize: "16px", color: "#9ca3af" }}>phone</span>
                  <span className="italic">No configurado</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Sección Comercial (Condicional) ── */}
          {(user?.role === "store" || user?.role === "owner") && (
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
        </div>

        {/* ── Columna Derecha (1/3) — Tarjetas de Perfil ── */}
        <div className="w-full lg:w-80 flex-shrink-0 space-y-6">
          {/* Profile Card */}
          <div className="rounded-2xl p-6 text-center" style={{ background: "#ffffff", boxShadow: "0 4px 24px rgba(107,30,150,0.06)" }}>
            <div className="w-20 h-20 rounded-full mx-auto flex items-center justify-center text-2xl font-bold mb-4" style={{ background: "linear-gradient(135deg, #6b1e96 0%, #531575 100%)", color: "#c3ff00" }}>
              {user.firstName ? user.firstName.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
            </div>
            <h3 className="text-lg font-bold" style={{ color: "#191c23" }}>
              {fullName}
            </h3>
            <span className="inline-block mt-1 px-3 py-1 rounded-full text-xs font-semibold capitalize" style={{ background: "#f3e8ff", color: "#6b1e96" }}>
              {user.role === 'buyer' ? 'Usuario' : user.role === 'admin' ? 'Administrador' : (user.role === 'store' || user.role === 'owner' || user.role === 'store/owner') ? 'Tienda' : user.role}
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
