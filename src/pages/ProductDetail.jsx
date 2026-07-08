import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useProducts } from "../context/ProductContext";
import { useCart } from "../context/CartContext";
import { useFavorites } from "../context/FavoriteContext";
import { useAuth } from "../context/AuthContext";
import useRecentlyViewed from "../hooks/useRecentlyViewed";
import ProductGallery from "../components/products/ProductGallery";
import ProductVariationSelector from "../components/products/ProductVariationSelector";
import PriceDisplay from "../components/products/PriceDisplay";
import SmallProductCard from "../components/SmallProductCard";
import RelatedProductCard from "../components/RelatedProductCard";
import ComparePricesModal from "../components/products/ComparePricesModal";
import ProductReviews from "../components/products/ProductReviews";
import ProductQA from "../components/products/ProductQA";
import toast from "react-hot-toast";

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    fetchProductById,
    allProducts,
    loading: globalLoading,
    trendingProductIds,
  } = useProducts();
  const { addToCart, items: cartItems } = useCart();
  const { toggleFavorite, favoriteIds } = useFavorites();
  const { user } = useAuth();
  const { addViewed, getViewedProducts } = useRecentlyViewed();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedVariationId, setSelectedVariationId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState("description"); // "description", "reviews", "qa"
  const [descImageIndex, setDescImageIndex] = useState(0);
  const [isAdding, setIsAdding] = useState(false);

  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);

  useEffect(() => {
    if (globalLoading) return;

    const loadProduct = async () => {
      try {
        setLoading(true);
        setError(null);

        // Show cached data instantly for fast UX 
        const cachedItem = allProducts.find((p) => String(p.id) === String(id));
        if (cachedItem) {
          setProduct(cachedItem);
          setLoading(false);
        }

        // Always fetch fresh data to get updated stars, stock, etc.
        try {
          const freshData = await fetchProductById(id);
          setProduct(freshData);
        } catch (fetchErr) {
          // If API fails but we already have cache, silently keep cached version
          if (!cachedItem) {
            throw fetchErr;
          }
        }
      } catch (err) {
        if (err.response?.status === 404) {
          const localItem = allProducts.find((p) => String(p.id) === String(id));
          if (localItem) {
            setProduct(localItem);
            return;
          }
        }
        setError(
          err.response?.data?.error ||
            err.message ||
            "No se pudo cargar el producto."
        );
      } finally {
        setLoading(false);
      }
    };
    loadProduct();
  }, [id, fetchProductById, allProducts, globalLoading]);

  useEffect(() => {
    // Reset defaults on product change
    setQuantity(1);
    setSelectedVariationId("");
    setActiveTab("description");
    setDescImageIndex(0);
    window.scrollTo({ top: 0, behavior: "smooth" });

    // Track this product as recently viewed
    if (id) addViewed(id);
  }, [id, addViewed]);

  const validVariations = useMemo(() => {
    if (!product?.variations) return [];
    return product.variations.filter((v) => {
      const isLegacyDefault =
        v.attribute_name === "default" ||
        v.attribute_value === '{"_default":"default"}' ||
        v.attribute_value === "default";
      return !isLegacyDefault;
    });
  }, [product?.variations]);

  const hasVariations = validVariations.length > 0;

  const selectedVariation = hasVariations
    ? validVariations.find((v) => String(v.id) === String(selectedVariationId))
    : null;

  // DEDUP FIX: Resolve the _default variation so we can pass its real ID to addToCart
  // This prevents the mismatch where ProductDetail sends null and StoreCatalog sends the UUID
  const defaultVariation = useMemo(() => {
    if (hasVariations) return null; // User must select from visible variations
    // Find the _default variation (hidden from UI but needed for cart consistency)
    const defVar = product?.variations?.find(
      (v) =>
        v.attribute_name === "default" ||
        v.attribute_value === '{"_default":"default"}' ||
        v.attribute_value === "default"
    );
    // If no named default, use the first variation available
    return defVar || product?.variations?.[0] || null;
  }, [product?.variations, hasVariations]);

  // The variation to actually use for cart operations
  const effectiveVariation = selectedVariation || defaultVariation;

  const priceDetails = useMemo(() => {
    if (!product) return null;

    const discount = product.active_discount;

    // Helper to calculate final price for a given original price
    const getFinalPrice = (origPrice) => {
      if (!discount) return origPrice;
      let discountAmount = 0;
      if (discount.discount_type === "percentage") {
        discountAmount = (origPrice * discount.discount_value) / 100;
      } else {
        discountAmount = Math.min(discount.discount_value, origPrice);
      }
      return Math.max(0, Math.round((origPrice - discountAmount) * 100) / 100);
    };

    if (hasVariations) {
      if (selectedVariation) {
        // A specific variation is selected
        const originalPrice = Number(product.price) + Number(selectedVariation.price_modifier || 0);
        const finalPrice = getFinalPrice(originalPrice);
        
        let compareAtPrice = null;
        if (product.compare_at_price && Number(product.compare_at_price) > 0) {
          compareAtPrice = Number(product.compare_at_price) + Number(selectedVariation.price_modifier || 0);
        }

        return {
          isRange: false,
          originalPrice,
          finalPrice,
          compareAtPrice,
          discount
        };
      } else {
        // No variation selected yet: calculate ranges
        const prices = validVariations.map((v) => {
          const orig = Number(product.price) + Number(v.price_modifier || 0);
          const final = getFinalPrice(orig);
          let comp = null;
          if (product.compare_at_price && Number(product.compare_at_price) > 0) {
            comp = Number(product.compare_at_price) + Number(v.price_modifier || 0);
          }
          return { orig, final, comp };
        });

        const finalPrices = prices.map((p) => p.final);
        const origPrices = prices.map((p) => p.orig);
        const compPrices = prices.map((p) => p.comp).filter((c) => c !== null);

        const minFinal = Math.min(...finalPrices);
        const maxFinal = Math.max(...finalPrices);
        const minOrig = Math.min(...origPrices);
        const maxOrig = Math.max(...origPrices);
        
        let minComp = compPrices.length > 0 ? Math.min(...compPrices) : null;
        let maxComp = compPrices.length > 0 ? Math.max(...compPrices) : null;

        const isRange = minFinal !== maxFinal;

        return {
          isRange,
          minFinal,
          maxFinal,
          minOrig,
          maxOrig,
          minComp,
          maxComp,
          originalPrice: minOrig,
          finalPrice: minFinal,
          compareAtPrice: minComp,
          discount
        };
      }
    } else {
      // No variations
      const originalPrice = Number(product.price);
      const finalPrice = discount ? Number(discount.final_price) : originalPrice;
      const compareAtPrice = product.compare_at_price ? Number(product.compare_at_price) : null;

      return {
        isRange: false,
        originalPrice,
        finalPrice,
        compareAtPrice,
        discount
      };
    }
  }, [product, hasVariations, selectedVariation, validVariations]);


  const currentStock = hasVariations
    ? selectedVariation
      ? selectedVariation.stock
      : 0
    : (() => {
        if (defaultVariation?.stock != null) return defaultVariation.stock;
        return product?.stock ?? 99;
      })();

  const isInactive = product?.is_active === false;
  const effectiveStock = isInactive ? 0 : (product?.stock_status === "Sin stock" ? 0 : currentStock);
  const isOwnProduct = user?.id === product?.store_id;

  const hasRealVariations = useMemo(() => {
    const variations = product?.product_variations || product?.variations || [];
    return variations.filter((v) => {
      const isLegacyDefault =
        v.attribute_name === "default" ||
        v.attribute_value === '{"_default":"default"}' ||
        v.attribute_value === "default";
      return !isLegacyDefault;
    }).length > 0;
  }, [product]);

  // Check cart quantity: count only the selected variation if product has real variations
  const totalCartQtyForProduct = useMemo(() => {
    if (!product) return 0;
    if (hasRealVariations) {
      if (!selectedVariation) return 0;
      return cartItems
        .filter(ci => ci.product_id === product.id && ci.variation_id === selectedVariation.id)
        .reduce((sum, ci) => sum + Number(ci.quantity), 0);
    } else {
      return cartItems
        .filter(ci => ci.product_id === product.id)
        .reduce((sum, ci) => sum + Number(ci.quantity), 0);
    }
  }, [cartItems, product, hasRealVariations, selectedVariation]);

  const isCartAtMax = effectiveStock > 0 && totalCartQtyForProduct >= effectiveStock;
  const remainingStock = Math.max(0, effectiveStock - totalCartQtyForProduct);

  const handleAddToCart = async () => {
    if (isOwnProduct || isAdding || isCartAtMax) return;
    if (hasVariations && !selectedVariation) {
      toast.error("Por favor selecciona una variación primero.");
      return;
    }

    setIsAdding(true);
    try {
    // DEDUP FIX: Pass effectiveVariation (which includes _default) instead of selectedVariation (which is null for _default products)
    const success = await addToCart(product, effectiveVariation, quantity);

    if (success) {
      let variationText = "";
      if (selectedVariation) {
        try {
          const parsed = JSON.parse(selectedVariation.attribute_value);
          variationText = `(${Object.values(parsed).join(" - ")}) `;
        } catch {
          variationText = `(${selectedVariation.attribute_value}) `;
        }
      }
      toast.success(
        `Agregado a la bolsa: ${product.name} ${variationText}- ${quantity} unid.`
      );
    }
    // If success is false, CartContext already showed the error toast
    } finally {
      setIsAdding(false);
    }
  };

  const handleReviewAdded = async () => {
    try {
      const freshData = await fetchProductById(id);
      setProduct(freshData);
    } catch (err) {
      console.error(err);
    }
  };

  // Real recently viewed products (tracked via sessionStorage)
  const recentViews = useMemo(() => {
    const excludeSet = new Set([product?.id].filter(Boolean));
    return getViewedProducts(allProducts, excludeSet, 3);
  }, [allProducts, product?.id, getViewedProducts]);

  const relatedProducts = useMemo(() => {
    // Return up to 5 products distinct from the current one
    return allProducts.filter((p) => String(p.id) !== String(product?.id)).slice(0, 5);
  }, [allProducts, product?.id]);

  if (loading) {
    return (
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="animate-pulse flex flex-col lg:flex-row gap-10">
          <div className="w-full lg:w-[40%] aspect-square bg-gray-200 rounded-2xl"></div>
          <div className="w-full lg:w-[40%] space-y-4 py-4">
            <div className="h-6 bg-gray-200 w-2/4 rounded"></div>
            <div className="h-10 bg-gray-200 w-3/4 rounded"></div>
            <div className="h-20 bg-gray-200 w-full rounded"></div>
            <div className="h-16 bg-gray-200 w-full rounded"></div>
          </div>
          <div className="w-full lg:w-[20%] hidden lg:block bg-gray-200 rounded-xl h-96"></div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center min-h-[50vh] flex flex-col justify-center items-center">
        <h2 className="text-3xl font-extrabold text-gray-900 mb-4">
          Producto no encontrado
        </h2>
        <p className="text-gray-500 mb-8 max-w-md mx-auto">
          {error ||
            "El artículo que buscas pudo haber sido eliminado, está fuera de línea temporalmente o no tienes permisos para verlo."}
        </p>
        <button
          onClick={() => navigate("/")}
          className="bg-[#6b1e96] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#531575] transition-colors"
        >
          Explorar el Catálogo
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      {/* Breadcrumbs */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <nav className="flex text-sm text-gray-500 font-medium">
          <button onClick={() => navigate("/")} className="hover:text-[#6b1e96] transition-colors">Inicio</button>
          <span className="mx-2">/</span>
          <button onClick={() => navigate("/store-catalog")} className="hover:text-[#6b1e96] transition-colors">Tienda</button>
          <span className="mx-2">/</span>
          <span className="text-gray-900 truncate max-w-[200px] md:max-w-none">{product.name}</span>
        </nav>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {/* --- TOP SECTION: 3 Columns --- */}
        <div className="flex flex-col lg:flex-row gap-10">
          
          {/* COLUMN 1: Image Gallery (40%) */}
          <div className="w-full lg:w-[40%]">
            <ProductGallery images={product.images || []} />
          </div>

          {/* COLUMN 2: Product Info (40%) */}
          <div className="w-full lg:w-[40%] flex flex-col">
            {trendingProductIds?.has(product.id) && (
              <div className="mb-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold tracking-wider uppercase bg-orange-500 text-white shadow-sm rounded-md w-max">
                  <span className="material-symbols-outlined text-[14px]">local_fire_department</span>
                  Más Vendido
                </span>
              </div>
            )}
            <h1 className="text-[28px] lg:text-[32px] font-bold text-gray-900 leading-tight mb-1">
              {product.name}
            </h1>
            
            {(product.store?.business_name || product.store_profiles?.business_name) && (
              <p className="text-gray-500 mb-4 flex items-center gap-1 text-[15px]">
                Vendido por: 
                <Link to={`/store/${product.store_id}`} className="text-[#6b1e96] font-bold hover:underline flex items-center gap-1 bg-purple-50 px-2 py-0.5 rounded-md">
                  <span className="material-symbols-outlined text-[16px]">storefront</span>
                  {product.store?.business_name || product.store_profiles?.business_name}
                </Link>
              </p>
            )}
            
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mb-4">
              {priceDetails?.isRange ? (
                <>
                  <PriceDisplay amountUSD={priceDetails.minFinal} priceClassName="text-[28px] font-bold text-[#2563eb]" hideSwitcher={true} />
                  <span className="text-[28px] font-bold text-[#2563eb]">-</span>
                  <PriceDisplay amountUSD={priceDetails.maxFinal} priceClassName="text-[28px] font-bold text-[#2563eb]" hideSwitcher={true} />

                  {priceDetails.discount && (
                    <>
                      <span className="text-lg text-gray-300 line-through decoration-gray-300 font-medium ml-1">
                        ${priceDetails.minOrig.toFixed(2)} - ${priceDetails.maxOrig.toFixed(2)}
                      </span>
                      <span className="px-2.5 py-1 text-[11px] font-black uppercase tracking-wide bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-lg flex items-center gap-1">
                        <span className="material-symbols-outlined" style={{ fontSize: "13px" }}>local_offer</span>
                        {priceDetails.discount.discount_type === "percentage"
                          ? `-${priceDetails.discount.discount_value}%`
                          : `-$${priceDetails.discount.discount_value}`}
                      </span>
                    </>
                  )}
                  {!priceDetails.discount && priceDetails.minComp && priceDetails.minComp > priceDetails.minFinal && (
                    <span className="text-lg text-gray-300 line-through decoration-gray-300 font-medium ml-1">
                      ${priceDetails.minComp.toFixed(2)} - ${priceDetails.maxComp.toFixed(2)}
                    </span>
                  )}
                </>
              ) : (
                <>
                  <PriceDisplay amountUSD={priceDetails?.finalPrice} priceClassName="text-[28px] font-bold text-[#2563eb]" hideSwitcher={true} />

                  {priceDetails?.discount ? (
                    <>
                      <span className="text-lg text-gray-300 line-through decoration-gray-300 font-medium ml-1">
                        ${priceDetails.originalPrice.toFixed(2)}
                      </span>
                      <span className="px-2.5 py-1 text-[11px] font-black uppercase tracking-wide bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-lg flex items-center gap-1">
                        <span className="material-symbols-outlined" style={{ fontSize: "13px" }}>local_offer</span>
                        {priceDetails.discount.discount_type === "percentage"
                          ? `-${priceDetails.discount.discount_value}%`
                          : `-$${priceDetails.discount.discount_value}`}
                      </span>
                    </>
                  ) : (
                    priceDetails?.compareAtPrice && priceDetails.compareAtPrice > priceDetails.finalPrice && (
                      <span className="text-lg text-gray-300 line-through decoration-gray-300 font-medium ml-1">
                        ${priceDetails.compareAtPrice.toFixed(2)}
                      </span>
                    )
                  )}
                </>
              )}
              
              <span className="text-gray-300 hidden sm:inline px-1">|</span>

              <div className="flex items-center gap-2">
                <div className="flex text-[#facc15]">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className={`material-symbols-outlined text-[20px] ${i < Math.round(product.rating_avg || 0) ? 'text-[#facc15]' : 'text-gray-200'}`}>star</span>
                  ))}
                </div>
                <span className="text-gray-500 font-medium">({product.review_count || 0} reseñas)</span>
              </div>
            </div>

            {/* Switcher is displayed here if needed but keeping it hidden for pure matching. The currency switcher logic is kept within PriceDisplay without hideSwitcher for full compatibility, replacing with true for visual accuracy to mockup */}

            {product.description && (
              <p className="text-gray-500 text-[16px] leading-relaxed mb-6 line-clamp-3">
                {product.description.replace(/<[^>]*>/g, '').substring(0, 200)}{product.description.replace(/<[^>]*>/g, '').length > 200 ? '...' : ''}
              </p>
            )}

            {/* Variations */}
            {validVariations.length > 0 && (
              <div className="mb-6">
                <ProductVariationSelector
                  variations={validVariations}
                  onChange={setSelectedVariationId}
                />
              </div>
            )}

            {isInactive && (
              <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm flex items-start gap-3">
                <span className="material-symbols-outlined text-amber-500 mt-0.5">warning</span>
                <div>
                  <p className="font-bold">No disponible actualmente</p>
                  <p className="mt-1 text-xs text-amber-700/90 leading-relaxed">
                    Este producto ha sido desactivado temporalmente por el vendedor. Puedes conservarlo en tus favoritos para realizar el seguimiento cuando vuelva a estar activo.
                  </p>
                </div>
              </div>
            )}

            {/* Quantity and CTA */}
            <div className="flex flex-col sm:flex-row items-stretch gap-4 mt-2">
              <div className="flex items-center border-[1.5px] border-gray-300 rounded-md overflow-hidden h-12 w-full sm:w-[130px] flex-shrink-0 bg-white">
                <button 
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={isInactive}
                  className="w-12 h-full flex items-center justify-center text-gray-400 hover:text-[#2563eb] bg-[#f8f9fa] transition-colors disabled:opacity-50"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg>
                </button>
                <input 
                  type="text" 
                  value={quantity} 
                  readOnly 
                  className="flex-1 w-full text-center font-medium text-gray-700 focus:outline-none pointer-events-none text-base bg-transparent px-2 disabled:text-gray-400"
                />
                <button 
                  onClick={() => setQuantity(Math.min(remainingStock || 1, quantity + 1))}
                  disabled={isInactive || quantity >= remainingStock || remainingStock === 0}
                  className="w-12 h-full flex items-center justify-center text-gray-400 hover:text-[#2563eb] bg-[#f8f9fa] transition-colors disabled:opacity-50 disabled:hover:text-gray-400"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                </button>
              </div>

              {isInactive ? (
                <button disabled className="flex-1 w-full bg-gray-100 text-gray-400 font-semibold h-12 rounded-md cursor-not-allowed text-[15px] border-[1.5px] border-gray-200">
                  No disponible
                </button>
              ) : isOwnProduct ? (
                <button disabled className="flex-1 w-full bg-gray-100 text-gray-400 font-semibold h-12 rounded-md cursor-not-allowed text-[15px] border-[1.5px] border-gray-200">
                  Producto Propio
                </button>
              ) : (
                <button
                  onClick={handleAddToCart}
                  disabled={(hasVariations && !selectedVariation) || effectiveStock <= 0 || isCartAtMax || isAdding}
                  className={`flex-1 w-full h-12 rounded-md font-medium text-[15px] flex items-center justify-center gap-2 transition-all shadow-sm
                    ${effectiveStock <= 0 || isCartAtMax
                      ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                      : isAdding
                      ? "bg-[#2563eb] text-white cursor-wait opacity-80"
                      : "bg-[#2563eb] hover:bg-blue-700 text-white active:scale-[0.98]"}`}
                >
                  {isAdding ? (
                    <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                    </svg>
                  )}
                  {effectiveStock <= 0 ? "Agotado" : isCartAtMax ? "Máximo en carrito" : isAdding ? "Agregando..." : "Añadir a la bolsa"}
                </button>
              )}

              {!isOwnProduct && (
                <button
                  onClick={() => toggleFavorite(product.id)}
                  className={`h-12 w-12 flex-shrink-0 flex items-center justify-center rounded-md border-[1.5px] transition-colors ${
                    favoriteIds?.has(product.id)
                      ? "border-rose-200 bg-rose-50 text-rose-500"
                      : "border-gray-300 text-gray-400 hover:text-rose-500 hover:border-rose-300 hover:bg-rose-50"
                  }`}
                  title={favoriteIds?.has(product.id) ? "Quitar de favoritos" : "Agregar a favoritos"}
                >
                  <svg 
                    className={`w-5 h-5 transition-all duration-300 ${favoriteIds?.has(product.id) ? "fill-current scale-110" : "fill-none scale-100"}`} 
                    stroke="currentColor" 
                    viewBox="0 0 24 24" 
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                  </svg>
                </button>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-3 font-medium flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${effectiveStock > 0 && !isInactive ? "bg-[#c3ff00]" : "bg-red-500"}`}></span>
              {isInactive ? "Sin disponibilidad temporal" : (effectiveStock > 0 ? `Quedan ${effectiveStock} unidades en stock` : "Sin disponibilidad temporal")}
            </p>
            {/* Amazon-style: Show warning when cart has max stock */}
            {isCartAtMax && (
              <p className="text-sm text-amber-600 font-medium mt-2 flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 flex-shrink-0">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
                </svg>
                El vendedor solo tiene {effectiveStock} unidad{effectiveStock !== 1 ? 'es' : ''} disponible{effectiveStock !== 1 ? 's' : ''} y ya las tienes en tu carrito.
              </p>
            )}
            {totalCartQtyForProduct > 0 && !isCartAtMax && (
              <p className="text-xs text-gray-400 mt-1 ml-4">
                Ya tienes {totalCartQtyForProduct} en tu carrito
              </p>
            )}

            {/* Utility Actions */}
            <div className="flex items-center gap-6 mt-4">
              <button
                onClick={() => toggleFavorite(product.id)}
                className={`flex items-center gap-2 transition-colors text-[15px] ${
                  favoriteIds?.has(product.id)
                    ? "text-rose-500"
                    : "text-gray-600 hover:text-rose-500"
                }`}
              >
                <svg
                  className={`w-5 h-5 transition-all duration-300 ${favoriteIds?.has(product.id) ? "fill-current scale-110" : "fill-none scale-100"}`}
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                {favoriteIds?.has(product.id) ? "En tus favoritos" : "Añadir a favorito"}
              </button>
              <button className="flex items-center gap-2 text-gray-600 hover:text-[#2563eb] transition-colors text-[15px]">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Hacer una pregunta
              </button>
              {!isOwnProduct && (
                <button
                  onClick={() => setIsCompareModalOpen(true)}
                  className="flex items-center gap-2 text-gray-600 hover:text-[#2563eb] transition-colors text-[15px]"
                  title="Buscar y comparar con otros vendedores"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 6l3 1m0 0l-3 9a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0022.5 16l-3-9m-3-1l-3 1m0 0l3 9" /></svg>
                  Comparar
                </button>
              )}
            </div>
            
            <div className="mt-8 flex flex-col gap-3">
              <div className="flex items-center gap-3 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100">
                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                <span>Envío estimado: <strong className="text-gray-900 border-b border-gray-900">2 a 4 días hábiles</strong></span>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-4 text-sm text-gray-500 pb-2">
              <span className="font-medium">Compartir:</span>
              <div className="flex items-center gap-3">
                <button className="text-gray-400 hover:text-[#2563eb] transition-colors"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg></button>
                <button className="text-gray-400 hover:text-[#2563eb] transition-colors"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg></button>
              </div>
            </div>
          </div>

          {/* COLUMN 3: Recent Views */}
          <div className="w-full lg:w-[22%] hidden lg:flex flex-col border-l border-gray-100 pl-6">
            <h3 className="text-[15px] font-bold text-gray-900 mb-5">Vistos Recientemente</h3>
            <div className="flex flex-col divide-y divide-gray-100">
              {recentViews.length > 0 ? (
                recentViews.map(p => (
                  <div key={p.id} className="py-3 first:pt-0">
                    <SmallProductCard product={p} />
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-sm">No hay productos recientes.</p>
              )}
            </div>
          </div>
        </div>

        {/* --- TABS SECTION --- */}
        <div className="mt-16 lg:mt-24 border-t border-gray-200">
          {/* Tab Headers */}
          <div className="flex space-x-12 border-b border-gray-200 overflow-x-auto overflow-y-hidden" aria-label="Tabs">
            <button
              onClick={() => setActiveTab("description")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-[15px] transition-colors ${activeTab === 'description' ? 'border-[#6b1e96] text-[#6b1e96]' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            >
              Descripción
            </button>
            <button
              onClick={() => setActiveTab("reviews")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-[15px] transition-colors ${activeTab === 'reviews' ? 'border-[#6b1e96] text-[#6b1e96]' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            >
              Reseñas ({product.review_count || 0})
            </button>
            <button
              onClick={() => setActiveTab("qa")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-[15px] transition-colors ${activeTab === 'qa' ? 'border-[#6b1e96] text-[#6b1e96]' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            >
              Preguntas & Respuestas
            </button>
          </div>

          {/* Tab Content */}
          <div className="py-10">
            {activeTab === "description" && (
              <div className="flex flex-col lg:flex-row gap-12 items-start">
                <div className="w-full lg:w-1/2">
                  <h3 className="text-xl font-bold text-gray-900 mb-6 font-serif">Especificaciones Técnicas</h3>
                  {/* Fake spec table simulating the image */}
                  <div className="border border-gray-200 rounded-xl overflow-hidden mb-8">
                    <table className="w-full text-sm text-left text-gray-600">
                      <tbody>
                        <tr className="border-b border-gray-200 bg-gray-50"><th className="px-6 py-4 font-semibold text-gray-900 w-1/3">Marca</th><td className="px-6 py-4">{product.store?.business_name || "FORCEPX Certified"}</td></tr>
                        <tr className="border-b border-gray-200"><th className="px-6 py-4 font-semibold text-gray-900">Modelo</th><td className="px-6 py-4">{product.name}</td></tr>
                        <tr className="border-b border-gray-200 bg-gray-50"><th className="px-6 py-4 font-semibold text-gray-900">Categoría</th><td className="px-6 py-4">Equipamiento Clínico</td></tr>
                        <tr className="border-b border-gray-200"><th className="px-6 py-4 font-semibold text-gray-900">Condición</th><td className="px-6 py-4">Nuevo / Sellado de Fábrica</td></tr>
                      </tbody>
                    </table>
                  </div>

                  <h3 className="text-xl font-bold text-gray-900 mb-6 font-serif">Sobre el Producto</h3>
                  <div 
                    className="text-gray-600 leading-relaxed prose prose-sm md:prose-base max-w-none 
                              prose-p:mt-0 prose-p:mb-5 prose-ul:list-disc prose-ol:list-decimal 
                              prose-li:ml-4 prose-a:text-[#6b1e96] prose-a:font-semibold"
                    dangerouslySetInnerHTML={{ __html: product.description || "<p>Descripción detallada no proporcionada por la tienda.</p>" }}
                  />
                </div>
                
                {/* Navigable Image Preview */}
                <div className="w-full lg:w-1/2 relative rounded-2xl overflow-hidden bg-gray-50 aspect-[4/3] flex items-center justify-center border border-gray-100 p-8 shadow-inner group">
                  {product.images && product.images.length > 0 ? (
                    <>
                      <img src={product.images[descImageIndex]} alt={`Vista ${descImageIndex + 1}`} className="w-full h-full object-contain mix-blend-multiply transition-opacity duration-300" />
                      {product.images.length > 1 && (
                        <>
                          <button
                            onClick={() => setDescImageIndex(prev => prev > 0 ? prev - 1 : product.images.length - 1)}
                            className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white hover:bg-gray-50 text-gray-500 hover:text-[#6b1e96] rounded-full shadow-md border border-gray-200 flex items-center justify-center transition-colors"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
                          </button>
                          <button
                            onClick={() => setDescImageIndex(prev => prev < product.images.length - 1 ? prev + 1 : 0)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white hover:bg-gray-50 text-gray-500 hover:text-[#6b1e96] rounded-full shadow-md border border-gray-200 flex items-center justify-center transition-colors"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
                          </button>
                          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                            {product.images.map((_, i) => (
                              <button key={i} onClick={() => setDescImageIndex(i)} className={`w-2 h-2 rounded-full transition-all ${i === descImageIndex ? 'bg-[#6b1e96] w-4' : 'bg-gray-300 hover:bg-gray-400'}`} />
                            ))}
                          </div>
                        </>
                      )}
                    </>
                  ) : (
                    <span className="text-gray-400 font-medium">Buscando previsualización...</span>
                  )}
                </div>
              </div>
            )}

            {activeTab === "reviews" && (
              <ProductReviews 
                productId={product.id} 
                onReviewAdded={handleReviewAdded} 
              />
            )}

            {activeTab === "qa" && (
              <ProductQA 
                productId={product.id} 
                storeOwnerId={product.store?.owner_id || product.store_id} 
              />
            )}
          </div>
        </div>

        {/* --- RELATED PRODUCTS SECTION --- */}
        {relatedProducts.length > 0 && (
          <div className="mt-20 pt-10">
            <h2 className="text-[17px] font-semibold text-gray-800 mb-3 ml-1">Related products</h2>
            <div className="w-full h-[1px] bg-blue-300 mb-6"></div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {relatedProducts.slice(0, 5).map((p, i) => {
                let badgeMock = null;
                if (i === 1) badgeMock = "SALE";
                if (i === 4 || i === 2) badgeMock = "NEW";
                return <RelatedProductCard key={p.id} product={p} badge={badgeMock} />;
              })}
            </div>
          </div>
        )}
        
      </div>

      <ComparePricesModal 
        isOpen={isCompareModalOpen}
        onClose={() => setIsCompareModalOpen(false)}
        baseProduct={product}
      />
    </div>
  );
}
