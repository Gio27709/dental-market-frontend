import { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "buyer",
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
      await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role, // Saved in metadata, trigger handles sync
      });
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
        <div className="absolute inset-0 z-10 bg-gradient-to-br from-black/70 to-black/30 p-16 flex flex-col justify-center text-white">
          <h1 className="text-5xl font-bold mb-6 leading-tight">
            Join the Future
          </h1>
          <p className="text-xl max-w-lg opacity-90 leading-relaxed">
            Create an account to unlock exclusive deals and premium products.
          </p>
        </div>
        <img
          src="https://images.unsplash.com/photo-1497366216548-37526070297c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80"
          alt="Modern Office"
          loading="lazy"
          className="w-full h-full object-cover opacity-80"
        />
      </div>

      {/* Right Column: Form */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-8 bg-white overflow-y-auto min-h-screen">
        <div className="w-full max-w-[550px] py-12">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Create an account
            </h2>
            <p className="text-gray-500">
              Join us and streamline your platform.
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
            <span>Register with Google</span>
          </button>

          <div className="flex items-center text-center mb-6 text-gray-400">
            <div className="flex-1 border-b border-gray-200" />
            <span className="px-3 text-sm uppercase tracking-wider">OR</span>
            <div className="flex-1 border-b border-gray-200" />
          </div>

          {error && (
            <div className="bg-red-50 text-red-500 border border-red-200 p-3 rounded-md mb-6 text-sm text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
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
                Rol dentro del Mercado
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                disabled={loading}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-gray-900"
              >
                <option value="buyer">Usuario normal (Cliente)</option>
                <option value="professional">Profesional Dental</option>
                <option value="store">Tienda Odontológica</option>
              </select>
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
              {loading ? "Registrando..." : "Register"}
            </button>
          </form>

          <p className="text-center mt-8 text-gray-500 text-sm">
            Ya tienes una cuenta?{" "}
            <Link
              to={`/login${redirectPath !== "/" ? `?redirect=${redirectPath}` : ""}`}
              className="font-semibold text-primary-600 hover:underline ml-1"
            >
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
