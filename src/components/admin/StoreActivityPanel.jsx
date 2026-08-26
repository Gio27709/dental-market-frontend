import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { getStoreActivityAPI } from "../../services/api";

/**
 * Panel de inactividad y dedicación diaria de una tienda.
 *
 * El KPI global de "Tiendas Dormidas" cuenta comercios sin ventas en 30 días, que es
 * una señal del comprador. Este panel mira lo que hace el dueño: cuándo entró por
 * última vez y cuánto tiempo dedica al día. Una tienda que entra a diario y no vende
 * no tiene el mismo problema que una que no entra desde marzo.
 */

const WINDOWS = [7, 30, 90];

const LEVEL_STYLES = {
  active: { pill: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-500", value: "text-emerald-600" },
  cooling: { pill: "bg-amber-50 text-amber-700", dot: "bg-amber-500", value: "text-amber-600" },
  dormant: { pill: "bg-orange-50 text-orange-700", dot: "bg-orange-500", value: "text-orange-600" },
  abandoned: { pill: "bg-red-50 text-red-700", dot: "bg-red-500", value: "text-red-600" },
  unknown: { pill: "bg-gray-100 text-gray-500", dot: "bg-gray-400", value: "text-gray-400" },
};

/** "hace 3 h", "hace 12 d". Sin librería: es la única fecha relativa del panel. */
const hace = (iso) => {
  if (!iso) return "Nunca";
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "ahora mismo";
  if (mins < 60) return `hace ${mins} min`;
  if (mins < 1440) return `hace ${Math.floor(mins / 60)} h`;
  const dias = Math.floor(mins / 1440);
  if (dias < 60) return `hace ${dias} d`;
  return `hace ${Math.floor(dias / 30)} meses`;
};

/** 95 min → "1 h 35 min". Los minutos sueltos se leen mal por encima de la hora. */
const dur = (minutos) => {
  const m = Math.round(minutos || 0);
  if (m < 60) return `${m} min`;
  return `${Math.floor(m / 60)} h ${m % 60} min`;
};

const fecha = (iso) =>
  iso ? new Date(iso).toLocaleString("es-VE", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

/** Barras de la serie diaria. Escala al día más alto de la ventana. */
const Sparkbars = ({ series }) => {
  const max = Math.max(...series.map((d) => d.minutes), 1);
  return (
    <div className="flex items-end gap-px h-12" role="img" aria-label="Minutos de actividad por día">
      {series.map((d) => (
        <div
          key={d.date}
          title={`${d.date}: ${dur(d.minutes)} · ${d.sessions} sesión(es)`}
          className="flex-1 min-w-[2px] rounded-sm bg-[#6b1e96]/70 hover:bg-[#6b1e96] transition-colors"
          style={{ height: `${Math.max((d.minutes / max) * 100, d.minutes > 0 ? 8 : 2)}%` }}
        />
      ))}
    </div>
  );
};

Sparkbars.propTypes = {
  series: PropTypes.arrayOf(
    PropTypes.shape({ date: PropTypes.string, minutes: PropTypes.number, sessions: PropTypes.number })
  ).isRequired,
};

export default function StoreActivityPanel({ userId }) {
  const [days, setDays] = useState(30);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    getStoreActivityAPI(userId, days)
      .then((res) => {
        if (!cancelled) setData(res.data?.data || null);
      })
      .catch((err) => {
        if (!cancelled) setError(err.response?.data?.error || "No se pudo cargar la actividad");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userId, days]);

  const inact = data?.inactivity;
  const act = data?.dailyActivity;
  const tone = LEVEL_STYLES[inact?.level] || LEVEL_STYLES.unknown;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Actividad</h4>
        <div className="flex gap-1">
          {WINDOWS.map((w) => (
            <button
              key={w}
              onClick={() => setDays(w)}
              className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-colors ${
                days === w ? "bg-[#6b1e96] text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              {w}d
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="bg-gray-50 rounded-xl p-6 flex justify-center">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#6b1e96]" />
        </div>
      ) : error ? (
        <p className="text-xs text-red-600 bg-red-50 rounded-xl p-3">{error}</p>
      ) : (
        <div className="space-y-3">
          {/* Las dos cifras que se piden de un vistazo */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-[10px] text-gray-500 font-medium">Inactiva desde hace</p>
              <p className={`text-2xl font-bold ${tone.value}`}>
                {inact.inactiveDays === null
                  ? "—"
                  : inact.inactiveDays === 0
                    ? `${inact.inactiveHours} h`
                    : `${inact.inactiveDays} d`}
              </p>
              <span className={`inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${tone.pill}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${tone.dot}`} />
                {inact.label}
              </span>
            </div>

            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-[10px] text-gray-500 font-medium">Promedio por día activo</p>
              <p className="text-2xl font-bold text-[#6b1e96]">{dur(act.avgMinutesPerActiveDay)}</p>
              <p className="text-[10px] text-gray-500 mt-1">
                {dur(act.avgMinutesPerCalendarDay)}/día sobre los {data.windowDays} d
              </p>
            </div>
          </div>

          {/* Constancia: cuántos de los días de la ventana trabajó */}
          <div className="bg-gray-50 rounded-xl p-3 space-y-2">
            <div className="flex items-baseline justify-between">
              <span className="text-[10px] text-gray-500 font-medium">
                Trabajó {act.activeDays} de {data.windowDays} días
              </span>
              <span className="text-xs font-bold text-gray-900">{act.consistencyPct}% de constancia</span>
            </div>
            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-[#6b1e96] rounded-full" style={{ width: `${act.consistencyPct}%` }} />
            </div>
            <Sparkbars series={act.series} />
            <div className="grid grid-cols-3 gap-2 pt-1 text-center">
              {[
                ["Tiempo total", dur(act.totalMinutes)],
                ["Sesiones", act.totalSessions],
                ["Pantallas vistas", act.totalPageViews],
              ].map(([label, val]) => (
                <div key={label}>
                  <p className="text-xs font-bold text-gray-900">{val}</p>
                  <p className="text-[10px] text-gray-500">{label}</p>
                </div>
              ))}
            </div>
            {act.busiestDay && (
              <p className="text-[10px] text-gray-500 text-center">
                Día más largo: {act.busiestDay.date} · {dur(act.busiestDay.minutes)}
              </p>
            )}
          </div>

          {/* De dónde sale el "inactiva desde": cada señal por separado */}
          <div className="bg-gray-50 rounded-xl p-3 space-y-1.5">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Últimas señales</p>
            {inact.signals.map((sig) => (
              <div key={sig.key} className="flex items-start justify-between gap-2 text-xs">
                <span className={sig.owner ? "text-gray-600" : "text-gray-400 italic"} title={sig.note || ""}>
                  {sig.label}
                  {!sig.owner && " *"}
                </span>
                <span className="font-medium text-gray-900 text-right whitespace-nowrap" title={fecha(sig.at)}>
                  {hace(sig.at)}
                </span>
              </div>
            ))}
            <p className="text-[10px] text-gray-400 pt-1 leading-snug">
              * No cuentan para la inactividad: no las produce la tienda. El tiempo se mide contando bloques de{" "}
              {data.bucketMinutes} min con actividad real del titular, no la duración de la sesión: una pestaña abierta
              y olvidada no suma.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

StoreActivityPanel.propTypes = {
  userId: PropTypes.string.isRequired,
};
