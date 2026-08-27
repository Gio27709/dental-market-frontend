import { useState, useEffect, useMemo } from "react";
import PropTypes from "prop-types";
import api from "../../services/api";
import toast from "react-hot-toast";
import { refrescarMetodosDePago } from "../../hooks/usePaymentMethods";
import { PAYMENT_METHODS_RESPALDO } from "../../utils/constants";

/**
 * Métodos de cobro: los que ve el comprador en el checkout y en el footer.
 *
 * Se edita todo en local y se guarda la lista ENTERA de una vez. No es pereza: el orden es
 * el que ve el comprador, y las dos reglas que hay que hacer cumplir — que no falten los
 * indispensables y que quede al menos uno activo — son de la lista completa. Guardando
 * método a método se comprobarían sobre un estado a medias.
 *
 * Aquí se editan DATOS BANCARIOS REALES. Un dedazo en un número de cuenta manda el dinero
 * de tus compradores a ninguna parte, así que cada tarjeta lleva debajo la vista previa
 * exacta de lo que verá el comprador, y guardar pide confirmación.
 */

const CLAVE_VALIDA = /^[a-z0-9_]{2,30}$/;

/**
 * La clave se genera sola a partir del nombre y NUNCA se puede escribir a mano.
 *
 * Es el identificador que queda grabado en cada pedido (`orders.payment_method`), así que
 * cambiarlo desvincularía del método todos los pedidos ya cobrados con él. Antes se podía
 * teclear al crear un método y había un aviso pidiendo cuidado; pedir cuidado no es una
 * salvaguarda. Ahora el campo no existe y el problema tampoco.
 *
 * Solo se recalcula mientras el método está SIN GUARDAR. En cuanto se guarda queda congelada,
 * aunque después le cambies el nombre visible — que es justo lo que la hace segura de tocar.
 */
const generarClave = (label, tomadas) => {
  const base = (label || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // fuera tildes: "Pago Móvil" -> "pago_movil"
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 30)
    .replace(/_+$/, "");

  if (base.length < 2) return "";
  if (!tomadas.has(base)) return base;
  // Dos métodos que se llamen parecido no pueden compartir clave.
  for (let n = 2; n < 100; n++) {
    const candidato = `${base.slice(0, 27)}_${n}`;
    if (!tomadas.has(candidato)) return candidato;
  }
  return "";
};

// Identidad estable para el `key` de React. No puede ser `m.key`: esa cambia con cada tecla
// mientras escribes el nombre de un método nuevo, y React remontaría la tarjeta en cada
// pulsación, robándole el foco al input.
let contadorNuevos = 0;

const metodoVacio = () => ({
  key: "",
  label: "",
  icon: "💳",
  activo: true,
  fijo: false,
  formulario: "billetera",
  nota: "",
  campos: [{ etiqueta: "", valor: "", copiable: true }],
  archivado: false,
  _nuevo: true,
  _uid: `nuevo-${++contadorNuevos}`,
});

