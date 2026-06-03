import PropTypes from "prop-types";

export default function TopStoresTable({ stores = [], loading = false, onStoreClick }) {
  if (loading) {
    return (
      <div className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.97)", border: "1px solid rgba(107,30,150,0.06)" }}>
        <div className="h-4 w-36 bg-gray-200 rounded mb-4 animate-pulse" />
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-3 py-3 animate-pulse">
            <div className="w-6 h-6 bg-gray-100 rounded-full" />
            <div className="w-8 h-8 bg-gray-100 rounded-lg" />
            <div className="flex-1"><div className="h-3 w-28 bg-gray-100 rounded mb-1" /><div className="h-2 w-16 bg-gray-50 rounded" /></div>
            <div className="h-3 w-16 bg-gray-100 rounded" />
          </div>
        ))}
      </div>
    );
  }

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div className="rounded-2xl p-5 md:p-6" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.97) 0%, rgba(250,248,255,0.97) 100%)", border: "1px solid rgba(107,30,150,0.06)" }}>
      <div className="flex items-center gap-2 mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-purple-400">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z" />
        </svg>
        <h3 className="text-sm font-bold text-gray-700">Top 10 Tiendas por GMV</h3>
      </div>

      {stores.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-sm text-gray-400">Sin datos de tiendas en este periodo</p>
        </div>
      ) : (
        <div className="space-y-1">
          {/* Header */}
          <div className="grid grid-cols-12 gap-2 px-2 pb-2 border-b border-gray-100">
            <span className="col-span-1 text-[9px] font-bold uppercase tracking-wider text-gray-400">#</span>
            <span className="col-span-5 text-[9px] font-bold uppercase tracking-wider text-gray-400">Tienda</span>
            <span className="col-span-2 text-[9px] font-bold uppercase tracking-wider text-gray-400 text-right">GMV</span>
            <span className="col-span-2 text-[9px] font-bold uppercase tracking-wider text-gray-400 text-right">Órdenes</span>
            <span className="col-span-2 text-[9px] font-bold uppercase tracking-wider text-gray-400 text-right">% Total</span>
          </div>

          {stores.map((store, index) => {
            const logoUrl = store.logo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(store.name)}&background=6b1e96&color=fff&size=40`;
            return (
              <div
                key={store.id}
                onClick={() => onStoreClick && onStoreClick(store.id)}
                className="grid grid-cols-12 gap-2 items-center px-2 py-2.5 rounded-lg transition-all duration-150 hover:bg-purple-50/50 cursor-pointer group"
              >
                {/* Rank */}
                <div className="col-span-1 flex items-center justify-center">
                  {index < 3 ? (
                    <span className="text-base">{medals[index]}</span>
                  ) : (
                    <span className="text-xs font-bold text-gray-300">{index + 1}</span>
                  )}
                </div>

                {/* Store info */}
                <div className="col-span-5 flex items-center gap-2 min-w-0">
                  <img src={logoUrl} alt={store.name} className="w-7 h-7 rounded-lg object-cover flex-shrink-0 border border-gray-100" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-gray-800 truncate group-hover:text-purple-700 transition-colors">{store.name}</p>
                    <div className="flex items-center gap-1">
                      {store.rating > 0 && (
                        <span className="text-[9px] text-yellow-500">★ {store.rating.toFixed(1)}</span>
                      )}
                      {store.state && store.state !== "—" && (
                        <span className="text-[9px] text-gray-400">{store.state}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* GMV */}
                <div className="col-span-2 text-right">
                  <span className="text-xs font-bold text-gray-800">${store.gmv.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>

                {/* Orders */}
                <div className="col-span-2 text-right">
                  <span className="text-xs text-gray-500">{store.orders}</span>
                </div>

                {/* % of total with progress bar */}
                <div className="col-span-2 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <div className="w-12 h-1.5 bg-gray-100 rounded-full overflow-hidden hidden md:block">
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(store.pctOfTotal, 100)}%`, background: "linear-gradient(90deg, #6b1e96, #c3ff00)" }} />
                    </div>
                    <span className="text-[10px] font-semibold text-gray-500">{store.pctOfTotal}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

TopStoresTable.propTypes = {
  stores: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string, name: PropTypes.string, logo_url: PropTypes.string,
    rating: PropTypes.number, state: PropTypes.string, gmv: PropTypes.number,
    orders: PropTypes.number, pctOfTotal: PropTypes.number,
  })),
  loading: PropTypes.bool,
  onStoreClick: PropTypes.func,
};
