import { useState, useEffect, useRef, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../services/api";
import ProductCard from "../components/ProductCard";
import StoreRatingBreakdown from "../components/store/StoreRatingBreakdown";
import StoreReviewsList from "../components/store/StoreReviewsList";

export default function StorePublicProfile() {
  const { id } = useParams();
  const [storeData, setStoreData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Panel state
  const [activePanel, setActivePanel] = useState(null); // null | 'reputation' | 'reviews'
  const [reviewsData, setReviewsData] = useState(null);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const panelRef = useRef(null);

  // Product filters
  const [productSearch, setProductSearch] = useState("");
  const [productSort, setProductSort] = useState("featured");

  useEffect(() => {
    const fetchStore = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/profiles/store/${id}`);
        setStoreData(res.data.data);
      } catch {
        setError("Al parecer esta tienda no existe o fue deshabilitada.");
      } finally {
        setLoading(false);
      }
    };
    fetchStore();
  }, [id]);

  // Lazy load reviews data on first panel open
  const fetchReviewsData = async () => {
    if (reviewsData) return; // Already cached
    try {
      setReviewsLoading(true);
      const res = await api.get(`/profiles/store/${id}/reviews`);
      setReviewsData(res.data.data);
    } catch (err) {
      console.error("Error loading store reviews:", err);
    } finally {
      setReviewsLoading(false);
    }
  };

  const handlePanelToggle = async (panel) => {
    if (activePanel === panel) {
      setActivePanel(null);
      return;
    }
    setActivePanel(panel);
    await fetchReviewsData();

    // Smooth scroll to panel after short delay for render
    setTimeout(() => {
      panelRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 100);
  };

  // Filtered & sorted products (must be before early returns — Rules of Hooks)
  const products = useMemo(() => storeData?.products || [], [storeData?.products]);
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Search filter
    if (productSearch.trim()) {
      const term = productSearch.toLowerCase();
      result = result.filter(p =>
        p.name.toLowerCase().includes(term) ||
        (p.description && p.description.replace(/<[^>]*>?/gm, "").toLowerCase().includes(term))
      );
    }

    // Sort
    if (productSort === "price-asc") result.sort((a, b) => a.price - b.price);
    else if (productSort === "price-desc") result.sort((a, b) => b.price - a.price);
    else if (productSort === "name-asc") result.sort((a, b) => a.name.localeCompare(b.name));
    else if (productSort === "rating") result.sort((a, b) => (b.rating_avg || 0) - (a.rating_avg || 0));

    return result;
  }, [products, productSearch, productSort]);

  if (loading) {
    return (
      <div className="bg-[#f9f9ff] min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#c3ff00] border-t-[#6b1e96] rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !storeData?.store) {
    return (
      <div className="bg-[#f9f9ff] min-h-screen flex items-center justify-center p-6 text-center">
         <div className="max-w-md bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
             <span className="material-symbols-outlined text-[64px] text-gray-300 mb-4">store_off</span>
             <h2 className="text-2xl font-bold text-gray-900 mb-2">Tienda no encontrada</h2>
             <p className="text-gray-500 mb-6">{error}</p>
             <Link to="/" className="bg-[#6b1e96] text-white px-6 py-2.5 rounded-xl font-bold">Volver al inicio</Link>
         </div>
      </div>
    );
  }

  const { store, stats } = storeData;
  const coverUrl = store.banner_url || "https://images.unsplash.com/photo-1606811841689-23dfddce3e95?q=80&w=2000&auto=format&fit=crop";
  const logoUrl = store.logo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(store.business_name)}&background=c3ff00&color=6b1e96&size=150`;
  const joinDate = new Date(store.created_at).toLocaleDateString();

  return (
    <div className="bg-[#f9f9ff] min-h-screen pb-20 font-sans">
      {/* Cover Photo */}
      <div className="relative h-64 md:h-80 w-full overflow-hidden bg-gray-200">
        <img src={coverUrl} alt="Cover" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#160a22]/80 to-transparent"></div>
      </div>

      {/* Profile Header Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative -mt-16 sm:-mt-24">
        <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-[0_20px_40px_rgba(25,28,32,0.06)] flex flex-col md:flex-row gap-6 items-start md:items-center relative z-10 border border-gray-100">
          
          {/* Logo */}
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-white shadow-lg overflow-hidden flex-shrink-0 bg-white relative">
            <img src={logoUrl} alt={store.business_name} className="w-full h-full object-cover" />
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                   <h1 className="text-3xl md:text-3xl font-bold text-[#6b1e96] font-['Manrope'] pr-2">{store.business_name}</h1>
                   {store.is_verified && (
                     <span className="bg-[#c3ff00]/20 text-[#557300] text-xs font-bold px-2 py-1 flex items-center gap-1 rounded uppercase tracking-wider border border-[#c3ff00]/50">
                        <span className="material-symbols-outlined text-[14px]">verified</span>
                        Oficial
                     </span>
                   )}
                </div>
                
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mt-2 font-['Inter']">
                  <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">pin_drop</span> Venezuela</span>
                  <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">calendar_today</span> Se unió el {joinDate}</span>
                </div>
              </div>

              {/* Action Button */}
              <Link to={`/store-catalog?store=${store.business_name}`} className="bg-[#c3ff00] text-[#4d6600] px-6 py-2.5 rounded-xl font-bold shadow-sm hover:shadow-md transition flex items-center gap-2 whitespace-nowrap">
                Ver Catálogo
              </Link>
            </div>

            <p className="mt-4 text-gray-600 max-w-2xl leading-relaxed text-sm">
              {store.description || "Nuestra tienda oficial en Dental Market Vzla. Aquí encontrarás todos nuestros productos asegurando máxima calidad e inmediatez."}
            </p>
          </div>
        </div>

        {/* Stats Grid — Interactive Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          {/* Inventario Activo — Static info card */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="w-12 h-12 bg-[#6b1e96]/10 rounded-full flex items-center justify-center text-[#6b1e96]">
              <span className="material-symbols-outlined text-[24px]">inventory_2</span>
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Inventario Activo</p>
              <p className="text-2xl font-bold text-[#6b1e96]">{stats.productCount} <span className="text-sm font-normal text-gray-400">productos</span></p>
            </div>
          </div>

          {/* Reputación Global — CLICKABLE BUTTON */}
          <button
            onClick={() => handlePanelToggle("reputation")}
            className={`bg-white rounded-2xl p-6 shadow-sm border flex items-center gap-4 text-left transition-all duration-200 group cursor-pointer ${
              activePanel === "reputation"
                ? "border-[#6b1e96]/30 shadow-md ring-2 ring-[#6b1e96]/10"
                : "border-gray-100 hover:border-[#6b1e96]/20 hover:shadow-md"
            }`}
            aria-expanded={activePanel === "reputation"}
            aria-controls="panel-reputation"
          >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
              activePanel === "reputation" ? "bg-[#6b1e96] text-white" : "bg-[#c3ff00]/20 text-[#557300]"
            }`}>
              <span className="material-symbols-outlined text-[24px]">star_rate</span>
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-500 font-medium">Reputación Global</p>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold text-[#6b1e96]">{stats.globalRating.toFixed(1)}</p>
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className={`material-symbols-outlined text-[20px] ${i < Math.round(stats.globalRating) ? 'text-[#facc15]' : 'text-gray-200'}`}>star</span>
                  ))}
                </div>
              </div>
            </div>
            <span className={`material-symbols-outlined text-[20px] text-gray-300 group-hover:text-[#6b1e96] transition-all duration-200 ${
              activePanel === "reputation" ? "rotate-180 text-[#6b1e96]" : ""
            }`}>
              expand_more
            </span>
          </button>

          {/* Reseñas Históricas — CLICKABLE BUTTON */}
          <button
            onClick={() => handlePanelToggle("reviews")}
            className={`bg-white rounded-2xl p-6 shadow-sm border flex items-center gap-4 text-left transition-all duration-200 group cursor-pointer ${
              activePanel === "reviews"
                ? "border-[#6b1e96]/30 shadow-md ring-2 ring-[#6b1e96]/10"
                : "border-gray-100 hover:border-[#6b1e96]/20 hover:shadow-md"
            }`}
            aria-expanded={activePanel === "reviews"}
            aria-controls="panel-reviews"
          >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
              activePanel === "reviews" ? "bg-[#6b1e96] text-white" : "bg-purple-50 text-purple-600"
            }`}>
               <span className="material-symbols-outlined text-[24px]">forum</span>
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-500 font-medium">Reseñas Históricas</p>
              <p className="text-2xl font-bold text-[#6b1e96]">{stats.totalReviews} <span className="text-sm font-normal text-gray-400">interacciones</span></p>
            </div>
            <span className={`material-symbols-outlined text-[20px] text-gray-300 group-hover:text-[#6b1e96] transition-all duration-200 ${
              activePanel === "reviews" ? "rotate-180 text-[#6b1e96]" : ""
            }`}>
              expand_more
            </span>
          </button>
        </div>

        {/* Expandable Panels */}
        <div
          ref={panelRef}
          className={`mt-6 transition-all duration-300 ease-in-out overflow-hidden ${
            activePanel ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
          }`}
          id={activePanel === "reputation" ? "panel-reputation" : "panel-reviews"}
        >
          {reviewsLoading ? (
            <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-center gap-3">
                <div className="w-6 h-6 border-3 border-[#c3ff00] border-t-[#6b1e96] rounded-full animate-spin"></div>
                <span className="text-sm text-gray-400 font-medium">Cargando datos de reseñas...</span>
              </div>
            </div>
          ) : reviewsData && activePanel === "reputation" ? (
            <StoreRatingBreakdown
              data={reviewsData}
              onClose={() => setActivePanel(null)}
            />
          ) : reviewsData && activePanel === "reviews" ? (
            <StoreReviewsList
              data={reviewsData}
              onClose={() => setActivePanel(null)}
            />
          ) : null}
        </div>

        {/* Products Section */}
        <div className="mt-12">
          {/* Header + Controls */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-[#160a22] font-['Manrope']">Conoce nuestra Vitrina</h2>
              {products.length > 0 && (
                <p className="text-xs text-gray-400 mt-1 font-['Inter']">
                  Mostrando <span className="text-[#6b1e96] font-bold">{filteredProducts.length}</span> de {products.length} productos
                </p>
              )}
            </div>

            {products.length > 0 && (
              <div className="flex items-center gap-3 w-full sm:w-auto">
                {/* Search */}
                <div className="relative flex-1 sm:flex-none sm:w-56">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-gray-400">search</span>
                  <input
                    type="text"
                    placeholder="Buscar en esta tienda..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-[#6b1e96]/40 focus:ring-2 focus:ring-[#6b1e96]/10 transition-all"
                  />
                  {productSearch && (
                    <button
                      onClick={() => setProductSearch("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  )}
                </div>

                {/* Sort */}
                <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2">
                  <span className="material-symbols-outlined text-[16px] text-gray-400">sort</span>
                  <select
                    value={productSort}
                    onChange={(e) => setProductSort(e.target.value)}
                    className="text-sm font-semibold text-gray-700 bg-transparent focus:outline-none cursor-pointer appearance-none pr-5"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23999'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='3' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                      backgroundRepeat: "no-repeat",
                      backgroundPosition: "right center",
                      backgroundSize: "0.8rem",
                    }}
                  >
                    <option value="featured">Relevancia</option>
                    <option value="price-asc">Precio: Menor</option>
                    <option value="price-desc">Precio: Mayor</option>
                    <option value="name-asc">Nombre A-Z</option>
                    <option value="rating">Mejor valorados</option>
                  </select>
                </div>
              </div>
            )}
          </div>
          
          {products.length === 0 ? (
             <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                <span className="material-symbols-outlined text-gray-300 text-[64px] mb-4">box</span>
                <p className="text-gray-500 font-medium text-lg">Esta tienda aún no tiene productos públicos.</p>
             </div>
          ) : filteredProducts.length === 0 ? (
             <div className="text-center py-14 bg-white rounded-2xl border border-gray-100">
                <span className="material-symbols-outlined text-gray-300 text-[48px] mb-2">search_off</span>
                <h3 className="text-lg font-bold text-gray-800 mb-1">Sin resultados</h3>
                <p className="text-sm text-gray-500 mb-4">No se encontró &ldquo;{productSearch}&rdquo; en esta tienda.</p>
                <button
                  onClick={() => { setProductSearch(""); setProductSort("featured"); }}
                  className="text-sm text-[#6b1e96] font-bold hover:underline"
                >
                  Restablecer búsqueda
                </button>
             </div>
          ) : (
             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {filteredProducts.map(prod => (
                   <ProductCard key={prod.id} product={prod} />
                ))}
             </div>
          )}

        </div>
      </div>
    </div>
  );
}
