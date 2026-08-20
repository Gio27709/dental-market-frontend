import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import PropTypes from "prop-types";
import {
  getAdminPostsAPI,
  createPostAPI,
  updatePostAPI,
  deletePostAPI,
  moderatePostAPI,
  updateAllowUserPostsAPI,
  getPostLikesAPI,
  getPostCommentsAPI,
  deletePostCommentAPI,
  getPostSavesAPI,
  getAdminPostStatsAPI,
} from "../../services/api";
import api from "../../services/api";
import toast from "react-hot-toast";
import PostModal from "../../components/posts/PostModal";
import PostsHistoryPanel from "../../components/admin/posts/PostsHistoryPanel";

export default function AdminPosts() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("approved"); // approved (Publicadas), pending, rejected, hidden (Ocultas)
  const [postMode, setPostMode] = useState("disabled"); // disabled, moderated, open
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [togglingSettings, setTogglingSettings] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState(null);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Interaction modal state
  const [interactionTarget, setInteractionTarget] = useState(null);

  // Rejection modal state
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejecting, setRejecting] = useState(false);

  // Filter and pagination state
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [authorTypeFilter, setAuthorTypeFilter] = useState("All");
  const [sortBy, setSortBy] = useState("recent");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [pendingCount, setPendingCount] = useState(0);

  // Historial de lectura e interacción (Fase 2)
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsPeriod, setStatsPeriod] = useState("30d");

  const loadPosts = useCallback(async () => {
    try {
      setLoading(true);
      
      let statusQuery = "";
      let isPublishedQuery = "";
      
      if (activeTab === "approved") {
        statusQuery = "approved";
        isPublishedQuery = "true";
      } else if (activeTab === "hidden") {
        statusQuery = "approved";
        isPublishedQuery = "false";
      } else {
        statusQuery = activeTab; // "pending" or "rejected"
      }

      const params = {
        page,
        limit,
        status: statusQuery,
        sortBy,
        category: categoryFilter !== "All" ? categoryFilter : undefined,
        author_type: authorTypeFilter !== "All" ? authorTypeFilter : undefined,
        search: debouncedSearch.trim() !== "" ? debouncedSearch.trim() : undefined,
      };

      if (isPublishedQuery !== "") {
        params.is_published = isPublishedQuery;
      }

      const res = await getAdminPostsAPI(params);
      if (res.data?.success) {
        setPosts(res.data.data || []);
        setTotalItems(res.data.pagination?.total || 0);
        setTotalPages(res.data.pagination?.totalPages || 1);
      }
    } catch {
      toast.error("Error al cargar publicaciones");
    } finally {
      setLoading(false);
    }
  }, [activeTab, page, limit, categoryFilter, authorTypeFilter, debouncedSearch, sortBy]);

  // ── Historial (Fase 2) ──
  // Los KPIs y la serie diaria son globales; `ids` solo acota el mapa por
  // publicación a las filas visibles, para no traer el catálogo entero.
  const loadStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const params = { period: statsPeriod };
      const ids = posts.map((p) => p.id).filter(Boolean);
      if (ids.length) params.ids = ids.join(",");
      const res = await getAdminPostStatsAPI(params);
      setStats(res.data?.data || null);
    } catch (err) {
      console.error("Error al cargar el historial de publicaciones:", err);
    } finally {
      setStatsLoading(false);
    }
  }, [statsPeriod, posts]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const loadPendingCount = useCallback(async () => {
    try {
      const res = await getAdminPostsAPI({ status: "pending", limit: 1 });
      setPendingCount(res.data.pagination?.total || 0);
    } catch (err) {
      console.error("Error loading pending posts count:", err);
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
      console.error("Error al cargar configuraciones:", err);
    } finally {
      setLoadingSettings(false);
    }
  }, []);

  // Search Debouncer
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset page on text search
    }, 450);
    return () => clearTimeout(handler);
  }, [search]);

  // Load posts reactively
  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  // Load settings and pending count on mount
  useEffect(() => {
    loadSettings();
    loadPendingCount();
  }, [loadSettings, loadPendingCount]);

  const handleChangePostMode = async (newMode) => {
    const previousMode = postMode;
    setPostMode(newMode); // Optimistic UI
    setTogglingSettings(true);

    try {
      await updateAllowUserPostsAPI(newMode);
      toast.success(`Configuración actualizada a: ${
        newMode === "disabled" ? "Deshabilitado" : newMode === "moderated" ? "Moderado" : "Abierto"
      }`);
    } catch {
      setPostMode(previousMode); // Rollback
      toast.error("Error al actualizar la configuración");
    } finally {
      setTogglingSettings(false);
    }
  };

  const openCreateModal = () => {
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
      loadPendingCount();
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
        toast.success("Publicación actualizada");
      } else {
        await createPostAPI(formData);
        toast.success("Publicación creada exitosamente");
      }
      closeModal();
      await loadPosts();
      loadPendingCount();
    } catch (err) {
      toast.error(err.response?.data?.error || "Error al guardar");
    }
  };

  const handleApprove = async (id) => {
    const loadingToast = toast.loading("Aprobando publicación...");
    try {
      await moderatePostAPI(id, { action: "approve" });
      toast.success("Publicación aprobada y publicada", { id: loadingToast });
      await loadPosts();
      loadPendingCount();
    } catch (err) {
      toast.error(err.response?.data?.error || "Error al aprobar", { id: loadingToast });
    }
  };

  const openRejectModal = (post) => {
    setRejectTarget(post);
    setRejectReason("");
  };

  const closeRejectModal = () => {
    setRejectTarget(null);
    setRejectReason("");
  };

  const executeReject = async () => {
    if (!rejectTarget) return;
    setRejecting(true);
    const loadingToast = toast.loading("Rechazando publicación...");
    try {
      await moderatePostAPI(rejectTarget.id, {
        action: "reject",
        reason: rejectReason || "No cumple con las pautas editoriales de la plataforma."
      });
      toast.success("Publicación rechazada", { id: loadingToast });
      closeRejectModal();
      await loadPosts();
      loadPendingCount();
    } catch (err) {
      toast.error(err.response?.data?.error || "Error al rechazar", { id: loadingToast });
    } finally {
      setRejecting(false);
    }
  };

  const handleCommentDeleted = (postId, commentId) => {
    setPosts(prevPosts =>
      prevPosts.map(p => {
        if (p.id === postId) {
          return {
            ...p,
            comments: (p.comments || []).filter(c => c.id !== commentId)
          };
        }
        return p;
      })
    );
  };

  // Server-side filtered posts
  const filteredPosts = posts;

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setPage(1); // Reset page on tab change
  };

  return (
    <div className="max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 font-['Manrope']">Noticias y Blog</h1>
          <p className="text-sm text-gray-500 mt-1">
            Administra los artículos de noticias y las publicaciones propuestas por la comunidad.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#531575] hover:bg-[#6b1e96] text-white font-semibold rounded-xl shadow-sm transition-all duration-200 text-sm active:scale-95"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
          Nueva Publicación
        </button>
      </div>
      {/* Global Config Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-md transition-all hover:shadow-lg flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#531575] text-[22px]">settings_suggest</span>
              <h3 className="font-extrabold text-gray-900 font-['Manrope'] text-lg">Publicaciones de la Comunidad</h3>
            </div>
            <p className="text-xs text-gray-500 max-w-2xl">
              Configura los permisos para que los usuarios, clínicas y odontólogos publiquen en la plataforma.
            </p>
          </div>
          {loadingSettings && (
            <div className="flex items-center gap-2 text-xs text-gray-400 font-semibold bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
              <div className="w-3.5 h-3.5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
              Cargando preferencias...
            </div>
          )}
        </div>

        {!loadingSettings && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Disabled Option */}
            <button
              onClick={() => handleChangePostMode("disabled")}
              disabled={togglingSettings}
              className={`text-left p-4 rounded-2xl border transition-all flex flex-col justify-between h-32 relative group overflow-hidden cursor-pointer ${
                postMode === "disabled"
                  ? "border-[#531575] bg-[#531575]/5 shadow-sm shadow-[#531575]/5"
                  : "border-gray-100 bg-white hover:border-gray-300 hover:shadow-[0_4px_20px_rgb(0,0,0,0.02)]"
              }`}
            >
              <div className="space-y-1 z-10">
                <div className="flex items-center gap-2">
                  <span className={`material-symbols-outlined text-[20px] ${postMode === "disabled" ? "text-[#531575]" : "text-gray-400"}`}>block</span>
                  <span className="font-bold text-gray-900 text-sm font-['Manrope']">Deshabilitado</span>
                </div>
                <p className="text-[11px] text-gray-500 leading-normal">
                  Los usuarios comunes no podrán crear publicaciones. Se ocultan los botones y accesos.
                </p>
              </div>
              <div className="flex items-center justify-between mt-auto w-full z-10">
                <span className={`text-[10px] font-bold uppercase tracking-wider ${postMode === "disabled" ? "text-[#531575]" : "text-gray-400"}`}>
                  {postMode === "disabled" ? "Activo" : "Seleccionar"}
                </span>
                {postMode === "disabled" && (
                  <span className="material-symbols-outlined text-[#531575] text-[18px]">check_circle</span>
                )}
              </div>
            </button>

            {/* Moderated Option */}
            <button
              onClick={() => handleChangePostMode("moderated")}
              disabled={togglingSettings}
              className={`text-left p-4 rounded-2xl border transition-all flex flex-col justify-between h-32 relative group overflow-hidden cursor-pointer ${
                postMode === "moderated"
                  ? "border-[#531575] bg-[#531575]/5 shadow-sm shadow-[#531575]/5"
                  : "border-gray-100 bg-white hover:border-gray-300 hover:shadow-[0_4px_20px_rgb(0,0,0,0.02)]"
              }`}
            >
              <div className="space-y-1 z-10">
                <div className="flex items-center gap-2">
                  <span className={`material-symbols-outlined text-[20px] ${postMode === "moderated" ? "text-[#531575]" : "text-gray-400"}`}>rule</span>
                  <span className="font-bold text-gray-900 text-sm font-['Manrope']">Con Aprobación</span>
                </div>
                <p className="text-[11px] text-gray-500 leading-normal">
                  Los usuarios pueden publicar, pero los posts pasan a moderación antes de ser públicos.
                </p>
              </div>
              <div className="flex items-center justify-between mt-auto w-full z-10">
                <span className={`text-[10px] font-bold uppercase tracking-wider ${postMode === "moderated" ? "text-[#531575]" : "text-gray-400"}`}>
                  {postMode === "moderated" ? "Activo" : "Seleccionar"}
                </span>
                {postMode === "moderated" && (
                  <span className="material-symbols-outlined text-[#531575] text-[18px]">check_circle</span>
                )}
              </div>
            </button>

            {/* Open Option */}
            <button
              onClick={() => handleChangePostMode("open")}
              disabled={togglingSettings}
              className={`text-left p-4 rounded-2xl border transition-all flex flex-col justify-between h-32 relative group overflow-hidden cursor-pointer ${
                postMode === "open"
                  ? "border-[#531575] bg-[#531575]/5 shadow-sm shadow-[#531575]/5"
                  : "border-gray-100 bg-white hover:border-gray-300 hover:shadow-[0_4px_20px_rgb(0,0,0,0.02)]"
              }`}
            >
              <div className="space-y-1 z-10">
                <div className="flex items-center gap-2">
                  <span className={`material-symbols-outlined text-[20px] ${postMode === "open" ? "text-[#531575]" : "text-gray-400"}`}>public</span>
                  <span className="font-bold text-gray-900 text-sm font-['Manrope']">Publicación Abierta</span>
                </div>
                <p className="text-[11px] text-gray-500 leading-normal">
                  Cualquier usuario puede publicar libremente y su contenido se hace público al instante.
                </p>
              </div>
              <div className="flex items-center justify-between mt-auto w-full z-10">
                <span className={`text-[10px] font-bold uppercase tracking-wider ${postMode === "open" ? "text-[#531575]" : "text-gray-400"}`}>
                  {postMode === "open" ? "Activo" : "Seleccionar"}
                </span>
                {postMode === "open" && (
                  <span className="material-symbols-outlined text-[#531575] text-[18px]">check_circle</span>
                )}
              </div>
            </button>
          </div>
        )}
      </div>


      <PostsHistoryPanel
        stats={stats}
        loading={statsLoading}
        period={statsPeriod}
        onPeriodChange={setStatsPeriod}
      />

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-6 overflow-x-auto hide-scrollbar" aria-label="Tabs">
          {[
            { id: "approved", label: "Publicadas", icon: "task_alt" },
            { id: "pending", label: "Pendientes", icon: "pending", count: pendingCount },
            { id: "rejected", label: "Rechazadas", icon: "cancel" },
            { id: "hidden", label: "Ocultas", icon: "visibility_off" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`whitespace-nowrap pb-4 px-1 border-b-2 font-semibold text-sm flex items-center gap-2 transition-all ${
                activeTab === tab.id
                  ? "border-[#531575] text-[#531575]"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
              {tab.label}
              {tab.count > 0 && (
                <span className="ml-1.5 px-2 py-0.5 text-xs font-extrabold bg-[#531575] text-white rounded-full">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-grow max-w-md">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <span className="material-symbols-outlined text-gray-400 text-[20px]">search</span>
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por título o contenido..."
            className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200/60 rounded-xl text-xs placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#531575]/25 focus:border-[#531575] focus:bg-white transition-all font-semibold text-gray-700"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          )}
        </div>

        {/* Filters and Sorting selectors */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Category Selector */}
          <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200/60 rounded-xl px-3 py-2 text-[11px] font-bold text-gray-500 focus-within:ring-2 focus-within:ring-[#531575]/25 focus-within:border-[#531575]">
            <span className="material-symbols-outlined text-[15px] text-gray-400">category</span>
            <select
              value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
              className="bg-transparent focus:outline-none cursor-pointer pr-1 text-gray-800 font-extrabold"
            >
              <option value="All">Todas las Categorías</option>
              <option value="Casos Clínicos">Casos Clínicos</option>
              <option value="Noticias">Noticias</option>
              <option value="Investigación">Investigación</option>
              <option value="Entrevistas">Entrevistas</option>
              <option value="Innovación">Innovación</option>
            </select>
          </div>

          {/* Author Type Selector */}
          <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200/60 rounded-xl px-3 py-2 text-[11px] font-bold text-gray-500 focus-within:ring-2 focus-within:ring-[#531575]/25 focus-within:border-[#531575]">
            <span className="material-symbols-outlined text-[15px] text-gray-400">person</span>
            <select
              value={authorTypeFilter}
              onChange={(e) => { setAuthorTypeFilter(e.target.value); setPage(1); }}
              className="bg-transparent focus:outline-none cursor-pointer pr-1 text-gray-800 font-extrabold"
            >
              <option value="All">Todos los Autores</option>
              <option value="admin">Administradores</option>
              <option value="store">Tiendas Afiliadas</option>
              <option value="user">Usuarios/Comunidad</option>
            </select>
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200/60 rounded-xl px-3 py-2 text-[11px] font-bold text-gray-500 focus-within:ring-2 focus-within:ring-[#531575]/25 focus-within:border-[#531575]">
            <span className="material-symbols-outlined text-[15px] text-gray-400">sort</span>
            <select
              value={sortBy}
              onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
              className="bg-transparent focus:outline-none cursor-pointer pr-1 text-gray-800 font-extrabold"
            >
              <option value="recent">Más recientes</option>
              <option value="oldest">Más antiguos</option>
              <option value="title_asc">Título (A-Z)</option>
              <option value="title_desc">Título (Z-A)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Content Table */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-8 space-y-4 animate-pulse">
           {[1, 2, 3].map(i => <div key={i} className="h-12 bg-slate-100 rounded-lg" />)}
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center shadow-sm">
           <div className="w-16 h-16 bg-gray-50 text-gray-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-gray-100">
             <span className="material-symbols-outlined text-[32px]">article</span>
           </div>
           <h3 className="text-lg font-bold text-gray-900 font-['Manrope']">No hay publicaciones</h3>
           <p className="text-sm text-gray-500 mb-6">
             {activeTab === "approved" && "Comienza a agregar noticias y artículos al blog."}
             {activeTab === "pending" && "No hay publicaciones pendientes de aprobación."}
             {activeTab === "rejected" && "No hay publicaciones rechazadas."}
             {activeTab === "hidden" && "No hay publicaciones ocultas en el archivo."}
           </p>
           {activeTab === "approved" && (
             <button onClick={openCreateModal} className="px-5 py-2.5 bg-[#531575] text-white font-semibold rounded-xl text-sm transition-all duration-200 active:scale-95 shadow-sm">
               Crear Artículo
             </button>
           )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-100/75 border-b border-slate-200 uppercase tracking-wider text-xs font-bold text-gray-500">
                <tr>
                  <th className="px-6 py-4">Publicación</th>
                  <th className="px-6 py-4 text-center">Categoría</th>
                  <th className="px-6 py-4 text-center">Autor</th>
                  <th className="px-6 py-4 text-center">Fecha</th>
                  <th className="px-6 py-4 text-center">Estado</th>
                  <th className="px-6 py-4 text-center">Alcance / Vistas</th>
                  <th className="px-6 py-4 text-center">Interacciones</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredPosts.map((post) => (
                  <tr key={post.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0 flex items-center justify-center border border-slate-200">
                          {post.thumbnail_url ? (
                            <img src={post.thumbnail_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="material-symbols-outlined text-gray-400">image</span>
                          )}
                        </div>
                        <div className="max-w-[250px]">
                          <p className="font-semibold text-gray-900 truncate" title={post.title}>{post.title}</p>
                          {activeTab === "rejected" && post.moderation_notes && (
                            <p className="text-xs text-red-500 font-medium mt-0.5 truncate" title={post.moderation_notes}>
                              Motivo: {post.moderation_notes}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 rounded-md border border-indigo-100">
                        {post.category || 'General'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex flex-col items-center">
                        <span className={`inline-flex px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full ${
                          post.author_type === 'admin' || post.author_type === 'owner'
                            ? 'bg-[#531575]/10 text-[#531575]'
                            : post.author_type === 'store'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-green-50 text-green-700 border border-green-200'
                        }`}>
                          {post.author_type === 'admin' || post.author_type === 'owner' ? 'Admin' : post.author_type === 'store' ? 'Tienda' : 'Usuario'}
                        </span>
                        <span className="text-[10px] text-gray-400 font-mono mt-0.5 max-w-[100px] truncate" title={post.author_id}>
                          ID: {post.author_id ? post.author_id.substring(0, 8) : "N/A"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center text-gray-500 font-mono text-xs">
                      {new Date(post.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {post.status === "pending" ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200 animate-pulse">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Pendiente
                        </span>
                      ) : post.status === "rejected" ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 bg-red-50 px-2.5 py-1 rounded-full border border-red-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> Rechazado
                        </span>
                      ) : post.is_published ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-600 bg-green-50 px-2.5 py-1 rounded-full border border-green-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Público
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 bg-gray-50 px-2.5 py-1 rounded-full border border-gray-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span> Oculto
                        </span>
                      )}
                    </td>
                    {/* Alcance / Vistas del período elegido en el Historial */}
                    <td className="px-6 py-4 text-center">
                      {(() => {
                        const s = stats?.byPost?.[post.id];
                        if (statsLoading && !stats) {
                          return <span className="inline-block w-16 h-4 bg-slate-100 rounded animate-pulse" />;
                        }
                        if (!s || (!s.impressions && !s.views)) {
                          return <span className="text-xs text-gray-300 font-semibold">—</span>;
                        }
                        return (
                          <Link
                            to={`/admin/posts/${post.id}/stats`}
                            className="inline-flex flex-col items-center leading-tight hover:opacity-70 transition-opacity"
                            title="Ver la ficha completa de esta publicación"
                          >
                            <span
                              className="font-mono text-sm font-bold text-[#531575]"
                              title={`${s.unique_reach} personas distintas la vieron pasar`}
                            >
                              {s.impressions}
                            </span>
                            <span
                              className="text-[11px] font-semibold text-gray-500"
                              title={`${s.unique_readers} lectores distintos · ${s.engagement_rate_pct}% de interacción`}
                            >
                              {s.views} {s.views === 1 ? "vista" : "vistas"}
                            </span>
                          </Link>
                        );
                      })()}
                    </td>
                    {/* Interacciones */}
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => setInteractionTarget(post)}
                        className="inline-flex items-center gap-3 px-3 py-1.5 bg-gray-50 border border-gray-100 hover:border-[#531575]/20 hover:bg-[#531575]/5 rounded-xl transition-all cursor-pointer font-semibold group text-xs text-gray-600 hover:text-[#531575] active:scale-95"
                        title="Administrar Interacciones"
                      >
                        <span className="flex items-center gap-1" title="Me gustas">
                          <span className="material-symbols-outlined text-[16px] text-gray-400 group-hover:text-red-500 group-hover:fill-current transition-colors">favorite</span>
                          <span className="font-mono text-gray-700 group-hover:text-[#531575]">{post.likes?.length || 0}</span>
                        </span>
                        <span className="w-px h-3 bg-gray-200" />
                        <span className="flex items-center gap-1" title="Comentarios">
                          <span className="material-symbols-outlined text-[16px] text-gray-400 group-hover:text-[#531575] transition-colors">forum</span>
                          <span className="font-mono text-gray-700 group-hover:text-[#531575]">{post.comments?.length || 0}</span>
                        </span>
                        <span className="w-px h-3 bg-gray-200" />
                        <span className="flex items-center gap-1" title="Guardados">
                          <span className="material-symbols-outlined text-[16px] text-gray-400 group-hover:text-[#531575] transition-colors">bookmark</span>
                          <span className="font-mono text-gray-700 group-hover:text-[#531575]">{post.saves?.length || 0}</span>
                        </span>
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {post.status === "pending" && (
                          <>
                            <button
                              onClick={() => handleApprove(post.id)}
                              className="p-1.5 rounded-lg text-green-600 hover:bg-green-50 transition-colors"
                              title="Aprobar y publicar"
                            >
                              <span className="material-symbols-outlined text-[20px]">check_circle</span>
                            </button>
                            <button
                              onClick={() => openRejectModal(post)}
                              className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                              title="Rechazar publicación"
                            >
                              <span className="material-symbols-outlined text-[20px]">cancel</span>
                            </button>
                          </>
                        )}
                        <Link
                          to={`/admin/posts/${post.id}/stats`}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-[#531575] hover:bg-[#531575]/10 transition-colors"
                          title="Ver estadísticas de esta publicación"
                        >
                          <span className="material-symbols-outlined text-[18px]">bar_chart</span>
                        </Link>
                        <button
                          onClick={() => openEditModal(post)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-[#531575] hover:bg-[#531575]/10 transition-colors"
                          title="Editar"
                        >
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                        <button
                          onClick={() => confirmDelete(post)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Eliminar"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination Footer */}
            <div className="bg-white border-t border-slate-200 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* Items count info */}
              <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                <span>Mostrar</span>
                <select
                  value={limit}
                  onChange={(e) => { setLimit(parseInt(e.target.value)); setPage(1); }}
                  className="bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 focus:outline-none cursor-pointer font-bold text-gray-700 text-xs"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
                <span>publicaciones por página</span>
                <span className="mx-2 text-gray-300">|</span>
                <span>
                  Mostrando {totalItems > 0 ? (page - 1) * limit + 1 : 0} - {Math.min(page * limit, totalItems)} de {totalItems} registros
                </span>
              </div>

              {/* Page numbers navigation */}
              {totalPages > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    className="inline-flex items-center justify-center p-2 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-100 text-gray-500 hover:text-gray-800 disabled:opacity-40 disabled:hover:bg-gray-50 disabled:hover:text-gray-500 transition-all cursor-pointer active:scale-95"
                    title="Página Anterior"
                  >
                    <span className="material-symbols-outlined text-[16px]">chevron_left</span>
                  </button>

                  {/* Page Number Buttons */}
                  {Array.from({ length: totalPages }).map((_, idx) => {
                    const pageNum = idx + 1;
                    if (
                      pageNum === 1 ||
                      pageNum === totalPages ||
                      Math.abs(pageNum - page) <= 1
                    ) {
                      const isActive = page === pageNum;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setPage(pageNum)}
                          className={`w-8 h-8 flex items-center justify-center rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            isActive
                              ? "bg-[#531575] text-white shadow-sm shadow-[#531575]/10 active:scale-95"
                              : "bg-gray-50 hover:bg-gray-100 text-gray-600 border border-gray-100 active:scale-95"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    }
                    
                    if (pageNum === 2 && page > 3) {
                      return <span key="el-left" className="px-1 text-gray-400 text-xs">...</span>;
                    }
                    if (pageNum === totalPages - 1 && page < totalPages - 2) {
                      return <span key="el-right" className="px-1 text-gray-400 text-xs">...</span>;
                    }
                    return null;
                  })}

                  <button
                    disabled={page === totalPages}
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    className="inline-flex items-center justify-center p-2 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-100 text-gray-500 hover:text-gray-800 disabled:opacity-40 disabled:hover:bg-gray-50 disabled:hover:text-gray-500 transition-all cursor-pointer active:scale-95"
                    title="Página Siguiente"
                  >
                    <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Post Modal */}
      {modalOpen && (
        <PostModal post={editingPost} onSave={handleSave} onClose={closeModal} />
      )}

      {/* Rejection Modal */}
      {rejectTarget && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeRejectModal} />
          <div className="relative bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center gap-3 text-red-600">
              <span className="material-symbols-outlined text-[28px]">report</span>
              <h3 className="text-lg font-bold text-gray-900 font-['Manrope']">Rechazar Publicación</h3>
            </div>
            <p className="text-sm text-gray-500">
              Especifica el motivo del rechazo. Este mensaje será enviado como una notificación al autor para que pueda corregir su artículo.
            </p>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700">Motivo del rechazo *</label>
              <textarea
                required
                rows={4}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Ej: El artículo requiere mejor ortografía o las imágenes no corresponden al ámbito odontológico..."
                className="w-full px-4 py-2 border rounded-xl font-sans text-sm focus:outline-none focus:ring-2 focus:ring-[#531575]/35 focus:border-[#531575] border-gray-300"
              />
            </div>
            <div className="flex items-center gap-3 mt-2">
              <button
                onClick={closeRejectModal}
                disabled={rejecting}
                className="flex-grow py-2.5 rounded-xl font-semibold border text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={executeReject}
                disabled={rejecting || !rejectReason.trim()}
                className="flex-grow py-2.5 rounded-xl font-semibold bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 transition-all active:scale-95"
              >
                {rejecting ? "Procesando..." : "Confirmar Rechazo"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <DeleteModal deleting={deleting} onConfirm={executeDelete} onCancel={cancelDelete} />
      )}

      {/* Interaction Modal */}
      {interactionTarget && (
        <AdminInteractionModal
          post={interactionTarget}
          onClose={() => setInteractionTarget(null)}
          onCommentDeleted={handleCommentDeleted}
        />
      )}
    </div>
  );
}

