import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  getMyPostsAPI,
  createPostAPI,
  updatePostAPI,
  deletePostAPI,
  getUserLikedPostsAPI,
  togglePostLikeAPI,
  getUserSavedPostsAPI,
  togglePostSaveAPI,
} from "../../services/api";
import api from "../../services/api";
import toast from "react-hot-toast";
import PostModal from "../../components/posts/PostModal";

export default function UserPosts() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [postMode, setPostMode] = useState("disabled"); // disabled, moderated, open
  const [loadingSettings, setLoadingSettings] = useState(true);

  // Tabs state
  const [activeTab, setActiveTab] = useState("my-posts"); // my-posts, liked-posts
  const [likedPosts, setLikedPosts] = useState([]);
  const [loadingLiked, setLoadingLiked] = useState(false);
  const [savedPosts, setSavedPosts] = useState([]);
  const [loadingSaved, setLoadingSaved] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState(null);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Active rejection notes viewer
  const [viewNotesTarget, setViewNotesTarget] = useState(null);

  const loadPosts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getMyPostsAPI();
      setPosts(res.data.data || []);
    } catch {
      toast.error("Error al cargar tus publicaciones");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadLikedPosts = useCallback(async () => {
    try {
      setLoadingLiked(true);
      const res = await getUserLikedPostsAPI();
      setLikedPosts(res.data.data || []);
    } catch {
      toast.error("Error al cargar tus reacciones");
    } finally {
      setLoadingLiked(false);
    }
  }, []);

  const loadSavedPosts = useCallback(async () => {
    try {
      setLoadingSaved(true);
      const res = await getUserSavedPostsAPI();
      setSavedPosts(res.data.data || []);
    } catch {
      toast.error("Error al cargar tus publicaciones guardadas");
    } finally {
      setLoadingSaved(false);
    }
  }, []);

  const loadSettings = useCallback(async () => {
    try {
      setLoadingSettings(true);
      const res = await api.get("/admin/settings");
      const setting = res.data.data?.allow_user_posts;
      if (setting) {
        const mode = setting.mode || (setting.enabled ? "moderated" : "disabled");
        setPostMode(mode);
      }
    } catch (err) {
      console.error("Error al verificar permisos de creación:", err);
    } finally {
      setLoadingSettings(false);
    }
  }, []);

  useEffect(() => {
    loadPosts();
    loadSettings();
  }, [loadPosts, loadSettings]);

  useEffect(() => {
    if (activeTab === "liked-posts") {
      loadLikedPosts();
    } else if (activeTab === "saved-posts") {
      loadSavedPosts();
    }
  }, [activeTab, loadLikedPosts, loadSavedPosts]);

  const openCreateModal = () => {
    if (postMode === "disabled") {
      toast.error("La creación de publicaciones de usuario está desactivada.");
      return;
    }
    setEditingPost(null);
    setModalOpen(true);
  };

  const openEditModal = (post) => {
    setEditingPost(post);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingPost(null);
  };

  const confirmDelete = (post) => setDeleteTarget(post);
  const cancelDelete = () => setDeleteTarget(null);

  const executeDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deletePostAPI(deleteTarget.id);
      toast.success("Publicación eliminada");
      setDeleteTarget(null);
      await loadPosts();
    } catch (err) {
      toast.error(err.response?.data?.error || "Error al eliminar");
    } finally {
      setDeleting(false);
    }
  };

  const handleSave = async (formData) => {
    try {
      if (editingPost) {
        await updatePostAPI(editingPost.id, formData);
        toast.success("Publicación editada. Pasará a moderación.");
      } else {
        await createPostAPI(formData);
        toast.success("Publicación enviada a moderación exitosamente");
      }
      closeModal();
      await loadPosts();
    } catch (err) {
      toast.error(err.response?.data?.error || "Error al guardar");
    }
  };

  const handleUnlike = async (postId) => {
    try {
      await togglePostLikeAPI(postId);
      toast.success("Reacción eliminada");
      await loadLikedPosts();
    } catch {
      toast.error("Error al quitar me gusta");
    }
  };

  const handleUnsave = async (postId) => {
    try {
      await togglePostSaveAPI(postId);
      toast.success("Publicación eliminada de guardadas");
      await loadSavedPosts();
    } catch {
      toast.error("Error al eliminar de guardadas");
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900 font-['Manrope']">Mis Publicaciones</h1>
          <p className="text-xs text-gray-500 mt-1">
            Redacta artículos científicos, comparte casos clínicos y participa en el blog de Forcepx.
          </p>
        </div>
        {(!loadingSettings && postMode !== "disabled") && (
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 font-bold rounded-xl shadow-sm transition-all duration-200 text-xs uppercase tracking-wider bg-[#6b1e96] hover:bg-[#531575] text-white active:scale-95 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            Nueva Publicación
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-100 pb-px">
        <button
          onClick={() => setActiveTab("my-posts")}
          className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 px-4 transition-all cursor-pointer ${
            activeTab === "my-posts"
              ? "border-[#531575] text-[#531575]"
              : "border-transparent text-gray-400 hover:text-gray-600"
          }`}
        >
          Mis Artículos ({posts.length})
        </button>
        <button
          onClick={() => setActiveTab("liked-posts")}
          className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 px-4 transition-all cursor-pointer ${
            activeTab === "liked-posts"
              ? "border-[#531575] text-[#531575]"
              : "border-transparent text-gray-400 hover:text-gray-600"
          }`}
        >
          Mis Reacciones ({likedPosts.length})
        </button>
        <button
          onClick={() => setActiveTab("saved-posts")}
          className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 px-4 transition-all cursor-pointer ${
            activeTab === "saved-posts"
              ? "border-[#531575] text-[#531575]"
              : "border-transparent text-gray-400 hover:text-gray-600"
          }`}
        >
          Publicaciones Guardadas ({savedPosts.length})
        </button>
      </div>

      {activeTab === "my-posts" ? (
        /* MY ARTICLES TAB */
        loading ? (
          <div className="space-y-3 animate-pulse">
            {[1, 2, 3].map(i => <div key={i} className="h-12 bg-gray-100 rounded-lg" />)}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
            <div className="w-12 h-12 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="material-symbols-outlined text-[24px]">article</span>
            </div>
            <h3 className="text-sm font-bold text-gray-800">Aún no tienes publicaciones</h3>
            {(!loadingSettings && postMode !== "disabled") ? (
              <>
                <p className="text-xs text-gray-500 mt-1 mb-4">Anímate a redactar tu primer artículo.</p>
                <button
                  onClick={openCreateModal}
                  className="px-4 py-2 bg-[#6b1e96] text-white rounded-lg text-xs font-semibold hover:bg-[#531575] transition-colors cursor-pointer"
                >
                  Comenzar
                </button>
              </>
            ) : (
              <p className="text-xs text-gray-500 mt-3">Las publicaciones de la comunidad están inactivas actualmente.</p>
            )}
          </div>
        ) : (
          <div className="border border-gray-100 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="bg-gray-50 border-b border-gray-100 uppercase tracking-wider font-bold text-gray-500">
                  <tr>
                    <th className="px-5 py-3.5">Título</th>
                    <th className="px-5 py-3.5 text-center">Categoría</th>
                    <th className="px-5 py-3.5 text-center">Fecha</th>
                    <th className="px-5 py-3.5 text-center">Estado</th>
                    <th className="px-5 py-3.5 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {posts.map((post) => (
                    <tr key={post.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0 flex items-center justify-center border border-gray-100">
                            {post.thumbnail_url ? (
                              <img src={post.thumbnail_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <span className="material-symbols-outlined text-gray-400 text-[18px]">image</span>
                            )}
                          </div>
                          <div className="max-w-[200px]">
                            <p className="font-bold text-gray-900 truncate" title={post.title}>{post.title}</p>
                            {post.status === "rejected" && post.moderation_notes && (
                              <button
                                onClick={() => setViewNotesTarget(post)}
                                className="text-[10px] text-red-600 hover:underline font-bold flex items-center gap-0.5 mt-0.5"
                              >
                                <span className="material-symbols-outlined text-[12px]">info</span>
                                Ver motivo de rechazo
                              </button>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span className="inline-flex px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider bg-purple-50 text-[#6b1e96] rounded border border-purple-100">
                          {post.category || 'General'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-center text-gray-500 font-mono">
                        {new Date(post.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        {post.status === "pending" ? (
                          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200" title="En aprobación por el administrador">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span> En Aprobación
                          </span>
                        ) : post.status === "rejected" ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                            <span className="w-1 h-1 rounded-full bg-red-500"></span> Rechazado
                          </span>
                        ) : post.is_published ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                            <span className="w-1 h-1 rounded-full bg-green-500"></span> Público
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-gray-500 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-200">
                            <span className="w-1 h-1 rounded-full bg-gray-400"></span> Oculto
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal(post)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-[#6b1e96] hover:bg-purple-50 transition-colors cursor-pointer"
                            title="Editar"
                          >
                            <span className="material-symbols-outlined text-[16px]">edit</span>
                          </button>
                          <button
                            onClick={() => confirmDelete(post)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                            title="Eliminar"
                          >
                            <span className="material-symbols-outlined text-[16px]">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : activeTab === "liked-posts" ? (
        /* LIKED ARTICLES TAB */
        loadingLiked ? (
          <div className="space-y-3 animate-pulse">
            {[1, 2].map(i => <div key={i} className="h-12 bg-gray-100 rounded-lg" />)}
          </div>
        ) : likedPosts.length === 0 ? (
          <div className="text-center py-12 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
            <div className="w-12 h-12 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="material-symbols-outlined text-[24px]">favorite</span>
            </div>
            <h3 className="text-sm font-bold text-gray-800">Aún no tienes reacciones</h3>
            <p className="text-xs text-gray-500 mt-1 mb-4">Los artículos científicos que marques con &quot;Me gusta&quot; aparecerán aquí.</p>
            <Link
              to="/news"
              className="px-4 py-2 bg-[#6b1e96] text-white rounded-lg text-xs font-semibold hover:bg-[#531575] transition-colors inline-block"
            >
              Explorar Feed
            </Link>
          </div>
        ) : (
          <div className="border border-gray-100 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="bg-gray-50 border-b border-gray-100 uppercase tracking-wider font-bold text-gray-500">
                  <tr>
                    <th className="px-5 py-3.5">Artículo</th>
                    <th className="px-5 py-3.5 text-center">Categoría</th>
                    <th className="px-5 py-3.5 text-center">Autor</th>
                    <th className="px-5 py-3.5 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {likedPosts.map((post) => {
                    const authorName = post.author?.full_name || "Colega";
                    return (
                      <tr key={post.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-5 py-3.5">
                          <Link to={`/news/${post.id}`} className="flex items-center gap-3 group">
                            <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0 flex items-center justify-center border border-gray-100">
                              {post.thumbnail_url ? (
                                <img src={post.thumbnail_url} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <span className="material-symbols-outlined text-gray-400 text-[18px]">image</span>
                              )}
                            </div>
                            <p className="font-bold text-gray-950 group-hover:text-[#531575] group-hover:underline truncate max-w-[200px]" title={post.title}>
                              {post.title}
                            </p>
                          </Link>
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <span className="inline-flex px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider bg-purple-50 text-[#6b1e96] rounded border border-purple-100">
                            {post.category || 'General'}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-center text-gray-600 font-medium">
                          {authorName}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              to={`/news/${post.id}`}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-[#531575] hover:bg-purple-50 transition-colors"
                              title="Ver artículo"
                            >
                              <span className="material-symbols-outlined text-[16px]">visibility</span>
                            </Link>
                            <button
                              onClick={() => handleUnlike(post.id)}
                              className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                              title="Quitar reacción"
                            >
                              <span className="material-symbols-outlined text-[16px]">favorite</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : (
        /* SAVED ARTICLES TAB */
        loadingSaved ? (
          <div className="space-y-3 animate-pulse">
            {[1, 2].map(i => <div key={i} className="h-12 bg-gray-100 rounded-lg" />)}
          </div>
        ) : savedPosts.length === 0 ? (
          <div className="text-center py-12 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
            <div className="w-12 h-12 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="material-symbols-outlined text-[24px]">bookmark</span>
            </div>
            <h3 className="text-sm font-bold text-gray-800">No tienes publicaciones guardadas</h3>
            <p className="text-xs text-gray-500 mt-1 mb-4">Los artículos que guardes desde el feed público aparecerán aquí.</p>
            <Link
              to="/news"
              className="px-4 py-2 bg-[#6b1e96] text-white rounded-lg text-xs font-semibold hover:bg-[#531575] transition-colors inline-block"
            >
              Explorar Feed
            </Link>
          </div>
        ) : (
          <div className="border border-gray-100 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="bg-gray-50 border-b border-gray-100 uppercase tracking-wider font-bold text-gray-500">
                  <tr>
                    <th className="px-5 py-3.5">Artículo</th>
                    <th className="px-5 py-3.5 text-center">Categoría</th>
                    <th className="px-5 py-3.5 text-center">Autor</th>
                    <th className="px-5 py-3.5 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {savedPosts.map((post) => {
                    const authorName = post.author?.full_name || "Colega";
                    return (
                      <tr key={post.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-5 py-3.5">
                          <Link to={`/news/${post.id}`} className="flex items-center gap-3 group">
                            <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0 flex items-center justify-center border border-gray-100">
                              {post.thumbnail_url ? (
                                <img src={post.thumbnail_url} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <span className="material-symbols-outlined text-gray-400 text-[18px]">image</span>
                              )}
                            </div>
                            <p className="font-bold text-gray-950 group-hover:text-[#531575] group-hover:underline truncate max-w-[200px]" title={post.title}>
                              {post.title}
                            </p>
                          </Link>
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <span className="inline-flex px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider bg-purple-50 text-[#6b1e96] rounded border border-purple-100">
                            {post.category || 'General'}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-center text-gray-600 font-medium">
                          {authorName}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              to={`/news/${post.id}`}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-[#531575] hover:bg-purple-50 transition-colors"
                              title="Ver artículo"
                            >
                              <span className="material-symbols-outlined text-[16px]">visibility</span>
                            </Link>
                            <button
                              onClick={() => handleUnsave(post.id)}
                              className="p-1.5 rounded-lg text-[#531575] hover:text-[#6b1e96] hover:bg-purple-50 transition-colors cursor-pointer"
                              title="Quitar guardado"
                            >
                              <span className="material-symbols-outlined text-[16px]">bookmark_remove</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {/* Editor Modal */}
      {modalOpen && (
        <PostModal
          post={editingPost}
          onSave={handleSave}
          onClose={closeModal}
        />
      )}

      {/* Rejection Notes Popover/Modal */}
      {viewNotesTarget && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setViewNotesTarget(null)} />
          <div className="relative bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl flex flex-col gap-3">
            <div className="flex items-center gap-2 text-red-600 font-bold">
              <span className="material-symbols-outlined">feedback</span>
              <h3 className="text-sm font-bold text-gray-900 font-['Manrope']">Retroalimentación Editorial</h3>
            </div>
            <p className="text-xs text-gray-500 font-medium leading-relaxed bg-red-50 p-4 border border-red-100 rounded-xl">
              &quot;{viewNotesTarget.moderation_notes}&quot;
            </p>
            <p className="text-[10px] text-gray-400">
              Puedes hacer clic en el botón de edición para ajustar el artículo y volver a enviarlo a revisión.
            </p>
            <button
              onClick={() => setViewNotesTarget(null)}
              className="mt-2 py-2 bg-gray-100 text-gray-800 rounded-xl font-semibold hover:bg-gray-200 transition-colors text-xs cursor-pointer"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={cancelDelete} />
          <div className="relative bg-white rounded-2xl w-full max-w-sm p-6 text-center shadow-xl flex flex-col gap-4">
            <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto">
               <span className="material-symbols-outlined text-[24px]">delete</span>
            </div>
            <div>
              <h3 className="text-md font-bold text-gray-900 font-['Manrope']">¿Eliminar artículo?</h3>
              <p className="text-xs text-gray-500 mt-1">Esta acción es irreversible y eliminará el artículo permanentemente.</p>
            </div>
            <div className="flex items-center gap-3">
               <button onClick={cancelDelete} disabled={deleting} className="flex-1 py-2.5 rounded-xl font-semibold border text-gray-700 hover:bg-gray-50 text-xs">
                 Cancelar
               </button>
               <button onClick={executeDelete} disabled={deleting} className="flex-1 py-2.5 rounded-xl font-semibold bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 transition-all active:scale-95 text-xs">
                 {deleting ? "Eliminando..." : "Sí, Eliminar"}
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
