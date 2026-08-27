/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useEffect, useContext, useCallback, useRef, useMemo } from "react";
import PropTypes from "prop-types";
import { getMyProductRatingsAPI, rateProductAPI } from "../services/api";
import { useAuth } from "./AuthContext";

const RatingContext = createContext();

// Las tarjetas piden su calificación de a una. En vez de disparar una petición por
// tarjeta, se juntan las que llegan en esta ventana y sale una sola al servidor.
const BATCH_MS = 60;
// El backend acepta 60 por consulta; aquí se corta igual para no armar URLs enormes.
const BATCH_MAX = 60;

export const RatingProvider = ({ children }) => {
  const { user } = useAuth();
  // productId -> { rating, review_id, can_review }
  const [ratings, setRatings] = useState({});
  const pending = useRef(new Set());
  const asked = useRef(new Set());
  const timer = useRef(null);

  // Al cerrar sesión se olvida todo: las notas son de cada persona.
  useEffect(() => {
    if (!user) {
      setRatings({});
      asked.current.clear();
      pending.current.clear();
      if (timer.current) {
        clearTimeout(timer.current);
        timer.current = null;
      }
    }
  }, [user]);

  useEffect(() => () => timer.current && clearTimeout(timer.current), []);

  const flush = useCallback(async () => {
    timer.current = null;
    const ids = [...pending.current].slice(0, BATCH_MAX);
    ids.forEach((id) => pending.current.delete(id));

    if (ids.length === 0) return;

    try {
      const res = await getMyProductRatingsAPI(ids);
      const data = res.data?.data || {};
      setRatings((prev) => ({ ...prev, ...data }));
    } catch {
      // Que se pueda reintentar si vuelve a aparecer la tarjeta.
      ids.forEach((id) => asked.current.delete(id));
    }

    // Quedaron ids fuera del lote (más de BATCH_MAX): van en la siguiente tanda.
    if (pending.current.size > 0 && !timer.current) {
      timer.current = setTimeout(flush, BATCH_MS);
    }
  }, []);

  const requestRating = useCallback(
    (productId) => {
      if (!user || !productId || asked.current.has(productId)) return;
      asked.current.add(productId);
      pending.current.add(productId);
      if (!timer.current) timer.current = setTimeout(flush, BATCH_MS);
    },
    [user, flush]
  );

  // Guarda la nota. Pinta al instante y revierte sola si el servidor la rechaza.
  const rateProduct = useCallback(
    async (productId, rating) => {
      if (!user || !productId) return false;

      let anterior;
      setRatings((prev) => {
        anterior = prev[productId];
        return {
          ...prev,
          [productId]: { ...(anterior || {}), rating, can_review: true },
        };
      });

      try {
        await rateProductAPI(productId, rating);
        asked.current.add(productId);
        return true;
      } catch (err) {
        setRatings((prev) => ({
          ...prev,
          [productId]: anterior || { rating: null, review_id: null, can_review: true },
        }));
        const msg = err?.response?.data?.error;
        return msg ? { error: msg } : false;
      }
    },
    [user]
  );

  const contextValue = useMemo(
    () => ({ ratings, requestRating, rateProduct, isLogged: !!user }),
    [ratings, requestRating, rateProduct, user]
  );

  return <RatingContext.Provider value={contextValue}>{children}</RatingContext.Provider>;
};

RatingProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useRatings = () => useContext(RatingContext);
