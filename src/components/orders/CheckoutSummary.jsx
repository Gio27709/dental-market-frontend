import { useMemo } from "react";
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

export default function CheckoutSummary({ cartItems, total_usd, total_ves, deliveryType, buyerFeePercentage = 0 }) {
  // Group items by store
  const storeGroups = useMemo(() => {
    const groups = {};
    cartItems.forEach(item => {
      const sid = item.store_id;
      if (!groups[sid]) {
        groups[sid] = {
          store_id: sid,
          store_name: item.store_name || `Tienda ${sid?.substring(0, 6) || "?"}`,
          items: [],
        };
      }
      groups[sid].items.push(item);
    });
    return Object.values(groups);
  }, [cartItems]);

  const isMultiStore = storeGroups.length > 1;

  // DELIVERY FEE FIX: Flat rate per store (one trip = one fee), not per item.
  const deliveryFee = (() => {
    if (deliveryType !== "local_delivery" && deliveryType !== "mixed") return 0;
    const feeByStore = {};
    cartItems.forEach(item => {
      const storeId = item.store_id;
      const fee = parseFloat(item.delivery_fee) || 0;
      if (feeByStore[storeId] === undefined || fee > feeByStore[storeId]) {
        feeByStore[storeId] = fee;
      }
    });
    return Object.values(feeByStore).reduce((acc, fee) => acc + fee, 0);
  })();

  // Buyer fee calculated on product subtotal ONLY (not shipping)
  const buyerFeeRate = parseFloat(buyerFeePercentage) || 0;
  const buyerFeeAmount = (total_usd * buyerFeeRate) / 100;

  const finalUsd = total_usd + deliveryFee + buyerFeeAmount;
  // Use implied exchange rate to get updated VES sum
  const rate = total_usd > 0 ? (total_ves / total_usd) : 0;
  const finalVes = total_usd > 0 ? (finalUsd * rate) : 0;

  const hasClosedStores = cartItems.some((item) => item.store_is_open === false);

  return (
    <div
      className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_8px_30px_rgb(107,30,150,0.04)] transition-all duration-300"
      style={{
        position: "sticky",
        top: "2.5rem",
      }}
    >
      <div className="flex items-center gap-2 mb-4.5">
        <span className="material-symbols-outlined text-[#6b1e96] text-[20px]">shopping_basket</span>
        <h3 className="text-base font-black text-slate-900">Resumen del Pedido</h3>
      </div>

      {isMultiStore && (
        <div className="flex items-center gap-2.5 mb-5 text-[11px] text-[#6b1e96] bg-purple-50/70 px-3 py-2.5 rounded-xl border border-purple-100/50">
          <span className="material-symbols-outlined text-[#6b1e96]" style={{ fontSize: "16px" }}>storefront</span>
          <span className="font-bold">{storeGroups.length} tiendas</span>
          <span className="text-slate-400 font-medium">· Envíos independientes</span>
        </div>
      )}

      <div className="space-y-4.5 mb-6 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
        {storeGroups.map((group, groupIdx) => (
          <div key={group.store_id}>
            {/* Store divider (only for multi-store) */}
            {isMultiStore && (
              <div className={`flex items-center gap-2 ${groupIdx > 0 ? "mt-5 pt-4 border-t border-slate-100" : ""} mb-3`}>
                <span className="text-[10px] font-black text-[#6b1e96] uppercase tracking-widest flex items-center gap-1.5">
                  <span className="material-symbols-outlined" style={{ fontSize: "13px" }}>storefront</span>
                  {group.store_name}
                </span>
              </div>
            )}

            <div className="space-y-4">
              {group.items.map((item, index) => {
                const variationLabel = getVariationDisplayName(item.variation);
                return (
                  <div key={`${item.product_id}-${index}`} className="flex gap-4 items-center">
                    {/* Product Image / Info */}
                    <div className="relative w-14 h-14 flex-shrink-0">
                      <div className="w-full h-full rounded-xl overflow-hidden bg-slate-50 border border-slate-100 flex items-center justify-center">
                        {item.image || item.image_url ? (
                          <img
                            src={item.image || item.image_url}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="material-symbols-outlined text-slate-300">
                            image
                          </span>
                        )}
                      </div>
                      {/* Quantity Bubble */}
                      <span className="absolute -top-1.5 -right-1.5 bg-[#6b1e96] text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full shadow-xs border border-white z-10">
                        {item.quantity}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0 py-0.5 flex flex-col justify-center">
                      <h4 className="text-xs font-bold text-slate-800 line-clamp-2 leading-snug">
                        {item.name}
                      </h4>
                      <p className="text-[10px] font-semibold text-slate-400 mt-0.5 truncate">
                        {variationLabel || "Por defecto"}
                      </p>
                      {item.store_is_open === false && (
                        <div className="mt-1">
                          <p className="text-[9px] text-amber-600 font-extrabold uppercase tracking-widest flex items-center gap-1">
                            <span className="inline-block w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                            Tienda Cerrada
                          </p>
                          {item.store_business_hours && (
                            <p className="text-[9px] text-slate-400 mt-0.5 font-medium">
                              <span className="font-semibold">Horario:</span> {item.store_business_hours}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="text-right py-0.5">
                      <p className="text-xs font-black text-slate-800">
                        {formatCurrencyUSD(item.price_usd * item.quantity)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {hasClosedStores && (
        <div className="flex items-start gap-2.5 p-3.5 mb-6 rounded-xl bg-amber-50/70 border border-amber-100 text-amber-800">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4.5 h-4.5 flex-shrink-0 mt-0.5 text-amber-600">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-[11px] leading-relaxed font-semibold">
            <span className="font-bold text-amber-950 block mb-0.5">Tiendas Cerradas</span> Algunos de los productos pertenecen a tiendas cerradas. Tu orden será reservada y el envío se realizará cuando retomen actividades.
          </p>
        </div>
      )}

      {/* Costs Breakdown */}
      <div className="space-y-3.5 mb-6 pt-5 border-t border-slate-100/80">
        <div className="flex justify-between text-xs font-bold text-slate-500">
          <span>Subtotal</span>
          <span className="text-slate-800">{formatCurrencyUSD(total_usd)}</span>
        </div>
        <div className="flex justify-between text-xs font-bold text-slate-500">
          <span>Envío</span>
          <span className={deliveryType === "local_delivery" || deliveryType === "mixed" ? "text-slate-800 font-black" : "bg-slate-100 px-2.5 py-1 rounded-lg text-slate-600 text-[10px] font-extrabold"}>
             {deliveryType === "local_delivery" || deliveryType === "mixed"
               ? deliveryFee > 0 ? formatCurrencyUSD(deliveryFee) : '¡Gratis!'
               : "Por calcular en destino"}
          </span>
        </div>
        {/* Buyer Service Fee */}
        <div className="flex justify-between text-xs font-bold text-slate-500">
          <span className="flex items-center gap-1">
            Comisión de servicio
            {buyerFeeRate > 0 && (
              <span className="text-[10px] font-bold text-slate-400">({buyerFeeRate}%)</span>
            )}
          </span>
          <span className="text-slate-800">
            {buyerFeeAmount > 0 ? formatCurrencyUSD(buyerFeeAmount) : "$0.00"}
          </span>
        </div>
      </div>

      {/* Total Box - Styled visually with purple accent */}
      <div className="bg-gradient-to-r from-purple-50/80 to-indigo-50/30 p-4.5 rounded-2xl border border-purple-100/50">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-sm font-black text-slate-900">Total</span>
          <span className="text-xl font-black text-[#6b1e96]">
            {formatCurrencyUSD(finalUsd)}
          </span>
        </div>
        <div className="text-right text-[10px] font-extrabold text-slate-400 flex items-center justify-end gap-1.5">
          <span className="px-1.5 py-0.5 rounded bg-white text-[#6b1e96] border border-purple-100/50 font-bold">VES</span>
          <span>Aprox. {formatCurrencyVES(finalVes)} Bs</span>
        </div>
      </div>
    </div>
  );
}

CheckoutSummary.propTypes = {
  cartItems: PropTypes.array.isRequired,
  total_usd: PropTypes.number.isRequired,
  total_ves: PropTypes.number.isRequired,
  deliveryType: PropTypes.string,
  buyerFeePercentage: PropTypes.number,
};
