import { useState, useEffect } from "react";
import api from "../../services/api";
import toast from "react-hot-toast";

export default function PlatformSettings() {
  const [allowOpenReviews, setAllowOpenReviews] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/admin/settings");
      // The settings endpoint returns a hashmap from key to value
      const communityValue = data.data?.allow_open_reviews;
      if (communityValue !== undefined) {
        setAllowOpenReviews(communityValue.enabled !== false); // true por defecto
      }
    } catch (error) {
      toast.error("Error al cargar las configuraciones del sitio.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleReviews = async () => {
    const newValue = !allowOpenReviews;
    setAllowOpenReviews(newValue); // Optimistic UI update

    try {
      setSaving(true);
      await api.put("/admin/settings/community", { allow_open_reviews: newValue });
      toast.success(`Reseñas ${newValue ? "Públicas" : "Solo Compras Verificadas"} configuradas exitosamente.`);
    } catch (error) {
      setAllowOpenReviews(!newValue); // Rollback on error
      toast.error("Hubo un problema actualizando la configuración.");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-10 h-10 border-4 border-[#c3ff00] border-t-[#6b1e96] rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 max-w-4xl mx-auto overflow-hidden">
      
      {/* Header */}
      <div className="bg-[#6b1e96] p-8 text-white relative overflow-hidden">
         <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
         <h1 className="text-3xl font-bold font-['Manrope'] mb-2 relative z-10">Configuraciones del Sitio</h1>
         <p className="text-purple-200 text-sm max-w-2xl relative z-10 leading-relaxed">
            Administra las reglas maestras de DentalMarket. Estos ajustes aplican globalmente e inmediatamente a todas las tiendas y todos los productos de la plataforma.
         </p>
      </div>

      <div className="p-8 space-y-8">

        {/* Community & Reviews Block */}
        <div className="border border-gray-200 rounded-2xl p-6 md:p-8 bg-gray-50/50 shadow-sm relative transition-all hover:border-[#6b1e96]/30 hover:shadow-md group">
          
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                 <div className="w-10 h-10 rounded-full bg-purple-100 text-[#6b1e96] flex items-center justify-center">
                    <span className="material-symbols-outlined text-[20px]">social_leaderboard</span>
                 </div>
                 <h2 className="text-xl font-bold text-gray-900 font-['Manrope']">Reseñas y Comunidad</h2>
              </div>
              
                 <p className="text-gray-600 text-[15px] leading-relaxed mb-6 max-w-xl">
                 Controla quién tiene permitido calificar los productos del catálogo. Al desactivarlo, el sistema entra en modo <strong>&quot;Compra Verificada&quot;</strong> bloqueando la caja de reseñas para aquellos usuarios que no posean una orden pagada con el producto a calificar.
              </p>

              <div className="flex flex-col gap-3">
                 <div className={`flex items-start gap-3 p-4 rounded-xl border ${allowOpenReviews ? 'bg-purple-50 border-purple-200' : 'bg-gray-100 text-gray-400 border-gray-200'}`}>
                    <span className={`material-symbols-outlined mt-0.5 ${allowOpenReviews ? 'text-[#6b1e96]' : 'text-gray-400'}`}>public</span>
                    <div>
                       <strong className={`block text-[15px] ${allowOpenReviews ? 'text-[#6b1e96]' : 'text-gray-500'}`}>Modo Libre (Cualquier Usuario)</strong>
                       <span className="text-sm">Todo usuario registrado en DentalMarket puede reseñar cualquier producto y afecta su global.</span>
                    </div>
                 </div>

                 <div className={`flex items-start gap-3 p-4 rounded-xl border ${!allowOpenReviews ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-100 text-gray-400 border-gray-200'}`}>
                    <span className={`material-symbols-outlined mt-0.5 ${!allowOpenReviews ? 'text-yellow-600' : 'text-gray-400'}`}>verified_user</span>
                    <div>
                       <strong className={`block text-[15px] ${!allowOpenReviews ? 'text-yellow-700' : 'text-gray-500'}`}>Compras Verificadas (Solo Clientes)</strong>
                       <span className="text-sm">Tu plataforma protege las reseñas. Nadie puede opinar si no consumió el producto realmente.</span>
                    </div>
                 </div>
              </div>

            </div>

            {/* Premium Toggle Switch */}
            <div className="flex flex-col items-end pt-2">
              <button 
                onClick={handleToggleReviews}
                disabled={saving}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#c3ff00] focus:ring-offset-2 ${saving ? 'opacity-50 cursor-not-allowed' : ''} ${allowOpenReviews ? 'bg-[#c3ff00]' : 'bg-gray-300'}`}
                aria-pressed={allowOpenReviews}
              >
                <span className="sr-only">Habilitar reseñas libres</span>
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform duration-300 shadow-sm ${
                    allowOpenReviews ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className={`mt-3 text-sm font-bold tracking-wide uppercase ${allowOpenReviews ? 'text-[#557300]' : 'text-gray-500'}`}>
                 {allowOpenReviews ? 'Activado' : 'Apagado'}
              </span>
            </div>

          </div>
        </div>

        {/* Future Config Blocks can go here */}

      </div>
    </div>
  );
}
