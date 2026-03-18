import { Link } from "react-router-dom";

export default function HeroBanner() {
  return (
    <div className="flex flex-col lg:flex-row gap-8 mb-12">
      {/* Sidebar de Categorías */}
      <aside className="w-full lg:w-64 shrink-0">
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-gray-100 bg-gray-50/50">
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Categorías
            </h2>
          </div>
          <nav className="p-2 space-y-1">
            <Link
              to="#"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-primary-500/10 hover:text-primary-600 transition-colors group"
            >
              <span className="material-symbols-outlined text-gray-400 group-hover:text-primary-600">
                home_repair_service
              </span>
              <span className="text-sm font-medium">Instrumentos</span>
            </Link>
            <Link
              to="#"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-primary-500/10 hover:text-primary-600 transition-colors group"
            >
              <span className="material-symbols-outlined text-gray-400 group-hover:text-primary-600">
                layers
              </span>
              <span className="text-sm font-medium">Materiales de Impresión</span>
            </Link>
            <Link
              to="#"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-primary-500/10 hover:text-primary-600 transition-colors group"
            >
              <span className="material-symbols-outlined text-gray-400 group-hover:text-primary-600">
                grid_view
              </span>
              <span className="text-sm font-medium">Ortodoncia</span>
            </Link>
            <Link
              to="#"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-primary-500/10 hover:text-primary-600 transition-colors group"
            >
              <span className="material-symbols-outlined text-gray-400 group-hover:text-primary-600">
                radiology
              </span>
              <span className="text-sm font-medium">Equipos de Rayos X</span>
            </Link>
            <Link
              to="#"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-primary-500/10 hover:text-primary-600 transition-colors group"
            >
              <span className="material-symbols-outlined text-gray-400 group-hover:text-primary-600">
                delete
              </span>
              <span className="text-sm font-medium">Desechables</span>
            </Link>
            <Link
              to="#"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-primary-500/10 hover:text-primary-600 transition-colors group"
            >
              <span className="material-symbols-outlined text-gray-400 group-hover:text-primary-600">
                chair
              </span>
              <span className="text-sm font-medium">Mobiliario Dental</span>
            </Link>
            <Link
              to="#"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-primary-500/10 hover:text-primary-600 transition-colors group"
            >
              <span className="material-symbols-outlined text-gray-400 group-hover:text-primary-600">
                mop
              </span>
              <span className="text-sm font-medium">Higiene Oral</span>
            </Link>
          </nav>
        </div>

        {/* Tarjeta Soporte (Asistencia) */}
        <div className="mt-6 p-4 rounded-xl bg-gradient-to-br from-primary-600 to-blue-700 text-white shadow-lg">
          <p className="text-xs font-semibold uppercase opacity-80 mb-2">
            Asistencia
          </p>
          <p className="text-sm font-bold mb-4">
            ¿Necesitas ayuda con tu pedido?
          </p>
          <button className="w-full py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-semibold backdrop-blur-sm transition-all focus:outline-none">
            Contactar Soporte
          </button>
        </div>
      </aside>

      {/* Main Banner y Minis */}
      <div className="flex-1 flex flex-col gap-6">
        {/* Banner Grande */}
        <section className="relative h-[480px] w-full rounded-2xl overflow-hidden shadow-xl bg-gray-900 group">
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
            style={{
              backgroundImage:
                "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCtI6GItYhn0yw19CASJeUkFTR7dbAviFcNGGbDrSa8cgqLHrhQ1g7TpS1zpKvfiIF1rRDYQP-FFkdkwa-O_KvScGvdWlSWV4lI-uqexopEvMAGUGf8ARnSOhfniIjRqnkEhavlz5O1bLhPgFUMej38MA-kQr94BoIdVgr1kOXp9l26siEzK8vsDDX0-36410kgCi7IoJ2MOjzNDS5NE7RQb9uqzO_xFtVnx9JYO_rpjSVTGzjnYPZLTGFb9uDWKlVpuNsKrZsuX3T1')",
            }}
          ></div>
          <div className="absolute inset-0 bg-gradient-to-r from-gray-900/80 via-gray-900/40 to-transparent"></div>
          <div className="relative h-full flex flex-col justify-center px-8 lg:px-16 max-w-2xl text-white">
            <span className="inline-block px-3 py-1 rounded-full bg-primary-500/20 border border-primary-500/30 text-primary-200 text-xs font-bold tracking-wider uppercase mb-6 backdrop-blur-md self-start">
              Nueva Colección 2024
            </span>
            <h1 className="text-4xl lg:text-6xl font-black leading-[1.1] mb-6 tracking-tight">
              Equipamiento Odontológico de{" "}
              <span className="text-[#c3ff00]">Vanguardia</span>
            </h1>
            <p className="text-lg text-gray-200 mb-8 max-w-lg font-light leading-relaxed">
              Descubra la última tecnología para su clínica dental con el
              respaldo y la garantía de los mejores fabricantes globales.
            </p>
            <div className="flex flex-wrap gap-4">
              <button className="px-8 py-4 bg-[#c3ff00] hover:bg-[#aee600] text-[#531575] rounded-xl font-bold transition-all shadow-lg shadow-[#c3ff00]/20 flex items-center gap-2 focus:outline-none">
                Ver Catálogo{" "}
                <span className="material-symbols-outlined">arrow_forward</span>
              </button>
              <button className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold backdrop-blur-md border border-white/20 transition-all focus:outline-none">
                Ofertas Especiales
              </button>
            </div>
          </div>
        </section>

        {/* Pequeñas Tarjetas Promocionales */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between group hover:border-primary-500 transition-all">
            <div className="flex-1">
              <span className="text-red-500 font-bold text-sm">
                Oferta Flash
              </span>
              <h3 className="text-lg font-bold mt-1 text-gray-900">
                15% de descuento
              </h3>
              <p className="text-gray-500 text-sm mb-4">
                En todas las Turbinas W&H
              </p>
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
              className="w-24 h-24 rounded-xl bg-gray-50 bg-center bg-cover border border-gray-100"
              style={{
                backgroundImage:
                  "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBzaKjUsh3B6SHPAwVsAw59F69nHKwoMdkKQRjLmcmEjujGLQwJqw_jWkLWBluTXVMO0tn36MJ9flYIGRhDmUHtPLeWak4KKuQOKAWXroAEx6zt9Aa0Ei9TSGAw_aihHpm0blw0xzArEOT_vpgkFMP14efKHHruXkK4Xj6nmPNAoCakLKOYfuJQXwsNc3n5qGnRfp9Y4a5ZEAz_kHpz7GHLqu1kSbaccaEihg1xicFtRlWzSlOA_tYJfqQQIKzGwkVZmKGvqnCy2HMG')",
              }}
            ></div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between group hover:border-primary-500 transition-all">
            <div className="flex-1">
              <span className="text-primary-600 font-bold text-sm">
                Nuevo Ingreso
              </span>
              <h3 className="text-lg font-bold mt-1 text-gray-900">
                Escáner Intraoral
              </h3>
              <p className="text-gray-500 text-sm mb-4">
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
              className="w-24 h-24 rounded-xl bg-gray-50 bg-center bg-cover border border-gray-100"
              style={{
                backgroundImage:
                  "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDaJxh1hFdM6F_e7p3FeWpFv4RdSlgJIFmDg_6pye6AUPQQ1tUWtpZc0hUxw3HCVlnvvfiOs6kB4Y6-DiJjQLny1aNBuPEvM9CE1OInGtUE0_vtc1YjLWsIh4RDKZfcJ1v0NNf4yp9sAqDdyvRYA8CJFGrZo4z1VlG8Y30C3ttU__zbdvXIX6WnlWN3xtj-9rUj3LWulKthjZeiiM_lH_tqvl-um1logSM5yzvcgDevqLoThxlxj2cGlM5hRFQHGl1JR1u141g7oGlM')",
              }}
            ></div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between group hover:border-primary-500 transition-all md:col-span-2 lg:col-span-1">
            <div className="flex-1">
              <span className="text-orange-500 font-bold text-sm">
                Stock Limitado
              </span>
              <h3 className="text-lg font-bold mt-1 text-gray-900">
                Pack Guantes
              </h3>
              <p className="text-gray-500 text-sm mb-4">Caja x100 unidades</p>
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
              className="w-24 h-24 rounded-xl bg-gray-50 bg-center bg-cover border border-gray-100"
              style={{
                backgroundImage:
                  "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCRFxzgnhHYHAnEQVzwbhIzTuE0jFCkUi-q9uUZS8zvyoVG1N9yTxGmXU1FZPitPno168C8RqMLHi5iqbz4ua0RcaNmv3rKVD-DWSE73rFa3-t9ElZTwQvojOVltYIx2C4MayHar5-fioH5DMO_TM3dK4X-pEvFuEk5kUyNfXH0tw3ZmeiLehC05uFv0at8G2F-Q_Epj4-65KBnmIwZSnoJZQcaanG6d_ovO7BbV8NoggcLuWyzQTGSnzuNFPJcuNWjxAqSh7K5NIq5')",
              }}
            ></div>
          </div>
        </section>
      </div>
    </div>
  );
}
