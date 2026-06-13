import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  getProductStatsAPI,
  restockVariationAPI,
  adjustStockAPI,
  registerExternalSaleAPI,
} from "../../services/api";

// ── Movement type config ──
const MOVEMENT_TYPES = {
  initial: { label: "Inicial", color: "#6b1e96", bg: "#f3e8ff", icon: "🏷️" },
  restock: { label: "Reposición", color: "#059669", bg: "#d1fae5", icon: "📦" },
  sale: { label: "Venta", color: "#dc2626", bg: "#fee2e2", icon: "🛒" },
  return: { label: "Devolución", color: "#2563eb", bg: "#dbeafe", icon: "↩️" },
  cancellation: { label: "Cancelación", color: "#f59e0b", bg: "#fef3c7", icon: "❌" },
  adjustment: { label: "Ajuste", color: "#6366f1", bg: "#e0e7ff", icon: "✏️" },
  external_sale: { label: "Vta. Externa", color: "#ec4899", bg: "#fce7f3", icon: "📱" },
};

const CHANNEL_LABELS = {
  instagram: "Instagram",
  whatsapp: "WhatsApp",
  presencial: "Presencial",
  facebook: "Facebook",
  otro: "Otro",
};

const PERIODS = [
  { value: "7d", label: "7 días" },
  { value: "15d", label: "15 días" },
  { value: "30d", label: "30 días" },
  { value: "90d", label: "90 días" },
  { value: "180d", label: "6 meses" },
  { value: "365d", label: "1 año" },
  { value: "all", label: "Todo" },
];

