import { useState } from "react";
import PropTypes from "prop-types";
import AlertRulesConfigModal from "./AlertRulesConfigModal";

const fmt = (v) => Number(v).toLocaleString("es-VE", { maximumFractionDigits: 2 });

/**
 * Banner de alertas del Resumen ejecutivo.
 *
 * Recibe SOLO las reglas que el backend ya midió y que superan su umbral en el período
 * (`triggeredAlerts`). Antes recibía todas las reglas activas y las anunciaba como
 * «anomalías detectadas» sin haber medido nada, así que siempre había 5 alertas.
 */
export default function GlobalAlertHeaderBanner({ alerts = [] }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const modal = (
    <AlertRulesConfigModal
      isOpen={isModalOpen}
      onClose={() => setIsModalOpen(false)}
    />
  );

  if (!alerts || alerts.length === 0) {
    // Sin alertas que mostrar, pero la configuración de umbrales sigue a mano.
    return (
      <>
        <div className="flex items-center justify-end gap-2 text-[11px] text-fx-faint -mb-2">
          <span>Ninguna regla de alerta supera su umbral en este período.</span>
          <button
            onClick={() => setIsModalOpen(true)}
            className="font-semibold text-fx-muted hover:text-fx-accent transition-colors"
          >
            Configurar alertas
          </button>
        </div>
        {modal}
      </>
    );
  }

  return (
    <>
      <div className="w-full bg-fx-panel border border-fx-warn/40 rounded-2xl p-4 mb-5 relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        {/* Ambient Glow */}
        <div className="absolute -left-12 -top-12 w-32 h-32 bg-fx-warn/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center gap-3 relative z-10">
          <div className="w-9 h-9 rounded-xl bg-fx-warn/20 border border-fx-warn/50 flex items-center justify-center text-fx-warn shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5 animate-pulse">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-fx-text uppercase tracking-wider">
              Alertas de Anomalías Detectadas ({alerts.length})
            </h4>
            <p className="text-[11px] text-fx-muted">
              Métricas del período que superan el umbral configurado.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap relative z-10">
          {alerts.slice(0, 3).map((rule, idx) => (
            <span
              key={rule.rule_key || idx}
              className="text-[11px] font-bold bg-fx-warn/20 text-fx-warn border border-fx-warn/40 rounded-lg px-2.5 py-1"
              title={`Umbral: ${fmt(rule.threshold_value)} ${rule.unit || ""}`}
            >
              {rule.rule_name}:{" "}
              <span className="font-semibold text-fx-text">
                {fmt(rule.value)} {rule.unit}
              </span>{" "}
              <span className="font-normal text-fx-muted">(umbral {fmt(rule.threshold_value)})</span>
            </span>
          ))}

          <button
            onClick={() => setIsModalOpen(true)}
            className="ml-2 text-xs font-bold text-fx-warn hover:text-fx-text bg-fx-warn/20 hover:bg-fx-warn/30 border border-fx-warn/40 px-3 py-1 rounded-lg transition-all flex items-center gap-1"
          >
            <span>⚙️</span>
            <span>Configurar Alertas</span>
          </button>
        </div>
      </div>

      {modal}
    </>
  );
}

GlobalAlertHeaderBanner.propTypes = {
  alerts: PropTypes.arrayOf(
    PropTypes.shape({
      rule_key: PropTypes.string,
      rule_name: PropTypes.string,
      threshold_value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      value: PropTypes.number,
      unit: PropTypes.string
    })
  )
};
