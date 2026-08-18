import { useState } from "react";
import { getTreasuryAnalyticsAPI } from "../../../services/api";
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
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend, Cell
} from "recharts";

const money = (v) => {
  const n = parseFloat(v || 0);
  const s = Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${n < 0 ? "-" : ""}$${s}`;
};
const num = (v) => Number(v || 0).toLocaleString("en-US");

const TYPE_LABELS = {
  sale: "Venta acreditada",
  payout: "Retiro",
  refund: "Reembolso",
  fine_deduction: "Multa descontada"
};

// Verde entra, rojo sale, ámbar son ajustes punitivos.
const TYPE_COLORS = {
  sale: "#c3ff00",
  refund: "#38bdf8",
  payout: "#f43f5e",
  fine_deduction: "#fb923c"
};

// La tasa se juzga por antigüedad, no por su valor: una tasa vieja es un error que
// crece solo, todos los días, sin que nadie lo toque.
const staleTone = (days) => {
  const d = parseFloat(days);
  if (!Number.isFinite(d)) return { color: "text-gray-500", label: "sin datos" };
  if (d <= 1) return { color: "text-emerald-400", label: "al día" };
  if (d <= 7) return { color: "text-amber-400", label: "atrasada" };
  return { color: "text-rose-400", label: "obsoleta" };
};

export default function TreasuryTab() {
  const [period, setPeriod] = useState("30d");
  const [chartMode, setChartMode] = useState("area");
  const { data, loading, error, reload } = useAnalyticsTabData(getTreasuryAnalyticsAPI, period);
  const drilldown = useDrilldown();

  if (loading && !data) return <SkeletonLoader type="kpiRow" />;
  if (error) {
    return <AnalyticsErrorPanel title="Error al cargar Tesorería" message={error} onRetry={() => reload(true)} />;
  }

  const kpis = data?.kpis || {};

  const ledgerTypes = (data?.ledgerByType || []).map((t) => ({
    ...t,
    label: TYPE_LABELS[t.type] || t.type,
    color: TYPE_COLORS[t.type] || "#9ca3af",
    net: parseFloat(t.net_amount || 0)
  }));

  return (
    <div className="space-y-6">
      {/* Controles */}
      <div className="relative z-30 flex flex-col md:flex-row md:items-center justify-between gap-4 fx-card-sm">
        <div>
          <h2 className="text-sm font-bold text-fx-text">Tesorería & Exposición Cambiaria</h2>
          <p className="text-[11px] text-fx-muted">
            Cuánto debe la plataforma a las tiendas, y si ese número es confiable
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <DateRangePicker selectedPeriod={period} onPeriodChange={setPeriod} />
          <FreshnessBadge lastUpdated={data?.serverTimestamp} onRefresh={() => reload(true)} isLoading={loading} />
        </div>
      </div>

      {/* Alertas de integridad: lo primero que debe ver quien abre esta pestaña */}
      {(kpis.mismatchedWallets > 0 || kpis.orphanPayouts > 0 || parseFloat(kpis.fxDaysStale) > 7) && (
        <div className="bg-rose-500/10 border border-rose-500/40 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
            <h3 className="text-sm font-semibold text-rose-200 uppercase tracking-wider">
              Integridad del Dinero
            </h3>
          </div>
          <ul className="space-y-2 text-xs text-fx-muted">
            {kpis.mismatchedWallets > 0 && (
              <li>
                <span className="font-semibold text-rose-300">{kpis.mismatchedWallets} billeteras</span> tienen
                un saldo que no coincide con su propio libro mayor, por{" "}
                <span className="font-semibold text-rose-300">{money(kpis.totalVarianceUsd)}</span> en total.
                El saldo se modificó por un camino que no dejó rastro en <code className="text-fx-faint">wallet_transactions</code>.
              </li>
            )}
            {kpis.orphanPayouts > 0 && (
              <li>
                <span className="font-semibold text-rose-300">{kpis.orphanPayouts} retiros</span> por{" "}
                <span className="font-semibold text-rose-300">{money(kpis.orphanPayoutUsd)}</span> salieron
                de una billetera sin una solicitud registrada que los respalde.
              </li>
            )}
            {parseFloat(kpis.fxDaysStale) > 7 && (
              <li>
                La tasa {kpis.fxPair} lleva{" "}
                <span className="font-semibold text-rose-300">{kpis.fxDaysStale} días</span> sin que el cron la
                verifique contra el BCV (Bs. {kpis.fxRate}). Todo precio en bolívares que ve el cliente y todo
                retiro que congela su equivalencia usan este valor.
              </li>
            )}
          </ul>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
        <KpiCard
          title="Saldo Disponible en Billeteras"
          value={kpis.totalAvailableUsd}
          format="currency"
          suffix={` · ${money(kpis.totalPendingUsd)} pendiente`}
          tooltip="Dinero que la plataforma custodia y las tiendas pueden retirar hoy. El pendiente aún está en escrow."
          onDrilldown={() =>
            drilldown.open("store_wallets", {
              title: "Saldo por billetera",
              subtitle: "Cada billetera con su saldo, su libro mayor y su descuadre",
              filters: { allTime: true }
            })
          }
        />
        <KpiCard
          title="Descuadre de Libro Mayor"
          value={kpis.totalVarianceUsd}
          format="currency"
          suffix={` · ${kpis.mismatchedWallets || 0} billeteras`}
          tooltip="Diferencia absoluta entre el saldo guardado y la suma de las transacciones que lo explican. Debería ser cero."
          onDrilldown={() =>
            drilldown.open("store_wallets", {
              title: "Billeteras descuadradas",
              subtitle: "Saldo guardado que no coincide con la suma de su libro mayor",
              filters: { mismatched: true, allTime: true }
            })
          }
        />
        <KpiCard
          title="Retiros Sin Solicitud"
          value={kpis.orphanPayouts}
          format="number"
          suffix={` · ${money(kpis.orphanPayoutUsd)}`}
          tooltip="Movimientos de tipo 'payout' sin una fila en payout_requests con ese monto. Dinero que salió sin que nadie lo pidiera formalmente."
          onDrilldown={() =>
            drilldown.open("wallet_transactions", {
              title: "Retiros sin solicitud que los respalde",
              filters: { orphan_payout: true, allTime: true }
            })
          }
        />
        <KpiCard
          title="Antigüedad de la Tasa BCV"
          value={kpis.fxDaysStale}
          format="number"
          suffix={` días · Bs. ${kpis.fxRate ?? "—"}`}
          tooltip={`Días desde que el cron autoUpdateBcvRate verificó la tasa contra el BCV. La fuente es global_settings.bcv_rate, la misma que usan el checkout y los retiros; la tabla exchange_rates es un vestigio y no se lee. El valor cambió por última vez hace ${kpis.fxDaysSinceChange ?? "—"} días (origen: ${kpis.fxSource ?? "—"}).`}
        />
        <KpiCard
          title="Retiros Esperando Pago"
          value={kpis.pendingPayouts}
          format="number"
          suffix={` · ${money(kpis.pendingPayoutUsd)}`}
          tooltip="Solicitudes en estado pendiente. Es deuda exigible: la tienda ya pidió su dinero."
          onDrilldown={() =>
            drilldown.open("payout_requests", {
              title: "Retiros pendientes de pago",
              filters: { status: "pending", allTime: true }
            })
          }
        />
        <KpiCard
          title="Tiempo Hasta Pagar"
          value={kpis.medianHoursToPay}
          format="number"
          suffix={` h mediana · ${kpis.avgHoursToPay || 0} h promedio`}
          tooltip="Horas entre la solicitud y su pago. Si el promedio es mucho mayor que la mediana, unos pocos retiros se quedaron atascados mucho tiempo."
          onDrilldown={() =>
            drilldown.open("payout_requests", {
              title: "Retiros pagados y sus tiempos",
              subtitle: "La columna Horas es el tiempo entre la solicitud y su pago",
              filters: { status: "completed", allTime: true }
            })
          }
        />
        <KpiCard
          title="Total Ya Pagado"
          value={kpis.completedPayoutUsd}
          format="currency"
          suffix={` en ${kpis.totalPayoutRequests || 0} solicitudes`}
          tooltip="Suma de los retiros completados históricamente."
          onDrilldown={() =>
            drilldown.open("payout_requests", { title: "Todas las solicitudes de retiro", filters: { allTime: true } })
          }
        />
        <KpiCard
          title="Sin Forma de Cobrar"
          value={kpis.storesWithoutPayoutMethod}
          format="number"
          suffix=" tiendas con saldo"
          tooltip="Tiendas que tienen dinero acumulado y no registraron ningún método de pago. Su dinero está atrapado por un dato faltante."
          onDrilldown={() =>
            drilldown.open("store_wallets", {
              title: "Billeteras con saldo y sin método de cobro",
              filters: { no_payout_method: true, has_balance: true, allTime: true }
            })
          }
        />
      </div>

      {/* Reconciliación */}
      <DataTable
        title="Reconciliación: Saldo Guardado vs Libro Mayor"
        subtitle="El saldo debería ser exactamente la suma de sus movimientos. Toda diferencia es dinero sin explicación."
        searchPlaceholder="Buscar tienda..."
        columns={[
          {
            header: "Tienda",
            accessor: "store_name",
            render: (r) => (
              <button
                onClick={() =>
                  drilldown.open("wallet_transactions", {
                    title: `Libro mayor de "${r.store_name}"`,
                    filters: { store_id: r.store_id, allTime: true }
                  })
                }
                className="font-bold text-fx-accent hover:underline text-left"
              >
                {r.store_name || "—"}
              </button>
            )
          },
          {
            header: "Saldo Guardado",
            accessor: "balance_available",
            render: (r) => <span className="font-bold text-fx-text">{money(r.balance_available)}</span>
          },
          {
            header: "Suma del Libro",
            accessor: "ledger_sum",
            render: (r) => <span className="text-fx-muted">{money(r.ledger_sum)}</span>
          },
          {
            header: "Descuadre",
            accessor: "variance",
            render: (r) => {
              const v = Math.abs(parseFloat(r.variance || 0));
              return v < 0.01 ? (
                <span className="text-emerald-400 font-bold">Cuadra</span>
              ) : (
                <span className="font-semibold text-rose-400">{money(r.variance)}</span>
              );
            }
          },
          { header: "Movimientos", accessor: "movements", render: (r) => num(r.movements) },
          {
            header: "Pendiente",
            accessor: "balance_pending",
            render: (r) => <span className="text-amber-400">{money(r.balance_pending)}</span>
          }
        ]}
        data={data?.reconciliation || []}
        emptyMessage="No hay billeteras registradas."
      />

      {/* Flujo diario */}
      <ChartCard
        title="Flujo de Caja de las Billeteras"
        subtitle="Lo que entra por ventas y reembolsos contra lo que sale por retiros y multas"
        onTypeChange={setChartMode}
      >
        <ResponsiveContainer width="100%" height={260}>
          {chartMode === "bar" ? (
            <BarChart data={data?.ledgerDaily || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff12" />
              <XAxis dataKey="date" stroke="#7b6c99" fontSize={11} />
              <YAxis stroke="#7b6c99" fontSize={11} />
              <Tooltip contentStyle={{ backgroundColor: "#0d0418", border: "1px solid #ffffff29", borderRadius: "10px", color: "#f4f1f8", fontSize: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.55)" }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="inflow" name="Entra" fill="#c3ff00" radius={[4, 4, 0, 0]} />
              <Bar dataKey="outflow" name="Sale" fill="#f43f5e" radius={[4, 4, 0, 0]} />
            </BarChart>
          ) : chartMode === "line" ? (
            <LineChart data={data?.ledgerDaily || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff12" />
              <XAxis dataKey="date" stroke="#7b6c99" fontSize={11} />
              <YAxis stroke="#7b6c99" fontSize={11} />
              <Tooltip contentStyle={{ backgroundColor: "#0d0418", border: "1px solid #ffffff29", borderRadius: "10px", color: "#f4f1f8", fontSize: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.55)" }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="inflow" name="Entra" stroke="#c3ff00" strokeWidth={3} dot={false} />
              <Line type="monotone" dataKey="outflow" name="Sale" stroke="#f43f5e" strokeWidth={2} dot={false} />
            </LineChart>
          ) : (
            <AreaChart data={data?.ledgerDaily || []}>
              <defs>
                <linearGradient id="colorTreasIn" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#c3ff00" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="#c3ff00" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorTreasOut" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff12" />
              <XAxis dataKey="date" stroke="#7b6c99" fontSize={11} />
              <YAxis stroke="#7b6c99" fontSize={11} />
              <Tooltip contentStyle={{ backgroundColor: "#0d0418", border: "1px solid #ffffff29", borderRadius: "10px", color: "#f4f1f8", fontSize: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.55)" }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Area type="monotone" dataKey="inflow" name="Entra" stroke="#c3ff00" strokeWidth={3} fillOpacity={1} fill="url(#colorTreasIn)" />
              <Area type="monotone" dataKey="outflow" name="Sale" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#colorTreasOut)" />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </ChartCard>

      {/* Composición del libro + tasa */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="fx-card">
          <h3 className="text-base font-bold text-fx-text mb-1">Composición del Libro Mayor</h3>
          <p className="text-xs text-fx-muted mb-4">
            Cuántos movimientos de cada tipo y cuánto pesan en el saldo
          </p>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={ledgerTypes} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff12" horizontal={false} />
              <XAxis type="number" stroke="#7b6c99" fontSize={11} allowDecimals={false} />
              <YAxis type="category" dataKey="label" stroke="#7b6c99" fontSize={10} width={130} />
              <Tooltip
                cursor={{ fill: "rgba(168,85,247,0.1)" }}
                contentStyle={{ backgroundColor: "#0d0418", border: "1px solid #ffffff29", borderRadius: "10px", color: "#f4f1f8", fontSize: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.55)" }}
                formatter={(value, _n, entry) => [
                  `${value} movimientos · neto ${money(entry.payload.net)}`,
                  entry.payload.label
                ]}
              />
              <Bar dataKey="movements" radius={[0, 6, 6, 0]}>
                {ledgerTypes.map((t) => (
                  <Cell key={t.type} fill={t.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="fx-card">
          <h3 className="text-base font-bold text-fx-text mb-1">Exposición Cambiaria</h3>
          <p className="text-xs text-fx-muted mb-4">
            La plataforma cobra en dólares y el cliente ve bolívares. Esta tasa es el puente.
          </p>
          {(data?.exchangeRates || []).length === 0 ? (
            <p className="text-xs text-gray-500">No hay ninguna tasa de cambio registrada.</p>
          ) : (
            <div className="space-y-4">
              {data.exchangeRates.map((r) => {
                const tone = staleTone(r.days_stale);
                return (
                  <div key={r.id} className="border border-fx-line rounded-2xl p-4 bg-fx-panel/50">
                    <div className="flex items-baseline justify-between gap-3 mb-2">
                      <span className="text-xs font-bold text-fx-muted uppercase tracking-wider">
                        {r.currency_from} → {r.currency_to}
                      </span>
                      <span className={`text-[10px] font-semibold uppercase ${tone.color}`}>{tone.label}</span>
                    </div>
                    <p className="text-3xl font-semibold text-fx-text mb-1">
                      {parseFloat(r.rate_bcv).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </p>
                    <p className={`text-xs font-bold ${tone.color}`}>
                      {r.days_stale} días sin actualizar
                    </p>
                    <p className="text-[10px] text-gray-500 mt-1">
                      Última vez: {new Date(r.last_updated).toLocaleString("es-VE")}
                    </p>
                  </div>
                );
              })}
              <div className="border-t border-fx-line pt-3">
                <p className="text-[11px] font-bold text-fx-muted mb-2">Métodos de cobro registrados</p>
                {(data?.paymentMethods || []).length === 0 ? (
                  <p className="text-xs text-gray-500">Ninguna tienda registró método de cobro.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {data.paymentMethods.map((m) => (
                      <span
                        key={m.method_type}
                        className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-500/15 text-fx-muted border border-fx-line-strong"
                      >
                        {m.method_type}: {m.total}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Retiros huérfanos */}
      {(data?.orphanPayouts?.length || 0) > 0 && (
        <div className="fx-card-danger">
          <h3 className="text-base font-bold text-fx-text mb-1">Retiros Sin Solicitud que los Respalde</h3>
          <p className="text-xs text-fx-muted mb-4">
            Salió dinero de la billetera y no existe una fila en <code className="text-fx-faint">payout_requests</code> con ese monto para esa tienda.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-fx-muted">
              <thead>
                <tr className="border-b border-fx-line text-fx-muted uppercase tracking-wider font-bold">
                  <th className="py-3 px-4">Fecha</th>
                  <th className="py-3 px-4">Tienda</th>
                  <th className="py-3 px-4">Monto</th>
                  <th className="py-3 px-4">Descripción</th>
                  <th className="py-3 px-4">Responsable</th>
                </tr>
              </thead>
              <tbody>
                {data.orphanPayouts.map((r) => (
                  <tr key={r.id} className="border-b border-fx-line hover:bg-purple-500/5 transition-colors">
                    <td className="py-3 px-4">{new Date(r.created_at).toLocaleDateString("es-VE")}</td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() =>
                          drilldown.open("wallet_transactions", {
                            title: `Retiros sin solicitud de "${r.store_name}"`,
                            filters: { store_id: r.store_id, orphan_payout: true, allTime: true }
                          })
                        }
                        className="font-bold text-fx-accent hover:underline text-left"
                      >
                        {r.store_name || "—"}
                      </button>
                    </td>
                    <td className="py-3 px-4 font-semibold text-rose-400">{money(r.amount)}</td>
                    <td className="py-3 px-4 text-fx-muted">{r.description || "—"}</td>
                    <td className="py-3 px-4">
                      {r.actor_name || <span className="text-rose-300 font-bold">sin registrar</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Cola de retiros */}
      <DataTable
        title="Cola de Retiros Pendientes"
        subtitle="Cada hora aquí es una tienda esperando su dinero"
        searchPlaceholder="Buscar tienda..."
        columns={[
          {
            header: "Tienda",
            accessor: "store_name",
            render: (r) => (
              <button
                onClick={() =>
                  drilldown.open("payout_requests", {
                    title: `Retiros de "${r.store_name}"`,
                    filters: { store_id: r.store_id, allTime: true }
                  })
                }
                className="font-bold text-fx-accent hover:underline text-left"
              >
                {r.store_name || "—"}
              </button>
            )
          },
          { header: "Monto", accessor: "amount", render: (r) => <span className="font-semibold text-fx-accent">{money(r.amount)}</span> },
          {
            header: "Saldo Disponible",
            accessor: "balance_available",
            render: (r) =>
              r.exceeds_balance ? (
                <span className="text-rose-400 font-bold">
                  {money(r.balance_available)} · insuficiente
                </span>
              ) : (
                <span className="text-emerald-400">{money(r.balance_available)}</span>
              )
          },
          { header: "Método", accessor: "method", render: (r) => <span className="text-fx-muted">{r.method || "—"}</span> },
          {
            header: "Esperando",
            accessor: "hours_waiting",
            render: (r) => {
              const h = parseFloat(r.hours_waiting);
              const days = (h / 24).toFixed(1);
              return (
                <span className={h > 72 ? "text-rose-400 font-bold" : "text-amber-400 font-bold"}>
                  {days} d
                </span>
              );
            }
          }
        ]}
        data={data?.payoutQueue || []}
        emptyMessage="No hay ningún retiro esperando pago."
      />

      {/* Retiros por tienda */}
      <DataTable
        title="Retiros por Tienda"
        subtitle="Quién ha cobrado y cuánto le queda pendiente"
        searchPlaceholder="Buscar tienda..."
        columns={[
          {
            header: "Tienda",
            accessor: "store_name",
            render: (r) => (
              <button
                onClick={() =>
                  drilldown.open("payout_requests", {
                    title: `Retiros de "${r.store_name}"`,
                    filters: { store_id: r.store_id, allTime: true }
                  })
                }
                className="font-bold text-fx-accent hover:underline text-left"
              >
                {r.store_name || "—"}
              </button>
            )
          },
          { header: "Solicitudes", accessor: "requests", render: (r) => num(r.requests) },
          {
            header: "Pendientes",
            accessor: "pending",
            render: (r) =>
              Number(r.pending) > 0 ? (
                <span className="text-amber-400 font-bold">{num(r.pending)}</span>
              ) : (
                <span className="text-gray-500">0</span>
              )
          },
          { header: "Total Solicitado", accessor: "total_requested", render: (r) => money(r.total_requested) },
          {
            header: "Total Pagado",
            accessor: "total_paid",
            render: (r) => <span className="font-bold text-emerald-400">{money(r.total_paid)}</span>
          },
          {
            header: "Última Solicitud",
            accessor: "last_request_at",
            render: (r) => (r.last_request_at ? new Date(r.last_request_at).toLocaleDateString("es-VE") : "—")
          }
        ]}
        data={data?.payoutsByStore || []}
        emptyMessage="Ninguna tienda ha solicitado un retiro todavía."
      />

      {/* Dinero atrapado */}
      {(data?.storesWithoutPayoutMethod?.length || 0) > 0 && (
        <DataTable
          title="Dinero Atrapado por un Dato Faltante"
          subtitle="Tiendas con saldo que no registraron ningún método de cobro: no se les puede pagar aunque lo pidan"
          searchPlaceholder="Buscar tienda..."
          columns={[
            {
              header: "Tienda",
              accessor: "store_name",
              render: (r) => (
                <button
                  onClick={() =>
                    drilldown.open("wallet_transactions", {
                      title: `Libro mayor de "${r.store_name}"`,
                      filters: { store_id: r.store_id, allTime: true }
                    })
                  }
                  className="font-bold text-fx-accent hover:underline text-left"
                >
                  {r.store_name || "—"}
                </button>
              )
            },
            {
              header: "Disponible",
              accessor: "balance_available",
              render: (r) => <span className="font-semibold text-amber-400">{money(r.balance_available)}</span>
            },
            { header: "Pendiente", accessor: "balance_pending", render: (r) => money(r.balance_pending) }
          ]}
          data={data.storesWithoutPayoutMethod}
        />
      )}

      {/* Movimientos más grandes */}
      <DataTable
        title="Movimientos Más Grandes del Período"
        subtitle="Ordenados por monto absoluto: donde está el dinero, están los errores caros"
        searchPlaceholder="Buscar tienda o descripción..."
        columns={[
          {
            header: "Fecha",
            accessor: "created_at",
            render: (r) => new Date(r.created_at).toLocaleDateString("es-VE")
          },
          {
            header: "Tienda",
            accessor: "store_name",
            render: (r) => (
              <button
                onClick={() =>
                  drilldown.open("wallet_transactions", {
                    title: `Libro mayor de "${r.store_name}"`,
                    filters: { store_id: r.store_id, allTime: true }
                  })
                }
                className="font-bold text-fx-accent hover:underline text-left"
              >
                {r.store_name || "—"}
              </button>
            )
          },
          {
            header: "Tipo",
            accessor: "type",
            render: (r) => (
              <span
                className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase border whitespace-nowrap"
                style={{
                  color: TYPE_COLORS[r.type] || "#9ca3af",
                  borderColor: `${TYPE_COLORS[r.type] || "#9ca3af"}55`,
                  backgroundColor: `${TYPE_COLORS[r.type] || "#9ca3af"}18`
                }}
              >
                {TYPE_LABELS[r.type] || r.type}
              </span>
            )
          },
          {
            header: "Monto",
            accessor: "amount",
            render: (r) => (
              <span className={`font-semibold ${parseFloat(r.amount) < 0 ? "text-rose-400" : "text-emerald-400"}`}>
                {money(r.amount)}
              </span>
            )
          },
          { header: "Descripción", accessor: "description", render: (r) => <span className="text-fx-muted">{r.description || "—"}</span> },
          { header: "Responsable", accessor: "actor_name", render: (r) => r.actor_name || <span className="text-gray-600">sin registrar</span> }
        ]}
        data={data?.topMovements || []}
        emptyMessage="No hubo movimientos de billetera en este período."
      />

      <DrilldownModal {...drilldown.props} period={period} />
    </div>
  );
}
