/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useEffect, useContext, useCallback } from "react";
import PropTypes from "prop-types";
import { getFavoritesAPI, addFavoriteAPI, removeFavoriteAPI } from "../services/api";
import { useAuth } from "./AuthContext";

const FavoriteContext = createContext();

export const FavoriteProvider = ({ children }) => {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const [favoriteIds, setFavoriteIds] = useState(new Set());
  const [loading, setLoading] = useState(false);

  // Cargar lista completa
  const fetchFavorites = useCallback(async () => {
    if (!user) {
      setFavorites([]);
      setFavoriteIds(new Set());
      return;
    }
    try {
      setLoading(true);
      const res = await getFavoritesAPI();
      const items = res.data.data || [];
      setFavorites(items);
      setFavoriteIds(new Set(items.map(f => f.product_id || f.products?.id))); 
    } catch (err) {
      console.error("Error fetching favorites:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const toggleFavorite = async (productId) => {
    if (!user) return false;
    
    const isFav = favoriteIds.has(productId);
    
    // UI Actualización Optimista (instantánea)
    const newSet = new Set(favoriteIds);
    if (isFav) {
      newSet.delete(productId);
      setFavorites(prev => prev.filter(f => f.product_id !== productId && f.products?.id !== productId));
    } else {
      newSet.add(productId);
      // No tenemos data completa para agregar a `favorites` sin hacer fetch.
    }
    setFavoriteIds(newSet);

    try {
      if (isFav) {
        await removeFavoriteAPI(productId);
      } else {
        await addFavoriteAPI(productId);
        // Recargar en silencio para traer toda la data relacional del producto recién agregado
        fetchFavorites();
      }
      return true;
    } catch (err) {
      console.error("Error toggling favorite:", err);
      // Revertir en caso de que la API falle
      fetchFavorites();
      return false;
    }
  };

  return (
    <FavoriteContext.Provider value={{ favorites, favoriteIds, loading, toggleFavorite, fetchFavorites }}>
      {children}
    </FavoriteContext.Provider>
  );
};

FavoriteProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useFavorites = () => useContext(FavoriteContext);
