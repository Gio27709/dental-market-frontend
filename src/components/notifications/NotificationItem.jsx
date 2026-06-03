import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import { useNotifications } from "../../hooks/useNotifications";

function timeAgo(dateStr) {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "Ahora";
  if (diffMins < 60) return `Hace ${diffMins} min`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `Hace ${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `Hace ${diffDays}d`;
  return date.toLocaleDateString("es-VE", { day: "numeric", month: "short" });
}

export default function NotificationItem({ notification, onClick, compact = false }) {
  const navigate = useNavigate();
  const { markAsRead, getNotificationUrl, NOTIFICATION_ICONS } = useNotifications();

  const icon = NOTIFICATION_ICONS[notification.type] || "🔔";
  const url = getNotificationUrl(notification);

  const handleClick = async () => {
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }
    if (onClick) onClick();
    navigate(url);
  };

  return (
    <button
      onClick={handleClick}
      className="w-full text-left transition-all duration-200"
      style={{
        display: "flex",
        gap: compact ? "10px" : "12px",
        padding: compact ? "10px 14px" : "14px 16px",
        borderRadius: "12px",
        background: notification.is_read ? "transparent" : "rgba(195, 255, 0, 0.06)",
        border: "none",
        cursor: "pointer",
        position: "relative",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = notification.is_read
          ? "rgba(107, 30, 150, 0.04)"
          : "rgba(195, 255, 0, 0.1)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = notification.is_read
          ? "transparent"
          : "rgba(195, 255, 0, 0.06)";
      }}
    >
      {/* Unread indicator */}
      {!notification.is_read && (
        <div
          style={{
            position: "absolute",
            top: compact ? "12px" : "16px",
            left: "6px",
            width: "6px",
            height: "6px",
            borderRadius: "50%",
            background: "#6b1e96",
          }}
        />
      )}

      {/* Icon */}
      <div
        style={{
          fontSize: compact ? "18px" : "22px",
          width: compact ? "32px" : "40px",
          height: compact ? "32px" : "40px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "10px",
          background: "rgba(107, 30, 150, 0.08)",
          flexShrink: 0,
        }}
      >
        {icon}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontSize: compact ? "13px" : "14px",
            fontWeight: notification.is_read ? 400 : 600,
            color: "#1a1a2e",
            margin: 0,
            lineHeight: 1.3,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: compact ? "nowrap" : "normal",
          }}
        >
          {notification.title}
        </p>
        {!compact && (
          <p
            style={{
              fontSize: "12px",
              color: "#727785",
              margin: "3px 0 0",
              lineHeight: 1.4,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {notification.message}
          </p>
        )}
        <p
          style={{
            fontSize: "11px",
            color: "#9ca3af",
            margin: compact ? "2px 0 0" : "5px 0 0",
          }}
        >
          {timeAgo(notification.created_at)}
        </p>
      </div>
    </button>
  );
}

NotificationItem.propTypes = {
  notification: PropTypes.shape({
    id: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    message: PropTypes.string,
    is_read: PropTypes.bool.isRequired,
    created_at: PropTypes.string.isRequired,
  }).isRequired,
  onClick: PropTypes.func,
  compact: PropTypes.bool,
};
