import { useEffect, useRef } from "react";
import { track } from "../services/tracking";

/**
 * Emite un evento `search` (o `search_no_results`) una sola vez por término.
 *
 * Espera a que término y conteo dejen de cambiar antes de emitir: el filtrado
 * resuelve un render después del cambio de término, y sin esta pausa se
 * registraría el conteo de la búsqueda anterior.
 */
export default function useSearchTracking(query, resultsCount, isLoading) {
  const lastTracked = useRef(null);

  useEffect(() => {
    const term = (query || "").trim();
    if (!term || isLoading) return;

    const key = term.toLowerCase();
    if (lastTracked.current === key) return;

    const timer = setTimeout(() => {
      lastTracked.current = key;
      track(resultsCount > 0 ? "search" : "search_no_results", {
        search_query: term,
        results_count: resultsCount,
      });
    }, 600);

    return () => clearTimeout(timer);
  }, [query, resultsCount, isLoading]);
}
