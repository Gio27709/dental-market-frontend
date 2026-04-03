import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../services/api";
import ProductCard from "../components/ProductCard";

export default function StorePublicProfile() {
  const { id } = useParams();
  const [storeData, setStoreData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStore = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/profiles/store/${id}`);
        setStoreData(res.data.data);
      } catch (err) {
        setError("Al parecer esta tienda no existe o fue deshabilitada.");
      } finally {
        setLoading(false);
      }
    };
    fetchStore();
  }, [id]);

  if (loading) {
    return (
      <div className="bg-[#f9f9ff] min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#c3ff00] border-t-[#6b1e96] rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !storeData?.store) {
    return (
      <div className="bg-[#f9f9ff] min-h-screen flex items-center justify-center p-6 text-center">
         <div className="max-w-md bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
             <span className="material-symbols-outlined text-[64px] text-gray-300 mb-4">store_off</span>
             <h2 className="text-2xl font-bold text-gray-900 mb-2">Tienda no encontrada</h2>
             <p className="text-gray-500 mb-6">{error}</p>
             <Link to="/" className="bg-[#6b1e96] text-white px-6 py-2.5 rounded-xl font-bold">Volver al inicio</Link>
         </div>
      </div>
    );
  }

  const { store, stats, products } = storeData;
  // If they don't have a cover/logo we can put placeholders
  const coverUrl = store.banner_url || "https://images.unsplash.com/photo-1606811841689-23dfddce3e95?q=80&w=2000&auto=format&fit=crop";
  const logoUrl = store.logo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(store.business_name)}&background=c3ff00&color=6b1e96&size=150`;
  const joinDate = new Date(store.created_at).toLocaleDateString();

  return (
    <div className="bg-[#f9f9ff] min-h-screen pb-20 font-sans">
      {/* Cover Photo */}
      <div className="relative h-64 md:h-80 w-full overflow-hidden bg-gray-200">
        <img src={coverUrl} alt="Cover" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#160a22]/80 to-transparent"></div>
      </div>

      {/* Profile Header Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative -mt-16 sm:-mt-24">
        <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-[0_20px_40px_rgba(25,28,32,0.06)] flex flex-col md:flex-row gap-6 items-start md:items-center relative z-10 border border-gray-100">
          
          {/* Logo */}
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-white shadow-lg overflow-hidden flex-shrink-0 bg-white relative">
            <img src={logoUrl} alt={store.business_name} className="w-full h-full object-cover" />
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                   <h1 className="text-3xl md:text-3xl font-bold text-[#6b1e96] font-['Manrope'] pr-2">{store.business_name}</h1>
                   {store.is_verified && (
                     <span className="bg-[#c3ff00]/20 text-[#557300] text-xs font-bold px-2 py-1 flex items-center gap-1 rounded uppercase tracking-wider border border-[#c3ff00]/50">
                        <span className="material-symbols-outlined text-[14px]">verified</span>
                        Oficial
                     </span>
                   )}
                </div>
                
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mt-2 font-['Inter']">
                  <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">pin_drop</span> Venezuela</span>
                  <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">calendar_today</span> Se unió el {joinDate}</span>
                </div>
              </div>

              {/* Action Button */}
              <Link to={`/categories?store=${id}`} className="bg-[#c3ff00] text-[#4d6600] px-6 py-2.5 rounded-xl font-bold shadow-sm hover:shadow-md transition flex items-center gap-2 whitespace-nowrap">
                Ver Catálogo
              </Link>
            </div>

            <p className="mt-4 text-gray-600 max-w-2xl leading-relaxed text-sm">
              {store.description || "Nuestra tienda oficial en Dental Market Vzla. Aquí encontrarás todos nuestros productos asegurando máxima calidad e inmediatez."}
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="w-12 h-12 bg-[#6b1e96]/10 rounded-full flex items-center justify-center text-[#6b1e96]">
              <span className="material-symbols-outlined text-[24px]">inventory_2</span>
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Inventario Activo</p>
              <p className="text-2xl font-bold text-[#6b1e96]">{stats.productCount} <span className="text-sm font-normal text-gray-400">productos</span></p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="w-12 h-12 bg-[#c3ff00]/20 rounded-full flex items-center justify-center text-[#557300]">
              <span className="material-symbols-outlined text-[24px]">star_rate</span>
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Reputación Global</p>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold text-[#6b1e96]">{stats.globalRating.toFixed(1)}</p>
                <div className="flex text-[#facc15]">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className={`material-symbols-outlined text-[20px] ${i < Math.round(stats.globalRating) ? 'text-[#facc15]' : 'text-gray-200'}`}>star</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center text-purple-600">
               <span className="material-symbols-outlined text-[24px]">forum</span>
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Reseñas Históricas</p>
              <p className="text-2xl font-bold text-[#6b1e96]">{stats.totalReviews} <span className="text-sm font-normal text-gray-400">interacciones</span></p>
            </div>
          </div>
        </div>

        {/* Dynamic Content Sections */}
        <div className="mt-12">
          
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-[#160a22] font-['Manrope']">Conoce nuestra Vitrina</h2>
            <Link to={`/categories?store=${id}`} className="text-[#6b1e96] text-sm font-semibold hover:underline">
              Visitar Filtros de Tienda
            </Link>
          </div>
          
          {products.length === 0 ? (
             <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                <span className="material-symbols-outlined text-gray-300 text-[64px] mb-4">box</span>
                <p className="text-gray-500 font-medium text-lg">Esta tienda aún no tiene productos públicos.</p>
             </div>
          ) : (
             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {products.map(prod => (
                   <ProductCard key={prod.id} product={prod} />
                ))}
             </div>
          )}

        </div>
      </div>
    </div>
  );
}
