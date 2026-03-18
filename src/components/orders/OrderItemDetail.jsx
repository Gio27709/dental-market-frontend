import PropTypes from "prop-types";
import { formatCurrencyUSD } from "../../utils/formatters";
import { ORDER_STATUS } from "../../utils/constants";

const STATUS_BADGE = {
  yellow: "bg-yellow-100 text-yellow-800",
  blue: "bg-blue-100 text-blue-800",
  green: "bg-green-100 text-green-800",
  emerald: "bg-emerald-100 text-emerald-800",
  red: "bg-red-100 text-red-800",
  gray: "bg-gray-100 text-gray-700",
};

export default function OrderItemDetail({ item }) {
  const product = item.products || {};
  const variation = item.product_variations || {};
  const statusInfo = ORDER_STATUS[item.delivery_status] || ORDER_STATUS.pending;
  const badgeClass = STATUS_BADGE[statusInfo.color] || STATUS_BADGE.gray;
  const subtotal = item.unit_price * item.quantity;
  const imageUrl = product.images?.[0] || product.image_url;

  const getVariationText = () => {
    if (!variation.attribute_value || variation.attribute_name === "default" || variation.attribute_value === '{"_default":"default"}') return null;
    try {
      const parsed = JSON.parse(variation.attribute_value);
      if (parsed._default === "default") return null;
      return Object.entries(parsed)
        .map(([key, val]) => `${key}: ${val}`)
        .join(" | ");
    } catch {
      if (variation.attribute_name && variation.attribute_name !== "Matrix") {
        return `${variation.attribute_name}: ${variation.attribute_value}`;
      }
      return variation.attribute_value;
    }
  };

  return (
    <div className="flex items-start gap-4 py-4 border-b border-gray-100 last:border-0">
      {/* Product Image */}
      <div className="w-16 h-16 md:w-20 md:h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={product.name || "Producto"}
            loading="lazy"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-2xl text-gray-300">
            🦷
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-gray-900 text-sm truncate">
          {product.name || "Producto"}
        </h4>
        {getVariationText() && (
          <p className="text-xs text-gray-500 mt-0.5">{getVariationText()}</p>
        )}
        <p className="text-xs text-gray-400 mt-1">
          Cantidad: {item.quantity} × {formatCurrencyUSD(item.unit_price)}
        </p>
        <div className="mt-2">
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${badgeClass}`}
          >
            {statusInfo.label}
          </span>
        </div>
      </div>

      {/* Subtotal */}
      <div className="text-right flex-shrink-0">
        <p className="font-bold text-gray-900 text-sm">
          {formatCurrencyUSD(subtotal)}
        </p>
      </div>
    </div>
  );
}

OrderItemDetail.propTypes = {
  item: PropTypes.shape({
    id: PropTypes.string,
    quantity: PropTypes.number,
    unit_price: PropTypes.number,
    delivery_status: PropTypes.string,
    products: PropTypes.object,
    product_variations: PropTypes.object,
  }).isRequired,
};
