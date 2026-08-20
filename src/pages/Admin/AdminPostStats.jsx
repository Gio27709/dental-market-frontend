import { useCallback, useEffect, useState } from "react";
import PropTypes from "prop-types";
import { Link, useParams } from "react-router-dom";
import { getPostDetailStatsAPI } from "../../services/api";
import StatTile from "../../components/admin/posts/StatTile";
import PostsDailyChart from "../../components/admin/posts/PostsDailyChart";
import PeriodSwitch from "../../components/admin/posts/PeriodSwitch";
import { formatCount } from "../../components/admin/posts/format";
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";

const DEVICE_LABELS = {
  desktop: "Escritorio", mobile: "Móvil", tablet: "Tableta",
  bot: "Robots", unknown: "Sin identificar", desconocido: "Sin identificar",
};
const SURFACE_LABELS = { feed: "Feed de noticias", detalle: "Enlace directo", "sin registrar": "Sin registrar" };
const KIND_LABELS = { like: "Me gusta", comment: "Comentó", save: "Guardó" };
const KIND_ICONS = { like: "favorite", comment: "forum", save: "bookmark" };

const fechaLarga = (iso) =>
  new Date(iso).toLocaleString("es-VE", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

function Card({ title, subtitle, icon, children, className = "" }) {
  return (
    <div className={`bg-white rounded-3xl border border-slate-200 shadow-md p-6 ${className}`}>
      <div className="flex items-center gap-2 mb-1">
        {icon && <span className="material-symbols-outlined text-[#531575] text-[20px]">{icon}</span>}
        <h3 className="font-extrabold text-gray-900 font-['Manrope']">{title}</h3>
      </div>
      {subtitle && <p className="text-xs text-gray-500 mb-4">{subtitle}</p>}
      <div className={subtitle ? "" : "mt-4"}>{children}</div>
    </div>
  );
}

Card.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  icon: PropTypes.string,
  children: PropTypes.node,
  className: PropTypes.string,
};

/**
 * Ficha de estadísticas de una publicación: /admin/posts/:id/stats
 * Se llega desde la fila del listado y desde el top de la pestaña Contenido.
 */
