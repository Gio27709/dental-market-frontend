import PropTypes from "prop-types";
import { formatCurrencyUSD, formatCurrencyVES } from "../../utils/formatters";

export default function CartSummary({
  totalUsd,
  totalVes,
  itemCount = 0,
  onCheckout,
  showShipping = false,
}) {
  const productLabel = itemCount === 1 ? "producto" : "productos";

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col">
      {/* Subtotal line — Amazon style */}
      <div className="mb-4">
        <span className="text-[15px] text-gray-700">
          Subtotal ({itemCount} {productLabel}):{" "}
        </span>
        <span className="text-[15px] font-bold text-gray-900">
          {formatCurrencyUSD(totalUsd)}
        </span>
      </div>

      {/* Ref. Bolívares */}
      <div className="flex items-center gap-2 text-xs text-gray-500 mb-4 bg-gray-50 rounded-md px-3 py-2 border border-gray-100">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5 flex-shrink-0">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
        <span>Ref. Bolívares: <span className="font-medium text-gray-600">{formatCurrencyVES(totalVes)}</span></span>
      </div>

      {showShipping && (
        <div className="flex items-center gap-2 text-xs text-green-600 mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.07-.504 1.07-1.125V6.75a2.625 2.625 0 0 0-2.625-2.625H3.375v8.25" />
          </svg>
          <span className="font-medium">Envío gratis</span>
        </div>
      )}

      {/* Checkout Button */}
      <button
        onClick={onCheckout}
        disabled={totalUsd === 0}
        className="w-full bg-[#6b1e96] text-white py-3 px-4 rounded-full font-semibold text-[15px] hover:bg-[#531575] transition-all shadow-sm active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 disabled:cursor-not-allowed"
      >
        Proceder al pago
      </button>

      {/* Trust badge */}
      <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-gray-400">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
        </svg>
        Pago seguro mediante Escrow
      </div>
    </div>
  );
}

CartSummary.propTypes = {
  totalUsd: PropTypes.number.isRequired,
  totalVes: PropTypes.number.isRequired,
  itemCount: PropTypes.number,
  onCheckout: PropTypes.func.isRequired,
  showShipping: PropTypes.bool,
};
