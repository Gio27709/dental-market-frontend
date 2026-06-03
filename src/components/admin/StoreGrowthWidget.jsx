import PropTypes from "prop-types";

export default function StoreGrowthWidget({ growth = {}, loading = false }) {
  if (loading) {
    return (
      <div className="rounded-2xl p-5 animate-pulse" style={{ background: "rgba(255,255,255,0.97)", border: "1px solid rgba(107,30,150,0.06)" }}>
        <div className="h-4 w-36 bg-gray-200 rounded mb-4" />
        <div className="flex gap-6"><div className="h-12 w-20 bg-gray-100 rounded" /><div className="h-12 w-20 bg-gray-100 rounded" /></div>
      </div>
    );
  }

  const { totalStores = 0, newStoresInPeriod = 0 } = growth;
  const growthRate = totalStores > 0 && newStoresInPeriod > 0
    ? Math.round((newStoresInPeriod / totalStores) * 1000) / 10
    : 0;

  return (
    <div className="rounded-2xl p-5 md:p-6" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.97) 0%, rgba(250,248,255,0.97) 100%)", border: "1px solid rgba(107,30,150,0.06)" }}>
      <div className="flex items-center gap-2 mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-indigo-400">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
        </svg>
        <h3 className="text-sm font-bold text-gray-700">Crecimiento de Tiendas</h3>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {/* Total */}
        <div className="text-center p-3 rounded-xl" style={{ background: "rgba(107,30,150,0.04)" }}>
          <p className="text-2xl font-extrabold text-gray-800">{totalStores}</p>
          <p className="text-[10px] text-gray-500 font-medium mt-1">Total Activas</p>
        </div>
        {/* New */}
        <div className="text-center p-3 rounded-xl" style={{ background: "rgba(195,255,0,0.08)" }}>
          <p className="text-2xl font-extrabold" style={{ color: newStoresInPeriod > 0 ? "#4d6600" : "#9ca3af" }}>
            {newStoresInPeriod > 0 ? `+${newStoresInPeriod}` : "0"}
          </p>
          <p className="text-[10px] text-gray-500 font-medium mt-1">Nuevas</p>
        </div>
        {/* Rate */}
        <div className="text-center p-3 rounded-xl" style={{ background: "rgba(99,102,241,0.04)" }}>
          <p className="text-2xl font-extrabold text-indigo-600">{growthRate}%</p>
          <p className="text-[10px] text-gray-500 font-medium mt-1">Tasa Crecim.</p>
        </div>
      </div>
    </div>
  );
}

StoreGrowthWidget.propTypes = {
  growth: PropTypes.shape({ totalStores: PropTypes.number, newStoresInPeriod: PropTypes.number }),
  loading: PropTypes.bool,
};
