import { useState } from "react";
import { getFunnelAnalyticsAPI } from "../../../services/api";
import useAnalyticsTabData from "../../../hooks/useAnalyticsTabData";
import KpiCard from "./KpiCard";
import ChartCard from "./ChartCard";
import DataTable from "./DataTable";
import SkeletonLoader from "./SkeletonLoader";
import FreshnessBadge from "./FreshnessBadge";
import DateRangePicker from "./DateRangePicker";
import EmptyState from "./EmptyState";
import AnalyticsErrorPanel from "./AnalyticsErrorPanel";
import ConversionFunnelChart from "./ConversionFunnelChart";
import useDrilldown from "../../../hooks/useDrilldown";
import DrilldownModal from "./DrilldownModal";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, Legend, CartesianGrid, ResponsiveContainer,
} from "recharts";

const TOOLTIP_STYLE = { backgroundColor: "#f7f4fc", border: "1px solid #00000020", borderRadius: "10px", color: "#33243d", fontSize: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.55)" };

export default function FunnelTab() {
  const [period, setPeriod] = useState("30d");
  const [chartMode, setChartMode] = useState("area");
  const { data, loading, error, reload } = useAnalyticsTabData(getFunnelAnalyticsAPI, period);
  const drilldown = useDrilldown();

  if (loading && !data) return <SkeletonLoader type="kpiRow" />;
  if (error) return <AnalyticsErrorPanel title="Error al Cargar el Embudo de Conversión" message={error} onRetry={() => reload(true)} />;

  const kpis = data?.kpis || {};
  const funnel = data?.funnel || [];
  const zeroResults = data?.zeroResultSearches || [];
  const hasTraffic = kpis.visitSessions > 0;

  return (
    <div className="space-y-6">
      <div className="relative z-30 flex flex-col md:flex-row md:items-center justify-between gap-4 fx-card-sm">
        <p className="text-[11px] text-fx-muted max-w-lg">
          Recorrido real desde que alguien entra hasta que compra. Cada paso se cuenta por sesión, no por evento.
        </p>
        <div className="flex items-center gap-3 flex-wrap">
          <DateRangePicker selectedPeriod={period} onPeriodChange={setPeriod} />
          <FreshnessBadge lastUpdated={data?.serverTimestamp} onRefresh={() => reload(true)} isLoading={loading} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
        <KpiCard
          title="Tasa de Conversión Real"
          value={kpis.conversionRatePct || 0}
          format="percent"
          tooltip="Porcentaje de sesiones que terminaron en una compra. Se calcula sobre el tráfico medido, no sobre una estimación."
          onDrilldown={() =>
            drilldown.open("analytics_events", {
              title: "Compras registradas por el tracking",
              filters: { event_name: "purchase" }
            })
          }
        />
        <KpiCard
          title="Sesiones con Visita"
          value={kpis.visitSessions || 0}
          format="number"
          suffix=" sesiones"
          tooltip="Punto de entrada del embudo: sesiones que cargaron al menos una página."
          onDrilldown={() =>
            drilldown.open("analytics_sessions", { title: "Sesiones del período" })
          }
        />
        <KpiCard
          title="Sesiones con Compra"
          value={kpis.purchaseSessions || 0}
          format="number"
          suffix=" compras"
          tooltip="Sesiones que completaron al menos un pedido."
          drilldownUrl="/admin/orders"
        />
        <KpiCard
          title="Abandono en Checkout"
          value={kpis.checkoutAbandonmentPct || 0}
          format="percent"
          tooltip="De quienes llegaron a la pantalla de pago, cuántos se fueron sin comprar. Es la fuga más cara del embudo."
          onDrilldown={() =>
            drilldown.open("analytics_events", {
              title: "Quiénes llegaron a la pantalla de pago",
              subtitle: "Compárese con los eventos de compra: la diferencia es el abandono",
              filters: { event_name: "checkout_start" }
            })
          }
        />
      </div>

      {!hasTraffic ? (
        <EmptyState message="Aún no hay recorridos completos registrados. El embudo se construye con los eventos de navegación, así que necesita tráfico real para mostrar datos." />
      ) : (
        <>
          <ConversionFunnelChart steps={funnel} />

          <ChartCard
            title="Tasa de Conversión Diaria"
            subtitle="Sesiones que compran sobre el total de sesiones de cada día"
            onTypeChange={setChartMode}
          >
            <ResponsiveContainer width="100%" height={280}>
              {chartMode === "bar" ? (
                <BarChart data={data?.dailyConversion || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#00000010" />
                  <XAxis dataKey="date" stroke="#877f92" fontSize={11} />
                  <YAxis stroke="#877f92" fontSize={11} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="sessions" name="Sesiones" fill="#7c4f9e" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="converted_sessions" name="Con compra" fill="#6b1e96" radius={[4, 4, 0, 0]} />
                </BarChart>
              ) : chartMode === "line" ? (
                <LineChart data={data?.dailyConversion || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#00000010" />
                  <XAxis dataKey="date" stroke="#877f92" fontSize={11} />
                  <YAxis stroke="#877f92" fontSize={11} unit="%" />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Line type="monotone" dataKey="conversion_rate_pct" name="Conversión %" stroke="#6b1e96" strokeWidth={3} dot={false} />
                </LineChart>
              ) : (
                <AreaChart data={data?.dailyConversion || []}>
                  <defs>
                    <linearGradient id="funnelConversion" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6b1e96" stopOpacity={0.5} />
                      <stop offset="95%" stopColor="#6b1e96" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#00000010" />
                  <XAxis dataKey="date" stroke="#877f92" fontSize={11} />
                  <YAxis stroke="#877f92" fontSize={11} unit="%" />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Area type="monotone" dataKey="conversion_rate_pct" name="Conversión %" stroke="#6b1e96" strokeWidth={3} fillOpacity={1} fill="url(#funnelConversion)" />
                </AreaChart>
              )}
            </ResponsiveContainer>
          </ChartCard>

          <DataTable
            title="Embudo por Tipo de Dispositivo"
            columns={[
              {
                header: "Dispositivo",
                accessor: "device_type",
                render: (r) => (
                  <button
                    onClick={() =>
                      drilldown.open("analytics_events", {
                        title: `Eventos desde ${r.device_type}`,
                        filters: { device_type: r.device_type }
                      })
                    }
                    className="font-bold text-fx-accent hover:underline capitalize text-left"
                  >
                    {r.device_type}
                  </button>
                ),
              },
              { header: "Visitas", accessor: "visits" },
              { header: "Vieron producto", accessor: "product_views" },
              { header: "Al carrito", accessor: "add_to_carts" },
              { header: "Checkout", accessor: "checkouts" },
              {
                header: "Compras",
                accessor: "purchases",
                render: (r) => <span className="font-semibold text-fx-accent">{r.purchases}</span>,
              },
              {
                header: "Conversión",
                accessor: "conversion",
                render: (r) => {
                  const pct = r.visits > 0 ? ((r.purchases / r.visits) * 100).toFixed(2) : "0.00";
                  return <span className="font-bold text-fx-text">{pct}%</span>;
                },
              },
            ]}
            data={data?.funnelByDevice || []}
            searchPlaceholder="Buscar dispositivo..."
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <DataTable
              title="Búsquedas Más Frecuentes"
              columns={[
                {
                  header: "Término",
                  accessor: "query",
                  render: (r) => (
                    <button
                      onClick={() =>
                        drilldown.open("analytics_events", {
                          title: `Búsquedas de "${r.query}"`,
                          filters: { search_query: r.query }
                        })
                      }
                      className="font-bold text-fx-accent hover:underline text-left"
                    >
                      {r.query}
                    </button>
                  ),
                },
                { header: "Búsquedas", accessor: "searches", render: (r) => <span className="font-semibold text-fx-accent">{parseInt(r.searches || 0).toLocaleString()}</span> },
                { header: "Personas", accessor: "unique_searchers" },
                { header: "Resultados prom.", accessor: "avg_results", render: (r) => parseFloat(r.avg_results || 0).toFixed(1) },
              ]}
              data={data?.topSearches || []}
              searchPlaceholder="Buscar término..."
            />

            <div className="fx-card-danger mb-6">
              <h3 className="text-base font-bold text-fx-text mb-1">Demanda No Cubierta</h3>
              <p className="text-xs text-fx-muted mb-4">
                Lo que la gente busca y el catálogo no tiene. Cada término es una oportunidad de producto.
              </p>
              {zeroResults.length === 0 ? (
                <p className="text-xs text-gray-500 py-8 text-center">
                  Ninguna búsqueda se quedó sin resultados en este período.
                </p>
              ) : (
                <div className="space-y-2 max-h-[320px] overflow-y-auto">
                  {zeroResults.map((row) => (
                    <div
                      key={row.query}
                      className="flex items-center justify-between gap-3 bg-fx-neg/5 border border-fx-neg/20 rounded-xl px-3 py-2"
                    >
                      <span className="text-xs font-bold text-fx-text truncate">{row.query}</span>
                      <span className="text-[11px] font-semibold text-fx-neg shrink-0">
                        {row.searches} {row.searches === 1 ? "búsqueda" : "búsquedas"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DataTable
            title="Productos: de la Vista al Carrito"
            columns={[
              {
                header: "Producto",
                accessor: "name",
                render: (r) => (
                  <button
                    onClick={() =>
                      drilldown.open("analytics_events", {
                        title: `Eventos de "${r.name}"`,
                        subtitle: "Vistas de producto y agregados al carrito",
                        filters: { product_id: r.id }
                      })
                    }
                    className="font-bold text-fx-accent hover:underline text-left"
                  >
                    {r.name}
                  </button>
                ),
              },
              { header: "Vistas", accessor: "views", render: (r) => parseInt(r.views || 0).toLocaleString() },
              { header: "Al carrito", accessor: "add_to_carts", render: (r) => parseInt(r.add_to_carts || 0).toLocaleString() },
              {
                header: "Conversión",
                accessor: "view_to_cart_pct",
                render: (r) => <span className="font-semibold text-fx-accent">{parseFloat(r.view_to_cart_pct || 0).toFixed(2)}%</span>,
              },
            ]}
            data={data?.topViewedProducts || []}
            searchPlaceholder="Buscar producto..."
          />

          <DataTable
            title="Muy Vistos, Nunca Agregados"
            columns={[
              {
                header: "Producto",
                accessor: "name",
                render: (r) => (
                  <button
                    onClick={() =>
                      drilldown.open("analytics_events", {
                        title: `Vistas de "${r.name}"`,
                        filters: { event_name: "product_view", product_id: r.id }
                      })
                    }
                    className="font-bold text-fx-accent hover:underline text-left"
                  >
                    {r.name}
                  </button>
                ),
              },
              { header: "Vistas sin conversión", accessor: "views", render: (r) => <span className="font-semibold text-fx-warn">{parseInt(r.views || 0).toLocaleString()}</span> },
            ]}
            data={data?.viewedNeverAddedProducts || []}
            searchPlaceholder="Buscar producto..."
          />
        </>
      )}

      <DrilldownModal {...drilldown.props} period={period} />
    </div>
  );
}
