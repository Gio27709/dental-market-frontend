import { useState } from "react";
import PropTypes from "prop-types";
import toast from "react-hot-toast";

export default function DeliveryConfirmation({ itemId, onConfirm, disabled }) {
  const [showModal, setShowModal] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const handleConfirm = async () => {
    setConfirming(true);
    try {
      const result = await onConfirm(itemId);
      if (result?.success) {
        toast.success("¡Entrega confirmada! Fondos liberados a la tienda.");
        setShowModal(false);
      } else {
        toast.error(result?.error || "Error al confirmar entrega");
      }
    } catch {
      toast.error("Error inesperado al confirmar entrega");
    } finally {
      setConfirming(false);
    }
  };

  return (
    <>
      <button
        id={`confirm-delivery-${itemId}`}
        onClick={() => setShowModal(true)}
        disabled={disabled || confirming}
        className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm shadow-sm"
      >
        📦 Confirmar Recepción
      </button>

      {/* Confirmation Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => !confirming && setShowModal(false)}
          />

          {/* Modal */}
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-in">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
                📦
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                ¿Ya recibiste tu producto?
              </h3>
              <p className="text-sm text-gray-500">
                Al confirmar, liberarás el pago a la tienda. Esta acción no se
                puede deshacer.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                disabled={confirming}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors text-sm disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirm}
                disabled={confirming}
                className="flex-1 px-4 py-2.5 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors text-sm disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {confirming ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Confirmando...
                  </>
                ) : (
                  "Sí, lo recibí"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

DeliveryConfirmation.propTypes = {
  itemId: PropTypes.string.isRequired,
  onConfirm: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};
