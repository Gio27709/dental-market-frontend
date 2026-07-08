import { useState } from "react";
import toast from "react-hot-toast";
import PropTypes from "prop-types";

export default function AdminExportButtons({ analytics, period, loading }) {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    if (!analytics || loading) return;
    setExporting(true);
    try {
      // Dynamic import of xlsx to reduce bundle size
      const XLSX = await import("xlsx");
      
      const wb = XLSX.utils.book_new();
      const now = new Date().toLocaleString();

      // 1. Resumen Tab
      const resumenRows = [
        ["FORCEPX — REPORTE ADMINISTRATIVO DE PLATAFORMA"],
        [`Generado: ${now}`],
        [`Periodo: ${period}`],
      ];
      if (analytics.appliedFilters?.store_ids) {
        resumenRows.push([`Filtro tiendas: ${analytics.appliedFilters.store_ids.join(", ")}`]);
      }
      resumenRows.push([]);

      // KPIs
      resumenRows.push(["=== KPIs DE PLATAFORMA ==="]);
      resumenRows.push(["Métrica", "Valor", "Tendencia %"]);
      const k = analytics.kpis || {};
      const t = analytics.trends || {};
      resumenRows.push(["GMV (Ventas Brutas)", k.gmv, t.gmv !== undefined ? `${t.gmv}%` : ""]);
      resumenRows.push(["Ingresos Plataforma", k.platformRevenue, t.platformRevenue !== undefined ? `${t.platformRevenue}%` : ""]);
      resumenRows.push(["  - Comisión Tienda", k.storeFees, ""]);
      resumenRows.push(["  - Comisión Comprador", k.buyerFees, ""]);
      resumenRows.push(["Órdenes Totales", k.totalOrders, t.orders !== undefined ? `${t.orders}%` : ""]);
      resumenRows.push(["Ticket Promedio", k.avgOrderValue, t.avgOrderValue !== undefined ? `${t.avgOrderValue}%` : ""]);
      resumenRows.push(["Usuarios Nuevos", k.newUsers, t.newUsers !== undefined ? `${t.newUsers}%` : ""]);
      resumenRows.push(["Tasa Cancelación", k.cancelRate !== undefined ? `${k.cancelRate}%` : "", t.cancelRate !== undefined ? `${t.cancelRate}%` : ""]);
      resumenRows.push([]);

      // Payment Methods
      if (analytics.paymentMethods) {
        resumenRows.push(["=== MÉTODOS DE PAGO ==="]);
        resumenRows.push(["Método", "Cantidad"]);
        Object.entries(analytics.paymentMethods)
          .sort((a, b) => b[1] - a[1])
          .forEach(([m, c]) => {
            resumenRows.push([m, c]);
          });
        resumenRows.push([]);
      }

      // Order Status
      if (analytics.ordersByStatus) {
        resumenRows.push(["=== ESTADOS DE ÓRDENES ==="]);
        resumenRows.push(["Estado", "Cantidad"]);
        Object.entries(analytics.ordersByStatus).forEach(([s, c]) => {
          resumenRows.push([s, c]);
        });
        resumenRows.push([]);
      }

      // Store Growth
      if (analytics.storeGrowth) {
        resumenRows.push(["=== CRECIMIENTO DE TIENDAS ==="]);
        resumenRows.push(["Total Activas", analytics.storeGrowth.totalStores]);
        resumenRows.push(["Nuevas en Periodo", analytics.storeGrowth.newStoresInPeriod]);
      }

      const wsResumen = XLSX.utils.aoa_to_sheet(resumenRows);
      XLSX.utils.book_append_sheet(wb, wsResumen, "Resumen General");

      // 2. Top Tiendas Tab
      if (analytics.topStores?.length > 0) {
        const topStoresRows = [
          ["Ranking", "Tienda", "Estado", "GMV (USD)", "Órdenes", "Unidades", "% del Total"]
        ];
        analytics.topStores.forEach((s, i) => {
          topStoresRows.push([i + 1, s.name, s.state, s.gmv, s.orders, s.units, `${s.pctOfTotal}%`]);
        });
        const wsTopStores = XLSX.utils.aoa_to_sheet(topStoresRows);
        XLSX.utils.book_append_sheet(wb, wsTopStores, "Top Tiendas");
      }

      // 3. Top Productos Tab
      if (analytics.topProducts?.length > 0) {
        const topProductsRows = [
          ["Ranking", "Producto", "Tienda", "Ventas (USD)", "Unidades", "Órdenes"]
        ];
        analytics.topProducts.forEach((p, i) => {
          topProductsRows.push([i + 1, p.name, p.store_name, p.revenue, p.units, p.orders]);
        });
        const wsTopProducts = XLSX.utils.aoa_to_sheet(topProductsRows);
        XLSX.utils.book_append_sheet(wb, wsTopProducts, "Top Productos");
      }

      // 4. Evolución Ventas Tab
      if (analytics.revenueChart?.length > 0) {
        const revenueChartRows = [
          ["Fecha", "Ventas (USD)", "Órdenes", "Unidades"]
        ];
        analytics.revenueChart.forEach((d) => {
          revenueChartRows.push([d.date, d.revenue, d.orders, d.units]);
        });
        const wsRevenueChart = XLSX.utils.aoa_to_sheet(revenueChartRows);
        XLSX.utils.book_append_sheet(wb, wsRevenueChart, "Evolución Ventas");
      }

      // Download
      const fileName = `admin_analytics_${period}_${new Date().toISOString().split("T")[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
      toast.success("Reporte Excel exportado exitosamente");
    } catch (err) {
      console.error("Export error:", err);
      toast.error("Error al exportar reporte Excel");
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
      title="Exportar reporte Excel"
    >
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
      </svg>
      {exporting ? "Exportando..." : "Exportar Excel"}
    </button>
  );
}

AdminExportButtons.propTypes = {
  analytics: PropTypes.object,
  period: PropTypes.string,
  loading: PropTypes.bool,
};
