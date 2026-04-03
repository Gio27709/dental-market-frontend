import { Link } from "react-router-dom";

export default function DualBanners() {
  return (
    <section className="mb-16">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Banner Izquierdo */}
        <div className="bg-[#f0f2f5] rounded-2xl p-8 md:p-10 flex flex-col md:flex-row items-center md:items-stretch overflow-hidden relative group">
          {/* Texto Left */}
          <div className="flex-1 flex flex-col justify-center relative z-10 w-full md:w-auto text-center md:text-left mb-6 md:mb-0">
            <span className="text-gray-500 font-semibold text-sm mb-3">
              Oferta de Fin de Semana
            </span>
            <h3 className="text-2xl md:text-[28px] font-extrabold text-gray-900 leading-tight mb-6">
              Instrumental <br className="hidden md:block"/> Quirúrgico <br className="hidden md:block"/> hasta 30% OFF
            </h3>
            
            <Link
              to="/catalogo?categoria=instrumental"
              className="inline-flex items-center justify-center md:justify-start gap-2 text-gray-800 font-bold text-sm hover:text-blue-600 transition-colors group/link"
            >
              Comprar Ahora
              <span className="material-symbols-rounded text-base group-hover/link:translate-x-1 transition-transform">
                arrow_forward
              </span>
            </Link>
          </div>
          
          {/* Imagen Right */}
          <div className="w-full md:w-1/2 flex justify-center items-center relative z-0">
            {/* Usamos una imagen genérica odontológica con fondo removido (transparente) idealmente. 
                Aquí usamos una foto dental limpia de Unsplash */}
            <img 
              src="https://images.unsplash.com/photo-1606811841689-23dfddce3e95?q=80&w=400&auto=format&fit=crop" 
              alt="Instrumental Quirúrgico" 
              className="w-48 h-48 md:w-56 md:h-56 object-cover rounded-full mix-blend-multiply group-hover:scale-105 transition-transform duration-500 shadow-xl border-4 border-white"
            />
          </div>
        </div>

        {/* Banner Derecho */}
        <div className="bg-[#f0f2f5] rounded-2xl p-8 md:p-10 flex flex-col md:flex-row items-center md:items-stretch overflow-hidden relative group">
          {/* Texto Left */}
          <div className="flex-1 flex flex-col justify-center relative z-10 w-full md:w-auto text-center md:text-left mb-6 md:mb-0">
            <span className="text-gray-500 font-semibold text-sm mb-3">
              Stock Limitado
            </span>
            <h3 className="text-2xl md:text-[28px] font-extrabold text-gray-900 leading-tight mb-6">
              Resinas y <br className="hidden md:block"/> Adhesivos <br className="hidden md:block"/> al mejor precio
            </h3>
            
            <Link
              to="/catalogo?categoria=biomateriales"
              className="inline-flex items-center justify-center md:justify-start gap-2 text-gray-800 font-bold text-sm hover:text-blue-600 transition-colors group/link"
            >
              Ver Catálogo
              <span className="material-symbols-rounded text-base group-hover/link:translate-x-1 transition-transform">
                arrow_forward
              </span>
            </Link>
          </div>
          
          {/* Imagen Right */}
          <div className="w-full md:w-1/2 flex justify-center items-center relative z-0">
            <img 
              src="https://images.unsplash.com/photo-1599427303058-f04cb25e3650?q=80&w=400&auto=format&fit=crop" 
              alt="Resinas y Adhesivos" 
              className="w-48 h-48 md:w-56 md:h-56 object-cover rounded-full mix-blend-multiply group-hover:scale-105 transition-transform duration-500 shadow-xl border-4 border-white"
            />
          </div>
        </div>

      </div>
    </section>
  );
}
