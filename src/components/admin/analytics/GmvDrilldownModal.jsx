import { useState, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import { getSalesAnalyticsAPI, getFinancialsAnalyticsAPI } from "../../../services/api";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export default function GmvDrilldownModal({ isOpen, onClose, period = "30d" }) {
  const [loading, setLoading] = useState(true);
  const [salesData, setSalesData] = useState(null);
  const [financialsData, setFinancialsData] = useState(null);

  const fetchDrilldown = useCallback(async () => {
    setLoading(true);
    try {
      const [salesRes, finRes] = await Promise.all([
        getSalesAnalyticsAPI({ period }),
        getFinancialsAnalyticsAPI({ period })
      ]);
      if (salesRes.data?.success) setSalesData(salesRes.data.data);
      if (finRes.data?.success) setFinancialsData(finRes.data.data);
    } catch (err) {
      console.error("Error cargando desglose de GMV:", err);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    if (isOpen) {
      fetchDrilldown();
    }
  }, [isOpen, fetchDrilldown]);

  if (!isOpen) return null;

  const paymentMix = financialsData?.paymentMethodMix || [];
  const salesByCategory = salesData?.salesByCategory || [];
  const storePerformance = salesData?.storePerformanceMatrix || [];
  const topProducts = salesData?.top10Products || [];

  // Agregaciones de totales
  const totalGmv = paymentMix.reduce((acc, item) => acc + parseFloat(item.total_usd || 0), 0);
  const totalOrders = paymentMix.reduce((acc, item) => acc + parseInt(item.order_count || 0, 10), 0);
  const aov = totalOrders > 0 ? totalGmv / totalOrders : 0;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/85 animate-fadeIn">
      <div className="bg-fx-panel border border-fx-line-strong rounded-xl p-6 max-w-5xl w-full max-h-[90vh] overflow-y-auto relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-fx-line mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#c3ff00]/10 border border-fx-accent/30 flex items-center justify-center text-fx-accent text-xl font-bold">
              📊
            </div>
            <div>
              <h3 className="text-lg font-bold text-fx-text">Desglose Analítico Completo de Ventas (GMV)</h3>
              <p className="text-fx-muted text-xs">Observabilidad estadística detallada por método de pago, comercio y categoría de producto</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-fx-inset hover:bg-fx-raised border border-fx-line-strong flex items-center justify-center text-fx-muted font-bold transition-all"
          >
            ✕
          </button>
        </div>

        {loading ? (
          <div className="py-20 text-center text-fx-faint text-sm font-semibold animate-pulse">
            Cargando agregaciones estadísticas de ventas en tiempo real...
          </div>
        ) : (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-fx-inset border border-fx-line rounded-2xl p-4">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-fx-faint block mb-1">GMV Total Período</span>
                <span className="text-2xl font-semibold text-fx-text">${totalGmv.toFixed(2)}</span>
              </div>
              <div className="bg-fx-inset border border-fx-line rounded-2xl p-4">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-fx-faint block mb-1">Pedidos Procesados</span>
                <span className="text-2xl font-semibold text-fx-accent">{totalOrders} órdenes</span>
              </div>
              <div className="bg-fx-inset border border-fx-line rounded-2xl p-4">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-fx-faint block mb-1">Ticket Promedio (AOV)</span>
                <span className="text-2xl font-semibold text-fx-muted">${aov.toFixed(2)}</span>
              </div>
            </div>

            {/* Section 1: Distribución por Método de Pago */}
            <div className="bg-fx-panel border border-fx-line rounded-2xl p-5">
              <h4 className="text-xs font-bold text-fx-text uppercase tracking-wider mb-3">
                1. Distribución de Ventas por Método de Pago
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                {paymentMix.map((pm, idx) => {
                  const pct = totalGmv > 0 ? Math.round((parseFloat(pm.total_usd || 0) / totalGmv) * 100) : 0;
                  return (
                    <div key={pm.payment_method || idx} className="bg-purple-950/70 border border-fx-line rounded-xl p-3.5 flex justify-between items-center">
                      <div>
                        <span className="text-[10px] font-semibold uppercase text-fx-accent block mb-0.5">
                          {pm.payment_method}
                        </span>
                        <div className="text-lg font-semibold text-fx-text">
                          ${parseFloat(pm.total_usd || 0).toFixed(2)}
                        </div>
                        <span className="text-[11px] text-fx-muted block">
                          {pm.order_count} pedidos ({pct}% del total)
                        </span>
                      </div>
                      <div className="text-xl font-bold text-purple-400/40">💳</div>
                    </div>
                  );
                })}
              </div>

              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={paymentMix}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff12" />
                  <XAxis dataKey="payment_method" stroke="#7b6c99" fontSize={11} />
                  <YAxis stroke="#7b6c99" fontSize={11} />
                  <Tooltip contentStyle={{ backgroundColor: "#0d0418", border: "1px solid #ffffff29", borderRadius: "10px", color: "#f4f1f8", fontSize: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.55)" }} />
                  <Bar dataKey="total_usd" name="Monto Procesado ($)" fill="#c3ff00" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Section 2: Ventas por Categoría y Tienda */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Ventas por Categoría */}
              <div className="fx-card-sm">
                <h4 className="text-xs font-bold text-fx-text uppercase tracking-wider mb-3">
                  2. Ventas Brutas por Categoría de Producto
                </h4>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {salesByCategory.length === 0 ? (
                    <p className="text-xs text-fx-muted py-4 text-center">Sin datos de categorías en este período.</p>
                  ) : (
                    salesByCategory.map((cat, idx) => {
                      const amount = parseFloat(cat.total_sales || cat.gmv || 0);
                      const units = parseInt(cat.total_units || cat.units || 0, 10);
                      return (
                        <div key={idx} className="flex items-center justify-between p-3 bg-purple-950/50 rounded-xl border border-fx-line">
                          <div>
                            <span className="font-bold text-fx-text text-xs block">{cat.category_name}</span>
                            <span className="text-[10px] text-fx-muted">{units} unidades vendidas</span>
                          </div>
                          <span className="font-semibold text-fx-accent text-sm">${amount.toFixed(2)}</span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Ventas por Tienda / Comercio */}
              <div className="fx-card-sm">
                <h4 className="text-xs font-bold text-fx-text uppercase tracking-wider mb-3">
                  3. Ventas Brutas por Tienda / Comercio
                </h4>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {storePerformance.length === 0 ? (
                    <p className="text-xs text-fx-muted py-4 text-center">Sin datos de comercios en este período.</p>
                  ) : (
                    storePerformance.map((st, idx) => {
                      const storeName = st.business_name || st.store_name || `Comercio #${idx + 1}`;
                      const amount = parseFloat(st.total_gmv || st.gmv || 0);
                      const orders = parseInt(st.total_orders || st.orders || 0, 10);
                      return (
                        <div key={idx} className="flex items-center justify-between p-3 bg-purple-950/50 rounded-xl border border-fx-line">
                          <div>
                            <span className="font-bold text-fx-text text-xs block">{storeName}</span>
                            <span className="text-[10px] text-fx-muted">{orders} órdenes procesadas</span>
                          </div>
                          <span className="font-semibold text-fx-faint text-sm">${amount.toFixed(2)}</span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Section 3: Top 10 Productos Más Vendidos */}
            <div className="fx-card-sm">
              <h4 className="text-xs font-bold text-fx-text uppercase tracking-wider mb-3">
                4. Top Productos Más Vendidos en el Período
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {topProducts.slice(0, 6).map((prod, idx) => (
                  <div key={prod.id || idx} className="flex items-center justify-between p-3 bg-fx-inset rounded-xl border border-fx-line">
                    <div>
                      <span className="font-bold text-fx-text text-xs block">{prod.name || prod.title}</span>
                      <span className="text-[10px] text-fx-faint">{parseInt(prod.total_units || prod.units_sold || 0).toLocaleString()} unidades</span>
                    </div>
                    <span className="font-semibold text-fx-accent text-sm">${parseFloat(prod.total_revenue || prod.revenue_usd || 0).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="pt-4 mt-4 border-t border-fx-line text-right">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-fx-text rounded-xl text-xs font-bold transition-all shadow-lg"
          >
            Cerrar Ventana
          </button>
        </div>
      </div>
    </div>
  );
}

GmvDrilldownModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  period: PropTypes.string
};
