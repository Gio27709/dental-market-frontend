import PropTypes from "prop-types";

/**
 * Embudo de conversión en barras horizontales proporcionales al primer paso.
 * Muestra tanto la retención acumulada como la caída respecto al paso anterior,
 * que es donde realmente se identifica la fuga.
 */
export default function ConversionFunnelChart({ steps = [] }) {
  const top = Number(steps[0]?.sessions) || 0;

  return (
    <div className="fx-card">
      <h3 className="text-base font-bold text-fx-text mb-1">Embudo de Conversión</h3>
      <p className="text-xs text-fx-muted mb-6">Sesiones que alcanzaron cada etapa del recorrido de compra</p>

      <div className="space-y-3">
        {steps.map((step, index) => {
          const sessions = Number(step.sessions) || 0;
          const widthPct = top > 0 ? (sessions / top) * 100 : 0;
          const prev = index > 0 ? Number(steps[index - 1].sessions) || 0 : null;
          const dropped = prev !== null ? prev - sessions : 0;

          return (
            <div key={step.step_key}>
              <div className="flex items-center justify-between mb-1 text-xs">
                <span className="font-bold text-fx-text">{step.step_label}</span>
                <span className="text-fx-muted">
                  <span className="font-semibold text-fx-accent">{sessions.toLocaleString()}</span>
                  <span className="text-gray-500"> · {parseFloat(step.pct_of_top || 0).toFixed(1)}% del total</span>
                </span>
              </div>

              <div className="h-8 bg-purple-950/50 rounded-xl overflow-hidden border border-fx-line">
                <div
                  className="h-full rounded-xl transition-all duration-500"
                  style={{
                    width: `${Math.max(widthPct, sessions > 0 ? 2 : 0)}%`,
                    background: "linear-gradient(90deg, #6b1e96 0%, #7c4f9e 100%)",
                  }}
                />
              </div>

              {dropped > 0 && (
                <p className="text-[10px] text-fx-neg/90 mt-1 ml-1">
                  ↓ {dropped.toLocaleString()} sesiones se perdieron aquí
                  {step.pct_of_previous !== null && ` (avanzó el ${parseFloat(step.pct_of_previous || 0).toFixed(1)}%)`}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

ConversionFunnelChart.propTypes = {
  steps: PropTypes.arrayOf(
    PropTypes.shape({
      step_key: PropTypes.string,
      step_label: PropTypes.string,
      sessions: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      pct_of_top: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      pct_of_previous: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    })
  ),
};
