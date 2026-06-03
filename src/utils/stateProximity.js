/**
 * stateProximity.js — Motor de Proximidad Geográfica para Venezuela (Frontend)
 *
 * Versión client-side del módulo de proximidad.
 * Proporciona las mismas funciones que el backend para:
 * - Geo-sort client-side en StoreCatalog
 * - Badges de proximidad en ProductCard/ProductRow
 * - Sort por "Cercanía" en el catálogo
 *
 * IMPORTANTE: Este módulo DEBE mantenerse sincronizado con:
 *   backend/src/utils/stateProximity.js
 */

// ─────────────────────────────────────────────────────────────
// MAPA DE ADYACENCIA — Fronteras reales de Venezuela
// Cada estado lista sus vecinos directos (comparten frontera)
// ─────────────────────────────────────────────────────────────
export const STATE_ADJACENCY = {
  "Distrito Capital": ["Miranda", "La Guaira"],
  "La Guaira":        ["Distrito Capital", "Miranda", "Aragua"],
  "Miranda":          ["Distrito Capital", "La Guaira", "Aragua", "Guarico", "Anzoategui"],
  "Aragua":           ["La Guaira", "Miranda", "Carabobo", "Guarico", "Cojedes"],
  "Carabobo":         ["Aragua", "Yaracuy", "Cojedes", "Falcon"],
  "Yaracuy":          ["Carabobo", "Falcon", "Lara", "Portuguesa", "Cojedes"],
  "Falcon":           ["Carabobo", "Yaracuy", "Lara", "Zulia"],
  "Lara":             ["Falcon", "Yaracuy", "Portuguesa", "Trujillo", "Zulia"],
  "Zulia":            ["Falcon", "Lara", "Trujillo", "Merida", "Tachira"],
  "Trujillo":         ["Lara", "Portuguesa", "Barinas", "Merida", "Zulia"],
  "Merida":           ["Zulia", "Trujillo", "Barinas", "Tachira"],
  "Tachira":          ["Zulia", "Merida", "Barinas", "Apure"],
  "Barinas":          ["Trujillo", "Portuguesa", "Cojedes", "Guarico", "Apure", "Merida", "Tachira"],
  "Portuguesa":       ["Yaracuy", "Lara", "Trujillo", "Barinas", "Cojedes"],
  "Cojedes":          ["Aragua", "Carabobo", "Yaracuy", "Portuguesa", "Barinas", "Guarico"],
  "Guarico":          ["Miranda", "Aragua", "Cojedes", "Barinas", "Apure", "Anzoategui", "Bolivar"],
  "Apure":            ["Tachira", "Barinas", "Guarico", "Bolivar", "Amazonas"],
  "Anzoategui":       ["Miranda", "Guarico", "Sucre", "Monagas", "Bolivar"],
  "Sucre":            ["Anzoategui", "Monagas", "Nueva Esparta"],
  "Monagas":          ["Anzoategui", "Sucre", "Delta Amacuro", "Bolivar"],
  "Nueva Esparta":    ["Sucre"],
  "Bolivar":          ["Guarico", "Anzoategui", "Monagas", "Delta Amacuro", "Apure", "Amazonas"],
  "Delta Amacuro":    ["Monagas", "Bolivar"],
  "Amazonas":         ["Bolivar", "Apure"],
};

// ─────────────────────────────────────────────────────────────
// SCORES y LABELS
// ─────────────────────────────────────────────────────────────
const PROXIMITY_SCORES = { 0: 1.0, 1: 0.8, 2: 0.5, 3: 0.3 };
const DEFAULT_SCORE = 0.1;

const PROXIMITY_LABELS = {
  0: "same_state",    // "En tu estado"
  1: "neighbor",      // "Cerca de ti"
  2: "regional",      // "En tu región"
  3: "distant",       // "Envío desde [Estado]"
};
const DEFAULT_LABEL = "distant";

// ─────────────────────────────────────────────────────────────
// Textos en español para los labels (uso directo en UI)
// ─────────────────────────────────────────────────────────────
export const PROXIMITY_DISPLAY_TEXT = {
  same_state: "En tu estado",
  neighbor:   "Cerca de ti",
  regional:   "En tu región",
  distant:    "",  // No mostrar badge para lejanos (reduce ruido visual)
};

/**
 * Canonicalizes any arbitrary state name string into the official accented, capitalized form.
 * Handles case sensitivity, trimming, and strips diacritics/accents.
 *
 * @param {string} state - The state name to canonicalize
 * @returns {string|null} The canonical state name, or null if not found
 */
export function getCanonicalStateName(state) {
  if (!state || typeof state !== "string") return null;
  const normalizedInput = state
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  const canonicalStates = Object.keys(STATE_ADJACENCY);
  for (const s of canonicalStates) {
    const normalizedCanonical = s
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    if (normalizedCanonical === normalizedInput) {
      return s;
    }
  }
  return null;
}

