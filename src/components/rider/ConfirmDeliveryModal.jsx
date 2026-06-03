import PropTypes from "prop-types";

export default function ConfirmDeliveryModal({ isOpen, onClose, onSubmit, loading }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[85vh] overflow-hidden animate-in slide-in-from-bottom duration-300">
        
        {/* Header decoration */}
        <div className="bg-gradient-to-r from-[#6b1e96] to-[#531575] pt-8 pb-10 px-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/3"></div>
          
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/20 hover:bg-black/30 flex items-center justify-center transition-colors text-white"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>

          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#c3ff00] flex items-center justify-center shadow-lg shadow-[#c3ff00]/20 mb-4 transform scale-110">
              <span className="material-symbols-outlined text-[#531575] text-[32px]">task_alt</span>
            </div>
            <h3 className="text-xl font-extrabold text-white tracking-tight">Confirmar Entrega</h3>
            <p className="text-white/80 text-sm mt-1 font-medium">¿El cliente recibió el paquete correctamente?</p>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6 bg-white space-y-4">
          <div className="bg-green-50 rounded-2xl p-4 flex gap-3 border border-green-100 items-start">
             <span className="material-symbols-outlined text-green-600 text-[20px] shrink-0">verified_user</span>
             <p className="text-sm text-green-800 font-medium leading-relaxed">
               Al confirmar, el pedido se marcará como entregado y se le notificará al cliente y a la tienda. Esta acción no se puede deshacer.
             </p>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-gray-50 px-6 py-5 border-t border-gray-100 flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-3.5 bg-white border-2 border-gray-200 hover:bg-gray-50 hover:border-gray-300 text-gray-700 font-bold rounded-2xl text-sm transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={onSubmit}
            disabled={loading}
            className="flex-1 py-3.5 bg-gradient-to-b from-[#6b1e96] to-[#531575] hover:from-[#531575] hover:to-[#380e4f] disabled:opacity-50 text-white font-bold rounded-2xl text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-500/30"
          >
            {loading ? (
              <span className="w-5 h-5 border-[3px] border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span className="material-symbols-outlined text-[18px]">done_all</span>
                Sí, Entregado
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

ConfirmDeliveryModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  loading: PropTypes.bool,
};

