import { useState } from "react";
import PropTypes from "prop-types";
import { useProducts } from "../../context/ProductContext";
import { formatCurrencyUSD, formatCurrencyVES } from "../../utils/formatters";

export default function PriceDisplay({ amountUSD }) {
  const { bcvRate } = useProducts();
  const [showVES, setShowVES] = useState(false);

  // Consider an amount to be zero if missing
  const usdVal = Number(amountUSD) || 0;
  const vesVal = usdVal * Number(bcvRate || 1);

  return (
    <div className="flex flex-col gap-2">
      {/* Price Amount Header */}
      <span className="text-2xl font-bold text-primary-600">
        {showVES ? formatCurrencyVES(vesVal) : formatCurrencyUSD(usdVal)}
      </span>

      {/* Currency Switcher Buttons */}
      <div className="flex bg-gray-100 p-1 rounded-lg w-max border border-gray-200">
        <button
          onClick={(e) => {
            e.preventDefault();
            setShowVES(false);
          }}
          className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
            !showVES
              ? "bg-white text-primary-600 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          USD
        </button>
        <button
          onClick={(e) => {
            e.preventDefault();
            setShowVES(true);
          }}
          className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
            showVES
              ? "bg-white text-primary-600 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
          title={`Tasa BCV: ${bcvRate}`}
        >
          VES
        </button>
      </div>
    </div>
  );
}

PriceDisplay.propTypes = {
  amountUSD: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};
