import PropTypes from "prop-types";
import { useProducts } from "../../context/ProductContext";
import { useCurrency } from "../../context/CurrencyContext";
import { formatCurrencyUSD, formatCurrencyVES } from "../../utils/formatters";

export default function PriceDisplay({ amountUSD, priceClassName, hideSwitcher }) {
  const { bcvRate } = useProducts();
  const { isVES, setCurrency } = useCurrency();

  // Consider an amount to be zero if missing
  const usdVal = Number(amountUSD) || 0;
  const vesVal = usdVal * Number(bcvRate || 1);

  return (
    <div className="flex flex-col gap-2">
      {/* Price Amount Header */}
      <span className={priceClassName || "text-2xl font-bold text-[#6b1e96]"}>
        {isVES ? formatCurrencyVES(vesVal) : formatCurrencyUSD(usdVal)}
      </span>

      {/* Currency Switcher Buttons — connected to global CurrencyContext */}
      {!hideSwitcher && (
      <div className="flex bg-gray-100 p-1 rounded-lg w-max border border-gray-200">
        <button
          onClick={(e) => {
            e.preventDefault();
            setCurrency("USD");
          }}
          className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
            !isVES
              ? "bg-white text-[#6b1e96] shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          USD
        </button>
        <button
          onClick={(e) => {
            e.preventDefault();
            setCurrency("VES");
          }}
          className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
            isVES
              ? "bg-white text-[#6b1e96] shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
          title={`Tasa BCV: ${bcvRate}`}
        >
          VES
        </button>
      </div>
      )}
    </div>
  );
}

PriceDisplay.propTypes = {
  amountUSD: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  priceClassName: PropTypes.string,
  hideSwitcher: PropTypes.bool,
};
