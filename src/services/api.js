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
    if (error.response?.data?.error) {
      error.message = error.response.data.error;
    }

    return Promise.reject(error);
  },
);

export const getProducts = (params = {}) => {
  if (typeof params === "string") {
    return api.get("/products", { params: { buyer_state: params } });
  }
  return api.get("/products", { params });
};
export const getProductsFacetsAPI = () => api.get("/products/facets");
export const createOrder = (orderData) => api.post("/orders", orderData);
export const getMyOrders = (config = {}) => api.get("/orders", config);
export const getOrderByIdAPI = (id) => api.get(`/orders/${id}`);
export const getOrdersByGroupAPI = (groupId) => api.get(`/orders/group/${groupId}`);
export const cancelAbandonedOrderAPI = (id) => api.put(`/orders/${id}/cancel-abandoned`);
export const uploadPaymentProofAPI = (id, paymentData) =>
  api.post(`/orders/${id}/payment-proof`, paymentData);

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
export const getAdminStoreApplicationsAPI = (params) => api.get("/admin/store-applications", { params });
export const getStoreApplicationReviewAPI = (id) => api.get(`/admin/store-applications/${id}/review`);
export const approveStoreApplicationAPI = (id) => api.post(`/admin/store-applications/${id}/approve`);
export const rejectStoreApplicationAPI = (id) => api.post(`/admin/store-applications/${id}/reject`);
export const deleteStoreApplicationAPI = (id) => api.delete(`/admin/store-applications/${id}`);
export const bulkDeleteStoreApplicationsAPI = (ids) => api.post(`/admin/store-applications/bulk-delete`, { ids });

// Admin Rider Applications API
export const getAdminRiderApplicationsAPI = () => api.get("/admin/rider-applications");
export const approveRiderApplicationAPI = (id) => api.post(`/admin/rider-applications/${id}/approve`);
export const rejectRiderApplicationAPI = (id) => api.post(`/admin/rider-applications/${id}/reject`);
export const revokeRiderApplicationAPI = (id, reason) => api.post(`/admin/rider-applications/${id}/revoke`, { reason });

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
export const preloadRestockCartAPI = (items) => api.post("/cart/preload-restock", { items });

// Portal Clínico (B2B) — Inventario, suscripciones y analíticas del odontólogo.
// Estas rutas se llamaban antes con axios crudo y un token inexistente
// (`localStorage.getItem("token")`), por eso el portal recibía 401/404.
export const getInventoryAlertsAPI = () => api.get("/inventory/alerts");
export const upsertInventoryAlertAPI = (data) => api.post("/inventory/alerts", data);
export const updateInventoryAlertAPI = (id, data) => api.put(`/inventory/alerts/${id}`, data);
export const deleteInventoryAlertAPI = (id) => api.delete(`/inventory/alerts/${id}`);
export const getInventorySuggestionsAPI = () => api.get("/inventory/suggestions");
export const getClinicSubscriptionsAPI = () => api.get("/inventory/subscriptions");
export const createClinicSubscriptionAPI = (data) => api.post("/inventory/subscriptions", data);
export const updateClinicSubscriptionStatusAPI = (id, status) =>
  api.patch(`/inventory/subscriptions/${id}`, { status });
export const deleteClinicSubscriptionAPI = (id) => api.delete(`/inventory/subscriptions/${id}`);
export const getDentistFinancialSummaryAPI = () => api.get("/analytics/dentist/financial-summary");
export const getDentistProjectionsAPI = () => api.get("/analytics/dentist/projections");
export const getDentistSmartOffersAPI = () => api.get("/analytics/dentist/smart-offers");
export const exportDentistExcelAPI = () =>
  api.get("/analytics/dentist/export-excel", { responseType: "blob" });

// Store Profile API
export const getStoreProfile = () => api.get("/store/profile");
export const getStoreStatsAPI = () => api.get("/store/stats");
export const upsertStoreProfile = (data) => api.put("/store/profile", data);
export const checkStoreNameAPI = (name) => api.get(`/store/check-name?name=${encodeURIComponent(name)}`);

// STORE APPLICATIONS
export const applyForStoreAPI = (data) => api.post("/store-applications", data);
export const getMyStoreApplicationAPI = () => api.get("/store-applications/me");

