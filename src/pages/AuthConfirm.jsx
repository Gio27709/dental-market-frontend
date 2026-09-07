import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { supabase } from "../lib/supabaseClient";

// Destino de los enlaces de los correos de Supabase Auth (recuperar contraseña, confirmar
// cuenta, cambiar correo). Las plantillas (deploy/supabase-email-templates/) enlazan a
// https://forcepx.com/auth/confirm?token_hash=…&type=… en vez de a *.supabase.co: así el
// correo enlaza al mismo dominio que lo envía y Gmail deja de tratarlo como suplantación.
// Aquí se canjea el token_hash por una sesión y se sigue al destino que toque.

const DESTINO = {
  recovery: { path: "/update-password", msg: "Identidad verificada. Elige tu nueva contraseña." },
  email: { path: "/inicio", msg: "¡Cuenta confirmada! Bienvenido a Forcepx." },
  signup: { path: "/inicio", msg: "¡Cuenta confirmada! Bienvenido a Forcepx." },
  email_change: { path: "/account", msg: "Tu nuevo correo quedó confirmado." },
  magiclink: { path: "/inicio", msg: "Sesión iniciada." },
  invite: { path: "/update-password", msg: "Invitación aceptada. Elige tu contraseña." },
};

export default function AuthConfirm() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  useEffect(() => {
    const token_hash = params.get("token_hash");
    const type = params.get("type");
    const next = params.get("next");
    if (!token_hash || !DESTINO[type]) {
      setError("El enlace está incompleto. Pide uno nuevo desde la pantalla de inicio de sesión.");
      return;
    }
    let cancelled = false;
    supabase.auth
      .verifyOtp({ token_hash, type })
      .then(({ error: err }) => {
        if (cancelled) return;
        if (err) {
          setError(
            /expired|invalid/i.test(err.message)
              ? "El enlace caducó o ya se usó. Pide uno nuevo desde la pantalla de inicio de sesión."
              : err.message,
          );
          return;
        }
        toast.success(DESTINO[type].msg);
        navigate(next && next.startsWith("/") ? next : DESTINO[type].path, { replace: true });
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        {error ? (
          <>
            <h1 className="text-2xl font-bold text-gray-900 mb-3">No pudimos verificar el enlace</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <Link to="/login" className="inline-block bg-[#6b1e96] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#531575] transition">
              Ir a iniciar sesión
            </Link>
          </>
        ) : (
          <>
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-[#6b1e96]/20 border-t-[#6b1e96]" aria-hidden="true" />
            <p className="text-gray-600">Verificando tu enlace…</p>
          </>
        )}
      </div>
    </div>
  );
}
