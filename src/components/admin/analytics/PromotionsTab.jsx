import { useState } from "react";
import { getPromotionsAnalyticsAPI } from "../../../services/api";
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
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend
} from "recharts";

const num = (v) => Number(v || 0).toLocaleString("en-US");
const usd = (v) => "$" + Number(v || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fecha = (v) => (v ? new Date(v).toLocaleDateString("es-VE") : "—");

const APPROVAL_STYLES = {
  approved: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  rejected: "bg-rose-500/15 text-rose-300 border-rose-500/30",
  pending: "bg-amber-500/15 text-amber-300 border-amber-500/30"
};
const APPROVAL_LABELS = { approved: "Aprobado", rejected: "Rechazado", pending: "Pendiente" };

const approvalBadge = (status) => (
  <span
    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase border whitespace-nowrap ${
      APPROVAL_STYLES[status] || "bg-gray-500/15 text-fx-muted border-gray-500/30"
    }`}
  >
    {APPROVAL_LABELS[status] || status || "—"}
  </span>
);

// El stock se guarda con etiquetas en español, no con códigos. Cualquier cosa que no
// sea 'Activo' significa que el producto no se puede comprar aunque la ficha exista.
const stockBadge = (estado) => {
  const ok = estado === "Activo";
  return (
    <span
      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase border whitespace-nowrap ${
        ok
          ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
          : "bg-rose-500/15 text-rose-300 border-rose-500/30"
      }`}
    >
      {estado || "—"}
    </span>
  );
};

const siNo = (v, tonoSi = "text-emerald-400", tonoNo = "text-gray-500") =>
  v ? <span className={`font-bold ${tonoSi}`}>Sí</span> : <span className={tonoNo}>No</span>;

