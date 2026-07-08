import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import { 
  applyForStoreAPI, 
  getMyStoreApplicationAPI,
  applyForRiderAPI,
  getMyRiderApplicationAPI
} from "../../services/api";

export default function AffiliateLanding() {
  const navigate = useNavigate();
  const { user, refreshSession } = useAuth();

  const [type, setType] = useState("store"); // "store" | "rider"

  const [storeForm, setStoreForm] = useState({
    business_name: "",
    rif: "",
    business_phone: "",
    business_address: "",
  });

  const [riderForm, setRiderForm] = useState({
    full_name: "",
    cedula: "",
    phone: "",
    city: "",
    vehicle_type: "moto",
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [applicationStatus, setApplicationStatus] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);

  const [riderCedulaPrefix, setRiderCedulaPrefix] = useState("V");
  const [riderCedulaNumber, setRiderCedulaNumber] = useState("");

  // Sync decoupled cedula inputs into riderForm state
  useEffect(() => {
    setRiderForm((prev) => ({
      ...prev,
      cedula: riderCedulaNumber ? `${riderCedulaPrefix}-${riderCedulaNumber}` : ""
    }));
    if (errors.cedula) setErrors((prev) => ({ ...prev, cedula: null }));
  }, [riderCedulaPrefix, riderCedulaNumber]);

  useEffect(() => {
    if (user) {
      checkApplicationStatus();
    } else {
      setInitialLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, type]);

  const checkApplicationStatus = async () => {
    setInitialLoading(true);
    setApplicationStatus(null);
    try {
      if (type === "store") {
        const res = await getMyStoreApplicationAPI();
        if (res.data?.data) {
          const status = res.data.data.status;
          setApplicationStatus(status);
          // Si la solicitud está aprobada pero el rol local todavía no es tienda, intentar auto-refrescar
          if (status === "approved" && user && user.role !== "store") {
            const refreshRes = await refreshSession();
            if (refreshRes?.success) {
              toast.success("¡Tu cuenta de tienda ha sido activada!");
              navigate("/store");
            }
          }
        }
      } else {
        const res = await getMyRiderApplicationAPI();
        if (res.data?.data) {
          const status = res.data.data.status;
          setApplicationStatus(status);
          // Si la solicitud está aprobada pero el rol local todavía no es repartidor, intentar auto-refrescar
          if (status === "approved" && user && user.role !== "delivery") {
            const refreshRes = await refreshSession();
            if (refreshRes?.success) {
              toast.success("¡Tu cuenta de repartidor ha sido activada!");
              navigate("/delivery");
            }
          }
        }
      }
    } catch (err) {
      console.log("No pending application", err.message);
    } finally {
      setInitialLoading(false);
    }
  };

  const validate = () => {
    const e = {};
    if (type === "store") {
      if (!storeForm.business_name || storeForm.business_name.length < 3)
        e.business_name = "Nombre de empresa requerido (mín. 3 caracteres)";
      if (!storeForm.rif || !/^[JVGjvg]-\d{8}-\d$/.test(storeForm.rif))
        e.rif = "RIF inválido. Formato: J-12345678-9";
      if (!storeForm.business_phone || !/^(0[0-9]{3})-?\d{7}$/.test(storeForm.business_phone))
        e.business_phone = "Teléfono inválido. Formato: 0412-1234567";
      if (!storeForm.business_address || storeForm.business_address.length < 10)
        e.business_address = "Dirección requerida (mín. 10 caracteres)";
    } else {
      if (!riderForm.full_name || riderForm.full_name.length < 3)
        e.full_name = "Nombre completo requerido (mín. 3 caracteres)";
      if (!riderForm.cedula || !/^[VEJGPvejgp]-\d{6,10}$/.test(riderForm.cedula))
        e.cedula = "Cédula inválida (debe contener el prefijo y 6-10 dígitos)";
      if (!riderForm.phone || !/^(0[0-9]{3})-?\d{7}$/.test(riderForm.phone))
        e.phone = "Teléfono inválido. Formato: 0412-1234567";
      if (!riderForm.city || riderForm.city.length < 3)
        e.city = "Ciudad requerida";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (type === "store") {
      setStoreForm((prev) => ({ ...prev, [name]: value }));
    } else {
      setRiderForm((prev) => ({ ...prev, [name]: value }));
    }
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      toast.error(`Debes iniciar sesión para afiliarte como ${type === 'store' ? 'tienda' : 'repartidor'}.`);
      navigate("/login?redirect=/afiliate");
      return;
    }

    if (!validate()) return;

    setLoading(true);
    try {
      if (type === "store") {
        await applyForStoreAPI(storeForm);
      } else {
        await applyForRiderAPI(riderForm);
      }
      toast.success("¡Solicitud enviada con éxito!");
      setApplicationStatus("pending");
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || "Error al enviar la solicitud");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f9f9ff]">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#163152] via-[#1a3a5c] to-[#531575]">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#c3ff00] rounded-full blur-[120px]" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#6b1e96] rounded-full blur-[100px]" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left: Text */}
            <div className="text-white space-y-6">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 text-sm border border-white/20">
                <span className="w-2 h-2 bg-[#c3ff00] rounded-full animate-pulse" />
                Forcepx Network
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight">
                Únete a la red de <span className="text-[#c3ff00]">Excelencia Dental.</span>
              </h1>

              <p className="text-lg md:text-xl text-gray-300 max-w-lg leading-relaxed">
                Ya sea como Proveedor Certificado o Repartidor Especializado, forma parte de la plataforma líder en logística odontológica.
              </p>

              <div className="flex items-center gap-3 text-sm text-gray-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-5 h-5 text-[#c3ff00]"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
                Oportunidades verificadas y seguras
              </div>
            </div>

            {/* Right: Registration Form */}
            <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl p-6 md:p-8 border border-gray-100 relative">
              
              {/* Type Toggle */}
              <div className="flex bg-gray-100 p-1 rounded-xl mb-6">
                <button
                  onClick={() => setType("store")}
                  className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${
                    type === "store" ? "bg-white text-[#6b1e96] shadow-sm" : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Postularse como Tienda
                </button>
                <button
                  onClick={() => setType("rider")}
                  className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${
                    type === "rider" ? "bg-white text-[#6b1e96] shadow-sm" : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Postularse como Repartidor
                </button>
              </div>

              {initialLoading ? (
                <div className="py-20 flex justify-center">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#6b1e96]"></div>
                </div>
              ) : !user ? (
                <div className="text-center py-6">
                  <div className="w-16 h-16 bg-[#6b1e96]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-8 h-8 text-[#6b1e96]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-3">Identidad Requerida</h2>
                  <p className="text-gray-500 mb-8 max-w-sm mx-auto">
                    Para aplicar en Forcepx, necesitas iniciar sesión o crear una cuenta.
                  </p>
                  <div className="flex flex-col sm:flex-row justify-center gap-3">
                    <button onClick={() => navigate("/login?redirect=/afiliate")} className="bg-[#6b1e96] hover:bg-[#531575] text-white px-6 py-2.5 rounded-xl font-medium transition-colors shadow-sm">
                      Iniciar Sesión
                    </button>
                    <button onClick={() => navigate("/register?redirect=/afiliate")} className="bg-white border-2 border-gray-200 text-gray-700 hover:border-[#6b1e96] hover:text-[#6b1e96] px-6 py-2.5 rounded-xl font-medium transition-colors">
                      Crear Cuenta
                    </button>
                  </div>
                </div>
              ) : (user?.role === "admin" || user?.role === "owner") ? (
                <div className="text-center py-6">
                  <div className="w-16 h-16 bg-[#6b1e96]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="material-symbols-outlined text-[32px] text-[#6b1e96]">admin_panel_settings</span>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-3">Acceso de Administrador</h2>
                  <p className="text-gray-500 mb-8 max-w-sm mx-auto">
                    Como administrador, puedes ver las postulaciones desde el panel.
                  </p>
                  <button onClick={() => navigate("/admin/store-applications")} className="bg-[#6b1e96] hover:bg-[#531575] text-white px-6 py-2.5 rounded-xl font-medium transition-colors shadow-sm">
                    Ir al Panel Admin
                  </button>
                </div>
              ) : (type === "store" && user?.role === "store") || (type === "rider" && user?.role === "delivery") ? (
                <div className="text-center py-6">
                  <div className="w-16 h-16 bg-[#6b1e96]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="material-symbols-outlined text-[32px] text-[#6b1e96]">{type === "store" ? "storefront" : "two_wheeler"}</span>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-3">¡Felicidades!</h2>
                  <p className="text-gray-500 mb-8 max-w-sm mx-auto">
                    Ya eres {type === "store" ? "una Tienda Certificada" : "un Repartidor"} en Forcepx.
                  </p>
                  <button onClick={() => navigate(type === "store" ? "/store" : "/delivery")} className="bg-[#6b1e96] hover:bg-[#531575] text-white px-6 py-2.5 rounded-xl font-medium transition-colors shadow-sm">
                    Ir a tu Panel
                  </button>
                </div>
              ) : (user?.role === "store" && type === "rider") || (user?.role === "delivery" && type === "store") ? (
                <div className="text-center py-6 animate-in fade-in duration-300">
                  <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="material-symbols-outlined text-[32px] text-amber-600">warning</span>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-3">Rol Incompatible</h2>
                  <p className="text-gray-500 mb-6 max-w-sm mx-auto text-sm leading-relaxed">
                    {user?.role === "store" 
                      ? "Ya estás registrado como Tienda. Tu cuenta actual no permite postularte como repartidor."
                      : "Ya estás registrado como Repartidor. Tu cuenta actual no permite registrar una tienda."}
                  </p>
                  <p className="text-gray-400 text-xs mb-6 max-w-xs mx-auto">
                    Si deseas postularte con el otro rol, debes cerrar sesión y registrar una cuenta nueva con un correo electrónico diferente.
                  </p>
                  <button onClick={() => navigate(user?.role === "store" ? "/store" : "/delivery")} className="bg-[#6b1e96] hover:bg-[#531575] text-white px-6 py-2.5 rounded-xl font-medium transition-colors shadow-sm text-sm">
                    Ir a mi Panel de {user?.role === "store" ? "Tienda" : "Repartidor"}
                  </button>
                </div>
              ) : applicationStatus === "rejected" ? (
                <div className="text-center py-6">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Solicitud Rechazada</h2>
                  <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                    Tu solicitud de afiliación ha sido revisada y no fue aprobada.
                  </p>
                  <div className="flex flex-col sm:flex-row justify-center gap-3">
                    <button 
                      onClick={() => setApplicationStatus(null)} 
                      className="bg-[#6b1e96] hover:bg-[#531575] text-white px-6 py-2.5 rounded-xl font-medium transition-colors shadow-sm flex items-center justify-center gap-2"
                    >
                      Volver a Intentar
                    </button>
                  </div>
                </div>
              ) : applicationStatus === "approved" ? (
                <div className="text-center py-6 animate-in fade-in duration-300">
                  <div className="w-16 h-16 bg-[#c3ff00]/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-8 h-8 text-[#6b1e96]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Solicitud Aprobada!</h2>
                  <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                    Tu solicitud ha sido aprobada con éxito. Haz clic en el botón de abajo para activar tu cuenta e ingresar a tu panel de control.
                  </p>
                  <button 
                    onClick={async () => {
                      setLoading(true);
                      const res = await refreshSession();
                      setLoading(false);
                      if (res?.success) {
                        toast.success("¡Cuenta activada con éxito!");
                        navigate(type === "store" ? "/store" : "/delivery");
                      } else {
                        toast.error("Error al activar la sesión. Intenta cerrar sesión e ingresar de nuevo.");
                      }
                    }} 
                    disabled={loading}
                    className="bg-[#6b1e96] hover:bg-[#531575] text-white px-6 py-2.5 rounded-xl font-medium transition-colors shadow-sm disabled:opacity-50"
                  >
                    {loading ? "Activando..." : "Activar mi Panel"}
                  </button>
                </div>
              ) : applicationStatus === "pending" ? (
                <div className="text-center py-6">
                  <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-8 h-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Solicitud en Proceso</h2>
                  <p className="text-gray-500 max-w-sm mx-auto">
                    Tu solicitud ha sido recibida y está siendo revisada por un administrador. Te notificaremos pronto.
                  </p>
                </div>
              ) : (
                <>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {type === "store" ? "Registro de Tienda" : "Registro de Repartidor"}
                  </h2>
                  <p className="text-gray-500 text-sm mb-5">
                    {type === "store" 
                      ? "Complete los datos de su institución para acceder a beneficios preferenciales."
                      : "Completa tus datos para formar parte de la red de logística más confiable."}
                  </p>

                  <form onSubmit={handleSubmit} className="space-y-4 animate-in fade-in duration-300">
                    
                    {type === "store" ? (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre de la Empresa</label>
                          <input type="text" name="business_name" value={storeForm.business_name} onChange={handleChange} placeholder="Ej: Clínica Dental Sonrisas C.A." className={`w-full px-4 py-3 rounded-xl border ${errors.business_name ? "border-red-400 bg-red-50" : "border-gray-200 bg-gray-50"} focus:outline-none focus:ring-2 focus:ring-[#6b1e96]/30 focus:border-[#6b1e96] text-gray-800`} />
                          {errors.business_name && <p className="text-red-500 text-xs mt-1">{errors.business_name}</p>}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">RIF</label>
                          <input type="text" name="rif" value={storeForm.rif} onChange={handleChange} placeholder="J-12345678-9" className={`w-full px-4 py-3 rounded-xl border ${errors.rif ? "border-red-400 bg-red-50" : "border-gray-200 bg-gray-50"} focus:outline-none focus:ring-2 focus:ring-[#6b1e96]/30 focus:border-[#6b1e96] text-gray-800`} />
                          {errors.rif && <p className="text-red-500 text-xs mt-1">{errors.rif}</p>}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Teléfono</label>
                            <input type="text" name="business_phone" value={storeForm.business_phone} onChange={handleChange} placeholder="0412-1234567" className={`w-full px-4 py-3 rounded-xl border ${errors.business_phone ? "border-red-400 bg-red-50" : "border-gray-200 bg-gray-50"} focus:outline-none focus:ring-2 focus:ring-[#6b1e96]/30 focus:border-[#6b1e96] text-gray-800`} />
                            {errors.business_phone && <p className="text-red-500 text-xs mt-1">{errors.business_phone}</p>}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Dirección Fiscal</label>
                            <input type="text" name="business_address" value={storeForm.business_address} onChange={handleChange} placeholder="Av. Principal, Caracas" className={`w-full px-4 py-3 rounded-xl border ${errors.business_address ? "border-red-400 bg-red-50" : "border-gray-200 bg-gray-50"} focus:outline-none focus:ring-2 focus:ring-[#6b1e96]/30 focus:border-[#6b1e96] text-gray-800`} />
                            {errors.business_address && <p className="text-red-500 text-xs mt-1">{errors.business_address}</p>}
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre Completo</label>
                          <input type="text" name="full_name" value={riderForm.full_name} onChange={handleChange} placeholder="Ej: Juan Pérez" className={`w-full px-4 py-3 rounded-xl border ${errors.full_name ? "border-red-400 bg-red-50" : "border-gray-200 bg-gray-50"} focus:outline-none focus:ring-2 focus:ring-[#6b1e96]/30 focus:border-[#6b1e96] text-gray-800`} />
                          {errors.full_name && <p className="text-red-500 text-xs mt-1">{errors.full_name}</p>}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Cédula</label>
                            <div className={`flex border rounded-xl overflow-hidden ${errors.cedula ? "border-red-400 bg-red-50" : "border-gray-200 bg-gray-50"} focus-within:ring-2 focus-within:ring-[#6b1e96]/30 focus-within:border-[#6b1e96]`}>
                              <select
                                value={riderCedulaPrefix}
                                onChange={(e) => setRiderCedulaPrefix(e.target.value)}
                                className="px-3 py-3 border-r border-gray-200 bg-gray-100 font-bold text-gray-700 text-sm focus:outline-none cursor-pointer"
                              >
                                <option value="V">V</option>
                                <option value="E">E</option>
                                <option value="J">J</option>
                                <option value="G">G</option>
                                <option value="P">P</option>
                              </select>
                              <input
                                type="text"
                                value={riderCedulaNumber}
                                onChange={(e) => setRiderCedulaNumber(e.target.value.replace(/\D/g, ""))}
                                placeholder="12345678"
                                className="w-full px-4 py-3 bg-transparent text-gray-800 focus:outline-none text-sm"
                              />
                            </div>
                            {errors.cedula && <p className="text-red-500 text-xs mt-1">{errors.cedula}</p>}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Teléfono</label>
                            <input type="text" name="phone" value={riderForm.phone} onChange={handleChange} placeholder="0412-1234567" className={`w-full px-4 py-3 rounded-xl border ${errors.phone ? "border-red-400 bg-red-50" : "border-gray-200 bg-gray-50"} focus:outline-none focus:ring-2 focus:ring-[#6b1e96]/30 focus:border-[#6b1e96] text-gray-800`} />
                            {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Ciudad de Operación</label>
                            <input type="text" name="city" value={riderForm.city} onChange={handleChange} placeholder="Ej: Caracas" className={`w-full px-4 py-3 rounded-xl border ${errors.city ? "border-red-400 bg-red-50" : "border-gray-200 bg-gray-50"} focus:outline-none focus:ring-2 focus:ring-[#6b1e96]/30 focus:border-[#6b1e96] text-gray-800`} />
                            {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Tipo de Vehículo</label>
                            <select name="vehicle_type" value={riderForm.vehicle_type} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#6b1e96]/30 focus:border-[#6b1e96] text-gray-800">
                              <option value="moto">Moto</option>
                              <option value="carro">Carro</option>
                              <option value="bicicleta">Bicicleta</option>
                            </select>
                          </div>
                        </div>
                      </>
                    )}

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-[#c3ff00] hover:bg-[#aee600] text-[#163152] font-bold py-3.5 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed text-sm uppercase tracking-wider mt-4"
                    >
                      {loading ? "Procesando..." : `Enviar solicitud de ${type === 'store' ? 'Tienda' : 'Repartidor'}`}
                    </button>
                    <p className="text-xs text-gray-400 text-center">
                      Al enviar, acepta nuestros términos de curaduría digital y privacidad de datos.
                    </p>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Beneficios de formar parte de <span className="text-[#6b1e96]">Forcepx</span>
            </h2>
          </div>
          {/* ... keeping benefits ... */}
        </div>
      </section>
    </div>
  );
}
