import { supabase } from "../lib/supabaseClient";

/**
 * Cliente de telemetría de comportamiento.
 *
 * Principios:
 *  - Nunca bloquea ni rompe la UI: todo fallo se traga en silencio.
 *  - Agrupa eventos en lotes para no disparar una petición por clic.
 *  - Usa fetch con `keepalive` para que el último lote sobreviva al cierre de la pestaña.
 */

// VITE_API_URL ya termina en `/api`; añadirlo otra vez producía /api/api/track (404).
const ENDPOINT = `${import.meta.env.VITE_API_URL}/track`;

const ANON_KEY = "dm_anon_id";      // persiste entre visitas (localStorage)
const SESSION_KEY = "dm_session_id"; // muere al cerrar la pestaña (sessionStorage)

const FLUSH_INTERVAL_MS = 10000;
const MAX_BATCH = 50;
const MAX_QUEUE = 200;

let queue = [];
let timer = null;

/** localStorage falla en modo privado de algunos navegadores; no debe tumbar la app. */
function safeStorage(storage, key, generate) {
  try {
    let value = storage.getItem(key);
    if (!value) {
      value = generate();
      storage.setItem(key, value);
    }
    return value;
  } catch {
    return generate();
  }
}

const newId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

export const getAnonymousId = () => safeStorage(localStorage, ANON_KEY, newId);
export const getSessionKey = () => safeStorage(sessionStorage, SESSION_KEY, newId);

/**
 * El contexto de campaña se captura una sola vez por sesión, en la primera carga.
 * Si se leyera en cada envío se perdería el origen real tras la primera navegación.
 */
function captureContext() {
  try {
    const stored = sessionStorage.getItem("dm_session_ctx");
    if (stored) return JSON.parse(stored);

    const params = new URLSearchParams(window.location.search);
    const ctx = {
      referrer: document.referrer || null,
      utm_source: params.get("utm_source"),
      utm_medium: params.get("utm_medium"),
      utm_campaign: params.get("utm_campaign"),
    };
    sessionStorage.setItem("dm_session_ctx", JSON.stringify(ctx));
    return ctx;
  } catch {
    return {};
  }
}

async function send(events, { useKeepalive = false } = {}) {
  if (events.length === 0) return;

  const body = JSON.stringify({
    session_key: getSessionKey(),
    anonymous_id: getAnonymousId(),
    events,
    context: captureContext(),
  });

  const headers = { "Content-Type": "application/json" };

  // El token identifica al usuario en el backend. En el envío de cierre de pestaña se
  // omite: leer la sesión de Supabase es asíncrono y no da tiempo antes del unload.
  if (!useKeepalive) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`;
    } catch { /* visitante anónimo */ }
  }

  try {
    await fetch(ENDPOINT, {
      method: "POST",
      headers,
      body,
      keepalive: true,
      credentials: "omit",
    });
  } catch {
    // Telemetría perdida. Es aceptable: no se reintenta para no acumular ruido.
  }
}

function scheduleFlush() {
  if (timer) return;
  timer = setTimeout(() => {
    timer = null;
    flush();
  }, FLUSH_INTERVAL_MS);
}

/** Vacía la cola. `immediate` se usa al cerrar la pestaña. */
export function flush({ immediate = false } = {}) {
  if (queue.length === 0) return;
  const batch = queue.splice(0, MAX_BATCH);
  send(batch, { useKeepalive: immediate });
}

/**
 * Registra un evento. `name` debe estar en el catálogo del backend
 * (backend/src/services/eventTrackingService.js); los desconocidos se descartan allí.
 */
export function track(name, payload = {}) {
  if (!name) return;

  // Cota dura para que una fuga de eventos no crezca sin límite en memoria.
  if (queue.length >= MAX_QUEUE) queue.shift();

  queue.push({ name, ts: new Date().toISOString(), ...payload });

  // Las conversiones se envían de inmediato: son los eventos que no se pueden perder.
  if (name === "purchase" || name === "checkout_start") flush();
  else scheduleFlush();
}

export const trackPageView = (path) => track("page_view", { path });

/** Se instala una sola vez desde App. Asegura el envío del último lote al salir. */
export function initTracking() {
  if (typeof window === "undefined" || window.__dmTrackingReady) return;
  window.__dmTrackingReady = true;

  captureContext();

  // visibilitychange es el único evento fiable en móvil; pagehide cubre el resto.
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flush({ immediate: true });
  });
  window.addEventListener("pagehide", () => flush({ immediate: true }));
}
