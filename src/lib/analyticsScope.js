/**
 * Interruptor «Solo tiendas reales» de las analíticas (excluye las marcadas como prueba).
 *
 * Se guarda por navegador y lo lee el interceptor de `services/api.js`, que añade
 * `exclude_test=true` a toda petición de /admin/analytics. El backend lo traduce al filtro de
 * tiendas, así que solo tiene efecto en las pestañas que se acotan por tienda (Resumen
 * ejecutivo, Finanzas, Ventas, Logística y el drill-down).
 */
const KEY = "fx_analytics_real_only";
const EVENTO = "fx-analytics-scope";

export const getRealStoresOnly = () => {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
};

export const setRealStoresOnly = (valor) => {
  try {
    if (valor) localStorage.setItem(KEY, "1");
    else localStorage.removeItem(KEY);
  } catch {
    /* sin almacenamiento: el interruptor solo dura lo que dure la página */
  }
  window.dispatchEvent(new CustomEvent(EVENTO, { detail: { realOnly: !!valor } }));
};

export const onRealStoresOnlyChange = (fn) => {
  const handler = (e) => fn(!!e.detail?.realOnly);
  window.addEventListener(EVENTO, handler);
  return () => window.removeEventListener(EVENTO, handler);
};
