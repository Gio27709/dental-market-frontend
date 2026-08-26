import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PropTypes from "prop-types";
import useHomeSections from "../../hooks/useHomeSections";
import useCountdown from "../../hooks/useCountdown";
import { getFeaturedPromotionAPI, getPromotionsAPI } from "../../services/api";
import { track } from "../../services/tracking";

/**
 * StoreCatalog filtra por `category_id`, así que el destino tiene que llevar el UUID
 * de la categoría, no el slug. Son solo los valores por defecto: el admin puede
 * cambiar cualquier enlace desde el Gestor de Contenido del Home.
 */
const CAT_RADIOLOGIA = "65d4b146-39e3-4804-9b20-ba133df0575c";   // Centros Radiológicos
const CAT_DESCARTABLES = "18101be6-f8e5-46b1-be88-c7ef12c66552"; // Descartables

const FALLBACK_BANNERS = [
  {
    position: "left",
    heading: "Máxima Precisión en tu Diagnóstico",
    description: "Ahorra en Lámparas y Rayos X",
    button_text: "Ver Equipos",
    button_link: `/store-catalog?category=${CAT_RADIOLOGIA}`,
    button_color: "sky",
    image_url: "https://lh3.googleusercontent.com/aida-public/AB6AXuDaJxh1hFdM6F_e7p3FeWpFv4RdSlgJIFmDg_6pye6AUPQQ1tUWtpZc0hUxw3HCVlnvvfiOs6kB4Y6-DiJjQLny1aNBuPEvM9CE1OInGtUE0_vtc1YjLWsIh4RDKZfcJ1v0NNf4yp9sAqDdyvRYA8CJFGrZo4z1VlG8Y30C3ttU__zbdvXIX6WnlWN3xtj-9rUj3LWulKthjZeiiM_lH_tqvl-um1logSM5yzvcgDevqLoThxlxj2cGlM5hRFQHGl1JR1u141g7oGlM",
    bg_color: "gray-100",
    icon: "biotech",
  },
  {
    position: "center",
    heading: "Renueva tu instrumental con calidad superior",
    description: "Oferta Exclusiva:",
    discount_text: "25% OFF",
    discount_subtext: "por Tiempo Limitado!",
    button_text: "Comprar Ahora",
    button_link: "/promociones",
    button_color: "primary",
    image_url: "https://lh3.googleusercontent.com/aida-public/AB6AXuBzaKjUsh3B6SHPAwVsAw59F69nHKwoMdkKQRjLmcmEjujGLQwJqw_jWkLWBluTXVMO0tn36MJ9flYIGRhDmUHtPLeWak4KKuQOKAWXroAEx6zt9Aa0Ei9TSGAw_aihHpm0blw0xzArEOT_vpgkFMP14efKHHruXkK4Xj6nmPNAoCakLKOYfuJQXwsNc3n5qGnRfp9Y4a5ZEAz_kHpz7GHLqu1kSbaccaEihg1xicFtRlWzSlOA_tYJfqQQIKzGwkVZmKGvqnCy2HMG",
    bg_color: "#f0f2f5",
    icon: "medical_services",
  },
  {
    position: "right",
    heading: "Máxima Protección para tu equipo",
    description: "Insumos Quirúrgicos",
    button_text: "Ver Insumos",
    button_link: `/store-catalog?category=${CAT_DESCARTABLES}`,
    button_color: "sky",
    image_url: "https://lh3.googleusercontent.com/aida-public/AB6AXuCRFxzgnhHYHAnEQVzwbhIzTuE0jFCkUi-q9uUZS8zvyoVG1N9yTxGmXU1FZPitPno168C8RqMLHi5iqbz4ua0RcaNmv3rKVD-DWSE73rFa3-t9ElZTwQvojOVltYIx2C4MayHar5-fioH5DMO_TM3dK4X-pEvFuEk5kUyNfXH0tw3ZmeiLehC05uFv0at8G2F-Q_Epj4-65KBnmIwZSnoJZQcaanG6d_ovO7BbV8NoggcLuWyzQTGSnzuNFPJcuNWjxAqSh7K5NIq5",
    bg_color: "gray-100",
    icon: "health_and_safety",
  },
];

// Tailwind purga las clases construidas por interpolación (`bg-${color}` nunca llegaba
// al CSS), así que el fondo se resuelve contra un mapa explícito.
const BG_CLASSES = {
  "gray-50": "bg-gray-50",
  "gray-100": "bg-gray-100",
  "slate-100": "bg-slate-100",
  "primary-50": "bg-blue-50",
  "sky-50": "bg-sky-50",
};

const resolveBg = (color) => {
  if (typeof color === "string" && color.startsWith("#")) {
    return { className: "", style: { backgroundColor: color } };
  }
  return { className: BG_CLASSES[color] || "bg-gray-100", style: {} };
};

const BUTTON_CLASSES = {
  sky: "bg-sky-600 group-hover:bg-sky-700",
  primary: "bg-primary-600 group-hover:bg-blue-700",
};

