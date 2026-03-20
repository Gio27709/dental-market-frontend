import axios from "axios";
import { supabase } from "../lib/supabaseClient";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Intercept requests and inject the live Supabase JWT token dynamically
api.interceptors.request.use(
  async (config) => {
    // Await the fastest, local session directly from the Supabase client
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`;
    }

    // Debugging interceptor
    if (config.url?.includes("/orders") && config.method === "post") {
      console.log(
        "🔥 OUTGOING PAYLOAD TO /orders:",
        JSON.stringify(config.data, null, 2),
      );
    }

    return config;
  },
  (error) => Promise.reject(error),
);

// Global Error Handler Interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      if (error.response.status === 401) {
        console.warn("Unauthorized API call, redirecting down gracefully...");
      } else if (error.response.status === 404) {
        console.warn("Resource not found from API.");
      } else if (error.response.status >= 500) {
        console.error("Critical Backend Failure. API is down or failing.");
      }
    } else if (error.request) {
      console.error("Network error. No response received.");
    }
    // Pass the actual backend error message through to the caller if available
    if (error.response?.data?.error) {
      error.message = error.response.data.error;
    }

    return Promise.reject(error);
  },
);

export const getProducts = () => api.get("/products");
// Native login/register runs directly hitting Supabase. We only use api for business logic:
export const createOrder = (orderData) => api.post("/orders", orderData);
export const getMyOrders = (config = {}) => api.get("/orders", config);
export const getOrderByIdAPI = (id) => api.get(`/orders/${id}`);
export const uploadPaymentProofAPI = (id, formData) =>
  api.post(`/orders/${id}/payment-proof`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

// Admin Escrow API
export const approvePaymentAPI = (id) =>
  api.put(`/admin/orders/${id}/approve-payment`);
export const rejectPaymentAPI = (id, reason) =>
  api.put(`/admin/orders/${id}/reject-payment`, { reason });

// Admin Store Applications API
export const getAdminStoreApplicationsAPI = () => api.get("/admin/store-applications");
export const approveStoreApplicationAPI = (id) => api.post(`/admin/store-applications/${id}/approve`);
export const rejectStoreApplicationAPI = (id) => api.post(`/admin/store-applications/${id}/reject`);

// Buyer confirms delivery — Escrow release
export const confirmDeliveryAPI = (itemId) =>
  api.put(`/orders/${itemId}/confirm-delivery`);

// Cart Database Sync API
export const fetchCart = () => api.get("/cart");
export const addCartItem = (data) => api.post("/cart/items", data);
export const updateCartItemAPI = (id, data) =>
  api.patch(`/cart/items/${id}`, data);
export const updateCartItemVariationAPI = (id, data) =>
  api.patch(`/cart/items/${id}/variation`, data);
export const removeCartItemAPI = (id) => api.delete(`/cart/items/${id}`);
export const clearCartAPI = () => api.delete("/cart");
export const mergeCartAPI = (items) => api.post("/cart/merge", { items });

// Store Profile API
export const getStoreProfile = () => api.get("/store/profile");
export const upsertStoreProfile = (data) => api.put("/store/profile", data);
export const applyForStoreAPI = (data) => api.post("/store-applications", data);
export const getMyStoreApplicationAPI = () => api.get("/store-applications/me");

// Store Product Management API
export const getMyProducts = () => api.get("/products/mine");
export const createProductAPI = (data) => api.post("/products", data);
export const updateProductAPI = (id, data) => api.put(`/products/${id}`, data);
export const deleteProductAPI = (id) => api.delete(`/products/${id}`);
export const uploadProductImage = (formData) =>
  api.post("/products/upload-image", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

// Store Shipping API
export const shipOrderItemAPI = (itemId, data) =>
  api.put(`/orders/${itemId}/ship`, data);

// Admin Product Moderation API
export const getPendingProductsAPI = () => api.get("/products/pending");
export const moderateProductAPI = (id, action) =>
  api.put(`/products/${id}/moderate`, { action });

// Categories API
export const getCategoriesAPI = () => api.get("/categories");

// Exporting standard API for frontend endpoints
export default api;
