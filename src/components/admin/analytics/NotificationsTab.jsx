import { useState } from "react";
import { getNotificationsAnalyticsAPI } from "../../../services/api";
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
  XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";

const LATENCY_LABELS = {
  menos_1h: "Menos de 1 hora",
  de_1_a_6h: "Entre 1 y 6 horas",
  de_6_a_24h: "Entre 6 y 24 horas",
  de_1_a_7d: "Entre 1 y 7 días",
  mas_7d: "Más de 7 días",
  nunca: "Nunca la leyeron"
};

const LATENCY_COLORS = {
  menos_1h: "#6b1e96",
  de_1_a_6h: "#6b1e96",
  de_6_a_24h: "#9a6a10",
  de_1_a_7d: "#9a6a10",
  mas_7d: "#b8482f",
  nunca: "#6b7280"
};

const readRateColor = (pct) => {
  const v = parseFloat(pct || 0);
  if (v >= 70) return "text-fx-pos";
  if (v >= 40) return "text-fx-warn";
  return "text-fx-neg";
};

export default function NotificationsTab() {
  const [period, setPeriod] = useState("30d");
  const [chartMode, setChartMode] = useState("area");
  const { data, loading, error, reload } = useAnalyticsTabData(getNotificationsAnalyticsAPI, period);
  const drilldown = useDrilldown();

  if (loading && !data) return <SkeletonLoader type="kpiRow" />;
  if (error) {
    return <AnalyticsErrorPanel title="Error al cargar Notificaciones" message={error} onRetry={() => reload(true)} />;
  }

  const kpis = data?.kpis || {};
  const latency = (data?.readLatencyBuckets || []).map((b) => ({
    ...b,
    label: LATENCY_LABELS[b.bucket] || b.bucket,
    total: Number(b.total)
  }));

  return (
    <div className="space-y-6">
      {/* Controles */}
      <div className="relative z-30 flex flex-col md:flex-row md:items-center justify-between gap-4 fx-card-sm">
        <div>
          <h2 className="text-sm font-bold text-fx-text">Notificaciones y Comunicación</h2>
          <p className="text-[11px] text-fx-muted">
            Lo que importa no es cuánto se envía, sino cuánto se lee
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
          title="Notificaciones Enviadas"
          value={kpis.totalSent}
          format="number"
          tooltip="Total de notificaciones generadas en el período, en todos los canales."
          onDrilldown={() => drilldown.open("notifications", { title: "Todas las notificaciones del período" })}
        />
        <KpiCard
          title="Tasa de Lectura"
          value={kpis.readRatePct}
          format="percent"
          tooltip="Porcentaje de las notificaciones del período que el destinatario abrió."
          onDrilldown={() =>
            drilldown.open("notifications", { title: "Notificaciones leídas", filters: { is_read: true } })
          }
        />
        <KpiCard
          title="Sin Leer Acumuladas"
          value={kpis.unreadBacklog}
          format="number"
          suffix={` · ${kpis.usersWithUnread || 0} usuarios`}
          tooltip="Deuda de atención histórica: notificaciones nunca abiertas, de todos los tiempos, no solo del período."
          onDrilldown={() =>
            drilldown.open("notifications", {
              title: "Notificaciones sin leer",
              subtitle: "Histórico completo, sin acotar al período",
              filters: { is_read: false, allTime: true }
            })
          }
        />
        <KpiCard
          title="Mediana Hasta Leer"
          value={kpis.medianHoursToRead}
          format="number"
          suffix=" hrs"
          tooltip={`La mediana resiste los valores extremos. La media es ${kpis.avgHoursToRead ?? "—"} hrs, inflada por notificaciones abiertas semanas después.`}
          onDrilldown={() =>
            drilldown.open("notifications", {
              title: "Notificaciones leídas y su tiempo hasta abrir",
              filters: { is_read: true }
            })
          }
        />
        <KpiCard
          title="Destinatarios Alcanzados"
          value={kpis.recipients}
          format="number"
          suffix=" usuarios"
          tooltip="Usuarios distintos que recibieron al menos una notificación en el período."
          onDrilldown={() => drilldown.open("users", { title: "Usuarios de la plataforma" })}
        />
        <KpiCard
          title="Tipos Ignorados"
          value={kpis.silentTypesCount}
          format="number"
          suffix=" tipos"
          tooltip="Tipos con al menos 10 envíos y menos del 20% de lectura. Son ruido que desgasta la atención del usuario."
          onDrilldown={() =>
            drilldown.open("notifications", {
              title: "Notificaciones sin leer",
              subtitle: "El KPI cuenta tipos ignorados; aquí está el detalle de lo no leído",
              filters: { is_read: false }
            })
          }
        />
        <KpiCard
          title="Suscriptores Newsletter"
          value={kpis.newsletterSubscribers}
          format="number"
          suffix={` · +${kpis.newsletterNewInPeriod || 0} nuevos`}
          tooltip="Lista de correo. 'Nuevos' cuenta las altas dentro del período seleccionado."
          onDrilldown={() => drilldown.open("newsletter_subscribers", { title: "Suscriptores del newsletter" })}
        />
        <KpiCard
          title="Plantillas Sin Uso"
          value={data?.unusedTemplates?.length || 0}
          format="number"
          suffix=" plantillas"
          tooltip="Plantillas configuradas que jamás han generado una notificación. Configuración muerta."
          onDrilldown={() => drilldown.open("notification_templates", { title: "Plantillas de notificación" })}
        />
      </div>

      {/* Tendencia diaria */}
      <ChartCard
        title="Enviadas vs Leídas por Día"
        subtitle="La brecha entre ambas líneas es la atención que se está perdiendo"
        onTypeChange={setChartMode}
      >
        <ResponsiveContainer width="100%" height={260}>
          {chartMode === "bar" ? (
            <BarChart data={data?.dailyTrend || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#00000010" />
              <XAxis dataKey="date" stroke="#877f92" fontSize={11} />
              <YAxis stroke="#877f92" fontSize={11} />
              <Tooltip contentStyle={{ backgroundColor: "#f7f4fc", border: "1px solid #00000020", borderRadius: "10px", color: "#33243d", fontSize: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.55)" }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="sent" name="Enviadas" fill="#7c4f9e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="read" name="Leídas" fill="#6b1e96" radius={[4, 4, 0, 0]} />
            </BarChart>
          ) : chartMode === "line" ? (
            <LineChart data={data?.dailyTrend || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#00000010" />
              <XAxis dataKey="date" stroke="#877f92" fontSize={11} />
              <YAxis stroke="#877f92" fontSize={11} />
              <Tooltip contentStyle={{ backgroundColor: "#f7f4fc", border: "1px solid #00000020", borderRadius: "10px", color: "#33243d", fontSize: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.55)" }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="sent" name="Enviadas" stroke="#7c4f9e" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="read" name="Leídas" stroke="#6b1e96" strokeWidth={3} dot={false} />
            </LineChart>
          ) : (
            <AreaChart data={data?.dailyTrend || []}>
              <defs>
                <linearGradient id="colorNotifSent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7c4f9e" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#7c4f9e" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorNotifRead" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6b1e96" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="#6b1e96" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#00000010" />
              <XAxis dataKey="date" stroke="#877f92" fontSize={11} />
              <YAxis stroke="#877f92" fontSize={11} />
              <Tooltip contentStyle={{ backgroundColor: "#f7f4fc", border: "1px solid #00000020", borderRadius: "10px", color: "#33243d", fontSize: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.55)" }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Area type="monotone" dataKey="sent" name="Enviadas" stroke="#7c4f9e" strokeWidth={2} fillOpacity={1} fill="url(#colorNotifSent)" />
              <Area type="monotone" dataKey="read" name="Leídas" stroke="#6b1e96" strokeWidth={3} fillOpacity={1} fill="url(#colorNotifRead)" />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </ChartCard>

      {/* Latencia y canal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="fx-card">
          <h3 className="text-base font-bold text-fx-text mb-1">¿Cuánto Tardan en Leerla?</h3>
          <p className="text-xs text-fx-muted mb-4">Distribución del tiempo entre envío y apertura</p>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={latency} dataKey="total" nameKey="label" cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3}>
                {latency.map((entry) => (
                  <Cell key={entry.bucket} fill={LATENCY_COLORS[entry.bucket] || "#7c4f9e"} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: "#f7f4fc", border: "1px solid #00000020", borderRadius: "10px", color: "#33243d", fontSize: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.55)" }}
                formatter={(value, name) => [`${value} notificaciones`, name]}
              />
              <Legend wrapperStyle={{ fontSize: 10 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <DataTable
          title="Rendimiento por Canal de Entrega"
          columns={[
            { header: "Canal", accessor: "channel", render: (r) => <span className="font-bold text-fx-text uppercase">{r.channel}</span> },
            { header: "Enviadas", accessor: "sent", render: (r) => Number(r.sent).toLocaleString("en-US") },
            { header: "Leídas", accessor: "read", render: (r) => Number(r.read).toLocaleString("en-US") },
            {
              header: "Tasa Lectura",
              accessor: "read_rate_pct",
              render: (r) => <span className={`font-semibold ${readRateColor(r.read_rate_pct)}`}>{r.read_rate_pct}%</span>
            }
          ]}
          data={data?.byChannel || []}
        />
      </div>

      {/* Por tipo */}
      <DataTable
        title="Rendimiento por Tipo de Notificación"
        searchPlaceholder="Buscar tipo..."
        columns={[
          {
            header: "Tipo",
            accessor: "type",
            render: (r) => (
              <button
                onClick={() => drilldown.open("notifications", { title: `Notificaciones de tipo "${r.type}"`, filters: { type: r.type } })}
                className="font-mono text-[11px] font-bold text-fx-accent hover:underline text-left"
              >
                {r.type}
              </button>
            )
          },
          { header: "Enviadas", accessor: "sent", render: (r) => Number(r.sent).toLocaleString("en-US") },
          { header: "Leídas", accessor: "read", render: (r) => Number(r.read).toLocaleString("en-US") },
          {
            header: "Tasa Lectura",
            accessor: "read_rate_pct",
            render: (r) => <span className={`font-semibold ${readRateColor(r.read_rate_pct)}`}>{r.read_rate_pct ?? "—"}%</span>
          },
          {
            header: "Horas Prom.",
            accessor: "avg_hours_to_read",
            render: (r) => (r.avg_hours_to_read === null ? <span className="text-gray-500">nunca leída</span> : `${r.avg_hours_to_read} h`)
          },
          { header: "Destinatarios", accessor: "recipients", render: (r) => Number(r.recipients).toLocaleString("en-US") }
        ]}
        data={data?.byType || []}
      />

      {/* Tipos ignorados */}
      {(data?.silentTypes?.length || 0) > 0 && (
        <div className="fx-card-danger">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-fx-neg text-lg">🔕</span>
            <h3 className="text-base font-bold text-fx-text">Tipos que Nadie Lee</h3>
          </div>
          <p className="text-xs text-fx-muted mb-4">
            Volumen real (10+ envíos) con menos del 20% de apertura. Cada uno de estos desgasta la
            atención del usuario para las notificaciones que sí importan.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.silentTypes.map((t) => (
              <button
                key={t.type}
                onClick={() => drilldown.open("notifications", { title: `Notificaciones "${t.type}"`, filters: { type: t.type } })}
                className="bg-fx-neg/5 border border-fx-neg/20 rounded-2xl p-3 text-left hover:border-fx-neg/50 transition-all"
              >
                <p className="font-mono text-[11px] font-bold text-fx-neg truncate">{t.type}</p>
                <p className="text-[10px] text-fx-muted mt-1">
                  {t.sent} enviadas · solo <span className="font-bold text-fx-neg">{t.read_rate_pct}%</span> leídas
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Usuarios saturados y plantillas muertas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DataTable
          title="Usuarios con Más Notificaciones Sin Leer"
          columns={[
            { header: "Usuario", accessor: "user_name", render: (r) => <span className="font-bold text-fx-text">{r.user_name || "—"}</span> },
            { header: "Email", accessor: "email", render: (r) => <span className="font-mono text-[10px] text-fx-faint">{r.email}</span> },
            {
              header: "Sin Leer",
              accessor: "unread_count",
              render: (r) => (
                <button
                  onClick={() => drilldown.open("notifications", { title: `Sin leer de ${r.user_name || r.email}`, filters: { user_id: r.user_id, is_read: false } })}
                  className="font-semibold text-fx-neg hover:underline"
                >
                  {Number(r.unread_count).toLocaleString("en-US")}
                </button>
              )
            }
          ]}
          data={data?.topUnreadUsers || []}
        />

        <DataTable
          title="Plantillas Configuradas Que Nunca se Usaron"
          columns={[
            { header: "Tipo", accessor: "type", render: (r) => <span className="font-mono text-[11px] font-bold text-fx-warn">{r.type}</span> },
            { header: "Plantilla", accessor: "title_template", render: (r) => <span className="text-fx-muted text-[11px]">{r.title_template}</span> },
            {
              header: "Estado",
              accessor: "is_active",
              render: (r) =>
                r.is_active ? (
                  <span className="text-fx-warn font-bold text-[10px] uppercase">Activa pero inerte</span>
                ) : (
                  <span className="text-gray-500 font-bold text-[10px] uppercase">Inactiva</span>
                )
            }
          ]}
          data={data?.unusedTemplates || []}
        />
      </div>

      {/* Preferencias */}
      <div className="fx-card">
        <h3 className="text-base font-bold text-fx-text mb-1">Preferencias de Notificación</h3>
        <p className="text-[11px] text-fx-muted mb-1">
          Cuántos apagaron cada categoría en /account/notifications. Solo las 5 de la app: las
          columnas <span className="font-mono">email_*</span> existen en la tabla pero ninguna ruta
          de envío las consulta.
        </p>
        {(data?.preferences?.users_configured || 0) === 0 ? (
          <p className="text-xs text-fx-muted">
            Ningún usuario ha personalizado sus preferencias todavía. Todos reciben la configuración
            por defecto, así que aún no hay señal de rechazo por categoría que medir.
          </p>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mt-3">
            {[
              ["Pedidos", data.preferences.optout_inapp_orders],
              ["Pagos", data.preferences.optout_inapp_payments],
              ["Envíos", data.preferences.optout_inapp_shipping],
              ["Reseñas", data.preferences.optout_inapp_reviews],
              ["Promociones", data.preferences.optout_inapp_promotions]
            ].map(([label, count]) => (
              <div key={label} className="bg-fx-inset border border-fx-line rounded-2xl p-3">
                <p className="text-[10px] uppercase text-fx-faint font-bold">{label}</p>
                <p className="text-xl font-semibold text-fx-text mt-1">{count}</p>
                <p className="text-[10px] text-fx-muted">
                  de {data.preferences.users_configured} lo desactivaron
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <DrilldownModal {...drilldown.props} period={period} />
    </div>
  );
}

NotificationsTab.propTypes = {};
