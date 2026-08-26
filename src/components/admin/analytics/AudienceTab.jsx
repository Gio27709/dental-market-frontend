import { useState, useMemo } from "react";
import { getAudienceAnalyticsAPI } from "../../../services/api";
import useAnalyticsTabData from "../../../hooks/useAnalyticsTabData";
import KpiCard from "./KpiCard";
import ChartCard from "./ChartCard";
import DataTable from "./DataTable";
import SkeletonLoader from "./SkeletonLoader";
import FreshnessBadge from "./FreshnessBadge";
import DateRangePicker from "./DateRangePicker";
import EmptyState from "./EmptyState";
import AnalyticsErrorPanel from "./AnalyticsErrorPanel";
import TrafficHeatmap from "./TrafficHeatmap";
import useDrilldown from "../../../hooks/useDrilldown";
import DrilldownModal from "./DrilldownModal";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, Legend, CartesianGrid, ResponsiveContainer,
} from "recharts";

const DEVICE_COLORS = { desktop: "#6b1e96", mobile: "#7c4f9e", tablet: "#3f7794", bot: "#b8482f", unknown: "#64748b" };
const TOOLTIP_STYLE = { backgroundColor: "#f7f4fc", border: "1px solid #00000020", borderRadius: "10px", color: "#33243d", fontSize: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.55)" };

