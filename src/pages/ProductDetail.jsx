import { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useNavigate, useLocation, Link } from "react-router-dom";
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
import { track } from "../services/tracking";
import { useSeo, stripHtml, SITE_URL } from "../lib/seo";
import ShareButton from "../components/common/ShareButton";
import { getRelatedProductsAPI } from "../services/api";

const isLegacyDefault = (v) =>
  v.attribute_name === "default" ||
  v.attribute_value === '{"_default":"default"}' ||
  v.attribute_value === "default";

// Precio final de un precio original con el descuento activo del producto.
function applyDiscount(origPrice, discount) {
  if (!discount) return origPrice;
  const discountAmount =
    discount.discount_type === "percentage"
      ? (origPrice * discount.discount_value) / 100
      : Math.min(discount.discount_value, origPrice);
  return Math.max(0, Math.round((origPrice - discountAmount) * 100) / 100);
}

// Igual que ProductContext: la API trae product_variations/store_profiles/brands.
const mapProduct = (p) => ({
  ...p,
  variations: p.product_variations || p.variations || [],
  store: p.store_profiles || p.store || null,
  brand: p.brands || p.brand || null,
});

// «Vistos recientemente»: ids en localStorage (sobrevive al cerrar la pestaña), máximo 8.
const RECENT_KEY = "forcepx_recently_viewed";
const RECENT_MAX = 8;
const RECENT_SHOWN = 4;
function readRecentIds() {
  try {
    const ids = JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
    return Array.isArray(ids) ? ids.map(String) : [];
  } catch {
    return [];
  }
}
function saveRecentId(productId) {
  try {
    const key = String(productId);
    const ids = [key, ...readRecentIds().filter((x) => x !== key)].slice(0, RECENT_MAX);
    localStorage.setItem(RECENT_KEY, JSON.stringify(ids));
  } catch {
    // almacenamiento bloqueado (modo privado): la sección simplemente no aparece
  }
}

