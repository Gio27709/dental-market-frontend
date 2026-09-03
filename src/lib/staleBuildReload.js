// Tras cada despliegue los archivos del build cambian de nombre. Una pestaña que ya tenía
// cargada la versión anterior pide archivos que ya no existen y el import dinámico falla.
// La solución correcta es recargar una vez para traer el index.html nuevo.

const KEY = "forcepx:recarga-por-build-nuevo";

const PATRONES = [
  /Failed to fetch dynamically imported module/i,
  /Importing a module script failed/i,
  /error loading dynamically imported module/i,
  /Unable to preload CSS/i,
];

export function esErrorDeBuildViejo(error) {
  const texto = String(error?.message || error || "");
  return PATRONES.some((re) => re.test(texto));
}

// Devuelve true si recargó. Solo recarga una vez por pestaña para no entrar en bucle
// si el archivo falta de verdad.
export function recargarSiBuildViejo(error) {
  if (!esErrorDeBuildViejo(error)) return false;
  try {
    if (sessionStorage.getItem(KEY)) return false;
    sessionStorage.setItem(KEY, String(Date.now()));
  } catch {
    // sin sessionStorage (modo privado estricto) se recarga igual una vez
  }
  window.location.reload();
  return true;
}

// true si el error es de build viejo y todavía no se ha intentado la recarga (sin efectos).
export function recargaPendiente(error) {
  if (!esErrorDeBuildViejo(error)) return false;
  try {
    return !sessionStorage.getItem(KEY);
  } catch {
    return true;
  }
}

// Vite avisa con este evento cuando falla la precarga de un chunk o su CSS.
export function instalarRecargaPorBuildViejo() {
  window.addEventListener("vite:preloadError", (event) => {
    if (recargarSiBuildViejo(event?.payload || event)) event.preventDefault();
  });
  try {
    // Si la recarga anterior funcionó, limpiamos el candado para el próximo despliegue.
    const marca = Number(sessionStorage.getItem(KEY) || 0);
    if (marca && Date.now() - marca > 60_000) sessionStorage.removeItem(KEY);
  } catch {
    // ignorar
  }
}
