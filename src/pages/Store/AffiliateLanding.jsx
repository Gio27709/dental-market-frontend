import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import { applyForStoreAPI, getMyStoreApplicationAPI } from "../../services/api";

export default function AffiliateLanding() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [form, setForm] = useState({
    business_name: "",
    rif: "",
    business_phone: "",
    business_address: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [applicationStatus, setApplicationStatus] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    if (user) {
      checkApplicationStatus();
    } else {
      setInitialLoading(false);
    }
  }, [user]);

  const checkApplicationStatus = async () => {
    try {
      const res = await getMyStoreApplicationAPI();
      if (res.data?.data) {
        setApplicationStatus(res.data.data.status);
      }
    } catch (err) {
      console.log("No pending application", err.message);
    } finally {
      setInitialLoading(false);
    }
  };

  const validate = () => {
    const e = {};
    if (!form.business_name || form.business_name.length < 3)
      e.business_name = "Nombre de empresa requerido (mín. 3 caracteres)";
    if (!form.rif || !/^[JVGjvg]-\d{8}-\d$/.test(form.rif))
      e.rif = "RIF inválido. Formato: J-12345678-9";
    if (
      !form.business_phone ||
      !/^(0[0-9]{3})-?\d{7}$/.test(form.business_phone)
    )
      e.business_phone = "Teléfono inválido. Formato: 0412-1234567";
    if (!form.business_address || form.business_address.length < 10)
      e.business_address = "Dirección requerida (mín. 10 caracteres)";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      toast.error("Debes iniciar sesión para afiliarte como tienda.");
      navigate("/login?redirect=/afiliate");
      return;
    }

    if (!validate()) return;

    setLoading(true);
    try {
      await applyForStoreAPI(form);
      toast.success("¡Solicitud enviada con éxito!");
      setApplicationStatus("pending");
    } catch (err) {
      toast.error(err.message || "Error al enviar la solicitud");
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f9f9ff]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6b1e96]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f9f9ff]">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#163152] via-[#1a3a5c] to-[#531575]">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#c3ff00] rounded-full blur-[120px]" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#6b1e96] rounded-full blur-[100px]" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left: Text */}
            <div className="text-white space-y-6">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 text-sm border border-white/20">
                <span className="w-2 h-2 bg-[#c3ff00] rounded-full animate-pulse" />
                Proveedor Certificado
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight">
                Precisión para su{" "}
                <span className="text-[#c3ff00]">Clínica Dental.</span>
              </h1>

              <p className="text-lg md:text-xl text-gray-300 max-w-lg leading-relaxed">
                Únase a la red exclusiva de DENTIX y transforme su suministro
                clínico con tecnología de vanguardia y curaduría digital
                experta.
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
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                  />
                </svg>
                Cumplimiento total con normativas internacionales
              </div>
            </div>

            {/* Right: Registration Form */}
            <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl p-8 md:p-10 border border-gray-100">
              {!user ? (
                <div className="text-center py-10">
                  <div className="w-16 h-16 bg-[#6b1e96]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-8 h-8 text-[#6b1e96]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-3">Identidad Requerida</h2>
                  <p className="text-gray-500 mb-8 max-w-sm mx-auto">
                    Para aplicar como proveedor certificado en DENTIX, necesitas iniciar sesión o tener una cuenta creada.
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
              ) : user?.role === "admin" ? (
                <div className="text-center py-10">
                  <div className="w-16 h-16 bg-[#6b1e96]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-8 h-8 text-[#6b1e96]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-3">Acceso de Administrador</h2>
                  <p className="text-gray-500 mb-8 max-w-sm mx-auto">
                    Como administrador de DENTIX, tienes acceso completo y no es necesario que apliques como afiliado.
                  </p>
                  <button onClick={() => navigate("/admin/store-applications")} className="bg-[#6b1e96] hover:bg-[#531575] text-white px-6 py-2.5 rounded-xl font-medium transition-colors shadow-sm">
                    Ver Solicitudes
                  </button>
                </div>
              ) : (user?.role === "store" || user?.role === "owner") ? (
                <div className="text-center py-10">
                  <div className="w-16 h-16 bg-[#6b1e96]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-8 h-8 text-[#6b1e96]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-3">¡Felicidades, eres una Tienda!</h2>
                  <p className="text-gray-500 mb-8 max-w-sm mx-auto">
                    Tu cuenta ya está certificada y autorizada para vender en la plataforma DENTIX.
                  </p>
                  <button onClick={() => navigate("/store")} className="bg-[#6b1e96] hover:bg-[#531575] text-white px-6 py-2.5 rounded-xl font-medium transition-colors shadow-sm">
                    Ir a tu Panel de Tienda
                  </button>
                </div>
              ) : applicationStatus === "rejected" ? (
                <div className="text-center py-10">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Solicitud Rechazada</h2>
                  <p className="text-gray-500 mb-2 max-w-sm mx-auto">
                    Tu solicitud de afiliación ha sido revisada y no fue aprobada en esta oportunidad.
                  </p>
                  <p className="text-gray-400 text-sm mb-8 max-w-sm mx-auto">
                    Esto puede deberse a datos incompletos, documentación inválida u otros motivos. Puedes volver a intentarlo con información actualizada o contactar a soporte para más detalles.
                  </p>
                  <div className="flex flex-col sm:flex-row justify-center gap-3">
                    <button 
                      onClick={() => {
                        setApplicationStatus(null);
                        setForm({ business_name: "", rif: "", business_phone: "", business_address: "" });
                      }} 
                      className="bg-[#6b1e96] hover:bg-[#531575] text-white px-6 py-2.5 rounded-xl font-medium transition-colors shadow-sm flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
                      </svg>
                      Volver a Intentar
                    </button>
                    <a 
                      href="mailto:soporte@dentix.com?subject=Solicitud de Tienda Rechazada" 
                      className="bg-white border-2 border-gray-200 text-gray-700 hover:border-[#6b1e96] hover:text-[#6b1e96] px-6 py-2.5 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                      </svg>
                      Contactar Soporte
                    </a>
                  </div>
                </div>
              ) : applicationStatus === "pending" || applicationStatus === "approved" ? (
                <div className="text-center py-10">
                  <div className="w-16 h-16 bg-[#c3ff00]/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-8 h-8 text-[#6b1e96]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Solicitud en Proceso</h2>
                  <p className="text-gray-500">
                    Tu solicitud ha sido recibida y está siendo revisada por un administrador. 
                    Te notificaremos pronto sobre la aprobación.
                  </p>
                </div>
              ) : (
                <>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Registro de Afiliación
                  </h2>
                  <p className="text-gray-500 text-sm mb-8">
                    Complete los datos de su institución para acceder a beneficios
                    preferenciales.
                  </p>

                  <form onSubmit={handleSubmit} className="space-y-5">
                {/* Nombre de Empresa */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Nombre de la Empresa
                  </label>
                  <input
                    type="text"
                    name="business_name"
                    value={form.business_name}
                    onChange={handleChange}
                    placeholder="Ej: Clínica Dental Sonrisas C.A."
                    className={`w-full px-4 py-3 rounded-xl border ${errors.business_name ? "border-red-400 bg-red-50" : "border-gray-200 bg-gray-50"} focus:outline-none focus:ring-2 focus:ring-[#6b1e96]/30 focus:border-[#6b1e96] transition-all text-gray-800`}
                  />
                  {errors.business_name && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.business_name}
                    </p>
                  )}
                </div>

                {/* RIF */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    RIF
                  </label>
                  <input
                    type="text"
                    name="rif"
                    value={form.rif}
                    onChange={handleChange}
                    placeholder="J-12345678-9"
                    className={`w-full px-4 py-3 rounded-xl border ${errors.rif ? "border-red-400 bg-red-50" : "border-gray-200 bg-gray-50"} focus:outline-none focus:ring-2 focus:ring-[#6b1e96]/30 focus:border-[#6b1e96] transition-all text-gray-800`}
                  />
                  {errors.rif && (
                    <p className="text-red-500 text-xs mt-1">{errors.rif}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Teléfono */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Teléfono
                    </label>
                    <input
                      type="text"
                      name="business_phone"
                      value={form.business_phone}
                      onChange={handleChange}
                      placeholder="0412-1234567"
                      className={`w-full px-4 py-3 rounded-xl border ${errors.business_phone ? "border-red-400 bg-red-50" : "border-gray-200 bg-gray-50"} focus:outline-none focus:ring-2 focus:ring-[#6b1e96]/30 focus:border-[#6b1e96] transition-all text-gray-800`}
                    />
                    {errors.business_phone && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.business_phone}
                      </p>
                    )}
                  </div>

                  {/* Dirección Fiscal */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Dirección Fiscal
                    </label>
                    <input
                      type="text"
                      name="business_address"
                      value={form.business_address}
                      onChange={handleChange}
                      placeholder="Av. Principal, Caracas"
                      className={`w-full px-4 py-3 rounded-xl border ${errors.business_address ? "border-red-400 bg-red-50" : "border-gray-200 bg-gray-50"} focus:outline-none focus:ring-2 focus:ring-[#6b1e96]/30 focus:border-[#6b1e96] transition-all text-gray-800`}
                    />
                    {errors.business_address && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.business_address}
                      </p>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#c3ff00] hover:bg-[#aee600] text-[#163152] font-bold py-3.5 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed text-sm uppercase tracking-wider"
                >
                  {loading ? "Procesando..." : "Enviar solicitud de registro"}
                </button>

                <p className="text-xs text-gray-400 text-center">
                  Al enviar, acepta nuestros términos de curaduría digital y
                  privacidad de datos.
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
              Beneficios de formar parte de{" "}
              <span className="text-[#6b1e96]">DENTIX</span>
            </h2>
            <p className="text-gray-500 max-w-2xl mx-auto text-lg">
              Optimice su práctica con ventajas diseñadas para la excelencia
              clínica.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Benefit 1 */}
            <div className="group p-8 rounded-2xl bg-[#f9f9ff] hover:bg-white hover:shadow-xl transition-all duration-300 border border-transparent hover:border-gray-100">
              <div className="w-14 h-14 bg-[#6b1e96]/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-[#6b1e96] group-hover:text-white transition-all duration-300">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-7 h-7 text-[#6b1e96] group-hover:text-white transition-colors"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">
                Stock de Alta Precisión
              </h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                Acceso inmediato a instrumental de grado quirúrgico y suministros
                especializados con control de calidad riguroso.
              </p>
            </div>

            {/* Benefit 2 */}
            <div className="group p-8 rounded-2xl bg-[#f9f9ff] hover:bg-white hover:shadow-xl transition-all duration-300 border border-transparent hover:border-gray-100">
              <div className="w-14 h-14 bg-[#6b1e96]/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-[#6b1e96] group-hover:text-white transition-all duration-300">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-7 h-7 text-[#6b1e96] group-hover:text-white transition-colors"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">
                Logística Prioritaria
              </h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                Entregas express en menos de 24 horas para casos de emergencia
                clínica y reposiciones críticas.
              </p>
            </div>

            {/* Benefit 3 */}
            <div className="group p-8 rounded-2xl bg-[#f9f9ff] hover:bg-white hover:shadow-xl transition-all duration-300 border border-transparent hover:border-gray-100">
              <div className="w-14 h-14 bg-[#6b1e96]/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-[#6b1e96] group-hover:text-white transition-all duration-300">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-7 h-7 text-[#6b1e96] group-hover:text-white transition-colors"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">
                Tarifas Corporativas
              </h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                Precios de distribuidor directo y líneas de crédito flexibles
                para el crecimiento de su clínica.
              </p>
            </div>

            {/* Benefit 4 */}
            <div className="group p-8 rounded-2xl bg-[#f9f9ff] hover:bg-white hover:shadow-xl transition-all duration-300 border border-transparent hover:border-gray-100">
              <div className="w-14 h-14 bg-[#6b1e96]/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-[#6b1e96] group-hover:text-white transition-all duration-300">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-7 h-7 text-[#6b1e96] group-hover:text-white transition-colors"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a23.54 23.54 0 0 0-2.34 6.782c3.21 1.887 6.768 3.196 10.564 3.82a.75.75 0 0 0 .33-.037c3.79-.624 7.34-1.933 10.548-3.82a23.54 23.54 0 0 0-2.34-6.782M12 3v.75m0 0a2.25 2.25 0 0 1 2.25 2.25v2.25a2.25 2.25 0 0 1-2.25 2.25m0-6.75a2.25 2.25 0 0 0-2.25 2.25v2.25A2.25 2.25 0 0 0 12 10.5"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">
                Educación Continua
              </h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                Acceso exclusivo a webinars y talleres presenciales sobre nuevas
                tecnologías en odontología digital.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-16 bg-[#163152]">
        <div className="max-w-4xl mx-auto text-center px-4">
          <p className="text-gray-400 text-lg leading-relaxed">
            Elevando el estándar de la odontología a través de la curaduría
            digital y la precisión técnica.
          </p>
          <p className="text-gray-500 text-sm mt-6">
            © 2024 DENTIX. Precisión Clínica y Curaduría Digital.
          </p>
        </div>
      </section>
    </div>
  );
}
