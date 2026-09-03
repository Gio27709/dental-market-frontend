import api, { getTrendingAPI, getCategoriesAPI } from "./api";

// Peticiones que muchos componentes públicos piden a la vez en cada página
// (configuración de la plataforma y tendencias). Antes cada componente hacía la
// suya: en Inicio salían 3 de configuración y 4 de tendencias. Aquí se comparte
// una sola promesa por clave durante TTL_MS, así una carga completa gasta 1 + 1.
// La respuesta es la misma de axios, para que los llamadores no cambien su lectura.

const TTL_MS = 60 * 1000;
const cache = new Map(); // clave -> { promise, at }

function shared(key, factory) {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.promise;
  const promise = factory().catch((err) => {
    cache.delete(key); // un fallo no se cachea: el siguiente vuelve a intentar
    throw err;
  });
  cache.set(key, { promise, at: Date.now() });
  return promise;
}

export const getPlatformSettingsShared = () =>
  shared("settings", () => api.get("/admin/settings"));

// Una sola llamada trae productos y categorías (el backend calcula ambas siempre).
// La clave incluye el estado del comprador porque el ranking de productos es geográfico.
export const getTrendingShared = (buyerState) => {
  const state = buyerState ?? localStorage.getItem("buyer_state") ?? "";
  return shared(`trending:${state}`, () =>
    getTrendingAPI({ prod_limit: 8, cat_limit: 7, buyer_state: state }),
  );
};

// Categorías: las piden la cabecera y el bloque de más vendidos en cada carga.
export const getCategoriesShared = () => shared("categories", () => getCategoriesAPI());

// Para cuando el admin guarde un ajuste y quiera verlo al instante en la parte pública.
export const invalidatePlatformSettingsShared = () => cache.delete("settings");
