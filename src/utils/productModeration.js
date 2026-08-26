/**
 * Motivos de rechazo de producto. Espejo de `REJECTION_REASONS` en
 * `backend/src/controllers/productController.js`: el backend valida contra su copia
 * y devuelve 400 con un motivo que no reconozca, así que las dos listas tienen que
 * moverse juntas.
 *
 * Cerrada a propósito. Un motivo escrito a mano no se puede contar ni agrupar; con
 * estos siete se responde "¿por qué rechazamos tanto?" con una cifra. El detalle
 * concreto va en la nota, que sí es libre.
 */
export const REJECTION_REASONS = [
  { value: "foto", label: "Fotos de mala calidad", hint: "Borrosas, con marca de agua o no muestran el producto" },
  { value: "precio", label: "Precio irreal o engañoso", hint: "Precio simbólico, o tachado que nunca fue real" },
  { value: "prohibido", label: "Producto no permitido", hint: "Fuera del catálogo autorizado de la plataforma" },
  { value: "ficha", label: "Ficha incompleta", hint: "Sin descripción útil, sin marca o sin categoría" },
  { value: "duplicado", label: "Duplicado", hint: "La misma tienda ya lo tiene publicado" },
  { value: "marca", label: "Uso indebido de marca", hint: "Se atribuye una marca que no corresponde" },
  { value: "otro", label: "Otro motivo", hint: "Exige explicarlo en la nota" },
];

/**
 * `sin_registrar` no es un motivo que se pueda elegir: lo puso la migración 054 en
 * los rechazos anteriores a que existiera este registro. Se etiqueta aparte para que
 * la auditoría no los presente como rechazos sin razón.
 */
const LABELS = {
  ...Object.fromEntries(REJECTION_REASONS.map((r) => [r.value, r.label])),
  sin_registrar: "Anterior al registro de motivos",
};

export const rejectionLabel = (value) => (value ? LABELS[value] || value : null);
