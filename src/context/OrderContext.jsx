/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback } from "react";
import PropTypes from "prop-types";
import {
  createOrder as createOrderAPI,
  getMyOrders,
  getOrderByIdAPI,
  uploadPaymentProofAPI,
  approvePaymentAPI,
  rejectPaymentAPI,
  confirmDeliveryAPI,
} from "../services/api";

const OrderContext = createContext();

export const useOrder = () => useContext(OrderContext);

export const OrderProvider = ({ children }) => {
  const [orders, setOrders] = useState([]);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const createOrder = async (orderData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await createOrderAPI(orderData);
      const newOrder = response.data.data || response.data;
      setCurrentOrder(newOrder);
      setOrders((prev) => [newOrder, ...prev]);
      return { success: true, order: newOrder };
    } catch (err) {
      const msg = err.response?.data?.error || "Error al crear la orden";
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  };

  const uploadPaymentProof = async (orderId, file) => {
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file); // Must match multer/busboy field name expectations on backend
      const response = await uploadPaymentProofAPI(orderId, formData);
      const updatedOrder = response.data.order || response.data;
      setCurrentOrder(updatedOrder);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? updatedOrder : o)),
      );
      return { success: true, order: updatedOrder };
    } catch (err) {
      const msg = err.response?.data?.error || "Error al subir comprobante";
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = useCallback(async (filters = {}) => {
    // If we need to pass status='pending_approval' to backend
    setLoading(true);
    setError(null);
    try {
      const config = { params: filters };
      const response = await getMyOrders(config);
      setOrders(response.data.data || response.data);
    } catch (err) {
      if (err.name === "CanceledError" || err.message === "canceled") return;
      setError(err.response?.data?.error || "Error al cargar pedidos");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchOrderById = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      const response = await getOrderByIdAPI(id);
      const order = response.data.data || response.data;
      setCurrentOrder(order);
      return { success: true, order };
    } catch (err) {
      const msg = err.response?.data?.error || "Error al buscar la orden";
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  }, []);

  const approvePayment = async (orderId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await approvePaymentAPI(orderId);
      const updatedOrder = response.data.order || response.data;
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? updatedOrder : o)),
      );
      if (currentOrder && currentOrder.id === orderId) {
        setCurrentOrder(updatedOrder);
      }
      return { success: true, order: updatedOrder };
    } catch (err) {
      const msg = err.response?.data?.error || "Error al aprobar pago";
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  };

  const rejectPayment = async (orderId, reason) => {
    setLoading(true);
    setError(null);
    try {
      const response = await rejectPaymentAPI(orderId, reason);
      const updatedOrder = response.data.order || response.data;
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? updatedOrder : o)),
      );
      if (currentOrder && currentOrder.id === orderId) {
        setCurrentOrder(updatedOrder);
      }
      return { success: true, order: updatedOrder };
    } catch (err) {
      const msg = err.response?.data?.error || "Error al rechazar pago";
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  };

  const confirmDelivery = async (itemId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await confirmDeliveryAPI(itemId);
      const data = response.data;
      // Re-fetch the current order to get fresh state
      if (currentOrder) {
        const refreshed = await getOrderByIdAPI(currentOrder.id);
        const order = refreshed.data.data || refreshed.data;
        setCurrentOrder(order);
        setOrders((prev) => prev.map((o) => (o.id === order.id ? order : o)));
      }
      return { success: true, message: data.message };
    } catch (err) {
      const msg = err.response?.data?.error || "Error al confirmar entrega";
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  };

  const value = {
    orders,
    currentOrder,
    loading,
    error,
    createOrder,
    uploadPaymentProof,
    fetchOrders,
    fetchOrderById,
    approvePayment,
    rejectPayment,
    confirmDelivery,
  };

  return (
    <OrderContext.Provider value={value}>{children}</OrderContext.Provider>
  );
};

OrderProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
