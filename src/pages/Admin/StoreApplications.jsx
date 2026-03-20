import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import {
  getAdminStoreApplicationsAPI,
  approveStoreApplicationAPI,
  rejectStoreApplicationAPI,
} from "../../services/api";

export default function StoreApplications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [approveModal, setApproveModal] = useState({ open: false, id: null, name: "" });
  const [rejectModal, setRejectModal] = useState({ open: false, id: null, name: "" });

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const res = await getAdminStoreApplicationsAPI();
      setApplications(res.data?.data || []);
    } catch (err) {
      toast.error("Error cargando solicitudes: " + (err.message || ""));
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
    } catch (err) {
      toast.error("Error al rechazar: " + (err.message || ""));
      setLoading(false);
    }
  };

  if (loading && applications.length === 0) {
    return (
      <div className="p-8 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#163152]"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Solicitudes de Tiendas
          </h1>
          <p className="text-gray-500 mt-1">
            Gestione las empresas que desean unirse como tiendas a Dentix.
          </p>
        </div>
        <div className="bg-[#6b1e96]/10 text-[#6b1e96] px-4 py-2 rounded-full font-medium text-sm">
          {applications.length} Pendientes
        </div>
      </div>

      {applications.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">Cero Solicitudes</h3>
          <p className="text-gray-500">No hay tiendas esperando aprobación en este momento.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Empresa
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Datos / RIF
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Usuario
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Fecha Solicitud
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {applications.map((app) => (
                  <tr key={app.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 relative">
                      {loading && <div className="absolute inset-0 bg-white/50 z-10" />}
                      <div className="font-semibold text-gray-900">
                        {app.business_name}
                      </div>
                      <div className="text-sm text-gray-500 max-w-xs truncate">
                        {app.business_address}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-700">
                        {app.rif}
                      </div>
                      <div className="text-sm text-gray-500">
                        {app.business_phone}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {app.users?.raw_user_meta_data?.full_name || "N/A"}
                      </div>
                      <div className="text-xs text-gray-500">
                        {app.users?.email}
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
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleReject(app.id, app.business_name)}
                          disabled={loading}
                          className="px-3 py-1.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-md text-sm font-medium transition-colors disabled:opacity-50"
                        >
                          Rechazar
                        </button>
                        <button
                          onClick={() => handleApprove(app.id, app.business_name)}
                          disabled={loading}
                          className="px-3 py-1.5 text-white bg-green-600 hover:bg-green-700 rounded-md text-sm font-medium transition-colors disabled:opacity-50 shadow-sm"
                        >
                          Aprobar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Approve Modal */}
      {approveModal.open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-opacity">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6">
              <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4 border-8 border-green-50/50">
                <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-center text-gray-900 mb-2">
                Aprobar Tienda
              </h3>
              <p className="text-gray-500 text-center text-sm mb-6">
                ¿Estás seguro que deseas certificar a <span className="font-semibold text-gray-800">{approveModal.name}</span> como tienda oficial de Dentix?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setApproveModal({ open: false, id: null, name: "" })}
                  className="flex-1 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmApprove}
                  className="flex-1 px-4 py-2.5 bg-green-600 text-white font-medium rounded-xl hover:bg-green-700 transition-colors shadow-sm shadow-green-600/20"
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
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 border-8 border-red-50/50">
                <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-center text-gray-900 mb-2">
                Rechazar Solicitud
              </h3>
              <p className="text-gray-500 text-center text-sm mb-6">
                ¿Seguro que deseas denegar el acceso a la tienda <span className="font-semibold text-gray-800">{rejectModal.name}</span>? Esta acción no se puede deshacer.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setRejectModal({ open: false, id: null, name: "" })}
                  className="flex-1 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmReject}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 transition-colors shadow-sm shadow-red-600/20"
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
