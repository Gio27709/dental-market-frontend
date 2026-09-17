import { useEffect, useRef, useState } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";

// Registro del service worker y aviso de versión nueva.
// - Si la versión nueva aparece nada más abrir (primeros 15 s), se aplica sola: la persona aún
//   no ha hecho nada. Así la app instalada casi siempre abre ya actualizada.
// - Si aparece más tarde, se pregunta: recargar a mitad de un pago o de un formulario perdería lo escrito.
// - La app instalada puede quedar abierta días: se busca actualización cada hora y al volver a la pestaña.

const APLICAR_SOLA_MS = 15_000;
const REVISAR_CADA_MS = 60 * 60 * 1000;

export default function ActualizacionPwa() {
  const registroRef = useRef(null);
  const [descartada, setDescartada] = useState(false);

  const {
    needRefresh: [hayVersionNueva],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registro) {
      registroRef.current = registro || null;
    },
    onRegisterError(error) {
      console.warn("[PWA] No se pudo registrar el service worker:", error?.message || error);
    },
  });

  useEffect(() => {
    if (hayVersionNueva && performance.now() < APLICAR_SOLA_MS) updateServiceWorker(true);
  }, [hayVersionNueva, updateServiceWorker]);

  useEffect(() => {
    const revisar = () => {
      if (document.visibilityState === "visible" && navigator.onLine) registroRef.current?.update().catch(() => {});
    };
    const intervalo = setInterval(revisar, REVISAR_CADA_MS);
    document.addEventListener("visibilitychange", revisar);
    return () => {
      clearInterval(intervalo);
      document.removeEventListener("visibilitychange", revisar);
    };
  }, []);

  if (!hayVersionNueva || descartada || performance.now() < APLICAR_SOLA_MS) return null;

  return (
    <div
      role="status"
      className="fixed left-1/2 top-3 z-[1100] flex w-[calc(100%-1.5rem)] max-w-md -translate-x-1/2 items-center gap-3 rounded-2xl bg-[#33243d] px-4 py-3 text-white shadow-2xl"
      style={{ top: "max(0.75rem, env(safe-area-inset-top))" }}
    >
      <span className="material-symbols-outlined text-[22px] text-[#c3ff00]" aria-hidden="true">system_update</span>
      <p className="min-w-0 flex-1 text-[13px] leading-tight">
        <strong className="block">Hay una versión nueva de Forcepx</strong>
        Actualiza cuando termines lo que estás haciendo.
      </p>
      <button type="button" onClick={() => updateServiceWorker(true)} className="shrink-0 rounded-full bg-[#c3ff00] px-3 py-1.5 text-[13px] font-bold text-[#531575]">
        Actualizar
      </button>
      <button type="button" onClick={() => setDescartada(true)} aria-label="Más tarde" className="shrink-0 p-1 text-white/70 hover:text-white">
        <span className="material-symbols-outlined text-[20px] leading-none" aria-hidden="true">close</span>
      </button>
    </div>
  );
}
