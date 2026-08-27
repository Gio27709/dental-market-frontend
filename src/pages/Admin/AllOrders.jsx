import { useEffect, useState, useMemo } from "react";
import { useOrder } from "../../context/OrderContext";
import AdminOrderList from "../../components/admin/AdminOrderList";
import SearchableSelect from "../../components/ui/SearchableSelect";
import "../../components/ui/SearchableSelect.css";
import { CreditCardIcon, TruckIcon, WalletIcon, StorefrontIcon, ListBulletIcon, CalendarIcon } from "../../components/ui/FilterIcons";
import { supabase } from "../../lib/supabaseClient";
import usePaymentMethods from "../../hooks/usePaymentMethods";

const PAGE_OPTIONS = [
  { value: 10, label: "10 por página" },
  { value: 20, label: "20 por página" },
  { value: 30, label: "30 por página" },
];

const PAYMENT_STATUS_OPTIONS = [
  { value: "", label: "Todos los Estados" },
  { value: "approved", label: "✅ Aprobado" },
  { value: "under_review", label: "🔍 En Revisión" },
  { value: "pending", label: "⏳ Pendiente" },
  { value: "rejected", label: "⛔ Rechazado" },
  { value: "failed", label: "❌ Fallido" },
  { value: "canceled", label: "🚫 Cancelado" },
];

const DELIVERY_STATUS_OPTIONS = [
  { value: "", label: "Todos los Despachos" },
  { value: "pending", label: "⏳ Pendiente" },
  { value: "confirmed", label: "✅ Confirmado" },
  { value: "shipped", label: "🚚 En Camino" },
  { value: "delivered", label: "📦 Entregado" },
  { value: "cancelled", label: "🚫 Cancelado" },
];

