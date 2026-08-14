import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { initTracking, trackPageView } from "../services/tracking";

/**
 * Emite un page_view en cada cambio de ruta. Debe usarse dentro del Router.
 *
 * Se envía solo el pathname, sin query string: los parámetros de búsqueda pueden contener
 * tokens de recuperación de contraseña o datos personales que no deben quedar en la BD.
 */
export function usePageTracking() {
  const { pathname } = useLocation();
  const lastPath = useRef(null);

  useEffect(() => {
    initTracking();
  }, []);

  useEffect(() => {
    // React puede re-renderizar sin que la ruta cambie realmente (p. ej. StrictMode en dev).
    if (lastPath.current === pathname) return;
    lastPath.current = pathname;
    trackPageView(pathname);
  }, [pathname]);
}
