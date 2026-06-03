import { useRef, useEffect } from "react";
import useHomeSections from "../../hooks/useHomeSections";

const FALLBACK_BRAND_LIST = [
  {
    id: 1,
    name: "NIC",
    img: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/NIC_Inc_Logo.svg/1280px-NIC_Inc_Logo.svg.png",
  },
  {
    id: 2,
    name: "Hu-Friedy",
    img: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Hu-Friedy_logo.svg/1280px-Hu-Friedy_logo.svg.png",
  },
  {
    id: 3,
    name: "3M",
    img: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/3M_wordmark.svg/1280px-3M_wordmark.svg.png",
  },
  {
    id: 4,
    name: "Dentsply Sirona",
    img: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/03/Dentsply_sirona_logo.svg/1280px-Dentsply_sirona_logo.svg.png",
  },
  {
    id: 5,
    name: "COLTENE",
    img: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/Coltene_Logo.svg/1280px-Coltene_Logo.svg.png",
  },
  {
    id: 6,
    name: "GC Corporation",
    img: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/GC_Corporation_Logo.svg/1024px-GC_Corporation_Logo.svg.png",
  },
  {
    id: 7,
    name: "Ivoclar",
    img: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Ivoclar_Vivadent_Logo.svg/1280px-Ivoclar_Vivadent_Logo.svg.png",
  },
  {
    id: 8,
    name: "KaVo",
    img: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/66/KaVo_Logo.svg/1024px-KaVo_Logo.svg.png",
  },
];

export default function BrandsTicker() {
  const trackRef = useRef(null);
  
  const { sections } = useHomeSections();
  const data = sections?.brands_ticker || {};
  const heading = data.heading || "Marcas de confianza en odontología";
  const brandsList = data.brands || FALLBACK_BRAND_LIST;
  const BRANDS = [...brandsList, ...brandsList];

  // Physics State
  const state = useRef({
    isDragging: false,
    currentX: 0,
    startX: 0,
    lastX: 0,
    velocity: -0.5,
    rafId: null,
  });

  useEffect(() => {
    const track = trackRef.current;

    const animate = () => {
      if (!track) return;

      const { isDragging, velocity } = state.current;

      if (!isDragging) {
        state.current.currentX += velocity;

        if (Math.abs(velocity) > 0.1) {
          state.current.velocity *= 0.95;
        } else {
          if (state.current.velocity > -0.5 && state.current.velocity < 0.5) {
            state.current.velocity = -0.5;
          }
        }
      }

      // Infinite loop logic
      const trackWidth = track.scrollWidth;
      const itemSetWidth = trackWidth / 2;

      if (state.current.currentX <= -itemSetWidth) {
        state.current.currentX += itemSetWidth;
      } else if (state.current.currentX >= 0) {
        state.current.currentX -= itemSetWidth;
      }

      track.style.transform = `translateX(${state.current.currentX}px)`;
      state.current.rafId = requestAnimationFrame(animate);
    };

    state.current.rafId = requestAnimationFrame(animate);
    const stateCurrent = state.current;

    return () => {
      if (stateCurrent.rafId) cancelAnimationFrame(stateCurrent.rafId);
    };
  }, []);

  const handlePointerDown = (e) => {
    state.current.isDragging = true;
    state.current.startX = e.clientX - state.current.currentX;
    state.current.lastX = e.clientX;
    state.current.velocity = 0;
    e.target.setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (!state.current.isDragging) return;
    e.preventDefault();
    const x = e.clientX;
    const delta = x - state.current.lastX;
    state.current.currentX = x - state.current.startX;
    state.current.velocity = delta;
    state.current.lastX = x;
  };

  const handlePointerUp = (e) => {
    state.current.isDragging = false;
    e.target.releasePointerCapture?.(e.pointerId);
  };

  return (
    <section className="py-10 mb-12 bg-white overflow-hidden select-none border-t border-b border-gray-100 rounded-2xl">
      {/* Título opcional */}
      <p className="text-center text-xs font-bold uppercase tracking-[0.2em] text-gray-400 mb-6">
        {heading}
      </p>

      <div
        className="relative w-full max-w-7xl mx-auto overflow-hidden cursor-grab active:cursor-grabbing"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        {/* Gradientes de desvanecimiento en los bordes */}
        <div className="pointer-events-none absolute top-0 bottom-0 left-0 w-24 z-10 bg-gradient-to-r from-white to-transparent"></div>
        <div className="pointer-events-none absolute top-0 bottom-0 right-0 w-24 z-10 bg-gradient-to-l from-white to-transparent"></div>

        {/* Track infinito */}
        <div
          ref={trackRef}
          className="flex items-center gap-16 md:gap-20 w-max will-change-transform py-4"
        >
          {BRANDS.map((brand, index) => (
            <div
              key={`${brand.id}-${index}`}
              className="flex-shrink-0 hover:scale-105 transition-transform duration-300"
            >
              <img
                src={brand.img}
                alt={brand.name}
                draggable="false"
                className="h-10 md:h-12 lg:h-14 w-auto object-contain pointer-events-none drop-shadow-sm"
                onError={(e) => {
                  // Fallback: mostrar el nombre como texto si la imagen falla
                  e.target.style.display = "none";
                  e.target.nextSibling && (e.target.nextSibling.style.display = "block");
                }}
              />
              <span
                className="hidden text-xl md:text-2xl font-extrabold text-gray-800 uppercase tracking-tight"
              >
                {brand.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
