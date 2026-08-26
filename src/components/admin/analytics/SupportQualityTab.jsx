import { useState, useEffect, useCallback } from "react";
import { getSupportAnalyticsAPI } from "../../../services/api";
import useDrilldown from "../../../hooks/useDrilldown";
import KpiCard from "./KpiCard";
import ChartCard from "./ChartCard";
import DataTable from "./DataTable";
import DrilldownModal from "./DrilldownModal";
import SkeletonLoader from "./SkeletonLoader";
import FreshnessBadge from "./FreshnessBadge";
import DateRangePicker from "./DateRangePicker";
import AnalyticsExportButton from "./AnalyticsExportButton";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar, LineChart, Line } from "recharts";

// Sin filtro de tiendas: un ticket de soporte no tiene tienda. `support_tickets` no
// guarda store_id y su `order_id` está vacío en todas las filas, así que acotar por
// tienda dejaba cada métrica en cero. El selector se enviaba y el backend lo ignoraba.
export default function SupportQualityTab() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [period, setPeriod] = useState("30d");
  const [chartMode, setChartMode] = useState("bar");
  const drilldown = useDrilldown();

  const fetchSupportData = useCallback(async (isRefresh = false) => {
    setLoading(true);
    setError(null);
    try {
      const params = { period };
      if (isRefresh) params.refresh = "true";

      const res = await getSupportAnalyticsAPI(params);

      if (res.data?.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error("Error cargando analíticas de soporte:", err);
      setError(err.response?.data?.message || err.message || "Error obteniendo datos de soporte.");
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchSupportData();
  }, [fetchSupportData]);

  if (loading && !data) return <SkeletonLoader type="kpiRow" />;

  if (error) {
    return (
      <div className="fx-card-danger text-center my-6">
        <div className="w-12 h-12 rounded-2xl bg-fx-neg/10 border border-fx-neg/20 flex items-center justify-center text-fx-neg mx-auto mb-3 text-2xl">
          ⚠️
        </div>
        <h3 className="text-lg font-bold text-fx-text mb-1">Error al Cargar Soporte & Calidad</h3>
        <p className="text-fx-muted text-xs mb-4">{error}</p>
        <button
          onClick={() => fetchSupportData(true)}
          className="px-4 py-2 bg-[#6b1e96] hover:bg-[#531575] text-white rounded-xl text-xs font-bold transition-all shadow-lg"
        >
          🔄 Reintentar Cargar
        </button>
      </div>
    );
  }

  const kpis = data?.kpis || {};
  const ticketTrend = data?.ticketsTrend || [];
  const penalties = data?.penaltiesSummary || [];
  const recentTickets = data?.recentTickets || [];
  const disputes = data?.disputesAndRefunds || [];

  return (
    <div className="space-y-6">
      {/* Header Controls Row */}
      <div className="relative z-30 flex flex-col md:flex-row md:items-center justify-between gap-4 fx-card-sm">
        <div className="flex items-center gap-3 flex-wrap">
          <AnalyticsExportButton activeArea="support" period={period} />
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <DateRangePicker selectedPeriod={period} onPeriodChange={setPeriod} />
          <FreshnessBadge
            lastUpdated={data?.serverTimestamp}
            onRefresh={() => fetchSupportData(true)}
            isLoading={loading}
          />
        </div>
      </div>

      {/* Grid de Tarjetas KPI de Soporte & Calidad */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
        <KpiCard
          title="Tickets Abiertos Pendientes"
          value={kpis.openTicketsCount || 0}
          format="number"
          suffix=" tickets"
          tooltip="Cantidad acumulada de solicitudes de soporte sin resolver. El titular es histórico, no del período."
          onDrilldown={() =>
            drilldown.open("support_tickets", {
              title: "Tickets abiertos",
              subtitle: "Histórico completo, sin acotar al período",
              filters: { is_open: true, allTime: true }
            })
          }
        />
        <KpiCard
          title="Tiempo Prom. 1ra Respuesta"
          value={kpis.avgFirstResponseHours}
          format="number"
          suffix=" hrs"
          tooltip="Horas entre la creación del ticket y la primera respuesta del equipo. Solo cuenta tickets ya respondidos."
          onDrilldown={() =>
            drilldown.open("support_tickets", {
              title: "Tickets con respuesta del equipo",
              subtitle: "Compara la 1ª respuesta real (desde los mensajes) contra la estampada por el trigger",
              filters: { no_staff_reply: false }
            })
          }
        />
        <KpiCard
          title="Tiempo Prom. Resolución"
          value={kpis.avgResolutionHours}
          format="number"
          suffix=" hrs"
          tooltip="Horas promedio hasta cerrar un ticket. Se aproxima con la última actualización del ticket."
          onDrilldown={() =>
            drilldown.open("support_tickets", {
              title: "Tickets resueltos o cerrados",
              filters: { is_open: false }
            })
          }
        />
        <KpiCard
          title="Tasa de Disputas / Reclamos"
          value={kpis.orderDisputeRatePct}
          format="percent"
          tooltip="Porcentaje de pedidos del período con al menos una solicitud de reembolso."
          drilldownUrl="/admin/refunds"
        />
      </div>

      {/* Gráfico Principal de Tendencia Diaria de Tickets */}
      <ChartCard
        title="Tendencia Diaria de Creación vs Resolución de Tickets"
        subtitle="Flujo diario de tickets ingresados y resueltos por el equipo de soporte"
        onTypeChange={setChartMode}
      >
        <ResponsiveContainer width="100%" height={260}>
          {chartMode === "bar" ? (
            <BarChart data={ticketTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#00000010" />
              <XAxis dataKey="date" stroke="#877f92" fontSize={11} />
              <YAxis stroke="#877f92" fontSize={11} />
              <Tooltip contentStyle={{ backgroundColor: "#f7f4fc", border: "1px solid #00000020", borderRadius: "10px", color: "#33243d", fontSize: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.55)" }} />
              <Bar dataKey="created_count" name="Ingresados" fill="#9a6a10" radius={[4, 4, 0, 0]} />
              <Bar dataKey="resolved_count" name="Resueltos" fill="#6b1e96" radius={[4, 4, 0, 0]} />
            </BarChart>
          ) : chartMode === "line" ? (
            <LineChart data={ticketTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#00000010" />
              <XAxis dataKey="date" stroke="#877f92" fontSize={11} />
              <YAxis stroke="#877f92" fontSize={11} />
              <Tooltip contentStyle={{ backgroundColor: "#f7f4fc", border: "1px solid #00000020", borderRadius: "10px", color: "#33243d", fontSize: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.55)" }} />
              <Line type="monotone" dataKey="created_count" name="Ingresados" stroke="#9a6a10" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="resolved_count" name="Resueltos" stroke="#6b1e96" strokeWidth={3} dot={false} />
            </LineChart>
          ) : (
            <AreaChart data={ticketTrend}>
              <defs>
                <linearGradient id="colorTickets" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6b1e96" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="#6b1e96" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#00000010" />
              <XAxis dataKey="date" stroke="#877f92" fontSize={11} />
              <YAxis stroke="#877f92" fontSize={11} />
              <Tooltip contentStyle={{ backgroundColor: "#f7f4fc", border: "1px solid #00000020", borderRadius: "10px", color: "#33243d", fontSize: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.55)" }} />
              <Area type="monotone" dataKey="resolved_count" name="Resueltos" stroke="#6b1e96" strokeWidth={3} fillOpacity={1} fill="url(#colorTickets)" />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </ChartCard>

      {/* Grid de Disputas/Reembolsos y Penalizaciones a Tiendas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DataTable
          title="Disputas y Solicitudes de Reembolso por Motivo"
          columns={[
            { header: "Motivo Reclamo", accessor: "reason", render: (r) => <span className="font-semibold text-fx-neg">{r.reason}</span> },
            { header: "Solicitudes", accessor: "total_requests", render: (r) => parseInt(r.total_requests || 0).toLocaleString() },
            { header: "Monto Reclamado", accessor: "total_amount", render: (r) => `$${parseFloat(r.total_amount || 0).toFixed(2)}` }
          ]}
          data={disputes}
        />
        <DataTable
          title="Resumen de Penalizaciones Aplicadas a Tiendas"
          columns={[
            { header: "Comercio", accessor: "store_name", render: (r) => <span className="font-bold text-fx-text">{r.store_name}</span> },
            { header: "Motivo / Falta", accessor: "reason", render: (r) => <span className="text-fx-neg font-semibold">{r.reason}</span> },
            { header: "Monto Multa", accessor: "amount", render: (r) => `$${parseFloat(r.amount || 0).toFixed(2)}` },
            { header: "Estado", accessor: "status", render: (r) => <span className="uppercase font-bold text-fx-warn text-[10px] bg-fx-warn/10 px-2 py-0.5 rounded-full border border-fx-warn/20">{r.status}</span> }
          ]}
          data={penalties}
        />
      </div>

      {/* Tickets de Soporte Recientes */}
      <DataTable
        title="Tickets de Soporte Recientes"
        columns={[
          {
            header: "Asunto",
            accessor: "subject",
            render: (r) => (
              <button
                onClick={() =>
                  drilldown.open("ticket_messages", {
                    title: `Conversación: ${r.subject}`,
                    subtitle: "Mensajes del ticket, histórico completo",
                    filters: { ticket_id: r.id, allTime: true }
                  })
                }
                className="font-semibold text-fx-muted hover:text-fx-accent underline decoration-dotted text-left transition-colors"
              >
                {r.subject}
              </button>
            )
          },
          { header: "Fecha / Hora", accessor: "created_at", render: (r) => new Date(r.created_at).toLocaleString("es-VE") },
          { header: "Estado", accessor: "status", render: (r) => <span className="uppercase text-[10px] font-bold text-fx-pos">{r.status}</span> }
        ]}
        data={recentTickets}
      />

      <DrilldownModal {...drilldown.props} period={period} />
    </div>
  );
}

SupportQualityTab.propTypes = {};
