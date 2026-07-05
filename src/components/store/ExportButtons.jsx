import PropTypes from "prop-types";
import toast from "react-hot-toast";

/**
 * Exports analytics data to CSV format
 */
function exportToCSV(analytics, period) {
  if (!analytics) return;

  const rows = [];
  const dateLabel = analytics.period === "custom" ? "Rango personalizado" : period;

  // Header section
  rows.push(["Reporte de Estadísticas - Forcepx"]);
  rows.push([`Periodo: ${dateLabel}`]);
  rows.push([`Generado: ${new Date().toLocaleString("es-VE")}`]);
  rows.push([]);

  // KPIs
  rows.push(["--- KPIs ---"]);
  rows.push(["Ventas Totales (USD)", analytics.kpis?.totalRevenue || 0]);
  rows.push(["Total Órdenes", analytics.kpis?.totalOrders || 0]);
  rows.push(["Ticket Promedio (USD)", analytics.kpis?.avgOrderValue || 0]);
  rows.push(["Unidades Vendidas", analytics.kpis?.unitsSold || 0]);
  rows.push([]);

  // Financial
  rows.push(["--- Resumen Financiero ---"]);
  rows.push(["Ingresos Brutos (USD)", analytics.financialSummary?.grossRevenue || 0]);
  rows.push(["Comisión Plataforma (USD)", analytics.financialSummary?.platformFees || 0]);
  rows.push(["Ingresos Netos (USD)", analytics.financialSummary?.netRevenue || 0]);
  rows.push(["Wallet Disponible (USD)", analytics.financialSummary?.walletAvailable || 0]);
  rows.push(["Wallet Pendiente (USD)", analytics.financialSummary?.walletPending || 0]);
  rows.push([]);

  // Top Products
  if (analytics.topProducts?.length > 0) {
    rows.push(["--- Top Productos ---"]);
    rows.push(["#", "Producto", "Revenue (USD)", "Unidades", "Órdenes", "Rating"]);
    analytics.topProducts.forEach((p, i) => {
      rows.push([i + 1, `"${p.name}"`, p.revenue, p.units, p.orders, p.rating || "—"]);
    });
    rows.push([]);
  }

  // Sales Chart Data
  if (analytics.salesChart?.length > 0) {
    rows.push(["--- Datos de Ventas ---"]);
    rows.push(["Fecha", "Revenue (USD)", "Órdenes", "Unidades"]);
    analytics.salesChart.forEach((d) => {
      rows.push([d.date, d.revenue, d.orders, d.units]);
    });
    rows.push([]);
  }

  // Orders by Status
  rows.push(["--- Órdenes por Estado ---"]);
  Object.entries(analytics.ordersByStatus || {}).forEach(([status, count]) => {
    rows.push([status, count]);
  });

  // Convert to CSV string
  const csvContent = rows.map((row) => row.join(",")).join("\n");
  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `reporte-tienda-${period}-${new Date().toISOString().split("T")[0]}.csv`;
  link.click();
  URL.revokeObjectURL(url);
  toast.success("Reporte CSV descargado");
}

export default function ExportButtons({ analytics, period, loading }) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => exportToCSV(analytics, period)}
        disabled={loading || !analytics}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-sm"
        style={{
          background: "rgba(107,30,150,0.06)",
          color: "#6b1e96",
        }}
        title="Descargar reporte en CSV"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
        </svg>
        Exportar CSV
      </button>
    </div>
  );
}

ExportButtons.propTypes = {
  analytics: PropTypes.object,
  period: PropTypes.string,
  loading: PropTypes.bool,
};
