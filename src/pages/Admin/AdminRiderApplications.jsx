import { useState, useEffect, useMemo } from "react";
import toast from "react-hot-toast";
import {
  getAdminRiderApplicationsAPI,
  approveRiderApplicationAPI,
  rejectRiderApplicationAPI,
} from "../../services/api";
import { useAdminStats } from "../../context/AdminStatsContext";

export default function AdminRiderApplications() {
  const { refreshStats } = useAdminStats();
  const [allApplications, setAllApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Tabs and Filters
  const [activeTab, setActiveTab] = useState("pending"); // pending, approved, rejected
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const [approveModal, setApproveModal] = useState({ open: false, id: null, name: "" });
  const [rejectModal, setRejectModal] = useState({ open: false, id: null, name: "" });


  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const res = await getAdminRiderApplicationsAPI();
      setAllApplications(res.data?.data || []);
    } catch (err) {
      toast.error("Error cargando solicitudes de repartidores: " + (err.message || ""));
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = (id, fullName) => {
    setApproveModal({ open: true, id, name: fullName });
  };

  const confirmApprove = async () => {
    try {
      setLoading(true);
      setApproveModal({ open: false, id: null, name: "" });
      const res = await approveRiderApplicationAPI(approveModal.id);
      toast.success(res.data?.message || "Repartidor aprobado con éxito");
      fetchApplications();
      refreshStats();
    } catch (err) {
      toast.error("Error al aprobar: " + (err.message || ""));
      setLoading(false);
    }
  };

  const handleReject = (id, fullName) => {
    setRejectModal({ open: true, id, name: fullName });
  };

  const confirmReject = async () => {
    try {
      setLoading(true);
      setRejectModal({ open: false, id: null, name: "" });
      await rejectRiderApplicationAPI(rejectModal.id);
      toast.success("Solicitud rechazada");
      fetchApplications();
      refreshStats();
    } catch (err) {
      toast.error("Error al rechazar: " + (err.message || ""));
      setLoading(false);
    }
  };

  // Determine the data source based on the active tab
  const filteredData = useMemo(() => {
    return allApplications.filter((item) => {
      // Filter by Status
      if (item.status !== activeTab) return false;

      // Filter by Search Term (Name or Cedula)
      if (searchTerm) {
        const lowerSearch = searchTerm.toLowerCase();
        const nameMatch = item.full_name?.toLowerCase().includes(lowerSearch);
        const cedulaMatch = item.cedula?.toLowerCase().includes(lowerSearch);
        if (!nameMatch && !cedulaMatch) return false;
      }

      return true;
    });
  }, [allApplications, activeTab, searchTerm]);

  // Reset page when filters or tab change
  useEffect(() => { setCurrentPage(1); }, [activeTab, searchTerm, perPage]);

  // Paginated slice
  const totalPages = Math.max(1, Math.ceil(filteredData.length / perPage));
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * perPage;
    return filteredData.slice(start, start + perPage);
  }, [filteredData, currentPage, perPage]);

  const counts = {
    pending: allApplications.filter(a => a.status === "pending").length,
    approved: allApplications.filter(a => a.status === "approved").length,
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
          Gestión de Repartidores
        </h1>
        <p className="text-gray-500 mt-1 text-sm">
          Administra las solicitudes de afiliación de riders a la plataforma.
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
            Aprobados
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
            Rechazados
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
              Buscar Repartidor
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Nombre o cédula..."
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
              Mostrar
            </label>
            <select
              value={perPage}
              onChange={(e) => setPerPage(Number(e.target.value))}
              className="w-full md:w-24 text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#c3ff00] cursor-pointer appearance-none bg-white"
            >
              {[10, 25, 50, 100].map(n => (
                <option key={n} value={n}>{n} filas</option>
              ))}
            </select>
          </div>

          {searchTerm && (
            <div className="w-full md:w-auto">
              <button 
                onClick={() => setSearchTerm('')}
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
            {searchTerm
              ? "No se encontraron repartidores que coincidan con la búsqueda."
              : `No hay solicitudes en estado "${activeTab}" actualmente.`}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden relative">
          {loading && <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6b1e96]"></div></div>}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse hidden md:table">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100">
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Repartidor</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Datos / Cédula</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Ubicación / Vehículo</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Fecha Registro</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedData.map((app) => (
                  <tr key={app.id} className={`hover:bg-gray-50/50 transition-colors`}>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-gray-900">{app.full_name}</span>
                        <span className="text-xs text-gray-500">{app.users?.email || "N/A"}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-700">{app.cedula}</span>
                        <span className="text-xs text-gray-500">{app.phone}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm text-gray-900">{app.city}</span>
                        <span className="inline-flex items-center w-fit px-1.5 py-0.5 rounded text-[10px] font-bold mt-1 bg-gray-100 text-gray-600 uppercase">
                          {app.vehicle_type}
                        </span>
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
                            onClick={() => handleReject(app.id, app.full_name)}
                            disabled={loading}
                            className="px-3 py-1.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                          >
                            Rechazar
                          </button>
                          <button
                            onClick={() => handleApprove(app.id, app.full_name)}
                            disabled={loading}
                            className="px-4 py-1.5 text-[#531575] bg-[#c3ff00] hover:bg-[#aade00] rounded-lg text-sm font-medium transition-colors disabled:opacity-50 shadow-sm"
                          >
                            Aprobar
                          </button>
                        </div>
                      ) : activeTab === "approved" ? (
                        <div className="flex items-center justify-end gap-3">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border bg-green-50 text-green-700 border-green-100`}>
                            <span className={`w-1.5 h-1.5 rounded-full bg-green-500`} />
                            Aprobado
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-3">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-red-50 text-red-700 border border-red-100">
                            Rechazado
                          </span>
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
                  className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm transition-all relative"
                >
                  {/* Cabecera de la tarjeta */}
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex flex-col min-w-0">
                      <span className="font-bold text-gray-900 text-base truncate">{app.full_name}</span>
                      <span className="text-xs text-gray-400 truncate">{app.users?.email || "N/A"}</span>
                    </div>
                    
                    {/* Badges de Estado */}
                    {activeTab === "approved" && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-green-50 text-green-700 border border-green-100">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                        Aprobado
                      </span>
                    )}
                    {activeTab === "rejected" && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-100">
                        Rechazado
                      </span>
                    )}
                  </div>

                  {/* Información detallada */}
                  <div className="mt-3 space-y-2 text-xs text-gray-600 border-t border-gray-100 pt-3">
                    <div className="flex items-center gap-1">
                      <span className="font-semibold text-gray-500 min-w-[70px]">Cédula:</span>
                      <span>{app.cedula}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="font-semibold text-gray-500 min-w-[70px]">Teléfono:</span>
                      <span>{app.phone}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="font-semibold text-gray-500 min-w-[70px]">Ubicación:</span>
                      <span className="font-medium text-gray-800">{app.city}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="font-semibold text-gray-500 min-w-[70px]">Vehículo:</span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-600 uppercase">
                        {app.vehicle_type}
                      </span>
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
                  {activeTab === "pending" && (
                    <div className="mt-4 border-t border-gray-100 pt-3 flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleReject(app.id, app.full_name)}
                        disabled={loading}
                        className="flex-1 py-2 text-center text-red-600 bg-red-50 hover:bg-red-100 rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
                      >
                        Rechazar
                      </button>
                      <button
                        onClick={() => handleApprove(app.id, app.full_name)}
                        disabled={loading}
                        className="flex-1 py-2 text-center text-[#531575] bg-[#c3ff00] hover:bg-[#aade00] rounded-xl text-xs font-bold transition-colors disabled:opacity-50 shadow-sm"
                      >
                        Aprobar
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ── Pagination Footer ── */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 bg-gray-50/80 border-t border-gray-100">
            <span className="text-sm text-gray-500">
              {filteredData.length === 0 ? '0 resultados' : (
                <>{(currentPage - 1) * perPage + 1}–{Math.min(currentPage * perPage, filteredData.length)} de <span className="font-semibold text-gray-700">{filteredData.length}</span></>
              )}
            </span>

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
                Aprobar Repartidor
              </h3>
              <p className="text-gray-500 text-center text-sm mb-6">
                ¿Estás seguro que deseas certificar a <span className="font-semibold text-gray-800">{approveModal.name}</span>? Su rol cambiará a Repartidor globalmente.
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
                ¿Seguro que deseas denegar la postulación de <span className="font-semibold text-gray-800">{rejectModal.name}</span>?
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
    </div>
  );
}
