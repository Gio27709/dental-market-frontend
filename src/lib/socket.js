import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

// Clean base URL if it ends with /api (since Socket.io mounts on HTTP server root, not /api)
const getSocketUrl = (url) => {
  try {
    const parsed = new URL(url);
    if (parsed.pathname.endsWith("/api") || parsed.pathname.endsWith("/api/")) {
      parsed.pathname = parsed.pathname.replace(/\/api\/?$/, "");
    }
    return parsed.toString().replace(/\/$/, "");
  } catch {
    return url.replace(/\/api\/?$/, "").replace(/\/$/, "");
  }
};

const finalSocketUrl = getSocketUrl(SOCKET_URL);

export const socket = io(finalSocketUrl, {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 2000,
  transports: ["websocket", "polling"],
});

export const connectSocket = (token) => {
  if (!token) return;

  // Hay que comparar ANTES de asignar: si no, se compara el token nuevo contra sí
  // mismo, la condición nunca se cumple y al cambiar de cuenta en la misma pestaña
  // el socket sigue autenticado como el usuario anterior hasta recargar.
  const tokenChanged = socket.auth?.token !== token;
  socket.auth = { token };

  if (!socket.connected) {
    console.log("[Socket] Connecting to:", finalSocketUrl);
    socket.connect();
  } else if (tokenChanged) {
    console.log("[Socket] Token changed, reconnecting with new credentials...");
    socket.disconnect().connect();
  }
};

export const disconnectSocket = () => {
  if (socket.connected) {
    console.log("[Socket] Disconnecting...");
    socket.disconnect();
  }
};

// Log socket events for debugging in DEV mode
if (import.meta.env.DEV) {
  socket.on("connect", () => {
    console.log("🔌 [Socket] Connected successfully! ID:", socket.id);
  });
  socket.on("disconnect", (reason) => {
    console.log("🔌 [Socket] Disconnected. Reason:", reason);
  });
  socket.on("connect_error", (error) => {
    console.error("🔌 [Socket] Connection error:", error.message);
  });
}
