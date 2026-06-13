/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback, useMemo } from "react";
import PropTypes from "prop-types";
import { uploadFileDirectly } from "../lib/upload";
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

  const updateProfile = useCallback(async (data) => {
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
  }, []);

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

  const createProduct = useCallback(async (productData) => {
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
  }, []);

  const updateProduct = useCallback(async (id, productData) => {
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
  }, [fetchMyProducts]);

  const uploadImage = useCallback(async (file) => {
    try {
      const { publicUrl, path } = await uploadFileDirectly(file, "products");
      const response = await uploadProductImage({ path, url: publicUrl });
      return { success: true, url: response.data.file.url };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.error || err.message || "Error al subir imagen",
      };
    }
  }, []);

  const deleteProduct = useCallback(async (id) => {
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
  }, []);

  const fetchStoreOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getMyOrders({ params: { as_store: true } });
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

  const shipItem = useCallback(async (itemId, trackingData) => {
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
  }, [fetchStoreOrders, fetchStoreStats]);

  const cancelAbandonedStoreOrder = useCallback(async (orderId) => {
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
  }, [fetchStoreOrders, fetchStoreStats]);

  // Cancel a specific item (store out of stock)
  const cancelItem = useCallback(async (itemId, reason) => {
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
  }, [fetchStoreOrders, fetchStoreStats]);

  // Cancel all store items in an order
  const cancelStoreOrder = useCallback(async (orderId, reason) => {
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
  }, [fetchStoreOrders, fetchStoreStats]);

  const value = useMemo(() => ({
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
  }), [
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
  ]);

  return (
    <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
  );
};

StoreProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
