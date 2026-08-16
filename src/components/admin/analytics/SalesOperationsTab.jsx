import { useState, useEffect, useCallback } from "react";
import { getSalesAnalyticsAPI, getStoresListAPI } from "../../../services/api";
import KpiCard from "./KpiCard";
import ChartCard from "./ChartCard";
import DataTable from "./DataTable";
import SkeletonLoader from "./SkeletonLoader";
import FreshnessBadge from "./FreshnessBadge";
import DateRangePicker from "./DateRangePicker";
import CompareToggle from "./CompareToggle";
import AnalyticsStoreFilter from "./AnalyticsStoreFilter";
import AnalyticsExportButton from "./AnalyticsExportButton";
import StoreActivationFunnel from "./StoreActivationFunnel";
import PriceAuditTimeline from "./PriceAuditTimeline";
import useDrilldown from "../../../hooks/useDrilldown";
import DrilldownModal from "./DrilldownModal";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar, LineChart, Line } from "recharts";

export default function SalesOperationsTab() {
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

  const fetchSalesData = useCallback(async (isRefresh = false) => {
    setLoading(true);
    setError(null);
    try {
      const params = { period };
      if (selectedStoreIds.length > 0) params.store_ids = selectedStoreIds.join(",");
      if (isRefresh) params.refresh = "true";

      const res = await getSalesAnalyticsAPI(params);

      if (res.data?.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error("Error cargando analíticas de ventas:", err);
      setError(err.response?.data?.message || err.message || "Error obteniendo datos de ventas.");
    } finally {
      setLoading(false);
    }
  }, [period, selectedStoreIds]);

  useEffect(() => {
    fetchSalesData();
  }, [fetchSalesData]);

  if (loading && !data) return <SkeletonLoader type="kpiRow" />;

  if (error) {
    return (
      <div className="fx-card-danger text-center my-6">
        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mx-auto mb-3 text-2xl">
          ⚠️
        </div>
        <h3 className="text-lg font-bold text-fx-text mb-1">Error al Cargar Ventas & Operaciones</h3>
        <p className="text-fx-muted text-xs mb-4">{error}</p>
        <button
          onClick={() => fetchSalesData(true)}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-fx-text rounded-xl text-xs font-bold transition-all shadow-lg"
        >
          🔄 Reintentar Cargar
        </button>
      </div>
    );
  }

  const storePerformance = data?.storePerformanceMatrix || [];
  const funnel = data?.storeActivationFunnel || {};
  const dormantCount = data?.dormantStoresCount || 0;
  const moderation = data?.catalogModeration || {};
  const lowStock = data?.lowStockProducts || [];
  const deadStockCount = data?.deadStockCount || 0;
  const inventoryRotation = data?.inventoryRotation || [];
  const priceTimeline = data?.priceAuditTimeline || [];
  const topProducts = data?.top10Products || [];
  const salesByCategory = data?.salesByCategory || [];
  const salesTrend = data?.salesTrend || [];

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
          <AnalyticsExportButton activeArea="sales" period={period} />
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <DateRangePicker selectedPeriod={period} onPeriodChange={setPeriod} />
          <FreshnessBadge
            lastUpdated={data?.serverTimestamp}
            onRefresh={() => fetchSalesData(true)}
            isLoading={loading}
          />
        </div>
      </div>

      {/* Grid de 4 Tarjetas KPI de Estado Operativo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
        <KpiCard
          title="Tiendas Dormidas (30D)"
          value={dormantCount}
          format="number"
          suffix=" tiendas"
          tooltip="Mapeado en M24: Cantidad de comercios aprobados que no han registrado ninguna venta en los últimos 30 días."
          drilldownUrl="/admin/store-applications"
        />
        <KpiCard
          title="Mod. Catálogo Pendiente"
          value={parseInt(moderation.pending_count || 0, 10)}
          format="number"
          suffix=" prod."
          tooltip="Mapeado en M25: Productos creados por tiendas a la espera de revisión y aprobación administrativa."
          drilldownUrl="/admin/product-moderation"
        />
        <KpiCard
          title="Tiempo Prom. Aprobación"
          value={parseFloat(moderation.avg_approval_hours || 0)}
          format="number"
          suffix=" hrs"
          tooltip="Mapeado en M25: Tiempo medio en horas que tarda el equipo en moderar un producto nuevo."
          drilldownUrl="/admin/product-moderation"
        />
        <KpiCard
          title="Stock Muerto (>60D)"
          value={deadStockCount}
          format="number"
          suffix=" prod."
          tooltip="Mapeado en M27: Productos sin ningún movimiento de inventario o venta en más de 60 días."
          drilldownUrl="/admin/product-moderation"
        />
      </div>

      {/* Gráfico Principal de Evolución Diaria de Ventas */}
      <ChartCard
        title="Evolución Diaria de Ventas Brutas y Unidades Vendidas"
        subtitle="Comportamiento del flujo diario de pedidos y volumen de insumos odontológicos"
        onTypeChange={setChartMode}
      >
        <ResponsiveContainer width="100%" height={260}>
          {chartMode === "bar" ? (
            <BarChart data={salesTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff12" />
              <XAxis dataKey="date" stroke="#7b6c99" fontSize={11} />
              <YAxis stroke="#7b6c99" fontSize={11} />
              <Tooltip contentStyle={{ backgroundColor: "#0d0418", border: "1px solid #ffffff29", borderRadius: "10px", color: "#f4f1f8", fontSize: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.55)" }} />
              <Bar dataKey="sales_volume" name="Ventas ($)" fill="#c3ff00" radius={[4, 4, 0, 0]} />
              <Bar dataKey="units_sold" name="Unidades" fill="#a855f7" radius={[4, 4, 0, 0]} />
            </BarChart>
          ) : chartMode === "line" ? (
            <LineChart data={salesTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff12" />
              <XAxis dataKey="date" stroke="#7b6c99" fontSize={11} />
              <YAxis stroke="#7b6c99" fontSize={11} />
              <Tooltip contentStyle={{ backgroundColor: "#0d0418", border: "1px solid #ffffff29", borderRadius: "10px", color: "#f4f1f8", fontSize: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.55)" }} />
              <Line type="monotone" dataKey="sales_volume" name="Ventas ($)" stroke="#c3ff00" strokeWidth={3} dot={false} />
              <Line type="monotone" dataKey="units_sold" name="Unidades" stroke="#a855f7" strokeWidth={2} dot={false} />
            </LineChart>
          ) : (
            <AreaChart data={salesTrend}>
              <defs>
                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#c3ff00" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="#c3ff00" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff12" />
              <XAxis dataKey="date" stroke="#7b6c99" fontSize={11} />
              <YAxis stroke="#7b6c99" fontSize={11} />
              <Tooltip contentStyle={{ backgroundColor: "#0d0418", border: "1px solid #ffffff29", borderRadius: "10px", color: "#f4f1f8", fontSize: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.55)" }} />
              <Area type="monotone" dataKey="sales_volume" name="Ventas ($)" stroke="#c3ff00" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </ChartCard>

      {/* Matriz de Rendimiento de Tiendas (M22) */}
      <DataTable
        title="Matriz de Rendimiento de Tiendas"
        columns={[
          {
            header: "Tienda / Comercio",
            accessor: "business_name",
            render: (r) => (
              <button
                onClick={() =>
                  drilldown.open("order_items", {
                    title: `Ventas de "${r.business_name}"`,
                    subtitle: "Ítems de pedido de esta tienda en el período",
                    filters: { store_id: r.store_id }
                  })
                }
                className="font-bold text-fx-accent hover:underline text-left"
              >
                {r.business_name}
              </button>
            )
          },
          { header: "Ventas Brutas (GMV)", accessor: "total_gmv", render: (r) => `$${parseFloat(r.total_gmv || 0).toFixed(2)}` },
          { header: "Órdenes", accessor: "total_orders", render: (r) => parseInt(r.total_orders || 0).toLocaleString() },
          { header: "Tasa Cancelación", accessor: "cancel_rate", render: (r) => <span className={`font-semibold ${parseFloat(r.cancel_rate) > 5 ? "text-rose-400" : "text-emerald-400"}`}>{parseFloat(r.cancel_rate || 0).toFixed(2)}%</span> },
          { header: "Rating Promedio", accessor: "rating_avg", render: (r) => <span className="text-amber-300 font-bold">{r.rating_avg != null ? `★ ${parseFloat(r.rating_avg).toFixed(1)}` : "★ N/A"}</span> },
        ]}
        data={storePerformance}
      />

      {/* Grid de Funnel de Activación y Timeline de Auditoría */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <StoreActivationFunnel funnelData={funnel} />
        <PriceAuditTimeline timelineData={priceTimeline} />
      </div>

      {/* Grid de Alertas de Stock y Rotación por Categoría */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DataTable
          title="Stock en Riesgo (Variaciones con <= 5 unidades)"
          columns={[
            { header: "Producto", accessor: "product_name", render: (r) => <span className="font-semibold text-fx-muted">{r.product_name}</span> },
            { header: "SKU", accessor: "sku", render: (r) => <span className="font-mono text-[11px] text-fx-faint">{r.sku || "—"}</span> },
            { header: "Stock Restante", accessor: "stock", render: (r) => <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">{r.stock} un.</span> },
          ]}
          data={lowStock}
        />

        <DataTable
          title="Rotación de Inventario por Categoría"
          columns={[
            { header: "Categoría", accessor: "category_name", render: (r) => <span className="font-bold text-fx-text">{r.category_name}</span> },
            { header: "Unidades Vendidas", accessor: "units_sold", render: (r) => parseInt(r.units_sold || 0).toLocaleString() },
            { header: "Índice Rotación", accessor: "rotation_rate", render: (r) => <span className="text-fx-accent font-bold">{parseFloat(r.rotation_rate || 0).toFixed(2)}x</span> },
          ]}
          data={inventoryRotation}
        />
      </div>

      {/* Grid de Top Productos y Ventas por Categoría */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DataTable
          title="Top 10 Productos Más Vendidos"
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
                      filters: { product_id: r.id }
                    })
                  }
                  className="font-bold text-fx-accent hover:underline text-left"
                >
                  {r.name}
                </button>
              )
            },
            { header: "Unidades Vendidas", accessor: "total_units", render: (r) => parseInt(r.total_units || 0).toLocaleString() },
            { header: "Ingreso Bruto", accessor: "total_revenue", render: (r) => `$${parseFloat(r.total_revenue || 0).toFixed(2)}` },
          ]}
          data={topProducts}
        />

        <DataTable
          title="Ventas por Categoría de Producto"
          columns={[
            { header: "Categoría", accessor: "category_name", render: (r) => <span className="font-bold text-fx-text">{r.category_name}</span> },
            { header: "GMV", accessor: "total_sales", render: (r) => `$${parseFloat(r.total_sales || 0).toFixed(2)}` },
            { header: "Unidades", accessor: "total_units", render: (r) => parseInt(r.total_units || 0).toLocaleString() },
          ]}
          data={salesByCategory}
        />
      </div>

      <DrilldownModal {...drilldown.props} period={period} />
    </div>
  );
}

SalesOperationsTab.propTypes = {};
