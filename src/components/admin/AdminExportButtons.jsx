import { useState } from "react";
import toast from "react-hot-toast";
import PropTypes from "prop-types";

function toCsvRow(values) {
  return values.map((v) => {
    const str = String(v ?? "");
    return str.includes(",") || str.includes('"') ? `"${str.replace(/"/g, '""')}"` : str;
  }).join(",");
}

export default function AdminExportButtons({ analytics, period, loading }) {
  const [exporting, setExporting] = useState(false);

  const handleExport = () => {
    if (!analytics || loading) return;
    setExporting(true);
    try {
      const lines = [];
      const now = new Date().toLocaleString();

      // Header
      lines.push("DENTAL MARKET — REPORTE ADMINISTRATIVO DE PLATAFORMA");
      lines.push(`Generado: ${now}`);
      lines.push(`Periodo: ${period}`);
      if (analytics.appliedFilters?.store_ids) {
        lines.push(`Filtro tiendas: ${analytics.appliedFilters.store_ids.join(", ")}`);
      }
      lines.push("");

      // KPIs
      lines.push("=== KPIs DE PLATAFORMA ===");
      lines.push(toCsvRow(["Métrica", "Valor", "Tendencia %"]));
      const k = analytics.kpis || {};
      const t = analytics.trends || {};
      lines.push(toCsvRow(["GMV (Ventas Brutas)", `$${k.gmv?.toFixed(2)}`, `${t.gmv}%`]));
      lines.push(toCsvRow(["Ingresos Plataforma", `$${k.platformRevenue?.toFixed(2)}`, `${t.platformRevenue}%`]));
      lines.push(toCsvRow(["  - Comisión Tienda", `$${k.storeFees?.toFixed(2)}`, ""]));
      lines.push(toCsvRow(["  - Comisión Comprador", `$${k.buyerFees?.toFixed(2)}`, ""]));
      lines.push(toCsvRow(["Órdenes Totales", k.totalOrders, `${t.orders}%`]));
      lines.push(toCsvRow(["Ticket Promedio", `$${k.avgOrderValue?.toFixed(2)}`, `${t.avgOrderValue}%`]));
      lines.push(toCsvRow(["Usuarios Nuevos", k.newUsers, `${t.newUsers}%`]));
      lines.push(toCsvRow(["Tasa Cancelación", `${k.cancelRate}%`, `${t.cancelRate}%`]));
      lines.push("");

      // Top Stores
      if (analytics.topStores?.length > 0) {
        lines.push("=== TOP TIENDAS POR GMV ===");
        lines.push(toCsvRow(["#", "Tienda", "Estado", "GMV", "Órdenes", "Unidades", "% del Total"]));
        analytics.topStores.forEach((s, i) => {
          lines.push(toCsvRow([i + 1, s.name, s.state, `$${s.gmv.toFixed(2)}`, s.orders, s.units, `${s.pctOfTotal}%`]));
        });
        lines.push("");
      }

      // Top Products
      if (analytics.topProducts?.length > 0) {
        lines.push("=== TOP PRODUCTOS GLOBAL ===");
        lines.push(toCsvRow(["#", "Producto", "Tienda", "Revenue", "Unidades", "Órdenes"]));
        analytics.topProducts.forEach((p, i) => {
          lines.push(toCsvRow([i + 1, p.name, p.store_name, `$${p.revenue.toFixed(2)}`, p.units, p.orders]));
        });
        lines.push("");
      }

      // Payment Methods
      if (analytics.paymentMethods) {
        lines.push("=== MÉTODOS DE PAGO ===");
        lines.push(toCsvRow(["Método", "Cantidad"]));
        Object.entries(analytics.paymentMethods).sort((a, b) => b[1] - a[1]).forEach(([m, c]) => {
          lines.push(toCsvRow([m, c]));
        });
        lines.push("");
      }

      // Order Status
      if (analytics.ordersByStatus) {
        lines.push("=== ESTADOS DE ÓRDENES ===");
        lines.push(toCsvRow(["Estado", "Cantidad"]));
        Object.entries(analytics.ordersByStatus).forEach(([s, c]) => {
          lines.push(toCsvRow([s, c]));
        });
        lines.push("");
      }

      // Revenue Chart
      if (analytics.revenueChart?.length > 0) {
        lines.push("=== EVOLUCIÓN DE VENTAS ===");
        lines.push(toCsvRow(["Fecha", "Revenue", "Órdenes", "Unidades"]));
        analytics.revenueChart.forEach((d) => {
          lines.push(toCsvRow([d.date, `$${d.revenue.toFixed(2)}`, d.orders, d.units]));
        });
        lines.push("");
      }

      // Store Growth
      if (analytics.storeGrowth) {
        lines.push("=== CRECIMIENTO DE TIENDAS ===");
        lines.push(toCsvRow(["Total Activas", analytics.storeGrowth.totalStores]));
        lines.push(toCsvRow(["Nuevas en Periodo", analytics.storeGrowth.newStoresInPeriod]));
      }

      // Download
      const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `admin_analytics_${period}_${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Reporte exportado exitosamente");
    } catch (err) {
      console.error("Export error:", err);
      toast.error("Error al exportar reporte");
    } finally {
      setExporting(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={!analytics || loading || exporting}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
      style={{ background: "rgba(107,30,150,0.06)", color: "#6b1e96", border: "1px solid rgba(107,30,150,0.1)" }}
      title="Exportar reporte CSV"
    >
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
      </svg>
      {exporting ? "Exportando..." : "Exportar CSV"}
    </button>
  );
}

AdminExportButtons.propTypes = {
  analytics: PropTypes.object,
  period: PropTypes.string,
  loading: PropTypes.bool,
};
