import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import { useAuth } from "../../context/AuthContext";
import { useLocationContext } from "../../hooks/useLocationContext";
import { TOURS } from "./tours";

/**
 * Recorridos guiados de la página («Guía de la página» y «Guía del panel de tienda»).
 *
 * El proveedor solo lleva el estado (qué tour, qué paso). El dibujo lo hace
 * `TourOverlay`, que busca en el DOM el elemento `data-tour` del paso actual.
 *
 * Persistencia: localStorage por tour y por usuario. La clave incluye el id del
 * usuario (o «guest») para que una cuenta nueva en el mismo navegador vea la guía
 * aunque otra cuenta ya la haya cerrado. Se marca como vista al INICIAR, así una
 * pestaña cerrada a mitad de camino no la repite en cada carga.
 */

const MOBILE_QUERY = "(max-width: 767px)";

const TourContext = createContext(null);

const claveVisto = (tourId, userId) => `forcepx_tour:${tourId}:${userId || "guest"}`;

export const hasSeenTour = (tourId, userId) => {
  try {
    return localStorage.getItem(claveVisto(tourId, userId)) === "1";
  } catch {
    return true; // sin localStorage no insistimos con la guía en cada carga
  }
};

export const markTourSeen = (tourId, userId) => {
  try {
    localStorage.setItem(claveVisto(tourId, userId), "1");
  } catch {
    // modo restringido: la guía se muestra igual, solo no se recuerda
  }
};

export const isMobileViewport = () =>
  typeof window !== "undefined" && window.matchMedia(MOBILE_QUERY).matches;

/** Aplica las variantes móviles y descarta los pasos ocultos en ese tamaño. */
function resolverPasos(tour, mobile) {
  const pasos = [];
  for (const paso of tour.pasos) {
    if (!mobile) {
      pasos.push(paso);
      continue;
    }
    if (paso.mobile === false) continue;
    if (paso.mobile && typeof paso.mobile === "object") {
      pasos.push({ ...paso, ...paso.mobile, mobile: undefined });
      continue;
    }
    pasos.push(paso);
  }
  return pasos;
}

export function TourProvider({ children }) {
  const { user } = useAuth();
  const userId = user?.id || null;

  const [activo, setActivo] = useState(null); // { id, nombre, pasos, indice }
  const userIdRef = useRef(userId);
  userIdRef.current = userId;

  const startTour = useCallback((tourId) => {
    const tour = TOURS[tourId];
    if (!tour) return false;
    const pasos = resolverPasos(tour, isMobileViewport());
    if (pasos.length === 0) return false;
    markTourSeen(tourId, userIdRef.current);
    setActivo({ id: tour.id, nombre: tour.nombre, pasos, indice: 0 });
    return true;
  }, []);

  const stopTour = useCallback(() => setActivo(null), []);

  const nextStep = useCallback(() => {
    setActivo((prev) => {
      if (!prev) return prev;
      if (prev.indice + 1 >= prev.pasos.length) return null;
      return { ...prev, indice: prev.indice + 1 };
    });
  }, []);

  const prevStep = useCallback(() => {
    setActivo((prev) => {
      if (!prev || prev.indice === 0) return prev;
      return { ...prev, indice: prev.indice - 1 };
    });
  }, []);

  // Si cierra sesión o cambia de cuenta a mitad de una guía, se corta: los botones
  // que estaba señalando pueden dejar de existir.
  useEffect(() => {
    setActivo(null);
  }, [userId]);

  const value = useMemo(
    () => ({
      activo,
      paso: activo ? activo.pasos[activo.indice] : null,
      startTour,
      stopTour,
      nextStep,
      prevStep,
      hasSeen: (tourId) => hasSeenTour(tourId, userId),
    }),
    [activo, startTour, stopTour, nextStep, prevStep, userId],
  );

  return <TourContext.Provider value={value}>{children}</TourContext.Provider>;
}

TourProvider.propTypes = { children: PropTypes.node };

export function useTour() {
  const ctx = useContext(TourContext);
  if (!ctx) throw new Error("useTour debe usarse dentro de <TourProvider>");
  return ctx;
}

function ubicacionDescartada() {
  try {
    return sessionStorage.getItem("location_prompt_dismissed") === "true";
  } catch {
    return true;
  }
}

/**
 * Lanza un tour la primera vez que el usuario (o invitado) llega a la pantalla
 * donde se monta. `delay` deja que la página termine de pintar sus botones.
 *
 * `esperarUbicacion`: en la tienda pública, la primera visita abre sola el modal
 * «¿A dónde enviamos?» a los 2 s. La guía espera a que el visitante elija o cierre
 * ese modal; si no, se pisarían los dos avisos.
 */
export function AutoTour({ id, delay = 900, esperarUbicacion = false }) {
  const { startTour, hasSeen, activo } = useTour();
  const ubicacion = useLocationContext();
  const activoRef = useRef(activo);
  activoRef.current = activo;

  const buyerState = ubicacion?.buyerState || "";
  const promptAbierto = Boolean(ubicacion?.shouldShowPrompt);
  const promptVistoRef = useRef(false);
  if (promptAbierto) promptVistoRef.current = true;

  const listo =
    !esperarUbicacion ||
    Boolean(buyerState) ||
    ubicacionDescartada() ||
    (promptVistoRef.current && !promptAbierto);

  useEffect(() => {
    if (!listo || hasSeen(id)) return undefined;
    const t = setTimeout(() => {
      if (!activoRef.current) startTour(id);
    }, delay);
    return () => clearTimeout(t);
    // hasSeen cambia con el usuario; si cambia de cuenta se reevalúa.
  }, [id, delay, listo, startTour, hasSeen]);

  return null;
}

AutoTour.propTypes = {
  id: PropTypes.string.isRequired,
  delay: PropTypes.number,
  esperarUbicacion: PropTypes.bool,
};
