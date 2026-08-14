import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  getInventoryAlertsAPI,
  getInventorySuggestionsAPI,
  preloadRestockCartAPI,
} from "../../services/api";

export default function ClinicDashboard() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({ totalItems: 0, criticalCount: 0, warningCount: 0, healthyCount: 0 });
  const [criticalItems, setCriticalItems] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [restocking, setRestocking] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [alertsRes, suggRes] = await Promise.all([
        getInventoryAlertsAPI(),
        getInventorySuggestionsAPI(),
      ]);

      if (alertsRes.data.success) {
        setSummary(alertsRes.data.summary);
        setCriticalItems(alertsRes.data.data.filter((i) => i.stockStatus === "CRITICAL"));
      }

      if (suggRes.data.success) {
        setSuggestions(suggRes.data.data || []);
      }
    } catch (err) {
      console.error("Error cargando datos del dashboard clínico:", err);
      toast.error("Error al cargar datos del panel clínico.");
    } finally {
      setLoading(false);
    }
  };

  const handleRestockNow = async (itemsToRestock) => {
    try {
      setRestocking(true);
      const payload = itemsToRestock.map((item) => ({
        productId: item.productId,
        quantity: Math.max(item.criticalThreshold * 2, 2),
      }));

      const res = await preloadRestockCartAPI(payload);

      if (res.data.success) {
        toast.success(res.data.message);
        navigate("/cart");
      }
    } catch (err) {
      console.error("Error al reponer insumos:", err);
      toast.error("No se pudo pre-cargar el carrito.");
    } finally {
      setRestocking(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 bg-white rounded-3xl border border-[#cdc3d4]/20 shadow-xs">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#541a97]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      
      {/* ── Header Section (Stitch Design) ── */}
      <header className="bg-white p-8 rounded-3xl border border-[#cdc3d4]/20 shadow-xs">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-[#541a97]/60"></span>
          <span className="text-xs font-bold text-[#541a97]/80 tracking-widest uppercase">
            Panel B2B Odontológico
          </span>
        </div>
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-3xl font-extrabold text-[#111c2c] tracking-tight">
              Panel Odontológico &amp; Clínico
            </h2>
            <div className="flex items-center text-[#7a4b00] bg-[#ffddb9]/40 px-3.5 py-1 rounded-full border border-[#ffb961]/40">
              <span className="material-symbols-outlined text-[20px] mr-1.5" style={{ fontVariationSettings: "'FILL' 1" }}>
                spa
              </span>
              <span className="text-sm font-black tracking-tight">DentiCare Pro</span>
            </div>
          </div>

          {criticalItems.length > 0 && (
            <button
              onClick={() => handleRestockNow(criticalItems)}
              disabled={restocking}
              className="flex items-center gap-2 px-5 py-3 bg-[#ba1a1a] hover:bg-[#93000a] text-white rounded-2xl font-bold text-sm shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[20px]">shopping_cart_checkout</span>
              <span>Reponer Insumos Críticos ({criticalItems.length})</span>
            </button>
          )}
        </div>

        <p className="text-base text-[#4b4452] max-w-3xl leading-relaxed">
          Monitoreo en tiempo real de insumos odontológicos, alertas de reposición crítica y compras recurrentes en un solo lugar.
        </p>
      </header>

      {/* ── Summary Cards Row (Stitch Masonry Design) ── */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Total Insumos */}
        <div className="bg-white p-6 rounded-3xl border border-[#cdc3d4]/20 flex flex-col justify-between hover:shadow-lg transition-all duration-300 group">
          <div className="flex flex-col mb-4">
            <div className="flex items-center gap-2 mb-2 text-[#4b4452]">
              <span className="material-symbols-outlined text-[18px]">inventory</span>
              <span className="text-[11px] font-bold uppercase tracking-wider">Total Insumos</span>
            </div>
            <p className="text-sm text-[#4b4452]/80">Elementos monitorizados en su inventario actual.</p>
          </div>
          <div className="flex items-end justify-between mt-4">
            <span className="text-[48px] font-bold text-[#111c2c] leading-none group-hover:text-[#541a97] transition-colors">
              {summary.totalItems}
            </span>
            <span className="text-sm text-[#4b4452]/60 font-medium">Artículos</span>
          </div>
        </div>

        {/* Stock Crítico */}
        <div className="bg-[#ba1a1a]/5 p-6 rounded-3xl border border-[#ba1a1a]/20 flex flex-col justify-between hover:shadow-lg transition-all duration-300 group relative overflow-hidden">
          <div className="absolute -right-4 -top-4 opacity-[0.04] text-[#ba1a1a] pointer-events-none">
            <span className="material-symbols-outlined text-[120px]">warning</span>
          </div>
          <div className="flex flex-col mb-4 relative z-10">
            <div className="flex items-center gap-2 mb-2 text-[#ba1a1a]">
              <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>error</span>
              <span className="text-[11px] font-bold uppercase tracking-wider">Atención Inmediata</span>
            </div>
            <p className="text-sm text-[#ba1a1a]/80">Insumos agotados o por debajo del mínimo vital.</p>
          </div>
          <div className="flex items-end justify-between mt-4 relative z-10">
            <span className="text-[48px] font-bold text-[#ba1a1a] leading-none">
              {summary.criticalCount}
            </span>
            <span className="text-sm text-[#ba1a1a]/80 font-medium">Urgentes</span>
          </div>
        </div>

        {/* En Advertencia */}
        <div className="bg-[#ffddb9]/30 p-6 rounded-3xl border border-[#ffb961]/30 flex flex-col justify-between hover:shadow-lg transition-all duration-300 group relative overflow-hidden">
          <div className="absolute -right-4 -bottom-4 opacity-[0.05] text-[#7a4b00] pointer-events-none">
            <span className="material-symbols-outlined text-[120px]">info</span>
          </div>
          <div className="flex flex-col mb-4 relative z-10">
            <div className="flex items-center gap-2 mb-2 text-[#7a4b00]">
              <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>info</span>
              <span className="text-[11px] font-bold uppercase tracking-wider">Revisión Recomendada</span>
            </div>
            <p className="text-sm text-[#7a4b00]/80">Acercándose a los niveles de reposición.</p>
          </div>
          <div className="flex items-end justify-between mt-4 relative z-10">
            <span className="text-[48px] font-bold text-[#7a4b00] leading-none">
              {summary.warningCount}
            </span>
            <span className="text-sm text-[#7a4b00]/80 font-medium">A revisar</span>
          </div>
        </div>

        {/* Saludables */}
        <div className="bg-[#006d37]/5 p-6 rounded-3xl border border-[#006d37]/20 flex flex-col justify-between hover:shadow-lg transition-all duration-300 group relative overflow-hidden">
          <div className="absolute -right-2 -bottom-2 opacity-[0.04] text-[#006d37] pointer-events-none">
            <span className="material-symbols-outlined text-[120px]">verified</span>
          </div>
          <div className="flex flex-col mb-4 relative z-10">
            <div className="flex items-center gap-2 mb-2 text-[#006d37]">
              <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
              <span className="text-[11px] font-bold uppercase tracking-wider">Niveles Óptimos</span>
            </div>
            <p className="text-sm text-[#006d37]/80">Insumos con stock suficiente para operar.</p>
          </div>
          <div className="flex items-end justify-between mt-4 relative z-10">
            <span className="text-[48px] font-bold text-[#006d37] leading-none">
              {summary.healthyCount}
            </span>
            <span className="text-sm text-[#006d37]/80 font-medium">Suficientes</span>
          </div>
        </div>

      </section>

      {/* ── Predictive Restocking Section (Stitch Design) ── */}
      <section className="bg-white rounded-3xl border border-[#cdc3d4]/20 p-8 shadow-xs">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 pb-6 border-b border-[#cdc3d4]/20 gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-[#541a97]/10 p-2 rounded-xl">
                <span className="material-symbols-outlined text-[#541a97] text-[24px]">support_agent</span>
              </div>
              <h3 className="text-xl font-bold text-[#111c2c]">Sugerencias de Reposición</h3>
            </div>
            <p className="text-sm text-[#4b4452] max-w-2xl mt-1">
              Recomendaciones personalizadas para su clínica, basadas en su historial de consumo y necesidades operativas.
            </p>
          </div>
          <Link
            to="/clinic/inventory"
            className="bg-[#541a97]/5 hover:bg-[#541a97]/10 text-[#541a97] font-semibold text-sm px-6 py-3 rounded-2xl transition-colors duration-200 flex items-center gap-2 whitespace-nowrap border border-[#541a97]/20"
          >
            <span>Ver Inventario Completo</span>
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </Link>
        </div>

        {suggestions.length === 0 ? (
          /* Empty State Canvas */
          <div className="bg-[#f9f9ff] border border-[#cdc3d4]/20 rounded-2xl p-12 md:p-16 flex flex-col items-center justify-center text-center">
            <div className="bg-white p-5 rounded-2xl mb-6 shadow-xs border border-[#cdc3d4]/20">
              <span className="material-symbols-outlined text-[#541a97]/60 text-[40px]" style={{ fontVariationSettings: "'wght' 200" }}>
                hourglass_empty
              </span>
            </div>
            <h4 className="text-lg font-bold text-[#111c2c] mb-3">
              Aún estamos conociendo el ritmo de su clínica
            </h4>
            <p className="text-sm text-[#4b4452] max-w-lg leading-relaxed">
              A medida que realice pedidos en FORCEPX, nuestro sistema aprenderá la frecuencia de consumo de su equipo para sugerirle el momento exacto para reponer sus insumos, evitando interrupciones en su atención.
            </p>
          </div>
        ) : (
          /* List of Suggestions */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {suggestions.slice(0, 6).map((item) => (
              <div
                key={item.productId}
                className="p-5 border border-[#cdc3d4]/30 rounded-2xl bg-white hover:border-[#541a97]/30 hover:shadow-md transition-all space-y-4"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={item.imageUrl || "/placeholder.png"}
                    alt={item.productName}
                    className="w-14 h-14 object-cover rounded-xl border border-[#cdc3d4]/30 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-[#111c2c] truncate">
                      {item.productName}
                    </h3>
                    <p className="text-xs text-[#4b4452] mt-0.5">
                      ${item.price.toFixed(2)} | Frecuencia: ~{item.suggestedFrequencyDays} días
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-3 border-t border-[#cdc3d4]/20">
                  <span className="text-[#4b4452]">Agotamiento estimado:</span>
                  <span className="font-bold text-[#7a4b00] bg-[#ffddb9]/40 px-3 py-1 rounded-full">
                    en {item.estimatedDaysRemaining} día(s)
                  </span>
                </div>

                <button
                  onClick={() => handleRestockNow([{ productId: item.productId, criticalThreshold: 2 }])}
                  className="w-full py-3 bg-[#541a97] hover:bg-[#6c38b0] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
                >
                  <span className="material-symbols-outlined text-[18px]">add_shopping_cart</span>
                  <span>Reponer Insumo</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

    </div>
  );
}
