import { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { getPaymentHistoryAPI, getStoresListAPI } from "../../services/api";
import { formatCurrencyUSD, formatCurrencyVES, formatOrderDateTime } from "../../utils/formatters";
import PaymentReviewSlideOver from "../../components/admin/PaymentReviewSlideOver";
import Pagination from "../../components/admin/Pagination";
import toast from "react-hot-toast";
import PropTypes from "prop-types";
import SearchableSelect from "../../components/ui/SearchableSelect";
import "../../components/ui/SearchableSelect.css";
import { CreditCardIcon, WalletIcon, StorefrontIcon, ListBulletIcon, CalendarIcon, SearchIcon } from "../../components/ui/FilterIcons";

// ── Opciones de los filtros ──
const PAGE_OPTIONS = [
  { value: 10, label: "10 por página" },
  { value: 20, label: "20 por página" },
  { value: 30, label: "30 por página" },
  { value: 50, label: "50 por página" },
];

const PAYMENT_STATUS_OPTIONS = [
  { value: "", label: "Todos los Estados" },
  { value: "approved", label: "✅ Aprobado" },
  { value: "under_review", label: "🔍 En Revisión" },
  { value: "pending", label: "⏳ Pendiente" },
  { value: "rejected", label: "⛔ Rechazado" },
  { value: "failed", label: "❌ Fallido" },
];

const PAYMENT_METHOD_OPTIONS = [
  { value: "", label: "Todos los Métodos" },
  { value: "pago_movil", label: "📱 Pago Móvil" },
  { value: "transferencia", label: "🏦 Transferencia" },
  { value: "zelle", label: "💲 Zelle" },
  { value: "binance", label: "🪙 Binance" },
  { value: "paypal", label: "🅿️ PayPal" },
];

// ── Status Badge Component ──
function StatusBadge({ status }) {
  const config = {
    approved: { label: "Aprobado", bg: "#dcfce7", color: "#166534", dot: "#22c55e" },
    rejected: { label: "Rechazado", bg: "#fee2e2", color: "#991b1b", dot: "#ef4444" },
    under_review: { label: "En Revisión", bg: "#fef9c3", color: "#854d0e", dot: "#eab308" },
    pending: { label: "Pendiente", bg: "#f3f4f6", color: "#374151", dot: "#9ca3af" },
    failed: { label: "Fallido", bg: "#fce4ec", color: "#b71c1c", dot: "#e53935" },
  };
  const c = config[status] || config.pending;
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
      style={{ background: c.bg, color: c.color }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: c.dot }} />
      {c.label}
    </span>
  );
}

StatusBadge.propTypes = {
  status: PropTypes.string.isRequired,
};

// ── KPI Card Component ──
function KpiCard({ title, value, subtitle, gradient, icon }) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl p-5 text-white transition-all duration-300 hover:scale-[1.02] hover:shadow-xl group"
      style={{ background: gradient }}
    >
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%)' }} />
      <div className="relative z-10 flex items-start justify-between">
        <div>
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-white/70 mb-1">{title}</h3>
          <p className="text-2xl md:text-3xl font-bold leading-tight">{value}</p>
          {subtitle && <p className="text-xs text-white/50 mt-1">{subtitle}</p>}
        </div>
        <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: 'rgba(195,255,0,0.15)' }}>
          {icon}
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: '#c3ff00' }} />
    </div>
  );
}

KpiCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  subtitle: PropTypes.string,
  gradient: PropTypes.string.isRequired,
  icon: PropTypes.node.isRequired,
};

// ── Helper: Extract unique store names from an order ──
function getOrderStores(order) {
  if (!order.order_items || !order.order_items.length) return ["—"];
  const names = new Set();
  for (const item of order.order_items) {
    const name = item.store_profiles?.business_name;
    if (name) names.add(name);
  }
  return names.size > 0 ? [...names] : ["—"];
}

function StoreChip({ name }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium"
      style={{ background: 'rgba(83,21,117,0.08)', color: '#531575' }}
    >
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3 shrink-0">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z" />
      </svg>
      {name}
    </span>
  );
}

StoreChip.propTypes = {
  name: PropTypes.string.isRequired,
};

