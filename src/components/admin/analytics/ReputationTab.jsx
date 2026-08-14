import { useState } from "react";
import PropTypes from "prop-types";
import { getReputationAnalyticsAPI } from "../../../services/api";
import useAnalyticsTabData from "../../../hooks/useAnalyticsTabData";
import useDrilldown from "../../../hooks/useDrilldown";
import KpiCard from "./KpiCard";
import ChartCard from "./ChartCard";
import DataTable from "./DataTable";
import SkeletonLoader from "./SkeletonLoader";
import FreshnessBadge from "./FreshnessBadge";
import DateRangePicker from "./DateRangePicker";
import AnalyticsErrorPanel from "./AnalyticsErrorPanel";
import DrilldownModal from "./DrilldownModal";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend, Cell
} from "recharts";

const STAR_COLORS = { 5: "#c3ff00", 4: "#a3e635", 3: "#facc15", 2: "#fb923c", 1: "#f43f5e" };

const ratingColor = (value) => {
  const v = parseFloat(value || 0);
  if (v >= 4) return "text-emerald-400";
  if (v >= 3) return "text-amber-400";
  return "text-rose-400";
};

const Stars = ({ value }) => {
  const n = Math.round(parseFloat(value) || 0);
  return (
    <span className="whitespace-nowrap text-amber-400 font-bold">
      {"★".repeat(n)}
      <span className="text-gray-600">{"★".repeat(Math.max(0, 5 - n))}</span>
    </span>
  );
};

Stars.propTypes = { value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]) };

