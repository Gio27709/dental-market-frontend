export const API_ENDPOINTS = {
  PRODUCTS: "/products",
  ORDERS: "/orders",
  WISHLIST: "/wishlist",
  SETTINGS: "/settings", // Assuming there is a settings endpoint for BCV
};

export const BCV_RATE_KEY = "bcv_rate";

/**
 * COPIA DE RESPALDO de los métodos de cobro. NO es la fuente de verdad.
 *
 * La lista buena vive en `global_settings.payment_methods` (migración 070) y se edita desde
 * /admin/payment-methods. Esta copia existe para dos cosas y solo dos:
 *
 *   1. El primer pintado, antes de que llegue la respuesta de `/admin/settings`.
 *   2. Poner nombre a un pedido histórico pagado con un método que luego se apagó — un
 *      método desactivado no viaja en la respuesta pública, pero el pedido sigue ahí.
 *
 * Si editas datos de cuenta aquí no cambia nada en producción: cámbialos en el panel.
 * Se mantiene sincronizada con la siembra de la migración 070 por si alguien monta el
 * proyecto desde cero y todavía no la ha aplicado.
 */
export const PAYMENT_METHODS_RESPALDO = [
  {
    key: "transferencia",
    label: "Transferencia Bancaria",
    icon: "🏦",
    activo: true,
    fijo: true,
    formulario: "banco",
    nota: "Transfiera el monto exacto a la siguiente cuenta:",
    campos: [
      { etiqueta: "Banco", valor: "Bancamiga", copiable: true },
      { etiqueta: "Cuenta", valor: "0175-0000-00-0000000000", copiable: true },
      { etiqueta: "RIF", valor: "J-00000000-0", copiable: true },
      { etiqueta: "Titular", valor: "Forcepx C.A.", copiable: false },
    ],
  },
  {
    key: "pago_movil",
    label: "Pago Móvil",
    icon: "📱",
    activo: true,
    fijo: true,
    formulario: "banco",
    nota: "Realice su Pago Móvil con los siguientes datos:",
    campos: [
      { etiqueta: "Banco", valor: "Bancamiga", copiable: true },
      { etiqueta: "Teléfono", valor: "0412-0000000", copiable: true },
      { etiqueta: "RIF", valor: "J-00000000-0", copiable: true },
      { etiqueta: "Titular", valor: "Forcepx C.A.", copiable: false },
    ],
  },
  {
    key: "zelle",
    label: "Zelle",
    icon: "💵",
    activo: true,
    fijo: false,
    formulario: "billetera",
    nota: "Envíe el pago exacto en dólares (USD) al siguiente correo:",
    campos: [
      { etiqueta: "Email", valor: "pagos@forcepx.com", copiable: true },
      { etiqueta: "Nombre", valor: "Forcepx C.A.", copiable: false },
    ],
  },
  {
    key: "paypal",
    label: "PayPal",
    icon: "🅿️",
    activo: true,
    fijo: false,
    formulario: "billetera",
    nota: "Envíe el pago en dólares (USD) a la siguiente cuenta de PayPal:",
    campos: [
      { etiqueta: "Email", valor: "pagos@forcepx.com", copiable: true },
      { etiqueta: "Titular", valor: "Forcepx C.A.", copiable: false },
    ],
  },
  {
    key: "binance",
    label: "Binance",
    icon: "🪙",
    activo: true,
    fijo: false,
    formulario: "billetera",
    nota: "Realice el envío de USDT a la siguiente cuenta de Binance (Binance Pay ID / Correo):",
    campos: [
      { etiqueta: "Pay ID", valor: "987654321", copiable: true },
      { etiqueta: "Email", valor: "pagos@forcepx.com", copiable: true },
      { etiqueta: "Titular", valor: "Forcepx C.A.", copiable: false },
    ],
  },
  {
    key: "zinli",
    label: "Zinli",
    icon: "💳",
    activo: true,
    fijo: false,
    formulario: "billetera",
    nota: "Envíe el pago en dólares (USD) desde su app Zinli a los siguientes datos:",
    campos: [
      { etiqueta: "Email", valor: "pagos@forcepx.com", copiable: true },
      { etiqueta: "Zinli Tag", valor: "@forcepx", copiable: true },
      { etiqueta: "Titular", valor: "Forcepx C.A.", copiable: false },
    ],
  },
];

/**
 * Mapa clave → método del respaldo. Se conserva con este nombre porque varios sitios solo
 * necesitan poner nombre a un pedido ya hecho (`PAYMENT_METHODS[x]?.label || x`) y no les
 * hace falta el hook. Para el checkout usa siempre `usePaymentMethods`.
 */
export const PAYMENT_METHODS = PAYMENT_METHODS_RESPALDO.reduce((acc, m) => {
  acc[m.key] = m;
  return acc;
}, {});

export const ORDER_STATUS = {
  pending: { label: "Pendiente", color: "gray" },
  pending_approval: { label: "Pendiente de aprobación", color: "yellow" },
  under_review: { label: "En revisión", color: "yellow" },
  approved: { label: "Pago aprobado", color: "blue" },
  processing: { label: "En proceso", color: "blue" },
  shipped: { label: "Enviado", color: "indigo" },
  picked_up: { label: "Recogido por rider", color: "indigo" },
  arrived: { label: "Rider en destino", color: "indigo" },
  delivered: { label: "Entregado", color: "emerald" },
  cancelled: { label: "Cancelado", color: "red" },
  rejected: { label: "Rechazado", color: "red" },
  failed: { label: "Entrega Fallida", color: "red" },
  expired: { label: "Plazo Vencido", color: "red" },
  returned: { label: "Devuelto", color: "yellow" },
};

export const CARRIER_ICONS = {
  zoom: { label: "Zoom", icon: "🟡" },
  mrw: { label: "MRW", icon: "🔵" },
  tealca: { label: "Tealca", icon: "🟠" },
  default: { label: "Envío", icon: "📦" },
};

export const COUNTRY_CODES = [
  { code: "+58",  flag: "🇻🇪", name: "Venezuela",  minDigits: 10, maxDigits: 10 },
  { code: "+57",  flag: "🇨🇴", name: "Colombia",   minDigits: 10, maxDigits: 10 },
  { code: "+56",  flag: "🇨🇱", name: "Chile",      minDigits: 9,  maxDigits: 9  },
  { code: "+54",  flag: "🇦🇷", name: "Argentina",  minDigits: 10, maxDigits: 10 },
  { code: "+52",  flag: "🇲🇽", name: "México",     minDigits: 10, maxDigits: 10 },
  { code: "+55",  flag: "🇧🇷", name: "Brasil",     minDigits: 10, maxDigits: 11 },
  { code: "+51",  flag: "🇵🇪", name: "Perú",       minDigits: 9,  maxDigits: 9  },
  { code: "+593", flag: "🇪🇨", name: "Ecuador",    minDigits: 9,  maxDigits: 9  },
  { code: "+1",   flag: "🇺🇸", name: "USA",        minDigits: 10, maxDigits: 10 },
];
