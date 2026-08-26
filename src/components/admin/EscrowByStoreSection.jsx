import { useState, useMemo } from "react";
import PropTypes from "prop-types";
import SearchableSelect from "../ui/SearchableSelect";
import "../ui/SearchableSelect.css";
import { WalletIcon, ClockIcon, TagIcon, SearchIcon } from "../ui/FilterIcons";
import { reverseEscrowItemAPI } from "../../services/api";
import toast from "react-hot-toast";

/**
 * Vista de custodia dentro de Gestión de Retiros: cuánto retiene la plataforma y de quién
 * es ese dinero.
 *
 * Es presentacional a propósito. Los datos los carga `AdminPayouts`, porque la pestaña
 * necesita mostrar el total retenido en su propio botón antes de que nadie entre aquí; si
 * este componente los pidiera, la cifra no existiría hasta abrirlo.
 *
 * Los importes salen de `v_escrow_items` (migración 055), la misma vista que alimenta la
 * pestaña de Finanzas, así que las dos pantallas no pueden discrepar.
 */

const money = (v) => `$${Number(v || 0).toFixed(2)}`;

// Un cero repetido en tres columnas es ruido: solo se escribe el importe que existe.
const moneyOrDash = (v) =>
  Number(v || 0) === 0 ? <span className="text-gray-300">—</span> : money(v);

const SITUACIONES = [
  { value: "all", label: "Todas las Situaciones" },
  { value: "claimable", label: "💰 Con dinero exigible" },
  { value: "transit", label: "🚚 Solo en tránsito" },
  { value: "legacy", label: "🗄️ Con legado" }
];

const ANTIGUEDADES = [
  { value: "all", label: "Cualquier Antigüedad" },
  { value: "30", label: "⏳ Más de 30 días" },
  { value: "90", label: "🚨 Más de 90 días" }
];

const BILLETERAS = [
  { value: "all", label: "Todas las Billeteras" },
  { value: "mismatch", label: "⚠️ Solo descuadradas" }
];

const COLUMNAS = [
  { key: "store_name", label: "Tienda", align: "left" },
  { key: "in_transit", label: "En tránsito", align: "right" },
  { key: "claimable", label: "Ya exigible", align: "right" },
  { key: "retained", label: "Retenido", align: "right" },
  { key: "legacy", label: "Legado", align: "right" },
  { key: "oldest_days", label: "Más antiguo", align: "right" }
];

const ETAPAS = {
  sin_despachar: "Pagado sin despachar",
  despachado_sin_entregar: "Enviado sin entregar",
  entregado_sin_liberar: "Entregado sin pagar",
  reembolso_sin_pagar: "Reembolso sin pagar"
};

const CLASE_ITEM = {
  claimable: { label: "Exigible", cls: "bg-amber-50 text-amber-700" },
  in_transit: { label: "En tránsito", cls: "bg-gray-100 text-gray-600" },
  legacy: { label: "Legado", cls: "bg-gray-100 text-gray-400" }
};

// Descuadre contable: lo que dice el saldo de la tienda contra lo que suma su libro mayor.
//
// Antes esto comparaba `wallet_pending` con `retained`. Esa comparación no podía dar verde
// nunca: `balance_pending` era una columna que nadie mantenía y valía 0.00 en todas las
// billeteras, así que cualquier tienda con escrow vivo salía en rojo permanentemente y la
// alarma no informaba de nada. Desde la migración 061 esa columna es un espejo de la misma
// vista de la que sale `retained`, o sea que compararlas sería compararla consigo misma.
//
// El invariante que sí puede romperse — y que de hecho estaba roto en $777.10 — es que el
// saldo disponible coincida con la suma de los asientos que lo produjeron. Es el mismo que
// vigila la pestaña de Tesorería.
const CENTIMO = 0.005;
const desfase = (s) => Number(s.balance_available || 0) - Number(s.ledger_sum || 0);
const descuadrada = (s) => Math.abs(desfase(s)) >= CENTIMO;