// RIDER APPLICATIONS
export const applyForRiderAPI = (data) => api.post("/rider-applications", data);
export const getMyRiderApplicationAPI = () => api.get("/rider-applications/me");

// Public User/Profile API
export const updateMyProfileAPI = (data) => api.put("/profiles/me", data);
export const uploadAvatarAPI = (avatarData) =>
  api.post("/profiles/me/avatar", avatarData);

// Store Product Management API
export const getMyProducts = () => api.get("/products/mine");
export const createProductAPI = (data) => api.post("/products", data);
export const updateProductAPI = (id, data) => api.put(`/products/${id}`, data);
export const deleteProductAPI = (id) => api.delete(`/products/${id}`);
export const getBulkImportTemplateAPI = () => api.get("/products/bulk-import/template", { responseType: 'blob' });
export const validateBulkImportAPI = (formData) => api.post("/products/bulk-import/validate", formData, { headers: { "Content-Type": "multipart/form-data" } });
export const bulkImportProductsAPI = (formData) => api.post("/products/bulk-import", formData, { headers: { "Content-Type": "multipart/form-data" } });
export const uploadProductImage = (imageData) =>
  api.post("/products/upload-image", imageData);

// Store Shipping API
export const shipOrderItemAPI = (itemId, data) =>
  api.put(`/orders/${itemId}/ship`, data);
export const uploadShippingEvidenceAPI = (evidenceData) =>
  api.post("/orders/upload-shipping-evidence", evidenceData);

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
export const getAdminAnalyticsAPI = (params) => api.get("/admin/analytics", { params });
export const getExecutiveAnalyticsAPI = (params) => api.get("/admin/analytics/overview", { params });
export const getFinancialsAnalyticsAPI = (params) => api.get("/admin/analytics/financials", { params });
export const getSalesAnalyticsAPI = (params) => api.get("/admin/analytics/sales", { params });
export const getLogisticsAnalyticsAPI = (params) => api.get("/admin/analytics/logistics", { params });
export const getGrowthAnalyticsAPI = (params) => api.get("/admin/analytics/growth", { params });
export const getSupportAnalyticsAPI = (params) => api.get("/admin/analytics/support", { params });
export const getAudienceAnalyticsAPI = (params) => api.get("/admin/analytics/audience", { params });
export const getFunnelAnalyticsAPI = (params) => api.get("/admin/analytics/funnel", { params });
export const getContentAnalyticsAPI = (params) => api.get("/admin/analytics/content", { params });
export const getNotificationsAnalyticsAPI = (params) => api.get("/admin/analytics/notifications", { params });
export const getReputationAnalyticsAPI = (params) => api.get("/admin/analytics/reputation", { params });
export const getDemandAnalyticsAPI = (params) => api.get("/admin/analytics/demand", { params });
export const getCatalogAnalyticsAPI = (params) => api.get("/admin/analytics/catalog", { params });
export const getTreasuryAnalyticsAPI = (params) => api.get("/admin/analytics/treasury", { params });
export const getOnboardingAnalyticsAPI = (params) => api.get("/admin/analytics/onboarding", { params });
export const getPromotionsAnalyticsAPI = (params) => api.get("/admin/analytics/promotions", { params });
export const getLogisticsDeepAnalyticsAPI = (params) => api.get("/admin/analytics/logistics-deep", { params });
export const getSupportDeepAnalyticsAPI = (params) => api.get("/admin/analytics/support-deep", { params });
export const getB2bModulesAnalyticsAPI = (params) => api.get("/admin/analytics/b2b", { params });

// Drill-down universal: abre cualquier métrica agregada hasta sus filas de origen
export const getDrilldownAPI = (dataset, params) => api.get(`/admin/analytics/drilldown/${dataset}`, { params });
export const getDrilldownCatalogAPI = () => api.get("/admin/analytics/drilldown");

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

// My Reviews API (Account Section)
export const getMyReviewsAPI = (params) => api.get("/products/my-reviews", { params });
export const getStoreProductReviewsAPI = (params) => api.get("/products/store-reviews", { params });
export const updateMyReviewAPI = (reviewId, data) => api.put(`/products/reviews/${reviewId}`, data);
export const deleteMyReviewAPI = (reviewId) => api.delete(`/products/reviews/${reviewId}`);

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
export const getAdminNotifStatsAPI = (params) => api.get("/admin/notifications/stats", { params });
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
export const acknowledgePenaltyAPI = (id) =>
  api.put(`/store/penalties/${id}/acknowledge`);

