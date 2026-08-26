import { useState } from "react";
import { getSupportDeepAnalyticsAPI } from "../../../services/api";
import useAnalyticsTabData from "../../../hooks/useAnalyticsTabData";
import useDrilldown from "../../../hooks/useDrilldown";
import KpiCard from "./KpiCard";
import ChartCard from "./ChartCard";
import DataTable from "./DataTable";
import SkeletonLoader from "./SkeletonLoader";
import FreshnessBadge from "./FreshnessBadge";
import DateRangePicker from "./DateRangePicker";
import AnalyticsErrorPanel from "./AnalyticsErrorPanel";
import DrilldownModal from "./DrilldownModal";
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";

const num = (v) => Number(v || 0).toLocaleString("en-US");
const momento = (v) => (v ? new Date(v).toLocaleString("es-VE") : "—");
const horas = (v) => (v === null || v === undefined ? "—" : `${Number(v).toFixed(2)} h`);

const siNo = (v, tonoSi = "text-fx-pos", tonoNo = "text-gray-500") =>
  v ? <span className={`font-bold ${tonoSi}`}>Sí</span> : <span className={tonoNo}>No</span>;

const STATUS_STYLES = {
  open: "bg-fx-warn/15 text-fx-warn border-fx-warn/30",
  in_progress: "bg-fx-info/15 text-fx-info border-fx-info/30",
  resolved: "bg-fx-pos/15 text-fx-pos border-fx-pos/30",
  closed: "bg-gray-500/15 text-fx-muted border-gray-500/30"
};
const STATUS_LABELS = {
  open: "Abierto",
  in_progress: "En curso",
  resolved: "Resuelto",
  closed: "Cerrado"
};

const CATEGORY_LABELS = {
  logistics: "Logística",
  payment: "Pagos",
  account: "Cuenta",
  product_issue: "Producto",
  other: "Otros"
};
const CATEGORY_STYLES = {
  logistics: "bg-fx-info/15 text-fx-info border-fx-info/30",
  payment: "bg-fx-pos/15 text-fx-pos border-fx-pos/30",
  account: "bg-fx-violet/15 text-fx-faint border-fx-line-strong",
  product_issue: "bg-fx-warn/15 text-fx-warn border-fx-warn/30",
  other: "bg-gray-500/15 text-fx-muted border-gray-500/30"
};

