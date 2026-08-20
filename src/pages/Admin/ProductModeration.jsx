import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import LoadingSkeleton from "../../components/LoadingSkeleton";
import { getAllAdminProductsAPI, moderateProductAPI } from "../../services/api";
import { formatCurrencyUSD } from "../../utils/formatters";
import toast from "react-hot-toast";
import PropTypes from "prop-types";
import SearchableSelect from "../../components/ui/SearchableSelect";
import "../../components/ui/SearchableSelect.css";
import { useAdminStats } from "../../context/AdminStatsContext";
const MagnifyingGlassIcon = ({ className }) => (<svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /></svg>);
MagnifyingGlassIcon.propTypes = { className: PropTypes.string };
const ChevronLeftIcon = ({ className }) => (<svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" /></svg>);
ChevronLeftIcon.propTypes = { className: PropTypes.string };
const ChevronRightIcon = ({ className }) => (<svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>);
ChevronRightIcon.propTypes = { className: PropTypes.string };
const FunnelIcon = ({ className }) => (<svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 0 1-.659 1.591l-5.432 5.432a2.25 2.25 0 0 0-.659 1.591v2.927a2.25 2.25 0 0 1-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 0 0-.659-1.591L3.659 7.409A2.25 2.25 0 0 1 3 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0 1 12 3Z" /></svg>);
FunnelIcon.propTypes = { className: PropTypes.string };
const EyeIcon = ({ className }) => (<svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>);
EyeIcon.propTypes = { className: PropTypes.string };
const CheckCircleIcon = ({ className }) => (<svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>);
CheckCircleIcon.propTypes = { className: PropTypes.string };
const XCircleIcon = ({ className }) => (<svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>);
XCircleIcon.propTypes = { className: PropTypes.string };
const NoSymbolIcon = ({ className }) => (<svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636" /></svg>);
NoSymbolIcon.propTypes = { className: PropTypes.string };
const BuildingStorefrontIcon = ({ className }) => (<svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72L4.318 3.44A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72m-13.5 8.65h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .415.336.75.75.75Z" /></svg>);
BuildingStorefrontIcon.propTypes = { className: PropTypes.string };
import ProductAdminSlideOver from "../../components/admin/ProductAdminSlideOver";

export default function ProductModeration() {
  const { refreshStats } = useAdminStats();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Deep link desde notificaciones: `?product=<uuid>`. Se pide ese producto al
  // endpoint (filtra por id) y se abre su revisión, sin depender de la página cargada.
  const [searchParams, setSearchParams] = useSearchParams();
  const deepLinkProduct = searchParams.get("product");
  const deepLinkHandled = useRef(false);

  // Phase 2: Pagination and Filtering States
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [storeFilter, setStoreFilter] = useState(""); // Selected store name from dropdown
  const [status, setStatus] = useState("all");
  const [totalCount, setTotalCount] = useState(0);
  const [knownStores, setKnownStores] = useState([]); // Cache of all store names

  // Add debounce for search
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset to page 1 on new search
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);

  // Fetch all unique store names on mount (one-time, no pagination)
  useEffect(() => {
    const fetchStoreNames = async () => {
      try {
        // Fetch a large batch to discover all store names
        const response = await getAllAdminProductsAPI({ page: 1, limit: 200, status: "all" });
        const products = response.data.data || [];
        const uniqueStores = [...new Set(
          products
            .map(p => p.store_profiles?.business_name)
            .filter(Boolean)
        )].sort((a, b) => a.localeCompare(b));
        setKnownStores(uniqueStores);
      } catch {
        // Silently fail — store filter will just have fewer options
      }
    };
    fetchStoreNames();
  }, []);

  // Build store options for the SearchableSelect dropdown
  const storeOptions = useMemo(() => {
    const opts = [
      { value: "", label: "Todas las tiendas" },
    ];
    knownStores.forEach((name) => {
      opts.push({
        value: name,
        label: name,
        icon: <BuildingStorefrontIcon className="h-4 w-4 text-gray-400" />,
      });
    });
    return opts;
  }, [knownStores]);

  // Options for Status and Limit Selects
  const statusOptions = useMemo(() => [
    { value: "all", label: "Todos los estados" },
    { value: "pending", label: "⏳ Pendientes" },
    { value: "approved", label: "✅ Aprobados" },
    { value: "rejected", label: "⛔ Rechazados" },
    { value: "inactive", label: "🚫 Inactivos" },
  ], []);

  const limitOptions = useMemo(() => [
    { value: 10, label: "10 / pág" },
    { value: 25, label: "25 / pág" },
    { value: 50, label: "50 / pág" },
    { value: 100, label: "100 / pág" },
  ], []);

  // Handle status change
  const handleStatusChange = (newStatus) => {
    setStatus(newStatus);
    setPage(1); // Reset to page 1 on filter change
  }

  // Handle store filter change
  const handleStoreFilterChange = (newStore) => {
    setStoreFilter(newStore);
    setPage(1);
  };

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getAllAdminProductsAPI({
        page,
        limit,
        search: debouncedSearch,
        storeName: storeFilter,
        status,
      });
      setProducts(response.data.data || []);
      setTotalCount(response.data.pagination.total || 0);
    } catch {
      toast.error("Error al cargar productos");
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedSearch, storeFilter, status]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Se aplica una sola vez al terminar la primera carga; después se limpia el
  // param para que un refetch (tras moderar, paginar…) no vuelva a abrirlo.
  useEffect(() => {
    if (deepLinkHandled.current || !deepLinkProduct) return;
    deepLinkHandled.current = true;
    setSearchParams({}, { replace: true });

    (async () => {
      try {
        const response = await getAllAdminProductsAPI({ id: deepLinkProduct, status: "all", page: 1, limit: 1 });
        const product = response.data?.data?.[0];
        if (product) setSelectedProduct(product);
        else toast.error("No se encontró el elemento indicado");
      } catch {
        toast.error("No se encontró el elemento indicado");
      }
    })();
  }, [deepLinkProduct, setSearchParams]);

  const handleModerate = async (id, action, name) => {
    const actionLabelMap = {
      approve: "aprobar",
      reject: "rechazar",
      ban: "banear/desactivar"
    };
    const label = actionLabelMap[action];
    
    if (!window.confirm(`¿Seguro que quieres ${label} "${name}"?`)) return;

    try {
      await moderateProductAPI(id, action);
      toast.success(
        action === "approve"
          ? `"${name}" aprobado y publicado`
          : action === "reject" 
            ? `"${name}" rechazado` 
            : `"${name}" baneado`
      );
      // Re-fetch to keep pagination accurate
      fetchProducts();
      refreshStats();
    } catch (err) {
      toast.error(err.response?.data?.error || "Error al moderar producto");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Moderación de Productos</h1>
          <p className="mt-2 text-sm text-gray-700">
            Gestiona el catálogo global. Total: {totalCount} productos.
          </p>
        </div>
      </div>

      {/* Toolbar: Search & Filters */}
      <div className="bg-white p-4 rounded-t-xl border-x border-t border-gray-200">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-4 items-start">
          {/* Search by Product Name */}
          <div className="md:col-span-4 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-primary-500 focus:border-primary-500 shadow-sm"
              placeholder="Buscar por nombre de producto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ minHeight: '38px' }}
            />
          </div>

          {/* Store Filter — Searchable Dropdown */}
          <div className="md:col-span-3">
            <SearchableSelect
              options={storeOptions}
              value={storeFilter}
              onChange={handleStoreFilterChange}
              placeholder="Todas las tiendas"
              searchPlaceholder="Nombre o código..."
              icon={<BuildingStorefrontIcon className="h-4 w-4" />}
              maxVisible={5}
            />
          </div>

          {/* Status Filter — Enhanced Select */}
          <div className="md:col-span-3">
            <SearchableSelect
              options={statusOptions}
              value={status}
              onChange={(val) => handleStatusChange(val)}
              placeholder="Todos los estados"
              searchPlaceholder="Buscar estado..."
              icon={<FunnelIcon className="h-4 w-4" />}
            />
          </div>

          {/* Items Per Page — Enhanced Select */}
          <div className="md:col-span-2">
            <SearchableSelect
              options={limitOptions}
              value={limit}
              onChange={(val) => { setLimit(Number(val)); setPage(1); }}
              placeholder="10 / pág"
              searchPlaceholder="Buscar cantidad..."
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-b-xl shadow-sm overflow-hidden mb-8">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 hidden md:table">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Producto
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tienda / Precio
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones Rápidas
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="4" className="px-6 py-4">
                    <LoadingSkeleton variant="product-card" count={3} />
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                        <MagnifyingGlassIcon className="h-6 w-6 text-gray-400" />
                      </div>
                      <h3 className="text-sm font-medium text-gray-900">No se encontraron productos</h3>
                      <p className="mt-1 text-sm text-gray-500">Intenta cambiar los filtros o el término de búsqueda.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                products.map((product) => {
                  const storeName = product.store_profiles?.business_name || "Tienda desconocida";
                  const imageUrl = product.images?.[0] || null;
                  
                  // Determine status badge
                  let statusBadge = null;
                  if (!product.is_active && product.moderation_status === 'rejected') {
                     statusBadge = <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Baneado / Inactivo</span>;
                  } else if (product.moderation_status === 'pending') {
                     statusBadge = <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">Pendiente</span>;
                  } else if (product.moderation_status === 'approved') {
                     statusBadge = <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">Aprobado</span>;
                  } else if (product.moderation_status === 'rejected') {
                     statusBadge = <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200">Rechazado</span>;
                  } else if (!product.is_active) {
                     statusBadge = <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">Inactivo</span>;
                  }

                  return (
                    <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-12 w-12 rounded-lg bg-gray-100 overflow-hidden flex items-center justify-center border border-gray-200">
                            {imageUrl ? (
                              <img src={imageUrl} alt="" className="h-12 w-12 object-cover" />
                            ) : (
                              <span className="text-gray-400 text-xl">🦷</span>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-bold text-gray-900 truncate max-w-[200px]" title={product.name}>{product.name}</div>
                            <div className="text-xs text-gray-500 mt-0.5">ID: {product.id.slice(0, 8)}...</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 font-medium">{storeName}</div>
                        {product.store_profiles?.store_code && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold mt-0.5" style={{ background: '#f3e8ff', color: '#6b1e96', letterSpacing: '0.08em' }}>
                            #{product.store_profiles.store_code}
                          </span>
                        )}
                        <div className="text-sm text-primary-600 font-bold mt-0.5">{formatCurrencyUSD(product.price)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {statusBadge}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => setSelectedProduct(product)}
                            className="text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition p-2 rounded-lg"
                            title="Ver detalles"
                          >
                            <EyeIcon className="h-5 w-5" />
                          </button>
                          
                          {product.moderation_status !== 'approved' && (
                            <button
                              onClick={() => handleModerate(product.id, "approve", product.name)}
                              className="p-2 text-green-600 bg-green-50 hover:bg-green-600 hover:text-white rounded-lg transition-colors shadow-sm"
                              title="Aprobar"
                            >
                              <CheckCircleIcon className="h-5 w-5" />
                            </button>
                          )}
                          {product.moderation_status !== 'rejected' && (
                            <button
                              onClick={() => handleModerate(product.id, "reject", product.name)}
                              className="p-2 text-orange-600 bg-orange-50 hover:bg-orange-500 hover:text-white rounded-lg transition-colors shadow-sm"
                              title="Rechazar"
                            >
                              <XCircleIcon className="h-5 w-5" />
                            </button>
                          )}
                          {product.is_active && (
                            <button
                              onClick={() => handleModerate(product.id, "ban", product.name)}
                              className="p-2 text-red-600 bg-red-50 hover:bg-red-600 hover:text-white rounded-lg transition-colors shadow-sm"
                              title="Banear / Desactivar"
                            >
                              <NoSymbolIcon className="h-5 w-5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          {/* Vista responsiva de tarjetas en móvil */}
          <div className="grid grid-cols-1 gap-4 p-4 md:hidden">
            {loading ? (
              <div className="py-4">
                <LoadingSkeleton variant="product-card" count={3} />
              </div>
            ) : products.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                  <MagnifyingGlassIcon className="h-6 w-6 text-gray-400" />
                </div>
                <h3 className="text-sm font-medium text-gray-900">No se encontraron productos</h3>
                <p className="mt-1 text-sm text-gray-500">Intenta cambiar los filtros o el término de búsqueda.</p>
              </div>
            ) : (
              products.map((product) => {
                const storeName = product.store_profiles?.business_name || "Tienda desconocida";
                const imageUrl = product.images?.[0] || null;
                
                // Determine status badge
                let statusBadge = null;
                if (!product.is_active && product.moderation_status === 'rejected') {
                   statusBadge = <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800">Baneado / Inactivo</span>;
                } else if (product.moderation_status === 'pending') {
                   statusBadge = <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-yellow-100 text-yellow-800 border border-yellow-200">Pendiente</span>;
                } else if (product.moderation_status === 'approved') {
                   statusBadge = <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-800 border border-green-200">Aprobado</span>;
                } else if (product.moderation_status === 'rejected') {
                   statusBadge = <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-800 border border-orange-200">Rechazado</span>;
                } else if (!product.is_active) {
                   statusBadge = <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-800 border border-gray-200">Inactivo</span>;
                }

                return (
                  <div 
                    key={product.id} 
                    className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm transition-all"
                  >
                    {/* Fila principal */}
                    <div className="flex gap-3 items-start">
                      <div className="flex-shrink-0 h-14 w-14 rounded-xl bg-gray-50 overflow-hidden flex items-center justify-center border border-gray-150">
                        {imageUrl ? (
                          <img src={imageUrl} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-gray-400 text-2xl">🦷</span>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <span className="font-bold text-gray-900 text-sm block truncate" title={product.name}>
                          {product.name}
                        </span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] text-gray-400 font-bold bg-slate-100 px-1.5 py-0.2 rounded">
                            ID: {product.id.slice(0, 8)}
                          </span>
                          {statusBadge}
                        </div>
                      </div>
                    </div>

                    {/* Información adicional */}
                    <div className="mt-3 space-y-2 text-xs text-gray-600 border-t border-gray-100 pt-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">Tienda:</span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-gray-800">{storeName}</span>
                          {product.store_profiles?.store_code && (
                            <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-bold bg-purple-50 text-[#6b1e96]">
                              #{product.store_profiles.store_code}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">Precio unitario:</span>
                        <span className="font-black text-[#6b1e96] text-sm">{formatCurrencyUSD(product.price)}</span>
                      </div>
                    </div>

                    {/* Acciones */}
                    <div className="mt-4 border-t border-gray-100 pt-3 flex items-center justify-between gap-2">
                      <button 
                        onClick={() => setSelectedProduct(product)}
                        className="px-3.5 py-2 border border-gray-200 hover:border-[#6b1e96]/30 text-gray-500 hover:text-[#6b1e96] hover:bg-[#6b1e96]/5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        <EyeIcon className="h-4 w-4" />
                        Detalles
                      </button>

                      <div className="flex items-center gap-1.5">
                        {product.moderation_status !== 'approved' && (
                          <button
                            onClick={() => handleModerate(product.id, "approve", product.name)}
                            className="p-2 text-green-600 bg-green-50 hover:bg-green-600 hover:text-white rounded-xl transition-colors shadow-sm"
                            title="Aprobar"
                          >
                            <CheckCircleIcon className="h-4 w-4" />
                          </button>
                        )}
                        {product.moderation_status !== 'rejected' && (
                          <button
                            onClick={() => handleModerate(product.id, "reject", product.name)}
                            className="p-2 text-orange-600 bg-orange-50 hover:bg-orange-500 hover:text-white rounded-xl transition-colors shadow-sm"
                            title="Rechazar"
                          >
                            <XCircleIcon className="h-4 w-4" />
                          </button>
                        )}
                        {product.is_active && (
                          <button
                            onClick={() => handleModerate(product.id, "ban", product.name)}
                            className="p-2 text-red-600 bg-red-50 hover:bg-red-600 hover:text-white rounded-xl transition-colors shadow-sm"
                            title="Banear / Desactivar"
                          >
                            <NoSymbolIcon className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
        
        {/* Pagination Footer */}
        {!loading && products.length > 0 && (
          <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-700 text-center sm:text-left">
              Mostrando <span className="font-medium">{((page - 1) * limit) + 1}</span> a <span className="font-medium">{Math.min(page * limit, totalCount)}</span> de <span className="font-medium">{totalCount}</span> resultados
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  <span className="sr-only">Anterior</span>
                  <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
                </button>
                <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                  Página {page} de {Math.ceil(totalCount / limit) || 1}
                </span>
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={page >= Math.ceil(totalCount / limit)}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  <span className="sr-only">Siguiente</span>
                  <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
                </button>
              </nav>
            </div>
          </div>
        )}
      </div>

      {/* Slide-Over for Product Details */}
      <ProductAdminSlideOver
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onModerate={handleModerate}
      />
    </div>
  );
}
