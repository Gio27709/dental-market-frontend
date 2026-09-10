import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation, useNavigate } from "react-router-dom";
import { useTour } from "./TourContext";

/**
 * Capa visual del tour: oscurece la página, recorta un «foco» sobre el elemento
 * `data-tour` del paso actual y muestra la tarjeta con el texto y los botones.
 *
 * Mecánica:
 *  1. Si el paso pide una ruta y no estamos en ella, navega.
 *  2. Busca el elemento hasta 3 s (la página puede estar cargando). Si no aparece,
 *     salta al siguiente paso.
 *  3. Hace scroll hasta el elemento, mide su rectángulo y lo vuelve a medir en cada
 *     scroll/resize para que el foco lo siga.
 */

const BUSQUEDA_MS = 3000;
const INTERVALO_MS = 100;
const MARGEN_FOCO = 6;
const SEPARACION = 14;
const ANCHO_TARJETA = 340;

function buscarElemento(target) {
  const nodos = document.querySelectorAll('[data-tour="' + target + '"]');
  for (const nodo of nodos) {
    const r = nodo.getBoundingClientRect();
    if (r.width > 0 && r.height > 0) return nodo;
  }
  return null;
}

function rutaSatisfecha(paso, pathname) {
  if (!paso.route) return true;
  if (pathname === paso.route) return true;
  if (paso.routePrefix && pathname.startsWith(paso.routePrefix)) return true;
  return Array.isArray(paso.routeAlias) && paso.routeAlias.includes(pathname);
}

