import { COUNTRY_CODES } from "./constants.js";

/**
 * Valida un teléfono completo con código de país.
 * Formato esperado: +{código}{número local de solo dígitos}
 * Ejemplo: +584141234567
 */
export const validatePhone = (phone) => {
  if (!phone) return false;
  const cleaned = phone.trim();
  // Eliminar espacios, guiones y paréntesis para validar solo dígitos
  const digitsOnly = cleaned.replace(/[\s\-()]/g, "");
  // Internacional: +{1-4 dígitos código}{7-11 dígitos locales} (ej: +584121234567)
  if (/^\+\d{8,15}$/.test(digitsOnly)) return true;
  // Local: 7-11 dígitos puros (ej: 04121234567, 4121234567, 0412-1234567)
  if (/^\d{7,11}$/.test(digitsOnly)) return true;
  return false;
};

/**
 * Valida el número local (sin código de país) según el país seleccionado.
 * Retorna { valid: boolean, error: string | null }
 */
export const validateLocalPhone = (localNumber, countryCode) => {
  if (!localNumber || localNumber.trim() === "") {
    return { valid: true, error: null }; // Teléfono es opcional
  }

  const digitsOnly = localNumber.replace(/\D/g, "");

  if (digitsOnly !== localNumber) {
    return { valid: false, error: "El número solo debe contener dígitos." };
  }

  const country = COUNTRY_CODES.find((c) => c.code === countryCode);
  if (!country) {
    // Fallback genérico
    if (digitsOnly.length < 7 || digitsOnly.length > 11) {
      return { valid: false, error: "El número debe tener entre 7 y 11 dígitos." };
    }
    return { valid: true, error: null };
  }

  if (digitsOnly.length < country.minDigits || digitsOnly.length > country.maxDigits) {
    const expected = country.minDigits === country.maxDigits
      ? `${country.minDigits} dígitos`
      : `entre ${country.minDigits} y ${country.maxDigits} dígitos`;
    return {
      valid: false,
      error: `Para ${country.name} el número debe tener ${expected}.`,
    };
  }

  return { valid: true, error: null };
};

/**
 * Parsea un teléfono almacenado (+584141234567) en { countryCode, localNumber }.
 * Intenta hacer match con los COUNTRY_CODES conocidos (más largo primero).
 */
export const parsePhoneWithCountryCode = (fullPhone) => {
  if (!fullPhone) return { countryCode: "+58", localNumber: "" };

  const cleaned = fullPhone.replace(/[\s-]/g, "");

  // Ordenar códigos por longitud descendiente para evitar match parcial (+5 antes de +58)
  const sorted = [...COUNTRY_CODES].sort((a, b) => b.code.length - a.code.length);

  for (const country of sorted) {
    if (cleaned.startsWith(country.code)) {
      return {
        countryCode: country.code,
        localNumber: cleaned.slice(country.code.length),
      };
    }
  }

  // Fallback: si empieza con + pero no matchea ningún código conocido
  if (cleaned.startsWith("+")) {
    const match = cleaned.match(/^\+(\d{1,4})/);
    if (match) {
      return {
        countryCode: `+${match[1]}`,
        localNumber: cleaned.slice(match[0].length),
      };
    }
  }

  // Sin código de país detectado, asumir Venezuela
  return { countryCode: "+58", localNumber: cleaned };
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
