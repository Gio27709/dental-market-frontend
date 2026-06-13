import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../services/api";

export default function UserPublicProfile() {
  const { id } = useParams();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/profiles/user/${id}`);
        setUserData(res.data.data);
      } catch {
        setError("Perfil de comprador privado o no encontrado.");
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [id]);

  if (loading) {
    return (
      <div className="bg-[#f9f9ff] min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#c3ff00] border-t-[#6b1e96] rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !userData?.user) {
    return (
      <div className="bg-[#f9f9ff] min-h-screen flex items-center justify-center p-6 text-center">
         <div className="max-w-md bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
             <span className="material-symbols-outlined text-[64px] text-gray-300 mb-4">person_off</span>
             <h2 className="text-2xl font-bold text-gray-900 mb-2">Comprador no encontrado</h2>
             <p className="text-gray-500 mb-6">{error}</p>
             <Link to="/" className="bg-[#6b1e96] text-white px-6 py-2.5 rounded-xl font-bold">Volver al inicio</Link>
         </div>
      </div>
    );
  }

  const { user, stats } = userData;
  const joinDate = new Date(user.joined_at).toLocaleDateString();
  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name)}&background=6b1e96&color=fff&size=150`;

  // Calcular Nivel
  let levelName = "Comprador Frecuente";
  let reputationScore = 100;
  if (stats.totalPurchases > 10) levelName = "Usuario Nivel Plata";
  if (stats.totalPurchases > 30) levelName = "Usuario Nivel Oro";
  if (stats.totalPurchases === 0) {
    levelName = "Usuario Nuevo";
    reputationScore = 0;
  }

  return (
    <div className="bg-[#f9f9ff] min-h-screen py-16 font-sans">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* User Profile Header */}
        <div className="flex flex-col items-center text-center">
          <div className="relative">
            <div className="w-32 h-32 rounded-full overflow-hidden shadow-xl border-4 border-white mb-6">
              <img src={avatarUrl} alt={user.full_name} className="w-full h-full object-cover" />
            </div>
            {/* Badge */}
            <div className="absolute -bottom-2 -right-2 bg-[#c3ff00] text-[#4d6600] w-12 h-12 rounded-full flex items-center justify-center border-4 border-[#f9f9ff] shadow-sm tooltip" title="Comprador Verificado">
              <span className="material-symbols-outlined text-[24px]">verified</span>
            </div>
          </div>
          
          <h1 className="text-3xl md:text-5xl font-bold text-[#160a22] font-['Manrope'] mb-2">
            {user.full_name}
          </h1>
          <p className="text-lg text-[#6b1e96] font-medium tracking-wide">
            {levelName}
          </p>
          <p className="text-sm text-gray-400 mt-2">
            Miembro de Dental Market desde el {joinDate}
          </p>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-12">
          <div className="bg-white rounded-2xl p-6 shadow-[0_10px_30px_rgba(25,28,32,0.03)] border border-gray-100 text-center flex flex-col items-center hover:-translate-y-1 transition-transform">
            <span className="material-symbols-outlined text-[32px] text-gray-300 mb-3">shopping_bag</span>
            <p className="text-3xl font-bold text-[#6b1e96]">{stats.totalPurchases}</p>
            <p className="text-sm text-gray-500 font-medium mt-1">Compras Exitosas</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-[0_10px_30px_rgba(25,28,32,0.03)] border-2 border-[#c3ff00]/40 text-center flex flex-col items-center hover:-translate-y-1 transition-transform relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-[#c3ff00]/10 rounded-bl-full"></div>
            <span className="material-symbols-outlined text-[32px] text-[#557300] mb-3">verified</span>
            <p className="text-3xl font-bold text-[#160a22]">{reputationScore}/100</p>
            <p className="text-sm text-gray-500 font-medium mt-1">Reputación Acumulada</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-[0_10px_30px_rgba(25,28,32,0.03)] border border-gray-100 text-center flex flex-col items-center hover:-translate-y-1 transition-transform">
            <span className="material-symbols-outlined text-[32px] text-purple-200 mb-3">forum</span>
            <p className="text-3xl font-bold text-[#6b1e96]">{stats.totalReviews}</p>
            <p className="text-sm text-gray-500 font-medium mt-1">Reseñas Aportadas</p>
          </div>
        </div>

        <div className="mt-16 text-center">
           <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm text-gray-500">
               <span className="material-symbols-outlined text-[16px]">lock</span>
               <p>El historial exacto de compras e interacciones sociales se mantiene privado por seguridad.</p>
           </div>
        </div>

      </div>
    </div>
  );
}
