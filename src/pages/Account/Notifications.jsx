import { useState, useEffect, useCallback } from "react";
import { useNotifications } from "../../hooks/useNotifications";
import NotificationItem from "../../components/notifications/NotificationItem";

const FILTERS = [
  { key: "", label: "Todas", icon: "notifications" },
  { key: "unread", label: "No leídas", icon: "mark_email_unread" },
];

export default function Notifications() {
  const {
    notifications,
    fetchNotifications,
    markAllRead,
    removeNotification,
    unreadCount,
    loading,
  } = useNotifications();

  const [activeFilter, setActiveFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [initialLoaded, setInitialLoaded] = useState(false);

  const loadNotifications = useCallback(async (pg = 1, filter = activeFilter) => {
    const result = await fetchNotifications(pg, 15, filter);
    if (result?.pagination) {
      setPagination(result.pagination);
    }
    setInitialLoaded(true);
  }, [fetchNotifications, activeFilter]);

  useEffect(() => {
    loadNotifications(1, activeFilter);
    setPage(1);
  }, [activeFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLoadMore = async () => {
    const nextPage = page + 1;
    await loadNotifications(nextPage, activeFilter);
    setPage(nextPage);
  };

  const handleDelete = async (e, notifId) => {
    e.stopPropagation();
    await removeNotification(notifId);
  };

  return (
    <div>
      {/* Page Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "24px",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "24px",
              fontWeight: 700,
              color: "#1a1a2e",
              margin: 0,
            }}
          >
            Notificaciones
          </h1>
          <p
            style={{
              fontSize: "13px",
              color: "#727785",
              margin: "4px 0 0",
            }}
          >
            {unreadCount > 0
              ? `Tienes ${unreadCount} notificación${unreadCount !== 1 ? "es" : ""} sin leer`
              : "Estás al día"}
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 16px",
              borderRadius: "10px",
              border: "1px solid #e5e7eb",
              background: "#ffffff",
              color: "#6b1e96",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#f3e8ff";
              e.currentTarget.style.borderColor = "#6b1e96";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#ffffff";
              e.currentTarget.style.borderColor = "#e5e7eb";
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
              done_all
            </span>
            Marcar todo como leído
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          marginBottom: "20px",
        }}
      >
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setActiveFilter(f.key)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 16px",
              borderRadius: "10px",
              border: activeFilter === f.key ? "1px solid #6b1e96" : "1px solid #e5e7eb",
              background: activeFilter === f.key ? "#f3e8ff" : "#ffffff",
              color: activeFilter === f.key ? "#6b1e96" : "#727785",
              fontSize: "13px",
              fontWeight: activeFilter === f.key ? 600 : 400,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
              {f.icon}
            </span>
            {f.label}
          </button>
        ))}
      </div>

      {/* Notification List */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: "16px",
          boxShadow: "0 4px 24px rgba(107, 30, 150, 0.06)",
          overflow: "hidden",
        }}
      >
        {loading && !initialLoaded ? (
          <div style={{ textAlign: "center", padding: "60px 24px", color: "#9ca3af" }}>
            <span className="material-symbols-outlined" style={{ fontSize: "40px", marginBottom: "12px", display: "block" }}>
              hourglass_top
            </span>
            <p style={{ fontSize: "14px", margin: 0 }}>Cargando notificaciones...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 24px" }}>
            <span
              className="material-symbols-outlined"
              style={{ fontSize: "56px", color: "#d1d5db", marginBottom: "12px", display: "block" }}
            >
              {activeFilter === "unread" ? "mark_email_read" : "notifications_off"}
            </span>
            <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#1a1a2e", margin: "0 0 6px" }}>
              {activeFilter === "unread"
                ? "¡Estás al día!"
                : "No tienes notificaciones aún"}
            </h3>
            <p style={{ fontSize: "13px", color: "#9ca3af", margin: 0 }}>
              {activeFilter === "unread"
                ? "No tienes notificaciones pendientes por leer."
                : "Las notificaciones aparecerán aquí cuando haya actividad en tu cuenta."}
            </p>
          </div>
        ) : (
          <div style={{ padding: "8px" }}>
            {notifications.map((notif) => (
              <div key={notif.id} style={{ position: "relative" }}>
                <NotificationItem notification={notif} />
                {/* Delete button on hover */}
                <button
                  onClick={(e) => handleDelete(e, notif.id)}
                  title="Eliminar notificación"
                  style={{
                    position: "absolute",
                    top: "12px",
                    right: "12px",
                    width: "28px",
                    height: "28px",
                    borderRadius: "8px",
                    border: "none",
                    background: "transparent",
                    color: "#9ca3af",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.2s",
                    opacity: 0.4,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#fef2f2";
                    e.currentTarget.style.color = "#ef4444";
                    e.currentTarget.style.opacity = "1";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "#9ca3af";
                    e.currentTarget.style.opacity = "0.4";
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                    close
                  </span>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Load More */}
        {pagination && pagination.page < pagination.totalPages && (
          <div style={{ padding: "12px 16px", borderTop: "1px solid #f0f0f5", textAlign: "center" }}>
            <button
              onClick={handleLoadMore}
              disabled={loading}
              style={{
                padding: "10px 32px",
                borderRadius: "10px",
                border: "1px solid #e5e7eb",
                background: "#ffffff",
                color: "#6b1e96",
                fontSize: "13px",
                fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.6 : 1,
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                if (!loading) e.currentTarget.style.background = "#f3e8ff";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#ffffff";
              }}
            >
              {loading ? "Cargando..." : "Cargar más"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
