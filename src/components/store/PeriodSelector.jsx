import { useState } from "react";
import PropTypes from "prop-types";

const PRESET_PERIODS = [
  { value: "1d", label: "Hoy" },
  { value: "7d", label: "7 días" },
  { value: "15d", label: "15 días" },
  { value: "30d", label: "1 mes" },
  { value: "90d", label: "3 meses" },
  { value: "180d", label: "6 meses" },
  { value: "365d", label: "12 meses" },
];

export default function PeriodSelector({ period, onPeriodChange, onCustomRange }) {
  const [showCustom, setShowCustom] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const handleApplyCustom = () => {
    if (dateFrom && dateTo) {
      onCustomRange(dateFrom, dateTo);
      setShowCustom(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Preset pills */}
      <div className="flex flex-wrap gap-1.5">
        {PRESET_PERIODS.map((p) => (
          <button
            key={p.value}
            onClick={() => {
              onPeriodChange(p.value);
              setShowCustom(false);
            }}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200"
            style={{
              background: period === p.value && !showCustom
                ? "linear-gradient(135deg, #531575 0%, #6b1e96 100%)"
                : "rgba(107,30,150,0.06)",
              color: period === p.value && !showCustom ? "#ffffff" : "#6b1e96",
              boxShadow: period === p.value && !showCustom
                ? "0 2px 8px rgba(83,21,117,0.25)"
                : "none",
            }}
          >
            {p.label}
          </button>
        ))}

        {/* Custom range toggle */}
        <button
          onClick={() => setShowCustom(!showCustom)}
          className="px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 flex items-center gap-1.5"
          style={{
            background: showCustom
              ? "linear-gradient(135deg, #531575 0%, #6b1e96 100%)"
              : "rgba(107,30,150,0.06)",
            color: showCustom ? "#ffffff" : "#6b1e96",
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 9v9.75" />
          </svg>
          Rango
        </button>
      </div>

      {/* Custom range inputs */}
      {showCustom && (
        <div className="flex items-center gap-2 animate-in slide-in-from-top-2">
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-lg border border-gray-200 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-300"
          />
          <span className="text-xs text-gray-400">a</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-lg border border-gray-200 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-300"
          />
          <button
            onClick={handleApplyCustom}
            disabled={!dateFrom || !dateTo}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg text-white disabled:opacity-40 transition-all"
            style={{ background: "#c3ff00", color: "#1a0a2e" }}
          >
            Aplicar
          </button>
        </div>
      )}
    </div>
  );
}

PeriodSelector.propTypes = {
  period: PropTypes.string.isRequired,
  onPeriodChange: PropTypes.func.isRequired,
  onCustomRange: PropTypes.func.isRequired,
};
