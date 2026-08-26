import PropTypes from "prop-types";

export default function RetentionCohortHeatmap({ data = [] }) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-fx-panel border border-fx-line rounded-xl p-6 text-center text-fx-muted">
        No hay datos de cohortes suficientes.
      </div>
    );
  }

  const getHeatColor = (pct) => {
    if (pct >= 50) return "bg-fx-pos/80 text-fx-text font-bold";
    if (pct >= 30) return "bg-fx-pos/50 text-fx-text";
    if (pct >= 15) return "bg-fx-warn/40 text-fx-warn";
    if (pct > 0) return "bg-fx-violet/30 text-fx-muted";
    return "bg-purple-900/20 text-gray-500";
  };

  return (
    <div className="fx-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-fx-text">Heatmap de Cohortes de Retención de Compradores</h3>
        <span className="text-xs text-fx-faint font-medium">Retención Mensual (M0 a M3)</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-fx-muted">
          <thead>
            <tr className="border-b border-fx-line text-fx-muted uppercase">
              <th className="py-2.5 px-3">Cohorte</th>
              <th className="py-2.5 px-3">Compradores M0</th>
              <th className="py-2.5 px-3 text-center">Mes 0</th>
              <th className="py-2.5 px-3 text-center">Mes 1</th>
              <th className="py-2.5 px-3 text-center">Mes 2</th>
              <th className="py-2.5 px-3 text-center">Mes 3</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => {
              const total = parseInt(row.total_buyers || 1, 10);
              const m0 = parseInt(row.m0_buyers || 0, 10);
              const m1 = parseInt(row.m1_buyers || 0, 10);
              const m2 = parseInt(row.m2_buyers || 0, 10);
              const m3 = parseInt(row.m3_buyers || 0, 10);

              const p0 = Math.round((m0 / total) * 100);
              const p1 = Math.round((m1 / total) * 100);
              const p2 = Math.round((m2 / total) * 100);
              const p3 = Math.round((m3 / total) * 100);

              return (
                <tr key={row.cohort_month || idx} className="border-b border-fx-line hover:bg-fx-violet/5">
                  <td className="py-3 px-3 font-semibold text-fx-text">{row.cohort_month}</td>
                  <td className="py-3 px-3 font-bold text-fx-muted">{total.toLocaleString()}</td>
                  <td className={`py-3 px-3 text-center rounded-lg ${getHeatColor(p0)}`}>{p0}%</td>
                  <td className={`py-3 px-3 text-center rounded-lg ${getHeatColor(p1)}`}>{p1}%</td>
                  <td className={`py-3 px-3 text-center rounded-lg ${getHeatColor(p2)}`}>{p2}%</td>
                  <td className={`py-3 px-3 text-center rounded-lg ${getHeatColor(p3)}`}>{p3}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

RetentionCohortHeatmap.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      cohort_month: PropTypes.string,
      total_buyers: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      m0_buyers: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      m1_buyers: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      m2_buyers: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      m3_buyers: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
    })
  )
};
