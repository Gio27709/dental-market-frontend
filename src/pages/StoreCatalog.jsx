import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import FiltersSidebar from "../components/catalog/FiltersSidebar";
import ProductCard from "../components/ProductCard";
import ProductRow from "../components/ProductRow";
import { useLocationContext } from "../hooks/useLocationContext";
import { VENEZUELA_STATES } from "../utils/venezuelaStates";
import { getCategoriesAPI, getBrandsAPI, getProducts, getProductsFacetsAPI } from "../services/api";

export default function StoreCatalog() {
  const { buyerState } = useLocationContext();
  
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  // Paginación y Productos Server-Side
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 15;

  // Estados de Filtros
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(() => searchParams.get("search") || "");
  const [sortBy, setSortBy] = useState("featured");
  const [priceRange, setPriceRange] = useState(10000);
  const [brandFilter, setBrandFilter] = useState("all");
  const [store, setStore] = useState("all");
  const [location, setLocation] = useState("all");

  // Inicializar filtro de categoría desde URL params (Home → Catálogo)
  const [category, setCategory] = useState(() => {
    return searchParams.get("category") || "all";
  });

  // Sincronizar searchTerm cuando el usuario busca desde el Header (cambia la URL)
  useEffect(() => {
    const urlSearch = searchParams.get("search");
    if (urlSearch) {
      setSearchTerm(urlSearch);
      setCurrentPage(1);
    }
  }, [searchParams]);

  // Cargar marcas desde la API (con caché en localStorage)
  const [brandsData, setBrandsData] = useState([]);

  useEffect(() => {
    const cached = localStorage.getItem("dental_brands_cache");
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Date.now() - parsed.timestamp < 5 * 60 * 1000) {
          setBrandsData(parsed.data);
          return;
        }
      } catch { /* corrupted cache */ }
    }
    getBrandsAPI()
      .then((res) => {
        const data = res.data.data || [];
        setBrandsData(data);
        localStorage.setItem("dental_brands_cache", JSON.stringify({ data, timestamp: Date.now() }));
      })
      .catch(() => console.error("Error loading brands"));
  }, []);

  // Cargar categorías desde la API (con caché en localStorage)
  const [categoriesData, setCategoriesData] = useState([]);

  useEffect(() => {
    const cached = localStorage.getItem("dental_categories_cache");
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Date.now() - parsed.timestamp < 5 * 60 * 1000) {
          setCategoriesData(parsed.data);
          return;
        }
      } catch { /* corrupted cache */ }
    }
    getCategoriesAPI()
      .then((res) => {
        const data = res.data.data || [];
        setCategoriesData(data);
        localStorage.setItem("dental_categories_cache", JSON.stringify({ data, timestamp: Date.now() }));
      })
      .catch(() => console.error("Error loading categories"));
  }, []);

  // Cargar Facetas (Conteos agregados) desde la API
  const [facets, setFacets] = useState({
    categoryCounts: {},
    brandCounts: {},
    storeCounts: {},
    stateCounts: {},
    stores: [],
    states: []
  });

  useEffect(() => {
    getProductsFacetsAPI()
      .then((res) => {
        if (res.data?.success) {
          setFacets(res.data.data);
        }
      })
      .catch((err) => console.error("Error loading facets:", err));
  }, []);

  // Flatten tree para dropdown: [{id, name, isParent}]
  const flatCategories = useMemo(() => {
    const flat = [];
    (categoriesData || []).forEach((cat) => {
      flat.push({ id: cat.id, name: cat.name, displayName: cat.name, isParent: true });
      (cat.children || []).forEach((sub) => {
        flat.push({ 
          id: sub.id, 
          name: `${cat.name} > ${sub.name}`, 
          displayName: sub.name, 
          isParent: false 
        });
      });
    });
    return flat;
  }, [categoriesData]);

  // Extraer tiendas, ubicaciones y conteos de las facetas cargadas por la BD
  const uniqueStores = facets.stores || [];
  const productCountByState = facets.stateCounts || {};
  const productCountByCategory = facets.categoryCounts || {};
  const productCountByBrand = facets.brandCounts || {};
  const productCountByStore = facets.storeCounts || {};

  // Fetch paginado desde la API
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setProductsLoading(true);
        const params = {
          page: currentPage,
          limit: ITEMS_PER_PAGE,
          buyer_state: buyerState || undefined,
          sort_by: sortBy,
          max_price: priceRange,
          category_id: category !== "all" ? category : undefined,
          brand_id: brandFilter !== "all" ? brandFilter : undefined,
          store_name: store !== "all" ? store : undefined,
          location_state: location !== "all" ? location : undefined,
          search: searchTerm || undefined
        };

        const res = await getProducts(params);
        const data = res.data?.data || [];
        const pagination = res.data?.pagination || {};

        // Map product_variations from Supabase to variations field expected by UI
        const mappedProducts = data.map((p) => ({
          ...p,
          variations: p.product_variations || [],
          store: p.store_profiles || p.store || null,
          brand: p.brands || null,
        }));

        setProducts(mappedProducts);
        setTotalPages(pagination.totalPages || 1);
        setTotalItems(pagination.totalItems || 0);
      } catch (err) {
        console.error("Error loading products:", err);
      } finally {
        setProductsLoading(false);
      }
    };

    loadProducts();
  }, [currentPage, searchTerm, sortBy, priceRange, category, brandFilter, store, location, buyerState]);

  // Reset de página al cambiar filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortBy, priceRange, category, brandFilter, store, location, buyerState]);

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

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
              locations={VENEZUELA_STATES}
              categories={flatCategories}
              productCountByState={productCountByState}
              productCountByCategory={productCountByCategory}
              productCountByBrand={productCountByBrand}
              productCountByStore={productCountByStore}
            />
          </div>

          {/* Main Content */}
          <div className="flex-1 max-w-full overflow-hidden">
            
            {/* Top Toolbar */}
            <div className="flex flex-col sm:flex-row items-center justify-between pb-4 mb-5 border-b border-slate-200/80 gap-3">
              <div>
                <h1 className="text-xl font-bold text-[#163152] leading-tight">Todos los Productos</h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  Mostrando <span className="text-[#163152] font-semibold">
                    {products.length === 0 ? 0 : startIndex + 1}-{Math.min(startIndex + products.length, totalItems)}
                  </span> de {totalItems} resultados
                </p>
                {buyerState && (
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/50 rounded-full">
                      <span className="material-symbols-outlined text-[11px]">location_on</span>
                      {buyerState}
                    </span>
                    <span className="text-[10px] text-slate-400">· Priorizando cercanía</span>
                  </div>
                )}
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
                    <option value="nearby">📍 Cercanía</option>
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
            ) : products.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 shadow-sm">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                  {sortBy === "nearby" && buyerState ? (
                    <span className="material-symbols-outlined text-3xl text-blue-300">location_off</span>
                  ) : (
                    <svg className="w-8 h-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                    </svg>
                  )}
                </div>
                <h3 className="text-lg font-bold text-[#163152] mb-1">
                  {sortBy === "nearby" && buyerState
                    ? "No hay productos cercanos"
                    : "No hay coincidencias"}
                </h3>
                <p className="text-sm text-slate-500 mb-6 max-w-sm mx-auto">
                  {sortBy === "nearby" && buyerState
                    ? `No encontramos productos en ${buyerState} ni estados vecinos con los filtros actuales. Prueba con "Relevancia" para ver resultados de todo el país.`
                    : buyerState
                    ? `No encontramos resultados en ${buyerState}. Intenta ajustar tus filtros o amplía tu búsqueda.`
                    : "Intenta ajustar tus filtros."}
                </p>
                <div className="flex items-center justify-center gap-3 flex-wrap">
                  <button 
                    onClick={() => { setSearchTerm(""); setCategory("all"); setBrandFilter("all"); setStore("all"); setLocation("all"); setPriceRange(10000); setSortBy("featured"); }}
                    className="px-5 py-2 bg-white border shadow-sm border-slate-200 hover:border-[#163152] text-[#163152] text-sm font-bold rounded-lg transition-colors"
                  >
                    Restablecer Filtros
                  </button>
                  {sortBy === "nearby" && (
                    <button 
                      onClick={() => setSortBy("featured")}
                      className="px-5 py-2 bg-[#6b1e96] text-white text-sm font-bold rounded-lg hover:bg-[#531575] transition-colors shadow-sm"
                    >
                      Ver Todo el País
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <>
                {/* DESKTOP: Lista Horizontal estilo Amazon */}
                <div className="hidden md:flex flex-col gap-4">
                  {products.map((product) => (
                    <ProductRow key={product.id} product={product} />
                  ))}
                </div>

                {/* MOBILE: Grid de tarjetas */}
                <div className="md:hidden grid grid-cols-2 gap-3">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                {/* Controles de Paginación */}
                {totalPages > 1 && (
                  <div className="mt-8 mb-4 flex items-center justify-center gap-2">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-4 py-2 rounded-lg font-bold text-sm bg-white border border-slate-200 text-slate-500 hover:text-[#163152] hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Anterior
                    </button>
                    
                    <div className="flex items-center gap-1 flex-wrap justify-center">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                        // Lógica para mostrar solo algunas páginas si hay muchas (ej. más de 7)
                        if (totalPages > 7) {
                          if (page !== 1 && page !== totalPages && Math.abs(page - currentPage) > 1) {
                            if (page === currentPage - 2 || page === currentPage + 2) {
                              return <span key={page} className="text-slate-400 px-1">...</span>;
                            }
                            return null;
                          }
                        }

                        return (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`w-9 h-9 rounded-lg font-bold text-sm flex items-center justify-center transition-colors ${
                              currentPage === page
                                ? "bg-[#6b1e96] text-white shadow-sm border border-[#6b1e96]"
                                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-[#163152]"
                            }`}
                          >
                            {page}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 rounded-lg font-bold text-sm bg-white border border-slate-200 text-slate-500 hover:text-[#163152] hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Siguiente
                    </button>
                  </div>
                )}
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
                  locations={VENEZUELA_STATES}
                  categories={flatCategories}
                  productCountByState={productCountByState}
                  productCountByCategory={productCountByCategory}
                  productCountByBrand={productCountByBrand}
                  productCountByStore={productCountByStore}
                  isMobile={true}
                />
             </div>
             <div className="p-4 bg-white border-t border-slate-200 shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
               <button onClick={() => setIsMobileFiltersOpen(false)} className="w-full bg-[#163152] active:bg-[#0f233a] active:scale-[0.98] text-[#c3ff00] py-3.5 rounded-xl font-bold transition-all shadow-md flex items-center justify-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  Aplicar ({totalItems})
               </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
