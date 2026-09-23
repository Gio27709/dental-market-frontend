import { useState, useEffect, useMemo } from "react";
import PropTypes from "prop-types";

// Convierte attribute_value (JSON de combinación o texto simple) en { opción: valor }.
function parseAttrs(v) {
  try {
    const parsed = JSON.parse(v.attribute_value);
    if (typeof parsed === "object" && parsed !== null) return parsed;
  } catch {
    // texto simple: se trata abajo
  }
  return { [v.attribute_name || "Opción"]: v.attribute_value };
}

export default function ProductVariationSelector({
  variations = [],
  onChange,
}) {
  // 1. Variaciones con sus atributos ya parseados
  const parsedVariations = useMemo(
    () => variations.map((v) => ({ ...v, attrs: parseAttrs(v) })),
    [variations],
  );

  // 2. Tipos de opción y sus valores posibles
  const optionsMap = useMemo(() => {
    const map = {};
    parsedVariations.forEach((v) => {
      Object.entries(v.attrs).forEach(([key, val]) => {
        if (!map[key]) map[key] = new Set();
        map[key].add(val);
      });
    });
    return Object.keys(map).map((key) => ({ name: key, values: Array.from(map[key]) }));
  }, [parsedVariations]);

  // 3. Selección inicial: la primera combinación CON stock (si ninguna tiene, la primera)
  const [selections, setSelections] = useState(() => {
    const first =
      parsedVariations.find((v) => Number(v.stock) > 0) || parsedVariations[0];
    const initial = {};
    optionsMap.forEach((opt) => {
      initial[opt.name] = first?.attrs[opt.name] ?? opt.values[0];
    });
    return initial;
  });

  const matchedVariation = useMemo(
    () =>
      parsedVariations.find((v) =>
        Object.entries(selections).every(([key, val]) => v.attrs[key] === val),
      ) || null,
    [parsedVariations, selections],
  );

  // 4. Se avisa a la ficha la combinación elegida, aunque esté agotada: la ficha
  //    decide si se puede comprar (así muestra su precio y «Selecciona otra opción»).
  useEffect(() => {
    if (optionsMap.length === 0) return;
    if (onChange) onChange(matchedVariation ? matchedVariation.id : null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchedVariation, optionsMap.length]);

  const handleSelect = (optionName, value) => {
    setSelections((prev) => ({ ...prev, [optionName]: value }));
  };

  // ¿Hay stock para este valor combinado con el resto de lo elegido?
  const isValueAvailable = (optionName, value) => {
    return parsedVariations.some((v) => {
      if (v.attrs[optionName] !== value) return false;
      if (Number(v.stock) <= 0) return false;
      for (const [key, selectedVal] of Object.entries(selections)) {
        if (key === optionName) continue;
        if (v.attrs[key] !== selectedVal) return false;
      }
      return true;
    });
  };

  if (!variations || variations.length === 0) return null;

  return (
    <div className="mt-6 space-y-5">
      {optionsMap.map((opt) => {
        const isColorOption = opt.name.trim().toLowerCase() === "color";

        return (
          <div key={opt.name}>
            <p className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">
              {opt.name}
            </p>
            <div className="flex flex-wrap gap-2" role="group" aria-label={opt.name}>
              {opt.values.map((val) => {
                const isSelected = selections[opt.name] === val;
                const isAvailable = isValueAvailable(opt.name, val);

                const displayName = typeof val === "string" && val.includes("|") ? val.split("|")[0] : val;
                const hexValue = typeof val === "string" && val.includes("|") ? val.split("|")[1] : null;
                const title = isAvailable ? displayName : `${displayName} (agotado)`;

                if (isColorOption && hexValue) {
                  return (
                    <button
                      key={val}
                      type="button"
                      title={title}
                      aria-label={title}
                      aria-pressed={isSelected}
                      onClick={() => handleSelect(opt.name, val)}
                      className={`relative w-8 h-8 rounded-full border-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6b1e96] focus-visible:ring-offset-2 ${
                        isSelected
                          ? "border-[#6b1e96] shadow-md scale-110"
                          : isAvailable
                          ? "border-gray-200 hover:border-gray-400 hover:scale-105"
                          : "border-gray-200 opacity-40"
                      }`}
                      style={{ backgroundColor: hexValue }}
                    >
                      {!isAvailable && (
                        <span
                          aria-hidden="true"
                          className="absolute left-1/2 top-1/2 h-[2px] w-[120%] -translate-x-1/2 -translate-y-1/2 rotate-45 bg-gray-500"
                        />
                      )}
                    </button>
                  );
                }

                return (
                  <button
                    key={val}
                    type="button"
                    title={title}
                    aria-pressed={isSelected}
                    onClick={() => handleSelect(opt.name, val)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-lg text-center min-w-[3rem] border-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6b1e96] focus-visible:ring-offset-2 ${
                      isSelected
                        ? "bg-[#6b1e96]/5 border-[#6b1e96] text-[#191c20] shadow-sm"
                        : isAvailable
                          ? "bg-[#f8f9fa] text-gray-700 border-transparent hover:border-gray-300"
                          : "bg-gray-50 text-gray-400 border-transparent line-through"
                    } ${isSelected && !isAvailable ? "line-through" : ""}`}
                  >
                    {displayName}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      <div aria-live="polite">
        {!matchedVariation ? (
          <p className="text-sm text-red-600 font-medium">Esta combinación no existe. Selecciona otra opción.</p>
        ) : Number(matchedVariation.stock) <= 0 ? (
          <p className="text-sm text-red-600 font-medium">Esta combinación está agotada</p>
        ) : null}
      </div>
    </div>
  );
}

ProductVariationSelector.propTypes = {
  variations: PropTypes.array,
  onChange: PropTypes.func,
};