export default function EscrowByStoreSection({ data, loading, error, onReload }) {
  const [busqueda, setBusqueda] = useState("");
  const [situacion, setSituacion] = useState("all");
  const [antiguedad, setAntiguedad] = useState("all");
  const [billetera, setBilletera] = useState("all");
  const [orden, setOrden] = useState({ col: "retained", dir: "desc" });
  const [revirtiendo, setRevirtiendo] = useState(null);
  const [abierta, setAbierta] = useState(null);

  const tiendas = useMemo(() => data?.byStore || [], [data]);

  const visibles = useMemo(() => {
    const term = busqueda.trim().toLowerCase();

    const filtradas = tiendas.filter((s) => {
      if (term && !`${s.store_name} ${s.rif || ""}`.toLowerCase().includes(term)) return false;
      if (situacion === "claimable" && Number(s.claimable) <= 0) return false;
      if (situacion === "transit" && !(Number(s.in_transit) > 0 && Number(s.claimable) === 0)) return false;
      if (situacion === "legacy" && Number(s.legacy) <= 0) return false;
      if (antiguedad !== "all" && Number(s.oldest_days) <= Number(antiguedad)) return false;
      if (billetera === "mismatch" && !descuadrada(s)) return false;
      return true;
    });

    const { col, dir } = orden;
    const signo = dir === "asc" ? 1 : -1;
    return [...filtradas].sort((a, b) => {
      if (col === "store_name") return signo * String(a.store_name).localeCompare(String(b.store_name));
      return signo * (Number(a[col]) - Number(b[col]));
    });
  }, [tiendas, busqueda, situacion, antiguedad, billetera, orden]);

  const retenidoVisible = visibles.reduce((s, r) => s + Number(r.retained), 0);
  const hayFiltro = Boolean(busqueda.trim()) || situacion !== "all" || antiguedad !== "all" || billetera !== "all";

  const alternarOrden = (col) =>
    setOrden((o) => (o.col === col ? { col, dir: o.dir === "desc" ? "asc" : "desc" } : { col, dir: "desc" }));

  // Recuperar el dinero de una venta ya pagada. Solo tiene sentido sobre lo ya liberado,
  // así que el botón únicamente aparece en esos ítems.
  const revertir = async (item, tienda) => {
    const motivo = window.prompt(
      `Revertir el pago de "${item.product_name}" (${money(item.amount_usd)}) a ${tienda}.` +
        "\n\nSe le cobrará a la tienda y se abrirá el reembolso al comprador." +
        "\n\nMotivo:"
    );
    if (motivo === null) return;
    if (motivo.trim().length < 5) {
      toast.error("Escribe un motivo de al menos 5 caracteres.");
      return;
    }

    setRevirtiendo(item.item_id);
    try {
      const { data: res } = await reverseEscrowItemAPI(item.item_id, motivo.trim());
      const deuda = Number(res?.data?.breakdown?.new_debt || 0);
      toast.success(
        deuda > 0
          ? `Pago revertido. La tienda no tenía saldo suficiente: quedan ${money(deuda)} como deuda.`
          : "Pago revertido y cobrado a la tienda."
      );
      onReload();
    } catch (err) {
      toast.error(err.response?.data?.error || "No se pudo revertir el pago.");
    } finally {
      setRevirtiendo(null);
    }
  };

  const limpiar = () => {
    setBusqueda("");
    setSituacion("all");
    setAntiguedad("all");
    setBilletera("all");
  };

  if (loading && !data) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-16 text-center">
        <div className="w-10 h-10 border-4 border-gray-200 border-t-[#6b1e96] rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-gray-400">Calculando el dinero en custodia…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-100 rounded-2xl p-6 flex items-center justify-between gap-4">
        <p className="text-sm text-red-600">{error}</p>
        <button onClick={onReload} className="text-xs font-bold text-red-700 hover:text-red-900 underline shrink-0">
          Reintentar
        </button>
      </div>
    );
  }

  if (!data) return null;

  const tarjetas = [
    {
      label: "Retenido ahora",
      amount: data.retainedUsd,
      sub: `${data.liveItems} ítems · ${data.stores} tiendas`,
      cls: "border-purple-200 bg-purple-50/70",
      text: "text-[#6b1e96]"
    },
    {
      label: "Ya exigible",
      amount: data.claimableUsd,
      sub: "entregado sin liberar",
      cls: "border-amber-200 bg-amber-50/70",
      text: "text-amber-700"
    },
    {
      label: "En tránsito",
      amount: data.inTransitUsd,
      sub: "aún sin entregar",
      cls: "border-gray-200 bg-white",
      text: "text-gray-500"
    },
    {
      label: "Legado pre-escrow",
      amount: data.legacyUsd,
      sub: `${data.legacyItems} ítems · fuera del sistema`,
      cls: "border-gray-200 bg-white",
      text: "text-gray-500"
    }
  ];

  // Dinero que no es de las tiendas pero tampoco de la plataforma: aprobado para devolver
  // y todavía sin pagar. Antes no aparecía en ninguna pantalla.
  if (data.owedToBuyersUsd > 0) {
    tarjetas.push({
      label: "Por devolver a compradores",
      amount: data.owedToBuyersUsd,
      sub: `${data.owedToBuyersCount} reembolsos aprobados sin pagar`,
      cls: "border-rose-200 bg-rose-50/70",
      text: "text-rose-700"
    });
  }

  if (data.storeDebtUsd > 0) {
    tarjetas.push({
      label: "Deuda de tiendas",
      amount: data.storeDebtUsd,
      sub: `${data.storesInDebt} tiendas · se cobra de sus próximas ventas`,
      cls: "border-gray-300 bg-gray-50",
      text: "text-gray-700"
    });
  }

  const atascado = (data.stuck || []).filter((e) => e.items > 0);

  return (
    <div className="space-y-4">
      {/* Resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {tarjetas.map((k) => (
          <div key={k.label} className={`rounded-2xl border p-4 shadow-sm ${k.cls}`}>
            <span className={`block text-[10px] font-bold uppercase tracking-widest ${k.text}`}>{k.label}</span>
            <div className="text-2xl font-black text-gray-900 font-mono mt-1">{money(k.amount)}</div>
            <span className="text-xs text-gray-500 font-medium">{k.sub}</span>
          </div>
        ))}
      </div>

      {atascado.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
            <h3 className="text-sm font-bold text-gray-900">Dinero parado</h3>
            <span className="text-[11px] text-gray-500">— lo que lleva más tiempo del debido en cada etapa</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
            {atascado.map((e) => (
              <div key={e.etapa} className="px-4 py-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                  {ETAPAS[e.etapa] || e.etapa}
                </p>
                <p className="text-lg font-black text-gray-900 font-mono">{money(e.montoUsd)}</p>
                <p className="text-[11px] text-gray-500">
                  {e.items} {e.items === 1 ? "ítem" : "ítems"} · hasta {e.diasMax} días
                </p>
                {e.fueraDeAutomatismo > 0 && (
                  <p className="text-[11px] text-red-600 font-semibold mt-0.5">
                    {e.fueraDeAutomatismo} sin resolver solos
                  </p>
                )}
              </div>
            ))}
          </div>
          <p className="px-4 py-2 bg-gray-50 border-t border-gray-100 text-[11px] text-gray-500">
            «Sin resolver solos» son los anteriores al corte de automatización: ningún proceso
            automático los tocará, hay que decidirlos a mano.
          </p>
        </div>
      )}

      {/* ── Buscador y Filtros ── */}
      <div
        style={{
          background: "#fff",
          borderRadius: "16px",
          border: "1px solid #f0f0f0",
          padding: "16px 20px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        }}
      >
        {/* Buscador */}
        <div style={{ position: "relative", marginBottom: "16px" }}>
          <SearchIcon style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#9ca3af" }} />
          <input
            type="text"
            placeholder="Buscar por nombre comercial o RIF de la tienda..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            style={{
              width: "100%",
              padding: "12px 14px 12px 42px",
              borderRadius: "10px",
              border: "1.5px solid #e5e7eb",
              fontSize: "13px",
              outline: "none",
              transition: "border-color 0.2s, box-shadow 0.2s",
              background: "#fafafa",
              color: "#1f2937",
              boxSizing: "border-box",
            }}
            onFocus={(e) => { e.target.style.borderColor = "#6b1e96"; e.target.style.background = "#fff"; e.target.style.boxShadow = "0 0 0 3px rgba(107,30,150,0.08)"; }}
            onBlur={(e) => { e.target.style.borderColor = "#e5e7eb"; e.target.style.background = "#fafafa"; e.target.style.boxShadow = "none"; }}
          />
        </div>

        {/* Fila de filtros */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center" }}>
          {/* Situación */}
          <div style={{ flex: "1 1 190px", minWidth: "170px" }}>
            <SearchableSelect
              options={SITUACIONES}
              value={situacion}
              onChange={setSituacion}
              placeholder="Todas las Situaciones"
              searchPlaceholder="Buscar situación..."
              icon={<TagIcon className="h-4 w-4" />}
            />
          </div>

          {/* Antigüedad */}
          <div style={{ flex: "1 1 190px", minWidth: "170px" }}>
            <SearchableSelect
              options={ANTIGUEDADES}
              value={antiguedad}
              onChange={setAntiguedad}
              placeholder="Cualquier Antigüedad"
              searchPlaceholder="Buscar antigüedad..."
              icon={<ClockIcon className="h-4 w-4" />}
            />
          </div>

          {/* Billetera */}
          <div style={{ flex: "1 1 190px", minWidth: "170px" }}>
            <SearchableSelect
              options={BILLETERAS}
              value={billetera}
              onChange={setBilletera}
              placeholder="Todas las Billeteras"
              searchPlaceholder="Buscar..."
              icon={<WalletIcon className="h-4 w-4" />}
            />
          </div>

          {/* Recargar la custodia: el botón "Sincronizar" de la cabecera sólo refresca las solicitudes */}
          <button
            onClick={onReload}
            disabled={loading}
            style={{ flex: "0 0 auto", display: "flex", alignItems: "center", gap: "6px", padding: "10px 16px", borderRadius: "8px", border: "1px solid #e5e7eb", background: "#fff", color: "#374151", fontSize: "12px", fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1, transition: "all 0.2s" }}
          >
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182" />
            </svg>
            {loading ? "Actualizando…" : "Actualizar"}
          </button>

          {/* Limpiar filtros */}
          {hayFiltro && (
            <button
              onClick={limpiar}
              style={{ flex: "0 0 auto", display: "flex", alignItems: "center", gap: "6px", padding: "10px 16px", borderRadius: "8px", border: "1.5px solid rgba(107,30,150,0.15)", background: "rgba(107,30,150,0.04)", color: "#6b1e96", fontSize: "12px", fontWeight: 600, cursor: "pointer", transition: "all 0.2s" }}
            >
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
              Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Tabla */}
      {visibles.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center shadow-sm">
          <div className="text-4xl mb-3">🔒</div>
          <p className="text-sm text-gray-500">
            {hayFiltro ? "Ninguna tienda coincide con estos filtros." : "Ninguna tienda tiene dinero retenido."}
          </p>
          {hayFiltro && (
            <button onClick={limpiar} className="mt-3 text-xs font-bold text-[#6b1e96] hover:underline">
              Limpiar filtros
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {COLUMNAS.map((c) => {
                    const activa = orden.col === c.key;
                    return (
                      <th
                        key={c.key}
                        onClick={() => alternarOrden(c.key)}
                        className={`px-4 py-3 text-[10px] font-bold uppercase tracking-widest cursor-pointer select-none hover:text-[#6b1e96] transition-colors ${
                          c.align === "left" ? "text-left" : "text-right"
                        } ${activa ? "text-[#6b1e96]" : "text-gray-500"}`}
                      >
                        {c.label}
                        {activa && <span className="ml-1">{orden.dir === "desc" ? "▼" : "▲"}</span>}
                      </th>
                    );
                  })}
                  <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-gray-500">
                    Su billetera
                  </th>
                </tr>
              </thead>
              <tbody>
                {visibles.map((s) => {
                  const cuadra = !descuadrada(s);
                  const viejo = Number(s.oldest_days) > 30;
                  const open = abierta === s.store_id;
                  return [
                    <tr
                      key={s.store_id}
                      onClick={() => setAbierta(open ? null : s.store_id)}
                      className={`border-b border-gray-100 cursor-pointer transition-colors ${
                        open ? "bg-purple-50/70" : "hover:bg-gray-50/70"
                      }`}
                    >
                      <td className="px-4 py-3">
                        <span className="font-bold text-gray-900">
                          <span className="inline-block w-3 text-gray-400">{open ? "▾" : "▸"}</span> {s.store_name}
                        </span>
                        {s.rif && <span className="block text-[10px] text-gray-400 font-mono ml-3">{s.rif}</span>}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-gray-600">{moneyOrDash(s.in_transit)}</td>
                      <td className={`px-4 py-3 text-right font-mono ${Number(s.claimable) > 0 ? "text-amber-600 font-bold" : ""}`}>
                        {moneyOrDash(s.claimable)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-black text-gray-900">{money(s.retained)}</td>
                      <td className="px-4 py-3 text-right font-mono text-gray-400">{moneyOrDash(s.legacy)}</td>
                      <td className={`px-4 py-3 text-right font-mono ${viejo ? "text-red-600 font-bold" : "text-gray-500"}`}>
                        {s.oldest_days} d
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={(e) => {
                            // Atajo: el chip filtra por descuadradas sin abrir la fila.
                            e.stopPropagation();
                            setBilletera(cuadra ? "all" : "mismatch");
                          }}
                          title={
                            cuadra
                              ? "El saldo disponible coincide con la suma de su libro mayor."
                              : `Su saldo disponible y su libro mayor difieren en ${money(desfase(s))}: hay dinero en la billetera sin asiento que lo explique (o al revés).`
                          }
                          className={`text-[10px] font-bold px-2 py-1 rounded-lg transition-colors ${
                            cuadra ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600 hover:bg-red-100"
                          }`}
                        >
                          {money(s.balance_available)} {cuadra ? "· cuadra" : `· descuadre ${money(desfase(s))}`}
                        </button>
                        {Number(s.wallet_debt) > 0 && (
                          <span
                            className="block mt-1 text-[10px] font-bold px-2 py-1 rounded-lg bg-orange-50 text-orange-600"
                            title="Reembolsos que no se pudieron cobrar de sus saldos. Se descuenta de lo próximo que libere."
                          >
                            debe {money(s.wallet_debt)}
                          </span>
                        )}
                      </td>
                    </tr>,

                    open && (
                      <tr key={`${s.store_id}-detalle`} className="bg-purple-50/70 border-b border-gray-200">
                        <td colSpan={7} className="px-4 py-3">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">
                            Qué le estamos guardando
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                            {s.items.map((it) => {
                              const c = CLASE_ITEM[it.escrow_class] || CLASE_ITEM.in_transit;
                              return (
                                <div key={it.item_id} className="bg-white rounded-lg border border-gray-200 px-3 py-2">
                                  <p className="text-xs font-semibold text-gray-900 truncate">{it.product_name}</p>
                                  <p className="text-[11px] text-gray-500">
                                    <span className="font-mono font-bold text-gray-700">{money(it.amount_usd)}</span>
                                    {" · "}
                                    <span className={`px-1.5 py-0.5 rounded ${c.cls} font-semibold`}>{c.label}</span>
                                    {" · "}
                                    {it.days_held} días
                                  </p>

                                </div>
                              );
                            })}
                          </div>

                          {(s.reversible || []).length > 0 && (
                            <>
                              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mt-3 mb-2">
                                Ya pagado · aún se puede recuperar
                              </p>
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                {s.reversible.map((it) => (
                                  <div key={it.item_id} className="bg-white rounded-lg border border-rose-200 px-3 py-2">
                                    <p className="text-xs font-semibold text-gray-900 truncate">{it.product_name}</p>
                                    <p className="text-[11px] text-gray-500">
                                      <span className="font-mono font-bold text-gray-700">{money(it.amount_usd)}</span>
                                      {" · pagado hace "}
                                      {it.days_since_release} {it.days_since_release === 1 ? "día" : "días"}
                                    </p>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        revertir(it, s.store_name);
                                      }}
                                      disabled={revirtiendo === it.item_id}
                                      className="mt-1 text-[10px] font-bold text-rose-600 hover:text-rose-800 disabled:opacity-40"
                                    >
                                      {revirtiendo === it.item_id ? "Revirtiendo…" : "↩ Revertir pago"}
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </>
                          )}
                        </td>
                      </tr>
                    )
                  ];
                })}
              </tbody>
            </table>
          </div>

          <div className="px-4 py-2.5 bg-gray-50 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2">
            <p className="text-[11px] text-gray-600 font-semibold">
              {hayFiltro
                ? `${visibles.length} de ${tiendas.length} tiendas · ${money(retenidoVisible)} de ${money(data.retainedUsd)}`
                : `${tiendas.length} tiendas · ${money(data.retainedUsd)} retenido`}
            </p>
            <p className="text-[11px] text-gray-500">
              <strong className="text-gray-700">Ya exigible</strong> es dinero entregado que la tienda puede
              reclamar hoy · <strong className="text-gray-700">Su billetera</strong> solo se actualiza al
              reconciliarla a mano
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

EscrowByStoreSection.propTypes = {
  data: PropTypes.object,
  loading: PropTypes.bool,
  error: PropTypes.string,
  onReload: PropTypes.func.isRequired
};
