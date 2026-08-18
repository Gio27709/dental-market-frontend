import { useState } from "react";
import { getLogisticsDeepAnalyticsAPI } from "../../../services/api";
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
const usd = (v) => "$" + Number(v || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const momento = (v) => (v ? new Date(v).toLocaleString("es-VE") : "—");
const horas = (v) => (v === null || v === undefined ? "—" : `${Number(v).toFixed(1)} h`);

const siNo = (v, tonoSi = "text-emerald-400", tonoNo = "text-gray-500") =>
  v ? <span className={`font-bold ${tonoSi}`}>Sí</span> : <span className={tonoNo}>No</span>;

const EVENT_STYLES = {
  picked_up: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  arrived: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  delivered: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  failed: "bg-rose-500/15 text-rose-300 border-rose-500/30"
};
const EVENT_LABELS = {
  picked_up: "Recogido",
  arrived: "En destino",
  delivered: "Entregado",
  failed: "Fallido"
};

const STATUS_STYLES = {
  delivered: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  shipped: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  pending: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  cancelled: "bg-gray-500/15 text-fx-muted border-gray-500/30"
};
const STATUS_LABELS = {
  delivered: "Entregado",
  shipped: "Despachado",
  pending: "Pendiente",
  cancelled: "Cancelado"
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

// Una etapa cuyo cálculo cruza order_items con delivery_events no se puede publicar
// cuando los dos relojes no coinciden: en vez de un número se muestra por qué falta.
const stageCard = (titulo, etapa, explicacion) => {
  const bloqueada = etapa?.crossTable && etapa?.hours === null && (etapa?.n || 0) > 0;
  return (
    <div
      key={titulo}
      className={`rounded-2xl p-4 border ${
        bloqueada ? "bg-rose-500/5 border-rose-500/30" : "bg-fx-panel border-fx-line"
      }`}
    >
      <p className="text-[10px] uppercase tracking-wider text-fx-muted font-bold mb-1">{titulo}</p>
      {bloqueada ? (
        <p className="text-lg font-semibold text-rose-300">No medible</p>
      ) : (
        <p className="text-2xl font-semibold text-fx-text">{horas(etapa?.hours)}</p>
      )}
      <p className="text-[10px] text-gray-500 mt-1">
        muestra: {num(etapa?.n)} {etapa?.n === 1 ? "envío" : "envíos"}
        {etapa?.crossTable ? " · cruza tablas" : " · un solo reloj"}
      </p>
      <p className="text-[10px] text-fx-muted mt-2 leading-relaxed">{explicacion}</p>
    </div>
  );
};

export default function LogisticsDeepTab() {
  const [period, setPeriod] = useState("365d");
  const { data, loading, error, reload } = useAnalyticsTabData(getLogisticsDeepAnalyticsAPI, period);
  const drilldown = useDrilldown();

  if (loading && !data) return <SkeletonLoader type="kpiRow" />;
  if (error) {
    return <AnalyticsErrorPanel title="Error al cargar Logística Profunda" message={error} onRetry={() => reload(true)} />;
  }

  const ins = data?.instrumentation || {};
  const fun = data?.funnel || {};
  const tim = data?.timings || {};
  const sla = data?.sla || {};
  const car = data?.carriers || {};
  const geo = data?.geography || {};
  const skew = data?.clockSkew || {};
  const ev = data?.eventLog || {};
  const adr = data?.addresses || {};
  const riders = data?.riders || [];

  const brokenStates = geo.brokenStates || [];
  const driftRiders = riders.filter((r) => r.counterDrift !== 0);

  const funnelData = [
    { etapa: "Ítems", valor: fun.items || 0 },
    { etapa: "Despachados", valor: fun.shipped || 0 },
    { etapa: "Recogidos", valor: fun.pickedUp || 0 },
    { etapa: "En destino", valor: fun.arrived || 0 },
    { etapa: "Entregados", valor: fun.deliveredEvent || 0 }
  ];

  const stateChart = (geo.states || []).slice(0, 12).map((s) => ({
    estado: s.state,
    pedidos: s.orders
  }));

  return (
    <div className="space-y-6">
      {/* Controles */}
      <div className="relative z-30 flex flex-col md:flex-row md:items-center justify-between gap-4 fx-card-sm">
        <div>
          <h2 className="text-sm font-bold text-fx-text">Logística Profunda, Trazabilidad y Geografía</h2>
          <p className="text-[11px] text-fx-muted">
            Qué queda registrado de cada envío, no qué promedio se puede calcular con lo que falta
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <DateRangePicker selectedPeriod={period} onPeriodChange={setPeriod} />
          <FreshnessBadge lastUpdated={data?.serverTimestamp} onRefresh={() => reload(true)} isLoading={loading} />
        </div>
      </div>

      {/* Integridad de la instrumentación */}
      <div className="bg-rose-500/10 border border-rose-500/40 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-rose-200 mb-2 uppercase tracking-wide">
          Integridad de la Trazabilidad
        </h3>
        <ul className="space-y-1.5 text-xs text-fx-muted">
          {(ins.deliveredWithoutTimestamp || 0) > 0 && (
            <li>
              <span className="font-semibold text-rose-300">
                {num(ins.deliveredWithoutTimestamp)} ítems entregados
              </span>{" "}
              no tienen hora de entrega. Son legado: hasta la migración 046,{" "}
              <span className="font-mono">delivered_at</span> hacía de semáforo de escrow y se borraba al liberar los
              fondos, así que la hora real se perdió y no hay de dónde deducirla. Desde entonces la estampa el trigger
              al entrar en &quot;entregado&quot; y el escrow usa{" "}
              <span className="font-mono">escrow_released_at</span>: los envíos nuevos ya no engrosan esta cifra.
            </li>
          )}
          {(ins.withSlaPromisedAt || 0) === 0 && (ins.totalItems || 0) > 0 && (
            <li>
              <span className="font-semibold text-rose-300">Ninguno de los {num(ins.totalItems)} envíos</span> tiene
              promesa de SLA escrita, aunque <span className="font-mono">shipping_sla_hours</span> está configurado en{" "}
              {num(sla.configuredHours)} h. El panel anterior medía el cumplimiento con{" "}
              <span className="font-mono">delivered_at &lt;= sla_promised_at OR sla_promised_at IS NULL</span>: con la
              promesa siempre nula la condición siempre se cumple y el SLA salía 100% sin haber medido nada.
            </li>
          )}
          {skew.coherent === false && (
            <li>
              <span className="font-semibold text-rose-300">
                {num(skew.eventsBeforeItem)} de {num(skew.pairs)} eventos de entrega
              </span>{" "}
              están fechados ANTES del ítem que entregan (desfase medio {horas(skew.avgOffsetHours)}). Un hito no puede
              preceder al envío: las dos tablas no comparten reloj, así que el tiempo de ciclo y el cumplimiento de SLA
              quedan retenidos en lugar de publicarse. Los tramos internos de la bitácora sí son válidos.
            </li>
          )}
          {(ev.total || 0) > 0 && (ev.withLat || 0) === 0 && (
            <li>
              <span className="font-semibold text-amber-300">0 de {num(ev.total)} eventos</span> guardan coordenadas.
              Las columnas <span className="font-mono">latitude</span> y <span className="font-mono">longitude</span>{" "}
              existen en la bitácora pero nunca se escriben: la trazabilidad geográfica está cableada y apagada.
            </li>
          )}
          {brokenStates.length > 0 && (
            <li>
              <span className="font-semibold text-rose-300">
                {num(brokenStates.length)} estado{brokenStates.length === 1 ? "" : "s"} destino
              </span>{" "}
              no existe tal cual en <span className="font-mono">state_distances</span>
              {brokenStates.some((s) => s.brokenByAccent) && " (difieren solo por la tilde)"}. El cálculo de distancia
              no lanza error: devuelve cero filas y el envío se cotiza en silencio con otra regla.
            </li>
          )}
          {(car.declaredButLost || 0) > 0 && (
            <li>
              <span className="font-semibold text-amber-300">{num(car.declaredButLost)} envíos</span> donde el
              comprador eligió transportista salieron sin registrarlo.{" "}
              <span className="font-mono">preferred_shipping_carrier</span> no se propaga a{" "}
              <span className="font-mono">order_items.shipping_carrier</span>.
            </li>
          )}
          {driftRiders.length > 0 && (
            <li>
              <span className="font-semibold text-amber-300">
                {num(driftRiders.length)} repartidor{driftRiders.length === 1 ? "" : "es"}
              </span>{" "}
              tiene el contador <span className="font-mono">total_deliveries</span> desincronizado de sus eventos
              reales. Nadie lo incrementa: es un campo desnormalizado muerto.
            </li>
          )}
        </ul>
      </div>

      {/* Cobertura de instrumentación */}
      <div className="fx-card">
        <h3 className="text-sm font-semibold text-fx-text mb-1 uppercase tracking-wide">Cobertura del Registro</h3>
        <p className="text-[11px] text-fx-muted mb-4">
          Antes de medir cualquier tiempo hay que saber cuántos envíos dejaron rastro
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
          <KpiCard
            title="Envíos del Período"
            value={ins.totalItems}
            format="number"
            tooltip="Ítems de pedido creados en el rango. Cada ítem viaja por separado porque puede salir de una tienda distinta."
            onDrilldown={() => drilldown.open("shipments", { title: "Envíos del período" })}
          />
          <KpiCard
            title="Con Trazabilidad"
            value={fun.traceabilityPct}
            format="percent"
            suffix={` · ${num(fun.withAnyEvent)} de ${num(fun.items)}`}
            tooltip="Envíos que tienen al menos un hito en delivery_events. El resto avanzó de estado sin dejar constancia de cuándo."
            onDrilldown={() =>
              drilldown.open("shipments", { title: "Envíos con bitácora", filters: { has_any_event: true } })
            }
          />
          <KpiCard
            title="Entregados sin Hora"
            value={ins.deliveredWithoutTimestamp}
            format="number"
            suffix={` de ${num(ins.statusDelivered)} entregados`}
            tooltip="Estado 'entregado' pero delivered_at vacío. Son entregas anteriores a la migración 046, cuando el escrow borraba esa columna al liberar los fondos; la hora real ya no existe. Las entregas nuevas la estampan siempre."
            onDrilldown={() =>
              drilldown.open("shipments", {
                title: "Entregados sin marca de tiempo",
                filters: { delivered_without_timestamp: true }
              })
            }
          />
          <KpiCard
            title="Promesas de SLA Escritas"
            value={ins.withSlaPromisedAt}
            format="number"
            suffix={` de ${num(ins.totalItems)}`}
            tooltip="Cuántos envíos tienen sla_promised_at. Sin esa columna no hay contra qué comparar la entrega."
            onDrilldown={() =>
              drilldown.open("shipments", { title: "Envíos con promesa de SLA", filters: { has_sla_promise: true } })
            }
          />
          <KpiCard
            title="Con Guía de Rastreo"
            value={ins.withTracking}
            format="number"
            suffix={` de ${num(ins.totalItems)}`}
            tooltip="Sin número de guía el comprador no puede seguir su envío ni soporte puede reclamarle al transportista."
            onDrilldown={() =>
              drilldown.open("shipments", { title: "Envíos con guía", filters: { has_tracking: true } })
            }
          />
          <KpiCard
            title="Con Transportista"
            value={ins.withCarrier}
            format="number"
            suffix={` de ${num(ins.totalItems)}`}
            tooltip="Envíos donde quedó registrado quién los llevó."
            onDrilldown={() =>
              drilldown.open("shipments", { title: "Envíos con transportista", filters: { has_carrier: true } })
            }
          />
          <KpiCard
            title="Con Evidencia"
            value={ins.withEvidence}
            format="number"
            suffix={` de ${num(ins.totalItems)}`}
            tooltip="Envíos con al menos una foto de despacho o entrega adjunta."
            onDrilldown={() =>
              drilldown.open("shipments", { title: "Envíos con evidencia", filters: { has_evidence: true } })
            }
          />
          <KpiCard
            title="Con Repartidor Asignado"
            value={ins.withRider}
            format="number"
            suffix={` de ${num(ins.totalItems)}`}
            tooltip="Solo los envíos de entrega local llevan repartidor propio; el resto va por transportista externo."
            onDrilldown={() =>
              drilldown.open("shipments", { title: "Envíos con repartidor asignado", filters: { has_rider: true } })
            }
          />
        </div>
      </div>

      {/* Embudo real */}
      <ChartCard
        title="Embudo Real de Entrega"
        subtitle="Reconstruido desde delivery_events, la única bitácora que nadie borra"
      >
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={funnelData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff12" />
            <XAxis dataKey="etapa" stroke="#7b6c99" fontSize={11} />
            <YAxis stroke="#7b6c99" fontSize={11} allowDecimals={false} />
            <Tooltip
              contentStyle={{ backgroundColor: "#0d0418", border: "1px solid #ffffff29", borderRadius: "10px", color: "#f4f1f8", fontSize: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.55)" }}
            />
            <Bar dataKey="valor" name="Envíos" fill="#c3ff00" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
          <div className="bg-rose-500/5 border border-rose-500/25 rounded-2xl p-3">
            <p className="text-[10px] uppercase tracking-wider text-fx-muted font-bold">Entregados sin evento</p>
            <p className="text-xl font-semibold text-rose-300">{num(fun.deliveredWithoutEvent)}</p>
            <p className="text-[10px] text-fx-muted mt-1">
              El estado dice entregado y la bitácora no lo registra: la barra de &quot;Entregados&quot; es la realidad
              trazable, no el conteo del negocio ({num(fun.statusDelivered)}).
            </p>
          </div>
          <div className="fx-card-sm">
            <p className="text-[10px] uppercase tracking-wider text-fx-muted font-bold">Eventos sin estado</p>
            <p className="text-xl font-semibold text-fx-text">{num(fun.eventWithoutStatus)}</p>
            <p className="text-[10px] text-fx-muted mt-1">
              Hito de entrega registrado pero el ítem sigue en otro estado. Cero significa que la bitácora nunca va por
              delante del estado.
            </p>
          </div>
          <div className="fx-card-sm">
            <p className="text-[10px] uppercase tracking-wider text-fx-muted font-bold">Fallidos registrados</p>
            <p className="text-xl font-semibold text-amber-300">{num(fun.failedEvent)}</p>
            <p className="text-[10px] text-fx-muted mt-1">
              Intentos de entrega que la bitácora marcó como fallidos.
            </p>
          </div>
        </div>
      </ChartCard>

      {/* Tiempos por etapa */}
      <div className="fx-card">
        <h3 className="text-sm font-semibold text-fx-text mb-1 uppercase tracking-wide">Tiempos Reales por Etapa</h3>
        <p className="text-[11px] text-fx-muted mb-4">
          Cada promedio se publica con su tamaño de muestra; un promedio sin muestra es una opinión
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stageCard(
            "Pedido → Recogida",
            tim.orderToPickup,
            "Desde que se crea el ítem hasta que el repartidor lo recoge. Cruza order_items con delivery_events."
          )}
          {stageCard(
            "Recogida → Destino",
            tim.pickupToArrival,
            "Tiempo en ruta. Se calcula entre dos eventos de la misma bitácora, así que el desfase entre tablas no lo afecta."
          )}
          {stageCard(
            "Destino → Entrega",
            tim.arrivalToDelivery,
            "Lo que tarda la entrega en mano una vez el repartidor llegó. También intra-bitácora."
          )}
          {stageCard(
            "Ciclo Completo",
            tim.totalCycle,
            "Del pedido a la entrega confirmada. Cruza tablas, por eso comparte la suerte de la primera etapa."
          )}
        </div>
      </div>

      {/* SLA */}
      <div className="fx-card">
        <h3 className="text-sm font-semibold text-fx-text mb-1 uppercase tracking-wide">
          Cumplimiento de SLA (reconstruido)
        </h3>
        <p className="text-[11px] text-fx-muted mb-4">
          La promesa nunca se guarda, así que se reconstruye como creación + {num(sla.configuredHours)} h y se contrasta
          contra el evento de entrega
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
          <div
            className={`rounded-2xl p-4 border ${
              sla.blocked ? "bg-rose-500/5 border-rose-500/30" : "bg-fx-panel border-fx-line"
            }`}
          >
            <p className="text-[10px] uppercase tracking-wider text-fx-muted font-bold mb-1">Entregas a Tiempo</p>
            {sla.blocked ? (
              <>
                <p className="text-lg font-semibold text-rose-300">Retenido</p>
                <p className="text-[10px] text-fx-muted mt-2 leading-relaxed">
                  Publicar un porcentaje aquí repetiría el error del panel anterior. Los relojes de las dos tablas no
                  coinciden, así que &quot;a tiempo&quot; saldría 100% por aritmética, no por desempeño.
                </p>
              </>
            ) : (
              <>
                <p className="text-2xl font-semibold text-fx-text">{num(sla.onTimePct)}%</p>
                <p className="text-[10px] text-gray-500 mt-1">
                  {num(sla.onTime)} a tiempo · {num(sla.late)} tarde
                </p>
              </>
            )}
          </div>
          <KpiCard
            title="Base Medible"
            value={sla.measurablePct}
            format="percent"
            suffix={` · ${num(sla.measurable)} de ${num(ins.statusDelivered)}`}
            tooltip="Porcentaje de las entregas declaradas que tienen un evento con hora. El resto no se puede evaluar contra ningún SLA."
            onDrilldown={() =>
              drilldown.open("shipments", {
                title: "Entregas con evento fechado",
                filters: { measurable_delivery: true }
              })
            }
          />
          <KpiCard
            title="Entregas No Evaluables"
            value={sla.unmeasurableDelivered}
            format="number"
            tooltip="Entregadas según el estado, sin evento que diga cuándo. Invisibles para cualquier métrica de puntualidad."
            onDrilldown={() =>
              drilldown.open("shipments", {
                title: "Entregas sin evento",
                filters: { delivered_without_event: true }
              })
            }
          />
          <KpiCard
            title="Abiertos Fuera de Plazo"
            value={sla.openPastDue}
            format="number"
            suffix={` · > ${num(sla.configuredHours)} h`}
            tooltip="Envíos aún sin entregar que ya superaron la ventana configurada. Se calcula solo dentro de order_items, así que el desfase de relojes no lo contamina."
            onDrilldown={() =>
              drilldown.open("shipments", {
                title: "Envíos abiertos fuera de plazo",
                filters: { open: true, age_hours_gte: sla.configuredHours }
              })
            }
          />
        </div>
      </div>

      {/* Transportistas */}
      <div className="fx-card">
        <h3 className="text-sm font-semibold text-fx-text mb-1 uppercase tracking-wide">Transportistas</h3>
        <p className="text-[11px] text-fx-muted mb-4">
          Lo que el comprador pidió frente a lo que quedó registrado en el envío
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10 mb-5">
          <KpiCard
            title="Preferencia Declarada"
            value={car.declaredItems}
            format="number"
            suffix={` de ${num(car.items)}`}
            tooltip="Envíos cuyo pedido traía preferred_shipping_carrier. El campo existe en checkout pero casi nadie lo usa."
            onDrilldown={() =>
              drilldown.open("shipments", {
                title: "Envíos con transportista declarado",
                filters: { has_declared_carrier: true }
              })
            }
          />
          <KpiCard
            title="Preferencia Perdida"
            value={car.declaredButLost}
            format="number"
            tooltip="El comprador eligió transportista y el ítem se despachó sin registrarlo: la preferencia no se propaga."
            onDrilldown={() =>
              drilldown.open("shipments", {
                title: "Preferencia de transportista perdida",
                filters: { carrier_preference_lost: true }
              })
            }
          />
          <KpiCard
            title="Preferencia Cambiada"
            value={car.declaredButChanged}
            format="number"
            tooltip="Salió con un transportista distinto al pedido. Cero aquí junto a 'perdida' alta significa que el dato no se contradice: simplemente se descarta."
            onDrilldown={() =>
              drilldown.open("shipments", {
                title: "Envíos con transportista distinto al pedido",
                filters: { carrier_preference_changed: true }
              })
            }
          />
          <KpiCard
            title="Envíos sin Guía"
            value={car.shippingWithoutTracking}
            format="number"
            tooltip="Envíos por transportista externo sin número de rastreo. La entrega local no lo necesita; el envío sí."
            onDrilldown={() =>
              drilldown.open("shipments", {
                title: "Envíos sin guía",
                filters: { delivery_type: "shipping", has_tracking: false }
              })
            }
          />
        </div>
        <DataTable
          title="Declarado vs. Real"
          subtitle="Cada fila es una combinación de lo pedido y lo registrado"
          searchPlaceholder="Buscar transportista..."
          columns={[
            { header: "Pedido por el comprador", accessor: "declared" },
            { header: "Registrado en el envío", accessor: "actual" },
            { header: "Envíos", accessor: "items", render: (r) => num(r.items) },
            { header: "Respetado", accessor: "honored", render: (r) => siNo(r.honored, "text-emerald-400", "text-gray-500") }
          ]}
          data={car.matrix || []}
          emptyMessage="Sin envíos en el período"
        />
      </div>

      {/* Geografía */}
      <div className="fx-card">
        <h3 className="text-sm font-semibold text-fx-text mb-1 uppercase tracking-wide">Geografía y Cobertura</h3>
        <p className="text-[11px] text-fx-muted mb-4">
          Sin estado destino no hay distancia, sin distancia no hay tarifa de envío
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10 mb-5">
          <KpiCard
            title="Pedidos con Estado"
            value={geo.stateCoveragePct}
            format="percent"
            suffix={` · ${num(geo.withState)} de ${num(geo.orders)}`}
            tooltip="Cobertura de destination_state. Todo lo que falta aquí es geografía que no se puede analizar."
            onDrilldown={() => drilldown.open("orders", { title: "Pedidos del período" })}
          />
          <KpiCard
            title="Entrega Local"
            value={geo.localDelivery}
            format="number"
            suffix={` vs ${num(geo.shipping)} por envío`}
            tooltip="Modalidad de entrega. La local usa repartidor propio y coordenadas; el envío usa transportista y guía."
            onDrilldown={() =>
              drilldown.open("shipments", {
                title: "Ítems de entrega local",
                subtitle: "El KPI cuenta pedidos; el detalle baja al ítem",
                filters: { delivery_type: "local_delivery" }
              })
            }
          />
          <KpiCard
            title="Pedidos con Coordenadas"
            value={geo.withCoords}
            format="number"
            suffix={` de ${num(geo.orders)}`}
            tooltip="delivery_lat/lng poblados. Coinciden exactamente con los de entrega local: el envío por transportista nunca geolocaliza."
            onDrilldown={() =>
              drilldown.open("shipments", {
                title: "Ítems de pedidos con coordenadas",
                subtitle: "El KPI cuenta pedidos; el detalle baja al ítem",
                filters: { has_order_coords: true }
              })
            }
          />
          <KpiCard
            title="Fletes Cobrados"
            value={geo.feeTotalUsd}
            format="currency"
            suffix={` · ${num(geo.withFee)} pedidos`}
            tooltip="Suma de delivery_fee_total. Si casi ningún pedido cobra flete, el costo de la entrega lo está absorbiendo la plataforma o la tienda."
            onDrilldown={() =>
              drilldown.open("shipments", {
                title: "Ítems de pedidos con flete cobrado",
                subtitle: "El KPI cuenta pedidos; el detalle baja al ítem",
                filters: { has_delivery_fee: true }
              })
            }
          />
        </div>

        {stateChart.length > 0 && (
          <div className="mb-5">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={stateChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff12" />
                <XAxis dataKey="estado" stroke="#7b6c99" fontSize={10} />
                <YAxis stroke="#7b6c99" fontSize={11} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0d0418", border: "1px solid #ffffff29", borderRadius: "10px", color: "#f4f1f8", fontSize: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.55)" }}
                />
                <Bar dataKey="pedidos" name="Pedidos" fill="#a855f7" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        <DataTable
          title="Estados destino"
          subtitle={`La tabla de distancias cubre ${num(geo.distanceTable?.origins)} estados y ${num(
            geo.distanceTable?.pairs
          )} pares, con un salto máximo de ${num(geo.distanceTable?.maxHop)}`}
          searchPlaceholder="Buscar estado..."
          columns={[
            { header: "Estado", accessor: "state" },
            { header: "Pedidos", accessor: "orders", render: (r) => num(r.orders) },
            { header: "GMV", accessor: "gmvUsd", render: (r) => usd(r.gmvUsd) },
            { header: "Fletes", accessor: "feesUsd", render: (r) => usd(r.feesUsd) },
            { header: "Con GPS", accessor: "withCoords", render: (r) => num(r.withCoords) },
            {
              header: "Resuelve distancia",
              accessor: "matchesExact",
              render: (r) => siNo(r.matchesExact, "text-emerald-400", "text-rose-400")
            },
            {
              header: "Rompe por tilde",
              accessor: "brokenByAccent",
              render: (r) => siNo(r.brokenByAccent, "text-rose-400", "text-gray-500")
            }
          ]}
          data={geo.states || []}
          emptyMessage="Ningún pedido del período registró estado destino"
        />
      </div>

      {/* Repartidores */}
      <div className="fx-card">
        <DataTable
          title="Repartidores"
          subtitle="Contador guardado frente a lo que dice la bitácora"
          searchPlaceholder="Buscar repartidor..."
          columns={[
            { header: "Repartidor", accessor: "name" },
            { header: "Tienda", accessor: "storeName" },
            { header: "Zona", accessor: "zone", render: (r) => r.zone || "— sin zona —" },
            { header: "Contador guardado", accessor: "storedCounter", render: (r) => num(r.storedCounter) },
            { header: "Entregas reales", accessor: "realDelivered", render: (r) => num(r.realDelivered) },
            {
              header: "Desvío",
              accessor: "counterDrift",
              render: (r) =>
                r.counterDrift === 0 ? (
                  <span className="text-emerald-400 font-bold">0</span>
                ) : (
                  <span className="text-rose-400 font-bold">{r.counterDrift}</span>
                )
            },
            { header: "Fallidas", accessor: "realFailed", render: (r) => num(r.realFailed) },
            { header: "Ítems asignados", accessor: "assignedItems", render: (r) => num(r.assignedItems) },
            { header: "Último evento", accessor: "lastEventAt", render: (r) => momento(r.lastEventAt) },
            { header: "Activo", accessor: "isActive", render: (r) => siNo(r.isActive) }
          ]}
          data={riders}
          emptyMessage="Sin repartidores registrados"
        />
      </div>

      {/* Envíos abiertos */}
      <div className="fx-card">
        <DataTable
          title="Envíos abiertos"
          subtitle="Lo único accionable hoy: pedidos sin entregar, ordenados por antigüedad"
          searchPlaceholder="Buscar producto o tienda..."
          columns={[
            { header: "Producto", accessor: "productName" },
            { header: "Tienda", accessor: "storeName" },
            { header: "Estado", accessor: "deliveryStatus", render: (r) => badge(r.deliveryStatus, STATUS_STYLES, STATUS_LABELS) },
            { header: "Modalidad", accessor: "deliveryType" },
            { header: "Transportista", accessor: "carrier", render: (r) => r.carrier || "— sin registrar —" },
            { header: "Guía", accessor: "trackingCode", render: (r) => r.trackingCode || "—" },
            { header: "Destino", accessor: "state", render: (r) => r.state || "— sin estado —" },
            { header: "Despachado", accessor: "shippedAt", render: (r) => momento(r.shippedAt) },
            {
              header: "Antigüedad",
              accessor: "ageHours",
              render: (r) => (
                <span className={r.pastDue ? "text-rose-400 font-bold" : "text-fx-muted"}>{horas(r.ageHours)}</span>
              )
            }
          ]}
          data={data?.inFlight || []}
          emptyMessage="No hay envíos abiertos en el período"
        />
      </div>

      {/* Bitácora */}
      <div className="fx-card">
        <div className="flex flex-wrap gap-4 mb-4 text-[11px] text-fx-muted">
          <span>
            <span className="text-fx-text font-bold">{num(ev.total)}</span> eventos
          </span>
          <span>
            sobre <span className="text-fx-text font-bold">{num(ev.distinctItems)}</span> envíos
          </span>
          <span>
            de <span className="text-fx-text font-bold">{num(ev.distinctRiders)}</span> repartidor(es)
          </span>
          <span>
            con GPS: <span className="text-rose-400 font-bold">{num(ev.geoCoveragePct)}%</span>
          </span>
          <span>
            rango: {momento(ev.firstEvent)} → {momento(ev.lastEvent)}
          </span>
        </div>
        <DataTable
          title="Bitácora de entrega"
          subtitle="La evidencia cruda detrás de todo lo anterior"
          searchPlaceholder="Buscar producto o repartidor..."
          columns={[
            { header: "Momento", accessor: "createdAt", render: (r) => momento(r.createdAt) },
            { header: "Hito", accessor: "eventType", render: (r) => badge(r.eventType, EVENT_STYLES, EVENT_LABELS) },
            { header: "Producto", accessor: "productName" },
            { header: "Repartidor", accessor: "riderName", render: (r) => r.riderName || "— sin atribuir —" },
            {
              header: "Estado del ítem",
              accessor: "deliveryStatus",
              render: (r) => badge(r.deliveryStatus, STATUS_STYLES, STATUS_LABELS)
            },
            { header: "Destino", accessor: "state", render: (r) => r.state || "—" },
            { header: "GPS", accessor: "hasGeo", render: (r) => siNo(r.hasGeo, "text-emerald-400", "text-rose-400") },
            { header: "Notas", accessor: "notes" }
          ]}
          data={ev.rows || []}
          emptyMessage="La bitácora está vacía"
        />
      </div>

      {/* Incidencias y direcciones */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 fx-card">
          <DataTable
            title="Incidencias de entrega"
            subtitle="Envíos con intentos fallidos o motivo de falla declarado"
            searchPlaceholder="Buscar motivo o producto..."
            columns={[
              { header: "Producto", accessor: "productName" },
              { header: "Tienda", accessor: "storeName" },
              { header: "Intentos", accessor: "attempts", render: (r) => num(r.attempts) },
              { header: "Motivo", accessor: "reason", render: (r) => r.reason || "— sin motivo —" },
              {
                header: "Estado",
                accessor: "deliveryStatus",
                render: (r) => badge(r.deliveryStatus, STATUS_STYLES, STATUS_LABELS)
              },
              { header: "Destino", accessor: "state", render: (r) => r.state || "—" }
            ]}
            data={data?.failures || []}
            emptyMessage="Ningún envío del período registró incidencias"
          />
        </div>

        <div className="fx-card">
          <h3 className="text-sm font-semibold text-fx-text mb-1 uppercase tracking-wide">Libreta de Direcciones</h3>
          <p className="text-[11px] text-fx-muted mb-4">
            Sin dirección guardada cada compra vuelve a escribirla a mano, y cada error de tipeo rompe el cálculo de
            envío
          </p>
          <div className="space-y-3">
            <div className="fx-card-sm">
              <p className="text-[10px] uppercase tracking-wider text-fx-muted font-bold">Adopción</p>
              <p className="text-2xl font-semibold text-fx-text">{num(adr.adoptionPct)}%</p>
              <p className="text-[10px] text-gray-500 mt-1">
                {num(adr.usersWithAddress)} de {num(adr.totalUsers)} usuarios guardó al menos una dirección
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="fx-card-sm">
                <p className="text-[10px] uppercase tracking-wider text-fx-muted font-bold">Direcciones</p>
                <p className="text-xl font-semibold text-fx-text">{num(adr.total)}</p>
              </div>
              <div className="fx-card-sm">
                <p className="text-[10px] uppercase tracking-wider text-fx-muted font-bold">Con GPS</p>
                <p className="text-xl font-semibold text-fx-text">{num(adr.withCoords)}</p>
              </div>
            </div>
            <button
              type="button"
              // La libreta es un stock, no un flujo: sus cifras son históricas, así que
              // el detalle también debe ignorar el período o no cuadraría con el panel.
              onClick={() =>
                drilldown.open("user_addresses", {
                  title: "Libreta de direcciones",
                  filters: { allTime: true }
                })
              }
              className="w-full text-[11px] font-bold text-fx-accent border border-fx-accent/30 rounded-xl py-2 hover:bg-[#c3ff00]/10 transition-colors"
            >
              Ver todas las direcciones
            </button>
          </div>
        </div>
      </div>

      <DrilldownModal {...drilldown.props} period={period} />
    </div>
  );
}
