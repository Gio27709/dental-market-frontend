import PropTypes from "prop-types";
import usePaymentMethods from "../../hooks/usePaymentMethods";

export default function PaymentMethodSelector({
  selectedMethod,
  onChange,
  error,
}) {
  const { activos, loading } = usePaymentMethods();

  return (
    <div className="space-y-4">
      <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Selecciona tu opción de pago</h4>

      {loading && activos.length === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-[74px] rounded-2xl border border-slate-200 bg-slate-50 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {activos.map(({ key, label, icon }) => {
            const isSelected = selectedMethod === key;

            return (
              <div
                key={key}
                onClick={() => onChange(key)}
                className={`
                  relative flex items-center justify-between cursor-pointer rounded-2xl border p-4.5 shadow-xs transition-all duration-300 active:scale-[0.99]
                  ${
                    isSelected
                      ? "border-[#6b1e96] bg-purple-50/20 ring-1 ring-[#6b1e96]"
                      : "border-slate-200 bg-white hover:bg-slate-50/80 hover:shadow-xs"
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100/50">{icon}</span>
                  <span className="text-sm font-bold text-slate-800">
                    {label}
                  </span>
                </div>
                <div
                  className={`flex h-5 w-5 items-center justify-center rounded-full border transition-all ${
                    isSelected
                      ? "border-[#6b1e96] bg-white"
                      : "border-slate-300 bg-white"
                  }`}
                >
                  {isSelected && (
                    <div className="h-3 w-3 rounded-full bg-[#6b1e96] animate-scale-up" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {error && (
        <p className="mt-2.5 text-xs font-bold text-red-500 flex items-center gap-1.5">
          <span className="material-symbols-outlined text-sm">error</span>
          {error}
        </p>
      )}
    </div>
  );
}

PaymentMethodSelector.propTypes = {
  selectedMethod: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  error: PropTypes.string,
};
