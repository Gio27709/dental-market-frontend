import { Link } from "react-router-dom";
import useHomeSections from "../../hooks/useHomeSections";

export default function HeroBanner() {
  const { sections } = useHomeSections();
  const data = sections?.hero || {};

  const backgroundImage = data.background_image || "https://lh3.googleusercontent.com/aida-public/AB6AXuCtI6GItYhn0yw19CASJeUkFTR7dbAviFcNGGbDrSa8cgqLHrhQ1g7TpS1zpKvfiIF1rRDYQP-FFkdkwa-O_KvScGvdWlSWV4lI-uqexopEvMAGUGf8ARnSOhfniIjRqnkEhavlz5O1bLhPgFUMej38MA-kQr94BoIdVgr1kOXp9l26siEzK8vsDDX0-36410kgCi7IoJ2MOjzNDS5NE7RQb9uqzO_xFtVnx9JYO_rpjSVTGzjnYPZLTGFb9uDWKlVpuNsKrZsuX3T1";
  const badgeText = data.badge_text || "Nueva Colección 2024";
  const heading = data.heading || "Equipamiento Odontológico de";
  const headingHighlight = data.heading_highlight || "Vanguardia";
  const description = data.description || "Descubra la última tecnología para su clínica dental con el respaldo y la garantía de los mejores fabricantes globales.";
  
  const primaryBtn = data.primary_button || { text: "Ver Catálogo", link: "/store-catalog", icon: "arrow_forward" };
  const secondaryBtn = data.secondary_button || { text: "Ofertas Especiales", link: "/ofertas" };
  
  const promoCards = data.promo_cards || [
    {
      badge: "Oferta Flash", badge_color: "red",
      title: "15% de descuento", description: "En todas las Turbinas W&H",
      link_text: "Comprar ahora", link_url: "#", link_color: "primary",
      image_url: "https://lh3.googleusercontent.com/aida-public/AB6AXuBzaKjUsh3B6SHPAwVsAw59F69nHKwoMdkKQRjLmcmEjujGLQwJqw_jWkLWBluTXVMO0tn36MJ9flYIGRhDmUHtPLeWak4KKuQOKAWXroAEx6zt9Aa0Ei9TSGAw_aihHpm0blw0xzArEOT_vpgkFMP14efKHHruXkK4Xj6nmPNAoCakLKOYfuJQXwsNc3n5qGnRfp9Y4a5ZEAz_kHpz7GHLqu1kSbaccaEihg1xicFtRlWzSlOA_tYJfqQQIKzGwkVZmKGvqnCy2HMG"
    },
    {
      badge: "Nuevo Ingreso", badge_color: "primary",
      title: "Escáner Intraoral", description: "Precisión digital garantizada",
      link_text: "Ver detalles", link_url: "#", link_color: "primary",
      image_url: "https://lh3.googleusercontent.com/aida-public/AB6AXuDaJxh1hFdM6F_e7p3FeWpFv4RdSlgJIFmDg_6pye6AUPQQ1tUWtpZc0hUxw3HCVlnvvfiOs6kB4Y6-DiJjQLny1aNBuPEvM9CE1OInGtUE0_vtc1YjLWsIh4RDKZfcJ1v0NNf4yp9sAqDdyvRYA8CJFGrZo4z1VlG8Y30C3ttU__zbdvXIX6WnlWN3xtj-9rUj3LWulKthjZeiiM_lH_tqvl-um1logSM5yzvcgDevqLoThxlxj2cGlM5hRFQHGl1JR1u141g7oGlM"
    },
    {
      badge: "Stock Limitado", badge_color: "orange",
      title: "Pack Guantes", description: "Caja x100 unidades",
      link_text: "Añadir al carrito", link_url: "#", link_color: "orange",
      image_url: "https://lh3.googleusercontent.com/aida-public/AB6AXuCRFxzgnhHYHAnEQVzwbhIzTuE0jFCkUi-q9uUZS8zvyoVG1N9yTxGmXU1FZPitPno168C8RqMLHi5iqbz4ua0RcaNmv3rKVD-DWSE73rFa3-t9ElZTwQvojOVltYIx2C4MayHar5-fioH5DMO_TM3dK4X-pEvFuEk5kUyNfXH0tw3ZmeiLehC05uFv0at8G2F-Q_Epj4-65KBnmIwZSnoJZQcaanG6d_ovO7BbV8NoggcLuWyzQTGSnzuNFPJcuNWjxAqSh7K5NIq5"
    }
  ];

  return (
    <div className="flex flex-col gap-6 w-full mb-12">
      {/* Banner Grande Minimalista */}
      <section className="relative h-[260px] xs:h-[300px] sm:h-[250px] lg:h-[300px] w-full rounded-2xl overflow-hidden shadow-xl bg-gray-900 group">
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
          style={{
            backgroundImage: `url('${backgroundImage}')`,
          }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-900/70 to-transparent sm:bg-gradient-to-r sm:from-gray-900/80 sm:via-gray-900/40 sm:to-transparent"></div>
        <div className="relative h-full flex flex-col justify-center px-5 xs:px-6 sm:px-8 lg:px-12 max-w-3xl text-white">
          <span className="inline-block px-3 py-1 rounded-full bg-primary-500/20 border border-primary-500/30 text-primary-200 text-[9px] xs:text-[10px] font-bold tracking-wider uppercase mb-2 xs:mb-3 backdrop-blur-md self-start">
            {badgeText}
          </span>
          <h1 className="text-lg xs:text-xl sm:text-3xl lg:text-5xl font-black leading-[1.1] mb-3 tracking-tight whitespace-pre-wrap">
            {heading}{" "}
            <span className="text-[#c3ff00]">{headingHighlight}</span>
          </h1>
          <p className="text-xs sm:text-sm lg:text-base text-gray-200 mb-5 max-w-lg font-light leading-relaxed hidden sm:block whitespace-pre-wrap">
            {description}
          </p>
          <div className="flex flex-wrap gap-3">
            <Link to={primaryBtn.link || "#"} className="px-4 py-2 sm:px-6 sm:py-3 bg-[#c3ff00] hover:bg-[#aee600] text-[#531575] rounded-xl font-bold transition-all shadow-lg shadow-[#c3ff00]/20 flex items-center gap-2 focus:outline-none text-xs sm:text-sm">
              {primaryBtn.text}{" "}
              <span className="material-symbols-outlined text-[18px]">{primaryBtn.icon || "arrow_forward"}</span>
            </Link>
            <Link to={secondaryBtn.link || "#"} className="px-4 py-2 sm:px-6 sm:py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold backdrop-blur-md border border-white/20 transition-all focus:outline-none text-xs sm:text-sm hidden sm:block">
              {secondaryBtn.text}
            </Link>
          </div>
        </div>
      </section>

      {/* Pequeñas Tarjetas Promocionales */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {promoCards.map((card, idx) => {
          const badgeColorClass = card.badge_color === 'red' ? 'text-red-500' : card.badge_color === 'orange' ? 'text-orange-500' : 'text-primary-600';
          const linkColorClass = card.link_color === 'orange' ? 'text-orange-500' : 'text-primary-600';
          return (
            <div key={idx} className={`bg-white p-4 xs:p-5 sm:p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between group hover:border-primary-500 transition-all ${idx === 2 ? 'md:col-span-2 lg:col-span-1' : ''}`}>
              <div className="flex-1 pr-3 sm:pr-4">
                <span className={`${badgeColorClass} font-bold text-[10px] xs:text-xs uppercase tracking-wider`}>
                  {card.badge}
                </span>
                <h3 className="text-sm xs:text-base font-bold mt-1 text-gray-900">
                  {card.title}
                </h3>
                <p className="text-gray-500 text-[11px] xs:text-xs mb-3">{card.description}</p>
                <Link
                  to={card.link_url || "#"}
                  className={`${linkColorClass} text-xs xs:text-sm font-bold flex items-center gap-1 group-hover:underline`}
                >
                  {card.link_text}{" "}
                  <span className="material-symbols-outlined text-sm">
                    chevron_right
                  </span>
                </Link>
              </div>
              <div
                className="w-16 h-16 xs:w-20 xs:h-20 rounded-xl bg-gray-50 bg-center bg-cover border border-gray-100 flex-shrink-0"
                style={{
                  backgroundImage: `url('${card.image_url}')`,
                }}
              ></div>
            </div>
          );
        })}
      </section>
    </div>
  );
}
