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
import useDrilldown from "../../../hooks/useDrilldown";
import DrilldownModal from "./DrilldownModal";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar, LineChart, Line } from "recharts";

const money = (v) => {
  const n = parseFloat(v || 0);
  const s = Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${n < 0 ? "-" : ""}$${s}`;
};

export default function FinancialsTab() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [storeList, setStoreList] = useState([]);

  const [period, setPeriod] = useState("30d");
  const [selectedStoreIds, setSelectedStoreIds] = useState([]);
  const [chartMode, setChartMode] = useState("line");
  const drilldown = useDrilldown();

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
        <div className="w-12 h-12 rounded-2xl bg-fx-neg/10 border border-fx-neg/20 flex items-center justify-center text-fx-neg mx-auto mb-3 text-2xl">
          ⚠️
        </div>
        <h3 className="text-lg font-bold text-fx-text mb-1">Error al Cargar Finanzas & Escrow</h3>
        <p className="text-fx-muted text-xs mb-4">{error}</p>
        <button
          onClick={() => fetchFinancialsData(true)}
          className="px-4 py-2 bg-[#6b1e96] hover:bg-[#531575] text-white rounded-xl text-xs font-bold transition-all shadow-lg"
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

      {/* Grid de Tarjetas KPI de Salud Financiera */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 relative z-10">
        <KpiCard
          title="Retiros Pendientes"
          value={payouts.pendingTotalUsd || 0}
          format="currency"
          tooltip="Mapeado en M14: Monto acumulado de solicitudes de retiro de tiendas en espera de liquidación."
          onDrilldown={() =>
            drilldown.open("payout_requests", {
              title: "Retiros pendientes de liquidar",
              filters: { status: "pending", allTime: true }
            })
          }
        />
        <KpiCard
          title="Retiros Liquidados"
          value={payouts.completedTotalUsd || 0}
          format="currency"
          tooltip="Mapeado en M15: Suma total de dinero transferido exitosamente a comercios."
          onDrilldown={() =>
            drilldown.open("payout_requests", {
              title: "Retiros liquidados en el período",
              subtitle: "Acotados por su fecha de pago, igual que el monto de la tarjeta",
              // dateBy=settled fecha por updated_at (la liquidación). Sin esto el modal
              // acotaba por la fecha de solicitud y listaba otro conjunto.
              filters: { status: "completed", dateBy: "settled" }
            })
          }
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
          tooltip="Mapeado en M18: Monto ya devuelto a compradores por solicitudes de reembolso completadas."
          onDrilldown={() =>
            drilldown.open("refund_requests", {
              title: "Reembolsos completados en el período",
              subtitle: "Acotados por la fecha en que se devolvió el dinero",
              filters: { status: "completed", dateBy: "settled" }
            })
          }
        />
        <KpiCard
          title="Comisiones en Tránsito"
          value={data?.commissionsInTransitUsd || 0}
          format="currency"
          tooltip="Mapeado en M21: Tarifa de plataforma en pedidos despachados en camino de entrega."
          onDrilldown={() =>
            drilldown.open("order_items", {
              title: "Ítems despachados en tránsito",
              subtitle: "Pedidos cuya comisión aún no se ha consolidado",
              filters: { delivery_status: "shipped", not_cancelled: true }
            })
          }
        />
      </div>

      {/* Custodia de fondos: cuánto retenemos, de quién es y desde cuándo (M12/M13) */}
      <div className="space-y-4">
        <div>
          <h3 className="text-base font-bold text-fx-text">Custodia de Fondos (Escrow)</h3>
          <p className="text-[11px] text-fx-muted">
            Dinero cobrado al comprador que la plataforma todavía guarda. Es deuda con las tiendas.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
          <KpiCard
            title="Retenido Ahora"
            value={escrow.totalEscrowUsd || 0}
            format="currency"
            suffix={` · ${escrow.liveItems || 0} ítems`}
            tooltip="Dinero cobrado y no liberado todavía: la suma de lo que va en camino y lo que la tienda ya puede reclamar. Excluye el legado anterior al arranque del escrow."
            onDrilldown={() =>
              drilldown.open("escrow_items", {
                title: "Todo el dinero retenido ahora",
                subtitle: "Ítems cobrados que aún no se han liberado",
                filters: { live: true, allTime: true }
              })
            }
          />
          <KpiCard
            title="Ya Exigible"
            value={escrow.claimableUsd || 0}
            format="currency"
            tooltip="Entregado al comprador y aún sin liberar. La tienda ya puede reclamar este dinero: es la parte que de verdad urge."
            onDrilldown={() =>
              drilldown.open("escrow_items", {
                title: "Entregado y sin liberar",
                subtitle: "La tienda ya puede reclamar este dinero",
                filters: { escrow_class: "claimable", allTime: true }
              })
            }
          />
          <KpiCard
            title="En Tránsito"
            value={escrow.inTransitUsd || 0}
            format="currency"
            tooltip="Cobrado pero todavía sin entregar. Está retenido con razón: la tienda aún no ha cumplido."
            onDrilldown={() =>
              drilldown.open("escrow_items", {
                title: "Cobrado y aún sin entregar",
                filters: { escrow_class: "in_transit", allTime: true }
              })
            }
          />
          <KpiCard
            title="Legado Pre-Escrow"
            value={escrow.legacyUsd || 0}
            format="currency"
            suffix={` · ${escrow.legacyItems || 0} ítems`}
            tooltip="Entregado antes de que el escrow existiera (1 de junio de 2026). Se liquidó por fuera del sistema y no se paga por esta vía; se muestra para que el descuadre no quede invisible."
            onDrilldown={() =>
              drilldown.open("escrow_items", {
                title: "Legado anterior al escrow",
                subtitle: "Entregado antes del 1 de junio de 2026 y nunca liberado",
                filters: { escrow_class: "legacy", allTime: true }
              })
            }
          />
        </div>

        <EscrowAgingStackedBar agingData={escrow.agingBuckets} />

        <DataTable
          title="Escrow por Tienda"
          subtitle="A quién le debemos el dinero retenido, desde cuándo, y si su billetera lo refleja."
          searchPlaceholder="Buscar tienda..."
          emptyMessage="Ninguna tienda tiene dinero retenido."
          data={escrow.byStore || []}
          columns={[
            {
              header: "Tienda",
              accessor: "store_name",
              render: (r) => (
                <button
                  onClick={() =>
                    drilldown.open("escrow_items", {
                      title: `Escrow retenido de "${r.store_name}"`,
                      filters: { store_id: r.store_id, allTime: true }
                    })
                  }
                  className="text-fx-text hover:text-fx-accent font-semibold transition-colors text-left"
                >
                  {r.store_name}
                </button>
              )
            },
            { header: "Ítems", accessor: "items" },
            { header: "En tránsito", render: (r) => money(r.in_transit) },
            {
              header: "Exigible",
              render: (r) => (
                <span className={Number(r.claimable) > 0 ? "text-amber-300 font-semibold" : "text-fx-muted"}>
                  {money(r.claimable)}
                </span>
              )
            },
            { header: "Retenido", render: (r) => <span className="font-bold text-fx-text">{money(r.retained)}</span> },
            { header: "Legado", render: (r) => <span className="text-fx-muted">{money(r.legacy)}</span> },
            {
              header: "Más antiguo",
              render: (r) => (
                <span className={Number(r.oldest_days) > 30 ? "text-rose-300" : "text-fx-muted"}>
                  {Number(r.oldest_days) || 0} días
                </span>
              )
            },
            {
              // La billetera solo se actualiza cuando un admin la reconcilia a mano: la
              // diferencia contra lo retenido delata las que llevan tiempo sin cuadrar.
              header: "Su billetera dice",
              render: (r) => {
                const cuadra = Number(r.wallet_pending) === Number(r.retained);
                return (
                  <span className={cuadra ? "text-emerald-300" : "text-rose-300 font-semibold"}>
                    {money(r.wallet_pending)}{cuadra ? " · cuadra" : " · descuadre"}
                  </span>
                );
              }
            }
          ]}
        />
      </div>

      {/* Gráfico Principal de Tendencia de Take Rate Semanal (M19) */}
      <ChartCard
        title="Tendencia de Take Rate Neto Semanal (%)"
        subtitle="Comportamiento porcentual del margen de comisión retenido por Forcepx"
        onTypeChange={setChartMode}
      >
        <ResponsiveContainer width="100%" height={260}>
          {chartMode === "bar" ? (
            <BarChart data={takeRateTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#00000010" />
              <XAxis dataKey="week_start" stroke="#877f92" fontSize={11} />
              <YAxis stroke="#877f92" fontSize={11} />
              <Tooltip contentStyle={{ backgroundColor: "#f7f4fc", border: "1px solid #00000020", borderRadius: "10px", color: "#33243d", fontSize: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.55)" }} />
              <Bar dataKey="take_rate_pct" name="Take Rate (%)" fill="#6b1e96" radius={[4, 4, 0, 0]} />
            </BarChart>
          ) : chartMode === "area" ? (
            <AreaChart data={takeRateTrend}>
              <defs>
                <linearGradient id="colorTakeRate" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6b1e96" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="#6b1e96" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#00000010" />
              <XAxis dataKey="week_start" stroke="#877f92" fontSize={11} />
              <YAxis stroke="#877f92" fontSize={11} />
              <Tooltip contentStyle={{ backgroundColor: "#f7f4fc", border: "1px solid #00000020", borderRadius: "10px", color: "#33243d", fontSize: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.55)" }} />
              <Area type="monotone" dataKey="take_rate_pct" name="Take Rate (%)" stroke="#6b1e96" strokeWidth={3} fillOpacity={1} fill="url(#colorTakeRate)" />
            </AreaChart>
          ) : (
            <LineChart data={takeRateTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#00000010" />
              <XAxis dataKey="week_start" stroke="#877f92" fontSize={11} />
              <YAxis stroke="#877f92" fontSize={11} />
              <Tooltip contentStyle={{ backgroundColor: "#f7f4fc", border: "1px solid #00000020", borderRadius: "10px", color: "#33243d", fontSize: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.55)" }} />
              <Line type="monotone" dataKey="take_rate_pct" name="Take Rate (%)" stroke="#6b1e96" strokeWidth={3} dot={{ r: 4, fill: "#6b1e96" }} />
            </LineChart>
          )}
        </ResponsiveContainer>
      </ChartCard>

      {/* Grid de Mix de Métodos de Pago y Rentabilidad por Categoría */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DataTable
          title="Mix por Método de Pago Utilizado"
          columns={[
            {
              header: "Método de Pago",
              accessor: "payment_method",
              render: (r) => (
                <button
                  onClick={() =>
                    drilldown.open("orders", {
                      title: `Pedidos pagados con "${r.payment_method}"`,
                      filters: { payment_method: r.payment_method, not_cancelled: true }
                    })
                  }
                  className="font-bold uppercase text-fx-accent hover:underline text-left"
                >
                  {r.payment_method}
                </button>
              )
            },
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

      <DrilldownModal {...drilldown.props} period={period} storeIds={selectedStoreIds} />
    </div>
  );
}

FinancialsTab.propTypes = {};
