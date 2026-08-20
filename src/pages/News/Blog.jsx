import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { 
  getPostsAPI, 
  createPostAPI,
  togglePostLikeAPI,
  getPostCommentsAPI,
  createPostCommentAPI,
  togglePostSaveAPI
} from "../../services/api";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { track, trackPostOnce } from "../../services/tracking";
import { usePostImpressions } from "../../hooks/usePostImpressions";
import toast from "react-hot-toast";
import PostModal from "../../components/posts/PostModal";
import AuthPromptModal from "../../components/auth/AuthPromptModal";
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Globe, 
  BookOpen, 
  Plus,
  Image as ImageIcon,
  FileText,
  MessageSquare,
  Sparkles,
  User as UserIcon,
  ExternalLink,
  Bookmark
} from "lucide-react";

const animationsStyle = `
@keyframes heartPop {
  0% { transform: scale(0) rotate(-10deg); opacity: 0; }
  50% { transform: scale(1.3) rotate(5deg); opacity: 0.95; }
  70% { transform: scale(0.95) rotate(-5deg); opacity: 0.95; }
  100% { transform: scale(1) rotate(0deg); opacity: 1; }
}
.animate-heart-pop {
  animation: heartPop 0.45s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
}

@keyframes doubleTapHeart {
  0% { transform: scale(0) translate(-50%, -50%); opacity: 0; }
  15% { transform: scale(1.2) translate(-50%, -50%); opacity: 0.9; }
  30% { transform: scale(1) translate(-50%, -50%); opacity: 0.9; }
  80% { transform: scale(1) translate(-50%, -50%); opacity: 0.9; }
  100% { transform: scale(0.5) translate(-50%, -50%); opacity: 0; }
}
.animate-double-tap-heart {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  animation: doubleTapHeart 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
  pointer-events: none;
  z-index: 30;
}

.hide-scrollbar::-webkit-scrollbar {
  display: none;
}
.hide-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
`;

