import PropTypes from "prop-types";
import { useMemo } from "react";

const DAY_LABELS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const HOURS = Array.from({ length: 24 }, (_, h) => h);

/**
 * Mapa de calor de sesiones por día de la semana y hora local (America/Caracas).
 * Sirve para decidir cuándo publicar ofertas o programar mantenimientos.
 */
export default function TrafficHeatmap({ cells = [] }) {
  const { grid, max } = useMemo(() => {
    const g = Array.from({ length: 7 }, () => Array(24).fill(0));
    let m = 0;
    for (const cell of cells) {
      const d = Number(cell.day_of_week);
      const h = Number(cell.hour);
      const value = Number(cell.sessions) || 0;
      if (d >= 0 && d < 7 && h >= 0 && h < 24) {
        g[d][h] = value;
        if (value > m) m = value;
      }
    }
    return { grid: g, max: m };
  }, [cells]);

  return (
    <div className="fx-card">
      <h3 className="text-base font-bold text-fx-text mb-1">Horas Pico de Actividad</h3>
      <p className="text-xs text-fx-muted mb-4">Sesiones por día de la semana y hora (hora de Venezuela)</p>

      <div className="overflow-x-auto">
        <div className="min-w-max">
          <div className="flex items-center gap-1 mb-1 pl-10">
            {HOURS.map((h) => (
              <div key={h} className="w-6 text-center text-[9px] text-gray-500 font-mono">
                {h % 3 === 0 ? h : ""}
              </div>
            ))}
          </div>

          {grid.map((row, dayIndex) => (
            <div key={dayIndex} className="flex items-center gap-1 mb-1">
              <div className="w-10 text-[10px] font-bold text-fx-muted shrink-0">{DAY_LABELS[dayIndex]}</div>
              {row.map((value, hour) => (
                <div
                  key={hour}
                  title={`${DAY_LABELS[dayIndex]} ${String(hour).padStart(2, "0")}:00 — ${value} sesiones`}
                  className="w-6 h-6 rounded border border-fx-line shrink-0"
                  style={{
                    backgroundColor: value === 0 ? "rgba(168,85,247,0.05)" : "#c3ff00",
                    // La intensidad es relativa al pico del período, no a un absoluto
                    opacity: value === 0 ? 1 : 0.2 + 0.8 * (value / max),
                  }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 mt-4 text-[10px] text-fx-muted">
        <span>Menos</span>
        {[0.2, 0.4, 0.6, 0.8, 1].map((o) => (
          <div key={o} className="w-4 h-4 rounded" style={{ backgroundColor: "#c3ff00", opacity: o }} />
        ))}
        <span>Más</span>
        <span className="ml-2">· Pico: {max} sesiones</span>
      </div>
    </div>
  );
}

TrafficHeatmap.propTypes = {
  cells: PropTypes.arrayOf(
    PropTypes.shape({
      day_of_week: PropTypes.number,
      hour: PropTypes.number,
      sessions: PropTypes.number,
    })
  ),
};
