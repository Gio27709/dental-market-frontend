import PropTypes from "prop-types";
import { formatCount } from "./format";

const TONES = {
  slate: "text-gray-900",
  violet: "text-[#531575]",
  rose: "text-rose-600",
  emerald: "text-emerald-600",
};

/** Cifra suelta del panel de publicaciones. Compartida por el historial de la lista y la ficha. */
export default function StatTile({ icon, label, value, hint, tone = "slate" }) {
  return (
    <div className="bg-gray-50/70 border border-slate-200 rounded-2xl px-4 py-3">
      <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-gray-500">
        <span className="material-symbols-outlined text-[15px]">{icon}</span>
        {label}
      </div>
      <div className={`mt-1 text-2xl font-extrabold font-['Manrope'] ${TONES[tone] || TONES.slate}`}>
        {formatCount(value)}
      </div>
      {hint && <div className="text-[11px] text-gray-400 font-medium mt-0.5">{hint}</div>}
    </div>
  );
}

StatTile.propTypes = {
  icon: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  hint: PropTypes.string,
  tone: PropTypes.string,
};
