import { useState, useEffect, useCallback } from "react";
import { getAdminAnalyticsAPI } from "../../services/api";
import PeriodSelector from "../../components/store/PeriodSelector";
import AdminKpiRow from "../../components/admin/AdminKpiRow";
import PlatformRevenueChart from "../../components/admin/PlatformRevenueChart";
import StoreFilterDropdown from "../../components/admin/StoreFilterDropdown";
import TopStoresTable from "../../components/admin/TopStoresTable";
import TopProductsGlobal from "../../components/admin/TopProductsGlobal";
import PaymentMethodsWidget from "../../components/admin/PaymentMethodsWidget";
import OrderStatusGlobal from "../../components/admin/OrderStatusGlobal";
import StoreGrowthWidget from "../../components/admin/StoreGrowthWidget";
import RecentOrdersGlobal from "../../components/admin/RecentOrdersGlobal";
import AdminExportButtons from "../../components/admin/AdminExportButtons";

export default function AdminAnalytics() {
  const [period, setPeriod] = useState("30d");
  const [customRange, setCustomRange] = useState(null);
  const [storeIds, setStoreIds] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = customRange
        ? { date_from: customRange.from, date_to: customRange.to }
        : { period };
      if (storeIds.length > 0) params.store_ids = storeIds.join(",");
      const response = await getAdminAnalyticsAPI(params);
      if (response.data?.success) setAnalytics(response.data.data);
    } catch (err) {
      console.error("Error fetching admin analytics:", err);
      setError("No se pudieron cargar las estadísticas");
    } finally {
      setLoading(false);
    }
  }, [period, customRange, storeIds]);

  useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);

  const handlePeriodChange = (p) => { setCustomRange(null); setPeriod(p); };
  const handleCustomRange = (from, to) => { setCustomRange({ from, to }); };

  return (
    <div className="space-y-6">
      {/* ── Hero ── */}
      <div className="relative overflow-hidden rounded-2xl p-8 md:p-10" style={{ background: "linear-gradient(135deg, #1a0a2e 0%, #2d1452 60%, #531575 100%)" }}>
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full opacity-10 pointer-events-none" style={{ background: "radial-gradient(circle, #c3ff00 0%, transparent 70%)", transform: "translate(30%, -30%)" }} />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-[#c3ff00] shadow-[0_0_10px_rgba(195,255,0,0.5)]" />
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#c3ff00]/80">Analytics</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Estadísticas de la Plataforma</h1>
          <p className="text-white/40 text-sm max-w-lg">
            Vista panorámica de todas las tiendas, ventas, comisiones y crecimiento de Forcepx.
          </p>
        </div>
      </div>

      {/* ── Controls Row ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2 flex-1">
          <h2 className="text-lg font-bold text-gray-800">Métricas</h2>
          <div className="flex-1 h-px bg-gray-200/80 hidden sm:block" style={{ minWidth: "30px" }} />
          <StoreFilterDropdown
            stores={analytics?.storeList || []}
            selectedIds={storeIds}
            onChange={setStoreIds}
          />
          <AdminExportButtons analytics={analytics} period={period} loading={loading} />
        </div>
        <PeriodSelector period={period} onPeriodChange={handlePeriodChange} onCustomRange={handleCustomRange} />
      </div>

      {/* Active filters indicator */}
      {storeIds.length > 0 && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: "rgba(107,30,150,0.04)", border: "1px solid rgba(107,30,150,0.08)" }}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-purple-400">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 0 1-.659 1.591l-5.432 5.432a2.25 2.25 0 0 0-.659 1.591v2.927a2.25 2.25 0 0 1-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 0 0-.659-1.591L3.659 7.409A2.25 2.25 0 0 1 3 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0 1 12 3Z" />
          </svg>
          <span className="text-xs text-purple-600 font-medium">
            Filtrando por {storeIds.length} tienda{storeIds.length > 1 ? "s" : ""}
          </span>
          <button onClick={() => setStoreIds([])} className="text-[10px] text-purple-500 hover:text-purple-700 underline ml-auto">Limpiar filtro</button>
        </div>
      )}

      {/* ── Error State ── */}
      {error && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-center gap-3">
          <p className="text-sm text-red-600">{error}</p>
          <button onClick={fetchAnalytics} className="ml-auto text-xs font-semibold text-red-500 hover:text-red-700 underline">Reintentar</button>
        </div>
      )}

      {/* ── KPI Cards ── */}
      <AdminKpiRow kpis={analytics?.kpis} trends={analytics?.trends} loading={loading} />

      {/* ── Revenue Chart (full width) ── */}
      <PlatformRevenueChart data={analytics?.revenueChart} loading={loading} />

      {/* ── Top Stores + Top Products (55/45 grid) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-7">
          <TopStoresTable
            stores={analytics?.topStores}
            loading={loading}
            onStoreClick={(id) => {
              setStoreIds((prev) => prev.includes(id) ? prev : [...prev, id]);
            }}
          />
        </div>
        <div className="lg:col-span-5">
          <TopProductsGlobal
            products={analytics?.topProducts}
            loading={loading}
          />
        </div>
      </div>

      {/* ── Widgets Row: Payment Methods + Order Status + Store Growth ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <PaymentMethodsWidget methods={analytics?.paymentMethods} loading={loading} />
        <OrderStatusGlobal statusCounts={analytics?.ordersByStatus} loading={loading} />
        <StoreGrowthWidget growth={analytics?.storeGrowth} loading={loading} />
      </div>

      {/* ── Recent Orders (full width) ── */}
      <RecentOrdersGlobal orders={analytics?.recentOrders} loading={loading} />
    </div>
  );
}
