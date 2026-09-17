import { useState } from "react";
import { Link } from "react-router-dom";
import PropTypes from "prop-types";
import { useCart } from "../../context/CartContext";
import { formatCurrencyUSD } from "../../utils/formatters";

// Tarjeta de producto compacta para el inicio del teléfono. La tarjeta grande del catálogo se
// veía alargada dentro de los carruseles: aquí la foto es cuadrada, el nombre ocupa dos líneas
// y el botón de agregar es un círculo, así entran dos por pantalla sin estirarse.

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
      className="flex w-[160px] shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-fx-line bg-white active:scale-[0.98] transition-transform"
    >
      <div className="relative aspect-square bg-fx-inset">
        {imagen ? (
          <img src={imagen} alt="" loading="lazy" className="h-full w-full object-contain p-2" />
        ) : (
          <span className="flex h-full w-full items-center justify-center">
            <span className="material-symbols-outlined text-[34px] text-fx-faint" aria-hidden="true">dentistry</span>
          </span>
        )}
        {descuento && (
          <span className="absolute left-2 top-2 rounded-full bg-[#b8482f] px-2 py-0.5 text-[10px] font-bold text-white">
            -{descuento.discount_type === "percentage" ? `${Math.round(descuento.discount_value)}%` : formatCurrencyUSD(descuento.discount_amount)}
          </span>
        )}
        {agotado && (
          <span className="absolute inset-x-0 bottom-0 bg-fx-text/70 py-1 text-center text-[10px] font-bold text-white">Agotado</span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-0.5 p-2.5">
        <p className="line-clamp-2 min-h-[32px] text-[12.5px] font-semibold leading-tight text-fx-text">{producto.name}</p>
        {tienda && <p className="truncate text-[11px] text-fx-muted">{tienda}</p>}
        <div className="mt-1 flex items-end justify-between gap-1">
          <span className="min-w-0">
            <span className="block text-[15px] font-bold leading-none text-[#6b1e96]">{formatCurrencyUSD(precio)}</span>
            {descuento && (
              <span className="block text-[11px] text-fx-faint line-through">{formatCurrencyUSD(producto.price)}</span>
            )}
          </span>
          <button
            type="button"
            onClick={agregar}
            disabled={agotado || agregando}
            aria-label={tieneOpciones ? `Ver opciones de ${producto.name}` : `Agregar ${producto.name} al carrito`}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#c3ff00] text-[#531575] active:scale-95 disabled:bg-fx-raised disabled:text-fx-faint"
          >
            <span className="material-symbols-outlined text-[20px] leading-none" aria-hidden="true">
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
