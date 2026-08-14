import { useMemo, useRef, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { preloadRestockCartAPI } from "../services/api";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useProducts } from "../context/ProductContext";
import useRecentlyViewed from "../hooks/useRecentlyViewed";
import CartItem from "../components/cart/CartItem";
import CartSummary from "../components/cart/CartSummary";
import SuggestedProductCard from "../components/cart/SuggestedProductCard";

// Fisher-Yates shuffle (creates a new array)
function shuffleArray(arr) {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export default function Cart() {
  const { items, fetchCart, total_usd, total_ves, updateQuantity, removeFromCart } =
    useCart();
  const { user } = useAuth();
  const { allProducts } = useProducts();
  const { getViewedProducts } = useRecentlyViewed();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const carouselRef = useRef(null);

  // Auto-process preload_restock from deep links or notifications
  useEffect(() => {
    const isPreload = searchParams.get("preload_restock");
    const rawItems = searchParams.get("items");

    if (isPreload && rawItems && user) {
      const parsedItems = rawItems.split(",").map((str) => {
        const [productId, qty] = str.split(":");
        return { productId, quantity: parseInt(qty || "2", 10) };
      });

      preloadRestockCartAPI(parsedItems)
        .then((res) => {
          if (res.data.success) {
            toast.success("🛒 Insumos de recompra cargados en tu carrito.");
            fetchCart();
          }
        })
        .catch((err) => console.error("Error pre-cargando carrito:", err))
        .finally(() => {
          searchParams.delete("preload_restock");
          searchParams.delete("items");
          setSearchParams(searchParams, { replace: true });
        });
    }
  }, [searchParams, user]);


  // Build set of product IDs already in the cart for fast lookup
  const cartProductIds = useMemo(
    () => new Set(items.map((item) => item.product_id)),
    [items]
  );

  // Sidebar: recently viewed products (excluding cart items), fallback to suggestions
  const { sidebarProducts, sidebarTitle, sidebarIcon } = useMemo(() => {
    const viewed = getViewedProducts(allProducts, cartProductIds, 3);
    if (viewed.length > 0) {
      return {
        sidebarProducts: viewed,
        sidebarTitle: "Vistos Recientemente",
        sidebarIcon: "eye",
      };
    }
    // Fallback: random suggestions
    const available = allProducts.filter((p) => !cartProductIds.has(p.id));
    const shuffled = shuffleArray(available);
    return {
      sidebarProducts: shuffled.slice(0, 3),
      sidebarTitle: "Te podría gustar",
      sidebarIcon: "sparkle",
    };
  }, [allProducts, cartProductIds, getViewedProducts]);

  // Carousel: all non-cart products, shuffled (independent of sidebar)
  const carouselProducts = useMemo(() => {
    const available = allProducts.filter((p) => !cartProductIds.has(p.id));
    return shuffleArray(available).slice(0, 15);
  }, [allProducts, cartProductIds]);

  // STOCK FIX: Detect items that exceed available stock or are fully out of stock
  const hasOOSItems = items.some((item) => {
    const stock = item.variation?.stock ?? item.max_stock ?? 999;
    return stock === 0 || item.quantity > stock;
  });

  // Detect if any items belong to a suspended store
  const hasSuspendedItems = items.some((item) => item.store_is_suspended);

  const handleCheckout = () => {
    if (!user) {
      return navigate("/login?redirect=/checkout");
    }
    navigate("/checkout");
  };

  const scrollCarousel = (direction) => {
    if (!carouselRef.current) return;
    const scrollAmount = 280; // ~width of one card + gap
    carouselRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Tu carrito está vacío
        </h2>
        <Link
          to="/"
          className="text-primary-600 hover:text-primary-700 font-medium"
        >
          Volver al catálogo
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="lg:grid lg:grid-cols-12 lg:gap-8">
        {/* ── Items List ── */}
        <div className="lg:col-span-8">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            {/* Header Row — Amazon style */}
            <div className="px-5 pt-5 pb-3 border-b border-gray-200">
              <div className="flex items-baseline justify-between">
                <h1 className="text-[26px] font-bold text-gray-900">Carrito</h1>
                <span className="text-sm text-gray-500 font-medium hidden sm:block">Precio</span>
              </div>
            </div>

            {/* Items */}
            {items.map((item) => (
              <CartItem
                key={item.id}
                item={item}
                onUpdateQuantity={updateQuantity}
                onRemove={removeFromCart}
              />
            ))}

            {/* Subtotal Footer — Amazon style */}
            <div className="px-5 py-4 text-right border-t border-gray-200 bg-gray-50/50">
              <span className="text-[15px] text-gray-700">
                Subtotal ({items.reduce((sum, i) => sum + i.quantity, 0)} {items.reduce((sum, i) => sum + i.quantity, 0) === 1 ? "producto" : "productos"}):{" "}
              </span>
              <span className="text-[15px] font-bold text-gray-900">
                ${total_usd.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* ── Summary Sidebar ── */}
        <div className="lg:col-span-4 mt-8 lg:mt-0 lg:sticky lg:top-24 self-start">
          <CartSummary
            totalUsd={total_usd}
            totalVes={total_ves}
            itemCount={items.reduce((sum, i) => sum + i.quantity, 0)}
            onCheckout={handleCheckout}
            showShipping={false}
            hasOOSItems={hasOOSItems}
            hasSuspendedItems={hasSuspendedItems}
          />

          {!user && (
            <p className="mt-4 text-sm text-center text-gray-500 bg-amber-50 rounded-lg p-3 border border-amber-100">
              <span className="font-semibold text-amber-700">Nota:</span> Se te
              pedirá iniciar sesión para completar la compra.
            </p>
          )}

          {/* ── Sidebar: Recently Viewed / Suggestions ── */}
          {sidebarProducts.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                {sidebarIcon === "eye" ? (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-[#6b1e96]">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.64 0 8.577 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.64 0-8.577-3.007-9.963-7.178Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-[#6b1e96]">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456Z" />
                  </svg>
                )}
                {sidebarTitle}
              </h3>
              <div className="flex flex-col gap-2.5">
                {sidebarProducts.map((product) => (
                  <SuggestedProductCard
                    key={product.id}
                    product={product}
                    variant="compact"
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Carousel: Horizontal Scroll Section (Full Width, Below Grid) ── */}
      {carouselProducts.length > 0 && (
        <div className="mt-14 border-t border-gray-200 pt-8">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-[#6b1e96]">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456Z" />
              </svg>
              Los clientes que compraron este producto también vieron
            </h2>
            {/* Arrow Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => scrollCarousel("left")}
                className="w-8 h-8 rounded-full border border-gray-300 bg-white flex items-center justify-center text-gray-500 hover:text-[#6b1e96] hover:border-[#6b1e96] transition-all active:scale-95 shadow-sm"
                aria-label="Anterior"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                </svg>
              </button>
              <button
                onClick={() => scrollCarousel("right")}
                className="w-8 h-8 rounded-full border border-gray-300 bg-white flex items-center justify-center text-gray-500 hover:text-[#6b1e96] hover:border-[#6b1e96] transition-all active:scale-95 shadow-sm"
                aria-label="Siguiente"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                </svg>
              </button>
            </div>
          </div>

          {/* Scrollable Track */}
          <div
            ref={carouselRef}
            data-carousel=""
            className="flex gap-4 overflow-x-auto pb-4 scroll-smooth snap-x snap-mandatory"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            <style>{`[data-carousel]::-webkit-scrollbar { display: none; }`}</style>
            {carouselProducts.map((product) => (
              <div key={product.id} className="flex-shrink-0 w-[200px] sm:w-[220px] snap-start">
                <SuggestedProductCard product={product} variant="standard" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

