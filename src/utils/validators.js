export const validatePhone = (phone) => {
  // Formato venezolano aceptable: 04121234567 o 0412-1234567
  const regex = /^04\d{2}-?\d{7}$/;
  if (!phone) return false;
  return regex.test(phone.trim());
};

export const validateAddress = (address) => {
  return typeof address === "string" && address.trim().length >= 10;
};

export const validateFile = (
  file,
  maxSizeMB = 5,
  allowedTypes = ["image/jpeg", "image/png", "application/pdf"],
) => {
  if (!file) return { valid: false, error: "Archivo vacío o no encontrado" };

  const sizeMB = file.size / (1024 * 1024);
  if (sizeMB > maxSizeMB) {
    return {
      valid: false,
      error: `El archivo supera el tamaño máximo permitido de ${maxSizeMB}MB`,
    };
  }

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: "Formato de archivo inválido. Solo se admiten JPG, PNG o PDF.",
    };
  }

  return { valid: true, error: null };
};