export default function AdminPostStats() {
  const { id } = useParams();
  const [period, setPeriod] = useState("30d");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getPostDetailStatsAPI(id, { period });
      setData(res.data?.data || null);
    } catch (err) {
      setError(err.response?.data?.error || "No se pudieron cargar las estadísticas.");
    } finally {
      setLoading(false);
    }
  }, [id, period]);

  useEffect(() => { load(); }, [load]);

  if (loading && !data) {
    return (
      <div className="max-w-6xl space-y-4">
        <div className="h-24 rounded-3xl bg-slate-100 animate-pulse" />
        <div className="h-40 rounded-3xl bg-slate-100 animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl">
        <div className="bg-white rounded-3xl border border-red-200 shadow-md p-8 text-center">
          <span className="material-symbols-outlined text-red-400 text-[32px]">error</span>
          <p className="font-bold text-gray-800 mt-1">{error}</p>
          <Link to="/admin/posts" className="inline-block mt-4 text-sm font-bold text-[#531575] hover:underline">
            Volver a publicaciones
          </Link>
        </div>
      </div>
    );
  }

  const { post, totals, funnel, daily, devices, sources, hours, category, people } = data || {};
  const sinDatos = !totals?.impressions && !totals?.views;
  const diffCategoria = (totals?.views || 0) - (category?.avgViews || 0);

  return (
    <div className="max-w-6xl space-y-5">
      <Link to="/admin/posts" className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#531575] hover:text-[#6b1e96]">
        <span className="material-symbols-outlined text-[16px]">arrow_back</span>
        Volver a publicaciones
      </Link>

      {/* Cabecera con la publicación */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-6 flex flex-col lg:flex-row lg:items-center gap-5">
        <div className="w-20 h-20 rounded-2xl bg-gray-100 overflow-hidden shrink-0 flex items-center justify-center border border-slate-200">
          {post?.thumbnail_url
            ? <img src={post.thumbnail_url} alt="" className="w-full h-full object-cover" />
            : <span className="material-symbols-outlined text-gray-300">image</span>}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold tracking-tight text-gray-900 font-['Manrope'] truncate">{post?.title}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {post?.category} · {post?.author_name || "Autor desconocido"} ·{" "}
            publicada el {post?.created_at ? fechaLarga(post.created_at).split(",")[0] : "—"}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <PeriodSwitch period={period} onPeriodChange={setPeriod} />
          <Link
            to="/admin/analytics?tab=content"
            className="inline-flex items-center gap-2 px-4 py-2 border border-slate-200 hover:border-[#531575]/30 text-gray-600 hover:text-[#531575] font-semibold rounded-xl transition-all text-xs"
          >
            <span className="material-symbols-outlined text-[16px]">insights</span>
            Todas las publicaciones
          </Link>
        </div>
      </div>

      {sinDatos && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 p-5 text-center">
          <p className="text-sm font-bold text-gray-700">Esta publicación todavía no tiene lecturas medidas</p>
          <p className="text-xs text-gray-500 mt-1 max-w-lg mx-auto">
            La medición empieza desde que se desplegó el seguimiento; lo anterior no se guardó.
            Las interacciones históricas sí están: {formatCount(totals?.likesAllTime)} me gusta,{" "}
            {formatCount(totals?.commentsAllTime)} comentarios y {formatCount(totals?.savesAllTime)} guardados.
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
        <StatTile icon="visibility" label="Alcance" value={totals?.impressions} tone="violet"
          hint={`${formatCount(totals?.uniqueReach)} personas distintas`} />
        <StatTile icon="article" label="Vistas" value={totals?.views}
          hint={`${formatCount(totals?.uniqueReaders)} lectores distintos`} />
        <StatTile icon="favorite" label="Me gusta" value={totals?.likes} tone="rose"
          hint={`${formatCount(totals?.likesAllTime)} en total`} />
        <StatTile icon="forum" label="Comentarios" value={totals?.comments}
          hint={`${formatCount(totals?.commentsAllTime)} en total`} />
        <StatTile icon="bookmark" label="Guardados" value={totals?.saves}
          hint={`${formatCount(totals?.savesAllTime)} en total`} />
        <StatTile icon="percent" label="Interacción" value={`${totals?.engagementRatePct || 0}%`} tone="emerald"
          hint="sobre las vistas" />
      </div>

      <Card title="Embudo" subtitle="De aparecer en pantalla a que alguien reaccione" icon="filter_alt">
        <div className="space-y-3">
          {(funnel || []).map((paso) => (
            <div key={paso.step}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-bold text-gray-700">
                  {paso.step} <span className="font-medium text-gray-400">· {paso.label}</span>
                </span>
                <span className="font-mono font-bold text-gray-900">
                  {formatCount(paso.value)}
                  <span className="ml-2 text-gray-400 font-semibold">{paso.pct}%</span>
                </span>
              </div>
              <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full rounded-full bg-[#531575] transition-all" style={{ width: `${paso.pct}%` }} />
              </div>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-gray-400 mt-4 leading-relaxed">
          El alcance solo se mide en el feed, así que una lectura que llegó por enlace directo cuenta
          como vista sin haber pasado por él. Por eso el segundo escalón puede llegar al 100%.
        </p>
      </Card>

      <Card title="Por fecha" subtitle="Alcance, vistas e interacciones día a día" icon="show_chart">
        <PostsDailyChart data={daily || []} />
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card title="Dispositivos" subtitle="Desde dónde la leyeron" icon="devices">
          {devices?.length ? (
            <div className="space-y-2.5">
              {devices.map((d) => {
                const total = devices.reduce((s, x) => s + x.views + x.impressions, 0) || 1;
                const parte = Math.round(((d.views + d.impressions) / total) * 100);
                return (
                  <div key={d.device}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-bold text-gray-700">{DEVICE_LABELS[d.device] || d.device}</span>
                      <span className="font-mono text-gray-500">{d.views} vistas · {d.impressions} alcance</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full rounded-full bg-slate-400" style={{ width: `${parte}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-gray-400 font-semibold">Sin lecturas en este rango.</p>
          )}
        </Card>

        <Card title="Por hora del día" subtitle="Hora de Caracas" icon="schedule">
          {hours?.length ? (
            <div style={{ height: 190 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hours} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="hour" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false}
                    tickFormatter={(h) => `${h}h`} />
                  <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip labelFormatter={(h) => `${h}:00`} contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }} />
                  <Bar dataKey="views" name="Vistas" fill="#531575" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="impressions" name="Alcance" fill="#c4b5fd" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-xs text-gray-400 font-semibold">Sin lecturas en este rango.</p>
          )}
        </Card>
      </div>

      <Card title="De dónde vinieron las lecturas" subtitle="Superficie propia, cómo la abrieron y sitio de procedencia" icon="alt_route">
        {sources?.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs font-bold uppercase tracking-wider text-gray-500 border-b border-slate-200">
                <tr>
                  <th className="py-2 pr-4">Superficie</th>
                  <th className="py-2 pr-4">Cómo la abrió</th>
                  <th className="py-2 pr-4">Procedencia</th>
                  <th className="py-2 text-right">Vistas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sources.map((s, i) => (
                  <tr key={`${s.surface}-${s.trigger}-${s.referrer}-${i}`}>
                    <td className="py-2 pr-4 font-semibold text-gray-800">{SURFACE_LABELS[s.surface] || s.surface}</td>
                    <td className="py-2 pr-4 text-gray-500">{s.trigger}</td>
                    <td className="py-2 pr-4 text-gray-500">{s.referrer}</td>
                    <td className="py-2 text-right font-mono font-bold text-gray-900">{s.views}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-xs text-gray-400 font-semibold">Sin lecturas en este rango.</p>
        )}
      </Card>

      <Card
        title={`Comparación con ${category?.name || "su categoría"}`}
        subtitle={`Frente a las otras ${formatCount(category?.postsInCategory)} publicaciones de la categoría, en el mismo rango`}
        icon="compare_arrows"
      >
        {category?.postsInCategory ? (
          <div className="flex flex-wrap items-center gap-6">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Esta publicación</div>
              <div className="text-3xl font-extrabold font-['Manrope'] text-[#531575]">{formatCount(totals?.views)}</div>
              <div className="text-[11px] text-gray-400 font-medium">vistas</div>
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Media de la categoría</div>
              <div className="text-3xl font-extrabold font-['Manrope'] text-gray-400">{formatCount(category.avgViews)}</div>
              <div className="text-[11px] text-gray-400 font-medium">vistas por publicación</div>
            </div>
            <div
              className={`px-4 py-2 rounded-2xl text-sm font-extrabold ${
                diffCategoria > 0 ? "bg-emerald-50 text-emerald-700"
                  : diffCategoria < 0 ? "bg-amber-50 text-amber-700"
                  : "bg-slate-50 text-slate-500"
              }`}
            >
              {diffCategoria > 0 ? "▲" : diffCategoria < 0 ? "▼" : "="}{" "}
              {formatCount(Math.abs(Math.round(diffCategoria * 10) / 10))} vistas
              {diffCategoria > 0 ? " por encima" : diffCategoria < 0 ? " por debajo" : " igualada"}
            </div>
          </div>
        ) : (
          <p className="text-xs text-gray-400 font-semibold">
            Es la única publicación de esta categoría: no hay con qué compararla.
          </p>
        )}
      </Card>

      <Card
        title="Quién interactuó"
        subtitle="Histórico completo de la publicación, no solo del rango elegido"
        icon="group"
      >
        {people?.length ? (
          <ul className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
            {people.map((p, i) => (
              <li key={`${p.kind}-${p.created_at}-${i}`} className="py-2.5 flex items-start gap-3">
                <span className={`material-symbols-outlined text-[18px] mt-0.5 ${
                  p.kind === "like" ? "text-rose-400" : p.kind === "comment" ? "text-[#531575]" : "text-slate-400"
                }`}>
                  {KIND_ICONS[p.kind]}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm">
                    <span className="font-bold text-gray-800">{p.user_name}</span>{" "}
                    <span className="text-gray-400 text-xs">{KIND_LABELS[p.kind]}</span>
                  </div>
                  {p.content && <p className="text-xs text-gray-600 mt-0.5 break-words">{p.content}</p>}
                  <div className="text-[11px] text-gray-400 mt-0.5">{fechaLarga(p.created_at)}</div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-gray-400 font-semibold">Nadie ha interactuado con esta publicación todavía.</p>
        )}
      </Card>
    </div>
  );
}
