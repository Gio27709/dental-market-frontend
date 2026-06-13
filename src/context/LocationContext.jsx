/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useEffect, useCallback, useMemo } from "react";
import PropTypes from "prop-types";
import { detectUserState } from "../services/geolocationService";

export const LocationContext = createContext();

/**
 * LocationProvider — Maneja el estado de ubicación del comprador.
 * 
 * Soporta dos modos:
 * - Automático: Detecta el estado via GPS del navegador
 * - Manual: El usuario elige de una lista de 24 estados
 * 
 * Persistencia:
 * - buyerState → localStorage (persiste entre sesiones)
 * - locationMethod → localStorage (recuerda cómo se obtuvo)
 * - prompt dismissed → sessionStorage (no repetir en la misma sesión)
 */
export function LocationProvider({ children }) {
  // ─── Estado principal (compatible con código existente) ───
  const [buyerState, setBuyerState] = useState(() => {
    return localStorage.getItem("buyer_state") || "";
  });

  // ─── Nuevos estados para geolocalización ───
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectionError, setDetectionError] = useState(null);
  const [locationMethod, setLocationMethod] = useState(() => {
    return localStorage.getItem("location_method") || null; // "auto" | "manual" | null
  });
  const [detectedState, setDetectedState] = useState(null); // Estado detectado pendiente de confirmar
  const [shouldShowPrompt, setShouldShowPrompt] = useState(false);

  // ─── Persistir buyerState en localStorage ───
  useEffect(() => {
    if (buyerState) {
      localStorage.setItem("buyer_state", buyerState);
    } else {
      localStorage.removeItem("buyer_state");
    }
  }, [buyerState]);

  // ─── Persistir locationMethod en localStorage ───
  useEffect(() => {
    if (locationMethod) {
      localStorage.setItem("location_method", locationMethod);
    } else {
      localStorage.removeItem("location_method");
    }
  }, [locationMethod]);

  // ─── Lógica del prompt inicial ───
  // Se muestra si: no hay ubicación guardada Y no se descartó en esta sesión
  useEffect(() => {
    const dismissed = sessionStorage.getItem("location_prompt_dismissed");
    if (!buyerState && !dismissed) {
      // Delay de 2 segundos para no interrumpir la carga inicial
      const timer = setTimeout(() => {
        setShouldShowPrompt(true);
      }, 2000);
      return () => clearTimeout(timer);
    } else {
      setShouldShowPrompt(false);
    }
  }, [buyerState]);

  /**
   * Dispara la detección automática vía GPS.
   * El navegador mostrará el prompt nativo:
   * "[sitio] quiere saber tu ubicación — Permitir / Bloquear"
   */
  const detectLocation = useCallback(async () => {
    setIsDetecting(true);
    setDetectionError(null);
    setDetectedState(null);

    const result = await detectUserState();

    setIsDetecting(false);

    if (result.success) {
      // GPS detectó un estado → guardarlo como pendiente de confirmar
      setDetectedState(result.state);
      return result;
    } else {
      // Error en la detección
      setDetectionError(result.error);
      return result;
    }
  }, []);

  /**
   * Confirma el estado detectado automáticamente.
   * Se llama cuando el usuario acepta la detección GPS.
   */
  const confirmDetectedLocation = useCallback(() => {
    if (detectedState) {
      setBuyerState(detectedState);
      setLocationMethod("auto");
      setDetectedState(null);
      setDetectionError(null);
      setShouldShowPrompt(false);
    }
  }, [detectedState]);

  /**
   * Establece la ubicación manualmente (desde el grid de estados).
   * Wrapper de setBuyerState que además marca el método como "manual".
   */
  const setManualLocation = useCallback((state) => {
    setBuyerState(state);
    setLocationMethod("manual");
    setDetectedState(null);
    setDetectionError(null);
    setShouldShowPrompt(false);
  }, []);

  /**
   * Descarta el prompt sin elegir ubicación.
   * No vuelve a mostrarse en la misma sesión.
   */
  const dismissPrompt = useCallback(() => {
    sessionStorage.setItem("location_prompt_dismissed", "true");
    setShouldShowPrompt(false);
    setDetectedState(null);
    setDetectionError(null);
    setIsDetecting(false);
  }, []);

  /**
   * Limpia la ubicación guardada por completo.
   */
  const clearLocation = useCallback(() => {
    setBuyerState("");
    setLocationMethod(null);
    setDetectedState(null);
    setDetectionError(null);
    localStorage.removeItem("buyer_state");
    localStorage.removeItem("location_method");
  }, []);

  /**
   * Resetea el estado de detección (para reintentar).
   */
  const resetDetection = useCallback(() => {
    setDetectionError(null);
    setDetectedState(null);
    setIsDetecting(false);
  }, []);

  const contextValue = useMemo(() => ({
    // ─── Existentes (compatibilidad total) ───
    buyerState,
    setBuyerState,

    // ─── Nuevos estados ───
    isDetecting,
    detectionError,
    locationMethod,
    detectedState,
    shouldShowPrompt,

    // ─── Nuevas funciones ───
    detectLocation,
    confirmDetectedLocation,
    setManualLocation,
    dismissPrompt,
    clearLocation,
    resetDetection,
  }), [buyerState, isDetecting, detectionError, locationMethod, detectedState, shouldShowPrompt, detectLocation, confirmDetectedLocation, setManualLocation, dismissPrompt, clearLocation, resetDetection]);

  return (
    <LocationContext.Provider value={contextValue}>
      {children}
    </LocationContext.Provider>
  );
}

LocationProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
