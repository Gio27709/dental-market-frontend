import { useState, useRef, useEffect } from "react";
import PropTypes from "prop-types";
import { useSearchParams } from "react-router-dom";

export default function AnalyticsStoreFilter({ storeList = [], selectedStoreIds = [], onStoreChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectStore = (storeId) => {
    let updated;
    if (storeId === "all") {
      updated = [];
    } else {
      updated = selectedStoreIds.includes(storeId)
        ? selectedStoreIds.filter((id) => id !== storeId)
        : [...selectedStoreIds, storeId];
    }

    onStoreChange(updated);
    const newParams = new URLSearchParams(searchParams);
    if (updated.length > 0) {
      newParams.set("store_ids", updated.join(","));
    } else {
      newParams.delete("store_ids");
    }
    setSearchParams(newParams);
  };

  const getLabel = () => {
    if (selectedStoreIds.length === 0) return "Todas las Tiendas";
    if (selectedStoreIds.length === 1) {
      const store = storeList.find((s) => s.id === selectedStoreIds[0] || s.user_id === selectedStoreIds[0]);
      return store ? (store.business_name || store.name) : "1 Tienda";
    }
    return `${selectedStoreIds.length} Tiendas Seleccionadas`;
  };

  return (
    <div className="relative inline-block text-left z-50" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 bg-fx-raised border border-fx-line-strong hover:border-fx-accent/50 rounded-xl px-3.5 py-1.5 text-xs font-bold text-fx-muted transition-all duration-200 shadow-lg"
      >
        <span>🏪</span>
        <span className="truncate max-w-[140px]">{getLabel()}</span>
        <span className="text-fx-muted text-[10px]">▼</span>
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full mt-2 w-64 bg-fx-panel border border-fx-line-strong rounded-2xl p-2 shadow-[0_15px_40px_rgba(0,0,0,0.9)] z-[200] max-h-60 overflow-y-auto">
          <button
            onClick={() => handleSelectStore("all")}
            className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors ${
              selectedStoreIds.length === 0 ? "bg-fx-raised text-fx-accent font-bold" : "text-fx-muted hover:bg-fx-raised"
            }`}
          >
            <span>Todas las Tiendas</span>
            {selectedStoreIds.length === 0 && <span className="text-fx-accent">✓</span>}
          </button>

          {storeList.length > 0 && <div className="my-1 border-t border-fx-line" />}

          {storeList.map((store) => {
            const id = store.id || store.user_id;
            const name = store.business_name || store.name;
            const isSelected = selectedStoreIds.includes(id);

            return (
              <button
                key={id}
                onClick={() => handleSelectStore(id)}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors ${
                  isSelected ? "bg-fx-raised text-fx-accent font-bold" : "text-fx-muted hover:bg-fx-raised"
                }`}
              >
                <span className="truncate">{name}</span>
                {isSelected && <span className="text-fx-accent">✓</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

AnalyticsStoreFilter.propTypes = {
  storeList: PropTypes.array,
  selectedStoreIds: PropTypes.arrayOf(PropTypes.string),
  onStoreChange: PropTypes.func.isRequired
};
