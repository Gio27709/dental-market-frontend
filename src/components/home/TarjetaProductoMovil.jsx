import { useState } from "react";
import { Link } from "react-router-dom";
import PropTypes from "prop-types";
import { useCart } from "../../context/CartContext";
import { formatCurrencyUSD } from "../../utils/formatters";

// Tarjeta de producto compacta para los carruseles del inicio en el teléfono.
// TODAS las medidas van fijas a propósito: foto 120 px, nombre 2 líneas, tienda 1 línea y la
// fila del precio. Si se dejan libres, la tarjeta más alta de la fila estira a las demás (flex
// reparte la altura) y quedan enormes con un hueco blanco abajo, que fue lo que se vio en el
// celular. Con alturas fijas + `items-start` en la fila, todas miden ~225 px pase lo que pase.

const imagenDe = (p) => {
  const img = Array.isArray(p?.images) ? p.images[0] : null;
  return typeof img === "string" ? img : img?.url || null;
};

const esVariacionPorDefecto = (v) =>
  v?.attribute_name === "default" || v?.attribute_value === "default" || v?.attribute_value === '{"_default":"default"}';

export default function TarjetaProductoMovil({ producto }) {
  const { addToCart } = useCart();
  const [agregando, setAgregando] = useState(false);

  const variaciones = producto.product_variations || producto.variations || [];
  const tieneOpciones = variaciones.filter((v) => !esVariacionPorDefecto(v)).length > 1;
  const stock = variaciones.reduce((s, v) => s + (Number(v.stock) || 0), 0);
  const agotado = stock <= 0 || producto.stock_status === "Sin stock";
  const descuento = producto.active_discount;
  const precio = descuento ? descuento.final_price : producto.price;
  const tienda = producto.store?.business_name || producto.store_profiles?.business_name;
  const imagen = imagenDe(producto);

  const agregar = async (e) => {
    e.preventDefault();
    if (agregando || agotado) return;
    setAgregando(true);
    try {
      await addToCart(producto, variaciones[0] || null, 1);
    } finally {
      setAgregando(false);
    }
  };

  return (
    <Link
      to={`/product/${producto.id}`}
      className="flex w-[150px] shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-fx-line bg-white transition-transform active:scale-[0.98]"
    >
      <div className="relative h-[120px] shrink-0 bg-fx-inset">
        {imagen ? (
          <img src={imagen} alt="" loading="lazy" className="h-full w-full object-contain p-1.5" />
        ) : (
          <span className="flex h-full w-full items-center justify-center">
            <span className="material-symbols-outlined text-[32px] text-fx-faint" aria-hidden="true">dentistry</span>
          </span>
        )}
        {descuento && (
          <span className="absolute left-1.5 top-1.5 rounded-full bg-[#b8482f] px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
            -{descuento.discount_type === "percentage" ? `${Math.round(descuento.discount_value)}%` : formatCurrencyUSD(descuento.discount_amount)}
          </span>
        )}
        {agotado && (
          <span className="absolute inset-x-0 bottom-0 bg-fx-text/70 py-0.5 text-center text-[10px] font-bold text-white">Agotado</span>
        )}
      </div>

      <div className="shrink-0 px-2.5 pb-2.5 pt-2">
        <p className="h-[30px] overflow-hidden text-[12px] font-semibold leading-[15px] text-fx-text">{producto.name}</p>
        <p className="h-[14px] truncate text-[10.5px] leading-[14px] text-fx-muted">{tienda || ""}</p>
        <div className="mt-1.5 flex h-8 items-center justify-between gap-1">
          <span className="min-w-0 leading-none">
            <span className="block text-[14px] font-bold leading-none text-[#6b1e96]">{formatCurrencyUSD(precio)}</span>
            {descuento && (
              <span className="block text-[10px] leading-tight text-fx-faint line-through">{formatCurrencyUSD(producto.price)}</span>
            )}
          </span>
          <button
            type="button"
            onClick={agregar}
            disabled={agotado || agregando}
            aria-label={tieneOpciones ? `Ver opciones de ${producto.name}` : `Agregar ${producto.name} al carrito`}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#c3ff00] text-[#531575] active:scale-95 disabled:bg-fx-raised disabled:text-fx-faint"
          >
            <span className="material-symbols-outlined text-[18px] leading-none" aria-hidden="true">
              {agregando ? "hourglass_top" : "add_shopping_cart"}
            </span>
          </button>
        </div>
      </div>
    </Link>
  );
}

TarjetaProductoMovil.propTypes = {
  producto: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string,
    price: PropTypes.number,
    images: PropTypes.array,
    stock_status: PropTypes.string,
    active_discount: PropTypes.object,
    product_variations: PropTypes.array,
    variations: PropTypes.array,
    store: PropTypes.object,
    store_profiles: PropTypes.object,
  }).isRequired,
};
