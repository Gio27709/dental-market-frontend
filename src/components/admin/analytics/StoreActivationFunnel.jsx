import PropTypes from "prop-types";

export default function StoreActivationFunnel({ funnelData = {} }) {
  const registered = parseInt(funnelData?.registered || 0, 10);
  const approved = parseInt(funnelData?.approved || 0, 10);
  const withProduct = parseInt(funnelData?.with_product || 0, 10);
  const withSale = parseInt(funnelData?.with_sale || 0, 10);

  const steps = [
    { label: "1. Tiendas Registradas", count: registered, color: "bg-fx-violet", pct: 100 },
    { label: "2. Tiendas Aprobadas", count: approved, color: "bg-indigo-500", pct: registered > 0 ? Math.round((approved / registered) * 100) : 0 },
    { label: "3. Con Producto Publicado", count: withProduct, color: "bg-fx-info", pct: registered > 0 ? Math.round((withProduct / registered) * 100) : 0 },
    { label: "4. Con Primera Venta Realizada", count: withSale, color: "bg-[#6b1e96]", text: "text-white", pct: registered > 0 ? Math.round((withSale / registered) * 100) : 0 },
  ];

  return (
    <div className="fx-card">
      <h3 className="text-base font-bold text-fx-text mb-4">Funnel de Activación de Comercios</h3>
      <div className="space-y-4">
        {steps.map((step, idx) => (
          <div key={idx} className="space-y-1">
            <div className="flex justify-between text-xs font-semibold text-fx-muted">
              <span>{step.label}</span>
              <span className="text-fx-faint font-bold">{step.count.toLocaleString()} tiendas ({step.pct}%)</span>
            </div>
            <div className="w-full h-3 bg-fx-inset rounded-full overflow-hidden border border-fx-line">
              <div
                className={`h-full ${step.color} transition-all duration-500 rounded-full`}
                style={{ width: `${Math.max(step.pct, 4)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

StoreActivationFunnel.propTypes = {
  funnelData: PropTypes.shape({
    registered: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    approved: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    with_product: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    with_sale: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
  })
};
