import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { useTour } from "../tour";
import { formatCurrencyUSD } from "../../utils/formatters";
import TextoBot from "./TextoBot";
import { validarRuta } from "./rutasBot";
import { getBotEstadoAPI, enviarMensajeBotAPI, valorarMensajeBotAPI } from "./botApi";

// Asistente con IA de la tienda pública (esquina inferior derecha). Responde con IA gratuita
// en el backend (/api/bot) y puede: mostrar productos, llevar a una página, agregar al carrito,
// ver pedidos y tickets (con sesión) y abrir un ticket. Si el backend no tiene claves de IA,
// no se muestra. La conversación se guarda en este navegador, separada por cuenta.

const OCULTO_EN = ["/checkout", "/order-success"];
const MAX_GUARDADOS = 40;
const MOVIL = "(max-width: 639px)";

const SUGERENCIAS = [
  "Busco un producto",
  "¿Cómo compro?",
  "¿Dónde está mi pedido?",
  "Quiero devolver algo",
  "¿Cómo vendo en Forcepx?",
];

const BIENVENIDA = {
  id: "bienvenida",
  rol: "bot",
  texto: "¡Hola! Soy el asistente de Forcepx 🦷. Te ayudo a encontrar productos, resolver dudas de compras, pagos y envíos, o revisar tus pedidos. ¿Qué necesitas?",
};

const claveHistorial = (userId) => `forcepx_bot_chat:${userId || "visitante"}`;

function leerHistorial(userId) {
  try {
    const datos = JSON.parse(localStorage.getItem(claveHistorial(userId)) || "null");
    if (datos && Array.isArray(datos.mensajes)) return datos;
  } catch {
    /* historial ilegible: se empieza de cero */
  }
  return { conversacionId: null, mensajes: [] };
}

function guardarHistorial(userId, datos) {
  try {
    localStorage.setItem(
      claveHistorial(userId),
      JSON.stringify({ conversacionId: datos.conversacionId, mensajes: datos.mensajes.slice(-MAX_GUARDADOS) }),
    );
  } catch {
    /* sin localStorage: la conversación dura lo que la página */
  }
}

const esMovil = () => typeof window !== "undefined" && window.matchMedia(MOVIL).matches;

function TarjetaProducto({ producto, onVer, onAgregar }) {
  return (
    <div className="w-44 shrink-0 rounded-xl border border-fx-line bg-white overflow-hidden flex flex-col">
      <button type="button" onClick={() => onVer(producto)} className="block h-24 bg-fx-inset" aria-label={`Ver ${producto.nombre}`}>
        {producto.imagen ? (
          <img src={producto.imagen} alt="" loading="lazy" className="h-full w-full object-contain" />
        ) : (
          <span className="material-symbols-outlined text-[32px] text-fx-faint" aria-hidden="true">dentistry</span>
        )}
      </button>
      <div className="p-2 flex flex-col gap-1 flex-1">
        <p className="text-[12px] font-semibold text-fx-text leading-tight line-clamp-2">{producto.nombre}</p>
        {producto.tienda && <p className="text-[11px] text-fx-muted truncate">{producto.tienda}</p>}
        <p className="text-[13px] font-bold text-[#6b1e96]">
          {formatCurrencyUSD(producto.precio_usd)}
          {producto.precio_original_usd ? (
            <span className="ml-1 text-[11px] font-normal text-fx-faint line-through">{formatCurrencyUSD(producto.precio_original_usd)}</span>
          ) : null}
        </p>
        <div className="mt-auto flex gap-1">
          <button type="button" onClick={() => onVer(producto)} className="flex-1 rounded-lg border border-fx-line px-2 py-1 text-[11px] font-semibold text-fx-text hover:bg-fx-inset">
            Ver
          </button>
          <button
            type="button"
            disabled={producto.agotado}
            onClick={() => onAgregar(producto)}
            className="flex-1 rounded-lg bg-[#c3ff00] px-2 py-1 text-[11px] font-bold text-[#531575] hover:bg-[#aee600] disabled:bg-fx-raised disabled:text-fx-faint"
          >
            {producto.agotado ? "Agotado" : "Agregar"}
          </button>
        </div>
      </div>
    </div>
  );
}

