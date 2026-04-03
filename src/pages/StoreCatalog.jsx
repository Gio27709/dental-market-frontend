import { useState, useEffect, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import PropTypes from "prop-types";
import FiltersSidebar from "../components/catalog/FiltersSidebar";
import ProductCard from "../components/ProductCard";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useProducts } from "../context/ProductContext";
import { useFavorites } from "../context/FavoriteContext";
import { getCategoriesAPI, getBrandsAPI } from "../services/api";
import toast from "react-hot-toast";

// ─── Componente de fila horizontal Premium (solo Desktop) ───
function ProductRow({ product }) {
  const { addToCart } = useCart();
  const { user } = useAuth();
  const { toggleFavorite, favoriteIds } = useFavorites();
  const { bcvRate } = useProducts();
  const isOwnProduct = user?.id === product.store_id;
  const hasImage = product.images && product.images.length > 0;
  const isAvailable = product.stock !== 0;
  const storeName = product.store?.business_name || "Tienda Oficial";
  const isFavorite = favoriteIds?.has(product.id);
  const vesEquiv = (product.price || 0) * Number(bcvRate || 1);

  // Strip HTML tags from ReactQuill descriptions
  const cleanDescription = product.description
    ? product.description.replace(/<[^>]*>?/gm, '').trim()
    : '';

  const handleAddToCart = () => {
    if (isOwnProduct) return;
    addToCart(product, product.variations?.[0] || null, 1);
    toast.success("Agregado a la bolsa");
  };

  return (
    <article className="bg-white rounded-2xl border border-slate-200/80 hover:border-slate-300 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 flex overflow-hidden group relative">

      {/* 🖼 Contenedor de Imagen y Overlay Favoritos */}
      <div className="relative flex-shrink-0 w-[210px] h-[210px] bg-white overflow-hidden">
        {/* ♥ Heart Button — Overlay sobre la imagen */}
        <button
          onClick={() => toggleFavorite(product.id)}
          className={`absolute top-3.5 left-3.5 z-10 p-2 rounded-full backdrop-blur-sm border transition-all duration-200 ${
            isFavorite
              ? "text-rose-500 bg-rose-50/90 border-rose-200 shadow-sm"
              : "text-slate-400 bg-white/80 border-slate-200/60 hover:text-rose-400 hover:bg-rose-50/90 hover:border-rose-200"
          }`}
          title={isFavorite ? "Quitar de favoritos" : "Agregar a favoritos"}
        >
          <svg
            className={`w-4 h-4 transition-all duration-300 ${isFavorite ? "fill-current scale-110" : "fill-none scale-100"}`}
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
          </svg>
        </button>

        <Link to={`/product/${product.id}`} className="block w-full h-full flex items-center justify-center p-6">
          {hasImage ? (
            <img
              src={product.images[0]}
              alt={product.name}
              loading="lazy"
              className="max-w-full max-h-full object-contain mix-blend-multiply group-hover:scale-108 transition-transform duration-500"
            />
          ) : (
            <div className="flex flex-col items-center gap-2 text-slate-300">
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
              </svg>
              <span className="text-xs italic">Sin Imagen</span>
            </div>
          )}
        </Link>
      </div>

      {/* 📋 Info Central */}
      <div className="flex-1 py-5 pr-4 flex flex-col justify-between min-w-0">
        <div>
          {/* Badge Tienda — púrpura sutil como en ProductCard */}
          <div className="mb-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase bg-[#6b1e96]/10 text-[#6b1e96] border border-[#6b1e96]/15 rounded-md">
              <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z" />
              </svg>
              {storeName}
            </span>
          </div>

          {/* Título del Producto */}
          <Link to={`/product/${product.id}`}>
            <h3 className="text-lg font-bold text-slate-900 leading-snug hover:text-[#6b1e96] transition-colors line-clamp-2 mb-1.5">
              {product.name}
            </h3>
          </Link>

          {/* Descripción — HTML limpio de ReactQuill */}
          {cleanDescription && (
            <p className="text-[13px] text-slate-500 leading-relaxed line-clamp-2 mb-3">{cleanDescription}</p>
          )}

          {/* Estrellas + Disponibilidad en una línea */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <div className="flex text-amber-400 gap-px">
                {[1,2,3,4].map(s => (
                  <svg key={s} className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                ))}
                <svg className="w-3.5 h-3.5 fill-slate-200" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
              </div>
              <span className="text-[10px] text-slate-400 font-medium">(128)</span>
            </div>
            <span className="text-slate-300 text-xs">·</span>
            <div className="flex items-center gap-1.5">
              <div className={`h-1.5 w-1.5 rounded-full ${isAvailable ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
              <span className={`text-[11px] font-semibold uppercase tracking-wide ${isAvailable ? 'text-emerald-600' : 'text-rose-600'}`}>
                {isAvailable ? 'Disponible' : 'Sin Stock'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 💰 Precio + CTA (columna derecha, sin fondo gris) */}
      <div className="flex-shrink-0 w-[190px] p-5 flex flex-col items-end justify-between">
        {/* Precio dual: USD + Bs equivalente */}
        <div className="text-right">
          <span className="text-2xl font-bold text-[#6b1e96]">
            ${(product.price || 0).toFixed(2)}
          </span>
          <p className="text-[11px] text-slate-400 mt-0.5 font-medium">
            ≈ Bs. {vesEquiv.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>

        {/* Botón CTA */}
        <div className="w-full mt-auto">
          {isOwnProduct ? (
            <button disabled className="w-full bg-slate-50 text-slate-400 border border-slate-200 font-medium py-2.5 px-4 rounded-xl text-xs cursor-not-allowed">
              Producto Propio
            </button>
          ) : (
            <button
              onClick={handleAddToCart}
              className="w-full bg-[#6b1e96] hover:bg-[#531575] active:bg-[#43105e] text-white font-semibold py-2.5 px-4 rounded-xl shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 text-sm"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path>
              </svg>
              Al Carrito
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

ProductRow.propTypes = {
  product: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    name: PropTypes.string.isRequired,
    price: PropTypes.number,
    stock: PropTypes.number,
    store_id: PropTypes.string,
    description: PropTypes.string,
    images: PropTypes.arrayOf(PropTypes.string),
    variations: PropTypes.array,
    store: PropTypes.shape({
      business_name: PropTypes.string,
    }),
  }).isRequired,
};
export default function StoreCatalog() {
  // Traer productos reales del contexto
  const { allProducts, loading: productsLoading } = useProducts();
  
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  // Estados de Filtros
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(() => searchParams.get("search") || "");
  const [sortBy, setSortBy] = useState("featured");
  const [priceRange, setPriceRange] = useState(10000);
  const [brandFilter, setBrandFilter] = useState("all");
  const [store, setStore] = useState("all");
  const [location, setLocation] = useState("all");

  // Sincronizar searchTerm cuando el usuario busca desde el Header (cambia la URL)
  useEffect(() => {
    const urlSearch = searchParams.get("search");
    if (urlSearch) setSearchTerm(urlSearch);
  }, [searchParams]);

  // Extraer tiendas únicas de los productos reales
  const uniqueStores = useMemo(() => {
    const storesSet = new Set();
    allProducts.forEach(p => {
      const name = p.store?.business_name;
      if (name) storesSet.add(name);
    });
    return Array.from(storesSet).sort();
  }, [allProducts]);

  // Extraer ubicaciones (estados) únicas de los productos reales
  const uniqueLocations = useMemo(() => {
    const locsSet = new Set();
    allProducts.forEach(p => {
      const state = p.store?.state;
      if (state) locsSet.add(state);
    });
    return Array.from(locsSet).sort();
  }, [allProducts]);

  // Cargar marcas desde la API
  const [brandsData, setBrandsData] = useState([]);

  useEffect(() => {
    getBrandsAPI()
      .then((res) => setBrandsData(res.data.data || []))
      .catch(() => console.error("Error loading brands"));
  }, []);

  // Cargar categorías desde la API (nombres legibles)
  const [categoriesData, setCategoriesData] = useState([]);

  useEffect(() => {
    getCategoriesAPI()
      .then((res) => setCategoriesData(res.data.data || []))
      .catch(() => console.error("Error loading categories"));
  }, []);

  // Flatten tree para dropdown: [{id, name, isParent}]
  const flatCategories = useMemo(() => {
    const flat = [];
    (categoriesData || []).forEach((cat) => {
      flat.push({ id: cat.id, name: cat.name, isParent: true });
      (cat.children || []).forEach((sub) => {
        flat.push({ id: sub.id, name: `${cat.name} > ${sub.name}`, isParent: false });
      });
    });
    return flat;
  }, [categoriesData]);

  // Inicializar filtro de categoría desde URL params (Home → Catálogo)
  const [category, setCategory] = useState(() => {
    return searchParams.get("category") || "all";
  });

  // Lógica de filtrado (sobre productos reales)
  useEffect(() => {
    let filtered = [...allProducts];

    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(lower) || 
        (p.description && p.description.toLowerCase().includes(lower)) ||
        (p.store?.business_name && p.store.business_name.toLowerCase().includes(lower))
      );
    }
    if (brandFilter !== "all") {
      filtered = filtered.filter(p => p.brand_id === brandFilter);
    }
    if (store !== "all") {
      filtered = filtered.filter(p => p.store?.business_name === store);
    }
    if (location !== "all") {
      filtered = filtered.filter(p => p.store?.state === location);
    }
    if (category !== "all") {
      filtered = filtered.filter(p => p.category_id === category);
    }
    filtered = filtered.filter(p => p.price <= priceRange);

    if (sortBy === "price-asc") filtered.sort((a, b) => a.price - b.price);
    else if (sortBy === "price-desc") filtered.sort((a, b) => b.price - a.price);
    else if (sortBy === "name-asc") filtered.sort((a, b) => a.name.localeCompare(b.name));
    else if (sortBy === "featured" && searchTerm) {
      // Relevancia: nombre > descripción > tienda
      const lower = searchTerm.toLowerCase();
      filtered.sort((a, b) => {
        const aName = a.name.toLowerCase().includes(lower) ? 2 : 0;
        const bName = b.name.toLowerCase().includes(lower) ? 2 : 0;
        return bName - aName;
      });
    }

    setFilteredProducts(filtered);
  }, [allProducts, searchTerm, sortBy, priceRange, category, brandFilter, store, location]);

  return (
    <div className="bg-[#f8f9fc] min-h-screen">

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-6">
        <div className="flex flex-col md:flex-row gap-6">
          
          {/* Sidebar Desktop */}
          <div className="hidden md:block w-64 lg:w-[260px] flex-shrink-0">
            <FiltersSidebar 
              searchTerm={searchTerm} setSearchTerm={setSearchTerm}
              priceRange={priceRange} setPriceRange={setPriceRange}
              category={category} setCategory={setCategory}
              brandFilter={brandFilter} setBrandFilter={setBrandFilter}
              store={store} setStore={setStore}
              location={location} setLocation={setLocation}
              brandsData={brandsData}
              stores={uniqueStores}
              locations={uniqueLocations}
              categories={flatCategories}
            />
          </div>

          {/* Main Content */}
          <div className="flex-1 max-w-full overflow-hidden">
            
            {/* Top Toolbar */}
            <div className="flex flex-col sm:flex-row items-center justify-between pb-4 mb-5 border-b border-slate-200/80 gap-3">
              <div>
                <h1 className="text-xl font-bold text-[#163152] leading-tight">Todos los Productos</h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  Mostrando <span className="text-[#163152] font-semibold">{filteredProducts.length}</span> de {allProducts.length} resultados disponibles
                </p>
              </div>
              
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button 
                  className="md:hidden flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg text-sm font-bold shadow-sm hover:bg-slate-50 transition-colors"
                  onClick={() => setIsMobileFiltersOpen(true)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 0 1-.659 1.591l-5.432 5.432a2.25 2.25 0 0 0-.659 1.591v2.927a2.25 2.25 0 0 1-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 0 0-.659-1.591L3.659 7.409A2.25 2.25 0 0 1 3 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0 1 12 3Z" />
                  </svg>
                  Filtros
                </button>

                <div className="flex flex-1 sm:flex-none items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2 shadow-sm">
                  <span className="text-xs text-slate-500 font-bold uppercase tracking-wider hidden lg:block">Ordenar:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="text-sm font-bold text-[#163152] bg-transparent focus:outline-none appearance-none pr-6 cursor-pointer w-full sm:w-auto"
                    style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23163152'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='3' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right center", backgroundSize: "1rem" }}
                  >
                    <option value="featured">Relevancia</option>
                    <option value="price-asc">Precio: Menor a Mayor</option>
                    <option value="price-desc">Precio: Mayor a Menor</option>
                    <option value="name-asc">Nombre: A - Z</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Loading State */}
            {productsLoading ? (
              <div className="flex flex-col gap-4">
                {[1,2,3,4].map(i => (
                  <div key={i} className="bg-white rounded-xl border border-slate-200 h-[200px] animate-pulse flex overflow-hidden">
                    <div className="w-[200px] bg-slate-100 flex-shrink-0"></div>
                    <div className="flex-1 p-5 space-y-3">
                      <div className="h-4 bg-slate-100 rounded w-24"></div>
                      <div className="h-5 bg-slate-100 rounded w-3/4"></div>
                      <div className="h-3 bg-slate-100 rounded w-1/2"></div>
                    </div>
                    <div className="w-[200px] bg-slate-50 flex-shrink-0 p-5 space-y-3">
                      <div className="h-6 bg-slate-100 rounded w-20 ml-auto"></div>
                      <div className="h-10 bg-slate-100 rounded w-full mt-auto"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 shadow-sm">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                  <svg className="w-8 h-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-[#163152] mb-1">No hay coincidencias</h3>
                <p className="text-sm text-slate-500 mb-6">Intenta ajustar tus filtros.</p>
                <button 
                  onClick={() => { setSearchTerm(""); setCategory("all"); setBrandFilter("all"); setStore("all"); setLocation("all"); setPriceRange(10000); }}
                  className="px-5 py-2 bg-white border shadow-sm border-slate-200 hover:border-[#163152] text-[#163152] text-sm font-bold rounded-lg transition-colors"
                >
                  Restablecer
                </button>
              </div>
            ) : (
              <>
                {/* DESKTOP: Lista Horizontal estilo Amazon */}
                <div className="hidden md:flex flex-col gap-4">
                  {filteredProducts.map((product) => (
                    <ProductRow key={product.id} product={product} />
                  ))}
                </div>

                {/* MOBILE: Grid de tarjetas */}
                <div className="md:hidden grid grid-cols-2 gap-3">
                  {filteredProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </>
            )}
            
          </div>
        </div>
      </div>

      {/* Drawer Filtros Mobile */}
      {isMobileFiltersOpen && (
        <div className="fixed inset-0 z-[200] md:hidden">
          <div className="absolute inset-0 bg-[#163152]/60 backdrop-blur-sm" onClick={() => setIsMobileFiltersOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-[85%] max-w-[320px] bg-slate-50 shadow-2xl flex flex-col animate-in slide-in-from-left duration-300">
             <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white">
                <span className="text-lg font-bold text-[#163152]">Filtros</span>
                <button onClick={() => setIsMobileFiltersOpen(false)} className="p-2 rounded-full hover:bg-slate-100 text-slate-500">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </button>
             </div>
             <div className="flex-1 overflow-y-auto">
                <FiltersSidebar 
                  searchTerm={searchTerm} setSearchTerm={setSearchTerm}
                  priceRange={priceRange} setPriceRange={setPriceRange}
                  category={category} setCategory={setCategory}
                  brandFilter={brandFilter} setBrandFilter={setBrandFilter}
                  store={store} setStore={setStore}
                  location={location} setLocation={setLocation}
                  brandsData={brandsData}
                  stores={uniqueStores}
                  locations={uniqueLocations}
                  categories={flatCategories}
                  isMobile={true}
                />
             </div>
             <div className="p-4 bg-white border-t border-slate-200 shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
               <button onClick={() => setIsMobileFiltersOpen(false)} className="w-full bg-[#163152] active:bg-[#0f233a] active:scale-[0.98] text-[#c3ff00] py-3.5 rounded-xl font-bold transition-all shadow-md flex items-center justify-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  Aplicar ({filteredProducts.length})
               </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
