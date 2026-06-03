import { useState } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import PropTypes from "prop-types";

/**
 * Custom tooltip with dark theme matching Clinical Curator aesthetic
 */
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  return (
    <div
      className="rounded-xl px-4 py-3 shadow-xl border"
      style={{
        background: "linear-gradient(135deg, #1a0a2e 0%, #2d1452 100%)",
        borderColor: "rgba(195,255,0,0.15)",
      }}
    >
      <p className="text-[10px] font-bold uppercase tracking-wider text-white/40 mb-1.5">{label}</p>
      {payload.map((entry, index) => {
        let valueStr = entry.value;
        if (entry.dataKey === "revenue" || entry.dataKey === "avgOrder") {
          valueStr = `$${Number(entry.value).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
        } else {
          valueStr = Number(entry.value).toLocaleString("en-US");
        }
        return (
          <div key={index} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
            <span className="text-xs text-white/60">{entry.name}:</span>
            <span className="text-xs font-bold text-white">
              {valueStr}
            </span>
          </div>
        );
      })}
    </div>
  );
}

CustomTooltip.propTypes = {
  active: PropTypes.bool,
  payload: PropTypes.array,
  label: PropTypes.string,
};

export default function SalesChart({ data = [], loading = false }) {
  const [metric, setMetric] = useState("revenue");

  if (loading) {
    return (
      <div
        className="rounded-2xl p-5 animate-pulse"
        style={{ background: "rgba(107,30,150,0.04)", border: "1px solid rgba(107,30,150,0.06)" }}
      >
        <div className="h-4 w-36 bg-gray-200 rounded mb-4" />
        <div className="h-52 bg-gray-100 rounded-xl" />
      </div>
    );
  }

  const hasData = data && data.length > 0;

  // Process data to calculate average order value on the fly
  const chartData = data.map((item) => ({
    ...item,
    avgOrder: item.orders > 0 ? Math.round((item.revenue / item.orders) * 100) / 100 : 0,
  }));

  const metrics = [
    { id: "revenue", label: "Ventas ($)", color: "#6b1e96", gradient: "revenueGradient", stroke: "#6b1e96", labelShort: "Ventas ($)" },
    { id: "orders", label: "Órdenes (uds)", color: "#10b981", gradient: "ordersGradient", stroke: "#10b981", labelShort: "Órdenes" },
    { id: "units", label: "Artículos (uds)", color: "#f59e0b", gradient: "unitsGradient", stroke: "#f59e0b", labelShort: "Artículos" },
    { id: "avgOrder", label: "Ticket Prom. ($)", color: "#3b82f6", gradient: "avgOrderGradient", stroke: "#3b82f6", labelShort: "Ticket Prom." },
  ];

  const activeMetric = metrics.find((m) => m.id === metric) || metrics[0];

  const formatYAxis = (val) => {
    if (metric === "revenue" || metric === "avgOrder") {
      return `$${val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val}`;
    }
    return val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val;
  };

  return (
    <div
      className="rounded-2xl p-5 md:p-6"
      style={{
        background: "linear-gradient(135deg, rgba(255,255,255,0.97) 0%, rgba(250,248,255,0.97) 100%)",
        border: "1px solid rgba(107,30,150,0.06)",
      }}
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-purple-400">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
          </svg>
          <h3 className="text-sm font-bold text-gray-700">Evolución de Rendimiento</h3>
        </div>

        {/* Metric Selector tabs */}
        {hasData && (
          <div className="flex flex-wrap gap-1 bg-gray-100/80 p-1 rounded-xl">
            {metrics.map((m) => (
              <button
                key={m.id}
                onClick={() => setMetric(m.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${
                  metric === m.id
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                {m.labelShort}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Chart */}
      {hasData ? (
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6b1e96" stopOpacity={0.25} />
                <stop offset="50%" stopColor="#6b1e96" stopOpacity={0.08} />
                <stop offset="100%" stopColor="#6b1e96" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="ordersGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.25} />
                <stop offset="50%" stopColor="#10b981" stopOpacity={0.08} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="unitsGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.25} />
                <stop offset="50%" stopColor="#f59e0b" stopOpacity={0.08} />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="avgOrderGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.25} />
                <stop offset="50%" stopColor="#3b82f6" stopOpacity={0.08} />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="rgba(107,30,150,0.06)" vertical={false} />

            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: "#9ca3af" }}
              tickLine={false}
              axisLine={{ stroke: "rgba(107,30,150,0.08)" }}
              tickFormatter={(val) => {
                if (val.includes(" ")) return val.split(" ")[1]; // hour
                if (val.length === 7) return val.split("-")[1]; // month
                const parts = val.split("-");
                return `${parts[2]}/${parts[1]}`; // day/month
              }}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "#9ca3af" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatYAxis}
            />

            <Tooltip content={<CustomTooltip />} />

            <Area
              type="monotone"
              dataKey={activeMetric.id}
              name={activeMetric.labelShort}
              stroke={activeMetric.stroke}
              strokeWidth={2.5}
              fill={`url(#${activeMetric.gradient})`}
              dot={false}
              activeDot={{ r: 5, fill: activeMetric.stroke, stroke: "#fff", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-12 h-12 text-gray-200 mb-3">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
          </svg>
          <p className="text-sm font-medium text-gray-400">Sin datos de ventas en este periodo</p>
          <p className="text-xs text-gray-300 mt-1">Las ventas aparecerán aquí cuando se confirmen pagos</p>
        </div>
      )}
    </div>
  );
}

SalesChart.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      date: PropTypes.string,
      revenue: PropTypes.number,
      orders: PropTypes.number,
      units: PropTypes.number,
    })
  ),
  loading: PropTypes.bool,
};
