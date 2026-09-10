// Vocabulario compartido de soporte (Fase N3/N5): categorías con subtipos, prioridades y
// etiquetas de rol/estado. Lo usan el formulario del cliente (Account/Support) y el panel del
// admin (AdminSupport). El backend acepta las mismas claves de categoría (supportController).

export const CATEGORIAS = {
  order_issue: {
    label: "Problema con un pedido",
    icon: "local_shipping",
    hint: "Un pedido que hiciste (o recibiste, si eres tienda) no salió como esperabas.",
    subtipos: {
      not_arrived: "No ha llegado",
      damaged: "Llegó dañado",
      incomplete: "Llegó incompleto",
      wrong_item: "Producto equivocado",
      cancel: "Quiero cancelarlo",
      other: "Otro",
    },
  },
  payment: {
    label: "Pagos o facturación",
    icon: "payments",
    hint: "Pagos que no se aprueban, cobros que no cuadran o comprobantes.",
    subtipos: {
      not_approved: "Mi pago no ha sido aprobado",
      approved_no_order: "Pago aprobado pero el pedido no aparece",
      wrong_amount: "Me cobraron un monto distinto",
      refund: "Reembolso",
      other: "Otro",
    },
  },
  product_issue: {
    label: "Problema con un producto",
    icon: "inventory_2",
    hint: "Información incorrecta, calidad o disponibilidad de un producto del catálogo.",
    subtipos: {
      wrong_info: "Información o precio incorrecto",
      quality: "Calidad o vencimiento",
      not_available: "No disponible o sin stock",
      counterfeit: "Sospecha de producto no original",
      other: "Otro",
    },
  },
  account: {
    label: "Mi cuenta",
    icon: "person",
    hint: "Acceso, datos personales, verificación o eliminación de la cuenta.",
    subtipos: {
      login: "No puedo iniciar sesión",
      data: "Cambiar mis datos",
      verification: "Verificación de mi cuenta",
      notifications: "Notificaciones o correos",
      delete: "Eliminar mi cuenta",
      other: "Otro",
    },
  },
  store: {
    label: "Mi tienda",
    icon: "storefront",
    soloTienda: true,
    hint: "Retiros, catálogo, pedidos recibidos o una sanción sobre tu tienda.",
    subtipos: {
      payout: "Retiro de dinero",
      catalog: "Catálogo o productos",
      orders: "Pedidos recibidos",
      sanction: "Sanción o suspensión",
      delivery: "Repartidores o zonas de entrega",
      other: "Otro",
    },
  },
  logistics: {
    label: "Envíos y entregas",
    icon: "package_2",
    hint: "Repartidor, empresa de encomienda o retiro en tienda.",
    subtipos: {
      rider: "Repartidor",
      carrier: "Empresa de encomienda (Zoom, MRW, Tealca…)",
      pickup: "Retiro en tienda",
      address: "Dirección o ubicación",
      other: "Otro",
    },
  },
  app: {
    label: "Error en la aplicación",
    icon: "bug_report",
    hint: "Algo falla en pantalla, no carga o se comporta raro.",
    subtipos: {
      screen_error: "Error en pantalla",
      slow: "Lento o no carga",
      button: "Un botón no hace nada",
      display: "Se ve mal en mi dispositivo",
      other: "Otro",
    },
  },
  other: {
    label: "Otro asunto",
    icon: "help",
    hint: "Cualquier otra duda o sugerencia.",
    subtipos: {},
  },
};

export const etiquetaCategoria = (key) => CATEGORIAS[key]?.label || key || "Sin categoría";
export const etiquetaSubtipo = (category, subtype) =>
  (subtype && CATEGORIAS[category]?.subtipos?.[subtype]) || null;

export const categoriasPara = (role) =>
  Object.entries(CATEGORIAS).filter(([, c]) => !c.soloTienda || role === "store");

export const PRIORIDADES = {
  low: { label: "Baja", color: "#64748b", bg: "#f1f5f9" },
  normal: { label: "Normal", color: "#2563eb", bg: "#dbeafe" },
  high: { label: "Alta", color: "#d97706", bg: "#fef3c7" },
  urgent: { label: "Urgente", color: "#dc2626", bg: "#fee2e2" },
};

export const ESTADOS_TICKET = {
  open: { label: "Abierto", color: "#2563eb", bg: "#dbeafe" },
  in_progress: { label: "En Proceso", color: "#d97706", bg: "#fef3c7" },
  resolved: { label: "Resuelto", color: "#16a34a", bg: "#dcfce7" },
  closed: { label: "Cerrado", color: "#4b5563", bg: "#f3f4f6" },
};

export const ROLES_LEGIBLES = {
  user: "Comprador",
  professional: "Odontólogo",
  student: "Estudiante",
  store: "Tienda",
  delivery: "Repartidor",
  admin: "Admin",
  owner: "Owner",
};

export const ESTADO_PAGO = {
  pending: "Pago pendiente",
  under_review: "Pago en revisión",
  approved: "Pago aprobado",
  rejected: "Pago rechazado",
  failed: "Pago fallido",
};

export const ESTADO_PEDIDO = {
  pending: "Pendiente",
  processing: "En preparación",
  completed: "Completado",
  cancelled: "Cancelado",
};

export const ESTADO_ENTREGA = {
  pending: "Pendiente",
  processing: "En preparación",
  shipped: "Enviado",
  in_transit: "En camino",
  delivered: "Entregado",
  cancelled: "Cancelado",
  failed: "Entrega fallida",
};

// Navegador legible a partir del user-agent guardado en device_info.
export const navegadorLegible = (ua = "") => {
  if (!ua) return null;
  const so = /Android/i.test(ua)
    ? "Android"
    : /iPhone|iPad/i.test(ua)
      ? "iOS"
      : /Windows/i.test(ua)
        ? "Windows"
        : /Mac OS/i.test(ua)
          ? "macOS"
          : /Linux/i.test(ua)
            ? "Linux"
            : null;
  const nav = /Edg\//i.test(ua)
    ? "Edge"
    : /OPR\//i.test(ua)
      ? "Opera"
      : /Chrome\//i.test(ua)
        ? "Chrome"
        : /Firefox\//i.test(ua)
          ? "Firefox"
          : /Safari\//i.test(ua)
            ? "Safari"
            : null;
  return [nav, so].filter(Boolean).join(" · ") || null;
};
