import { useState, useRef, useEffect } from "react";
import PropTypes from "prop-types";

// ─── Componente Interno: Acordeón Personalizado ───
function FilterAccordion({ title, icon, isOpen, onToggle, children, isActive, onClear }) {
  return (
    <div className="border-b border-slate-100 last:border-0">
      <div 
        className="w-full flex items-center justify-between py-3.5 cursor-pointer group select-none"
        onClick={onToggle}
      >
        <div className="flex items-center gap-2.5">
          <div className={`p-1.5 rounded-lg transition-colors ${isOpen ? 'bg-[#163152]/5 text-[#163152]' : 'bg-transparent text-slate-400 group-hover:text-[#163152] group-hover:bg-slate-50'}`}>
            {icon}
          </div>
          <span className={`text-[12px] font-bold uppercase tracking-wider transition-colors ${isOpen || isActive ? 'text-[#163152]' : 'text-slate-500 group-hover:text-slate-800'}`}>
            {title}
          </span>
          {isActive && (
            <div className="w-1.5 h-1.5 rounded-full bg-[#6b1e96] shadow-[0_0_5px_rgba(107,30,150,0.4)] ml-1"></div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isActive && onClear && (
            <button 
              onClick={(e) => { e.stopPropagation(); onClear(); }}
              className="text-[10px] font-bold text-rose-500 hover:text-rose-600 bg-rose-50 hover:bg-rose-100 px-2 py-0.5 rounded-md transition-colors"
            >
              Limpiar
            </button>
          )}
          <svg
            className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180 text-[#163152]' : ''}`}
            fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </div>
      </div>
      <div 
        className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[350px] opacity-100 mb-4' : 'max-h-0 opacity-0'}`}
      >
        <div className="overflow-y-auto max-h-[300px] custom-scrollbar pr-1 pb-1">
          {children}
        </div>
      </div>
    </div>
  );
}

FilterAccordion.propTypes = {
  title: PropTypes.string.isRequired,
  icon: PropTypes.node.isRequired,
  isOpen: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired,
  isActive: PropTypes.bool,
  onClear: PropTypes.func
};

// ─── Componente Interno: Opción estilo Lista de la Imagen 1 ───
function FilterOption({ isSelected, onClick, label, count, indent = false }) {
  // Determinar si hay productos disponibles
  const hasProducts = count === undefined || count > 0;
  
  // Establecer estilos dinámicos del botón
  let buttonClasses = `w-full flex items-start justify-between px-3 py-2 rounded-xl text-left transition-all duration-200 mb-1 group ${
    indent ? 'pl-8' : ''
  }`;
  
  let textClasses = 'text-[13px] break-words whitespace-normal leading-tight transition-colors duration-200 pr-1';
  let badgeClasses = 'text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 transition-colors duration-200 mt-0.5';

  if (isSelected) {
    buttonClasses += ' bg-[#6b1e96]/10 opacity-100';
    textClasses += ' font-bold text-[#6b1e96]';
    badgeClasses += ' bg-[#6b1e96]/20 text-[#6b1e96]';
  } else {
    buttonClasses += ' hover:bg-slate-50';
    if (hasProducts) {
      buttonClasses += ' opacity-100';
      textClasses += ' font-semibold text-slate-700 group-hover:text-[#163152]';
      badgeClasses += ' bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100';
    } else {
      buttonClasses += ' opacity-75 hover:opacity-100';
      textClasses += ' font-semibold text-slate-400/80 group-hover:text-slate-500';
      badgeClasses += ' bg-slate-50 text-slate-400 group-hover:bg-slate-100';
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={buttonClasses}
    >
      <div className="flex items-start gap-3 min-w-0">
        <div className="w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5">
          {isSelected ? (
            <div className="w-5 h-5 rounded-full bg-[#6b1e96] flex items-center justify-center shadow-sm">
              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={3.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
          ) : (
            <div className={`w-2 h-2 rounded-full transition-all duration-200 ${
              hasProducts 
                ? 'bg-emerald-400 shadow-[0_0_5px_rgba(52,211,153,0.6)] group-hover:scale-125' 
                : 'bg-slate-200 group-hover:bg-slate-300'
            }`}></div>
          )}
        </div>
        <span className={textClasses}>
          {label}
        </span>
      </div>
      {count !== undefined && (
        <span className={badgeClasses}>
          {count}
        </span>
      )}
    </button>
  );
}

FilterOption.propTypes = {
  isSelected: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired,
  label: PropTypes.string.isRequired,
  count: PropTypes.number,
  indent: PropTypes.bool
};

// ─── Componente Principal ───
export default function FiltersSidebar({
  searchTerm, setSearchTerm,
  priceRange, setPriceRange,
  category, setCategory,
  brandFilter, setBrandFilter,
  store, setStore,
  location, setLocation,
  brandsData = [],
  stores = [],
  locations = [],
  categories = [],
  productCountByState = {},
  productCountByCategory = {},
  productCountByBrand = {},
  productCountByStore = {},
  isMobile = false
}) {
  const [expanded, setExpanded] = useState({
    price: false,
    category: false,
    brand: false,
    store: false,
    location: false
  });

  const toggleSection = (section) => {
    setExpanded(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const [locationSearch, setLocationSearch] = useState("");
  const locationSearchRef = useRef(null);

  const [categorySearch, setCategorySearch] = useState("");
  const categorySearchRef = useRef(null);

  const [brandSearch, setBrandSearch] = useState("");
  const brandSearchRef = useRef(null);

  const [storeSearch, setStoreSearch] = useState("");
  const storeSearchRef = useRef(null);

  useEffect(() => {
    if (expanded.location && locationSearchRef.current) locationSearchRef.current.focus();
  }, [expanded.location]);

  useEffect(() => {
    if (expanded.category && categorySearchRef.current) categorySearchRef.current.focus();
  }, [expanded.category]);

  useEffect(() => {
    if (expanded.brand && brandSearchRef.current) brandSearchRef.current.focus();
  }, [expanded.brand]);

  useEffect(() => {
    if (expanded.store && storeSearchRef.current) storeSearchRef.current.focus();
  }, [expanded.store]);

  const filteredLocations = locations.filter(loc =>
    loc?.toLowerCase().includes(locationSearch.toLowerCase())
  );

  const filteredCategories = categories.filter(cat => 
    cat?.name?.toLowerCase().includes(categorySearch.toLowerCase())
  );

  const filteredBrands = brandsData.filter(b => 
    b?.name?.toLowerCase().includes(brandSearch.toLowerCase())
  );

  const filteredStores = stores.filter(s => 
    s?.toLowerCase().includes(storeSearch.toLowerCase())
  );

  const totalProducts = Object.values(productCountByState || {}).reduce((sum, c) => sum + c, 0);

  const icons = {
    price: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>,
    category: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6Z" /></svg>,
    brand: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" /></svg>,
    store: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z" /></svg>,
    location: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" /></svg>
  };

  return (
    <div className={`text-slate-800 ${isMobile ? 'bg-white p-6 h-full flex flex-col' : 'bg-white p-5 rounded-3xl border border-slate-200/60 shadow-lg shadow-slate-200/40 sticky top-24 max-h-[calc(100vh-120px)] flex flex-col'}`}>
      
      {/* ─── Cabecera ─── */}
      {!isMobile && (
        <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#163152] to-[#6b1e96] flex items-center justify-center shadow-sm">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 0 1-.659 1.591l-5.432 5.432a2.25 2.25 0 0 0-.659 1.591v2.927a2.25 2.25 0 0 1-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 0 0-.659-1.591L3.659 7.409A2.25 2.25 0 0 1 3 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0 1 12 3Z" />
              </svg>
            </div>
            <span className="text-[14px] font-black text-[#163152] tracking-wide">FILTROS</span>
          </div>
          {(searchTerm || priceRange < 10000 || category !== 'all' || brandFilter !== 'all' || store !== 'all' || location !== 'all') && (
            <button 
              onClick={() => { setSearchTerm(""); setCategory("all"); setBrandFilter("all"); setStore("all"); setLocation("all"); setPriceRange(10000); }}
              className="text-[10px] font-bold text-slate-500 hover:text-[#6b1e96] bg-slate-50 hover:bg-[#6b1e96]/10 px-3 py-1.5 rounded-full transition-colors"
            >
              Restablecer
            </button>
          )}
        </div>
      )}

      {/* ─── Buscador ─── */}
      <div className="mb-4">
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <svg className="w-4 h-4 text-slate-400 group-focus-within:text-[#6b1e96] transition-colors duration-300" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar productos..."
            className="w-full pl-9 pr-4 py-2 bg-white border border-[#6b1e96]/20 rounded-full text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#6b1e96]/15 focus:border-[#6b1e96]/50 transition-all placeholder:text-slate-400 shadow-sm"
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm("")}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center"
            >
              <div className="bg-slate-200 hover:bg-slate-300 rounded-full p-0.5 text-slate-500 transition-colors">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </div>
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-1">

        {/* ─── Rango de Precio (Reducido y con inputs manuales) ─── */}
        <FilterAccordion 
          title="Rango de Precio" 
          icon={icons.price} 
          isOpen={expanded.price} 
          onToggle={() => toggleSection('price')}
          isActive={priceRange < 10000}
          onClear={() => setPriceRange(10000)}
        >
          <div className="px-1 pt-1 pb-3">
            <div className="relative pt-4 pb-1">
              <input
                type="range"
                min="0"
                max="10000"
                step="100"
                value={priceRange}
                onChange={(e) => setPriceRange(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-100 rounded-full appearance-none cursor-pointer absolute z-20 outline-none"
                style={{
                  background: `linear-gradient(to right, #6b1e96 0%, #6b1e96 ${(priceRange / 10000) * 100}%, #f1f5f9 ${(priceRange / 10000) * 100}%, #f1f5f9 100%)`,
                }}
              />
              <style>{`
                input[type=range]::-webkit-slider-thumb {
                  -webkit-appearance: none;
                  appearance: none;
                  width: 14px;
                  height: 14px;
                  border-radius: 50%;
                  background: white;
                  border: 2px solid #6b1e96;
                  cursor: pointer;
                  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
                  transition: transform 0.1s;
                }
                input[type=range]::-webkit-slider-thumb:hover {
                  transform: scale(1.2);
                }
                /* Ocultar flechas en input number */
                input[type=number]::-webkit-inner-spin-button, 
                input[type=number]::-webkit-outer-spin-button { 
                  -webkit-appearance: none; 
                  margin: 0; 
                }
                input[type=number] {
                  -moz-appearance: textfield;
                }
              `}</style>
            </div>
            <div className="flex items-center justify-between mt-3 gap-2">
              <div className="flex flex-col flex-1">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5 ml-1">Mínimo</span>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">$</span>
                  <input 
                    type="number" 
                    value={0}
                    readOnly
                    className="w-full pl-5 pr-2 py-1 bg-slate-50/50 rounded-lg border border-slate-200/60 text-[11px] font-bold text-[#163152] outline-none cursor-not-allowed"
                  />
                </div>
              </div>
              <div className="w-3 border-t-2 border-slate-200 mt-4"></div>
              <div className="flex flex-col flex-1">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5 ml-1">Máximo</span>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#6b1e96] text-xs font-bold">$</span>
                  <input 
                    type="number" 
                    value={priceRange}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (val >= 0 && val <= 10000) setPriceRange(val);
                    }}
                    max="10000"
                    min="0"
                    className="w-full pl-5 pr-2 py-1 bg-[#6b1e96]/[0.03] rounded-lg border border-[#6b1e96]/30 text-[11px] font-bold text-[#6b1e96] focus:outline-none focus:ring-1 focus:ring-[#6b1e96]/40 focus:bg-white transition-colors"
                  />
                </div>
              </div>
            </div>
          </div>
        </FilterAccordion>

        {/* ─── Categoría ─── */}
        <FilterAccordion 
          title="Categorías" 
          icon={icons.category} 
          isOpen={expanded.category} 
          onToggle={() => toggleSection('category')}
          isActive={category !== 'all'}
          onClear={() => setCategory('all')}
        >
          <div className="sticky top-0 bg-white z-10 pb-3 px-1 pt-1">
            <div className="relative">
              <svg className="absolute left-3 top-2 w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
              <input
                ref={categorySearchRef}
                type="text"
                value={categorySearch}
                onChange={(e) => setCategorySearch(e.target.value)}
                placeholder="Buscar categoría..."
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-[#6b1e96]/30 rounded-full text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#6b1e96]/20 focus:border-[#6b1e96]/50 transition-all placeholder:text-slate-400 shadow-sm"
              />
            </div>
          </div>
          
          <FilterOption 
            isSelected={category === 'all'} 
            onClick={() => { setCategory('all'); setCategorySearch(""); }} 
            label="Todas las categorías" 
            count={totalProducts}
          />
          
          {filteredCategories.length === 0 ? (
            <div className="px-3 py-6 text-center">
              <span className="material-symbols-outlined text-2xl text-slate-300 mb-2">search_off</span>
              <p className="text-xs text-slate-400 font-medium">No se encontraron categorías</p>
            </div>
          ) : (
            filteredCategories.map(cat => {
              if (!cat || !cat.id) return null;
              const count = (productCountByCategory || {})[cat.id] || 0;
              return (
                <FilterOption 
                  key={cat.id}
                  isSelected={category === cat.id} 
                  onClick={() => { setCategory(cat.id); setCategorySearch(""); }} 
                  label={cat.displayName || cat.name} 
                  count={count}
                  indent={!cat.isParent}
                />
              );
            })
          )}
        </FilterAccordion>

        {/* ─── Marca ─── */}
        <FilterAccordion 
          title="Marcas" 
          icon={icons.brand} 
          isOpen={expanded.brand} 
          onToggle={() => toggleSection('brand')}
          isActive={brandFilter !== 'all'}
          onClear={() => setBrandFilter('all')}
        >
          <div className="sticky top-0 bg-white z-10 pb-3 px-1 pt-1">
            <div className="relative">
              <svg className="absolute left-3 top-2 w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
              <input
                ref={brandSearchRef}
                type="text"
                value={brandSearch}
                onChange={(e) => setBrandSearch(e.target.value)}
                placeholder="Buscar marca..."
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-[#6b1e96]/30 rounded-full text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#6b1e96]/20 focus:border-[#6b1e96]/50 transition-all placeholder:text-slate-400 shadow-sm"
              />
            </div>
          </div>
          
          <FilterOption 
            isSelected={brandFilter === 'all'} 
            onClick={() => { setBrandFilter('all'); setBrandSearch(""); }} 
            label="Todas las marcas" 
            count={totalProducts}
          />
          
          {filteredBrands.length === 0 ? (
            <div className="px-3 py-6 text-center">
              <span className="material-symbols-outlined text-2xl text-slate-300 mb-2">search_off</span>
              <p className="text-xs text-slate-400 font-medium">No se encontraron marcas</p>
            </div>
          ) : (
            filteredBrands.map(b => {
              if (!b || !b.id) return null;
              const count = (productCountByBrand || {})[b.id] || 0;
              return (
                <FilterOption 
                  key={b.id}
                  isSelected={brandFilter === b.id} 
                  onClick={() => { setBrandFilter(b.id); setBrandSearch(""); }} 
                  label={b.name} 
                  count={count}
                />
              );
            })
          )}
        </FilterAccordion>

        {/* ─── Tienda ─── */}
        <FilterAccordion 
          title="Tiendas" 
          icon={icons.store} 
          isOpen={expanded.store} 
          onToggle={() => toggleSection('store')}
          isActive={store !== 'all'}
          onClear={() => setStore('all')}
        >
          <div className="sticky top-0 bg-white z-10 pb-3 px-1 pt-1">
            <div className="relative">
              <svg className="absolute left-3 top-2 w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
              <input
                ref={storeSearchRef}
                type="text"
                value={storeSearch}
                onChange={(e) => setStoreSearch(e.target.value)}
                placeholder="Buscar tienda..."
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-[#6b1e96]/30 rounded-full text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#6b1e96]/20 focus:border-[#6b1e96]/50 transition-all placeholder:text-slate-400 shadow-sm"
              />
            </div>
          </div>
          
          <FilterOption 
            isSelected={store === 'all'} 
            onClick={() => { setStore('all'); setStoreSearch(""); }} 
            label="Todas las tiendas" 
            count={totalProducts}
          />
          
          {filteredStores.length === 0 ? (
            <div className="px-3 py-6 text-center">
              <span className="material-symbols-outlined text-2xl text-slate-300 mb-2">search_off</span>
              <p className="text-xs text-slate-400 font-medium">No se encontraron tiendas</p>
            </div>
          ) : (
            filteredStores.map(s => {
              if (!s) return null;
              const count = (productCountByStore || {})[s] || 0;
              return (
                <FilterOption 
                  key={s}
                  isSelected={store === s} 
                  onClick={() => { setStore(s); setStoreSearch(""); }} 
                  label={s} 
                  count={count}
                />
              );
            })
          )}
        </FilterAccordion>

        {/* ─── Ubicación ─── */}
        <FilterAccordion 
          title="Ubicación" 
          icon={icons.location} 
          isOpen={expanded.location} 
          onToggle={() => toggleSection('location')}
          isActive={location !== 'all'}
          onClear={() => setLocation('all')}
        >
          <div className="sticky top-0 bg-white z-10 pb-3 px-1 pt-1">
            <div className="relative">
              <svg className="absolute left-3 top-2 w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
              <input
                ref={locationSearchRef}
                type="text"
                value={locationSearch}
                onChange={(e) => setLocationSearch(e.target.value)}
                placeholder="Buscar estado..."
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-[#6b1e96]/30 rounded-full text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#6b1e96]/20 focus:border-[#6b1e96]/50 transition-all placeholder:text-slate-400 shadow-sm"
              />
            </div>
          </div>
          
          <FilterOption 
            isSelected={location === 'all'} 
            onClick={() => { setLocation('all'); setLocationSearch(""); }} 
            label="Todos los estados" 
            count={totalProducts}
          />
          
          {filteredLocations.length === 0 ? (
            <div className="px-3 py-6 text-center">
              <span className="material-symbols-outlined text-2xl text-slate-300 mb-2">location_off</span>
              <p className="text-xs text-slate-400 font-medium">No se encontraron estados</p>
            </div>
          ) : (
            filteredLocations.map(loc => {
              if (!loc) return null;
              const count = (productCountByState || {})[loc] || 0;
              return (
                <FilterOption 
                  key={loc}
                  isSelected={location === loc} 
                  onClick={() => { setLocation(loc); setLocationSearch(""); }} 
                  label={loc} 
                  count={count}
                />
              );
            })
          )}
        </FilterAccordion>

      </div>
    </div>
  );
}

FiltersSidebar.propTypes = {
  searchTerm: PropTypes.string.isRequired,
  setSearchTerm: PropTypes.func.isRequired,
  priceRange: PropTypes.number.isRequired,
  setPriceRange: PropTypes.func.isRequired,
  category: PropTypes.string.isRequired,
  setCategory: PropTypes.func.isRequired,
  brandFilter: PropTypes.string.isRequired,
  setBrandFilter: PropTypes.func.isRequired,
  store: PropTypes.string.isRequired,
  setStore: PropTypes.func.isRequired,
  location: PropTypes.string.isRequired,
  setLocation: PropTypes.func.isRequired,
  brandsData: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
  })),
  stores: PropTypes.arrayOf(PropTypes.string),
  locations: PropTypes.arrayOf(PropTypes.string),
  categories: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    displayName: PropTypes.string,
    isParent: PropTypes.bool,
  })),
  productCountByState: PropTypes.object,
  productCountByCategory: PropTypes.object,
  productCountByBrand: PropTypes.object,
  productCountByStore: PropTypes.object,
  isMobile: PropTypes.bool,
};
