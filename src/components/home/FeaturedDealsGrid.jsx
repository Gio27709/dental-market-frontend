import PropTypes from "prop-types";
import { useState, useEffect } from "react";
import SmallProductCard from "../SmallProductCard";
import useHomeSections from "../../hooks/useHomeSections";

// Badges rotativos para dar variedad visual
const BADGES = ["SALE", "NEW", null, "HOT"];

export default function FeaturedDealsGrid({ products }) {
  const { sections } = useHomeSections();
  const data = sections?.featured_deals || {};
  const heroTitle = data.hero_title || "Oferta Estrella";
  const catNames = data.categories || [
     { title: "Instrumental" },
     { title: "Biomateriales" },
     { title: "Ortodoncia" }
  ];

  const available = products || [];
  const [heroIndex, setHeroIndex] = useState(0);

  // All hero candidates (could be extended later)
  const heroCandidates = available.slice(0, Math.min(3, available.length));

  useEffect(() => {
    if (heroCandidates.length <= 1) return;
    const timer = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % heroCandidates.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [heroCandidates.length]);

  if (available.length === 0) return null;

  // Llenar 13 huecos repitiendo productos si hay pocos, para que se aprecie la maqueta
  const filledProducts = Array.from({ length: 13 }, (_, i) => available[i % available.length]);

  // Dividimos los productos en 4 grupos:
  const heroProduct = filledProducts[0];
  const col2 = filledProducts.slice(1, 5);
  const col3 = filledProducts.slice(5, 9);
  const col4 = filledProducts.slice(9, 13);

  const currentHero = heroCandidates[heroIndex] || heroProduct;

  const categories = [
    { title: catNames[0]?.title || "Instrumental", items: col2 },
    { title: catNames[1]?.title || "Biomateriales", items: col3 },
    { title: catNames[2]?.title || "Ortodoncia", items: col4 },
  ];

  return (
    <div className="mb-16">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Columna 1: Oferta Estrella */}
        <div className="flex flex-col">
          <h3 className="text-lg font-bold text-gray-900 pb-2 mb-4 border-b-[3px] border-primary-500">
            {heroTitle}
          </h3>
          <div className="flex-1 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 flex flex-col items-center justify-center border border-gray-200 relative overflow-hidden group">
            {/* Producto Hero Imagen Grande */}
            {currentHero && (
              <>
                <div className="w-full h-[280px] flex items-center justify-center mb-6">
                  {currentHero.images && currentHero.images.length > 0 ? (
                    <img
                      src={currentHero.images[0]}
                      alt={currentHero.name}
                      loading="lazy"
                      className="max-w-full max-h-full object-contain drop-shadow-lg mix-blend-multiply group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <span className="material-symbols-outlined text-7xl text-gray-300">
                      image
                    </span>
                  )}
                </div>
                <h4 className="text-base font-semibold text-gray-800 text-center leading-tight line-clamp-2 mb-2">
                  {currentHero.name}
                </h4>
                <span className="text-xl font-black text-primary-600">
                  ${Number(currentHero.price || 0).toFixed(2)}
                </span>

                {/* Dots de Paginación */}
                {heroCandidates.length > 1 && (
                  <div className="flex items-center gap-2 mt-4">
                    {heroCandidates.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setHeroIndex(i)}
                        className={`w-2.5 h-2.5 rounded-full transition-all ${
                          i === heroIndex
                            ? "bg-primary-500 scale-110"
                            : "bg-gray-300 hover:bg-gray-400"
                        }`}
                        aria-label={`Slide ${i + 1}`}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Columnas 2, 3, 4: Listas de Categorías */}
        {categories.map((cat, catIdx) => (
          <div key={catIdx} className="flex flex-col">
            <h3 className="text-lg font-bold text-gray-900 pb-2 mb-4 border-b-[3px] border-primary-500">
              {cat.title}
            </h3>
            <div className="flex flex-col divide-y divide-gray-100">
              {cat.items.map((product, idx) => (
                <SmallProductCard
                  key={product.id}
                  product={product}
                  badge={BADGES[idx % BADGES.length]}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

FeaturedDealsGrid.propTypes = {
  products: PropTypes.array,
};
