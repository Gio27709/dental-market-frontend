import axios from "axios";
import { supabase } from "../lib/supabaseClient";
import toast from "react-hot-toast";

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

    return config;
  },
  (error) => Promise.reject(error),
);

// SECURITY FIX: Enhanced response interceptor with automatic session refresh on 401
// and automatic redirect to login when session is irrecoverable.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Automatic session refresh on 401 (expired token)
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true;
      try {
        const { data: { session } } = await supabase.auth.refreshSession();
        if (session?.access_token) {
          error.config.headers.Authorization = `Bearer ${session.access_token}`;
          return api(error.config); // Retry the original request with fresh token
        }
      } catch (refreshErr) {
        console.warn("Session refresh failed:", refreshErr.message);
      }
      // BUG FIX: Session could not be recovered — force sign out and redirect to login
      console.warn("Unauthorized API call — session irrecoverable. Redirecting to login.");
      try {
        await supabase.auth.signOut();
      } catch { /* ignore sign out errors */ }
      toast.error("Tu sesión ha expirado. Por favor inicia sesión de nuevo.");
      // Use setTimeout to allow the toast to show before redirect
      setTimeout(() => {
        window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
      }, 500);
      return Promise.reject(error);
    } else if (error.response) {
      if (error.response.status === 404) {
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

export const getProducts = (buyerState = "") => 
  api.get(`/products${buyerState ? `?buyer_state=${encodeURIComponent(buyerState)}` : ""}`);
// Native login/register runs directly hitting Supabase. We only use api for business logic:
export const createOrder = (orderData) => api.post("/orders", orderData);
export const getMyOrders = (config = {}) => api.get("/orders", config);
export const getOrderByIdAPI = (id) => api.get(`/orders/${id}`);
export const getOrdersByGroupAPI = (groupId) => api.get(`/orders/group/${groupId}`);
export const cancelAbandonedOrderAPI = (id) => api.put(`/orders/${id}/cancel-abandoned`);
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

// Admin Payment History & Reports API
export const getPaymentHistoryAPI = (params) =>
  api.get("/admin/orders/payment-history", { params });
export const getStoresListAPI = () =>
  api.get("/admin/orders/stores-list");
export const getAdminStatsAPI = () => 
  api.get("/admin/orders/stats");

// Admin Refund Management API
export const getRefundRequestsAPI = (params) =>
  api.get("/admin/orders/refunds", { params });
export const processRefundAPI = (id, action, admin_notes) =>
  api.put(`/admin/orders/refunds/${id}/process`, { action, admin_notes });


// Admin Payouts Management API
export const getAdminPayoutsAPI = (params) => api.get("/admin/payouts", { params });
export const processAdminPayoutAPI = (id, formData) =>
  api.post(`/admin/payouts/${id}/process`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

// Admin Store Applications API
export const getAdminStoreApplicationsAPI = () => api.get("/admin/store-applications");
export const approveStoreApplicationAPI = (id) => api.post(`/admin/store-applications/${id}/approve`);
export const rejectStoreApplicationAPI = (id) => api.post(`/admin/store-applications/${id}/reject`);
export const deleteStoreApplicationAPI = (id) => api.delete(`/admin/store-applications/${id}`);
export const bulkDeleteStoreApplicationsAPI = (ids) => api.post(`/admin/store-applications/bulk-delete`, { ids });

// Admin Rider Applications API
export const getAdminRiderApplicationsAPI = () => api.get("/admin/rider-applications");
export const approveRiderApplicationAPI = (id) => api.post(`/admin/rider-applications/${id}/approve`);
export const rejectRiderApplicationAPI = (id) => api.post(`/admin/rider-applications/${id}/reject`);

// Admin Store Moderation API
export const getStoreDetailsAPI = (userId) => api.get(`/admin/store-applications/stores/${userId}/details`);
export const suspendStoreAPI = (userId, reason) => api.post(`/admin/store-applications/stores/${userId}/suspend`, { reason });
export const reactivateStoreAPI = (userId) => api.post(`/admin/store-applications/stores/${userId}/reactivate`);
export const revokeStoreAPI = (userId, reason) => api.post(`/admin/store-applications/stores/${userId}/revoke`, { reason });

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
export const getStoreStatsAPI = () => api.get("/store/stats");
export const upsertStoreProfile = (data) => api.put("/store/profile", data);
export const checkStoreNameAPI = (name) => api.get(`/store/check-name?name=${encodeURIComponent(name)}`);

// ==========================================
// STORE APPLICATIONS
// ==========================================
export const applyForStoreAPI = (data) => api.post("/store-applications", data);
export const getMyStoreApplicationAPI = () => api.get("/store-applications/me");

// ==========================================
// RIDER APPLICATIONS
// ==========================================
export const applyForRiderAPI = (data) => api.post("/rider-applications", data);
export const getMyRiderApplicationAPI = () => api.get("/rider-applications/me");

// Public User/Profile API
export const updateMyProfileAPI = (data) => api.put("/profiles/me", data);
export const uploadAvatarAPI = (formData) =>
  api.post("/profiles/me/avatar", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

// Store Product Management API
export const getMyProducts = () => api.get("/products/mine");
export const createProductAPI = (data) => api.post("/products", data);
export const updateProductAPI = (id, data) => api.put(`/products/${id}`, data);
export const deleteProductAPI = (id) => api.delete(`/products/${id}`);
export const getBulkImportTemplateAPI = () => api.get("/products/bulk-import/template", { responseType: 'blob' });
export const validateBulkImportAPI = (formData) => api.post("/products/bulk-import/validate", formData, { headers: { "Content-Type": "multipart/form-data" } });
export const bulkImportProductsAPI = (formData) => api.post("/products/bulk-import", formData, { headers: { "Content-Type": "multipart/form-data" } });
export const uploadProductImage = (formData) =>
  api.post("/products/upload-image", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

// Store Shipping API
export const shipOrderItemAPI = (itemId, data) =>
  api.put(`/orders/${itemId}/ship`, data);
export const uploadShippingEvidenceAPI = (formData) =>
  api.post("/orders/upload-shipping-evidence", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

// Store Cancel API
export const cancelOrderItemAPI = (itemId, reason) =>
  api.put(`/orders/${itemId}/cancel-item`, { reason });
export const storeCancelOrderAPI = (orderId, reason) =>
  api.put(`/orders/${orderId}/store-cancel`, { reason });

// Store Analytics API
export const getStoreAnalyticsAPI = (params) =>
  api.get("/store/analytics", { params });

// Product Statistics & Stock Management API
export const getProductStatsAPI = (productId, params) =>
  api.get(`/product-stats/${productId}/stats`, { params });
export const getProductPriceHistoryAPI = (productId) =>
  api.get(`/product-stats/${productId}/price-history`);
export const getProductStockHistoryAPI = (productId, params) =>
  api.get(`/product-stats/${productId}/stock-history`, { params });
export const restockVariationAPI = (productId, data) =>
  api.post(`/product-stats/${productId}/restock`, data);
export const adjustStockAPI = (productId, data) =>
  api.post(`/product-stats/${productId}/adjust-stock`, data);
export const registerExternalSaleAPI = (productId, data) =>
  api.post(`/product-stats/${productId}/external-sale`, data);
export const getExternalSalesAPI = (productId, params) =>
  api.get(`/product-stats/${productId}/external-sales`, { params });

// Store Wallet API
export const getWalletBalanceAPI = () => api.get("/store/wallet");
export const getWalletTransactionsAPI = (params) => api.get("/store/wallet/transactions", { params });
export const getStorePayoutsAPI = () => api.get("/store/wallet/payouts");
export const requestPayoutAPI = (data) => api.post("/store/wallet/payout", data);

// Admin Analytics API
export const getAdminAnalyticsAPI = (params) =>
  api.get("/admin/analytics", { params });

// Store Riders API
export const getStoreRidersAPI = () => api.get("/store/riders");
export const affiliateRiderAPI = (data) => api.post("/store/riders", typeof data === "string" ? { email: data } : data);
export const updateRiderStatusAPI = (id) => api.patch(`/store/riders/${id}/toggle`);
export const removeRiderAPI = (id) => api.delete(`/store/riders/${id}`);

// Rider API
export const getMyDeliveriesAPI = () => api.get("/delivery/my-deliveries");
export const getDeliveryDetailAPI = (itemId) => api.get(`/delivery/deliveries/${itemId}`);
export const markDeliveryCompletedAPI = (itemId) => api.put(`/delivery/deliveries/${itemId}/complete`);
export const markPickedUpAPI = (itemId) => api.put(`/delivery/deliveries/${itemId}/pickup`);
export const markArrivedAPI = (itemId, coords = {}) => api.put(`/delivery/deliveries/${itemId}/arrived`, coords);
export const markDeliveryFailedAPI = (itemId, data) => api.put(`/delivery/deliveries/${itemId}/failed`, data);
export const getDeliveryTimelineAPI = (itemId) => api.get(`/delivery/deliveries/${itemId}/timeline`);
export const getRiderStatsAPI = () => api.get("/delivery/stats");

// Admin Product Moderation API
export const getAllAdminProductsAPI = (params) => api.get("/products/admin/all", { params });
export const getPendingProductsAPI = () => api.get("/products/pending");
export const moderateProductAPI = (id, action) =>
  api.put(`/products/${id}/moderate`, { action });

// Categories API
export const getCategoriesAPI = () => api.get("/categories");
export const getCategoryByIdAPI = (id) => api.get(`/categories/${id}`);
export const createCategoryAPI = (data) => api.post("/categories", data);
export const updateCategoryAPI = (id, data) => api.put(`/categories/${id}`, data);
export const deleteCategoryAPI = (id) => api.delete(`/categories/${id}`);
export const reorderCategoriesAPI = (data) => api.put("/categories/reorder", data);

// Trending API (Public — categories by sales + products by score)
export const getTrendingAPI = (params) => api.get("/products/trending", { params });

// Brands API
export const getBrandsAPI = () => api.get("/brands");
export const createBrandAPI = (data) => api.post("/brands", data);
export const updateBrandAPI = (id, data) => api.put(`/brands/${id}`, data);
export const deleteBrandAPI = (id) => api.delete(`/brands/${id}`);

// Wishlist / Favorites API
export const getFavoritesAPI = () => api.get("/wishlist");
export const addFavoriteAPI = (productId) => api.post(`/wishlist/${productId}`);
export const removeFavoriteAPI = (productId) => api.delete(`/wishlist/${productId}`);
export const checkFavoriteAPI = (productId) => api.get(`/wishlist/check/${productId}`);

// Notifications API
export const getNotificationsAPI = (params) => api.get("/notifications", { params });
export const getUnreadCountAPI = () => api.get("/notifications/unread-count");
export const markNotificationReadAPI = (id) => api.put(`/notifications/${id}/read`);
export const markAllNotificationsReadAPI = () => api.put("/notifications/read-all");
export const deleteNotificationAPI = (id) => api.delete(`/notifications/${id}`);
export const getNotificationPreferencesAPI = () => api.get("/notifications/preferences");
export const updateNotificationPreferencesAPI = (data) => api.put("/notifications/preferences", data);

// Admin Notifications API
export const getAdminNotifTemplatesAPI = () => api.get("/admin/notifications/templates");
export const updateAdminNotifTemplateAPI = (id, data) => api.put(`/admin/notifications/templates/${id}`, data);
export const getAdminNotifStatsAPI = () => api.get("/admin/notifications/stats");
export const sendAdminNotifAPI = (data) => api.post("/admin/notifications/send", data);

// Admin Penalties API
export const getPenaltiesAPI = (params) =>
  api.get("/admin/penalties", { params });
export const resolvePenaltyAPI = (id, status, reason) =>
  api.put(`/admin/penalties/${id}/resolve`, { status, reason });
export const getPenaltyStatsAPI = () =>
  api.get("/admin/penalties/stats");

// Store Penalties API (Self-service)
export const getStorePenaltiesAPI = (params) =>
  api.get("/store/penalties", { params });
export const appealPenaltyAPI = (id, appeal_note) =>
  api.put(`/store/penalties/${id}/appeal`, { appeal_note });

// Home Sections API
export const getHomeSectionsAPI = () => api.get("/home-sections");
export const updateHomeSectionAPI = (sectionKey, content) => api.put(`/home-sections/${sectionKey}`, { content });
export const uploadHomeSectionImageAPI = (formData) => api.post("/home-sections/upload-image", formData, { headers: { "Content-Type": "multipart/form-data" } });
export const toggleHomeSectionAPI = (sectionKey) => api.patch(`/home-sections/${sectionKey}/toggle`);

// Courses API
export const getCoursesAPI = () => api.get("/courses");
export const getCourseByIdAPI = (id) => api.get(`/courses/${id}`);
export const createCourseAPI = (data) => api.post("/courses", data);
export const updateCourseAPI = (id, data) => api.put(`/courses/${id}`, data);
export const deleteCourseAPI = (id) => api.delete(`/courses/${id}`);

// Posts API
export const getPostsAPI = () => api.get("/posts");
export const getPostByIdAPI = (id) => api.get(`/posts/${id}`);
export const createPostAPI = (data) => api.post("/posts", data);
export const updatePostAPI = (id, data) => api.put(`/posts/${id}`, data);
export const deletePostAPI = (id) => api.delete(`/posts/${id}`);

// Returns / Devoluciones API
export const createReturnRequestAPI = (data) => api.post("/returns", data);
export const getReturnRequestsAPI = (params) => api.get("/returns", { params });
export const resolveReturnRequestAPI = (id, data) => api.put(`/returns/${id}/resolve`, data);

// Refunds / Reembolsos API
export const submitRefundDetailsAPI = (refundId, refundDetails) =>
  api.put(`/orders/refunds/${refundId}/details`, { refund_details: refundDetails });

// Exporting standard API for frontend endpoints
export default api;
