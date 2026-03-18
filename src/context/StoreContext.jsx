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
} from "../services/api";

const StoreContext = createContext();

export const useStore = () => useContext(StoreContext);

export const StoreProvider = ({ children }) => {
  const [storeProfile, setStoreProfile] = useState(null);
  const [myProducts, setMyProducts] = useState([]);
  const [storeOrders, setStoreOrders] = useState([]);
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
      // Refresh orders
      await fetchStoreOrders();
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

  const value = {
    storeProfile,
    myProducts,
    storeOrders,
    loading,
    error,
    fetchProfile,
    updateProfile,
    fetchMyProducts,
    createProduct,
    updateProduct,
    uploadImage,
    deleteProduct,
    fetchStoreOrders,
    shipItem,
  };

  return (
    <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
  );
};

StoreProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
