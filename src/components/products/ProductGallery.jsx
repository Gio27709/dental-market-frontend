import { useState } from "react";
import PropTypes from "prop-types";

export default function ProductGallery({ images = [] }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div className="w-full aspect-square bg-gray-50 flex items-center justify-center rounded-lg border border-gray-100">
        <span className="text-gray-400 text-sm">Sin imágenes disponibles</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      {/* Vertical Thumbnails — Desktop (Left Column) */}
      {images.length > 1 && (
        <div className="hidden sm:flex flex-col gap-2.5 overflow-y-auto max-h-[520px] w-[90px] flex-shrink-0 pr-1">
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`relative h-[90px] w-[90px] flex-shrink-0 rounded-md overflow-hidden border-2 transition-all duration-200 bg-white ${
                currentIndex === idx
                  ? "border-[#6b1e96] opacity-100 shadow-sm"
                  : "border-gray-200 opacity-50 hover:opacity-90 hover:border-gray-400"
              }`}
            >
              <img
                src={img}
                alt={`Miniatura ${idx + 1}`}
                loading="lazy"
                className="w-full h-full object-contain p-1.5 mix-blend-multiply"
              />
            </button>
          ))}
        </div>
      )}

      {/* Main Image Container */}
      <div className="relative flex-1 aspect-square bg-white rounded-lg overflow-hidden border border-gray-100 flex items-center justify-center">
        <img
          src={images[currentIndex]}
          alt={`Imagen ${currentIndex + 1} del producto`}
          loading="lazy"
          className="max-w-[88%] max-h-[88%] object-contain mix-blend-multiply transition-transform duration-300 hover:scale-105"
        />

        {/* Navigation Arrows — always visible */}
        {images.length > 1 && (
          <>
            <button
              onClick={() =>
                setCurrentIndex((prev) =>
                  prev > 0 ? prev - 1 : images.length - 1
                )
              }
              className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white hover:bg-gray-50 text-gray-500 hover:text-[#6b1e96] rounded-full shadow-md border border-gray-200 flex items-center justify-center transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
            <button
              onClick={() =>
                setCurrentIndex((prev) =>
                  prev < images.length - 1 ? prev + 1 : 0
                )
              }
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white hover:bg-gray-50 text-gray-500 hover:text-[#6b1e96] rounded-full shadow-md border border-gray-200 flex items-center justify-center transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </>
        )}
      </div>

      {/* Horizontal Thumbnails — Mobile (Below Image) */}
      {images.length > 1 && (
        <div className="sm:hidden flex gap-2 overflow-x-auto pb-1 px-1">
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`relative h-16 w-16 flex-shrink-0 rounded-md overflow-hidden border-2 transition-all ${
                currentIndex === idx
                  ? "border-[#6b1e96] opacity-100"
                  : "border-gray-200 opacity-50 hover:opacity-100"
              }`}
            >
              <img
                src={img}
                alt={`Miniatura ${idx + 1}`}
                loading="lazy"
                className="w-full h-full object-contain p-1"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

ProductGallery.propTypes = {
  images: PropTypes.arrayOf(PropTypes.string),
};