// Home Sections API
export const getHomeSectionsAPI = () => api.get("/home-sections");
export const updateHomeSectionAPI = (sectionKey, content) => api.put(`/home-sections/${sectionKey}`, { content });
export const uploadHomeSectionImageAPI = (formData) => api.post("/home-sections/upload-image", formData, { headers: { "Content-Type": "multipart/form-data" } });
export const toggleHomeSectionAPI = (sectionKey) => api.patch(`/home-sections/${sectionKey}/toggle`);
export const subscribeNewsletterAPI = (email) => api.post("/newsletter/subscribe", { email });
export const getNewsletterSubscribersAPI = () => api.get("/newsletter/subscribers");
export const deleteNewsletterSubscriberAPI = (id) => api.delete(`/newsletter/subscribers/${id}`);
export const updateNewsletterDiscountAPI = (percentage) => api.put("/admin/settings/newsletter-discount", { percentage });
export const updateNewsletterLimitAPI = (enabled) => api.put("/admin/settings/newsletter-limit", { enabled });
export const updateNewsletterEnabledAPI = (enabled) => api.put("/admin/settings/newsletter-status", { enabled });
export const getWeeklyPromotionsPreviewAPI = (params) => api.get("/newsletter/weekly-promotions-preview", { params });
export const sendWeeklyPromotionsNewsletterAPI = () => api.post("/newsletter/send-weekly-promotions");

// Courses API
export const getCoursesAPI = () => api.get("/courses");
export const getCourseByIdAPI = (id) => api.get(`/courses/${id}`);
export const createCourseAPI = (data) => api.post("/courses", data);
export const updateCourseAPI = (id, data) => api.put(`/courses/${id}`, data);
export const deleteCourseAPI = (id) => api.delete(`/courses/${id}`);

// Posts API
export const getPostsAPI = () => api.get("/posts");
export const getMyPostsAPI = () => api.get("/posts/me");
export const getAdminPostsAPI = (params) => api.get("/posts/admin/all", { params });
export const getPostByIdAPI = (id) => api.get(`/posts/${id}`);
export const createPostAPI = (data) => api.post("/posts", data);
export const updatePostAPI = (id, data) => api.put(`/posts/${id}`, data);
export const deletePostAPI = (id) => api.delete(`/posts/${id}`);
export const moderatePostAPI = (id, data) => api.put(`/posts/${id}/moderate`, data);
export const uploadPostImageAPI = (imageData) => api.post("/posts/upload-image", imageData);
export const updateAllowUserPostsAPI = (mode) => api.put("/admin/settings/allow-user-posts", { mode });
export const togglePostLikeAPI = (id) => api.post(`/posts/${id}/like`);
export const getPostLikesAPI = (id) => api.get(`/posts/${id}/likes`);
export const getPostCommentsAPI = (id) => api.get(`/posts/${id}/comments`);
export const createPostCommentAPI = (id, data) => api.post(`/posts/${id}/comments`, data);
export const deletePostCommentAPI = (commentId) => api.delete(`/posts/comments/${commentId}`);
export const getUserLikedPostsAPI = () => api.get("/posts/me/liked");
export const togglePostSaveAPI = (id) => api.post(`/posts/${id}/save`);
export const getPostSavesAPI = (id) => api.get(`/posts/${id}/saves`);
export const getUserSavedPostsAPI = (params) => api.get("/posts/me/saved", { params });

// Returns / Devoluciones API
export const createReturnRequestAPI = (data) => api.post("/returns", data);
export const getReturnRequestsAPI = (params) => api.get("/returns", { params });
export const resolveReturnRequestAPI = (id, data) => api.put(`/returns/${id}/resolve`, data);

// Refunds / Reembolsos API
export const submitRefundDetailsAPI = (refundId, refundDetails) =>
  api.put(`/orders/refunds/${refundId}/details`, { refund_details: refundDetails });

// Geo API (pin del mapa -> dirección aproximada, vía backend/Nominatim)
export const reverseGeocodeAPI = (lat, lng) => api.get("/geo/reverse", { params: { lat, lng } });

