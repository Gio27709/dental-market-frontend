import { useAuth } from "../context/AuthContext";
import { useState, useEffect } from "react";
import { getStoreProfile } from "../services/api";

export default function Account() {
  const { user } = useAuth();
  const [storeProfile, setStoreProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  useEffect(() => {
    if (user?.role === "store" || user?.role === "owner") {
      fetchStoreProfile();
    }
  }, [user]);

  if (!user) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const fetchStoreProfile = async () => {
    try {
      setLoadingProfile(true);
      const res = await getStoreProfile();
      setStoreProfile(res.data?.data);
    } catch (err) {
      console.error("Error al cargar perfil de tienda:", err.message);
    } finally {
      setLoadingProfile(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg overflow-hidden p-6 border border-gray-100">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Información Básica</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 block">
              Correo Electrónico
            </label>
            <div className="bg-gray-50 px-4 py-3 rounded-md border border-gray-100">
              <p className="font-medium text-gray-800">{user.email}</p>
            </div>
          </div>

          <div>
             <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 block">
              Rol en Dental Market
            </label>
            <div className="bg-gray-50 px-4 py-3 rounded-md border border-gray-100">
              <p className="font-medium text-primary-700 capitalize flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary-500"></span>
                {user.role}
              </p>
            </div>
          </div>
          
          <div>
             <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 block">
              Nombre Completo
            </label>
            <div className="bg-gray-50 px-4 py-3 rounded-md border border-gray-100 text-gray-500 italic text-sm">
              {user.firstName ? `${user.firstName} ${user.lastName}` : "No configurado"}
            </div>
          </div>
        </div>
      </div>

      {(user?.role === "store" || user?.role === "owner") && (
        <div className="bg-white shadow rounded-lg overflow-hidden p-6 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Información Comercial (Tienda)</h2>
          {loadingProfile ? (
             <div className="animate-pulse flex space-x-4">
               <div className="flex-1 space-y-4 py-1">
                 <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                 <div className="space-y-2">
                   <div className="h-4 bg-gray-200 rounded"></div>
                   <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                 </div>
               </div>
             </div>
          ) : storeProfile ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 block">
                  Razón Social / Nombre Comercial
                </label>
                <div className="bg-gray-50 px-4 py-3 rounded-md border border-gray-100">
                  <p className="font-medium text-gray-800">{storeProfile.business_name || "N/A"}</p>
                </div>
              </div>
              
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 block">
                  RIF
                </label>
                <div className="bg-gray-50 px-4 py-3 rounded-md border border-gray-100">
                  <p className="font-medium text-gray-800">{storeProfile.rif || "N/A"}</p>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 block">
                  Teléfono de Contacto
                </label>
                <div className="bg-gray-50 px-4 py-3 rounded-md border border-gray-100">
                  <p className="font-medium text-gray-800">{storeProfile.business_phone || "N/A"}</p>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 block">
                  Dirección Fiscal
                </label>
                <div className="bg-gray-50 px-4 py-3 rounded-md border border-gray-100">
                  <p className="font-medium text-gray-800">{storeProfile.business_address || "N/A"}</p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-sm p-4 bg-gray-50 rounded-lg text-center">No se pudieron cargar los datos comerciales.</p>
          )}
        </div>
      )}
    </div>
  );
}
