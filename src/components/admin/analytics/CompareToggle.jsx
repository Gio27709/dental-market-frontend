import PropTypes from "prop-types";
import { useSearchParams } from "react-router-dom";

export default function CompareToggle({ isComparing, onToggle }) {
  const [searchParams, setSearchParams] = useSearchParams();

  const handleToggle = () => {
    const nextState = !isComparing;
    onToggle(nextState);
    const newParams = new URLSearchParams(searchParams);
    if (nextState) {
      newParams.set("compare", "true");
    } else {
      newParams.delete("compare");
    }
    setSearchParams(newParams);
  };

  return (
    <button
      onClick={handleToggle}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 border ${
        isComparing
          ? "bg-fx-violet/40 text-fx-accent border-fx-accent/40"
          : "bg-fx-panel text-fx-muted hover:text-fx-text border-fx-line"
      }`}
    >
      <span className={`w-2 h-2 rounded-full ${isComparing ? "bg-[#6b1e96] animate-pulse" : "bg-gray-500"}`} />
      <span>Comparar vs Período Previo</span>
    </button>
  );
}

CompareToggle.propTypes = {
  isComparing: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired
};