// Oficinas de transportistas nacionales (Zoom por ahora)
export const getShippingOfficesAPI = (params) => api.get("/shipping-offices", { params });

// Retiro en tienda: la tienda registra la entrega en mostrador
export const markPickupDeliveredAPI = (itemId) => api.put(`/orders/${itemId}/pickup-delivered`);

// Addresses API
export const getMyAddressesAPI = (params) => api.get("/addresses", { params });
export const createAddressAPI = (data) => api.post("/addresses", data);
export const updateAddressAPI = (id, data) => api.put(`/addresses/${id}`, data);
export const deleteAddressAPI = (id) => api.delete(`/addresses/${id}`);
export const setDefaultAddressAPI = (id) => api.patch(`/addresses/${id}/default`);

// Payment Methods API
export const getMyPaymentMethodsAPI = () => api.get("/payment-methods");
export const createPaymentMethodAPI = (data) => api.post("/payment-methods", data);
export const updatePaymentMethodAPI = (id, data) => api.put(`/payment-methods/${id}`, data);
export const deletePaymentMethodAPI = (id) => api.delete(`/payment-methods/${id}`);
export const setDefaultPaymentMethodAPI = (id) => api.patch(`/payment-methods/${id}/default`);

// Support / Tickets API
export const createTicketAPI = (data) => api.post("/support/tickets", data);
export const getMyTicketsAPI = () => api.get("/support/tickets");
export const getTicketDetailsAPI = (id) => api.get(`/support/tickets/${id}`);
export const addTicketMessageAPI = (id, data) => api.post(`/support/tickets/${id}/messages`, data);
export const getAllTicketsAdminAPI = (params) => api.get("/support/admin/tickets", { params });
export const updateTicketStatusAdminAPI = (id, status) => api.put(`/support/admin/tickets/${id}/status`, { status });

// Store Discounts API
export const getStoreDiscountsAPI = () => api.get("/store/discounts");
export const createDiscountAPI = (data) => api.post("/store/discounts", data);
export const updateDiscountAPI = (id, data) => api.put(`/store/discounts/${id}`, data);
export const toggleDiscountAPI = (id) => api.patch(`/store/discounts/${id}/toggle`);
export const deleteDiscountAPI = (id) => api.delete(`/store/discounts/${id}`);

// Promotions API (Public)
export const getPromotionsAPI = () => api.get("/promotions");
export const getPromotionByIdAPI = (id) => api.get(`/promotions/${id}`);
export const getFeaturedPromotionAPI = () => api.get("/promotions/featured");

// Admin Promotions API
export const getAdminPromotionsAPI = () => api.get("/admin/promotions");
export const createPromotionAPI = (data) => api.post("/admin/promotions", data);
export const updatePromotionAPI = (id, data) => api.put(`/admin/promotions/${id}`, data);
export const deletePromotionAPI = (id) => api.delete(`/admin/promotions/${id}`);

// Admin Discounts API
export const getAdminDiscountsAPI = (params) => api.get("/admin/discounts", { params });
export const moderateDiscountAPI = (id, action) => api.put(`/admin/discounts/${id}/moderate`, { action });

// PROFESSIONAL/DENTIST VERIFICATION API
export const uploadProfessionalLicenseAPI = (formData) =>
  api.post("/professional/license-upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
export const getProfessionalStatusAPI = () => api.get("/professional/status");
export const getAdminProfessionalLicensesAPI = () => api.get("/professional/admin/professional-licenses");
export const verifyProfessionalLicenseAPI = (id, data) => api.put(`/professional/admin/professionals/${id}/verify`, data);

// Admin Analytics Alert Rules, Store Orders, Product Sales & Category Products API
export const getAlertRulesAPI = () => api.get("/admin/analytics/alerts/rules");
export const updateAlertRuleAPI = (data) => api.put("/admin/analytics/alerts/rules", data);
export const getStoreOrdersDetailAPI = (params) => api.get("/admin/analytics/sales/store-orders", { params });
export const getProductSalesDetailAPI = (params) => api.get("/admin/analytics/sales/product-sales", { params });
export const getCategoryProductsDetailAPI = (params) => api.get("/admin/analytics/sales/category-products", { params });

export default api;




