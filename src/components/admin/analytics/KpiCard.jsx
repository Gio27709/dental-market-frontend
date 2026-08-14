import PropTypes from "prop-types";
import { ArrowRight, Info, TrendingDown, TrendingUp } from "lucide-react";

export default function KpiCard({
  title,
  value,
  previous,
  deltaPct,
  format = "number",
  prefix = "",
  suffix = "",
  tooltip,
  drilldownUrl,
  onDrilldown,
  status = "normal"
}) {
  const formatValue = (val) => {
    if (val === null || val === undefined || status === "no_data") return "—";
    if (typeof val === "object" && val.value !== undefined) val = val.value;
    if (typeof val !== "number") val = parseFloat(val) || 0;
    if (format === "currency") return `$${val.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    if (format === "percent") return `${val.toLocaleString("en-US", { maximumFractionDigits: 2 })}%`;
    return `${val.toLocaleString("en-US")}`;
  };

  const handleClick = () => {
    if (onDrilldown) {
      onDrilldown();
    } else if (drilldownUrl) {
      window.location.href = drilldownUrl;
    }
  };

  const hasClickAction = Boolean(onDrilldown || drilldownUrl);
  const hasComparison =
    previous !== null && previous !== undefined && previous !== 0 &&
    deltaPct !== null && deltaPct !== undefined;

  const renderDelta = () => {
    if (!hasComparison) {
      return <span className="text-[11px] text-fx-faint">Sin período previo</span>;
    }

    const isPositive = deltaPct >= 0;
    const Arrow = isPositive ? TrendingUp : TrendingDown;
    return (
      <span className="flex items-center gap-1.5 min-w-0">
        <span
          className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-semibold fx-num ${
            isPositive
              ? "text-fx-pos bg-fx-pos/10"
              : "text-fx-neg bg-fx-neg/10"
          }`}
        >
          <Arrow className="w-3 h-3" aria-hidden="true" />
          {Math.abs(deltaPct)}%
        </span>
        <span className="text-[11px] text-fx-faint truncate">vs. previo</span>
      </span>
    );
  };

  const Wrapper = hasClickAction ? "button" : "div";

  return (
    <Wrapper
      {...(hasClickAction ? { type: "button", onClick: handleClick } : {})}
      className={`fx-card group w-full text-left flex flex-col ${
        hasClickAction ? "fx-interactive" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2.5">
        <span className="text-[11px] font-semibold text-fx-muted uppercase tracking-[0.1em] leading-snug">
          {title}
        </span>
        {tooltip && (
          <span className="relative group/tooltip shrink-0">
            <Info className="w-3.5 h-3.5 text-fx-faint hover:text-fx-muted transition-colors" aria-hidden="true" />
            <span
              role="tooltip"
              className="absolute right-0 top-5 w-56 p-2.5 bg-fx-inset border border-fx-line-strong rounded-lg text-[11px] font-normal normal-case tracking-normal text-fx-muted leading-relaxed shadow-xl opacity-0 pointer-events-none group-hover/tooltip:opacity-100 transition-opacity z-50"
            >
              {tooltip}
            </span>
          </span>
        )}
      </div>

      <div className="fx-num text-2xl lg:text-[28px] leading-none font-semibold text-fx-text mb-3 flex items-baseline gap-1.5 flex-wrap">
        <span>{prefix}{formatValue(value)}</span>
        {suffix && <span className="text-xs font-medium text-fx-faint">{suffix}</span>}
      </div>

      <div className="mt-auto pt-2.5 border-t border-fx-line flex items-center justify-between gap-2">
        {renderDelta()}
        {hasClickAction && (
          <span className="shrink-0 inline-flex items-center gap-1 text-[11px] font-semibold text-fx-faint group-hover:text-fx-accent transition-colors">
            Detalle
            <ArrowRight className="w-3 h-3" aria-hidden="true" />
          </span>
        )}
      </div>
    </Wrapper>
  );
}

KpiCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string, PropTypes.object]),
  previous: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  deltaPct: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  format: PropTypes.string,
  prefix: PropTypes.string,
  suffix: PropTypes.string,
  tooltip: PropTypes.string,
  drilldownUrl: PropTypes.string,
  onDrilldown: PropTypes.func,
  status: PropTypes.string
};
