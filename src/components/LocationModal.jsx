import { VENEZUELA_STATES } from "../utils/venezuelaStates";
import { useLocationContext } from "../hooks/useLocationContext";
import PropTypes from "prop-types";

export default function LocationModal({ isOpen, onClose }) {
  const { buyerState, setBuyerState } = useLocationContext();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex justify-center items-center">
      {/* Overlay Oscuro */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal Box */}
      <div className="relative bg-white w-full max-w-md rounded-xl shadow-2xl overflow-hidden z-[1001] flex flex-col max-h-[90vh]">
        {/* Header Modal */}
        <div className="bg-gray-100 px-5 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="font-bold text-gray-900 m-0">Elige tu ubicación</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Cuerpo Modal (Scrollable) */}
        <div className="p-5 flex-1 overflow-y-auto">
          <p className="text-sm text-gray-600 mb-4 leading-relaxed">
            Selecciona el estado donde te encuentras. Te mostraremos primero los productos de vendedores en tu misma ciudad o estado para envíos más rápidos.
          </p>

          <div className="grid grid-cols-2 gap-2">
            {VENEZUELA_STATES.map((stateName) => (
              <button
                key={stateName}
                onClick={() => {
                  setBuyerState(stateName);
                  onClose();
                }}
                className={`text-left px-3 py-2 text-sm rounded-lg border transition-all ${
                  buyerState === stateName 
                    ? "border-[#6b1e96] bg-[#6b1e96]/5 text-[#6b1e96] font-semibold" 
                    : "border-gray-200 hover:border-gray-400 text-gray-700"
                }`}
              >
                {stateName}
              </button>
            ))}
          </div>
          
          <div className="mt-5 pt-4 border-t border-gray-100 flex justify-between">
            <button
               onClick={() => {
                 setBuyerState("");
                 onClose();
               }}
               className="text-sm text-red-600 hover:text-red-800 font-medium"
            >
              Borrar ubicación
            </button>
            <button
              onClick={onClose}
              className="text-sm bg-gray-900 text-white px-4 py-1.5 rounded-md hover:bg-gray-800 transition-colors font-medium"
            >
              Listo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

LocationModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};
