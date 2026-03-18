import PropTypes from "prop-types";
import { useCart } from "../context/CartContext";

export default function CartItem({ item }) {
  const { updateQuantity, removeFromCart } = useCart();

  return (
    <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
      <div className="flex items-center space-x-4">
        <div className="w-16 h-16 bg-gray-100 rounded flex-shrink-0 flex items-center justify-center overflow-hidden">
          {item.images?.[0] ? (
            <img
              src={item.images[0]}
              alt={item.name}
              loading="lazy"
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-xs text-gray-400">Img</span>
          )}
        </div>
        <div>
          <h4
            className="font-medium text-gray-900 line-clamp-1"
            title={item.name}
          >
            {item.name}
          </h4>
          <p className="text-primary-600 font-bold">${item.base_price_usd}</p>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex items-center border border-gray-300 rounded">
          <button
            onClick={() => updateQuantity(item.id, item.quantity - 1)}
            className="px-3 py-1 text-gray-600 hover:bg-gray-100"
          >
            -
          </button>
          <span className="px-3 py-1 border-l border-r border-gray-300 min-w-[2.5rem] text-center">
            {item.quantity}
          </span>
          <button
            onClick={() => updateQuantity(item.id, item.quantity + 1)}
            className="px-3 py-1 text-gray-600 hover:bg-gray-100"
          >
            +
          </button>
        </div>

        <div className="text-right min-w-[5rem]">
          <p className="font-semibold text-gray-900">
            ${(item.base_price_usd * item.quantity).toFixed(2)}
          </p>
        </div>

        <button
          onClick={() => removeFromCart(item.id)}
          className="text-red-500 hover:text-red-700 ml-2"
          title="Eliminar"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

CartItem.propTypes = {
  item: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    name: PropTypes.string.isRequired,
    base_price_usd: PropTypes.number.isRequired,
    quantity: PropTypes.number.isRequired,
    images: PropTypes.arrayOf(PropTypes.string),
  }).isRequired,
};
