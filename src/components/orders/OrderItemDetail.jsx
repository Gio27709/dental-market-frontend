import PropTypes from "prop-types";
import { formatCurrencyUSD } from "../../utils/formatters";
import { ORDER_STATUS } from "../../utils/constants";
import ShippedBadge from "./ShippedBadge";

const STATUS_BADGE_STYLES = {
  yellow: { bg: "#fef9c3", text: "#ca8a04" },
  blue: { bg: "#eff6ff", text: "#2563eb" },
  green: { bg: "#f0fdf4", text: "#16a34a" },
  emerald: { bg: "#dcfce7", text: "#059669" },
  red: { bg: "#fef2f2", text: "#dc2626" },
  indigo: { bg: "#eef2ff", text: "#4f46e5" },
  gray: { bg: "#f3f4f6", text: "#4b5563" },
};

export default function OrderItemDetail({ item }) {
  const product = item.products || {};
  const variation = item.product_variations || {};
  const statusInfo = ORDER_STATUS[item.delivery_status] || ORDER_STATUS.pending;
  const badgeStyle = STATUS_BADGE_STYLES[statusInfo.color] || STATUS_BADGE_STYLES.gray;
  const subtotal = item.unit_price * item.quantity;
  const imageUrl = product.images?.[0] || product.image_url;
  const storeName = item.store_profiles?.business_name;

  const getVariationText = () => {
    if (!variation.attribute_value || variation.attribute_name === "default" || variation.attribute_value === '{"_default":"default"}') return null;
    try {
      const parsed = JSON.parse(variation.attribute_value);
      if (parsed._default === "default") return null;
      return Object.entries(parsed)
        .map(([key, val]) => {
          const cleanVal = typeof val === 'string' && val.includes('|') ? val.split('|')[0] : val;
          return `${key}: ${cleanVal}`;
        })
        .join(" | ");
    } catch {
      let cleanVal = variation.attribute_value;
      if (typeof cleanVal === 'string' && cleanVal.includes('|')) cleanVal = cleanVal.split('|')[0];

      if (variation.attribute_name && variation.attribute_name !== "Matrix") {
        return `${variation.attribute_name}: ${cleanVal}`;
      }
      return cleanVal;
    }
  };

  return (
    <div className="flex items-start gap-4">
      {/* Product Image */}
      <div className="w-14 h-14 md:w-16 md:h-16 bg-[#f3f3f4] rounded-lg overflow-hidden flex-shrink-0">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={product.name || "Producto"}
            loading="lazy"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-3xl text-[#cfc2d5]">
            🦷
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h4 className="font-bold text-sm truncate" style={{ color: "#191c23" }}>
          {product.name || "Producto"}
        </h4>
        {storeName && (
          <p className="text-[11px] mt-0.5" style={{ color: "#7e7384" }}>
            <span className="material-symbols-outlined align-middle" style={{ fontSize: "12px" }}>storefront</span>{" "}
            {storeName}
          </p>
        )}
        {getVariationText() && (
          <p className="text-[11px] mt-0.5" style={{ color: "#727785" }}>{getVariationText()}</p>
        )}
        <div className="flex items-center gap-3 mt-1.5">
          <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#727785" }}>
            Cant: {item.quantity} × {formatCurrencyUSD(item.unit_price)}
          </p>
          {["shipped", "picked_up", "arrived"].includes(item.delivery_status) ? (
            <ShippedBadge size="sm" label={statusInfo.label} />
          ) : (
            <span
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold"
              style={{ backgroundColor: badgeStyle.bg, color: badgeStyle.text }}
            >
              <span className="w-1 h-1 rounded-full" style={{ backgroundColor: badgeStyle.text }}></span>
              {statusInfo.label}
            </span>
          )}
          {item.delivery_type === "local_delivery" && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-purple-50 text-[#6b1e96] border border-purple-100/50">
              <span className="material-symbols-outlined text-[10px] align-middle">two_wheeler</span>
              Repartidor Local
            </span>
          )}
        </div>
      </div>

      {/* Subtotal */}
      <div className="text-right flex-shrink-0">
        <p className="text-[9px] uppercase tracking-wider font-bold mb-0.5" style={{ color: "#727785" }}>Subtotal</p>
        <p className="font-bold text-sm" style={{ color: "#6b1e96" }}>
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
    delivery_type: PropTypes.string,
    products: PropTypes.object,
    product_variations: PropTypes.object,
    store_profiles: PropTypes.object,
  }).isRequired,
};
