import { useEffect } from "react";
import PropTypes from "prop-types";

// Pasos para instalar en iPhone/iPad, donde Safari no tiene botón de instalación automático.

function Paso({ numero, children }) {
  return (
    <li className="flex gap-3">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#6b1e96] text-[13px] font-bold text-white">{numero}</span>
      <span className="pt-0.5 text-[14px] leading-snug text-fx-text">{children}</span>
    </li>
  );
}

Paso.propTypes = { numero: PropTypes.number.isRequired, children: PropTypes.node.isRequired };

export default function InstalarAppDialogo({ abierto, onCerrar }) {
  useEffect(() => {
    if (!abierto) return undefined;
    const alTeclear = (e) => e.key === "Escape" && onCerrar();
    window.addEventListener("keydown", alTeclear);
    return () => window.removeEventListener("keydown", alTeclear);
  }, [abierto, onCerrar]);

  if (!abierto) return null;

  return (
    <div className="fixed inset-0 z-[1200] flex items-end justify-center bg-black/50 sm:items-center" onClick={onCerrar}>
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="instalar-app-titulo"
        className="w-full max-w-md rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl"
        style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center gap-3">
          <img src="/icons/icon-192.png" alt="" className="h-12 w-12 rounded-xl" />
          <div>
            <h2 id="instalar-app-titulo" className="text-[17px] font-bold text-fx-text">Instala Forcepx en tu iPhone</h2>
            <p className="text-[13px] text-fx-muted">Ábrela desde tu pantalla de inicio, como cualquier app.</p>
          </div>
        </div>
        <ol className="space-y-3">
          <Paso numero={1}>
            Toca el botón <strong>Compartir</strong>{" "}
            <span className="material-symbols-outlined align-middle text-[20px] text-[#0a84ff]" aria-label="icono compartir">ios_share</span>{" "}
            en la barra de Safari.
          </Paso>
          <Paso numero={2}>
            Desliza y elige <strong>«Agregar a inicio»</strong>{" "}
            <span className="material-symbols-outlined align-middle text-[20px] text-fx-muted" aria-hidden="true">add_box</span>.
          </Paso>
          <Paso numero={3}>
            Toca <strong>«Agregar»</strong>. Listo: verás el ícono de Forcepx en tu pantalla.
          </Paso>
        </ol>
        <button type="button" onClick={onCerrar} className="mt-6 w-full rounded-xl bg-[#6b1e96] py-3 text-[15px] font-semibold text-white hover:bg-[#5a1880]">
          Entendido
        </button>
      </section>
    </div>
  );
}

InstalarAppDialogo.propTypes = {
  abierto: PropTypes.bool.isRequired,
  onCerrar: PropTypes.func.isRequired,
};
