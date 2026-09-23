import { useState } from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { useFavorites } from "../../context/FavoriteContext";
import { useProducts } from "../../context/ProductContext";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import PriceDisplay from "../../components/products/PriceDisplay";

const BTN_PRIMARY =
  "bg-[#6b1e96] hover:bg-[#4f0077] text-white font-bold rounded-xl px-5 py-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6b1e96] focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
const BTN_SECONDARY =
  "border border-[#6b1e96] text-[#6b1e96] hover:bg-[#6b1e96]/5 font-semibold rounded-xl px-5 py-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6b1e96]";

const UNAVAILABLE_LABELS = {
  out_of_stock: "Agotado",
  store_suspended: "Tienda suspendida",
  inactive: "No disponible",
  not_approved: "No disponible",
};

const isDefaultVariation = (v) =>
  v.attribute_name === "default" ||
  v.attribute_value === '{"_default":"default"}' ||
  v.attribute_value === "default";

const HeartIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
  </svg>
);
HeartIcon.propTypes = { className: PropTypes.string };

// Une el favorito con el producto del catálogo (trae los datos de la tienda que usa el carrito)
// y calcula precio, descuento y disponibilidad con lo que manda /api/wishlist.
function buildItem(fav, allProducts) {
  const raw = fav.products;
  if (!raw) return null;
  const catalog = allProducts.find((p) => p.id === raw.id);
  const variations = raw.product_variations || catalog?.variations || catalog?.product_variations || [];
  const store = catalog?.store || raw.store_profiles || null;
  const discount = raw.active_discount !== undefined ? raw.active_discount : catalog?.active_discount || null;

  // Disponibilidad: el backend la manda; si no viene, la deducimos como antes.
  let available = raw.available;
  let reason = raw.unavailable_reason || null;
  if (typeof available !== "boolean") {
    const suspended = !!(store?.is_suspended || raw.store_profiles?.is_suspended);
    available = !suspended;
    reason = suspended ? "store_suspended" : null;
  }
  if (!available && !reason) reason = "inactive";

  const realVariations = variations.filter((v) => !isDefaultVariation(v));
  const originalPrice = Number(discount?.original_price ?? raw.price) || 0;
  const finalPrice = discount?.final_price != null ? Number(discount.final_price) : originalPrice;
  let percent = null;
  if (discount) {
    if (discount.discount_type === "percentage" && discount.discount_value) {
      percent = Math.round(Number(discount.discount_value));
    } else if (originalPrice > 0 && finalPrice < originalPrice) {
      percent = Math.round(((originalPrice - finalPrice) / originalPrice) * 100);
    }
  }

  return {
    favId: fav.id,
    product: {
      ...(catalog || {}),
      ...raw,
      variations,
      store,
      active_discount: discount,
    },
    storeName: store?.business_name || "Tienda",
    image: raw.images?.[0] || catalog?.images?.[0] || null,
    available,
    reason,
    hasRealVariations: realVariations.length > 0,
    defaultVariation: variations.find(isDefaultVariation) || variations[0] || null,
    originalPrice,
    finalPrice,
    hasDiscount: !!discount && finalPrice < originalPrice,
    percent,
  };
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6" aria-busy="true" aria-label="Cargando favoritos">
      {[0, 1, 2].map((i) => (
        <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
          <div className="h-52 bg-gray-100" />
          <div className="p-5 space-y-3">
            <div className="h-3 w-1/3 bg-gray-100 rounded" />
            <div className="h-4 w-4/5 bg-gray-100 rounded" />
            <div className="h-6 w-1/4 bg-gray-100 rounded" />
            <div className="h-11 w-full bg-gray-100 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Favorites() {
  const { favorites, loading, error, toggleFavorite, fetchFavorites } = useFavorites();
  const { allProducts } = useProducts();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const [addingIds, setAddingIds] = useState(new Set());
  const [removingIds, setRemovingIds] = useState(new Set());

  const items = favorites.map((fav) => buildItem(fav, allProducts || [])).filter(Boolean);

  const handleAddToCart = async (item) => {
    const { product } = item;
    if (user?.id === product.store_id) {
      toast.error("No puedes agregar tu propio producto al carrito.");
      return;
    }
    if (addingIds.has(product.id)) return;
    setAddingIds((prev) => new Set(prev).add(product.id));
    try {
      const success = await addToCart(product, item.defaultVariation, 1);
      if (success) toast.success("Añadido al carrito");
    } finally {
      setAddingIds((prev) => {
        const next = new Set(prev);
        next.delete(product.id);
        return next;
      });
    }
  };

  const handleRemove = async (productId) => {
    if (removingIds.has(productId)) return;
    setRemovingIds((prev) => new Set(prev).add(productId));
    try {
      await toggleFavorite(productId);
    } finally {
      setRemovingIds((prev) => {
        const next = new Set(prev);
        next.delete(productId);
        return next;
      });
    }
  };

  let content;
  if (loading) {
    content = <SkeletonGrid />;
  } else if (error) {
    content = (
      <div role="alert" className="bg-white rounded-2xl border border-gray-100 px-4 py-12 sm:p-12 text-center">
        <span className="material-symbols-outlined text-gray-300 text-[48px] mb-2" aria-hidden="true">cloud_off</span>
        <h2 className="text-lg font-bold font-['Manrope'] text-[#191c20] mb-1">No pudimos cargar tus favoritos</h2>
        <p className="text-sm text-gray-500 mb-5">{error}</p>
        <button type="button" onClick={() => fetchFavorites()} className={BTN_SECONDARY}>
          Reintentar
        </button>
      </div>
    );
  } else if (items.length === 0) {
    content = (
      <div className="bg-white rounded-2xl border border-gray-100 px-4 py-12 sm:p-16 text-center">
        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-[#6b1e96]/10 flex items-center justify-center mx-auto mb-6">
          <HeartIcon className="w-12 h-12 text-[#6b1e96]" />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold font-['Manrope'] text-[#191c20] mb-2">Aún no tienes favoritos</h2>
        <p className="text-sm sm:text-base text-gray-500 max-w-md mx-auto mb-6">
          Cuando veas un producto que te interese, toca el corazón para guardarlo aquí y encontrarlo rápido después.
        </p>
        <Link to="/store-catalog" className={`${BTN_PRIMARY} inline-block`}>
          Explorar el catálogo
        </Link>
      </div>
    );
  } else {
    content = (
      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {items.map((item) => {
          const { product } = item;
          const isAdding = addingIds.has(product.id);
          const isRemoving = removingIds.has(product.id);
          return (
            <li
              key={item.favId || product.id}
              className={`group relative flex flex-col bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden transition-shadow hover:shadow-md ${
                item.available ? "" : "opacity-75"
              }`}
            >
              {/* Imagen */}
              <div className="relative h-52 bg-[#f3f3f9] p-6 flex items-center justify-center">
                <Link
                  to={`/product/${product.id}`}
                  className="flex items-center justify-center w-full h-full rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6b1e96]"
                  tabIndex={-1}
                  aria-hidden="true"
                >
                  {item.image ? (
                    <img
                      src={item.image}
                      alt=""
                      loading="lazy"
                      className={`max-w-full max-h-full object-contain mix-blend-multiply ${item.available ? "" : "grayscale"}`}
                    />
                  ) : (
                    <span className="text-sm italic text-gray-400">Sin imagen</span>
                  )}
                </Link>

                <div className="absolute top-3 left-3 flex flex-col items-start gap-1.5">
                  {!item.available && (
                    <span className="text-xs font-bold bg-gray-800 text-white px-2 py-1 rounded-full">
                      {UNAVAILABLE_LABELS[item.reason] || "No disponible"}
                    </span>
                  )}
                  {item.available && item.hasDiscount && item.percent > 0 && (
                    <span className="text-xs font-bold bg-[#c3ff00] text-[#191c20] px-2 py-1 rounded-full">
                      -{item.percent}%
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleRemove(product.id)}
                  disabled={isRemoving}
                  aria-label={`Quitar de favoritos: ${product.name}`}
                  title="Quitar de favoritos"
                  className="absolute top-3 right-3 w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-red-500 hover:bg-red-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6b1e96] disabled:opacity-50"
                >
                  <HeartIcon className="w-5 h-5" />
                </button>
              </div>

              {/* Cuerpo */}
              <div className="flex flex-col flex-1 p-4 sm:p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#6b1e96] truncate mb-1">{item.storeName}</p>
                <Link
                  to={`/product/${product.id}`}
                  className="font-bold font-['Manrope'] text-[#191c20] leading-snug line-clamp-2 hover:text-[#6b1e96] transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6b1e96] mb-3"
                >
                  {product.name}
                </Link>

                <div className="mb-4">
                  {item.hasDiscount && (
                    <PriceDisplay
                      amountUSD={item.originalPrice}
                      hideSwitcher
                      priceClassName="text-sm text-gray-400 line-through"
                    />
                  )}
                  <PriceDisplay
                    amountUSD={item.finalPrice}
                    hideSwitcher
                    priceClassName="text-xl font-extrabold font-['Manrope'] text-[#191c20]"
                  />
                </div>

                <div className="mt-auto">
                  {!item.available ? (
                    <p className="text-sm text-gray-500 text-center py-3">
                      {item.reason === "out_of_stock"
                        ? "Te conviene revisar más adelante si vuelve a haber existencias."
                        : "Este producto no se puede comprar por ahora."}
                    </p>
                  ) : item.hasRealVariations ? (
                    <Link to={`/product/${product.id}`} className={`${BTN_SECONDARY} block w-full text-center`}>
                      Elegir opciones
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleAddToCart(item)}
                      disabled={isAdding}
                      className={`${BTN_PRIMARY} w-full`}
                    >
                      {isAdding ? "Añadiendo..." : "Añadir al carrito"}
                    </button>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <header className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-6 sm:px-8 sm:py-8">
        <div className="flex items-center gap-3">
          <HeartIcon className="w-7 h-7 text-red-500" />
          <h1 className="text-2xl sm:text-3xl font-extrabold font-['Manrope'] text-[#191c20] tracking-tight">Mis favoritos</h1>
        </div>
        {!loading && !error && (
          <p className="mt-2 text-sm text-gray-500">
            {items.length} {items.length === 1 ? "producto guardado" : "productos guardados"}
          </p>
        )}
      </header>
      {content}
    </div>
  );
}
