import { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const { login, loginWithGoogle, user, resetPassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Parse callback url if it exists, otherwise default to home
  const queryParams = new URLSearchParams(location.search);
  const redirectPath = queryParams.get("redirect") || "/";

  // Redirect to target path if user is already logged in
  useEffect(() => {
    if (user) {
      navigate(redirectPath);
    }
  }, [user, navigate, redirectPath]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      await login({ email, password });
      navigate(redirectPath);
    } catch (err) {
      setError(err.message || "Error al iniciar sesión");
    } finally {
      if (!user) setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError(null);
      const { error } = await loginWithGoogle();
      if (error) throw error;
      // Google redirects, so wait
    } catch (err) {
      setError(err.message || "Error conectando con Google");
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email address.");
      return;
    }
    try {
      setLoading(true);
      setError(null);
      await resetPassword(email);
      toast.success("Reset link sent! Please check your inbox.");
      setIsForgotPassword(false);
    } catch (err) {
      setError(err.message || "Failed to send reset link");
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
            Tu Aliado en Insumos Dentales
          </h1>
          <p className="text-xl max-w-lg opacity-90 leading-relaxed">
            Abastece tu clínica con el catálogo más completo de equipos, instrumental y materiales odontológicos al mejor precio.
          </p>
        </div>
        <img
          src="/dental_login_banner.png"
          alt="Consultorio Dental Moderno"
          loading="lazy"
          className="w-full h-full object-cover opacity-80"
        />
      </div>

      {/* Right Column: Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-[420px]">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {isForgotPassword ? "Restablecer Contraseña" : "Iniciar Sesión"}
            </h2>
            <p className="text-gray-500 text-sm">
              {isForgotPassword
                ? "Ingresa tu correo para recibir un enlace de restablecimiento."
                : "Ingresa tus datos para acceder a tu cuenta."}
            </p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-500 border border-red-200 p-3 rounded-md mb-6 text-sm text-center">
              {error}
            </div>
          )}

          {!isForgotPassword && (
            <>
              <button
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-200 rounded-lg text-gray-800 font-medium hover:bg-gray-50 transition-colors mb-6 shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
              >
                <img
                  src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                  alt="Google"
                  loading="lazy"
                  className="w-5 h-5"
                />
                <span>Iniciar sesión con Google</span>
              </button>

              <div className="flex items-center text-center mb-6 text-gray-400">
                <div className="flex-1 border-b border-gray-200" />
                <span className="px-3 text-xs uppercase tracking-wider">O</span>
                <div className="flex-1 border-b border-gray-200" />
              </div>
            </>
          )}

          {isForgotPassword ? (
            <form onSubmit={handleForgotPassword} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  required
                  disabled={loading}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-gray-900"
                  placeholder="ejemplo@correo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-primary-600 text-white font-semibold rounded-lg shadow-md hover:bg-primary-700 hover:-translate-y-[1px] hover:shadow-lg transition-all active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? "Enviando..." : "Enviar Enlace de Recuperación"}
              </button>

              <div className="text-center mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotPassword(false);
                    setError(null);
                  }}
                  className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Volver al Inicio de Sesión
                </button>
              </div>
            </form>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    required
                    disabled={loading}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-gray-900"
                    placeholder="ejemplo@correo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Contraseña
                  </label>
                  <input
                    type="password"
                    required
                    disabled={loading}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-gray-900"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                <div className="flex items-center justify-between mt-2 mb-8">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="remember"
                      className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                    />
                    <label
                      htmlFor="remember"
                      className="text-sm text-gray-500 cursor-pointer"
                    >
                      Recordarme
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotPassword(true);
                      setError(null);
                    }}
                    className="text-sm font-medium text-primary-600 hover:underline"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 bg-primary-600 text-white font-semibold rounded-lg shadow-md hover:bg-primary-700 hover:-translate-y-[1px] hover:shadow-lg transition-all active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {loading ? "Iniciando Sesión..." : "Iniciar Sesión"}
                </button>
              </form>

              <p className="text-center mt-8 text-gray-500 text-sm">
                ¿No tienes una cuenta?{" "}
                <Link
                  to={`/register${redirectPath !== "/" ? `?redirect=${redirectPath}` : ""}`}
                  className="font-semibold text-primary-600 hover:underline ml-1"
                >
                  Regístrate aquí
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
