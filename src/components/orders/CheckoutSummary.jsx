import PropTypes from "prop-types";
import { formatCurrencyVES, formatCurrencyUSD } from "../../utils/formatters";

// Parse variation display name from the variation object
const getVariationDisplayName = (variation) => {
  if (!variation) return null;
  if (variation.attribute_name === "default" || variation.attribute_value === '{"_default":"default"}') return null;
  try {
    const parsed = JSON.parse(variation.attribute_value);
    if (parsed._default === "default") return null;
    return Object.entries(parsed)
      .map(([key, val]) => {
        const cleanVal = typeof val === "string" && val.includes("|") ? val.split("|")[0] : val;
        return `${key}: ${cleanVal}`;
      })
      .join(" | ");
  } catch {
    let cleanVal = variation.attribute_value;
    if (typeof cleanVal === "string" && cleanVal.includes("|")) cleanVal = cleanVal.split("|")[0];
    const label = variation.attribute_name && variation.attribute_name !== "Matrix" ? variation.attribute_name : "Variación";
    return `${label}: ${cleanVal}`;
  }
};

export default function CheckoutSummary({ cartItems, total_usd, total_ves }) {
  return (
    <div
      className="bg-white rounded-2xl p-6 lg:p-8"
      style={{
        boxShadow: "0 4px 24px rgba(107,30,150,0.06)",
        position: "sticky",
        top: "2rem",
      }}
    >
      <h3 className="text-lg font-bold text-gray-900 mb-6">Resumen del Pedido</h3>

      <div className="space-y-4 mb-6 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
        {cartItems.map((item, index) => {
          const variationLabel = getVariationDisplayName(item.variation);
          return (
            <div key={`${item.product_id}-${index}`} className="flex gap-4">
              {/* Product Image / Info */}
              <div className="relative w-16 h-16 flex-shrink-0 rounded-xl overflow-hidden bg-gray-50 border border-gray-100 flex items-center justify-center">
                {item.image || item.image_url ? (
                  <img
                    src={item.image || item.image_url}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="material-symbols-outlined text-gray-300">
                    image
                  </span>
                )}
                {/* Quantity Bubble */}
                <span className="absolute -top-1 -right-1 bg-[#6b1e96] text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full shadow-sm border border-white">
                  {item.quantity}
                </span>
              </div>

              <div className="flex-1 min-w-0 py-1 flex flex-col justify-center">
                <h4 className="text-sm font-bold text-gray-900 line-clamp-2 leading-tight">
                  {item.name}
                </h4>
                <p className="text-xs text-gray-500 mt-0.5 truncate">
                  {variationLabel || "Por defecto"}
                </p>
              </div>

              <div className="text-right py-1">
                <p className="text-sm font-bold text-gray-900">
                  {formatCurrencyUSD(item.price_usd * item.quantity)}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Costs Breakdown */}
      <div className="space-y-3 mb-6">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500 font-medium">Subtotal</span>
          <span className="font-bold text-gray-900">{formatCurrencyUSD(total_usd)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500 font-medium">Envío</span>
          <span className="text-xs font-semibold bg-gray-100 px-2 py-0.5 rounded text-gray-600">Por calcular</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500 font-medium">Impuestos</span>
          <span className="font-bold text-gray-500">$0.00</span>
        </div>
      </div>

      {/* Total */}
      <div className="border-t border-gray-100 pt-5">
        <div className="flex items-end justify-between mb-1">
          <span className="text-base font-bold text-gray-900">Total</span>
          <div className="text-right">
            <span className="text-2xl font-black" style={{ color: "#6b1e96" }}>
              {formatCurrencyUSD(total_usd)}
            </span>
          </div>
        </div>
        <div className="text-right text-xs font-semibold text-gray-500">
          Aprox {formatCurrencyVES(total_ves)} Bs
        </div>
      </div>
    </div>
  );
}

CheckoutSummary.propTypes = {
  cartItems: PropTypes.array.isRequired,
  total_usd: PropTypes.number.isRequired,
  total_ves: PropTypes.number.isRequired,
};

