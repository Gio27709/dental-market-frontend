import { useState } from "react";
import PropTypes from "prop-types";
import AlertRulesConfigModal from "./AlertRulesConfigModal";

export default function GlobalAlertHeaderBanner({ alerts = [] }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!alerts || alerts.length === 0) return null;

  return (
    <>
      <div className="w-full bg-fx-panel border border-amber-500/40 rounded-2xl p-4 mb-5 relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        {/* Ambient Glow */}
        <div className="absolute -left-12 -top-12 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center gap-3 relative z-10">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400 shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5 animate-pulse">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-fx-text uppercase tracking-wider">
              Alertas de Anomalías Detectadas ({alerts.length})
            </h4>
            <p className="text-[11px] text-fx-muted">
              Se han detectado variaciones o umbrales críticos en la plataforma.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap relative z-10">
          {alerts.slice(0, 3).map((rule, idx) => (
            <span
              key={rule.rule_key || idx}
              className="text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-lg px-2.5 py-1"
            >
              {rule.rule_name}: <span className="font-semibold text-fx-text">{rule.threshold_value}%</span>
            </span>
          ))}

          <button
            onClick={() => setIsModalOpen(true)}
            className="ml-2 text-xs font-bold text-amber-300 hover:text-fx-text bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 px-3 py-1 rounded-lg transition-all flex items-center gap-1"
          >
            <span>⚙️</span>
            <span>Configurar Alertas</span>
          </button>
        </div>
      </div>

      <AlertRulesConfigModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}

GlobalAlertHeaderBanner.propTypes = {
  alerts: PropTypes.arrayOf(
    PropTypes.shape({
      rule_key: PropTypes.string,
      rule_name: PropTypes.string,
      threshold_value: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
    })
  )
};
