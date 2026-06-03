/**
 * venezuelaGeoData.js
 * 
 * Datos geográficos de los 24 estados de Venezuela para geocodificación
 * inversa offline (coordenadas GPS → nombre de estado).
 * 
 * Cada estado incluye:
 * - Bounding box (north, south, east, west) en grados decimales
 * - Centroid (punto central) para cálculo de distancia como fallback
 * 
 * Convención de signos:
 * - Latitudes: positivas (hemisferio norte)
 * - Longitudes: negativas (oeste de Greenwich)
 */

export const VENEZUELA_GEO_DATA = [
  {
    name: "Distrito Capital",
    north: 10.55, south: 10.39,
    east: -66.72, west: -67.02,
    centroid: { lat: 10.4806, lng: -66.9036 }
  },
  {
    name: "Miranda",
    north: 10.60, south: 10.02,
    east: -65.50, west: -67.16,
    centroid: { lat: 10.25, lng: -66.42 }
  },
  {
    name: "La Guaira",
    north: 10.65, south: 10.50,
    east: -66.55, west: -67.20,
    centroid: { lat: 10.59, lng: -66.93 }
  },
  {
    name: "Aragua",
    north: 10.45, south: 9.88,
    east: -66.72, west: -67.88,
    centroid: { lat: 10.18, lng: -67.28 }
  },
  {
    name: "Carabobo",
    north: 10.43, south: 9.87,
    east: -67.75, west: -68.35,
    centroid: { lat: 10.12, lng: -68.01 }
  },
  {
    name: "Zulia",
    north: 11.80, south: 8.40,
    east: -70.70, west: -72.50,
    centroid: { lat: 10.07, lng: -71.64 }
  },
  {
    name: "Lara",
    north: 10.80, south: 9.42,
    east: -69.10, west: -70.48,
    centroid: { lat: 10.07, lng: -69.86 }
  },
  {
    name: "Falcón",
    north: 12.20, south: 10.30,
    east: -68.20, west: -71.30,
    centroid: { lat: 11.18, lng: -69.86 }
  },
  {
    name: "Yaracuy",
    north: 10.55, south: 9.80,
    east: -68.35, west: -69.30,
    centroid: { lat: 10.08, lng: -68.73 }
  },
  {
    name: "Portuguesa",
    north: 9.80, south: 8.50,
    east: -68.50, west: -70.20,
    centroid: { lat: 9.08, lng: -69.10 }
  },
  {
    name: "Cojedes",
    north: 9.95, south: 8.90,
    east: -67.95, west: -68.90,
    centroid: { lat: 9.38, lng: -68.33 }
  },
  {
    name: "Barinas",
    north: 9.20, south: 7.48,
    east: -68.90, west: -71.40,
    centroid: { lat: 8.63, lng: -70.21 }
  },
  {
    name: "Mérida",
    north: 9.25, south: 8.20,
    east: -70.50, west: -71.90,
    centroid: { lat: 8.60, lng: -71.14 }
  },
  {
    name: "Trujillo",
    north: 9.85, south: 9.00,
    east: -69.80, west: -70.90,
    centroid: { lat: 9.37, lng: -70.44 }
  },
  {
    name: "Táchira",
    north: 8.60, south: 7.35,
    east: -71.30, west: -72.50,
    centroid: { lat: 7.77, lng: -72.23 }
  },
  {
    name: "Apure",
    north: 8.10, south: 6.20,
    east: -67.40, west: -72.30,
    centroid: { lat: 7.04, lng: -69.74 }
  },
  {
    name: "Guárico",
    north: 9.80, south: 7.70,
    east: -65.20, west: -68.00,
    centroid: { lat: 8.75, lng: -66.24 }
  },
  {
    name: "Anzoátegui",
    north: 10.25, south: 7.80,
    east: -63.80, west: -65.60,
    centroid: { lat: 8.59, lng: -64.62 }
  },
  {
    name: "Sucre",
    north: 10.75, south: 10.00,
    east: -62.20, west: -64.30,
    centroid: { lat: 10.45, lng: -63.25 }
  },
  {
    name: "Monagas",
    north: 10.18, south: 8.35,
    east: -62.25, west: -63.90,
    centroid: { lat: 9.30, lng: -63.18 }
  },
  {
    name: "Nueva Esparta",
    north: 11.18, south: 10.82,
    east: -63.48, west: -64.42,
    centroid: { lat: 11.00, lng: -63.91 }
  },
  {
    name: "Bolívar",
    north: 8.50, south: 3.80,
    east: -60.10, west: -65.50,
    centroid: { lat: 6.42, lng: -63.27 }
  },
  {
    name: "Delta Amacuro",
    north: 10.05, south: 7.80,
    east: -59.80, west: -62.80,
    centroid: { lat: 8.85, lng: -61.25 }
  },
  {
    name: "Amazonas",
    north: 6.20, south: 0.65,
    east: -63.30, west: -67.80,
    centroid: { lat: 3.42, lng: -65.85 }
  }
];

