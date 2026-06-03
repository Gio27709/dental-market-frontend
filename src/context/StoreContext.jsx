/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback } from "react";
import PropTypes from "prop-types";
import {
  getStoreProfile as getStoreProfileAPI,
  upsertStoreProfile as upsertStoreProfileAPI,
  getMyProducts as getMyProductsAPI,
  createProductAPI,
  updateProductAPI,
  deleteProductAPI,
  uploadProductImage,
  shipOrderItemAPI,
  getMyOrders,
  cancelAbandonedOrderAPI,
  cancelOrderItemAPI,
  storeCancelOrderAPI,
  getStoreStatsAPI,
} from "../services/api";

const StoreContext = createContext();

export const useStore = () => useContext(StoreContext);

// Helper: Invalidate ALL product cache entries regardless of buyer_state suffix
// The ProductContext stores cache as "dental_market_products_cache_{state}"
// so a simple removeItem("dental_market_products_cache") never matches.
const invalidateProductCache = () => {
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith("dental_market_products_cache")) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach((k) => localStorage.removeItem(k));
};

export const StoreProvider = ({ children }) => {
  const [storeProfile, setStoreProfile] = useState(null);
  const [myProducts, setMyProducts] = useState([]);
  const [storeOrders, setStoreOrders] = useState([]);
  const [storeStats, setStoreStats] = useState({ pendingOrders: 0, pendingPenalties: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getStoreProfileAPI();
      setStoreProfile(response.data.data);
      return { success: true, data: response.data.data };
    } catch (err) {
      const msg = err.response?.data?.error || "Error al cargar perfil";
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStoreStats = useCallback(async () => {
    try {
      const response = await getStoreStatsAPI();
      if (response.data?.success) {
        setStoreStats(response.data.data);
      }
    } catch (err) {
      console.error("Error fetching store stats:", err);
    }
  }, []);

  const updateProfile = async (data) => {
    setLoading(true);
    setError(null);
    try {
      const response = await upsertStoreProfileAPI(data);
      setStoreProfile(response.data.data);
      return { success: true, data: response.data.data };
    } catch (err) {
      const msg = err.response?.data?.error || "Error al actualizar perfil";
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  };

  const fetchMyProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getMyProductsAPI();
      setMyProducts(response.data.data || []);
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.error || "Error al cargar productos";
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  }, []);

  const createProduct = async (productData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await createProductAPI(productData);
      const newProduct = response.data.data;
      setMyProducts((prev) => [newProduct, ...prev]);
      // Invalidate global catalog cache so changes appear immediately
      invalidateProductCache();
      return { success: true, data: newProduct };
    } catch (err) {
      const msg = err.response?.data?.error || "Error al crear producto";
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  };

  const updateProduct = async (id, productData) => {
    setLoading(true);
    setError(null);
    try {
      await updateProductAPI(id, productData);
      // We could return the updated product from the API,
      // but for now re-fetching the list ensures all variations are perfectly synced
      await fetchMyProducts();
      // Invalidate global catalog cache so changes appear immediately
      invalidateProductCache();
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.error || "Error al actualizar producto";
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  };

  const uploadImage = async (file) => {
    try {
      const formData = new FormData();
      formData.append("image", file);
      const response = await uploadProductImage(formData);
      return { success: true, url: response.data.file.url };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.error || "Error al subir imagen",
      };
    }
  };

  const deleteProduct = async (id) => {
    setLoading(true);
    try {
      await deleteProductAPI(id);
      setMyProducts((prev) => prev.filter((p) => p.id !== id));
      // Invalidate global catalog cache so changes appear immediately
      invalidateProductCache();
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.error || "Error al eliminar",
      };
    } finally {
      setLoading(false);
    }
  };

  const fetchStoreOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getMyOrders();
      setStoreOrders(response.data.data || []);
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.error || "Error al cargar órdenes";
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  }, []);

  const shipItem = async (itemId, trackingData) => {
    setLoading(true);
    try {
      await shipOrderItemAPI(itemId, trackingData);
      // Refresh orders and stats
      await fetchStoreOrders();
      await fetchStoreStats();
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.error || "Error al enviar",
      };
    } finally {
      setLoading(false);
    }
  };

  const cancelAbandonedStoreOrder = async (orderId) => {
    setLoading(true);
    try {
      await cancelAbandonedOrderAPI(orderId);
      // Refresh orders and stats
      await fetchStoreOrders();
      await fetchStoreStats();
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.error || "Error al cancelar la orden abandonada",
      };
    } finally {
      setLoading(false);
    }
  };

  // Cancel a specific item (store out of stock)
  const cancelItem = async (itemId, reason) => {
    setLoading(true);
    try {
      const res = await cancelOrderItemAPI(itemId, reason);
      // Refresh orders and stats
      await fetchStoreOrders();
      await fetchStoreStats();
      return { success: true, data: res.data };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.error || err.message || "Error al cancelar el ítem",
      };
    } finally {
      setLoading(false);
    }
  };

  // Cancel all store items in an order
  const cancelStoreOrder = async (orderId, reason) => {
    setLoading(true);
    try {
      const res = await storeCancelOrderAPI(orderId, reason);
      // Refresh orders and stats
      await fetchStoreOrders();
      await fetchStoreStats();
      return { success: true, data: res.data };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.error || err.message || "Error al cancelar la orden",
      };
    } finally {
      setLoading(false);
    }
  };

  const value = {
    storeProfile,
    myProducts,
    storeOrders,
    storeStats,
    loading,
    error,
    fetchProfile,
    fetchStoreStats,
    updateProfile,
    fetchMyProducts,
    createProduct,
    updateProduct,
    uploadImage,
    deleteProduct,
    fetchStoreOrders,
    shipItem,
    cancelAbandonedStoreOrder,
    cancelItem,
    cancelStoreOrder,
  };

  return (
    <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
  );
};

StoreProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
