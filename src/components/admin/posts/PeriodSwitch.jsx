import PropTypes from "prop-types";
import { PERIODS } from "./format";

/** Control segmentado de rango, compartido con la ficha de una publicación. */
export default function PeriodSwitch({ period, onPeriodChange }) {
  return (
    <div className="inline-flex bg-slate-100 rounded-xl p-1">
      {PERIODS.map((p) => (
        <button
          key={p.id}
          onClick={() => onPeriodChange(p.id)}
          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
            period === p.id ? "bg-white text-[#531575] shadow-sm" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}
PeriodSwitch.propTypes = {
  period: PropTypes.string.isRequired,
  onPeriodChange: PropTypes.func.isRequired,
};
