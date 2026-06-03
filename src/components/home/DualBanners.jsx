import { Link } from "react-router-dom";
import useHomeSections from "../../hooks/useHomeSections";

export default function DualBanners() {
  const { sections } = useHomeSections();
  const data = sections?.dual_banners || {};
  const fallbacks = [
    {
      badge: "Oferta de Fin de Semana",
      heading: "Instrumental Quirúrgico hasta 30% OFF",
      button_text: "Comprar Ahora",
      button_link: "/catalogo?categoria=instrumental",
      image_url: "https://images.unsplash.com/photo-1606811841689-23dfddce3e95?q=80&w=400&auto=format&fit=crop"
    },
    {
      badge: "Stock Limitado",
      heading: "Resinas y Adhesivos al mejor precio",
      button_text: "Ver Catálogo",
      button_link: "/catalogo?categoria=biomateriales",
      image_url: "https://images.unsplash.com/photo-1599427303058-f04cb25e3650?q=80&w=400&auto=format&fit=crop"
    }
  ];
  
  const banners = data.banners && data.banners.length >= 2 ? data.banners : fallbacks;
  const b1 = banners[0];
  const b2 = banners[1];

  return (
    <section className="mb-16">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Banner Izquierdo */}
        <div className="bg-[#f0f2f5] rounded-2xl p-8 md:p-10 flex flex-col md:flex-row items-center md:items-stretch overflow-hidden relative group">
          {/* Texto Left */}
          <div className="flex-1 flex flex-col justify-center relative z-10 w-full md:w-auto text-center md:text-left mb-6 md:mb-0">
            <span className="text-gray-500 font-semibold text-sm mb-3">
              {b1.badge}
            </span>
            <h3 className="text-2xl md:text-[28px] font-extrabold text-gray-900 leading-tight mb-6 break-words">
              {b1.heading}
            </h3>
            
            <Link
              to={b1.button_link}
              className="inline-flex items-center justify-center md:justify-start gap-2 text-gray-800 font-bold text-sm hover:text-purple-600 transition-colors group/link"
            >
              {b1.button_text}
              <span className="material-symbols-outlined text-base group-hover/link:translate-x-1 transition-transform">
                arrow_forward
              </span>
            </Link>
          </div>
          
          {/* Imagen Right */}
          <div className="w-full md:w-1/2 flex justify-center items-center relative z-0">
            <img 
              src={b1.image_url} 
              alt={b1.badge} 
              className="w-48 h-48 md:w-56 md:h-56 object-cover rounded-full mix-blend-multiply group-hover:scale-105 transition-transform duration-500 shadow-xl border-4 border-white"
            />
          </div>
        </div>

        {/* Banner Derecho */}
        <div className="bg-[#f0f2f5] rounded-2xl p-8 md:p-10 flex flex-col md:flex-row items-center md:items-stretch overflow-hidden relative group">
          {/* Texto Left */}
          <div className="flex-1 flex flex-col justify-center relative z-10 w-full md:w-auto text-center md:text-left mb-6 md:mb-0">
            <span className="text-gray-500 font-semibold text-sm mb-3">
              {b2.badge}
            </span>
            <h3 className="text-2xl md:text-[28px] font-extrabold text-gray-900 leading-tight mb-6 break-words">
              {b2.heading}
            </h3>
            
            <Link
              to={b2.button_link}
              className="inline-flex items-center justify-center md:justify-start gap-2 text-gray-800 font-bold text-sm hover:text-purple-600 transition-colors group/link"
            >
              {b2.button_text}
              <span className="material-symbols-outlined text-base group-hover/link:translate-x-1 transition-transform">
                arrow_forward
              </span>
            </Link>
          </div>
          
          {/* Imagen Right */}
          <div className="w-full md:w-1/2 flex justify-center items-center relative z-0">
            <img 
              src={b2.image_url} 
              alt={b2.badge}
              className="w-48 h-48 md:w-56 md:h-56 object-cover rounded-full mix-blend-multiply group-hover:scale-105 transition-transform duration-500 shadow-xl border-4 border-white"
            />
          </div>
        </div>

      </div>
    </section>
  );
}
