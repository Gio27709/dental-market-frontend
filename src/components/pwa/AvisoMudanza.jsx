import { useState } from "react";
import { useLocation } from "react-router-dom";
import { SITE_URL } from "../../lib/seo";
import { esAppInstalada } from "./instalarApp";

// Mudanza a forcepx.io (2026-11). Las páginas de forcepx.com redirigen en Caddy, pero la app
// instalada desde forcepx.com abre su copia guardada sin pasar por el servidor: este aviso es lo
// único que le llega. Cuando forcepx.com sea la farmacia, esa app dejaría de servir para el
// dental, por eso se pide abrir forcepx.io e instalarla de nuevo. «Más tarde» lo oculta hasta
// la próxima vez que se abra la app.

const CLAVE = "forcepx_aviso_mudanza_oculto";
const DOMINIO_VIEJO = /(^|\.)forcepx\.com$/i;

function ocultoEnEstaSesion() {
  try {
    return sessionStorage.getItem(CLAVE) === "1";
  } catch {
    return false;
  }
}

export default function AvisoMudanza() {
  const { pathname, search } = useLocation();
  const [cerrado, setCerrado] = useState(ocultoEnEstaSesion);

  if (typeof window === "undefined" || !DOMINIO_VIEJO.test(window.location.hostname)) return null;
  if (DOMINIO_VIEJO.test(new URL(SITE_URL).hostname) || cerrado) return null;

  const instalada = esAppInstalada();
  const destino = `${SITE_URL}${pathname}${search}`;
  const cerrar = () => {
    try {
      sessionStorage.setItem(CLAVE, "1");
    } catch {
      /* sin sessionStorage: se oculta solo mientras la pantalla siga abierta */
    }
    setCerrado(true);
  };

  return (
    <div
      role="dialog"
      aria-labelledby="aviso-mudanza-titulo"
      className="fixed inset-x-3 bottom-3 z-[1040] mx-auto max-w-md rounded-2xl bg-[#33243d] p-4 text-white shadow-2xl"
      style={{ marginBottom: "env(safe-area-inset-bottom)" }}
    >
      <p id="aviso-mudanza-titulo" className="text-[15px] font-bold">
        Forcepx se mudó a {new URL(SITE_URL).hostname}
      </p>
      <p className="mt-1 text-[13px] leading-snug text-white/85">
        Tu cuenta, tus pedidos y tu dinero siguen igual: solo inicia sesión en la dirección nueva.
        {instalada && " Esta app dejará de funcionar pronto: ábrela allá y vuelve a instalarla."}
      </p>
      <div className="mt-3 flex gap-2">
        <a
          href={destino}
          target={instalada ? "_blank" : undefined}
          rel="noopener"
          className="flex-1 rounded-xl bg-white px-4 py-2 text-center text-[14px] font-bold text-[#6b1e96]"
        >
          Ir a {new URL(SITE_URL).hostname}
        </a>
        <button
          type="button"
          onClick={cerrar}
          className="rounded-xl px-3 py-2 text-[13px] font-semibold text-white/80 hover:text-white"
        >
          Más tarde
        </button>
      </div>
    </div>
  );
}
