export const generateCartItemUniqueId = (productId, variationId) => {
  return `${productId}-${variationId}`;
};

// Convierte un monto que puede venir como texto ("100.00", numeric de Postgres) a número.
// Si no es convertible devuelve 0 para que nunca se propague NaN ni texto al carrito.
export const toMoney = (value) => {
  if (value === null || value === undefined || value === "") return 0;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

// Garantiza que los campos numéricos de un item del carrito sean números reales,
// venga de la API, de localStorage o de un producto del catálogo.
export const normalizeCartItem = (item) => ({
  ...item,
  price_usd: toMoney(item.price_usd),
  original_price_usd:
    item.original_price_usd === undefined || item.original_price_usd === null
      ? toMoney(item.price_usd)
      : toMoney(item.original_price_usd),
  quantity: Math.max(1, parseInt(item.quantity, 10) || 1),
  delivery_fee: toMoney(item.delivery_fee),
});

export const validateCartItemQuantity = (requestedQuantity, stock) => {
  const quantity = Math.max(1, requestedQuantity); // At least 1
  return Math.min(quantity, stock); // At most the available stock
};