/**
 * Calcula la distancia en "saltos" (BFS) entre dos estados.
 *
 * @param {string} fromState - Estado de origen (comprador)
 * @param {string} toState   - Estado de destino (tienda)
 * @returns {number} Número de saltos (0 = mismo estado, -1 = no encontrado)
 */
export function getHopDistance(fromState, toState) {
  const canonicalFrom = getCanonicalStateName(fromState);
  const canonicalTo = getCanonicalStateName(toState);

  if (!canonicalFrom || !canonicalTo) return -1;
  if (canonicalFrom === canonicalTo) return 0;

  const visited = new Set([canonicalFrom]);
  let queue = [canonicalFrom];
  let level = 0;
  const maxDepth = 6;

  while (queue.length > 0 && level < maxDepth) {
    level++;
    const nextQueue = [];

    for (const current of queue) {
      const neighbors = STATE_ADJACENCY[current];
      if (!neighbors) continue;

      for (const neighbor of neighbors) {
        if (neighbor === canonicalTo) return level;
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          nextQueue.push(neighbor);
        }
      }
    }

    queue = nextQueue;
  }

  return -1;
}

/**
 * Calcula el score de proximidad (0.0 – 1.0) entre dos estados.
 *
 * @param {string} buyerState  - Estado del comprador
 * @param {string} storeState  - Estado de la tienda
 * @returns {number} Score: 1.0 (mismo estado) → 0.1 (lejos)
 */
export function getProximityScore(buyerState, storeState) {
  if (!buyerState || !storeState) return 0;

  const hops = getHopDistance(buyerState, storeState);

  if (hops === -1) return DEFAULT_SCORE;
  if (hops in PROXIMITY_SCORES) return PROXIMITY_SCORES[hops];
  return DEFAULT_SCORE;
}

/**
 * Retorna la etiqueta de proximidad para uso en la UI.
 *
 * @param {string} buyerState  - Estado del comprador
 * @param {string} storeState  - Estado de la tienda
 * @returns {string} Label: "same_state" | "neighbor" | "regional" | "distant"
 */
export function getProximityLabel(buyerState, storeState) {
  if (!buyerState || !storeState) return "";

  const hops = getHopDistance(buyerState, storeState);

  if (hops === -1) return DEFAULT_LABEL;
  if (hops in PROXIMITY_LABELS) return PROXIMITY_LABELS[hops];
  return DEFAULT_LABEL;
}

/**
 * Retorna el texto en español para mostrar en la UI.
 *
 * @param {string} buyerState  - Estado del comprador
 * @param {string} storeState  - Estado de la tienda
 * @returns {string} Texto legible: "En tu estado", "Cerca de ti", etc.
 */
export function getProximityDisplayText(buyerState, storeState) {
  const label = getProximityLabel(buyerState, storeState);
  return PROXIMITY_DISPLAY_TEXT[label] || "";
}

/**
 * Retorna todos los estados ordenados por proximidad a un estado dado.
 *
 * @param {string} originState - Estado de origen
 * @returns {Array<{state: string, hops: number, score: number, label: string}>}
 */
export function getStatesOrderedByProximity(originState) {
  const canonicalOrigin = getCanonicalStateName(originState);
  if (!canonicalOrigin || !STATE_ADJACENCY[canonicalOrigin]) return [];

  const allStates = Object.keys(STATE_ADJACENCY);
  const results = allStates.map((state) => {
    const hops = getHopDistance(canonicalOrigin, state);
    return {
      state,
      hops: hops === -1 ? 99 : hops,
      score: getProximityScore(canonicalOrigin, state),
      label: getProximityLabel(canonicalOrigin, state),
    };
  });

  results.sort((a, b) => a.hops - b.hops);
  return results;
}

/**
 * Retorna solo los estados vecinos directos (1 salto) de un estado.
 *
 * @param {string} state - Estado de origen
 * @returns {string[]} Lista de estados vecinos
 */
export function getNeighborStates(state) {
  const canonicalState = getCanonicalStateName(state);
  return STATE_ADJACENCY[canonicalState] || [];
}

/**
 * Retorna estados dentro de un radio de N saltos.
 *
 * @param {string} originState - Estado de origen
 * @param {number} maxHops     - Máximo número de saltos (default: 2)
 * @returns {string[]} Lista de estados dentro del radio
 */
export function getStatesWithinRadius(originState, maxHops = 2) {
  const canonicalOrigin = getCanonicalStateName(originState);
  if (!canonicalOrigin || !STATE_ADJACENCY[canonicalOrigin]) return [];

  const visited = new Set([canonicalOrigin]);
  let queue = [canonicalOrigin];
  let level = 0;

  while (queue.length > 0 && level < maxHops) {
    level++;
    const nextQueue = [];

    for (const current of queue) {
      const neighbors = STATE_ADJACENCY[current];
      if (!neighbors) continue;

      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          nextQueue.push(neighbor);
        }
      }
    }

    queue = nextQueue;
  }

  return Array.from(visited);
}
