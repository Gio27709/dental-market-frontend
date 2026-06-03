import PropTypes from "prop-types";

export default function FinancialBar({ grossRevenue, platformFees, netRevenue, walletAvailable, walletPending }) {
  const feePercentage = grossRevenue > 0 ? ((platformFees / grossRevenue) * 100).toFixed(1) : 0;
  const barWidth = grossRevenue > 0 ? ((netRevenue / grossRevenue) * 100) : 100;

  return (
    <div
      className="rounded-2xl p-5 md:p-6 overflow-hidden relative"
      style={{
        background: "linear-gradient(135deg, #1a0a2e 0%, #2d1452 50%, #1a0a2e 100%)",
      }}
    >
      {/* Decorative glow */}
      <div className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-10 pointer-events-none"
        style={{ background: "radial-gradient(circle, #c3ff00 0%, transparent 70%)", transform: "translate(30%, -30%)" }} />

      <div className="relative z-10">
        {/* Title */}
        <div className="flex items-center gap-2 mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-[#c3ff00]">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" />
          </svg>
          <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-white/50">Resumen Financiero</h3>
        </div>

        {/* Revenue Flow: Bruto → Comisión → Neto */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div>
            <p className="text-[10px] font-medium text-white/40 mb-0.5">Ventas Brutas</p>
            <p className="text-xl md:text-2xl font-extrabold text-white">${grossRevenue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
          <div className="flex flex-col items-center justify-center">
            <div className="flex items-center gap-1.5">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5 text-red-400/60">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
              </svg>
              <p className="text-[10px] font-medium text-red-400/60">Comisión ({feePercentage}%)</p>
            </div>
            <p className="text-lg font-bold text-red-400/80">-${platformFees.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-medium text-[#c3ff00]/60 mb-0.5">Ingresos Netos</p>
            <p className="text-xl md:text-2xl font-extrabold text-[#c3ff00]">${netRevenue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-2 rounded-full overflow-hidden mb-4" style={{ background: "rgba(255,255,255,0.06)" }}>
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{
              width: `${barWidth}%`,
              background: "linear-gradient(90deg, #c3ff00 0%, #10b981 100%)",
              boxShadow: "0 0 12px rgba(195,255,0,0.3)",
            }}
          />
        </div>

        {/* Wallet badges */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: "rgba(195,255,0,0.08)" }}>
            <div className="w-2 h-2 rounded-full bg-[#c3ff00] shadow-[0_0_6px_rgba(195,255,0,0.5)]" />
            <div>
              <p className="text-[9px] font-bold uppercase tracking-wider text-[#c3ff00]/50">Disponible</p>
              <p className="text-sm font-bold text-[#c3ff00]">${(walletAvailable || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: "rgba(251,191,36,0.08)" }}>
            <div className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.5)]" />
            <div>
              <p className="text-[9px] font-bold uppercase tracking-wider text-amber-400/50">En Escrow</p>
              <p className="text-sm font-bold text-amber-400">${(walletPending || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

FinancialBar.propTypes = {
  grossRevenue: PropTypes.number.isRequired,
  platformFees: PropTypes.number.isRequired,
  netRevenue: PropTypes.number.isRequired,
  walletAvailable: PropTypes.number,
  walletPending: PropTypes.number,
};
