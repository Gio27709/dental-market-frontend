/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useEffect, useCallback, useRef } from "react";
import PropTypes from "prop-types";
import { useAuth } from "./AuthContext";
import { supabase } from "../lib/supabaseClient";
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
};

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const channelRef = useRef(null);

  // Notification type → navigation URL
  const getNotificationUrl = useCallback((notification) => {
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
      case "new_product_to_moderate":
        return data.product_id ? `/product/${data.product_id}` : "/store/products";
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
      case "store_application_rejected":
      case "new_store_application":
        return "/account";
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
        return "/admin/returns";
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

  // Subscribe to Supabase Realtime for new notifications
  useEffect(() => {
    if (!user) {
      // Cleanup on logout
      setUnreadCount(0);
      setNotifications([]);
      return;
    }

    // Initial fetch
    fetchUnreadCount();

    // Subscribe to real-time inserts
    const channel = supabase
      .channel(`notifications-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newNotif = payload.new;
          // Add to local state
          setNotifications((prev) => [newNotif, ...prev]);
          setUnreadCount((prev) => prev + 1);
          // Show toast
          const icon = NOTIFICATION_ICONS[newNotif.type] || "🔔";
          toast(
            `${icon} ${newNotif.title}`,
            {
              duration: 4000,
              style: {
                background: "#1a1a2e",
                color: "#ffffff",
                borderLeft: "4px solid #c3ff00",
                fontSize: "14px",
              },
            }
          );
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [user, fetchUnreadCount]);

  const value = {
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
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

NotificationProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
