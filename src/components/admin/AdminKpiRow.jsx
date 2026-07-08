import PropTypes from "prop-types";

const KPI_CONFIGS = [
  { key: "gmv", title: "GMV (Ventas Brutas)", prefix: "$", format: "currency", gradient: "linear-gradient(135deg, #531575 0%, #6b1e96 100%)", iconBg: "rgba(195,255,0,0.15)", iconColor: "#c3ff00", icon: "M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" },
  { key: "platformRevenue", title: "Ingresos Plataforma", prefix: "$", format: "currency", gradient: "linear-gradient(135deg, #065f46 0%, #10b981 100%)", iconBg: "rgba(195,255,0,0.2)", iconColor: "#c3ff00", icon: "M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" },
  { key: "totalOrders", title: "Órdenes Totales", prefix: "", format: "number", gradient: "linear-gradient(135deg, #92400e 0%, #f59e0b 100%)", iconBg: "rgba(255,255,255,0.2)", iconColor: "#fff", icon: "M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" },
  { key: "avgOrderValue", title: "Ticket Promedio", prefix: "$", format: "currency", gradient: "linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)", iconBg: "rgba(255,255,255,0.2)", iconColor: "#fff", icon: "M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" },
  { key: "newUsers", title: "Usuarios Nuevos", prefix: "", format: "number", gradient: "linear-gradient(135deg, #4338ca 0%, #6366f1 100%)", iconBg: "rgba(255,255,255,0.2)", iconColor: "#fff", icon: "M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" },
  { key: "cancelRate", title: "Tasa Cancelación", prefix: "", suffix: "%", format: "percent", gradient: "linear-gradient(135deg, #1e293b 0%, #475569 100%)", iconBg: "rgba(255,255,255,0.2)", iconColor: "#fff", icon: "M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z", invertTrend: true },
];

function formatValue(value, format) {
  if (value === null || value === undefined) return "—";
  if (format === "currency") return value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (format === "percent") return value.toFixed(1);
  return value.toLocaleString("en-US");
}

export default function AdminKpiRow({ kpis = {}, trends = {}, loading = false }) {
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl p-6 animate-pulse" style={{ background: "rgba(107,30,150,0.08)" }}>
              <div className="h-3 w-24 bg-white/20 rounded mb-3" />
              <div className="h-10 w-28 bg-white/20 rounded" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[4, 5, 6].map((i) => (
            <div key={i} className="rounded-2xl p-6 animate-pulse" style={{ background: "rgba(107,30,150,0.08)" }}>
              <div className="h-3 w-20 bg-white/20 rounded mb-3" />
              <div className="h-8 w-20 bg-white/20 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const renderCard = (config, index) => {
    const value = kpis[config.key];
    const trend = trends[config.key];
    const isPositive = config.invertTrend ? trend <= 0 : trend >= 0;

    return (
      <div
        key={config.key}
        className="group relative overflow-hidden rounded-2xl p-5 text-white transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
        style={{ background: config.gradient, animationDelay: `${index * 80}ms` }}
      >
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%)" }} />
        <div className="relative z-10 flex items-start justify-between">
          <div>
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-white/60 mb-1.5">{config.title}</h3>
            <p className="text-2xl md:text-3xl font-extrabold leading-none">
              {config.prefix}{formatValue(value, config.format)}{config.suffix || ""}
            </p>
            {/* Trend */}
            {trend !== null && trend !== undefined && trend !== 0 && (
              <div className="flex items-center gap-1 mt-2">
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${isPositive ? "bg-white/20 text-white" : "bg-red-500/30 text-red-200"}`}>
                  {trend > 0 ? "↑" : "↓"} {Math.abs(trend)}%
                </span>
                <span className="text-[9px] text-white/40">vs periodo anterior</span>
              </div>
            )}
            {/* Fee breakdown for platformRevenue */}
            {config.key === "platformRevenue" && kpis.storeFees !== undefined && (
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-[9px] text-white/40">Store: ${kpis.storeFees?.toFixed(2)}</span>
                <span className="text-[9px] text-white/30">|</span>
                <span className="text-[9px] text-white/40">Buyer: ${kpis.buyerFees?.toFixed(2)}</span>
              </div>
            )}
          </div>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: config.iconBg, color: config.iconColor }}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d={config.icon} />
            </svg>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: "#c3ff00" }} />
      </div>
    );
  };

  const row1 = KPI_CONFIGS.slice(0, 3);
  const row2 = KPI_CONFIGS.slice(3, 6);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {row1.map((c, i) => renderCard(c, i))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {row2.map((c, i) => renderCard(c, i + 3))}
      </div>
    </div>
  );
}

AdminKpiRow.propTypes = {
  kpis: PropTypes.object,
  trends: PropTypes.object,
  loading: PropTypes.bool,
};
