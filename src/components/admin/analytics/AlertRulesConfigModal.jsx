import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { getAlertRulesAPI, updateAlertRuleAPI } from "../../../services/api";
import toast from "react-hot-toast";
import ModalOverlay from "./ModalOverlay";

export default function AlertRulesConfigModal({ isOpen, onClose }) {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingRuleKey, setSavingRuleKey] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchRules();
    }
  }, [isOpen]);

  const fetchRules = async () => {
    setLoading(true);
    try {
      const res = await getAlertRulesAPI();
      if (res.data?.success) {
        setRules(res.data.data);
      }
    } catch (err) {
      console.error("Error cargando reglas de alertas:", err);
      toast.error("No se pudieron obtener las reglas de alertas.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleEnable = async (ruleKey, currentEnabled) => {
    setSavingRuleKey(ruleKey);
    try {
      const targetRule = rules.find((r) => r.rule_key === ruleKey);
      const res = await updateAlertRuleAPI({
        rule_key: ruleKey,
        is_enabled: !currentEnabled,
        threshold_value: targetRule?.threshold_value
      });

      if (res.data?.success) {
        setRules((prev) =>
          prev.map((r) => (r.rule_key === ruleKey ? { ...r, is_enabled: !currentEnabled } : r))
        );
        toast.success("Regla de alerta actualizada.");
      }
    } catch (err) {
      console.error("Error guardando regla de alerta:", err);
      toast.error("Error actualizando regla.");
    } finally {
      setSavingRuleKey(null);
    }
  };

  const handleThresholdChange = (ruleKey, value) => {
    setRules((prev) =>
      prev.map((r) => (r.rule_key === ruleKey ? { ...r, threshold_value: value } : r))
    );
  };

  const handleSaveThreshold = async (ruleKey) => {
    setSavingRuleKey(ruleKey);
    try {
      const targetRule = rules.find((r) => r.rule_key === ruleKey);
      const res = await updateAlertRuleAPI({
        rule_key: ruleKey,
        is_enabled: targetRule?.is_enabled,
        threshold_value: parseFloat(targetRule?.threshold_value)
      });

      if (res.data?.success) {
        toast.success(`Umbral para ${targetRule?.rule_name} actualizado.`);
      }
    } catch (err) {
      console.error("Error guardando umbral:", err);
      toast.error("Error guardando umbral.");
    } finally {
      setSavingRuleKey(null);
    }
  };

  if (!isOpen) return null;

  return (
    <ModalOverlay zIndexClass="z-[200]">
      <div className="bg-fx-panel border border-fx-line-strong rounded-xl p-6 max-w-2xl w-full relative overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-fx-line mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-fx-warn/10 border border-fx-warn/30 flex items-center justify-center text-fx-warn text-xl font-bold">
              ⚙️
            </div>
            <div>
              <h3 className="text-lg font-bold text-fx-text">Configuración de Reglas de Alertas</h3>
              <p className="text-fx-muted text-xs">Ajusta umbrales críticos de detección proactiva de anomalías</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-fx-inset hover:bg-fx-raised border border-fx-line-strong flex items-center justify-center text-fx-muted font-bold transition-all"
          >
            ✕
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-fx-faint text-sm font-semibold animate-pulse">
            Cargando reglas de alertas dinámicas desde la base de datos...
          </div>
        ) : rules.length === 0 ? (
          <div className="p-8 text-center text-fx-muted text-xs">
            No se encontraron reglas de alerta configuradas en la base de datos.
          </div>
        ) : (
          <div className="space-y-3.5 max-h-[60vh] overflow-y-auto pr-2">
            {rules.map((rule) => (
              <div
                key={rule.rule_key}
                className="fx-card-sm flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:border-fx-line-strong"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-fx-text text-sm">{rule.rule_name}</span>
                    <span className="text-[10px] uppercase font-semibold text-fx-warn bg-fx-warn/10 px-2 py-0.5 rounded-full border border-fx-warn/20">
                      {rule.rule_key}
                    </span>
                  </div>
                  <p className="text-fx-muted text-xs">
                    El sistema disparará un banner preventivo si esta métrica supera el {rule.threshold_value}%
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 bg-purple-950/80 border border-fx-line-strong rounded-xl px-2.5 py-1.5">
                    <input
                      type="number"
                      value={rule.threshold_value || 0}
                      onChange={(e) => handleThresholdChange(rule.rule_key, e.target.value)}
                      className="w-16 bg-transparent text-center font-bold text-fx-accent text-sm outline-none"
                    />
                    <span className="text-fx-muted text-xs font-bold">%</span>
                    <button
                      onClick={() => handleSaveThreshold(rule.rule_key)}
                      disabled={savingRuleKey === rule.rule_key}
                      className="ml-2 text-[11px] font-bold text-fx-accent bg-[#6b1e96]/10 hover:bg-[#6b1e96]/20 border border-fx-accent/30 px-2 py-0.5 rounded-lg transition-all"
                    >
                      {savingRuleKey === rule.rule_key ? "..." : "Guardar"}
                    </button>
                  </div>

                  <button
                    onClick={() => handleToggleEnable(rule.rule_key, rule.is_enabled)}
                    disabled={savingRuleKey === rule.rule_key}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                      rule.is_enabled
                        ? "bg-fx-pos/20 text-fx-pos border-fx-pos/40 hover:bg-fx-pos/30"
                        : "bg-gray-800 text-fx-muted border-gray-700 hover:bg-gray-700"
                    }`}
                  >
                    {rule.is_enabled ? "ACTIVA" : "DESACTIVA"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="pt-4 mt-4 border-t border-fx-line text-right">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#6b1e96] hover:bg-[#531575] text-white rounded-xl text-xs font-bold transition-all shadow-lg"
          >
            Cerrar Ventana
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
}

AlertRulesConfigModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired
};
