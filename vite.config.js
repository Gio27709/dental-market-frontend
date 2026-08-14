import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [tailwindcss(), react()],
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
