import PropTypes from "prop-types";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { useProducts } from "../../context/ProductContext";
import toast from "react-hot-toast";
import { formatCurrencyUSD } from "../../utils/formatters";

/**
 * SuggestedProductCard — Compact product card for cart suggestions.
 * Variants:
 *  - "standard"  → Vertical card for the main suggestions grid below cart items
 *  - "compact"   → Horizontal mini card for the sidebar below CartSummary
 */
export default function SuggestedProductCard({ product, variant = "standard" }) {
  const { addToCart, items: cartItems } = useCart();
  const { user } = useAuth();
  const { allProducts } = useProducts();
  const [isAdding, setIsAdding] = useState(false);
  const isOwnProduct = user?.id === product.store_id;
  const isAvailable = (() => {
    if (product?.stock_status === "Sin stock") return false;
    const variations = product?.product_variations || product?.variations || [];
    if (variations.length > 0) return variations.some(v => v.stock > 0);
    return product?.stock !== 0 && product?.stock !== null;
  })();

  // Resolve max stock
  const resolveProductMaxStock = () => {
    const fullProduct = allProducts?.find(p => p.id === product.id) || product;
    const defaultVariation = fullProduct?.variations?.[0];
    if (defaultVariation?.stock != null) return defaultVariation.stock;
    const defaultVar = fullProduct?.variations?.find(v =>
      v.attribute_name === "default" ||
      v.attribute_value === '{"_default":"default"}' ||
      v.attribute_value === "default"
    );
    if (defaultVar?.stock != null) return defaultVar.stock;
    if (fullProduct?.product_variations?.length > 0 && fullProduct.product_variations[0].stock != null) return fullProduct.product_variations[0].stock;
    if (fullProduct?.stock != null) return fullProduct.stock;
    return 99; // Safe cap — backend enforces actual limit
  };

  const maxStock = resolveProductMaxStock();
  // DEDUP FIX: Search cart by product_id to catch items regardless of variation_id format
  const totalCartQtyForProduct = cartItems
    .filter(ci => ci.product_id === product.id)
    .reduce((sum, ci) => sum + Number(ci.quantity), 0);
  const isCartAtMax = maxStock > 0 && totalCartQtyForProduct >= maxStock;

  const handleAdd = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOwnProduct || !isAvailable || isAdding || isCartAtMax) return;
    setIsAdding(true);
    try {
      const success = await addToCart(product, product.variations?.[0] || null, 1);
      if (success) toast.success(`"${product.name}" agregado al carrito`);
    } finally {
      setIsAdding(false);
    }
  };

  const hasImage = product.images && product.images.length > 0;

  // ── Compact Variant (Sidebar) ──
  if (variant === "compact") {
    return (
      <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-100 hover:border-purple-200 hover:shadow-sm transition-all group">
        {/* Mini Image */}
        <Link
          to={`/product/${product.id}`}
          className="w-14 h-14 rounded-md overflow-hidden bg-gray-50 flex-shrink-0 flex items-center justify-center"
        >
          {hasImage ? (
            <img
              src={product.images[0]}
              alt={product.name}
              loading="lazy"
              className="w-full h-full object-contain mix-blend-multiply p-1"
            />
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-6 h-6 text-gray-300">
              <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
            </svg>
          )}
        </Link>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <Link to={`/product/${product.id}`}>
            <h4 className="text-xs font-medium text-gray-800 leading-tight line-clamp-2 hover:text-[#6b1e96] transition-colors cursor-pointer">
              {product.name}
            </h4>
          </Link>
          <span className="text-sm font-bold text-[#6b1e96] mt-0.5 block">
            {formatCurrencyUSD(product.price)}
          </span>
        </div>

        {/* Add Button */}
        <button
          onClick={handleAdd}
          disabled={isOwnProduct || !isAvailable || isAdding || isCartAtMax}
          className={`flex-shrink-0 p-2 rounded-lg transition-all active:scale-95 ${
            isOwnProduct || !isAvailable || isCartAtMax
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : isAdding
              ? 'bg-[#6b1e96] text-white cursor-wait'
              : 'bg-[#6b1e96]/10 text-[#6b1e96] hover:bg-[#6b1e96] hover:text-white'
          }`}
          title={isCartAtMax ? "Máximo en carrito" : "Agregar al carrito"}
        >
          {isAdding ? (
            <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : isCartAtMax ? (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          )}
        </button>
      </div>
    );
  }

  // ── Standard Variant (Main Section Grid) ──
  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group flex flex-col">
      {/* Product Image */}
      <Link
        to={`/product/${product.id}`}
        className="relative block h-[140px] w-full bg-white p-4 flex items-center justify-center overflow-hidden border-b border-gray-50"
      >
        {hasImage ? (
          <img
            src={product.images[0]}
            alt={product.name}
            loading="lazy"
            className="max-w-full max-h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-10 h-10 text-gray-200">
            <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
          </svg>
        )}
      </Link>

      {/* Card Body */}
      <div className="p-4 flex flex-col flex-grow">
        {/* Store badge */}
        {product.store?.business_name && (
          <span className="text-[9px] font-bold tracking-wider uppercase text-[#6b1e96]/70 mb-1.5">
            {product.store.business_name}
          </span>
        )}

        {/* Product Name */}
        <Link to={`/product/${product.id}`}>
          <h3 className="text-sm font-medium text-gray-900 leading-tight line-clamp-2 mb-2 hover:text-[#6b1e96] transition-colors cursor-pointer">
            {product.name}
          </h3>
        </Link>

        {/* Price */}
        <span className="text-lg font-bold text-[#6b1e96] mb-3">
          {formatCurrencyUSD(product.price)}
        </span>

        {/* Add to Cart */}
        <button
          onClick={handleAdd}
          disabled={isOwnProduct || !isAvailable || isAdding || isCartAtMax}
          className={`mt-auto w-full font-semibold py-2 px-3 rounded-lg text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${
            isOwnProduct || !isAvailable || isCartAtMax
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : isAdding
              ? 'bg-[#6b1e96] text-white cursor-wait'
              : 'bg-[#6b1e96]/10 text-[#6b1e96] hover:bg-[#6b1e96] hover:text-white'
          }`}
        >
          {isAdding ? (
            <>
              <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Agregando...
            </>
          ) : isCartAtMax ? (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              Máximo
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Agregar
            </>
          )}
        </button>
      </div>
    </div>
  );
}

SuggestedProductCard.propTypes = {
  product: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    name: PropTypes.string.isRequired,
    price: PropTypes.number.isRequired,
    images: PropTypes.arrayOf(PropTypes.string),
    store_id: PropTypes.string,
    store: PropTypes.shape({
      business_name: PropTypes.string,
    }),
    variations: PropTypes.array,
    product_variations: PropTypes.array,
    stock: PropTypes.number,
    stock_status: PropTypes.string,
  }).isRequired,
  variant: PropTypes.oneOf(["standard", "compact"]),
};
