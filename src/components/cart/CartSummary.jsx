import PropTypes from "prop-types";
import { formatCurrencyUSD, formatCurrencyVES } from "../../utils/formatters";

export default function CartSummary({
  totalUsd,
  totalVes,
  onCheckout,
  showShipping = false,
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col h-full sticky top-24">
      <h3 className="text-lg font-bold text-gray-900 mb-6">Resumen de Orden</h3>

      <div className="space-y-4 mb-6 flex-grow">
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-500">Subtotal</span>
          <span className="font-medium text-gray-900">
            {formatCurrencyUSD(totalUsd)}
          </span>
        </div>

        {showShipping && (
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-500">Envío</span>
            <span className="font-medium text-green-600">Gratis</span>
          </div>
        )}

        <div className="pt-4 border-t border-gray-100">
          <div className="flex justify-between items-end mb-1">
            <span className="text-base font-bold text-gray-900">Total USD</span>
            <span className="text-xl font-black text-gray-900">
              {formatCurrencyUSD(totalUsd)}
            </span>
          </div>
          <div className="flex justify-between items-center text-sm mt-2 bg-gray-50 p-2 rounded">
            <span className="text-gray-500">Ref. Bolívares</span>
            <span className="font-medium text-gray-700">
              {formatCurrencyVES(totalVes)}
            </span>
          </div>
        </div>
      </div>

      <button
        onClick={onCheckout}
        disabled={totalUsd === 0}
        className="w-full bg-primary-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-primary-700 transition-all shadow-sm active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 disabled:cursor-not-allowed"
      >
        Proceder al pago
      </button>

      <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-400">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-4 h-4"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
          />
        </svg>
        <span>Pago seguro mediante Escrow</span>
      </div>
    </div>
  );
}

CartSummary.propTypes = {
  totalUsd: PropTypes.number.isRequired,
  totalVes: PropTypes.number.isRequired,
  onCheckout: PropTypes.func.isRequired,
  showShipping: PropTypes.bool,
};
