import { useEffect } from "react";
import { Link } from "react-router-dom";

const DESTINOS = [
  {
    icon: "storefront",
    title: "Tienda",
    desc: "Catálogo completo de instrumental, consumibles y equipos de tiendas verificadas.",
    to: "/inicio",
    cta: "Ver catálogo",
  },
  {
    icon: "article",
    title: "Publicaciones y noticias",
    desc: "Artículos, casos clínicos y novedades del sector escritos por la comunidad.",
    to: "/news",
    cta: "Leer publicaciones",
  },
  {
    icon: "school",
    title: "Estudios y cursos",
    desc: "Formación continua para mantener tu práctica clínica al día.",
    to: "/courses",
    cta: "Ver cursos",
  },
  {
    icon: "sell",
    title: "Promociones",
    desc: "Descuentos vigentes y ofertas por tiempo limitado de nuestras tiendas.",
    to: "/promociones",
    cta: "Ver ofertas",
  },
  {
    icon: "store",
    title: "Tiendas aliadas",
    desc: "Explora los proveedores registrados y compra directo a cada uno.",
    to: "/store-catalog",
    cta: "Ver tiendas",
  },
  {
    icon: "info",
    title: "Sobre Forcepx",
    desc: "Quiénes somos, cómo trabajamos y hacia dónde vamos.",
    to: "/acerca",
    cta: "Conocernos",
  },
];

const PASOS = [
  {
    icon: "search",
    title: "Busca y compara",
    desc: "Encuentra el insumo que necesitas entre varias tiendas y compara precio y disponibilidad real.",
  },
  {
    icon: "verified_user",
    title: "Paga con custodia",
    desc: "Tu dinero queda retenido en custodia y solo se libera a la tienda cuando el pedido llega bien.",
  },
  {
    icon: "local_shipping",
    title: "Recibe y confirma",
    desc: "Seguimiento del despacho con repartidores asignados y tiempos de entrega vigilados.",
  },
];

const PERFILES = [
  {
    icon: "local_hospital",
    tag: "Odontólogos y clínicas",
    desc: "Compra insumos, controla tu inventario, gestiona suscripciones de reposición y mide la rentabilidad de tu consultorio.",
    to: "/register",
    cta: "Crear cuenta",
  },
  {
    icon: "storefront",
    tag: "Tiendas y proveedores",
    desc: "Publica tu catálogo, recibe pedidos, cobra en tu wallet y solicita retiros. Con panel de ventas y métricas propias.",
    to: "/afiliate",
    cta: "Afiliar mi tienda",
  },
  {
    icon: "two_wheeler",
    tag: "Repartidores",
    desc: "Súmate a la red de entrega y toma despachos de las tiendas de tu zona desde tu propio panel.",
    to: "/afiliate",
    cta: "Quiero repartir",
  },
];