/**
 * Límites geográficos generales de Venezuela.
 * Usado para verificar rápidamente si un punto está en el país.
 */
const VENEZUELA_BOUNDS = {
  north: 12.50,
  south: 0.50,
  east: -59.50,
  west: -73.00
};

/**
 * Calcula la distancia entre dos puntos geográficos usando la fórmula Haversine.
 * Devuelve la distancia en kilómetros.
 * 
 * Se usa como fallback cuando las coordenadas GPS no caen exactamente
 * dentro de ningún bounding box (ej: zonas fronterizas entre estados).
 * 
 * @param {number} lat1 - Latitud del punto 1
 * @param {number} lng1 - Longitud del punto 1
 * @param {number} lat2 - Latitud del punto 2
 * @param {number} lng2 - Longitud del punto 2
 * @returns {number} Distancia en kilómetros
 */
function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Radio de la Tierra en km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Convierte grados a radianes.
 */
function toRad(deg) {
  return deg * (Math.PI / 180);
}

/**
 * Verifica si un punto (lat, lng) está dentro de los límites de Venezuela.
 * 
 * @param {number} lat - Latitud
 * @param {number} lng - Longitud
 * @returns {boolean}
 */
export function isInVenezuela(lat, lng) {
  return (
    lat >= VENEZUELA_BOUNDS.south &&
    lat <= VENEZUELA_BOUNDS.north &&
    lng >= VENEZUELA_BOUNDS.west &&
    lng <= VENEZUELA_BOUNDS.east
  );
}

/**
 * Dado un punto GPS (lat, lng), determina el estado de Venezuela.
 * 
 * Algoritmo:
 * 1. Verifica que el punto esté dentro de Venezuela
 * 2. Busca en qué bounding box cae el punto (match exacto)
 * 3. Si hay múltiples matches (zonas superpuestas), elige el más específico
 *    (el que tiene el bounding box más pequeño → estado más pequeño)
 * 4. Si no hay match exacto, calcula distancia al centroid más cercano
 * 
 * @param {number} lat - Latitud del punto GPS
 * @param {number} lng - Longitud del punto GPS
 * @returns {string|null} Nombre del estado, o null si no está en Venezuela
 */
export function resolveStateFromCoords(lat, lng) {
  // Paso 0: Verificar que estemos en Venezuela
  if (!isInVenezuela(lat, lng)) {
    return null;
  }

  // Paso 1: Búsqueda por bounding box
  const matches = VENEZUELA_GEO_DATA.filter(state =>
    lat <= state.north &&
    lat >= state.south &&
    lng <= state.east &&
    lng >= state.west
  );

  // Si hay exactamente 1 match → perfecto
  if (matches.length === 1) {
    return matches[0].name;
  }

  // Si hay múltiples matches (bounding boxes superpuestos),
  // elegimos el que tiene el área más pequeña (más específico).
  // Ej: Distrito Capital es mucho más pequeño que Miranda,
  // así que si cae en ambos, elegimos Distrito Capital.
  if (matches.length > 1) {
    const withArea = matches.map(state => ({
      ...state,
      area: (state.north - state.south) * Math.abs(state.east - state.west)
    }));
    withArea.sort((a, b) => a.area - b.area);
    return withArea[0].name;
  }

  // Paso 2: Fallback — centroid más cercano (Haversine)
  let closest = null;
  let minDist = Infinity;

  for (const state of VENEZUELA_GEO_DATA) {
    const dist = haversineDistance(lat, lng, state.centroid.lat, state.centroid.lng);
    if (dist < minDist) {
      minDist = dist;
      closest = state;
    }
  }

  // Solo asignar si el centroid más cercano está a menos de 150km
  // (evitar asignaciones absurdas en zonas remotas)
  if (closest && minDist < 150) {
    return closest.name;
  }

  return null;
}