// ── CSV Export Helper ──
function exportToCsv(orders, summary) {
  const headers = [
    "Orden ID",
    "Fecha",
    "Cliente",
    "Email",
    "Tienda(s)",
    "Método Pago",
    "Estado Pago",
    "Total USD",
    "Total VES",
    "Comisión USD",
    "Tasa BCV",
  ];

  const rows = orders.map((o) => [
    o.id.split("-")[0].toUpperCase(),
    new Date(o.created_at).toLocaleDateString("es-VE"),
    o.users?.full_name || "—",
    o.users?.email || "—",
    getOrderStores(o).join(" | "),
    o.payment_method?.replace("_", " ") || "—",
    o.payment_status || "—",
    o.total_usd?.toFixed(2) || "0.00",
    o.total_ves?.toFixed(2) || "0.00",
    o.commission_amount_usd?.toFixed(2) || "0.00",
    o.exchange_rate_at_purchase || "—",
  ]);

  // Add summary row
  rows.push([]);
  rows.push(["RESUMEN"]);
  rows.push(["Total USD", summary.totalUsd?.toFixed(2)]);
  rows.push(["Total VES", summary.totalVes?.toFixed(2)]);
  rows.push(["Total Comisiones USD", summary.totalCommissionUsd?.toFixed(2)]);
  rows.push(["Total Órdenes", summary.totalOrders]);

  const csvContent =
    "\uFEFF" + // BOM for Excel UTF-8
    [headers.join(","), ...rows.map((r) => r.map((c) => `"${c}"`).join(","))].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `historial_pagos_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ══════════════════════════════════════════════════════════
// ██   MAIN COMPONENT
// ══════════════════════════════════════════════════════════
export default function PaymentHistory() {
  // Data state
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [summary, setSummary] = useState({ totalUsd: 0, totalVes: 0, totalCommissionUsd: 0, totalOrders: 0, countByStatus: {} });
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [reviewOrder, setReviewOrder] = useState(null);

  // Filter state
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    search: "",
    date_from: "",
    date_to: "",
    store_id: "",
    payment_status: "",
    payment_method: "",
  });

  // El buscador se escribe en local y se vuelca a los filtros con debounce
  const [searchInput, setSearchInput] = useState("");
  useEffect(() => {
    const timeout = setTimeout(() => {
      setFilters((prev) =>
        prev.search === searchInput ? prev : { ...prev, search: searchInput, page: 1 },
      );
    }, 400);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  // Fetch stores for dropdown (once)
  useEffect(() => {
    getStoresListAPI()
      .then((res) => setStores(res.data?.data || []))
      .catch(() => {});
  }, []);

  // Main data fetch
  const fetchData = useCallback(async (activeFilters) => {
    setLoading(true);
    try {
      // Clean up empty params
      const params = {};
      for (const [k, v] of Object.entries(activeFilters)) {
        if (v !== "" && v !== null && v !== undefined) params[k] = v;
      }
      const res = await getPaymentHistoryAPI(params);
      const data = res.data;
      setOrders(data.data || []);
      setPagination(data.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 });
      setSummary(data.summary || { totalUsd: 0, totalVes: 0, totalCommissionUsd: 0, totalOrders: 0, countByStatus: {} });
    } catch (err) {
      toast.error(err.message || "Error cargando historial de pagos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(filters);
  }, [filters, fetchData]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleClearFilters = () => {
    setSearchInput("");
    setFilters({ page: 1, limit: 20, search: "", date_from: "", date_to: "", store_id: "", payment_status: "", payment_method: "" });
  };

  const hasActiveFilters = useMemo(() => {
    return (
      filters.search ||
      filters.date_from ||
      filters.date_to ||
      filters.store_id ||
      filters.payment_status ||
      filters.payment_method
    );
  }, [filters]);

  const storeOptions = useMemo(() => {
    return [
      { value: "", label: "Todas las Tiendas" },
      ...stores.map((s) => ({ value: s.id, label: s.name || "Sin nombre" })),
    ];
  }, [stores]);

  // Export: Fetch ALL matching data (no pagination) then generate CSV
  const handleExport = async () => {
    setExporting(true);
    try {
      const params = {};
      for (const [k, v] of Object.entries(filters)) {
        if (v !== "" && v !== null && v !== undefined && k !== "page" && k !== "limit") {
          params[k] = v;
        }
      }
      params.limit = 100; // Max allowed per request
      params.page = 1;

      // Fetch all pages
      let allOrders = [];
      let currentPage = 1;
      let totalPages = 1;

      do {
        params.page = currentPage;
        const res = await getPaymentHistoryAPI(params);
        allOrders = allOrders.concat(res.data.data || []);
        totalPages = res.data.pagination?.totalPages || 1;
        currentPage++;
      } while (currentPage <= totalPages);

      exportToCsv(allOrders, summary);
      toast.success(`CSV exportado: ${allOrders.length} registros`);
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Error exportando CSV");
    } finally {
      setExporting(false);
    }
  };

  // Payment method options derived from known methods
  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* ── Header ── */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #531575, #6b1e96)' }}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-[#c3ff00]">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
              </svg>
            </div>
            Historial de Pagos
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Vista completa de todos los pagos procesados en la plataforma. Filtra, analiza y exporta reportes.
          </p>
        </div>
        <div className="mt-4 flex gap-2 md:mt-0 md:ml-4">
          <button
            onClick={handleExport}
            disabled={exporting || loading || orders.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-md hover:scale-[1.02]"
            style={{
              background: 'linear-gradient(135deg, #0d5e3a 0%, #10b981 100%)',
              color: '#ffffff',
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            {exporting ? "Exportando..." : "Exportar CSV"}
          </button>
          <button
            onClick={() => fetchData(filters)}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 transition-all duration-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182" />
            </svg>
            {loading ? "Cargando..." : "Refrescar"}
          </button>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Total Recaudado"
          value={formatCurrencyUSD(summary.totalUsd)}
          subtitle={formatCurrencyVES(summary.totalVes)}
          gradient="linear-gradient(135deg, #531575 0%, #6b1e96 100%)"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-[#c3ff00]">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          }
        />
        <KpiCard
          title="Comisiones"
          value={formatCurrencyUSD(summary.totalCommissionUsd)}
          subtitle="Ingresos plataforma"
          gradient="linear-gradient(135deg, #0d5e3a 0%, #10b981 100%)"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-[#c3ff00]">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" />
            </svg>
          }
        />
        <KpiCard
          title="Total Órdenes"
          value={summary.totalOrders}
          subtitle={`${summary.countByStatus?.approved || 0} aprobadas`}
          gradient="linear-gradient(135deg, #92400e 0%, #f59e0b 100%)"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-white">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
            </svg>
          }
        />
        <KpiCard
          title="Pendientes"
          value={(summary.countByStatus?.under_review || 0) + (summary.countByStatus?.pending || 0)}
          subtitle={`${summary.countByStatus?.rejected || 0} rechazados`}
          gradient="linear-gradient(135deg, #7c2d12 0%, #dc2626 100%)"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-white">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          }
        />
      </div>

      {/* ── Buscador y Filtros ── */}
      <div
        style={{
          background: "#fff",
          borderRadius: "16px",
          border: "1px solid #f0f0f0",
          padding: "16px 20px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        }}
      >
        {/* Buscador */}
        <div style={{ position: "relative", marginBottom: "16px" }}>
          <SearchIcon style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#9ca3af" }} />
          <input
            type="text"
            placeholder="Buscar por número de orden, email o nombre del cliente..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            style={{
              width: "100%",
              padding: "12px 14px 12px 42px",
              borderRadius: "10px",
              border: "1.5px solid #e5e7eb",
              fontSize: "13px",
              outline: "none",
              transition: "border-color 0.2s, box-shadow 0.2s",
              background: "#fafafa",
              color: "#1f2937",
              boxSizing: "border-box",
            }}
            onFocus={(e) => { e.target.style.borderColor = "#6b1e96"; e.target.style.background = "#fff"; e.target.style.boxShadow = "0 0 0 3px rgba(107,30,150,0.08)"; }}
            onBlur={(e) => { e.target.style.borderColor = "#e5e7eb"; e.target.style.background = "#fafafa"; e.target.style.boxShadow = "none"; }}
          />
        </div>

        {/* Fila de filtros */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center" }}>
          {/* Tienda */}
          <div style={{ flex: "1 1 170px", minWidth: "160px" }}>
            <SearchableSelect
              options={storeOptions}
              value={filters.store_id}
              onChange={(val) => handleFilterChange("store_id", val)}
              placeholder="Todas las Tiendas"
              searchPlaceholder="Buscar tienda..."
              icon={<StorefrontIcon className="h-4 w-4" />}
            />
          </div>

          {/* Estado del pago */}
          <div style={{ flex: "1 1 170px", minWidth: "160px" }}>
            <SearchableSelect
              options={PAYMENT_STATUS_OPTIONS}
              value={filters.payment_status}
              onChange={(val) => handleFilterChange("payment_status", val)}
              placeholder="Todos los Estados"
              searchPlaceholder="Buscar estado..."
              icon={<CreditCardIcon className="h-4 w-4" />}
            />
          </div>

          {/* Método de pago */}
          <div style={{ flex: "1 1 170px", minWidth: "160px" }}>
            <SearchableSelect
              options={PAYMENT_METHOD_OPTIONS}
              value={filters.payment_method}
              onChange={(val) => handleFilterChange("payment_method", val)}
              placeholder="Todos los Métodos"
              searchPlaceholder="Buscar método..."
              icon={<WalletIcon className="h-4 w-4" />}
            />
          </div>

          {/* Rango de fechas */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: "1 1 260px", minWidth: 0, background: "#f9fafb", padding: "8px 12px", borderRadius: "8px", border: "1px solid #e5e7eb", transition: "all 0.2s" }} className="date-filter-container">
            <CalendarIcon className="h-4 w-4" style={{ color: "#6b1e96", flexShrink: 0 }} />
            <input
              type="date"
              value={filters.date_from}
              onChange={(e) => handleFilterChange("date_from", e.target.value)}
              style={{ background: "transparent", border: "none", fontSize: "12px", color: filters.date_from ? "#1f2937" : "#9ca3af", outline: "none", cursor: "pointer", fontWeight: 500, flex: "1 1 0", minWidth: 0 }}
              title="Fecha desde"
            />
            <span style={{ fontSize: "12px", color: "#d1d5db", fontWeight: "bold", flexShrink: 0 }}>→</span>
            <input
              type="date"
              value={filters.date_to}
              onChange={(e) => handleFilterChange("date_to", e.target.value)}
              style={{ background: "transparent", border: "none", fontSize: "12px", color: filters.date_to ? "#1f2937" : "#9ca3af", outline: "none", cursor: "pointer", fontWeight: 500, flex: "1 1 0", minWidth: 0 }}
              title="Fecha hasta"
            />
          </div>

          {/* Resultados por página */}
          <div style={{ flex: "0 0 155px" }}>
            <SearchableSelect
              options={PAGE_OPTIONS}
              value={filters.limit}
              onChange={(val) => handleFilterChange("limit", Number(val))}
              placeholder="20 por página"
              searchPlaceholder="Buscar..."
              icon={<ListBulletIcon className="h-4 w-4" />}
            />
          </div>

          {/* Limpiar filtros */}
          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              style={{ flex: "0 0 auto", display: "flex", alignItems: "center", gap: "6px", padding: "10px 16px", borderRadius: "8px", border: "1.5px solid rgba(107,30,150,0.15)", background: "rgba(107,30,150,0.04)", color: "#6b1e96", fontSize: "12px", fontWeight: 600, cursor: "pointer", transition: "all 0.2s" }}
            >
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
              Limpiar
            </button>
          )}
        </div>
      </div>

      {/* ── Data Table ── */}
      {loading && orders.length === 0 ? (
        <div className="flex justify-center items-center h-48">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2" style={{ borderColor: '#6b1e96' }} />
            <p className="text-sm text-gray-400">Cargando historial...</p>
          </div>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-100">
          <svg className="mx-auto h-16 w-16 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-700">Sin resultados</h3>
          <p className="mt-1 text-sm text-gray-400">
            {hasActiveFilters
              ? "No hay pagos que coincidan con los filtros seleccionados."
              : "Aún no se han registrado pagos en la plataforma."}
          </p>
          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="mt-4 px-4 py-2 text-sm font-medium rounded-xl text-white transition-all hover:shadow-md"
              style={{ background: 'linear-gradient(135deg, #531575 0%, #6b1e96 100%)' }}
            >
              Limpiar filtros
            </button>
          )}
        </div>
      ) : (
        <div className="md:bg-white md:rounded-2xl md:border md:border-gray-100 md:shadow-sm md:overflow-hidden">
          {/* Vista de tarjetas (móvil): sin contenedor, cada pago es una tarjeta suelta */}
          <div className="md:hidden space-y-3">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      to={`/admin/orders/${order.id}`}
                      className="text-sm font-bold font-mono tracking-wide underline decoration-dotted underline-offset-2"
                      style={{ color: '#531575' }}
                    >
                      {order.id.split("-")[0].toUpperCase()}
                    </Link>
                    <div className="text-xs text-gray-500 mt-0.5">{formatOrderDateTime(order.created_at)}</div>
                  </div>
                  <StatusBadge status={order.payment_status} />
                </div>

                <div className="min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">{order.users?.full_name || "—"}</div>
                  <div className="text-xs text-gray-400 truncate">{order.users?.email || ""}</div>
                </div>

                <div className="flex flex-wrap gap-1">
                  {getOrderStores(order).map((name, i) => (
                    <StoreChip key={i} name={name} />
                  ))}
                </div>

                <div className="flex items-end justify-between gap-3 pt-3 border-t border-gray-100">
                  <span className="inline-flex items-center gap-1.5 text-xs text-gray-600 font-medium uppercase">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                    {order.payment_method?.replace("_", " ") || "—"}
                  </span>
                  <div className="text-right">
                    <div className="text-sm font-bold text-gray-900">{formatCurrencyUSD(order.total_usd)}</div>
                    <div className="text-xs text-gray-400">{formatCurrencyVES(order.total_ves)}</div>
                  </div>
                </div>

                <button
                  onClick={() => setReviewOrder(order)}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-semibold text-[#531575] bg-[#531575]/8 active:bg-[#531575]/15 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  </svg>
                  Ver comprobante y detalle
                </button>
              </div>
            ))}
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100 hidden md:table">
              <thead>
                <tr style={{ background: 'linear-gradient(135deg, #f8f5fc 0%, #f5f3ff 100%)' }}>
                  <th className="px-5 py-3.5 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">Orden</th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">Fecha</th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">Cliente</th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">Tienda(s)</th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">Método</th>
                  <th className="px-5 py-3.5 text-right text-[11px] font-bold text-gray-500 uppercase tracking-wider">Monto</th>
                  <th className="px-5 py-3.5 text-center text-[11px] font-bold text-gray-500 uppercase tracking-wider">Estado</th>
                  <th className="px-5 py-3.5 text-center text-[11px] font-bold text-gray-500 uppercase tracking-wider">Detalle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {orders.map((order, idx) => {
                  const storeNames = getOrderStores(order);
                  return (
                    <tr
                      key={order.id}
                      className="transition-colors duration-150 hover:bg-purple-50/30"
                      style={{ animationDelay: `${idx * 30}ms` }}
                    >
                      {/* Order ID */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <Link
                          to={`/admin/orders/${order.id}`}
                          className="text-sm font-bold font-mono tracking-wide hover:underline"
                          style={{ color: '#531575' }}
                        >
                          {order.id.split("-")[0].toUpperCase()}
                        </Link>
                      </td>

                      {/* Date */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-700">{formatOrderDateTime(order.created_at)}</div>
                      </td>

                      {/* Client */}
                      <td className="px-5 py-4">
                        <div className="text-sm font-medium text-gray-900">{order.users?.full_name || "—"}</div>
                        <div className="text-xs text-gray-400">{order.users?.email || ""}</div>
                      </td>

                      {/* Store(s) */}
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-1">
                          {storeNames.map((name, i) => (
                            <StoreChip key={i} name={name} />
                          ))}
                        </div>
                      </td>

                      {/* Payment Method */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 text-xs text-gray-600 font-medium uppercase">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                          {order.payment_method?.replace("_", " ") || "—"}
                        </span>
                      </td>

                      {/* Amount */}
                      <td className="px-5 py-4 whitespace-nowrap text-right">
                        <div className="text-sm font-bold text-gray-900">{formatCurrencyUSD(order.total_usd)}</div>
                        <div className="text-xs text-gray-400">{formatCurrencyVES(order.total_ves)}</div>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4 whitespace-nowrap text-center">
                        <StatusBadge status={order.payment_status} />
                      </td>

                      {/* Detail */}
                      <td className="px-5 py-4 whitespace-nowrap text-center">
                        <button
                          onClick={() => setReviewOrder(order)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#531575] bg-[#531575]/8 hover:bg-[#531575]/15 transition-colors"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-3.5 h-3.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                          </svg>
                          Ver
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="mt-3 px-5 py-4 bg-white rounded-2xl border border-gray-200 shadow-sm md:mt-0 md:py-0 md:pb-5 md:bg-transparent md:border-0 md:shadow-none md:rounded-none">
            <Pagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              total={pagination.total}
              limit={pagination.limit}
              onPageChange={handlePageChange}
            />
          </div>
        </div>
      )}

      {/* Detalle del pago (solo lectura: aprobar/rechazar vive en /admin/payment-approvals) */}
      {reviewOrder && (
        <PaymentReviewSlideOver
          order={reviewOrder}
          readOnly
          statusBadge={<StatusBadge status={reviewOrder.payment_status} />}
          onClose={() => setReviewOrder(null)}
        />
      )}
    </div>
  );
}
