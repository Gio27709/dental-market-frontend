import { useState, useEffect, useMemo } from "react";
import PropTypes from "prop-types";

export default function ProductVariationSelector({
  variations = [],
  onChange,
}) {
  // 1. Parse variations into a more usable format
  const parsedVariations = useMemo(() => {
    return variations.map((v) => {
      let attrs = {};
      try {
        const parsed = JSON.parse(v.attribute_value);
        if (typeof parsed === "object" && parsed !== null) {
          attrs = parsed;
        } else {
          attrs = { [v.attribute_name || "Opción"]: v.attribute_value };
        }
      } catch {
        attrs = { [v.attribute_name || "Opción"]: v.attribute_value };
      }
      return { ...v, attrs };
    });
  }, [variations]);

  // 2. Extract Option Types and their available values
  const optionsMap = useMemo(() => {
    const map = {};
    parsedVariations.forEach((v) => {
      Object.entries(v.attrs).forEach(([key, val]) => {
        if (!map[key]) map[key] = new Set();
        map[key].add(val);
      });
    });

    // Convert Sets to Arrays
    const result = [];
    Object.keys(map).forEach((key) => {
      result.push({
        name: key,
        values: Array.from(map[key]),
      });
    });
    return result;
  }, [parsedVariations]);

  // 3. State for user selections
  const [selections, setSelections] = useState(() => {
    const initial = {};
    optionsMap.forEach((opt) => {
      initial[opt.name] = opt.values[0];
    });
    return initial;
  });

  // 4. Effect to trigger onChange when selections change and find exactly matching variation
  useEffect(() => {
    if (optionsMap.length === 0) return;

    // Find the variation that matches ALL current selections
    const matchedVariation = parsedVariations.find((v) => {
      return Object.entries(selections).every(
        ([key, val]) => v.attrs[key] === val,
      );
    });

    if (matchedVariation && matchedVariation.stock > 0) {
      if (onChange) onChange(matchedVariation.id);
    } else {
      if (onChange) onChange(null); // Invalid or out-of-stock combination
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selections, parsedVariations, optionsMap.length]);

  const handleSelect = (optionName, value) => {
    setSelections((prev) => ({ ...prev, [optionName]: value }));
  };

  // Helper to check if a specific value is available given the OTHER current selections
  const isValueAvailable = (optionName, value) => {
    return parsedVariations.some((v) => {
      if (v.attrs[optionName] !== value) return false;
      if (v.stock <= 0) return false;

      // Check other current selections
      for (const [key, selectedVal] of Object.entries(selections)) {
        if (key === optionName) continue; // Skip checking the one we are testing
        if (v.attrs[key] !== selectedVal) return false;
      }
      return true;
    });
  };

  if (!variations || variations.length === 0) return null;

  return (
    <div className="mt-6 space-y-5">
      {optionsMap.map((opt) => (
        <div key={opt.name}>
          <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">
            {opt.name}
          </label>
          <div className="flex flex-wrap gap-2">
            {opt.values.map((val) => {
              const isSelected = selections[opt.name] === val;
              const isAvailable = isValueAvailable(opt.name, val);

              return (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleSelect(opt.name, val)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg border transition-all ${
                    isSelected
                      ? "bg-primary-600 text-white border-primary-600 shadow-sm"
                      : isAvailable
                        ? "bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400"
                        : "bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed opacity-60"
                  }`}
                >
                  {val}
                </button>
              );
            })}
          </div>
        </div>
      ))}
      <div className="pt-1">
        {(() => {
          const matched = parsedVariations.find((v) =>
            Object.entries(selections).every(
              ([key, val]) => v.attrs[key] === val,
            ),
          );
          if (!matched)
            return (
              <p className="text-sm text-red-500 font-medium">
                Esta combinación no existe.
              </p>
            );
          if (matched.stock <= 0)
            return (
              <p className="text-sm text-red-500 font-medium">
                Combinación Agotada.
              </p>
            );
          return (
            <p className="text-sm text-green-600 font-medium">
              ¡Stock Disponible! ({matched.stock} unid.)
              {matched.price_modifier > 0 && ` (+ $${matched.price_modifier})`}
            </p>
          );
        })()}
      </div>
    </div>
  );
}

ProductVariationSelector.propTypes = {
  variations: PropTypes.array,
  onChange: PropTypes.func,
};
