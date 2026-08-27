import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getSalesAnalyticsAPI, getFinancialsAnalyticsAPI, getStoresListAPI, getStoreOrdersDetailAPI, getCategoryProductsDetailAPI } from "../../services/api";
import KpiCard from "../../components/admin/analytics/KpiCard";
import ChartCard from "../../components/admin/analytics/ChartCard";
import DataTable from "../../components/admin/analytics/DataTable";
import SkeletonLoader from "../../components/admin/analytics/SkeletonLoader";
import FreshnessBadge from "../../components/admin/analytics/FreshnessBadge";
import usePaymentMethods from "../../hooks/usePaymentMethods";
import AnalyticsStoreFilter from "../../components/admin/analytics/AnalyticsStoreFilter";
import StoreOrdersDrilldownModal from "../../components/admin/analytics/StoreOrdersDrilldownModal";
import ProductSalesDrilldownModal from "../../components/admin/analytics/ProductSalesDrilldownModal";
import CategorySalesDrilldownModal from "../../components/admin/analytics/CategorySalesDrilldownModal";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar, LineChart, Line } from "recharts";
import { ArrowLeft, ArrowRight, FileDown, FileSpreadsheet, Info, Package, RotateCw, Star } from "lucide-react";
import * as XLSX from "xlsx";

/** Mismo lenguaje visual que el resto de analíticas (ver index.css). */
const AXIS = "#877f92";
const GRID = "#00000010";
const TOOLTIP_STYLE = {
  backgroundColor: "#f7f4fc",
  border: "1px solid #00000020",
  borderRadius: "10px",
  color: "#33243d",
  fontSize: 12,
  boxShadow: "0 8px 24px rgba(0,0,0,0.55)"
};

