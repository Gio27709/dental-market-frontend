import { useState } from 'react';
import PropTypes from 'prop-types';
import { uploadShippingEvidenceAPI } from '../../services/api';
import { uploadFileDirectly } from '../../lib/upload';
import { Camera, X, Loader2, UploadCloud, CheckCircle, ShieldAlert, Clock } from 'lucide-react';
import { toast } from 'react-hot-toast';

const ShippingEvidenceUploader = ({ onEvidenceChange }) => {
  const [photos, setPhotos] = useState([]);
  const [uploading, setUploading] = useState(false);
  const maxPhotos = 5;

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    
    if (photos.length + files.length > maxPhotos) {
      toast.error(`Puedes subir un máximo de ${maxPhotos} fotos.`);
      return;
    }

    setUploading(true);

    try {
      const newUrls = [];
      for (const file of files) {
        // Validate
        if (!file.type.match('image.*')) {
          toast.error(`${file.name} no es una imagen válida.`);
          continue;
        }
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`${file.name} excede el límite de 5MB.`);
          continue;
        }

        // 1. Upload to Supabase Storage directly via presigned URL
        const { publicUrl, path } = await uploadFileDirectly(file, "shipping_evidence");

        // 2. Notify backend of the upload to trigger background optimization
        const res = await uploadShippingEvidenceAPI({ path, url: publicUrl });
        newUrls.push(res.data.url);
      }

      const updatedPhotos = [...photos, ...newUrls];
      setPhotos(updatedPhotos);
      onEvidenceChange(updatedPhotos);
      toast.success("Foto(s) subida(s) exitosamente.");

    } catch (error) {
      toast.error("Error subiendo la evidencia. Intenta de nuevo.");
      console.error(error);
    } finally {
      setUploading(false);
      e.target.value = null; // reset
    }
  };

  const removePhoto = (indexToRemove) => {
    const updatedPhotos = photos.filter((_, index) => index !== indexToRemove);
    setPhotos(updatedPhotos);
    onEvidenceChange(updatedPhotos);
  };

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-2">
      {/* ── WATERMARK REQUIREMENT BANNER ── */}
      <div className="mb-4 rounded-xl border-2 border-[#6b1e96]/30 bg-gradient-to-r from-[#6b1e96]/[0.06] to-purple-50 p-3.5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-20 h-20 bg-[#6b1e96]/[0.04] rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="flex items-start gap-2.5">
          <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-[#6b1e96]/10 flex items-center justify-center mt-0.5">
            <ShieldAlert className="w-5 h-5 text-[#6b1e96]" />
          </div>
          <div className="flex-1 min-w-0">
            <h5 className="text-[13px] font-extrabold text-[#6b1e96] leading-tight mb-1 flex items-center gap-1.5">
              Marca de Agua Obligatoria
            </h5>
            <p className="text-[11px] text-gray-700 leading-relaxed mb-2">
              Tus fotos de evidencia <strong className="text-[#6b1e96]">deben incluir la marca de agua con fecha y hora</strong> generada por la cámara de tu teléfono.
              Activa esta función desde los ajustes de tu cámara antes de tomar las fotos.
            </p>
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#6b1e96]/70 bg-[#6b1e96]/[0.06] rounded-lg px-2.5 py-1.5 w-fit border border-[#6b1e96]/10">
              <Clock className="w-3 h-3" />
              El sistema también registrará la hora exacta de este envío
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-start mb-3">
        <div>
          <h4 className="text-sm font-semibold flex items-center text-gray-800">
            <Camera className="w-4 h-4 mr-1.5 text-blue-500" />
            Evidencia Fotográfica
          </h4>
          <p className="text-xs text-gray-500 mt-0.5">Sube de 1 a {maxPhotos} fotos del paquete/recibo.</p>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full font-medium ${photos.length >= 1 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
          {photos.length} / {maxPhotos} {photos.length >= 1 ? <CheckCircle className="inline w-3 h-3 ml-1" /> : "(Mín 1 Obligatoria)"}
        </span>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-3">
        {photos.map((url, index) => (
          <div key={index} className="relative aspect-square rounded-md overflow-hidden bg-gray-200 border border-gray-300">
            <img src={url} alt={`Evidencia ${index + 1}`} className="object-cover w-full h-full" />
            <button
              type="button"
              onClick={() => removePhoto(index)}
              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-80 hover:opacity-100 shadow-sm"
              title="Eliminar foto"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
        
        {photos.length < maxPhotos && (
          <div className="relative aspect-square">
            <input
              type="file"
              id="evidenceUpload"
              multiple
              accept="image/jpeg, image/png, image/webp"
              onChange={handleFileSelect}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
              disabled={uploading}
            />
            <div className={`w-full h-full rounded-md border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-500 hover:bg-gray-100 hover:border-blue-400 transition-colors ${uploading ? 'opacity-50' : ''}`}>
              {uploading ? (
                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
              ) : (
                <>
                  <UploadCloud className="w-6 h-6 mb-1" />
                  <span className="text-[10px] font-medium text-center px-1">Añadir Foto</span>
                </>
              )}
            </div>
          </div>
        )}
      </div>
      
      {photos.length === 0 && (
        <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-100 flex items-start">
          <span className="mr-1">⚠️</span>
          <span>Debes subir al menos 1 foto del paquete con su guía pegada o el recibo del courier para poder marcar como despachado.</span>
        </div>
      )}
    </div>
  );
};

ShippingEvidenceUploader.propTypes = {
  onEvidenceChange: PropTypes.func.isRequired,
};

export default ShippingEvidenceUploader;
