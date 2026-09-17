import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

// PWA (instalable en el teléfono). Criterios:
// - Solo se guarda de antemano lo mínimo para abrir la app (HTML, CSS y JS de entrada, íconos):
//   el build completo pesa ~5,6 MB y los datos móviles cuestan. El resto de /assets se guarda al
//   usarlo (sus nombres llevan hash, nunca cambian).
// - La API nunca pasa por la caché: precios, stock, pedidos y sesión siempre salen del servidor.
// - Las fotos públicas de Supabase Storage se guardan 7 días (ahorran datos al volver).
// - Actualización «prompt»: la registra components/pwa/ActualizacionPwa.jsx, que aplica la
//   versión nueva sola si la app se acaba de abrir y, si no, pregunta (no recarga a mitad de un pago).
const pwa = VitePWA({
  registerType: "prompt",
  injectRegister: false,
  manifest: {
    id: "/",
    name: "Forcepx · Insumos odontológicos",
    short_name: "Forcepx",
    description:
      "Marketplace de insumos y equipos odontológicos en Venezuela: tiendas verificadas, compra protegida y envío a todo el país.",
    lang: "es-VE",
    dir: "ltr",
    start_url: "/?origen=app",
    scope: "/",
    display: "standalone",
    background_color: "#6b1e96",
    theme_color: "#6b1e96",
    categories: ["shopping", "medical", "business"],
    icons: [
      { src: "/icons/logo-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/logo-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/logo-maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/logo-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Catálogo", url: "/store-catalog?origen=atajo", icons: [{ src: "/icons/logo-192.png", sizes: "192x192" }] },
      { name: "Mis pedidos", url: "/account/orders?origen=atajo", icons: [{ src: "/icons/logo-192.png", sizes: "192x192" }] },
      { name: "Carrito", url: "/cart?origen=atajo", icons: [{ src: "/icons/logo-192.png", sizes: "192x192" }] },
      { name: "Soporte", url: "/account/support?origen=atajo", icons: [{ src: "/icons/logo-192.png", sizes: "192x192" }] },
    ],
  },
  workbox: {
    globPatterns: [
      "index.html",
      "assets/index-*.{js,css}",
      "assets/vendor-react-*.js",
      "assets/vendor-supabase-*.js",
      "favicon-32.png",
      "favicon-48.png",
      "apple-touch-icon-logo.png",
      // Los íconos del manifiesto los añade el plugin solo (includeManifestIcons).
    ],
    // Las navegaciones (abrir la app, recargar, atajos) sirven el index.html guardado: abre
    // aunque la red sea mala. Nunca para la API, el socket, /health ni archivos sueltos.
    navigateFallback: "/index.html",
    navigateFallbackDenylist: [/^\/api\//, /^\/socket\.io/, /^\/health/, /\/[^/?]+\.[a-z0-9]+$/i],
    cleanupOutdatedCaches: true,
    runtimeCaching: [
      {
        urlPattern: ({ url, sameOrigin }) => sameOrigin && url.pathname.startsWith("/assets/"),
        handler: "CacheFirst",
        options: {
          cacheName: "forcepx-assets",
          expiration: { maxEntries: 160, maxAgeSeconds: 30 * 24 * 60 * 60 },
          cacheableResponse: { statuses: [200] },
        },
      },
      {
        urlPattern: ({ url }) => url.origin === "https://fonts.googleapis.com",
        handler: "StaleWhileRevalidate",
        options: { cacheName: "forcepx-fuentes-css", expiration: { maxEntries: 10 } },
      },
      {
        urlPattern: ({ url }) => url.origin === "https://fonts.gstatic.com",
        handler: "CacheFirst",
        options: {
          cacheName: "forcepx-fuentes",
          expiration: { maxEntries: 20, maxAgeSeconds: 365 * 24 * 60 * 60 },
          cacheableResponse: { statuses: [0, 200] },
        },
      },
      {
        // Solo imágenes PÚBLICAS de Storage; los comprobantes van firmados (/object/sign/) y no se guardan.
        // Un <img> de otro dominio da respuesta «opaca» y Chrome la cuenta como varios MB de cuota:
        // por eso el tope es bajo y se purga si falta espacio.
        urlPattern: ({ url, request }) =>
          request.destination === "image" && url.hostname.endsWith(".supabase.co") && url.pathname.includes("/storage/v1/object/public/"),
        handler: "CacheFirst",
        options: {
          cacheName: "forcepx-imagenes",
          expiration: { maxEntries: 60, maxAgeSeconds: 7 * 24 * 60 * 60, purgeOnQuotaError: true },
          cacheableResponse: { statuses: [0, 200] },
        },
      },
    ],
  },
});

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [tailwindcss(), react(), pwa],
  // Red de seguridad para llamadas relativas a "/api/*" en desarrollo. La capa normal
  // (services/api.js) usa VITE_API_URL absoluta y no pasa por aquí; esto evita que una
  // llamada relativa suelta reciba el index.html del SPA en vez de un error visible.
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:4000",
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-charts': ['recharts'],
        }
      }
    }
  }
});
