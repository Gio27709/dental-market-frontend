import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { useStore } from "../../context/StoreContext";
import { Link } from "react-router-dom";
import { getStoreAnalyticsAPI } from "../../services/api";
import KpiCard from "../../components/store/KpiCard";
import FinancialBar from "../../components/store/FinancialBar";
import PeriodSelector from "../../components/store/PeriodSelector";
import SalesChart from "../../components/store/SalesChart";
import TopProducts from "../../components/store/TopProducts";
import OrderStatusWidget from "../../components/store/OrderStatusWidget";
import InventoryWidget from "../../components/store/InventoryWidget";
import ReputationWidget from "../../components/store/ReputationWidget";
import RecentOrdersTable from "../../components/store/RecentOrdersTable";
import ExportButtons from "../../components/store/ExportButtons";

export default function StoreDashboard() {
  const { user } = useAuth();
  const { storeProfile, updateProfile } = useStore();
  const [period, setPeriod] = useState("30d");
  const [customRange, setCustomRange] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [togglingOpen, setTogglingOpen] = useState(false);

  const handleToggleOpen = async () => {
    if (!storeProfile) return;
    setTogglingOpen(true);
    await updateProfile({ ...storeProfile, is_open: !storeProfile.is_open });
    setTogglingOpen(false);
  };

  // ── Fetch Analytics ──
  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = customRange
        ? { date_from: customRange.from, date_to: customRange.to }
        : { period };
      const response = await getStoreAnalyticsAPI(params);
      if (response.data?.success) {
        setAnalytics(response.data.data);
      }
    } catch (err) {
      console.error("Error fetching store analytics:", err);
      setError("No se pudieron cargar las estadísticas");
    } finally {
      setLoading(false);
    }
  }, [period, customRange]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const handlePeriodChange = (newPeriod) => {
    setCustomRange(null);
    setPeriod(newPeriod);
  };

  const handleCustomRange = (from, to) => {
    setCustomRange({ from, to });
  };

  // ── Dynamic insight message for hero ──
  const getInsightMessage = () => {
    if (!analytics || loading) return "Cargando tus estadísticas...";
    const revTrend = analytics.trends?.revenue;
    if (revTrend === null || revTrend === undefined || revTrend === 0) {
      return `Tienes ${analytics.kpis?.totalOrders || 0} órdenes en este periodo.`;
    }
    if (revTrend > 0) {
      return `¡Tus ventas subieron ${revTrend}% respecto al periodo anterior! 🚀`;
    }
    return `Tus ventas bajaron ${Math.abs(revTrend)}%. Revisa tus productos destacados.`;
  };

  // ── Skeleton loader ──
  const SkeletonCard = () => (
    <div className="rounded-2xl p-5 animate-pulse" style={{ background: "rgba(107,30,150,0.04)" }}>
      <div className="h-3 w-20 bg-gray-200 rounded mb-3" />
      <div className="h-8 w-28 bg-gray-200 rounded mb-2" />
      <div className="h-3 w-16 bg-gray-100 rounded" />
    </div>
  );

  // ── Quick Actions ──
  const quickActions = [
    {
      title: "Mis Productos",
      description: "Gestiona tu catálogo",
      path: "/store/products",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H2.25c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
        </svg>
      ),
      color: "#f59e0b",
    },
    {
      title: "Ver Órdenes",
      description: "Pedidos por gestionar",
      path: "/store/orders",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
        </svg>
      ),
      color: "#6b1e96",
    },
    {
      title: "Repartidores",
      description: "Gestiona tu flota",
      path: "/store/riders",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
        </svg>
      ),
      color: "#10b981",
    },
    {
      title: "Mi Perfil",
      description: "Editar datos de tienda",
      path: "/store/profile",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
        </svg>
      ),
      color: "#3b82f6",
    },
  ];

  const isSuspended = storeProfile?.is_suspended;

  return (
    <div className="space-y-6">
      {/* ── Suspension Banner (BUG-D fix) ── */}
      {isSuspended && (
        <div className="relative overflow-hidden rounded-2xl border-2 border-red-300 bg-gradient-to-r from-red-50 via-red-50 to-orange-50 p-5 md:p-6 shadow-sm">
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10 pointer-events-none" style={{ background: "radial-gradient(circle, #ef4444 0%, transparent 70%)", transform: "translate(30%, -30%)" }} />
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
              <span className="text-2xl">🚨</span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-red-800 mb-1">Tu tienda está suspendida</h3>
              {storeProfile?.suspension_reason && (
                <p className="text-sm text-red-700/80 mb-2 leading-relaxed">
                  <span className="font-semibold">Motivo:</span> {storeProfile.suspension_reason}
                </p>
              )}
              {storeProfile?.suspended_at && (
                <p className="text-xs text-red-500/70 mb-3">
                  Suspendida desde: {new Date(storeProfile.suspended_at).toLocaleDateString("es-VE", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                <Link
                  to="/store/penalties"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-colors"
                  style={{ background: "linear-gradient(135deg, #531575, #6b1e96)", color: "#c3ff00" }}
                >
                  📝 Apelar suspensión
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Hero Welcome Card ── */}
      <div
        className="relative overflow-hidden rounded-2xl p-8 md:p-10"
        style={{ background: isSuspended
          ? "linear-gradient(135deg, #3b0a0a 0%, #7f1d1d 50%, #991b1b 100%)"
          : "linear-gradient(135deg, #1a0a2e 0%, #531575 50%, #6b1e96 100%)" }}
      >
        <div className="absolute top-0 right-0 w-72 h-72 rounded-full opacity-10 pointer-events-none" style={{ background: `radial-gradient(circle, ${isSuspended ? '#ef4444' : '#c3ff00'} 0%, transparent 70%)`, transform: "translate(30%, -30%)" }} />
        <div className="absolute bottom-0 left-1/2 w-40 h-40 rounded-full opacity-5 pointer-events-none" style={{ background: `radial-gradient(circle, ${isSuspended ? '#ef4444' : '#c3ff00'} 0%, transparent 70%)`, transform: "translate(-50%, 50%)" }} />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-300 ${
              isSuspended
                ? "bg-red-500/20 border-red-400/40"
                : storeProfile?.is_open 
                  ? "bg-[#c3ff00]/10 border-[#c3ff00]/30" 
                  : "bg-red-500/10 border-red-500/30"
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                isSuspended
                  ? "bg-red-400 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.6)]"
                  : storeProfile?.is_open 
                    ? "bg-[#c3ff00] shadow-[0_0_10px_rgba(195,255,0,0.5)]" 
                    : "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]"
              }`} />
              <span className={`text-[10px] font-bold uppercase tracking-[0.15em] ${
                isSuspended
                  ? "text-red-300"
                  : storeProfile?.is_open ? "text-[#c3ff00]" : "text-red-400"
              }`}>
                {isSuspended ? "⚠ Suspendida" : storeProfile?.is_open ? "Tienda Activa" : "Tienda Cerrada"}
              </span>
            </div>

            {/* Toggle Switch — disabled when suspended */}
            <button 
              onClick={handleToggleOpen}
              disabled={togglingOpen || isSuspended}
              title={isSuspended ? "No puedes cambiar el estado mientras tu tienda está suspendida" : storeProfile?.is_open ? "Pausar operaciones" : "Reanudar operaciones"}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 focus:outline-none ${
                isSuspended ? 'bg-white/10 opacity-40 cursor-not-allowed' :
                storeProfile?.is_open ? 'bg-[#c3ff00]' : 'bg-white/20'
              } ${(togglingOpen || isSuspended) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:ring-2 hover:ring-white/30 hover:ring-offset-2 hover:ring-offset-transparent'}`}
            >
              <span className="sr-only">Toggle Store Status</span>
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${
                  storeProfile?.is_open && !isSuspended ? 'translate-x-6 shadow-[0_2px_4px_rgba(0,0,0,0.3)]' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            Bienvenido, <span className={isSuspended ? "text-red-300" : "text-[#c3ff00]"}>{user?.firstName || "Vendedor"}</span>
          </h1>
          <p className="text-white/50 text-sm md:text-base max-w-lg leading-relaxed">
            {isSuspended
              ? "Tu tienda se encuentra suspendida. Puedes apelar esta decisión desde tu panel de sanciones."
              : getInsightMessage()}
          </p>
        </div>
      </div>

      {/* ── Period Selector ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-gray-800">Estadísticas</h2>
          <div className="flex-1 h-px bg-gray-200/80 hidden sm:block" style={{ minWidth: "40px" }} />
          <ExportButtons analytics={analytics} period={period} loading={loading} />
        </div>
        <PeriodSelector
          period={period}
          onPeriodChange={handlePeriodChange}
          onCustomRange={handleCustomRange}
        />
      </div>

      {/* ── Error State ── */}
      {error && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-center gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-red-400 flex-shrink-0">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
          </svg>
          <p className="text-sm text-red-600">{error}</p>
          <button onClick={fetchAnalytics} className="ml-auto text-xs font-semibold text-red-500 hover:text-red-700 underline">Reintentar</button>
        </div>
      )}

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : analytics ? (
          <>
            <KpiCard
              title="Ventas Totales"
              value={(analytics.kpis.totalRevenue || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              trend={analytics.trends.revenue}
              prefix="$"
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              }
            />
            <KpiCard
              title="Órdenes"
              value={analytics.kpis.totalOrders || 0}
              trend={analytics.trends.orders}
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                </svg>
              }
            />
            <KpiCard
              title="Ticket Promedio"
              value={(analytics.kpis.avgOrderValue || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              trend={analytics.trends.avgOrderValue}
              prefix="$"
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
                </svg>
              }
            />
            <KpiCard
              title="Unidades Vendidas"
              value={analytics.kpis.unitsSold || 0}
              trend={analytics.trends.units}
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0-3-3m3 3 3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
                </svg>
              }
            />
          </>
        ) : null}
      </div>

      {/* ── Financial Overview ── */}
      {loading ? (
        <div className="rounded-2xl p-6 animate-pulse" style={{ background: "rgba(26,10,46,0.7)" }}>
          <div className="h-4 w-40 bg-white/10 rounded mb-4" />
          <div className="grid grid-cols-3 gap-4">
            <div className="h-10 bg-white/10 rounded" />
            <div className="h-10 bg-white/10 rounded" />
            <div className="h-10 bg-white/10 rounded" />
          </div>
        </div>
      ) : analytics ? (
        <FinancialBar
          grossRevenue={analytics.financialSummary.grossRevenue}
          platformFees={analytics.financialSummary.platformFees}
          netRevenue={analytics.financialSummary.netRevenue}
          walletAvailable={analytics.financialSummary.walletAvailable}
          walletPending={analytics.financialSummary.walletPending}
        />
      ) : null}

      {/* ── Sección de Rentabilidad Comercial (BI) ── */}
      {analytics && !loading && (
        <div 
          className="rounded-2xl p-6 border transition-all duration-300"
          style={{
            background: "linear-gradient(135deg, rgba(26,10,46,0.02) 0%, rgba(107,30,150,0.05) 100%)",
            borderColor: "rgba(107,30,150,0.1)",
            boxShadow: "0 10px 30px -10px rgba(107,30,150,0.05)",
          }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-xl shadow-sm">📊</div>
            <div>
              <h3 className="text-sm font-bold text-purple-950 uppercase tracking-wider">Márgenes y Utilidad Real (BI)</h3>
              <p className="text-[11px] text-gray-400">Analítica comercial de costo de bienes, comisiones y rentabilidad neta de la tienda</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Costo de Adquisición (COGS) */}
            <div className="bg-white rounded-xl p-5 border border-gray-100/80 shadow-sm relative overflow-hidden">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Costo de Ventas (COGS)</span>
              <span className="text-2xl font-extrabold text-gray-800 block">${(analytics.kpis.totalCOGS || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              <p className="text-[11px] text-gray-400 mt-2 leading-relaxed">Costo total de adquisición de la mercadería vendida en este periodo.</p>
            </div>

            {/* Utilidad Neta Real */}
            <div 
              className="rounded-xl p-5 border shadow-sm relative overflow-hidden"
              style={{
                background: "linear-gradient(135deg, rgba(16,185,129,0.02) 0%, rgba(5,150,105,0.06) 100%)",
                borderColor: "rgba(16,185,129,0.15)",
                boxShadow: "0 8px 20px -8px rgba(16,185,129,0.1)",
              }}
            >
              <span className="text-[10px] font-bold text-[#059669] uppercase tracking-wider block mb-1">Utilidad Neta Real</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-[#059669]">${(analytics.kpis.netProfit || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                {analytics.trends.netProfit !== 0 && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    analytics.trends.netProfit > 0 ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
                  }`}>
                    {analytics.trends.netProfit > 0 ? "▲" : "▼"} {Math.abs(analytics.trends.netProfit)}%
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#059669]/70 mt-2 leading-relaxed">Tu ganancia neta libre tras deducir costos de productos y comisiones de plataforma.</p>
            </div>

            {/* Margen Promedio */}
            <div className="bg-white rounded-xl p-5 border border-gray-100/80 shadow-sm relative overflow-hidden">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Margen Comercial</span>
              <span className="text-2xl font-extrabold text-purple-900 block">{analytics.kpis.profitMargin}%</span>
              <p className="text-[11px] text-gray-400 mt-2 leading-relaxed">Eficiencia de retorno promedio. Representa la porción de tus ventas que es utilidad neta.</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Sales Chart + Top Products (2-column layout) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3">
          <SalesChart
            data={analytics?.salesChart}
            loading={loading}
          />
        </div>
        <div className="lg:col-span-2">
          <TopProducts
            products={analytics?.topProducts}
            loading={loading}
          />
        </div>
      </div>

      {/* ── Desglose de Ventas por Categoría y Marca (BI) ── */}
      {analytics && !loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Categorías */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5 md:p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xl">🏷️</span>
              <h3 className="text-sm font-bold text-gray-800">Ventas por Categoría</h3>
            </div>
            {analytics.salesByCategory && analytics.salesByCategory.length > 0 ? (
              <div className="space-y-4">
                {analytics.salesByCategory.map((cat, idx) => {
                  const percentage = analytics.kpis.totalRevenue > 0 
                    ? Math.round((cat.revenue / analytics.kpis.totalRevenue) * 100) 
                    : 0;
                  const colors = ["#6b1e96", "#10b981", "#3b82f6", "#f59e0b", "#ec4899"];
                  const color = colors[idx % colors.length];

                  return (
                    <div key={cat.name} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold text-gray-700">
                        <span>{cat.name}</span>
                        <span>${cat.revenue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({percentage}%)</span>
                      </div>
                      <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-500" 
                          style={{ width: `${percentage}%`, backgroundColor: color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-gray-400 py-6 text-center">Sin datos de categorías en este periodo</p>
            )}
          </div>

          {/* Marcas */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5 md:p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xl">🏢</span>
              <h3 className="text-sm font-bold text-gray-800">Ventas por Marca</h3>
            </div>
            {analytics.salesByBrand && analytics.salesByBrand.length > 0 ? (
              <div className="space-y-4">
                {analytics.salesByBrand.map((brand, idx) => {
                  const percentage = analytics.kpis.totalRevenue > 0 
                    ? Math.round((brand.revenue / analytics.kpis.totalRevenue) * 100) 
                    : 0;
                  const colors = ["#3b82f6", "#f59e0b", "#6b1e96", "#10b981", "#ec4899"];
                  const color = colors[idx % colors.length];

                  return (
                    <div key={brand.name} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold text-gray-700">
                        <span>{brand.name}</span>
                        <span>${brand.revenue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({percentage}%)</span>
                      </div>
                      <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-500" 
                          style={{ width: `${percentage}%`, backgroundColor: color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-gray-400 py-6 text-center">Sin datos de marcas en este periodo</p>
            )}
          </div>
        </div>
      )}

      {/* ── Widgets Row: Orders Status + Inventory + Reputation ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <OrderStatusWidget
          statusCounts={analytics?.ordersByStatus}
          loading={loading}
        />
        <InventoryWidget
          inventory={analytics?.inventory}
          loading={loading}
        />
        <ReputationWidget
          reputation={analytics?.reputation}
          loading={loading}
        />
      </div>

      {/* ── Recent Orders Table ── */}
      <RecentOrdersTable
        orders={analytics?.recentOrders}
        loading={loading}
      />

      {/* ── Quick Actions ── */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-lg font-bold text-gray-800">Accesos Rápidos</h2>
          <div className="flex-1 h-px bg-gray-200/80" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {quickActions.map((action, index) => (
            <Link
              key={index}
              to={action.path}
              className="group flex items-center gap-4 bg-white rounded-xl p-4 border border-gray-100 transition-all duration-200 hover:shadow-md hover:border-transparent hover:-translate-y-0.5"
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover:scale-110"
                style={{ background: `${action.color}15`, color: action.color }}
              >
                {action.icon}
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-gray-800 group-hover:text-gray-900">{action.title}</h3>
                <p className="text-xs text-gray-400 truncate">{action.description}</p>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-gray-300 ml-auto flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Platform Status ── */}
      <div className={`rounded-xl border p-5 transition-colors duration-300 ${
        storeProfile?.is_open 
          ? "bg-white border-gray-100" 
          : "bg-red-50/50 border-red-100"
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              storeProfile?.is_open ? "bg-emerald-100/50" : "bg-red-100/50"
            }`}>
              <div className={`w-2.5 h-2.5 rounded-full ${
                storeProfile?.is_open ? "bg-emerald-500 animate-pulse" : "bg-red-500"
              }`} />
            </div>
            <div>
              <p className={`text-sm font-semibold ${storeProfile?.is_open ? "text-gray-800" : "text-red-800"}`}>
                {storeProfile?.is_open ? "Tienda Operativa" : "Operaciones Pausadas"}
              </p>
              <p className={`text-[11px] ${storeProfile?.is_open ? "text-gray-400" : "text-red-600/70"}`}>
                {storeProfile?.is_open 
                  ? "Tu tienda está visible y funcionando correctamente" 
                  : "Los clientes no podrán procesar envíos desde tu tienda temporalmente"}
              </p>
            </div>
          </div>
          <span className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full ${
            storeProfile?.is_open 
              ? "text-emerald-600 bg-emerald-50" 
              : "text-red-600 bg-red-100"
          }`}>
            {storeProfile?.is_open ? "Online" : "Offline"}
          </span>
        </div>
      </div>
    </div>
  );
}
