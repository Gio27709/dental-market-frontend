import { Link } from "react-router-dom";

export default function PromoBanners() {
  return (
    <div className="mb-16 grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-6">
      
      {/* Banner 1: Izquierdo (25% en lg) */}
      <div className="lg:col-span-1 bg-gray-100 rounded-2xl p-6 md:p-8 flex items-center justify-between relative overflow-hidden group">
        <div className="relative z-10 w-[60%] lg:w-[100%] xl:w-[60%]">
          <h3 className="text-lg md:text-xl font-bold text-gray-900 leading-tight mb-2">
            Máxima Precisión en tu Diagnóstico
          </h3>
          <p className="text-gray-500 text-sm mb-4 leading-snug">
            Ahorra en Lámparas y Rayos X
          </p>
          <Link
            to="#"
            className="inline-block bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors"
          >
            Ver Equipos
          </Link>
        </div>
        {/* Mockup Image - Lámpara / Rx */}
        <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-[45%] h-full flex items-center justify-end pointer-events-none group-hover:scale-105 transition-transform duration-500">
          <img 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDaJxh1hFdM6F_e7p3FeWpFv4RdSlgJIFmDg_6pye6AUPQQ1tUWtpZc0hUxw3HCVlnvvfiOs6kB4Y6-DiJjQLny1aNBuPEvM9CE1OInGtUE0_vtc1YjLWsIh4RDKZfcJ1v0NNf4yp9sAqDdyvRYA8CJFGrZo4z1VlG8Y30C3ttU__zbdvXIX6WnlWN3xtj-9rUj3LWulKthjZeiiM_lH_tqvl-um1logSM5yzvcgDevqLoThxlxj2cGlM5hRFQHGl1JR1u141g7oGlM" 
            alt="Equipos de diagnóstico" 
            className="w-full h-auto object-contain drop-shadow-md mix-blend-multiply"
          />
        </div>
      </div>

      {/* Banner 2: Central (50% en lg) */}
      <div className="lg:col-span-2 bg-[#f0f2f5] rounded-2xl p-6 md:p-8 flex items-center justify-between relative overflow-hidden group">
        {/* Patrón decorativo de fondo opcional */}
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: "radial-gradient(#000 1px, transparent 1px)", backgroundSize: "20px 20px" }}></div>
        
        <div className="relative z-10 w-[55%] sm:w-[60%]">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-gray-900 leading-[1.1] mb-2 drop-shadow-sm">
            Renueva tu instrumental con calidad superior
          </h2>
          <p className="text-gray-600 text-sm md:text-lg mb-4 mt-2 leading-tight">
            Oferta Exclusiva: <span className="text-rose-600 font-black text-xl sm:text-2xl ml-1">25% OFF</span> <br className="hidden sm:block" />
            <span className="text-xs md:text-sm font-medium">por Tiempo Limitado!</span>
          </p>
          <Link
            to="#"
            className="inline-block bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold px-6 py-2.5 rounded-lg transition-colors shadow-sm"
          >
            Comprar Ahora
          </Link>
        </div>
        {/* Mockup Image - Instrumental / Turbinas */}
        <div className="absolute right-0 md:right-4 top-1/2 -translate-y-1/2 w-[45%] md:w-[40%] h-[120%] flex items-center justify-center pointer-events-none group-hover:-translate-y-1/2 group-hover:scale-110 transition-transform duration-700">
          <img 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBzaKjUsh3B6SHPAwVsAw59F69nHKwoMdkKQRjLmcmEjujGLQwJqw_jWkLWBluTXVMO0tn36MJ9flYIGRhDmUHtPLeWak4KKuQOKAWXroAEx6zt9Aa0Ei9TSGAw_aihHpm0blw0xzArEOT_vpgkFMP14efKHHruXkK4Xj6nmPNAoCakLKOYfuJQXwsNc3n5qGnRfp9Y4a5ZEAz_kHpz7GHLqu1kSbaccaEihg1xicFtRlWzSlOA_tYJfqQQIKzGwkVZmKGvqnCy2HMG" 
            alt="Instrumental Dental" 
            className="max-w-full max-h-[85%] object-contain drop-shadow-2xl mix-blend-multiply"
          />
        </div>
      </div>

      {/* Banner 3: Derecho (25% en lg) */}
      <div className="lg:col-span-1 bg-gray-100 rounded-2xl p-6 md:p-8 flex items-center justify-between relative overflow-hidden group">
        <div className="relative z-10 w-[60%] lg:w-[100%] xl:w-[60%]">
          <h3 className="text-lg md:text-xl font-bold text-gray-900 leading-tight mb-2">
            Máxima Protección para tu equipo
          </h3>
          <p className="text-gray-500 text-sm mb-4 leading-snug">
            Insumos Quirúrgicos
          </p>
          <Link
            to="#"
            className="inline-block bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors"
          >
            Ver Insumos
          </Link>
        </div>
        {/* Mockup Image - Guantes */}
        <div className="absolute -right-4 top-1/2 -translate-y-1/2 w-[50%] h-full flex items-center justify-end pointer-events-none group-hover:scale-105 group-hover:-translate-x-2 transition-transform duration-500">
          <img 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCRFxzgnhHYHAnEQVzwbhIzTuE0jFCkUi-q9uUZS8zvyoVG1N9yTxGmXU1FZPitPno168C8RqMLHi5iqbz4ua0RcaNmv3rKVD-DWSE73rFa3-t9ElZTwQvojOVltYIx2C4MayHar5-fioH5DMO_TM3dK4X-pEvFuEk5kUyNfXH0tw3ZmeiLehC05uFv0at8G2F-Q_Epj4-65KBnmIwZSnoJZQcaanG6d_ovO7BbV8NoggcLuWyzQTGSnzuNFPJcuNWjxAqSh7K5NIq5" 
            alt="Insumos Odontológicos" 
            className="w-full h-auto object-contain drop-shadow-md mix-blend-multiply"
          />
        </div>
      </div>

    </div>
  );
}
