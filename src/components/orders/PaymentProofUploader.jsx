import { useState, useRef } from "react";
import PropTypes from "prop-types";
import { useOrder } from "../../context/OrderContext";
import { validateFile } from "../../utils/validators";
import toast from "react-hot-toast";

/**
 * Payment Proof Uploader — captures complete payer details + file
 * Fields shown dynamically based on payment method:
 *   transferencia / pago_movil → name, phone, cedula, reference, file
 *   zelle                      → name, email, reference, date, file
 */
export default function PaymentProofUploader({
  orderId,
  paymentMethod,
  onUploadComplete,
  onError,
}) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const fileInputRef = useRef(null);
  const { uploadPaymentProof, loading } = useOrder();

  // Payer detail fields
  const [payerName, setPayerName] = useState("");
  const [payerPhone, setPayerPhone] = useState("");
  const [cedulaType, setCedulaType] = useState("V");
  const [cedulaNumber, setCedulaNumber] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [payerEmail, setPayerEmail] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const [formErrors, setFormErrors] = useState({});

  const pm = paymentMethod || "";
  const isZelle = pm === "zelle";
  const isBank = pm === "transferencia" || pm === "pago_movil";

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
    if (formErrors.file) setFormErrors((prev) => ({ ...prev, file: null }));

    // Create preview only for images
    if (selectedFile.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      setPreview(null);
    }
  };

  const validate = () => {
    const errors = {};

    // Name required for all methods
    if (!payerName.trim()) {
      errors.payerName = "El nombre del titular es obligatorio.";
    }

    // Reference required for all methods
    if (!referenceNumber.trim()) {
      errors.referenceNumber = "El número de referencia es obligatorio.";
    }

    // Bank-specific validations (transferencia, pago_movil)
    if (isBank) {
      if (!payerPhone.trim()) {
        errors.payerPhone = "El teléfono del pagador es obligatorio.";
      }
      if (!cedulaNumber.trim()) {
        errors.payerCedula = "El número de documento es obligatorio.";
      } else {
        const fullCedula = `${cedulaType}-${cedulaNumber.trim()}`;
        const cedulaRegex = /^[VEJGP]-\d{6,10}(-\d)?$/i;
        if (!cedulaRegex.test(fullCedula)) {
          errors.payerCedula = "Formato inválido. Ingresa solo los números (ej: 12345678).";
        }
      }
    }

    // Zelle-specific validations
    if (isZelle) {
      if (!payerEmail.trim()) {
        errors.payerEmail = "El correo electrónico es obligatorio para Zelle.";
      } else {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(payerEmail.trim())) {
          errors.payerEmail = "El correo electrónico no tiene un formato válido.";
        }
      }
      if (!paymentDate) {
        errors.paymentDate = "La fecha de la transacción es obligatoria.";
      }
    }

    // File required
    if (!file) {
      errors.file = "Debes adjuntar una captura del comprobante.";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleUploadClick = async () => {
    if (!validate()) {
      toast.error("Corrige los campos marcados antes de continuar.");
      return;
    }

    const paymentDetails = {
      payer_name: payerName.trim(),
      reference_number: referenceNumber.trim(),
    };

    if (isBank) {
      paymentDetails.payer_phone = payerPhone.trim();
      paymentDetails.payer_cedula = `${cedulaType}-${cedulaNumber.trim()}`.toUpperCase();
    }

    if (isZelle) {
      paymentDetails.payer_email = payerEmail.trim().toLowerCase();
      paymentDetails.payment_date = paymentDate;
    }

    const result = await uploadPaymentProof(orderId, file, paymentDetails);
    if (result.success) {
      toast.success("Comprobante enviado exitosamente");
      if (onUploadComplete) onUploadComplete(orderId);
    } else {
      toast.error(result.error || "Error al enviar comprobante");
      if (onError) onError(result.error);
    }
  };

  const clearFieldError = (field) => {
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  // Helper for method label
  const methodLabel =
    pm === "transferencia" ? "Transferencia Bancaria" :
    pm === "pago_movil" ? "Pago Móvil" :
    pm === "zelle" ? "Zelle" : "Pago";

  return (
    <div className="bg-white border border-slate-100 shadow-[0_8px_30px_rgb(107,30,150,0.04)] rounded-3xl p-6 sm:p-8 max-w-xl mx-auto w-full transition-all duration-300">
      <div className="flex items-start gap-3.5 mb-5 pb-4 border-b border-slate-100">
        <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-[#6b1e96]">
          <span className="material-symbols-outlined text-[22px]">receipt_long</span>
        </div>
        <div>
          <h3 className="text-base font-black text-slate-900">Comprobante de Pago</h3>
          <p className="text-xs font-semibold text-slate-400 mt-0.5">
            Completa los datos de tu {methodLabel} y adjunta la captura.
          </p>
        </div>
      </div>

      <div className="space-y-4.5">
        {/* ── Nombre del Titular ── */}
        <div>
          <label htmlFor="payer_name" className="block text-xs font-extrabold text-slate-600 uppercase tracking-wider mb-1.5">
            Nombre del Titular de la Cuenta <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="payer_name"
            value={payerName}
            onChange={(e) => { setPayerName(e.target.value); clearFieldError("payerName"); }}
            placeholder="Ej: Juan Carlos Pérez"
            disabled={loading}
            className={`w-full p-3 border rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 transition-all ${
              formErrors.payerName
                ? "border-red-300 bg-red-50/30 focus:ring-red-100 focus:border-red-400"
                : "border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-[#6b1e96]/15 focus:border-[#6b1e96]"
            }`}
          />
          {formErrors.payerName && (
            <p className="text-red-500 text-xs font-bold mt-1.5 flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">error</span>
              {formErrors.payerName}
            </p>
          )}
        </div>

        {/* ── Teléfono (transferencia, pago_movil) ── */}
        {isBank && (
          <div>
            <label htmlFor="payer_phone" className="block text-xs font-extrabold text-slate-600 uppercase tracking-wider mb-1.5">
              Teléfono del Pagador <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="payer_phone"
              value={payerPhone}
              onChange={(e) => { setPayerPhone(e.target.value); clearFieldError("payerPhone"); }}
              placeholder="0412-1234567"
              disabled={loading}
              className={`w-full p-3 border rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 transition-all ${
                formErrors.payerPhone
                  ? "border-red-300 bg-red-50/30 focus:ring-red-100 focus:border-red-400"
                  : "border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-[#6b1e96]/15 focus:border-[#6b1e96]"
              }`}
            />
            {formErrors.payerPhone && (
              <p className="text-red-500 text-xs font-bold mt-1.5 flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">error</span>
                {formErrors.payerPhone}
              </p>
            )}
          </div>
        )}

        {/* ── Cédula / RIF (transferencia, pago_movil) ── */}
        {isBank && (
          <div>
            <label htmlFor="cedula_number" className="block text-xs font-extrabold text-slate-600 uppercase tracking-wider mb-1.5">
              Cédula / RIF <span className="text-red-500">*</span>
            </label>
            <div className="flex space-x-2.5">
              <select
                value={cedulaType}
                onChange={(e) => setCedulaType(e.target.value)}
                disabled={loading}
                className="w-1/4 p-3 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#6b1e96]/15 focus:border-[#6b1e96] bg-white transition-all cursor-pointer"
              >
                <option value="V">V</option>
                <option value="J">J</option>
                <option value="E">E</option>
                <option value="P">P</option>
                <option value="G">G</option>
              </select>
              <input
                type="text"
                id="cedula_number"
                value={cedulaNumber}
                onChange={(e) => { setCedulaNumber(e.target.value); clearFieldError("payerCedula"); }}
                placeholder="12345678"
                disabled={loading}
                className={`w-3/4 p-3 border rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 transition-all ${
                  formErrors.payerCedula
                    ? "border-red-300 bg-red-50/30 focus:ring-red-100 focus:border-red-400"
                    : "border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-[#6b1e96]/15 focus:border-[#6b1e96]"
                }`}
              />
            </div>
            {formErrors.payerCedula && (
              <p className="text-red-500 text-xs font-bold mt-1.5 flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">error</span>
                {formErrors.payerCedula}
              </p>
            )}
            <p className="text-[10px] font-semibold text-slate-400 mt-1 leading-normal">Ingresa solo los números (ej. 12345678)</p>
          </div>
        )}

        {/* ── Email del titular (Zelle) ── */}
        {isZelle && (
          <div>
            <label htmlFor="payer_email" className="block text-xs font-extrabold text-slate-600 uppercase tracking-wider mb-1.5">
              Correo Electrónico del Titular <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              id="payer_email"
              value={payerEmail}
              onChange={(e) => { setPayerEmail(e.target.value); clearFieldError("payerEmail"); }}
              placeholder="ejemplo@correo.com"
              disabled={loading}
              className={`w-full p-3 border rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 transition-all ${
                formErrors.payerEmail
                  ? "border-red-300 bg-red-50/30 focus:ring-red-100 focus:border-red-400"
                  : "border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-[#6b1e96]/15 focus:border-[#6b1e96]"
              }`}
            />
            {formErrors.payerEmail && (
              <p className="text-red-500 text-xs font-bold mt-1.5 flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">error</span>
                {formErrors.payerEmail}
              </p>
            )}
          </div>
        )}

        {/* ── Fecha de la transacción (Zelle) ── */}
        {isZelle && (
          <div>
            <label htmlFor="payment_date" className="block text-xs font-extrabold text-slate-600 uppercase tracking-wider mb-1.5">
              Fecha de la Transacción <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              id="payment_date"
              value={paymentDate}
              onChange={(e) => { setPaymentDate(e.target.value); clearFieldError("paymentDate"); }}
              max={new Date().toISOString().split("T")[0]}
              disabled={loading}
              className={`w-full p-3 border rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 transition-all ${
                formErrors.paymentDate
                  ? "border-red-300 bg-red-50/30 focus:ring-red-100 focus:border-red-400"
                  : "border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-[#6b1e96]/15 focus:border-[#6b1e96]"
              }`}
            />
            {formErrors.paymentDate && (
              <p className="text-red-500 text-xs font-bold mt-1.5 flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">error</span>
                {formErrors.paymentDate}
              </p>
            )}
          </div>
        )}

        {/* ── Número de Referencia ── */}
        <div>
          <label htmlFor="reference_number" className="block text-xs font-extrabold text-slate-600 uppercase tracking-wider mb-1.5">
            Número de Referencia <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="reference_number"
            value={referenceNumber}
            onChange={(e) => { setReferenceNumber(e.target.value); clearFieldError("referenceNumber"); }}
            placeholder="Ej: 20260426143022"
            disabled={loading}
            className={`w-full p-3 border rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 transition-all ${
              formErrors.referenceNumber
                ? "border-red-300 bg-red-50/30 focus:ring-red-100 focus:border-red-400"
                : "border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-[#6b1e96]/15 focus:border-[#6b1e96]"
            }`}
          />
          {formErrors.referenceNumber && (
            <p className="text-red-500 text-xs font-bold mt-1.5 flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">error</span>
              {formErrors.referenceNumber}
            </p>
          )}
        </div>

        {/* ── Separador visual ── */}
        <div className="border-t border-slate-100 pt-4 mt-3">
          <p className="block text-xs font-extrabold text-slate-600 uppercase tracking-wider mb-2">
            Captura del Comprobante <span className="text-red-500">*</span>
          </p>
        </div>

        {/* ── File Upload ── */}
        <label
          className={`flex flex-col items-center justify-center w-full h-36 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-300 ${
            formErrors.file
              ? "border-red-300 bg-red-50/30 hover:bg-red-50/60"
              : "border-slate-200 bg-slate-50/50 hover:bg-[#6b1e96]/5 hover:border-[#6b1e96]"
          }`}
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6 px-4 text-center">
            <span className="material-symbols-outlined text-[32px] text-slate-400 mb-2 transition-transform duration-300 group-hover:scale-105">
              cloud_upload
            </span>
            <p className="mb-1 text-xs sm:text-sm text-slate-700 font-bold">
              {file ? "Cambiar comprobante" : "Haz clic para seleccionar archivo"}
            </p>
            <p className="text-[10px] text-slate-400 font-bold">
              {file ? file.name : "PNG, JPG o PDF (máx. 5MB)"}
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
        {formErrors.file && (
          <p className="text-red-500 text-xs font-bold mt-1.5 flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">error</span>
            {formErrors.file}
          </p>
        )}

        {/* Thumbnail Preview Area */}
        {preview && (
          <div className="mt-3 p-3 bg-slate-50 border border-slate-100 rounded-2xl flex justify-center relative overflow-hidden">
            <img
              src={preview}
              alt="Vista previa del comprobante"
              loading="lazy"
              className="max-h-48 object-contain rounded-xl shadow-2xs border border-white"
            />
          </div>
        )}
        {file && !preview && (
          <div className="mt-3 p-4 bg-slate-50 border border-slate-100 rounded-2xl text-[#6b1e96] font-bold text-xs flex items-center justify-center gap-2 shadow-2xs">
            <span className="material-symbols-outlined text-base">picture_as_pdf</span>
            <span>Documento PDF seleccionado</span>
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={handleUploadClick}
          disabled={loading}
          className="w-full mt-5 flex items-center justify-center py-3.5 px-6 text-sm font-black rounded-xl text-white bg-gradient-to-r from-[#6b1e96] to-[#8b2fc9] hover:from-[#7b24ab] hover:to-[#9c3ce0] hover:shadow-lg hover:shadow-purple-500/20 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-purple-600/10 cursor-pointer"
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
  paymentMethod: PropTypes.string,
  onUploadComplete: PropTypes.func,
  onError: PropTypes.func,
};
