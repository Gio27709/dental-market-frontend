import api from "../../services/api";

// Llamadas del asistente público. El token (si hay sesión) lo pone el interceptor de `api`.

const CLAVE_VISITANTE = "forcepx_bot_visitante";

/** Id aleatorio de este navegador para seguir la conversación sin cuenta. */
export function idVisitante() {
  try {
    let id = localStorage.getItem(CLAVE_VISITANTE);
    if (!id || !/^[A-Za-z0-9-]{16,64}$/.test(id)) {
      id = typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}-v`;
      localStorage.setItem(CLAVE_VISITANTE, id);
    }
    return id;
  } catch {
    // Sin localStorage (modo privado estricto): un id por carga de página.
    if (!idVisitante.memoria) idVisitante.memoria = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}-m`;
    return idVisitante.memoria;
  }
}

export const getBotEstadoAPI = () => api.get("/bot/estado");

export const enviarMensajeBotAPI = ({ mensaje, conversacionId, pagina }) =>
  api.post("/bot/mensaje", {
    mensaje,
    conversacion_id: conversacionId || undefined,
    visitor_id: idVisitante(),
    pagina,
  });

export const valorarMensajeBotAPI = (mensajeId, valor) =>
  api.post("/bot/valoracion", { mensaje_id: mensajeId, valor, visitor_id: idVisitante() });
