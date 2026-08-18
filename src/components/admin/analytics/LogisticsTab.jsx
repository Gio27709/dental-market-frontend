import { useState, useEffect, useCallback } from "react";
import { getLogisticsAnalyticsAPI, getStoresListAPI } from "../../../services/api";
import KpiCard from "./KpiCard";
import ChartCard from "./ChartCard";
import DataTable from "./DataTable";
import SkeletonLoader from "./SkeletonLoader";
import FreshnessBadge from "./FreshnessBadge";
import DateRangePicker from "./DateRangePicker";
import AnalyticsStoreFilter from "./AnalyticsStoreFilter";
import AnalyticsExportButton from "./AnalyticsExportButton";
import useDrilldown from "../../../hooks/useDrilldown";
import DrilldownModal from "./DrilldownModal";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar, LineChart, Line } from "recharts";

export default function LogisticsTab() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [storeList, setStoreList] = useState([]);

  const [period, setPeriod] = useState("30d");
  const [selectedStoreIds, setSelectedStoreIds] = useState([]);
  const [chartMode, setChartMode] = useState("area");
  const drilldown = useDrilldown();

  useEffect(() => {
    getStoresListAPI()
      .then((res) => {
        if (res.data?.data) setStoreList(res.data.data);
      })
      .catch((err) => console.error("Error cargando lista de tiendas:", err));
  }, []);

  const fetchLogisticsData = useCallback(async (isRefresh = false) => {
    setLoading(true);
    setError(null);
    try {
      const params = { period };
      if (selectedStoreIds.length > 0) params.store_ids = selectedStoreIds.join(",");
      if (isRefresh) params.refresh = "true";

      const res = await getLogisticsAnalyticsAPI(params);

      if (res.data?.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error("Error cargando analíticas logísticas:", err);
      setError(err.response?.data?.message || err.message || "Error obteniendo datos de logística.");
    } finally {
      setLoading(false);
    }
  }, [period, selectedStoreIds]);

  useEffect(() => {
    fetchLogisticsData();
  }, [fetchLogisticsData]);

  if (loading && !data) return <SkeletonLoader type="kpiRow" />;

  if (error) {
    return (
      <div className="fx-card-danger text-center my-6">
        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mx-auto mb-3 text-2xl">
          ⚠️
        </div>
        <h3 className="text-lg font-bold text-fx-text mb-1">Error al Cargar Logística & Envíos</h3>
        <p className="text-fx-muted text-xs mb-4">{error}</p>
        <button
          onClick={() => fetchLogisticsData(true)}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-fx-text rounded-xl text-xs font-bold transition-all shadow-lg"
        >
          🔄 Reintentar Cargar
        </button>
      </div>
    );
  }

  const dispatchPipeline = data?.dispatchPipeline || [];
  const sla = data?.sla || {};
  const slaBlocked = Boolean(sla.blocked);
  const stageHours = data?.stageAverageHours || {};
  const shipBlocked = Boolean(stageHours.ship_blocked);
  const failedDeliveries = data?.failedDeliveriesDistribution || [];
  const riders = data?.riderPerformance || [];
  const riderFunnel = data?.riderRecruitmentFunnel || [];
  const geoVolume = data?.geographicVolume || [];
  const deliveryTrend = data?.deliveryTrend || [];
  const totalShipments = data?.totalShipments || 0;
  const totalDelivered = data?.totalDelivered || 0;
  const totalFailed = data?.totalFailed || 0;

  return (
    <div className="space-y-6">
      {/* Header Controls Row */}
      <div className="relative z-30 flex flex-col md:flex-row md:items-center justify-between gap-4 fx-card-sm">
        <div className="flex items-center gap-3 flex-wrap">
          <AnalyticsStoreFilter
            storeList={storeList}
            selectedStoreIds={selectedStoreIds}
            onStoreChange={setSelectedStoreIds}
          />
          <AnalyticsExportButton activeArea="logistics" period={period} />
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <DateRangePicker selectedPeriod={period} onPeriodChange={setPeriod} />
          <FreshnessBadge
            lastUpdated={data?.serverTimestamp}
            onRefresh={() => fetchLogisticsData(true)}
            isLoading={loading}
          />
        </div>
      </div>

      {/* Grid de 6 Tarjetas KPI de Salud Logística */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 relative z-10">
        <KpiCard
          title="% Despachos dentro del SLA"
          value={data?.slaOnTimePct ?? null}
          format="percent"
          suffix={slaBlocked ? "" : ` · ${sla.onTime ?? 0} de ${sla.measurable ?? 0}`}
          tooltip={
            slaBlocked
              ? `Retenido. ${sla.shippedBeforeApproved} despachos están fechados antes de que se aprobara su propio pago, así que la resta no describe el desempeño.`
              : `Ventana de ${sla.configuredHours} h desde la aprobación del pago hasta la salida del paquete: es la misma que el cron sanciona con amonestaciones, multas y suspensiones. No se usa sla_promised_at, que nunca se escribió, ni delivered_at, que solo tiene hora fiable desde la migración 046.`
          }
          onDrilldown={() =>
            drilldown.open("shipments", {
              title: "Despachos medibles contra el SLA",
              subtitle: "Las horas hasta despachar de cada ítem aparecen en su columna",
              filters: { sla_measurable: true }
            })
          }
        />
        <KpiCard
          title="Tiempo Prom. Despacho"
          value={stageHours.avg_hours_to_ship ?? null}
          format="number"
          suffix={shipBlocked ? "" : ` hrs · n=${stageHours.n_ship ?? 0}`}
          tooltip={
            shipBlocked
              ? `Retenido. ${sla.shippedBeforeApproved} despachos figuran anteriores a la aprobación de su pago: el promedio saldría negativo.`
              : "Horas entre la aprobación del pago y la salida del paquete, la misma base que el SLA. Solo cuenta los ítems con ambas marcas registradas."
          }
          onDrilldown={() =>
            drilldown.open("shipments", {
              title: "Despachos con ambas marcas de tiempo",
              subtitle: "Base del tiempo promedio de despacho",
              filters: { sla_measurable: true }
            })
          }
        />
        <KpiCard
          title="Tiempo Prom. en Ruta"
          value={stageHours.avg_hours_to_deliver ?? null}
          format="number"
          suffix={` hrs · n=${stageHours.n_deliver ?? 0}`}
          tooltip="Horas entre el evento de recogida y el de entrega, medidas dentro de delivery_events. No se cruza con order_items.delivered_at porque las dos tablas no comparten reloj en los datos históricos; además esa columna solo tiene hora fiable desde la migración 046."
          onDrilldown={() =>
            drilldown.open("delivery_events", {
              title: "Bitácora de entrega del período",
              subtitle: "Cada hito registrado por los repartidores"
            })
          }
        />
        <KpiCard
          title="Envíos Totales Procesados"
          value={totalShipments}
          format="number"
          suffix=" envíos"
          tooltip="Mapeado en M32: Cantidad acumulada de paquetes despachados en el período."
          onDrilldown={() =>
            drilldown.open("shipments", { title: "Todos los envíos del período" })
          }
        />
        <KpiCard
          title="Entregas Exitosas"
          value={totalDelivered}
          format="number"
          suffix=" paquetes"
          tooltip="Total de ítems con entrega confirmada exitosamente al cliente."
          onDrilldown={() =>
            drilldown.open("shipments", {
              title: "Entregas confirmadas",
              filters: { delivery_status: "delivered" }
            })
          }
        />
        <KpiCard
          title="Entregas Fallidas / Canceladas"
          value={totalFailed}
          format="number"
          suffix=" ítems"
          tooltip="Mapeado en M35: Envíos no completados por cancelación o falla en ruta."
          onDrilldown={() =>
            drilldown.open("shipments", {
              title: "Envíos fallidos o cancelados",
              filters: { delivery_status: "cancelled" }
            })
          }
        />
      </div>

      {(slaBlocked || (sla.unmeasurableDispatched ?? 0) > 0 || (sla.openPastDue ?? 0) > 0) && (
        <div
          className={`rounded-2xl p-4 text-xs text-fx-muted leading-relaxed space-y-2 ${
            slaBlocked ? "bg-rose-500/5 border border-rose-500/30" : "bg-amber-500/5 border border-amber-500/30"
          }`}
        >
          {slaBlocked && (
            <p>
              <span className="font-semibold text-rose-300 uppercase tracking-wide">SLA retenido · </span>
              {sla.shippedBeforeApproved} despachos figuran anteriores a la aprobación de su propio pago, así que el
              cumplimiento no se publica: el número saldría de la aritmética, no del desempeño.
            </p>
          )}
          {(sla.unmeasurableDispatched ?? 0) > 0 && (
            <p>
              <span className="font-semibold text-amber-300 uppercase tracking-wide">Cobertura · </span>
              {sla.unmeasurableDispatched} de {sla.measurable + sla.unmeasurableDispatched} ítems ya despachados no
              tienen registrada la hora de salida o la de aprobación del pago, así que quedan fuera del cálculo. El
              porcentaje describe el {sla.measurablePct ?? 0}% medible, no el total.
            </p>
          )}
          {(sla.openPastDue ?? 0) > 0 && (
            <p>
              <span className="font-semibold text-amber-300 uppercase tracking-wide">Vencidos sin despachar · </span>
              {sla.openPastDue} ítems pagados llevan más de {sla.configuredHours} h esperando salida. No entran en el
              porcentaje (aún no tienen despacho que medir), pero son la deuda que el cron sanciona.
            </p>
          )}
        </div>
      )}

      {/* Gráfico Principal de Tendencia Diaria de Envíos */}
      <ChartCard
        title="Tendencia Diaria de Envíos Exitosos vs Cancelaciones"
        subtitle="Comportamiento del flujo diario de logística y volumen entregado a tiempo"
        onTypeChange={setChartMode}
      >
        <ResponsiveContainer width="100%" height={260}>
          {chartMode === "bar" ? (
            <BarChart data={deliveryTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff12" />
              <XAxis dataKey="date" stroke="#7b6c99" fontSize={11} />
              <YAxis stroke="#7b6c99" fontSize={11} />
              <Tooltip contentStyle={{ backgroundColor: "#0d0418", border: "1px solid #ffffff29", borderRadius: "10px", color: "#f4f1f8", fontSize: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.55)" }} />
              <Bar dataKey="delivered_count" name="Entregados" fill="#c3ff00" radius={[4, 4, 0, 0]} />
              <Bar dataKey="failed_count" name="Fallidos" fill="#f43f5e" radius={[4, 4, 0, 0]} />
            </BarChart>
          ) : chartMode === "line" ? (
            <LineChart data={deliveryTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff12" />
              <XAxis dataKey="date" stroke="#7b6c99" fontSize={11} />
              <YAxis stroke="#7b6c99" fontSize={11} />
              <Tooltip contentStyle={{ backgroundColor: "#0d0418", border: "1px solid #ffffff29", borderRadius: "10px", color: "#f4f1f8", fontSize: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.55)" }} />
              <Line type="monotone" dataKey="delivered_count" name="Entregados" stroke="#c3ff00" strokeWidth={3} dot={false} />
              <Line type="monotone" dataKey="failed_count" name="Fallidos" stroke="#f43f5e" strokeWidth={2} dot={false} />
            </LineChart>
          ) : (
            <AreaChart data={deliveryTrend}>
              <defs>
                <linearGradient id="colorDelivered" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#c3ff00" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="#c3ff00" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff12" />
              <XAxis dataKey="date" stroke="#7b6c99" fontSize={11} />
              <YAxis stroke="#7b6c99" fontSize={11} />
              <Tooltip contentStyle={{ backgroundColor: "#0d0418", border: "1px solid #ffffff29", borderRadius: "10px", color: "#f4f1f8", fontSize: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.55)" }} />
              <Area type="monotone" dataKey="delivered_count" name="Entregados" stroke="#c3ff00" strokeWidth={3} fillOpacity={1} fill="url(#colorDelivered)" />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </ChartCard>

      {/* Pipeline de Despachos */}
      <DataTable
        title="Pipeline de Despachos por Estado"
        columns={[
          {
            header: "Estado de Envíos",
            accessor: "delivery_status",
            render: (r) => (
              <button
                onClick={() =>
                  drilldown.open("shipments", {
                    title: `Envíos en estado "${r.delivery_status}"`,
                    filters: { delivery_status: r.delivery_status }
                  })
                }
                className="font-bold uppercase text-fx-accent hover:underline text-left"
              >
                {r.delivery_status}
              </button>
            )
          },
          { header: "Cantidad de Envíos", accessor: "item_count", render: (r) => parseInt(r.item_count || 0).toLocaleString() },
        ]}
        data={dispatchPipeline}
      />

      {/* Grid de Desempeño de Repartidores y Funnel de Reclutamiento */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DataTable
          title="Desempeño de Repartidores (Riders Activos)"
          columns={[
            { header: "Repartidor", accessor: "full_name", render: (r) => <span className="font-bold text-fx-text">{r.full_name}</span> },
            { header: "Zona Cobertura", accessor: "zone", render: (r) => <span className="text-fx-faint font-semibold">{r.zone || "—"}</span> },
            { header: "Entregas Totales", accessor: "total_deliveries", render: (r) => <span className="font-semibold text-fx-accent">{parseInt(r.total_deliveries || 0).toLocaleString()}</span> },
            { header: "Estado", accessor: "is_active", render: (r) => <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${r.is_active ? "bg-emerald-500/10 text-emerald-300" : "bg-rose-500/10 text-rose-300"}`}>{r.is_active ? "ACTIVO" : "INACTIVO"}</span> }
          ]}
          data={riders}
        />
        <DataTable
          title="Funnel de Solicitudes de Repartidores"
          columns={[
            { header: "Estado de Solicitud", accessor: "status", render: (r) => <span className="font-bold uppercase text-fx-text">{r.status}</span> },
            { header: "Candidatos", accessor: "count", render: (r) => parseInt(r.count || 0).toLocaleString() }
          ]}
          data={riderFunnel}
        />
      </div>

      {/* Grid de Entregas Fallidas y Volumen Geográfico */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DataTable
          title="Distribución de Entregas Fallidas y Cancelaciones"
          columns={[
            { header: "Motivo de Falla / Cancelación", accessor: "reason", render: (r) => <span className="font-semibold text-rose-300">{r.reason}</span> },
            { header: "Ocurrencias", accessor: "failure_count", render: (r) => <span className="font-bold text-fx-text">{parseInt(r.failure_count || 0).toLocaleString()}</span> }
          ]}
          data={failedDeliveries}
        />
        <DataTable
          title="Volumen por Estado / Región Geográfica"
          columns={[
            {
              header: "Estado",
              accessor: "state",
              render: (r) => (
                <button
                  onClick={() =>
                    drilldown.open("shipments", {
                      title: `Envíos hacia ${r.state}`,
                      filters: { destination_state: r.state }
                    })
                  }
                  className="font-bold text-fx-accent hover:underline text-left"
                >
                  {r.state}
                </button>
              )
            },
            { header: "Órdenes", accessor: "total_orders", render: (r) => parseInt(r.total_orders || 0).toLocaleString() },
            { header: "Volumen USD", accessor: "total_volume", render: (r) => `$${parseFloat(r.total_volume || 0).toFixed(2)}` }
          ]}
          data={geoVolume}
        />
      </div>

      <DrilldownModal {...drilldown.props} period={period} />
    </div>
  );
}

LogisticsTab.propTypes = {};
