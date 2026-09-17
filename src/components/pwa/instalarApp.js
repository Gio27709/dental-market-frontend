import { useEffect, useState } from "react";

// Instalación de la PWA. Chrome/Edge/Samsung (Android y escritorio) disparan
// `beforeinstallprompt` una sola vez y muy pronto, a veces antes de que React monte: por eso se
// escucha desde main.jsx y el evento se guarda aquí. iPhone/iPad (Safari) no tienen ese evento:
// se instala a mano con «Compartir → Agregar a inicio», y la web solo puede explicarlo.

let eventoGuardado = null;
const oyentes = new Set();
const avisar = () => oyentes.forEach((fn) => fn());

export function escucharInstalacion() {
  if (typeof window === "undefined") return;
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault(); // sin el mini-aviso propio del navegador: lo ofrece nuestra interfaz
    eventoGuardado = e;
    avisar();
  });
  window.addEventListener("appinstalled", () => {
    eventoGuardado = null;
    avisar();
  });
}

/** Abierta como app instalada (pantalla completa, sin barra del navegador). */
export const esAppInstalada = () =>
  typeof window !== "undefined" &&
  (window.matchMedia?.("(display-mode: standalone)").matches || window.navigator.standalone === true);

/** iPhone/iPad con Safari (en iPadOS moderno se presenta como Mac con pantalla táctil). */
export const esIOS = () => {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  const ios = /iPhone|iPad|iPod/i.test(ua) || (ua.includes("Macintosh") && navigator.maxTouchPoints > 1);
  // Chrome/Firefox en iOS también pueden instalar desde «Compartir» en versiones recientes.
  return ios;
};

/** Abre el aviso nativo de instalación. Devuelve "accepted" | "dismissed" | "no-disponible". */
export async function instalarApp() {
  if (!eventoGuardado) return "no-disponible";
  const evento = eventoGuardado;
  eventoGuardado = null;
  avisar();
  await evento.prompt();
  const { outcome } = await evento.userChoice;
  return outcome;
}

/**
 * Estado para la interfaz: `puedeInstalar` (hay aviso nativo), `ios` (hay que explicar los pasos)
 * y `instalada`. Si ya está instalada, no se ofrece nada.
 */
export function useInstalarApp() {
  const [, forzar] = useState(0);
  useEffect(() => {
    const fn = () => forzar((n) => n + 1);
    oyentes.add(fn);
    const media = window.matchMedia?.("(display-mode: standalone)");
    media?.addEventListener?.("change", fn);
    return () => {
      oyentes.delete(fn);
      media?.removeEventListener?.("change", fn);
    };
  }, []);

  const instalada = esAppInstalada();
  const ios = !instalada && esIOS();
  return {
    instalada,
    puedeInstalar: !instalada && Boolean(eventoGuardado),
    ios,
    disponible: !instalada && (Boolean(eventoGuardado) || ios),
    instalar: instalarApp,
  };
}