export default function Landing() {
  useEffect(() => {
    try {
      localStorage.setItem("forcepx_welcome_seen", "1");
    } catch {
      // localStorage puede fallar en modo restringido; la landing igual se muestra.
    }
  }, []);

  return (
    <div className="bg-[#f9f9ff]">
      {/* ---------- HERO ---------- */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#4f0077] to-[#6b1e96] px-4 sm:px-6 lg:px-8 pt-20 pb-28">
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#c3ff00_1.5px,transparent_1.5px)] [background-size:24px_24px]"></div>
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#c3ff00]/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-52 -left-40 w-96 h-96 bg-[#c3ff00]/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <span className="inline-block bg-white/10 text-[#c3ff00] text-[11px] font-bold tracking-widest uppercase px-4 py-2 rounded-full border border-white/10">
            Marketplace odontológico
          </span>

          <h1 className="font-['Manrope'] text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white mt-6">
            Todo lo que tu consultorio necesita,
            <span className="block text-[#c3ff00]">en un solo lugar</span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-[#e6b4ff] leading-relaxed max-w-2xl mx-auto">
            Forcepx conecta a odontólogos y clínicas con tiendas verificadas de
            insumos dentales. Compra protegida, entrega con seguimiento y una
            comunidad que comparte lo que aprende.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4">
            <Link
              to="/inicio"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#c3ff00] hover:bg-[#aee600] text-[#151f00] font-bold px-8 py-4 shadow-md transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-[20px]">storefront</span>
              Ir a la tienda
            </Link>
            <Link
              to="/news"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold px-8 py-4 transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-[20px]">article</span>
              Ir a las publicaciones
            </Link>
          </div>

          <div className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-white/70 text-xs sm:text-sm">
            {[
              ["verified", "Tiendas verificadas"],
              ["lock", "Pago en custodia"],
              ["local_shipping", "Entrega con seguimiento"],
              ["support_agent", "Soporte por ticket"],
            ].map(([icon, label]) => (
              <span key={label} className="inline-flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-[#c3ff00]">{icon}</span>
                {label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- A DÓNDE QUIERES IR ---------- */}
      <section className="px-4 sm:px-6 lg:px-8 -mt-14 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {DESTINOS.map((d) => (
              <Link
                key={d.to}
                to={d.to}
                className="group bg-white rounded-3xl p-7 border border-gray-100 shadow-[0_10px_30px_rgba(25,28,32,0.04)] hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(107,30,150,0.10)] transition-all flex flex-col"
              >
                <div className="bg-[#6b1e96]/5 group-hover:bg-[#6b1e96]/10 p-3 rounded-2xl w-fit mb-5 transition-colors">
                  <span className="material-symbols-outlined text-[28px] text-[#6b1e96]">{d.icon}</span>
                </div>
                <h3 className="font-['Manrope'] text-lg font-bold text-gray-900">{d.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed mt-2 flex-grow">{d.desc}</p>
                <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-[#6b1e96]">
                  {d.cta}
                  <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">
                    arrow_forward
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- CÓMO FUNCIONA ---------- */}
      <section className="px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-['Manrope'] text-3xl font-extrabold text-gray-900">
              Cómo funciona una compra
            </h2>
            <p className="text-gray-500 max-w-lg mx-auto mt-2 text-sm sm:text-base">
              Tres pasos, sin llamadas ni cotizaciones por WhatsApp.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PASOS.map((p, i) => (
              <div
                key={p.title}
                className="relative bg-white rounded-3xl p-8 border border-gray-100 shadow-sm"
              >
                <span className="absolute top-6 right-7 font-['Manrope'] text-5xl font-black text-[#6b1e96]/[0.07] leading-none">
                  {i + 1}
                </span>
                <div className="bg-[#6b1e96]/5 p-3 rounded-2xl w-fit mb-5">
                  <span className="material-symbols-outlined text-[28px] text-[#6b1e96]">{p.icon}</span>
                </div>
                <h3 className="font-['Manrope'] text-lg font-bold text-gray-900 mb-2">{p.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- PERFILES ---------- */}
      <section className="px-4 sm:px-6 lg:px-8 pb-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-['Manrope'] text-3xl font-extrabold text-gray-900">
              ¿Con cuál te identificas?
            </h2>
            <p className="text-gray-500 max-w-lg mx-auto mt-2 text-sm sm:text-base">
              Cada perfil tiene su propio panel dentro de Forcepx.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PERFILES.map((p) => (
              <div
                key={p.tag}
                className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm flex flex-col"
              >
                <div className="bg-[#6b1e96]/5 p-3 rounded-2xl w-fit mb-5">
                  <span className="material-symbols-outlined text-[28px] text-[#6b1e96]">{p.icon}</span>
                </div>
                <h3 className="font-['Manrope'] text-lg font-bold text-gray-900 mb-2">{p.tag}</h3>
                <p className="text-gray-500 text-sm leading-relaxed flex-grow">{p.desc}</p>
                <Link
                  to={p.to}
                  className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-[#6b1e96] hover:bg-[#531575] text-white font-bold text-sm px-5 py-3 transition-colors active:scale-95"
                >
                  {p.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- CTA FINAL ---------- */}
      <section className="px-4 sm:px-6 lg:px-8 pb-20">
        <div className="max-w-7xl mx-auto">
          <div className="bg-gradient-to-br from-[#4f0077] to-[#6b1e96] rounded-3xl p-10 sm:p-16 text-center text-white relative overflow-hidden">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#c3ff00_1px,transparent_1px)] [background-size:16px_16px]"></div>
            <div className="relative z-10 max-w-2xl mx-auto">
              <h2 className="font-['Manrope'] text-3xl sm:text-4xl font-extrabold">
                Empieza por donde prefieras
              </h2>
              <p className="text-[#e6b4ff] text-sm sm:text-base leading-relaxed mt-4">
                Puedes navegar el catálogo sin registrarte. La cuenta solo hace
                falta cuando quieras comprar, guardar favoritos o publicar.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
                <Link
                  to="/inicio"
                  className="bg-[#c3ff00] hover:bg-[#aee600] text-[#151f00] font-bold py-4 px-8 rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
                >
                  Explorar la tienda
                </Link>
                <Link
                  to="/register"
                  className="bg-white/10 hover:bg-white/20 text-white font-bold py-4 px-8 rounded-xl transition-all border border-white/20 flex items-center justify-center gap-2 active:scale-95"
                >
                  Crear una cuenta
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
