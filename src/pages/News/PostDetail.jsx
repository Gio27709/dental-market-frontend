import { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { getPostByIdAPI, togglePostSaveAPI } from "../../services/api";
import { track } from "../../services/tracking";
import { 
  ArrowLeft, 
  Calendar, 
  Globe, 
  Sparkles, 
  Share2, 
  FileText,
  Bookmark
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";

export default function PostDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  // El efecto se re-ejecuta al resolverse `user`; esto evita contar la vista dos veces.
  const viewTrackedFor = useRef(null);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const res = await getPostByIdAPI(id);
        if (res.data?.success) {
          const postData = res.data.data;
          setPost(postData);
          setIsSaved(postData.saves?.some(s => s.user_id === user?.id) || false);
          if (viewTrackedFor.current !== postData.id) {
            viewTrackedFor.current = postData.id;
            track("post_view", { post_id: postData.id });
          }
        }
      } catch (err) {
        console.error("Error fetching post", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [id, user]);

  const toggleSave = async () => {
    if (!user) {
      toast.error("Debes iniciar sesión para guardar publicaciones");
      return;
    }
    const nextSavedState = !isSaved;
    setIsSaved(nextSavedState);
    try {
      await togglePostSaveAPI(post.id);
      if (nextSavedState) {
        track("post_save", { post_id: post.id });
        toast.success("Publicación guardada");
      } else {
        toast.success("Publicación eliminada de guardados");
      }
    } catch {
      setIsSaved(!nextSavedState);
      toast.error("Error al registrar guardado");
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href)
      .then(() => {
        toast.success("Enlace de publicación copiado al portapapeles", {
          icon: '🔗'
        });
      })
      .catch(() => {
        toast.error("Error al copiar el enlace");
      });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f1ecf6' }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#c3ff00] border-t-[#531575] rounded-full animate-spin" />
          <span className="text-xs text-gray-500 font-bold">Cargando artículo...</span>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ background: '#f1ecf6' }}>
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4 border border-red-100">
          <Sparkles className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-1">Publicación no encontrada</h2>
        <p className="text-xs text-gray-500 mb-6 text-center max-w-xs">El artículo que buscas no existe, ha sido eliminado o requiere aprobación del administrador.</p>
        <button 
          onClick={() => navigate('/news')} 
          className="px-5 py-2.5 bg-[#531575] hover:bg-[#6b1e96] text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
        >
          Volver al Feed
        </button>
      </div>
    );
  }

  const authorName = post.author?.full_name || (post.author_type === 'admin' || post.author_type === 'owner' ? 'Equipo Forcepx' : 'Doctor Invitado');
  const authorAvatar = post.author?.avatar_url || null;
  const dateText = new Date(post.created_at).toLocaleDateString('es-ES', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <div className="min-h-screen pb-20" style={{ background: '#f1ecf6' }}>
      
      {/* Top Bar Navigation */}
      <div className="bg-white border-b border-slate-200 py-3.5 sticky top-[72px] md:top-[64px] z-40 shadow-[0_2px_15px_rgba(0,0,0,0.01)]">
        <div className="max-w-5xl mx-auto px-4 flex items-center justify-between">
          <Link 
            to="/news" 
            className="flex items-center gap-1.5 text-[#531575] font-extrabold text-xs hover:text-[#6b1e96] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver al Feed</span>
          </Link>
          <button 
            onClick={handleShare}
            className="p-2 hover:bg-slate-50 text-gray-500 hover:text-gray-700 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-bold"
            title="Compartir enlace"
          >
            <Share2 className="w-4 h-4" />
            <span className="hidden sm:inline">Compartir</span>
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Premium Image Card (Desktop spans 5/12 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-md group">
              <div className="relative aspect-4/3 lg:aspect-square overflow-hidden bg-gray-50 flex items-center justify-center">
                {post.thumbnail_url ? (
                  <img 
                    src={post.thumbnail_url} 
                    alt={post.title} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-gray-300 py-20">
                    <FileText className="w-16 h-16" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Sin Portada</span>
                  </div>
                )}
                
                {/* Category Overlay Tag */}
                <div className="absolute top-4 left-4">
                  <span className="bg-[#531575] text-white text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full shadow-md">
                    {post.category}
                  </span>
                </div>
              </div>
            </div>

            {/* Back to feed support card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-md hidden lg:block">
              <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
                Forcepx Journal
              </span>
              <p className="text-[11px] text-gray-500 leading-relaxed font-normal">
                Esta publicación forma parte del espacio de difusión científica de Forcepx. Todos los artículos y opiniones son responsabilidad de sus autores.
              </p>
            </div>
          </div>

          {/* Right Column: Content and Author Card (Desktop spans 7/12 cols) */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-md">
            
            {/* Header info */}
            <div className="border-b border-slate-200 pb-5 mb-6">
              
              {/* Category */}
              <span className="text-[#531575] font-black text-[10px] uppercase tracking-widest block mb-2">
                {post.category}
              </span>

              {/* Title */}
              <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight font-sans leading-tight mb-4">
                {post.title}
              </h1>

              {/* Author Info Card */}
              <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 p-3 rounded-2xl">
                {/* Author Avatar */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center p-[2px] ${
                  post.author_type === 'admin' || post.author_type === 'owner'
                    ? "bg-gradient-to-tr from-[#531575] to-[#c3ff00]"
                    : "bg-[#531575]/30"
                }`}>
                  <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                    {authorAvatar ? (
                      <img src={authorAvatar} alt={authorName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-purple-50 text-[#531575] flex items-center justify-center font-bold text-sm">
                        {authorName.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                </div>

                {/* Name, Type & Date */}
                <div className="flex-grow">
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-xs text-gray-900 tracking-tight leading-tight">
                      {authorName}
                    </span>
                    <span className="bg-[#531575]/10 text-[#531575] text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider scale-90">
                      {post.author_type === 'admin' || post.author_type === 'owner' ? 'Staff' : 'Autor'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[9px] text-gray-400 font-bold mt-0.5">
                    <Calendar className="w-3 h-3 text-gray-400" />
                    <span>Publicado el {dateText}</span>
                    <span>•</span>
                    <Globe className="w-3 h-3 text-gray-400" />
                    <span>Público</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Prose Rich Text Content */}
            <main className="prose prose-purple prose-sm md:prose-base max-w-none text-gray-700 leading-relaxed font-normal text-left">
              <div 
                className="space-y-4 whitespace-pre-line"
                dangerouslySetInnerHTML={{ __html: post.content }} 
              />
            </main>

            {/* Bottom Actions and Navigation */}
            <div className="border-t border-slate-200 mt-10 pt-6 flex items-center justify-between">
              <Link 
                to="/news" 
                className="flex items-center gap-1.5 text-[#531575] hover:text-[#6b1e96] font-extrabold text-xs transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Volver a Publicaciones</span>
              </Link>

              <div className="flex items-center gap-2">
                <button 
                  onClick={toggleSave}
                  className={`px-4 py-2 border rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 shadow-sm ${
                    isSaved 
                      ? "border-[#531575] bg-[#531575]/5 text-[#531575]" 
                      : "border-slate-200 hover:bg-slate-50 text-gray-650"
                  }`}
                >
                  <Bookmark className={`w-4 h-4 ${isSaved ? "fill-[#531575] text-[#531575]" : "text-gray-500"}`} />
                  <span>{isSaved ? "Guardado" : "Guardar"}</span>
                </button>

                <button 
                  onClick={handleShare}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-gray-650 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  <Share2 className="w-4 h-4 text-gray-500" />
                  <span>Copiar Enlace</span>
                </button>
              </div>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
}