function AdminInteractionModal({ post, onClose, onCommentDeleted }) {
  const [likes, setLikes] = useState([]);
  const [comments, setComments] = useState([]);
  const [saves, setSaves] = useState([]);
  const [loadingLikes, setLoadingLikes] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);
  const [loadingSaves, setLoadingSaves] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState("likes"); // likes, comments, saves
  const [deletingCommentId, setDeletingCommentId] = useState(null);

  const loadLikes = useCallback(async () => {
    try {
      setLoadingLikes(true);
      const res = await getPostLikesAPI(post.id);
      setLikes(res.data.likes || []);
    } catch {
      toast.error("Error al cargar reacciones");
    } finally {
      setLoadingLikes(false);
    }
  }, [post.id]);

  const loadComments = useCallback(async () => {
    try {
      setLoadingComments(true);
      const res = await getPostCommentsAPI(post.id);
      setComments(res.data.data || []);
    } catch {
      toast.error("Error al cargar comentarios");
    } finally {
      setLoadingComments(false);
    }
  }, [post.id]);

  const loadSaves = useCallback(async () => {
    try {
      setLoadingSaves(true);
      const res = await getPostSavesAPI(post.id);
      setSaves(res.data.saves || []);
    } catch {
      toast.error("Error al cargar guardados");
    } finally {
      setLoadingSaves(false);
    }
  }, [post.id]);

  useEffect(() => {
    loadLikes();
    loadComments();
    loadSaves();
  }, [loadLikes, loadComments, loadSaves]);

  const handleDeleteComment = async (commentId) => {
    setDeletingCommentId(commentId);
    try {
      await deletePostCommentAPI(commentId);
      toast.success("Comentario eliminado");
      setComments(prev => prev.filter(c => c.id !== commentId));
      if (onCommentDeleted) {
        onCommentDeleted(post.id, commentId);
      }
    } catch {
      toast.error("Error al eliminar comentario");
    } finally {
      setDeletingCommentId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" onClick={onClose} />
      
      {/* Modal Container */}
      <div className="relative bg-white rounded-3xl w-full max-w-lg p-6 shadow-2xl flex flex-col max-h-[80vh] overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div className="max-w-[85%]">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#531575] bg-purple-50 px-2.5 py-0.5 rounded border border-purple-100">
              Administración de Interacciones
            </span>
            <h3 className="text-sm font-bold text-gray-900 font-['Manrope'] truncate mt-1.5" title={post.title}>
              {post.title}
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Modal Tabs */}
        <div className="flex border-b border-gray-100 mt-4">
          <button
            onClick={() => setActiveSubTab("likes")}
            className={`flex-grow pb-3 text-xs font-bold uppercase tracking-wider border-b-2 flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeSubTab === "likes"
                ? "border-[#531575] text-[#531575]"
                : "border-transparent text-gray-400 hover:text-gray-600"
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">favorite</span>
            Me Gustas ({likes.length})
          </button>
          <button
            onClick={() => setActiveSubTab("comments")}
            className={`flex-grow pb-3 text-xs font-bold uppercase tracking-wider border-b-2 flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeSubTab === "comments"
                ? "border-[#531575] text-[#531575]"
                : "border-transparent text-gray-400 hover:text-gray-600"
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">forum</span>
            Comentarios ({comments.length})
          </button>
          <button
            onClick={() => setActiveSubTab("saves")}
            className={`flex-grow pb-3 text-xs font-bold uppercase tracking-wider border-b-2 flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeSubTab === "saves"
                ? "border-[#531575] text-[#531575]"
                : "border-transparent text-gray-400 hover:text-gray-600"
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">bookmark</span>
            Guardados ({saves.length})
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-grow overflow-y-auto py-4 min-h-[280px]">
          {activeSubTab === "likes" ? (
            loadingLikes ? (
              <div className="space-y-3 py-6">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center gap-3 animate-pulse">
                    <div className="w-9 h-9 rounded-full bg-gray-100" />
                    <div className="h-4 bg-gray-100 rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : likes.length === 0 ? (
              <div className="text-center py-12 text-gray-400 flex flex-col items-center gap-2">
                <span className="material-symbols-outlined text-[32px] text-gray-300">favorite</span>
                <p className="text-xs font-medium">Aún no hay reacciones en esta publicación.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {likes.map((like) => {
                  const userName = like.user?.full_name || "Usuario de Forcepx";
                  const avatar = like.user?.avatar_url;
                  return (
                    <div key={like.id} className="flex items-center justify-between hover:bg-gray-50/50 p-2 rounded-xl transition-all">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-purple-50 border border-purple-100 flex-shrink-0 flex items-center justify-center overflow-hidden">
                          {avatar ? (
                            <img src={avatar} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="material-symbols-outlined text-gray-400 text-[18px]">person</span>
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-900">{userName}</p>
                          <p className="text-[10px] text-gray-400 font-medium">
                            Reaccionó el {new Date(like.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <span className="text-red-500 material-symbols-outlined text-[18px] fill-current">favorite</span>
                    </div>
                  );
                })}
              </div>
            )
          ) : activeSubTab === "comments" ? (
            loadingComments ? (
              <div className="space-y-4 py-6">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex flex-col gap-2 animate-pulse">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gray-100" />
                      <div className="h-3 bg-gray-100 rounded w-1/3" />
                    </div>
                    <div className="h-4 bg-gray-100 rounded w-full" />
                  </div>
                ))}
              </div>
            ) : comments.length === 0 ? (
              <div className="text-center py-12 text-gray-400 flex flex-col items-center gap-2">
                <span className="material-symbols-outlined text-[32px] text-gray-300">forum</span>
                <p className="text-xs font-medium">Aún no hay comentarios en esta publicación.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {comments.map((comment) => {
                  const userName = comment.user?.full_name || "Colega";
                  const avatar = comment.user?.avatar_url;
                  const isDeleting = deletingCommentId === comment.id;
                  return (
                    <div key={comment.id} className="flex items-start justify-between gap-4 p-3 rounded-2xl bg-gray-50 border border-gray-100 hover:border-gray-200 transition-all">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-purple-50 border border-purple-100 flex-shrink-0 flex items-center justify-center overflow-hidden">
                          {avatar ? (
                            <img src={avatar} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="material-symbols-outlined text-gray-400 text-[18px]">person</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-bold text-gray-900">{userName}</span>
                            <span className="text-[10px] text-gray-400 font-medium">
                              • {new Date(comment.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 mt-1 whitespace-pre-line leading-relaxed break-words font-medium">
                            {comment.content}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        disabled={isDeleting}
                        className="p-1.5 text-gray-400 hover:text-red-650 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0 cursor-pointer disabled:opacity-50"
                        title="Eliminar Comentario"
                      >
                        {isDeleting ? (
                          <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            loadingSaves ? (
              <div className="space-y-3 py-6">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center gap-3 animate-pulse">
                    <div className="w-9 h-9 rounded-full bg-gray-100" />
                    <div className="h-4 bg-gray-100 rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : saves.length === 0 ? (
              <div className="text-center py-12 text-gray-400 flex flex-col items-center gap-2">
                <span className="material-symbols-outlined text-[32px] text-gray-300">bookmark</span>
                <p className="text-xs font-medium">Esta publicación aún no ha sido guardada.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {saves.map((save) => {
                  const userName = save.user?.full_name || "Usuario de Forcepx";
                  const avatar = save.user?.avatar_url;
                  return (
                    <div key={save.id} className="flex items-center justify-between hover:bg-gray-50/50 p-2 rounded-xl transition-all">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-purple-50 border border-purple-100 flex-shrink-0 flex items-center justify-center overflow-hidden">
                          {avatar ? (
                            <img src={avatar} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="material-symbols-outlined text-gray-400 text-[18px]">person</span>
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-900">{userName}</p>
                          <p className="text-[10px] text-gray-400 font-medium">
                            Guardó el {new Date(save.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <span className="text-[#531575] material-symbols-outlined text-[18px] fill-current">bookmark</span>
                    </div>
                  );
                })}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}

function DeleteModal({ deleting, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl w-full max-w-sm p-6 text-center shadow-xl">
        <div className="w-14 h-14 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
           <span className="material-symbols-outlined text-[28px]">warning</span>
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2 font-['Manrope']">¿Eliminar artículo?</h3>
        <p className="text-sm text-gray-500 mb-6">Esta acción es irreversible y eliminará la publicación permanentemente del blog.</p>
        <div className="flex items-center gap-3">
           <button onClick={onCancel} disabled={deleting} className="flex-grow py-2.5 rounded-xl font-semibold border text-gray-700 hover:bg-gray-50">Cancelar</button>
           <button onClick={onConfirm} disabled={deleting} className="flex-grow py-2.5 rounded-xl font-semibold bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 transition-all active:scale-95">
             {deleting ? "Eliminando..." : "Sí, Eliminar"}
           </button>
        </div>
      </div>
    </div>
  );
}

AdminPosts.propTypes = {
  post: PropTypes.object,
};

DeleteModal.propTypes = {
  deleting: PropTypes.bool.isRequired,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};

AdminInteractionModal.propTypes = {
  post: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired,
  onCommentDeleted: PropTypes.func,
};

