import { useCallback, useEffect, useRef } from "react";
import { trackPostOnce } from "../services/tracking";

/**
 * Mide el ALCANCE de las publicaciones del feed: cuenta una impresión cuando
 * una tarjeta estuvo de verdad en pantalla, no cuando se renderizó.
 *
 * Dos métricas distintas y a propósito (decisión del usuario, 2026-08-20):
 *  - `post_impression`: apareció en pantalla al menos DWELL_MS. Es el alcance.
 *  - `post_view`: la persona la abrió (desplegar texto, abrir comentarios o
 *    entrar a /news/:id). Es el interés real. Lo emiten las páginas, no este hook.
 *
 * El observador se crea perezosamente en el propio callback de ref porque los
 * refs se asignan ANTES de que corran los efectos: crearlo en un useEffect
 * dejaba sin observar a las tarjetas del primer render.
 */
const DWELL_MS = 1000;
// Una tarjeta con imagen mide ~600-900 px y el viewport ronda los 800: con un
// cuarto visible ya se está leyendo. Umbrales más altos no se alcanzan nunca en
// las publicaciones largas, que son justo las que más importan.
const VISIBLE_RATIO = 0.25;

export function usePostImpressions(surface = "feed") {
  const observer = useRef(null);
  const timers = useRef(new Map());
  const surfaceRef = useRef(surface);
  surfaceRef.current = surface;

  const getObserver = useCallback(() => {
    if (observer.current || typeof IntersectionObserver === "undefined") return observer.current;

    observer.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const postId = entry.target.dataset.postId;
          if (!postId) return;

          if (entry.isIntersecting) {
            if (timers.current.has(postId)) return;
            timers.current.set(
              postId,
              setTimeout(() => {
                timers.current.delete(postId);
                trackPostOnce("post_impression", postId, { surface: surfaceRef.current });
                // Ya contada: dejar de vigilarla ahorra trabajo en scroll largo.
                observer.current?.unobserve(entry.target);
              }, DWELL_MS)
            );
          } else {
            clearTimeout(timers.current.get(postId));
            timers.current.delete(postId);
          }
        });
      },
      { threshold: VISIBLE_RATIO }
    );
    return observer.current;
  }, []);

  useEffect(() => {
    const pending = timers.current;
    return () => {
      observer.current?.disconnect();
      observer.current = null;
      pending.forEach((t) => clearTimeout(t));
      pending.clear();
    };
  }, []);

  /** Ref callback para cada tarjeta. El elemento debe llevar data-post-id. */
  return useCallback(
    (el) => {
      if (!el) return;
      getObserver()?.observe(el);
    },
    [getObserver]
  );
}
