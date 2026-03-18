import PropTypes from "prop-types";
import PriceDisplay from "../products/PriceDisplay";
import { useProducts } from "../../context/ProductContext";
import { useCart } from "../../context/CartContext";

export default function CartItem({ item, onUpdateQuantity, onRemove }) {
  const { products } = useProducts();
  const { changeItemVariation } = useCart();

  const isAtMaxStock = item.quantity >= (item.variation?.stock || 999);
  const productInfo = products.find((p) => p.id === item.product_id);
  const availableVariations = productInfo?.variations || [];

  const handleVariationChange = (e) => {
    const newVariationId = e.target.value;
    const newVariation = availableVariations.find(
      (v) => String(v.id) === String(newVariationId),
    );
    if (newVariation && String(newVariation.id) !== String(item.variation_id)) {
      changeItemVariation(item.id, newVariation);
    }
  };

  const getVariationDisplayText = (v) => {
    if (!v || v.attribute_name === "default" || v.attribute_value === '{"_default":"default"}') return null;
    try {
      const parsed = JSON.parse(v.attribute_value);
      if (parsed._default === "default") return null;
      return Object.entries(parsed)
        .map(([key, val]) => `${key}: ${val}`)
        .join(" | ");
    } catch {
      if (v.attribute_name && v.attribute_name !== "Matrix") {
        return `${v.attribute_name}: ${v.attribute_value}`;
      }
      return v.attribute_value;
    }
  };

  return (
    <div className="flex flex-col sm:flex-row items-center gap-4 p-4 border-b border-gray-100 bg-white hover:bg-gray-50 transition-colors">
      {/* Img */}
      <div className="w-20 h-20 bg-gray-100 rounded-md flex-shrink-0 flex items-center justify-center overflow-hidden">
        {item.image ? (
          <img
            src={item.image}
            alt={item.name}
            loading="lazy"
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-xs text-gray-400">Img</span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 w-full text-center sm:text-left">
        <h4
          className="font-medium text-gray-900 line-clamp-2 text-sm sm:text-base leading-tight"
          title={item.name}
        >
          {item.name}
        </h4>
        {item.variation && getVariationDisplayText(item.variation) && (
          <div className="mt-2 text-sm text-gray-700">
            {availableVariations.length > 1 ? (
              <select
                value={item.variation_id || ""}
                onChange={handleVariationChange}
                className="block w-full sm:w-auto p-1.5 text-xs font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-md focus:ring-primary-500 focus:border-primary-500 cursor-pointer hover:bg-white transition-colors"
                title="Cambiar Variación"
              >
                {availableVariations.map((v) => (
                  <option key={v.id} value={v.id} disabled={v.stock < 1}>
                    {getVariationDisplayText(v)}{" "}
                    {v.stock < 1 ? "(Agotado)" : ""}{" "}
                    {v.price_modifier ? `(+$${v.price_modifier})` : ""}
                  </option>
                ))}
              </select>
            ) : (
              <span className="font-medium text-gray-500 bg-gray-50 px-2 py-1 rounded border border-gray-100">
                {getVariationDisplayText(item.variation)}
              </span>
            )}
          </div>
        )}
        <div className="mt-2 block sm:hidden">
          <PriceDisplay amountUSD={item.price_usd} />
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between w-full sm:w-auto gap-4">
        <div className="hidden sm:block">
          <PriceDisplay amountUSD={item.price_usd} />
        </div>

        <div className="flex items-center border border-gray-300 rounded-md bg-white">
          <button
            onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
            disabled={item.quantity <= 1}
            className="px-3 py-1 text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            title="Reducir cantidad"
          >
            -
          </button>
          <span className="px-3 py-1 border-l border-r border-gray-300 min-w-[2.5rem] text-center text-sm font-medium">
            {item.quantity}
          </span>
          <button
            onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
            disabled={isAtMaxStock}
            className="px-3 py-1 text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            title={
              isAtMaxStock ? "Límite de stock alcanzado" : "Aumentar cantidad"
            }
          >
            +
          </button>
        </div>

        <div className="hidden sm:block text-right min-w-[5rem]">
          <p className="font-semibold text-gray-900 leading-none">
            ${(item.price_usd * item.quantity).toFixed(2)}
          </p>
        </div>

        <button
          onClick={() => onRemove(item.id)}
          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
          title="Eliminar del carrito"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-5 h-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
            />
          </svg>
        </button>
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
