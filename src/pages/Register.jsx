import { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "user",
    specialty: "Odontología General",
  });

  const [passwordValidations, setPasswordValidations] = useState({
    length: false,
    upper: false,
    lower: false,
    number: false,
    special: false,
  });

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPasswordRequirements, setShowPasswordRequirements] =
    useState(false);
  const { register, loginWithGoogle, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Parse redirect target from URL query params (e.g. /register?redirect=/checkout)
  const queryParams = new URLSearchParams(location.search);
  const redirectPath = queryParams.get("redirect") || "/";

  // If user is already authenticated
  useEffect(() => {
    if (user) {
      navigate(redirectPath);
    }
  }, [user, navigate, redirectPath]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === "password") {
      validatePassword(value);
      setShowPasswordRequirements(true);
    }
  };

  const validatePassword = (pass) => {
    setPasswordValidations({
      length: pass.length >= 8 && pass.length <= 16,
      upper: /[A-Z]/.test(pass),
      lower: /[a-z]/.test(pass),
      number: /[0-9]/.test(pass),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(pass),
    });
  };

  const isPasswordValid = Object.values(passwordValidations).every(Boolean);

  const handleGoogleRegister = async () => {
    try {
      setLoading(true);
      setError(null);
      const { error } = await loginWithGoogle();
      if (error) throw error;
      // Google Auth redirects the browser
    } catch (err) {
      setError(err.message || "Error al conectar con Google");
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      return setError("Las contraseñas no coinciden");
    }
    if (!isPasswordValid) {
      return setError(
        "Por favor cumple con todos los requisitos de la contraseña",
      );
    }
    try {
      setLoading(true);
      setError(null);
      
      const registerData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
      };

      if (formData.role === "professional") {
        registerData.specialty = formData.specialty;
      }

      await register(registerData);
      navigate(redirectPath);
    } catch (err) {
      setError(err.message || "Error al registrar usuario");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white font-sans">
      {/* Left Column: Image/Branding */}
      <div className="hidden lg:flex w-1/2 relative bg-gray-900 overflow-hidden items-center justify-center">
        <div className="absolute inset-0 z-10 bg-gradient-to-br from-[#6b1e96]/75 via-[#531575]/85 to-[#0e0214]/95 p-16 flex flex-col justify-center text-white">
          <h1 className="text-5xl font-bold mb-6 leading-tight">
            Únete a la Red Dental más Grande
          </h1>
          <p className="text-xl max-w-lg opacity-90 leading-relaxed">
            Regístrate hoy y obtén acceso instantáneo a precios exclusivos de distribuidor, envíos rápidos garantizados y soporte especializado.
          </p>
        </div>
        <img
          src="/dental_register_banner.png"
          alt="Profesional Dental e Insumos"
          loading="lazy"
          className="w-full h-full object-cover opacity-80"
        />
      </div>

      {/* Right Column: Form */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-8 bg-white overflow-y-auto min-h-screen">
        <div className="w-full max-w-[550px] py-12">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Crear una cuenta
            </h2>
            <p className="text-gray-500 text-sm">
              Únete a Forcepx y optimiza el abastecimiento de tu clínica.
            </p>
          </div>

          <button
            onClick={handleGoogleRegister}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-200 rounded-lg text-gray-800 font-medium hover:bg-gray-50 transition-colors mb-6 shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
          >
            <img
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
              alt="Google"
              loading="lazy"
              className="w-5 h-5"
            />
            <span>Registrarse con Google</span>
          </button>

          <div className="flex items-center text-center mb-6 text-gray-400">
            <div className="flex-1 border-b border-gray-200" />
            <span className="px-3 text-xs uppercase tracking-wider">O</span>
            <div className="flex-1 border-b border-gray-200" />
          </div>

          {error && (
            <div className="bg-red-50 text-red-500 border border-red-200 p-3 rounded-md mb-6 text-sm text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Account Type Selector */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                Tipo de Cuenta
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Regular Buyer */}
                <div
                  onClick={() => setFormData(prev => ({ ...prev, role: "user" }))}
                  className={`cursor-pointer p-4 rounded-xl border-2 transition-all duration-300 flex flex-col items-center text-center gap-2 group relative overflow-hidden ${
                    formData.role === "user"
                      ? "border-primary-600 bg-primary-50/30 shadow-sm ring-1 ring-primary-600/30"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50/50"
                  }`}
                >
                  {formData.role === "user" && (
                    <div className="absolute top-2 right-2 w-4 h-4 bg-primary-600 rounded-full flex items-center justify-center text-white text-[10px] font-bold">
                      ✓
                    </div>
                  )}
                  <div className={`p-2 rounded-lg transition-colors ${formData.role === "user" ? "bg-primary-100 text-primary-700" : "bg-gray-100 text-gray-500 group-hover:bg-gray-200"}`}>
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                  </div>
                  <span className="font-semibold text-sm text-gray-900">Comprador</span>
                  <span className="text-xs text-gray-500">Compra de insumos</span>
                </div>

                {/* Professional Dentist */}
                <div
                  onClick={() => setFormData(prev => ({ ...prev, role: "professional" }))}
                  className={`cursor-pointer p-4 rounded-xl border-2 transition-all duration-300 flex flex-col items-center text-center gap-2 group relative overflow-hidden ${
                    formData.role === "professional"
                      ? "border-primary-600 bg-primary-50/30 shadow-sm ring-1 ring-primary-600/30"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50/50"
                  }`}
                >
                  {formData.role === "professional" && (
                    <div className="absolute top-2 right-2 w-4 h-4 bg-primary-600 rounded-full flex items-center justify-center text-white text-[10px] font-bold">
                      ✓
                    </div>
                  )}
                  <div className={`p-2 rounded-lg transition-colors ${formData.role === "professional" ? "bg-primary-100 text-primary-700" : "bg-gray-100 text-gray-500 group-hover:bg-gray-200"}`}>
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <span className="font-semibold text-sm text-gray-900">Odontólogo</span>
                  <span className="text-xs text-gray-500">Precios de distribuidor</span>
                </div>

                {/* Dental Student */}
                <div
                  onClick={() => setFormData(prev => ({ ...prev, role: "student" }))}
                  className={`cursor-pointer p-4 rounded-xl border-2 transition-all duration-300 flex flex-col items-center text-center gap-2 group relative overflow-hidden ${
                    formData.role === "student"
                      ? "border-primary-600 bg-primary-50/30 shadow-sm ring-1 ring-primary-600/30"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50/50"
                  }`}
                >
                  {formData.role === "student" && (
                    <div className="absolute top-2 right-2 w-4 h-4 bg-primary-600 rounded-full flex items-center justify-center text-white text-[10px] font-bold">
                      ✓
                    </div>
                  )}
                  <div className={`p-2 rounded-lg transition-colors ${formData.role === "student" ? "bg-primary-100 text-primary-700" : "bg-gray-100 text-gray-500 group-hover:bg-gray-200"}`}>
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                    </svg>
                  </div>
                  <span className="font-semibold text-sm text-gray-900">Estudiante</span>
                  <span className="text-xs text-gray-500">De odontología</span>
                </div>
              </div>
            </div>

            {/* Campos condicionales para el Odontólogo */}
            {formData.role === "professional" && (
              <div className="space-y-4 p-4 bg-gray-50 border border-gray-100 rounded-xl transition-all duration-300">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Especialidad Dental
                  </label>
                  <select
                    name="specialty"
                    value={formData.specialty}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-gray-900"
                  >
                    <option value="Odontología General">Odontología General</option>
                    <option value="Ortodoncia">Ortodoncia</option>
                    <option value="Endodoncia">Endodoncia</option>
                    <option value="Periodoncia">Periodoncia</option>
                    <option value="Odontopediatría">Odontopediatría</option>
                    <option value="Cirugía Maxilofacial">Cirugía Maxilofacial</option>
                    <option value="Rehabilitación Oral">Rehabilitación Oral</option>
                  </select>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Nombre completo
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-gray-900"
                  placeholder="John Doe"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Correo Electrónico
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={loading}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-gray-900"
                placeholder="john.doe@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Contraseña
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                onFocus={() => setShowPasswordRequirements(true)}
                required
                disabled={loading}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-gray-900"
                placeholder="Contraseña segura"
              />
              {showPasswordRequirements && (
                <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-100 grid grid-cols-2 gap-2 text-xs text-gray-500">
                  <span
                    className={`flex items-center gap-1 transition-colors ${passwordValidations.length ? "text-green-600 font-medium" : ""}`}
                  >
                    {passwordValidations.length && "✓"} 8-16 Caracteres
                  </span>
                  <span
                    className={`flex items-center gap-1 transition-colors ${passwordValidations.upper ? "text-green-600 font-medium" : ""}`}
                  >
                    {passwordValidations.upper && "✓"} Mayúscula
                  </span>
                  <span
                    className={`flex items-center gap-1 transition-colors ${passwordValidations.lower ? "text-green-600 font-medium" : ""}`}
                  >
                    {passwordValidations.lower && "✓"} Minúscula
                  </span>
                  <span
                    className={`flex items-center gap-1 transition-colors ${passwordValidations.number ? "text-green-600 font-medium" : ""}`}
                  >
                    {passwordValidations.number && "✓"} Número
                  </span>
                  <span
                    className={`flex items-center gap-1 transition-colors ${passwordValidations.special ? "text-green-600 font-medium" : ""}`}
                  >
                    {passwordValidations.special && "✓"} Caracter especial
                  </span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Confirmar Contraseña
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                disabled={loading}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-gray-900"
                placeholder="Confirmar contraseña"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !isPasswordValid}
              className="w-full py-3 px-4 bg-primary-600 text-white font-semibold rounded-lg shadow-md hover:bg-primary-700 hover:-translate-y-[1px] hover:shadow-lg transition-all active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none disabled:bg-gray-400 mt-6"
            >
              {loading ? "Creando Cuenta..." : "Registrarse"}
            </button>
          </form>

          <p className="text-center mt-8 text-gray-500 text-sm">
            ¿Ya tienes una cuenta?{" "}
            <Link
              to={`/login${redirectPath !== "/" ? `?redirect=${redirectPath}` : ""}`}
              className="font-semibold text-primary-600 hover:underline ml-1"
            >
              Iniciar sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
