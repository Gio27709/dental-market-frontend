import { useState, useEffect, useCallback } from "react";
import { getProfessionalStatusAPI, uploadProfessionalLicenseAPI } from "../../services/api";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";

export default function ProfessionalVerification() {
  const { user } = useAuth();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const fetchStatus = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getProfessionalStatusAPI();
      if (res.data && res.data.success) {
        setStatus(res.data.data);
      }
    } catch (err) {
      console.error("[ProfessionalVerification] Error fetching status:", err);
      // Silently set status to null or handle error
      setStatus(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const validateAndSetFile = (selectedFile) => {
    if (!selectedFile) return;

    const allowedMimeTypes = ["application/pdf", "image/jpeg", "image/png"];
    if (!allowedMimeTypes.includes(selectedFile.type)) {
      toast.error("Formato inválido. Solo se admiten archivos PDF, JPG o PNG.");
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      toast.error("El archivo supera el tamaño máximo permitido de 5MB.");
      return;
    }

    setFile(selectedFile);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      toast.error("Por favor selecciona un archivo.");
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(20);

      const formData = new FormData();
      formData.append("file", file);

      // Simular progreso de subida
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 80) {
            clearInterval(progressInterval);
            return 80;
          }
          return prev + 15;
        });
      }, 200);

      const res = await uploadProfessionalLicenseAPI(formData);
      clearInterval(progressInterval);
      setUploadProgress(100);

      if (res.data && res.data.success) {
        toast.success("Documento subido correctamente. En revisión.");
        setFile(null);
        await fetchStatus();
      }
    } catch (err) {
      console.error("[ProfessionalVerification] Upload error:", err);
      toast.error(err.message || "Error al subir el documento.");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // Evaluar estado actual
  const isVerified = status?.is_verified === true;
  const isPending = status?.is_verified === false && status?.license_image_url && !status?.license_reviewed_at;
  const isRejected = status?.is_verified === false && status?.license_reviewed_at;
  const notUploaded = !status?.license_image_url;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-500 text-sm font-medium">Cargando información de verificación...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 lg:p-8 bg-white/70 backdrop-blur-md rounded-2xl shadow-sm border border-gray-100">
      <div className="flex items-center gap-4 mb-6">
        <div className="p-3 bg-primary-50 rounded-xl text-primary-600">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Verificación de Odontólogo</h1>
          <p className="text-gray-500 text-sm mt-0.5">Valida tu matrícula profesional para acceder a tarifas preferenciales.</p>
        </div>
      </div>

      {/* DETALLES DEL PROFESIONAL */}
      <div className="bg-gray-50/50 rounded-xl p-4 mb-8 border border-gray-100 flex flex-col sm:flex-row gap-4 sm:justify-between sm:items-center">
        <div>
          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Especialidad Registrada</p>
          <p className="text-gray-900 font-semibold text-lg">{status?.specialty || "Odontología General"}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Matrícula / Licencia</p>
          <p className="text-gray-900 font-mono font-bold text-lg">{status?.license_number || "No registrada"}</p>
        </div>
      </div>

      {/* ESTADO DE VERIFICACIÓN */}

      {/* ESTADO: VERIFICADO (Badge Dorado Holográfico Premium) */}
      {isVerified && (
        <div className="relative overflow-hidden rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50/70 via-yellow-50/40 to-amber-100/50 p-6 sm:p-8 text-center flex flex-col items-center shadow-sm">
          <div className="absolute -top-12 -right-12 w-28 h-28 bg-amber-200/20 rounded-full blur-xl animate-pulse"></div>
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4 text-amber-600 shadow-md ring-4 ring-amber-50">
            <svg className="w-9 h-9" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-amber-800 mb-2">¡Odontólogo Verificado!</h2>
          <p className="text-amber-700 text-sm max-w-md leading-relaxed mb-6">
            Tu matrícula ha sido revisada y aprobada por nuestro equipo administrativo. Ya tienes acceso exclusivo a todos los insumos médicos a precio mayorista.
          </p>
          {status?.signed_url && (
            <a
              href={status.signed_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-medium text-sm rounded-lg shadow-sm hover:shadow transition-all"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <span>Ver Licencia Subida</span>
            </a>
          )}
        </div>
      )}

      {/* ESTADO: PENDIENTE DE REVISIÓN */}
      {isPending && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-6 sm:p-8 text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4 text-blue-600 animate-pulse">
            <svg className="w-9 h-9" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-blue-900 mb-2">Verificación en Proceso</h2>
          <p className="text-blue-700 text-sm max-w-md leading-relaxed mb-4">
            Hemos recibido tus documentos correctamente. Nuestro equipo de soporte validará tu matrícula profesional en un periodo aproximado de **24 a 48 horas**.
          </p>
          <div className="text-xs text-blue-500 font-semibold px-3 py-1 bg-blue-100/60 rounded-full">
            Estado: Esperando revisión administrativa
          </div>
        </div>
      )}

      {/* ESTADO: RECHAZADO (Con motivos y opción de re-subida) */}
      {isRejected && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50/40 p-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="p-2 bg-red-100 text-red-700 rounded-lg">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h2 className="font-bold text-red-950">Solicitud de Verificación Rechazada</h2>
              <p className="text-red-700 text-sm mt-0.5">El documento enviado no cumple con los requisitos del sistema.</p>
            </div>
          </div>
          {status?.license_review_notes && (
            <div className="p-4 bg-white/80 rounded-xl border border-red-100 text-sm text-red-900 mb-4 font-medium">
              <span className="font-bold text-red-950 block mb-1">Motivo del rechazo:</span>
              "{status.license_review_notes}"
            </div>
          )}
          <p className="text-xs text-red-600">Por favor, vuelve a subir un documento válido para intentar de nuevo.</p>
        </div>
      )}

      {/* FORMULARIO DE CARGA (Para no subidos o rechazados) */}
      {(notUploaded || isRejected) && (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="text-gray-700 text-sm leading-relaxed mb-4">
            Para validar tu cuenta profesional, debes subir una copia digital de tu **Licencia, Diploma o Credencial de Matrícula Profesional** en donde sea perfectamente visible tu nombre y número de identificación médico.
          </div>

          {/* Drag & Drop Area */}
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all relative ${
              dragActive ? "border-primary-600 bg-primary-50/20" : "border-gray-300 hover:border-gray-400 bg-gray-50/40"
            }`}
          >
            <input
              type="file"
              id="license-upload-input"
              className="hidden"
              onChange={handleFileChange}
              accept=".pdf,.jpg,.jpeg,.png"
              disabled={uploading}
            />
            
            <label htmlFor="license-upload-input" className="cursor-pointer flex flex-col items-center">
              <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-gray-400 shadow-sm border border-gray-100 group-hover:scale-105 transition-transform mb-4">
                <svg className="w-8 h-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <span className="font-semibold text-gray-800 text-base">Arrastra tu archivo aquí o haz clic para buscar</span>
              <span className="text-xs text-gray-500 mt-1">Formatos soportados: PDF, JPG, PNG (máx. 5MB)</span>
            </label>

            {file && (
              <div className="mt-6 p-3 bg-white border border-gray-200 rounded-xl flex items-center justify-between shadow-sm animate-fadeIn">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="p-2 bg-primary-50 rounded-lg text-primary-600">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="text-left overflow-hidden">
                    <p className="text-sm font-semibold text-gray-800 truncate max-w-[200px] sm:max-w-xs">{file.name}</p>
                    <p className="text-xs text-gray-400">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  className="p-1 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-700 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
          </div>

          {/* Upload Progress Bar */}
          {uploading && (
            <div className="space-y-2">
              <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-primary-600 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 font-medium text-right">Subiendo y convirtiendo documento... {uploadProgress}%</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!file || uploading}
            className="w-full py-3 px-4 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 text-white font-semibold rounded-xl shadow-sm hover:shadow transition-all disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {uploading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Subiendo Documento...</span>
              </>
            ) : (
              <span>Enviar para Verificación</span>
            )}
          </button>
        </form>
      )}
    </div>
  );
}
