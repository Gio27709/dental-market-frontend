import PropTypes from "prop-types";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const STITCH_COLORS = ["#541a97", "#006d37", "#7a4b00", "#ba1a1a", "#6c38b0", "#ffb961"];

export default function FinancialCharts({ monthlyHistory, categoryBreakdown }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* ── GRAFICO DE TENDENCIA DE GASTO MENSUAL ── */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-[#cdc3d4]/20 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#cdc3d4]/20 pb-4">
          <div>
            <h3 className="text-lg font-bold text-[#111c2c] flex items-center gap-2">
              <span className="material-symbols-outlined text-[#541a97]" style={{ fontVariationSettings: "'FILL' 1" }}>
                bar_chart
              </span>
              Tendencia de Gasto Mensual ($)
            </h3>
            <p className="text-xs text-[#4b4452] mt-0.5">
              Histórico de inversión en insumos odontológicos durante los últimos meses.
            </p>
          </div>
        </div>

        {monthlyHistory.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-xs text-[#4b4452]">
            No hay compras registradas para graficar tendencias.
          </div>
        ) : (
          <div className="h-64 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="monthLabel" tick={{ fill: "#4b4452", fontSize: 11 }} />
                <YAxis tick={{ fill: "#4b4452", fontSize: 11 }} />
                <Tooltip
                  formatter={(value) => [`$${Number(value).toFixed(2)}`, "Gasto Total"]}
                  contentStyle={{ backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #cdc3d4" }}
                />
                <Bar dataKey="totalSpent" fill="#541a97" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* ── GRAFICO DE DISTRIBUCION POR CATEGORIA ── */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-[#cdc3d4]/20 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#cdc3d4]/20 pb-4">
          <div>
            <h3 className="text-lg font-bold text-[#111c2c] flex items-center gap-2">
              <span className="material-symbols-outlined text-[#541a97]" style={{ fontVariationSettings: "'FILL' 1" }}>
                pie_chart
              </span>
              Distribución por Categoría (%)
            </h3>
            <p className="text-xs text-[#4b4452] mt-0.5">
              Porcentaje de inversión según la especialidad o tipo de insumo.
            </p>
          </div>
        </div>

        {categoryBreakdown.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-xs text-[#4b4452]">
            No hay categorías de insumos para distribuir.
          </div>
        ) : (
          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="totalAmount"
                  nameKey="categoryName"
                >
                  {categoryBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={STITCH_COLORS[index % STITCH_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [`$${Number(value).toFixed(2)}`, "Inversión"]}
                  contentStyle={{ backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #cdc3d4" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}

FinancialCharts.propTypes = {
  monthlyHistory: PropTypes.array.isRequired,
  categoryBreakdown: PropTypes.array.isRequired,
};