export default function AdminPaymentMethods() {
  const [metodos, setMetodos] = useState([]);
  const [original, setOriginal] = useState("[]");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [verArchivados, setVerArchivados] = useState(false);

  useEffect(() => {
    cargar();
  }, []);

  const cargar = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/admin/settings");
      const desdeServidor = data?.data?.payment_methods?.metodos;
      // Si la migración 070 todavía no se ha aplicado, se parte del respaldo del código en
      // vez de una pantalla vacía: guardar desde aquí crea la clave.
      const lista = Array.isArray(desdeServidor) && desdeServidor.length > 0
        ? desdeServidor
        : PAYMENT_METHODS_RESPALDO;
      const copia = JSON.parse(JSON.stringify(lista));
      setMetodos(copia);
      setOriginal(JSON.stringify(copia));
    } catch (err) {
      console.error(err);
      toast.error("No se pudieron cargar los métodos de pago.");
    } finally {
      setLoading(false);
    }
  };

  const haycambios = useMemo(
    () => JSON.stringify(metodos) !== original,
    [metodos, original]
  );

  const activos = metodos.filter((m) => m.activo);
  const archivados = metodos.filter((m) => m.archivado);
  // Los extremos se calculan sobre los NO archivados: si el último de la lista está en el
  // cajón, la flecha de bajar del anterior tiene que salir deshabilitada.
  const indicesVisibles = metodos.map((m, i) => (m.archivado ? -1 : i)).filter((i) => i >= 0);
  const primerVisible = indicesVisibles[0];
  const ultimoVisible = indicesVisibles[indicesVisibles.length - 1];

  // ── Mutaciones locales ──
  const actualizar = (i, cambios) =>
    setMetodos((prev) => prev.map((m, idx) => (idx === i ? { ...m, ...cambios } : m)));

  /**
   * Cambiar el nombre visible es seguro y libre. Si el método todavía no se ha guardado, se
   * le recalcula la clave de paso; si ya existe, la clave ni se toca.
   */
  const cambiarNombre = (i, label) =>
    setMetodos((prev) =>
      prev.map((m, idx) => {
        if (idx !== i) return m;
        if (!m._nuevo) return { ...m, label };
        const tomadas = new Set(prev.filter((_, j) => j !== i).map((x) => x.key).filter(Boolean));
        return { ...m, label, key: generarClave(label, tomadas) };
      })
    );

  // Salta los archivados: reordenar tiene que mover el método al hueco anterior o siguiente
  // de la lista que el comprador ve de verdad, no al de un archivado que nadie ve.
  const mover = (i, delta) =>
    setMetodos((prev) => {
      let destino = i + delta;
      while (destino >= 0 && destino < prev.length && prev[destino].archivado) destino += delta;
      if (destino < 0 || destino >= prev.length) return prev;
      const copia = [...prev];
      [copia[i], copia[destino]] = [copia[destino], copia[i]];
      return copia;
    });

  /**
   * Archivar sustituye a eliminar. No se borra nada nunca: detrás de un método hay pedidos,
   * pagos y comprobantes colgando de su clave. Archivar solo lo saca de en medio, y se
   * deshace con Restaurar.
   */
  const archivar = (i) => {
    const m = metodos[i];
    if (m.fijo) return;
    actualizar(i, { archivado: true, activo: false });
  };

  // Vuelve del cajón, pero apagado: encenderlo es una decisión aparte y consciente.
  const restaurar = (i) => actualizar(i, { archivado: false, activo: false });

  const actualizarCampo = (i, j, cambios) =>
    actualizar(i, {
      campos: metodos[i].campos.map((c, idx) => (idx === j ? { ...c, ...cambios } : c)),
    });

  const anadirCampo = (i) =>
    actualizar(i, { campos: [...metodos[i].campos, { etiqueta: "", valor: "", copiable: true }] });

  const quitarCampo = (i, j) =>
    actualizar(i, { campos: metodos[i].campos.filter((_, idx) => idx !== j) });

  // ── Validación local, la misma que aplica el backend ──
  const problemas = useMemo(() => {
    const errores = [];
    const vistos = new Set();

    metodos.forEach((m, i) => {
      const nombre = m.label?.trim() || m.key || `Método ${i + 1}`;
      // El usuario ya no escribe la clave, así que un fallo aquí solo puede venir de un
      // nombre del que no se puede sacar identificador (vacío o solo símbolos).
      if (!m.label?.trim()) {
        errores.push(`Método ${i + 1}: falta el nombre.`);
      } else if (!CLAVE_VALIDA.test(m.key || "")) {
        errores.push(`"${nombre}": el nombre necesita al menos dos letras o números; solo con símbolos no se puede identificar el método.`);
      } else if (vistos.has(m.key)) {
        errores.push(`"${nombre}" choca con otro método que ya existe. Dale un nombre algo distinto.`);
      } else {
        vistos.add(m.key);
      }
      m.campos.forEach((c, j) => {
        if (!c.etiqueta?.trim() || !c.valor?.trim()) {
          errores.push(`"${nombre}": el dato ${j + 1} está incompleto.`);
        }
      });
    });

    ["transferencia", "pago_movil"].forEach((k) => {
      if (!vistos.has(k)) errores.push(`Falta el método indispensable "${k}".`);
    });
    if (activos.length === 0) errores.push("Debe quedar al menos un método activo.");

    return errores;
  }, [metodos, activos.length]);

  const guardar = async () => {
    try {
      setSaving(true);
      // `_nuevo` y `_uid` son marcas de la UI; no viajan al servidor.
      const payload = metodos.map(({ _nuevo, _uid, ...m }) => m); // eslint-disable-line no-unused-vars
      await api.put("/admin/settings/payment-methods", { metodos: payload });
      await refrescarMetodosDePago();
      const copia = JSON.parse(JSON.stringify(metodos.map((m) => ({ ...m, _nuevo: false }))));
      setMetodos(copia);
      setOriginal(JSON.stringify(copia));
      setConfirmando(false);
      toast.success("Métodos de pago actualizados.");
    } catch (err) {
      toast.error(err?.response?.data?.error || "No se pudieron guardar los métodos de pago.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-40 rounded-2xl bg-gray-100 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      {/* ─── Cabecera ─── */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-full bg-purple-100 text-[#6b1e96] flex items-center justify-center">
            <span className="material-symbols-outlined text-[20px]">account_balance_wallet</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 font-['Manrope']">Métodos de Pago</h1>
        </div>
        <p className="text-gray-600 text-[15px] leading-relaxed max-w-3xl">
          Con lo que aquí configures cobras. Estos son los métodos que el comprador ve en el
          checkout y en el pie de página, con los datos de cuenta a los que te va a pagar.
          <strong> Transferencia y Pago Móvil no se pueden desactivar</strong>: son el suelo
          que garantiza que siempre haya con qué pagar.
        </p>
        <p className="text-gray-500 text-sm leading-relaxed max-w-3xl mt-2">
          Un método nunca se borra, porque detrás quedan pedidos y pagos suyos. Se retira en
          dos pasos, y los dos se deshacen: <strong>desactivar</strong> lo quita del checkout
          pero lo deja a la vista aquí, y <strong>archivar</strong> lo manda al cajón de abajo.
          Archivado o no, sus pedidos viejos siguen mostrando su nombre y saliendo en los filtros.
        </p>
      </div>

      {/* ─── Barra de acciones ─── */}
      <div className="sticky top-0 z-20 -mx-4 md:-mx-8 px-4 md:px-8 py-3 mb-5 bg-white/90 backdrop-blur border-b border-gray-200 flex flex-wrap items-center gap-3">
        <button
          onClick={() => setMetodos((prev) => [...prev, metodoVacio()])}
          className="px-4 py-2 rounded-xl border border-dashed border-[#6b1e96] text-[#6b1e96] text-sm font-bold hover:bg-purple-50 transition-colors cursor-pointer"
        >
          + Añadir método
        </button>

        <span className="text-xs font-semibold text-gray-500">
          {activos.length} activo{activos.length === 1 ? "" : "s"} de {metodos.length - archivados.length}
          {archivados.length > 0 && ` · ${archivados.length} archivado${archivados.length === 1 ? "" : "s"}`}
        </span>

        <div className="ml-auto flex items-center gap-3">
          {haycambios && (
            <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg">
              Cambios sin guardar
            </span>
          )}
          <button
            onClick={cargar}
            disabled={saving || !haycambios}
            className="px-4 py-2 rounded-xl border border-gray-300 text-gray-600 text-sm font-bold hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            Descartar
          </button>
          <button
            onClick={() => setConfirmando(true)}
            disabled={saving || !haycambios || problemas.length > 0}
            className="px-5 py-2 rounded-xl bg-[#6b1e96] text-white text-sm font-black hover:bg-[#7b24ab] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            Guardar cambios
          </button>
        </div>
      </div>

      {problemas.length > 0 && (
        <div className="mb-5 p-4 rounded-xl bg-red-50 border border-red-200">
          <p className="text-sm font-bold text-red-700 mb-2">
            Corrige esto antes de guardar:
          </p>
          <ul className="list-disc list-inside space-y-1">
            {problemas.map((p, i) => (
              <li key={i} className="text-xs text-red-600">{p}</li>
            ))}
          </ul>
        </div>
      )}

      {/* ─── Tarjetas en uso ─── */}
      <div className="space-y-5">
        {metodos.map((m, i) =>
          m.archivado ? null : (
            <TarjetaMetodo
              key={m._uid || m.key}
              metodo={m}
              primero={i === primerVisible}
              ultimo={i === ultimoVisible}
              onActualizar={(cambios) => actualizar(i, cambios)}
              onCambiarNombre={(label) => cambiarNombre(i, label)}
              onMover={(delta) => mover(i, delta)}
              onArchivar={() => archivar(i)}
              onActualizarCampo={(j, cambios) => actualizarCampo(i, j, cambios)}
              onAnadirCampo={() => anadirCampo(i)}
              onQuitarCampo={(j) => quitarCampo(i, j)}
            />
          )
        )}
      </div>

      {/* ─── Cajón de archivados ─── */}
      {archivados.length > 0 && (
        <div className="mt-8 border-t border-gray-200 pt-6">
          <button
            onClick={() => setVerArchivados((v) => !v)}
            className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-800 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">
              {verArchivados ? "expand_more" : "chevron_right"}
            </span>
            Archivados ({archivados.length})
          </button>

          {verArchivados && (
            <>
              <p className="text-xs text-gray-500 mt-2 mb-3 max-w-2xl">
                Retirados del checkout y del pie de página. Siguen existiendo para que los
                pedidos que se cobraron con ellos conserven su nombre y se puedan filtrar.
              </p>
              <div className="space-y-2">
                {metodos.map((m, i) =>
                  !m.archivado ? null : (
                    <div
                      key={m._uid || m.key}
                      className="flex flex-wrap items-center gap-3 border border-gray-200 bg-gray-50 rounded-xl px-4 py-3"
                    >
                      <span className="text-lg opacity-50">{m.icon}</span>
                      <span className="font-bold text-gray-500 text-sm">{m.label}</span>
                      <span className="font-mono text-[11px] text-gray-400">{m.key}</span>
                      <button
                        onClick={() => restaurar(i)}
                        className="ml-auto px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 text-xs font-bold hover:bg-white transition-colors cursor-pointer"
                        title="Vuelve a la lista de arriba, apagado. Encenderlo es un paso aparte."
                      >
                        Restaurar
                      </button>
                    </div>
                  )
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* ─── Confirmación ─── */}
      {confirmando && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl max-h-[85vh] overflow-y-auto">
            <h3 className="text-lg font-black text-gray-900 mb-2">Confirmar métodos de cobro</h3>
            <p className="text-sm text-gray-600 mb-4">
              A partir de guardar, tus compradores pagarán a estos datos. Revísalos.
            </p>
            <div className="space-y-3 mb-5">
              {activos.map((m) => (
                <div key={m.key} className="border border-gray-200 rounded-xl p-3">
                  <p className="text-sm font-bold text-gray-900 mb-1">{m.icon} {m.label}</p>
                  {m.campos.map((c, j) => (
                    <p key={j} className="text-xs text-gray-600 font-mono">
                      {c.etiqueta}: <strong className="text-gray-900">{c.valor}</strong>
                    </p>
                  ))}
                </div>
              ))}
            </div>
            {metodos.some((m) => !m.activo && !m.archivado) && (
              <p className="text-xs text-gray-500 mb-2">
                Quedan apagados: {metodos.filter((m) => !m.activo && !m.archivado).map((m) => m.label).join(", ")}.
              </p>
            )}
            {archivados.length > 0 && (
              <p className="text-xs text-gray-400 mb-4">
                Archivados: {archivados.map((m) => m.label).join(", ")}. Siguen existiendo para sus pedidos viejos.
              </p>
            )}
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmando(false)}
                disabled={saving}
                className="px-4 py-2 rounded-xl border border-gray-300 text-gray-600 text-sm font-bold hover:bg-gray-50 cursor-pointer"
              >
                Volver
              </button>
              <button
                onClick={guardar}
                disabled={saving}
                className="px-5 py-2 rounded-xl bg-[#6b1e96] text-white text-sm font-black hover:bg-[#7b24ab] disabled:opacity-50 cursor-pointer"
              >
                {saving ? "Guardando..." : "Sí, guardar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────

function TarjetaMetodo({
  metodo: m,
  primero,
  ultimo,
  onActualizar,
  onCambiarNombre,
  onMover,
  onArchivar,
  onActualizarCampo,
  onAnadirCampo,
  onQuitarCampo,
}) {
  const inputBase =
    "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#6b1e96]/30 focus:border-[#6b1e96] transition-all";

  return (
    <div
      className={`border rounded-2xl p-5 transition-all ${
        m.activo ? "border-gray-200 bg-white" : "border-gray-200 bg-gray-50 opacity-75"
      }`}
    >
      {/* Cabecera de la tarjeta */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <input
          value={m.icon}
          onChange={(e) => onActualizar({ icon: e.target.value })}
          className="w-14 px-2 py-2 border border-gray-300 rounded-lg text-center text-lg"
          aria-label="Icono"
        />
        <input
          value={m.label}
          onChange={(e) => onCambiarNombre(e.target.value)}
          placeholder="Nombre visible"
          className={`${inputBase} flex-1 min-w-[160px] font-bold`}
        />
        {/* Identificador interno: se enseña porque es lo que aparece en los filtros y en las
            exportaciones, pero no se edita ni al crear. */}
        <span
          className="px-3 py-2 rounded-lg bg-gray-100 border border-gray-200 font-mono text-xs text-gray-400 select-all"
          title="Identificador interno. Se genera solo a partir del nombre y luego queda fijo, porque es el que guardan los pedidos ya cobrados."
        >
          {m.key || "se genera solo"}
        </span>

        <div className="flex items-center gap-1 ml-auto">
          <button
            onClick={() => onMover(-1)}
            disabled={primero}
            className="w-8 h-8 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            title="Subir"
          >
            ↑
          </button>
          <button
            onClick={() => onMover(1)}
            disabled={ultimo}
            className="w-8 h-8 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            title="Bajar"
          >
            ↓
          </button>
          <button
            onClick={onArchivar}
            disabled={m.fijo}
            className="h-8 px-2.5 rounded-lg border border-gray-200 text-gray-500 text-xs font-bold hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1"
            title={m.fijo
              ? "Método indispensable: no se puede archivar"
              : "Archivar: lo retira del checkout y del panel del día a día. No borra nada y se deshace con Restaurar."}
          >
            <span className="material-symbols-outlined text-[15px]">inventory_2</span>
            Archivar
          </button>
        </div>

        <button
          onClick={() => !m.fijo && onActualizar({ activo: !m.activo })}
          disabled={m.fijo}
          className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
            m.fijo ? "bg-gray-300 cursor-not-allowed" : m.activo ? "bg-[#c3ff00] cursor-pointer" : "bg-gray-300 cursor-pointer"
          }`}
          title={m.fijo ? "Método indispensable: siempre activo" : m.activo ? "Desactivar" : "Activar"}
          aria-pressed={m.activo}
        >
          <span className="sr-only">Activar método</span>
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform duration-300 ${
              m.activo ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
      </div>

      {m.fijo && (
        <p className="text-[11px] text-gray-500 mb-4 flex items-center gap-1">
          <span className="material-symbols-outlined text-[14px]">lock</span>
          Método indispensable. Puedes cambiar sus datos, pero no apagarlo ni eliminarlo.
        </p>
      )}

      {/* Tipo de formulario */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-[11px] font-extrabold text-gray-500 uppercase tracking-wider mb-1.5">
            Qué le pide el comprobante al comprador
          </label>
          <select
            value={m.formulario}
            onChange={(e) => onActualizar({ formulario: e.target.value })}
            className={`${inputBase} cursor-pointer`}
          >
            <option value="banco">Cuenta bancaria — pide teléfono y cédula</option>
            <option value="billetera">Billetera en USD — pide correo y fecha</option>
          </select>
        </div>
        <div>
          <label className="block text-[11px] font-extrabold text-gray-500 uppercase tracking-wider mb-1.5">
            Instrucciones (una línea, arriba de los datos)
          </label>
          <input
            value={m.nota}
            onChange={(e) => onActualizar({ nota: e.target.value })}
            placeholder="Ej: Transfiera el monto exacto a la siguiente cuenta:"
            className={inputBase}
          />
        </div>
      </div>

      {/* Datos de la cuenta */}
      <div className="border-t border-gray-100 pt-4">
        <div className="flex items-center justify-between mb-2">
          <label className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">
            Datos de la cuenta
          </label>
          <button
            onClick={onAnadirCampo}
            className="text-xs text-[#6b1e96] font-bold hover:underline cursor-pointer"
          >
            + Añadir dato
          </button>
        </div>

        <div className="space-y-2">
          {m.campos.map((c, j) => (
            <div key={j} className="flex flex-wrap items-center gap-2">
              <input
                value={c.etiqueta}
                onChange={(e) => onActualizarCampo(j, { etiqueta: e.target.value })}
                placeholder="Etiqueta (Banco, Cuenta…)"
                className={`${inputBase} w-40`}
              />
              <input
                value={c.valor}
                onChange={(e) => onActualizarCampo(j, { valor: e.target.value })}
                placeholder="Valor"
                className={`${inputBase} flex-1 min-w-[180px] font-mono`}
              />
              <label className="flex items-center gap-1.5 text-xs text-gray-500 font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={c.copiable !== false}
                  onChange={(e) => onActualizarCampo(j, { copiable: e.target.checked })}
                  className="accent-[#6b1e96]"
                />
                Botón copiar
              </label>
              <button
                onClick={() => onQuitarCampo(j)}
                className="w-8 h-8 rounded-lg border border-gray-200 text-red-500 hover:bg-red-50 cursor-pointer"
                title="Quitar dato"
              >
                ×
              </button>
            </div>
          ))}
          {m.campos.length === 0 && (
            <p className="text-xs text-gray-400 italic">
              Sin datos de cuenta: al comprador no se le mostrarán instrucciones para este método.
            </p>
          )}
        </div>
      </div>

      {/* Vista previa: exactamente lo que verá el comprador */}
      {m.campos.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider mb-2">
            Así lo verá el comprador
          </p>
          <div className="bg-[#6b1e96]/5 border border-[#6b1e96]/10 rounded-xl p-4">
            {m.nota && <p className="text-xs font-semibold text-slate-500 mb-2">{m.nota}</p>}
            <div className="grid grid-cols-3 gap-2 items-center">
              {m.campos.map((c, j) => (
                <div key={j} className="contents">
                  <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    {c.etiqueta || "—"}:
                  </span>
                  <span className="col-span-2 font-mono text-slate-800 font-black bg-white border border-slate-100 px-3 py-1.5 rounded-lg text-xs flex justify-between items-center gap-2">
                    <span className="break-all">{c.valor || "—"}</span>
                    {c.copiable !== false && (
                      <span className="text-[#6b1e96] text-[9px] uppercase font-extrabold flex-shrink-0">
                        Copiar
                      </span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

TarjetaMetodo.propTypes = {
  metodo: PropTypes.object.isRequired,
  primero: PropTypes.bool,
  ultimo: PropTypes.bool,
  onActualizar: PropTypes.func.isRequired,
  onCambiarNombre: PropTypes.func.isRequired,
  onMover: PropTypes.func.isRequired,
  onArchivar: PropTypes.func.isRequired,
  onActualizarCampo: PropTypes.func.isRequired,
  onAnadirCampo: PropTypes.func.isRequired,
  onQuitarCampo: PropTypes.func.isRequired,
};
