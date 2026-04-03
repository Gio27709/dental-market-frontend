import { useState, useRef } from "react";
import PropTypes from "prop-types";
import { useOrder } from "../../context/OrderContext";
import { validateFile } from "../../utils/validators";
import toast from "react-hot-toast";

export default function PaymentProofUploader({
  orderId,
  onUploadComplete,
  onError,
}) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const fileInputRef = useRef(null);
  const { uploadPaymentProof, loading } = useOrder();

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    const validation = validateFile(selectedFile, 5, [
      "image/jpeg",
      "image/png",
      "application/pdf",
    ]);

    if (!validation.valid) {
      toast.error(validation.error);
      if (onError) onError(validation.error);
      return;
    }

    setFile(selectedFile);

    // Create preview only for images
    if (selectedFile.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      setPreview(null); // It's a PDF
    }
  };

  const handleUploadClick = async () => {
    if (!file) {
      toast.error("Por favor adjunta un comprobante antes de enviar");
      return;
    }

    const result = await uploadPaymentProof(orderId, file);
    if (result.success) {
      toast.success("Comprobante subido exitosamente");
      if (onUploadComplete) onUploadComplete(orderId);
    } else {
      if (onError) onError(result.error);
    }
  };

  return (
    <div className="bg-white border rounded-lg shadow-sm p-6 max-w-lg mx-auto w-full">
      <h3 className="text-xl font-bold text-gray-900 mb-2">
        Comprobante de Pago
      </h3>
      <p className="text-sm text-gray-500 mb-6">
        Sube una foto clara (JPG/PNG) o documento (PDF) de tu comprobante.
        Tamaño máximo: 5MB.
      </p>

      <div className="space-y-4">
        <label
          className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <svg
              className="w-8 h-8 mb-4 text-gray-500"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 20 16"
            >
              <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
              />
            </svg>
            <p className="mb-2 text-sm text-gray-500 font-semibold">
              {file
                ? "Cambiar comprobante"
                : "Haz clic para seleccionar archivo"}
            </p>
            <p className="text-xs text-gray-500">
              {file ? file.name : "SVG, PNG, JPG or PDF"}
            </p>
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/jpeg,image/png,application/pdf"
            className="hidden"
            disabled={loading}
          />
        </label>

        {/* Thumbnail Preview Area */}
        {preview && (
          <div className="mt-4 flex justify-center border rounded-lg p-2 bg-gray-50">
            <img
              src={preview}
              alt="Vista previa del comprobante"
              loading="lazy"
              className="max-h-48 object-contain rounded"
            />
          </div>
        )}
        {file && !preview && (
          <div className="mt-4 flex justify-center border rounded-lg p-4 bg-gray-50 text-blue-600 font-medium">
            📄 Documento PDF seleccionado
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={handleUploadClick}
          disabled={!file || loading}
          className="w-full mt-4 flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
        >
          {loading ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Enviando Comprobante...
            </>
          ) : (
            "Enviar Comprobante"
          )}
        </button>
      </div>
    </div>
  );
}

PaymentProofUploader.propTypes = {
  orderId: PropTypes.string.isRequired,
  onUploadComplete: PropTypes.func,
  onError: PropTypes.func,
};
