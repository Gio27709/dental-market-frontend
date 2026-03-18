export const formatCurrencyVES = (amount) => {
  return new Intl.NumberFormat("es-VE", {
    style: "currency",
    currency: "VES",
  }).format(amount);
};

export const formatCurrencyUSD = (amount) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
};

export const formatCartItemSubtotal = (price, quantity) => {
  return price * quantity;
};

export const formatOrderNumber = (id) => {
  if (!id) return "";
  // Display only the first 6 characters to make them manageable (assuming UUID source)
  return `ORD-${id.substring(0, 6).toUpperCase()}`;
};

export const formatPhoneNumber = (phone) => {
  if (!phone) return phone;
  const digits = phone.replace(/\D/g, "");
  if (digits.length >= 11) {
    return `${digits.substring(0, 4)}-${digits.substring(4, 11)}`;
  }
  return phone;
};

export const formatOrderDate = (dateStr) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleDateString("es-VE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};
