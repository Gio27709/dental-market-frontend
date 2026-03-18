export const generateCartItemUniqueId = (productId, variationId) => {
  return `${productId}-${variationId}`;
};

export const validateCartItemQuantity = (requestedQuantity, stock) => {
  const quantity = Math.max(1, requestedQuantity); // At least 1
  return Math.min(quantity, stock); // At most the available stock
};
