import { useState, useRef, useEffect, useMemo } from "react";
import PropTypes from "prop-types";
import { useSearchParams } from "react-router-dom";
import { Store, ChevronDown, Search, Check } from "lucide-react";

/**
 * Filtro de tiendas de las analíticas.
 *
 * Comparte la forma del `SearchableSelect` del resto del panel (icono, etiqueta,
 * chevron, buscador interno y check en lo seleccionado), pero se pinta con los
 * tokens `fx-*` y con iconos de lucide, porque dentro de analíticas no se usan ni
 * emoji ni hex sueltos. Es multi-selección, así que no puede reutilizar el
 * componente tal cual: allí una opción sustituye a la anterior, aquí se acumulan.
 */
export default function AnalyticsStoreFilter({ storeList = [], selectedStoreIds = [], onStoreChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => searchInputRef.current?.focus(), 50);
    return () => clearTimeout(timer);
  }, [isOpen]);

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

  const visibles = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return storeList;
    return storeList.filter((s) =>
      String(s.business_name || s.name || "").toLowerCase().includes(term)
    );
  }, [storeList, searchTerm]);

  return (
    <div className="relative inline-block text-left z-50" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`inline-flex w-full min-w-[190px] items-center justify-between gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors duration-200 ${
          isOpen
            ? "bg-fx-panel border-fx-accent text-fx-text"
            : "bg-fx-panel border-fx-line hover:border-fx-line-strong text-fx-text"
        }`}
      >
        <span className="flex min-w-0 items-center gap-2">
          <Store className="w-4 h-4 shrink-0 text-fx-accent" strokeWidth={1.75} />
          <span className={`truncate ${selectedStoreIds.length === 0 ? "text-fx-muted" : "text-fx-text"}`}>
            {getLabel()}
          </span>
        </span>
        <ChevronDown
          className={`w-4 h-4 shrink-0 text-fx-faint transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          strokeWidth={2}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full mt-2 w-72 rounded-xl border border-fx-line-strong bg-fx-panel p-2 shadow-[0_10px_25px_-5px_rgba(51,36,61,0.16),0_8px_10px_-6px_rgba(51,36,61,0.10)] z-[200]">
          {/* Buscador interno */}
          <div className="relative mb-1.5">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 w-3.5 h-3.5 -translate-y-1/2 text-fx-faint" strokeWidth={2} />
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              placeholder="Buscar tienda..."
              className="w-full rounded-lg border border-fx-line bg-fx-inset py-1.5 pl-8 pr-2.5 text-xs text-fx-text placeholder:text-fx-faint transition-colors focus:border-fx-accent focus:outline-none"
            />
          </div>

          <div className="max-h-60 overflow-y-auto fx-rail" role="listbox">
            <button
              onClick={() => handleSelectStore("all")}
              role="option"
              aria-selected={selectedStoreIds.length === 0}
              className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs font-semibold transition-colors ${
                selectedStoreIds.length === 0
                  ? "bg-fx-raised text-fx-accent"
                  : "text-fx-muted hover:bg-fx-raised hover:text-fx-text"
              }`}
            >
              <span>Todas las Tiendas</span>
              {selectedStoreIds.length === 0 && <Check className="w-3.5 h-3.5 shrink-0 text-fx-accent" strokeWidth={2.5} />}
            </button>

            {visibles.length > 0 && <div className="my-1 border-t border-fx-line" />}

            {visibles.length === 0 && storeList.length > 0 && (
              <p className="px-3 py-3 text-center text-xs text-fx-faint">No se encontraron resultados</p>
            )}

            {visibles.map((store) => {
              const id = store.id || store.user_id;
              const name = store.business_name || store.name;
              const isSelected = selectedStoreIds.includes(id);

              return (
                <button
                  key={id}
                  onClick={() => handleSelectStore(id)}
                  role="option"
                  aria-selected={isSelected}
                  className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold transition-colors ${
                    isSelected
                      ? "bg-fx-raised text-fx-accent"
                      : "text-fx-muted hover:bg-fx-raised hover:text-fx-text"
                  }`}
                >
                  <span className="truncate">{name}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 shrink-0 text-fx-accent" strokeWidth={2.5} />}
                </button>
              );
            })}
          </div>
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
