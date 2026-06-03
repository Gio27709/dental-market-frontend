import { useState } from "react";
import PropTypes from "prop-types";
import { formatCurrencyUSD } from "../../utils/formatters";
const CheckCircleIcon = ({ className }) => (<svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>);
CheckCircleIcon.propTypes = { className: PropTypes.string };
const XCircleIcon = ({ className }) => (<svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>);
XCircleIcon.propTypes = { className: PropTypes.string };
const NoSymbolIcon = ({ className }) => (<svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636" /></svg>);
NoSymbolIcon.propTypes = { className: PropTypes.string };
const XMarkIcon = ({ className }) => (<svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>);
XMarkIcon.propTypes = { className: PropTypes.string };

export default function ProductAdminSlideOver({
  product,
  onClose,
  onModerate
}) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  if (!product) return null;

  const handleAction = async (action) => {
    setIsProcessing(true);
    await onModerate(product.id, action, product.name);
    setIsProcessing(false);
    onClose(); // Close the slide-over after acting
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      if (!isProcessing) onClose();
    }
  };

  const images = product.images || [];

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm transition-opacity flex justify-end"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-4xl h-full bg-gray-50 shadow-2xl flex flex-col sm:flex-row animate-slide-in-right relative">
        <button
          onClick={onClose}
          disabled={isProcessing}
          className="absolute top-4 right-4 z-10 sm:hidden bg-white rounded-full p-2 text-gray-500 hover:text-gray-700 shadow"
        >
          <XMarkIcon className="w-6 h-6" />
        </button>

        {/* LEFT PANEL: Image Viewer */}
        <div className="w-full sm:w-2/5 h-64 sm:h-full bg-black relative flex flex-col items-center justify-center border-b sm:border-b-0 sm:border-r border-gray-200">
          {images.length > 0 ? (
            <>
              <img
                src={images[currentImageIndex]}
                alt="Product Preview"
                className="object-contain w-full h-full max-h-[80vh] p-4"
              />
              {images.length > 1 && (
                <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 px-4">
                  {images.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentImageIndex(idx)}
                      className={`w-2.5 h-2.5 rounded-full ${
                        currentImageIndex === idx ? "bg-white" : "bg-white/50"
                      }`}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="text-gray-500 flex flex-col items-center">
              <span className="text-6xl mb-4">🦷</span>
              <span>Sin imágenes</span>
            </div>
          )}
        </div>

        {/* RIGHT PANEL: Details & Actions */}
        <div className="w-full sm:w-3/5 h-full flex flex-col bg-white">
          <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50">
            <h2 className="text-xl font-bold text-gray-900 truncate pr-4">
              {product.name}
            </h2>
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="hidden sm:block text-gray-400 hover:text-gray-600 focus:outline-none"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
            {/* Status & Store Info */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Tienda</p>
                <p className="text-sm font-medium text-gray-900 mt-1">
                  {product.store_profiles?.business_name || "Tienda Desconocida"}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Precio Base</p>
                <p className="text-lg font-bold text-primary-600 mt-1">
                  {formatCurrencyUSD(product.price)}
                </p>
              </div>
            </div>

            {/* Description */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2 uppercase tracking-wide">Descripción</h3>
              <div 
                className="text-sm text-gray-600 prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1" 
                dangerouslySetInnerHTML={{ __html: product.description }} 
              />
            </div>

            {/* Variations */}
            {product.product_variations && product.product_variations.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide">Variaciones y Stock</h3>
                <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Variante</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Stock</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Extra</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {product.product_variations.map((v) => (
                        <tr key={v.id}>
                          <td className="px-4 py-2 text-sm text-gray-900">{v.attribute_value}</td>
                          <td className="px-4 py-2 text-sm text-right text-gray-600 font-medium">
                            {v.stock > 0 ? (
                              <span>{v.stock}</span>
                            ) : (
                              <span className="text-red-500">0</span>
                            )}
                          </td>
                          <td className="px-4 py-2 text-sm text-right text-gray-500">
                            {v.price_modifier > 0 ? `+${formatCurrencyUSD(v.price_modifier)}` : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Action Footer */}
          <div className="border-t border-gray-200 px-6 py-5 bg-gray-50">
             <div className="flex gap-3 justify-end">
                {product.moderation_status !== 'approved' && (
                  <button
                    onClick={() => handleAction("approve")}
                    disabled={isProcessing}
                    className="flex-1 flex justify-center items-center px-4 py-2.5 bg-green-600 text-white rounded-md text-sm font-semibold hover:bg-green-700 disabled:opacity-50 transition shadow-sm"
                  >
                    <CheckCircleIcon className="w-5 h-5 mr-1.5" />
                    Aprobar
                  </button>
                )}
                {product.moderation_status !== 'rejected' && (
                  <button
                    onClick={() => handleAction("reject")}
                    disabled={isProcessing}
                    className="flex-1 flex justify-center items-center px-4 py-2.5 bg-white border border-orange-300 text-orange-600 rounded-md text-sm font-semibold hover:bg-orange-50 disabled:opacity-50 transition"
                  >
                    <XCircleIcon className="w-5 h-5 mr-1.5" />
                    Rechazar
                  </button>
                )}
                {product.is_active && (
                  <button
                    onClick={() => handleAction("ban")}
                    disabled={isProcessing}
                    className="flex-1 flex justify-center items-center px-4 py-2.5 bg-white border border-red-300 text-red-600 rounded-md text-sm font-semibold hover:bg-red-50 disabled:opacity-50 transition"
                  >
                    <NoSymbolIcon className="w-5 h-5 mr-1.5" />
                    Banear
                  </button>
                )}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

ProductAdminSlideOver.propTypes = {
  product: PropTypes.object,
  onClose: PropTypes.func.isRequired,
  onModerate: PropTypes.func.isRequired,
};
