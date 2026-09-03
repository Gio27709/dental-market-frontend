import { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import { useAuth } from "../../context/AuthContext";
import { GOOGLE_CLIENT_ID, loadGoogleIdentity, createNonce } from "../../lib/googleIdentity";

// El botón oficial de Google admite como máximo 400px de ancho.
const MAX_WIDTH = 400;

/**
 * Botón de Google. Si hay VITE_GOOGLE_CLIENT_ID usa el botón oficial de Google
 * (la ventana se abre desde nuestro dominio y el token va a Supabase); si no,
 * cae al flujo antiguo de redirección por Supabase.
 */
export default function GoogleSignInButton({ text = "signin_with", disabled = false, onError }) {
  const { loginWithGoogle, loginWithGoogleCredential } = useAuth();
  const containerRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const useNative = Boolean(GOOGLE_CLIENT_ID) && !failed;

  useEffect(() => {
    if (!useNative) return undefined;
    let cancelled = false;

    (async () => {
      try {
        const [google, nonce] = await Promise.all([loadGoogleIdentity(), createNonce()]);
        if (cancelled || !containerRef.current) return;

        google.initialize({
          client_id: GOOGLE_CLIENT_ID,
          nonce: nonce.hashed,
          ux_mode: "popup",
          callback: async (response) => {
            const { error } = await loginWithGoogleCredential(response.credential, nonce.raw);
            if (error) onError?.(error.message || "Error conectando con Google");
          },
        });

        containerRef.current.innerHTML = "";
        google.renderButton(containerRef.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          shape: "rectangular",
          text,
          logo_alignment: "center",
          locale: "es",
          width: Math.min(MAX_WIDTH, containerRef.current.parentElement?.clientWidth || MAX_WIDTH),
        });
        setReady(true);
      } catch (err) {
        if (!cancelled) {
          console.error("Google Identity no disponible, usando redirección:", err);
          setFailed(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [useNative, text, loginWithGoogleCredential, onError]);

  if (!useNative) {
    const handleClick = async () => {
      const { error } = await loginWithGoogle();
      if (error) onError?.(error.message || "Error conectando con Google");
    };
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled}
        className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-200 rounded-lg text-gray-800 font-medium hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
      >
        <img
          src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
          alt="Google"
          loading="lazy"
          className="w-5 h-5"
        />
        <span>{text === "signup_with" ? "Registrarse con Google" : "Iniciar sesión con Google"}</span>
      </button>
    );
  }

  return (
    <div
      className={`w-full flex justify-center min-h-[44px] ${disabled ? "pointer-events-none opacity-70" : ""}`}
      aria-busy={!ready}
    >
      {!ready && <div className="w-full max-w-[400px] h-[44px] rounded-lg bg-gray-100 animate-pulse" />}
      <div ref={containerRef} className={ready ? "" : "hidden"} />
    </div>
  );
}

GoogleSignInButton.propTypes = {
  text: PropTypes.oneOf(["signin_with", "signup_with", "continue_with"]),
  disabled: PropTypes.bool,
  onError: PropTypes.func,
};
