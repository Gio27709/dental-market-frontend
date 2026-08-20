import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ExternalLink } from "lucide-react";
import { getContentAnalyticsAPI } from "../../../services/api";
import useAnalyticsTabData from "../../../hooks/useAnalyticsTabData";
import KpiCard from "./KpiCard";
import ChartCard from "./ChartCard";
import DataTable from "./DataTable";
import SkeletonLoader from "./SkeletonLoader";
import FreshnessBadge from "./FreshnessBadge";
import DateRangePicker from "./DateRangePicker";
import AnalyticsErrorPanel from "./AnalyticsErrorPanel";
import useDrilldown from "../../../hooks/useDrilldown";
import DrilldownModal from "./DrilldownModal";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, Legend, CartesianGrid, ResponsiveContainer,
} from "recharts";

const TOOLTIP_STYLE = { backgroundColor: "#0d0418", border: "1px solid #ffffff29", borderRadius: "10px", color: "#f4f1f8", fontSize: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.55)" };

const VALID_PERIODS = ["7d", "15d", "30d", "90d", "365d"];

export default function ContentTab() {
  // El botón "Ver estadísticas completas" de /admin/posts llega con ?period,
  // para que la pestaña abra en el mismo rango que traía el historial.
  const [searchParams] = useSearchParams();
  const [period, setPeriod] = useState(() => {
    const fromUrl = searchParams.get("period");
    return VALID_PERIODS.includes(fromUrl) ? fromUrl : "30d";
  });
  const [chartMode, setChartMode] = useState("area");
  const { data, loading, error, reload } = useAnalyticsTabData(getContentAnalyticsAPI, period);
  const drilldown = useDrilldown();

  if (loading && !data) return <SkeletonLoader type="kpiRow" />;
  if (error) return <AnalyticsErrorPanel title="Error al Cargar Contenido & Comunidad" message={error} onRetry={() => reload(true)} />;

  const kpis = data?.kpis || {};

  return (
    <div className="space-y-6">
      <div className="relative z-30 flex flex-col md:flex-row md:items-center justify-between gap-4 fx-card-sm">
        <p className="text-[11px] text-fx-muted max-w-lg">
          Rendimiento de las publicaciones de la comunidad. Las vistas provienen del seguimiento real de lectura.
        </p>
        <div className="flex items-center gap-3 flex-wrap">
          <DateRangePicker selectedPeriod={period} onPeriodChange={setPeriod} />
          <FreshnessBadge lastUpdated={data?.serverTimestamp} onRefresh={() => reload(true)} isLoading={loading} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
        <KpiCard
          title="Alcance"
          value={kpis.impressions || 0}
          format="number"
          suffix=" impresiones"
          tooltip="Veces que una publicación apareció en pantalla en el feed al menos un segundo. Es distinto de las lecturas: mide a quién le pasó por delante."
          onDrilldown={() =>
            drilldown.open("analytics_events", {
              title: "Alcance de publicaciones",
              subtitle: "Apariciones en pantalla en el feed",
              filters: { event_name: "post_impression" }
            })
          }
        />
        <KpiCard
          title="Lecturas Totales"
          value={kpis.postViews || 0}
          format="number"
          suffix=" vistas"
          tooltip="Aperturas de publicaciones registradas por el seguimiento de eventos."
          onDrilldown={() =>
            drilldown.open("analytics_events", {
              title: "Lecturas de publicaciones",
              filters: { event_name: "post_view" }
            })
          }
        />
        <KpiCard
          title="Lectores Únicos"
          value={kpis.uniqueReaders || 0}
          format="number"
          suffix=" personas"
          tooltip="Visitantes distintos que abrieron al menos una publicación."
          onDrilldown={() =>
            drilldown.open("analytics_events", {
              title: "Lecturas de publicaciones",
              subtitle: "Cada lector aparece en las lecturas que hizo",
              filters: { event_name: "post_view" }
            })
          }
        />
        <KpiCard
          title="Tasa de Interacción"
          value={kpis.engagementRatePct || 0}
          format="percent"
          tooltip="Suma de likes, comentarios y guardados dividida entre las lecturas del período."
          onDrilldown={() =>
            drilldown.open("post_interactions", {
              title: "Todas las interacciones del período"
            })
          }
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 relative z-10">
        <KpiCard
          title="Publicaciones Nuevas"
          value={kpis.newPosts || 0}
          format="number"
          suffix=" posts"
          tooltip="Publicaciones creadas dentro del período seleccionado."
          onDrilldown={() =>
            drilldown.open("posts", { title: "Publicaciones creadas en el período" })
          }
        />
        <KpiCard
          title="Publicaciones Activas"
          value={kpis.publishedPosts || 0}
          format="number"
          suffix=" publicadas"
          tooltip="Total histórico de publicaciones visibles en la comunidad."
          onDrilldown={() =>
            drilldown.open("posts", {
              title: "Publicaciones activas (histórico)",
              filters: { is_published: true, allTime: true }
            })
          }
        />
        <KpiCard
          title="Me Gusta"
          value={kpis.likes || 0}
          format="number"
          tooltip="Likes registrados en el período."
          onDrilldown={() =>
            drilldown.open("post_interactions", { title: "Me gusta del período", filters: { kind: "me_gusta" } })
          }
        />
        <KpiCard
          title="Comentarios"
          value={kpis.comments || 0}
          format="number"
          tooltip="Comentarios publicados en el período."
          onDrilldown={() =>
            drilldown.open("post_interactions", { title: "Comentarios del período", filters: { kind: "comentario" } })
          }
        />
        <KpiCard
          title="Guardados"
          value={kpis.saves || 0}
          format="number"
          tooltip="Veces que se guardó una publicación para leer después."
          onDrilldown={() =>
            drilldown.open("post_interactions", { title: "Guardados del período", filters: { kind: "guardado" } })
          }
        />
      </div>

      <ChartCard
        title="Interacción Diaria con el Contenido"
        subtitle="Alcance, lecturas, me gusta y comentarios por día"
        onTypeChange={setChartMode}
      >
        <ResponsiveContainer width="100%" height={280}>
          {chartMode === "bar" ? (
            <BarChart data={data?.engagementTrend || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff12" />
              <XAxis dataKey="date" stroke="#7b6c99" fontSize={11} />
              <YAxis stroke="#7b6c99" fontSize={11} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="impressions" name="Alcance" fill="#7b6c99" radius={[4, 4, 0, 0]} />
              <Bar dataKey="views" name="Lecturas" fill="#c3ff00" radius={[4, 4, 0, 0]} />
              <Bar dataKey="likes" name="Me gusta" fill="#a855f7" radius={[4, 4, 0, 0]} />
              <Bar dataKey="comments" name="Comentarios" fill="#38bdf8" radius={[4, 4, 0, 0]} />
            </BarChart>
          ) : chartMode === "line" ? (
            <LineChart data={data?.engagementTrend || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff12" />
              <XAxis dataKey="date" stroke="#7b6c99" fontSize={11} />
              <YAxis stroke="#7b6c99" fontSize={11} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="impressions" name="Alcance" stroke="#7b6c99" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="views" name="Lecturas" stroke="#c3ff00" strokeWidth={3} dot={false} />
              <Line type="monotone" dataKey="likes" name="Me gusta" stroke="#a855f7" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="comments" name="Comentarios" stroke="#38bdf8" strokeWidth={2} dot={false} />
            </LineChart>
          ) : (
            <AreaChart data={data?.engagementTrend || []}>
              <defs>
                <linearGradient id="contentViews" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#c3ff00" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="#c3ff00" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff12" />
              <XAxis dataKey="date" stroke="#7b6c99" fontSize={11} />
              <YAxis stroke="#7b6c99" fontSize={11} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Area type="monotone" dataKey="impressions" name="Alcance" stroke="#7b6c99" strokeWidth={2} fillOpacity={0.15} fill="#7b6c99" />
              <Area type="monotone" dataKey="views" name="Lecturas" stroke="#c3ff00" strokeWidth={3} fillOpacity={1} fill="url(#contentViews)" />
              <Area type="monotone" dataKey="likes" name="Me gusta" stroke="#a855f7" strokeWidth={2} fillOpacity={0.2} fill="#a855f7" />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </ChartCard>

      <DataTable
        title="Publicaciones con Mejor Rendimiento"
        columns={[
          {
            header: "Título",
            accessor: "title",
            // El título abre el drilldown de eventos; el icono lleva a la ficha
            // completa de la publicación, fuera de las analíticas.
            render: (r) => (
              <span className="flex items-center gap-2">
                <button
                  onClick={() =>
                    drilldown.open("analytics_events", {
                      title: `Lecturas de "${r.title}"`,
                      filters: { event_name: "post_view", post_id: r.id }
                    })
                  }
                  className="font-bold text-fx-accent hover:underline text-left"
                >
                  {r.title}
                </button>
                <Link
                  to={`/admin/posts/${r.id}/stats`}
                  title="Ficha completa de la publicación"
                  className="text-fx-faint hover:text-fx-accent shrink-0"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </span>
            ),
          },
          { header: "Autor", accessor: "author_name", render: (r) => <span className="text-fx-faint">{r.author_name || "—"}</span> },
          { header: "Categoría", accessor: "category", render: (r) => r.category || "—" },
          { header: "Alcance", accessor: "impressions", render: (r) => <span className="text-fx-faint">{parseInt(r.impressions || 0).toLocaleString()}</span> },
          { header: "Lecturas", accessor: "views", render: (r) => <span className="font-semibold text-fx-accent">{parseInt(r.views || 0).toLocaleString()}</span> },
          { header: "Likes", accessor: "likes" },
          { header: "Comentarios", accessor: "comments" },
          { header: "Guardados", accessor: "saves" },
          { header: "Interacción", accessor: "engagement_rate_pct", render: (r) => `${parseFloat(r.engagement_rate_pct || 0).toFixed(1)}%` },
        ]}
        data={data?.topPosts || []}
        searchPlaceholder="Buscar publicación..."
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DataTable
          title="Autores Más Leídos"
          columns={[
            {
              header: "Autor",
              accessor: "author_name",
              render: (r) => (
                <button
                  onClick={() =>
                    drilldown.open("posts", {
                      title: `Publicaciones de ${r.author_name}`,
                      filters: { author_id: r.id, allTime: true }
                    })
                  }
                  className="font-bold text-fx-accent hover:underline text-left"
                >
                  {r.author_name}
                </button>
              ),
            },
            { header: "Posts", accessor: "posts" },
            { header: "Lecturas", accessor: "total_views", render: (r) => <span className="font-semibold text-fx-accent">{parseInt(r.total_views || 0).toLocaleString()}</span> },
            { header: "Likes", accessor: "total_likes" },
          ]}
          data={data?.topAuthors || []}
          searchPlaceholder="Buscar autor..."
        />
        <DataTable
          title="Categorías de Contenido"
          columns={[
            {
              header: "Categoría",
              accessor: "category",
              render: (r) =>
                r.category === "sin_categoria" ? (
                  <span className="font-bold text-fx-text capitalize">Sin categoría</span>
                ) : (
                  <button
                    onClick={() =>
                      drilldown.open("posts", {
                        title: `Publicaciones de la categoría "${r.category}"`,
                        filters: { category: r.category, allTime: true }
                      })
                    }
                    className="font-bold text-fx-accent hover:underline capitalize text-left"
                  >
                    {r.category}
                  </button>
                ),
            },
            { header: "Publicaciones", accessor: "posts" },
            { header: "Lecturas", accessor: "views", render: (r) => <span className="font-semibold text-fx-accent">{parseInt(r.views || 0).toLocaleString()}</span> },
          ]}
          data={data?.categories || []}
          searchPlaceholder="Buscar categoría..."
        />
      </div>

      <DrilldownModal {...drilldown.props} period={period} />
    </div>
  );
}
