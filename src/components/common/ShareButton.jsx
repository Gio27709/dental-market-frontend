import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import { track } from "../../services/tracking";

// Botón «Compartir» para producto, tienda y noticia. En móvil usa el menú nativo
// (navigator.share: WhatsApp, Telegram, correo…); en escritorio abre un menú propio con
// WhatsApp, copiar enlace, Facebook y X. Las vistas previas salen bien porque el servidor
// ya devuelve los metadatos del recurso (Fase C). Registra `share_click` con el método.

const ITEMS = [
  { key: "whatsapp", label: "WhatsApp", href: (u, t) => `https://wa.me/?text=${encodeURIComponent(`${t} ${u}`)}` },
  { key: "facebook", label: "Facebook", href: (u) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(u)}` },
  { key: "x", label: "X", href: (u, t) => `https://twitter.com/intent/tweet?text=${encodeURIComponent(t)}&url=${encodeURIComponent(u)}` },
];

export default function ShareButton({ title, text, url, className = "", iconClassName = "w-5 h-5", label = "Compartir" }) {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);
  const shareUrl = url || (typeof window !== "undefined" ? window.location.href : "");
  const shareText = text || title || "";

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => boxRef.current && !boxRef.current.contains(e.target) && setOpen(false);
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const log = (method) => track("share_click", { path: pathname, properties: { method } });

  const onClick = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, text: shareText, url: shareUrl });
        log("native");
      } catch (err) {
        if (err?.name !== "AbortError") setOpen(true); // sin menú nativo disponible: menú propio
      }
      return;
    }
    setOpen((v) => !v);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Enlace copiado", { icon: "🔗" });
      log("copy");
    } catch {
      toast.error("No se pudo copiar el enlace");
    }
    setOpen(false);
  };

  return (
    <div ref={boxRef} className="relative inline-block">
      <button type="button" onClick={onClick} aria-haspopup="menu" aria-expanded={open} className={className}>
        <svg className={iconClassName} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <circle cx="18" cy="5" r="3" strokeWidth={1.5} />
          <circle cx="6" cy="12" r="3" strokeWidth={1.5} />
          <circle cx="18" cy="19" r="3" strokeWidth={1.5} />
          <path strokeWidth={1.5} strokeLinecap="round" d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" />
        </svg>
        {label && <span>{label}</span>}
      </button>

      {open && (
        <div role="menu" className="absolute right-0 z-[70] mt-2 w-48 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
          {ITEMS.map((it) => (
            <a
              key={it.key}
              role="menuitem"
              href={it.href(shareUrl, shareText)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                log(it.key);
                setOpen(false);
              }}
              className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              {it.label}
            </a>
          ))}
          <button type="button" role="menuitem" onClick={copy} className="block w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 border-t border-gray-100">
            Copiar enlace
          </button>
        </div>
      )}
    </div>
  );
}
