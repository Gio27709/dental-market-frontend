import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import PropTypes from "prop-types";

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl px-4 py-3 shadow-xl border" style={{ background: "linear-gradient(135deg, #1a0a2e 0%, #2d1452 100%)", borderColor: "rgba(195,255,0,0.15)" }}>
      <p className="text-[10px] font-bold uppercase tracking-wider text-white/40 mb-1.5">{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
          <span className="text-xs text-white/60">{entry.name}:</span>
          <span className="text-xs font-bold text-white">
            {entry.name === "Órdenes" ? entry.value : `$${entry.value.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
          </span>
        </div>
      ))}
    </div>
  );
}
CustomTooltip.propTypes = { active: PropTypes.bool, payload: PropTypes.array, label: PropTypes.string };

export default function PlatformRevenueChart({ data = [], loading = false }) {
  if (loading) {
    return (
      <div className="rounded-2xl p-5 animate-pulse" style={{ background: "rgba(107,30,150,0.04)", border: "1px solid rgba(107,30,150,0.06)" }}>
        <div className="h-4 w-44 bg-gray-200 rounded mb-4" />
        <div className="h-60 bg-gray-100 rounded-xl" />
      </div>
    );
  }
  const hasData = data && data.length > 0;
  const fmtTick = (val) => {
    if (val.includes(" ")) return val.split(" ")[1];
    if (val.length === 7) return val.split("-")[1];
    const p = val.split("-");
    return `${p[2]}/${p[1]}`;
  };

  return (
    <div className="rounded-2xl p-5 md:p-6" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.97) 0%, rgba(250,248,255,0.97) 100%)", border: "1px solid rgba(107,30,150,0.06)" }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-purple-400">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
          </svg>
          <h3 className="text-sm font-bold text-gray-700">Evolución de la Plataforma</h3>
        </div>
        {hasData && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full" style={{ background: "#6b1e96" }} /><span className="text-[10px] text-gray-400">GMV</span></div>
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full" style={{ background: "#94a3b8" }} /><span className="text-[10px] text-gray-400">Órdenes</span></div>
          </div>
        )}
      </div>
      {hasData ? (
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="adminGmvGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6b1e96" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#6b1e96" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(107,30,150,0.06)" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#9ca3af" }} tickLine={false} axisLine={{ stroke: "rgba(107,30,150,0.08)" }} tickFormatter={fmtTick} />
            <YAxis yAxisId="usd" tick={{ fontSize: 10, fill: "#9ca3af" }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v >= 1000 ? `${(v/1000).toFixed(1)}k` : v}`} />
            <YAxis yAxisId="count" orientation="right" hide />
            <Tooltip content={<CustomTooltip />} />
            <Area yAxisId="usd" type="monotone" dataKey="revenue" name="GMV" stroke="#6b1e96" strokeWidth={2.5} fill="url(#adminGmvGrad)" dot={false} activeDot={{ r: 5, fill: "#6b1e96", stroke: "#fff", strokeWidth: 2 }} />
            <Area yAxisId="count" type="monotone" dataKey="orders" name="Órdenes" stroke="#94a3b8" strokeWidth={1.5} fill="none" dot={false} activeDot={{ r: 4, fill: "#94a3b8", stroke: "#fff", strokeWidth: 2 }} />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-sm font-medium text-gray-400">Sin datos en este periodo</p>
        </div>
      )}
    </div>
  );
}

PlatformRevenueChart.propTypes = {
  data: PropTypes.arrayOf(PropTypes.shape({ date: PropTypes.string, revenue: PropTypes.number, orders: PropTypes.number })),
  loading: PropTypes.bool,
};
