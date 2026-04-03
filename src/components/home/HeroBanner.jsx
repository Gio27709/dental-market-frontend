import { Link } from "react-router-dom";

export default function HeroBanner() {
  return (
    <div className="flex flex-col gap-6 w-full mb-12">
      {/* Banner Grande Minimalista */}
      <section className="relative h-[200px] sm:h-[250px] lg:h-[300px] w-full rounded-2xl overflow-hidden shadow-xl bg-gray-900 group">
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
          style={{
            backgroundImage:
              "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCtI6GItYhn0yw19CASJeUkFTR7dbAviFcNGGbDrSa8cgqLHrhQ1g7TpS1zpKvfiIF1rRDYQP-FFkdkwa-O_KvScGvdWlSWV4lI-uqexopEvMAGUGf8ARnSOhfniIjRqnkEhavlz5O1bLhPgFUMej38MA-kQr94BoIdVgr1kOXp9l26siEzK8vsDDX0-36410kgCi7IoJ2MOjzNDS5NE7RQb9uqzO_xFtVnx9JYO_rpjSVTGzjnYPZLTGFb9uDWKlVpuNsKrZsuX3T1')",
          }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-r from-gray-900/80 via-gray-900/40 to-transparent"></div>
        <div className="relative h-full flex flex-col justify-center px-8 lg:px-12 max-w-3xl text-white">
          <span className="inline-block px-3 py-1 rounded-full bg-primary-500/20 border border-primary-500/30 text-primary-200 text-[10px] font-bold tracking-wider uppercase mb-3 backdrop-blur-md self-start">
            Nueva Colección 2024
          </span>
          <h1 className="text-2xl sm:text-3xl lg:text-5xl font-black leading-[1.1] mb-3 tracking-tight">
            Equipamiento Odontológico de{" "}
            <span className="text-[#c3ff00]">Vanguardia</span>
          </h1>
          <p className="text-xs sm:text-sm lg:text-base text-gray-200 mb-5 max-w-lg font-light leading-relaxed hidden sm:block">
            Descubra la última tecnología para su clínica dental con el respaldo
            y la garantía de los mejores fabricantes globales.
          </p>
          <div className="flex flex-wrap gap-3">
            <button className="px-4 py-2 sm:px-6 sm:py-3 bg-[#c3ff00] hover:bg-[#aee600] text-[#531575] rounded-xl font-bold transition-all shadow-lg shadow-[#c3ff00]/20 flex items-center gap-2 focus:outline-none text-xs sm:text-sm">
              Ver Catálogo{" "}
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
            <button className="px-4 py-2 sm:px-6 sm:py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold backdrop-blur-md border border-white/20 transition-all focus:outline-none text-xs sm:text-sm hidden sm:block">
              Ofertas Especiales
            </button>
          </div>
        </div>
      </section>

      {/* Pequeñas Tarjetas Promocionales */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between group hover:border-primary-500 transition-all">
          <div className="flex-1">
            <span className="text-red-500 font-bold text-xs uppercase tracking-wider">
              Oferta Flash
            </span>
            <h3 className="text-base font-bold mt-1 text-gray-900">
              15% de descuento
            </h3>
            <p className="text-gray-500 text-xs mb-3">En todas las Turbinas W&H</p>
            <Link
              to="#"
              className="text-primary-600 text-sm font-bold flex items-center gap-1 group-hover:underline"
            >
              Comprar ahora{" "}
              <span className="material-symbols-outlined text-sm">
                chevron_right
              </span>
            </Link>
          </div>
          <div
            className="w-20 h-20 rounded-xl bg-gray-50 bg-center bg-cover border border-gray-100"
            style={{
              backgroundImage:
                "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBzaKjUsh3B6SHPAwVsAw59F69nHKwoMdkKQRjLmcmEjujGLQwJqw_jWkLWBluTXVMO0tn36MJ9flYIGRhDmUHtPLeWak4KKuQOKAWXroAEx6zt9Aa0Ei9TSGAw_aihHpm0blw0xzArEOT_vpgkFMP14efKHHruXkK4Xj6nmPNAoCakLKOYfuJQXwsNc3n5qGnRfp9Y4a5ZEAz_kHpz7GHLqu1kSbaccaEihg1xicFtRlWzSlOA_tYJfqQQIKzGwkVZmKGvqnCy2HMG')",
            }}
          ></div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between group hover:border-primary-500 transition-all">
          <div className="flex-1">
            <span className="text-primary-600 font-bold text-xs uppercase tracking-wider">
              Nuevo Ingreso
            </span>
            <h3 className="text-base font-bold mt-1 text-gray-900">
              Escáner Intraoral
            </h3>
            <p className="text-gray-500 text-xs mb-3">
              Precisión digital garantizada
            </p>
            <Link
              to="#"
              className="text-primary-600 text-sm font-bold flex items-center gap-1 group-hover:underline"
            >
              Ver detalles{" "}
              <span className="material-symbols-outlined text-sm">
                chevron_right
              </span>
            </Link>
          </div>
          <div
            className="w-20 h-20 rounded-xl bg-gray-50 bg-center bg-cover border border-gray-100"
            style={{
              backgroundImage:
                "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDaJxh1hFdM6F_e7p3FeWpFv4RdSlgJIFmDg_6pye6AUPQQ1tUWtpZc0hUxw3HCVlnvvfiOs6kB4Y6-DiJjQLny1aNBuPEvM9CE1OInGtUE0_vtc1YjLWsIh4RDKZfcJ1v0NNf4yp9sAqDdyvRYA8CJFGrZo4z1VlG8Y30C3ttU__zbdvXIX6WnlWN3xtj-9rUj3LWulKthjZeiiM_lH_tqvl-um1logSM5yzvcgDevqLoThxlxj2cGlM5hRFQHGl1JR1u141g7oGlM')",
            }}
          ></div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between group hover:border-primary-500 transition-all md:col-span-2 lg:col-span-1">
          <div className="flex-1">
            <span className="text-orange-500 font-bold text-xs uppercase tracking-wider">
              Stock Limitado
            </span>
            <h3 className="text-base font-bold mt-1 text-gray-900">
              Pack Guantes
            </h3>
            <p className="text-gray-500 text-xs mb-3">Caja x100 unidades</p>
            <Link
              to="#"
              className="text-orange-500 text-sm font-bold flex items-center gap-1 group-hover:underline"
            >
              Añadir al carrito{" "}
              <span className="material-symbols-outlined text-sm">
                chevron_right
              </span>
            </Link>
          </div>
          <div
            className="w-20 h-20 rounded-xl bg-gray-50 bg-center bg-cover border border-gray-100"
            style={{
              backgroundImage:
                "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCRFxzgnhHYHAnEQVzwbhIzTuE0jFCkUi-q9uUZS8zvyoVG1N9yTxGmXU1FZPitPno168C8RqMLHi5iqbz4ua0RcaNmv3rKVD-DWSE73rFa3-t9ElZTwQvojOVltYIx2C4MayHar5-fioH5DMO_TM3dK4X-pEvFuEk5kUyNfXH0tw3ZmeiLehC05uFv0at8G2F-Q_Epj4-65KBnmIwZSnoJZQcaanG6d_ovO7BbV8NoggcLuWyzQTGSnzuNFPJcuNWjxAqSh7K5NIq5')",
            }}
          ></div>
        </div>
      </section>
    </div>
  );
}