export default function Blog() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const { user } = useAuth();

  // Settings & Creation states
  const [postMode, setPostMode] = useState("disabled"); // disabled, moderated, open
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [modalInitialCategory, setModalInitialCategory] = useState("Noticias");
  const [modalAutoTriggerUpload, setModalAutoTriggerUpload] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Likes state
  const [likedPosts, setLikedPosts] = useState({});
  const [savedPosts, setSavedPosts] = useState({});

  // Double tap hearts state
  const [activeHeartAnimations, setActiveHeartAnimations] = useState({});

  // Comments state
  const [comments, setComments] = useState({});
  const [loadingComments, setLoadingComments] = useState({});

  const [activeCommentsDrawer, setActiveCommentsDrawer] = useState({});
  const [newCommentTexts, setNewCommentTexts] = useState({});
  const [expandedPosts, setExpandedPosts] = useState({});

  // Alcance del feed: una impresión por publicación y sesión, cuando estuvo
  // de verdad en pantalla. Las aperturas (post_view) las emiten los handlers.
  const impressionRef = usePostImpressions("feed");

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getPostsAPI();
      if (res.data?.success) {
        setPosts(res.data.data);
      }
    } catch (err) {
      console.error("Error fetching posts:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSettings = useCallback(async () => {
    try {
      setLoadingSettings(true);
      const res = await api.get("/admin/settings");
      const setting = res.data.data?.allow_user_posts;
      if (setting) {
        const mode = setting.mode || (setting.enabled ? "moderated" : "disabled");
        setPostMode(mode);
      }
    } catch (err) {
      console.error("Error fetching platform settings:", err);
    } finally {
      setLoadingSettings(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
    fetchSettings();
  }, [fetchPosts, fetchSettings]);

  // Synchronize liked state mapping from DB joins on posts change
  useEffect(() => {
    if (posts.length > 0) {
      const likesMap = {};
      const savesMap = {};
      posts.forEach(p => {
        likesMap[p.id] = p.likes?.some(l => l.user_id === user?.id) || false;
        savesMap[p.id] = p.saves?.some(s => s.user_id === user?.id) || false;
      });
      setLikedPosts(likesMap);
      setSavedPosts(savesMap);
    }
  }, [posts, user]);

  const handleOpenModal = (category = "Noticias", triggerUpload = false) => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }

    const isAdminOrOwner = user.role === 'admin' || user.role === 'owner';
    if (postMode === "disabled" && !isAdminOrOwner) {
      toast.error("La creación de publicaciones por usuarios está desactivada temporalmente");
      return;
    }

    setModalInitialCategory(category);
    setModalAutoTriggerUpload(triggerUpload);
    setCreateModalOpen(true);
  };

  const handleSavePost = async (formData) => {
    const loadingToast = toast.loading("Enviando publicación...");
    try {
      await createPostAPI(formData);
      
      const isAdminOrOwner = user?.role === 'admin' || user?.role === 'owner';
      if (isAdminOrOwner) {
        toast.success("Publicación creada y activa inmediatamente", { id: loadingToast });
        await fetchPosts();
      } else if (postMode === 'open') {
        toast.success("¡Tu publicación ha sido creada exitosamente!", { id: loadingToast });
        await fetchPosts();
      } else {
        toast.success("¡Tu propuesta ha sido enviada! Estará visible una vez que el administrador la apruebe.", {
          id: loadingToast,
          duration: 5000
        });
      }
      setCreateModalOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.error || "Error al enviar la publicación", { id: loadingToast });
    }
  };

  const toggleLike = async (postId) => {
    if (!user) {
      toast.error("Debes iniciar sesión para dar me gusta");
      return;
    }
    
    const currentlyLiked = !!likedPosts[postId];

    // Optimistic UI state update
    setLikedPosts(prev => ({ ...prev, [postId]: !currentlyLiked }));
    setPosts(prevPosts => 
      prevPosts.map(p => {
        if (p.id === postId) {
          const updatedLikes = [...(p.likes || [])];
          if (currentlyLiked) {
            return {
              ...p,
              likes: updatedLikes.filter(l => l.user_id !== user.id)
            };
          } else {
            updatedLikes.push({ user_id: user.id });
            return {
              ...p,
              likes: updatedLikes
            };
          }
        }
        return p;
      })
    );

    try {
      await togglePostLikeAPI(postId);
      // Solo el "me gusta", no el quitarlo: el evento mide el acto, no el estado.
      if (!currentlyLiked) track("post_like", { post_id: postId, surface: "feed" });
    } catch {
      toast.error("Error al registrar reacción");
      // Revert/Reload
      await fetchPosts();
    }
  };

  const toggleSave = async (postId) => {
    if (!user) {
      toast.error("Debes iniciar sesión para guardar publicaciones");
      return;
    }
    
    const currentlySaved = !!savedPosts[postId];

    // Optimistic UI state update
    setSavedPosts(prev => ({ ...prev, [postId]: !currentlySaved }));
    setPosts(prevPosts => 
      prevPosts.map(p => {
        if (p.id === postId) {
          const updatedSaves = [...(p.saves || [])];
          if (currentlySaved) {
            return {
              ...p,
              saves: updatedSaves.filter(s => s.user_id !== user.id)
            };
          } else {
            updatedSaves.push({ user_id: user.id });
            return {
              ...p,
              saves: updatedSaves
            };
          }
        }
        return p;
      })
    );

    try {
      await togglePostSaveAPI(postId);
      if (!currentlySaved) {
        track("post_save", { post_id: postId, surface: "feed" });
        toast.success("Publicación guardada");
      } else {
        toast.success("Publicación eliminada de guardados");
      }
    } catch {
      toast.error("Error al registrar guardado");
      // Revert/Reload
      await fetchPosts();
    }
  };

  const handleImageDoubleTap = (postId) => {
    setActiveHeartAnimations(prev => ({ ...prev, [postId]: true }));
    if (!likedPosts[postId]) {
      toggleLike(postId);
    }
    setTimeout(() => {
      setActiveHeartAnimations(prev => ({ ...prev, [postId]: false }));
    }, 800);
  };

  const toggleCommentsDrawer = async (postId) => {
    const nextOpenState = !activeCommentsDrawer[postId];
    if (nextOpenState) {
      trackPostOnce("post_view", postId, { surface: "feed", trigger: "comentarios" });
    }
    setActiveCommentsDrawer(prev => ({ ...prev, [postId]: nextOpenState }));

    if (nextOpenState && !comments[postId]) {
      try {
        setLoadingComments(prev => ({ ...prev, [postId]: true }));
        const res = await getPostCommentsAPI(postId);
        if (res.data?.success) {
          setComments(prev => ({ ...prev, [postId]: res.data.data }));
        }
      } catch (err) {
        console.error("Error loading comments:", err);
        toast.error("Error al cargar comentarios");
      } finally {
        setLoadingComments(prev => ({ ...prev, [postId]: false }));
      }
    }
  };

  const handleAddComment = async (postId) => {
    if (!user) {
      toast.error("Debes iniciar sesión para comentar");
      return;
    }
    const text = newCommentTexts[postId]?.trim();
    if (!text) return;

    try {
      const res = await createPostCommentAPI(postId, { content: text });
      if (res.data?.success) {
        const newComment = res.data.data;
        
        // Append to comments list state
        setComments(prev => ({
          ...prev,
          [postId]: [...(prev[postId] || []), newComment]
        }));
        
        // Increment count in main posts list
        setPosts(prevPosts => 
          prevPosts.map(p => {
            if (p.id === postId) {
              return {
                ...p,
                comments: [...(p.comments || []), { id: newComment.id }]
              };
            }
            return p;
          })
        );
        
        setNewCommentTexts(prev => ({ ...prev, [postId]: "" }));
        track("post_comment", { post_id: postId, surface: "feed" });
        toast.success("Comentario publicado");
      }
    } catch (err) {
      toast.error(err.response?.data?.error || "Error al enviar comentario");
    }
  };

  const handleShare = (postId) => {
    const postUrl = `${window.location.origin}/news/${postId}`;
    navigator.clipboard.writeText(postUrl)
      .then(() => {
        toast.success("¡Enlace del artículo copiado al portapapeles!", {
          icon: '🔗',
          duration: 3500
        });
      })
      .catch(() => {
        toast.error("Error al copiar el enlace");
      });
  };

  const toggleExpandText = (postId) => {
    // Solo al abrir: cerrar el texto no es una vista nueva.
    if (!expandedPosts[postId]) {
      trackPostOnce("post_view", postId, { surface: "feed", trigger: "expandir" });
    }
    setExpandedPosts(prev => ({ ...prev, [postId]: !prev[postId] }));
  };

  const filteredPosts = filter === "All" ? posts : posts.filter(p => p.category === filter);

  // Stories icons and styles based on category
  const categoryStories = [
    { id: "All", name: "Todos", icon: <BookOpen className="w-5 h-5 text-white" />, gradient: "from-[#531575] to-[#c3ff00]" },
    { id: "Casos Clínicos", name: "Casos", icon: <Sparkles className="w-5 h-5 text-white" />, gradient: "from-emerald-500 to-teal-600" },
    { id: "Noticias", name: "Noticias", icon: <FileText className="w-5 h-5 text-white" />, gradient: "from-blue-500 to-indigo-600" },
    { id: "Investigación", name: "Investigar", icon: <Globe className="w-5 h-5 text-white" />, gradient: "from-amber-500 to-orange-600" },
    { id: "Entrevistas", name: "Entrevistas", icon: <MessageSquare className="w-5 h-5 text-white" />, gradient: "from-rose-500 to-pink-600" },
    { id: "Innovación", name: "Innovación", icon: <Sparkles className="w-5 h-5 text-white" />, gradient: "from-fuchsia-500 to-purple-600" }
  ];

  return (
    <div className="min-h-screen pb-16" style={{ background: '#f1ecf6' }}>
      <style dangerouslySetInnerHTML={{ __html: animationsStyle }} />

      {/* Modern Glassmorphic Journal Header */}
      <div className="bg-white border-b border-slate-200 sticky top-[72px] md:top-[64px] z-40 shadow-[0_2px_15px_rgba(0,0,0,0.02)]">
        <div className="max-w-4xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left">
            <span className="bg-[#531575]/5 text-[#531575] font-extrabold tracking-wider uppercase text-[10px] px-2.5 py-1 rounded-md">
              Forcepx Journal
            </span>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight font-sans mt-1">
              Forcepx Feed
            </h1>
            <p className="text-xs text-gray-500 font-normal mt-0.5">
              Casos clínicos, ciencia y actualidad compartida por odontólogos
            </p>
          </div>
          
          {/* Quick Create CTA for headers */}
          {(!loadingSettings && (postMode !== "disabled" || user?.role === 'admin' || user?.role === 'owner')) && (
            <button
              onClick={() => handleOpenModal("Noticias", false)}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#531575] hover:bg-[#6b1e96] text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-[#531575]/10 hover:shadow-[#531575]/25 active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Publicar
            </button>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 mt-6">
        
        {/* Stories / Filters Section (Instagram Style) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-md mb-6">
          <span className="block text-[11px] font-extrabold text-gray-400 uppercase tracking-wider mb-3 px-1">
            Explorar Categorías
          </span>
          <div className="flex overflow-x-auto hide-scrollbar gap-5 py-1">
            
            {/* Direct Create Post Story item */}
            {(!loadingSettings && (postMode !== "disabled" || user?.role === 'admin' || user?.role === 'owner')) && (
              <div className="flex flex-col items-center flex-shrink-0">
                <button
                  onClick={() => handleOpenModal("Noticias", false)}
                  className="w-13 h-13 rounded-full bg-gray-50 hover:bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center transition-colors cursor-pointer group active:scale-95"
                >
                  <Plus className="w-6 h-6 text-gray-400 group-hover:text-[#531575] transition-colors" />
                </button>
                <span className="text-[10px] text-gray-500 font-bold mt-1.5">
                  Publicar
                </span>
              </div>
            )}

            {/* Category Stories */}
            {categoryStories.map((story) => {
              const isActive = filter === story.id;
              return (
                <div key={story.id} className="flex flex-col items-center flex-shrink-0">
                  <button
                    onClick={() => setFilter(story.id)}
                    className={`w-13 h-13 rounded-full flex items-center justify-center p-[3px] transition-all duration-300 active:scale-95 cursor-pointer ${
                      isActive 
                        ? `bg-gradient-to-tr ${story.gradient} shadow-md` 
                        : "bg-gray-100 border border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                      <div className={`w-[90%] h-[90%] rounded-full bg-gradient-to-br ${story.gradient} flex items-center justify-center transition-all ${
                        !isActive && "opacity-85 hover:opacity-100"
                      }`}>
                        {story.icon}
                      </div>
                    </div>
                  </button>
                  <span className={`text-[10px] mt-1.5 font-bold transition-colors ${
                    isActive ? "text-[#531575] font-extrabold" : "text-gray-500"
                  }`}>
                    {story.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Facebook-style Post Composer Card */}
        {(!loadingSettings && (postMode !== "disabled" || user?.role === 'admin' || user?.role === 'owner')) && (
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-md mb-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-3">
              {/* User Avatar */}
              <div className="w-9 h-9 rounded-full bg-[#531575]/10 text-[#531575] flex items-center justify-center flex-shrink-0 font-bold overflow-hidden border border-slate-200">
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : user?.firstName ? (
                  user.firstName.charAt(0).toUpperCase()
                ) : (
                  <UserIcon className="w-5 h-5 text-gray-400" />
                )}
              </div>

              {/* Clickable Dummy Input */}
              <button
                onClick={() => handleOpenModal("Noticias", false)}
                className="flex-grow bg-gray-50 hover:bg-gray-100/80 border border-slate-200 text-left px-4 py-2.5 rounded-full text-gray-500 hover:text-gray-700 transition-colors text-xs font-semibold cursor-pointer outline-none"
              >
                ¿Tienes un caso clínico o noticia que compartir, Dr{user?.firstName ? `. ${user.firstName}` : "a. Colega"}?
              </button>
            </div>

            {/* Divider */}
            <div className="border-t border-slate-200 my-3.5"></div>

            {/* Quick Action Bar */}
            <div className="flex items-center justify-between px-1">
              <button
                onClick={() => handleOpenModal("Casos Clínicos", false)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-emerald-50 text-emerald-600 transition-colors text-[11px] font-bold cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-emerald-500" />
                <span>Caso Clínico</span>
              </button>

              <button
                onClick={() => handleOpenModal("Noticias", false)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-blue-50 text-blue-600 transition-colors text-[11px] font-bold cursor-pointer"
              >
                <FileText className="w-4 h-4 text-blue-500" />
                <span>Noticia</span>
              </button>

              <button
                onClick={() => handleOpenModal("Noticias", true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-purple-50 text-[#531575] transition-colors text-[11px] font-bold cursor-pointer"
              >
                <ImageIcon className="w-4 h-4 text-[#531575]" />
                <span>Subir Foto</span>
              </button>
            </div>
          </div>
        )}

        {/* Feed Posts */}
        {loading ? (
          /* Sleek Skeleton Loading Feed */
          <div className="space-y-6">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-md space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-200 animate-pulse rounded-full" />
                  <div className="space-y-2 flex-1">
                    <div className="h-3 bg-gray-200 animate-pulse rounded w-1/4" />
                    <div className="h-2 bg-gray-100 animate-pulse rounded w-1/6" />
                  </div>
                </div>
                <div className="h-4 bg-gray-200 animate-pulse rounded w-3/4" />
                <div className="h-48 bg-gray-200 animate-pulse rounded-xl" />
                <div className="h-8 bg-gray-100 animate-pulse rounded-xl" />
              </div>
            ))}
          </div>
        ) : filteredPosts.length === 0 ? (
          /* Elegant Empty State */
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-md">
            <div className="w-16 h-16 bg-[#531575]/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-[#531575]/20">
              <BookOpen className="w-8 h-8 text-[#531575]" />
            </div>
            <h2 className="text-lg font-bold text-gray-800">No hay publicaciones disponibles</h2>
            <p className="text-xs text-gray-500 max-w-sm mx-auto mt-2 leading-relaxed">
              Actualmente no se han aprobado publicaciones en la categoría <strong className="text-gray-800">&quot;{filter === "All" ? "Todos" : filter}&quot;</strong>. Sé el primero en compartir un artículo.
            </p>
            {(!loadingSettings && (postMode !== "disabled" || user?.role === 'admin' || user?.role === 'owner')) && (
              <button
                onClick={() => handleOpenModal(filter !== "All" ? filter : "Noticias", false)}
                className="mt-5 px-5 py-2 bg-[#531575] hover:bg-[#6b1e96] text-white text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer"
              >
                Proponer Publicación
              </button>
            )}
          </div>
        ) : (
          /* Single Column Feed List */
          <div className="space-y-6">
            {filteredPosts.map((post) => {
              const isLiked = !!likedPosts[post.id];
              const likesCount = post.likes?.length || 0;
              const commentsCount = post.comments?.length || 0;
              
              const postComments = comments[post.id] || [];
              const isCommentsOpen = !!activeCommentsDrawer[post.id];
              const commentText = newCommentTexts[post.id] || "";
              const hasHeartAnim = !!activeHeartAnimations[post.id];
              const isExpanded = !!expandedPosts[post.id];
              const isCommentListLoading = !!loadingComments[post.id];

              const authorName = post.author?.full_name || (post.author_type === 'admin' || post.author_type === 'owner' ? 'Equipo Forcepx' : 'Doctor Invitado');
              const authorAvatar = post.author?.avatar_url || null;
              
              const createdDate = new Date(post.created_at);
              const dateText = createdDate.toLocaleDateString('es-ES', { month: 'short', day: 'numeric', year: 'numeric' });

              const cleanContent = post.content?.replace(/<[^>]+>/g, '') || "";
              const shouldTruncate = cleanContent.length > 220;
              const displayText = shouldTruncate && !isExpanded 
                ? `${cleanContent.substring(0, 210)}...` 
                : cleanContent;

              return (
                <article
                  key={post.id}
                  ref={impressionRef}
                  data-post-id={post.id}
                  className="bg-white border border-slate-200 rounded-2xl shadow-md overflow-hidden hover:border-slate-300 transition-colors"
                >
                  
                  {/* Card Header */}
                  <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {/* Author Avatar with dynamic ring */}
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

                      {/* Author Info */}
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold text-xs text-gray-900 tracking-tight leading-tight hover:underline cursor-pointer">
                            {authorName}
                          </span>
                          {(post.author_type === 'admin' || post.author_type === 'owner') && (
                            <span className="bg-[#531575]/10 text-[#531575] text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider">
                              Staff
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-gray-400 font-semibold mt-0.5">
                          <span>{dateText}</span>
                          <span>•</span>
                          <Globe className="w-3 h-3 text-gray-400" />
                        </div>
                      </div>
                    </div>

                    {/* Category Pill and Dropdown Link */}
                    <div className="flex items-center gap-2">
                      <span className="bg-purple-50 border border-purple-100 text-[#531575] font-black text-[9px] uppercase tracking-widest px-2.5 py-1 rounded-full">
                        {post.category}
                      </span>
                      
                      <Link 
                        to={`/news/${post.id}`} 
                        className="text-gray-400 hover:text-gray-600 p-1.5 hover:bg-slate-50 rounded-full transition-colors"
                        title="Ver detalle del artículo"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>

                  {/* Card Title & Caption */}
                  <div className="px-4 pb-3">
                    <h2 className="text-[15px] font-black text-gray-900 leading-snug tracking-tight font-sans mb-1.5">
                      {post.title}
                    </h2>
                    
                    <p className="text-xs text-gray-600 font-normal leading-relaxed whitespace-pre-line">
                      {displayText}
                      {shouldTruncate && (
                        <button
                          onClick={() => toggleExpandText(post.id)}
                          className="text-[#531575] font-extrabold ml-1.5 hover:underline cursor-pointer focus:outline-none"
                        >
                          {isExpanded ? "Ver menos" : "más"}
                        </button>
                      )}
                    </p>
                  </div>

                  {/* Card Media (Image Container with Double Tap) */}
                  {post.thumbnail_url && (
                    <div 
                      onDoubleClick={() => handleImageDoubleTap(post.id)}
                      className="relative bg-gray-50 border-y border-slate-200 overflow-hidden cursor-pointer select-none max-h-[460px] flex items-center justify-center"
                    >
                      <img 
                        src={post.thumbnail_url} 
                        alt={post.title} 
                        className="w-full object-cover transition-transform duration-500 hover:scale-[1.01]" 
                      />

                      {/* Double Tap Heart Pop Overlay */}
                      {hasHeartAnim && (
                        <div className="animate-double-tap-heart">
                          <Heart className="w-24 h-24 text-white fill-white drop-shadow-lg" />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Engagement Counts Bar */}
                  <div className="px-4 py-2.5 flex items-center justify-between text-[11px] text-gray-400 border-b border-slate-200">
                    <div className="flex items-center gap-1">
                      <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center">
                        <Heart className="w-2.5 h-2.5 text-white fill-white" />
                      </div>
                      <span className="font-extrabold text-gray-700">{likesCount}</span>
                      <span className="font-semibold">reacciones</span>
                    </div>

                    <button
                      onClick={() => toggleCommentsDrawer(post.id)}
                      className="font-bold hover:underline focus:outline-none cursor-pointer"
                    >
                      {commentsCount} {commentsCount === 1 ? "comentario" : "comentarios"}
                    </button>
                  </div>

                  {/* Card Interactive Action Buttons */}
                  <div className="px-2 py-1.5 flex items-center justify-around text-gray-500 text-xs font-extrabold">
                    <button
                      onClick={() => toggleLike(post.id)}
                      className={`flex items-center justify-center gap-1.5 flex-1 py-2 rounded-xl transition-all cursor-pointer select-none active:scale-95 hover:bg-slate-50 ${
                        isLiked ? "text-red-500 font-black" : "text-gray-500"
                      }`}
                    >
                      <Heart className={`w-4 h-4 transition-transform duration-200 ${
                        isLiked ? "fill-red-500 text-red-500 scale-120 animate-heart-pop" : "text-gray-500"
                      }`} />
                      <span>Me gusta</span>
                    </button>

                    <button
                      onClick={() => toggleCommentsDrawer(post.id)}
                      className={`flex items-center justify-center gap-1.5 flex-1 py-2 rounded-xl transition-colors cursor-pointer hover:bg-slate-50 ${
                        isCommentsOpen ? "text-[#531575]" : "text-gray-500"
                      }`}
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Comentar</span>
                    </button>

                    <button
                      onClick={() => toggleSave(post.id)}
                      className={`flex items-center justify-center gap-1.5 flex-1 py-2 rounded-xl transition-all cursor-pointer select-none active:scale-95 hover:bg-slate-50 ${
                        savedPosts[post.id] ? "text-[#531575] font-black" : "text-gray-500"
                      }`}
                    >
                      <Bookmark className={`w-4 h-4 transition-transform duration-200 ${
                        savedPosts[post.id] ? "fill-[#531575] text-[#531575]" : "text-gray-500"
                      }`} />
                      <span>{savedPosts[post.id] ? "Guardado" : "Guardar"}</span>
                    </button>

                    <button
                      onClick={() => handleShare(post.id)}
                      className="flex items-center justify-center gap-1.5 flex-1 py-2 rounded-xl transition-colors cursor-pointer hover:bg-slate-50 active:scale-95"
                    >
                      <Share2 className="w-4 h-4" />
                      <span>Compartir</span>
                    </button>
                  </div>

                  {/* Collapsible Comments Drawer */}
                  {isCommentsOpen && (
                    <div className="bg-slate-50 border-t border-slate-200 p-4 space-y-4 animate-in fade-in duration-200 text-left">
                      {/* Title */}
                      <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        Comentarios de la Comunidad
                      </span>

                      {/* Comments List */}
                      {isCommentListLoading ? (
                        <div className="py-4 flex items-center justify-center gap-2 text-gray-400 text-xs font-bold">
                          <div className="w-4 h-4 border-2 border-[#531575] border-t-transparent rounded-full animate-spin" />
                          <span>Cargando comentarios...</span>
                        </div>
                      ) : postComments.length === 0 ? (
                        <p className="text-[11px] text-gray-400 py-1 font-semibold">
                          Sé el primero en dar tu opinión científica o saludar.
                        </p>
                      ) : (
                        <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                          {postComments.map((comment) => (
                            <div key={comment.id} className="flex gap-2.5 items-start">
                              {/* Avatar */}
                              <div className="w-7 h-7 rounded-full bg-[#531575]/5 border border-slate-200 flex items-center justify-center font-bold text-xs text-[#531575] flex-shrink-0 overflow-hidden">
                                {comment.user?.avatar_url ? (
                                  <img src={comment.user.avatar_url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  comment.user?.full_name ? comment.user.full_name.charAt(0).toUpperCase() : "C"
                                )}
                              </div>
                              {/* Bubble */}
                              <div className="bg-white border border-slate-200 rounded-2xl px-3.5 py-2 flex-1 shadow-sm">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="font-extrabold text-[11px] text-gray-800">
                                    {comment.user?.full_name || "Colega"}
                                  </span>
                                  <span className="text-[9px] text-gray-400 font-bold">
                                    {new Date(comment.created_at).toLocaleDateString("es-ES", { month: 'short', day: 'numeric' })}
                                  </span>
                                </div>
                                <p className="text-[11px] text-gray-600 font-normal mt-0.5 leading-relaxed">
                                  {comment.content}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* New Comment Input */}
                      <div className="flex gap-2.5 items-center pt-2 border-t border-slate-200">
                        {/* Current User initials */}
                        <div className="w-7 h-7 rounded-full bg-[#531575] text-white flex items-center justify-center font-extrabold text-xs flex-shrink-0 shadow-inner">
                          {user?.firstName ? user.firstName.charAt(0).toUpperCase() : <UserIcon className="w-3.5 h-3.5" />}
                        </div>

                        {/* Input Box */}
                        <div className="flex-1 flex bg-white border border-slate-200 rounded-full px-3 py-1.5 focus-within:ring-2 focus-within:ring-[#531575]/20 focus-within:border-[#531575] transition-all">
                          <input
                            type="text"
                            value={commentText}
                            onChange={(e) => setNewCommentTexts(prev => ({ ...prev, [post.id]: e.target.value }))}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleAddComment(post.id);
                            }}
                            placeholder="Escribe un comentario..."
                            className="bg-transparent text-[11px] font-normal text-gray-800 outline-none flex-grow placeholder-gray-400"
                          />
                          <button
                            onClick={() => handleAddComment(post.id)}
                            className="text-[#531575] hover:text-[#6b1e96] font-bold text-[11px] px-1 hover:scale-105 transition-transform cursor-pointer focus:outline-none"
                          >
                            Publicar
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* Post Creation Modal */}
      {createModalOpen && (
        <PostModal
          initialCategory={modalInitialCategory}
          autoTriggerUpload={modalAutoTriggerUpload}
          onSave={handleSavePost}
          onClose={() => setCreateModalOpen(false)}
        />
      )}

      {/* Auth Prompt Modal */}
      <AuthPromptModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        redirectPath="/news"
      />
    </div>
  );
}