export default function AudienceTab() {
  const [period, setPeriod] = useState("30d");
  const [chartMode, setChartMode] = useState("area");
  const { data, loading, error, reload } = useAnalyticsTabData(getAudienceAnalyticsAPI, period);
  const drilldown = useDrilldown();

  const kpis = data?.kpis || {};
  const dailyTrend = data?.dailyTrend || [];
  const devices = data?.devices || [];
  const referrers = data?.referrers || [];
  const visitorTypeData = useMemo(() => {
    const split = data?.newVsReturning || {};
    return [
      { name: "Nuevos", value: parseInt(split.new_visitors || 0, 10) },
      { name: "Recurrentes", value: parseInt(split.returning_visitors || 0, 10) },
    ];
  }, [data]);

  if (loading && !data) return <SkeletonLoader type="kpiRow" />;
  if (error) return <AnalyticsErrorPanel title="Error al Cargar Audiencia & Tráfico" message={error} onRetry={() => reload(true)} />;

  const hasTraffic = kpis.totalSessions > 0;

  return (
    <div className="space-y-6">
      <div className="relative z-30 flex flex-col md:flex-row md:items-center justify-between gap-4 fx-card-sm">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-fx-pos animate-pulse" />
          <span className="text-xs font-bold text-fx-text">{kpis.onlineNow || 0}</span>
          <span className="text-[11px] text-fx-muted">usuarios activos ahora mismo</span>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <DateRangePicker selectedPeriod={period} onPeriodChange={setPeriod} />
          <FreshnessBadge lastUpdated={data?.serverTimestamp} onRefresh={() => reload(true)} isLoading={loading} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
        <KpiCard
          title="Visitantes Únicos"
          value={kpis.uniqueVisitors || 0}
          format="number"
          suffix=" personas"
          tooltip="Dispositivos distintos que visitaron la plataforma en el período, identificados de forma anónima."
          onDrilldown={() =>
            drilldown.open("analytics_sessions", {
              title: "Sesiones del período",
              subtitle: "Un mismo visitante puede abrir varias sesiones"
            })
          }
        />
        <KpiCard
          title="Sesiones Totales"
          value={kpis.totalSessions || 0}
          format="number"
          suffix=" sesiones"
          tooltip="Una sesión agrupa toda la actividad de una visita. Se cierra tras 30 minutos de inactividad."
          onDrilldown={() =>
            drilldown.open("analytics_sessions", { title: "Sesiones del período" })
          }
        />
        <KpiCard
          title="Páginas Vistas"
          value={kpis.totalPageViews || 0}
          format="number"
          tooltip="Total de pantallas cargadas. Dividido entre las sesiones da el promedio de profundidad de navegación."
          onDrilldown={() =>
            drilldown.open("analytics_events", {
              title: "Páginas vistas del período",
              filters: { event_name: "page_view" }
            })
          }
        />
        <KpiCard
          title="Visitantes Identificados"
          value={kpis.loggedInVisitors || 0}
          format="number"
          suffix=" con sesión"
          tooltip="Visitantes que navegaron con la sesión iniciada. El resto navegó de forma anónima."
          onDrilldown={() =>
            drilldown.open("analytics_sessions", {
              title: "Sesiones con usuario identificado",
              filters: { has_user: true }
            })
          }
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
        <KpiCard
          title="Usuarios Activos Diarios"
          value={kpis.dau || 0}
          format="number"
          suffix=" DAU"
          tooltip="Usuarios registrados con actividad en las últimas 24 horas."
        />
        <KpiCard
          title="Usuarios Activos Mensuales"
          value={kpis.mau || 0}
          format="number"
          suffix=" MAU"
          tooltip="Usuarios registrados con actividad en los últimos 30 días."
        />
        <KpiCard
          title="Adherencia (DAU/MAU)"
          value={kpis.stickinessPct || 0}
          format="percent"
          tooltip="Qué proporción de los usuarios del mes entra cada día. Por encima de 20% indica un hábito de uso sólido."
        />
        <KpiCard
          title="Tasa de Rebote"
          value={kpis.bounceRatePct || 0}
          format="percent"
          tooltip="Sesiones que vieron una sola página y se fueron. Cuanto más baja, mejor engancha la portada."
          onDrilldown={() =>
            drilldown.open("analytics_sessions", {
              title: "Sesiones que rebotaron",
              filters: { is_bounce: true }
            })
          }
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10">
        <KpiCard
          title="Duración Media de Sesión"
          value={kpis.avgSessionSeconds || 0}
          format="number"
          suffix=" segundos"
          tooltip="Tiempo promedio entre el primer y el último evento de cada sesión."
          onDrilldown={() =>
            drilldown.open("analytics_sessions", {
              title: "Sesiones y su duración",
              subtitle: "La duración de cada sesión aparece en su columna"
            })
          }
        />
        <KpiCard
          title="Páginas por Sesión"
          value={kpis.pagesPerSession || 0}
          format="number"
          suffix=" págs."
          tooltip="Profundidad media de navegación por visita."
          onDrilldown={() =>
            drilldown.open("analytics_sessions", {
              title: "Sesiones y sus páginas vistas",
              subtitle: "Las páginas vistas de cada sesión aparecen en su columna"
            })
          }
        />
      </div>

      {!hasTraffic ? (
        <EmptyState message="Todavía no hay tráfico registrado en este período. Los datos empiezan a acumularse desde el momento en que se activó el seguimiento de eventos." />
      ) : (
        <>
          <ChartCard
            title="Tendencia Diaria de Tráfico"
            subtitle="Sesiones, visitantes únicos y páginas vistas por día"
            onTypeChange={setChartMode}
          >
            <ResponsiveContainer width="100%" height={280}>
              {chartMode === "bar" ? (
                <BarChart data={dailyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#00000010" />
                  <XAxis dataKey="date" stroke="#877f92" fontSize={11} />
                  <YAxis stroke="#877f92" fontSize={11} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="sessions" name="Sesiones" fill="#6b1e96" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="visitors" name="Visitantes" fill="#7c4f9e" radius={[4, 4, 0, 0]} />
                </BarChart>
              ) : chartMode === "line" ? (
                <LineChart data={dailyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#00000010" />
                  <XAxis dataKey="date" stroke="#877f92" fontSize={11} />
                  <YAxis stroke="#877f92" fontSize={11} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="sessions" name="Sesiones" stroke="#6b1e96" strokeWidth={3} dot={false} />
                  <Line type="monotone" dataKey="visitors" name="Visitantes" stroke="#7c4f9e" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="page_views" name="Páginas vistas" stroke="#3f7794" strokeWidth={2} dot={false} />
                </LineChart>
              ) : (
                <AreaChart data={dailyTrend}>
                  <defs>
                    <linearGradient id="audienceSessions" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6b1e96" stopOpacity={0.5} />
                      <stop offset="95%" stopColor="#6b1e96" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="audienceVisitors" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7c4f9e" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#7c4f9e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#00000010" />
                  <XAxis dataKey="date" stroke="#877f92" fontSize={11} />
                  <YAxis stroke="#877f92" fontSize={11} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="sessions" name="Sesiones" stroke="#6b1e96" strokeWidth={3} fillOpacity={1} fill="url(#audienceSessions)" />
                  <Area type="monotone" dataKey="visitors" name="Visitantes" stroke="#7c4f9e" strokeWidth={2} fillOpacity={1} fill="url(#audienceVisitors)" />
                </AreaChart>
              )}
            </ResponsiveContainer>
          </ChartCard>

          <TrafficHeatmap cells={data?.hourlyHeatmap || []} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="fx-card">
              <h3 className="text-base font-bold text-fx-text mb-1">Dispositivos</h3>
              <p className="text-xs text-fx-muted mb-4">Desde qué tipo de equipo entra tu audiencia</p>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={devices} dataKey="sessions" nameKey="device_type" innerRadius={55} outerRadius={90} paddingAngle={3}>
                    {devices.map((d) => (
                      <Cell key={d.device_type} fill={DEVICE_COLORS[d.device_type] || DEVICE_COLORS.unknown} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="fx-card">
              <h3 className="text-base font-bold text-fx-text mb-1">Nuevos vs. Recurrentes</h3>
              <p className="text-xs text-fx-muted mb-4">Cuánto de tu tráfico ya te conocía</p>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={visitorTypeData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={3}>
                    <Cell fill="#6b1e96" />
                    <Cell fill="#7c4f9e" />
                  </Pie>
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <DataTable
              title="Páginas Más Visitadas"
              columns={[
                {
                  header: "Ruta",
                  accessor: "path",
                  render: (r) => (
                    <button
                      onClick={() =>
                        drilldown.open("analytics_events", {
                          title: `Vistas de "${r.path}"`,
                          filters: { event_name: "page_view", path: r.path }
                        })
                      }
                      className="font-mono text-fx-accent hover:underline text-left"
                    >
                      {r.path}
                    </button>
                  ),
                },
                { header: "Vistas", accessor: "views", render: (r) => <span className="font-semibold text-fx-accent">{parseInt(r.views || 0).toLocaleString()}</span> },
                { header: "Visitantes", accessor: "unique_visitors", render: (r) => parseInt(r.unique_visitors || 0).toLocaleString() },
              ]}
              data={data?.topPages || []}
              searchPlaceholder="Buscar ruta..."
            />
            <DataTable
              title="De Dónde Llega el Tráfico"
              columns={[
                {
                  header: "Origen",
                  accessor: "source",
                  render: (r) =>
                    r.source === "direct" ? (
                      <span className="font-bold text-fx-text">Directo / marcador</span>
                    ) : (
                      <button
                        onClick={() =>
                          drilldown.open("analytics_sessions", {
                            title: `Sesiones llegadas desde "${r.source}"`,
                            filters: { referrer_host: r.source }
                          })
                        }
                        className="font-bold text-fx-accent hover:underline text-left"
                      >
                        {r.source}
                      </button>
                    ),
                },
                { header: "Sesiones", accessor: "sessions", render: (r) => <span className="font-semibold text-fx-accent">{parseInt(r.sessions || 0).toLocaleString()}</span> },
              ]}
              data={referrers}
              searchPlaceholder="Buscar origen..."
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <DataTable
              title="Campañas de Marketing (UTM)"
              columns={[
                {
                  header: "Fuente",
                  accessor: "utm_source",
                  render: (r) => (
                    <button
                      onClick={() =>
                        drilldown.open("analytics_sessions", {
                          title: `Sesiones de la fuente UTM "${r.utm_source}"`,
                          filters: { utm_source: r.utm_source }
                        })
                      }
                      className="font-bold text-fx-accent hover:underline text-left"
                    >
                      {r.utm_source}
                    </button>
                  ),
                },
                { header: "Medio", accessor: "utm_medium", render: (r) => <span className="text-fx-faint">{r.utm_medium || "—"}</span> },
                { header: "Campaña", accessor: "utm_campaign", render: (r) => r.utm_campaign || "—" },
                { header: "Sesiones", accessor: "sessions", render: (r) => <span className="font-semibold text-fx-accent">{parseInt(r.sessions || 0).toLocaleString()}</span> },
              ]}
              data={data?.campaigns || []}
              searchPlaceholder="Buscar campaña..."
            />
            <DataTable
              title="Audiencia Identificada por Rol"
              columns={[
                { header: "Rol", accessor: "role", render: (r) => <span className="font-bold text-fx-text capitalize">{r.role}</span> },
                { header: "Visitantes", accessor: "visitors", render: (r) => <span className="font-semibold text-fx-accent">{parseInt(r.visitors || 0).toLocaleString()}</span> },
              ]}
              data={data?.visitorsByRole || []}
              searchPlaceholder="Buscar rol..."
            />
          </div>

          <DataTable
            title="Navegadores y Sistemas Operativos"
            columns={[
              {
                header: "Navegador",
                accessor: "browser",
                render: (r) => (
                  <button
                    onClick={() =>
                      drilldown.open("analytics_sessions", {
                        title: `Sesiones con ${r.browser}`,
                        filters: { browser: r.browser }
                      })
                    }
                    className="font-bold text-fx-accent hover:underline text-left"
                  >
                    {r.browser}
                  </button>
                ),
              },
              { header: "Sistema", accessor: "os", render: (r) => <span className="text-fx-faint">{r.os}</span> },
              { header: "Sesiones", accessor: "sessions", render: (r) => <span className="font-semibold text-fx-accent">{parseInt(r.sessions || 0).toLocaleString()}</span> },
            ]}
            data={data?.browsers || []}
            searchPlaceholder="Buscar navegador..."
          />
        </>
      )}

      <DrilldownModal {...drilldown.props} period={period} />
    </div>
  );
}
