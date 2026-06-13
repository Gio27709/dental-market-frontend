/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback, useMemo } from "react";
import PropTypes from "prop-types";
import {
  createOrder as createOrderAPI,
  getMyOrders,
  getOrderByIdAPI,
  getOrdersByGroupAPI,
  uploadPaymentProofAPI,
  approvePaymentAPI,
  rejectPaymentAPI,
  confirmDeliveryAPI,
} from "../services/api";
import { uploadFileDirectly } from "../lib/upload";

const OrderContext = createContext();

export const useOrder = () => useContext(OrderContext);

export const OrderProvider = ({ children }) => {
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [summary, setSummary] = useState({ totalOrders: 0, countByPaymentStatus: {}, countByOrderStatus: {} });
  const [currentOrder, setCurrentOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const createOrder = useCallback(async (orderData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await createOrderAPI(orderData);
      const responseData = response.data;
      
      // Multi-store support: backend now returns { data, orders, order_group_id }
      const primaryOrder = responseData.data || responseData;
      const allOrders = responseData.orders || [primaryOrder];
      const orderGroupId = responseData.order_group_id || null;
      
      setCurrentOrder(primaryOrder);
      setOrders((prev) => [...allOrders, ...prev]);
      
      return { 
        success: true, 
        order: primaryOrder,
        orders: allOrders,
        order_group_id: orderGroupId,
        orders_count: allOrders.length,
      };
    } catch (err) {
      const msg = err.response?.data?.error || "Error al crear la orden";
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  }, []);

  const uploadPaymentProof = useCallback(async (orderId, file, paymentDetails = {}) => {
    setLoading(true);
    setError(null);
    try {
      // 1. Upload payment proof directly to Supabase storage
      const { publicUrl, path } = await uploadFileDirectly(file, "payment_proofs");

      // 2. Submit payment proof details and storage reference to backend via JSON
      const response = await uploadPaymentProofAPI(orderId, {
        path,
        url: publicUrl,
        ...paymentDetails,
      });

      const updatedOrder = response.data.order || response.data;
      setCurrentOrder(updatedOrder);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? updatedOrder : o)),
      );
      return { success: true, order: updatedOrder };
    } catch (err) {
      const msg = err.response?.data?.error || err.message || "Error al subir comprobante";
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchOrders = useCallback(async (filters = {}) => {
    // If we need to pass status='pending_approval' to backend
    setLoading(true);
    setError(null);
    try {
      const config = { params: filters };
      const response = await getMyOrders(config);
      const payload = response.data;
      
      if (payload.pagination) {
        setOrders(payload.data || []);
        setPagination(payload.pagination);
        setSummary(payload.summary || {});
      } else {
        setOrders(payload.data || payload);
        setPagination({ page: 1, limit: 999, total: 0, totalPages: 0 });
        setSummary({ totalOrders: 0, countByPaymentStatus: {}, countByOrderStatus: {} });
      }
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

  const fetchOrdersByGroup = useCallback(async (groupId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await getOrdersByGroupAPI(groupId);
      const payload = response.data;
      return {
        success: true,
        orders: payload.data || [],
        summary: payload.summary || {},
      };
    } catch (err) {
      const msg = err.response?.data?.error || "Error al buscar las órdenes";
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  }, []);

  const approvePayment = useCallback(async (orderId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await approvePaymentAPI(orderId);
      const data = response.data;
      const approvedIds = data.approved_order_ids || [orderId];

      // Remove all approved orders from local state (they leave under_review)
      setOrders((prev) =>
        prev.filter((o) => !approvedIds.includes(o.id)),
      );
      if (currentOrder && approvedIds.includes(currentOrder.id)) {
        setCurrentOrder(null);
      }
      return {
        success: true,
        approved_count: data.approved_count || 1,
        approved_order_ids: approvedIds,
      };
    } catch (err) {
      const msg = err.response?.data?.error || "Error al aprobar pago";
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  }, [currentOrder]);

  const rejectPayment = useCallback(async (orderId, reason) => {
    setLoading(true);
    setError(null);
    try {
      const response = await rejectPaymentAPI(orderId, reason);
      const data = response.data;
      const rejectedIds = data.rejected_order_ids || [orderId];

      // Remove all rejected orders from local state
      setOrders((prev) =>
        prev.filter((o) => !rejectedIds.includes(o.id)),
      );
      if (currentOrder && rejectedIds.includes(currentOrder.id)) {
        setCurrentOrder(null);
      }
      return {
        success: true,
        rejected_count: data.rejected_count || 1,
        rejected_order_ids: rejectedIds,
      };
    } catch (err) {
      const msg = err.response?.data?.error || "Error al rechazar pago";
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  }, [currentOrder]);

  const confirmDelivery = useCallback(async (itemId) => {
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
  }, [currentOrder]);

  const value = useMemo(() => ({
    orders,
    pagination,
    summary,
    currentOrder,
    loading,
    error,
    createOrder,
    uploadPaymentProof,
    fetchOrders,
    fetchOrderById,
    fetchOrdersByGroup,
    approvePayment,
    rejectPayment,
    confirmDelivery,
  }), [
    orders,
    pagination,
    summary,
    currentOrder,
    loading,
    error,
    createOrder,
    uploadPaymentProof,
    fetchOrders,
    fetchOrderById,
    fetchOrdersByGroup,
    approvePayment,
    rejectPayment,
    confirmDelivery,
  ]);

  return (
    <OrderContext.Provider value={value}>{children}</OrderContext.Provider>
  );
};

OrderProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