const badge = (valor, estilos, etiquetas) => (
  <span
    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase border whitespace-nowrap ${
      estilos[valor] || "bg-gray-500/15 text-fx-muted border-gray-500/30"
    }`}
  >
    {etiquetas[valor] || valor || "—"}
  </span>
);

export default function SupportDeepTab() {
  const [period, setPeriod] = useState("365d");
  const { data, loading, error, reload } = useAnalyticsTabData(getSupportDeepAnalyticsAPI, period);
  const drilldown = useDrilldown();

  if (loading && !data) return <SkeletonLoader type="kpiRow" />;
  if (error) {
    return <AnalyticsErrorPanel title="Error al cargar Soporte Profundo" message={error} onRetry={() => reload(true)} />;
  }

  const ins = data?.instrumentation || {};
  const fun = data?.funnel || {};
  const fr = data?.firstResponse || {};
  const stamp = data?.stampAudit || {};
  const res = data?.resolution || {};
  const unread = data?.unread || {};
  const health = data?.conversationHealth || {};
  const skew = data?.clockSkew || {};
  const categories = data?.byCategory || [];
  const openers = data?.byOpenerRole || [];
  const responders = data?.responders || [];
  const backlog = data?.backlog || [];
  const threads = data?.threads || [];
  const messageLog = data?.messageLog || [];

  const funnelData = [
    { etapa: "Tickets", valor: fun.tickets || 0 },
    { etapa: "Con mensajes", valor: fun.withMessages || 0 },
    { etapa: "Con respuesta", valor: fun.withStaffReply || 0 },
    { etapa: "Cerrados", valor: fun.closedOut || 0 }
  ];

  const trendData = (data?.trend || [])
    .filter((d) => d.tickets > 0 || d.messages > 0)
    .map((d) => ({
      dia: new Date(d.day).toLocaleDateString("es-VE", { day: "2-digit", month: "short" }),
      tickets: d.tickets,
      mensajes: d.messages,
      soporte: d.staffMessages
    }));

  return (
    <div className="space-y-6">
      {/* Controles */}
      <div className="relative z-30 flex flex-col md:flex-row md:items-center justify-between gap-4 fx-card-sm">
        <div>
          <h2 className="text-sm font-bold text-fx-text">Soporte Profundo: la Conversación Real</h2>
          <p className="text-[11px] text-fx-muted">
            Quién escribió, cuándo contestamos y qué tickets se cerraron sin que nadie respondiera
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <DateRangePicker selectedPeriod={period} onPeriodChange={setPeriod} />
          <FreshnessBadge lastUpdated={data?.serverTimestamp} onRefresh={() => reload(true)} isLoading={loading} />
        </div>
      </div>

      {/* Integridad */}
      <div className="bg-fx-neg/10 border border-fx-neg/40 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-fx-neg mb-2 uppercase tracking-wide">
          Integridad de la Medición de Soporte
        </h3>
        <ul className="space-y-1.5 text-xs text-fx-muted">
          {stamp.disjoint && (
            <li>
              <span className="font-semibold text-fx-neg">
                El &quot;tiempo de primera respuesta&quot; del panel anterior no mide ninguna respuesta.
              </span>{" "}
              La columna <span className="font-mono">first_response_at</span> debería estamparla el primer mensaje de{" "}
              <span className="font-mono">owner</span>/<span className="font-mono">admin</span>. Si esto aparece, algo
              la está escribiendo por otra vía. Los {num(stamp.stamped)} tickets con esa marca no tienen{" "}
              <span className="font-semibold text-fx-neg">un solo mensaje</span>, mientras que las{" "}
              {num(stamp.conversationsUnstamped)} conversaciones que sí recibieron respuesta la tienen vacía. Son dos
              conjuntos que no se tocan: {horas(stamp.stampedAvgHours)} publicadas contra{" "}
              {horas(stamp.realAvgHours)} reales.
            </li>
          )}
          {(fun.closedWithoutReply || 0) > 0 && (
            <li>
              <span className="font-semibold text-fx-neg">
                {num(fun.closedWithoutReply)} de {num(fun.closedOut)} tickets cerrados
              </span>{" "}
              nunca recibieron una respuesta de soporte. Se marcaron como resueltos cambiando el estado, y ese mismo
              cambio fue el que estampó la métrica de &quot;respuesta&quot;.
            </li>
          )}
          {(ins.orderLink?.filled || 0) === 0 && (ins.tickets || 0) > 0 && (
            <li>
              <span className="font-semibold text-fx-warn">Ningún ticket enlaza con una orden.</span> El campo{" "}
              <span className="font-mono">support_tickets.order_id</span> existe y está vacío en los {num(ins.tickets)}{" "}
              tickets, aunque varios asuntos citan el número de pedido como texto libre. Soporte no se puede cruzar con
              ventas ni con logística.
            </li>
          )}
          {ins.inProgressUsed === 0 && (ins.tickets || 0) > 0 && (
            <li>
              <span className="font-semibold text-fx-warn">El estado &quot;en curso&quot; no se usa jamás.</span> Los
              tickets saltan de abierto a resuelto sin fase de atención, así que no hay forma de distinguir un caso que
              se está trabajando de uno que nadie ha tocado.
            </li>
          )}
          {(unread.incoherent || 0) > 0 && (
            <li>
              <span className="font-semibold text-fx-warn">
                {num(unread.incoherent)} banderas de &quot;no leído&quot; incoherentes
              </span>
              : {num(unread.adminUnreadEmpty)} encendidas en tickets sin un solo mensaje y{" "}
              {num(unread.adminUnreadClosed)} en tickets ya cerrados. La bandeja de pendientes no refleja trabajo real.
            </li>
          )}
          {(ins.guestChannel?.filled || 0) === 0 && (ins.tickets || 0) > 0 && (
            <li>
              <span className="font-semibold text-fx-warn">El canal de invitado está muerto</span>:{" "}
              <span className="font-mono">guest_name</span> y <span className="font-mono">guest_email</span> no
              registran un solo ticket. Quien no tiene cuenta no puede escribir, aunque el modelo lo contempla.
            </li>
          )}
          {res.approximation === "updated_at" && (
            <li>
              <span className="font-semibold text-fx-warn">No existe columna de cierre.</span> El tiempo de
              resolución se aproxima con <span className="font-mono">updated_at</span>, que cualquier UPDATE posterior
              (marcar leído, por ejemplo) desplaza. Por eso abajo se separa el promedio de los tickets que sí tuvieron
              conversación.
            </li>
          )}
          {skew.coherent === false && (
            <li>
              <span className="font-semibold text-fx-neg">
                {num(skew.messagesBeforeTicket)} de {num(skew.pairs)} mensajes
              </span>{" "}
              están fechados antes del ticket que los contiene: las dos tablas no comparten reloj y los tiempos de
              respuesta quedan retenidos.
            </li>
          )}
        </ul>
      </div>

      {/* Embudo de atención */}
      <div className="fx-card">
        <h3 className="text-sm font-semibold text-fx-text mb-1 uppercase tracking-wide">Embudo de Atención Real</h3>
        <p className="text-[11px] text-fx-muted mb-4">
          Medido sobre la conversación, no sobre el estado del ticket
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
          <KpiCard
            title="Tickets del Período"
            value={fun.tickets}
            format="number"
            tooltip="Tickets creados en el rango, con o sin conversación."
            onDrilldown={() => drilldown.open("support_tickets", { title: "Tickets del período" })}
          />
          <KpiCard
            title="Con Conversación"
            value={fun.messagePct}
            format="percent"
            suffix={` · ${num(fun.withMessages)} de ${num(fun.tickets)}`}
            tooltip="Tickets con al menos un mensaje. El resto son filas creadas sin que nadie escribiera nada."
            onDrilldown={() =>
              drilldown.open("support_tickets", { title: "Tickets con mensajes", filters: { has_messages: true } })
            }
          />
          <KpiCard
            title="Con Respuesta de Soporte"
            value={fun.replyPct}
            format="percent"
            suffix={` · ${num(fun.withStaffReply)} de ${num(fun.tickets)}`}
            tooltip="Tickets donde owner o admin escribió al menos una vez. En este marketplace 'store' y 'cliente' son quienes preguntan, no quienes atienden."
            onDrilldown={() =>
              drilldown.open("support_tickets", {
                title: "Tickets sin respuesta de soporte",
                filters: { no_staff_reply: true }
              })
            }
          />
          <KpiCard
            title="Cerrados sin Responder"
            value={fun.closedWithoutReply}
            format="number"
            suffix={` · ${num(fun.silentClosePct)}% de los cerrados`}
            tooltip="Resueltos o cerrados sin que soporte escribiera una sola línea."
            onDrilldown={() =>
              drilldown.open("support_tickets", {
                title: "Cerrados sin respuesta",
                filters: { closed_without_reply: true }
              })
            }
          />
        </div>
      </div>

      <ChartCard
        title="Embudo de Atención"
        subtitle="De ticket abierto a ticket cerrado, pasando por la evidencia de conversación"
      >
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={funnelData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#00000010" />
            <XAxis dataKey="etapa" stroke="#877f92" fontSize={11} />
            <YAxis stroke="#877f92" fontSize={11} allowDecimals={false} />
            <Tooltip
              contentStyle={{ backgroundColor: "#f7f4fc", border: "1px solid #00000020", borderRadius: "10px", color: "#33243d", fontSize: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.55)" }}
            />
            <Bar dataKey="valor" name="Tickets" fill="#6b1e96" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Primera respuesta honesta */}
      <div className="fx-card">
        <h3 className="text-sm font-semibold text-fx-text mb-1 uppercase tracking-wide">
          Primera Respuesta Reconstruida
        </h3>
        <p className="text-[11px] text-fx-muted mb-4">
          Calculada desde el primer mensaje de soporte en <span className="font-mono">ticket_messages</span>, con el
          tamaño de muestra que la sostiene
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10 mb-5">
          <div
            className={`rounded-2xl p-4 border ${
              fr.blocked ? "bg-fx-neg/5 border-fx-neg/30" : "bg-fx-panel border-fx-line"
            }`}
          >
            <p className="text-[10px] uppercase tracking-wider text-fx-muted font-bold mb-1">Media Real</p>
            {fr.blocked ? (
              <p className="text-lg font-semibold text-fx-neg">Retenida</p>
            ) : (
              <p className="text-2xl font-semibold text-fx-text">{horas(fr.avgHours)}</p>
            )}
            <p className="text-[10px] text-gray-500 mt-1">
              muestra: {num(fr.measurable)} de {num(fr.tickets)} tickets
            </p>
            <p className="text-[10px] text-fx-muted mt-2 leading-relaxed">
              La media se dispara con un solo caso lento; por eso la mediana de al lado importa más que este número.
            </p>
          </div>
          <KpiCard
            title="Mediana"
            value={fr.medianHours}
            format="number"
            suffix=" h"
            tooltip="La mitad de las respuestas llegó antes de este tiempo. Resiste los valores extremos que distorsionan la media."
            onDrilldown={() =>
              drilldown.open("support_tickets", {
                title: "Tickets con respuesta real de soporte",
                subtitle: "Las horas de la primera respuesta aparecen en su columna",
                filters: { no_staff_reply: false }
              })
            }
          />
          <KpiCard
            title="Percentil 90"
            value={fr.p90Hours}
            format="number"
            suffix=" h"
            tooltip="El 10% más lento tardó más que esto. Es el compromiso que realmente se le puede prometer a un cliente."
            onDrilldown={() =>
              drilldown.open("support_tickets", {
                title: "Tickets con respuesta real de soporte",
                subtitle: "Ordénese por la columna de primera respuesta para ver la cola lenta",
                filters: { no_staff_reply: false }
              })
            }
          />
          <KpiCard
            title="Cobertura"
            value={fr.coveragePct}
            format="percent"
            suffix={` · ${num(fr.measurable)} medibles`}
            tooltip="Porcentaje de tickets del período para los que existe una primera respuesta con hora. Del resto no se sabe nada."
            onDrilldown={() =>
              drilldown.open("ticket_messages", {
                title: "Mensajes de soporte",
                filters: { is_staff: true, allTime: true }
              })
            }
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-2xl p-4 border border-fx-pos/25 bg-fx-pos/5">
            <p className="text-[10px] uppercase tracking-wider text-fx-muted font-bold mb-1">Contestados en menos de 1 h</p>
            <p className="text-2xl font-semibold text-fx-pos">{num(fr.under1h)}</p>
            <p className="text-[10px] text-fx-muted mt-1">
              rango observado: {horas(fr.minHours)} a {horas(fr.maxHours)}
            </p>
          </div>
          <div className="rounded-2xl p-4 border border-fx-neg/25 bg-fx-neg/5">
            <p className="text-[10px] uppercase tracking-wider text-fx-muted font-bold mb-1">Más de 24 h sin respuesta</p>
            <p className="text-2xl font-semibold text-fx-neg">{num(fr.over24h)}</p>
            <p className="text-[10px] text-fx-muted mt-1">
              sobre {num(fr.measurable)} tickets con respuesta medible
            </p>
          </div>
        </div>
      </div>

      {/* Auditoría de la columna estampada */}
      <div className="fx-card">
        <h3 className="text-sm font-semibold text-fx-text mb-1 uppercase tracking-wide">
          Auditoría de <span className="font-mono normal-case">first_response_at</span>
        </h3>
        <p className="text-[11px] text-fx-muted mb-4">
          La columna, contrastada contra la evidencia de mensajes. Desde la migración 045 la estampa el primer
          mensaje de soporte, así que lo sano es 0 en las dos tarjetas del medio
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
          <KpiCard
            title="Tickets con Estampa"
            value={stamp.stamped}
            format="number"
            tooltip="Tickets con hora de primera respuesta. Desde la migración 045 la escribe el primer mensaje de owner/admin."
            onDrilldown={() =>
              drilldown.open("support_tickets", { title: "Tickets con estampa", filters: { has_stamp: true } })
            }
          />
          <KpiCard
            title="Estampados sin un Mensaje"
            value={stamp.stampedWithoutMessages}
            format="number"
            tooltip="Tienen hora de 'primera respuesta' y cero mensajes. Debe ser 0: si sube, la columna volvió a escribirse sin que nadie contestara."
            onDrilldown={() =>
              drilldown.open("support_tickets", {
                title: "Estampados sin conversación",
                filters: { stamped_without_messages: true }
              })
            }
          />
          <KpiCard
            title="Conversaciones sin Estampa"
            value={stamp.conversationsUnstamped}
            format="number"
            tooltip="Recibieron respuesta real de soporte pero la columna quedó nula. Debe ser 0: la migración 045 rellenó las históricas."
            onDrilldown={() =>
              drilldown.open("support_tickets", {
                title: "Conversaciones sin estampa",
                filters: { conversation_unstamped: true }
              })
            }
          />
          <KpiCard
            title="Estampados con Respuesta Real"
            value={stamp.stampedWithStaffReply}
            format="number"
            tooltip="La intersección entre ambos universos. Debe igualar a 'Tickets con Estampa': cada estampa respaldada por su mensaje."
            onDrilldown={() =>
              drilldown.open("support_tickets", {
                title: "Tickets con estampa y respuesta real",
                filters: { has_stamp: true, no_staff_reply: false }
              })
            }
          />
        </div>
      </div>

      {/* Resolución y salud de la conversación */}
      <div className="fx-card">
        <h3 className="text-sm font-semibold text-fx-text mb-1 uppercase tracking-wide">
          Cierre y Salud de la Conversación
        </h3>
        <p className="text-[11px] text-fx-muted mb-4">
          Sin columna <span className="font-mono">resolved_at</span>, lo único honesto es decir con qué se aproxima
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
          <KpiCard
            title="Resolución Aproximada"
            value={res.approxAvgHours}
            format="number"
            suffix=" h"
            tooltip="Promedio de updated_at menos created_at en tickets cerrados. Incluye las filas sembradas sin conversación, que lo inflan."
            onDrilldown={() =>
              drilldown.open("support_tickets", {
                title: "Tickets cerrados del período",
                filters: { is_open: false }
              })
            }
          />
          <KpiCard
            title="Resolución con Conversación"
            value={res.approxAvgHoursWithConvo}
            format="number"
            suffix={` · ${num(res.closedWithConvo)} casos`}
            tooltip="La misma aproximación, restringida a tickets que sí tuvieron mensajes. Es la cifra que se parece a un tiempo de trabajo real."
            onDrilldown={() =>
              drilldown.open("support_tickets", {
                title: "Tickets cerrados con conversación",
                filters: { is_open: false, has_messages: true }
              })
            }
          />
          <KpiCard
            title="Cerrados con la Última Palabra del Cliente"
            value={health.closedLastWordCustomer}
            format="number"
            tooltip="Se cerraron sin que soporte respondiera al último mensaje del cliente."
            onDrilldown={() =>
              drilldown.open("support_tickets", {
                title: "Cerrados con la última palabra del cliente",
                filters: { closed_last_word_customer: true }
              })
            }
          />
          <KpiCard
            title="Esperando a Soporte"
            value={health.awaitingStaff}
            format="number"
            tooltip="El último mensaje del hilo es del cliente y sigue sin contestar."
            onDrilldown={() =>
              drilldown.open("support_tickets", {
                title: "Tickets esperando a soporte",
                filters: { awaiting_staff: true }
              })
            }
          />
        </div>
      </div>

      {/* Categorías */}
      <div className="fx-card">
        <DataTable
          title="Por Categoría"
          subtitle="Dónde duele, y si esa categoría recibe respuesta"
          searchPlaceholder="Buscar categoría..."
          columns={[
            {
              header: "Categoría",
              accessor: "category",
              render: (r) => badge(r.category, CATEGORY_STYLES, CATEGORY_LABELS)
            },
            { header: "Tickets", accessor: "tickets", render: (r) => num(r.tickets) },
            { header: "Abiertos", accessor: "open", render: (r) => num(r.open) },
            { header: "Mensajes", accessor: "messages", render: (r) => num(r.messages) },
            {
              header: "Con respuesta",
              accessor: "replyPct",
              render: (r) => (
                <span className={r.replyPct === 0 ? "text-fx-neg font-bold" : "text-fx-muted"}>
                  {num(r.withStaffReply)} · {r.replyPct === null ? "—" : `${r.replyPct}%`}
                </span>
              )
            },
            {
              header: "1ª respuesta",
              accessor: "avgFirstReplyHours",
              render: (r) => horas(r.avgFirstReplyHours)
            }
          ]}
          data={categories}
          emptyMessage="Sin tickets en el período"
        />
      </div>

      {/* Quién pregunta y quién contesta */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="fx-card">
          <DataTable
            title="Quién Abre Tickets"
            subtitle="El rol del solicitante y si obtuvo respuesta"
            searchPlaceholder="Buscar rol..."
            columns={[
              { header: "Rol", accessor: "role" },
              { header: "Tickets", accessor: "tickets", render: (r) => num(r.tickets) },
              { header: "Mensajes", accessor: "messages", render: (r) => num(r.messages) },
              {
                header: "Con respuesta",
                accessor: "replyPct",
                render: (r) => `${num(r.withStaffReply)} · ${r.replyPct === null ? "—" : `${r.replyPct}%`}`
              }
            ]}
            data={openers}
            emptyMessage="Sin tickets en el período"
          />
        </div>

        <div className="fx-card">
          <DataTable
            title="Quién Contesta"
            subtitle="No existe tabla de agentes: se deduce de quién escribe"
            searchPlaceholder="Buscar persona..."
            columns={[
              { header: "Persona", accessor: "name" },
              { header: "Rol", accessor: "role" },
              { header: "Mensajes", accessor: "messages", render: (r) => num(r.messages) },
              { header: "Tickets", accessor: "tickets", render: (r) => num(r.tickets) },
              { header: "Último", accessor: "lastMsgAt", render: (r) => momento(r.lastMsgAt) }
            ]}
            data={responders}
            emptyMessage="Nadie de soporte ha escrito todavía"
          />
          <p className="text-[10px] text-gray-500 mt-3 leading-relaxed">
            No hay asignación de agentes ni tabla de turnos. Si una sola persona aparece aquí, toda la atención depende
            de ella y no existe forma de repartir la carga ni de medir a un equipo.
          </p>
        </div>
      </div>

      {/* Backlog abierto */}
      <div className="fx-card">
        <DataTable
          title="Tickets Abiertos Ahora"
          subtitle="Fuera del filtro de período: un ticket abierto lo sigue estando aunque sea viejo"
          searchPlaceholder="Buscar asunto o solicitante..."
          columns={[
            { header: "Abierto", accessor: "createdAt", render: (r) => momento(r.createdAt) },
            { header: "Asunto", accessor: "subject" },
            {
              header: "Categoría",
              accessor: "category",
              render: (r) => badge(r.category, CATEGORY_STYLES, CATEGORY_LABELS)
            },
            { header: "Solicitante", accessor: "userName" },
            {
              header: "Antigüedad",
              accessor: "ageHours",
              render: (r) => (
                <span className={r.ageHours > 24 ? "text-fx-neg font-bold" : "text-fx-muted"}>
                  {num(Math.round(r.ageHours))} h
                </span>
              )
            },
            { header: "Mensajes", accessor: "messages", render: (r) => num(r.messages) },
            {
              header: "Contestado",
              accessor: "staffMessages",
              render: (r) => siNo(r.staffMessages > 0, "text-fx-pos", "text-fx-neg")
            }
          ]}
          data={backlog}
          emptyMessage="No hay tickets abiertos"
        />
      </div>

      {/* Hilos */}
      <div className="fx-card">
        <DataTable
          title="Hilos del Período"
          subtitle="Cada fila enfrenta la respuesta real con la que estampa el trigger"
          searchPlaceholder="Buscar asunto..."
          columns={[
            { header: "Abierto", accessor: "createdAt", render: (r) => momento(r.createdAt) },
            { header: "Asunto", accessor: "subject" },
            {
              header: "Estado",
              accessor: "status",
              render: (r) => badge(r.status, STATUS_STYLES, STATUS_LABELS)
            },
            { header: "Solicitante", accessor: "userName" },
            { header: "Mensajes", accessor: "messages", render: (r) => num(r.messages) },
            { header: "De soporte", accessor: "staffMessages", render: (r) => num(r.staffMessages) },
            {
              header: "1ª respuesta real",
              accessor: "firstReplyHours",
              render: (r) =>
                r.firstReplyHours === null ? (
                  <span className="text-fx-neg font-bold">Nunca</span>
                ) : (
                  horas(r.firstReplyHours)
                )
            },
            {
              header: "Estampada",
              accessor: "stampedHours",
              render: (r) =>
                r.stampedHours === null ? <span className="text-gray-500">—</span> : horas(r.stampedHours)
            },
            { header: "Ligado a orden", accessor: "hasOrderLink", render: (r) => siNo(r.hasOrderLink) }
          ]}
          data={threads}
          emptyMessage="Sin tickets en el período"
        />
      </div>

      {/* Bitácora de mensajes */}
      <div className="fx-card">
        <DataTable
          title="Bitácora de Mensajes"
          subtitle="La evidencia cruda que sostiene todo lo anterior"
          searchPlaceholder="Buscar autor o mensaje..."
          columns={[
            { header: "Momento", accessor: "createdAt", render: (r) => momento(r.createdAt) },
            { header: "Autor", accessor: "senderName" },
            { header: "Rol", accessor: "senderRole" },
            { header: "Soporte", accessor: "isStaff", render: (r) => siNo(r.isStaff) },
            { header: "Ticket", accessor: "subject" },
            { header: "Mensaje", accessor: "excerpt" }
          ]}
          data={messageLog}
          emptyMessage="Sin mensajes registrados"
        />
        <button
          onClick={() => drilldown.open("ticket_messages", { title: "Todos los mensajes", filters: { allTime: true } })}
          className="w-full mt-4 text-[11px] font-bold text-fx-accent border border-fx-accent/30 rounded-xl py-2 hover:bg-[#6b1e96]/10 transition-colors"
        >
          Ver todos los mensajes
        </button>
      </div>

      {/* Actividad diaria */}
      {trendData.length > 0 && (
        <ChartCard title="Actividad Diaria" subtitle="Entrada de tickets frente a actividad real de respuesta">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#00000010" />
              <XAxis dataKey="dia" stroke="#877f92" fontSize={11} />
              <YAxis stroke="#877f92" fontSize={11} allowDecimals={false} />
              <Tooltip
                contentStyle={{ backgroundColor: "#f7f4fc", border: "1px solid #00000020", borderRadius: "10px", color: "#33243d", fontSize: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.55)" }}
              />
              <Bar dataKey="tickets" name="Tickets" fill="#7c4f9e" radius={[6, 6, 0, 0]} />
              <Bar dataKey="mensajes" name="Mensajes" fill="#6b1e96" radius={[6, 6, 0, 0]} />
              <Bar dataKey="soporte" name="De soporte" fill="#3f7794" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      <DrilldownModal {...drilldown.props} period={period} />
    </div>
  );
}