export default function AdminSalesAnalyticsDetail() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  // Incluye los métodos apagados: los pedidos históricos pagados con ellos siguen contando
  // en las ventas y hay que poder filtrarlos.
  const { metodos: metodosDePago } = usePaymentMethods();

  // State management for filters
  const initialPeriod = searchParams.get("period") || "30d";
  const [period, setPeriod] = useState(initialPeriod);
  const [fromDate, setFromDate] = useState(searchParams.get("from") || "");
  const [toDate, setToDate] = useState(searchParams.get("to") || "");
  const [selectedStoreIds, setSelectedStoreIds] = useState([]);
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [storeList, setStoreList] = useState([]);
  const [chartMode, setChartMode] = useState("area");

  // Modal drilldown states
  const [selectedStoreForModal, setSelectedStoreForModal] = useState(null);
  const [isStoreModalOpen, setIsStoreModalOpen] = useState(false);

  const [selectedProductForModal, setSelectedProductForModal] = useState(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);

  const [selectedCategoryForModal, setSelectedCategoryForModal] = useState(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const [salesData, setSalesData] = useState(null);
  const [financialsData, setFinancialsData] = useState(null);
  const [error, setError] = useState(null);

  // Load stores list for filter
  useEffect(() => {
    getStoresListAPI()
      .then((res) => {
        if (res.data?.data) setStoreList(res.data.data);
      })
      .catch((err) => console.error("Error cargando tiendas:", err));
  }, []);

  // Fetch sales analytics data
  const fetchData = useCallback(async (isRefresh = false) => {
    setLoading(true);
    setError(null);
    try {
      const params = { period };
      if (fromDate) params.from = fromDate;
      if (toDate) params.to = toDate;
      if (selectedStoreIds.length > 0) params.store_ids = selectedStoreIds.join(",");
      if (isRefresh) params.refresh = "true";

      const [salesRes, finRes] = await Promise.all([
        getSalesAnalyticsAPI(params),
        getFinancialsAnalyticsAPI(params)
      ]);

      if (salesRes.data?.success) setSalesData(salesRes.data.data);
      if (finRes.data?.success) setFinancialsData(finRes.data.data);
    } catch (err) {
      console.error("Error cargando detalle de ventas:", err);
      setError("No se pudieron obtener las analíticas detalladas de ventas.");
    } finally {
      setLoading(false);
    }
  }, [period, fromDate, toDate, selectedStoreIds]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle Quick Period Change
  const handlePeriodChange = (newPeriod) => {
    setPeriod(newPeriod);
    setFromDate("");
    setToDate("");
    setSearchParams({ period: newPeriod });
  };

  // Handle Custom Date Filter Apply
  const handleApplyCustomDates = () => {
    if (!fromDate || !toDate) return;
    setPeriod("custom");
    setSearchParams({ period: "custom", from: fromDate, to: toDate });
  };

  // Data processing
  const rawPaymentMix = financialsData?.paymentMethodMix || [];
  const paymentMix = paymentFilter === "all"
    ? rawPaymentMix
    : rawPaymentMix.filter((pm) => pm.payment_method?.toLowerCase() === paymentFilter.toLowerCase());

  const storePerformance = salesData?.storePerformanceMatrix || [];
  const salesByCategory = salesData?.salesByCategory || [];
  const topProducts = salesData?.top10Products || [];
  const salesTrend = salesData?.salesTrend || [];

  const totalGmv = rawPaymentMix.reduce((acc, item) => acc + parseFloat(item.total_usd || 0), 0);
  const totalOrders = rawPaymentMix.reduce((acc, item) => acc + parseInt(item.order_count || 0, 10), 0);
  const totalUnits = salesByCategory.reduce((acc, item) => acc + parseInt(item.total_units || item.units || 0, 10), 0);
  const aov = totalOrders > 0 ? totalGmv / totalOrders : 0;
  const platformRevenue = parseFloat(financialsData?.platformRevenueUsd || 0);
  const takeRate = totalGmv > 0 ? (platformRevenue / totalGmv) * 100 : 0;

  // La tasa de comisión se congela en cada orden al crearla. Un período que abarque
  // la activación de la comisión mezcla órdenes a 0% con las actuales, y el take rate
  // agregado no describe ninguno de los dos: se declara el corte en vez de ocultarlo.
  const feeRegime = financialsData?.feeRegime;
  const ordersWithoutFee = feeRegime?.ordersWithoutFee || 0;
  const gmvWithFee = feeRegime?.gmvWithFeeUsd || 0;
  const takeRateOnBilled = gmvWithFee > 0 ? (platformRevenue / gmvWithFee) * 100 : 0;
  const mixesFeeRegimes = ordersWithoutFee > 0 && feeRegime?.ordersWithFee > 0;

  const handleOpenStoreOrdersModal = (storeId) => {
    setSelectedStoreForModal(storeId);
    setIsStoreModalOpen(true);
  };

  const handleOpenProductSalesModal = (productId) => {
    setSelectedProductForModal(productId);
    setIsProductModalOpen(true);
  };

  const handleOpenCategoryProductsModal = (catName) => {
    setSelectedCategoryForModal(catName);
    setIsCategoryModalOpen(true);
  };

  // Export Consolidado en solo 3 Pestañas Ejecutivas
  const handleExportExcel = async () => {
    try {
      // 1. Fetch detailed orders per store
      const storeOrdersPromises = storePerformance.map((st) => {
        const storeId = st.store_id || st.user_id;
        if (!storeId) return Promise.resolve([]);
        return getStoreOrdersDetailAPI({ store_id: storeId, period, from: fromDate, to: toDate })
          .then((res) => {
            const orders = res.data?.data?.orders || [];
            const storeName = res.data?.data?.storeName || st.business_name || st.store_name || "Comercio";
            return orders.map((o) => ({
              Tienda: storeName,
              "ID Orden": `#${o.order_id.slice(0, 8).toUpperCase()}`,
              "Fecha / Hora": new Date(o.created_at).toLocaleString("es-VE"),
              "Cliente / Odontólogo": o.client_name,
              "Email Cliente": o.client_email,
              "Método Pago": o.payment_method?.toUpperCase(),
              "Monto Facturado ($ USD)": `$${parseFloat(o.store_total_usd || 0).toFixed(2)}`,
              "Estado Pago": o.payment_status?.toUpperCase()
            }));
          })
          .catch(() => []);
      });

      // 2. Fetch detailed products per category
      const categoryProductsPromises = salesByCategory.map((cat) => {
        const catName = cat.category_name;
        if (!catName) return Promise.resolve([]);
        return getCategoryProductsDetailAPI({ category_name: catName, period, from: fromDate, to: toDate })
          .then((res) => {
            const products = res.data?.data?.products || [];
            const catTotalRev = parseFloat(res.data?.data?.totalRevenueUsd || 0);
            return products.map((p) => {
              const pRev = parseFloat(p.total_revenue_usd || 0);
              const pctCat = catTotalRev > 0 ? ((pRev / catTotalRev) * 100).toFixed(1) : "0.0";
              return {
                Categoría: catName,
                "Producto / Insumo": p.product_name,
                "Comercio Vendedor": p.store_name,
                "Unidades Vendidas": p.total_units_sold,
                "Facturación ($ USD)": `$${pRev.toFixed(2)}`,
                "Cantidad de Pedidos": p.orders_count,
                "% Cuota en Categoría": `${pctCat}%`
              };
            });
          })
          .catch(() => []);
      });

      const [storeOrdersResults, categoryProductsResults] = await Promise.all([
        Promise.all(storeOrdersPromises),
        Promise.all(categoryProductsPromises)
      ]);

      const allGranularOrders = storeOrdersResults.flat();
      const allGranularCategoryProducts = categoryProductsResults.flat();

      // PESTAÑA 1: Resumen & Tiendas
      const sheet1Data = [
        { "Métrica / Comercio": "=== MÉTRICAS EJECUTIVAS GLOBALES ===", "Facturación ($ USD)": "", "Órdenes / Unidades": "", "Detalle / Rating": "" },
        { "Métrica / Comercio": "GMV Total (Ventas Brutas)", "Facturación ($ USD)": `$${totalGmv.toFixed(2)}`, "Órdenes / Unidades": `${totalOrders} órdenes`, "Detalle / Rating": "100% Facturación" },
        { "Métrica / Comercio": "Ingreso Plataforma (Comisiones)", "Facturación ($ USD)": `$${platformRevenue.toFixed(2)}`, "Órdenes / Unidades": `${totalUnits} unidades`, "Detalle / Rating": `Take Rate: ${takeRate.toFixed(2)}%` },
        { "Métrica / Comercio": "Ticket Promedio (AOV)", "Facturación ($ USD)": `$${aov.toFixed(2)}`, "Órdenes / Unidades": "", "Detalle / Rating": "Promedio por Pedido" },
        {},
        { "Métrica / Comercio": "=== DESGLOSE POR MÉTODO DE PAGO ===" },
        ...rawPaymentMix.map((pm) => ({
          "Métrica / Comercio": `Pago: ${pm.payment_method?.toUpperCase()}`,
          "Facturación ($ USD)": `$${parseFloat(pm.total_usd || 0).toFixed(2)}`,
          "Órdenes / Unidades": `${pm.order_count} pedidos`,
          "Detalle / Rating": totalGmv > 0 ? `${((parseFloat(pm.total_usd || 0) / totalGmv) * 100).toFixed(1)}% cuota` : "0%"
        })),
        {},
        { "Métrica / Comercio": "=== RENDIMIENTO Y FACTURACIÓN POR COMERCIO / TIENDA ===" },
        ...storePerformance.map((st) => ({
          "Métrica / Comercio": st.business_name || st.store_name || "Comercio",
          "Facturación ($ USD)": `$${parseFloat(st.total_gmv || st.gmv || 0).toFixed(2)}`,
          "Órdenes / Unidades": `${st.total_orders || st.orders || 0} órdenes`,
          "Detalle / Rating": st.rating_avg ? `★ ${st.rating_avg}` : "★ N/A"
        }))
      ];

      // PESTAÑA 2: Categorías e Insumos
      const sheet2Data = [
        { Categoría: "=== RESUMEN CONSOLIDADO POR CATEGORÍAS ===", "Producto / Insumo": "", "Comercio Vendedor": "", "Unidades Vendidas": "", "Facturación ($ USD)": "", "Cantidad de Pedidos": "", "% Cuota en Categoría": "" },
        ...salesByCategory.map((cat) => {
          const catSales = parseFloat(cat.total_sales || cat.gmv || 0);
          const pctGlobal = totalGmv > 0 ? ((catSales / totalGmv) * 100).toFixed(1) : "0.0";
          return {
            Categoría: cat.category_name,
            "Producto / Insumo": "TOTAL CATEGORÍA",
            "Comercio Vendedor": "Varios Comercios",
            "Unidades Vendidas": cat.total_units || cat.units || 0,
            "Facturación ($ USD)": `$${catSales.toFixed(2)}`,
            "Cantidad de Pedidos": "-",
            "% Cuota en Categoría": `${pctGlobal}% del GMV Total`
          };
        }),
        {},
        { Categoría: "=== DESGLOSE ESPECÍFICO INSUMO POR INSUMO EN CADA CATEGORÍA ===" },
        ...(allGranularCategoryProducts.length > 0 ? allGranularCategoryProducts : [{ Categoría: "Sin registros" }])
      ];

      // PESTAÑA 3: Historial Granular de Órdenes
      const sheet3Data = allGranularOrders.length > 0 ? allGranularOrders : [{ Mensaje: "Sin órdenes en el período" }];

      const workbook = XLSX.utils.book_new();

      const wsSheet1 = XLSX.utils.json_to_sheet(sheet1Data);
      const wsSheet2 = XLSX.utils.json_to_sheet(sheet2Data);
      const wsSheet3 = XLSX.utils.json_to_sheet(sheet3Data);

      XLSX.utils.book_append_sheet(workbook, wsSheet1, "Resumen & Tiendas");
      XLSX.utils.book_append_sheet(workbook, wsSheet2, "Categorías e Insumos");
      XLSX.utils.book_append_sheet(workbook, wsSheet3, "Historial Granular Órdenes");

      XLSX.writeFile(workbook, `Reporte_Ejecutivo_Ventas_Forcepx_${period}_${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (err) {
      console.error("Error generando Excel Consolidado:", err);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,Metodo,Monto_USD,Ordenes\n";
    rawPaymentMix.forEach((pm) => {
      csvContent += `${pm.payment_method},${pm.total_usd},${pm.order_count}\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Reporte_Ventas_${period}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-fx-base border border-fx-line-outer rounded-2xl p-4 md:p-6 space-y-5">
      {/* ── Cabecera y navegación de vuelta ── */}
      <header className="relative z-30 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="min-w-0">
          <button
            type="button"
            onClick={() => navigate("/admin/analytics")}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-fx-muted hover:text-fx-accent transition-colors mb-3"
          >
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
            Volver a analíticas
          </button>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-fx-faint mb-1">
            Analíticas · Negocio
          </p>
          <h1 className="text-xl md:text-2xl font-semibold text-fx-text tracking-tight">
            Detalle de ventas (GMV)
          </h1>
        </div>

        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <FreshnessBadge
            lastUpdated={salesData?.updatedAt}
            onRefresh={() => fetchData(true)}
            isLoading={loading}
          />
          <button
            type="button"
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-fx-line hover:border-fx-line-strong bg-fx-panel text-fx-text text-xs font-semibold rounded-lg transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" aria-hidden="true" />
            Excel
          </button>
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-fx-line hover:border-fx-line-strong bg-fx-panel text-fx-muted hover:text-fx-text text-xs font-semibold rounded-lg transition-colors"
          >
            <FileDown className="w-3.5 h-3.5" aria-hidden="true" />
            CSV
          </button>
        </div>
      </header>

      {/* ── Barra de filtros ── */}
      <div className="relative z-40 fx-card space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <AnalyticsStoreFilter
              storeList={storeList}
              selectedStoreIds={selectedStoreIds}
              onStoreChange={setSelectedStoreIds}
            />

            <label className="flex items-center gap-2 bg-fx-inset border border-fx-line rounded-lg px-3 py-1.5">
              <span className="text-[11px] text-fx-faint font-semibold">Método de pago</span>
              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                className="bg-transparent text-xs font-semibold text-fx-text outline-none cursor-pointer"
              >
                <option value="all" className="bg-fx-panel">Todos</option>
                {metodosDePago.map((m) => (
                  <option key={m.key} value={m.key} className="bg-fx-panel">{m.label}</option>
                ))}
              </select>
            </label>
          </div>

          <div
            className="inline-flex items-center gap-0.5 bg-fx-inset border border-fx-line rounded-lg p-0.5"
            role="group"
            aria-label="Período"
          >
            {["7d", "15d", "30d", "90d", "365d"].map((pKey) => (
              <button
                key={pKey}
                type="button"
                onClick={() => handlePeriodChange(pKey)}
                aria-pressed={period === pKey}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                  period === pKey
                    ? "bg-fx-raised text-fx-accent"
                    : "text-fx-faint hover:text-fx-muted"
                }`}
              >
                {pKey === "365d" ? "1 año" : pKey.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="pt-3 border-t border-fx-line flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-fx-faint">
              Rango personalizado
            </span>

            <label className="flex items-center gap-1.5 text-xs text-fx-muted">
              Desde
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="bg-fx-inset border border-fx-line rounded-lg px-2.5 py-1 text-xs text-fx-text outline-none focus:border-fx-line-strong transition-colors"
              />
            </label>

            <label className="flex items-center gap-1.5 text-xs text-fx-muted">
              Hasta
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="bg-fx-inset border border-fx-line rounded-lg px-2.5 py-1 text-xs text-fx-text outline-none focus:border-fx-line-strong transition-colors"
              />
            </label>

            <button
              type="button"
              onClick={handleApplyCustomDates}
              disabled={!fromDate || !toDate}
              className="px-3 py-1 border border-fx-line hover:border-fx-line-strong text-fx-text text-xs font-semibold rounded-lg transition-colors disabled:opacity-35"
            >
              Aplicar
            </button>
          </div>

          {period === "custom" && (
            <span className="text-[11px] font-semibold text-fx-accent bg-fx-accent/10 px-2.5 py-1 rounded-md">
              {fromDate || "Inicio"} → {toDate || "Hoy"}
            </span>
          )}
        </div>
      </div>

      {loading && !salesData ? (
        <SkeletonLoader type="kpiRow" />
      ) : error ? (
        <div className="fx-card-danger text-center">
          <p className="text-fx-neg text-sm font-semibold mb-3">{error}</p>
          <button
            type="button"
            onClick={() => fetchData(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-fx-line hover:border-fx-line-strong text-fx-text text-xs font-semibold rounded-lg transition-colors"
          >
            <RotateCw className="w-3.5 h-3.5" aria-hidden="true" />
            Reintentar
          </button>
        </div>
      ) : (
        <div className="space-y-6 relative z-10">
          {/* Executive 6 KPI Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
            <KpiCard
              title="GMV (Ventas Brutas)"
              value={totalGmv}
              format="currency"
              tooltip="Monto acumulado facturado en ventas brutas de la plataforma."
            />
            <KpiCard
              title="Ingreso Plataforma"
              value={platformRevenue}
              format="currency"
              tooltip="Comisiones reales cobradas en el período (tarifa de tienda + tarifa de comprador), excluyendo órdenes canceladas."
              onDrilldown={() => navigate("/admin/analytics?tab=financials")}
            />
            <KpiCard
              title="Take Rate"
              value={takeRate}
              format="percent"
              tooltip="Ingreso de la plataforma dividido entre el GMV del período."
              onDrilldown={() => navigate("/admin/analytics?tab=financials")}
            />
            <KpiCard
              title="Órdenes Totales"
              value={totalOrders}
              format="number"
              suffix="órdenes"
              tooltip="Cantidad total de pedidos procesados exitosamente."
            />
            <KpiCard
              title="Ticket Promedio (AOV)"
              value={aov}
              format="currency"
              tooltip="Monto medio facturado por cada orden realizada."
            />
            <KpiCard
              title="Unidades Vendidas"
              value={totalUnits}
              format="number"
              suffix="unidades"
              tooltip="Total de ítems e insumos despachados."
            />
          </div>

          {mixesFeeRegimes && (
            <div className="fx-card-warn flex items-start gap-3">
              <Info className="w-4 h-4 text-fx-warn shrink-0 mt-0.5" aria-hidden="true" />
              <div className="text-xs text-fx-muted leading-relaxed">
                <p className="font-semibold text-fx-text mb-1">
                  El período mezcla dos regímenes de comisión
                </p>
                <p>
                  <span className="fx-num text-fx-text">{ordersWithoutFee}</span> de{" "}
                  <span className="fx-num text-fx-text">{ordersWithoutFee + feeRegime.ordersWithFee}</span>{" "}
                  órdenes se registraron antes de que se configurara la comisión, con tasa 0%, y aportan{" "}
                  <span className="fx-num text-fx-text">${(feeRegime.gmvWithoutFeeUsd || 0).toFixed(2)}</span>{" "}
                  de GMV sin ingreso asociado. El take rate de arriba las incluye, así que queda por debajo
                  de la tarifa vigente. Contando solo las órdenes con comisión activa es{" "}
                  <span className="font-semibold text-fx-accent fx-num">{takeRateOnBilled.toFixed(2)}%</span>.
                </p>
              </div>
            </div>
          )}

          {/* Main Daily Sales Trend Chart */}
          <ChartCard
            title="Evolución Diaria de Ventas Brutas y Unidades Vendidas"
            subtitle="Comportamiento cronológico de la facturación y movimiento de inventario"
            onTypeChange={setChartMode}
          >
            <ResponsiveContainer width="100%" height={280}>
              {chartMode === "bar" ? (
                <BarChart data={salesTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
                  <XAxis dataKey="date" stroke={AXIS} fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke={AXIS} fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "#ffffff0a" }} />
                  <Bar dataKey="sales_volume" name="GMV ($)" fill="#6b1e96" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="units_sold" name="Unidades" fill="#7c4f9e" radius={[4, 4, 0, 0]} />
                </BarChart>
              ) : chartMode === "line" ? (
                <LineChart data={salesTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
                  <XAxis dataKey="date" stroke={AXIS} fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke={AXIS} fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "#ffffff0a" }} />
                  <Line type="monotone" dataKey="sales_volume" name="GMV ($)" stroke="#6b1e96" strokeWidth={3} dot={false} />
                  <Line type="monotone" dataKey="units_sold" name="Unidades" stroke="#7c4f9e" strokeWidth={2} dot={false} />
                </LineChart>
              ) : (
                <AreaChart data={salesTrend}>
                  <defs>
                    <linearGradient id="colorSalesDetail" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6b1e96" stopOpacity={0.5} />
                      <stop offset="95%" stopColor="#6b1e96" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
                  <XAxis dataKey="date" stroke={AXIS} fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke={AXIS} fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "#ffffff0a" }} />
                  <Area type="monotone" dataKey="sales_volume" name="GMV ($)" stroke="#6b1e96" strokeWidth={3} fillOpacity={1} fill="url(#colorSalesDetail)" />
                </AreaChart>
              )}
            </ResponsiveContainer>
          </ChartCard>

          {/* Payment Method Distribution Grid */}
          <div className="fx-card">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-fx-faint mb-4">
              Distribución de ventas por método de pago
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {paymentMix.map((pm, idx) => {
                const amount = parseFloat(pm.total_usd || 0);
                const pct = totalGmv > 0 ? ((amount / totalGmv) * 100).toFixed(1) : "0.0";
                return (
                  <div key={pm.payment_method || idx} className="fx-inset p-4 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-fx-faint block mb-1.5">
                        {pm.payment_method}
                      </span>
                      <div className="text-2xl font-semibold text-fx-text fx-num">
                        ${amount.toFixed(2)}
                      </div>
                    </div>
                    <div className="mt-3 pt-2.5 border-t border-fx-line flex items-center justify-between text-[11px] text-fx-muted">
                      <span className="fx-num">{pm.order_count} pedidos</span>
                      <span className="font-semibold text-fx-accent fx-num">{pct}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Store Performance & Product Category Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Store Performance Table */}
            <DataTable
              title="Rendimiento por comercio"
              subtitle="Haz clic en una tienda para ver sus órdenes."
              columns={[
                {
                  header: "Tienda / Comercio",
                  accessor: "business_name",
                  render: (r) => (
                    <button
                      type="button"
                      onClick={() => handleOpenStoreOrdersModal(r.store_id || r.user_id)}
                      className="group flex items-center gap-2 text-left"
                    >
                      <span className="font-semibold text-fx-text group-hover:text-fx-accent transition-colors">
                        {r.business_name || r.store_name || "Comercio"}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-fx-faint group-hover:text-fx-accent transition-colors" aria-hidden="true" />
                    </button>
                  )
                },
                {
                  header: "Órdenes",
                  accessor: "total_orders",
                  render: (r) => (
                    <button
                      type="button"
                      onClick={() => handleOpenStoreOrdersModal(r.store_id || r.user_id)}
                      className="px-2 py-0.5 rounded-md border border-fx-line hover:border-fx-accent/50 text-fx-text hover:text-fx-accent text-xs font-semibold fx-num transition-colors"
                    >
                      {parseInt(r.total_orders || r.orders || 0, 10).toLocaleString()}
                    </button>
                  )
                },
                {
                  header: "GMV Facturado",
                  accessor: "total_gmv",
                  render: (r) => <span className="font-semibold text-fx-accent fx-num">${parseFloat(r.total_gmv || r.gmv || 0).toFixed(2)}</span>
                },
                {
                  header: "Rating",
                  accessor: "rating_avg",
                  render: (r) => (
                    <span className="inline-flex items-center gap-1 text-fx-warn font-semibold fx-num">
                      <Star className="w-3 h-3 fill-current" aria-hidden="true" />
                      {r.rating_avg != null ? parseFloat(r.rating_avg).toFixed(1) : "N/A"}
                    </span>
                  )
                },
                {
                  header: "Acción",
                  accessor: "action",
                  render: (r) => (
                    <button
                      type="button"
                      onClick={() => handleOpenStoreOrdersModal(r.store_id || r.user_id)}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-fx-line hover:border-fx-accent/50 text-fx-muted hover:text-fx-accent text-xs font-semibold transition-colors"
                    >
                      Ver órdenes
                      <ArrowRight className="w-3 h-3" aria-hidden="true" />
                    </button>
                  )
                }
              ]}
              data={storePerformance}
            />

            {/* Sales by Category Table */}
            <DataTable
              title="Ventas por categoría"
              subtitle="Haz clic en una categoría para ver sus productos."
              columns={[
                {
                  header: "Categoría",
                  accessor: "category_name",
                  render: (r) => (
                    <button
                      type="button"
                      onClick={() => handleOpenCategoryProductsModal(r.category_name)}
                      className="group flex items-center gap-2 text-left"
                    >
                      <span className="font-semibold text-fx-text group-hover:text-fx-accent transition-colors">
                        {r.category_name}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-fx-faint group-hover:text-fx-accent transition-colors" aria-hidden="true" />
                    </button>
                  )
                },
                {
                  header: "Unidades Vendidas",
                  accessor: "total_units",
                  render: (r) => (
                    <span className="fx-num text-fx-muted">
                      {parseInt(r.total_units || r.units || 0, 10).toLocaleString()}
                    </span>
                  )
                },
                {
                  header: "Facturación ($)",
                  accessor: "total_sales",
                  render: (r) => <span className="font-semibold text-fx-text fx-num">${parseFloat(r.total_sales || r.gmv || 0).toFixed(2)}</span>
                },
                {
                  header: "Acción",
                  accessor: "action",
                  render: (r) => (
                    <button
                      type="button"
                      onClick={() => handleOpenCategoryProductsModal(r.category_name)}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-fx-line hover:border-fx-accent/50 text-fx-muted hover:text-fx-accent text-xs font-semibold transition-colors"
                    >
                      Ver productos
                      <ArrowRight className="w-3 h-3" aria-hidden="true" />
                    </button>
                  )
                }
              ]}
              data={salesByCategory}
            />
          </div>

          {/* Top 10 Best Selling Products Table */}
          <DataTable
            title="Productos más vendidos"
            subtitle="Haz clic en un producto para ver el detalle de sus ventas."
            columns={[
              {
                header: "Producto / Insumo",
                accessor: "name",
                render: (r) => (
                  <button
                    type="button"
                    onClick={() => handleOpenProductSalesModal(r.id)}
                    className="group flex items-center gap-3 py-1 text-left"
                  >
                    <div className="w-10 h-10 rounded-lg bg-fx-inset border border-fx-line overflow-hidden flex items-center justify-center text-fx-faint flex-shrink-0">
                      {r.image_url ? (
                        <img src={r.image_url} alt={r.name} className="w-full h-full object-cover" />
                      ) : (
                        <Package className="w-4 h-4" aria-hidden="true" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <span className="font-semibold text-fx-text group-hover:text-fx-accent transition-colors block leading-tight">
                        {r.name || r.title}
                      </span>
                      <span className="text-[10px] text-fx-faint mt-0.5 block">
                        {r.store_name || "Comercio"}
                      </span>
                    </div>
                  </button>
                )
              },
              {
                header: "Categoría / Rating",
                accessor: "category_name",
                render: (r) => (
                  <div>
                    <span className="text-xs text-fx-muted block">{r.category_name || "Insumos"}</span>
                    <span className="inline-flex items-center gap-1 text-fx-warn font-semibold text-[11px] fx-num">
                      <Star className="w-3 h-3 fill-current" aria-hidden="true" />
                      {parseFloat(r.rating || 0).toFixed(1)}
                    </span>
                  </div>
                )
              },
              {
                header: "Unidades Vendidas",
                accessor: "total_units",
                render: (r) => (
                  <span className="font-semibold text-fx-text text-sm fx-num">
                    {parseInt(r.total_units || r.units_sold || 0, 10).toLocaleString()} un.
                  </span>
                )
              },
              {
                header: "Facturación Total",
                accessor: "total_revenue",
                render: (r) => (
                  <span className="font-semibold text-fx-accent text-sm fx-num">
                    ${parseFloat(r.total_revenue || r.revenue_usd || 0).toFixed(2)}
                  </span>
                )
              },
              {
                header: "Acción",
                accessor: "action",
                render: (r) => (
                  <button
                    type="button"
                    onClick={() => handleOpenProductSalesModal(r.id)}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-fx-line hover:border-fx-accent/50 text-fx-muted hover:text-fx-accent text-xs font-semibold transition-colors"
                  >
                    Ver ventas
                    <ArrowRight className="w-3 h-3" aria-hidden="true" />
                  </button>
                )
              }
            ]}
            data={topProducts}
          />
        </div>
      )}

      {/* Modal Interactivo de Desglose de Órdenes por Tienda */}
      <StoreOrdersDrilldownModal
        isOpen={isStoreModalOpen}
        onClose={() => setIsStoreModalOpen(false)}
        storeId={selectedStoreForModal}
        period={period}
        fromDate={fromDate}
        toDate={toDate}
      />

      {/* Modal Interactivo de Desglose de Ventas por Producto */}
      <ProductSalesDrilldownModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        productId={selectedProductForModal}
        period={period}
        fromDate={fromDate}
        toDate={toDate}
      />

      {/* Modal Interactivo de Desglose de Productos por Categoría */}
      <CategorySalesDrilldownModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        categoryName={selectedCategoryForModal}
        period={period}
        fromDate={fromDate}
        toDate={toDate}
        onSelectProduct={handleOpenProductSalesModal}
      />
    </div>
  );
}