export default function PromotionsTab() {
  const [period, setPeriod] = useState("90d");
  const [chartMode, setChartMode] = useState("bar");
  const { data, loading, error, reload } = useAnalyticsTabData(getPromotionsAnalyticsAPI, period);
  const drilldown = useDrilldown();

  if (loading && !data) return <SkeletonLoader type="kpiRow" />;
  if (error) {
    return <AnalyticsErrorPanel title="Error al cargar Promociones" message={error} onRetry={() => reload(true)} />;
  }

  const cup = data?.coupons || {};
  const ck = cup.kpis || {};
  const cfg = cup.config || {};
  const sd = data?.storeDiscounts || {};
  const dk = sd.kpis || {};
  const pr = data?.promotions || {};
  const pk = pr.kpis || {};
  const pi = data?.pricingIntegrity || {};

  const promotedUnbuyable = (pr.promotedProducts || []).filter((p) => !p.isBuyable).length;

  const hasIntegrityIssues =
    (ck.orphanedCodesCount || 0) > 0 ||
    (dk.resolvableUnapproved || 0) > 0 ||
    (dk.rejectedButActive || 0) > 0 ||
    (dk.zombies || 0) > 0 ||
    (pk.zombies || 0) > 0 ||
    (pk.neverEnding || 0) > 0 ||
    (pi.fakeCompareAt || 0) > 0 ||
    promotedUnbuyable > 0;

  return (
    <div className="space-y-6">
      {/* Controles */}
      <div className="relative z-30 flex flex-col md:flex-row md:items-center justify-between gap-4 fx-card-sm">
        <div>
          <h2 className="text-sm font-bold text-fx-text">Promociones, Descuentos y Cupones</h2>
          <p className="text-[11px] text-fx-muted">
            No lo que el panel promete, sino lo que el resolvedor de precios realmente aplica
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <DateRangePicker selectedPeriod={period} onPeriodChange={setPeriod} />
          <FreshnessBadge lastUpdated={data?.serverTimestamp} onRefresh={() => reload(true)} isLoading={loading} />
        </div>
      </div>

      {/* Alertas de integridad promocional */}
      {hasIntegrityIssues && (
        <div className="bg-rose-500/10 border border-rose-500/40 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-rose-200 mb-2 uppercase tracking-wide">
            Integridad de Promociones y Precios
          </h3>
          <ul className="space-y-1.5 text-xs text-fx-muted">
            {(ck.orphanedCodesCount || 0) > 0 && (
              <li>
                <span className="font-semibold text-rose-300">
                  {num(ck.orphanedCodesCount)} código{ck.orphanedCodesCount === 1 ? "" : "s"} de cupón
                </span>{" "}
                con redenciones ya no existe. El código válido se sintetiza en checkout como{" "}
                <span className="font-mono text-fx-accent">{cfg.activeCode}</span>; cualquiera que guarde uno anterior
                recibe &quot;no válido o ha expirado&quot; sin que nadie lo haya dado de baja.
              </li>
            )}
            {(dk.resolvableUnapproved || 0) > 0 && (
              <li>
                <span className="font-semibold text-rose-300">{num(dk.resolvableUnapproved)} descuentos</span> que
                moderación no aprobó son aplicables hoy de todos modos:{" "}
                <span className="font-mono">getApplicableDiscount</span> no filtra{" "}
                <span className="font-mono">approval_status</span>, así que catálogo, carrito y checkout los usan.
              </li>
            )}
            {(dk.rejectedButActive || 0) > 0 && (dk.resolvableUnapproved || 0) === 0 && (
              <li>
                <span className="font-semibold text-amber-300">{num(dk.rejectedButActive)} descuentos rechazados</span>{" "}
                siguen marcados como activos. Hoy solo los salva su fecha vencida; si alguien la extiende, se aplican.
              </li>
            )}
            {(dk.zombies || 0) > 0 && (
              <li>
                <span className="font-semibold text-rose-300">{num(dk.zombies)} descuentos vencidos</span> siguen
                declarándose activos. Nada apaga <span className="font-mono">is_active</span> al expirar, así que la
                tienda los ve vigentes en su panel.
              </li>
            )}
            {(pk.zombies || 0) > 0 && (
              <li>
                <span className="font-semibold text-rose-300">{num(pk.zombies)} promociones vencidas</span> siguen
                activas en la vitrina.
              </li>
            )}
            {(pk.neverEnding || 0) > 0 && (
              <li>
                <span className="font-semibold text-amber-300">{num(pk.neverEnding)} promociones sin fecha de fin</span>{" "}
                corren indefinidamente. Una oferta que no termina deja de ser una oferta.
              </li>
            )}
            {promotedUnbuyable > 0 && (
              <li>
                <span className="font-semibold text-rose-300">{num(promotedUnbuyable)} productos promocionados</span> no
                se pueden comprar (sin stock, en borrador o inactivos). Ocupan el mejor espacio de la portada para llevar
                al comprador a una pared.
              </li>
            )}
            {(pi.fakeCompareAt || 0) > 0 && (
              <li>
                <span className="font-semibold text-amber-300">{num(pi.fakeCompareAt)} productos</span> tienen un
                &quot;precio antes&quot; que no supera al precio actual: la tachadura que sostiene visualmente la oferta
                es decorativa.
              </li>
            )}
          </ul>
        </div>
      )}

      {/* ─────────────────────────── Cupones ─────────────────────────── */}
      <div className="fx-card">
        <h3 className="text-sm font-semibold text-fx-text mb-1 uppercase tracking-wide">Cupones</h3>
        <p className="text-[11px] text-fx-muted mb-4">
          El cupón no es una fila de base de datos sino una fórmula que se arma en el momento del pago
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
          <KpiCard
            title="Redenciones"
            value={ck.redemptions}
            format="number"
            suffix={` · ${num(ck.distinctUsers)} usuarios`}
            tooltip="Pedidos del período que llegaron con un código aplicado. No hay tabla de cupones: la única huella es el texto guardado en el pedido."
            onDrilldown={() =>
              drilldown.open("orders", { title: "Pedidos con cupón", filters: { has_coupon: true } })
            }
          />
          <KpiCard
            title="Total Cedido"
            value={ck.cededUsd}
            format="currency"
            tooltip="Dinero que la plataforma dejó de cobrar por el cupón, sumado directamente de los pedidos."
          />
          <KpiCard
            title="Descuento Efectivo"
            value={ck.effectiveDiscountPct}
            format="percent"
            suffix={` · nominal hoy ${ck.nominalDiscountPct}%`}
            tooltip="Lo cedido sobre lo que el pedido habría costado sin cupón. Queda por debajo del nominal porque en checkout el descuento se aplica solo al ítem más caro, no a la factura completa."
          />
          <KpiCard
            title="Concentración"
            value={ck.topUserSharePct}
            format="percent"
            suffix={` · ${num(ck.topUserRedemptions)} de ${num(ck.redemptions)}`}
            tooltip="Porcentaje de todas las redenciones que se llevó un solo usuario. No existe tope por persona en ninguna parte del código: esta cifra es la única defensa."
          />
          <KpiCard
            title="Facturado con Cupón"
            value={ck.grossGmvWithCoupon}
            format="currency"
            suffix=" antes de descuento"
            tooltip="Lo que esos pedidos habrían costado sin cupón. El total guardado en el pedido ya viene descontado, así que este es el denominador honesto."
          />
          <KpiCard
            title="Ticket con Cupón"
            value={ck.avgTicketWith}
            format="currency"
            suffix={` vs ${usd(ck.avgTicketWithout)} sin`}
            tooltip="Si el ticket con cupón no supera al de sin cupón, el descuento no está comprando compras más grandes: está regalando margen sobre compras que ya iban a ocurrir."
          />
          <KpiCard
            title="Sin Suscripción"
            value={ck.nonSubscriberRedemptions}
            format="number"
            suffix={` de ${num(ck.redemptions)}`}
            tooltip="Redenciones de usuarios que no figuran en newsletter_subscribers. El cupón se llama 'de boletín' pero checkout nunca comprueba la suscripción."
          />
          <KpiCard
            title="Códigos Huérfanos"
            value={ck.orphanedCodesCount}
            format="number"
            tooltip="Códigos que se usaron alguna vez y que hoy checkout ya no reconoce, porque el porcentaje del ajuste cambió y con él el código sintetizado."
          />
        </div>

        {/* Anatomía del cupón */}
        <div className="mt-5 bg-fx-panel border border-fx-line rounded-2xl p-4">
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-fx-accent">
              Código activo ahora mismo
            </span>
            <span className="px-3 py-1 rounded-lg bg-[#c3ff00]/15 border border-fx-accent/40 font-mono text-sm font-semibold text-fx-accent">
              {cfg.activeCode}
            </span>
            <span className="text-[11px] text-fx-muted">
              se arma con <span className="font-mono">{cfg.source}</span>
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 text-[11px]">
            {[
              ["Tabla de catálogo", cfg.hasCatalogTable],
              ["Fecha de vencimiento", cfg.hasExpiry],
              ["Tope de usos total", cfg.hasUsageCap],
              ["Tope por usuario", cfg.hasPerUserCap],
              ["Exige suscripción", cfg.requiresSubscription],
              ["Suscribirse 1 vez", cfg.subscribeLimitOnce]
            ].map(([label, ok]) => (
              <div key={label} className="bg-fx-panel border border-fx-line rounded-xl px-3 py-2">
                <p className="text-fx-muted mb-0.5">{label}</p>
                <p className={`font-semibold ${ok ? "text-emerald-400" : "text-rose-400"}`}>{ok ? "Sí" : "No"}</p>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-fx-muted mt-3">
            Se aplica a <span className="text-amber-300 font-bold">{cfg.appliesTo}</span>, no al total del pedido.
          </p>
        </div>
      </div>

      {/* Códigos usados */}
      <DataTable
        title="Códigos de Cupón Usados"
        subtitle="El propio código lleva escrito el porcentaje con el que se emitió: por eso se puede contrastar cada uno contra su propio nominal"
        columns={[
          {
            header: "Código",
            accessor: "code",
            render: (r) => (
              <div>
                <p className="font-mono font-semibold text-fx-text">{r.code}</p>
                <p className="text-[10px] text-fx-muted">
                  {fecha(r.firstUse)} → {fecha(r.lastUse)}
                </p>
              </div>
            )
          },
          {
            header: "Vigente Hoy",
            accessor: "isCurrentlyValid",
            render: (r) =>
              r.isCurrentlyValid ? (
                <span className="font-bold text-emerald-400">Sí</span>
              ) : (
                <span className="font-bold text-rose-400">No · huérfano</span>
              )
          },
          { header: "Redenciones", accessor: "redemptions", render: (r) => num(r.redemptions) },
          { header: "Usuarios", accessor: "distinctUsers", render: (r) => num(r.distinctUsers) },
          {
            header: "Nominal vs Efectivo",
            accessor: "effectivePct",
            render: (r) => (
              <span>
                <span className="text-fx-muted">{r.issuedPct ?? "—"}%</span>
                <span className="text-gray-600 mx-1">→</span>
                <span className="font-semibold text-fx-accent">{r.effectivePct ?? "—"}%</span>
              </span>
            )
          },
          { header: "Cedido", accessor: "cededUsd", render: (r) => <span className="font-bold text-rose-300">{usd(r.cededUsd)}</span> },
          { header: "Facturado Bruto", accessor: "grossGmvUsd", render: (r) => usd(r.grossGmvUsd) }
        ]}
        data={cup.codes || []}
        emptyMessage="Todavía nadie ha usado un cupón."
      />

      {/* Redenciones por día */}
      <ChartCard
        title="Redenciones por Día"
        subtitle="Cuándo se usa el cupón y cuánto margen se cede en cada jornada"
        onTypeChange={setChartMode}
      >
        <ResponsiveContainer width="100%" height={260}>
          {chartMode === "line" ? (
            <AreaChart data={cup.daily || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff12" />
              <XAxis dataKey="day" stroke="#7b6c99" fontSize={11} tickFormatter={fecha} />
              <YAxis stroke="#7b6c99" fontSize={11} allowDecimals={false} />
              <Tooltip
                labelFormatter={fecha}
                contentStyle={{ backgroundColor: "#0d0418", border: "1px solid #ffffff29", borderRadius: "10px", color: "#f4f1f8", fontSize: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.55)" }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Area type="monotone" dataKey="cededUsd" name="Cedido (USD)" stroke="#a855f7" fill="rgba(168,85,247,0.25)" strokeWidth={2} />
            </AreaChart>
          ) : (
            <BarChart data={cup.daily || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff12" />
              <XAxis dataKey="day" stroke="#7b6c99" fontSize={11} tickFormatter={fecha} />
              <YAxis stroke="#7b6c99" fontSize={11} allowDecimals={false} />
              <Tooltip
                labelFormatter={fecha}
                contentStyle={{ backgroundColor: "#0d0418", border: "1px solid #ffffff29", borderRadius: "10px", color: "#f4f1f8", fontSize: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.55)" }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="redemptions" name="Redenciones" fill="#c3ff00" radius={[6, 6, 0, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </ChartCard>

      {/* Concentración por usuario */}
      <DataTable
        title="Quién se Está Llevando el Cupón"
        subtitle="No hay tope por persona en el código; mirar esta tabla es la única forma de notarlo"
        searchPlaceholder="Buscar usuario o correo..."
        columns={[
          {
            header: "Usuario",
            accessor: "fullName",
            render: (r) => (
              <div>
                <p className="font-bold text-fx-text">{r.fullName}</p>
                <p className="text-[10px] text-fx-muted font-mono">{r.email || "sin correo"}</p>
              </div>
            )
          },
          {
            header: "Suscrito",
            accessor: "isSubscriber",
            render: (r) =>
              r.isSubscriber ? (
                <span className="font-bold text-emerald-400">Sí</span>
              ) : (
                <span className="font-bold text-amber-400">No</span>
              )
          },
          {
            header: "Redenciones",
            accessor: "redemptions",
            render: (r) => {
              const total = ck.redemptions || 0;
              const share = total > 0 ? (r.redemptions / total) * 100 : 0;
              return (
                <span className={share >= 30 ? "font-semibold text-rose-400" : "font-bold text-fx-text"}>
                  {num(r.redemptions)}
                  <span className="text-[10px] font-normal text-fx-muted"> · {share.toFixed(0)}%</span>
                </span>
              );
            }
          },
          { header: "Cedido", accessor: "cededUsd", render: (r) => <span className="font-bold text-rose-300">{usd(r.cededUsd)}</span> },
          { header: "Facturado", accessor: "gmvUsd", render: (r) => usd(r.gmvUsd) },
          {
            header: "Ventana de Uso",
            accessor: "lastUse",
            render: (r) => (
              <span className="text-[11px] text-fx-muted">
                {fecha(r.firstUse)} → {fecha(r.lastUse)}
              </span>
            )
          }
        ]}
        data={cup.byUser || []}
        emptyMessage="Nadie ha redimido cupones en este período."
      />

      {/* ──────────────────── Descuentos de tienda ──────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
        <KpiCard
          title="Descuentos de Tienda"
          value={dk.total}
          format="number"
          tooltip="Total de reglas de descuento creadas por las tiendas, en cualquier estado."
          onDrilldown={() =>
            drilldown.open("store_discounts", { title: "Todos los descuentos de tienda", filters: { allTime: true } })
          }
        />
        <KpiCard
          title="Aplicables Hoy"
          value={dk.resolvableToday}
          format="number"
          tooltip="Reglas que el resolvedor de precios usaría en este momento: activas y dentro de su ventana de fechas. Es lo que el comprador vería, no lo que el panel declara."
          onDrilldown={() =>
            drilldown.open("store_discounts", {
              title: "Descuentos aplicables hoy",
              filters: { resolvable_today: true, allTime: true }
            })
          }
        />
        <KpiCard
          title="Aplicables sin Aprobar"
          value={dk.resolvableUnapproved}
          format="number"
          tooltip="Reglas que moderación no aprobó y que aun así se aplicarían: getApplicableDiscount no filtra approval_status, a diferencia de promotionController que sí lo hace."
          onDrilldown={() =>
            drilldown.open("store_discounts", {
              title: "Descuentos aplicables que moderación no aprobó",
              filters: { resolvable_unapproved: true, allTime: true }
            })
          }
        />
        <KpiCard
          title="Vencidos y Activos"
          value={dk.zombies}
          format="number"
          tooltip="Reglas que ya terminaron pero siguen con is_active en verdadero. Nada las apaga al expirar, así que la tienda las cree vigentes."
          onDrilldown={() =>
            drilldown.open("store_discounts", {
              title: "Descuentos vencidos que siguen declarándose activos",
              filters: { is_zombie: true, allTime: true }
            })
          }
        />
        <KpiCard
          title="Rechazados y Activos"
          value={dk.rejectedButActive}
          format="number"
          tooltip="Moderación dijo que no y la bandera de activo quedó encendida. Si alguien extiende la fecha, se aplican sin volver a pasar por revisión."
          onDrilldown={() =>
            drilldown.open("store_discounts", {
              title: "Descuentos rechazados con la bandera de activo encendida",
              filters: { approval_status: "rejected", is_active: true, allTime: true }
            })
          }
        />
        <KpiCard
          title="Esperando Moderación"
          value={dk.pendingModeration}
          format="number"
          tooltip="Reglas sin decidir. Cada una es una tienda esperando poder ofertar."
          onDrilldown={() =>
            drilldown.open("store_discounts", {
              title: "Descuentos pendientes de moderación",
              filters: { approval_status: "pending", allTime: true }
            })
          }
        />
        <KpiCard
          title="Sin Tope de Usos"
          value={dk.withoutUseCap}
          format="number"
          suffix={` de ${num(dk.total)}`}
          tooltip="Reglas con max_uses vacío: se pueden usar ilimitadamente. El campo existe y prácticamente nadie lo llena."
          onDrilldown={() =>
            drilldown.open("store_discounts", {
              title: "Descuentos sin tope de usos",
              filters: { without_use_cap: true, allTime: true }
            })
          }
        />
        <KpiCard
          title="Sin Fecha de Fin"
          value={dk.withoutEndDate}
          format="number"
          tooltip="Reglas que nunca terminan por sí solas. Alguien tiene que acordarse de apagarlas a mano."
        />
      </div>

      <DataTable
        title="Descuentos de Tienda: Declarado vs Real"
        subtitle="La bandera de activo y el contador de usos son lo que la fila dice de sí misma; aplicable hoy y usos reales son lo que ocurre"
        searchPlaceholder="Buscar descuento o tienda..."
        columns={[
          {
            header: "Descuento",
            accessor: "name",
            render: (r) => (
              <div>
                <p className="font-bold text-fx-text">{r.name || "Sin nombre"}</p>
                <p className="text-[10px] text-fx-muted">{r.storeName}</p>
              </div>
            )
          },
          {
            header: "Valor",
            accessor: "discountValue",
            render: (r) => (
              <span className="font-bold text-fx-accent">
                {r.discountType === "percentage" ? `${r.discountValue}%` : usd(r.discountValue)}
              </span>
            )
          },
          { header: "Moderación", accessor: "approvalStatus", render: (r) => approvalBadge(r.approvalStatus) },
          {
            header: "Declarado Activo",
            accessor: "isActive",
            render: (r) => siNo(r.isActive, "text-emerald-400", "text-gray-500")
          },
          {
            header: "Aplicable Hoy",
            accessor: "resolvableToday",
            render: (r) => {
              if (r.resolvableToday && r.approvalStatus !== "approved") {
                return <span className="font-semibold text-rose-400">Sí · sin aprobar</span>;
              }
              if (r.resolvableToday) return <span className="font-bold text-emerald-400">Sí</span>;
              if (r.isZombie) return <span className="font-bold text-amber-400">No · vencido</span>;
              return <span className="text-gray-500">No</span>;
            }
          },
          {
            header: "Vigencia",
            accessor: "endsAt",
            render: (r) => (
              <span className="text-[11px] text-fx-muted">
                {fecha(r.startsAt)} → {r.endsAt ? fecha(r.endsAt) : <span className="text-amber-400">sin fin</span>}
              </span>
            )
          },
          {
            header: "Usos Declarados",
            accessor: "currentUses",
            render: (r) => (
              <span>
                {num(r.currentUses)}
                {r.maxUses ? <span className="text-[10px] text-fx-muted"> / {num(r.maxUses)}</span> : <span className="text-[10px] text-amber-400"> / sin tope</span>}
              </span>
            )
          },
          {
            header: "Usos Reales",
            accessor: "realUses",
            render: (r) => (
              <span className={r.counterDrift ? "font-semibold text-rose-400" : "font-bold text-emerald-400"}>
                {num(r.realUses)}
                {r.counterDrift && <span className="text-[10px] font-normal"> · no coincide</span>}
              </span>
            )
          },
          { header: "Cedido", accessor: "realDiscountUsd", render: (r) => usd(r.realDiscountUsd) }
        ]}
        data={sd.rows || []}
        emptyMessage="Ninguna tienda ha creado descuentos todavía."
      />

      {/* ────────────────────────── Vitrina ────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
        <KpiCard
          title="Promociones"
          value={pk.total}
          format="number"
          tooltip="Campañas de vitrina creadas desde el panel de administración."
          onDrilldown={() => drilldown.open("promotions", { title: "Todas las promociones", filters: { allTime: true } })}
        />
        <KpiCard
          title="Vivas Hoy"
          value={pk.liveToday}
          format="number"
          tooltip="Promociones activas y dentro de su ventana de fechas: lo que un visitante vería ahora mismo."
          onDrilldown={() =>
            drilldown.open("promotions", { title: "Promociones vivas hoy", filters: { live_today: true, allTime: true } })
          }
        />
        <KpiCard
          title="Vencidas y Activas"
          value={pk.zombies}
          format="number"
          tooltip="Terminaron según su fecha pero siguen marcadas como activas."
          onDrilldown={() =>
            drilldown.open("promotions", { title: "Promociones vencidas y activas", filters: { is_zombie: true, allTime: true } })
          }
        />
        <KpiCard
          title="Sin Fecha de Fin"
          value={pk.neverEnding}
          format="number"
          tooltip="Promociones activas que no terminan nunca por sí solas. Una oferta permanente deja de ser una oferta."
          onDrilldown={() =>
            drilldown.open("promotions", { title: "Promociones sin fecha de fin", filters: { never_ending: true, allTime: true } })
          }
        />
        <KpiCard
          title="Productos No Comprables"
          value={promotedUnbuyable}
          format="number"
          tooltip="Productos que las promociones activas están mostrando y que no se pueden comprar: sin stock, en borrador o inactivos."
          onDrilldown={() =>
            drilldown.open("promoted_products", {
              title: "Productos promocionados que no se pueden comprar",
              filters: { not_buyable: true, allTime: true }
            })
          }
        />
        <KpiCard
          title="Vistas Acumuladas"
          value={pk.totalViews}
          format="number"
          tooltip="promotions.views_count es un entero sin fecha ni autor. No hay eventos de promoción en analytics_events, así que no se puede saber cuándo ni quién miró."
        />
        <KpiCard
          title="Precio Antes Falso"
          value={pi.fakeCompareAt}
          format="number"
          suffix={` de ${num(pi.withCompareAt)} con precio antes`}
          tooltip="Productos cuyo compare_at_price no supera al precio actual. La tachadura de la ficha no representa ningún ahorro."
          onDrilldown={() =>
            drilldown.open("promoted_products", {
              title: "Productos promocionados sin descuento real",
              filters: { fake_discount: true, allTime: true }
            })
          }
        />
        <KpiCard
          title="Descuento Real Medio"
          value={pi.avgRealDiscountPct}
          format="percent"
          tooltip="Promedio del ahorro real que sostiene el compare_at_price, contando solo los productos donde el precio anterior sí era mayor."
        />
      </div>

      <DataTable
        title="Promociones de la Vitrina"
        subtitle="Cuántos de los productos que cada promoción muestra se pueden comprar de verdad"
        searchPlaceholder="Buscar promoción..."
        columns={[
          {
            header: "Promoción",
            accessor: "title",
            render: (r) => (
              <div>
                <p className="font-bold text-fx-text">{r.title}</p>
                <p className="text-[10px] text-fx-muted">{r.badgeText || "sin etiqueta"}</p>
              </div>
            )
          },
          {
            header: "Viva Hoy",
            accessor: "liveToday",
            render: (r) => {
              if (r.liveToday) return <span className="font-bold text-emerald-400">Sí</span>;
              if (r.isZombie) return <span className="font-bold text-rose-400">No · vencida y activa</span>;
              return <span className="text-gray-500">No</span>;
            }
          },
          {
            header: "Vigencia",
            accessor: "endsAt",
            render: (r) => (
              <span className="text-[11px] text-fx-muted">
                {fecha(r.startsAt)} → {r.endsAt ? fecha(r.endsAt) : <span className="text-amber-400">sin fin</span>}
              </span>
            )
          },
          {
            header: "Productos Comprables",
            accessor: "buyableProducts",
            render: (r) => {
              const falta = (r.targetedProducts || 0) - (r.buyableProducts || 0);
              return (
                <span className={falta > 0 ? "font-semibold text-rose-400" : "font-bold text-emerald-400"}>
                  {num(r.buyableProducts)} / {num(r.targetedProducts)}
                  {falta > 0 && <span className="text-[10px] font-normal"> · {falta} en pared</span>}
                </span>
              );
            }
          },
          {
            header: "Sin Descuento Real",
            accessor: "fakeDiscountProducts",
            render: (r) =>
              Number(r.fakeDiscountProducts) > 0 ? (
                <span className="font-bold text-amber-400">{num(r.fakeDiscountProducts)}</span>
              ) : (
                <span className="text-emerald-400">0</span>
              )
          },
          { header: "Destacada", accessor: "isFeatured", render: (r) => siNo(r.isFeatured) },
          { header: "Vistas", accessor: "viewsCount", render: (r) => num(r.viewsCount) }
        ]}
        data={pr.rows || []}
        emptyMessage="No hay promociones creadas."
      />

      <DataTable
        title="Producto a Producto de la Vitrina"
        subtitle="El descuento real se calcula desde el precio anterior; si no supera al actual, el badge promete un ahorro que la ficha no tiene"
        searchPlaceholder="Buscar producto o promoción..."
        columns={[
          {
            header: "Producto",
            accessor: "productName",
            render: (r) => (
              <div>
                <p className="font-bold text-fx-text">{r.productName}</p>
                <p className="text-[10px] text-fx-muted">{r.promotionTitle}</p>
              </div>
            )
          },
          {
            header: "Precio",
            accessor: "price",
            render: (r) => (
              <span>
                <span className="font-bold text-fx-text">{usd(r.price)}</span>
                {r.compareAtPrice ? (
                  <span className="text-[10px] text-gray-500 line-through ml-1">{usd(r.compareAtPrice)}</span>
                ) : null}
              </span>
            )
          },
          {
            header: "Descuento Real",
            accessor: "realDiscountPct",
            render: (r) =>
              Number(r.realDiscountPct) > 0 ? (
                <span className="font-semibold text-fx-accent">{r.realDiscountPct}%</span>
              ) : (
                <span className="font-bold text-rose-400">0% · sin ahorro</span>
              )
          },
          { header: "Stock", accessor: "stockStatus", render: (r) => stockBadge(r.stockStatus) },
          {
            header: "Comprable",
            accessor: "isBuyable",
            render: (r) =>
              r.isBuyable ? (
                <span className="font-bold text-emerald-400">Sí</span>
              ) : (
                <span className="font-semibold text-rose-400">No</span>
              )
          }
        ]}
        data={pr.promotedProducts || []}
        emptyMessage="Ninguna promoción activa apunta a productos."
      />

      <DrilldownModal {...drilldown.props} period={period} />
    </div>
  );
}