TarjetaProducto.propTypes = {
  producto: PropTypes.shape({
    id: PropTypes.string.isRequired,
    nombre: PropTypes.string,
    imagen: PropTypes.string,
    tienda: PropTypes.string,
    precio_usd: PropTypes.number,
    precio_original_usd: PropTypes.number,
    agotado: PropTypes.bool,
    tiene_variaciones: PropTypes.bool,
    url: PropTypes.string,
  }).isRequired,
  onVer: PropTypes.func.isRequired,
  onAgregar: PropTypes.func.isRequired,
};

export default function ChatbotWidget() {
  const { pathname, search } = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { activo: tourActivo } = useTour();
  const userId = user?.id || null;

  const [disponible, setDisponible] = useState(false);
  const [abierto, setAbierto] = useState(false);
  const [historial, setHistorial] = useState(() => leerHistorial(userId));
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);

  const listaRef = useRef(null);
  const entradaRef = useRef(null);
  const userIdRef = useRef(userId);

  // ¿El backend tiene IA configurada? Una sola vez por carga.
  useEffect(() => {
    let vivo = true;
    getBotEstadoAPI()
      .then(({ data }) => vivo && setDisponible(Boolean(data?.disponible)))
      .catch(() => vivo && setDisponible(false));
    return () => {
      vivo = false;
    };
  }, []);

  // Cambio de cuenta: cada cuenta ve su propia conversación. Si un visitante inicia sesión, se
  // lleva su conversación (el backend la pasa a su cuenta).
  useEffect(() => {
    if (userIdRef.current === userId) return;
    const anterior = userIdRef.current;
    userIdRef.current = userId;
    const propio = leerHistorial(userId);
    if (!anterior && userId && propio.mensajes.length === 0) {
      const delVisitante = leerHistorial(null);
      guardarHistorial(userId, delVisitante);
      guardarHistorial(null, { conversacionId: null, mensajes: [] });
      setHistorial(delVisitante);
    } else {
      setHistorial(propio);
    }
  }, [userId]);

  useEffect(() => {
    guardarHistorial(userId, historial);
  }, [historial, userId]);

  // Siempre abajo del todo al llegar un mensaje.
  useEffect(() => {
    if (abierto && listaRef.current) listaRef.current.scrollTop = listaRef.current.scrollHeight;
  }, [historial.mensajes.length, enviando, abierto]);

  useEffect(() => {
    if (abierto && !esMovil()) entradaRef.current?.focus();
  }, [abierto]);

  useEffect(() => {
    if (!abierto) return undefined;
    const alTeclear = (e) => e.key === "Escape" && setAbierto(false);
    window.addEventListener("keydown", alTeclear);
    return () => window.removeEventListener("keydown", alTeclear);
  }, [abierto]);

  const agregarNota = useCallback((textoNota) => {
    setHistorial((h) => ({ ...h, mensajes: [...h.mensajes, { id: `nota-${Date.now()}`, rol: "nota", texto: textoNota }] }));
  }, []);

  const irA = useCallback(
    (ruta) => {
      const limpia = validarRuta(ruta);
      if (!limpia) return;
      navigate(limpia);
      if (esMovil()) setAbierto(false); // en el teléfono el chat tapa la página
    },
    [navigate],
  );

  // Vuelve a esta página después de entrar (la conversación sigue, ahora con su cuenta).
  const irALogin = useCallback(() => {
    navigate(`/login?redirect=${encodeURIComponent(`${pathname}${search}`)}`);
    if (esMovil()) setAbierto(false);
  }, [navigate, pathname, search]);

  const agregarProducto = useCallback(
    async ({ productoId, variacionId = null, cantidad = 1 }) => {
      try {
        const { data } = await api.get(`/products/${productoId}`);
        const p = data?.data;
        if (!p) throw new Error("sin producto");
        const producto = { ...p, variations: p.product_variations || [], store: p.store_profiles || null };
        const variaciones = producto.variations;
        const variacion = variacionId ? variaciones.find((v) => v.id === variacionId) : variaciones[0] || null;
        if (variacionId && !variacion) throw new Error("variación inexistente");
        const ok = await addToCart(producto, variacion, cantidad);
        if (ok) {
          toast.success(`${p.name} agregado al carrito`);
          agregarNota(`✓ Agregado al carrito: ${p.name}${cantidad > 1 ? ` (x${cantidad})` : ""}`);
        }
      } catch {
        toast.error("No pude agregar ese producto al carrito.");
      }
    },
    [addToCart, agregarNota],
  );

  const ejecutarAcciones = useCallback(
    (acciones = []) => {
      for (const a of acciones) {
        if (a.tipo === "agregar_al_carrito") agregarProducto({ productoId: a.producto_id, variacionId: a.variacion_id, cantidad: a.cantidad });
        if (a.tipo === "navegar") irA(a.ruta);
      }
    },
    [agregarProducto, irA],
  );

  const enviar = useCallback(
    async (contenido) => {
      const mensaje = String(contenido || "").trim();
      if (!mensaje || enviando) return;
      setTexto("");
      if (entradaRef.current) entradaRef.current.style.height = "auto";
      setEnviando(true);
      setHistorial((h) => ({ ...h, mensajes: [...h.mensajes, { id: `u-${Date.now()}`, rol: "usuario", texto: mensaje }] }));
      try {
        const { data } = await enviarMensajeBotAPI({
          mensaje: mensaje.slice(0, 800),
          conversacionId: historial.conversacionId,
          pagina: { ruta: `${pathname}${search}`.slice(0, 200), titulo: document.title?.slice(0, 120) },
        });
        setHistorial((h) => ({
          conversacionId: data.conversacion_id || h.conversacionId,
          mensajes: [
            ...h.mensajes,
            {
              id: data.mensaje_id || `b-${Date.now()}`,
              rol: "bot",
              texto: data.respuesta,
              productos: data.productos || [],
              acciones: (data.acciones || []).filter((a) => a.tipo === "iniciar_sesion" || a.tipo === "boton"),
              valorable: Boolean(data.mensaje_id),
            },
          ],
        }));
        // Navegar y agregar al carrito se ejecutan una sola vez, al llegar (no al recargar).
        ejecutarAcciones(data.acciones);
      } catch (err) {
        const error = err?.response?.data?.error || "No pude conectarme. Revisa tu conexión e inténtalo de nuevo.";
        setHistorial((h) => ({ ...h, mensajes: [...h.mensajes, { id: `e-${Date.now()}`, rol: "nota", texto: error, error: true }] }));
      } finally {
        setEnviando(false);
      }
    },
    [enviando, historial.conversacionId, pathname, search, ejecutarAcciones],
  );

  const valorar = useCallback(async (mensajeId, valor) => {
    setHistorial((h) => ({ ...h, mensajes: h.mensajes.map((m) => (m.id === mensajeId ? { ...m, valoracion: valor } : m)) }));
    try {
      await valorarMensajeBotAPI(mensajeId, valor);
      if (valor === -1) toast("Gracias. El equipo revisará esta respuesta.", { icon: "📝" });
    } catch {
      /* la valoración es opcional: no se molesta al usuario */
    }
  }, []);

  const nuevaConversacion = () => {
    setHistorial({ conversacionId: null, mensajes: [] });
    entradaRef.current?.focus();
  };

  const alAgregarTarjeta = (producto) => {
    if (producto.tiene_variaciones) {
      toast("Elige la presentación en la ficha del producto.", { icon: "👉" });
      irA(producto.url);
      return;
    }
    agregarProducto({ productoId: producto.id });
  };

  const mensajes = useMemo(() => [BIENVENIDA, ...historial.mensajes], [historial.mensajes]);
  const oculto = !disponible || tourActivo || OCULTO_EN.some((p) => pathname.startsWith(p));

  useEffect(() => {
    if (oculto) setAbierto(false);
  }, [oculto]);

  if (oculto) return null;

  return (
    <>
      {!abierto && (
        <button
          type="button"
          onClick={() => setAbierto(true)}
          aria-label="Abrir el asistente de Forcepx"
          className="flex items-center gap-2 rounded-full bg-[#6b1e96] text-white shadow-lg shadow-black/20 pl-3 pr-3 sm:pr-4 py-3 hover:bg-[#5a1880] active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined text-[24px] leading-none text-[#c3ff00]" aria-hidden="true">smart_toy</span>
          <span className="text-sm font-semibold hidden sm:inline">Asistente</span>
        </button>
      )}

      {abierto && (
        <section
          role="dialog"
          aria-label="Asistente de Forcepx"
          className="fixed inset-0 z-[90] flex flex-col bg-fx-base sm:inset-auto sm:bottom-5 sm:right-5 sm:w-[380px] sm:h-[min(620px,calc(100vh-2.5rem))] sm:rounded-2xl sm:shadow-2xl sm:shadow-black/25 sm:border sm:border-fx-line overflow-hidden"
        >
          <header className="flex items-center gap-3 bg-[#6b1e96] px-4 py-3 text-white" style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#c3ff00]">
              <span className="material-symbols-outlined text-[22px] text-[#531575]" aria-hidden="true">smart_toy</span>
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-bold leading-tight">Asistente Forcepx</p>
              <p className="text-[11px] text-white/75">Con IA · puede equivocarse</p>
            </div>
            <button type="button" onClick={nuevaConversacion} className="rounded-full p-2 hover:bg-white/15" aria-label="Empezar una conversación nueva" title="Conversación nueva">
              <span className="material-symbols-outlined text-[20px] leading-none" aria-hidden="true">refresh</span>
            </button>
            <button type="button" onClick={() => setAbierto(false)} className="rounded-full p-2 hover:bg-white/15" aria-label="Cerrar el asistente">
              <span className="material-symbols-outlined text-[22px] leading-none" aria-hidden="true">close</span>
            </button>
          </header>

          <div ref={listaRef} className="flex-1 overflow-y-auto px-3 py-4 space-y-3" aria-live="polite">
            {mensajes.map((m) => {
              if (m.rol === "usuario") {
                return (
                  <div key={m.id} className="flex justify-end">
                    <p className="max-w-[85%] whitespace-pre-wrap break-words rounded-2xl rounded-br-md bg-[#6b1e96] px-3 py-2 text-[14px] text-white">{m.texto}</p>
                  </div>
                );
              }
              if (m.rol === "nota") {
                return (
                  <p key={m.id} className={`mx-auto max-w-[90%] rounded-lg px-3 py-1.5 text-center text-[12px] ${m.error ? "bg-red-50 text-fx-neg" : "bg-fx-raised text-fx-muted"}`}>
                    {m.texto}
                  </p>
                );
              }
              return (
                <div key={m.id} className="space-y-2">
                  <div className="max-w-[90%] rounded-2xl rounded-bl-md border border-fx-line bg-white px-3 py-2 text-[14px] leading-relaxed text-fx-text">
                    <TextoBot texto={m.texto} onNavegar={irA} />
                  </div>
                  {m.productos?.length > 0 && (
                    <div className="-mx-3 flex gap-2 overflow-x-auto px-3 pb-1">
                      {m.productos.map((p) => (
                        <TarjetaProducto key={p.id} producto={p} onVer={(prod) => irA(prod.url)} onAgregar={alAgregarTarjeta} />
                      ))}
                    </div>
                  )}
                  {m.acciones?.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {m.acciones.map((a, i) =>
                        a.tipo === "iniciar_sesion" ? (
                          !userId && (
                            <button key={i} type="button" onClick={irALogin} className="rounded-full bg-[#6b1e96] px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-[#5a1880]">
                              Iniciar sesión
                            </button>
                          )
                        ) : (
                          validarRuta(a.ruta) && (
                            <button key={i} type="button" onClick={() => irA(a.ruta)} className="rounded-full border border-[#6b1e96] px-3 py-1.5 text-[12px] font-semibold text-[#6b1e96] hover:bg-[#f1ebf9]">
                              {a.etiqueta}
                            </button>
                          )
                        ),
                      )}
                    </div>
                  )}
                  {m.valorable && (
                    <div className="flex items-center gap-1 pl-1 text-fx-faint">
                      <button
                        type="button"
                        onClick={() => valorar(m.id, 1)}
                        disabled={Boolean(m.valoracion)}
                        aria-label="Respuesta útil"
                        className={`rounded-full p-1 ${m.valoracion === 1 ? "text-[#4f7d33]" : "hover:text-fx-muted"}`}
                      >
                        <span className="material-symbols-outlined text-[16px] leading-none" aria-hidden="true">thumb_up</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => valorar(m.id, -1)}
                        disabled={Boolean(m.valoracion)}
                        aria-label="Respuesta no útil"
                        className={`rounded-full p-1 ${m.valoracion === -1 ? "text-fx-neg" : "hover:text-fx-muted"}`}
                      >
                        <span className="material-symbols-outlined text-[16px] leading-none" aria-hidden="true">thumb_down</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}

            {historial.mensajes.length === 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {SUGERENCIAS.map((s) => (
                  <button key={s} type="button" onClick={() => enviar(s)} className="rounded-full border border-fx-line-strong bg-white px-3 py-1.5 text-[12px] font-medium text-fx-text hover:border-[#6b1e96] hover:text-[#6b1e96]">
                    {s}
                  </button>
                ))}
              </div>
            )}

            {enviando && (
              <div className="inline-flex items-center gap-1 rounded-2xl rounded-bl-md border border-fx-line bg-white px-3 py-3" aria-label="El asistente está escribiendo">
                {[0, 150, 300].map((d) => (
                  <span key={d} className="h-2 w-2 animate-bounce rounded-full bg-[#6b1e96]/60" style={{ animationDelay: `${d}ms` }} />
                ))}
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              enviar(texto);
            }}
            className="border-t border-fx-line bg-white px-3 pt-2"
            style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
          >
            <div className="flex items-end gap-2">
              <label htmlFor="bot-mensaje" className="sr-only">Escribe tu mensaje</label>
              <textarea
                id="bot-mensaje"
                ref={entradaRef}
                rows={1}
                maxLength={800}
                value={texto}
                onChange={(e) => {
                  setTexto(e.target.value);
                  e.target.style.height = "auto";
                  e.target.style.height = `${Math.min(e.target.scrollHeight, 112)}px`;
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    enviar(texto);
                  }
                }}
                placeholder="Escribe tu pregunta…"
                className="max-h-28 min-h-[42px] flex-1 resize-none rounded-xl border border-fx-line-strong bg-fx-inset px-3 py-2.5 text-[16px] sm:text-[14px] text-fx-text outline-none focus:border-[#6b1e96] focus:bg-white"
              />
              <button
                type="submit"
                disabled={!texto.trim() || enviando}
                aria-label="Enviar mensaje"
                className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl bg-[#6b1e96] text-white hover:bg-[#5a1880] disabled:bg-fx-raised disabled:text-fx-faint"
              >
                <span className="material-symbols-outlined text-[20px] leading-none" aria-hidden="true">send</span>
              </button>
            </div>
            <p className="py-1.5 text-center text-[10.5px] text-fx-faint">No compartas contraseñas ni datos bancarios en el chat.</p>
          </form>
        </section>
      )}
    </>
  );
}
