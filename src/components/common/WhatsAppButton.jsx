import { useLocation } from "react-router-dom";
import { track } from "../../services/tracking";

// Botón flotante «Escríbenos» por WhatsApp. Solo existe si hay VITE_WHATSAPP_NUMBER
// (dígitos con código de país, p. ej. 584121234567); sin número no se renderiza nada.
// Vive en el layout público (EcommerceLayout): los paneles de admin, tienda, rider y
// clínica usan otros layouts y no lo muestran. Se oculta en el pago para no tapar el
// botón de confirmar en móvil.

const NUMBER = String(import.meta.env.VITE_WHATSAPP_NUMBER || "").replace(/\D/g, "");
const HIDDEN_PREFIXES = ["/checkout", "/order-success"];

export default function WhatsAppButton() {
  const { pathname } = useLocation();
  if (!NUMBER || HIDDEN_PREFIXES.some((p) => pathname.startsWith(p))) return null;

  const pageUrl = typeof window !== "undefined" ? window.location.href : "";
  const text = `Hola, escribo desde Forcepx${pageUrl ? ` (${pageUrl})` : ""}. `;
  const href = `https://wa.me/${NUMBER}?text=${encodeURIComponent(text)}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => track("whatsapp_click", { path: pathname })}
      aria-label="Escríbenos por WhatsApp"
      className="fixed bottom-5 right-5 z-[80] flex items-center gap-2 rounded-full bg-[#25D366] text-white shadow-lg shadow-black/20 pl-3 pr-4 py-3 hover:bg-[#1ebe5b] active:scale-95 transition-all"
    >
      <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current" aria-hidden="true">
        <path d="M17.5 14.4c-.3-.1-1.8-.9-2-1-.3-.1-.5-.1-.7.1-.2.3-.8 1-.9 1.2-.2.2-.3.2-.6.1-.3-.1-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6l.5-.5c.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2-1.4.2-.7.2-1.3.2-1.4-.1-.2-.3-.3-.6-.4zM12 2C6.5 2 2 6.5 2 12c0 1.8.5 3.5 1.3 5L2 22l5.2-1.3c1.5.8 3.1 1.2 4.8 1.2 5.5 0 10-4.5 10-10S17.5 2 12 2zm0 18.2c-1.5 0-3-.4-4.2-1.2l-.3-.2-3.1.8.8-3-.2-.3C4.2 15 3.8 13.5 3.8 12c0-4.5 3.7-8.2 8.2-8.2s8.2 3.7 8.2 8.2-3.7 8.2-8.2 8.2z" />
      </svg>
      <span className="text-sm font-semibold hidden sm:inline">Escríbenos</span>
    </a>
  );
}
