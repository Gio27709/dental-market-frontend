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
  efectivo: { label: "Efectivo", icon: "💰" },
};

export const BANK_DATA = {
  transferencia: {
    bank: "Bancamiga",
    account: "0175-0000-00-0000000000",
    rif: "J-00000000-0",
    name: "DentalMarket C.A.",
  },
  pago_movil: {
    bank: "Bancamiga",
    phone: "0412-0000000",
    rif: "J-00000000-0",
    name: "DentalMarket C.A.",
  },
  zelle: { email: "pagos@dentalmarket.com", name: "DentalMarket C.A." },
};

export const ORDER_STATUS = {
  pending: { label: "Pendiente", color: "gray" },
  pending_approval: { label: "Pendiente de aprobación", color: "yellow" },
  under_review: { label: "En revisión", color: "yellow" },
  approved: { label: "Pago aprobado", color: "blue" },
  processing: { label: "En proceso", color: "blue" },
  shipped: { label: "Enviado", color: "green" },
  delivered: { label: "Entregado", color: "emerald" },
  cancelled: { label: "Cancelado", color: "red" },
  rejected: { label: "Rechazado", color: "red" },
};

export const CARRIER_ICONS = {
  zoom: { label: "Zoom", icon: "🟡" },
  mrw: { label: "MRW", icon: "🔵" },
  tealca: { label: "Tealca", icon: "🟠" },
  default: { label: "Envío", icon: "📦" },
};
