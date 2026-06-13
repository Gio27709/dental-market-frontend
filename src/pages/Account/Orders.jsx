import { useEffect, useState, useMemo } from "react";
import LoadingSkeleton from "../../components/LoadingSkeleton";
import { Link } from "react-router-dom";
import { useOrder } from "../../context/OrderContext";
import OrderCard from "../../components/orders/OrderCard";

export default function Orders() {
  const { orders, loading, error, fetchOrders } = useOrder();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTab, setSelectedTab] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedTab, dateFilter]);

  // Calculate counts for each tab using full list of orders (unfiltered)
  const tabCounts = useMemo(() => {
    const counts = {
      all: orders.length,
      pending_payment: 0,
      in_progress: 0,
      delivered: 0,
      cancelled: 0,
    };

    orders.forEach((order) => {
      const allDelivered =
        order.order_items?.length > 0 &&
        order.order_items.every((i) => i.delivery_status === "delivered");
      const allCancelled =
        order.order_items?.length > 0 &&
        order.order_items.every((i) => i.delivery_status === "cancelled");
      const anyShipped = order.order_items?.some(
        (i) => ["shipped", "picked_up", "arrived"].includes(i.delivery_status),
      );
      const ageInHours =
        (Date.now() - new Date(order.created_at).getTime()) / (1000 * 60 * 60);
      const isExpired =
        order.payment_status === "pending" &&
        !order.payment_proof_url &&
        ageInHours >= 2;

      if (
        order.status === "cancelled" ||
        order.status === "rejected" ||
        order.payment_status === "failed" ||
        allCancelled ||
        isExpired
      ) {
        counts.cancelled++;
      } else if (allDelivered) {
        counts.delivered++;
      } else if (
        order.payment_status === "approved" ||
        order.payment_status === "under_review" ||
        order.payment_status === "processing" ||
        anyShipped
      ) {
        counts.in_progress++;
      } else {
        counts.pending_payment++;
      }
    });

    return counts;
  }, [orders]);

  // Filter orders reactively
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // 1. Tab filter
      const allDelivered =
        order.order_items?.length > 0 &&
        order.order_items.every((i) => i.delivery_status === "delivered");
      const allCancelled =
        order.order_items?.length > 0 &&
        order.order_items.every((i) => i.delivery_status === "cancelled");
      const anyShipped = order.order_items?.some(
        (i) => ["shipped", "picked_up", "arrived"].includes(i.delivery_status),
      );
      const ageInHours =
        (Date.now() - new Date(order.created_at).getTime()) / (1000 * 60 * 60);
      const isExpired =
        order.payment_status === "pending" &&
        !order.payment_proof_url &&
        ageInHours >= 2;

      let category = "pending_payment";
      if (
        order.status === "cancelled" ||
        order.status === "rejected" ||
        order.payment_status === "failed" ||
        allCancelled ||
        isExpired
      ) {
        category = "cancelled";
      } else if (allDelivered) {
        category = "delivered";
      } else if (
        order.payment_status === "approved" ||
        order.payment_status === "under_review" ||
        order.payment_status === "processing" ||
        anyShipped
      ) {
        category = "in_progress";
      }

      if (selectedTab !== "all" && category !== selectedTab) {
        return false;
      }

      // 2. Date filter
      const orderDate = new Date(order.created_at);
      const now = new Date();

      if (dateFilter === "30_days") {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(now.getDate() - 30);
        if (orderDate < thirtyDaysAgo) return false;
      } else if (dateFilter === "3_months") {
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(now.getMonth() - 3);
        if (orderDate < threeMonthsAgo) return false;
      } else if (dateFilter === "this_year") {
        const thisYearStart = new Date(now.getFullYear(), 0, 1);
        if (orderDate < thisYearStart) return false;
      } else if (dateFilter === "previous_years") {
        const thisYearStart = new Date(now.getFullYear(), 0, 1);
        if (orderDate >= thisYearStart) return false;
      }

      // 3. Search query (ID or product name)
      if (searchQuery.trim() !== "") {
        const query = searchQuery.toLowerCase().trim();
        const matchesId = order.id.toLowerCase().includes(query);
        const matchesProduct = (order.order_items || []).some((item) =>
          item.products?.name?.toLowerCase().includes(query)
        );
        if (!matchesId && !matchesProduct) return false;
      }

      return true;
    });
  }, [orders, selectedTab, dateFilter, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / itemsPerPage));

  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredOrders.slice(start, start + itemsPerPage);
  }, [filteredOrders, currentPage]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-[32px] font-bold tracking-tight" style={{ color: "#191c23" }}>
          Mis Órdenes
        </h1>
        <p className="text-sm mt-1" style={{ color: "#727785" }}>
          Rastrea tus suministros dentales, gestiona reórdenes y descarga facturas para tu clínica.
        </p>
      </div>

      {/* Controls: Search, Tabs & Date filter */}
      {!loading && !error && orders.length > 0 && (
        <div className="flex flex-col gap-4 bg-white p-4 rounded-2xl border border-gray-200/60 mb-6" style={{ boxShadow: "0 4px 24px rgba(107,30,150,0.02)" }}>
          {/* Tabs and Date Select Row */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Tabs */}
            <div className="flex flex-wrap gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
              {[
                { id: "all", label: "Todas", count: tabCounts.all },
                { id: "pending_payment", label: "Pendientes de Pago", count: tabCounts.pending_payment },
                { id: "in_progress", label: "En Proceso", count: tabCounts.in_progress },
                { id: "delivered", label: "Entregadas", count: tabCounts.delivered },
                { id: "cancelled", label: "Canceladas", count: tabCounts.cancelled },
              ].map((tab) => {
                const isActive = selectedTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setSelectedTab(tab.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-250 whitespace-nowrap flex items-center gap-2 cursor-pointer ${
                      isActive
                        ? "bg-[#6b1e96] text-white shadow-sm shadow-[#6b1e96]/10"
                        : "bg-gray-50 text-[#727785] hover:bg-gray-100 hover:text-[#191c23]"
                    }`}
                  >
                    {tab.label}
                    <span
                      className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] font-extrabold transition-colors duration-250 ${
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-gray-200/70 text-gray-700"
                      }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Date Selector */}
            <div className="flex items-center gap-2 self-start lg:self-auto min-w-[210px] relative">
              <span className="material-symbols-outlined text-gray-400 text-lg absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">calendar_month</span>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full bg-gray-50 hover:bg-gray-100/50 border border-gray-200 text-[#191c23] text-xs font-bold rounded-xl pl-9 pr-8 py-2 focus:outline-none focus:border-[#6b1e96] focus:ring-1 focus:ring-[#6b1e96] cursor-pointer appearance-none"
              >
                <option value="all">Todas las fechas</option>
                <option value="30_days">Últimos 30 días</option>
                <option value="3_months">Últimos 3 meses</option>
                <option value="this_year">Este año</option>
                <option value="previous_years">Años anteriores</option>
              </select>
              <span className="material-symbols-outlined text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-base">expand_more</span>
            </div>
          </div>

          {/* Search Bar Row */}
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-lg pointer-events-none">
              search
            </span>
            <input
              type="text"
              placeholder="Buscar por ID de pedido o nombre de producto..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-50 hover:bg-gray-100/50 border border-gray-200 rounded-xl pl-10 pr-10 py-2.5 text-xs text-[#191c23] placeholder-gray-400 focus:outline-none focus:bg-white focus:border-[#6b1e96] focus:ring-1 focus:ring-[#6b1e96] transition-all duration-200"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-0.5 rounded-full hover:bg-gray-200/50 cursor-pointer flex items-center justify-center border-none bg-transparent"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="space-y-4">
        {loading ? (
          <div className="space-y-4">
            <LoadingSkeleton variant="order-card" />
            <LoadingSkeleton variant="order-card" />
          </div>
        ) : error ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-red-100">
            <span className="material-symbols-outlined text-red-500 text-5xl mb-3">error</span>
            <p className="text-[#dc2626] mb-4 font-bold text-sm">{error}</p>
            <button
              onClick={() => fetchOrders()}
              className="px-5 py-2.5 rounded-xl font-bold text-xs bg-red-50 text-red-700 hover:bg-red-100 transition-all cursor-pointer"
            >
              Reintentar
            </button>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100" style={{ boxShadow: "0 4px 24px rgba(107,30,150,0.02)" }}>
            <div className="text-5xl mb-5 opacity-80">📦</div>
            <h3 className="text-lg font-bold mb-2" style={{ color: "#191c23" }}>
              {orders.length === 0 ? "Aún no has realizado compras" : "No se encontraron órdenes"}
            </h3>
            <p className="text-sm mb-8 text-[#727785] max-w-sm mx-auto">
              {orders.length === 0
                ? "Cuando realices tu primera orden, aparecerá aquí."
                : "No hay órdenes que coincidan con los filtros o criterios de búsqueda seleccionados."}
            </p>
            {orders.length === 0 ? (
              <Link
                to="/"
                className="inline-flex items-center px-6 py-3 text-[#191c23] font-bold rounded-xl transition-all duration-200 hover:shadow-md hover:shadow-lime-300/20"
                style={{ background: "#c3ff00" }}
              >
                Explorar Catálogo
              </Link>
            ) : (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedTab("all");
                  setDateFilter("all");
                }}
                className="inline-flex items-center px-5 py-2.5 text-xs font-bold text-white rounded-xl bg-[#6b1e96] hover:bg-[#531575] transition-all duration-200 cursor-pointer shadow-sm shadow-[#6b1e96]/10"
              >
                Restablecer Filtros
              </button>
            )}
          </div>
        ) : (
          <>
            {paginatedOrders.map((order) => <OrderCard key={order.id} order={order} />)}
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-slate-100 pt-5 mt-4 flex-wrap gap-4">
                <div className="text-xs text-gray-500 font-semibold">
                  Mostrando <span className="font-bold text-[#191c23]">{Math.min((currentPage - 1) * itemsPerPage + 1, filteredOrders.length)}–{Math.min(currentPage * itemsPerPage, filteredOrders.length)}</span> de <span className="font-bold text-[#191c23]">{filteredOrders.length}</span> órdenes
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className={`w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center transition-all duration-150 ${
                      currentPage === 1
                        ? "bg-gray-50 text-gray-300 cursor-not-allowed"
                        : "bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-300 cursor-pointer"
                    }`}
                  >
                    <span className="material-symbols-outlined text-lg">chevron_left</span>
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                    .reduce((acc, p, i, arr) => {
                      if (i > 0 && p - arr[i - 1] > 1) acc.push("...");
                      acc.push(p);
                      return acc;
                    }, [])
                    .map((p, i) =>
                      p === "..." ? (
                        <span key={`dots-${i}`} className="text-xs text-gray-400 px-1 select-none">⋯</span>
                      ) : (
                        <button
                          key={p}
                          onClick={() => setCurrentPage(p)}
                          className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold transition-all duration-150 cursor-pointer ${
                            p === currentPage
                              ? "bg-[#6b1e96] text-white shadow-sm shadow-[#6b1e96]/10"
                              : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300"
                          }`}
                        >
                          {p}
                        </button>
                      ),
                    )}

                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className={`w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center transition-all duration-150 ${
                      currentPage === totalPages
                        ? "bg-gray-50 text-gray-300 cursor-not-allowed"
                        : "bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-300 cursor-pointer"
                    }`}
                  >
                    <span className="material-symbols-outlined text-lg">chevron_right</span>
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Bottom promotional cards (Fast-Track & Support) */}
      {!loading && !error && orders.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
          {/* Fast-Track Card */}
          <div className="md:col-span-2 rounded-2xl p-8 flex flex-col justify-center items-start relative overflow-hidden" style={{ background: "linear-gradient(135deg, #6b1e96 0%, #531575 100%)" }}>
            <span className="material-symbols-outlined absolute right-[-20px] bottom-[-20px] text-white/5" style={{ fontSize: "200px" }}>package_2</span>
            
            <div className="relative z-10 w-full">
              <h3 className="text-2xl font-bold text-white mb-3">Reordena tu Inventario Frecuente</h3>
              <p className="text-white/80 text-sm max-w-sm mb-6">
                Reabastece los esenciales de tu clínica en un clic basado en tus compras anteriores.
              </p>
              <button className="px-5 py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider transition-opacity hover:opacity-90 cursor-pointer" style={{ background: "#c3ff00", color: "#191c23" }}>
                Reordenar Favoritos
              </button>
            </div>
          </div>

          {/* Assistance Card */}
          <div className="rounded-2xl p-8 flex flex-col items-center justify-center text-center shadow-sm" style={{ background: "#f2f3fd" }}>
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm">
              <span className="material-symbols-outlined text-[#6b1e96]">support_agent</span>
            </div>
            <h4 className="font-bold text-[#191c23] mb-2">¿Necesitas Asistencia?</h4>
            <p className="text-xs text-[#727785] mb-4">
              Nuestros expertos están listos para ayudarte con tus compras.
            </p>
            <Link to="#" className="text-sm font-bold underline hover:text-[#531575]" style={{ color: "#6b1e96" }}>
              Contactar Soporte
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
