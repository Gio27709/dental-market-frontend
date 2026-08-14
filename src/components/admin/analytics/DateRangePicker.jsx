import PropTypes from "prop-types";
import { useSearchParams } from "react-router-dom";

export default function DateRangePicker({ selectedPeriod, onPeriodChange }) {
  const [searchParams, setSearchParams] = useSearchParams();

  const periods = [
    { key: "7d", label: "7D" },
    { key: "15d", label: "15D" },
    { key: "30d", label: "30D" },
    { key: "90d", label: "90D" },
    { key: "365d", label: "1 Año" },
  ];

  const handleSelectPeriod = (pKey) => {
    onPeriodChange(pKey);
    const newParams = new URLSearchParams(searchParams);
    newParams.set("period", pKey);
    newParams.delete("from");
    newParams.delete("to");
    setSearchParams(newParams);
  };

  return (
    <div className="inline-flex items-center bg-fx-panel border border-fx-line rounded-xl p-1">
      {periods.map((p) => {
        const isActive = selectedPeriod === p.key;
        return (
          <button
            key={p.key}
            onClick={() => handleSelectPeriod(p.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${
              isActive
                ? "bg-[#c3ff00] text-black shadow-md font-semibold"
                : "text-fx-muted hover:text-fx-text hover:bg-fx-raised"
            }`}
          >
            {p.label}
          </button>
        );
      })}
    </div>
  );
}

DateRangePicker.propTypes = {
  selectedPeriod: PropTypes.string.isRequired,
  onPeriodChange: PropTypes.func.isRequired
};
