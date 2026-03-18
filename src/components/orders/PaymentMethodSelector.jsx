import PropTypes from "prop-types";
import { PAYMENT_METHODS } from "../../utils/constants";

export default function PaymentMethodSelector({
  selectedMethod,
  onChange,
  error,
}) {
  const methods = Object.entries(PAYMENT_METHODS);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900">Método de Pago</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {methods.map(([key, { label, icon }]) => {
          const isSelected = selectedMethod === key;

          return (
            <div
              key={key}
              onClick={() => onChange(key)}
              className={`
                relative flex cursor-pointer rounded-lg border p-4 shadow-sm focus:outline-none transition-colors
                ${
                  isSelected
                    ? "border-primary-500 bg-primary-50 ring-2 ring-primary-500"
                    : "border-gray-300 bg-white hover:bg-gray-50"
                }
              `}
            >
              <span className="flex flex-1">
                <span className="flex flex-col">
                  <span className="block text-sm font-medium text-gray-900 flex items-center gap-2">
                    <span className="text-xl">{icon}</span>
                    {label}
                  </span>
                </span>
              </span>
              <div
                className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                  isSelected
                    ? "border-transparent bg-primary-600"
                    : "border-gray-300 bg-white"
                }`}
              >
                {isSelected && (
                  <svg
                    className="h-3 w-3 text-white"
                    fill="currentColor"
                    viewBox="0 0 12 12"
                  >
                    <path d="M3.707 5.293a1 1 0 00-1.414 1.414l1.414-1.414zM5 8l-.707.707a1 1 0 001.414 0L5 8zm4.707-3.293a1 1 0 00-1.414-1.414l1.414 1.414zm-7.414 2l2 2 1.414-1.414-2-2-1.414 1.414zm3.414 2l4-4-1.414-1.414-4 4 1.414 1.414z" />
                  </svg>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}

PaymentMethodSelector.propTypes = {
  selectedMethod: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  error: PropTypes.string,
};
