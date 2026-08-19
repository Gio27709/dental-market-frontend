import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getPromotionsAPI, getPromotionByIdAPI } from "../services/api";
import ProductCard from "../components/ProductCard";
import LoadingSkeleton from "../components/LoadingSkeleton";

export default function Promotions() {
  const [promotions, setPromotions] = useState([]);
  const [activePromo, setActivePromo] = useState(null);
  const [promoProducts, setPromoProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [timeLeft, setTimeLeft] = useState("");

  // Fetch all promotions
  useEffect(() => {
    const fetchPromotions = async () => {
      try {
        setLoading(true);
        const { data } = await getPromotionsAPI();
        const promos = data.data || [];
        setPromotions(promos);
        // Auto-select first promotion
        if (promos.length > 0) {
          loadPromotionProducts(promos[0].id);
          setActivePromo(promos[0]);
        }
      } catch (err) {
        console.error("Error loading promotions:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPromotions();
  }, []);

  const loadPromotionProducts = async (promoId) => {
    try {
      setLoadingProducts(true);
      const { data } = await getPromotionByIdAPI(promoId);
      setPromoProducts(data.data?.products || []);
    } catch (err) {
      console.error("Error loading promotion products:", err);
      setPromoProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleSelectPromo = (promo) => {
    setActivePromo(promo);
    loadPromotionProducts(promo.id);
  };

  // Ticking Countdown Effect
  useEffect(() => {
    if (!activePromo?.ends_at) {
      setTimeLeft("");
      return;
    }

    const updateTimer = () => {
      const diff = new Date(activePromo.ends_at) - new Date();
      if (diff <= 0) {
        setTimeLeft("Finalizado");
        return;
      }
      const days = Math.floor(diff / 86400000);
      const hours = Math.floor((diff % 86400000) / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);

      if (days > 0) {
        setTimeLeft(`${days}d ${hours}h ${minutes}m`);
      } else {
        const pad = (n) => String(n).padStart(2, "0");
        setTimeLeft(`${pad(hours)}:${pad(minutes)}:${pad(seconds)}`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [activePromo]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50/50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#6b1e96] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500 font-medium animate-pulse">Cargando promociones...</p>
        </div>
      </div>
    );
  }

  if (promotions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50/50">
        <div className="text-center max-w-md px-6 relative">
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-40 h-40 bg-[#6b1e96]/5 rounded-full blur-2xl pointer-events-none" />
          <span className="material-symbols-outlined text-slate-300 mb-4" style={{ fontSize: "64px" }}>
            campaign
          </span>
          <h2 className="text-2xl font-black text-slate-800 mb-3">No hay promociones activas</h2>
          <p className="text-slate-500 mb-6 font-medium">
            Vuelve pronto, las tiendas del marketplace están preparando ofertas increíbles para ti.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#6b1e96] hover:bg-[#531575] active:bg-[#43105e] text-white font-bold rounded-xl shadow-md shadow-[#6b1e96]/15 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]"
          >
            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>home</span>
            Volver al Inicio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/40 pb-12">
      {/* Hero Section */}
      {activePromo && (
        <div
          className="relative overflow-hidden border-b border-slate-200/10 shadow-inner"
          style={{
            background: "linear-gradient(135deg, #10061e 0%, #3e125c 40%, #6b1e96 75%, #8b25cd 100%)",
          }}
        >
          {/* Glowing Animated Orbs */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-[#c3ff00]/10 blur-[100px] animate-pulse duration-[6000ms]" />
            <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] rounded-full bg-pink-500/10 blur-[120px] animate-pulse duration-[8000ms]" />
            <div className="absolute top-1/2 left-1/3 w-[300px] h-[300px] rounded-full bg-[#6b1e96]/30 blur-[80px]" />
          </div>

          {/* Grid pattern overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,white,transparent_80%)] opacity-40" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-20 md:py-24 relative z-10">
            <div className="text-center max-w-3xl mx-auto">
              {activePromo.badge_text && (
                <span
                  className="inline-flex items-center gap-1.5 px-4.5 py-1.5 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-widest mb-6 shadow-xl border border-white/10 text-white"
                  style={{
                    background: `linear-gradient(135deg, ${activePromo.badge_color || '#ef4444'} 0%, ${activePromo.badge_color ? activePromo.badge_color + 'dd' : '#f43f5e'} 100%)`,
                    boxShadow: `0 0 20px ${(activePromo.badge_color || '#ef4444')}33`
                  }}
                >
                  <span className="material-symbols-outlined animate-pulse text-[14px]">local_fire_department</span>
                  {activePromo.badge_text}
                </span>
              )}
              
              <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white mb-6 leading-tight tracking-tight drop-shadow-md break-words">
                {activePromo.title}
              </h1>
              
              {activePromo.subtitle && (
                <p className="text-base sm:text-lg md:text-xl text-slate-200/90 max-w-2xl mx-auto mb-8 font-medium leading-relaxed">
                  {activePromo.subtitle}
                </p>
              )}
              
              {activePromo.ends_at && timeLeft && (
                <div className="inline-flex items-center gap-3 px-5 py-2.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-xl transition-all duration-300 hover:scale-105 hover:bg-white/15">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                  <span className="material-symbols-outlined text-emerald-400 text-lg">timer</span>
                  <span className="text-white font-bold text-xs sm:text-sm tracking-wider uppercase">
                    Termina en: <span className="text-[#c3ff00] font-black tracking-normal ml-1">{timeLeft}</span>
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        {/* Promotion Tabs */}
        {promotions.length > 1 && (
          <div className="flex gap-3 mb-10 overflow-x-auto pb-3 pt-1 scrollbar-thin scrollbar-thumb-slate-200">
            {promotions.map((promo) => {
              const isActive = activePromo?.id === promo.id;
              return (
                <button
                  key={promo.id}
                  onClick={() => handleSelectPromo(promo)}
                  className={`px-6 py-3 rounded-2xl text-sm font-extrabold whitespace-nowrap transition-all duration-300 flex items-center gap-2 border hover:scale-[1.02] cursor-pointer ${
                    isActive
                      ? "bg-gradient-to-r from-[#6b1e96] to-[#8b25cd] text-white border-transparent shadow-lg shadow-[#6b1e96]/20"
                      : "bg-white text-slate-600 border-slate-200 hover:border-[#6b1e96]/35 hover:text-[#6b1e96] shadow-sm"
                  }`}
                >
                  <span className={`material-symbols-outlined text-[18px] ${isActive ? "text-white" : "text-[#6b1e96]"}`}>
                    campaign
                  </span>
                  {promo.title}
                </button>
              );
            })}
          </div>
        )}

        {/* Products Section Header */}
        {activePromo && !loadingProducts && promoProducts.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span className="material-symbols-outlined text-[#6b1e96]">local_offer</span>
                Ofertas de la Promoción
              </h2>
              <p className="text-slate-500 text-sm mt-0.5">Explora productos seleccionados con descuentos exclusivos</p>
            </div>
            <div className="bg-slate-100/80 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 border border-slate-200/40 w-fit">
              {promoProducts.length} {promoProducts.length === 1 ? 'Producto disponible' : 'Productos disponibles'}
            </div>
          </div>
        )}

        {/* Products Grid */}
        {loadingProducts ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            <LoadingSkeleton variant="product-card" count={8} />
          </div>
        ) : promoProducts.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-3xl border border-slate-150 shadow-sm max-w-xl mx-auto px-6">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100 mx-auto mb-5">
              <span className="material-symbols-outlined text-slate-400 text-3xl">inventory_2</span>
            </div>
            <h3 className="text-lg font-black text-slate-800 mb-2">No hay productos disponibles</h3>
            <p className="text-slate-500 text-sm leading-relaxed max-w-sm mx-auto">
              Esta promoción activa no cuenta con productos asignados por el momento. ¡Vuelve más tarde para ver las novedades!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {promoProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