export default function ProductStats() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("30d");
  const [activeModal, setActiveModal] = useState(null); // 'restock' | 'adjust' | 'external' | null
  const [modalLoading, setModalLoading] = useState(false);

  // Modal form states
  const [restockForm, setRestockForm] = useState({ variation_id: "", quantity: "", notes: "" });
  const [adjustForm, setAdjustForm] = useState({ variation_id: "", quantity_change: "", notes: "" });
  const [externalForm, setExternalForm] = useState({
    variation_id: "", quantity: "", unit_price: "", channel: "whatsapp", customer_name: "", notes: ""
  });

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getProductStatsAPI(id, { period });
      if (res.data?.success) {
        setStats(res.data.data);
      }
    } catch (err) {
      console.error("Error fetching product stats:", err);
      toast.error("Error al cargar las estadísticas del producto");
    } finally {
      setLoading(false);
    }
  }, [id, period]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  // ── Helpers ──
  const fmt = (n) => (n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmtInt = (n) => (n || 0).toLocaleString("en-US");
  const parseVariationLabel = (v) => {
    if (!v) return "—";
    try {
      const obj = JSON.parse(v.attribute_value);
      if (obj._default) return "Producto Simple";
      return Object.values(obj).join(" / ");
    } catch {
      return v.attribute_value || "—";
    }
  };

  // ── Handlers ──
  const handleRestock = async (e) => {
    e.preventDefault();
    if (!restockForm.variation_id || !restockForm.quantity) return toast.error("Completa todos los campos");
    setModalLoading(true);
    try {
      await restockVariationAPI(id, {
        variation_id: restockForm.variation_id,
        quantity: parseInt(restockForm.quantity),
        notes: restockForm.notes,
      });
      toast.success("Stock repuesto exitosamente");
      setActiveModal(null);
      setRestockForm({ variation_id: "", quantity: "", notes: "" });
      fetchStats();
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || "Error al reponer stock");
    } finally { setModalLoading(false); }
  };

  const handleAdjust = async (e) => {
    e.preventDefault();
    if (!adjustForm.variation_id || !adjustForm.quantity_change || !adjustForm.notes) return toast.error("Completa todos los campos");
    setModalLoading(true);
    try {
      await adjustStockAPI(id, {
        variation_id: adjustForm.variation_id,
        quantity_change: parseInt(adjustForm.quantity_change),
        notes: adjustForm.notes,
      });
      toast.success("Stock ajustado exitosamente");
      setActiveModal(null);
      setAdjustForm({ variation_id: "", quantity_change: "", notes: "" });
      fetchStats();
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || "Error al ajustar stock");
    } finally { setModalLoading(false); }
  };

  const handleExternalSale = async (e) => {
    e.preventDefault();
    if (!externalForm.variation_id || !externalForm.quantity || externalForm.unit_price === "") return toast.error("Completa los campos requeridos");
    setModalLoading(true);
    try {
      await registerExternalSaleAPI(id, {
        variation_id: externalForm.variation_id,
        quantity: parseInt(externalForm.quantity),
        unit_price: parseFloat(externalForm.unit_price),
        channel: externalForm.channel,
        customer_name: externalForm.customer_name || null,
        notes: externalForm.notes || null,
      });
      toast.success("Venta externa registrada exitosamente");
      setActiveModal(null);
      setExternalForm({ variation_id: "", quantity: "", unit_price: "", channel: "whatsapp", customer_name: "", notes: "" });
      fetchStats();
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || "Error al registrar venta externa");
    } finally { setModalLoading(false); }
  };

  // ── Loading skeleton ──
  if (loading && !stats) {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl p-8 animate-pulse" style={{ background: "linear-gradient(135deg, #1a0a2e, #531575)" }}>
          <div className="h-4 w-32 bg-white/10 rounded mb-4" />
          <div className="h-8 w-64 bg-white/10 rounded mb-2" />
          <div className="h-4 w-48 bg-white/10 rounded" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-2xl p-5 animate-pulse bg-white border border-slate-100">
              <div className="h-3 w-20 bg-gray-200 rounded mb-3" />
              <div className="h-8 w-28 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const { product, stockSummary, salesStats, externalSalesStats, priceHistory, recentStockMovements, recentOrders, profitability } = stats;
  const variations = product?.variations || [];

  return (
    <div className="space-y-6 pb-12">
      {/* ══════════════════════════════════════════════════════════════
          HERO HEADER
      ══════════════════════════════════════════════════════════════ */}
      <div className="relative overflow-hidden rounded-[24px] p-6 sm:p-8" style={{ background: "linear-gradient(135deg, #1a0a2e 0%, #531575 50%, #6b1e96 100%)" }}>
        <div className="absolute top-0 right-0 w-72 h-72 rounded-full opacity-10 pointer-events-none" style={{ background: "radial-gradient(circle, #c3ff00 0%, transparent 70%)", transform: "translate(30%, -30%)" }} />
        <div className="relative z-10">
          <button onClick={() => navigate("/store/products")} className="inline-flex items-center gap-1.5 text-xs text-purple-200 hover:text-white font-semibold transition-colors mb-3 group">
            <span className="transition-transform group-hover:-translate-x-1">←</span> Volver a Productos
          </button>

          <div className="flex items-start gap-5">
            {product.images?.[0] && (
              <img src={product.images[0]} alt={product.name} className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover border-2 border-white/20 shadow-lg flex-shrink-0" />
            )}
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white truncate">{product.name}</h1>
              <div className="flex flex-wrap items-center gap-3 mt-2">
                <span className="text-[#c3ff00] font-bold text-lg">${fmt(product.price)}</span>
                {product.compare_at_price && parseFloat(product.compare_at_price) > 0 && (
                  <span className="text-white/40 line-through text-sm">${fmt(product.compare_at_price)}</span>
                )}
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  product.stock_status === "Activo" ? "bg-[#c3ff00]/20 text-[#c3ff00]" :
                  product.stock_status === "Sin stock" ? "bg-red-500/20 text-red-300" :
                  "bg-white/10 text-white/60"
                }`}>
                  {product.stock_status}
                </span>
              </div>
              {product.category && (
                <p className="text-white/40 text-xs mt-1">{product.category.name} {product.brand ? `· ${product.brand.name}` : ""}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          PERIOD SELECTOR + ACTIONS
      ══════════════════════════════════════════════════════════════ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                period === p.value
                  ? "bg-[#6b1e96] text-white shadow-md shadow-purple-500/20"
                  : "bg-white text-gray-500 border border-slate-200 hover:border-purple-300 hover:text-purple-700"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setActiveModal("restock")} className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 text-white hover:bg-emerald-600 active:scale-95 transition-all shadow-sm flex items-center gap-1.5">
            📦 Reponer Stock
          </button>
          <button onClick={() => setActiveModal("adjust")} className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-500 text-white hover:bg-indigo-600 active:scale-95 transition-all shadow-sm flex items-center gap-1.5">
            ✏️ Ajustar
          </button>
          <button onClick={() => setActiveModal("external")} className="px-4 py-2 rounded-xl text-xs font-bold bg-pink-500 text-white hover:bg-pink-600 active:scale-95 transition-all shadow-sm flex items-center gap-1.5">
            📱 Venta Externa
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          KPI CARDS
      ══════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: "Ventas Totales", value: `$${fmt(salesStats.totalRevenue)}`, icon: "💰", accent: "#6b1e96" },
          { title: "Unidades Vendidas", value: fmtInt(salesStats.totalUnitsSold), icon: "📦", accent: "#059669" },
          { title: "Stock Actual", value: fmtInt(stockSummary.currentTotal), icon: "🏪", accent: "#2563eb" },
          { title: "Restocks", value: fmtInt(stockSummary.totalRestocks), icon: "🔄", accent: "#f59e0b" },
        ].map((kpi, i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{kpi.title}</p>
              <span className="text-xl">{kpi.icon}</span>
            </div>
            <p className="text-2xl font-extrabold" style={{ color: kpi.accent }}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════
          SECONDARY KPIs ROW
      ══════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-gradient-to-br from-purple-50 to-white rounded-xl p-4 border border-purple-100/50">
          <p className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">Ticket Promedio</p>
          <p className="text-lg font-extrabold text-purple-900 mt-1">${fmt(salesStats.avgPricePerUnit)}</p>
        </div>
        <div className="bg-gradient-to-br from-pink-50 to-white rounded-xl p-4 border border-pink-100/50">
          <p className="text-[10px] font-bold text-pink-400 uppercase tracking-wider">Ventas Externas</p>
          <p className="text-lg font-extrabold text-pink-900 mt-1">${fmt(externalSalesStats.totalRevenue)}</p>
          <p className="text-[10px] text-pink-400 mt-0.5">{fmtInt(externalSalesStats.totalUnits)} unidades</p>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl p-4 border border-blue-100/50">
          <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Órdenes</p>
          <p className="text-lg font-extrabold text-blue-900 mt-1">{fmtInt(salesStats.totalOrders)}</p>
        </div>
        {profitability && (
          <div className="bg-gradient-to-br from-emerald-50 to-white rounded-xl p-4 border border-emerald-100/50">
            <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
              {salesStats.totalUnitsSold > 0 ? "Margen Bruto" : "Margen Estimado"}
            </p>
            <p className="text-lg font-extrabold text-emerald-900 mt-1">{profitability.marginPercent}%</p>
            <p className="text-[10px] text-emerald-400 mt-0.5">
              {salesStats.totalUnitsSold > 0 ? `$${fmt(profitability.grossProfit)} ganancia` : "Markup teórico"}
            </p>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════
          SALES CHART
      ══════════════════════════════════════════════════════════════ */}
      {salesStats.salesChart?.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
            📈 Ventas en el Período
            {salesStats.bestMonth && (
              <span className="text-[10px] bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full font-semibold">
                Mejor mes: {salesStats.bestMonth.month} (${fmt(salesStats.bestMonth.revenue)})
              </span>
            )}
          </h3>
          <div className="relative h-48">
            {/* Simple bar chart */}
            <div className="flex items-end gap-1 h-full">
              {(() => {
                const maxRev = Math.max(...salesStats.salesChart.map(d => d.revenue), 1);
                return salesStats.salesChart.map((d, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center justify-end group relative min-w-0">
                    <div
                      className="w-full rounded-t-md transition-all duration-300 hover:opacity-80 cursor-pointer"
                      style={{
                        height: `${Math.max((d.revenue / maxRev) * 100, 4)}%`,
                        background: "linear-gradient(to top, #6b1e96, #8b5cf6)",
                        minHeight: "4px",
                      }}
                    />
                    {/* Tooltip */}
                    <div className="absolute bottom-full mb-2 bg-gray-900 text-white text-[10px] rounded-lg px-2.5 py-1.5 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10 whitespace-nowrap shadow-lg">
                      <p className="font-bold">{d.date}</p>
                      <p>${fmt(d.revenue)} · {d.units} uds</p>
                    </div>
                    {salesStats.salesChart.length <= 15 && (
                      <p className="text-[8px] text-gray-400 mt-1 truncate w-full text-center">{d.date.slice(5)}</p>
                    )}
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          STOCK BY VARIATION + EXTERNAL SALES BY CHANNEL
      ══════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Stock por Variación */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          <h3 className="text-sm font-bold text-gray-800 mb-4">🏷️ Stock por Variación</h3>
          <div className="space-y-2">
            {variations.map((v) => {
              const totalStock = stockSummary.currentTotal || 1;
              const pct = totalStock > 0 ? (v.stock / totalStock) * 100 : 0;
              return (
                <div key={v.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50/50 border border-slate-100/50">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-800 truncate">{parseVariationLabel(v)}</p>
                    {v.sku && <p className="text-[10px] text-gray-400">SKU: {v.sku}</p>}
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="w-20 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{
                        width: `${Math.min(pct, 100)}%`,
                        background: v.stock > 5 ? "#059669" : v.stock > 0 ? "#f59e0b" : "#dc2626"
                      }} />
                    </div>
                    <span className={`text-sm font-extrabold min-w-[3rem] text-right ${
                      v.stock > 5 ? "text-emerald-600" : v.stock > 0 ? "text-amber-600" : "text-red-600"
                    }`}>
                      {v.stock}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Ventas Externas por Canal */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          <h3 className="text-sm font-bold text-gray-800 mb-4">📱 Ventas Externas por Canal</h3>
          {Object.keys(externalSalesStats.byChannel || {}).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(externalSalesStats.byChannel).map(([channel, data]) => (
                <div key={channel} className="flex items-center justify-between p-3 rounded-xl bg-pink-50/30 border border-pink-100/50">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">
                      {channel === "instagram" ? "📸" : channel === "whatsapp" ? "💬" : channel === "presencial" ? "🏪" : channel === "facebook" ? "👤" : "📌"}
                    </span>
                    <span className="text-xs font-bold text-gray-700">{CHANNEL_LABELS[channel] || channel}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-extrabold text-pink-700">${fmt(data.revenue)}</p>
                    <p className="text-[10px] text-pink-400">{data.units} uds</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-3xl mb-2">📱</p>
              <p className="text-xs text-gray-400 font-semibold">No hay ventas externas registradas</p>
              <button onClick={() => setActiveModal("external")} className="mt-2 text-xs text-pink-600 font-bold hover:text-pink-700 underline">
                Registrar primera venta
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          PRICE HISTORY
      ══════════════════════════════════════════════════════════════ */}
      {priceHistory?.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          <h3 className="text-sm font-bold text-gray-800 mb-4">📊 Historial de Precios</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left py-2 px-3 text-gray-400 font-bold uppercase tracking-wider">Fecha</th>
                  <th className="text-right py-2 px-3 text-gray-400 font-bold uppercase tracking-wider">Precio Anterior</th>
                  <th className="text-right py-2 px-3 text-gray-400 font-bold uppercase tracking-wider">Precio Nuevo</th>
                  <th className="text-right py-2 px-3 text-gray-400 font-bold uppercase tracking-wider">Costo Anterior</th>
                  <th className="text-right py-2 px-3 text-gray-400 font-bold uppercase tracking-wider">Costo Nuevo</th>
                  <th className="text-center py-2 px-3 text-gray-400 font-bold uppercase tracking-wider">Fuente</th>
                </tr>
              </thead>
              <tbody>
                {priceHistory.map((ph) => (
                  <tr key={ph.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-gray-700">
                      {new Date(ph.created_at).toLocaleDateString("es-VE", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="py-2.5 px-3 text-right text-gray-500">{ph.old_price ? `$${fmt(ph.old_price)}` : "—"}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-gray-900">${fmt(ph.new_price)}</td>
                    <td className="py-2.5 px-3 text-right text-gray-500">{ph.old_cost_price ? `$${fmt(ph.old_cost_price)}` : "—"}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-gray-700">{ph.new_cost_price ? `$${fmt(ph.new_cost_price)}` : "—"}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        ph.change_source === "initial" ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-600"
                      }`}>
                        {ph.change_source === "initial" ? "Inicial" : ph.change_source === "manual" ? "Manual" : ph.change_source}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          STOCK MOVEMENTS TIMELINE
      ══════════════════════════════════════════════════════════════ */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
        <h3 className="text-sm font-bold text-gray-800 mb-4">📋 Movimientos de Inventario</h3>
        {recentStockMovements?.length > 0 ? (
          <div className="space-y-2">
            {recentStockMovements.map((m) => {
              const config = MOVEMENT_TYPES[m.type] || MOVEMENT_TYPES.adjustment;
              return (
                <div key={m.id} className="flex items-center gap-3 p-3 rounded-xl border transition-colors hover:shadow-sm" style={{ borderColor: `${config.color}20`, background: `${config.bg}30` }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0" style={{ background: config.bg }}>
                    {config.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold" style={{ color: config.color }}>{config.label}</span>
                      {m.variation && (
                        <span className="text-[9px] font-bold text-gray-600 bg-white/70 px-1.5 py-0.5 rounded-md border border-slate-100/50 shadow-2xs">
                          {parseVariationLabel(m.variation)}
                        </span>
                      )}
                      <span className="text-[10px] text-gray-400">
                        {new Date(m.created_at).toLocaleDateString("es-VE", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    {m.notes && <p className="text-[10px] text-gray-500 truncate mt-0.5">{m.notes}</p>}
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className={`text-sm font-extrabold ${m.quantity_change >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                      {m.quantity_change >= 0 ? "+" : ""}{m.quantity_change}
                    </span>
                    <div className="text-right">
                      <p className="text-[10px] text-gray-400">Stock</p>
                      <p className="text-xs font-bold text-gray-700">{m.stock_after}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-3xl mb-2">📋</p>
            <p className="text-xs text-gray-400 font-semibold">No hay movimientos registrados en este período</p>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════
          RECENT ORDERS TABLE
      ══════════════════════════════════════════════════════════════ */}
      {recentOrders?.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          <h3 className="text-sm font-bold text-gray-800 mb-4">🛒 Últimas Órdenes del Producto</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left py-2 px-3 text-gray-400 font-bold uppercase tracking-wider">Orden</th>
                  <th className="text-left py-2 px-3 text-gray-400 font-bold uppercase tracking-wider">Cliente</th>
                  <th className="text-center py-2 px-3 text-gray-400 font-bold uppercase tracking-wider">Cantidad</th>
                  <th className="text-right py-2 px-3 text-gray-400 font-bold uppercase tracking-wider">Total</th>
                  <th className="text-center py-2 px-3 text-gray-400 font-bold uppercase tracking-wider">Estado</th>
                  <th className="text-right py-2 px-3 text-gray-400 font-bold uppercase tracking-wider">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((o, i) => (
                  <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-purple-700">#{o.order_id_short}</td>
                    <td className="py-2.5 px-3 font-semibold text-gray-700">{o.customer_name}</td>
                    <td className="py-2.5 px-3 text-center font-bold text-gray-800">{o.quantity}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-gray-900">${fmt(o.total)}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        o.payment_status === "paid" || o.payment_status === "approved" || o.payment_status === "delivered"
                          ? "bg-emerald-100 text-emerald-700"
                          : o.payment_status === "pending" ? "bg-amber-100 text-amber-700"
                          : "bg-red-100 text-red-700"
                      }`}>
                        {o.payment_status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right text-gray-500">
                      {new Date(o.created_at).toLocaleDateString("es-VE", { day: "numeric", month: "short" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          MODALS
      ══════════════════════════════════════════════════════════════ */}
      {activeModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => !modalLoading && setActiveModal(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-5" onClick={(e) => e.stopPropagation()}>
            
            {/* ── RESTOCK MODAL ── */}
            {activeModal === "restock" && (
              <form onSubmit={handleRestock} className="space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-xl">📦</div>
                  <div>
                    <h3 className="font-bold text-gray-900">Reponer Stock</h3>
                    <p className="text-xs text-gray-400">Añade unidades al inventario de una variación</p>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Variación *</label>
                  <select value={restockForm.variation_id} onChange={(e) => setRestockForm(p => ({ ...p, variation_id: e.target.value }))} required
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500">
                    <option value="">Seleccionar variación</option>
                    {variations.map((v) => (
                      <option key={v.id} value={v.id}>{parseVariationLabel(v)} (Stock: {v.stock})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Cantidad a Agregar *</label>
                  <input type="number" min="1" required value={restockForm.quantity} onChange={(e) => setRestockForm(p => ({ ...p, quantity: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 font-bold"
                    placeholder="Ej: 50" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Nota (opcional)</label>
                  <input type="text" value={restockForm.notes} onChange={(e) => setRestockForm(p => ({ ...p, notes: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm" placeholder="Ej: Lote #45 - Proveedor XYZ" />
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <button type="button" onClick={() => setActiveModal(null)} disabled={modalLoading}
                    className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold bg-slate-100 text-gray-600 hover:bg-slate-200 transition-all">
                    Cancelar
                  </button>
                  <button type="submit" disabled={modalLoading}
                    className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold bg-emerald-500 text-white hover:bg-emerald-600 active:scale-95 transition-all disabled:opacity-50 shadow-md">
                    {modalLoading ? "Procesando..." : "Confirmar Reposición"}
                  </button>
                </div>
              </form>
            )}

            {/* ── ADJUST MODAL ── */}
            {activeModal === "adjust" && (
              <form onSubmit={handleAdjust} className="space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-xl">✏️</div>
                  <div>
                    <h3 className="font-bold text-gray-900">Ajuste Manual de Stock</h3>
                    <p className="text-xs text-gray-400">Corrige el inventario (+/-) con razón obligatoria</p>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Variación *</label>
                  <select value={adjustForm.variation_id} onChange={(e) => setAdjustForm(p => ({ ...p, variation_id: e.target.value }))} required
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500">
                    <option value="">Seleccionar variación</option>
                    {variations.map((v) => (
                      <option key={v.id} value={v.id}>{parseVariationLabel(v)} (Stock: {v.stock})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Ajuste *</label>
                  <input type="number" required value={adjustForm.quantity_change} onChange={(e) => setAdjustForm(p => ({ ...p, quantity_change: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 font-bold"
                    placeholder="Positivo para añadir, negativo para restar (ej: -3)" />
                  <p className="text-[10px] text-gray-400 mt-1">Usa valores negativos para restar unidades (ej: -5)</p>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Razón del Ajuste *</label>
                  <input type="text" required minLength={3} value={adjustForm.notes} onChange={(e) => setAdjustForm(p => ({ ...p, notes: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm" placeholder="Ej: Corrección por conteo físico" />
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <button type="button" onClick={() => setActiveModal(null)} disabled={modalLoading}
                    className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold bg-slate-100 text-gray-600 hover:bg-slate-200 transition-all">
                    Cancelar
                  </button>
                  <button type="submit" disabled={modalLoading}
                    className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold bg-indigo-500 text-white hover:bg-indigo-600 active:scale-95 transition-all disabled:opacity-50 shadow-md">
                    {modalLoading ? "Procesando..." : "Aplicar Ajuste"}
                  </button>
                </div>
              </form>
            )}

            {/* ── EXTERNAL SALE MODAL ── */}
            {activeModal === "external" && (
              <form onSubmit={handleExternalSale} className="space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                  <div className="w-10 h-10 rounded-xl bg-pink-100 flex items-center justify-center text-xl">📱</div>
                  <div>
                    <h3 className="font-bold text-gray-900">Registrar Venta Externa</h3>
                    <p className="text-xs text-gray-400">Registra una venta realizada fuera de la plataforma</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Variación *</label>
                    <select value={externalForm.variation_id} onChange={(e) => setExternalForm(p => ({ ...p, variation_id: e.target.value }))} required
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-pink-500/10 focus:border-pink-500">
                      <option value="">Seleccionar</option>
                      {variations.map((v) => (
                        <option key={v.id} value={v.id}>{parseVariationLabel(v)} ({v.stock})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Canal *</label>
                    <select value={externalForm.channel} onChange={(e) => setExternalForm(p => ({ ...p, channel: e.target.value }))} required
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-pink-500/10 focus:border-pink-500">
                      <option value="whatsapp">WhatsApp</option>
                      <option value="instagram">Instagram</option>
                      <option value="facebook">Facebook</option>
                      <option value="presencial">Presencial</option>
                      <option value="otro">Otro</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Cantidad *</label>
                    <input type="number" min="1" required value={externalForm.quantity} onChange={(e) => setExternalForm(p => ({ ...p, quantity: e.target.value }))}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm font-bold" placeholder="1" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Precio Unitario ($) *</label>
                    <input type="number" min="0" step="0.01" required value={externalForm.unit_price} onChange={(e) => setExternalForm(p => ({ ...p, unit_price: e.target.value }))}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm font-bold" placeholder="25.00" />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Nombre del Cliente (opcional)</label>
                  <input type="text" value={externalForm.customer_name} onChange={(e) => setExternalForm(p => ({ ...p, customer_name: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm" placeholder="Ej: Dr. García" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Nota (opcional)</label>
                  <input type="text" value={externalForm.notes} onChange={(e) => setExternalForm(p => ({ ...p, notes: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm" placeholder="Ej: Pago en efectivo" />
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <button type="button" onClick={() => setActiveModal(null)} disabled={modalLoading}
                    className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold bg-slate-100 text-gray-600 hover:bg-slate-200 transition-all">
                    Cancelar
                  </button>
                  <button type="submit" disabled={modalLoading}
                    className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold bg-pink-500 text-white hover:bg-pink-600 active:scale-95 transition-all disabled:opacity-50 shadow-md">
                    {modalLoading ? "Procesando..." : "Registrar Venta"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
