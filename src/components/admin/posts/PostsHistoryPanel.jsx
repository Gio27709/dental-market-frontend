import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import {
  ComposedChart, Area, Bar, Line,
  XAxis, YAxis, Tooltip, Legend, CartesianGrid, ResponsiveContainer,
} from "recharts";

const PERIODS = [
  { id: "7d", label: "7 días" },
  { id: "30d", label: "30 días" },
  { id: "90d", label: "90 días" },
];

const fmt = (n) => new Intl.NumberFormat("es-VE").format(n || 0);

/** Etiqueta corta "12 ago" para el eje: las fechas ISO no caben. */
const shortDate = (iso) => {
  const [y, m, d] = String(iso).split("-").map(Number);
  if (!y) return iso;
  return new Date(y, m - 1, d).toLocaleDateString("es-VE", { day: "numeric", month: "short" });
};

function Stat({ icon, label, value, hint, tone = "slate" }) {
  const tones = {
    slate: "text-gray-900",
    violet: "text-[#531575]",
    rose: "text-rose-600",
    emerald: "text-emerald-600",
  };
  return (
    <div className="bg-gray-50/70 border border-slate-200 rounded-2xl px-4 py-3">
      <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-gray-500">
        <span className="material-symbols-outlined text-[15px]">{icon}</span>
        {label}
      </div>
      <div className={`mt-1 text-2xl font-extrabold font-['Manrope'] ${tones[tone]}`}>{fmt(value)}</div>
      {hint && <div className="text-[11px] text-gray-400 font-medium mt-0.5">{hint}</div>}
    </div>
  );
}
Stat.propTypes = {
  icon: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  hint: PropTypes.string,
  tone: PropTypes.string,
};

/**
 * Historial simple de las publicaciones para /admin/posts: los números gordos
 * y la curva por fecha. Todo lo demás (embudo, autores, categorías, orígenes)
 * vive en la pestaña Contenido de las analíticas, a un botón de aquí.
 */
export default function PostsHistoryPanel({ stats, loading, period, onPeriodChange }) {
  const kpis = stats?.kpis || {};
  const daily = stats?.daily || [];
  const sinDatos = !loading && !kpis.impressions && !kpis.views && !kpis.likes && !kpis.comments;

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-6 space-y-5">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#531575] text-[22px]">monitoring</span>
            <h3 className="font-extrabold text-gray-900 font-['Manrope'] text-lg">Historial</h3>
          </div>
          <p className="text-sm text-gray-500">
            Cuánta gente vio las publicaciones y cómo reaccionó, por fecha.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="inline-flex bg-slate-100 rounded-xl p-1">
            {PERIODS.map((p) => (
              <button
                key={p.id}
                onClick={() => onPeriodChange(p.id)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  period === p.id
                    ? "bg-white text-[#531575] shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <Link
            to={`/admin/analytics?tab=content&period=${period}`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#531575] hover:bg-[#6b1e96] text-white font-semibold rounded-xl shadow-sm transition-all text-xs active:scale-95"
          >
            <span className="material-symbols-outlined text-[16px]">insights</span>
            Ver estadísticas completas
          </Link>
        </div>
      </div>

      {loading && !stats ? (
        <div className="h-56 rounded-2xl bg-slate-50 animate-pulse" />
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
            <Stat
              icon="visibility" label="Alcance" value={kpis.impressions} tone="violet"
              hint={`${fmt(kpis.uniqueReach)} personas distintas`}
            />
            <Stat
              icon="article" label="Vistas" value={kpis.views}
              hint={`${fmt(kpis.uniqueReaders)} lectores distintos`}
            />
            <Stat icon="favorite" label="Me gusta" value={kpis.likes} tone="rose" />
            <Stat icon="forum" label="Comentarios" value={kpis.comments} />
            <Stat icon="bookmark" label="Guardados" value={kpis.saves} />
            <Stat
              icon="percent" label="Interacción" value={`${kpis.engagementRatePct || 0}%`} tone="emerald"
              hint="sobre las vistas"
            />
          </div>

          {sinDatos ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 p-6 text-center">
              <span className="material-symbols-outlined text-slate-300 text-[32px]">query_stats</span>
              <p className="text-sm font-bold text-gray-700 mt-1">Todavía no hay lecturas registradas</p>
              <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
                La medición de vistas y alcance empieza a contar desde que se publicó esta versión:
                lo anterior no quedó guardado en ninguna parte. Si acabas de desplegarlo, dale tráfico
                al feed y vuelve en unos minutos.
              </p>
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={daily} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis
                    dataKey="date" tickFormatter={shortDate} tick={{ fontSize: 11, fill: "#94a3b8" }}
                    axisLine={false} tickLine={false} minTickGap={24}
                  />
                  <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    labelFormatter={shortDate}
                    contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area
                    type="monotone" dataKey="impressions" name="Alcance"
                    stroke="#c4b5fd" fill="#ede9fe" strokeWidth={2}
                  />
                  <Bar dataKey="likes" name="Me gusta" fill="#fb7185" radius={[4, 4, 0, 0]} barSize={10} />
                  <Bar dataKey="comments" name="Comentarios" fill="#94a3b8" radius={[4, 4, 0, 0]} barSize={10} />
                  <Line type="monotone" dataKey="views" name="Vistas" stroke="#531575" strokeWidth={2.5} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}
    </div>
  );
}

PostsHistoryPanel.propTypes = {
  stats: PropTypes.object,
  loading: PropTypes.bool,
  period: PropTypes.string.isRequired,
  onPeriodChange: PropTypes.func.isRequired,
};