const isExternal = (link) => /^https?:\/\//i.test(link || "");

/** El UUID de `?category=` se guarda en su columna para poder cruzar el clic con la categoría. */
const categoryIdFromLink = (link) => {
  const match = /[?&]category=([0-9a-f-]{36})/i.exec(link || "");
  return match ? match[1] : undefined;
};

/**
 * Las imágenes actuales son assets temporales de un prototipo: si caducan, la tarjeta
 * degrada a un ícono en lugar de dejar el hueco de una imagen rota.
 */
function BannerImage({ src, alt, icon, className, imgClassName }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className={`${className} bg-white/50 rounded-xl`}>
        <span className="material-symbols-outlined text-4xl text-gray-300">{icon || "image"}</span>
      </div>
    );
  }

  return (
    <div className={className}>
      <img src={src} alt={alt} loading="lazy" onError={() => setFailed(true)} className={imgClassName} />
    </div>
  );
}

BannerImage.propTypes = {
  src: PropTypes.string,
  alt: PropTypes.string,
  icon: PropTypes.string,
  className: PropTypes.string,
  imgClassName: PropTypes.string,
};

/** Toda la tarjeta es el área clickeable; sin enlace se degrada a un div inerte. */
function BannerShell({ to, onClick, className, style, children }) {
  const focusable = `${className} focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2`;

  if (!to) {
    return <div className={className} style={style}>{children}</div>;
  }

  if (isExternal(to)) {
    return (
      <a href={to} target="_blank" rel="noopener noreferrer" onClick={onClick} className={focusable} style={style}>
        {children}
      </a>
    );
  }

  return (
    <Link to={to} onClick={onClick} className={focusable} style={style}>
      {children}
    </Link>
  );
}

BannerShell.propTypes = {
  to: PropTypes.string,
  onClick: PropTypes.func,
  className: PropTypes.string,
  style: PropTypes.object,
  children: PropTypes.node,
};

function SideBanner({ banner, span, onClick }) {
  const bg = resolveBg(banner.bg_color);
  const btn = BUTTON_CLASSES[banner.button_color] || BUTTON_CLASSES.sky;

  return (
    <BannerShell
      to={banner.button_link}
      onClick={onClick}
      className={`${span} ${bg.className} group relative flex items-center gap-3 rounded-2xl border border-transparent p-5 md:p-6 overflow-hidden shadow-brand transition-all duration-300 hover:shadow-brand-lg hover:border-gray-200 hover:-translate-y-0.5`}
      style={bg.style}
    >
      <div className="relative z-10 flex-1 min-w-0">
        <h3 className="text-base md:text-lg font-bold text-gray-900 leading-tight mb-1.5 text-balance">
          {banner.heading}
        </h3>
        <p className="text-gray-500 text-xs md:text-sm mb-4 leading-snug line-clamp-2">
          {banner.description}
        </p>
        <span className={`inline-flex items-center gap-1 text-white text-xs font-bold px-3.5 py-2 rounded-lg transition-colors ${btn}`}>
          {banner.button_text}
          <span className="material-symbols-outlined text-sm transition-transform group-hover:translate-x-0.5">
            arrow_forward
          </span>
        </span>
      </div>

      <BannerImage
        src={banner.image_url}
        alt={banner.heading}
        icon={banner.icon}
        className="relative z-0 w-[38%] max-w-[150px] shrink-0 self-stretch flex items-center justify-center"
        imgClassName="max-w-full max-h-[120px] md:max-h-[150px] object-contain drop-shadow-md mix-blend-multiply transition-transform duration-500 group-hover:scale-105"
      />
    </BannerShell>
  );
}

SideBanner.propTypes = {
  banner: PropTypes.object.isRequired,
  span: PropTypes.string,
  onClick: PropTypes.func,
};

