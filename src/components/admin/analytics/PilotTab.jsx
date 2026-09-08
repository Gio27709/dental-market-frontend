import { useState } from "react";
import PropTypes from "prop-types";
import { getPilotAnalyticsAPI } from "../../../services/api";
import useAnalyticsTabData from "../../../hooks/useAnalyticsTabData";
import KpiCard from "./KpiCard";
import ChartCard from "./ChartCard";
import DataTable from "./DataTable";
import SkeletonLoader from "./SkeletonLoader";
import DateRangePicker from "./DateRangePicker";
import AnalyticsErrorPanel from "./AnalyticsErrorPanel";
import EmptyState from "./EmptyState";

// Pestaña «Piloto»: solo pedidos con dinero real (sin tiendas marcadas como prueba) y, por
// defecto, solo tiendas de Táchira. Responde si el circuito completo funciona con clientes
// de verdad: comprobante → aprobado → enviado → entregado → escrow liberado → retiro pagado.

const num = (v) => Number(v || 0).toLocaleString("en-US");
const usd = (v) => "$" + Number(v || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fecha = (v) => (v ? new Date(v).toLocaleDateString("es-VE", { day: "2-digit", month: "short", year: "numeric" }) : "—");

const STAGE_STYLES = {
  "escrow liberado": "bg-fx-pos/15 text-fx-pos border-fx-pos/30",
  entregado: "bg-fx-pos/10 text-fx-pos border-fx-pos/20",
  enviado: "bg-fx-accent/15 text-fx-accent border-fx-accent/30",
  aprobado: "bg-fx-accent/10 text-fx-accent border-fx-accent/20",
  comprobante: "bg-fx-warn/15 text-fx-warn border-fx-warn/30",
  creado: "bg-gray-500/15 text-fx-muted border-gray-500/30",
  "pago rechazado": "bg-fx-neg/15 text-fx-neg border-fx-neg/30",
  cancelado: "bg-fx-neg/15 text-fx-neg border-fx-neg/30",
  reembolsado: "bg-fx-neg/15 text-fx-neg border-fx-neg/30",
};

const stageBadge = (stage) => (
  <span
    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase border whitespace-nowrap ${
      STAGE_STYLES[stage] || "bg-gray-500/15 text-fx-muted border-gray-500/30"
    }`}
  >
    {stage}
  </span>
);

function FunnelBars({ steps }) {
  const max = Math.max(1, ...steps.map((s) => s.count));
  return (
    <ol className="space-y-2.5">
      {steps.map((s, i) => {
        const prev = i > 0 ? steps[i - 1].count : null;
        const conv = prev ? Math.round((s.count / prev) * 100) : null;
        return (
          <li key={s.key} className="grid grid-cols-[150px_1fr_auto] items-center gap-3 text-sm">
            <span className="text-fx-muted truncate">{s.label}</span>
            <div className="h-6 rounded-md bg-gray-500/10 overflow-hidden">
              <div
                className="h-full rounded-md bg-fx-accent/70 transition-all"
                style={{ width: `${Math.max(2, (s.count / max) * 100)}%` }}
              />
            </div>
            <span className="tabular-nums font-semibold w-24 text-right">
              {num(s.count)}
              {conv !== null && <span className="ml-1 text-[11px] font-normal text-fx-faint">({conv}%)</span>}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
FunnelBars.propTypes = {
  steps: PropTypes.arrayOf(PropTypes.shape({ key: PropTypes.string, label: PropTypes.string, count: PropTypes.number })).isRequired,
};

export default function PilotTab() {
  const [period, setPeriod] = useState("90d");
  const [scope, setScope] = useState("pilot");
  const fetcher = scope === "all" ? fetchAll : getPilotAnalyticsAPI;
  const { data, loading, error, reload } = useAnalyticsTabData(fetcher, period);

  if (loading && !data) return <SkeletonLoader type="kpiRow" />;
  if (error) return <AnalyticsErrorPanel title="Error al cargar el Piloto" message={error} onRetry={() => reload(true)} />;

  const k = data?.kpis || {};
  const goal = data?.goal || { min: 10, max: 20, completed: 0, progressPct: 0 };
  const inc = data?.incidents || {};
  const noRealStores = (data?.stores || []).length === 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Piloto {data?.scope === "all" ? "(todos los estados)" : `en ${data?.pilotState || "Táchira"}`}</h2>
          <p className="text-sm text-fx-muted">
            Solo tiendas reales (sin la marca «prueba») y pedidos con dinero real. Meta: {goal.min}–{goal.max} pedidos completos y 0 incidentes de dinero.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-0.5 p-0.5 rounded-lg bg-gray-500/10">
            {[
              { key: "pilot", label: "Táchira" },
              { key: "all", label: "Todos los estados" },
            ].map((o) => (
              <button
                key={o.key}
                onClick={() => setScope(o.key)}
                className={`px-3 py-1.5 rounded-[7px] text-[13px] font-medium transition-all ${
                  scope === o.key ? "bg-fx-raised text-fx-text shadow-sm" : "text-fx-muted hover:text-fx-text"
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
          <DateRangePicker selectedPeriod={period} onPeriodChange={setPeriod} />
        </div>
      </div>

      {noRealStores ? (
        <EmptyState message="Todavía no hay tiendas reales en este ámbito. Cuando el owner quite la marca «prueba» a una tienda (Tiendas → menú de la fila), sus pedidos aparecerán aquí." />
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
            <KpiCard title="Tiendas reales" value={num(k.realStores)} tooltip={`${num(k.storesWithCatalog)} con catálogo activo`} />
            <KpiCard title="Pedidos reales" value={num(k.realOrders)} tooltip="Pedidos creados en el período a tiendas reales" />
            <KpiCard title="Pedidos completos" value={`${num(k.completedOrders)} / ${goal.min}`} tooltip="Entregados y con el escrow liberado. La meta mínima es 10." />
            <KpiCard title="Ventas reales" value={usd(k.gmvUsd)} tooltip="Suma de pedidos con pago aprobado" />
            <KpiCard title="Retiros pagados" value={`${num(k.payoutsPaid)} · ${usd(k.payoutsPaidUsd)}`} tooltip={`${num(k.payoutsOpen)} abiertos por ${usd(k.payoutsOpenUsd)}`} />
            <KpiCard title="Incidentes de dinero" value={num(k.incidents)} tooltip="Reversiones de escrow, reembolsos y retiros rechazados. La meta es 0." />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <ChartCard title="Embudo del pedido" subtitle="Cada paso, respecto al anterior">
                <FunnelBars steps={data?.funnel || []} />
                <p className="mt-3 text-xs text-fx-faint">
                  Fuera del embudo: {num(data?.dropouts?.rejected)} con pago rechazado · {num(data?.dropouts?.cancelled)} cancelados.
                </p>
              </ChartCard>
            </div>

            <ChartCard title="Meta del piloto" subtitle={`${goal.completed} de ${goal.min} pedidos completos`}>
              <div className="h-3 rounded-full bg-gray-500/10 overflow-hidden">
                <div className={`h-full rounded-full ${goal.progressPct >= 100 ? "bg-fx-pos" : "bg-fx-accent"}`} style={{ width: `${goal.progressPct}%` }} />
              </div>
              <p className="mt-2 text-sm text-fx-muted">{goal.progressPct}% de la meta mínima</p>
              <ul className="mt-4 space-y-1.5 text-sm">
                <li className="flex justify-between"><span className="text-fx-muted">Reversiones de escrow</span><span className={inc.escrowReversals ? "text-fx-neg font-semibold" : ""}>{num(inc.escrowReversals)}</span></li>
                <li className="flex justify-between"><span className="text-fx-muted">Pedidos reembolsados</span><span className={inc.refundedOrders ? "text-fx-neg font-semibold" : ""}>{num(inc.refundedOrders)}</span></li>
                <li className="flex justify-between"><span className="text-fx-muted">Reembolsos abiertos</span><span className={inc.openRefunds ? "text-fx-warn font-semibold" : ""}>{num(inc.openRefunds)}</span></li>
                <li className="flex justify-between"><span className="text-fx-muted">Retiros rechazados</span><span className={inc.payoutsRejected ? "text-fx-neg font-semibold" : ""}>{num(inc.payoutsRejected)}</span></li>
              </ul>
            </ChartCard>
          </div>

          <DataTable
            title="Pedidos reales"
            subtitle="Los 50 más recientes del período, con la etapa en la que están"
            columns={[
              { header: "Pedido", accessor: "shortId", render: (r) => <span className="font-mono text-xs">#{r.shortId}</span> },
              { header: "Fecha", accessor: "createdAt", render: (r) => fecha(r.createdAt) },
              { header: "Tienda", accessor: "storeName" },
              { header: "Comprador", accessor: "buyerName", render: (r) => r.buyerName || "—" },
              { header: "Total", accessor: "totalUsd", render: (r) => usd(r.totalUsd) },
              { header: "Etapa", accessor: "stage", render: (r) => stageBadge(r.stage) },
            ]}
            data={data?.orders || []}
            searchPlaceholder="Buscar por tienda, comprador o etapa…"
            emptyMessage="Sin pedidos reales en el período."
          />

          <DataTable
            title="Tiendas reales"
            subtitle="Las que cuentan para el piloto. Pedidos del período y de toda su vida."
            columns={[
              { header: "Tienda", accessor: "name", render: (r) => (
                <span>
                  {r.name}
                  {r.isSuspended && <span className="ml-2 text-[10px] uppercase font-semibold text-fx-neg">suspendida</span>}
                </span>
              ) },
              { header: "Estado", accessor: "state", render: (r) => r.state || "—" },
              { header: "Productos activos", accessor: "activeProducts", render: (r) => num(r.activeProducts) },
              { header: "Pedidos (período)", accessor: "ordersPeriod", render: (r) => num(r.ordersPeriod) },
              { header: "Pedidos (total)", accessor: "ordersAllTime", render: (r) => num(r.ordersAllTime) },
              { header: "Último pedido", accessor: "lastOrderAt", render: (r) => fecha(r.lastOrderAt) },
            ]}
            data={data?.stores || []}
            searchPlaceholder="Buscar tienda…"
            emptyMessage="Sin tiendas reales."
          />
        </>
      )}
    </div>
  );
}

// Referencias estables para useAnalyticsTabData (compara el fetcher por identidad).
function fetchAll(params) {
  return getPilotAnalyticsAPI({ ...params, scope: "all" });
}
