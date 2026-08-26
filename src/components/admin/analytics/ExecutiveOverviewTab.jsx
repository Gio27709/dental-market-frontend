import { useState, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import { getExecutiveAnalyticsAPI, getStoresListAPI } from "../../../services/api";
import KpiCard from "./KpiCard";
import ChartCard from "./ChartCard";
import DataTable from "./DataTable";
import SkeletonLoader from "./SkeletonLoader";
import FreshnessBadge from "./FreshnessBadge";
import GlobalAlertHeaderBanner from "./GlobalAlertHeaderBanner";
import DateRangePicker from "./DateRangePicker";
import CompareToggle from "./CompareToggle";
import AnalyticsStoreFilter from "./AnalyticsStoreFilter";
import AnalyticsExportButton from "./AnalyticsExportButton";
import GmvDrilldownModal from "./GmvDrilldownModal";
import useDrilldown from "../../../hooks/useDrilldown";
import DrilldownModal from "./DrilldownModal";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar, LineChart, Line } from "recharts";

export default function ExecutiveOverviewTab({ onNavigateTab }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [storeList, setStoreList] = useState([]);
  const [isGmvModalOpen, setIsGmvModalOpen] = useState(false);

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

  const fetchExecutiveData = useCallback(async (isRefresh = false) => {
    setLoading(true);
    try {
      const params = { period };
      if (selectedStoreIds.length > 0) params.store_ids = selectedStoreIds.join(",");
      if (isRefresh) params.refresh = "true";

      const res = await getExecutiveAnalyticsAPI(params);

      if (res.data?.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error("Error cargando Executive Overview:", err);
    } finally {
      setLoading(false);
    }
  }, [period, selectedStoreIds]);

  useEffect(() => {
    fetchExecutiveData();
  }, [fetchExecutiveData]);

  if (loading && !data) return <SkeletonLoader type="kpiRow" />;

  const kpis = data?.kpis || {};
  const backlog = data?.backlog || {};
  const alerts = data?.activeAlertRules || [];
  const feed = data?.recentActivityFeed || [];
  const revenueChart = data?.revenueChart || [];
  const topStores = data?.topStores || [];
  const topProducts = data?.topProducts || [];

  return (
    <div className="space-y-6">
      {/* Banner Global de Alertas Proactivas */}
      <GlobalAlertHeaderBanner alerts={alerts} />

      {/* Header Controls Row */}
      <div className="relative z-30 flex flex-col md:flex-row md:items-center justify-between gap-4 fx-card-sm">
        <div className="flex items-center gap-3 flex-wrap">
          <AnalyticsStoreFilter
            storeList={storeList}
            selectedStoreIds={selectedStoreIds}
            onStoreChange={setSelectedStoreIds}
          />
          <CompareToggle isComparing={isComparing} onToggle={setIsComparing} />
          <AnalyticsExportButton activeArea="executive" period={period} />
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <DateRangePicker selectedPeriod={period} onPeriodChange={setPeriod} />
          <FreshnessBadge
            lastUpdated={data?.serverTimestamp}
            onRefresh={() => fetchExecutiveData(true)}
            isLoading={loading}
          />
        </div>
      </div>

      {/* Grid de 8 Tarjetas KPI (M01 a M08) con botones de Ver Detalle → */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
        <KpiCard
          title="GMV (Ventas Brutas)"
          value={kpis.gmv?.value || 0}
          previous={isComparing ? kpis.gmv?.previous : null}
          deltaPct={isComparing ? kpis.gmv?.deltaPct : null}
          format="currency"
          tooltip="Mapeado en M01: Haz clic para ver la Landing Page de Detalle Analítico a pantalla completa."
          drilldownUrl="/admin/analytics/sales-detail"
        />

        <KpiCard
          title="Ingresos Plataforma"
          value={kpis.platformRevenue?.value || 0}
          previous={isComparing ? kpis.platformRevenue?.previous : null}
          deltaPct={isComparing ? kpis.platformRevenue?.deltaPct : null}
          format="currency"
          tooltip="Mapeado en M02: Haz clic para ir a las analíticas detalladas de Finanzas & Escrow."
          onDrilldown={() => onNavigateTab && onNavigateTab("financials")}
        />

        <KpiCard
          title="Take Rate %"
          value={kpis.takeRatePct?.value || 0}
          previous={isComparing ? kpis.takeRatePct?.previous : null}
          deltaPct={isComparing ? kpis.takeRatePct?.deltaPct : null}
          format="percent"
          tooltip="Mapeado en M03: Haz clic para examinar la tendencia semanal de comisiones en Finanzas."
          onDrilldown={() => onNavigateTab && onNavigateTab("financials")}
        />

        <KpiCard
          title="Órdenes Totales"
          value={kpis.totalOrders?.value || 0}
          previous={isComparing ? kpis.totalOrders?.previous : null}
          deltaPct={isComparing ? kpis.totalOrders?.deltaPct : null}
          format="number"
          tooltip="Mapeado en M04: Haz clic para abrir el detalle completo de ventas y pedidos."
          drilldownUrl="/admin/analytics/sales-detail"
        />

        <KpiCard
          title="Ticket Promedio (AOV)"
          value={kpis.aov?.value || 0}
          previous={isComparing ? kpis.aov?.previous : null}
          deltaPct={isComparing ? kpis.aov?.deltaPct : null}
          format="currency"
          tooltip="Mapeado en M05: Haz clic para ir a Ventas & Operaciones."
          onDrilldown={() => onNavigateTab && onNavigateTab("sales")}
        />

        <KpiCard
          title="Liquidez del Mercado"
          value={kpis.marketLiquidityRatio || 0}
          format="number"
          suffix=" comp/tienda"
          tooltip="Mapeado en M06: Promedio de compradores activos por cada tienda registrada."
          onDrilldown={() => onNavigateTab && onNavigateTab("sales")}
        />

        <KpiCard
          title="Tasa de Recompra %"
          value={kpis.repurchaseRatePct || 0}
          format="percent"
          tooltip="Mapeado en M07: Haz clic para ver retención y cohorte en Growth & Comunidad."
          onDrilldown={() => onNavigateTab && onNavigateTab("growth")}
        />

        <KpiCard
          title="Riesgo Concentración Top 10"
          value={kpis.top10RiskConcentrationPct || 0}
          format="percent"
          tooltip="Mapeado en M08: Haz clic para analizar riesgo de concentración en Growth."
          onDrilldown={() => onNavigateTab && onNavigateTab("growth")}
        />
      </div>

      {/* Modal de Desglose de GMV */}
      <GmvDrilldownModal
        isOpen={isGmvModalOpen}
        onClose={() => setIsGmvModalOpen(false)}
        period={period}
      />

      {/* Gráfico Principal de Evolución de Ingresos y GMV */}
      <ChartCard
        title="Evolución de GMV e Ingresos Netos de la Plataforma"
        subtitle="Mapeado en M01 y M02: Comportamiento transaccional a lo largo del tiempo"
        onTypeChange={setChartMode}
      >
        <ResponsiveContainer width="100%" height={280}>
          {chartMode === "bar" ? (
            <BarChart data={revenueChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="#00000010" />
              <XAxis dataKey="date" stroke="#877f92" fontSize={11} />
              <YAxis stroke="#877f92" fontSize={11} />
              <Tooltip contentStyle={{ backgroundColor: "#f7f4fc", border: "1px solid #00000020", borderRadius: "10px", color: "#33243d", fontSize: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.55)" }} />
              <Bar dataKey="gmv" name="GMV ($)" fill="#7c4f9e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="platform_revenue" name="Ingreso Neto ($)" fill="#6b1e96" radius={[4, 4, 0, 0]} />
            </BarChart>
          ) : chartMode === "line" ? (
            <LineChart data={revenueChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="#00000010" />
              <XAxis dataKey="date" stroke="#877f92" fontSize={11} />
              <YAxis stroke="#877f92" fontSize={11} />
              <Tooltip contentStyle={{ backgroundColor: "#f7f4fc", border: "1px solid #00000020", borderRadius: "10px", color: "#33243d", fontSize: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.55)" }} />
              <Line type="monotone" dataKey="gmv" name="GMV ($)" stroke="#7c4f9e" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="platform_revenue" name="Ingreso Neto ($)" stroke="#6b1e96" strokeWidth={3} dot={false} />
            </LineChart>
          ) : (
            <AreaChart data={revenueChart}>
              <defs>
                <linearGradient id="colorGmv" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7c4f9e" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#7c4f9e" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6b1e96" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="#6b1e96" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#00000010" />
              <XAxis dataKey="date" stroke="#877f92" fontSize={11} />
              <YAxis stroke="#877f92" fontSize={11} />
              <Tooltip contentStyle={{ backgroundColor: "#f7f4fc", border: "1px solid #00000020", borderRadius: "10px", color: "#33243d", fontSize: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.55)" }} />
              <Area type="monotone" dataKey="gmv" name="GMV ($)" stroke="#7c4f9e" fillOpacity={1} fill="url(#colorGmv)" />
              <Area type="monotone" dataKey="platform_revenue" name="Ingreso Neto ($)" stroke="#6b1e96" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </ChartCard>

      {/* Backlog Operativo Crítico (5 Chips Clicables - M09) */}
      <div className="bg-fx-panel border border-fx-line rounded-xl p-5">
        <h4 className="text-xs font-bold text-fx-muted uppercase tracking-wider mb-3">
          Backlog Operativo en Tiempo Real (Pendientes de Acción)
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          <div onClick={() => (window.location.href = "/admin/payment-approvals")} className="cursor-pointer bg-fx-inset border border-fx-line hover:border-fx-warn/40 p-3 rounded-2xl transition-all">
            <span className="text-[10px] text-fx-muted block font-semibold">Pagos por Aprobar</span>
            <span className="text-xl font-semibold text-fx-warn">{backlog.pending_payments || 0}</span>
          </div>
          <div onClick={() => (window.location.href = "/admin/payouts")} className="cursor-pointer bg-fx-inset border border-fx-line hover:border-fx-warn/40 p-3 rounded-2xl transition-all">
            <span className="text-[10px] text-fx-muted block font-semibold">Retiros Pendientes</span>
            <span className="text-xl font-semibold text-fx-warn">{backlog.pending_payouts || 0}</span>
          </div>
          <div onClick={() => (window.location.href = "/admin/professional-verifications")} className="cursor-pointer bg-fx-inset border border-fx-line hover:border-fx-info/40 p-3 rounded-2xl transition-all">
            <span className="text-[10px] text-fx-muted block font-semibold">Verif. Médicas</span>
            <span className="text-xl font-semibold text-fx-info">{backlog.pending_verifications || 0}</span>
          </div>
          <div onClick={() => (window.location.href = "/admin/product-moderation")} className="cursor-pointer bg-fx-inset border border-fx-line hover:border-fx-violet/40 p-3 rounded-2xl transition-all">
            <span className="text-[10px] text-fx-muted block font-semibold">Mod. Productos</span>
            <span className="text-xl font-semibold text-fx-faint">{backlog.pending_products || 0}</span>
          </div>
          <div onClick={() => (window.location.href = "/admin/support")} className="cursor-pointer bg-fx-inset border border-fx-line hover:border-fx-neg/40 p-3 rounded-2xl transition-all">
            <span className="text-[10px] text-fx-muted block font-semibold">Tickets Abiertos</span>
            <span className="text-xl font-semibold text-fx-neg">{backlog.open_tickets || 0}</span>
          </div>
        </div>
      </div>

      {/* Grid de Top Tiendas y Top Productos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DataTable
          title="Top 5 Tiendas por GMV"
          columns={[
            {
              header: "Comercio",
              accessor: "name",
              render: (r) => (
                <button
                  onClick={() =>
                    drilldown.open("order_items", {
                      title: `Ventas de "${r.name}"`,
                      subtitle: "Ítems vendidos por esta tienda en el período",
                      filters: { store_id: r.id, not_cancelled: true }
                    })
                  }
                  className="font-bold text-fx-accent hover:underline text-left"
                >
                  {r.name}
                </button>
              )
            },
            { header: "Órdenes", accessor: "orders", render: (r) => parseInt(r.orders || 0).toLocaleString() },
            { header: "GMV Total", accessor: "gmv", render: (r) => `$${parseFloat(r.gmv || 0).toFixed(2)}` },
          ]}
          data={topStores}
        />
        <DataTable
          title="Top 5 Productos por Ventas"
          columns={[
            {
              header: "Producto",
              accessor: "name",
              render: (r) => (
                <button
                  onClick={() =>
                    drilldown.open("order_items", {
                      title: `Ventas de "${r.name}"`,
                      subtitle: "Cada línea de pedido que compone este total",
                      filters: { product_id: r.id, not_cancelled: true }
                    })
                  }
                  className="font-semibold text-fx-accent hover:underline text-left"
                >
                  {r.name}
                </button>
              )
            },
            { header: "Unidades", accessor: "units", render: (r) => parseInt(r.units || 0).toLocaleString() },
            { header: "Ingreso", accessor: "revenue", render: (r) => `$${parseFloat(r.revenue || 0).toFixed(2)}` },
          ]}
          data={topProducts}
        />
      </div>

      {/* Feed de Actividad Reciente (M11) */}
      <DataTable
        title="Feed de Actividad Transaccional Reciente"
        columns={[
          { header: "Tipo", accessor: "event_type", render: (r) => <span className="uppercase font-bold text-fx-accent text-[10px] bg-[#6b1e96]/10 px-2 py-0.5 rounded-full border border-fx-accent/20">{r.event_type}</span> },
          { header: "Referencia ID", accessor: "reference_id", render: (r) => <span className="font-mono text-fx-faint">{r.reference_id}</span> },
          { header: "Fecha / Hora", accessor: "created_at", render: (r) => new Date(r.created_at).toLocaleString("es-VE") },
        ]}
        data={feed}
      />

      <DrilldownModal {...drilldown.props} period={period} storeIds={selectedStoreIds} />
    </div>
  );
}

ExecutiveOverviewTab.propTypes = {
  onNavigateTab: PropTypes.func
};
