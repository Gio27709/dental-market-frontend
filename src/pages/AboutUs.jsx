import { Users, Building, ShieldCheck, Heart, Award, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function AboutUs() {
  const stats = [
    { label: "Odontólogos Registrados", value: "10,000+", icon: Users },
    { label: "Tiendas y Proveedores", value: "50+", icon: Building },
    { label: "Transacciones Exitosas", value: "99.8%", icon: ShieldCheck },
  ];

  const values = [
    {
      title: "Confianza Escrow",
      desc: "Protegemos cada transacción reteniendo los fondos hasta que confirmes la calidad del producto recibido.",
      icon: ShieldCheck,
    },
    {
      title: "Calidad Certificada",
      desc: "Exigimos verificación de marcas y registros sanitarios vigentes a todos los vendedores de la plataforma.",
      icon: Award,
    },
    {
      title: "Enfoque en la Salud",
      desc: "Nuestra prioridad es facilitar insumos de alto nivel para asegurar el éxito del tratamiento clínico de tus pacientes.",
      icon: Heart,
    },
  ];

  const milestones = [
    {
      year: "2024",
      title: "Fundación y Primeros Pasos",
      desc: "Dental Market nace como respuesta a la escasez de canales directos de distribución digital de insumos clínicos.",
    },
    {
      year: "2025",
      title: "Integración de Geolocalización y Custodia",
      desc: "Desarrollamos el sistema de priorización geográfica BFS y el motor de custodia Escrow para transacciones 100% seguras.",
    },
    {
      year: "2026",
      title: "Expansión Nacional y Liderazgo B2B",
      desc: "Nos consolidamos como la plataforma líder en Venezuela para la dotación de clínicas y consultorios odontológicos.",
    },
  ];

  return (
    <div className="bg-[#f9f9ff] min-h-screen py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative gradient overlay */}
      <div className="absolute top-0 left-0 w-full h-[520px] bg-gradient-to-br from-[#4f0077] to-[#6b1e96] z-0">
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#c3ff00_1.5px,transparent_1.5px)] [background-size:24px_24px]"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10 mt-10">
        {/* Hero Banner */}
        <div className="text-center text-white mb-20 max-w-3xl mx-auto">
          <span className="bg-white/10 text-[#c3ff00] text-xs font-bold tracking-widest uppercase px-4 py-2 rounded-full border border-white/10">
            Nuestra Esencia
          </span>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight mt-6 mb-4 font-manrope">
            Revolucionando el Abastecimiento Dental
          </h1>
          <p className="text-lg text-[#e6b4ff] font-inter leading-relaxed">
            Conectamos a odontólogos con proveedores líderes en un mercado transparente, seguro y eficiente para elevar el nivel de la odontología.
          </p>
        </div>

        {/* Statistics Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div
                key={idx}
                className="bg-white rounded-3xl p-8 border border-gray-100 shadow-[0_10px_30px_rgba(25,28,32,0.02)] flex items-center justify-between transition-all hover:translate-y-[-4px]"
              >
                <div className="space-y-1">
                  <span className="text-gray-400 text-sm font-semibold font-inter block">{stat.label}</span>
                  <span className="text-3xl sm:text-4xl font-extrabold text-[#30004a] font-manrope block">
                    {stat.value}
                  </span>
                </div>
                <div className="bg-[#6b1e96]/5 p-4 rounded-2xl">
                  <Icon className="w-8 h-8 text-[#6b1e96]" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Mission and Vision section */}
        <div className="bg-white rounded-3xl shadow-[0_20px_40px_rgba(25,28,32,0.03)] border border-gray-100 p-8 sm:p-14 mb-20 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="text-3xl font-extrabold text-[#30004a] font-manrope tracking-tight">
              ¿Por qué creamos Dental Market?
            </h2>
            <p className="text-gray-600 font-inter leading-relaxed text-sm sm:text-base">
              Tradicionalmente, comprar instrumental y consumibles clínicos ha sido un proceso fragmentado, lento y sujeto a variaciones imprevistas de precios. Dental Market consolida toda la oferta en un solo portal seguro.
            </p>
            <p className="text-gray-600 font-inter leading-relaxed text-sm sm:text-base">
              Buscamos que los odontólogos se concentren en lo que realmente importa: la salud de sus pacientes. Nosotros nos encargamos de asegurar que sus materiales clínicos lleguen a tiempo y con las garantías oficiales de fábrica.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6">
            <div className="bg-[#f9f9ff] rounded-2xl p-6 border border-purple-50">
              <h3 className="text-lg font-bold text-gray-900 font-manrope mb-2 border-l-4 border-[#6b1e96] pl-3">
                Nuestra Misión
              </h3>
              <p className="text-gray-500 font-inter text-sm leading-relaxed">
                Proporcionar una infraestructura tecnológica que conecte a profesionales dentales con los mejores distribuidores del país, garantizando seguridad en los pagos, rapidez logística y autenticidad del producto.
              </p>
            </div>
            <div className="bg-[#f9f9ff] rounded-2xl p-6 border border-purple-50">
              <h3 className="text-lg font-bold text-gray-900 font-manrope mb-2 border-l-4 border-[#6b1e96] pl-3">
                Nuestra Visión
              </h3>
              <p className="text-gray-500 font-inter text-sm leading-relaxed">
                Ser el ecosistema digital B2B indispensable para el sector de la salud oral en Latinoamérica, impulsando la digitalización y el crecimiento de cientos de pymes del sector dental.
              </p>
            </div>
          </div>
        </div>

        {/* Our values Section */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-gray-900 font-manrope">Nuestros Valores Claros</h2>
            <p className="text-gray-500 font-inter max-w-md mx-auto mt-2 text-sm sm:text-base">
              Principios inquebrantables que guían cada línea de código y cada transacción en nuestra plataforma.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {values.map((val, idx) => {
              const Icon = val.icon;
              return (
                <div
                  key={idx}
                  className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm flex flex-col justify-between"
                >
                  <div className="bg-[#6b1e96]/5 p-3 rounded-2xl w-fit mb-6">
                    <Icon className="w-6 h-6 text-[#6b1e96]" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3 font-manrope">{val.title}</h3>
                    <p className="text-gray-500 font-inter text-sm leading-relaxed">{val.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Timeline / Milestones */}
        <div className="bg-white rounded-3xl shadow-[0_20px_40px_rgba(25,28,32,0.03)] border border-gray-100 p-8 sm:p-14 mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-gray-900 font-manrope">Nuestra Trayectoria</h2>
            <p className="text-gray-500 font-inter mt-1 text-sm sm:text-base">Hitos clave que definen nuestro camino.</p>
          </div>
          <div className="relative border-l border-gray-200 ml-4 md:ml-32 space-y-12">
            {milestones.map((m, idx) => (
              <div key={idx} className="relative pl-8 md:pl-12">
                {/* Year tag for desktop */}
                <div className="absolute left-[-110px] top-1 hidden md:block w-20 text-right">
                  <span className="text-2xl font-black text-[#6b1e96] font-manrope">{m.year}</span>
                </div>
                {/* Circle badge */}
                <div className="absolute left-[-9px] top-1.5 w-4.5 h-4.5 rounded-full bg-white border-4 border-[#6b1e96] flex items-center justify-center"></div>
                <div className="space-y-1">
                  <span className="text-lg font-black text-[#6b1e96] font-manrope md:hidden block">{m.year}</span>
                  <h3 className="text-lg font-bold text-gray-900 font-manrope">{m.title}</h3>
                  <p className="text-gray-500 font-inter text-sm leading-relaxed max-w-2xl">{m.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Call to action */}
        <div className="bg-gradient-to-br from-[#4f0077] to-[#6b1e96] rounded-3xl p-10 sm:p-16 text-center text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#c3ff00_1px,transparent_1px)] [background-size:16px_16px]"></div>
          <div className="relative z-10 max-w-2xl mx-auto space-y-6">
            <h2 className="text-3xl sm:text-4xl font-extrabold font-manrope">¿Eres proveedor de insumos dentales?</h2>
            <p className="text-[#e6b4ff] font-inter text-sm sm:text-base leading-relaxed">
              Únete a nuestra red de tiendas aliadas y vende tus productos a miles de odontólogos con comisiones bajas, pagos rápidos en wallet y entrega garantizada.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
              <Link
                to="/afiliate"
                className="bg-[#c3ff00] hover:bg-[#bcf600] text-[#151f00] font-bold py-4 px-8 rounded-xl transition-all shadow-md active:transform active:scale-95 font-inter text-sm sm:text-base flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Afiliar mi Tienda</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/contacto"
                className="bg-white/10 hover:bg-white/20 text-white font-bold py-4 px-8 rounded-xl transition-all font-inter text-sm sm:text-base border border-white/10 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Contáctanos</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
