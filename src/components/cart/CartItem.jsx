import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { useProducts } from "../../context/ProductContext";

export default function CartItem({ item, onUpdateQuantity, onRemove }) {
  const { products } = useProducts();

  const isAtMaxStock = item.quantity >= (item.variation?.stock || 999);
  const productInfo = products.find((p) => p.id === item.product_id);
  const availableVariations = productInfo?.variations || [];
  const storeName = productInfo?.store_profiles?.business_name || productInfo?.store?.business_name;
  const storeState = productInfo?.store_profiles?.state;

  // Parse variation attributes into individual key-value pairs for Amazon-style display
  const getVariationAttributes = (v) => {
    if (!v || v.attribute_name === "default" || v.attribute_value === '{"_default":"default"}') return [];
    try {
      const parsed = JSON.parse(v.attribute_value);
      if (parsed._default === "default") return [];
      return Object.entries(parsed).map(([key, val]) => {
        const cleanVal = typeof val === 'string' && val.includes('|') ? val.split('|')[0] : val;
        return { key, value: cleanVal };
      });
    } catch {
      let cleanVal = v.attribute_value;
      if (typeof cleanVal === 'string' && cleanVal.includes('|')) cleanVal = cleanVal.split('|')[0];
      const label = v.attribute_name && v.attribute_name !== "Matrix" ? v.attribute_name : "Variación";
      return [{ key: label, value: cleanVal }];
    }
  };

  const variationAttrs = getVariationAttributes(item.variation);

  return (
    <div className="flex gap-5 px-5 py-5 border-b border-gray-200 last:border-b-0">
      {/* Product Image */}
      <Link
        to={`/product/${item.product_id}`}
        className="w-[130px] h-[130px] sm:w-[160px] sm:h-[160px] bg-white flex-shrink-0 flex items-center justify-center overflow-hidden"
      >
        {item.image ? (
          <img
            src={item.image}
            alt={item.name}
            loading="lazy"
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="w-full h-full bg-gray-50 rounded flex items-center justify-center border border-gray-100">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-10 h-10 text-gray-300">
              <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
            </svg>
          </div>
        )}
      </Link>

      {/* Product Info */}
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start gap-4">
          {/* Left: Name + details */}
          <div className="flex-1 min-w-0">
            {/* Product Name */}
            <Link
              to={`/product/${item.product_id}`}
              className="text-[15px] leading-snug text-gray-900 hover:text-[#6b1e96] transition-colors line-clamp-2"
            >
              {item.name}
            </Link>

            {/* Availability */}
            <p className="text-xs text-green-600 font-medium mt-1">
              Disponible {item.variation?.stock > 0 && <span className="text-gray-500 font-normal">({item.variation.stock} disponibles)</span>}
            </p>

            {/* Store name and Location */}
            {storeName && (
              <p className="text-xs text-gray-500 mt-0.5">
                Enviado desde:{" "}
                <span className="text-[#6b1e96]">
                  {storeName}
                  {storeState && ` - ${storeState}`}
                </span>
              </p>
            )}

            {/* Variation Attributes — Amazon-style individual lines */}
            {variationAttrs.length > 0 && (
              <div className="mt-2 space-y-0.5">
                {variationAttrs.map((attr, i) => (
                  <p key={i} className="text-xs text-gray-700">
                    <span className="font-semibold">{attr.key}:</span> {attr.value}
                  </p>
                ))}

              </div>
            )}

            {/* Quantity Controls + Action Links */}
            <div className="flex flex-wrap items-center gap-x-2 gap-y-2 mt-3">
              {/* Quantity — Amazon style with yellow/gold border */}
              <div className="flex items-center border border-amber-400 rounded-full overflow-hidden bg-white shadow-sm">
                {item.quantity <= 1 ? (
                  <button
                    onClick={() => onRemove(item.id)}
                    className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-red-500 hover:bg-red-50 transition-colors"
                    title="Eliminar del carrito"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                    </svg>
                  </button>
                ) : (
                  <button
                    onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                    className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-amber-50 transition-colors"
                    title="Reducir cantidad"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
                    </svg>
                  </button>
                )}

                <span className="w-8 text-center text-sm font-semibold text-gray-900 select-none border-l border-r border-amber-300 bg-amber-50/50">
                  {item.quantity}
                </span>

                <button
                  onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                  disabled={isAtMaxStock}
                  className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-amber-50 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                  title={isAtMaxStock ? "Límite de stock" : "Aumentar cantidad"}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                </button>
              </div>

              <span className="text-gray-300 hidden sm:inline">|</span>

              <button
                onClick={() => onRemove(item.id)}
                className="text-xs text-[#6b1e96] hover:text-[#531575] hover:underline transition-colors"
              >
                Eliminar
              </button>

              <span className="text-gray-300 hidden sm:inline">|</span>

              <Link
                to={`/product/${item.product_id}`}
                className="text-xs text-[#6b1e96] hover:text-[#531575] hover:underline transition-colors hidden sm:inline"
              >
                Ver detalles
              </Link>

              {availableVariations.length > 1 && (
                <>
                  <span className="text-gray-300 hidden sm:inline">|</span>
                  <Link
                    to={`/product/${item.product_id}`}
                    className="text-xs text-[#6b1e96] hover:text-[#531575] hover:underline transition-colors hidden sm:inline"
                  >
                    Cambiar variantes
                  </Link>
                </>
              )}
            </div>

            {/* Aviso legal estilo Amazon (Opción A) */}
            <p className="mt-2 text-[10px] text-gray-400">
              El precio y la disponibilidad de los artículos están sujetos a cambio.
            </p>
          </div>

          {/* Right: Price */}
          <div className="text-right flex-shrink-0 hidden sm:block">
            <p className="text-base font-bold text-gray-900">
              ${item.price_usd.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Mobile price */}
        <div className="sm:hidden mt-2">
          <span className="text-sm font-bold text-gray-900">${item.price_usd.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}

CartItem.propTypes = {
  item: PropTypes.shape({
    id: PropTypes.string.isRequired,
    product_id: PropTypes.string.isRequired,
    variation_id: PropTypes.string,
    name: PropTypes.string.isRequired,
    price_usd: PropTypes.number.isRequired,
    quantity: PropTypes.number.isRequired,
    image: PropTypes.string,
    variation: PropTypes.shape({
      attribute_name: PropTypes.string,
      attribute_value: PropTypes.string,
      stock: PropTypes.number,
    }),
  }).isRequired,
  onUpdateQuantity: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired,
};
