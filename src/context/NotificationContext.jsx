/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import { useAuth } from "./AuthContext";
import { socket, connectSocket, disconnectSocket } from "../lib/socket";
import {
  getNotificationsAPI,
  getUnreadCountAPI,
  markNotificationReadAPI,
  markAllNotificationsReadAPI,
  deleteNotificationAPI,
} from "../services/api";
import toast from "react-hot-toast";

export const NotificationContext = createContext(null);

// Notification type → icon mapping
const NOTIFICATION_ICONS = {
  order_created: "📦",
  payment_uploaded: "📄",
  payment_approved: "✅",
  payment_rejected: "❌",
  order_shipped: "🚚",
  order_delivered: "🎉",
  order_cancelled: "🚫",
  new_order_for_store: "🛒",
  payment_approved_store: "💳",
  delivery_confirmed_store: "💰",
  product_moderated: "📋",
  new_question: "❓",
  new_review_on_product: "⭐",
  question_answered: "💬",
  payout_processed: "🏦",
  store_application_approved: "🎊",
  store_application_rejected: "😔",
  license_verified: "✔️",
  new_payment_to_review: "🔍",
  new_store_application: "🏪",
  new_product_to_moderate: "📝",
  payout_requested: "💸",
  payout_approved: "💵",
  payout_rejected: "❌",
  abandoned_cart: "🛒",
  welcome: "👋",
  new_delivery_assigned: "🛵",
  // Delivery/Rider events
  delivery_completed_rider: "📦",
  delivery_completed_rider_store: "📦",
  rider_affiliated: "🤝",
  rider_toggled: "⏸️",
  rider_removed: "👋",
  // Return events
  new_return_request: "⚠️",
  new_return_request_store: "⚠️",
  return_approved: "✅",
  return_rejected: "❌",
  return_resolved_store: "📋",
  // Cancellation events
  order_item_cancelled: "🚫",
  order_cancelled_by_store: "🚫",
  stock_restored_abandonment: "🔄",
  // Auto-confirm
  delivery_auto_confirmed: "⏰",
  // Support events
  support_message: "💬",
  support_ticket_status: "📋",
  new_support_ticket: "🎫",
};

