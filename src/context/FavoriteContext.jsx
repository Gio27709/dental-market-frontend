/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useEffect, useContext, useCallback, useMemo, useRef } from "react";
import PropTypes from "prop-types";
import toast from "react-hot-toast";
import { getFavoritesAPI, addFavoriteAPI, removeFavoriteAPI } from "../services/api";
import { useAuth } from "./AuthContext";

const FavoriteContext = createContext();

const idOf = (f) => f.product_id || f.products?.id;

export const FavoriteProvider = ({ children }) => {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const [favoriteIds, setFavoriteIds] = useState(new Set());
  // Arranca en true si hay sesión: así la lista no parpadea como «vacía» antes de la primera carga.
  const [loading, setLoading] = useState(!!user);
  const [error, setError] = useState(null);
  const requestSeq = useRef(0);

  // Cargar lista completa. `silent` recarga sin volver a mostrar el esqueleto.
  const fetchFavorites = useCallback(async ({ silent = false } = {}) => {
    const seq = ++requestSeq.current;
    if (!user) {
      setFavorites([]);
      setFavoriteIds(new Set());
      setError(null);
      setLoading(false);
      return;
    }
    try {
      if (!silent) setLoading(true);
      setError(null);
      const res = await getFavoritesAPI();
      if (seq !== requestSeq.current) return; // llegó una respuesta más nueva
      const items = res.data?.data || [];
      setFavorites(items);
      setFavoriteIds(new Set(items.map(idOf)));
    } catch (err) {
      if (seq !== requestSeq.current) return;
      console.error("Error cargando favoritos:", err);
      setError(err.response?.data?.error || "No pudimos cargar tus favoritos.");
    } finally {
      if (seq === requestSeq.current) setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  /**
   * Devuelve true si el cambio quedó guardado y false si no (sin sesión, error o tope).
   * Los avisos (toasts) se lanzan desde aquí, así quien llama no tiene que repetirlos.
   */
  const toggleFavorite = useCallback(async (productId) => {
    if (!user) {
      toast.error("Inicia sesión para guardar favoritos.", { id: "favorites-auth" });
      return false;
    }

    const isFav = favoriteIds.has(productId);

    // Actualización optimista
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      if (isFav) next.delete(productId);
      else next.add(productId);
      return next;
    });
    if (isFav) {
      setFavorites((prev) => prev.filter((f) => idOf(f) !== productId));
    }

    try {
      if (isFav) {
        await removeFavoriteAPI(productId);
      } else {
        await addFavoriteAPI(productId);
        // Recarga silenciosa para traer los datos completos del producto agregado.
        fetchFavorites({ silent: true });
      }
      return true;
    } catch (err) {
      const code = err.response?.data?.code;
      if (!isFav && code === "ALREADY_FAVORITE") {
        // Ya estaba guardado (otra pestaña o doble clic): nos ponemos al día sin avisar de error.
        fetchFavorites({ silent: true });
        return true;
      }
      if (code === "FAVORITES_LIMIT") {
        toast.error(
          err.response?.data?.error || "Llegaste al máximo de favoritos. Quita alguno para guardar otro.",
          { id: "favorites-limit" },
        );
      } else {
        console.error("Error al cambiar favorito:", err);
        toast.error(
          err.response?.data?.error || (isFav ? "No pudimos quitarlo de favoritos." : "No pudimos guardarlo en favoritos."),
          { id: "favorites-error" },
        );
      }
      // Revertir con el estado real del servidor
      fetchFavorites({ silent: true });
      return false;
    }
  }, [user, favoriteIds, fetchFavorites]);

  const contextValue = useMemo(() => ({
    favorites, favoriteIds, loading, error, toggleFavorite, fetchFavorites
  }), [favorites, favoriteIds, loading, error, toggleFavorite, fetchFavorites]);

  return (
    <FavoriteContext.Provider value={contextValue}>
      {children}
    </FavoriteContext.Provider>
  );
};

FavoriteProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useFavorites = () => useContext(FavoriteContext);
