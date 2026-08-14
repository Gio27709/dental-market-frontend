import { useState } from "react";
import { getOnboardingAnalyticsAPI } from "../../../services/api";
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
  XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend
} from "recharts";

const num = (v) => Number(v || 0).toLocaleString("en-US");

const STATUS_STYLES = {
  approved: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  rejected: "bg-rose-500/15 text-rose-300 border-rose-500/30",
  pending: "bg-amber-500/15 text-amber-300 border-amber-500/30"
};

const STATUS_LABELS = { approved: "Aprobada", rejected: "Rechazada", pending: "Pendiente" };

const statusBadge = (status) => (
  <span
    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase border whitespace-nowrap ${
      STATUS_STYLES[status] || "bg-gray-500/15 text-fx-muted border-gray-500/30"
    }`}
  >
    {STATUS_LABELS[status] || status || "—"}
  </span>
);

// Un tiempo de decisión no se juzga contra el resto de la tabla sino contra la paciencia
// de quien espera: pasado el día, el solicitante ya asumió que lo ignoraron.
const decisionTone = (hours) => {
  const h = parseFloat(hours);
  if (!Number.isFinite(h)) return "text-gray-500";
  if (h <= 24) return "text-emerald-400";
  if (h <= 72) return "text-amber-400";
  return "text-rose-400";
};

export default function OnboardingTab() {
  const [period, setPeriod] = useState("90d");
  const [chartMode, setChartMode] = useState("bar");
  const { data, loading, error, reload } = useAnalyticsTabData(getOnboardingAnalyticsAPI, period);
  const drilldown = useDrilldown();

  if (loading && !data) return <SkeletonLoader type="kpiRow" />;
  if (error) {
    return <AnalyticsErrorPanel title="Error al cargar Onboarding" message={error} onRetry={() => reload(true)} />;
  }

  const kpis = data?.kpis || {};
  const funnel = data?.activationFunnel || [];
  const funnelTop = Number(funnel[0]?.count) || 0;

  const hasIntegrityIssues =
    (kpis.storesWithoutApplication || 0) > 0 ||
    (kpis.storesWentDark || 0) > 0 ||
    (kpis.ridersWithCounterDrift || 0) > 0 ||
    (kpis.riderDecisionsUntracked || 0) > 0 ||
    (kpis.storeProfiles > 0 && (kpis.verifiedStores || 0) === 0);

  return (
    <div className="space-y-6">
      {/* Controles */}
      <div className="relative z-30 flex flex-col md:flex-row md:items-center justify-between gap-4 fx-card-sm">
        <div>
          <h2 className="text-sm font-bold text-fx-text">Onboarding de Tiendas y Repartidores</h2>
          <p className="text-[11px] text-fx-muted">
            No cuántas solicitudes se aprobaron, sino cuántas terminaron vendiendo
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <DateRangePicker selectedPeriod={period} onPeriodChange={setPeriod} />
          <FreshnessBadge lastUpdated={data?.serverTimestamp} onRefresh={() => reload(true)} isLoading={loading} />
        </div>
      </div>

      {/* Alertas de integridad del alta */}
      {hasIntegrityIssues && (
        <div className="bg-rose-500/10 border border-rose-500/40 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-rose-200 mb-2 uppercase tracking-wide">
            Integridad del Proceso de Alta
          </h3>
          <ul className="space-y-1.5 text-xs text-fx-muted">
            {(kpis.storesWithoutApplication || 0) > 0 && (
              <li>
                <span className="font-semibold text-rose-300">{num(kpis.storesWithoutApplication)} tiendas</span> operan
                sin haber pasado nunca por el formulario de solicitud. Existen, publican y venden, pero nadie las revisó.
              </li>
            )}
            {kpis.storeProfiles > 0 && (kpis.verifiedStores || 0) === 0 && (
              <li>
                <span className="font-semibold text-rose-300">Ninguna de las {num(kpis.storeProfiles)} tiendas</span> está
                marcada como verificada. El campo <span className="font-mono">is_verified</span> existe y jamás se ha usado.
              </li>
            )}
            {(kpis.storesWentDark || 0) > 0 && (
              <li>
                <span className="font-semibold text-rose-300">{num(kpis.storesWentDark)} tiendas</span> ya vendieron
                alguna vez pero hoy no tienen un solo producto comprable: siguen abiertas con la persiana bajada.
              </li>
            )}
            {(kpis.ridersWithCounterDrift || 0) > 0 && (
              <li>
                <span className="font-semibold text-rose-300">{num(kpis.ridersWithCounterDrift)} repartidores</span> tienen
                un contador de entregas que no coincide con sus eventos reales. El contador guardado no se actualiza.
              </li>
            )}
            {(kpis.riderDecisionsUntracked || 0) > 0 && (
              <li>
                <span className="font-semibold text-rose-300">
                  {num(kpis.riderDecisionsUntracked)} solicitudes de repartidor
                </span>{" "}
                se decidieron sin dejar marca de cuándo: aprobar no toca la fecha de actualización, así que el tiempo de
                respuesta a repartidores no se puede medir.
              </li>
            )}
          </ul>
        </div>
      )}

      {/* KPIs de solicitudes de tienda */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
        <KpiCard
          title="Solicitudes de Tienda"
          value={kpis.totalApplications}
          format="number"
          suffix={` · ${num(kpis.distinctApplicants)} solicitantes`}
          tooltip="Total histórico de formularios enviados. Los solicitantes son menos que las solicitudes porque algunos insistieron varias veces."
          onDrilldown={() =>
            drilldown.open("store_applications", { title: "Todas las solicitudes de tienda", filters: { allTime: true } })
          }
        />
        <KpiCard
          title="Tasa de Aprobación"
          value={kpis.approvalRatePct}
          format="percent"
          suffix={` · ${num(kpis.approvedApplications)} aprobadas`}
          tooltip="Sobre solicitudes decididas, no sobre el total. Las pendientes no cuentan porque todavía no son ni un sí ni un no."
          onDrilldown={() =>
            drilldown.open("store_applications", {
              title: "Solicitudes aprobadas",
              filters: { status: "approved", allTime: true }
            })
          }
        />
        <KpiCard
          title="Rechazadas"
          value={kpis.rejectedApplications}
          format="number"
          tooltip="La tabla no guarda el motivo del rechazo: se sabe que se dijo que no, nunca por qué. Sin eso no se puede saber si el filtro está bien calibrado."
          onDrilldown={() =>
            drilldown.open("store_applications", {
              title: "Solicitudes rechazadas",
              filters: { status: "rejected", allTime: true }
            })
          }
        />
        <KpiCard
          title="Pendientes"
          value={kpis.pendingApplications}
          format="number"
          suffix={kpis.oldestPendingDays > 0 ? ` · la más vieja ${kpis.oldestPendingDays} d` : ""}
          tooltip="Solicitudes esperando una decisión. Cada día que pasa es un vendedor que asume que no lo quieren."
          onDrilldown={() =>
            drilldown.open("store_applications", {
              title: "Solicitudes pendientes",
              filters: { status: "pending", allTime: true }
            })
          }
        />
        <KpiCard
          title="Tiempo Medio de Decisión"
          value={kpis.avgHoursToDecide}
          format="number"
          suffix=" h"
          tooltip={`La mediana es ${kpis.medianHoursToDecide ?? "—"} h. Si el promedio la supera con holgura, hay solicitudes olvidadas durante semanas arrastrando el número.`}
        />
        <KpiCard
          title="Mediana de Decisión"
          value={kpis.medianHoursToDecide}
          format="number"
          suffix=" h"
          tooltip="La experiencia del solicitante típico, sin que la distorsionen los casos extremos."
        />
        <KpiCard
          title="Tiendas sin Solicitud"
          value={kpis.storesWithoutApplication}
          format="number"
          suffix={` de ${num(kpis.storeProfiles)}`}
          tooltip="Perfiles de tienda creados por una vía que no pasa por el formulario de solicitud. Ninguna revisión los tocó."
          onDrilldown={() =>
            drilldown.open("onboarding_stores", {
              title: "Tiendas que nunca enviaron solicitud",
              filters: { without_application: true, allTime: true }
            })
          }
        />
        <KpiCard
          title="Tiendas Verificadas"
          value={kpis.verifiedStores}
          format="number"
          suffix={` · ${num(kpis.suspendedStores)} suspendidas`}
          tooltip="Tiendas con la marca de verificación puesta. Si es cero, el sello existe en la base de datos pero no en el proceso."
          onDrilldown={() =>
            drilldown.open("onboarding_stores", {
              title: "Tiendas verificadas",
              filters: { is_verified: true, allTime: true }
            })
          }
        />
      </div>

      {/* Embudo de activación */}
      <div className="fx-card">
        <h3 className="text-base font-bold text-fx-text mb-1">Del Alta a la Primera Venta</h3>
        <p className="text-xs text-fx-muted mb-6">
          Una tienda aprobada que nunca publicó un producto no es un éxito de onboarding: es un abandono que el panel de
          aprobaciones cuenta como victoria
        </p>

        <div className="space-y-3">
          {funnel.map((step, index) => {
            const count = Number(step.count) || 0;
            const widthPct = funnelTop > 0 ? (count / funnelTop) * 100 : 0;
            const prev = index > 0 ? Number(funnel[index - 1].count) || 0 : null;
            const dropped = prev !== null ? prev - count : 0;

            return (
              <div key={step.step}>
                <div className="flex items-center justify-between mb-1 text-xs">
                  <span className="font-bold text-fx-text">{step.step}</span>
                  <span className="text-fx-muted">
                    <span className="font-semibold text-fx-accent">{num(count)}</span>
                    <span className="text-gray-500"> · {parseFloat(step.pct || 0).toFixed(1)}% de las tiendas</span>
                  </span>
                </div>
                <div className="h-8 bg-purple-950/50 rounded-xl overflow-hidden border border-fx-line">
                  <div
                    className="h-full rounded-xl transition-all duration-500"
                    style={{
                      width: `${Math.max(widthPct, count > 0 ? 2 : 0)}%`,
                      background: "linear-gradient(90deg, #c3ff00 0%, #a855f7 100%)"
                    }}
                  />
                </div>
                {dropped > 0 && (
                  <p className="text-[10px] text-rose-300/90 mt-1 ml-1">
                    ↓ {num(dropped)} tiendas se quedaron en el paso anterior
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 pt-5 border-t border-purple-500/15">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-fx-faint font-bold mb-1">Vendibles Hoy</p>
            <p className="text-lg font-semibold text-fx-text">
              {num(kpis.storesSellableToday)}
              <span className="text-xs font-normal text-fx-muted"> de {num(kpis.storeProfiles)} tiendas</span>
            </p>
            <p className="text-[10px] text-gray-500 leading-snug mt-0.5">
              Estado de hoy, no un escalón del embudo: tener catálogo comprable se pierde tan fácil como se gana.
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-fx-faint font-bold mb-1">Persiana Bajada</p>
            <p className={`text-lg font-semibold ${(kpis.storesWentDark || 0) > 0 ? "text-rose-400" : "text-emerald-400"}`}>
              {num(kpis.storesWentDark)}
            </p>
            <p className="text-[10px] text-gray-500 leading-snug mt-0.5">
              Vendieron alguna vez y hoy no tienen nada comprable. Su historial se ve bien, su tienda está vacía.
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-fx-faint font-bold mb-1">Tasa de Activación</p>
            <p className="text-lg font-semibold text-fx-accent">{parseFloat(kpis.activationRatePct || 0).toFixed(1)}%</p>
            <p className="text-[10px] text-gray-500 leading-snug mt-0.5">
              Tiendas que llegaron a facturar al menos una vez, sobre el total dado de alta.
            </p>
          </div>
        </div>
      </div>

      {/* Tendencia de solicitudes */}
      <ChartCard
        title="Solicitudes por Día"
        subtitle="Cuándo llega el interés por vender o repartir en la plataforma"
        onTypeChange={setChartMode}
      >
        <ResponsiveContainer width="100%" height={260}>
          {chartMode === "line" ? (
            <LineChart data={data?.applicationsDaily || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff12" />
              <XAxis dataKey="date" stroke="#7b6c99" fontSize={11} />
              <YAxis stroke="#7b6c99" fontSize={11} allowDecimals={false} />
              <Tooltip contentStyle={{ backgroundColor: "#0d0418", border: "1px solid #ffffff29", borderRadius: "10px", color: "#f4f1f8", fontSize: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.55)" }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="store_applications" name="Tiendas" stroke="#c3ff00" strokeWidth={3} dot={false} />
              <Line type="monotone" dataKey="rider_applications" name="Repartidores" stroke="#a855f7" strokeWidth={2} dot={false} />
            </LineChart>
          ) : chartMode === "area" ? (
            <AreaChart data={data?.applicationsDaily || []}>
              <defs>
                <linearGradient id="colorOnbStore" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#c3ff00" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="#c3ff00" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorOnbRider" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff12" />
              <XAxis dataKey="date" stroke="#7b6c99" fontSize={11} />
              <YAxis stroke="#7b6c99" fontSize={11} allowDecimals={false} />
              <Tooltip contentStyle={{ backgroundColor: "#0d0418", border: "1px solid #ffffff29", borderRadius: "10px", color: "#f4f1f8", fontSize: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.55)" }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Area type="monotone" dataKey="store_applications" name="Tiendas" stroke="#c3ff00" strokeWidth={3} fillOpacity={1} fill="url(#colorOnbStore)" />
              <Area type="monotone" dataKey="rider_applications" name="Repartidores" stroke="#a855f7" strokeWidth={2} fillOpacity={1} fill="url(#colorOnbRider)" />
            </AreaChart>
          ) : (
            <BarChart data={data?.applicationsDaily || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff12" />
              <XAxis dataKey="date" stroke="#7b6c99" fontSize={11} />
              <YAxis stroke="#7b6c99" fontSize={11} allowDecimals={false} />
              <Tooltip contentStyle={{ backgroundColor: "#0d0418", border: "1px solid #ffffff29", borderRadius: "10px", color: "#f4f1f8", fontSize: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.55)" }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="store_applications" name="Tiendas" fill="#c3ff00" radius={[4, 4, 0, 0]} />
              <Bar dataKey="rider_applications" name="Repartidores" fill="#a855f7" radius={[4, 4, 0, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </ChartCard>

      {/* Tiendas que entraron por la puerta de atrás */}
      {(data?.backdoorStores?.length || 0) > 0 && (
        <DataTable
          title="Tiendas sin Solicitud Registrada"
          subtitle="Perfiles creados por una vía que no pasa por el formulario: nadie revisó su RIF ni sus datos"
          searchPlaceholder="Buscar tienda..."
          columns={[
            {
              header: "Tienda",
              accessor: "business_name",
              render: (r) => (
                <button
                  onClick={() =>
                    drilldown.open("onboarding_stores", {
                      title: "Tiendas que nunca enviaron solicitud",
                      filters: { without_application: true, allTime: true }
                    })
                  }
                  className="font-bold text-fx-accent hover:underline text-left"
                >
                  {r.business_name || "Sin nombre"}
                </button>
              )
            },
            {
              header: "RIF",
              accessor: "rif",
              render: (r) =>
                r.rif ? (
                  <span className="font-mono text-[11px]">{r.rif}</span>
                ) : (
                  <span className="text-rose-400 font-bold">sin RIF</span>
                )
            },
            { header: "Alta", accessor: "created_at", render: (r) => new Date(r.created_at).toLocaleDateString("es-VE") },
            { header: "Productos", accessor: "products", render: (r) => num(r.products) },
            {
              header: "Pedidos",
              accessor: "orders",
              render: (r) => <span className="font-bold text-fx-text">{num(r.orders)}</span>
            },
            {
              header: "Verificada",
              accessor: "is_verified",
              render: (r) =>
                r.is_verified ? (
                  <span className="text-emerald-400 font-bold">Sí</span>
                ) : (
                  <span className="text-rose-400 font-bold">No</span>
                )
            }
          ]}
          data={data?.backdoorStores || []}
          emptyMessage="Toda tienda existente pasó por el formulario de solicitud."
        />
      )}

      {/* Solicitudes de tienda */}
      <DataTable
        title="Solicitudes de Tienda"
        subtitle="Cada formulario enviado, con lo que pasó después de la decisión"
        searchPlaceholder="Buscar negocio o solicitante..."
        columns={[
          {
            header: "Negocio",
            accessor: "business_name",
            render: (r) => (
              <div>
                <p className="font-bold text-fx-text">{r.business_name || "Sin nombre"}</p>
                <p className="text-[10px] text-fx-muted font-mono">{r.rif || "sin RIF"}</p>
              </div>
            )
          },
          {
            header: "Solicitante",
            accessor: "applicant_name",
            render: (r) => (
              <div>
                <p className="text-fx-muted">{r.applicant_name || "—"}</p>
                <p className="text-[10px] text-fx-muted font-mono">{r.applicant_email}</p>
              </div>
            )
          },
          { header: "Estado", accessor: "status", render: (r) => statusBadge(r.status)},
          {
            header: "Horas hasta Decidir",
            accessor: "hours_to_decide",
            render: (r) =>
              r.hours_to_decide === null || r.hours_to_decide === undefined ? (
                <span className="text-gray-500">sin marca</span>
              ) : (
                <span className={`font-bold ${decisionTone(r.hours_to_decide)}`}>{r.hours_to_decide} h</span>
              )
          },
          {
            header: "Intentos",
            accessor: "attempts",
            render: (r) =>
              Number(r.attempts) > 1 ? (
                <span className="font-bold text-amber-400">{r.attempts} intentos</span>
              ) : (
                <span className="text-fx-muted">1</span>
              )
          },
          {
            header: "Después",
            accessor: "products",
            render: (r) => {
              if (!r.has_profile) {
                return <span className="text-gray-500">sin perfil creado</span>;
              }
              return Number(r.products) > 0 ? (
                <span className="text-emerald-400 font-bold">{num(r.products)} productos</span>
              ) : (
                <span className="text-rose-400 font-bold">perfil vacío</span>
              );
            }
          }
        ]}
        data={data?.storeApplications || []}
        emptyMessage="Todavía no se ha enviado ninguna solicitud de tienda."
      />

      {/* Reintentos y tiendas estancadas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DataTable
          title="Solicitantes que Insistieron"
          subtitle="Más de un intento del mismo usuario: o el formulario confunde, o el criterio de rechazo no se explica"
          columns={[
            {
              header: "Solicitante",
              accessor: "applicant_name",
              render: (r) => (
                <button
                  onClick={() =>
                    drilldown.open("store_applications", {
                      title: `Solicitudes de ${r.applicant_name || "este usuario"}`,
                      filters: { user_id: r.user_id, allTime: true }
                    })
                  }
                  className="font-bold text-fx-accent hover:underline text-left"
                >
                  {r.applicant_name || "Sin nombre"}
                </button>
              )
            },
            { header: "Intentos", accessor: "attempts", render: (r) => <span className="font-bold text-amber-400">{r.attempts}</span> },
            { header: "Rechazos", accessor: "rejections", render: (r) => <span className="text-rose-400 font-bold">{r.rejections}</span> },
            {
              header: "Desenlace",
              accessor: "eventually_approved",
              render: (r) =>
                r.eventually_approved ? (
                  <span className="text-emerald-400 font-bold">Terminó aprobado</span>
                ) : (
                  <span className="text-rose-400 font-bold">Se quedó fuera</span>
                )
            },
            { header: "Días en Proceso", accessor: "days_in_process", render: (r) => `${r.days_in_process} d` }
          ]}
          data={data?.retries || []}
          emptyMessage="Nadie tuvo que enviar el formulario dos veces."
        />

        <DataTable
          title="Altas que No Arrancaron"
          subtitle="Tiendas creadas que nunca llegaron a vender, con la razón exacta del atasco"
          columns={[
            {
              header: "Tienda",
              accessor: "business_name",
              render: (r) => <span className="font-bold text-fx-text">{r.business_name || "Sin nombre"}</span>
            },
            {
              header: "Días desde el Alta",
              accessor: "days_since_signup",
              render: (r) => (
                <span className={parseFloat(r.days_since_signup) > 60 ? "text-rose-400 font-bold" : "text-amber-400 font-bold"}>
                  {r.days_since_signup} d
                </span>
              )
            },
            { header: "Productos", accessor: "products", render: (r) => num(r.products) },
            {
              header: "Dónde se Atascó",
              accessor: "stall_reason",
              render: (r) => (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-rose-500/15 text-rose-300 border border-rose-500/30 whitespace-nowrap">
                  {r.stall_reason}
                </span>
              )
            }
          ]}
          data={data?.dormantStores || []}
          emptyMessage="Toda tienda dada de alta terminó vendiendo."
        />
      </div>

      {/* KPIs de repartidores */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
        <KpiCard
          title="Solicitudes de Repartidor"
          value={kpis.riderApplications}
          format="number"
          suffix={` · ${num(kpis.riderApproved)} aprobadas`}
          tooltip="Formularios enviados por quienes quieren repartir. Revisa si son personas distintas o la misma insistiendo."
          onDrilldown={() =>
            drilldown.open("rider_applications", { title: "Solicitudes de repartidor", filters: { allTime: true } })
          }
        />
        <KpiCard
          title="Repartidores Pendientes"
          value={kpis.riderPending}
          format="number"
          suffix={kpis.riderOldestPendingDays > 0 ? ` · la más vieja ${kpis.riderOldestPendingDays} d` : ""}
          tooltip="Solicitudes de repartidor sin decidir. Es capacidad de entrega que ya se ofreció y nadie tomó."
          onDrilldown={() =>
            drilldown.open("rider_applications", {
              title: "Solicitudes de repartidor pendientes",
              filters: { status: "pending", allTime: true }
            })
          }
        />
        <KpiCard
          title="Repartidores Activos"
          value={kpis.activeRiders}
          format="number"
          tooltip="Perfiles de repartidor marcados como activos y asociados a una tienda."
          onDrilldown={() =>
            drilldown.open("delivery_riders", {
              title: "Repartidores activos",
              filters: { is_active: true, allTime: true }
            })
          }
        />
        <KpiCard
          title="Contadores Desincronizados"
          value={kpis.ridersWithCounterDrift}
          format="number"
          tooltip="Repartidores cuyo contador guardado de entregas no coincide con sus eventos reales. El número que ve el panel es más viejo que la realidad."
          onDrilldown={() =>
            drilldown.open("delivery_riders", {
              title: "Repartidores con el contador desactualizado",
              filters: { counter_drift: true, allTime: true }
            })
          }
        />
      </div>

      {/* Solicitudes de repartidor */}
      <DataTable
        title="Solicitudes de Repartidor"
        subtitle="Ciudad y vehículo son texto libre sin normalizar: lo que se escribe aquí es lo que queda"
        searchPlaceholder="Buscar nombre o ciudad..."
        columns={[
          {
            header: "Nombre",
            accessor: "full_name",
            render: (r) => (
              <div>
                <p className="font-bold text-fx-text">{r.full_name || "Sin nombre"}</p>
                <p className="text-[10px] text-fx-muted font-mono">{r.cedula || "sin cédula"}</p>
              </div>
            )
          },
          { header: "Ciudad", accessor: "city", render: (r) => r.city || "—" },
          { header: "Vehículo", accessor: "vehicle_type", render: (r) => r.vehicle_type || "—" },
          { header: "Estado", accessor: "status", render: (r) => statusBadge(r.status)},
          {
            header: "Horas hasta Decidir",
            accessor: "hours_to_decide",
            render: (r) =>
              r.hours_to_decide === null || r.hours_to_decide === undefined ? (
                <span className="text-gray-500">sin marca</span>
              ) : (
                <span className={`font-bold ${decisionTone(r.hours_to_decide)}`}>{r.hours_to_decide} h</span>
              )
          },
          {
            header: "Perfil Creado",
            accessor: "has_profile",
            render: (r) =>
              r.has_profile ? (
                <span className="text-emerald-400 font-bold">Sí</span>
              ) : (
                <span className={r.status === "approved" ? "text-rose-400 font-bold" : "text-gray-500"}>No</span>
              )
          }
        ]}
        data={data?.riderApplications || []}
        emptyMessage="Todavía no se ha postulado ningún repartidor."
      />

      {/* Plantilla de repartidores */}
      <DataTable
        title="Plantilla de Repartidores"
        subtitle="El contador guardado contra los eventos reales: cuando no coinciden, la verdad está en los eventos"
        searchPlaceholder="Buscar repartidor..."
        columns={[
          {
            header: "Repartidor",
            accessor: "full_name",
            render: (r) => (
              <div>
                <p className="font-bold text-fx-text">{r.full_name || "Sin nombre"}</p>
                <p className="text-[10px] text-fx-muted">{r.store_name || "sin tienda asignada"}</p>
              </div>
            )
          },
          {
            header: "Zona",
            accessor: "zone",
            render: (r) => (r.zone ? r.zone : <span className="text-amber-400">sin zona</span>)
          },
          {
            header: "Contador Guardado",
            accessor: "total_deliveries",
            render: (r) => num(r.total_deliveries)
          },
          {
            header: "Entregas Reales",
            accessor: "real_deliveries",
            render: (r) => {
              const drift = Number(r.total_deliveries || 0) !== Number(r.real_deliveries || 0);
              return (
                <span className={drift ? "text-rose-400 font-semibold" : "text-emerald-400 font-bold"}>
                  {num(r.real_deliveries)}
                  {drift && <span className="text-[10px] font-normal"> · no coincide</span>}
                </span>
              );
            }
          },
          { header: "Eventos", accessor: "events_logged", render: (r) => num(r.events_logged) },
          {
            header: "Último Evento",
            accessor: "last_event_at",
            render: (r) =>
              r.last_event_at ? (
                new Date(r.last_event_at).toLocaleDateString("es-VE")
              ) : (
                <span className="text-gray-500">nunca</span>
              )
          }
        ]}
        data={data?.riderRoster || []}
        emptyMessage="No hay repartidores registrados."
      />

      {/* Calidad del dato en texto libre */}
      {(data?.riderDataQuality?.length || 0) > 0 && (
        <DataTable
          title="Calidad del Dato en Campos Libres"
          subtitle="Cada grafía distinta de un mismo valor rompe cualquier agrupación futura por ciudad o vehículo"
          columns={[
            { header: "Campo", accessor: "field", render: (r) => <span className="font-bold text-fx-faint">{r.field}</span> },
            {
              header: "Valor Normalizado",
              accessor: "normalized_value",
              render: (r) => <span className="font-mono text-[11px] text-fx-text">{r.normalized_value}</span>
            },
            { header: "Solicitudes", accessor: "applications", render: (r) => num(r.applications) },
            {
              header: "Grafías",
              accessor: "spelling_variants",
              render: (r) =>
                Number(r.spelling_variants) > 1 ? (
                  <span className="font-bold text-rose-400">{r.spelling_variants} formas</span>
                ) : (
                  <span className="text-emerald-400">1 forma</span>
                )
            },
            {
              header: "Cómo se Escribió",
              accessor: "spellings",
              render: (r) => <span className="text-fx-muted">{r.spellings}</span>
            }
          ]}
          data={data?.riderDataQuality || []}
          emptyMessage="No hay datos de ciudad ni vehículo en las solicitudes."
        />
      )}

      <DrilldownModal {...drilldown.props} period={period} />
    </div>
  );
}
