import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import { getMfaState, enrollTotp, verifyCode } from "../../lib/mfa";

// Puerta del panel de administración: admin y owner solo pasan con la sesión en nivel aal2.
// - Sin factor vinculado → pantalla para escanear el QR con Google Authenticator (o similar)
//   y confirmar con un código.
// - Con factor pero sesión aal1 (acaba de iniciar sesión) → pedir el código.
// - aal2 → se muestra el panel. Los demás roles no pasan por aquí.

const PRIVILEGED = ["admin", "owner"];

export default function MfaGate({ children }) {
  const { user, logout } = useAuth();
  const [state, setState] = useState({ status: "checking" }); // checking | ok | enroll | challenge | error
  const [enroll, setEnroll] = useState(null); // { factorId, qrCode, secret }
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  const privileged = user && PRIVILEGED.includes(user.role);

  useEffect(() => {
    if (!privileged) return;
    let alive = true;
    (async () => {
      try {
        const s = await getMfaState();
        if (!alive) return;
        if (s.currentLevel === "aal2") setState({ status: "ok" });
        else if (s.hasVerifiedFactor) setState({ status: "challenge", factorId: s.factorId });
        else {
          const e = await enrollTotp();
          if (!alive) return;
          setEnroll(e);
          setState({ status: "enroll", factorId: e.factorId });
        }
      } catch (err) {
        if (alive) setState({ status: "error", message: err.message });
      }
    })();
    return () => {
      alive = false;
    };
  }, [privileged]);

  if (!privileged) return children;
  if (state.status === "ok") return children;

  const submit = async (e) => {
    e.preventDefault();
    if (code.replace(/\s+/g, "").length !== 6) return toast.error("El código tiene 6 dígitos.");
    try {
      setBusy(true);
      await verifyCode(state.factorId, code);
      toast.success(state.status === "enroll" ? "Doble factor activado. Bienvenido al panel." : "Identidad verificada.");
      setState({ status: "ok" });
    } catch (err) {
      toast.error(/invalid|expired/i.test(err.message) ? "Código incorrecto o vencido. Prueba con el siguiente." : err.message);
      setCode("");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f1ecf6] px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <div className="text-center mb-6">
          <div className="mx-auto mb-3 h-12 w-12 rounded-xl bg-[#6b1e96]/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-[#6b1e96] text-[28px]">shield_lock</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900">
            {state.status === "enroll" ? "Activa la verificación en dos pasos" : state.status === "challenge" ? "Verificación en dos pasos" : "Comprobando tu sesión"}
          </h1>
          <p className="text-sm text-gray-600 mt-2">
            {state.status === "enroll" && "Las cuentas que administran Forcepx necesitan un segundo factor. Solo se hace una vez."}
            {state.status === "challenge" && `Escribe el código de 6 dígitos de tu app de autenticación para entrar como ${user.email}.`}
            {state.status === "checking" && "Un momento…"}
            {state.status === "error" && (state.message || "No se pudo comprobar el doble factor.")}
          </p>
        </div>

        {state.status === "enroll" && enroll && (
          <ol className="text-sm text-gray-700 space-y-3 mb-6">
            <li><span className="font-semibold">1.</span> Instala en tu teléfono <span className="font-semibold">Google Authenticator</span>, Microsoft Authenticator o Authy.</li>
            <li>
              <span className="font-semibold">2.</span> Escanea este código con la app:
              <div className="mt-2 flex justify-center">
                <img src={enroll.qrCode} alt="Código QR para la app de autenticación" className="h-44 w-44 rounded-lg border border-gray-200 bg-white" />
              </div>
              <details className="mt-2 text-xs text-gray-500">
                <summary className="cursor-pointer">¿No puedes escanear? Escribe la clave a mano</summary>
                <code className="block mt-1 break-all rounded bg-gray-50 p-2 text-[11px] text-gray-700">{enroll.secret}</code>
              </details>
            </li>
            <li><span className="font-semibold">3.</span> Escribe abajo el código de 6 dígitos que muestra la app.</li>
          </ol>
        )}

        {(state.status === "enroll" || state.status === "challenge") && (
          <form onSubmit={submit} className="space-y-4">
            <input
              autoFocus
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9 ]*"
              maxLength={7}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/[^0-9 ]/g, ""))}
              placeholder="000 000"
              className="w-full text-center text-2xl tracking-[0.4em] font-mono rounded-xl border-2 border-gray-200 focus:border-[#6b1e96] focus:outline-none py-3"
            />
            <button type="submit" disabled={busy} className="w-full rounded-xl bg-[#6b1e96] text-white font-semibold py-3 hover:bg-[#531575] disabled:opacity-60 transition">
              {busy ? "Comprobando…" : state.status === "enroll" ? "Activar y entrar" : "Entrar"}
            </button>
          </form>
        )}

        {state.status === "error" && (
          <button onClick={() => window.location.reload()} className="w-full rounded-xl bg-[#6b1e96] text-white font-semibold py-3 hover:bg-[#531575] transition">Reintentar</button>
        )}

        <div className="mt-6 text-center text-xs text-gray-500">
          {state.status === "challenge" && <p className="mb-2">¿Perdiste el teléfono? Pide al dueño que restablezca tu doble factor desde Usuarios.</p>}
          <button onClick={logout} className="text-[#6b1e96] hover:underline">Cerrar sesión</button>
        </div>
      </div>
    </div>
  );
}

MfaGate.propTypes = { children: PropTypes.node.isRequired };
