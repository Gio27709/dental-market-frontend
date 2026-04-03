import PropTypes from "prop-types";

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
  isMobile = false
}) {

  // Shared select style for the arrow icon
  const selectArrowStyle = {
    backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E\")",
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 0.75rem center",
    backgroundSize: "1rem"
  };

  return (
    <div className={`text-slate-800 ${isMobile ? 'bg-white p-6 h-full flex flex-col' : 'bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm sticky top-24'}`}>

      {/* ─── Título (solo Desktop) ─── */}
      {!isMobile && (
        <div className="flex items-center gap-2 mb-5 pb-4 border-b border-slate-100">
          <svg className="w-4 h-4 text-[#163152]" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 0 1-.659 1.591l-5.432 5.432a2.25 2.25 0 0 0-.659 1.591v2.927a2.25 2.25 0 0 1-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 0 0-.659-1.591L3.659 7.409A2.25 2.25 0 0 1 3 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0 1 12 3Z" />
          </svg>
          <span className="text-sm font-bold text-[#163152] uppercase tracking-wider">Filtros</span>
        </div>
      )}

      {/* ─── Buscador ─── */}
      <div className="mb-5">
        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Buscar</label>
        <div className="relative group">
          <svg className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 group-focus-within:text-[#163152] transition-colors" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Nombre, producto..."
            className="w-full pl-9 pr-3 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#163152]/15 focus:border-[#163152]/40 transition-all placeholder:text-slate-400"
          />
        </div>
      </div>

      <div className="space-y-4 flex-1 overflow-y-auto pr-1">

        {/* ─── Rango de Precio ─── */}
        <div className="p-4 bg-gradient-to-br from-slate-50 to-slate-50/50 border border-slate-100 rounded-xl">
          <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-4">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
            Rango de Precio
          </label>
          <div className="relative px-1">
            <input
              type="range"
              min="0"
              max="10000"
              step="50"
              value={priceRange}
              onChange={(e) => setPriceRange(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#163152]"
            />
          </div>
          <div className="flex items-center justify-between mt-3">
            <span className="text-xs font-bold text-[#163152] bg-white px-2 py-0.5 rounded-md border border-slate-100">$0</span>
            <span className="text-[10px] text-slate-400 font-medium">hasta</span>
            <span className="text-xs font-bold text-[#163152] bg-white px-2 py-0.5 rounded-md border border-slate-100">${priceRange.toLocaleString('en-US')}</span>
          </div>
        </div>

        {/* ─── Categoría ─── */}
        <div>
          <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6Z" />
            </svg>
            Categoría
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full pl-3 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-[#163152]/15 focus:border-[#163152]/40 appearance-none cursor-pointer shadow-sm hover:border-slate-300 transition-colors"
            style={selectArrowStyle}
          >
            <option value="all">Todas las categorías ({categories.length})</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>
                {cat.isParent ? cat.name : `  └ ${cat.name}`}
              </option>
            ))}
          </select>
        </div>

        {/* ─── Marca (fabricante) ─── */}
        <div>
          <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
            </svg>
            Marca
          </label>
          <select
            value={brandFilter}
            onChange={(e) => setBrandFilter(e.target.value)}
            className="w-full pl-3 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-[#163152]/15 focus:border-[#163152]/40 appearance-none cursor-pointer shadow-sm hover:border-slate-300 transition-colors"
            style={selectArrowStyle}
          >
            <option value="all">Todas las marcas ({brandsData.length})</option>
            {brandsData.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>

        {/* ─── Tienda (vendedor) ─── */}
        <div>
          <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z" />
            </svg>
            Tienda
          </label>
          <select
            value={store}
            onChange={(e) => setStore(e.target.value)}
            className="w-full pl-3 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-[#163152]/15 focus:border-[#163152]/40 appearance-none cursor-pointer shadow-sm hover:border-slate-300 transition-colors"
            style={selectArrowStyle}
          >
            <option value="all">Todas las tiendas ({stores.length})</option>
            {stores.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* ─── Ubicación (estado) ─── */}
        <div>
          <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
            </svg>
            Ubicación
          </label>
          <select
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full pl-3 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-[#163152]/15 focus:border-[#163152]/40 appearance-none cursor-pointer shadow-sm hover:border-slate-300 transition-colors"
            style={selectArrowStyle}
          >
            <option value="all">Todos los estados ({locations.length})</option>
            {locations.map(loc => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>
        </div>
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
    isParent: PropTypes.bool,
  })),
  isMobile: PropTypes.bool,
};