export default function PromoBanners() {
  const { sections, loading } = useHomeSections();
  const data = sections?.promo_banners || {};
  const [promo, setPromo] = useState(null);

  // Promoción real para el banner central: la destacada y, si ninguna está marcada,
  // la primera activa. Cualquier fallo deja intacto el contenido editable del admin.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const { data: featured } = await getFeaturedPromotionAPI();
        let found = featured?.data || null;

        if (!found) {
          const { data: all } = await getPromotionsAPI();
          found = (all?.data || [])[0] || null;
        }

        if (!cancelled) setPromo(found);
      } catch {
        /* sin promoción viva el banner usa el contenido del gestor del home */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const { label: timeLeft, expired } = useCountdown(promo?.ends_at);
  const livePromo = promo && !expired ? promo : null;

  // Se completa con los defaults en vez de descartarlo todo si el admin guardó menos de 3.
  const saved = Array.isArray(data.banners) ? data.banners : [];
  const banners = FALLBACK_BANNERS.map((fb, i) => {
    const merged = { ...fb, ...(saved[i] || {}) };
    // Lo guardado en BD trae `button_link: "#"`, el marcador que dejaba el editor viejo y
    // que no lleva a ninguna parte. Vale como "sin destino": manda el enlace por defecto.
    const link = (merged.button_link || "").trim();
    if (!link || link === "#") merged.button_link = fb.button_link;
    return merged;
  });
  const [b1, b2, b3] = banners;

  const handleClick = (banner) => {
    track("promo_banner_click", {
      path: typeof window !== "undefined" ? window.location.pathname : undefined,
      category_id: categoryIdFromLink(banner.button_link),
      properties: {
        position: banner.position,
        heading: banner.heading,
        link: banner.button_link,
        promotion_id: banner.promotion_id || null,
      },
    });
  };

  if (loading && !data.banners) {
    return (
      <div className="mb-16 grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-6">
        <div className="lg:col-span-1 h-48 rounded-2xl bg-gray-100 animate-pulse" />
        <div className="lg:col-span-2 h-48 rounded-2xl bg-gray-100 animate-pulse" />
        <div className="lg:col-span-1 h-48 rounded-2xl bg-gray-100 animate-pulse" />
      </div>
    );
  }

  // Cuando hay promoción viva manda la BD; si no, el contenido editable del admin.
  const center = livePromo
    ? {
        ...b2,
        heading: livePromo.title,
        description: livePromo.subtitle || "",
        discount_text: "",
        discount_subtext: "",
        image_url: livePromo.hero_image_url || b2.image_url,
        button_text: b2.button_text || "Ver promoción",
        button_link: `/promociones?promo=${livePromo.id}`,
        promotion_id: livePromo.id,
      }
    : b2;

  const centerBg = resolveBg(center.bg_color);
  const centerBtn = BUTTON_CLASSES[center.button_color] || BUTTON_CLASSES.primary;

  return (
    <div className="mb-16 grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-6 items-stretch">
      <SideBanner banner={b1} span="lg:col-span-1" onClick={() => handleClick(b1)} />

      <BannerShell
        to={center.button_link}
        onClick={() => handleClick(center)}
        className={`lg:col-span-2 ${centerBg.className} group relative flex flex-col sm:flex-row items-center gap-4 md:gap-6 rounded-2xl border border-transparent p-6 md:p-8 overflow-hidden shadow-brand transition-all duration-300 hover:shadow-brand-lg hover:border-gray-200 hover:-translate-y-0.5`}
        style={centerBg.style}
      >
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{ backgroundImage: "radial-gradient(#000 1px, transparent 1px)", backgroundSize: "20px 20px" }}
        />

        <div className="relative z-10 flex-1 min-w-0 w-full">
          {livePromo && (
            <span
              className="inline-flex items-center gap-1.5 text-white text-[11px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full mb-3"
              style={{ backgroundColor: livePromo.badge_color || "#ef4444" }}
            >
              <span className="material-symbols-outlined text-sm">local_fire_department</span>
              {livePromo.badge_text || "OFERTA"}
            </span>
          )}

          <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-gray-900 leading-[1.15] mb-2 text-balance">
            {center.heading}
          </h2>

          <p className="text-gray-600 text-sm md:text-base mb-4 leading-snug">
            {center.description}
            {center.discount_text && (
              <span className="text-rose-600 font-black text-xl sm:text-2xl ml-1.5 align-middle">
                {center.discount_text}
              </span>
            )}
            {center.discount_subtext && (
              <span className="block text-xs md:text-sm font-medium mt-0.5">{center.discount_subtext}</span>
            )}
          </p>

          {timeLeft && !expired && (
            <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-rose-200 text-rose-700 rounded-lg px-3 py-1.5 mb-4">
              <span className="material-symbols-outlined text-base">timer</span>
              <span className="text-[11px] font-semibold uppercase tracking-wide">Termina en</span>
              <span className="font-black text-sm tabular-nums">{timeLeft}</span>
            </div>
          )}

          <div>
            <span className={`inline-flex items-center gap-1.5 text-white text-sm font-bold px-5 py-2.5 rounded-lg shadow-sm transition-colors ${centerBtn}`}>
              {center.button_text}
              <span className="material-symbols-outlined text-base transition-transform group-hover:translate-x-0.5">
                arrow_forward
              </span>
            </span>
          </div>
        </div>

        {/* La imagen va enmarcada a propósito: las fotos de este catálogo no siempre traen
            fondo transparente y sin marco se veían como un recuadro pegado a la tarjeta. */}
        <BannerImage
          src={center.image_url}
          alt={center.heading}
          icon={center.icon}
          className="relative z-10 w-full sm:w-[38%] shrink-0 aspect-square max-h-[190px] rounded-xl overflow-hidden bg-white/40 flex items-center justify-center"
          imgClassName="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
      </BannerShell>

      <SideBanner banner={b3} span="lg:col-span-1" onClick={() => handleClick(b3)} />
    </div>
  );
}
