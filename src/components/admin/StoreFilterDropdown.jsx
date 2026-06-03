import { useState, useRef, useEffect } from "react";
import PropTypes from "prop-types";

export default function StoreFilterDropdown({ stores = [], selectedIds = [], onChange }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = stores.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()));

  const toggle = (id) => {
    const next = selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id];
    onChange(next);
  };

  const label = selectedIds.length === 0
    ? "Todas las tiendas"
    : selectedIds.length === 1
      ? stores.find((s) => s.id === selectedIds[0])?.name || "1 tienda"
      : `${selectedIds.length} tiendas`;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all border"
        style={{
          background: selectedIds.length > 0 ? "rgba(107,30,150,0.06)" : "white",
          borderColor: selectedIds.length > 0 ? "rgba(107,30,150,0.15)" : "rgba(0,0,0,0.08)",
          color: selectedIds.length > 0 ? "#6b1e96" : "#6b7280",
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z" />
        </svg>
        {label}
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3">
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden">
          {/* Search */}
          <div className="p-2 border-b border-gray-100">
            <input
              type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar tienda..."
              className="w-full px-3 py-2 text-xs rounded-lg bg-gray-50 border-none outline-none focus:ring-1 focus:ring-purple-300"
            />
          </div>
          {/* Actions */}
          <div className="flex items-center justify-between px-3 py-1.5 border-b border-gray-50">
            <button onClick={() => onChange([])} className="text-[10px] font-semibold text-purple-500 hover:text-purple-700">Limpiar</button>
            <span className="text-[10px] text-gray-400">{selectedIds.length} seleccionadas</span>
          </div>
          {/* List */}
          <div className="max-h-52 overflow-y-auto">
            {filtered.length > 0 ? filtered.map((store) => (
              <label key={store.id} className="flex items-center gap-2.5 px-3 py-2 hover:bg-gray-50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(store.id)}
                  onChange={() => toggle(store.id)}
                  className="w-3.5 h-3.5 rounded text-purple-600 border-gray-300 focus:ring-purple-500"
                />
                <span className="text-xs text-gray-700 truncate flex-1">{store.name}</span>
                {store.store_code && <span className="text-[9px] text-gray-400 font-mono">{store.store_code}</span>}
              </label>
            )) : (
              <p className="text-xs text-gray-400 text-center py-4">No se encontraron tiendas</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

StoreFilterDropdown.propTypes = {
  stores: PropTypes.arrayOf(PropTypes.shape({ id: PropTypes.string, name: PropTypes.string, store_code: PropTypes.string })),
  selectedIds: PropTypes.arrayOf(PropTypes.string),
  onChange: PropTypes.func.isRequired,
};
