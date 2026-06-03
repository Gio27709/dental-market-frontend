import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "../../hooks/useNotifications";
import { useAuth } from "../../context/AuthContext";
import NotificationItem from "./NotificationItem";

export default function NotificationBell() {
  const { user } = useAuth();
  const {
    unreadCount,
    notifications,
    fetchNotifications,
    markAllRead,
    loading,
  } = useNotifications();

  const [isOpen, setIsOpen] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Load notifications when dropdown opens
  const handleToggle = useCallback(async () => {
    if (!user) return;
    const willOpen = !isOpen;
    setIsOpen(willOpen);
    if (willOpen && !hasLoaded) {
      await fetchNotifications(1, 8);
      setHasLoaded(true);
    }
  }, [isOpen, hasLoaded, fetchNotifications, user]);

  // Shake animation on new notification
  const [shake, setShake] = useState(false);
  const prevCount = useRef(unreadCount);
  useEffect(() => {
    if (unreadCount > prevCount.current) {
      setShake(true);
      // Reload dropdown data if it was already loaded
      if (hasLoaded) {
        fetchNotifications(1, 8);
      }
      setTimeout(() => setShake(false), 600);
    }
    prevCount.current = unreadCount;
  }, [unreadCount, hasLoaded, fetchNotifications]);

  if (!user) return null;

  return (
    <div ref={dropdownRef} style={{ position: "relative" }}>
      {/* Bell Button */}
      <div
        onClick={handleToggle}
        aria-label="Notificaciones"
        className={`relative cursor-pointer transition-colors flex items-center gap-2 ${
          isOpen ? "text-[#c3ff00]" : "text-white hover:text-gray-200"
        }`}
      >
        <div className="relative flex items-center justify-center outline-none bg-transparent border-none p-0">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-6 h-6 md:w-5 md:h-5"
            style={{
              animation: shake ? "bellShake 0.5s ease-in-out" : "none",
            }}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
            />
          </svg>

          {/* Badge */}
          {unreadCount > 0 && (
            <span
              className="absolute -top-[10px] -right-[12px] md:-top-[8px] md:-right-[8px] bg-[#ff6b00] text-white text-[10px] md:text-[9px] font-bold rounded-full h-5 w-5 md:h-4 md:w-4 flex items-center justify-center shadow-sm"
              style={{ animation: "badgePop 0.3s ease-out" }}
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </div>
      </div>

      {/* Dropdown Panel */}
      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            width: "380px",
            maxHeight: "480px",
            background: "#ffffff",
            borderRadius: "16px",
            boxShadow: "0 12px 40px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.04)",
            zIndex: 999,
            overflow: "hidden",
            animation: "dropdownSlide 0.2s ease-out",
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "16px 18px 12px",
              borderBottom: "1px solid #f0f0f5",
            }}
          >
            <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#1a1a2e", margin: 0 }}>
              Notificaciones
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  markAllRead();
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: "#6b1e96",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                  padding: "4px 8px",
                  borderRadius: "6px",
                  transition: "background 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(107,30,150,0.06)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
              >
                Marcar todo como leído
              </button>
            )}
          </div>

          {/* Notification List */}
          <div
            style={{
              overflowY: "auto",
              maxHeight: "370px",
              padding: "6px",
            }}
          >
            {loading && notifications.length === 0 ? (
              <div style={{ textAlign: "center", padding: "32px 16px", color: "#9ca3af" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "28px", marginBottom: "8px", display: "block" }}>
                  hourglass_top
                </span>
                Cargando...
              </div>
            ) : notifications.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 16px" }}>
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: "40px", color: "#d1d5db", marginBottom: "8px", display: "block" }}
                >
                  notifications_off
                </span>
                <p style={{ fontSize: "14px", color: "#9ca3af", margin: 0 }}>
                  No tienes notificaciones
                </p>
              </div>
            ) : (
              notifications.slice(0, 8).map((notif) => (
                <NotificationItem
                  key={notif.id}
                  notification={notif}
                  compact
                  onClick={() => setIsOpen(false)}
                />
              ))
            )}
          </div>

          {/* Footer */}
          <div style={{ borderTop: "1px solid #f0f0f5", padding: "8px 12px" }}>
            <button
              onClick={() => {
                setIsOpen(false);
                navigate("/account/notifications");
              }}
              style={{
                width: "100%",
                background: "none",
                border: "none",
                color: "#6b1e96",
                fontSize: "13px",
                fontWeight: 600,
                padding: "10px",
                borderRadius: "10px",
                cursor: "pointer",
                transition: "background 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(107,30,150,0.04)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
            >
              Ver todas las notificaciones →
            </button>
          </div>
        </div>
      )}

      {/* CSS Animations */}
      <style>{`
        @keyframes bellShake {
          0%, 100% { transform: rotate(0); }
          15% { transform: rotate(14deg); }
          30% { transform: rotate(-14deg); }
          45% { transform: rotate(8deg); }
          60% { transform: rotate(-8deg); }
          75% { transform: rotate(3deg); }
        }
        @keyframes badgePop {
          0% { transform: scale(0.5); opacity: 0; }
          60% { transform: scale(1.15); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes dropdownSlide {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
