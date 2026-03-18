import PropTypes from "prop-types";
import { useEffect } from "react";

export default function PaymentProofViewer({ proofUrl, onClose }) {
  // Simple check to identify PDFs from Supabase signed URLs
  const isPdf = proofUrl?.toLowerCase().includes(".pdf");

  // Prevent background scrolling when modal is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  if (!proofUrl) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900 bg-opacity-75 sm:p-6 backdrop-blur-sm animate-fade-in-up">
      <div className="relative w-full max-w-4xl bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="text-xl font-bold text-gray-900">
            Visor de Comprobante
          </h3>
          <div className="flex items-center gap-3">
            <a
              href={proofUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-primary-600 hover:text-primary-800 transition flex items-center gap-1"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                ></path>
              </svg>
              Descargar Original
            </a>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded p-1 transition"
            >
              <span className="sr-only">Cerrar</span>
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto bg-gray-100 p-4 flex items-center justify-center">
          {isPdf ? (
            <object
              data={proofUrl}
              type="application/pdf"
              className="w-full h-full rounded shadow-sm border border-gray-200"
            >
              <div className="flex flex-col items-center p-8 bg-white rounded shadow text-center">
                <svg
                  className="w-16 h-16 text-gray-400 mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                  ></path>
                </svg>
                <p className="text-gray-600 mb-4">
                  Tu navegador no soporta visualización de PDFs en vivo.
                </p>
                <a
                  href={proofUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 font-medium"
                >
                  Descargar PDF
                </a>
              </div>
            </object>
          ) : (
            <img
              src={proofUrl}
              alt="Comprobante de Pago"
              loading="lazy"
              className="max-w-full max-h-full object-contain rounded drop-shadow-md"
            />
          )}
        </div>
      </div>
    </div>
  );
}

PaymentProofViewer.propTypes = {
  proofUrl: PropTypes.string,
  onClose: PropTypes.func.isRequired,
};