export default function AllOrders() {
  const { orders, pagination, summary, fetchOrders, loading } = useOrder();
  const { metodos: metodosDePago } = usePaymentMethods();

  // El filtro incluye los métodos APAGADOS: los pedidos que se pagaron con ellos siguen en
  // la lista y hay que poder buscarlos. Por eso usa `metodos` y no `activos`.
  const PAYMENT_METHOD_OPTIONS = useMemo(
    () => [
      { value: "", label: "Todos los Métodos" },
      ...metodosDePago.map((m) => ({ value: m.key, label: `${m.icon || ""} ${m.label}`.trim() })),
    ],
    [metodosDePago]
  );

  // Local state for filters
  const [searchTerm, setSearchTerm] = useState("");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("");
  const [deliveryStatusFilter, setDeliveryStatusFilter] = useState("");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("");
  const [storeIdFilter, setStoreIdFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [perPage, setPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [knownStores, setKnownStores] = useState([]);
  // Fetch store list on mount (one-time)
  useEffect(() => {
    const fetchStores = async () => {
      try {
        const { data } = await supabase
          .from("store_profiles")
          .select("user_id, business_name")
          .order("business_name", { ascending: true });
        setKnownStores(data || []);
      } catch { /* silent */ }
    };
    fetchStores();
  }, []);

  const storeOptions = useMemo(() => {
    const opts = [{ value: "", label: "Todas las Tiendas" }];
    knownStores.forEach((s) => {
      opts.push({
        value: s.user_id,
        label: s.business_name || "Sin nombre",
      });
    });
    return opts;
  }, [knownStores]);

  // Trigger server-side fetching with debounce
  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchOrders({
        admin_view: "true",
        page: currentPage,
        limit: perPage,
        search: searchTerm || undefined,
        payment_status: paymentStatusFilter || undefined,
        delivery_status: deliveryStatusFilter || undefined,
        payment_method: paymentMethodFilter || undefined,
        store_id: storeIdFilter || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
      });
    }, 400); // 400ms debounce
    return () => clearTimeout(timeout);
  }, [
    currentPage,
    perPage,
    searchTerm,
    paymentStatusFilter,
    deliveryStatusFilter,

    paymentMethodFilter,
    storeIdFilter,
    dateFrom,
    dateTo,
    fetchOrders,
  ]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchTerm,
    paymentStatusFilter,
    deliveryStatusFilter,
    paymentMethodFilter,
    storeIdFilter,
    dateFrom,
    dateTo,
    perPage,
  ]);

  const clearFilters = () => {
    setSearchTerm("");
    setPaymentStatusFilter("");
    setDeliveryStatusFilter("");
    setPaymentMethodFilter("");
    setStoreIdFilter("");
    setDateFrom("");
    setDateTo("");
    setPerPage(10);
    setCurrentPage(1);
  };

  const hasActiveFilters =
    searchTerm ||
    paymentStatusFilter ||
    deliveryStatusFilter ||
    paymentMethodFilter ||
    storeIdFilter ||
    dateFrom ||
    dateTo;

  return (
    <div className="w-full mx-auto animate-fade-in-up" style={{ minHeight: "100%" }}>
      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap", justifyContent: "space-between", marginBottom: "24px" }}>
        <div>
          <h2 style={{ fontSize: "22px", fontWeight: 800, color: "#1a0a2e", margin: 0, letterSpacing: "-0.02em", display: "flex", alignItems: "center", gap: "10px" }}>
            <svg className="w-7 h-7 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            Historial Global de Pedidos
          </h2>
          <p style={{ fontSize: "13px", color: "#9ca3af", margin: "4px 0 0 0" }}>
            Vista general de absolutamente todos los pedidos procesados en la plataforma.
          </p>
        </div>

        {/* Quick status pills */}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
          {summary?.countByPaymentStatus?.pending > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 14px", borderRadius: "20px", background: "rgba(107,114,128,0.06)", border: "1px solid rgba(107,114,128,0.12)", fontSize: "11px", fontWeight: 700, color: "#6b7280" }}>
              <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#9ca3af" }} />
              {summary.countByPaymentStatus.pending} pendientes
            </div>
          )}
          {summary?.countByPaymentStatus?.under_review > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 14px", borderRadius: "20px", background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.12)", fontSize: "11px", fontWeight: 700, color: "#d97706" }}>
              <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#f59e0b" }} />
              {summary.countByPaymentStatus.under_review} en revisión
            </div>
          )}
          {summary?.countByPaymentStatus?.approved > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 14px", borderRadius: "20px", background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.12)", fontSize: "11px", fontWeight: 700, color: "#059669" }}>
              <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#10b981" }} />
              {summary.countByPaymentStatus.approved} aprobados
            </div>
          )}
          {summary?.countByPaymentStatus?.rejected > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 14px", borderRadius: "20px", background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.12)", fontSize: "11px", fontWeight: 700, color: "#dc2626" }}>
              <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#ef4444" }} />
              {summary.countByPaymentStatus.rejected} rechazados
            </div>
          )}
          <button
            onClick={() => fetchOrders({ admin_view: "true", page: currentPage, limit: perPage, search: searchTerm, payment_status: paymentStatusFilter, delivery_status: deliveryStatusFilter, payment_method: paymentMethodFilter, store_id: storeIdFilter || undefined, date_from: dateFrom, date_to: dateTo })}
            disabled={loading}
            style={{ marginLeft: "8px", padding: "8px 16px", borderRadius: "8px", background: "#fff", border: "1px solid #e5e7eb", color: "#374151", fontSize: "12px", fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1, transition: "all 0.2s" }}
          >
            Refrescar Panel
          </button>
        </div>
      </div>

      {/* ── Search & Filters Bar ── */}
      <div
        style={{
          background: "#fff",
          borderRadius: "16px",
          border: "1px solid #f0f0f0",
          padding: "16px 20px",
          marginBottom: "16px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        }}
      >
        {/* Search */}
        <div style={{ position: "relative", marginBottom: "16px" }}>
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#9ca3af" strokeWidth={2} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input
            type="text"
            placeholder="Buscar por número de orden, email o nombre del cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
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

        {/* Filter Row */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center" }}>
          {/* Store filter */}
          <div style={{ flex: "1 1 170px", minWidth: "160px" }}>
            <SearchableSelect
              options={storeOptions}
              value={storeIdFilter}
              onChange={(val) => setStoreIdFilter(val)}
              placeholder="Tienda: Todas"
              searchPlaceholder="Buscar tienda..."
              icon={<StorefrontIcon className="h-4 w-4" />}
            />
          </div>

          {/* Payment Status filter */}
          <div style={{ flex: "1 1 170px", minWidth: "160px" }}>
            <SearchableSelect
              options={PAYMENT_STATUS_OPTIONS}
              value={paymentStatusFilter}
              onChange={(val) => setPaymentStatusFilter(val)}
              placeholder="Pago: Todos"
              searchPlaceholder="Buscar estado..."
              icon={<CreditCardIcon className="h-4 w-4" />}
            />
          </div>

          {/* Order Status filter */}
          <div style={{ flex: "1 1 170px", minWidth: "160px" }}>
            <SearchableSelect
              options={DELIVERY_STATUS_OPTIONS}
              value={deliveryStatusFilter}
              onChange={(val) => setDeliveryStatusFilter(val)}
              placeholder="Despacho: Todos"
              searchPlaceholder="Buscar envío..."
              icon={<TruckIcon className="h-4 w-4" />}
            />
          </div>

          {/* Payment Method filter */}
          <div style={{ flex: "1 1 170px", minWidth: "160px" }}>
            <SearchableSelect
              options={PAYMENT_METHOD_OPTIONS}
              value={paymentMethodFilter}
              onChange={(val) => setPaymentMethodFilter(val)}
              placeholder="Método: Todos"
              searchPlaceholder="Buscar método..."
              icon={<WalletIcon className="h-4 w-4" />}
            />
          </div>

          {/* Premium Date Range Filter */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: "1 1 260px", minWidth: 0, background: "#f9fafb", padding: "8px 12px", borderRadius: "8px", border: "1px solid #e5e7eb", transition: "all 0.2s" }} className="date-filter-container">
            <CalendarIcon className="h-4 w-4" style={{ color: "#6b1e96", flexShrink: 0 }} />
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              style={{ background: "transparent", border: "none", fontSize: "12px", color: dateFrom ? "#1f2937" : "#9ca3af", outline: "none", cursor: "pointer", fontWeight: 500, flex: "1 1 0", minWidth: 0 }}
              title="Fecha desde"
            />
            <span style={{ fontSize: "12px", color: "#d1d5db", fontWeight: "bold", flexShrink: 0 }}>→</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              style={{ background: "transparent", border: "none", fontSize: "12px", color: dateTo ? "#1f2937" : "#9ca3af", outline: "none", cursor: "pointer", fontWeight: 500, flex: "1 1 0", minWidth: 0 }}
              title="Fecha hasta"
            />
          </div>

          {/* Per page selector */}
          <div style={{ flex: "0 0 155px" }}>
            <SearchableSelect
              options={PAGE_OPTIONS}
              value={perPage}
              onChange={(val) => setPerPage(Number(val))}
              placeholder="10 por página"
              searchPlaceholder="Buscar..."
              icon={<ListBulletIcon className="h-4 w-4" />}
            />
          </div>

          {/* Clear filters */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
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

      {/* ── Content ── */}
      {loading && (!orders || orders.length === 0) ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {[...Array(5)].map((_, i) => (
            <div key={i} style={{ background: "#fff", borderRadius: "12px", border: "1px solid #f0f0f0", padding: "20px", display: "flex", alignItems: "center", gap: "16px", animation: "pulse 1.5s ease-in-out infinite" }}>
              <div style={{ flex: 1 }}>
                <div style={{ width: "200px", height: "14px", background: "#f3f4f6", borderRadius: "4px", marginBottom: "10px" }} />
                <div style={{ width: "120px", height: "10px", background: "#f9fafb", borderRadius: "4px" }} />
              </div>
              <div style={{ width: "80px", height: "24px", background: "#f3f4f6", borderRadius: "12px" }} />
            </div>
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div style={{ background: "#fff", borderRadius: "16px", border: "1px solid #f0f0f0", padding: "48px 24px", textAlign: "center" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>🔍</div>
          <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#374151", marginBottom: "8px" }}>Sin resultados</h3>
          <p style={{ color: "#9ca3af", fontSize: "13px", marginBottom: "20px" }}>No se encontraron órdenes para los filtros proporcionados.</p>
          <button onClick={clearFilters} style={{ padding: "9px 20px", background: "rgba(107,30,150,0.08)", color: "#6b1e96", borderRadius: "8px", border: "1.5px solid rgba(107,30,150,0.15)", fontWeight: 600, fontSize: "12px", cursor: "pointer" }}>Limpiar filtros</button>
        </div>
      ) : (
        <>
          <AdminOrderList orders={orders} />

          {/* ── Footer: Count + Pagination ── */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: "16px",
              padding: "14px 20px",
              background: "#fff",
              borderRadius: "12px",
              border: "1px solid #f0f0f0",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            }}
          >
            {/* Product Count */}
            <div style={{ fontSize: "12px", color: "#6b7280" }}>
              Mostrando{" "}
              <span style={{ fontWeight: 700, color: "#1a0a2e" }}>
                {Math.min((pagination.page - 1) * pagination.limit + 1, pagination.total)}–
                {Math.min(pagination.page * pagination.limit, pagination.total)}
              </span>{" "}
              de{" "}
              <span style={{ fontWeight: 700, color: "#1a0a2e" }}>
                {pagination.total}
              </span>{" "}
              orden{pagination.total !== 1 ? "es" : ""}
              {hasActiveFilters && summary.totalOrders !== undefined && summary.totalOrders !== pagination.total && (
                <span style={{ color: "#9ca3af" }}>
                  {" "}
                  (total plataforma: {summary.totalOrders})
                </span>
              )}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "20px", flexWrap: "wrap" }}>
              {/* Pagination Controls */}
              {pagination.totalPages > 1 && (
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={pagination.page === 1}
                  style={{
                    width: "32px", height: "32px", borderRadius: "8px", border: "1px solid #e5e7eb", background: pagination.page === 1 ? "#f9fafb" : "#fff", color: pagination.page === 1 ? "#d1d5db" : "#374151", display: "flex", alignItems: "center", justifyContent: "center", cursor: pagination.page === 1 ? "not-allowed" : "pointer", transition: "all 0.15s",
                  }}
                >
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                  </svg>
                </button>

                {/* Page numbers */}
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === pagination.totalPages || Math.abs(p - pagination.page) <= 1)
                  .reduce((acc, p, i, arr) => {
                    if (i > 0 && p - arr[i - 1] > 1) acc.push("...");
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p, i) =>
                    p === "..." ? (
                      <span key={`dots-${i}`} style={{ fontSize: "12px", color: "#9ca3af", padding: "0 2px" }}>⋯</span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => setCurrentPage(p)}
                        style={{
                          width: "32px", height: "32px", borderRadius: "8px",
                          border: p === pagination.page ? "1.5px solid #6b1e96" : "1px solid #e5e7eb",
                          background: p === pagination.page ? "linear-gradient(135deg, #531575, #6b1e96)" : "#fff",
                          color: p === pagination.page ? "#c3ff00" : "#374151",
                          fontSize: "12px", fontWeight: p === pagination.page ? 700 : 500, cursor: "pointer", transition: "all 0.15s", display: "flex", alignItems: "center", justifyContent: "center"
                        }}
                      >
                        {p}
                      </button>
                    )
                  )}

                <button
                  onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={pagination.page === pagination.totalPages}
                  style={{
                    width: "32px", height: "32px", borderRadius: "8px", border: "1px solid #e5e7eb", background: pagination.page === pagination.totalPages ? "#f9fafb" : "#fff", color: pagination.page === pagination.totalPages ? "#d1d5db" : "#374151", display: "flex", alignItems: "center", justifyContent: "center", cursor: pagination.page === pagination.totalPages ? "not-allowed" : "pointer", transition: "all 0.15s",
                  }}
                >
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </button>
              </div>
            )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
