export const API_ENDPOINTS = {
  PRODUCTS: "/products",
  ORDERS: "/orders",
  WISHLIST: "/wishlist",
  SETTINGS: "/settings", // Assuming there is a settings endpoint for BCV
};

export const BCV_RATE_KEY = "bcv_rate";

export const PAYMENT_METHODS = {
  transferencia: { label: "Transferencia Bancaria", icon: "🏦" },
  pago_movil: { label: "Pago Móvil", icon: "📱" },
  zelle: { label: "Zelle", icon: "💵" },
  paypal: { label: "PayPal", icon: "🅿️" },
  binance: { label: "Binance", icon: "🪙" },
};

export const BANK_DATA = {
  transferencia: {
    bank: "Bancamiga",
    account: "0175-0000-00-0000000000",
    rif: "J-00000000-0",
    name: "Forcepx C.A.",
  },
  pago_movil: {
    bank: "Bancamiga",
    phone: "0412-0000000",
    rif: "J-00000000-0",
    name: "Forcepx C.A.",
  },
  zelle: { email: "pagos@forcepx.com", name: "Forcepx C.A." },
  paypal: { email: "pagos@forcepx.com", name: "Forcepx C.A." },
  binance: { pay_id: "987654321", email: "pagos@forcepx.com", name: "Forcepx C.A." },
};

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
  failed: { label: "Cancelado", color: "red" },
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