export default function TourOverlay() {
  const { activo, paso, nextStep, prevStep, stopTour } = useTour();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const [rect, setRect] = useState(null);
  const [tarjetaAlto, setTarjetaAlto] = useState(180);
  const elementoRef = useRef(null);
  const tarjetaRef = useRef(null);
  // Clave "tour:paso" de la última navegación pedida. Si tras navegar la ruta sigue sin
  // coincidir (una redirección la cambió), no se insiste: se busca el elemento donde estemos.
  const navegadoRef = useRef(null);

  const indice = activo?.indice ?? 0;
  const total = activo?.pasos.length ?? 0;
  const esUltimo = indice === total - 1;

  const medir = useCallback(() => {
    const el = elementoRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
  }, []);

  // 1 y 2: navegar si hace falta y localizar el elemento del paso.
  useEffect(() => {
    if (!activo || !paso) {
      elementoRef.current = null;
      setRect(null);
      return undefined;
    }

    const claveNavegacion = activo.id + ":" + indice;
    if (!rutaSatisfecha(paso, pathname) && navegadoRef.current !== claveNavegacion) {
      navegadoRef.current = claveNavegacion;
      navigate(paso.route);
      return undefined;
    }

    let cancelado = false;
    let transcurrido = 0;
    elementoRef.current = null;
    setRect(null);

    const intentar = () => {
      if (cancelado) return;
      const el = buscarElemento(paso.target);
      if (el) {
        elementoRef.current = el;
        el.scrollIntoView({ block: "center", inline: "nearest", behavior: "smooth" });
        // Esperar a que termine el scroll suave antes de medir por primera vez.
        setTimeout(() => {
          if (!cancelado) medir();
        }, 350);
        return;
      }
      transcurrido += INTERVALO_MS;
      if (transcurrido >= BUSQUEDA_MS) {
        // El botón no existe en esta pantalla (rol, tamaño o contenido): se salta.
        if (esUltimo) stopTour();
        else nextStep();
        return;
      }
      setTimeout(intentar, INTERVALO_MS);
    };
    intentar();

    return () => {
      cancelado = true;
    };
  }, [activo?.id, indice, paso, pathname, navigate, medir, nextStep, stopTour, esUltimo]);

  // 3: seguir al elemento.
  useEffect(() => {
    if (!activo) return undefined;
    let raf = 0;
    const onCambio = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(medir);
    };
    window.addEventListener("scroll", onCambio, true);
    window.addEventListener("resize", onCambio);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onCambio, true);
      window.removeEventListener("resize", onCambio);
    };
  }, [activo, medir]);

  // Teclado: Esc cierra, flechas navegan.
  useEffect(() => {
    if (!activo) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") stopTour();
      else if (e.key === "ArrowRight") nextStep();
      else if (e.key === "ArrowLeft") prevStep();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activo, stopTour, nextStep, prevStep]);

  useLayoutEffect(() => {
    if (tarjetaRef.current) setTarjetaAlto(tarjetaRef.current.offsetHeight);
  }, [rect, paso]);

  if (!activo || !paso) return null;

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const anchoTarjeta = Math.min(ANCHO_TARJETA, vw - 32);

  // Posición de la tarjeta respecto al foco.
  let estiloTarjeta;
  let flecha = null;
  if (rect) {
    const focoTop = rect.top - MARGEN_FOCO;
    const focoBottom = rect.top + rect.height + MARGEN_FOCO;
    const cabeAbajo = focoBottom + SEPARACION + tarjetaAlto + 16 <= vh;
    const cabeArriba = focoTop - SEPARACION - tarjetaAlto >= 16;
    const preferirArriba = paso.placement === "top";
    const abajo = preferirArriba ? !cabeArriba && cabeAbajo : cabeAbajo || !cabeArriba;

    const centroX = rect.left + rect.width / 2;
    const left = Math.max(16, Math.min(centroX - anchoTarjeta / 2, vw - anchoTarjeta - 16));

    if (abajo || cabeArriba) {
      const top = abajo ? focoBottom + SEPARACION : focoTop - SEPARACION - tarjetaAlto;
      estiloTarjeta = { top, left, width: anchoTarjeta };
      const flechaX = Math.max(18, Math.min(centroX - left - 8, anchoTarjeta - 26));
      flecha = abajo ? { arriba: true, left: flechaX } : { arriba: false, left: flechaX };
    } else {
      // Ni arriba ni abajo: el elemento ocupa casi toda la pantalla. Va al pie.
      estiloTarjeta = { bottom: 16, left, width: anchoTarjeta };
    }
  } else {
    estiloTarjeta = { bottom: 16, left: Math.max(16, (vw - anchoTarjeta) / 2), width: anchoTarjeta };
  }

  const claseFlecha =
    "absolute w-4 h-4 bg-white border-[#6b1e96]/15 " +
    (flecha?.arriba ? "border-l border-t rotate-45" : "border-r border-b rotate-45");
  const estiloFlecha = flecha
    ? flecha.arriba
      ? { top: -8, left: flecha.left }
      : { bottom: -8, left: flecha.left }
    : null;

  return createPortal(
    <div className="fixed inset-0 z-[10000]" role="dialog" aria-modal="true" aria-label={activo.nombre}>
      {/* Bloquea clics sobre la página mientras dura la guía (la sombra la dibuja el foco). */}
      <div
        className="absolute inset-0"
        style={{ background: rect ? "transparent" : "rgba(20,6,32,0.62)" }}
        onClick={stopTour}
      />

      {rect && (
        <div
          className="absolute rounded-xl pointer-events-none transition-all duration-300 ease-out"
          style={{
            top: rect.top - MARGEN_FOCO,
            left: rect.left - MARGEN_FOCO,
            width: rect.width + MARGEN_FOCO * 2,
            height: rect.height + MARGEN_FOCO * 2,
            boxShadow: "0 0 0 100vmax rgba(20,6,32,0.62), 0 0 0 3px #c3ff00",
          }}
        />
      )}

      <div
        ref={tarjetaRef}
        className="absolute bg-white rounded-2xl shadow-2xl border border-[#6b1e96]/15 p-5 transition-all duration-300 ease-out"
        style={estiloTarjeta}
        onClick={(e) => e.stopPropagation()}
      >
        {flecha && <span className={claseFlecha} style={estiloFlecha} />}

        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold uppercase tracking-widest text-[#6b1e96]">
            Paso {indice + 1} de {total}
          </span>
          <button
            type="button"
            onClick={stopTour}
            className="text-gray-400 hover:text-gray-700 text-xs font-semibold"
            aria-label="Cerrar la guía"
          >
            Saltar
          </button>
        </div>

        <h3 className="font-['Manrope'] text-lg font-extrabold text-gray-900 leading-snug">{paso.title}</h3>
        <p className="mt-1.5 text-sm text-gray-600 leading-relaxed">{paso.text}</p>

        <div className="mt-4 flex items-center justify-between gap-2">
          <div className="flex gap-1">
            {activo.pasos.map((_, i) => (
              <span
                key={i}
                className={"h-1.5 rounded-full transition-all " + (i === indice ? "w-5 bg-[#6b1e96]" : "w-1.5 bg-gray-200")}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            {indice > 0 && (
              <button
                type="button"
                onClick={prevStep}
                className="px-3 py-2 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100"
              >
                Anterior
              </button>
            )}
            <button
              type="button"
              onClick={esUltimo ? stopTour : nextStep}
              className="px-4 py-2 rounded-xl text-sm font-bold bg-[#c3ff00] hover:bg-[#aee600] text-[#151f00] shadow-sm"
            >
              {esUltimo ? "Terminar" : "Siguiente"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
