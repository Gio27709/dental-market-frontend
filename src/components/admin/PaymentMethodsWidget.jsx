import PropTypes from "prop-types";

const METHOD_LABELS = {
  pago_movil: "Pago Móvil",
  transferencia: "Transferencia",
  zelle: "Zelle",
  efectivo: "Efectivo",
  punto_venta: "Punto de Venta",
  binance: "Binance Pay",
  zinli: "Zinli",
  unknown: "Sin especificar",
};

const METHOD_COLORS = [
  "#6b1e96", "#c3ff00", "#3b82f6", "#f59e0b", "#10b981", "#ec4899", "#94a3b8",
];

export default function PaymentMethodsWidget({ methods = {}, loading = false }) {
  if (loading) {
    return (
      <div className="rounded-2xl p-5 animate-pulse" style={{ background: "rgba(255,255,255,0.97)", border: "1px solid rgba(107,30,150,0.06)" }}>
        <div className="h-4 w-36 bg-gray-200 rounded mb-4" />
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-6 bg-gray-100 rounded" />)}</div>
      </div>
    );
  }

  const entries = Object.entries(methods).sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((sum, [, count]) => sum + count, 0);

  return (
    <div className="rounded-2xl p-5 md:p-6" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.97) 0%, rgba(250,248,255,0.97) 100%)", border: "1px solid rgba(107,30,150,0.06)" }}>
      <div className="flex items-center gap-2 mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-blue-400">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" />
        </svg>
        <h3 className="text-sm font-bold text-gray-700">Métodos de Pago</h3>
        {total > 0 && <span className="text-[10px] text-gray-400 ml-auto">{total} transacciones</span>}
      </div>

      {entries.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">Sin datos</p>
      ) : (
        <div className="space-y-3">
          {entries.map(([method, count], index) => {
            const pct = total > 0 ? Math.round((count / total) * 1000) / 10 : 0;
            const color = METHOD_COLORS[index % METHOD_COLORS.length];
            const label = METHOD_LABELS[method] || method;
            return (
              <div key={method}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
                    <span className="text-xs font-medium text-gray-700">{label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-gray-500">{count}</span>
                    <span className="text-[10px] text-gray-400">({pct}%)</span>
                  </div>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color, opacity: 0.8 }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

PaymentMethodsWidget.propTypes = {
  methods: PropTypes.object,
  loading: PropTypes.bool,
};
