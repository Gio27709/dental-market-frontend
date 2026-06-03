import { Link } from "react-router-dom";
import useHomeSections from "../../hooks/useHomeSections";

export default function PromoBanners() {
  const { sections } = useHomeSections();
  const data = sections?.promo_banners || {};
  
  const fbBanners = [
    {
      heading: "Máxima Precisión en tu Diagnóstico",
      description: "Ahorra en Lámparas y Rayos X",
      button_text: "Ver Equipos",
      button_link: "#",
      button_color: "sky",
      image_url: "https://lh3.googleusercontent.com/aida-public/AB6AXuDaJxh1hFdM6F_e7p3FeWpFv4RdSlgJIFmDg_6pye6AUPQQ1tUWtpZc0hUxw3HCVlnvvfiOs6kB4Y6-DiJjQLny1aNBuPEvM9CE1OInGtUE0_vtc1YjLWsIh4RDKZfcJ1v0NNf4yp9sAqDdyvRYA8CJFGrZo4z1VlG8Y30C3ttU__zbdvXIX6WnlWN3xtj-9rUj3LWulKthjZeiiM_lH_tqvl-um1logSM5yzvcgDevqLoThxlxj2cGlM5hRFQHGl1JR1u141g7oGlM",
      bg_color: "gray-100"
    },
    {
      heading: "Renueva tu instrumental con calidad superior",
      description: "Oferta Exclusiva:",
      discount_text: "25% OFF",
      discount_subtext: "por Tiempo Limitado!",
      button_text: "Comprar Ahora",
      button_link: "#",
      button_color: "primary",
      image_url: "https://lh3.googleusercontent.com/aida-public/AB6AXuBzaKjUsh3B6SHPAwVsAw59F69nHKwoMdkKQRjLmcmEjujGLQwJqw_jWkLWBluTXVMO0tn36MJ9flYIGRhDmUHtPLeWak4KKuQOKAWXroAEx6zt9Aa0Ei9TSGAw_aihHpm0blw0xzArEOT_vpgkFMP14efKHHruXkK4Xj6nmPNAoCakLKOYfuJQXwsNc3n5qGnRfp9Y4a5ZEAz_kHpz7GHLqu1kSbaccaEihg1xicFtRlWzSlOA_tYJfqQQIKzGwkVZmKGvqnCy2HMG",
      bg_color: "#f0f2f5"
    },
    {
      heading: "Máxima Protección para tu equipo",
      description: "Insumos Quirúrgicos",
      button_text: "Ver Insumos",
      button_link: "#",
      button_color: "sky",
      image_url: "https://lh3.googleusercontent.com/aida-public/AB6AXuCRFxzgnhHYHAnEQVzwbhIzTuE0jFCkUi-q9uUZS8zvyoVG1N9yTxGmXU1FZPitPno168C8RqMLHi5iqbz4ua0RcaNmv3rKVD-DWSE73rFa3-t9ElZTwQvojOVltYIx2C4MayHar5-fioH5DMO_TM3dK4X-pEvFuEk5kUyNfXH0tw3ZmeiLehC05uFv0at8G2F-Q_Epj4-65KBnmIwZSnoJZQcaanG6d_ovO7BbV8NoggcLuWyzQTGSnzuNFPJcuNWjxAqSh7K5NIq5",
      bg_color: "gray-100"
    }
  ];

  const banners = data.banners && data.banners.length >= 3 ? data.banners : fbBanners;
  const b1 = banners[0];
  const b2 = banners[1];
  const b3 = banners[2];

  const getBgStyle = (colorStr) => {
     if (!colorStr || typeof colorStr !== 'string') return {};
     if (colorStr.startsWith('#')) return { backgroundColor: colorStr };
     return {}; // fall back to css class si falla o es string tailwind
  };

  const getBgClass = (colorStr) => {
     if (!colorStr || typeof colorStr !== 'string') return 'bg-gray-100'; 
     if (colorStr.startsWith('#')) return ''; 
     if (colorStr === 'gray-100') return 'bg-gray-100';
     if (colorStr === 'gray-50') return 'bg-gray-50';
     if (colorStr === 'primary-50') return 'bg-primary-50';
     return `bg-${colorStr}`; 
  };

  return (
    <div className="mb-16 grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-6">
      
      {/* Banner 1: Izquierdo (25% en lg) */}
      <div 
         className={`lg:col-span-1 rounded-2xl p-6 md:p-8 flex items-center justify-between relative overflow-hidden group ${getBgClass(b1.bg_color)}`}
         style={getBgStyle(b1.bg_color)}
      >
        <div className="relative z-10 w-[60%] lg:w-[100%] xl:w-[60%]">
          <h3 className="text-lg md:text-xl font-bold text-gray-900 leading-tight mb-2">
            {b1.heading}
          </h3>
          <p className="text-gray-500 text-sm mb-4 leading-snug">
            {b1.description}
          </p>
          <Link
            to={b1.button_link}
            className={`inline-block text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors ${b1.button_color === 'primary' ? 'bg-primary-600 hover:bg-primary-700' : 'bg-sky-600 hover:bg-sky-700'}`}
          >
            {b1.button_text}
          </Link>
        </div>
        <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-[45%] h-full flex items-center justify-end pointer-events-none group-hover:scale-105 transition-transform duration-500">
          <img 
            src={b1.image_url} 
            alt={b1.heading} 
            className="w-full h-auto object-contain drop-shadow-md mix-blend-multiply"
          />
        </div>
      </div>

      {/* Banner 2: Central (50% en lg) */}
      <div 
         className={`lg:col-span-2 rounded-2xl p-6 md:p-8 flex items-center justify-between relative overflow-hidden group ${getBgClass(b2.bg_color)}`}
         style={getBgStyle(b2.bg_color)}
      >
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: "radial-gradient(#000 1px, transparent 1px)", backgroundSize: "20px 20px" }}></div>
        
        <div className="relative z-10 w-[55%] sm:w-[60%]">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-gray-900 leading-[1.1] mb-2 drop-shadow-sm break-words">
            {b2.heading}
          </h2>
          <p className="text-gray-600 text-sm md:text-lg mb-4 mt-2 leading-tight">
            {b2.description} {b2.discount_text && <span className="text-rose-600 font-black text-xl sm:text-2xl ml-1">{b2.discount_text}</span>} <br className="hidden sm:block" />
            {b2.discount_subtext && <span className="text-xs md:text-sm font-medium">{b2.discount_subtext}</span>}
          </p>
          <Link
            to={b2.button_link}
            className={`inline-block text-white text-sm font-bold px-6 py-2.5 rounded-lg transition-colors shadow-sm ${b2.button_color === 'sky' ? 'bg-sky-600 hover:bg-sky-700' : 'bg-primary-600 hover:bg-primary-700'}`}
          >
            {b2.button_text}
          </Link>
        </div>
        <div className="absolute right-0 md:right-4 top-1/2 -translate-y-1/2 w-[45%] md:w-[40%] h-[120%] flex items-center justify-center pointer-events-none group-hover:-translate-y-1/2 group-hover:scale-110 transition-transform duration-700">
          <img 
            src={b2.image_url} 
            alt={b2.heading} 
            className="max-w-full max-h-[85%] object-contain drop-shadow-2xl mix-blend-multiply"
          />
        </div>
      </div>

      {/* Banner 3: Derecho (25% en lg) */}
      <div 
         className={`lg:col-span-1 rounded-2xl p-6 md:p-8 flex items-center justify-between relative overflow-hidden group ${getBgClass(b3.bg_color)}`}
         style={getBgStyle(b3.bg_color)}
      >
        <div className="relative z-10 w-[60%] lg:w-[100%] xl:w-[60%]">
          <h3 className="text-lg md:text-xl font-bold text-gray-900 leading-tight mb-2">
            {b3.heading}
          </h3>
          <p className="text-gray-500 text-sm mb-4 leading-snug">
            {b3.description}
          </p>
          <Link
            to={b3.button_link}
            className={`inline-block text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors ${b3.button_color === 'primary' ? 'bg-primary-600 hover:bg-primary-700' : 'bg-sky-600 hover:bg-sky-700'}`}
          >
            {b3.button_text}
          </Link>
        </div>
        <div className="absolute -right-4 top-1/2 -translate-y-1/2 w-[50%] h-full flex items-center justify-end pointer-events-none group-hover:scale-105 group-hover:-translate-x-2 transition-transform duration-500">
          <img 
            src={b3.image_url} 
            alt={b3.heading} 
            className="w-full h-auto object-contain drop-shadow-md mix-blend-multiply"
          />
        </div>
      </div>

    </div>
  );
}
