import { useEffect } from "react";
import { useLocation, matchPath } from "react-router-dom";

// SEO para una SPA: título, descripción, canonical, Open Graph y JSON-LD por página.
// No usa react-helmet: son ~15 etiquetas y así no entra una dependencia ni un Provider.
// Google ejecuta JavaScript, por lo que lo que se escribe aquí es lo que indexa.

export const SITE_URL = "https://forcepx.com";
export const SITE_NAME = "Forcepx";
export const DEFAULT_TITLE = "Forcepx | Insumos y equipos odontológicos en Venezuela";
export const DEFAULT_DESCRIPTION =
  "Forcepx es el marketplace que conecta odontólogos y clínicas con tiendas verificadas de insumos dentales. Compra protegida, entrega con seguimiento y pago en bolívares o dólares.";
export const DEFAULT_IMAGE = `${SITE_URL}/og-image.png`;

const TITLE_MAX = 60;
const DESC_MAX = 160;

export function stripHtml(html) {
  return String(html || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function truncate(text, max) {
  const t = stripHtml(text);
  if (t.length <= max) return t;
  return t.slice(0, max - 1).replace(/\s+\S*$/, "") + "…";
}

export function pageTitle(title) {
  if (!title) return DEFAULT_TITLE;
  const t = truncate(title, TITLE_MAX - SITE_NAME.length - 3);
  return `${t} | ${SITE_NAME}`;
}

function upsert(selector, create, attrs) {
  let el = document.head.querySelector(selector);
  if (!el) {
    el = create();
    document.head.appendChild(el);
  }
  Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
  return el;
}

const metaByName = (name, content) =>
  upsert(`meta[name="${name}"]`, () => document.createElement("meta"), { name, content });
const metaByProp = (property, content) =>
  upsert(`meta[property="${property}"]`, () => document.createElement("meta"), { property, content });

export function applySeo({ title, description, image, path, type = "website", noindex = false, jsonLd = null } = {}) {
  if (typeof document === "undefined") return;
  const fullTitle = pageTitle(title);
  const desc = truncate(description || DEFAULT_DESCRIPTION, DESC_MAX);
  const url = SITE_URL + (path ?? window.location.pathname);
  const img = image || DEFAULT_IMAGE;

  document.title = fullTitle;
  metaByName("description", desc);
  metaByName("robots", noindex ? "noindex, nofollow" : "index, follow, max-image-preview:large");
  upsert('link[rel="canonical"]', () => document.createElement("link"), { rel: "canonical", href: url });

  metaByProp("og:site_name", SITE_NAME);
  metaByProp("og:locale", "es_VE");
  metaByProp("og:type", type);
  metaByProp("og:title", fullTitle);
  metaByProp("og:description", desc);
  metaByProp("og:url", url);
  metaByProp("og:image", img);

  metaByName("twitter:card", "summary_large_image");
  metaByName("twitter:title", fullTitle);
  metaByName("twitter:description", desc);
  metaByName("twitter:image", img);

  const existing = document.getElementById("seo-jsonld");
  if (jsonLd) {
    const script = existing || document.createElement("script");
    script.id = "seo-jsonld";
    script.type = "application/ld+json";
    script.textContent = JSON.stringify(jsonLd);
    if (!existing) document.head.appendChild(script);
  } else if (existing) {
    existing.remove();
  }
}

/**
 * Aplica el SEO de la página cuando `meta` está disponible. Pasar `null` mientras
 * cargan los datos: no toca nada y queda el título por defecto de la ruta.
 */
export function useSeo(meta) {
  const ld = meta?.jsonLd ? JSON.stringify(meta.jsonLd) : "";
  useEffect(() => {
    if (!meta) return;
    applySeo(meta);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meta?.title, meta?.description, meta?.image, meta?.path, meta?.type, meta?.noindex, ld]);
}

// Título/descripción por ruta mientras no hay datos, y `noindex` para lo privado.
// Las páginas con datos (producto, tienda, noticia, curso) lo sobreescriben al cargar.
const ROUTE_META = [
  { path: "/", title: null, description: DEFAULT_DESCRIPTION },
  { path: "/inicio", title: "Catálogo de insumos odontológicos", description: "Explora instrumental, materiales y equipos dentales de tiendas verificadas en Venezuela. Compara precios y compra con protección Forcepx." },
  { path: "/store-catalog", title: "Catálogo de productos dentales", description: "Filtra por categoría, marca, tienda y estado. Miles de insumos odontológicos con envío a toda Venezuela." },
  { path: "/promociones", title: "Promociones y descuentos dentales", description: "Ofertas vigentes en insumos y equipos odontológicos de las tiendas de Forcepx." },
  { path: "/news", title: "Noticias y comunidad odontológica", description: "Artículos, novedades y aprendizaje compartido por la comunidad de odontólogos de Forcepx." },
  { path: "/news/:id", title: "Noticia", description: null },
  { path: "/courses", title: "Cursos de odontología", description: "Formación continua para odontólogos y personal de clínica." },
  { path: "/courses/:id", title: "Curso", description: null },
  { path: "/product/:id", title: "Producto dental", description: null },
  { path: "/store/:id", title: "Tienda", description: null },
  { path: "/user/:id", title: "Perfil", description: null },
  { path: "/afiliate", title: "Vende en Forcepx: afilia tu tienda dental", description: "Publica tus productos ante miles de odontólogos y clínicas en Venezuela. Pagos protegidos y logística integrada." },
  { path: "/acerca", title: "Acerca de Forcepx", description: "Quiénes somos y por qué creamos el marketplace odontológico de Venezuela." },
  { path: "/contacto", title: "Contacto", description: "Escríbenos: soporte para compradores y tiendas de Forcepx." },
  { path: "/terminos", title: "Términos y condiciones", description: "Condiciones de uso del marketplace Forcepx." },
  { path: "/privacidad", title: "Política de privacidad", description: "Cómo tratamos tus datos en Forcepx." },
  { path: "/devoluciones", title: "Política de devoluciones", description: "Cómo funcionan las devoluciones y reembolsos en Forcepx." },
  { path: "/login", title: "Iniciar sesión", noindex: true },
  { path: "/register", title: "Crear cuenta", noindex: true },
  { path: "/update-password", title: "Cambiar contraseña", noindex: true },
  { path: "/cart", title: "Tu bolsa", noindex: true },
  { path: "/checkout/*", title: "Pagar", noindex: true },
  { path: "/order-success/*", title: "Pedido confirmado", noindex: true },
  { path: "/account/*", title: "Mi cuenta", noindex: true },
  { path: "/admin/*", title: "Administración", noindex: true },
  { path: "/store", title: "Panel de tienda", noindex: true },
  { path: "/store/products/*", title: "Panel de tienda", noindex: true },
  { path: "/store/orders", title: "Panel de tienda", noindex: true },
  { path: "/store/wallet", title: "Panel de tienda", noindex: true },
  { path: "/store/analytics", title: "Panel de tienda", noindex: true },
  { path: "/store/riders", title: "Panel de tienda", noindex: true },
  { path: "/store/profile", title: "Panel de tienda", noindex: true },
  { path: "/store/penalties", title: "Panel de tienda", noindex: true },
  { path: "/store/discounts", title: "Panel de tienda", noindex: true },
  { path: "/clinic/*", title: "Clínica", noindex: true },
  { path: "/rider/*", title: "Repartidor", noindex: true },
];

export function RouteMeta() {
  const { pathname } = useLocation();
  useEffect(() => {
    const m = ROUTE_META.find((r) => matchPath({ path: r.path, end: true }, pathname));
    applySeo({
      title: m?.title ?? null,
      description: m?.description ?? DEFAULT_DESCRIPTION,
      path: pathname,
      noindex: m ? !!m.noindex : true, // ruta desconocida (404) → no indexar
    });
  }, [pathname]);
  return null;
}
