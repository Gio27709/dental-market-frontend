import PropTypes from "prop-types";

export default function EscrowAgingStackedBar({ agingData = {} }) {
  const b0_7 = parseFloat(agingData?.bucket0To7Days || 0);
  const b8_15 = parseFloat(agingData?.bucket8To15Days || 0);
  const b16_30 = parseFloat(agingData?.bucket16To30Days || 0);
  const bOver30 = parseFloat(agingData?.bucketOver30Days || 0);
  const total = parseFloat(agingData?.totalEscrowUsd || b0_7 + b8_15 + b16_30 + bOver30 || 1);

  const p0 = Math.round((b0_7 / total) * 100);
  const p8 = Math.round((b8_15 / total) * 100);
  const p16 = Math.round((b16_30 / total) * 100);
  const pOver = Math.round((bOver30 / total) * 100);

  return (
    <div className="fx-card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-fx-text">Aging de Fondos en Escrow (Custodia)</h3>
          <p className="text-xs text-fx-muted">Total Retenido: <span className="text-fx-text font-bold">${total.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span></p>
        </div>
      </div>

      {/* Stacked bar */}
      <div className="w-full h-6 bg-purple-950/80 rounded-xl overflow-hidden flex border border-fx-line-strong mb-4">
        {p0 > 0 && <div style={{ width: `${p0}%` }} className="bg-emerald-500 h-full transition-all duration-300" title={`0-7 días: $${b0_7}`} />}
        {p8 > 0 && <div style={{ width: `${p8}%` }} className="bg-cyan-500 h-full transition-all duration-300" title={`8-15 días: $${b8_15}`} />}
        {p16 > 0 && <div style={{ width: `${p16}%` }} className="bg-amber-500 h-full transition-all duration-300" title={`16-30 días: $${b16_30}`} />}
        {pOver > 0 && <div style={{ width: `${pOver}%` }} className="bg-rose-500 h-full transition-all duration-300" title={`>30 días: $${bOver30}`} />}
      </div>

      {/* Legend Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
        <div className="flex items-center gap-2 bg-fx-inset p-2.5 rounded-xl border border-fx-line">
          <span className="w-3 h-3 rounded-full bg-emerald-500" />
          <div>
            <span className="text-fx-muted block">0–7 Días</span>
            <span className="text-fx-text font-bold">${b0_7.toLocaleString()}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-fx-inset p-2.5 rounded-xl border border-fx-line">
          <span className="w-3 h-3 rounded-full bg-cyan-500" />
          <div>
            <span className="text-fx-muted block">8–15 Días</span>
            <span className="text-fx-text font-bold">${b8_15.toLocaleString()}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-fx-inset p-2.5 rounded-xl border border-fx-line">
          <span className="w-3 h-3 rounded-full bg-amber-500" />
          <div>
            <span className="text-fx-muted block">16–30 Días</span>
            <span className="text-fx-text font-bold">${b16_30.toLocaleString()}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/30">
          <span className="w-3 h-3 rounded-full bg-rose-500 animate-pulse" />
          <div>
            <span className="text-rose-300 block font-semibold">&gt;30 Días (Crítico)</span>
            <span className="text-rose-200 font-bold">${bOver30.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

EscrowAgingStackedBar.propTypes = {
  agingData: PropTypes.shape({
    bucket0To7Days: PropTypes.number,
    bucket8To15Days: PropTypes.number,
    bucket16To30Days: PropTypes.number,
    bucketOver30Days: PropTypes.number,
    totalEscrowUsd: PropTypes.number
  })
};
