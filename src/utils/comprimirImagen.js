/**
 * Achica en el navegador una foto antes de subirla como comprobante.
 *
 * Una foto de cámara de teléfono pesa fácilmente 5–12 MB y los formularios de comprobante
 * la rechazaban por tamaño antes de enviarla (el usuario veía «no se puede enviar» y en el
 * servidor no quedaba ni rastro). Para leer una referencia bancaria sobran 2000 px.
 *
 * - Solo toca JPG/PNG/WEBP de más de `umbralMB`. PDF, GIF y archivos pequeños pasan igual.
 * - Si algo falla (navegador viejo, imagen corrupta) devuelve el archivo original: la
 *   validación de tamaño de siempre decide después.
 * - Solo se queda con el resultado si de verdad pesa menos.
 */
const TIPOS = ["image/jpeg", "image/png", "image/webp"];

export async function comprimirImagen(file, { umbralMB = 1.5, maxLado = 2000, calidad = 0.85 } = {}) {
  if (!file || !TIPOS.includes(file.type) || file.size <= umbralMB * 1024 * 1024) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const escala = Math.min(1, maxLado / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * escala);
    canvas.height = Math.round(bitmap.height * escala);
    const ctx = canvas.getContext("2d");
    // Fondo blanco: un PNG con transparencia pasado a JPEG quedaría negro.
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close?.();
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", calidad));
    if (!blob || blob.size >= file.size) return file;
    const nombre = file.name.replace(/\.[^.]+$/, "") + ".jpg";
    return new File([blob], nombre, { type: "image/jpeg", lastModified: Date.now() });
  } catch {
    return file;
  }
}
