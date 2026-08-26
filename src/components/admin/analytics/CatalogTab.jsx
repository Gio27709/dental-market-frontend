import { useState } from "react";
import { getCatalogAnalyticsAPI } from "../../../services/api";
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

const money = (v) => `$${parseFloat(v || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const num = (v) => Number(v || 0).toLocaleString("en-US");

// El margen se juzga por umbrales de negocio, no por el valor relativo del resto de la
// tabla: un 8% sigue siendo malo aunque sea el mejor del catálogo.
const marginColor = (pct) => {
  const v = parseFloat(pct);
  if (!Number.isFinite(v)) return "text-gray-500";
  if (v < 0) return "text-fx-neg";
  if (v < 15) return "text-fx-warn";
  if (v < 30) return "text-fx-accent";
  return "text-fx-pos";
};

const MOVEMENT_LABELS = {
  sale: "Venta",
  initial: "Carga inicial",
  restock: "Reposición",
  adjustment: "Ajuste manual",
  cancellation: "Devolución por cancelación"
};

// Verde = entra inventario, rojo = sale, morado = correcciones humanas.
const MOVEMENT_COLORS = {
  sale: "#b8482f",
  initial: "#7c4f9e",
  restock: "#6b1e96",
  adjustment: "#9a6a10",
  cancellation: "#3f7794"
};

export default function CatalogTab() {
  const [period, setPeriod] = useState("30d");
  const [chartMode, setChartMode] = useState("bar");
  const { data, loading, error, reload } = useAnalyticsTabData(getCatalogAnalyticsAPI, period);
  const drilldown = useDrilldown();

  if (loading && !data) return <SkeletonLoader type="kpiRow" />;
  if (error) {
    return <AnalyticsErrorPanel title="Error al cargar Catálogo y Márgenes" message={error} onRetry={() => reload(true)} />;
  }

  const kpis = data?.kpis || {};

  const movements = (data?.stockByType || []).map((m) => ({
    ...m,
    label: MOVEMENT_LABELS[m.movement_type] || m.movement_type,
    color: MOVEMENT_COLORS[m.movement_type] || "#9ca3af"
  }));

  return (
    <div className="space-y-6">
      {/* Controles */}
      <div className="relative z-30 flex flex-col md:flex-row md:items-center justify-between gap-4 fx-card-sm">
        <div>
          <h2 className="text-sm font-bold text-fx-text">Catálogo, Marcas y Márgenes</h2>
          <p className="text-[11px] text-fx-muted">
            Qué se vende, cuánto deja realmente y cuánto del catálogo es andamiaje vacío
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
          title="Productos Vendibles"
          value={kpis.sellableProducts}
          format="number"
          suffix={` de ${kpis.totalProducts || 0}`}
          tooltip={`Solo estos se pueden comprar hoy. ${kpis.draftProducts || 0} en borrador, ${kpis.outOfStock || 0} agotados, ${kpis.notApproved || 0} sin aprobar en moderación.`}
          onDrilldown={() =>
            drilldown.open("products", { title: "Todos los productos del catálogo", filters: { allTime: true } })
          }
        />
        <KpiCard
          title="Margen Promedio Real"
          value={kpis.avgMarginPct}
          format="percent"
          suffix={` · mediana ${kpis.medianMarginPct ?? "—"}%`}
          tooltip="Calculado con cost_price contra precio de venta, solo sobre los productos que declaran costo. Si la mediana es muy distinta del promedio, unos pocos productos están distorsionando la lectura."
          onDrilldown={() =>
            drilldown.open("products", {
              title: "Productos que declaran costo",
              subtitle: "Solo sobre estos se puede calcular el margen real",
              filters: { missing_cost: false, allTime: true }
            })
          }
        />
        <KpiCard
          title="Cobertura de Costos"
          value={kpis.costCoveragePct}
          format="percent"
          suffix={` · ${kpis.productsWithoutCost || 0} sin costo`}
          tooltip="Porcentaje del catálogo que declara cost_price. Todo lo que falta aquí es margen que la plataforma no puede medir."
          onDrilldown={() =>
            drilldown.open("products", {
              title: "Productos que no declaran costo",
              subtitle: "Su margen es invisible para la plataforma",
              filters: { missing_cost: true, allTime: true }
            })
          }
        />
        <KpiCard
          title="Productos Bajo Costo"
          value={kpis.productsBelowCost}
          format="number"
          suffix={` · ${kpis.fakeDiscounts || 0} descuentos falsos`}
          tooltip="Se venden por debajo de lo que cuestan: cada unidad vendida pierde dinero. Los descuentos falsos son productos cuyo precio 'antes' es igual o menor al actual."
          onDrilldown={() =>
            drilldown.open("products", {
              title: "Productos vendidos por debajo de su costo",
              filters: { below_cost: true, allTime: true }
            })
          }
        />
        <KpiCard
          title="Marcas en Uso"
          value={kpis.brandsInUse}
          format="number"
          suffix={` de ${kpis.totalBrands || 0}`}
          tooltip={`${kpis.unusedBrands || 0} marcas existen en la base y ningún producto las usa. El catálogo aparenta una profundidad de marcas que no tiene.`}
          onDrilldown={() =>
            drilldown.open("brands", {
              title: "Marcas sin un solo producto",
              filters: { unused: true }
            })
          }
        />
        <KpiCard
          title="Categorías en Uso"
          value={kpis.categoriesInUse}
          format="number"
          suffix={` de ${kpis.totalCategories || 0}`}
          tooltip={`${kpis.unusedCategories || 0} categorías vacías. Una categoría sin productos es un callejón sin salida en la navegación del cliente.`}
        />
        <KpiCard
          title="Cambios de Precio"
          value={kpis.priceChangesInPeriod}
          format="number"
          suffix={kpis.marginErosions ? ` · ${kpis.marginErosions} erosionan margen` : ""}
          tooltip="Modificaciones de precio registradas en el período. Las que erosionan margen bajaron el precio sin bajar el costo."
          onDrilldown={() => drilldown.open("price_history", { title: "Cambios de precio del período" })}
        />
        <KpiCard
          title="Productos Sin Clasificar"
          value={kpis.withoutBrand}
          format="number"
          suffix={kpis.withoutCategory ? ` · ${kpis.withoutCategory} sin categoría` : " sin marca"}
          tooltip="Productos que no aparecerán en los filtros por marca ni en las páginas de marca. Son invisibles para quien busca por fabricante."
          onDrilldown={() =>
            drilldown.open("products", {
              title: "Productos sin marca asignada",
              filters: { without_brand: true, allTime: true }
            })
          }
        />
      </div>

      {/* Ranking de margen */}
      <DataTable
        title="Margen Real por Producto"
        subtitle="Ordenado por la ganancia bruta que cada producto generó de verdad, no por lo que factura"
        searchPlaceholder="Buscar producto..."
        columns={[
          {
            header: "Producto",
            accessor: "product_name",
            render: (r) => (
              <div>
                <button
                  onClick={() =>
                    drilldown.open("order_items", {
                      title: `Ventas de "${r.product_name}"`,
                      subtitle: "De dónde salió la ganancia generada",
                      filters: { product_id: r.product_id, allTime: true }
                    })
                  }
                  className="font-bold text-fx-accent hover:underline text-left"
                >
                  {r.product_name}
                </button>
                <p className="text-[10px] text-fx-muted">
                  {r.store_name || "—"}
                  {r.brand_name ? ` · ${r.brand_name}` : " · sin marca"}
                </p>
              </div>
            )
          },
          { header: "Precio", accessor: "price", render: (r) => money(r.price) },
          { header: "Costo", accessor: "cost_price", render: (r) => <span className="text-fx-muted">{money(r.cost_price)}</span> },
          {
            header: "Margen",
            accessor: "margin_pct",
            render: (r) => (
              <div>
                <span className={`font-semibold ${marginColor(r.margin_pct)}`}>{r.margin_pct}%</span>
                <p className="text-[10px] text-gray-500">{money(r.margin_usd)} / unidad</p>
              </div>
            )
          },
          { header: "Vendidas", accessor: "units_sold", render: (r) => num(r.units_sold) },
          {
            header: "Ganancia Generada",
            accessor: "profit_generated_usd",
            render: (r) => <span className="font-semibold text-fx-accent">{money(r.profit_generated_usd)}</span>
          }
        ]}
        data={data?.marginByProduct || []}
        emptyMessage="Ningún producto declara costo todavía, así que no hay margen que calcular."
      />

      {/* Fugas de margen */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DataTable
          title="Se Venden por Debajo del Costo"
          subtitle="Cada unidad vendida resta dinero"
          searchPlaceholder="Buscar producto..."
          columns={[
            {
              header: "Producto",
              accessor: "product_name",
              render: (r) => (
                <button
                  onClick={() =>
                    drilldown.open("order_items", {
                      title: `Ventas de "${r.product_name}"`,
                      subtitle: "Cada línea vendida perdió dinero",
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
            { header: "Costo", accessor: "cost_price", render: (r) => money(r.cost_price) },
            {
              header: "Pérdida/Unidad",
              accessor: "margin_usd",
              render: (r) => <span className="font-semibold text-fx-neg">{money(r.margin_usd)}</span>
            },
            { header: "Vendidas", accessor: "units_sold", render: (r) => num(r.units_sold) }
          ]}
          data={data?.productsBelowCost || []}
          emptyMessage="Ningún producto se vende por debajo de su costo."
        />

        <DataTable
          title="Vendiendo sin Saber la Ganancia"
          subtitle="Productos con ventas reales que nunca declararon costo"
          searchPlaceholder="Buscar producto..."
          columns={[
            {
              header: "Producto",
              accessor: "product_name",
              render: (r) => (
                <button
                  onClick={() =>
                    drilldown.open("order_items", {
                      title: `Ventas de "${r.product_name}"`,
                      subtitle: "Facturado sin costo declarado: ganancia desconocida",
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
            { header: "Vendidas", accessor: "units_sold", render: (r) => num(r.units_sold) },
            {
              header: "Facturado a Ciegas",
              accessor: "revenue_usd",
              render: (r) => <span className="font-semibold text-fx-warn">{money(r.revenue_usd)}</span>
            }
          ]}
          data={data?.productsWithoutCost || []}
          emptyMessage="Todo el catálogo con ventas declara su costo."
        />
      </div>

      {/* Descuentos falsos */}
      {(data?.fakeDiscounts?.length || 0) > 0 && (
        <div className="fx-card-danger">
          <h3 className="text-base font-bold text-fx-text mb-1">Descuentos que No Descuentan</h3>
          <p className="text-xs text-fx-muted mb-4">
            El precio &quot;antes&quot; es igual o menor al precio actual: el cliente ve una rebaja que no existe. Es un riesgo de confianza, no solo un error de datos.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-fx-muted">
              <thead>
                <tr className="border-b border-fx-line text-fx-muted uppercase tracking-wider font-bold">
                  <th className="py-3 px-4">Producto</th>
                  <th className="py-3 px-4">Tienda</th>
                  <th className="py-3 px-4">Precio Mostrado Como &quot;Antes&quot;</th>
                  <th className="py-3 px-4">Precio Actual</th>
                </tr>
              </thead>
              <tbody>
                {data.fakeDiscounts.map((r) => (
                  <tr key={r.product_id} className="border-b border-fx-line hover:bg-fx-violet/5 transition-colors">
                    <td className="py-3 px-4">
                      <button
                        onClick={() =>
                          drilldown.open("price_history", {
                            title: `Historial de precios de "${r.product_name}"`,
                            subtitle: "Cómo llegó el precio 'antes' a quedar por debajo del actual",
                            filters: { product_id: r.product_id, allTime: true }
                          })
                        }
                        className="font-bold text-fx-accent hover:underline text-left"
                      >
                        {r.product_name}
                      </button>
                    </td>
                    <td className="py-3 px-4">{r.store_name || "—"}</td>
                    <td className="py-3 px-4 line-through text-gray-500">{money(r.compare_at_price)}</td>
                    <td className="py-3 px-4 font-semibold text-fx-neg">{money(r.price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Flujo de inventario */}
      <ChartCard
        title="Flujo de Inventario por Tipo de Movimiento"
        subtitle="Qué entra, qué sale y cuánto de eso son correcciones manuales en vez de ventas"
        onTypeChange={setChartMode}
      >
        <ResponsiveContainer width="100%" height={260}>
          {chartMode === "line" ? (
            <LineChart data={movements}>
              <CartesianGrid strokeDasharray="3 3" stroke="#00000010" />
              <XAxis dataKey="label" stroke="#877f92" fontSize={10} />
              <YAxis stroke="#877f92" fontSize={11} allowDecimals={false} />
              <Tooltip contentStyle={{ backgroundColor: "#f7f4fc", border: "1px solid #00000020", borderRadius: "10px", color: "#33243d", fontSize: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.55)" }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="units_in" name="Unidades que entran" stroke="#6b1e96" strokeWidth={3} dot={false} />
              <Line type="monotone" dataKey="units_out" name="Unidades que salen" stroke="#b8482f" strokeWidth={2} dot={false} />
            </LineChart>
          ) : chartMode === "area" ? (
            <AreaChart data={movements}>
              <defs>
                <linearGradient id="colorCatIn" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6b1e96" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="#6b1e96" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorCatOut" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#b8482f" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#b8482f" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#00000010" />
              <XAxis dataKey="label" stroke="#877f92" fontSize={10} />
              <YAxis stroke="#877f92" fontSize={11} allowDecimals={false} />
              <Tooltip contentStyle={{ backgroundColor: "#f7f4fc", border: "1px solid #00000020", borderRadius: "10px", color: "#33243d", fontSize: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.55)" }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Area type="monotone" dataKey="units_in" name="Unidades que entran" stroke="#6b1e96" strokeWidth={3} fillOpacity={1} fill="url(#colorCatIn)" />
              <Area type="monotone" dataKey="units_out" name="Unidades que salen" stroke="#b8482f" strokeWidth={2} fillOpacity={1} fill="url(#colorCatOut)" />
            </AreaChart>
          ) : (
            <BarChart data={movements}>
              <CartesianGrid strokeDasharray="3 3" stroke="#00000010" />
              <XAxis dataKey="label" stroke="#877f92" fontSize={10} />
              <YAxis stroke="#877f92" fontSize={11} allowDecimals={false} />
              <Tooltip
                cursor={{ fill: "rgba(168,85,247,0.1)" }}
                contentStyle={{ backgroundColor: "#f7f4fc", border: "1px solid #00000020", borderRadius: "10px", color: "#33243d", fontSize: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.55)" }}
                formatter={(value, _n, entry) => [`${value} movimientos · neto ${entry.payload.net_units} unidades`, entry.payload.label]}
              />
              <Bar dataKey="movements" name="Movimientos" radius={[6, 6, 0, 0]}>
                {movements.map((m) => (
                  <Cell key={m.movement_type} fill={m.color} />
                ))}
              </Bar>
            </BarChart>
          )}
        </ResponsiveContainer>
      </ChartCard>

      {/* Marcas y categorías */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DataTable
          title="Rendimiento por Marca"
          subtitle="Solo las marcas que algún producto usa de verdad"
          searchPlaceholder="Buscar marca..."
          columns={[
            {
              header: "Marca",
              accessor: "brand_name",
              render: (r) => (
                <button
                  onClick={() =>
                    drilldown.open("products", {
                      title: `Productos de la marca "${r.brand_name}"`,
                      filters: { brand_id: r.brand_id, allTime: true }
                    })
                  }
                  className="font-bold text-fx-accent hover:underline text-left"
                >
                  {r.brand_name}
                  {!r.is_active && <span className="ml-2 text-[10px] text-fx-neg font-normal">(inactiva)</span>}
                </button>
              )
            },
            { header: "Productos", accessor: "products", render: (r) => num(r.products) },
            { header: "Precio Prom.", accessor: "avg_price", render: (r) => money(r.avg_price) },
            {
              header: "Margen Prom.",
              accessor: "avg_margin_pct",
              render: (r) => <span className={`font-bold ${marginColor(r.avg_margin_pct)}`}>{r.avg_margin_pct ?? "—"}%</span>
            },
            { header: "Ingresos", accessor: "revenue_usd", render: (r) => <span className="font-bold text-fx-text">{money(r.revenue_usd)}</span> }
          ]}
          data={data?.byBrand || []}
          emptyMessage="Ningún producto tiene marca asignada."
        />

        <DataTable
          title="Rendimiento por Categoría"
          subtitle="Solo las categorías que contienen productos"
          searchPlaceholder="Buscar categoría..."
          columns={[
            {
              header: "Categoría",
              accessor: "category_name",
              render: (r) => (
                <button
                  onClick={() =>
                    drilldown.open("products", {
                      title: `Productos en "${r.category_name}"`,
                      filters: { category_id: r.category_id, allTime: true }
                    })
                  }
                  className="font-bold text-fx-accent hover:underline text-left"
                >
                  {r.category_name}
                </button>
              )
            },
            { header: "Productos", accessor: "products", render: (r) => num(r.products) },
            { header: "Precio Prom.", accessor: "avg_price", render: (r) => money(r.avg_price) },
            {
              header: "Margen Prom.",
              accessor: "avg_margin_pct",
              render: (r) => <span className={`font-bold ${marginColor(r.avg_margin_pct)}`}>{r.avg_margin_pct ?? "—"}%</span>
            },
            { header: "Ingresos", accessor: "revenue_usd", render: (r) => <span className="font-bold text-fx-text">{money(r.revenue_usd)}</span> }
          ]}
          data={data?.byCategory || []}
          emptyMessage="Ninguna categoría tiene productos."
        />
      </div>

      {/* Andamiaje vacío */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DataTable
          title="Marcas Sin un Solo Producto"
          subtitle="Existen en la base y ningún producto las referencia"
          searchPlaceholder="Buscar marca..."
          columns={[
            { header: "Marca", accessor: "brand_name", render: (r) => <span className="font-bold text-fx-text">{r.brand_name}</span> },
            { header: "País", accessor: "country", render: (r) => r.country || "—" },
            {
              header: "Estado",
              accessor: "is_active",
              render: (r) => (
                <span className={r.is_active ? "text-fx-pos" : "text-gray-500"}>
                  {r.is_active ? "Activa" : "Inactiva"}
                </span>
              )
            },
            {
              header: "Creada",
              accessor: "created_at",
              render: (r) => (r.created_at ? new Date(r.created_at).toLocaleDateString("es-VE") : "—")
            }
          ]}
          data={data?.unusedBrands || []}
          emptyMessage="Todas las marcas registradas tienen al menos un producto."
        />

        <DataTable
          title="Categorías Vacías"
          subtitle="Un callejón sin salida para quien navega el catálogo"
          searchPlaceholder="Buscar categoría..."
          columns={[
            { header: "Categoría", accessor: "category_name", render: (r) => <span className="font-bold text-fx-text">{r.category_name}</span> },
            {
              header: "Nivel",
              accessor: "parent_id",
              render: (r) => (
                <span className="text-fx-muted">{r.parent_id ? "Subcategoría" : "Raíz"}</span>
              )
            },
            {
              header: "Estado",
              accessor: "is_active",
              render: (r) => (
                <span className={r.is_active ? "text-fx-pos" : "text-gray-500"}>
                  {r.is_active ? "Activa" : "Inactiva"}
                </span>
              )
            }
          ]}
          data={data?.unusedCategories || []}
          emptyMessage="Todas las categorías tienen productos."
        />
      </div>

      {/* Rotación de inventario */}
      <DataTable
        title="Rotación de Inventario por Producto"
        subtitle="Los movimientos son de todo el histórico: un producto sin movimientos recientes es capital congelado"
        searchPlaceholder="Buscar producto..."
        columns={[
          {
            header: "Producto",
            accessor: "product_name",
            render: (r) => (
              <button
                onClick={() =>
                  drilldown.open("stock_movements", {
                    title: `Movimientos de "${r.product_name}"`,
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
          { header: "Movimientos", accessor: "movements", render: (r) => num(r.movements) },
          { header: "Vendidas", accessor: "sold_units", render: (r) => <span className="text-fx-pos font-bold">{num(r.sold_units)}</span> },
          { header: "Repuestas", accessor: "restocked_units", render: (r) => num(r.restocked_units) },
          { header: "Stock Actual", accessor: "last_known_stock", render: (r) => <span className="font-bold text-fx-text">{num(r.last_known_stock)}</span> },
          {
            header: "Último Movimiento",
            accessor: "last_movement_at",
            render: (r) => (r.last_movement_at ? new Date(r.last_movement_at).toLocaleDateString("es-VE") : "—")
          }
        ]}
        data={data?.stockByProduct || []}
        emptyMessage="Todavía no se ha registrado ningún movimiento de inventario."
      />

      {/* Cambios de precio */}
      <DataTable
        title="Cambios de Precio del Período"
        subtitle="Quién movió qué y en qué dirección"
        searchPlaceholder="Buscar producto..."
        columns={[
          {
            header: "Fecha",
            accessor: "created_at",
            render: (r) => new Date(r.created_at).toLocaleDateString("es-VE")
          },
          {
            header: "Producto",
            accessor: "product_name",
            render: (r) => (
              <button
                onClick={() =>
                  drilldown.open("price_history", {
                    title: `Historial de precios de "${r.product_name}"`,
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
          { header: "Antes", accessor: "old_price", render: (r) => <span className="text-fx-muted">{money(r.old_price)}</span> },
          { header: "Después", accessor: "new_price", render: (r) => money(r.new_price) },
          {
            header: "Variación",
            accessor: "price_change_pct",
            render: (r) => {
              const v = parseFloat(r.price_change_pct);
              if (!Number.isFinite(v)) return "—";
              return (
                <span className={`font-semibold ${v > 0 ? "text-fx-pos" : "text-fx-neg"}`}>
                  {v > 0 ? "+" : ""}{v}%
                </span>
              );
            }
          },
          { header: "Origen", accessor: "change_source", render: (r) => <span className="text-fx-muted">{r.change_source || "—"}</span> }
        ]}
        data={data?.priceChanges || []}
        emptyMessage="Nadie cambió un precio en este período."
      />

      {/* Erosión de margen */}
      {(data?.marginErosion?.length || 0) > 0 && (
        <DataTable
          title="Cambios de Precio que Erosionaron el Margen"
          subtitle="Bajaron el precio sin que bajara el costo: la rebaja salió del bolsillo de la tienda"
          searchPlaceholder="Buscar producto..."
          columns={[
            {
              header: "Fecha",
              accessor: "created_at",
              render: (r) => new Date(r.created_at).toLocaleDateString("es-VE")
            },
            {
            header: "Producto",
            accessor: "product_name",
            render: (r) => (
              <button
                onClick={() =>
                  drilldown.open("price_history", {
                    title: `Historial de precios de "${r.product_name}"`,
                    filters: { product_id: r.product_id, allTime: true }
                  })
                }
                className="font-bold text-fx-accent hover:underline text-left"
              >
                {r.product_name}
              </button>
            )
          },
            { header: "Antes", accessor: "old_price", render: (r) => money(r.old_price) },
            { header: "Después", accessor: "new_price", render: (r) => money(r.new_price) },
            {
              header: "Margen Antes",
              accessor: "margin_before_pct",
              render: (r) => <span className={marginColor(r.margin_before_pct)}>{r.margin_before_pct}%</span>
            },
            {
              header: "Margen Después",
              accessor: "margin_after_pct",
              render: (r) => <span className={`font-semibold ${marginColor(r.margin_after_pct)}`}>{r.margin_after_pct}%</span>
            }
          ]}
          data={data.marginErosion}
        />
      )}

      <DrilldownModal {...drilldown.props} period={period} />
    </div>
  );
}
