import { useState, useEffect } from "react";
import PropTypes from "prop-types";

export default function FreshnessBadge({ lastUpdated, onRefresh, isLoading = false }) {
  const [minutesAgo, setMinutesAgo] = useState(0);

  useEffect(() => {
    if (!lastUpdated) return;
    const calculateMinutes = () => {
      const diffMs = Date.now() - new Date(lastUpdated).getTime();
      const mins = Math.max(0, Math.floor(diffMs / 60000));
      setMinutesAgo(mins);
    };

    calculateMinutes();
    const interval = setInterval(calculateMinutes, 30000);
    return () => clearInterval(interval);
  }, [lastUpdated]);

  return (
    <div className="inline-flex items-center gap-3 bg-fx-panel border border-fx-line rounded-full px-4 py-1.5">
      <span className="flex h-2 w-2 relative">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#6b1e96] opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-[#6b1e96]"></span>
      </span>

      <span className="text-xs text-fx-muted font-medium">
        {minutesAgo === 0 ? "Actualizado ahora mismo" : `Actualizado hace ${minutesAgo} min`}
      </span>

      <button
        onClick={onRefresh}
        disabled={isLoading}
        title="Forzar actualización de datos"
        className="text-fx-faint hover:text-fx-accent transition-colors duration-200 p-1 disabled:opacity-50"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
          />
        </svg>
      </button>
    </div>
  );
}

FreshnessBadge.propTypes = {
  lastUpdated: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
  onRefresh: PropTypes.func.isRequired,
  isLoading: PropTypes.bool
};
