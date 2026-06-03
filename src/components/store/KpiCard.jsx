import PropTypes from "prop-types";

export default function KpiCard({ title, value, trend, icon, prefix = "", suffix = "" }) {
  const trendPositive = trend > 0;
  const trendNeutral = trend === 0 || trend === null || trend === undefined;

  return (
    <div
      className="group relative overflow-hidden rounded-2xl p-5 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
      style={{
        background: "linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(250,248,255,0.95) 100%)",
        border: "1px solid rgba(107,30,150,0.06)",
      }}
    >
      {/* Subtle hover glow */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background: "radial-gradient(circle at 80% 20%, rgba(195,255,0,0.06) 0%, transparent 60%)",
        }}
      />

      <div className="relative z-10 flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-gray-400 mb-2">
            {title}
          </p>
          <p className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">
            {prefix}{value}{suffix}
          </p>

          {/* Trend indicator */}
          {!trendNeutral && (
            <div className="flex items-center gap-1 mt-2">
              <div
                className="flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold"
                style={{
                  background: trendPositive ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
                  color: trendPositive ? "#059669" : "#dc2626",
                }}
              >
                {trendPositive ? (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 4.5l15 15m0 0V8.25m0 11.25H8.25" />
                  </svg>
                )}
                {Math.abs(trend)}%
              </div>
              <span className="text-[10px] text-gray-400">vs anterior</span>
            </div>
          )}
          {trendNeutral && (
            <div className="flex items-center gap-1 mt-2">
              <span className="text-[10px] text-gray-300">— sin datos previos</span>
            </div>
          )}
        </div>

        {/* Icon */}
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover:scale-110"
          style={{
            background: "linear-gradient(135deg, rgba(107,30,150,0.08) 0%, rgba(195,255,0,0.08) 100%)",
            color: "#6b1e96",
          }}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

KpiCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  trend: PropTypes.number,
  icon: PropTypes.node.isRequired,
  prefix: PropTypes.string,
  suffix: PropTypes.string,
};
