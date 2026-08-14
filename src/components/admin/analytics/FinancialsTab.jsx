import { useState, useEffect, useCallback } from "react";
import { getFinancialsAnalyticsAPI, getStoresListAPI } from "../../../services/api";
import KpiCard from "./KpiCard";
import ChartCard from "./ChartCard";
import DataTable from "./DataTable";
import SkeletonLoader from "./SkeletonLoader";
import FreshnessBadge from "./FreshnessBadge";
import DateRangePicker from "./DateRangePicker";
import AnalyticsStoreFilter from "./AnalyticsStoreFilter";
import AnalyticsExportButton from "./AnalyticsExportButton";
import EscrowAgingStackedBar from "./EscrowAgingStackedBar";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar, LineChart, Line } from "recharts";

export default function FinancialsTab() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [storeList, setStoreList] = useState([]);

  const [period, setPeriod] = useState("30d");
  const [selectedStoreIds, setSelectedStoreIds] = useState([]);
  const [chartMode, setChartMode] = useState("line");

  useEffect(() => {
    getStoresListAPI()
      .then((res) => {
        if (res.data?.data) setStoreList(res.data.data);
      })
      .catch((err) => console.error("Error cargando lista de tiendas:", err));
  }, []);

  const fetchFinancialsData = useCallback(async (isRefresh = false) => {
    setLoading(true);
    setError(null);
    try {
      const params = { period };
      if (selectedStoreIds.length > 0) params.store_ids = selectedStoreIds.join(",");
      if (isRefresh) params.refresh = "true";

      const res = await getFinancialsAnalyticsAPI(params);

      if (res.data?.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error("Error cargando analíticas financieras:", err);
      setError(err.response?.data?.message || err.message || "Error obteniendo datos financieros.");
    } finally {
      setLoading(false);
    }
  }, [period, selectedStoreIds]);

  useEffect(() => {
    fetchFinancialsData();
  }, [fetchFinancialsData]);

  if (loading && !data) return <SkeletonLoader type="kpiRow" />;

  if (error) {
    return (
      <div className="fx-card-danger text-center my-6">
        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mx-auto mb-3 text-2xl">
          ⚠️
        </div>
        <h3 className="text-lg font-bold text-fx-text mb-1">Error al Cargar Finanzas & Escrow</h3>
        <p className="text-fx-muted text-xs mb-4">{error}</p>
        <button
          onClick={() => fetchFinancialsData(true)}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-fx-text rounded-xl text-xs font-bold transition-all shadow-lg"
        >
          🔄 Reintentar Cargar
        </button>
      </div>
    );
  }

  const escrow = data?.escrow || {};
  const payouts = data?.payouts || {};
  const paymentMix = data?.paymentMethodMix || [];
  const refunds = data?.refunds || {};
  const takeRateTrend = data?.takeRateTrend || [];
  const categoryRevenue = data?.revenueByCategory || [];

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
          <AnalyticsExportButton activeArea="financials" period={period} />
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <DateRangePicker selectedPeriod={period} onPeriodChange={setPeriod} />
          <FreshnessBadge
            lastUpdated={data?.serverTimestamp}
            onRefresh={() => fetchFinancialsData(true)}
            isLoading={loading}
          />
        </div>
      </div>

      {/* Grid de 6 Tarjetas KPI de Salud Financiera */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 relative z-10">
        <KpiCard
          title="Escrow Total Retenido"
          value={escrow.totalEscrowUsd || 0}
          format="currency"
          tooltip="Mapeado en M12: Suma de dinero retenido en la plataforma en custodia escrow."
          drilldownUrl="/admin/payouts"
        />
        <KpiCard
          title="Retiros Pendientes"
          value={payouts.pendingTotalUsd || 0}
          format="currency"
          tooltip="Mapeado en M14: Monto acumulado de solicitudes de retiro de tiendas en espera de liquidación."
          drilldownUrl="/admin/payouts"
        />
        <KpiCard
          title="Retiros Liquidados"
          value={payouts.completedTotalUsd || 0}
          format="currency"
          tooltip="Mapeado en M15: Suma total de dinero transferido exitosamente a comercios."
          drilldownUrl="/admin/payment-history"
        />
        <KpiCard
          title="Tiempo Prom. Procesamiento"
          value={payouts.avgProcessingTimeHours || 0}
          format="number"
          suffix=" hrs"
          tooltip="Mapeado en M16: Horas promedio transcurridas desde la solicitud hasta el pago del retiro."
          drilldownUrl="/admin/payouts"
        />
        <KpiCard
          title="Reembolsos Procesados"
          value={refunds.totalRefundedUsd || 0}
          format="currency"
          tooltip="Mapeado en M18: Monto de dinero reembolsado a compradores por disputas aprobadas."
          drilldownUrl="/admin/refunds"
        />
        <KpiCard
          title="Comisiones en Tránsito"
          value={data?.commissionsInTransitUsd || 0}
          format="currency"
          tooltip="Mapeado en M21: Tarifa de plataforma en pedidos despachados en camino de entrega."
          drilldownUrl="/admin/orders"
        />
      </div>

      {/* Aging de Escrow (Custodia de Fondos - M13) */}
      <EscrowAgingStackedBar agingData={escrow.agingBuckets} />

      {/* Gráfico Principal de Tendencia de Take Rate Semanal (M19) */}
      <ChartCard
        title="Tendencia de Take Rate Neto Semanal (%)"
        subtitle="Comportamiento porcentual del margen de comisión retenido por Forcepx"
        onTypeChange={setChartMode}
      >
        <ResponsiveContainer width="100%" height={260}>
          {chartMode === "bar" ? (
            <BarChart data={takeRateTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff12" />
              <XAxis dataKey="week_start" stroke="#7b6c99" fontSize={11} />
              <YAxis stroke="#7b6c99" fontSize={11} />
              <Tooltip contentStyle={{ backgroundColor: "#0d0418", border: "1px solid #ffffff29", borderRadius: "10px", color: "#f4f1f8", fontSize: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.55)" }} />
              <Bar dataKey="take_rate_pct" name="Take Rate (%)" fill="#c3ff00" radius={[4, 4, 0, 0]} />
            </BarChart>
          ) : chartMode === "area" ? (
            <AreaChart data={takeRateTrend}>
              <defs>
                <linearGradient id="colorTakeRate" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#c3ff00" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="#c3ff00" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff12" />
              <XAxis dataKey="week_start" stroke="#7b6c99" fontSize={11} />
              <YAxis stroke="#7b6c99" fontSize={11} />
              <Tooltip contentStyle={{ backgroundColor: "#0d0418", border: "1px solid #ffffff29", borderRadius: "10px", color: "#f4f1f8", fontSize: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.55)" }} />
              <Area type="monotone" dataKey="take_rate_pct" name="Take Rate (%)" stroke="#c3ff00" strokeWidth={3} fillOpacity={1} fill="url(#colorTakeRate)" />
            </AreaChart>
          ) : (
            <LineChart data={takeRateTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff12" />
              <XAxis dataKey="week_start" stroke="#7b6c99" fontSize={11} />
              <YAxis stroke="#7b6c99" fontSize={11} />
              <Tooltip contentStyle={{ backgroundColor: "#0d0418", border: "1px solid #ffffff29", borderRadius: "10px", color: "#f4f1f8", fontSize: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.55)" }} />
              <Line type="monotone" dataKey="take_rate_pct" name="Take Rate (%)" stroke="#c3ff00" strokeWidth={3} dot={{ r: 4, fill: "#c3ff00" }} />
            </LineChart>
          )}
        </ResponsiveContainer>
      </ChartCard>

      {/* Grid de Mix de Métodos de Pago y Rentabilidad por Categoría */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DataTable
          title="Mix por Método de Pago Utilizado"
          columns={[
            { header: "Método de Pago", accessor: "payment_method", render: (r) => <span className="font-bold uppercase text-fx-text">{r.payment_method}</span> },
            { header: "Órdenes", accessor: "order_count", render: (r) => parseInt(r.order_count || 0).toLocaleString() },
            { header: "Monto Procesado", accessor: "total_usd", render: (r) => `$${parseFloat(r.total_usd || 0).toFixed(2)}` },
          ]}
          data={paymentMix}
        />
        <DataTable
          title="Ingresos de la Plataforma por Categoría"
          columns={[
            { header: "Categoría de Producto", accessor: "category_name", render: (r) => <span className="font-bold text-fx-text">{r.category_name}</span> },
            { header: "Comisión Ganada", accessor: "platform_revenue", render: (r) => <span className="font-semibold text-fx-accent">${parseFloat(r.platform_revenue || 0).toFixed(2)}</span> },
          ]}
          data={categoryRevenue}
        />
      </div>
    </div>
  );
}

FinancialsTab.propTypes = {};
