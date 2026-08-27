import { useState, useEffect, useMemo, useCallback } from "react";
import api from "../services/api";
import { PAYMENT_METHODS_RESPALDO } from "../utils/constants";

/**
 * Métodos de cobro, leídos de `global_settings.payment_methods` y editables desde
 * /admin/payment-methods.
 *
 * Sigue el mismo patrón que `useHomeSections`: un almacén a nivel de módulo con sus
 * suscriptores, para que las cinco o seis pantallas que lo piden a la vez (footer, checkout,
 * comprobante, filtros de admin) compartan una sola petición en vez de disparar una cada una.
 *
 * El endpoint es `/admin/settings`, el mismo que `Footer.jsx` y `Checkout.jsx` ya llamaban
 * por otras claves. Este hook hace su propia llamada, pero UNA por carga fría como mucho:
 * los consumidores la comparten y el resultado se cachea 3 minutos en localStorage, así que
 * la navegación normal no pide nada. Contrapartida a tener presente: un cambio hecho en el
 * panel tarda hasta esos 3 minutos en verse en un navegador que ya estaba abierto.
 *
 * El backend devuelve cosas distintas según quién pregunte: al admin le manda todos los
 * métodos, a los demás solo los activos. Da igual para el checkout, porque `activos` vuelve
 * a filtrar por `activo` aquí en el cliente — la caché de un admin da el mismo resultado.
 */

const CACHE_KEY = "dental_market_payment_methods_cache";
const CACHE_TTL = 3 * 60 * 1000; // 3 minutos, igual que las secciones de la home

let globalMetodos = null;
let globalLoading = false;
let lastFetchedTimestamp = 0;
const listeners = new Set();

try {
  const cachedStr = localStorage.getItem(CACHE_KEY);
  if (cachedStr) {
    const cached = JSON.parse(cachedStr);
    if (Date.now() - cached.timestamp < CACHE_TTL && Array.isArray(cached.metodos)) {
      globalMetodos = cached.metodos;
      lastFetchedTimestamp = cached.timestamp;
    }
  }
} catch (e) {
  console.error("[usePaymentMethods] No se pudo leer la caché:", e);
}

const notify = () => {
  const estado = { metodos: globalMetodos, loading: globalLoading };
  listeners.forEach((l) => l(estado));
};

const fetchMetodos = async (force = false) => {
  if (globalLoading) return;
  if (!force && globalMetodos && Date.now() - lastFetchedTimestamp < CACHE_TTL) return;

  globalLoading = true;
  notify();

  try {
    const { data } = await api.get("/admin/settings");
    const bloque = data?.data?.payment_methods;
    const metodos = Array.isArray(bloque?.metodos) ? bloque.metodos : null;

    if (metodos && metodos.length > 0) {
      globalMetodos = metodos;
      lastFetchedTimestamp = Date.now();
      try {
        localStorage.setItem(
          CACHE_KEY,
          JSON.stringify({ timestamp: lastFetchedTimestamp, metodos })
        );
      } catch (e) {
        console.error("[usePaymentMethods] No se pudo guardar la caché:", e);
      }
    }
    // Si la clave no existe todavía (migración 070 sin aplicar), `globalMetodos` se queda
    // en null a propósito y el hook devuelve el respaldo de constants.js.
  } catch (err) {
    console.error("[usePaymentMethods] Error al cargar los métodos de pago:", err);
  } finally {
    globalLoading = false;
    notify();
  }
};

/** Fuerza una recarga. La usa el panel de admin justo después de guardar. */
export const refrescarMetodosDePago = () => {
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch {
    /* da igual: el force de abajo ignora la caché igualmente */
  }
  return fetchMetodos(true);
};

const RESPALDO_POR_CLAVE = PAYMENT_METHODS_RESPALDO.reduce((acc, m) => {
  acc[m.key] = m;
  return acc;
}, {});

export default function usePaymentMethods() {
  const [estado, setEstado] = useState(() => ({
    metodos: globalMetodos,
    loading: globalMetodos ? false : globalLoading,
  }));

  useEffect(() => {
    listeners.add(setEstado);

    const hayCache = globalMetodos !== null;
    const caducado = Date.now() - lastFetchedTimestamp >= CACHE_TTL;
    if ((!hayCache || caducado) && !globalLoading) {
      fetchMetodos();
    } else {
      setEstado({ metodos: globalMetodos, loading: globalLoading });
    }

    return () => {
      listeners.delete(setEstado);
    };
  }, []);

  const metodos = estado.metodos || PAYMENT_METHODS_RESPALDO;

  /**
   * Lo que se le puede ofrecer HOY a un comprador. Sale solo del servidor: si tirara del
   * respaldo, un método recién apagado seguiría apareciendo en el checkout hasta el
   * siguiente despliegue, que es justo lo que este trabajo viene a quitar de en medio.
   */
  const activos = useMemo(() => metodos.filter((m) => m.activo !== false), [metodos]);

  /**
   * Para RESOLVER un método, no para ofrecerlo. Mezcla el respaldo por debajo del servidor
   * para que un pedido histórico pagado con un método ya apagado siga teniendo nombre,
   * icono y tipo de formulario aunque el servidor ya no lo mande.
   */
  const byKey = useMemo(() => {
    const mapa = { ...RESPALDO_POR_CLAVE };
    metodos.forEach((m) => {
      mapa[m.key] = m;
    });
    return mapa;
  }, [metodos]);

  const etiquetaDe = useCallback((key) => byKey[key]?.label || key || "—", [byKey]);

  return { metodos, activos, byKey, etiquetaDe, loading: estado.loading };
}
