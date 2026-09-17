// Rutas a las que el asistente puede llevar al usuario. Misma lista que el backend
// (backend/src/services/bot/botReglas.js): si se cambia una, hay que cambiar la otra.
// El navegador vuelve a comprobarla porque la acción viene de la respuesta de una IA.
// Los paneles (/clinic, /store, /delivery, /admin) el backend solo los ofrece si el tipo de
// cuenta entra; aquí se aceptan como destino y los sigue protegiendo ProtectedRoute.

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const RUTAS_FIJAS = new Set([
  "/", "/store-catalog", "/cart", "/checkout", "/promociones", "/news", "/courses",
  "/contacto", "/acerca", "/privacidad", "/devoluciones", "/terminos",
  "/login", "/register", "/afiliate", "/clinic/membership",
  "/account", "/account/orders", "/account/favorites", "/account/downloads", "/account/reviews",
  "/account/notifications", "/account/password", "/account/addresses", "/account/payment-methods",
  "/account/support", "/account/posts", "/account/professional-verification",
  "/clinic", "/store", "/delivery", "/admin",
]);

const RUTAS_CON_ID = [
  /^\/product\/[0-9a-f-]{36}$/i,
  /^\/store\/[0-9a-f-]{36}$/i,
  /^\/account\/orders\/[0-9a-f-]{36}$/i,
  /^\/news\/[\w-]{1,120}$/,
  /^\/courses\/[\w-]{1,120}$/,
];

/** Ruta limpia si está permitida, o null. En el catálogo solo se conservan search y category. */
export function validarRuta(ruta) {
  if (typeof ruta !== "string") return null;
  const limpia = ruta.trim();
  if (!limpia.startsWith("/") || limpia.startsWith("//") || limpia.length > 200) return null;
  const [camino, query = ""] = limpia.split("?");
  const permitido = RUTAS_FIJAS.has(camino) || RUTAS_CON_ID.some((re) => re.test(camino));
  if (!permitido) return null;
  if (!query || camino !== "/store-catalog") return camino;
  const params = new URLSearchParams(query);
  const salida = new URLSearchParams();
  const search = params.get("search");
  const category = params.get("category");
  if (search) salida.set("search", search.slice(0, 80));
  if (category && UUID_RE.test(category)) salida.set("category", category);
  const qs = salida.toString();
  return qs ? `${camino}?${qs}` : camino;
}

/** Nombre corto para el botón de una ruta mencionada en el texto. */
const NOMBRES = {
  "/": "Inicio",
  "/store-catalog": "Catálogo",
  "/cart": "Carrito",
  "/checkout": "Pagar",
  "/promociones": "Promociones",
  "/news": "Noticias",
  "/courses": "Cursos",
  "/contacto": "Contacto",
  "/acerca": "Acerca de",
  "/privacidad": "Privacidad",
  "/devoluciones": "Devoluciones",
  "/terminos": "Términos",
  "/login": "Iniciar sesión",
  "/register": "Crear cuenta",
  "/afiliate": "Afíliate",
  "/clinic/membership": "Membresía clínica",
  "/account": "Mi cuenta",
  "/account/orders": "Mis pedidos",
  "/account/favorites": "Favoritos",
  "/account/support": "Soporte",
  "/account/addresses": "Mis direcciones",
  "/account/notifications": "Notificaciones",
  "/account/password": "Contraseña",
  "/account/professional-verification": "Verificación profesional",
  "/clinic": "Gestión Clínica",
  "/store": "Panel de tienda",
  "/delivery": "Panel de repartidor",
  "/admin": "Panel de administración",
};

export function nombreRuta(ruta) {
  const camino = ruta.split("?")[0];
  if (NOMBRES[camino]) return NOMBRES[camino];
  if (camino.startsWith("/product/")) return "Ver producto";
  if (camino.startsWith("/store/")) return "Ver tienda";
  if (camino.startsWith("/account/orders/")) return "Ver pedido";
  if (camino.startsWith("/news/")) return "Ver noticia";
  if (camino.startsWith("/courses/")) return "Ver curso";
  return camino;
}
