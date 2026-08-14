import PropTypes from "prop-types";
import { AlertTriangle, RotateCw } from "lucide-react";

export default function AnalyticsErrorPanel({ title, message, onRetry }) {
  return (
    <div className="fx-card-danger flex flex-col items-center text-center my-5" role="alert">
      <AlertTriangle className="w-6 h-6 text-fx-neg mb-3" aria-hidden="true" />
      <h3 className="text-sm font-semibold text-fx-text mb-1">{title}</h3>
      {message && <p className="text-fx-muted text-xs mb-4 max-w-md leading-relaxed">{message}</p>}
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-fx-line-strong hover:border-fx-accent/50 text-fx-text hover:text-fx-accent rounded-lg text-xs font-semibold transition-colors"
      >
        <RotateCw className="w-3.5 h-3.5" aria-hidden="true" />
        Reintentar
      </button>
    </div>
  );
}

AnalyticsErrorPanel.propTypes = {
  title: PropTypes.string.isRequired,
  message: PropTypes.string,
  onRetry: PropTypes.func.isRequired,
};
