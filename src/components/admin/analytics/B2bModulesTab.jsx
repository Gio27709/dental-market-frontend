import { useState } from "react";
import { getB2bModulesAnalyticsAPI } from "../../../services/api";
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
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Cell } from "recharts";

const num = (v) => Number(v || 0).toLocaleString("en-US");
const money = (v) => `$${Number(v || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const momento = (v) => (v ? new Date(v).toLocaleString("es-VE") : "—");
const dias = (v) => (v === null || v === undefined ? "—" : `${Number(v).toFixed(1)} d`);

const siNo = (v, tonoSi = "text-emerald-400", tonoNo = "text-gray-500") =>
  v ? <span className={`font-bold ${tonoSi}`}>Sí</span> : <span className={tonoNo}>No</span>;

const PENALTY_LABELS = {
  warning: "Amonestación",
  fine: "Multa",
  suspension: "Suspensión",
  cancellation: "Cancelación"
};
const PENALTY_STYLES = {
  warning: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  fine: "bg-orange-500/15 text-orange-300 border-orange-500/30",
  suspension: "bg-rose-500/15 text-rose-300 border-rose-500/30",
  cancellation: "bg-red-500/15 text-red-300 border-red-500/30"
};

const PSTATUS_LABELS = { applied: "Aplicada", dismissed: "Descartada", pending: "Pendiente" };
const PSTATUS_STYLES = {
  applied: "bg-rose-500/15 text-rose-300 border-rose-500/30",
  dismissed: "bg-gray-500/15 text-fx-muted border-gray-500/30",
  pending: "bg-amber-500/15 text-amber-300 border-amber-500/30"
};

const ROLE_STYLES = {
  user: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  store: "bg-purple-500/15 text-fx-faint border-fx-line-strong",
  admin: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  owner: "bg-lime-500/15 text-lime-300 border-lime-500/30"
};

const badge = (valor, estilos, etiquetas = {}) => (
  <span
    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase border whitespace-nowrap ${
      estilos[valor] || "bg-gray-500/15 text-fx-muted border-gray-500/30"
    }`}
  >
    {etiquetas[valor] || valor || "—"}
  </span>
);

// Una etapa de la cadena. Verde = existe y funciona; rojo = aquí se corta.
const etapa = (s, i) => (
  <div key={i} className="flex items-start gap-2">
    <span
      className={`mt-0.5 w-4 h-4 shrink-0 rounded-full flex items-center justify-center text-[9px] font-semibold ${
        s.ok ? "bg-emerald-500/20 text-emerald-300" : "bg-rose-500/25 text-rose-300"
      }`}
    >
      {s.ok ? "✓" : "✕"}
    </span>
    <div className="min-w-0">
      <p className={`text-[11px] font-bold ${s.ok ? "text-fx-muted" : "text-rose-300"}`}>{s.stage}</p>
      <p className="text-[10px] text-gray-500 font-mono break-all">{s.detail}</p>
    </div>
  </div>
);