export default function ReputationTab() {
  const [period, setPeriod] = useState("30d");
  const [chartMode, setChartMode] = useState("area");
  const { data, loading, error, reload } = useAnalyticsTabData(getReputationAnalyticsAPI, period);
  const drilldown = useDrilldown();

  if (loading && !data) return <SkeletonLoader type="kpiRow" />;
  if (error) {
    return <AnalyticsErrorPanel title="Error al cargar Reputación" message={error} onRetry={() => reload(true)} />;
  }

  const kpis = data?.kpis || {};

  // El backend solo devuelve las estrellas que existen; se completan las cinco para que
  // el hueco de una calificación ausente sea visible en vez de desaparecer del eje.
  const distribution = [5, 4, 3, 2, 1].map((star) => {
    const found = (data?.ratingDistribution || []).find((r) => Number(r.rating) === star);
    return { rating: star, label: `${star} ★`, total: Number(found?.total || 0), pct: parseFloat(found?.pct || 0) };
  });

  return (
    <div className="space-y-6">
      {/* Controles */}
      <div className="relative z-30 flex flex-col md:flex-row md:items-center justify-between gap-4 fx-card-sm">
        <div>
          <h2 className="text-sm font-bold text-fx-text">Reputación y Voz del Cliente</h2>
          <p className="text-[11px] text-fx-muted">
            Reseñas, preguntas y la parte del catálogo que aún no tiene voz
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <DateRangePicker selectedPeriod={period} onPeriodChange={setPeriod} />
          <FreshnessBadge lastUpdated={data?.serverTimestamp} onRefresh={() => reload(true)} isLoading={loading} />
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
        <KpiCard
          title="Reseñas del Período"
          value={kpis.totalReviews}
          format="number"
          suffix={` · ${kpis.reviewers || 0} autores`}
          tooltip="Reseñas publicadas dentro del período seleccionado."
          onDrilldown={() => drilldown.open("product_reviews", { title: "Reseñas del período" })}
        />
        <KpiCard
          title="Calificación Promedio"
          value={kpis.avgRating}
          format="number"
          suffix=" / 5"
          tooltip="Promedio de estrellas del período. Míralo siempre junto a la distribución: un 4.0 puede ser todo 4 estrellas o mitad 5 y mitad 1."
        />
        <KpiCard
          title="Saldo Neto (NPS)"
          value={kpis.npsLike}
          format="number"
          tooltip="Promotores (4-5 ★) menos detractores (1-2 ★), sobre el total. Adaptado a escala de 5 estrellas; va de -100 a +100."
        />
        <KpiCard
          title="Cobertura del Catálogo"
          value={kpis.coveragePct}
          format="percent"
          suffix={` · ${kpis.productsWithReviews || 0}/${kpis.activeProducts || 0}`}
          tooltip="Porcentaje de productos activos con al menos una reseña. El resto se vende a ciegas, sin prueba social."
          onDrilldown={() =>
            drilldown.open("products", {
              title: "Productos activos sin ninguna reseña",
              subtitle: "El catálogo que aún no tiene voz del cliente",
              filters: { no_reviews: true, is_active: true, allTime: true }
            })
          }
        />
        <KpiCard
          title="Compras Verificadas"
          value={kpis.verifiedPct}
          format="percent"
          suffix={` · ${kpis.verifiedReviews || 0} reseñas`}
          tooltip="Reseñas escritas por alguien que sí compró el producto. Cuanto más bajo, menos confiable es la calificación."
          onDrilldown={() =>
            drilldown.open("product_reviews", {
              title: "Reseñas de compra verificada",
              filters: { is_verified_purchase: true }
            })
          }
        />
        <KpiCard
          title="Reseñas Negativas"
          value={kpis.detractors}
          format="number"
          suffix=" de 1-2 ★"
          tooltip="Calificaciones de 1 o 2 estrellas en el período. Cada una es un cliente que ya decidió no volver."
          onDrilldown={() =>
            drilldown.open("product_reviews", {
              title: "Reseñas negativas (1-2 estrellas)",
              filters: { max_rating: 2 }
            })
          }
        />
        <KpiCard
          title="Preguntas Sin Responder"
          value={kpis.unansweredBacklog}
          format="number"
          tooltip="Backlog histórico de preguntas abiertas. Cada una es una venta detenida esperando una respuesta."
          onDrilldown={() =>
            drilldown.open("product_questions", {
              title: "Preguntas sin responder",
              subtitle: "Histórico completo, sin acotar al período",
              filters: { unanswered: true, allTime: true }
            })
          }
        />
        <KpiCard
          title="Mediana Hasta Responder"
          value={kpis.medianHoursToAnswer}
          format="number"
          suffix=" hrs"
          tooltip={`Tasa de respuesta histórica: ${kpis.answerRatePct ?? "—"}%. La media es ${kpis.avgHoursToAnswer ?? "—"} hrs, más sensible a casos extremos.`}
        />
      </div>

      {/* Distribución de estrellas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="fx-card">
          <h3 className="text-base font-bold text-fx-text mb-1">Distribución de Estrellas</h3>
          <p className="text-xs text-fx-muted mb-4">Dónde se concentra realmente la opinión, más allá del promedio</p>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={distribution} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff12" horizontal={false} />
              <XAxis type="number" stroke="#7b6c99" fontSize={11} allowDecimals={false} />
              <YAxis type="category" dataKey="label" stroke="#7b6c99" fontSize={12} width={45} />
              <Tooltip
                cursor={{ fill: "rgba(168,85,247,0.1)" }}
                contentStyle={{ backgroundColor: "#0d0418", border: "1px solid #ffffff29", borderRadius: "10px", color: "#f4f1f8", fontSize: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.55)" }}
                formatter={(value, _name, entry) => [`${value} reseñas (${entry.payload.pct}%)`, "Volumen"]}
              />
              <Bar dataKey="total" radius={[0, 6, 6, 0]}>
                {distribution.map((d) => (
                  <Cell key={d.rating} fill={STAR_COLORS[d.rating]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <DataTable
          title="Reputación por Tienda"
          searchPlaceholder="Buscar tienda..."
          columns={[
            {
              header: "Tienda",
              accessor: "store_name",
              render: (r) => (
                <button
                  onClick={() =>
                    drilldown.open("product_reviews", {
                      title: `Reseñas de ${r.store_name}`,
                      filters: { store_id: r.store_id, allTime: true }
                    })
                  }
                  className="font-bold text-fx-accent hover:underline text-left"
                >
                  {r.store_name || "Sin nombre"}
                </button>
              )
            },
            { header: "Reseñas", accessor: "reviews", render: (r) => Number(r.reviews).toLocaleString("en-US") },
            {
              header: "Promedio Real",
              accessor: "computed_rating_avg",
              render: (r) =>
                r.computed_rating_avg === null ? (
                  <span className="text-gray-500">sin reseñas</span>
                ) : (
                  <span className={`font-semibold ${ratingColor(r.computed_rating_avg)}`}>{r.computed_rating_avg}</span>
                )
            },
            {
              header: "Negativas",
              accessor: "negative",
              render: (r) =>
                Number(r.negative) > 0 ? (
                  <span className="text-rose-400 font-bold">{r.negative}</span>
                ) : (
                  <span className="text-gray-500">0</span>
                )
            }
          ]}
          data={data?.byStore || []}
        />
      </div>

      {/* Tendencia */}
      <ChartCard
        title="Volumen y Tono de las Reseñas por Día"
        subtitle="Un pico de reseñas negativas casi siempre sigue a un incidente operativo"
        onTypeChange={setChartMode}
      >
        <ResponsiveContainer width="100%" height={260}>
          {chartMode === "bar" ? (
            <BarChart data={data?.dailyTrend || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff12" />
              <XAxis dataKey="date" stroke="#7b6c99" fontSize={11} />
              <YAxis stroke="#7b6c99" fontSize={11} allowDecimals={false} />
              <Tooltip contentStyle={{ backgroundColor: "#0d0418", border: "1px solid #ffffff29", borderRadius: "10px", color: "#f4f1f8", fontSize: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.55)" }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="reviews" name="Reseñas" fill="#a855f7" radius={[4, 4, 0, 0]} />
              <Bar dataKey="negative" name="Negativas" fill="#f43f5e" radius={[4, 4, 0, 0]} />
            </BarChart>
          ) : chartMode === "line" ? (
            <LineChart data={data?.dailyTrend || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff12" />
              <XAxis dataKey="date" stroke="#7b6c99" fontSize={11} />
              <YAxis stroke="#7b6c99" fontSize={11} allowDecimals={false} />
              <Tooltip contentStyle={{ backgroundColor: "#0d0418", border: "1px solid #ffffff29", borderRadius: "10px", color: "#f4f1f8", fontSize: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.55)" }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="reviews" name="Reseñas" stroke="#a855f7" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="negative" name="Negativas" stroke="#f43f5e" strokeWidth={3} dot={false} />
            </LineChart>
          ) : (
            <AreaChart data={data?.dailyTrend || []}>
              <defs>
                <linearGradient id="colorRepTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorRepNeg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff12" />
              <XAxis dataKey="date" stroke="#7b6c99" fontSize={11} />
              <YAxis stroke="#7b6c99" fontSize={11} allowDecimals={false} />
              <Tooltip contentStyle={{ backgroundColor: "#0d0418", border: "1px solid #ffffff29", borderRadius: "10px", color: "#f4f1f8", fontSize: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.55)" }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Area type="monotone" dataKey="reviews" name="Reseñas" stroke="#a855f7" strokeWidth={2} fillOpacity={1} fill="url(#colorRepTotal)" />
              <Area type="monotone" dataKey="negative" name="Negativas" stroke="#f43f5e" strokeWidth={3} fillOpacity={1} fill="url(#colorRepNeg)" />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </ChartCard>

      {/* Ranking por producto */}
      <DataTable
        title="Reputación por Producto"
        subtitle="Acumulado histórico: la reputación de un producto no se reinicia cada mes"
        searchPlaceholder="Buscar producto..."
        columns={[
          {
            header: "Producto",
            accessor: "product_name",
            render: (r) => (
              <button
                onClick={() =>
                  drilldown.open("product_reviews", {
                    title: `Reseñas de "${r.product_name}"`,
                    filters: { product_id: r.product_id, allTime: true }
                  })
                }
                className="font-bold text-fx-accent hover:underline text-left"
              >
                {r.product_name}
              </button>
            )
          },
          { header: "Tienda", accessor: "store_name", render: (r) => r.store_name || "—" },
          { header: "Reseñas", accessor: "reviews", render: (r) => Number(r.reviews).toLocaleString("en-US") },
          {
            header: "Promedio",
            accessor: "avg_rating",
            render: (r) => (
              <span className="flex items-center gap-2">
                <Stars value={r.avg_rating} />
                <span className={`font-semibold ${ratingColor(r.avg_rating)}`}>{r.avg_rating}</span>
              </span>
            )
          },
          {
            header: "Negativas",
            accessor: "negative",
            render: (r) =>
              Number(r.negative) > 0 ? <span className="text-rose-400 font-bold">{r.negative}</span> : <span className="text-gray-500">0</span>
          },
          { header: "Verificadas", accessor: "verified", render: (r) => Number(r.verified).toLocaleString("en-US") }
        ]}
        data={data?.byProduct || []}
      />

      {/* Reseñas que exigen acción */}
      {(data?.detractorReviews?.length || 0) > 0 && (
        <div className="fx-card-danger">
          <h3 className="text-base font-bold text-fx-text mb-1">Reseñas que Exigen Respuesta</h3>
          <p className="text-xs text-fx-muted mb-4">
            Calificaciones de 3 estrellas o menos, ordenadas de la peor a la menos mala
          </p>
          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {data.detractorReviews.map((r) => (
              <div key={r.id} className="fx-card-sm">
                <div className="flex items-start justify-between gap-3 mb-2 flex-wrap">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-fx-text truncate">{r.product_name}</p>
                    <p className="text-[11px] text-fx-muted">
                      {r.store_name || "Sin tienda"} · {r.user_name || "Anónimo"} ·{" "}
                      {new Date(r.created_at).toLocaleDateString("es-VE")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Stars value={r.rating} />
                    {r.is_verified_purchase && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                        Verificada
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-xs text-fx-muted italic leading-relaxed">
                  {r.comment ? `“${r.comment}”` : "Calificó sin dejar comentario."}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Preguntas abiertas y responsividad */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DataTable
          title="Preguntas Esperando Respuesta"
          subtitle="Ordenadas por antigüedad: la más vieja primero"
          columns={[
            { header: "Producto", accessor: "product_name", render: (r) => r.product_name || "—" },
            { header: "Tienda", accessor: "store_name", render: (r) => r.store_name || "—" },
            {
              header: "Pregunta",
              accessor: "question",
              render: (r) => <span className="text-fx-muted line-clamp-2">{r.question}</span>
            },
            {
              header: "Días Esperando",
              accessor: "days_waiting",
              render: (r) => (
                <span className={parseFloat(r.days_waiting) > 3 ? "text-rose-400 font-semibold" : "text-amber-400 font-bold"}>
                  {r.days_waiting} d
                </span>
              )
            }
          ]}
          data={data?.unansweredQuestions || []}
          emptyMessage="Ninguna pregunta pendiente. Todas fueron respondidas."
        />

        <DataTable
          title="Responsividad por Tienda"
          columns={[
            { header: "Tienda", accessor: "store_name", render: (r) => r.store_name || "—" },
            { header: "Preguntas", accessor: "questions", render: (r) => Number(r.questions).toLocaleString("en-US") },
            {
              header: "Tasa Respuesta",
              accessor: "answer_rate_pct",
              render: (r) => (
                <span className={`font-semibold ${parseFloat(r.answer_rate_pct) >= 80 ? "text-emerald-400" : "text-rose-400"}`}>
                  {r.answer_rate_pct ?? "—"}%
                </span>
              )
            },
            {
              header: "Horas Prom.",
              accessor: "avg_hours_to_answer",
              render: (r) => (r.avg_hours_to_answer === null ? <span className="text-gray-500">nunca</span> : `${r.avg_hours_to_answer} h`)
            }
          ]}
          data={data?.questionsByStore || []}
          emptyMessage="Todavía no hay preguntas de clientes en ninguna tienda."
        />
      </div>

      {/* Productos vendidos sin reseñas */}
      <DataTable
        title="Se Venden pero Nadie los Reseña"
        subtitle="Ya tienen compradores reales: son los candidatos más fáciles para pedir la primera reseña"
        searchPlaceholder="Buscar producto..."
        columns={[
          { header: "Producto", accessor: "product_name", render: (r) => <span className="font-bold text-fx-text">{r.product_name}</span> },
          { header: "Tienda", accessor: "store_name", render: (r) => r.store_name || "—" },
          { header: "Órdenes", accessor: "orders", render: (r) => Number(r.orders).toLocaleString("en-US") },
          { header: "Unidades Vendidas", accessor: "units_sold", render: (r) => Number(r.units_sold).toLocaleString("en-US") }
        ]}
        data={data?.silentProducts || []}
        emptyMessage="Todo lo que se ha vendido tiene al menos una reseña."
      />

      {/* Integridad de datos */}
      {(data?.ratingDesync?.length || 0) > 0 && (
        <DataTable
          title="Calificaciones Desincronizadas"
          subtitle="products.rating_avg / review_count no coinciden con las reseñas reales: la vitrina está mostrando un número incorrecto"
          columns={[
            { header: "Producto", accessor: "product_name", render: (r) => <span className="font-bold text-fx-text">{r.product_name}</span> },
            { header: "Guardado", accessor: "stored_avg", render: (r) => `${r.stored_avg ?? "—"} (${r.stored_count} reseñas)` },
            {
              header: "Real",
              accessor: "real_avg",
              render: (r) => (
                <span className="text-fx-accent font-bold">
                  {r.real_avg ?? "—"} ({r.real_count} reseñas)
                </span>
              )
            }
          ]}
          data={data.ratingDesync}
        />
      )}

      <DrilldownModal {...drilldown.props} period={period} />
    </div>
  );
}