export function NotificationProvider({ children }) {
  const { user, token } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  // Ref para no resuscribir el socket cada vez que cambia la ubicación.
  const navigate = useNavigate();
  const navigateRef = useRef(navigate);
  navigateRef.current = navigate;

  // Respaldo para filas sin `link`. El destino real lo calcula el backend
  // (backend/src/services/notificationLinks.js) y llega en `notification.link`.
  const getNotificationUrl = useCallback((notification) => {
    if (notification?.link) return notification.link;
    const data = notification.data || {};
    const isAdmin = user && ["admin", "owner"].includes(user.role);
    const isStore = user && user.role === "store";

    switch (notification.type) {
      case "order_created":
      case "payment_uploaded":
      case "payment_approved":
      case "payment_rejected":
      case "order_shipped":
      case "order_delivered":
      case "order_cancelled":
        return data.order_id ? `/account/orders/${data.order_id}` : "/account/orders";
      case "new_order_for_store":
      case "payment_approved_store":
      case "delivery_confirmed_store":
        return "/store/orders";
      case "product_moderated":
        return data.product_id ? `/store/products/edit/${data.product_id}` : "/store/products";
      case "new_product_to_moderate":
        return "/admin/product-moderation";
      case "new_question":
      case "new_review_on_product":
      case "question_answered":
        return data.product_id ? `/product/${data.product_id}` : "/";
      
      // Retiros (Payouts)
      case "payout_processed":
      case "payout_approved":
      case "payout_rejected":
        return isStore ? "/store/wallet" : "/account/notifications";
      case "payout_requested":
        return isAdmin ? "/admin/payouts" : (isStore ? "/store/wallet" : "/account/notifications");

      case "store_application_approved":
        return "/store";
      case "store_application_rejected":
        return "/account";
      case "new_store_application":
        return "/admin/store-applications";
      case "new_delivery_assigned":
        return "/delivery";
      case "new_payment_to_review":
        return "/admin/payment-approvals";
      // Delivery/Rider events
      case "delivery_completed_rider":
      case "delivery_auto_confirmed":
        return data.order_id ? `/account/orders/${data.order_id}` : "/account/orders";
      case "delivery_completed_rider_store":
        return "/store/orders";
      case "rider_affiliated":
      case "rider_toggled":
      case "rider_removed":
        return "/delivery";
      // Return events
      case "new_return_request":
        return "/admin/refunds";
      case "new_return_request_store":
      case "return_resolved_store":
        return "/store/orders";
      case "return_approved":
      case "return_rejected":
        return data.order_id ? `/account/orders/${data.order_id}` : "/account/orders";
      // Cancellation events
      case "order_item_cancelled":
      case "order_cancelled_by_store":
        return data.order_id ? `/account/orders/${data.order_id}` : "/account/orders";
      case "stock_restored_abandonment":
        return "/store/orders";
      // Support events
      case "support_message":
      case "support_ticket_status":
        return data.ticket_id ? `/account/support?ticketId=${data.ticket_id}` : "/account/support";
      case "new_support_ticket":
        return data.ticket_id ? `/admin/support?ticketId=${data.ticket_id}` : "/admin/support";
      default:
        return "/account/notifications";
    }
  }, [user]);

  // Fetch unread count on mount and when user changes
  const fetchUnreadCount = useCallback(async () => {
    if (!user) return;
    try {
      const { data } = await getUnreadCountAPI();
      if (data?.success) {
        setUnreadCount(data.count);
      }
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error("[Notifications] fetchUnreadCount failed:", err.message, err.response?.status);
      }
    }
  }, [user]);

  // Fetch recent notifications (for dropdown)
  const fetchNotifications = useCallback(async (page = 1, limit = 20, filter = "") => {
    if (!user) return;
    setLoading(true);
    try {
      const params = { page, limit };
      if (filter) params.filter = filter;
      const { data } = await getNotificationsAPI(params);
      if (data?.success) {
        if (page === 1) {
          setNotifications(data.data);
        } else {
          setNotifications((prev) => [...prev, ...data.data]);
        }
        return data;
      }
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error("[Notifications] fetchNotifications failed:", err.message, err.response?.status);
      }
    } finally {
      setLoading(false);
    }
    return null;
  }, [user]);

  // Mark single notification as read
  const markAsRead = useCallback(async (notificationId) => {
    try {
      await markNotificationReadAPI(notificationId);
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, is_read: true, read_at: new Date().toISOString() } : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // Silent fail
    }
  }, []);

  // Mark all as read
  const markAllRead = useCallback(async () => {
    try {
      await markAllNotificationsReadAPI();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
      );
      setUnreadCount(0);
    } catch {
      // Silent fail
    }
  }, []);

  // Delete a notification
  const removeNotification = useCallback(async (notificationId) => {
    try {
      await deleteNotificationAPI(notificationId);
      setNotifications((prev) => {
        const target = prev.find((n) => n.id === notificationId);
        if (target && !target.is_read) {
          setUnreadCount((c) => Math.max(0, c - 1));
        }
        return prev.filter((n) => n.id !== notificationId);
      });
    } catch {
      // Silent fail
    }
  }, []);

  // Manage socket connection lifecycle reactively based on token
  useEffect(() => {
    if (token) {
      connectSocket(token);
    } else {
      disconnectSocket();
    }
  }, [token]);

  // Subscribe to Socket.io for new notifications
  useEffect(() => {
    if (!user) {
      // Cleanup on logout
      setUnreadCount(0);
      setNotifications([]);
      return;
    }

    // Initial fetch
    fetchUnreadCount();

    // Listen to notification events from socket
    const handleNotification = (newNotif) => {
      // Add to local state
      setNotifications((prev) => {
        // Prevent duplicates
        if (prev.some((n) => n.id === newNotif.id)) return prev;
        return [newNotif, ...prev];
      });
      setUnreadCount((prev) => prev + 1);
      
      // Toast clicable: lleva al mismo destino que la notificación
      const icon = NOTIFICATION_ICONS[newNotif.type] || "🔔";
      const link = getNotificationUrl(newNotif);
      toast(
        (t) => (
          <span
            role="link"
            onClick={() => {
              toast.dismiss(t.id);
              markAsRead(newNotif.id);
              navigateRef.current(link);
            }}
            style={{ cursor: "pointer", display: "block" }}
          >
            {icon} {newNotif.title}
          </span>
        ),
        {
          duration: 5000,
          style: {
            background: "#1a1a2e",
            color: "#ffffff",
            borderLeft: "4px solid #c3ff00",
            fontSize: "14px",
          },
        }
      );
    };

    socket.on("notification", handleNotification);

    return () => {
      socket.off("notification", handleNotification);
    };
  }, [user, fetchUnreadCount, getNotificationUrl, markAsRead]);

  const value = useMemo(() => ({
    unreadCount,
    notifications,
    loading,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllRead,
    removeNotification,
    getNotificationUrl,
    NOTIFICATION_ICONS,
  }), [unreadCount, notifications, loading, fetchNotifications, fetchUnreadCount, markAsRead, markAllRead, removeNotification, getNotificationUrl]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

NotificationProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
