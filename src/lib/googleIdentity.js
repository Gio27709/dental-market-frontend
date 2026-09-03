// Carga bajo demanda de Google Identity Services (el botón oficial de Google).
// Con este flujo la ventana de Google se abre desde nuestro dominio y muestra
// "Forcepx" en vez del dominio de Supabase.

const GSI_SRC = "https://accounts.google.com/gsi/client";

export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

let loadPromise = null;

export function loadGoogleIdentity() {
  if (window.google?.accounts?.id) {
    return Promise.resolve(window.google.accounts.id);
  }
  if (!loadPromise) {
    loadPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = GSI_SRC;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve(window.google.accounts.id);
      script.onerror = () => {
        loadPromise = null;
        script.remove();
        reject(new Error("No se pudo cargar el inicio de sesión de Google"));
      };
      document.head.appendChild(script);
    });
  }
  return loadPromise;
}

// Supabase exige un nonce: a Google se le manda el hash SHA-256 y a Supabase
// el valor original, que Supabase vuelve a hashear para compararlo con el token.
export async function createNonce() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const raw = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(raw));
  const hashed = Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
  return { raw, hashed };
}