export default function B2bModulesTab() {
  const [period, setPeriod] = useState("365d");
  const { data, loading, error, reload } = useAnalyticsTabData(getB2bModulesAnalyticsAPI, period);
  const drilldown = useDrilldown();

  if (loading && !data) return <SkeletonLoader type="kpiRow" />;
  if (error) {
    return <AnalyticsErrorPanel title="Error al cargar Módulos B2B" message={error} onRetry={() => reload(true)} />;
  }

  const sum = data?.summary || {};
  const modules = data?.modules || [];
  const ret = data?.returns || {};
  const pen = data?.penalties || {};
  const ext = data?.externalSales || {};
  const subs = data?.subscriptions || {};
  const clinic = data?.clinicInventory || {};
  const prefs = data?.notificationPrefs || {};

  const rotos = modules.filter((m) => m.broken);
  const inertes = modules.filter((m) => !m.broken && m.rows === 0);

  const penaltyChart = (pen.byType || []).map((r) => ({
    etiqueta: `${PENALTY_LABELS[r.type] || r.type} · ${PSTATUS_LABELS[r.status] || r.status}`,
    n: r.n,
    aplicada: r.status === "applied"
  }));

  return (
    <div className="space-y-6">
      {/* Controles */}
      <div className="relative z-30 flex flex-col md:flex-row md:items-center justify-between gap-4 fx-card-sm">
        <div>
          <h2 className="text-sm font-bold text-fx-text">Módulos B2B: por qué estas tablas están vacías</h2>
          <p className="text-[11px] text-fx-muted">
            Un cero puede significar &quot;nadie lo usa&quot; o &quot;la cadena está rota&quot;. Aquí se distingue cuál
            es cuál, etapa por etapa.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <DateRangePicker selectedPeriod={period} onPeriodChange={setPeriod} />
          <FreshnessBadge lastUpdated={data?.serverTimestamp} onRefresh={() => reload(true)} isLoading={loading} />
        </div>
      </div>

      {/* Diagnóstico principal */}
      <div className="bg-rose-500/10 border border-rose-500/40 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-rose-200 mb-2 uppercase tracking-wide">
          Qué está roto y qué simplemente no se usa
        </h3>
        <ul className="space-y-1.5 text-xs text-fx-muted">
          {rotos.length > 0 && (
            <li>
              <span className="font-semibold text-rose-300">
                {num(rotos.length)} de {num(sum.modulesTracked)} módulos tienen la cadena cortada
              </span>{" "}
              ({rotos.map((m) => m.label).join(", ")}). No están vacíos por falta de uso: es
              técnicamente imposible que reciban una fila mientras el corte siga ahí.
            </li>
          )}
          {modules.some((m) => m.blockingStage === "Montada en server") && (
            <li>
              <span className="font-semibold text-rose-300">
                <span className="font-mono">inventoryRoutes.js</span> nunca se monta en{" "}
                <span className="font-mono">server.js</span>.
              </span>{" "}
              El router existe con 9 endpoints y el controlador está escrito, pero el portal{" "}
              <span className="font-mono">/clinic</span> llama a <span className="font-mono">/api/inventory/*</span> con
              axios crudo y recibe 404 en cada intento. Todo el módulo de consultorio (inventario, suscripciones,
              reposición) es una pantalla que no puede guardar nada.
            </li>
          )}
          {(clinic.dependentServices || []).length > 0 && (
            <li>
              <span className="font-semibold text-amber-300">
                {num((clinic.dependentServices || []).length)} servicios de backend leen esas tablas vacías
              </span>{" "}
              (<span className="font-mono">{(clinic.dependentServices || []).join(", ")}</span>). Corren sin fallar y
              siempre devuelven cero: proyecciones, ofertas inteligentes y sugerencias de reposición trabajan sobre la
              nada sin avisarlo.
            </li>
          )}
          {prefs.configured === 0 && prefs.totalUsers > 0 && (
            <li>
              <span className="font-semibold text-amber-300">
                Ningún usuario ha configurado sus preferencias de notificación
              </span>{" "}
              ({num(prefs.configured)} de {num(prefs.totalUsers)}). La pantalla ya existe (
              <span className="font-mono">/account/notifications → Preferencias</span>), así que ahora es falta de uso.
              Mientras tanto, las {num(prefs.notificationsSent)} notificaciones enviadas salen por el default implícito
              de <span className="font-mono">notificationService.js:71</span> (
              <span className="font-mono">if (!data) return true</span>): todo activado, sin consentimiento explícito.
            </li>
          )}
          {inertes.length > 0 && (
            <li>
              <span className="font-semibold text-sky-300">
                {num(inertes.length)} módulos funcionan de punta a punta y aun así están en cero
              </span>{" "}
              ({inertes.map((m) => m.label).join(", ")}). Aquí el problema no es técnico sino de adopción, y por eso
              abajo se publica el universo elegible en lugar de un cero suelto.
            </li>
          )}
          {pen.total > 0 && ret.requests === 0 && (
            <li>
              <span className="font-semibold text-lime-300">
                Las incidencias de entrega sí se registran: {num(pen.total)} sanciones a tiendas
              </span>{" "}
              por incumplir el SLA, contra {num(ret.requests)} devoluciones solicitadas. El sistema castiga al proveedor
              automáticamente pero nunca escucha al comprador: los dos canales existen y solo uno tiene datos.
            </li>
          )}
        </ul>
      </div>

      {/* Estado de cada cadena */}
      <div className="fx-card">
        <h3 className="text-sm font-semibold text-fx-text mb-1 uppercase tracking-wide">Cadena de cada módulo</h3>
        <p className="text-[11px] text-fx-muted mb-4">
          Seis etapas: tabla → controlador → ruta → montada en el servidor → función en el frontend → pantalla que la
          invoca. Basta que una falle para que la tabla no pueda recibir una sola fila.
        </p>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {modules.map((m) => (
            <div
              key={m.key}
              className={`rounded-2xl p-4 border ${
                m.broken ? "border-rose-500/40 bg-rose-500/5" : "border-emerald-500/30 bg-emerald-500/5"
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-fx-text truncate">{m.label}</p>
                  <p className="text-[10px] text-gray-500 font-mono">{m.table}</p>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase border whitespace-nowrap ${
                    m.broken
                      ? "bg-rose-500/15 text-rose-300 border-rose-500/30"
                      : "bg-sky-500/15 text-sky-300 border-sky-500/30"
                  }`}
                >
                  {m.broken ? "Cadena rota" : "Sin uso"}
                </span>
              </div>
              <p className="text-[11px] text-fx-muted mb-3">
                <span className="font-semibold text-fx-text">{num(m.rows)}</span> filas registradas
              </p>
              <div className="space-y-1.5 mb-3">{(m.pipeline || []).map(etapa)}</div>
              <p className="text-[11px] text-fx-muted leading-relaxed border-t border-white/10 pt-2">{m.diagnosis}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Devoluciones */}
      <div className="fx-card">
        <h3 className="text-sm font-semibold text-fx-text mb-1 uppercase tracking-wide">
          Devoluciones: el universo que podría reclamar
        </h3>
        <p className="text-[11px] text-fx-muted mb-4">
          <span className="font-mono">returnController.js:32</span> solo admite ítems con entrega{" "}
          <span className="font-mono">delivered</span> o <span className="font-mono">shipped</span>. Ese es el
          denominador real del cero.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiCard
            title="Solicitudes de devolución"
            value={ret.requests}
            format="number"
            tooltip="Filas en return_requests. La cadena funciona: nadie la ha usado."
            onDrilldown={() =>
              drilldown.open("return_requests", {
                title: "Solicitudes de devolución",
                filters: { allTime: true }
              })
            }
          />
          <KpiCard
            title="Ítems elegibles"
            value={ret.eligibleItems}
            format="number"
            tooltip={`${num(ret.eligibleDelivered)} entregados y ${num(ret.eligibleShipped)} en tránsito podrían reclamarse hoy.`}
            onDrilldown={() =>
              drilldown.open("returnable_items", {
                title: "Ítems elegibles para devolución",
                filters: { allTime: true }
              })
            }
          />
          <KpiCard
            title="Valor en juego"
            value={ret.eligibleValue}
            format="currency"
            tooltip="Suma de los ítems elegibles. Es la exposición máxima si todos reclamaran."
            onDrilldown={() =>
              drilldown.open("returnable_items", {
                title: "Valor elegible para devolución",
                filters: { allTime: true }
              })
            }
          />
          <KpiCard
            title="Tasa de reclamo"
            value={ret.requestRatePct === null ? 0 : ret.requestRatePct}
            format="percent"
            tooltip="Ítems elegibles que generaron una solicitud."
            onDrilldown={() =>
              drilldown.open("returnable_items", {
                title: "Elegibles con solicitud de devolución",
                filters: { allTime: true, has_return_request: true }
              })
            }
          />
        </div>
        {ret.requests === 0 && (
          <p className="text-[11px] text-fx-muted mt-4 border-t border-white/10 pt-3">
            Sin datos aún: la tabla <span className="font-mono">return_requests</span> está vacía. La cadena está
            completa, así que el módulo empezará a llenarse en cuanto un comprador use el botón de{" "}
            <span className="font-mono">Account/OrderDetail.jsx</span>. Los cuadros de arriba quedan instrumentados para
            ese momento.
          </p>
        )}
        {(ret.rows || []).length > 0 && (
          <div className="mt-5">
            <DataTable
              title="Solicitudes registradas"
              searchPlaceholder="Buscar producto o motivo…"
              columns={[
                { header: "Fecha", accessor: "createdAt", render: (r) => momento(r.createdAt) },
                { header: "Producto", accessor: "productName" },
                { header: "Rol", accessor: "requesterRole", render: (r) => badge(r.requesterRole, ROLE_STYLES) },
                { header: "Estado", accessor: "status" },
                { header: "Motivo", accessor: "reason" },
                { header: "Reembolso", accessor: "refundAmount", render: (r) => money(r.refundAmount) }
              ]}
              data={ret.rows}
              emptyMessage="Sin solicitudes."
            />
          </div>
        )}
      </div>

      {/* Sanciones: el contraste */}
      <div className="fx-card">
        <h3 className="text-sm font-semibold text-fx-text mb-1 uppercase tracking-wide">
          El canal que sí funciona: sanciones automáticas a tiendas
        </h3>
        <p className="text-[11px] text-fx-muted mb-4">
          Los incumplimientos de entrega no se pierden, se castigan solos. Ninguna sanción coincidió con una devolución
          del comprador, así que hoy la única voz sobre un pedido incumplido es la del cron.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          <KpiCard
            title="Sanciones emitidas"
            value={pen.total}
            format="number"
            tooltip="Filas en store_penalties, todas generadas automáticamente por el cron de SLA."
            onDrilldown={() =>
              drilldown.open("store_penalties", { title: "Sanciones a tiendas", filters: { allTime: true } })
            }
          />
          <KpiCard
            title="Monto multado"
            value={pen.totalAmount}
            format="currency"
            tooltip="Suma de las multas con monto. Las amonestaciones y cancelaciones no cobran."
            onDrilldown={() =>
              drilldown.open("store_penalties", {
                title: "Sanciones con monto",
                filters: { allTime: true, with_amount: true }
              })
            }
          />
          <KpiCard
            title="Descartadas"
            value={(pen.byType || []).filter((r) => r.status === "dismissed").reduce((a, r) => a + r.n, 0)}
            format="number"
            tooltip="Sanciones revertidas por un admin o por reactivación manual."
            onDrilldown={() =>
              drilldown.open("store_penalties", {
                title: "Sanciones descartadas",
                filters: { allTime: true, status: "dismissed" }
              })
            }
          />
          <KpiCard
            title="Con devolución asociada"
            value={(pen.rows || []).filter((r) => (r.returnsOnItem || 0) > 0).length}
            format="number"
            tooltip="Sanciones cuyo ítem también generó una solicitud de devolución. Cero significa que los dos canales no se cruzan nunca."
            onDrilldown={() =>
              drilldown.open("store_penalties", {
                title: "Sanciones con devolución del comprador",
                filters: { allTime: true, item_had_return: true }
              })
            }
          />
        </div>

        {penaltyChart.length > 0 && (
          <ChartCard title="Sanciones por tipo y desenlace" subtitle="Rojo: aplicada. Gris: descartada.">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={penaltyChart} margin={{ top: 10, right: 10, left: 0, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff12" />
                <XAxis dataKey="etiqueta" stroke="#7b6c99" fontSize={10} angle={-20} textAnchor="end" height={60} />
                <YAxis stroke="#7b6c99" fontSize={10} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0d0418", border: "1px solid #ffffff29", borderRadius: "10px", color: "#f4f1f8", fontSize: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.55)" }}
                />
                <Bar dataKey="n" name="Sanciones" radius={[6, 6, 0, 0]}>
                  {penaltyChart.map((d, i) => (
                    <Cell key={i} fill={d.aplicada ? "#f43f5e" : "#6b7280"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        <div className="mt-5">
          <DataTable
            title="Sanciones recientes"
            subtitle="El motivo cita las horas exactas de retraso: la evidencia del incumplimiento existe y está fechada."
            searchPlaceholder="Buscar tienda o motivo…"
            columns={[
              { header: "Fecha", accessor: "createdAt", render: (r) => momento(r.createdAt) },
              { header: "Tienda", accessor: "storeName" },
              { header: "Tipo", accessor: "type", render: (r) => badge(r.type, PENALTY_STYLES, PENALTY_LABELS) },
              { header: "Estado", accessor: "status", render: (r) => badge(r.status, PSTATUS_STYLES, PSTATUS_LABELS) },
              { header: "Monto", accessor: "amount", render: (r) => (r.amount > 0 ? money(r.amount) : "—") },
              { header: "Motivo", accessor: "reason" },
              { header: "Notificada", accessor: "acknowledged", render: (r) => siNo(r.acknowledged) }
            ]}
            data={pen.rows || []}
            emptyMessage="Sin sanciones registradas."
          />
        </div>
      </div>

      {/* Ventas externas */}
      <div className="fx-card">
        <h3 className="text-sm font-semibold text-fx-text mb-1 uppercase tracking-wide">
          Ventas externas: el mostrador que no deja rastro
        </h3>
        <p className="text-[11px] text-fx-muted mb-4">
          El módulo existe para que la tienda registre lo que vende fuera del marketplace y el stock cuadre. Nadie lo
          usa, así que el inventario del catálogo se corrige a mano y el margen real queda sin medir.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiCard
            title="Ventas externas registradas"
            value={ext.records}
            format="number"
            tooltip="Filas en external_sales."
            onDrilldown={() =>
              drilldown.open("external_sales", { title: "Ventas externas", filters: { allTime: true } })
            }
          />
          <KpiCard
            title="Tiendas con catálogo"
            value={ext.storesWithCatalog}
            format="number"
            tooltip="Tiendas que podrían registrar su venta de mostrador hoy mismo."
            onDrilldown={() =>
              drilldown.open("onboarding_stores", { title: "Tiendas con catálogo", filters: { allTime: true } })
            }
          />
          <KpiCard
            title="Productos con stock"
            value={ext.productsWithStock}
            format="number"
            suffix={` / ${num(ext.products)}`}
            tooltip="Productos con al menos una variación con stock: el inventario que una venta externa debería descontar."
            onDrilldown={() => drilldown.open("products", { title: "Catálogo publicado", filters: { allTime: true } })}
          />
          <KpiCard
            title="Ajustes manuales de stock"
            value={ext.manualStockMovements}
            format="number"
            tooltip="Movimientos de tipo adjustment/restock: la huella indirecta de la venta que este módulo debía capturar."
            onDrilldown={() =>
              drilldown.open("stock_movements", {
                title: "Ajustes manuales de inventario",
                filters: { allTime: true, is_manual: true }
              })
            }
          />
        </div>
        {ext.records === 0 && (
          <p className="text-[11px] text-fx-muted mt-4 border-t border-white/10 pt-3">
            Sin datos aún. La cadena está completa (<span className="font-mono">Store/ProductStats.jsx:131</span> →{" "}
            <span className="font-mono">POST /api/product-stats/:id/external-sale</span>), pero{" "}
            {num(ext.storesWithCatalog)} tiendas con catálogo activo no han registrado una sola venta de mostrador.
          </p>
        )}
      </div>

      {/* Suscripciones */}
      <div className="fx-card">
        <h3 className="text-sm font-semibold text-fx-text mb-1 uppercase tracking-wide">
          Suscripciones: la demanda recurrente que ya existe
        </h3>
        <p className="text-[11px] text-fx-muted mb-4">
          La tabla está en cero porque la ruta no está montada, no porque no haya recompra. Estos son los pares
          cliente+producto que ya se compran solos, con su cadencia observada.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          <KpiCard
            title="Suscripciones activas"
            value={subs.active}
            format="number"
            tooltip="Filas con status ACTIVE en product_subscriptions. Imposible que crezca mientras inventoryRoutes no se monte."
            onDrilldown={() =>
              drilldown.open("product_subscriptions", {
                title: "Suscripciones de reposición",
                filters: { allTime: true }
              })
            }
          />
          <KpiCard
            title="Pares con recompra"
            value={subs.recurringPairs}
            format="number"
            tooltip="Combinaciones cliente+producto compradas en 2 o más pedidos distintos."
            onDrilldown={() =>
              drilldown.open("recurring_purchases", {
                title: "Compras repetidas (potencial de suscripción)",
                filters: { allTime: true, repeated: true }
              })
            }
          />
          <KpiCard
            title="Clientes recurrentes"
            value={subs.recurringUsers}
            format="number"
            tooltip="Usuarios distintos detrás de esos pares."
            onDrilldown={() =>
              drilldown.open("recurring_purchases", {
                title: "Clientes con recompra",
                filters: { allTime: true, repeated: true }
              })
            }
          />
          <KpiCard
            title="Cadencia media"
            value={subs.avgCadenceDays === null ? 0 : subs.avgCadenceDays}
            format="number"
            suffix=" días"
            tooltip="Días promedio entre recompras del mismo par. Es la frecuencia que una suscripción propondría."
            onDrilldown={() =>
              drilldown.open("recurring_purchases", {
                title: "Cadencia de recompra",
                filters: { allTime: true, repeated: true }
              })
            }
          />
        </div>
        <DataTable
          title="Pares cliente + producto con recompra"
          subtitle="Cada fila es una suscripción que el sistema podría proponer hoy si el módulo estuviera conectado."
          searchPlaceholder="Buscar cliente o producto…"
          columns={[
            { header: "Cliente", accessor: "userName" },
            { header: "Rol", accessor: "userRole", render: (r) => badge(r.userRole, ROLE_STYLES) },
            { header: "Producto", accessor: "productName", render: (r) => r.productName || "(producto eliminado)" },
            { header: "Pedidos", accessor: "times", render: (r) => num(r.times) },
            { header: "Unidades", accessor: "units", render: (r) => num(r.units) },
            { header: "Cadencia", accessor: "cadenceDays", render: (r) => dias(r.cadenceDays) },
            { header: "Últ. compra", accessor: "lastAt", render: (r) => momento(r.lastAt) }
          ]}
          data={subs.rows || []}
          emptyMessage="Ningún cliente ha comprado el mismo producto dos veces."
        />
      </div>

      {/* Consultorio y preferencias */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="fx-card">
          <h3 className="text-sm font-semibold text-fx-text mb-1 uppercase tracking-wide">Inventario de consultorio</h3>
          <p className="text-[11px] text-fx-muted mb-4">
            El portal <span className="font-mono">/clinic</span> está construido y enrutado, pero cada guardado devuelve
            404. Ningún consultorio puede declarar su stock.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <KpiCard
              title="Insumos declarados"
              value={clinic.records}
              format="number"
              tooltip="Filas en clinic_inventory_alerts."
              onDrilldown={() =>
                drilldown.open("clinic_inventory_alerts", {
                  title: "Inventario de consultorio",
                  filters: { allTime: true }
                })
              }
            />
            <KpiCard
              title="Clientes que compran"
              value={clinic.buyerUsers}
              format="number"
              suffix={` / ${num(clinic.allUsers)}`}
              tooltip="Usuarios con al menos un pedido: el universo que usaría el módulo si funcionara."
              onDrilldown={() => drilldown.open("users", { title: "Usuarios registrados", filters: { allTime: true } })}
            />
          </div>
        </div>

        <div className="fx-card">
          <h3 className="text-sm font-semibold text-fx-text mb-1 uppercase tracking-wide">
            Preferencias de notificación
          </h3>
          <p className="text-[11px] text-fx-muted mb-4">
            Cadena completa desde el 18-ago-2026. Quien no entre a la pestaña sigue sobre el default implícito{" "}
            <span className="font-mono">todo activado</span>.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <KpiCard
              title="Usuarios con preferencias"
              value={prefs.configured}
              format="number"
              suffix={` / ${num(prefs.totalUsers)}`}
              tooltip="Filas en notification_preferences."
              onDrilldown={() =>
                drilldown.open("notification_preferences", {
                  title: "Preferencias de notificación",
                  filters: { allTime: true }
                })
              }
            />
            <KpiCard
              title="Notificaciones enviadas"
              value={prefs.notificationsSent}
              format="number"
              tooltip="Las de usuarios sin fila salen por el default implícito de notificationService.js:71 (todo activado)."
              onDrilldown={() =>
                drilldown.open("notifications", { title: "Notificaciones enviadas", filters: { allTime: true } })
              }
            />
          </div>
        </div>
      </div>

      <DrilldownModal {...drilldown.props} period={period} />
    </div>
  );
}
