import PropTypes from "prop-types";
import { BarChart3 } from "lucide-react";

export default function EmptyState({ message = "Sin datos registrados en el período seleccionado." }) {
  return (
    <div className="fx-surface flex flex-col items-center justify-center p-8 text-center min-h-[200px]">
      <BarChart3 className="w-6 h-6 text-fx-faint mb-3" aria-hidden="true" />
      <p className="text-fx-muted text-xs max-w-sm leading-relaxed">{message}</p>
    </div>
  );
}

EmptyState.propTypes = {
  message: PropTypes.string
};
