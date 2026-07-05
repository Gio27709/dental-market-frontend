import { useState, useEffect, useMemo } from "react";
import toast from "react-hot-toast";
import {
  getAdminStoreApplicationsAPI,
  approveStoreApplicationAPI,
  rejectStoreApplicationAPI,
  deleteStoreApplicationAPI,
  bulkDeleteStoreApplicationsAPI,
  suspendStoreAPI,
  reactivateStoreAPI,
  revokeStoreAPI,
} from "../../services/api";
import StoreDetailSlideOver from "../../components/admin/StoreDetailSlideOver";
import { useAdminStats } from "../../context/AdminStatsContext";

export default function StoreApplications() {
  const { refreshStats } = useAdminStats();
  const [allApplications, setAllApplications] = useState([]);
  const [operativeStores, setOperativeStores] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Tabs and Filters
  const [activeTab, setActiveTab] = useState("pending"); // pending, approved, rejected
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const [approveModal, setApproveModal] = useState({ open: false, id: null, name: "" });
  const [rejectModal, setRejectModal] = useState({ open: false, id: null, name: "" });
  const [deleteModal, setDeleteModal] = useState({ open: false, id: null, name: "" });
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkDeleteModal, setBulkDeleteModal] = useState(false);

  // Store Moderation State
  const [openDropdown, setOpenDropdown] = useState(null);
  const [slideOverStore, setSlideOverStore] = useState(null);
  const [suspendModal, setSuspendModal] = useState({ open: false, store: null });
  const [reactivateModal, setReactivateModal] = useState({ open: false, store: null });
  const [revokeModal, setRevokeModal] = useState({ open: false, store: null });
  const [suspendReason, setSuspendReason] = useState("");
  const [revokeReason, setRevokeReason] = useState("");

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const res = await getAdminStoreApplicationsAPI();
      const responseData = res.data?.data;

      // New response structure: { applications: [...], operativeStores: [...] }
      if (responseData?.applications && responseData?.operativeStores) {
        setAllApplications(responseData.applications || []);
        setOperativeStores(responseData.operativeStores || []);
      } else {
        // Fallback for safety (should not happen)
        setAllApplications(Array.isArray(responseData) ? responseData : []);
        setOperativeStores([]);
      }
    } catch (err) {
      toast.error("Error cargando tiendas y solicitudes: " + (err.message || ""));
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = (id, businessName) => {
    setApproveModal({ open: true, id, name: businessName });
  };

  const confirmApprove = async () => {
    try {
      setLoading(true);
      setApproveModal({ open: false, id: null, name: "" });
      const res = await approveStoreApplicationAPI(approveModal.id);
      toast.success(res.data?.message || "Tienda aprobada con éxito");
      fetchApplications();
      refreshStats();
    } catch (err) {
      toast.error("Error al aprobar: " + (err.message || ""));
      setLoading(false);
    }
  };

  const handleReject = (id, businessName) => {
    setRejectModal({ open: true, id, name: businessName });
  };

  const confirmReject = async () => {
    try {
      setLoading(true);
      setRejectModal({ open: false, id: null, name: "" });
      await rejectStoreApplicationAPI(rejectModal.id);
      toast.success("Solicitud rechazada");
      fetchApplications();
      refreshStats();
    } catch (err) {
      toast.error("Error al rechazar: " + (err.message || ""));
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    try {
      setLoading(true);
      const res = await deleteStoreApplicationAPI(deleteModal.id);
      if (res.data?.success) {
        toast.success("Solicitud eliminada. El usuario podrá aplicar de nuevo.");
        fetchApplications();
        setDeleteModal({ open: false, id: null, name: "" });
      }
    } catch (err) {
      toast.error("Error al eliminar: " + (err.message || ""));
      setLoading(false);
    }
  };

  // ── Store Moderation Handlers ──
  const handleSuspend = async () => {
    try {
      setLoading(true);
      const store = suspendModal.store;
      setSuspendModal({ open: false, store: null });
      const res = await suspendStoreAPI(store.user_id, suspendReason);
      toast.success(res.data?.message || "Tienda suspendida");
      setSuspendReason("");
      fetchApplications();
    } catch (err) {
      toast.error(err.message || "Error al suspender");
      setLoading(false);
    }
  };

  const handleReactivate = async () => {
    try {
      setLoading(true);
      const store = reactivateModal.store;
      setReactivateModal({ open: false, store: null });
      const res = await reactivateStoreAPI(store.user_id);
      toast.success(res.data?.message || "Tienda reactivada");
      fetchApplications();
    } catch (err) {
      toast.error(err.message || "Error al reactivar");
      setLoading(false);
    }
  };

  const handleRevoke = async () => {
    try {
      setLoading(true);
      const store = revokeModal.store;
      setRevokeModal({ open: false, store: null });
      const res = await revokeStoreAPI(store.user_id, revokeReason);
      toast.success(res.data?.message || "Tienda revocada");
      setRevokeReason("");
      fetchApplications();
    } catch (err) {
      toast.error(err.message || "Error al revocar");
      setLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    try {
      setLoading(true);
      setBulkDeleteModal(false);
      const res = await bulkDeleteStoreApplicationsAPI(Array.from(selectedIds));
      toast.success(res.data?.message || "Solicitudes eliminadas");
      setSelectedIds(new Set());
      fetchApplications();
    } catch (err) {
      toast.error(err.response?.data?.error || "Error al eliminar en masa");
      setLoading(false);
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    const pageIds = paginatedData.map(a => a.id);
    const allSelected = pageIds.length > 0 && pageIds.every(id => selectedIds.has(id));
    if (allSelected) {
      setSelectedIds(prev => {
        const next = new Set(prev);
        pageIds.forEach(id => next.delete(id));
        return next;
      });
    } else {
      setSelectedIds(prev => {
        const next = new Set(prev);
        pageIds.forEach(id => next.add(id));
        return next;
      });
    }
  };

  // Clear selection when switching tabs
  useEffect(() => { setSelectedIds(new Set()); }, [activeTab]);

  // Determine the data source based on the active tab
  const filteredData = useMemo(() => {
    // "Operativas" tab uses store_profiles (real source of truth)
    const source = activeTab === "approved" ? operativeStores : allApplications;

    return source.filter((item) => {
      // For pending/rejected tabs, filter by status from store_applications
      if (activeTab !== "approved" && item.status !== activeTab) return false;

      // Filter by Search Term (Business Name or Store Code)
      if (searchTerm) {
        const lowerSearch = searchTerm.toLowerCase();
        const nameMatch = item.business_name?.toLowerCase().includes(lowerSearch);
        const codeMatch = item.store_code?.toLowerCase().includes(lowerSearch);
        if (!nameMatch && !codeMatch) return false;
      }

      // Filter by Date
      if (startDate || endDate) {
        const itemDate = new Date(item.created_at);
        itemDate.setHours(0,0,0,0);
        
        if (startDate) {
          const sDate = new Date(startDate);
          sDate.setHours(0,0,0,0);
          if (itemDate < sDate) return false;
        }
        
        if (endDate) {
          const eDate = new Date(endDate);
          eDate.setHours(23,59,59,999);
          if (itemDate > eDate) return false;
        }
      }

      return true;
    });
  }, [allApplications, operativeStores, activeTab, searchTerm, startDate, endDate]);

  // Reset page when filters or tab change
  useEffect(() => { setCurrentPage(1); }, [activeTab, searchTerm, startDate, endDate, perPage]);

  // Paginated slice
  const totalPages = Math.max(1, Math.ceil(filteredData.length / perPage));
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * perPage;
    return filteredData.slice(start, start + perPage);
  }, [filteredData, currentPage, perPage]);

  const counts = {
    pending: allApplications.filter(a => a.status === "pending").length,
    approved: operativeStores.length, // Source of truth: store_profiles
    rejected: allApplications.filter(a => a.status === "rejected").length,
  };

  if (loading && allApplications.length === 0) {
    return (
      <div className="p-8 flex justify-center h-full items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6b1e96]"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      
      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
          Gestión de Tiendas y Solicitudes
        </h1>
        <p className="text-gray-500 mt-1 text-sm">
          Filtra, administra y audita el estado de todos los comercios afiliados a Forcepx.
        </p>
      </div>

      {/* ── Tabs & Stats ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200">
        <div className="flex overflow-x-auto hide-scrollbar">
          <button
            onClick={() => setActiveTab("pending")}
            className={`whitespace-nowrap py-4 px-6 text-sm font-medium transition-colors border-b-2 ${
              activeTab === "pending"
                ? "border-[#c3ff00] text-[#6b1e96]"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Pendientes
            <span className={`ml-2 py-0.5 px-2.5 rounded-full text-xs ${activeTab === 'pending' ? 'bg-[#6b1e96] text-white' : 'bg-gray-100 text-gray-600'}`}>
              {counts.pending}
            </span>
          </button>
          
          <button
            onClick={() => setActiveTab("approved")}
            className={`whitespace-nowrap py-4 px-6 text-sm font-medium transition-colors border-b-2 ${
              activeTab === "approved"
                ? "border-[#c3ff00] text-[#6b1e96]"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Operativas
            <span className={`ml-2 py-0.5 px-2.5 rounded-full text-xs ${activeTab === 'approved' ? 'bg-[#c3ff00] text-[#531575] font-bold' : 'bg-gray-100 text-gray-600'}`}>
              {counts.approved}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("rejected")}
            className={`whitespace-nowrap py-4 px-6 text-sm font-medium transition-colors border-b-2 ${
              activeTab === "rejected"
                ? "border-[#c3ff00] text-[#6b1e96]"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Rechazadas
            <span className={`ml-2 py-0.5 px-2.5 rounded-full text-xs ${activeTab === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
              {counts.rejected}
            </span>
          </button>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          
          <div className="w-full md:w-1/3">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Buscar Tienda
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Nombre o código de tienda..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#c3ff00] focus:border-transparent transition-all"
              />
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-gray-400 absolute left-3 top-2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
            </div>
          </div>

          <div className="w-full md:w-auto">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Desde
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#c3ff00]"
            />
          </div>

          <div className="w-full md:w-auto">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Hasta
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#c3ff00]"
            />
          </div>

          <div className="w-full md:w-auto">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Mostrar
            </label>
            <select
              value={perPage}
              onChange={(e) => setPerPage(Number(e.target.value))}
              className="w-full md:w-24 text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#c3ff00] cursor-pointer appearance-none bg-white"
              style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23999'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='3' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 8px center", backgroundSize: "0.7rem" }}
            >
              {[10, 25, 50, 100].map(n => (
                <option key={n} value={n}>{n} filas</option>
              ))}
            </select>
          </div>

          {(searchTerm || startDate || endDate) && (
            <div className="w-full md:w-auto">
              <button 
                onClick={() => {
                  setSearchTerm('');
                  setStartDate('');
                  setEndDate('');
                }}
                className="w-full px-4 py-2 text-sm font-medium text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-transparent"
              >
                Limpiar Filtros
              </button>
            </div>
          )}

        </div>
      </div>

      {/* ── Data Table ── */}
      {filteredData.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">Sin Resultados</h3>
          <p className="text-gray-500 text-sm">
            {searchTerm || startDate || endDate 
              ? "No se encontraron tiendas que coincidan con los filtros aplicados."
              : `No hay tiendas en estado "${activeTab}" actualmente.`}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden relative">
          {loading && <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6b1e96]"></div></div>}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse hidden md:table">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100">
                  {activeTab === "rejected" && (
                    <th className="pl-4 pr-2 py-4 w-10">
                      <input
                        type="checkbox"
                        checked={paginatedData.length > 0 && paginatedData.every(a => selectedIds.has(a.id))}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 rounded border-gray-300 text-[#6b1e96] focus:ring-[#6b1e96]/30 cursor-pointer"
                      />
                    </th>
                  )}
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Empresa</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Datos / RIF</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Titular</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Fecha Registro</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">
                    {activeTab === "pending" ? "Acciones" : "Estado"}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedData.map((app) => (
                  <tr key={app.id} className={`hover:bg-gray-50/50 transition-colors ${selectedIds.has(app.id) ? 'bg-[#6b1e96]/[0.03]' : ''}`}>
                    {activeTab === "rejected" && (
                      <td className="pl-4 pr-2 py-4 w-10">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(app.id)}
                          onChange={() => toggleSelect(app.id)}
                          className="w-4 h-4 rounded border-gray-300 text-[#6b1e96] focus:ring-[#6b1e96]/30 cursor-pointer"
                        />
                      </td>
                    )}
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-gray-900">{app.business_name}</span>
                        {app.store_code && (
                          <span className="inline-flex items-center w-fit px-1.5 py-0.5 rounded text-[10px] font-bold mt-1" style={{ background: '#f3e8ff', color: '#6b1e96', letterSpacing: '0.08em' }}>
                            #{app.store_code}
                          </span>
                        )}
                        <span className="text-xs text-gray-500 max-w-[200px] truncate" title={app.business_address}>
                          {app.business_address}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-700">{app.rif}</span>
                        <span className="text-xs text-gray-500">{app.business_phone}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm text-gray-900">{app.users?.raw_user_meta_data?.full_name || "N/A"}</span>
                        <span className="text-xs text-gray-500">{app.users?.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(app.created_at).toLocaleDateString("es-VE", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {activeTab === "pending" ? (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleReject(app.id, app.business_name)}
                            disabled={loading}
                            className="px-3 py-1.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                          >
                            Rechazar
                          </button>
                          <button
                            onClick={() => handleApprove(app.id, app.business_name)}
                            disabled={loading}
                            className="px-4 py-1.5 text-[#531575] bg-[#c3ff00] hover:bg-[#aade00] rounded-lg text-sm font-medium transition-colors disabled:opacity-50 shadow-sm"
                          >
                            Aprobar
                          </button>
                        </div>
                      ) : activeTab === "approved" ? (
                        <div className="flex items-center justify-end gap-3">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${app.is_suspended ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-green-50 text-green-700 border-green-100'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${app.is_suspended ? 'bg-amber-500' : 'bg-green-500'}`} />
                            {app.is_suspended ? 'Suspendida' : 'Activa'}
                          </span>
                          {/* Dropdown Menu */}
                          <div className="relative">
                            <button
                              onClick={() => setOpenDropdown(openDropdown === app.user_id ? null : app.user_id)}
                              className="p-1.5 text-gray-400 hover:text-[#6b1e96] hover:bg-[#6b1e96]/5 rounded-lg transition-colors"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 12.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 18.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Z" />
                              </svg>
                            </button>
                            {openDropdown === app.user_id && (
                              <>
                                <div className="fixed inset-0 z-40" onClick={() => setOpenDropdown(null)} />
                                <div className="absolute right-0 top-8 z-50 w-52 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 animate-in fade-in zoom-in-95 duration-150">
                                  <button onClick={() => { setOpenDropdown(null); setSlideOverStore(app); }} className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 transition-colors">
                                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                    Ver Detalles
                                  </button>
                                  <a href={`/store/${app.user_id}`} target="_blank" rel="noopener noreferrer" onClick={() => setOpenDropdown(null)} className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 transition-colors">
                                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                    Ver Pública
                                  </a>
                                  <div className="border-t border-gray-100 my-1" />
                                  {app.is_suspended ? (
                                    <button onClick={() => { setOpenDropdown(null); setReactivateModal({ open: true, store: app }); }} className="w-full text-left px-4 py-2.5 text-sm text-green-600 hover:bg-green-50 flex items-center gap-2.5 transition-colors">
                                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                      Reactivar
                                    </button>
                                  ) : (
                                    <button onClick={() => { setOpenDropdown(null); setSuspendModal({ open: true, store: app }); }} className="w-full text-left px-4 py-2.5 text-sm text-amber-600 hover:bg-amber-50 flex items-center gap-2.5 transition-colors">
                                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
                                      Suspender
                                    </button>
                                  )}
                                  <button onClick={() => { setOpenDropdown(null); setRevokeModal({ open: true, store: app }); }} className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2.5 transition-colors">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                                    Revocar Tienda
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-3">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-red-50 text-red-700 border border-red-100">
                            Rechazada
                          </span>
                          {/* Dropdown Menu */}
                          <div className="relative">
                            <button
                              onClick={() => setOpenDropdown(openDropdown === app.id ? null : app.id)}
                              className="p-1.5 text-gray-400 hover:text-[#6b1e96] hover:bg-[#6b1e96]/5 rounded-lg transition-colors"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 12.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 18.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Z" />
                              </svg>
                            </button>
                            {openDropdown === app.id && (
                              <>
                                <div className="fixed inset-0 z-40" onClick={() => setOpenDropdown(null)} />
                                <div className="absolute right-0 top-8 z-50 w-52 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 animate-in fade-in zoom-in-95 duration-150">
                                  <button onClick={() => { setOpenDropdown(null); handleApprove(app.id, app.business_name); }} className="w-full text-left px-4 py-2.5 text-sm text-[#6b1e96] hover:bg-[#6b1e96]/5 flex items-center gap-2.5 transition-colors font-medium">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" /></svg>
                                    Aprobar (Hacer tienda)
                                  </button>
                                  <div className="border-t border-gray-100 my-1" />
                                  <button onClick={() => { setOpenDropdown(null); setDeleteModal({ open: true, id: app.id, name: app.business_name }); }} className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2.5 transition-colors">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    Eliminar solicitud
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Vista responsiva de tarjetas en móvil */}
            <div className="grid grid-cols-1 gap-4 p-4 md:hidden">
              {paginatedData.map((app) => (
                <div 
                  key={app.id} 
                  className={`bg-white rounded-2xl border p-4 shadow-sm transition-all relative ${selectedIds.has(app.id) ? 'border-[#6b1e96] bg-[#6b1e96]/[0.01]' : 'border-gray-100'}`}
                >
                  {/* Checkbox para el borrado masivo en rechazadas */}
                  {activeTab === "rejected" && (
                    <div className="absolute top-4 left-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(app.id)}
                        onChange={() => toggleSelect(app.id)}
                        className="w-5 h-5 rounded border-gray-300 text-[#6b1e96] focus:ring-[#6b1e96]/30 cursor-pointer"
                      />
                    </div>
                  )}
                  
                  {/* Cabecera de la tarjeta */}
                  <div className={`${activeTab === "rejected" ? "pl-8" : ""} flex justify-between items-start gap-2`}>
                    <div className="flex flex-col min-w-0">
                      <span className="font-bold text-gray-900 text-base truncate">{app.business_name}</span>
                      {app.store_code && (
                        <span className="inline-flex items-center w-fit px-2 py-0.5 rounded text-[9px] font-black mt-1 bg-purple-100 text-[#6b1e96] tracking-wider uppercase">
                          #{app.store_code}
                        </span>
                      )}
                    </div>
                    
                    {/* Badges de Estado */}
                    {activeTab === "approved" && (
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${app.is_suspended ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-green-50 text-green-700 border-green-100'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${app.is_suspended ? 'bg-amber-500' : 'bg-green-500'}`} />
                        {app.is_suspended ? 'Suspendida' : 'Activa'}
                      </span>
                    )}
                    {activeTab === "rejected" && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-100">
                        Rechazada
                      </span>
                    )}
                  </div>

                  {/* Información detallada */}
                  <div className="mt-3 space-y-2 text-xs text-gray-600 border-t border-gray-100 pt-3">
                    <div className="flex items-start gap-1">
                      <span className="font-semibold text-gray-500 min-w-[70px]">Dirección:</span>
                      <span className="truncate flex-1" title={app.business_address}>{app.business_address || "Sin dirección"}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="font-semibold text-gray-500 min-w-[70px]">RIF / Tlf:</span>
                      <span>{app.rif} / {app.business_phone}</span>
                    </div>
                    <div className="flex items-start gap-1">
                      <span className="font-semibold text-gray-500 min-w-[70px]">Titular:</span>
                      <div className="flex flex-col min-w-0">
                        <span className="font-medium text-gray-800">{app.users?.raw_user_meta_data?.full_name || "N/A"}</span>
                        <span className="text-gray-400 text-[11px] truncate">{app.users?.email}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="font-semibold text-gray-500 min-w-[70px]">Registro:</span>
                      <span>
                        {new Date(app.created_at).toLocaleDateString("es-VE", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="mt-4 border-t border-gray-100 pt-3 flex items-center justify-end gap-2">
                    {activeTab === "pending" ? (
                      <>
                        <button
                          onClick={() => handleReject(app.id, app.business_name)}
                          disabled={loading}
                          className="flex-1 py-2 text-center text-red-600 bg-red-50 hover:bg-red-100 rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
                        >
                          Rechazar
                        </button>
                        <button
                          onClick={() => handleApprove(app.id, app.business_name)}
                          disabled={loading}
                          className="flex-1 py-2 text-center text-[#531575] bg-[#c3ff00] hover:bg-[#aade00] rounded-xl text-xs font-bold transition-colors disabled:opacity-50 shadow-sm"
                        >
                          Aprobar
                        </button>
                      </>
                    ) : activeTab === "approved" ? (
                      <div className="flex w-full items-center justify-between gap-2">
                        <button 
                          onClick={() => setSlideOverStore(app)} 
                          className="px-4 py-2 border border-gray-200 hover:border-[#6b1e96]/30 text-gray-600 hover:text-[#6b1e96] hover:bg-[#6b1e96]/5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                          Detalles
                        </button>
                        
                        <div className="relative">
                          <button
                            onClick={() => setOpenDropdown(openDropdown === app.user_id ? null : app.user_id)}
                            className="px-4 py-2 bg-gray-50 hover:bg-[#6b1e96]/5 text-gray-600 hover:text-[#6b1e96] border border-gray-200 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors"
                          >
                            Opciones
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                            </svg>
                          </button>
                          {openDropdown === app.user_id && (
                            <>
                              <div className="fixed inset-0 z-40" onClick={() => setOpenDropdown(null)} />
                              <div className="absolute right-0 bottom-10 z-50 w-52 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 animate-in fade-in zoom-in-95 duration-150">
                                <a href={`/store/${app.user_id}`} target="_blank" rel="noopener noreferrer" onClick={() => setOpenDropdown(null)} className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 transition-colors">
                                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                  Ver Pública
                                </a>
                                <div className="border-t border-gray-100 my-1" />
                                {app.is_suspended ? (
                                  <button onClick={() => { setOpenDropdown(null); setReactivateModal({ open: true, store: app }); }} className="w-full text-left px-4 py-2.5 text-sm text-green-600 hover:bg-green-50 flex items-center gap-2.5 transition-colors">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    Reactivar
                                  </button>
                                ) : (
                                  <button onClick={() => { setOpenDropdown(null); setSuspendModal({ open: true, store: app }); }} className="w-full text-left px-4 py-2.5 text-sm text-amber-600 hover:bg-amber-50 flex items-center gap-2.5 transition-colors">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
                                    Suspender
                                  </button>
                                )}
                                <button onClick={() => { setOpenDropdown(null); setRevokeModal({ open: true, store: app }); }} className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2.5 transition-colors">
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                                  Revocar Tienda
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex w-full items-center justify-between gap-2">
                        <button 
                          onClick={() => handleApprove(app.id, app.business_name)}
                          className="px-4 py-2 bg-[#6b1e96]/10 hover:bg-[#6b1e96]/20 text-[#6b1e96] rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M5 13l4 4L19 7" /></svg>
                          Aprobar
                        </button>
                        <button 
                          onClick={() => setDeleteModal({ open: true, id: app.id, name: app.business_name })}
                          className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          Eliminar
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Pagination Footer ── */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 bg-gray-50/80 border-t border-gray-100">
            {/* Left: Info */}
            <span className="text-sm text-gray-500">
              {filteredData.length === 0 ? '0 resultados' : (
                <>{(currentPage - 1) * perPage + 1}–{Math.min(currentPage * perPage, filteredData.length)} de <span className="font-semibold text-gray-700">{filteredData.length}</span></>
              )}
            </span>

            {/* Right: Page navigation */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Primera página"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" /></svg>
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Anterior"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <span className="px-3 py-1 text-sm font-medium text-gray-700">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Siguiente"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Última página"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modals ── */}
      {/* Approve Modal */}
      {approveModal.open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-opacity">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6">
              <div className="w-16 h-16 bg-[#c3ff00]/20 rounded-full flex items-center justify-center mx-auto mb-4 border-8 border-white shadow-sm">
                <svg className="w-8 h-8 text-[#6b1e96]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-center text-gray-900 mb-2">
                Aprobar Tienda
              </h3>
              <p className="text-gray-500 text-center text-sm mb-6">
                ¿Estás seguro que deseas certificar a <span className="font-semibold text-gray-800">{approveModal.name}</span>? Podrá comenzar a vender productos inmediatamente.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setApproveModal({ open: false, id: null, name: "" })}
                  className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-100 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmApprove}
                  className="flex-1 px-4 py-2.5 bg-[#c3ff00] text-[#531575] font-bold rounded-xl hover:bg-[#b2e600] transition-colors shadow-sm"
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal.open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-opacity">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 border-8 border-white shadow-sm">
                <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-center text-gray-900 mb-2">
                Rechazar Solicitud
              </h3>
              <p className="text-gray-500 text-center text-sm mb-6">
                ¿Seguro que deseas denegar el acceso a <span className="font-semibold text-gray-800">{rejectModal.name}</span>? Esta acción no se puede deshacer.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setRejectModal({ open: false, id: null, name: "" })}
                  className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-100 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmReject}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 transition-colors shadow-sm"
                >
                  Rechazar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteModal.open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-opacity">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 border-8 border-white shadow-sm">
                <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-center text-gray-900 mb-2">
                Eliminar Solicitud
              </h3>
              <p className="text-gray-500 text-center text-sm mb-6">
                ¿Seguro que deseas eliminar la solicitud rechazada de <span className="font-semibold text-gray-800">{deleteModal.name}</span>? Esto permitirá al usuario enviar una nueva solicitud.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteModal({ open: false, id: null, name: "" })}
                  className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-100 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 transition-colors shadow-sm"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Suspend Modal ── */}
      {suspendModal.open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="p-6">
              <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4 border-8 border-white shadow-sm">
                <svg className="w-8 h-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
              </div>
              <h3 className="text-xl font-bold text-center text-gray-900 mb-2">Suspender Tienda</h3>
              <p className="text-gray-500 text-center text-sm mb-4">
                ¿Suspender a <span className="font-semibold text-gray-800">{suspendModal.store?.business_name}</span>? Sus productos dejarán de aparecer en el catálogo público.
              </p>
              <textarea
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                placeholder="Motivo de la suspensión (opcional)..."
                className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 mb-4 resize-none h-20"
              />
              <div className="flex gap-3">
                <button onClick={() => { setSuspendModal({ open: false, store: null }); setSuspendReason(""); }} className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-100 transition-colors">Cancelar</button>
                <button onClick={handleSuspend} className="flex-1 px-4 py-2.5 bg-amber-500 text-white font-bold rounded-xl hover:bg-amber-600 transition-colors shadow-sm">Suspender</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Reactivate Modal ── */}
      {reactivateModal.open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="p-6">
              <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4 border-8 border-white shadow-sm">
                <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <h3 className="text-xl font-bold text-center text-gray-900 mb-2">Reactivar Tienda</h3>
              <p className="text-gray-500 text-center text-sm mb-6">
                ¿Reactivar a <span className="font-semibold text-gray-800">{reactivateModal.store?.business_name}</span>? Sus productos volverán a ser visibles en el catálogo.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setReactivateModal({ open: false, store: null })} className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-100 transition-colors">Cancelar</button>
                <button onClick={handleReactivate} className="flex-1 px-4 py-2.5 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-colors shadow-sm">Reactivar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Revoke Modal ── */}
      {revokeModal.open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="p-6">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 border-8 border-white shadow-sm">
                <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
              </div>
              <h3 className="text-xl font-bold text-center text-gray-900 mb-2">Revocar Tienda</h3>
              <p className="text-gray-500 text-center text-sm mb-1">
                ¿Revocar completamente a <span className="font-semibold text-red-700">{revokeModal.store?.business_name}</span>?
              </p>
              <p className="text-red-500 text-center text-xs font-medium mb-4">⚠ Esta acción eliminará el perfil, desactivará todos sus productos y revertirá al usuario a comprador. Es irreversible.</p>
              <textarea
                value={revokeReason}
                onChange={(e) => setRevokeReason(e.target.value)}
                placeholder="Motivo de la revocación (opcional)..."
                className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 mb-4 resize-none h-20"
              />
              <div className="flex gap-3">
                <button onClick={() => { setRevokeModal({ open: false, store: null }); setRevokeReason(""); }} className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-100 transition-colors">Cancelar</button>
                <button onClick={handleRevoke} className="flex-1 px-4 py-2.5 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors shadow-sm">Revocar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Floating Bulk Action Bar ── */}
      {selectedIds.size > 0 && activeTab === "rejected" && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[90] bg-[#1e1e2e] text-white rounded-2xl shadow-2xl px-6 py-3.5 flex items-center gap-5 animate-in slide-in-from-bottom duration-300 border border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#6b1e96] flex items-center justify-center text-sm font-bold">
              {selectedIds.size}
            </div>
            <span className="text-sm font-medium text-gray-300">
              solicitud{selectedIds.size > 1 ? "es" : ""} seleccionada{selectedIds.size > 1 ? "s" : ""}
            </span>
          </div>
          <div className="w-px h-6 bg-white/20" />
          <button
            onClick={() => setBulkDeleteModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300 rounded-xl text-sm font-semibold transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            Eliminar
          </button>
          <button
            onClick={() => setSelectedIds(new Set())}
            className="p-1.5 text-gray-500 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
            title="Deseleccionar todo"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      )}

      {/* ── Bulk Delete Modal ── */}
      {bulkDeleteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 border-8 border-white shadow-sm">
                <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-center text-gray-900 mb-2">
                Eliminación Masiva
              </h3>
              <p className="text-gray-500 text-center text-sm mb-2">
                ¿Seguro que deseas eliminar <span className="font-bold text-red-600">{selectedIds.size}</span> solicitud{selectedIds.size > 1 ? "es" : ""} rechazada{selectedIds.size > 1 ? "s" : ""}?
              </p>
              <p className="text-gray-400 text-center text-xs mb-6">
                Los usuarios afectados podrán enviar nuevas solicitudes de tienda.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setBulkDeleteModal(false)}
                  className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-100 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors shadow-sm"
                >
                  Eliminar {selectedIds.size}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Store Detail Slide-Over ── */}
      {slideOverStore && (
        <StoreDetailSlideOver
          store={slideOverStore}
          onClose={() => setSlideOverStore(null)}
        />
      )}
    </div>
  );
}
