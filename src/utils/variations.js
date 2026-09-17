// Variaciones de producto vistas desde las tarjetas del catálogo (ProductCard y ProductRow).

export const esVariacionPorDefecto = (v) =>
  v?.attribute_name === "default" ||
  v?.attribute_value === '{"_default":"default"}' ||
  v?.attribute_value === "default";

/**
 * La variación que añade el botón «Al carrito» de una tarjeta y cuyo stock la limita.
 *
 * Antes era siempre la primera. Un producto puede arrastrar una fila vieja con stock 0 delante
 * de la buena (pasó con «Ligas de colores»: «verde» a 0 y «verde|#0afe06» a 20), y la tarjeta
 * decía «Máximo» e intentaba añadir la agotada. Orden: variación real con stock, cualquiera
 * con stock y, si no queda ninguna, la primera (el producto está agotado de verdad).
 */
export function variacionParaTarjeta(product) {
  const variaciones = product?.variations?.length
    ? product.variations
    : product?.product_variations || [];
  const conStock = variaciones.filter((v) => Number(v.stock) > 0);
  return (
    conStock.find((v) => !esVariacionPorDefecto(v)) ||
    conStock[0] ||
    variaciones[0] ||
    null
  );
}
