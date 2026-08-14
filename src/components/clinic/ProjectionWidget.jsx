import { useState } from "react";
import PropTypes from "prop-types";

export default function ProjectionWidget({ projections }) {
  const [horizon, setHorizon] = useState(30);

  if (!projections) return null;

  const currentCost =
    horizon === 30
      ? projections.projected30Days
      : horizon === 60
      ? projections.projected60Days
      : projections.projected90Days;

  return (
    <div className="bg-white p-6 md:p-8 rounded-3xl border border-[#cdc3d4]/20 shadow-xs space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#cdc3d4]/20 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#541a97]"></span>
            <span className="text-xs font-bold text-[#541a97]/80 uppercase tracking-widest">
              Flujo de Caja Preventivo
            </span>
          </div>
          <h3 className="text-xl font-bold text-[#111c2c] flex items-center gap-2">
            <span className="material-symbols-outlined text-[#541a97]" style={{ fontVariationSettings: "'FILL' 1" }}>
              analytics
            </span>
            Proyección de Presupuesto Requerido
          </h3>
          <p className="text-xs text-[#4b4452] mt-0.5">
            Estimación de capital necesario para reponer stock preventivo sin desabastecer tu clínica.
          </p>
        </div>

        {/* Horizon Selector */}
        <div className="inline-flex p-1 bg-[#f9f9ff] border border-[#cdc3d4]/30 rounded-2xl">
          {[30, 60, 90].map((days) => (
            <button
              key={days}
              onClick={() => setHorizon(days)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                horizon === days
                  ? "bg-[#541a97] text-white shadow-xs"
                  : "text-[#4b4452] hover:text-[#111c2c]"
              }`}
            >
              {days} Días
            </button>
          ))}
        </div>
      </div>

      {/* Hero Projection Box */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-[#541a97]/5 border border-[#541a97]/15 flex flex-col justify-between">
          <p className="text-xs font-bold text-[#541a97] uppercase tracking-wider">
            Presupuesto Proyectado ({horizon} días)
          </p>
          <p className="text-3xl font-black text-[#541a97] mt-2">
            ${currentCost.toFixed(2)}
          </p>
          <p className="text-[11px] text-[#4b4452] mt-2">
            Estimación según velocidad de consumo proyectada.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-[#ba1a1a]/5 border border-[#ba1a1a]/15 flex flex-col justify-between">
          <p className="text-xs font-bold text-[#ba1a1a] uppercase tracking-wider">
            Costo Urgente (Stock Crítico)
          </p>
          <p className="text-3xl font-black text-[#ba1a1a] mt-2">
            ${projections.totalCriticalCost.toFixed(2)}
          </p>
          <p className="text-[11px] text-[#ba1a1a]/80 mt-2">
            Insumos por debajo del mínimo de seguridad que requieren compra inmediata.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-[#006d37]/5 border border-[#006d37]/15 flex flex-col justify-between">
          <p className="text-xs font-bold text-[#006d37] uppercase tracking-wider">
            Estado de Salud General
          </p>
          <p className="text-2xl font-black text-[#006d37] mt-2 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[24px]">verified</span>
            <span>Optimizado</span>
          </p>
          <p className="text-[11px] text-[#006d37]/80 mt-2">
            Algoritmo B2B monitoreando tus ítems activos.
          </p>
        </div>
      </div>
    </div>
  );
}

ProjectionWidget.propTypes = {
  projections: PropTypes.object,
};
