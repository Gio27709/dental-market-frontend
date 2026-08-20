import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import StatTile from "./StatTile";
import PeriodSwitch from "./PeriodSwitch";
import { formatCount } from "./format";
import PostsDailyChart from "./PostsDailyChart";


/**
 * Historial simple de las publicaciones para /admin/posts: los números gordos
 * y la curva por fecha. Todo lo demás (embudo, autores, categorías, orígenes)
 * vive en la pestaña Contenido de las analíticas, a un botón de aquí.
 */
export default function PostsHistoryPanel({ stats, loading, period, onPeriodChange }) {
  const kpis = stats?.kpis || {};
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
          <PeriodSwitch period={period} onPeriodChange={onPeriodChange} />
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
            <StatTile
              icon="visibility" label="Alcance" value={kpis.impressions} tone="violet"
              hint={`${formatCount(kpis.uniqueReach)} personas distintas`}
            />
            <StatTile
              icon="article" label="Vistas" value={kpis.views}
              hint={`${formatCount(kpis.uniqueReaders)} lectores distintos`}
            />
            <StatTile icon="favorite" label="Me gusta" value={kpis.likes} tone="rose" />
            <StatTile icon="forum" label="Comentarios" value={kpis.comments} />
            <StatTile icon="bookmark" label="Guardados" value={kpis.saves} />
            <StatTile
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
            <PostsDailyChart data={stats?.daily || []} />
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
