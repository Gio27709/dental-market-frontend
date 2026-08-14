import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import {
  getDentistFinancialSummaryAPI,
  getDentistProjectionsAPI,
  getDentistSmartOffersAPI,
} from "../../services/api";
import FinancialCharts from "../../components/clinic/FinancialCharts";
import ProjectionWidget from "../../components/clinic/ProjectionWidget";
import ExportReportButtons from "../../components/clinic/ExportReportButtons";

export default function ClinicProfitability() {
  const [loading, setLoading] = useState(true);
  const [summaryData, setSummaryData] = useState(null);
  const [projections, setProjections] = useState(null);
  const [offers, setOffers] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [sumRes, projRes, offRes] = await Promise.all([
        getDentistFinancialSummaryAPI(),
        getDentistProjectionsAPI(),
        getDentistSmartOffersAPI(),
      ]);

      if (sumRes.data.success) {
        setSummaryData(sumRes.data.data);
      }
      if (projRes.data.success) {
        setProjections(projRes.data.data);
      }
      if (offRes.data.success) {
        setOffers(offRes.data.data || []);
      }
    } catch (err) {
      console.error("Error al cargar datos de rentabilidad:", err);
      toast.error("Error al cargar informe financiero.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 bg-white rounded-3xl border border-[#cdc3d4]/20 shadow-xs">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#541a97]"></div>
      </div>
    );
  }

  const {
    currentMonthSpent = 0,
    monthOverMonthChange = 0,
    avgOrderValue = 0,
    topCategory = "N/A",
    monthlyHistory = [],
    categoryBreakdown = [],
  } = summaryData || {};

  return (
    <div id="profitability-container" className="space-y-8">
      
      {/* ── HEADER DE RENTABILIDAD ── */}
      <header className="bg-white p-8 rounded-3xl border border-[#cdc3d4]/20 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#541a97]"></span>
            <span className="text-xs font-bold text-[#541a97]/80 uppercase tracking-widest">
              Inteligencia Financiera B2B
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-[#111c2c] tracking-tight flex items-center gap-3">
            <span className="material-symbols-outlined text-[32px] text-[#541a97]" style={{ fontVariationSettings: "'FILL' 1" }}>
              payments
            </span>
            Rentabilidad &amp; Gestión Financiera
          </h1>
          <p className="text-base text-[#4b4452] mt-1 max-w-xl">
            Auditoría de compras, distribución de gasto por categoría y proyección presupuestaria para tu consultorio.
          </p>
        </div>

        {/* Action Buttons */}
        <ExportReportButtons containerId="profitability-container" />
      </header>

      {/* ── METRIC CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Gasto Mes Actual */}
        <div className="bg-white p-6 rounded-3xl border border-[#cdc3d4]/20 flex flex-col justify-between shadow-xs hover:shadow-md transition-all">
          <p className="text-xs font-bold text-[#4b4452] uppercase tracking-wider">
            Gasto Mes Actual
          </p>
          <p className="text-3xl font-extrabold text-[#111c2c] mt-2">
            ${currentMonthSpent.toFixed(2)}
          </p>
          <div className="mt-3 text-xs flex items-center gap-1 font-semibold">
            {monthOverMonthChange >= 0 ? (
              <span className="text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
                ▲ +{monthOverMonthChange}% vs mes anterior
              </span>
            ) : (
              <span className="text-[#006d37] bg-[#006d37]/10 px-2 py-0.5 rounded-full">
                ▼ {monthOverMonthChange}% vs mes anterior
              </span>
            )}
          </div>
        </div>

        {/* Valor Promedio de Orden */}
        <div className="bg-white p-6 rounded-3xl border border-[#cdc3d4]/20 flex flex-col justify-between shadow-xs hover:shadow-md transition-all">
          <p className="text-xs font-bold text-[#4b4452] uppercase tracking-wider">
            Promedio por Pedido
          </p>
          <p className="text-3xl font-extrabold text-[#541a97] mt-2">
            ${avgOrderValue.toFixed(2)}
          </p>
          <p className="text-[11px] text-[#4b4452] mt-3">
            Ticket medio de compra en plataforma.
          </p>
        </div>

        {/* Categoría de Mayor Inversión */}
        <div className="bg-white p-6 rounded-3xl border border-[#cdc3d4]/20 flex flex-col justify-between shadow-xs hover:shadow-md transition-all">
          <p className="text-xs font-bold text-[#4b4452] uppercase tracking-wider">
            Especialidad Principal
          </p>
          <p className="text-2xl font-bold text-[#111c2c] mt-2 truncate">
            {topCategory}
          </p>
          <p className="text-[11px] text-[#4b4452] mt-3">
            Categoría con mayor presupuesto invertido.
          </p>
        </div>

        {/* Estado de Ahorro */}
        <div className="bg-white p-6 rounded-3xl border border-[#cdc3d4]/20 flex flex-col justify-between shadow-xs hover:shadow-md transition-all">
          <p className="text-xs font-bold text-[#006d37] uppercase tracking-wider">
            Oportunidades de Ahorro
          </p>
          <p className="text-3xl font-extrabold text-[#006d37] mt-2">
            {offers.length} Activa(s)
          </p>
          <p className="text-[11px] text-[#006d37]/80 mt-3 font-medium">
            Descuentos disponibles en tus productos frecuentes.
          </p>
        </div>

      </div>

      {/* ── GRAFICOS DE TENDENCIA Y CATEGORIAS ── */}
      <FinancialCharts monthlyHistory={monthlyHistory} categoryBreakdown={categoryBreakdown} />

      {/* ── PROYECCION 30/60/90 DIAS ── */}
      <ProjectionWidget projections={projections} />

      {/* ── SECCION DE OFERTAS INTELIGENTES PARA LA CLINICA ── */}
      {offers.length > 0 && (
        <section className="bg-white rounded-3xl border border-[#cdc3d4]/20 p-8 shadow-xs space-y-6">
          <div className="flex items-center gap-3 border-b border-[#cdc3d4]/20 pb-4">
            <div className="bg-[#006d37]/10 p-2 rounded-xl">
              <span className="material-symbols-outlined text-[#006d37]">local_offer</span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-[#111c2c]">Sugerencias de Ahorro Inteligente</h3>
              <p className="text-xs text-[#4b4452]">Descuentos vigentes en las tiendas proveedoras para tus insumos frecuentes.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {offers.map((offer) => (
              <div key={offer.productId} className="p-5 border border-[#cdc3d4]/30 rounded-2xl bg-white hover:shadow-md transition-all space-y-3">
                <div className="flex items-center gap-3">
                  <img src={offer.imageUrl || "/placeholder.png"} alt={offer.productName} className="w-12 h-12 rounded-xl object-cover border border-[#cdc3d4]/20" />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-[#111c2c] truncate">{offer.productName}</h4>
                    <p className="text-xs text-[#4b4452]">{offer.storeName}</p>
                  </div>
                </div>

                <div className="text-xs text-[#006d37] font-semibold bg-[#006d37]/10 p-2.5 rounded-xl">
                  {offer.recommendationText}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

    </div>
  );
}
