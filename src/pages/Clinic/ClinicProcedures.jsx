import { useState, useEffect, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import {
  getClinicProceduresAPI,
  getClinicProcedureLogsAPI,
  createClinicProcedureLogAPI,
  deleteClinicProcedureLogAPI,
  updateClinicMaterialSettingsAPI,
} from "../../services/api";
import { formatCurrencyUSD } from "../../utils/formatters";

/**
 * Consumo de resina por procedimiento (migración 088). El odontólogo anota lo que hizo y
 * se descuentan del inventario los gramos estimados: netos del catálogo × su factor de
 * desperdicio. Todo es un ESTIMADO y así se muestra.
 */

const TAMANOS = [
  { value: "small", label: "Pequeña" },
  { value: "medium", label: "Mediana" },
  { value: "large", label: "Grande" },
];
const TAMANO_LABEL = { small: "pequeña", medium: "mediana", large: "grande" };
const MATERIAL_LABEL = { resina: "Resina", resina_fluida: "Resina fluida" };
const PERIODOS = [7, 30, 90];

const gramos = (n) =>
  `${Number(n || 0).toLocaleString("es-VE", { maximumFractionDigits: 2, minimumFractionDigits: 0 })} g`;

// Fecha de hoy en Caracas (zona del negocio), como YYYY-MM-DD para el input.
const hoyCaracas = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Caracas" }).format(new Date());
const fechaCorta = (ymd) =>
  new Date(`${ymd}T12:00:00`).toLocaleDateString("es-VE", { day: "numeric", month: "short" });

// Último insumo usado por tipo de resina: conveniencia del navegador, puede no estar.
const CLAVE_ULTIMO = "forcepx.clinic.ultimoInsumo";
function leerUltimo() {
  try {
    return JSON.parse(localStorage.getItem(CLAVE_ULTIMO)) || {};
  } catch {
    return {};
  }
}
function guardarUltimo(kind, id) {
  try {
    localStorage.setItem(CLAVE_ULTIMO, JSON.stringify({ ...leerUltimo(), [kind]: id }));
  } catch {
    /* sin almacenamiento: solo se pierde la preselección */
  }
}

const fieldCls =
  "w-full mt-1.5 px-3 py-2.5 bg-[#f9f9ff] border border-[#cdc3d4]/40 rounded-2xl text-base sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#541a97]/30";
const cardCls = "bg-white rounded-3xl border border-[#cdc3d4]/20 shadow-xs";

export default function ClinicProcedures() {
  const [catalogo, setCatalogo] = useState(null);
  const [historial, setHistorial] = useState(null);
  const [dias, setDias] = useState(30);
  const [guardando, setGuardando] = useState(false);

  // Formulario
  const [procedureId, setProcedureId] = useState("");
  const [size, setSize] = useState("medium");
  const [teethCount, setTeethCount] = useState(1);
  const [inventoryId, setInventoryId] = useState("");
  const [performedOn, setPerformedOn] = useState(hoyCaracas);
  const [notes, setNotes] = useState("");

  // Factor de desperdicio
  const [editandoFactor, setEditandoFactor] = useState(false);
  const [factorInput, setFactorInput] = useState("");

  const cargarCatalogo = useCallback(async () => {
    try {
      const res = await getClinicProceduresAPI();
      setCatalogo(res.data.data);
    } catch (err) {
      console.error("Error al cargar procedimientos:", err);
      toast.error("No se pudo cargar el catálogo de procedimientos.");
    }
  }, []);

  const cargarHistorial = useCallback(async (d) => {
    try {
      const res = await getClinicProcedureLogsAPI(d);
      setHistorial(res.data.data);
    } catch (err) {
      console.error("Error al cargar historial:", err);
      toast.error("No se pudo cargar el historial de procedimientos.");
    }
  }, []);

  useEffect(() => {
    cargarCatalogo();
  }, [cargarCatalogo]);

  useEffect(() => {
    cargarHistorial(dias);
  }, [dias, cargarHistorial]);

  const procedimiento = useMemo(
    () => catalogo?.procedures.find((p) => p.id === procedureId) || null,
    [catalogo, procedureId],
  );

  // Insumos que sirven para el procedimiento: los de su tipo y los sin tipo definido.
  const insumosCompatibles = useMemo(() => {
    if (!catalogo || !procedimiento) return [];
    return catalogo.materials.filter((m) => !m.materialKind || m.materialKind === procedimiento.materialKind);
  }, [catalogo, procedimiento]);

  const elegirProcedimiento = (id) => {
    setProcedureId(id);
    const proc = catalogo?.procedures.find((p) => p.id === id);
    if (!proc) return;
    const candidatos = catalogo.materials.filter((m) => !m.materialKind || m.materialKind === proc.materialKind);
    const ultimo = leerUltimo()[proc.materialKind];
    const preferido =
      candidatos.find((m) => m.id === ultimo) ||
      candidatos.find((m) => m.materialKind === proc.materialKind) ||
      candidatos[0];
    setInventoryId(preferido?.id || "");
  };

  const factor = catalogo?.settings.wasteFactor ?? 1.5;
  const insumo = insumosCompatibles.find((m) => m.id === inventoryId) || null;

  const vistaPrevia = useMemo(() => {
    if (!procedimiento) return null;
    const netos = procedimiento.grams[size] * (Number(teethCount) || 0);
    const dispensados = netos * factor;
    const costo = insumo?.productPrice != null ? (dispensados * insumo.productPrice) / insumo.gramsPerUnit : null;
    return { netos, dispensados, costo };
  }, [procedimiento, size, teethCount, factor, insumo]);

  const registrar = async (e) => {
    e.preventDefault();
    if (!procedimiento) {
      toast.error("Elige el procedimiento.");
      return;
    }
    setGuardando(true);
    try {
      const res = await createClinicProcedureLogAPI({
        procedureId,
        size,
        teethCount: Number(teethCount),
        inventoryId: inventoryId || null,
        performedOn,
        notes: notes.trim() || null,
      });
      const d = res.data.data;
      if (d.inventory) {
        guardarUltimo(procedimiento.materialKind, inventoryId);
        toast.success(`Registrado: se descontaron ${gramos(d.deductedGrams)} (quedan ${gramos(d.inventory.gramsRemaining)}).`);
        if (d.inventory.insufficient) {
          toast("Tu inventario decía que quedaba menos resina de la que usaste. Revisa el stock en Mi Inventario.", { icon: "⚠️" });
        } else if (d.inventory.critical) {
          toast("Esa resina ya está en stock crítico.", { icon: "🚨" });
        }
      } else {
        toast.success(`Registrado: ${gramos(d.dispensedGrams)} estimados (sin descontar del inventario).`);
      }
      setTeethCount(1);
      setNotes("");
      await Promise.all([cargarCatalogo(), cargarHistorial(dias)]);
    } catch (err) {
      toast.error(err.response?.data?.message || "No se pudo registrar el procedimiento.");
    } finally {
      setGuardando(false);
    }
  };

  const deshacer = async (log) => {
    const extra = log.deductedGrams > 0 ? ` Se devolverán ${gramos(log.deductedGrams)} al inventario.` : "";
    if (!confirm(`¿Eliminar este registro (${log.procedureName})?${extra}`)) return;
    try {
      await deleteClinicProcedureLogAPI(log.id);
      toast.success("Registro eliminado.");
      await Promise.all([cargarCatalogo(), cargarHistorial(dias)]);
    } catch (err) {
      toast.error(err.response?.data?.message || "No se pudo eliminar el registro.");
    }
  };

  const guardarFactor = async () => {
    const valor = Number(String(factorInput).replace(",", "."));
    try {
      await updateClinicMaterialSettingsAPI({ wasteFactor: valor });
      toast.success("Factor de desperdicio actualizado.");
      setEditandoFactor(false);
      cargarCatalogo();
    } catch (err) {
      toast.error(err.response?.data?.message || "No se pudo guardar el factor.");
    }
  };

  if (!catalogo) {
    return <div className="p-12 text-center text-[#4b4452] font-medium">Cargando procedimientos...</div>;
  }

  const resumen = historial?.summary;

  return (
    <div className="space-y-6 md:space-y-8">
      {/* ── Encabezado ── */}
      <div className={`${cardCls} p-5 md:p-8`}>
        <div className="flex items-center gap-2 mb-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#541a97]"></span>
          <span className="text-xs font-bold text-[#541a97]/80 tracking-widest uppercase">Consumo estimado</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-[#111c2c] tracking-tight flex items-center gap-2 md:gap-3">
          <span className="material-symbols-outlined text-[28px] md:text-[32px] text-[#541a97]" style={{ fontVariationSettings: "'FILL' 1" }}>
            dentistry
          </span>
          Consumo de Resina
        </h1>
        <p className="text-sm md:text-base text-[#4b4452] mt-1 max-w-2xl">
          Anota los procedimientos que haces y descontamos de tu inventario la resina estimada. Así sabes cuánto te
          cuesta cada restauración y cuándo se te va a acabar la jeringa.
        </p>
      </div>

      {catalogo.materials.length === 0 && (
        <div className="bg-[#ffddb9]/30 border border-[#ffb961]/40 rounded-2xl p-4 text-sm text-[#7a4b00] flex gap-3">
          <span className="material-symbols-outlined text-[20px] flex-shrink-0">info</span>
          <p>
            Todavía no tienes resinas con control en gramos. Puedes registrar procedimientos igual, pero para que se
            descuenten ve a{" "}
            <Link to="/clinic/inventory" className="font-bold underline">
              Mi Inventario Clínico
            </Link>
            , edita tu resina y activa «Control en gramos».
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* ── Registro rápido ── */}
        <form onSubmit={registrar} className={`${cardCls} p-5 md:p-6 space-y-4 lg:col-span-3`}>
          <h2 className="text-lg font-bold text-[#111c2c] flex items-center gap-2">
            <span className="material-symbols-outlined text-[#541a97]">add_circle</span>
            Registrar procedimiento
          </h2>

          <div>
            <label htmlFor="proc" className="text-xs font-bold text-[#111c2c]">Procedimiento</label>
            <select id="proc" value={procedureId} onChange={(e) => elegirProcedimiento(e.target.value)} className={fieldCls}>
              <option value="">Elige uno…</option>
              {catalogo.procedures.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                  {p.materialKind === "resina_fluida" ? " (fluida)" : ""}
                </option>
              ))}
            </select>
            {procedimiento?.description && <p className="text-xs text-[#4b4452] mt-1">{procedimiento.description}</p>}
          </div>

          <div>
            <span className="text-xs font-bold text-[#111c2c]">Tamaño</span>
            <div className="grid grid-cols-3 gap-2 mt-1.5" role="radiogroup" aria-label="Tamaño">
              {TAMANOS.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  role="radio"
                  aria-checked={size === t.value}
                  onClick={() => setSize(t.value)}
                  className={`py-2.5 rounded-2xl text-sm font-bold border transition-colors ${
                    size === t.value
                      ? "bg-[#541a97] text-white border-[#541a97]"
                      : "bg-[#f9f9ff] text-[#4b4452] border-[#cdc3d4]/40 hover:bg-[#f0f3ff]"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="dientes" className="text-xs font-bold text-[#111c2c]">Dientes</label>
              <input
                id="dientes"
                type="number"
                inputMode="numeric"
                min="1"
                max="32"
                value={teethCount}
                onChange={(e) => setTeethCount(e.target.value)}
                className={fieldCls}
              />
            </div>
            <div>
              <label htmlFor="fecha" className="text-xs font-bold text-[#111c2c]">Fecha</label>
              <input
                id="fecha"
                type="date"
                max={hoyCaracas()}
                value={performedOn}
                onChange={(e) => setPerformedOn(e.target.value)}
                className={fieldCls}
              />
            </div>
          </div>

          <div>
            <label htmlFor="insumo" className="text-xs font-bold text-[#111c2c]">Resina usada</label>
            <select
              id="insumo"
              value={inventoryId}
              onChange={(e) => setInventoryId(e.target.value)}
              disabled={!procedimiento}
              className={fieldCls}
            >
              <option value="">No descontar del inventario</option>
              {insumosCompatibles.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.productName} — quedan {gramos(m.gramsRemaining)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="notas" className="text-xs font-bold text-[#111c2c]">Nota (opcional)</label>
            <input
              id="notas"
              type="text"
              maxLength={300}
              placeholder="Ej. pieza 36"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={fieldCls}
            />
          </div>

          {vistaPrevia && (
            <div className="bg-[#541a97]/5 border border-[#541a97]/10 rounded-2xl p-4 text-sm text-[#111c2c]">
              <p className="font-bold">≈ {gramos(vistaPrevia.dispensados)} de resina</p>
              <p className="text-xs text-[#4b4452] mt-0.5">
                {gramos(vistaPrevia.netos)} en el diente × {factor.toLocaleString("es-VE")} de desperdicio
                {vistaPrevia.costo != null && <> · costo estimado {formatCurrencyUSD(vistaPrevia.costo)}</>}
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={guardando || !procedimiento}
            className="w-full py-3.5 bg-[#541a97] hover:bg-[#6c38b0] disabled:opacity-50 text-white rounded-2xl font-bold text-sm shadow-md transition-all"
          >
            {guardando ? "Guardando..." : "Registrar"}
          </button>
        </form>

        {/* ── Factor de desperdicio y resinas ── */}
        <div className="space-y-6 lg:col-span-2">
          <div className={`${cardCls} p-5 md:p-6 space-y-3`}>
            <h2 className="text-base font-bold text-[#111c2c] flex items-center gap-2">
              <span className="material-symbols-outlined text-[#541a97]">tune</span>
              Tu factor de desperdicio
            </h2>
            {editandoFactor ? (
              <div className="flex gap-2">
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.05"
                  min={catalogo.settings.min}
                  max={catalogo.settings.max}
                  value={factorInput}
                  onChange={(e) => setFactorInput(e.target.value)}
                  className={`${fieldCls} mt-0`}
                  aria-label="Factor de desperdicio"
                />
                <button type="button" onClick={guardarFactor} className="px-4 bg-[#541a97] text-white rounded-2xl text-xs font-bold">
                  Guardar
                </button>
                <button type="button" onClick={() => setEditandoFactor(false)} className="px-3 border border-[#cdc3d4]/40 rounded-2xl text-xs font-bold text-[#4b4452]">
                  Cancelar
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3">
                <p className="text-3xl font-extrabold text-[#541a97]">× {factor.toLocaleString("es-VE")}</p>
                <button
                  type="button"
                  onClick={() => {
                    setFactorInput(String(factor));
                    setEditandoFactor(true);
                  }}
                  className="px-3 py-2 border border-[#cdc3d4]/40 rounded-xl text-xs font-bold text-[#4b4452] hover:bg-[#f0f3ff]"
                >
                  Ajustar
                </button>
              </div>
            )}
            <p className="text-xs text-[#4b4452]">
              Por cada gramo que queda en el diente, sale esto de la jeringa (sobrante, excesos, lo que queda en la
              punta).{" "}
              {catalogo.settings.calibrations > 0
                ? `Ajustado con tus datos reales ${catalogo.settings.calibrations} ${catalogo.settings.calibrations === 1 ? "vez" : "veces"}.`
                : "Cuando se te acabe una jeringa, márcalo en Mi Inventario con «Se acabó una» y lo ajustamos con tu dato real."}
            </p>
          </div>

          <div className={`${cardCls} p-5 md:p-6 space-y-3`}>
            <h2 className="text-base font-bold text-[#111c2c] flex items-center gap-2">
              <span className="material-symbols-outlined text-[#541a97]">inventory_2</span>
              Tus resinas
            </h2>
            {(historial?.materials || []).length === 0 ? (
              <p className="text-sm text-[#4b4452]">Sin resinas con control en gramos.</p>
            ) : (
              <ul className="divide-y divide-[#cdc3d4]/20">
                {historial.materials.map((m) => (
                  <li key={m.id} className="py-2.5 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-[#111c2c] truncate">{m.productName}</p>
                      <p className="text-xs text-[#4b4452]">
                        {MATERIAL_LABEL[m.materialKind] || "Sin tipo"} · quedan {gramos(m.gramsRemaining)}
                      </p>
                    </div>
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap ${
                        m.daysLeft != null && m.daysLeft <= 7 ? "bg-[#ba1a1a]/10 text-[#ba1a1a]" : "bg-[#f0f3ff] text-[#4b4452]"
                      }`}
                    >
                      {m.daysLeft == null ? "sin uso reciente" : `≈ ${m.daysLeft} días`}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* ── Resumen del periodo ── */}
      <div className={`${cardCls} p-5 md:p-6 space-y-5`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-[#111c2c]">Resumen</h2>
          <div className="flex gap-2" role="radiogroup" aria-label="Periodo">
            {PERIODOS.map((d) => (
              <button
                key={d}
                type="button"
                role="radio"
                aria-checked={dias === d}
                onClick={() => setDias(d)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${
                  dias === d ? "bg-[#541a97] text-white border-[#541a97]" : "border-[#cdc3d4]/40 text-[#4b4452] hover:bg-[#f0f3ff]"
                }`}
              >
                {d} días
              </button>
            ))}
          </div>
        </div>

        {!resumen ? (
          <p className="text-sm text-[#4b4452]">Cargando...</p>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "Procedimientos", value: resumen.procedimientos },
                { label: "Dientes", value: resumen.dientes },
                { label: "Resina estimada", value: gramos(resumen.dispensados) },
                { label: "Costo estimado", value: resumen.conCosto > 0 ? formatCurrencyUSD(resumen.costo) : "—" },
              ].map((k) => (
                <div key={k.label} className="bg-[#f9f9ff] border border-[#cdc3d4]/20 rounded-2xl px-4 py-3">
                  <p className="text-[11px] text-[#4b4452]">{k.label}</p>
                  <p className="text-xl font-extrabold text-[#111c2c]">{k.value}</p>
                </div>
              ))}
            </div>

            {resumen.desglose.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="text-xs font-bold text-[#4b4452] uppercase tracking-wider border-b border-[#cdc3d4]/20">
                      <th className="py-2 pr-3">Procedimiento</th>
                      <th className="py-2 pr-3 text-right">Veces</th>
                      <th className="py-2 pr-3 text-right">Resina</th>
                      <th className="py-2 text-right">Costo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#cdc3d4]/20">
                    {resumen.desglose.map((f) => (
                      <tr key={f.procedureId}>
                        <td className="py-2 pr-3 font-semibold text-[#111c2c]">{f.name}</td>
                        <td className="py-2 pr-3 text-right">{f.veces}</td>
                        <td className="py-2 pr-3 text-right">{gramos(f.dispensados)}</td>
                        <td className="py-2 text-right">{f.costo > 0 ? formatCurrencyUSD(f.costo) : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Historial ── */}
      <div className={`${cardCls} overflow-hidden`}>
        <h2 className="text-lg font-bold text-[#111c2c] p-5 md:p-6 pb-0 md:pb-0">Historial</h2>
        {!historial ? null : historial.logs.length === 0 ? (
          <p className="p-5 md:p-6 text-sm text-[#4b4452]">No hay procedimientos registrados en este periodo.</p>
        ) : (
          <ul className="divide-y divide-[#cdc3d4]/20 mt-3">
            {historial.logs.map((l) => (
              <li key={l.id} className="px-5 md:px-6 py-3 flex items-start gap-3">
                <div className="text-xs font-bold text-[#541a97] bg-[#541a97]/5 rounded-xl px-2 py-1 whitespace-nowrap">
                  {fechaCorta(l.performedOn)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-[#111c2c]">
                    {l.procedureName} {TAMANO_LABEL[l.size]}
                    {l.teethCount > 1 && <span className="text-[#4b4452] font-semibold"> × {l.teethCount} dientes</span>}
                  </p>
                  <p className="text-xs text-[#4b4452]">
                    ≈ {gramos(l.dispensedGrams)}
                    {l.productName ? ` de ${l.productName}` : " (sin descontar)"}
                    {l.cost != null && ` · ${formatCurrencyUSD(l.cost)}`}
                    {l.notes && ` · ${l.notes}`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => deshacer(l)}
                  aria-label="Eliminar registro"
                  title="Eliminar registro"
                  className="p-2 text-[#ba1a1a] hover:bg-[#ba1a1a]/10 rounded-xl"
                >
                  <span className="material-symbols-outlined text-[18px] block">delete</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ── Metodología ── */}
      <details className={`${cardCls} p-5 md:p-6 text-sm text-[#4b4452]`}>
        <summary className="font-bold text-[#111c2c] cursor-pointer">¿De dónde salen estos números?</summary>
        <div className="mt-3 space-y-2">
          <p>
            Son <b>estimados</b>. Los gramos de las clases III, IV y V vienen de un estudio que pesó la resina colocada en
            cada cavidad (Braz J Oral Sci, 2013: 0,027 g, 0,052 g y 0,021 g en promedio). Los de los dientes
            posteriores se calcularon por el volumen típico de la cavidad.
          </p>
          <p>
            Esos gramos son los que quedan en el diente. De la jeringa sale más, por eso se multiplica por tu factor de
            desperdicio, que se ajusta solo cada vez que marcas que se te acabó una jeringa.
          </p>
        </div>
      </details>
    </div>
  );
}
