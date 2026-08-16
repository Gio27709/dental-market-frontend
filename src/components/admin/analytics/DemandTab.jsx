import { useState } from "react";
import { getDemandAnalyticsAPI } from "../../../services/api";
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

const AGE_LABELS = {
  hoy: "Modificado hoy",
  ultima_semana: "Última semana",
  ultimo_mes: "Último mes",
  ultimo_trimestre: "Último trimestre",
  mas_90d: "Más de 90 días"
};

// El degradado va de recuperable (verde) a demanda muerta (rojo): mientras más viejo
// el carrito, menos sentido tiene invertir en recuperarlo.
const AGE_COLORS = {
  hoy: "#c3ff00",
  ultima_semana: "#a3e635",
  ultimo_mes: "#facc15",
  ultimo_trimestre: "#fb923c",
  mas_90d: "#f43f5e"
};

const AGE_ORDER = ["hoy", "ultima_semana", "ultimo_mes", "ultimo_trimestre", "mas_90d"];

const money = (v) => `$${parseFloat(v || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function DemandTab() {
  const [period, setPeriod] = useState("30d");
  const [chartMode, setChartMode] = useState("area");
  const { data, loading, error, reload } = useAnalyticsTabData(getDemandAnalyticsAPI, period);
  const drilldown = useDrilldown();

  if (loading && !data) return <SkeletonLoader type="kpiRow" />;
  if (error) {
    return <AnalyticsErrorPanel title="Error al cargar Demanda Latente" message={error} onRetry={() => reload(true)} />;
  }

  const kpis = data?.kpis || {};

  // Se ordenan los tramos de antigüedad y se rellenan los vacíos: si no hay carritos
  // recientes eso mismo es la señal, y desaparecer del gráfico la ocultaría.
  const ageBuckets = AGE_ORDER.map((bucket) => {
    const found = (data?.cartAgeBuckets || []).find((b) => b.bucket === bucket);
    return {
      bucket,
      label: AGE_LABELS[bucket],
      carts: Number(found?.carts || 0),
      value_usd: parseFloat(found?.value_usd || 0)
    };
  });

  return (
    <div className="space-y-6">
      {/* Controles */}
      <div className="relative z-30 flex flex-col md:flex-row md:items-center justify-between gap-4 fx-card-sm">
        <div>
          <h2 className="text-sm font-bold text-fx-text">Demanda Latente</h2>
          <p className="text-[11px] text-fx-muted">
            Lo que el cliente quiso comprar y no compró: carritos detenidos y favoritos
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <DateRangePicker selectedPeriod={period} onPeriodChange={setPeriod} />
          <FreshnessBadge lastUpdated={data?.serverTimestamp} onRefresh={() => reload(true)} isLoading={loading} />
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
        <KpiCard
          title="Valor Detenido en Carritos"
          value={kpis.valueParkedUsd}
          format="currency"
          suffix={` · ${kpis.unitsParked || 0} unidades`}
          tooltip="Suma del precio de todo lo que está dentro de un carrito sin comprar. Es dinero a un paso del checkout."
          onDrilldown={() =>
            drilldown.open("cart_items", {
              title: "Todo lo que está dentro de un carrito",
              filters: { allTime: true }
            })
          }
        />
        <KpiCard
          title="Carritos con Contenido"
          value={kpis.cartsWithItems}
          format="number"
          suffix={` de ${kpis.totalCarts || 0}`}
          tooltip={`${kpis.emptyCarts || 0} carritos existen pero están vacíos: son sesiones que abrieron el carrito y no pusieron nada.`}
          onDrilldown={() =>
            drilldown.open("carts", {
              title: "Carritos con al menos un producto",
              filters: { non_empty: true, allTime: true }
            })
          }
        />
        <KpiCard
          title="Carritos Abandonados"
          value={kpis.abandonedCarts}
          format="number"
          suffix={` · ${money(kpis.abandonedValueUsd)}`}
          tooltip="Carritos con productos cuyo dueño no ha generado ninguna orden desde la última vez que lo tocó."
          onDrilldown={() =>
            drilldown.open("carts", {
              title: "Carritos abandonados",
              subtitle: "Con productos y sin ninguna orden posterior del dueño",
              filters: { non_empty: true, abandoned: true, allTime: true }
            })
          }
        />
        <KpiCard
          title="Ticket Promedio del Carrito"
          value={kpis.avgCartValueUsd}
          format="currency"
          tooltip="Valor medio de un carrito con contenido. Compáralo con el ticket promedio de las órdenes reales para ver cuánto se pierde en el camino."
          onDrilldown={() =>
            drilldown.open("carts", {
              title: "Carritos con contenido y su valor",
              filters: { non_empty: true, allTime: true }
            })
          }
        />
        <KpiCard
          title="Favoritos Guardados"
          value={kpis.totalFavorites}
          format="number"
          suffix={` · +${kpis.favoritesNewInPeriod || 0} en el período`}
          tooltip="Intención declarada de forma explícita: el usuario dijo 'esto me interesa' sin comprarlo."
          onDrilldown={() => drilldown.open("favorites", { title: "Todos los favoritos", filters: { allTime: true } })}
        />
        <KpiCard
          title="Productos Deseados"
          value={kpis.productsFavorited}
          format="number"
          suffix={` · ${kpis.usersWithFavorites || 0} usuarios`}
          tooltip="Productos distintos que al menos una persona guardó en favoritos."
          onDrilldown={() =>
            drilldown.open("favorites", {
              title: "Productos guardados en favoritos",
              filters: { allTime: true }
            })
          }
        />
        <KpiCard
          title="Conversión de la Intención"
          value={kpis.intentConversionPct}
          format="percent"
          suffix={` de ${kpis.intentPairs || 0} señales`}
          tooltip="De cada par usuario-producto que mostró intención (favorito o carrito), qué porcentaje terminó en una compra real de ese usuario."
          onDrilldown={() =>
            drilldown.open("favorites", {
              title: "Intención que nunca se convirtió en compra",
              subtitle: "Favoritos cuyo dueño jamás compró ese producto",
              filters: { never_purchased: true, allTime: true }
            })
          }
        />
        <KpiCard
          title="Demanda Bloqueada"
          value={kpis.blockedProducts}
          format="number"
          suffix=" productos"
          tooltip="Productos que alguien quiere y la plataforma no puede vender: agotados, en borrador, desactivados o rechazados en moderación."
          onDrilldown={() =>
            drilldown.open("cart_items", {
              title: "Demanda bloqueada en carritos",
              subtitle: "Ítems de carrito cuyo producto no se puede vender hoy",
              filters: { unavailable: true, allTime: true }
            })
          }
        />
      </div>

      {/* Tendencia de intención */}
      <ChartCard
        title="Señales de Intención por Día"
        subtitle="Favoritos guardados y productos agregados al carrito, antes de cualquier compra"
        onTypeChange={setChartMode}
      >
        <ResponsiveContainer width="100%" height={260}>
          {chartMode === "bar" ? (
            <BarChart data={data?.dailyTrend || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff12" />
              <XAxis dataKey="date" stroke="#7b6c99" fontSize={11} />
              <YAxis stroke="#7b6c99" fontSize={11} allowDecimals={false} />
              <Tooltip contentStyle={{ backgroundColor: "#0d0418", border: "1px solid #ffffff29", borderRadius: "10px", color: "#f4f1f8", fontSize: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.55)" }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="favorites" name="Favoritos" fill="#a855f7" radius={[4, 4, 0, 0]} />
              <Bar dataKey="cart_adds" name="Agregados al carrito" fill="#c3ff00" radius={[4, 4, 0, 0]} />
            </BarChart>
          ) : chartMode === "line" ? (
            <LineChart data={data?.dailyTrend || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff12" />
              <XAxis dataKey="date" stroke="#7b6c99" fontSize={11} />
              <YAxis stroke="#7b6c99" fontSize={11} allowDecimals={false} />
              <Tooltip contentStyle={{ backgroundColor: "#0d0418", border: "1px solid #ffffff29", borderRadius: "10px", color: "#f4f1f8", fontSize: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.55)" }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="favorites" name="Favoritos" stroke="#a855f7" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="cart_adds" name="Agregados al carrito" stroke="#c3ff00" strokeWidth={3} dot={false} />
            </LineChart>
          ) : (
            <AreaChart data={data?.dailyTrend || []}>
              <defs>
                <linearGradient id="colorDemandFav" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorDemandCart" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#c3ff00" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="#c3ff00" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff12" />
              <XAxis dataKey="date" stroke="#7b6c99" fontSize={11} />
              <YAxis stroke="#7b6c99" fontSize={11} allowDecimals={false} />
              <Tooltip contentStyle={{ backgroundColor: "#0d0418", border: "1px solid #ffffff29", borderRadius: "10px", color: "#f4f1f8", fontSize: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.55)" }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Area type="monotone" dataKey="favorites" name="Favoritos" stroke="#a855f7" strokeWidth={2} fillOpacity={1} fill="url(#colorDemandFav)" />
              <Area type="monotone" dataKey="cart_adds" name="Agregados al carrito" stroke="#c3ff00" strokeWidth={3} fillOpacity={1} fill="url(#colorDemandCart)" />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </ChartCard>

      {/* Antigüedad del abandono + productos detenidos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="fx-card">
          <h3 className="text-base font-bold text-fx-text mb-1">Antigüedad del Carrito Abandonado</h3>
          <p className="text-xs text-fx-muted mb-4">
            Un carrito de esta semana se recupera con un recordatorio; uno de hace tres meses ya es demanda muerta
          </p>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={ageBuckets} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff12" horizontal={false} />
              <XAxis type="number" stroke="#7b6c99" fontSize={11} allowDecimals={false} />
              <YAxis type="category" dataKey="label" stroke="#7b6c99" fontSize={10} width={110} />
              <Tooltip
                cursor={{ fill: "rgba(168,85,247,0.1)" }}
                contentStyle={{ backgroundColor: "#0d0418", border: "1px solid #ffffff29", borderRadius: "10px", color: "#f4f1f8", fontSize: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.55)" }}
                formatter={(value, _name, entry) => [`${value} carritos · ${money(entry.payload.value_usd)}`, "Detenido"]}
              />
              <Bar dataKey="carts" radius={[0, 6, 6, 0]}>
                {ageBuckets.map((b) => (
                  <Cell key={b.bucket} fill={AGE_COLORS[b.bucket]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <DataTable
          title="Productos Detenidos en Carritos"
          subtitle="Ordenados por el dinero que representan"
          searchPlaceholder="Buscar producto..."
          columns={[
            {
              header: "Producto",
              accessor: "product_name",
              render: (r) => (
                <button
                  onClick={() =>
                    drilldown.open("cart_items", {
                      title: `Carritos que contienen "${r.product_name}"`,
                      filters: { product_id: r.product_id, allTime: true }
                    })
                  }
                  className="font-bold text-fx-accent hover:underline text-left"
                >
                  {r.product_name}
                </button>
              )
            },
            { header: "Carritos", accessor: "in_carts", render: (r) => Number(r.in_carts).toLocaleString("en-US") },
            { header: "Unidades", accessor: "units", render: (r) => Number(r.units).toLocaleString("en-US") },
            { header: "Valor", accessor: "value_usd", render: (r) => <span className="font-bold text-fx-text">{money(r.value_usd)}</span> },
            {
              header: "Stock",
              accessor: "stock_status",
              render: (r) => (
                <span className={r.stock_status === "Activo" ? "text-emerald-400" : "text-rose-400 font-bold"}>
                  {r.stock_status || "—"}
                </span>
              )
            }
          ]}
          data={data?.cartProducts || []}
          emptyMessage="No hay ningún producto dentro de un carrito ahora mismo."
        />
      </div>

      {/* Carritos abandonados */}
      <DataTable
        title="Carritos Abandonados de Mayor Valor"
        subtitle="Clientes que dejaron productos y no volvieron a ordenar desde entonces"
        searchPlaceholder="Buscar cliente..."
        columns={[
          {
            header: "Cliente",
            accessor: "user_name",
            render: (r) => (
              <button
                onClick={() =>
                  drilldown.open("cart_items", {
                    title: `Qué hay dentro del carrito de ${r.user_name || r.email || "este cliente"}`,
                    filters: { cart_id: r.cart_id, allTime: true }
                  })
                }
                className="text-left"
              >
                <p className="font-bold text-fx-accent hover:underline">{r.user_name || "Sin nombre"}</p>
                <p className="text-[10px] text-fx-muted font-mono">{r.email}</p>
              </button>
            )
          },
          { header: "Líneas", accessor: "items", render: (r) => Number(r.items).toLocaleString("en-US") },
          { header: "Unidades", accessor: "units", render: (r) => Number(r.units).toLocaleString("en-US") },
          { header: "Valor", accessor: "value_usd", render: (r) => <span className="font-semibold text-fx-accent">{money(r.value_usd)}</span> },
          {
            header: "Días Sin Tocar",
            accessor: "days_idle",
            render: (r) => (
              <span className={parseFloat(r.days_idle) > 30 ? "text-rose-400 font-bold" : "text-amber-400 font-bold"}>
                {r.days_idle} d
              </span>
            )
          }
        ]}
        data={data?.abandonedCarts || []}
        emptyMessage="Ningún carrito quedó abandonado: todos sus dueños ordenaron después."
      />

      {/* Demanda bloqueada */}
      {(data?.blockedDemand?.length || 0) > 0 && (
        <div className="fx-card-danger">
          <h3 className="text-base font-bold text-fx-text mb-1">Demanda que la Plataforma No Puede Atender</h3>
          <p className="text-xs text-fx-muted mb-4">
            Alguien quiere estos productos y no se le pueden vender. Es la lista de arreglos con retorno más inmediato.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-fx-muted">
              <thead>
                <tr className="border-b border-fx-line text-fx-muted uppercase tracking-wider font-bold">
                  <th className="py-3 px-4">Producto</th>
                  <th className="py-3 px-4">Tienda</th>
                  <th className="py-3 px-4">Precio</th>
                  <th className="py-3 px-4">Señales</th>
                  <th className="py-3 px-4">Motivo del Bloqueo</th>
                </tr>
              </thead>
              <tbody>
                {data.blockedDemand.map((r) => (
                  <tr key={r.product_id} className="border-b border-fx-line hover:bg-purple-500/5 transition-colors">
                    <td className="py-3 px-4">
                      <button
                        onClick={() =>
                          drilldown.open("cart_items", {
                            title: `Carritos que esperan "${r.product_name}"`,
                            filters: { product_id: r.product_id, allTime: true }
                          })
                        }
                        className="font-bold text-fx-accent hover:underline text-left"
                      >
                        {r.product_name}
                      </button>
                    </td>
                    <td className="py-3 px-4">{r.store_name || "—"}</td>
                    <td className="py-3 px-4">{money(r.price)}</td>
                    <td className="py-3 px-4 font-bold text-fx-accent">{r.demand_signals}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-rose-500/15 text-rose-300 border border-rose-500/30 whitespace-nowrap">
                        {r.blocked_reason}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Favoritos por producto */}
      <DataTable
        title="Ranking de Deseo vs Venta Real"
        subtitle="Muchos favoritos y pocas ventas señala un problema de precio, stock o confianza, no de interés"
        searchPlaceholder="Buscar producto..."
        columns={[
          {
            header: "Producto",
            accessor: "product_name",
            render: (r) => (
              <button
                onClick={() =>
                  drilldown.open("favorites", {
                    title: `Quién guardó "${r.product_name}"`,
                    filters: { product_id: r.product_id, allTime: true }
                  })
                }
                className="font-bold text-fx-accent hover:underline text-left"
              >
                {r.product_name}
              </button>
            )
          },
          { header: "Tienda", accessor: "store_name", render: (r) => r.store_name || "—" },
          { header: "Precio", accessor: "price", render: (r) => money(r.price) },
          { header: "Favoritos", accessor: "favorites", render: (r) => <span className="font-bold text-fx-faint">{r.favorites}</span> },
          {
            header: "Unidades Vendidas",
            accessor: "units_sold",
            render: (r) =>
              Number(r.units_sold) === 0 ? (
                <span className="text-rose-400 font-bold">0 · nunca se vendió</span>
              ) : (
                <span className="text-emerald-400 font-bold">{Number(r.units_sold).toLocaleString("en-US")}</span>
              )
          }
        ]}
        data={data?.favoritesByProduct || []}
        emptyMessage="Todavía nadie ha guardado un producto en favoritos."
      />

      {/* Favoritos por tienda */}
      <DataTable
        title="Interés Acumulado por Tienda"
        columns={[
          {
            header: "Tienda",
            accessor: "store_name",
            render: (r) => (
              <button
                onClick={() =>
                  drilldown.open("favorites", {
                    title: `Favoritos de la tienda ${r.store_name || ""}`,
                    filters: { store_id: r.store_id, allTime: true }
                  })
                }
                className="font-bold text-fx-accent hover:underline text-left"
              >
                {r.store_name || "—"}
              </button>
            )
          },
          { header: "Favoritos", accessor: "favorites", render: (r) => Number(r.favorites).toLocaleString("en-US") },
          { header: "Productos Deseados", accessor: "products_favorited", render: (r) => Number(r.products_favorited).toLocaleString("en-US") },
          { header: "Usuarios Distintos", accessor: "distinct_users", render: (r) => Number(r.distinct_users).toLocaleString("en-US") }
        ]}
        data={data?.favoritesByStore || []}
        emptyMessage="Ninguna tienda tiene productos guardados en favoritos todavía."
      />

      <DrilldownModal {...drilldown.props} period={period} />
    </div>
  );
}
