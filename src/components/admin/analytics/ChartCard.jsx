import { useState } from "react";
import PropTypes from "prop-types";
import { AreaChart, BarChart3, LineChart } from "lucide-react";

const CHART_TYPES = [
  { key: "area", label: "Área", icon: AreaChart },
  { key: "bar", label: "Barras", icon: BarChart3 },
  { key: "line", label: "Líneas", icon: LineChart },
];

export default function ChartCard({ title, subtitle, children, onTypeChange, actions }) {
  const [chartType, setChartType] = useState("area");

  const handleTypeSwitch = (type) => {
    setChartType(type);
    if (onTypeChange) onTypeChange(type);
  };

  return (
    <div className="fx-card mb-5">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-5">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-fx-text leading-snug">{title}</h3>
          {subtitle && <p className="text-xs text-fx-muted mt-1 leading-relaxed">{subtitle}</p>}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {actions}
          {onTypeChange && (
            <div
              className="inline-flex items-center gap-0.5 bg-fx-inset border border-fx-line rounded-lg p-0.5"
              role="group"
              aria-label="Tipo de gráfica"
            >
              {CHART_TYPES.map(({ key, label, icon: Icon }) => {
                const isActive = chartType === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleTypeSwitch(key)}
                    aria-pressed={isActive}
                    title={label}
                    className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                      isActive
                        ? "bg-fx-raised text-fx-text"
                        : "text-fx-faint hover:text-fx-muted"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" aria-hidden="true" />
                    <span className="hidden lg:inline">{label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="w-full min-h-[280px]">
        {children}
      </div>
    </div>
  );
}

ChartCard.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  children: PropTypes.node.isRequired,
  onTypeChange: PropTypes.func,
  actions: PropTypes.node
};
