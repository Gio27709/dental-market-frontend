import { useState } from 'react';
import PropTypes from 'prop-types';
import { Camera, X, ZoomIn } from 'lucide-react';

const ShippingEvidenceGallery = ({ item }) => {
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  
  if (!item || !item.shipping_evidence_urls || item.shipping_evidence_urls.length === 0) {
    return null;
  }

  const photos = item.shipping_evidence_urls;

  return (
    <div className="mt-4 bg-gray-50 border border-gray-100 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600">
          <Camera size={14} />
        </span>
        <h4 className="text-sm font-bold text-gray-800">Evidencia de Envío Adjunta</h4>
        <div className="ml-auto flex items-center">
            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                🛡️ Verificada
            </span>
        </div>
      </div>
      
      <p className="text-xs text-gray-500 mb-3 ml-8">La tienda adjuntó {photos.length} foto{photos.length !== 1 ? 's' : ''} como prueba de despacho.</p>

      <div className="flex overflow-x-auto gap-3 pb-2 ml-8 scrollbar-hide">
        {photos.map((url, idx) => (
          <div 
            key={idx} 
            className="relative flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden border border-gray-200 cursor-pointer group"
            onClick={() => setSelectedPhoto(url)}
          >
            <img src={url} alt={`Evidencia ${idx+1}`} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                <ZoomIn className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md" size={18} />
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {selectedPhoto && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 transition-opacity backdrop-blur-sm"
          onClick={() => setSelectedPhoto(null)}
        >
          <button 
            className="absolute top-4 right-4 sm:top-8 sm:right-8 p-2 bg-black/50 hover:bg-white/20 text-white rounded-full transition-colors"
            onClick={(e) => { e.stopPropagation(); setSelectedPhoto(null); }}
          >
            <X size={24} />
          </button>
          
          <img 
            src={selectedPhoto} 
            alt="Evidencia ampliada" 
            className="max-w-full max-h-[90vh] object-contain rounded drop-shadow-2xl animate-in zoom-in duration-200"
            onClick={(e) => e.stopPropagation()} 
          />
        </div>
      )}
    </div>
  );
};

ShippingEvidenceGallery.propTypes = {
  item: PropTypes.shape({
    shipping_evidence_urls: PropTypes.arrayOf(PropTypes.string),
  }),
};

export default ShippingEvidenceGallery;
