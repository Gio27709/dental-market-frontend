import { useCallback, useEffect, useId, useState } from "react";
import PropTypes from "prop-types";
import toast from "react-hot-toast";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import {
  getBotResumenAPI,
  getBotRevisionAPI,
  getBotConversacionAPI,
  resolverBotRevisionAPI,
  descartarBotRevisionAPI,
  getBotConocimientoAPI,
  crearBotConocimientoAPI,
  actualizarBotConocimientoAPI,
  borrarBotConocimientoAPI,
} from "../../services/api";

/**
 * Panel del asistente IA (chat flotante de la tienda).
 *
 * - «Por revisar»: mensajes que el bot no supo responder o que al cliente no le gustaron.
 *   Desde aquí el admin «enseña» la respuesta (crea una entrada de conocimiento) o descarta.
 * - «Base de conocimiento»: preguntas y respuestas que el bot usa antes que la IA.
 * - «Uso»: mensajes por día frente al tope global y reparto entre proveedores.
 *
 * Lo usa el dueño, no un técnico: los textos evitan la jerga a propósito.
 */

const DIAS = 14;
const LIM = { pregunta: 300, respuesta: 2000, keywords: 300, minimo: 5 };

const fechaHora = (iso) =>
  iso
    ? new Date(iso).toLocaleString("es-VE", { timeZone: "America/Caracas", day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
    : "—";

// 'YYYY-MM-DD' ya viene en día de negocio: se formatea sin pasar por Date para no correr el día.
const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const diaCorto = (dia) => {
  const [, m, d] = String(dia || "").split("-");
  return m && d ? `${Number(d)} ${MESES[Number(m) - 1] || ""}` : dia;
};

const numero = (n) => Number(n || 0).toLocaleString("es-VE");
const errorDe = (err, fallback) => toast.error(err?.response?.data?.error || fallback);

const listaKeywords = (k) =>
  (Array.isArray(k) ? k : String(k || "").split(","))
    .map((s) => String(s).trim())
    .filter(Boolean);

const rolProveedor = (nombre, i) => {
  const n = String(nombre || "").toLowerCase();
  if (n.includes("groq")) return "principal";
  if (n.includes("cloudflare")) return "respaldo";
  return i === 0 ? "principal" : "respaldo";
};

const nombreProveedor = (p) => {
  const n = String(p || "").toLowerCase();
  if (n.includes("groq")) return "Groq";
  if (n.includes("cloudflare")) return "Cloudflare";
  if (n === "knowledge" || n === "conocimiento") return "Base de conocimiento";
  return p || "Sin proveedor";
};

// ── Piezas comunes ──────────────────────────────────────────────────────────

function Modal({ titulo, onClose, children, pie, ancho = "max-w-lg", bloqueado = false }) {
  const tituloId = useId();
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape" && !bloqueado) onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, bloqueado]);

  return (
    <div
      className="fixed inset-0 z-[100] bg-[#33243d]/45 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4"
      onClick={(e) => e.target === e.currentTarget && !bloqueado && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby={tituloId}
    >
      <div className={`w-full ${ancho} bg-fx-panel rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[92vh]`}>
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-fx-line">
          <h2 id={tituloId} className="text-base font-black text-fx-text">{titulo}</h2>
          <button onClick={onClose} disabled={bloqueado} aria-label="Cerrar" className="p-1.5 rounded-full hover:bg-fx-raised text-fx-faint disabled:opacity-40">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
        <div className="p-5 overflow-y-auto flex-1">{children}</div>
        {pie && <div className="px-5 py-4 border-t border-fx-line flex flex-wrap gap-2 justify-end">{pie}</div>}
      </div>
    </div>
  );
}
Modal.propTypes = {
  titulo: PropTypes.node.isRequired,
  onClose: PropTypes.func.isRequired,
  children: PropTypes.node,
  pie: PropTypes.node,
  ancho: PropTypes.string,
  bloqueado: PropTypes.bool,
};

function Etiqueta({ children, tono = "neutro" }) {
  const tonos = {
    neutro: "bg-fx-raised text-fx-muted",
    alerta: "bg-[#fef9c3] text-[#854d0e]",
    malo: "bg-[#fee2e2] text-[#991b1b]",
    bueno: "bg-[#dcfce7] text-[#166534]",
    info: "bg-[#e0f0f7] text-fx-info",
  };
  return <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${tonos[tono]}`}>{children}</span>;
}
Etiqueta.propTypes = { children: PropTypes.node, tono: PropTypes.string };

function Vacio({ icono = "inbox", texto }) {
  return (
    <div className="p-10 sm:p-12 text-center">
      <span className="material-symbols-outlined text-[36px] text-fx-line-outer">{icono}</span>
      <p className="text-sm text-fx-faint mt-2">{texto}</p>
    </div>
  );
}
Vacio.propTypes = { icono: PropTypes.string, texto: PropTypes.node.isRequired };

const btnPrimario = "inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-[#6b1e96] hover:bg-[#531575] disabled:opacity-40 disabled:cursor-not-allowed transition-colors";
const btnSecundario = "inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold text-fx-accent bg-fx-panel border border-fx-line-strong hover:bg-fx-raised disabled:opacity-40 transition-colors";
const btnSuave = "inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold text-fx-muted bg-fx-raised hover:bg-fx-line disabled:opacity-40 transition-colors";

// ── Formulario de respuesta (enseñar / nueva / editar) ──────────────────────

function Campo({ id, label, ayuda, max, valor, children }) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2 mb-1">
        <label htmlFor={id} className="text-xs font-bold text-fx-muted">{label}</label>
        {max && <span className={`text-[10px] ${valor.length > max ? "text-fx-neg font-bold" : "text-fx-faint"}`}>{valor.length}/{max}</span>}
      </div>
      {children}
      {ayuda && <p className="text-[11px] text-fx-faint mt-1">{ayuda}</p>}
    </div>
  );
}
Campo.propTypes = { id: PropTypes.string.isRequired, label: PropTypes.string.isRequired, ayuda: PropTypes.node, max: PropTypes.number, valor: PropTypes.string, children: PropTypes.node };

function FormularioRespuesta({ titulo, inicial, contexto, textoGuardar, onGuardar, onClose }) {
  const [question, setQuestion] = useState(inicial?.question || "");
  const [answer, setAnswer] = useState(inicial?.answer || "");
  const [keywords, setKeywords] = useState(listaKeywords(inicial?.keywords).join(", "));
  const [guardando, setGuardando] = useState(false);
  const idBase = useId();

  const q = question.trim();
  const a = answer.trim();
  const k = keywords.trim();
  const problema =
    q.length < LIM.minimo ? `La pregunta debe tener al menos ${LIM.minimo} caracteres.`
    : a.length < LIM.minimo ? `La respuesta debe tener al menos ${LIM.minimo} caracteres.`
    : q.length > LIM.pregunta ? `La pregunta admite hasta ${LIM.pregunta} caracteres.`
    : a.length > LIM.respuesta ? `La respuesta admite hasta ${LIM.respuesta} caracteres.`
    : k.length > LIM.keywords ? `Las palabras clave admiten hasta ${LIM.keywords} caracteres.`
    : null;

  const guardar = async (e) => {
    e.preventDefault();
    if (problema) return toast.error(problema);
    setGuardando(true);
    try {
      await onGuardar({ question: q, answer: a, keywords: k });
    } finally {
      setGuardando(false);
    }
  };

  const clasesInput = "w-full p-3 border border-fx-line-strong rounded-xl text-sm text-fx-text focus:outline-none focus:ring-2 focus:ring-[#6b1e96]/30";

  return (
    <Modal
      titulo={titulo}
      onClose={onClose}
      bloqueado={guardando}
      pie={
        <>
          <button type="button" onClick={onClose} disabled={guardando} className={btnSuave}>Cancelar</button>
          <button type="submit" form={`${idBase}-form`} disabled={guardando || !!problema} className={btnPrimario}>
            {guardando ? "Guardando..." : textoGuardar}
          </button>
        </>
      }
    >
      <form id={`${idBase}-form`} onSubmit={guardar} className="space-y-4">
        {contexto}
        <Campo id={`${idBase}-q`} label="Pregunta del cliente" max={LIM.pregunta} valor={question} ayuda="Escríbela como la haría un cliente.">
          <input id={`${idBase}-q`} value={question} onChange={(e) => setQuestion(e.target.value)} className={clasesInput} placeholder="Ej: ¿Hacen envíos a Maracaibo?" autoFocus />
        </Campo>
        <Campo id={`${idBase}-a`} label="Respuesta que debe dar el asistente" max={LIM.respuesta} valor={answer}>
          <textarea id={`${idBase}-a`} value={answer} onChange={(e) => setAnswer(e.target.value)} rows={6} className={clasesInput} placeholder="Ej: Sí, enviamos a todo el país por Zoom, MRW y Tealca." />
        </Campo>
        <Campo id={`${idBase}-k`} label="Palabras clave (opcional)" max={LIM.keywords} valor={keywords} ayuda="Sinónimos o palabras que usaría un cliente, separadas por coma">
          <input id={`${idBase}-k`} value={keywords} onChange={(e) => setKeywords(e.target.value)} className={clasesInput} placeholder="Ej: envío, despacho, delivery, Zulia" />
        </Campo>
      </form>
    </Modal>
  );
}
FormularioRespuesta.propTypes = {
  titulo: PropTypes.string.isRequired,
  inicial: PropTypes.object,
  contexto: PropTypes.node,
  textoGuardar: PropTypes.string.isRequired,
  onGuardar: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};

// ── Conversación completa ───────────────────────────────────────────────────

function Conversacion({ conversationId, resaltarId, onClose }) {
  const [mensajes, setMensajes] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let vivo = true;
    (async () => {
      try {
        const res = await getBotConversacionAPI(conversationId);
        if (vivo) setMensajes(res.data?.data || []);
      } catch (err) {
        if (vivo) { setError(true); errorDe(err, "No se pudo cargar la conversación."); }
      }
    })();
    return () => { vivo = false; };
  }, [conversationId]);

  return (
    <Modal titulo="Conversación completa" onClose={onClose} ancho="max-w-2xl" pie={<button onClick={onClose} className={btnSuave}>Cerrar</button>}>
      {error ? (
        <Vacio icono="error" texto="No se pudo cargar la conversación." />
      ) : !mensajes ? (
        <p className="text-sm text-fx-faint text-center py-8">Cargando...</p>
      ) : mensajes.length === 0 ? (
        <Vacio icono="forum" texto="Esta conversación no tiene mensajes." />
      ) : (
        <ul className="space-y-3">
          {mensajes.map((m) => {
            const esCliente = m.role === "user";
            const resaltado = m.id === resaltarId;
            return (
              <li key={m.id} className={`flex ${esCliente ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${esCliente ? "bg-[#6b1e96] text-white rounded-br-md" : "bg-fx-raised text-fx-text rounded-bl-md"} ${resaltado ? "ring-2 ring-[#eab308] ring-offset-2" : ""}`}>
                  <p className="text-[10px] font-bold uppercase tracking-wider opacity-70 mb-0.5">{esCliente ? "Cliente" : "Asistente"}</p>
                  <p className="text-sm whitespace-pre-wrap break-words">{m.content}</p>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1.5 text-[10px] opacity-75">
                    <span>{fechaHora(m.created_at)}</span>
                    {m.unanswered && <span className="font-bold">· No supo responder</span>}
                    {m.feedback === 1 && <span className="font-bold">· 👍 Le gustó</span>}
                    {m.feedback === -1 && <span className="font-bold">· 👎 No le gustó</span>}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Modal>
  );
}
Conversacion.propTypes = { conversationId: PropTypes.string.isRequired, resaltarId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]), onClose: PropTypes.func.isRequired };

// ── Pestaña: Por revisar ────────────────────────────────────────────────────

const ESTADOS_REVISION = [
  { id: "pending", label: "Pendientes" },
  { id: "resolved", label: "Resueltas" },
  { id: "dismissed", label: "Descartadas" },
];

function TarjetaRevision({ item, onEnsenar, onVer, onDescartar }) {
  const [descartando, setDescartando] = useState(false);
  const pendiente = item.review_status === "pending";

  const descartar = async () => {
    setDescartando(true);
    try { await onDescartar(item); } finally { setDescartando(false); }
  };

  return (
    <article className="p-4 sm:p-5 border-t border-fx-line first:border-t-0">
      <div className="flex flex-wrap items-center gap-2 mb-3">
        {item.unanswered && <Etiqueta tono="alerta"><span className="material-symbols-outlined text-[14px]">help</span>No supo responder</Etiqueta>}
        {item.feedback === -1 && <Etiqueta tono="malo">👎 No le gustó</Etiqueta>}
        {item.review_status === "resolved" && <Etiqueta tono="bueno">Respuesta enseñada</Etiqueta>}
        {item.review_status === "dismissed" && <Etiqueta>Descartada</Etiqueta>}
        <span className="text-[11px] text-fx-faint ml-auto">
          {item.es_visitante ? "Visitante" : item.usuario || "Usuario"} · {fechaHora(item.created_at)}
        </span>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-xl bg-fx-inset p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-fx-faint mb-1">El cliente preguntó</p>
          <p className="text-sm font-semibold text-fx-text whitespace-pre-wrap break-words">{item.pregunta || "—"}</p>
        </div>
        <div className="rounded-xl border border-fx-line p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-fx-faint mb-1">El asistente respondió</p>
          <p className="text-sm text-fx-muted whitespace-pre-wrap break-words">{item.respuesta || "—"}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mt-3">
        {pendiente && (
          <button onClick={() => onEnsenar(item)} className={btnPrimario}>
            <span className="material-symbols-outlined text-[18px]">school</span>Enseñar respuesta
          </button>
        )}
        {item.conversation_id && (
          <button onClick={() => onVer(item)} className={btnSecundario}>
            <span className="material-symbols-outlined text-[18px]">forum</span>Ver conversación
          </button>
        )}
        {pendiente && (
          <button onClick={descartar} disabled={descartando} className={btnSuave}>
            <span className="material-symbols-outlined text-[18px]">close</span>{descartando ? "Descartando..." : "Descartar"}
          </button>
        )}
      </div>
    </article>
  );
}
TarjetaRevision.propTypes = { item: PropTypes.object.isRequired, onEnsenar: PropTypes.func.isRequired, onVer: PropTypes.func.isRequired, onDescartar: PropTypes.func.isRequired };

function PorRevisar({ onCambio }) {
  const [estado, setEstado] = useState("pending");
  const [items, setItems] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [ensenando, setEnsenando] = useState(null);
  const [viendo, setViendo] = useState(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const res = await getBotRevisionAPI(estado);
      setItems(res.data?.data || []);
    } catch (err) {
      errorDe(err, "No se pudo cargar la lista por revisar.");
      setItems([]);
    } finally {
      setCargando(false);
    }
  }, [estado]);

  useEffect(() => { cargar(); }, [cargar]);

  const resolver = async (datos) => {
    try {
      await resolverBotRevisionAPI(ensenando.id, datos);
      toast.success("¡Listo! El asistente ya sabe responder esto.");
      setItems((prev) => prev.filter((i) => i.id !== ensenando.id));
      setEnsenando(null);
      onCambio();
    } catch (err) {
      errorDe(err, "No se pudo guardar la respuesta.");
    }
  };

  const descartar = async (item) => {
    try {
      await descartarBotRevisionAPI(item.id);
      toast.success("Descartada.");
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      onCambio();
    } catch (err) {
      errorDe(err, "No se pudo descartar.");
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2 p-4 border-b border-fx-line">
        <p className="text-xs text-fx-muted">Preguntas que el asistente no supo responder o cuya respuesta no gustó.</p>
        <label className="flex items-center gap-2 text-xs font-bold text-fx-muted">
          Ver
          <select value={estado} onChange={(e) => setEstado(e.target.value)} className="p-2 border border-fx-line-strong rounded-xl text-xs font-bold text-fx-text bg-fx-panel">
            {ESTADOS_REVISION.map((e) => <option key={e.id} value={e.id}>{e.label}</option>)}
          </select>
        </label>
      </div>

      {cargando ? (
        <p className="p-10 text-center text-sm text-fx-faint">Cargando...</p>
      ) : items.length === 0 ? (
        estado === "pending"
          ? <Vacio icono="task_alt" texto="No hay nada por revisar. 🎉" />
          : <Vacio texto={estado === "resolved" ? "Aún no hay preguntas resueltas." : "No hay preguntas descartadas."} />
      ) : (
        <div>
          {items.map((item) => (
            <TarjetaRevision key={item.id} item={item} onEnsenar={setEnsenando} onVer={setViendo} onDescartar={descartar} />
          ))}
        </div>
      )}

      {ensenando && (
        <FormularioRespuesta
          titulo="Enseñar respuesta"
          textoGuardar="Guardar y enseñar"
          inicial={{ question: ensenando.pregunta || "" }}
          contexto={
            ensenando.respuesta ? (
              <div className="rounded-xl bg-fx-inset p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-fx-faint mb-1">Lo que respondió el asistente</p>
                <p className="text-xs text-fx-muted whitespace-pre-wrap break-words">{ensenando.respuesta}</p>
              </div>
            ) : null
          }
          onGuardar={resolver}
          onClose={() => setEnsenando(null)}
        />
      )}
      {viendo && <Conversacion conversationId={String(viendo.conversation_id)} resaltarId={viendo.id} onClose={() => setViendo(null)} />}
    </div>
  );
}
PorRevisar.propTypes = { onCambio: PropTypes.func.isRequired };

// ── Pestaña: Base de conocimiento ───────────────────────────────────────────

const RECORTE = 220;

function Interruptor({ activo, onChange, disabled, etiqueta }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={activo}
      aria-label={etiqueta}
      onClick={onChange}
      disabled={disabled}
      className="inline-flex items-center gap-2 disabled:opacity-50"
    >
      <span className={`relative w-10 h-6 rounded-full transition-colors ${activo ? "bg-[#6b1e96]" : "bg-fx-line-outer"}`}>
        <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${activo ? "left-[18px]" : "left-0.5"}`} />
      </span>
      <span className={`text-xs font-bold ${activo ? "text-fx-accent" : "text-fx-faint"}`}>{activo ? "Activa" : "Inactiva"}</span>
    </button>
  );
}
Interruptor.propTypes = { activo: PropTypes.bool, onChange: PropTypes.func.isRequired, disabled: PropTypes.bool, etiqueta: PropTypes.string.isRequired };

function TarjetaConocimiento({ entrada, onEditar, onAlternar, onBorrar }) {
  const [expandida, setExpandida] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const larga = (entrada.answer || "").length > RECORTE;
  const texto = larga && !expandida ? `${entrada.answer.slice(0, RECORTE).trimEnd()}…` : entrada.answer;
  const palabras = listaKeywords(entrada.keywords);

  const conCandado = (fn) => async () => {
    setOcupado(true);
    try { await fn(entrada); } finally { setOcupado(false); }
  };

  return (
    <article className={`p-4 sm:p-5 border-t border-fx-line first:border-t-0 ${entrada.is_active ? "" : "bg-fx-inset"}`}>
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {entrada.desde_revision && (
            <div className="mb-1.5"><Etiqueta tono="info"><span className="material-symbols-outlined text-[14px]">school</span>Aprendida de una conversación</Etiqueta></div>
          )}
          <p className={`text-sm font-black break-words ${entrada.is_active ? "text-fx-text" : "text-fx-faint"}`}>{entrada.question}</p>
          <p className="text-sm text-fx-muted mt-1 whitespace-pre-wrap break-words">
            {texto}
            {larga && (
              <button onClick={() => setExpandida(!expandida)} className="ml-1 text-xs font-bold text-fx-accent hover:underline">
                {expandida ? "ver menos" : "ver más"}
              </button>
            )}
          </p>
          {palabras.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {palabras.map((p, i) => <span key={`${p}-${i}`} className="px-2 py-0.5 rounded-md bg-fx-raised text-[11px] text-fx-muted">{p}</span>)}
            </div>
          )}
          <p className="text-[10px] text-fx-faint mt-2">Actualizada {fechaHora(entrada.updated_at || entrada.created_at)}</p>
        </div>
        <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0">
          <Interruptor activo={!!entrada.is_active} onChange={conCandado(onAlternar)} disabled={ocupado} etiqueta={`Activar o desactivar: ${entrada.question}`} />
          <div className="flex gap-1">
            <button onClick={() => onEditar(entrada)} disabled={ocupado} aria-label={`Editar: ${entrada.question}`} title="Editar" className="p-2 rounded-lg text-fx-muted hover:bg-fx-raised disabled:opacity-40">
              <span className="material-symbols-outlined text-[20px]">edit</span>
            </button>
            <button onClick={conCandado(onBorrar)} disabled={ocupado} aria-label={`Borrar: ${entrada.question}`} title="Borrar" className="p-2 rounded-lg text-fx-neg hover:bg-[#fee2e2] disabled:opacity-40">
              <span className="material-symbols-outlined text-[20px]">delete</span>
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
TarjetaConocimiento.propTypes = { entrada: PropTypes.object.isRequired, onEditar: PropTypes.func.isRequired, onAlternar: PropTypes.func.isRequired, onBorrar: PropTypes.func.isRequired };

function BaseConocimiento({ onCambio }) {
  const [busqueda, setBusqueda] = useState("");
  const [q, setQ] = useState("");
  const [entradas, setEntradas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [formulario, setFormulario] = useState(null); // { modo: 'nueva' } | { modo: 'editar', entrada }

  // Debounce del buscador: no se consulta en cada tecla.
  useEffect(() => {
    const t = setTimeout(() => setQ(busqueda.trim()), 350);
    return () => clearTimeout(t);
  }, [busqueda]);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const res = await getBotConocimientoAPI(q);
      setEntradas(res.data?.data || []);
    } catch (err) {
      errorDe(err, "No se pudo cargar la base de conocimiento.");
      setEntradas([]);
    } finally {
      setCargando(false);
    }
  }, [q]);

  useEffect(() => { cargar(); }, [cargar]);

  const guardar = async (datos) => {
    try {
      if (formulario.modo === "editar") {
        await actualizarBotConocimientoAPI(formulario.entrada.id, { ...datos, is_active: formulario.entrada.is_active });
        toast.success("Respuesta actualizada.");
      } else {
        await crearBotConocimientoAPI(datos);
        toast.success("Respuesta guardada. El asistente ya la usa.");
      }
      setFormulario(null);
      cargar();
      onCambio();
    } catch (err) {
      errorDe(err, "No se pudo guardar la respuesta.");
    }
  };

  const alternar = async (entrada) => {
    const is_active = !entrada.is_active;
    try {
      await actualizarBotConocimientoAPI(entrada.id, {
        question: entrada.question,
        answer: entrada.answer,
        keywords: listaKeywords(entrada.keywords).join(", "),
        is_active,
      });
      setEntradas((prev) => prev.map((e) => (e.id === entrada.id ? { ...e, is_active } : e)));
      toast.success(is_active ? "El asistente vuelve a usar esta respuesta." : "El asistente dejará de usar esta respuesta.");
      onCambio();
    } catch (err) {
      errorDe(err, "No se pudo cambiar el estado.");
    }
  };

  const borrar = async (entrada) => {
    if (!window.confirm(`¿Borrar esta respuesta?\n\n«${entrada.question}»\n\nEl asistente dejará de saberla. Si solo quieres pausarla, usa el interruptor.`)) return;
    try {
      await borrarBotConocimientoAPI(entrada.id);
      setEntradas((prev) => prev.filter((e) => e.id !== entrada.id));
      toast.success("Respuesta borrada.");
      onCambio();
    } catch (err) {
      errorDe(err, "No se pudo borrar.");
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 p-4 border-b border-fx-line">
        <div className="relative flex-1">
          <span className="material-symbols-outlined text-[18px] text-fx-faint absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">search</span>
          <input
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar en preguntas, respuestas o palabras clave"
            aria-label="Buscar en la base de conocimiento"
            className="w-full pl-9 pr-3 py-2.5 border border-fx-line-strong rounded-xl text-sm"
          />
        </div>
        <button onClick={() => setFormulario({ modo: "nueva" })} className={btnPrimario}>
          <span className="material-symbols-outlined text-[18px]">add</span>Nueva respuesta
        </button>
      </div>

      {cargando ? (
        <p className="p-10 text-center text-sm text-fx-faint">Cargando...</p>
      ) : entradas.length === 0 ? (
        <Vacio
          icono="menu_book"
          texto={q ? "No hay respuestas que coincidan con la búsqueda." : "Aún no hay respuestas guardadas. Crea la primera con «Nueva respuesta»."}
        />
      ) : (
        <div>
          {entradas.map((e) => (
            <TarjetaConocimiento key={e.id} entrada={e} onEditar={(entrada) => setFormulario({ modo: "editar", entrada })} onAlternar={alternar} onBorrar={borrar} />
          ))}
        </div>
      )}

      {formulario && (
        <FormularioRespuesta
          key={formulario.entrada?.id || "nueva"}
          titulo={formulario.modo === "editar" ? "Editar respuesta" : "Nueva respuesta"}
          textoGuardar={formulario.modo === "editar" ? "Guardar cambios" : "Guardar respuesta"}
          inicial={formulario.entrada}
          onGuardar={guardar}
          onClose={() => setFormulario(null)}
        />
      )}
    </div>
  );
}
BaseConocimiento.propTypes = { onCambio: PropTypes.func.isRequired };

// ── Pestaña: Uso ────────────────────────────────────────────────────────────

function Kpi({ label, value, sub, tone = "default" }) {
  const tones = {
    default: "bg-fx-panel text-fx-text border-fx-line",
    pos: "bg-[#f0f7ea] text-fx-pos border-[#d5e8c6]",
    neg: "bg-[#fdf0ec] text-fx-neg border-[#f3d3c9]",
    warn: "bg-[#fffbeb] text-fx-warn border-[#fde68a]",
  };
  return (
    <div className={`rounded-2xl p-4 sm:p-5 border ${tones[tone]}`}>
      <p className="text-[11px] font-bold uppercase tracking-wider opacity-70">{label}</p>
      <p className="text-2xl font-black mt-1 leading-none">{value}</p>
      {sub && <p className="text-[11px] mt-2 opacity-70">{sub}</p>}
    </div>
  );
}
Kpi.propTypes = { label: PropTypes.string.isRequired, value: PropTypes.node.isRequired, sub: PropTypes.node, tone: PropTypes.string };

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const fila = payload[0].payload;
  return (
    <div className="rounded-xl px-3 py-2 shadow-lg border border-fx-line-strong bg-white">
      <p className="text-[10px] font-bold uppercase tracking-wider text-fx-faint mb-1">{label}</p>
      <p className="text-sm font-black text-fx-text">{numero(fila.mensajes)} mensajes</p>
    </div>
  );
}
ChartTooltip.propTypes = { active: PropTypes.bool, payload: PropTypes.array, label: PropTypes.string };

function Uso({ resumen }) {
  const t = resumen.totales || {};
  const limites = resumen.limites || {};
  const serie = (resumen.por_dia || []).map((d) => ({ ...d, etiqueta: diaCorto(d.dia), mensajes: Number(d.mensajes || 0) }));
  const tope = Number(limites.global || 0);
  const maximo = Math.max(tope, ...serie.map((d) => d.mensajes), 1);
  const porProveedor = resumen.por_proveedor || [];
  const totalRespuestas = porProveedor.reduce((s, p) => s + Number(p.respuestas || 0), 0);

  return (
    <div className="p-4 sm:p-5 space-y-5">
      <div>
        <p className="text-xs text-fx-muted mb-3">Últimos {DIAS} días.</p>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <Kpi label="Conversaciones" value={numero(t.conversaciones)} />
          <Kpi tone="pos" label="👍 Les gustó" value={numero(t.positivos)} />
          <Kpi tone="neg" label="👎 No les gustó" value={numero(t.negativos)} />
          <Kpi tone={t.sin_respuesta > 0 ? "warn" : "default"} label="Sin respuesta" value={numero(t.sin_respuesta)} sub="no supo qué decir" />
          <Kpi label="Respuestas activas" value={numero(t.conocimiento_activo)} sub="en la base de conocimiento" />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl p-4 sm:p-5 border border-fx-line">
          <p className="text-sm font-black text-fx-text">Mensajes por día</p>
          <p className="text-[11px] text-fx-faint mb-3">
            {tope > 0 ? <>La línea punteada es el tope diario total ({numero(tope)} mensajes).</> : "Mensajes que recibió el asistente cada día."}
          </p>
          {serie.length === 0 ? (
            <Vacio icono="bar_chart" texto="Todavía no hay mensajes en este periodo." />
          ) : (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={serie} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid stroke="#ece5f7" vertical={false} />
                  <XAxis dataKey="etiqueta" tick={{ fontSize: 11, fill: "#877f92" }} axisLine={false} tickLine={false} interval="preserveStartEnd" minTickGap={8} />
                  <YAxis tick={{ fontSize: 11, fill: "#877f92" }} axisLine={false} tickLine={false} allowDecimals={false} domain={[0, Math.ceil(maximo * 1.1)]} />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(107,30,150,0.06)" }} />
                  <Bar dataKey="mensajes" fill="#6b1e96" radius={[4, 4, 0, 0]} maxBarSize={32} />
                  {tope > 0 && (
                    <ReferenceLine y={tope} stroke="#b8482f" strokeDasharray="5 4" label={{ value: "Tope", position: "insideTopRight", fontSize: 11, fill: "#b8482f" }} />
                  )}
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="rounded-2xl p-4 sm:p-5 border border-fx-line">
          <p className="text-sm font-black text-fx-text mb-3">Respuestas por proveedor</p>
          {porProveedor.length === 0 ? (
            <p className="text-xs text-fx-faint">Aún no hay respuestas en este periodo.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] uppercase tracking-wider text-fx-faint">
                  <th className="text-left font-bold pb-2">Proveedor</th>
                  <th className="text-right font-bold pb-2">Respuestas</th>
                  <th className="text-right font-bold pb-2">%</th>
                </tr>
              </thead>
              <tbody>
                {porProveedor.map((p) => (
                  <tr key={p.proveedor || "sin"} className="border-t border-fx-line">
                    <td className="py-2 font-semibold text-fx-text">{nombreProveedor(p.proveedor)}</td>
                    <td className="py-2 text-right text-fx-muted">{numero(p.respuestas)}</td>
                    <td className="py-2 text-right text-fx-faint">{totalRespuestas > 0 ? Math.round((Number(p.respuestas || 0) / totalRespuestas) * 100) : 0}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="rounded-2xl p-4 sm:p-5 bg-fx-inset border border-fx-line">
        <p className="text-sm font-black text-fx-text flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[18px] text-fx-accent">info</span>Topes diarios
        </p>
        <p className="text-xs text-fx-muted mt-1">
          Para que la IA gratuita no se agote, el asistente limita cuántos mensajes acepta cada día. Al llegar a un tope, deja de responder con IA hasta el día siguiente.
        </p>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 text-xs">
          <li className="rounded-xl bg-fx-panel border border-fx-line p-3"><span className="font-black text-fx-text">{numero(limites.visitante)}</span> <span className="text-fx-muted">mensajes por visitante sin sesión</span></li>
          <li className="rounded-xl bg-fx-panel border border-fx-line p-3"><span className="font-black text-fx-text">{numero(limites.usuario)}</span> <span className="text-fx-muted">mensajes por usuario con sesión</span></li>
          <li className="rounded-xl bg-fx-panel border border-fx-line p-3"><span className="font-black text-fx-text">{numero(limites.ip)}</span> <span className="text-fx-muted">mensajes desde una misma conexión a internet</span></li>
          <li className="rounded-xl bg-fx-panel border border-fx-line p-3"><span className="font-black text-fx-text">{numero(limites.global)}</span> <span className="text-fx-muted">mensajes en total, sumando a todos</span></li>
        </ul>
      </div>
    </div>
  );
}
Uso.propTypes = { resumen: PropTypes.object.isRequired };

// ── Página ──────────────────────────────────────────────────────────────────

const TABS = [
  { id: "revision", label: "Por revisar", icono: "rate_review" },
  { id: "conocimiento", label: "Base de conocimiento", icono: "menu_book" },
  { id: "uso", label: "Uso", icono: "bar_chart" },
];

export default function AdminBot() {
  const [tab, setTab] = useState("revision");
  const [resumen, setResumen] = useState(null);
  const [errorResumen, setErrorResumen] = useState(false);

  const cargarResumen = useCallback(async () => {
    try {
      const res = await getBotResumenAPI(DIAS);
      setResumen(res.data?.data || null);
      setErrorResumen(false);
    } catch (err) {
      setErrorResumen(true);
      errorDe(err, "No se pudo cargar el resumen del asistente.");
    }
  }, []);

  useEffect(() => { cargarResumen(); }, [cargarResumen]);

  const proveedores = resumen?.proveedores || [];
  const pendientes = Number(resumen?.totales?.pendientes || 0);

  return (
    <div className="space-y-5 text-fx-text">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black flex items-center gap-2">
            <span className="material-symbols-outlined text-[28px] text-fx-accent">smart_toy</span>Asistente IA
          </h1>
          <p className="text-sm text-fx-muted mt-1">El asistente responde con IA gratuita y aprende de lo que escribas aquí.</p>
          {resumen && proveedores.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {proveedores.map((p, i) => (
                <span key={`${p.nombre}-${i}`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#dcfce7] text-[#166534]" title={p.modelo || undefined}>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e]" />
                  {nombreProveedor(p.nombre)} · {rolProveedor(p.nombre, i)}
                </span>
              ))}
            </div>
          )}
        </div>
        <button onClick={cargarResumen} className="inline-flex items-center gap-1.5 text-xs font-bold text-fx-accent hover:underline self-start md:self-auto">
          <span className="material-symbols-outlined text-[16px]">refresh</span>Actualizar
        </button>
      </div>

      {resumen && proveedores.length === 0 && (
        <div role="alert" className="flex items-start gap-3 rounded-2xl p-4 bg-[#fdf0ec] border border-[#f3d3c9] text-fx-neg">
          <span className="material-symbols-outlined text-[22px] shrink-0">power_off</span>
          <div>
            <p className="text-sm font-black">El asistente está apagado: faltan las claves de IA en el servidor.</p>
            <p className="text-xs mt-0.5 opacity-80">Mientras tanto, los clientes no reciben respuestas del asistente. Puedes seguir preparando la base de conocimiento.</p>
          </div>
        </div>
      )}
      {errorResumen && !resumen && (
        <div className="rounded-2xl p-4 bg-[#fffbeb] border border-[#fde68a] text-fx-warn text-sm font-bold">
          No se pudo cargar el estado del asistente. <button onClick={cargarResumen} className="underline">Reintentar</button>
        </div>
      )}

      <div className="bg-fx-panel rounded-2xl overflow-hidden border border-fx-line">
        <div className="flex gap-1 overflow-x-auto p-3 border-b border-fx-line" role="tablist" aria-label="Secciones del asistente">
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${tab === t.id ? "bg-[#6b1e96] text-white" : "text-fx-muted hover:bg-fx-raised"}`}
            >
              <span className="material-symbols-outlined text-[16px]">{t.icono}</span>
              {t.label}
              {t.id === "revision" && pendientes > 0 && (
                <span className={`ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] ${tab === t.id ? "bg-white/20" : "bg-[#fef9c3] text-[#854d0e]"}`}>{pendientes}</span>
              )}
            </button>
          ))}
        </div>

        <div role="tabpanel">
          {tab === "revision" && <PorRevisar onCambio={cargarResumen} />}
          {tab === "conocimiento" && <BaseConocimiento onCambio={cargarResumen} />}
          {tab === "uso" && (
            resumen ? <Uso resumen={resumen} /> : <p className="p-10 text-center text-sm text-fx-faint">{errorResumen ? "No se pudo cargar el uso." : "Cargando..."}</p>
          )}
        </div>
      </div>
    </div>
  );
}
