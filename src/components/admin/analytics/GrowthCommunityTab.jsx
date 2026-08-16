import { useState, useEffect, useCallback } from "react";
import { getGrowthAnalyticsAPI, getStoresListAPI } from "../../../services/api";
import KpiCard from "./KpiCard";
import ChartCard from "./ChartCard";
import DataTable from "./DataTable";
import SkeletonLoader from "./SkeletonLoader";
import FreshnessBadge from "./FreshnessBadge";
import DateRangePicker from "./DateRangePicker";
import CompareToggle from "./CompareToggle";
import AnalyticsStoreFilter from "./AnalyticsStoreFilter";
import AnalyticsExportButton from "./AnalyticsExportButton";
import RetentionCohortHeatmap from "./RetentionCohortHeatmap";
import useDrilldown from "../../../hooks/useDrilldown";
import DrilldownModal from "./DrilldownModal";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar, LineChart, Line } from "recharts";

export default function GrowthCommunityTab() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [storeList, setStoreList] = useState([]);

  const [period, setPeriod] = useState("30d");
  const [isComparing, setIsComparing] = useState(false);
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

  const fetchGrowthData = useCallback(async (isRefresh = false) => {
    setLoading(true);
    setError(null);
    try {
      const params = { period };
      if (selectedStoreIds.length > 0) params.store_ids = selectedStoreIds.join(",");
      if (isRefresh) params.refresh = "true";

      const res = await getGrowthAnalyticsAPI(params);

      if (res.data?.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error("Error cargando analíticas de growth:", err);
      setError(err.response?.data?.message || err.message || "Error obteniendo datos de crecimiento.");
    } finally {
      setLoading(false);
    }
  }, [period, selectedStoreIds]);

  useEffect(() => {
    fetchGrowthData();
  }, [fetchGrowthData]);

  if (loading && !data) return <SkeletonLoader type="kpiRow" />;

  if (error) {
    return (
      <div className="fx-card-danger text-center my-6">
        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mx-auto mb-3 text-2xl">
          ⚠️
        </div>
        <h3 className="text-lg font-bold text-fx-text mb-1">Error al Cargar Growth & Comunidad</h3>
        <p className="text-fx-muted text-xs mb-4">{error}</p>
        <button
          onClick={() => fetchGrowthData(true)}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-fx-text rounded-xl text-xs font-bold transition-all shadow-lg"
        >
          🔄 Reintentar Cargar
        </button>
      </div>
    );
  }

  const kpis = data?.kpis || {};
  const cohorts = data?.cohortMatrix || [];
  const acquisitionTrend = data?.userAcquisitionTrend || [];
  const communityStats = data?.communityStats || {};
  const topBuyers = data?.topBuyers || [];
  const couponsRoi = data?.couponsRoi || [];
  const courses = data?.coursesPerformance || [];

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
          <CompareToggle isComparing={isComparing} onToggle={setIsComparing} />
          <AnalyticsExportButton activeArea="growth" period={period} />
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <DateRangePicker selectedPeriod={period} onPeriodChange={setPeriod} />
          <FreshnessBadge
            lastUpdated={data?.serverTimestamp}
            onRefresh={() => fetchGrowthData(true)}
            isLoading={loading}
          />
        </div>
      </div>

      {/* Grid de 6 Tarjetas KPI de Crecimiento & Retención */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 relative z-10">
        <KpiCard
          title="Compradores Únicos Activos"
          value={kpis.uniqueBuyersCount || 0}
          format="number"
          suffix=" compradores"
          tooltip="Mapeado en M39: Cantidad total de usuarios únicos que realizaron al menos una compra en el período."
          drilldownUrl="/admin/users"
        />
        <KpiCard
          title="Tasa de Recompra Recurrente"
          value={kpis.repurchaseRatePct || 0}
          format="percent"
          tooltip="Mapeado en M41: Porcentaje de compradores que han realizado 2 o más pedidos en la plataforma."
          drilldownUrl="/admin/orders"
        />
        <KpiCard
          title="Riesgo Concentración Top 10"
          value={kpis.top10RiskConcentrationPct || 0}
          format="percent"
          tooltip="Mapeado en M42: Porcentaje de ventas brutas (GMV) concentradas en los 10 principales comercios."
          drilldownUrl="/admin/store-applications"
        />
        <KpiCard
          title="Odontólogos Verificados"
          value={communityStats.verified_dentists_count || 0}
          format="number"
          suffix=" prof."
          tooltip="Profesionales dentistas validados con licencia médica verificada en la plataforma."
          drilldownUrl="/admin/professional-verifications"
        />
        <KpiCard
          title="Publicaciones en Comunidad"
          value={communityStats.active_posts_count || 0}
          format="number"
          suffix=" posts"
          tooltip="Contenido técnico, casos clínicos y publicaciones publicadas en el foro de comunidad."
          drilldownUrl="/admin/posts"
        />
      </div>

      {/* Gráfico Principal de Adquisición Diaria de Usuarios */}
      <ChartCard
        title="Tendencia Diaria de Adquisición de Usuarios y Profesionales"
        subtitle="Registros diarios de nuevos compradores y odontólogos en la plataforma"
        onTypeChange={setChartMode}
      >
        <ResponsiveContainer width="100%" height={260}>
          {chartMode === "bar" ? (
            <BarChart data={acquisitionTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff12" />
              <XAxis dataKey="date" stroke="#7b6c99" fontSize={11} />
              <YAxis stroke="#7b6c99" fontSize={11} />
              <Tooltip contentStyle={{ backgroundColor: "#0d0418", border: "1px solid #ffffff29", borderRadius: "10px", color: "#f4f1f8", fontSize: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.55)" }} />
              <Bar dataKey="new_buyers" name="Nuevos Compradores" fill="#c3ff00" radius={[4, 4, 0, 0]} />
              <Bar dataKey="new_professionals" name="Nuevos Odontólogos" fill="#a855f7" radius={[4, 4, 0, 0]} />
            </BarChart>
          ) : chartMode === "line" ? (
            <LineChart data={acquisitionTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff12" />
              <XAxis dataKey="date" stroke="#7b6c99" fontSize={11} />
              <YAxis stroke="#7b6c99" fontSize={11} />
              <Tooltip contentStyle={{ backgroundColor: "#0d0418", border: "1px solid #ffffff29", borderRadius: "10px", color: "#f4f1f8", fontSize: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.55)" }} />
              <Line type="monotone" dataKey="new_buyers" name="Nuevos Compradores" stroke="#c3ff00" strokeWidth={3} dot={false} />
              <Line type="monotone" dataKey="new_professionals" name="Nuevos Odontólogos" stroke="#a855f7" strokeWidth={2} dot={false} />
            </LineChart>
          ) : (
            <AreaChart data={acquisitionTrend}>
              <defs>
                <linearGradient id="colorBuyers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#c3ff00" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="#c3ff00" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff12" />
              <XAxis dataKey="date" stroke="#7b6c99" fontSize={11} />
              <YAxis stroke="#7b6c99" fontSize={11} />
              <Tooltip contentStyle={{ backgroundColor: "#0d0418", border: "1px solid #ffffff29", borderRadius: "10px", color: "#f4f1f8", fontSize: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.55)" }} />
              <Area type="monotone" dataKey="new_buyers" name="Nuevos Compradores" stroke="#c3ff00" strokeWidth={3} fillOpacity={1} fill="url(#colorBuyers)" />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </ChartCard>

      {/* Mapa de Calor de Cohortes de Retención (M40 - RPC M0 a M3) */}
      <RetentionCohortHeatmap cohortData={cohorts} />

      {/* Grid de ROI de Cupones y Top Compradores */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DataTable
          title="ROI de Cupones y Promociones Redimidas"
          columns={[
            {
              header: "Cupón",
              accessor: "coupon_code",
              render: (r) => (
                <button
                  onClick={() =>
                    drilldown.open("orders", {
                      title: `Pedidos con el cupón "${r.coupon_code}"`,
                      filters: { coupon_code: r.coupon_code, not_cancelled: true }
                    })
                  }
                  className="font-bold text-fx-accent uppercase font-mono hover:underline text-left"
                >
                  {r.coupon_code}
                </button>
              )
            },
            { header: "Usos", accessor: "redemptions", render: (r) => parseInt(r.redemptions || 0).toLocaleString() },
            { header: "Descuento Dado", accessor: "total_discounted", render: (r) => `$${parseFloat(r.total_discounted || 0).toFixed(2)}` },
            { header: "Ventas Generadas", accessor: "sales_generated", render: (r) => <span className="font-bold text-fx-text">${parseFloat(r.sales_generated || 0).toFixed(2)}</span> }
          ]}
          data={couponsRoi}
        />
        <DataTable
          title="Top Compradores Más Recurrentes"
          columns={[
            {
              header: "Cliente",
              accessor: "buyer_name",
              render: (r) => (
                <button
                  onClick={() =>
                    drilldown.open("orders", {
                      title: `Pedidos de ${r.buyer_name}`,
                      filters: { user_id: r.id, not_cancelled: true }
                    })
                  }
                  className="font-bold text-fx-accent hover:underline text-left"
                >
                  {r.buyer_name}
                </button>
              )
            },
            { header: "Email", accessor: "email", render: (r) => <span className="text-fx-faint font-mono text-xs">{r.email}</span> },
            { header: "Órdenes Totales", accessor: "total_orders", render: (r) => <span className="font-semibold text-fx-accent">{parseInt(r.total_orders || 0).toLocaleString()}</span> },
            { header: "Gasto Acumulado", accessor: "total_spent", render: (r) => `$${parseFloat(r.total_spent || 0).toFixed(2)}` }
          ]}
          data={topBuyers}
        />
      </div>

      {/* Rendimiento de Cursos de Formación */}
      <DataTable
        title="Interés en los Cursos de Formación"
        columns={[
          {
            header: "Título del Curso",
            accessor: "title",
            render: (r) => (
              <button
                onClick={() =>
                  drilldown.open("analytics_events", {
                    title: `Visitas al curso "${r.title}"`,
                    subtitle: "Cada evento course_view registrado en el período",
                    filters: { event_name: "course_view", course_id: r.id }
                  })
                }
                className="font-bold text-fx-accent hover:underline text-left"
              >
                {r.title}
              </button>
            )
          },
          { header: "Nivel", accessor: "level", render: (r) => <span className="text-fx-faint capitalize">{r.level || "—"}</span> },
          { header: "Acceso", accessor: "is_free", render: (r) => (r.is_free ? "Gratuito" : "De pago") },
          { header: "Visitas", accessor: "views", render: (r) => <span className="font-semibold text-fx-accent">{parseInt(r.views || 0).toLocaleString()}</span> },
          { header: "Personas", accessor: "unique_viewers", render: (r) => parseInt(r.unique_viewers || 0).toLocaleString() }
        ]}
        data={courses}
      />

      <DrilldownModal {...drilldown.props} period={period} />
    </div>
  );
}

GrowthCommunityTab.propTypes = {};
