import { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { uploadPostImageAPI } from "../../services/api";
import { uploadFileDirectly } from "../../lib/upload";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

// Helper functions for HTML conversion
const convertTextToHtml = (text) => {
  if (!text) return "";
  return text
    .trim()
    .split(/\n\n+/)
    .map(paragraph => `<p>${paragraph.replace(/\n/g, "<br />")}</p>`)
    .join("\n");
};

const convertHtmlToText = (html) => {
  if (!html) return "";
  // Check if it's already plain text (doesn't contain typical tags)
  if (!html.includes("<p>") && !html.includes("<br") && !html.includes("<h2>") && !html.includes("<h3>")) {
    return html;
  }
  return html
    .replace(/<p>/g, "")
    .replace(/<\/p>/g, "\n\n")
    .replace(/<br\s*\/?>/g, "\n")
    .replace(/<[^>]+>/g, "") // Strip any other tags (fallback)
    .trim();
};

export default function PostModal({ post, onSave, onClose, initialCategory, autoTriggerUpload }) {
  const { user } = useAuth();
  const isAdminOrOwner = user?.role === "admin" || user?.role === "owner";

  // Form states
  const [title, setTitle] = useState(post?.title || "");
  const [category, setCategory] = useState(post?.category || initialCategory || "Noticias");
  const [thumbnailUrl, setThumbnailUrl] = useState(post?.thumbnail_url || "");
  const [content, setContent] = useState("");
  
  // Advanced mode for admins (raw HTML editing)
  const [isHtmlMode, setIsHtmlMode] = useState(false);

  // UI States
  const [activeTab, setActiveTab] = useState("edit"); // edit or preview
  const [uploading, setUploading] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  
  const fileInputRef = useRef(null);

  // Initialize content correctly
  useEffect(() => {
    if (post) {
      // If editing, check if it contains complex tags to auto-enable HTML mode for admins
      const hasComplexTags = /<h[1-6]>|<a\s|<ul|<ol|<li|<strong>/i.test(post.content || "");
      if (hasComplexTags && isAdminOrOwner) {
        setIsHtmlMode(true);
        setContent(post.content || "");
      } else {
        setContent(convertHtmlToText(post.content || ""));
      }
    } else {
      setContent("");
    }
  }, [post, isAdminOrOwner]);

  // Auto-trigger file upload if requested
  useEffect(() => {
    if (autoTriggerUpload && !post && fileInputRef.current) {
      // Small timeout to ensure file input ref is fully mounted and ready
      const timer = setTimeout(() => {
        fileInputRef.current?.click();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [autoTriggerUpload, post]);

  // Handle Cover Image upload
  const handleFileUpload = async (file) => {
    if (!file) return;
    
    // Check size limit (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("La imagen excede el límite de 10MB");
      return;
    }

    setUploading(true);
    const uploadToast = toast.loading("Subiendo y optimizando imagen de portada...");
    try {
      // 1. Upload to Supabase Storage directly via presigned URL (stored in products bucket)
      const { publicUrl, path } = await uploadFileDirectly(file, "products");

      // 2. Notify backend of the upload to trigger background optimization
      const res = await uploadPostImageAPI({ path, url: publicUrl });
      if (res.data?.success) {
        setThumbnailUrl(res.data.file.url);
        toast.success("Portada cargada correctamente", { id: uploadToast });
        setShowUrlInput(false);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || "Error al subir la imagen", { id: uploadToast });
    } finally {
      setUploading(false);
    }
  };

  const onDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const onDragLeave = () => {
    setDragOver(false);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("El título es obligatorio");
      return;
    }
    if (!content.trim()) {
      toast.error("El contenido es obligatorio");
      return;
    }

    // Convert content to HTML if in plain text mode
    const finalContent = isHtmlMode ? content : convertTextToHtml(content);

    const payload = {
      title: title.trim(),
      category,
      thumbnail_url: thumbnailUrl.trim() || null,
      content: finalContent,
    };

    onSave(payload);
  };

  // Live preview HTML content
  const previewHtml = isHtmlMode ? content : convertTextToHtml(content);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      {/* Modal Container */}
      <div className="relative bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50/50 to-white">
          <div>
            <h2 className="text-xl font-extrabold text-gray-900 font-['Manrope'] tracking-tight">
              {post ? "Editar Publicación" : "Proponer Publicación"}
            </h2>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Comparte conocimientos, noticias y casos odontológicos con la comunidad.
            </p>
          </div>
          <button type="button" onClick={onClose} className="p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 rounded-full transition-colors cursor-pointer">
            <span className="material-symbols-outlined text-[20px] block">close</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6 text-xs font-semibold text-left">
          
          {/* Moderation Banner for general users */}
          {!isAdminOrOwner && (
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-[#531575]/5 border border-[#531575]/15 text-[#531575]">
              <span className="material-symbols-outlined text-[#531575] flex-shrink-0 mt-0.5 text-[18px]">gavel</span>
              <div className="leading-relaxed">
                <strong className="font-bold">Revisión de la Comunidad:</strong> Tu publicación se enviará a la cola de moderación. Estará disponible en el blog una vez aprobada por el administrador para asegurar la calidad y ética científica.
              </div>
            </div>
          )}

          {/* Title input */}
          <div className="space-y-1">
            <label className="block text-gray-750 font-bold text-xs">Título de la Publicación *</label>
            <input
              required
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#531575]/25 focus:border-[#531575] focus:outline-none text-sm font-normal text-gray-800 transition-all placeholder-gray-400 bg-gray-50/35"
              placeholder="Ej: Avances clínicos en odontología estética..."
            />
          </div>

          {/* Category & Cover Photo Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Category selection */}
            <div className="space-y-1">
              <label className="block text-gray-750 font-bold text-xs">Categoría</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#531575]/25 focus:border-[#531575] focus:outline-none text-xs font-normal text-gray-800 bg-gray-50/35 transition-all"
              >
                <option value="Noticias">Noticias</option>
                <option value="Casos Clínicos">Casos Clínicos</option>
                <option value="Investigación">Investigación</option>
                <option value="Entrevistas">Entrevistas</option>
                <option value="Innovación">Innovación</option>
              </select>
            </div>

            {/* Cover image selector container */}
            <div className="space-y-1 flex flex-col justify-end">
              <label className="block text-gray-750 font-bold text-xs mb-1">Imagen de Portada (Artículo)</label>
              
              {thumbnailUrl ? (
                /* Cover Photo Preview Mode */
                <div className="relative w-full h-32 rounded-2xl overflow-hidden border border-gray-100 shadow-inner group">
                  <img src={thumbnailUrl} alt="Portada" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 bg-white text-gray-800 rounded-lg hover:bg-gray-100 text-[10px] font-bold transition-all shadow-md active:scale-95 cursor-pointer"
                    >
                      Reemplazar
                    </button>
                    <button
                      type="button"
                      onClick={() => setThumbnailUrl("")}
                      className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 text-[10px] font-bold transition-all shadow-md active:scale-95 cursor-pointer"
                    >
                      Quitar
                    </button>
                  </div>
                </div>
              ) : (
                /* Cover Upload Zone */
                <div
                  onDragOver={onDragOver}
                  onDragLeave={onDragLeave}
                  onDrop={onDrop}
                  className={`w-full min-h-32 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-4 transition-all ${
                    dragOver
                      ? "border-[#531575] bg-[#531575]/5"
                      : "border-gray-200 bg-gray-50 hover:bg-gray-100/70 hover:border-gray-300"
                  }`}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={(e) => handleFileUpload(e.target.files?.[0])}
                    accept="image/*"
                    className="hidden"
                  />
                  
                  {uploading ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-6 h-6 border-2 border-[#531575] border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-[10px] text-gray-400">Subiendo portada...</span>
                    </div>
                  ) : showUrlInput ? (
                    <div className="w-full space-y-2 animate-in fade-in duration-200">
                      <input
                        type="url"
                        value={thumbnailUrl}
                        onChange={(e) => setThumbnailUrl(e.target.value)}
                        className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-normal focus:outline-none focus:ring-1 focus:ring-[#531575]"
                        placeholder="Pegar dirección de la imagen (URL)..."
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setShowUrlInput(false)}
                          className="text-[10px] text-gray-400 hover:text-gray-600 font-bold"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowUrlInput(false)}
                          className="text-[10px] text-[#531575] hover:underline font-bold"
                        >
                          Listo
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center">
                      <span className="material-symbols-outlined text-gray-400 text-[24px]">cloud_upload</span>
                      <p className="text-[10px] text-gray-500 mt-1 font-normal">
                        Arrastra una foto aquí o
                      </p>
                      <div className="flex items-center gap-2 mt-2 justify-center">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-3 py-1.5 bg-[#531575] text-white rounded-lg text-[10px] font-bold shadow-sm hover:bg-[#6b1e96] transition-all cursor-pointer"
                        >
                          Subir Archivo
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowUrlInput(true)}
                          className="px-3 py-1.5 bg-white border border-gray-200 text-gray-650 rounded-lg text-[10px] font-bold shadow-sm hover:bg-gray-50 transition-all cursor-pointer"
                        >
                          Pegar URL
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Rich Content Editor Section */}
          <div className="space-y-2 flex flex-col flex-1 min-h-[250px]">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <label className="block text-gray-750 font-bold text-xs">Cuerpo del Artículo *</label>
              
              {/* Tab Navigation for Edit vs Preview */}
              <div className="flex bg-gray-100 rounded-lg p-0.5">
                <button
                  type="button"
                  onClick={() => setActiveTab("edit")}
                  className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${
                    activeTab === "edit"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  Escribir
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("preview")}
                  className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${
                    activeTab === "preview"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  Vista Previa
                </button>
              </div>
            </div>

            {activeTab === "edit" ? (
              /* Writing Editor Area */
              <div className="flex-1 flex flex-col border border-gray-200 rounded-2xl overflow-hidden focus-within:ring-2 focus-within:ring-[#531575]/25 focus-within:border-[#531575] bg-gray-50/10 transition-all min-h-[200px]">
                {/* Advanced Mode Toggle for Administrators only */}
                {isAdminOrOwner && (
                  <div className="bg-gray-50 border-b border-gray-100 px-4 py-2 flex items-center justify-between">
                    <span className="text-[10px] text-gray-400 font-normal">
                      El texto plano se autoconvierte a párrafos en el portal.
                    </span>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isHtmlMode}
                        onChange={(e) => {
                          const val = e.target.checked;
                          setIsHtmlMode(val);
                          // Reconvert to help admin keep progress
                          if (val) {
                            setContent(convertTextToHtml(content));
                          } else {
                            setContent(convertHtmlToText(content));
                          }
                        }}
                        className="w-3.5 h-3.5 text-[#531575] border-gray-300 rounded focus:ring-[#531575]"
                      />
                      <span className="text-[10px] font-bold text-gray-600">Modo HTML</span>
                    </label>
                  </div>
                )}

                <textarea
                  required
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={8}
                  className={`w-full p-4 focus:outline-none text-sm font-normal text-gray-800 flex-1 resize-none bg-transparent ${
                    isHtmlMode ? "font-mono text-xs" : ""
                  }`}
                  placeholder={
                    isHtmlMode
                      ? "Ej: <p>Contenido con <strong>HTML</strong>...</p>"
                      : "Escribe el contenido de tu publicación aquí. Utiliza un salto de línea (Enter) para separar tus párrafos. No es necesario ingresar código de programación."
                  }
                />
              </div>
            ) : (
              /* Live Preview Area */
              <div className="flex-1 min-h-[200px] border border-gray-200 rounded-2xl p-5 overflow-y-auto bg-gray-50/50 max-h-[300px]">
                {previewHtml ? (
                  <div className="prose prose-sm max-w-none text-gray-800 font-normal space-y-4">
                    <h2 className="text-xl font-extrabold text-gray-900">{title || "Sin Título"}</h2>
                    <span className="inline-block px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-purple-50 text-[#531575] rounded border border-purple-100">
                      {category}
                    </span>
                    {thumbnailUrl && (
                      <div className="w-full h-44 rounded-xl overflow-hidden shadow-sm border my-2 bg-gray-100">
                        <img src={thumbnailUrl} alt="" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div 
                      className="text-gray-700 leading-relaxed text-sm pt-2"
                      dangerouslySetInnerHTML={{ __html: previewHtml }}
                    />
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-400 font-normal py-10">
                    No hay contenido que previsualizar. Escribe algo en la pestaña &quot;Escribir&quot;.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Submit Action Controls */}
          <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 border border-gray-200 hover:bg-gray-100 text-gray-600 rounded-xl font-bold transition-all active:scale-95 cursor-pointer text-xs uppercase tracking-wider"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-[#531575] hover:bg-[#6b1e96] text-white rounded-xl font-bold transition-all shadow-md active:scale-95 cursor-pointer text-xs uppercase tracking-wider"
            >
              {post ? "Guardar Publicación" : isAdminOrOwner ? "Publicar" : "Enviar a Moderación"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

PostModal.propTypes = {
  post: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    title: PropTypes.string,
    content: PropTypes.string,
    thumbnail_url: PropTypes.string,
    category: PropTypes.string,
    is_published: PropTypes.bool,
  }),
  onSave: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  initialCategory: PropTypes.string,
  autoTriggerUpload: PropTypes.bool,
};