const TABS = [
  { key: "description", label: "Descripción" },
  { key: "reviews", label: "Reseñas" },
  { key: "qa", label: "Preguntas y respuestas" },
];

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const {
    fetchProductById,
    allProducts,
    loading: globalLoading,
    trendingProductIds,
  } = useProducts();
  const { addToCart, items: cartItems } = useCart();
  const { toggleFavorite, favoriteIds } = useFavorites();
  const { user } = useAuth();
  // El carrito sigue leyendo los vistos de la sesión: se registra también ahí.
  const { addViewed } = useRecentlyViewed();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedVariationId, setSelectedVariationId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState("description"); // "description", "reviews", "qa"
  const [descImageIndex, setDescImageIndex] = useState(0);
  const [isAdding, setIsAdding] = useState(false);

  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [recentViews, setRecentViews] = useState([]);
  const tabsRef = useRef(null);

  const storeName = product?.store?.business_name || product?.store_profiles?.business_name || null;

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

  // Vistos recientemente: se leen los anteriores (sin esta ficha) y luego se guarda esta.
  useEffect(() => {
    if (!id) return;
    let active = true;
    const ids = readRecentIds().filter((x) => x !== String(id)).slice(0, RECENT_SHOWN);
    saveRecentId(id);
    Promise.all(
      ids.map((rid) => {
        const cached = allProducts.find((p) => String(p.id) === rid);
        if (cached) return Promise.resolve(cached);
        return fetchProductById(rid).catch(() => null); // borrado o suspendido: se omite
      }),
    ).then((list) => {
      if (active) setRecentViews(list.filter(Boolean));
    });
    return () => {
      active = false;
    };
    // allProducts solo sirve de caché: no hace falta repetir la carga cuando cambia
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, fetchProductById]);

  // Relacionados reales del backend; si el endpoint falla, los de la misma categoría del catálogo.
  useEffect(() => {
    if (!id) return;
    let active = true;
    setRelatedProducts([]);
    getRelatedProductsAPI(id, 8)
      .then((res) => {
        const list = res.data?.data || [];
        if (active) setRelatedProducts(list.map(mapProduct));
      })
      .catch(() => {
        if (!active) return;
        const current = allProducts.find((p) => String(p.id) === String(id));
        setRelatedProducts(
          current?.category_id
            ? allProducts
                .filter((p) => String(p.id) !== String(id) && p.category_id === current.category_id)
                .slice(0, 8)
            : [],
        );
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Se espera a que el producto cargue para poder atribuir la vista a su tienda y categoría.
  // El ref evita emitir el evento de nuevo en cada re-render de la misma ficha.
  const viewTrackedFor = useRef(null);
  useEffect(() => {
    if (!product?.id || viewTrackedFor.current === product.id) return;
    viewTrackedFor.current = product.id;
    track("product_view", {
      product_id: product.id,
      store_id: product.store_id,
      category_id: product.category_id,
      value_usd: product.price,
    });
  }, [product]);

  const validVariations = useMemo(() => {
    if (!product?.variations) return [];
    return product.variations.filter((v) => !isLegacyDefault(v));
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
    const defVar = product?.variations?.find(isLegacyDefault);
    // If no named default, use the first variation available
    return defVar || product?.variations?.[0] || null;
  }, [product?.variations, hasVariations]);

  // The variation to actually use for cart operations
  const effectiveVariation = selectedVariation || defaultVariation;

  const priceDetails = useMemo(() => {
    if (!product) return null;

    const discount = product.active_discount;

    const getFinalPrice = (origPrice) => applyDiscount(origPrice, discount);

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


  // Stock real: null = la API no lo trae (se muestra «Disponible» sin cifra, nunca se inventa).
  const toStock = (v) => (v == null || v === "" || Number.isNaN(Number(v)) ? null : Number(v));
  const currentStock = hasVariations
    ? selectedVariation
      ? toStock(selectedVariation.stock) ?? 0
      : 0
    : toStock(defaultVariation?.stock) ?? toStock(product?.stock);

  const isInactive = product?.is_active === false;
  const isSoldOut = product?.stock_status === "Sin stock";
  const effectiveStock = isInactive || isSoldOut ? 0 : currentStock;
  const stockKnown = effectiveStock != null;
  const hasStockElsewhere = hasVariations && validVariations.some((v) => Number(v.stock) > 0);
  const isOwnProduct = user?.id === product?.store_id;

  const hasRealVariations = useMemo(() => {
    const variations = product?.product_variations || product?.variations || [];
    return variations.filter((v) => !isLegacyDefault(v)).length > 0;
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

  const isCartAtMax = stockKnown && effectiveStock > 0 && totalCartQtyForProduct >= effectiveStock;
  // Sin dato de stock se limita la cantidad en pantalla; el backend valida el stock real al añadir.
  const remainingStock = stockKnown ? Math.max(0, effectiveStock - totalCartQtyForProduct) : 99;
  const canBuy = stockKnown ? effectiveStock > 0 : !isInactive;

  // La cantidad nunca supera lo que queda de la opción elegida.
  useEffect(() => {
    setQuantity((q) => Math.min(Math.max(1, q), remainingStock || 1));
  }, [selectedVariationId, remainingStock]);

  // SEO: título, descripción, imagen y ficha Product (precio final y disponibilidad reales).
  const seoPrice = product
    ? hasVariations
      ? applyDiscount(Number(product.price) || 0, product.active_discount)
      : Number(product.active_discount?.final_price ?? product.price) || 0
    : 0;
  const seoOutOfStock =
    isInactive ||
    isSoldOut ||
    product?.stock_status === "Agotado" ||
    (hasVariations
      ? validVariations.every((v) => Number(v.stock) <= 0)
      : (toStock(defaultVariation?.stock) ?? toStock(product?.stock)) === 0);
  const brandName = product?.brand?.name || product?.brands?.name || null;
  useSeo(
    product
      ? {
          title: product.name,
          description:
            stripHtml(product.description) ||
            `${product.name}${storeName ? ` de ${storeName}` : ""}. Insumo odontológico en Forcepx con compra protegida y envío a toda Venezuela.`,
          image: Array.isArray(product.images) && product.images[0] ? product.images[0] : undefined,
          path: `/product/${product.id}`,
          type: "product",
          jsonLd: {
            "@context": "https://schema.org",
            "@type": "Product",
            name: product.name,
            image: Array.isArray(product.images) ? product.images.filter(Boolean) : [],
            description: stripHtml(product.description).slice(0, 500),
            sku: product.id,
            ...(brandName ? { brand: { "@type": "Brand", name: brandName } } : {}),
            offers: {
              "@type": "Offer",
              url: `${SITE_URL}/product/${product.id}`,
              priceCurrency: "USD",
              price: seoPrice.toFixed(2),
              availability: seoOutOfStock ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
              ...(storeName ? { seller: { "@type": "Organization", name: storeName } } : {}),
            },
          },
        }
      : null,
  );

  const isFavorite = favoriteIds?.has(product?.id);
  const handleToggleFavorite = async () => {
    if (!user) {
      toast("Inicia sesión para guardar favoritos", { id: "favorites-auth" });
      navigate(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }
    // Los errores (límite, red) ya los avisa FavoriteContext con su propio toast.
    await toggleFavorite(product.id);
  };

  const goToQuestions = () => {
    setActiveTab("qa");
    // se espera al render de la pestaña para desplazarse
    requestAnimationFrame(() => tabsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  // Presentaciones con stock, para la ficha técnica.
  const availablePresentations = useMemo(
    () =>
      validVariations
        .filter((v) => Number(v.stock) > 0)
        .map((v) => {
          try {
            const parsed = JSON.parse(v.attribute_value);
            if (parsed && typeof parsed === "object") {
              return Object.values(parsed)
                .map((x) => (typeof x === "string" && x.includes("|") ? x.split("|")[0] : x))
                .join(" / ");
            }
          } catch {
            // texto simple
          }
          return v.attribute_value;
        }),
    [validVariations],
  );

  const handleAddToCart = async () => {
    if (isOwnProduct || isAdding || isCartAtMax) return;
    if (hasVariations && !selectedVariation) {
      toast.error("Por favor selecciona una variación primero.");
      return;
    }
    if (!canBuy) return;

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
          className="bg-[#6b1e96] hover:bg-[#4f0077] text-white font-bold rounded-xl px-5 py-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6b1e96] focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Explorar el catálogo
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      {/* Breadcrumbs */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <nav aria-label="Ruta de navegación" className="flex items-center text-sm text-gray-500 font-medium min-w-0">
          <Link to="/" className="hover:text-[#6b1e96] transition-colors shrink-0">Inicio</Link>
          <span className="mx-2" aria-hidden="true">/</span>
          <Link to="/store-catalog" className="hover:text-[#6b1e96] transition-colors shrink-0">Tienda</Link>
          <span className="mx-2" aria-hidden="true">/</span>
          <span className="text-[#191c20] truncate min-w-0" aria-current="page">{product.name}</span>
        </nav>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {/* --- TOP SECTION: 3 Columns --- */}
        <div className="flex flex-col lg:flex-row gap-10">
          
          {/* COLUMN 1: Image Gallery (40%) */}
          <div className="w-full lg:w-[40%]">
            <ProductGallery key={product.id} images={product.images || []} />
          </div>

          {/* COLUMN 2: Product Info (40%) */}
          <div className="w-full lg:w-[40%] flex flex-col min-w-0">
            {trendingProductIds?.has(product.id) && (
              <div className="mb-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold tracking-wider uppercase bg-orange-500 text-white shadow-sm rounded-md w-max">
                  <span className="material-symbols-outlined text-[14px]">local_fire_department</span>
                  Más Vendido
                </span>
              </div>
            )}
            <h1 className="text-[24px] sm:text-[28px] lg:text-[32px] font-extrabold text-[#191c20] font-['Manrope'] leading-tight mb-1 break-words">
              {product.name}
            </h1>
            
            {(product.store?.business_name || product.store_profiles?.business_name) && (
              <p className="text-gray-500 mb-4 flex flex-wrap items-center gap-1 text-[15px]">
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
                  <PriceDisplay amountUSD={priceDetails.minFinal} priceClassName="text-[26px] sm:text-[28px] font-extrabold text-[#191c20]" hideSwitcher={true} />
                  <span className="text-[26px] sm:text-[28px] font-extrabold text-[#191c20]">-</span>
                  <PriceDisplay amountUSD={priceDetails.maxFinal} priceClassName="text-[26px] sm:text-[28px] font-extrabold text-[#191c20]" hideSwitcher={true} />

                  {priceDetails.discount && (
                    <>
                      <span className="text-lg text-gray-500 line-through font-medium ml-1">
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
                    <span className="text-lg text-gray-500 line-through font-medium ml-1">
                      ${priceDetails.minComp.toFixed(2)} - ${priceDetails.maxComp.toFixed(2)}
                    </span>
                  )}
                </>
              ) : (
                <>
                  <PriceDisplay amountUSD={priceDetails?.finalPrice} priceClassName="text-[26px] sm:text-[28px] font-extrabold text-[#191c20]" hideSwitcher={true} />

                  {priceDetails?.discount ? (
                    <>
                      <span className="text-lg text-gray-500 line-through font-medium ml-1">
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
                      <span className="text-lg text-gray-500 line-through font-medium ml-1">
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
              <p className="text-gray-600 text-[16px] leading-relaxed mb-6 line-clamp-3">
                {stripHtml(product.description)}
              </p>
            )}

            {/* Variations */}
            {validVariations.length > 0 && (
              <div className="mb-6">
                <ProductVariationSelector
                  key={product.id}
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
              <div className="flex items-center border-[1.5px] border-gray-300 rounded-xl overflow-hidden h-12 w-full sm:w-[130px] flex-shrink-0 bg-white">
                <button
                  type="button"
                  aria-label="Disminuir cantidad"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={isInactive || quantity <= 1}
                  className="w-12 h-full flex items-center justify-center text-gray-500 hover:text-[#6b1e96] bg-[#f8f9fa] transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#6b1e96]"
                >
                  <svg aria-hidden="true" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg>
                </button>
                <input
                  type="text"
                  inputMode="numeric"
                  aria-label="Cantidad"
                  value={quantity}
                  readOnly
                  className="flex-1 w-full text-center font-medium text-gray-700 focus:outline-none pointer-events-none text-base bg-transparent px-2 disabled:text-gray-400"
                />
                <button
                  type="button"
                  aria-label="Aumentar cantidad"
                  onClick={() => setQuantity((q) => Math.min(remainingStock || 1, q + 1))}
                  disabled={isInactive || !canBuy || quantity >= remainingStock || remainingStock === 0}
                  className="w-12 h-full flex items-center justify-center text-gray-500 hover:text-[#6b1e96] bg-[#f8f9fa] transition-colors disabled:opacity-50 disabled:hover:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#6b1e96]"
                >
                  <svg aria-hidden="true" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                </button>
              </div>

              {isInactive ? (
                <button disabled className="flex-1 w-full bg-gray-100 text-gray-500 font-semibold h-12 rounded-xl cursor-not-allowed text-[15px] border-[1.5px] border-gray-200">
                  No disponible
                </button>
              ) : isOwnProduct ? (
                <button disabled className="flex-1 w-full bg-gray-100 text-gray-500 font-semibold h-12 rounded-xl cursor-not-allowed text-[15px] border-[1.5px] border-gray-200">
                  Producto propio
                </button>
              ) : (
                <button
                  onClick={handleAddToCart}
                  disabled={(hasVariations && !selectedVariation) || !canBuy || isCartAtMax || isAdding}
                  aria-busy={isAdding}
                  className="bg-[#6b1e96] hover:bg-[#4f0077] text-white font-bold rounded-xl px-5 py-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6b1e96] focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex-1 w-full h-12 !py-0 text-[15px] flex items-center justify-center gap-2"
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
                  {!canBuy
                    ? hasStockElsewhere
                      ? "Selecciona otra opción"
                      : "Agotado"
                    : isCartAtMax
                      ? "Máximo en carrito"
                      : isAdding
                        ? "Agregando…"
                        : "Añadir a la bolsa"}
                </button>
              )}

              {!isOwnProduct && (
                <button
                  type="button"
                  onClick={handleToggleFavorite}
                  className={`hidden sm:flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl border-[1.5px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6b1e96] focus-visible:ring-offset-2 ${
                    isFavorite
                      ? "border-rose-200 bg-rose-50 text-rose-500"
                      : "border-gray-300 text-gray-500 hover:text-rose-500 hover:border-rose-300 hover:bg-rose-50"
                  }`}
                  title={isFavorite ? "Quitar de favoritos" : "Guardar en favoritos"}
                  aria-label={isFavorite ? "Quitar de favoritos" : "Guardar en favoritos"}
                  aria-pressed={isFavorite}
                >
                  <svg
                    aria-hidden="true"
                    className={`w-5 h-5 transition-all duration-300 ${isFavorite ? "fill-current scale-110" : "fill-none scale-100"}`}
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                  </svg>
                </button>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-3 font-medium flex items-center gap-2">
              <span aria-hidden="true" className={`w-2 h-2 rounded-full ${canBuy && !isInactive ? "bg-[#c3ff00] ring-1 ring-[#6b1e96]/30" : "bg-red-500"}`}></span>
              {isInactive
                ? "Sin disponibilidad temporal"
                : !canBuy
                  ? hasStockElsewhere
                    ? "Esta opción está agotada: selecciona otra"
                    : "Agotado"
                  : stockKnown && effectiveStock <= 5
                    ? `¡Quedan solo ${effectiveStock} unidad${effectiveStock !== 1 ? "es" : ""}!`
                    : "Disponible"}
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

            {/* Acciones */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 mt-4">
              {!isOwnProduct && (
                <button
                  type="button"
                  onClick={handleToggleFavorite}
                  aria-pressed={isFavorite}
                  className={`flex items-center gap-2 transition-colors text-[15px] rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6b1e96] focus-visible:ring-offset-2 ${
                    isFavorite ? "text-rose-500" : "text-gray-600 hover:text-rose-500"
                  }`}
                >
                  <svg
                    aria-hidden="true"
                    className={`w-5 h-5 transition-all duration-300 ${isFavorite ? "fill-current scale-110" : "fill-none scale-100"}`}
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  {isFavorite ? "Quitar de favoritos" : "Guardar en favoritos"}
                </button>
              )}
              <ShareButton
                title={product.name}
                text={`${product.name}${storeName ? ` de ${storeName}` : ""} en Forcepx`}
                url={`${SITE_URL}/product/${product.id}`}
                className="flex items-center gap-2 text-gray-600 hover:text-[#6b1e96] transition-colors text-[15px]"
              />
              <button
                type="button"
                onClick={goToQuestions}
                className="flex items-center gap-2 text-gray-600 hover:text-[#6b1e96] transition-colors text-[15px] rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6b1e96] focus-visible:ring-offset-2"
              >
                <svg aria-hidden="true" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Hacer una pregunta
              </button>
              {!isOwnProduct && (
                <button
                  type="button"
                  onClick={() => setIsCompareModalOpen(true)}
                  className="flex items-center gap-2 text-gray-600 hover:text-[#6b1e96] transition-colors text-[15px] rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6b1e96] focus-visible:ring-offset-2"
                  title="Buscar y comparar con otros vendedores"
                >
                  <svg aria-hidden="true" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 6l3 1m0 0l-3 9a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0022.5 16l-3-9m-3-1l-3 1m0 0l3 9" /></svg>
                  Comparar
                </button>
              )}
            </div>
            
            {/* Envío: solo lo que la tienda ofrece de verdad */}
            <div className="mt-8 rounded-xl border border-gray-100 bg-gray-50 p-4">
              <h2 className="text-sm font-bold text-[#191c20] font-['Manrope'] mb-3">Opciones de entrega</h2>
              <ul className="flex flex-col gap-2.5 text-sm text-gray-600">
                {product.store?.offers_pickup && (
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-[18px] text-[#6b1e96]" aria-hidden="true">storefront</span>
                    <span>Retiro en tienda{product.store?.business_address ? `: ${product.store.business_address}` : ""}</span>
                  </li>
                )}
                {product.store?.offers_local_delivery && (
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-[18px] text-[#6b1e96]" aria-hidden="true">two_wheeler</span>
                    <span>
                      Delivery local{product.store?.state ? ` en ${product.store.state}` : ""}
                      {Number(product.store?.default_delivery_fee) > 0 && (
                        <> (tarifa <PriceDisplay amountUSD={Number(product.store.default_delivery_fee)} priceClassName="inline font-semibold text-[#191c20]" hideSwitcher={true} />)</>
                      )}
                    </span>
                  </li>
                )}
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-[18px] text-[#6b1e96]" aria-hidden="true">local_shipping</span>
                  <span>Envío nacional: se paga al retirar en la agencia</span>
                </li>
              </ul>
            </div>
          </div>

          {/* COLUMN 3: Recent Views */}
          {recentViews.length > 0 && (
            <aside className="w-full lg:w-[22%] hidden lg:flex flex-col border-l border-gray-100 pl-6" aria-label="Vistos recientemente">
              <h2 className="text-[15px] font-bold text-[#191c20] font-['Manrope'] mb-5">Vistos recientemente</h2>
              <div className="flex flex-col divide-y divide-gray-100">
                {recentViews.map((p) => (
                  <div key={p.id} className="py-3 first:pt-0">
                    <SmallProductCard product={p} />
                  </div>
                ))}
              </div>
            </aside>
          )}
        </div>

        {/* --- TABS SECTION --- */}
        <div ref={tabsRef} className="mt-16 lg:mt-24 border-t border-gray-200 scroll-mt-24">
          <div role="tablist" aria-label="Información del producto" className="flex gap-8 sm:gap-12 border-b border-gray-200 overflow-x-auto overflow-y-hidden">
            {TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                role="tab"
                id={`tab-${t.key}`}
                aria-selected={activeTab === t.key}
                aria-controls={`panel-${t.key}`}
                onClick={() => setActiveTab(t.key)}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-semibold text-[15px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#6b1e96] ${
                  activeTab === t.key
                    ? "border-[#6b1e96] text-[#6b1e96]"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {t.label}
                {t.key === "reviews" ? ` (${product.review_count || 0})` : ""}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="py-10" role="tabpanel" id={`panel-${activeTab}`} aria-labelledby={`tab-${activeTab}`}>
            {activeTab === "description" && (
              <div className="flex flex-col lg:flex-row gap-12 items-start">
                <div className="w-full lg:w-1/2">
                  <h3 className="text-xl font-bold text-[#191c20] mb-6 font-['Manrope']">Ficha técnica</h3>
                  <div className="border border-gray-200 rounded-xl overflow-hidden mb-8">
                    <table className="w-full text-sm text-left text-gray-600">
                      <tbody className="[&>tr:nth-child(odd)]:bg-gray-50 [&>tr]:border-b [&>tr]:border-gray-200 [&>tr:last-child]:border-b-0">
                        <tr><th scope="row" className="px-4 sm:px-6 py-4 font-semibold text-[#191c20] w-1/3">Marca</th><td className="px-4 sm:px-6 py-4">{brandName || "No especificada"}</td></tr>
                        {product.categories?.name && (
                          <tr><th scope="row" className="px-4 sm:px-6 py-4 font-semibold text-[#191c20]">Categoría</th><td className="px-4 sm:px-6 py-4">{product.categories.name}</td></tr>
                        )}
                        {storeName && (
                          <tr>
                            <th scope="row" className="px-4 sm:px-6 py-4 font-semibold text-[#191c20]">Tienda</th>
                            <td className="px-4 sm:px-6 py-4">
                              <Link to={`/store/${product.store_id}`} className="text-[#6b1e96] font-semibold hover:underline">{storeName}</Link>
                            </td>
                          </tr>
                        )}
                        {product.store?.state && (
                          <tr><th scope="row" className="px-4 sm:px-6 py-4 font-semibold text-[#191c20]">Estado de la tienda</th><td className="px-4 sm:px-6 py-4">{product.store.state}</td></tr>
                        )}
                        {hasVariations && (
                          <tr>
                            <th scope="row" className="px-4 sm:px-6 py-4 font-semibold text-[#191c20] align-top">Presentaciones disponibles</th>
                            <td className="px-4 sm:px-6 py-4">
                              {availablePresentations.length > 0 ? (
                                <ul className="flex flex-wrap gap-1.5">
                                  {availablePresentations.map((label, i) => (
                                    <li key={i} className="px-2 py-0.5 rounded-md bg-white border border-gray-200 text-gray-700">{label}</li>
                                  ))}
                                </ul>
                              ) : (
                                "Todas agotadas por ahora"
                              )}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  <h3 className="text-xl font-bold text-[#191c20] mb-6 font-['Manrope']">Sobre el producto</h3>
                  <div 
                    className="text-gray-600 leading-relaxed prose prose-sm md:prose-base max-w-none 
                              prose-p:mt-0 prose-p:mb-5 prose-ul:list-disc prose-ol:list-decimal 
                              prose-li:ml-4 prose-a:text-[#6b1e96] prose-a:font-semibold"
                    dangerouslySetInnerHTML={{ __html: product.description || "<p>Descripción detallada no proporcionada por la tienda.</p>" }}
                  />
                </div>
                
                {/* Navigable Image Preview */}
                <div className="w-full lg:w-1/2 relative rounded-2xl overflow-hidden bg-gray-50 aspect-[4/3] flex items-center justify-center border border-gray-100 p-4 sm:p-8 shadow-inner group">
                  {product.images && product.images.length > 0 ? (
                    <>
                      <img src={product.images[descImageIndex] || product.images[0]} alt={`${product.name}, vista ${descImageIndex + 1}`} className="w-full h-full object-contain mix-blend-multiply transition-opacity duration-300" />
                      {product.images.length > 1 && (
                        <>
                          <button
                            type="button"
                            aria-label="Imagen anterior"
                            onClick={() => setDescImageIndex(prev => prev > 0 ? prev - 1 : product.images.length - 1)}
                            className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white hover:bg-gray-50 text-gray-500 hover:text-[#6b1e96] rounded-full shadow-md border border-gray-200 flex items-center justify-center transition-colors"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
                          </button>
                          <button
                            type="button"
                            aria-label="Imagen siguiente"
                            onClick={() => setDescImageIndex(prev => prev < product.images.length - 1 ? prev + 1 : 0)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white hover:bg-gray-50 text-gray-500 hover:text-[#6b1e96] rounded-full shadow-md border border-gray-200 flex items-center justify-center transition-colors"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
                          </button>
                          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                            {product.images.map((_, i) => (
                              <button key={i} type="button" aria-label={`Ver imagen ${i + 1}`} onClick={() => setDescImageIndex(i)} className={`w-2 h-2 rounded-full transition-all ${i === descImageIndex ? 'bg-[#6b1e96] w-4' : 'bg-gray-300 hover:bg-gray-400'}`} />
                            ))}
                          </div>
                        </>
                      )}
                    </>
                  ) : (
                    <span className="text-gray-400 font-medium">Sin imágenes disponibles</span>
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

        {/* --- PRODUCTOS RELACIONADOS --- */}
        {relatedProducts.length > 0 && (
          <section className="mt-16 pt-10" aria-labelledby="related-title">
            <h2 id="related-title" className="text-xl font-bold text-[#191c20] font-['Manrope'] mb-3 ml-1">Productos relacionados</h2>
            <div className="w-full h-[2px] bg-[#6b1e96]/15 mb-6"></div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {relatedProducts.slice(0, 8).map((p) => (
                <RelatedProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </div>

      <ComparePricesModal 
        isOpen={isCompareModalOpen}
        onClose={() => setIsCompareModalOpen(false)}
        baseProduct={product}
        basePrice={priceDetails?.finalPrice}
        baseOriginalPrice={priceDetails?.originalPrice}
      />
    </div>
  );
}
