import { useState, useEffect, useCallback } from "react";

/**
 * Carga los datos de una pestaña analítica y expone estado de carga, error y recarga.
 * `fetcher` debe ser una referencia estable (una función exportada de services/api).
 */
export default function useAnalyticsTabData(fetcher, period) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(
    async (isRefresh = false) => {
      setLoading(true);
      setError(null);
      try {
        const params = { period };
        if (isRefresh) params.refresh = "true";
        const res = await fetcher(params);
        if (res.data?.success) setData(res.data.data);
      } catch (err) {
        setError(err.response?.data?.error || err.message || "Error obteniendo los datos.");
      } finally {
        setLoading(false);
      }
    },
    [fetcher, period]
  );

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, reload: load };
}
