// Áreas del panel de administración. Misma lista que backend/src/config/permissions.js:
// si se añade un área hay que tocar los dos archivos. El owner lo ve todo; un admin solo
// las áreas marcadas en su cuenta (o el comodín "*").

export const PERMISSIONS_LIST = [
  { key: "manage_users", label: "Usuarios", desc: "Crear cuentas, asignar roles y permisos, verificar licencias profesionales." },
  { key: "manage_stores", label: "Tiendas y repartidores", desc: "Solicitudes de tienda y de repartidor, suspensiones, salud de tiendas." },
  { key: "manage_products", label: "Productos", desc: "Moderar productos, descuentos y promociones de las tiendas." },
  { key: "manage_orders", label: "Pedidos y pagos", desc: "Aprobar o rechazar pagos, pedidos, reembolsos, devoluciones, escrow y sanciones." },
  { key: "manage_payouts", label: "Retiros", desc: "Aprobar y pagar los retiros que solicitan las tiendas." },
  { key: "manage_support", label: "Soporte", desc: "Atender y cerrar tickets de soporte." },
  { key: "manage_content", label: "Contenido", desc: "Noticias, cursos, categorías, marcas, secciones de la home y boletín." },
  { key: "manage_settings", label: "Ajustes", desc: "Configuración, tasa BCV, métodos de pago, avisos masivos y membresías clínicas." },
  { key: "view_analytics", label: "Analíticas", desc: "Ver las estadísticas del negocio (todos los departamentos)." },
];

// Qué área exige cada ruta del panel. El tablero (/admin) no exige ninguna.
export const PATH_PERMISSIONS = {
  "/admin/analytics": "view_analytics",
  "/admin/users": "manage_users",
  "/admin/professional-verifications": "manage_users",
  "/admin/support": "manage_support",
  "/admin/payment-approvals": "manage_orders",
  "/admin/payment-history": "manage_orders",
  "/admin/orders": "manage_orders",
  "/admin/refunds": "manage_orders",
  "/admin/penalties": "manage_orders",
  "/admin/payouts": "manage_payouts",
  "/admin/product-moderation": "manage_products",
  "/admin/promotions": "manage_products",
  "/admin/store-applications": "manage_stores",
  "/admin/rider-applications": "manage_stores",
  "/admin/clinic-memberships": "manage_settings",
  "/admin/settings": "manage_settings",
  "/admin/payment-methods": "manage_settings",
  "/admin/notifications": "manage_settings",
  "/admin/categories": "manage_content",
  "/admin/courses": "manage_content",
  "/admin/posts": "manage_content",
  "/admin/home-content": "manage_content",
  "/admin/newsletter": "manage_content",
};

/** Permiso que exige una ruta (por prefijo más largo), o null si no exige ninguno. */
export function permissionForPath(pathname) {
  const hit = Object.keys(PATH_PERMISSIONS)
    .filter((p) => pathname === p || pathname.startsWith(p + "/"))
    .sort((a, b) => b.length - a.length)[0];
  return hit ? PATH_PERMISSIONS[hit] : null;
}

/** ¿Puede este usuario (rol + permisos de su cuenta) entrar al área `key`? */
export function canAccess(user, key) {
  if (!user) return false;
  if (user.role === "owner") return true;
  if (user.role !== "admin") return false;
  if (!key) return true;
  const perms = user.permissions || {};
  return perms["*"] === true || perms[key] === true;
}
