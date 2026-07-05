/**
 * geolocationService.js
 * 
 * Servicio de geolocalización del navegador para Forcepx.
 * Encapsula la lógica de:
 * - Verificar soporte del navegador
 * - Solicitar permisos GPS al usuario
 * - Obtener coordenadas (lat/lng)
 * - Mapear coordenadas → estado de Venezuela (offline)
 * 
 * No depende de APIs externas. Toda la resolución es local
 * usando los bounding boxes de venezuelaGeoData.js.
 */

import { resolveStateFromCoords, isInVenezuela } from "../utils/venezuelaGeoData";

/**
 * Códigos de error internos del servicio.
 * Cada uno tiene un mensaje amigable para el usuario en español.
 */
export const GEO_ERRORS = {
  NOT_SUPPORTED: {
    code: "NOT_SUPPORTED",
    message: "Tu navegador no soporta la detección de ubicación. Elige tu estado manualmente."
  },
  PERMISSION_DENIED: {
    code: "PERMISSION_DENIED",
    message: "No se otorgó permiso de ubicación. Puedes elegir tu estado manualmente."
  },
  UNAVAILABLE: {
    code: "UNAVAILABLE",
    message: "No se pudo obtener la ubicación. Intenta elegir tu estado manualmente."
  },
  TIMEOUT: {
    code: "TIMEOUT",
    message: "La detección de ubicación tardó demasiado. Elige tu estado manualmente."
  },
  NOT_IN_VENEZUELA: {
    code: "NOT_IN_VENEZUELA",
    message: "Tu ubicación no parece estar en Venezuela. Elige tu estado manualmente."
  },
  UNKNOWN: {
    code: "UNKNOWN",
    message: "Ocurrió un error inesperado. Elige tu estado manualmente."
  }
};

/**
 * Verifica si el navegador soporta la API de Geolocalización.
 * 
 * @returns {boolean} true si el navegador tiene navigator.geolocation
 */
export function checkGeolocationSupport() {
  return "geolocation" in navigator;
}

/**
 * Solicita la ubicación GPS al usuario.
 * El navegador mostrará el diálogo nativo:
 * "[Sitio] quiere saber tu ubicación — Permitir / Bloquear"
 * 
 * @param {Object} options - Opciones de configuración
 * @param {number} options.timeout - Tiempo máximo de espera en ms (default: 10000)
 * @param {boolean} options.highAccuracy - Si pedir precisión alta (default: false)
 * @returns {Promise<{lat: number, lng: number}>} Coordenadas del usuario
 * @throws {Object} Error con código del GEO_ERRORS
 */
export function requestUserLocation({ timeout = 10000, highAccuracy = false } = {}) {
  return new Promise((resolve, reject) => {
    // Verificar soporte
    if (!checkGeolocationSupport()) {
      reject(GEO_ERRORS.NOT_SUPPORTED);
      return;
    }

    // Solicitar ubicación — esto dispara el prompt nativo del navegador:
    // "[ejemplo.com] quiere saber tu ubicación"
    // [Permitir] [Bloquear]
    navigator.geolocation.getCurrentPosition(
      // ─── Éxito: usuario aceptó y el GPS respondió ───
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy // metros de precisión
        });
      },
      // ─── Error: usuario rechazó o el GPS falló ───
      (error) => {
        switch (error.code) {
          case 1: // PERMISSION_DENIED
            reject(GEO_ERRORS.PERMISSION_DENIED);
            break;
          case 2: // POSITION_UNAVAILABLE
            reject(GEO_ERRORS.UNAVAILABLE);
            break;
          case 3: // TIMEOUT
            reject(GEO_ERRORS.TIMEOUT);
            break;
          default:
            console.error("GeoLocation Error:", error);
            reject(GEO_ERRORS.UNKNOWN);
        }
      },
      // ─── Opciones ───
      {
        enableHighAccuracy: highAccuracy,
        timeout: timeout,
        maximumAge: 300000 // 5 minutos — cachear la posición
      }
    );
  });
}

/**
 * Función principal del servicio.
 * Detecta automáticamente el estado de Venezuela donde se encuentra el usuario.
 * 
 * Flujo:
 * 1. Verifica soporte del navegador
 * 2. Pide permiso GPS (prompt nativo del browser)
 * 3. Obtiene coordenadas
 * 4. Convierte coordenadas → estado (offline, sin API)
 * 5. Retorna resultado
 * 
 * @returns {Promise<Object>} Resultado de la detección
 * 
 * @example
 * // Éxito:
 * { success: true, state: "Distrito Capital", coords: { lat: 10.48, lng: -66.90 } }
 * 
 * // Error:
 * { success: false, error: { code: "PERMISSION_DENIED", message: "..." } }
 */
export async function detectUserState() {
  try {
    // Paso 1-2: Pedir ubicación (el browser muestra el prompt nativo)
    const coords = await requestUserLocation({
      timeout: 15000,      // 15 segundos máximo
      highAccuracy: false   // No necesitamos GPS preciso, solo nivel estado
    });

    // Paso 3: Verificar que las coordenadas estén en Venezuela
    if (!isInVenezuela(coords.lat, coords.lng)) {
      return {
        success: false,
        error: GEO_ERRORS.NOT_IN_VENEZUELA,
        coords
      };
    }

    // Paso 4: Resolver coordenadas → nombre de estado
    const stateName = resolveStateFromCoords(coords.lat, coords.lng);

    if (!stateName) {
      return {
        success: false,
        error: GEO_ERRORS.NOT_IN_VENEZUELA,
        coords
      };
    }

    // Paso 5: Éxito
    return {
      success: true,
      state: stateName,
      coords: {
        lat: coords.lat,
        lng: coords.lng
      }
    };

  } catch (geoError) {
    // El usuario rechazó, timeout, o sin soporte
    return {
      success: false,
      error: geoError?.code ? geoError : GEO_ERRORS.UNKNOWN
    };
  }
}
