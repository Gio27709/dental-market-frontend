import { useState, useRef, useEffect, useCallback } from "react";
import PropTypes from "prop-types";

const ChevronDownIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
  </svg>
);

ChevronDownIcon.propTypes = {
  className: PropTypes.string,
};

const MagnifyingGlassIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
  </svg>
);

MagnifyingGlassIcon.propTypes = {
  className: PropTypes.string,
};

const CheckIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
  </svg>
);

CheckIcon.propTypes = {
  className: PropTypes.string,
};

/**
 * SearchableSelect — Premium searchable dropdown component
 * 
 * @param {Object} props
 * @param {Array<{value: string, label: string, icon?: JSX.Element}>} props.options - List of options
 * @param {string} props.value - Currently selected value
 * @param {(value: string) => void} props.onChange - Callback when value changes
 * @param {string} [props.placeholder] - Placeholder text when nothing selected
 * @param {string} [props.searchPlaceholder] - Placeholder for the search input
 * @param {JSX.Element} [props.icon] - Leading icon for the trigger button
 * @param {number} [props.maxVisible] - Max items visible before scroll (default: 5)
 * @param {string} [props.className] - Additional class for the wrapper
 * @param {boolean} [props.searchable] - Whether to show search input (default: true)
 */
export default function SearchableSelect({
  options = [],
  value,
  onChange,
  placeholder = "Seleccionar...",
  searchPlaceholder = "Buscar...",
  icon = null,
  maxVisible = 5,
  className = "",
  searchable = true,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);
  const listRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close on Escape
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

  // Auto-focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      // Small delay to allow animation to start
      const timer = setTimeout(() => searchInputRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen, searchable]);

  const filteredOptions = searchTerm
    ? options.filter((opt) =>
        opt.label.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : options;

  const selectedOption = options.find((opt) => opt.value === value);

  const handleSelect = useCallback(
    (optValue) => {
      onChange(optValue);
      setIsOpen(false);
      setSearchTerm("");
    },
    [onChange]
  );

  const toggleOpen = useCallback(() => {
    setIsOpen((prev) => !prev);
    if (isOpen) setSearchTerm("");
  }, [isOpen]);

  // Calculate max-height based on maxVisible items (each item ~40px + search ~44px + padding)
  const ITEM_HEIGHT = 40;
  const listMaxHeight = maxVisible * ITEM_HEIGHT;

  return (
    <div ref={containerRef} className={`searchable-select ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={toggleOpen}
        className={`searchable-select__trigger ${isOpen ? "searchable-select__trigger--open" : ""}`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="searchable-select__trigger-content">
          {icon && <span className="searchable-select__trigger-icon">{icon}</span>}
          <span className={`searchable-select__trigger-label ${!selectedOption ? "searchable-select__trigger-label--placeholder" : ""}`}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </span>
        <ChevronDownIcon
          className={`searchable-select__chevron ${isOpen ? "searchable-select__chevron--open" : ""}`}
        />
      </button>

      {/* Dropdown Panel */}
      <div className={`searchable-select__dropdown ${isOpen ? "searchable-select__dropdown--open" : ""}`}>
        {/* Search Input */}
        {searchable && (
          <div className="searchable-select__search-wrapper">
            <MagnifyingGlassIcon className="searchable-select__search-icon" />
            <input
              ref={searchInputRef}
              type="text"
              className="searchable-select__search-input"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}

        {/* Options List */}
        <ul
          ref={listRef}
          className="searchable-select__list"
          role="listbox"
          style={{ maxHeight: `${listMaxHeight}px` }}
        >
          {filteredOptions.length === 0 ? (
            <li className="searchable-select__empty">
              No se encontraron resultados
            </li>
          ) : (
            filteredOptions.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <li
                  key={opt.value}
                  role="option"
                  aria-selected={isSelected}
                  className={`searchable-select__option ${isSelected ? "searchable-select__option--selected" : ""}`}
                  onClick={() => handleSelect(opt.value)}
                >
                  <span className="searchable-select__option-content">
                    {opt.icon && <span className="searchable-select__option-icon">{opt.icon}</span>}
                    <span className="searchable-select__option-label">{opt.label}</span>
                  </span>
                  {isSelected && (
                    <CheckIcon className="searchable-select__check-icon" />
                  )}
                </li>
              );
            })
          )}
        </ul>
      </div>
    </div>
  );
}

SearchableSelect.propTypes = {
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      label: PropTypes.string.isRequired,
      icon: PropTypes.node,
    })
  ),
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  searchPlaceholder: PropTypes.string,
  icon: PropTypes.node,
  maxVisible: PropTypes.number,
  className: PropTypes.string,
  searchable: PropTypes.bool,
};
