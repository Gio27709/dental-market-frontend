import { useState, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import {
  getPostsAPI,
  createPostAPI,
  updatePostAPI,
  deletePostAPI,
} from "../../services/api";
import toast from "react-hot-toast";

export default function AdminPosts() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState(null);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadPosts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getPostsAPI();
      setPosts(res.data.data || []);
    } catch {
      toast.error("Error al cargar publicaciones");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

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
    } catch (err) {
      toast.error(err.response?.data?.error || "Error al guardar");
    }
  };

  return (
    <div className="max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Noticias y Blog</h1>
          <p className="text-sm text-gray-500 mt-1">
            Administra las publicaciones, artículos y casos clínicos.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#531575] hover:bg-[#6b1e96] text-white font-semibold rounded-xl shadow-sm transition-colors text-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
          Nueva Publicación
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 space-y-4 animate-pulse">
           {[1, 2, 3].map(i => <div key={i} className="h-12 bg-gray-100 rounded-lg" />)}
        </div>
      ) : posts.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-sm">
           <div className="w-16 h-16 bg-gray-50 text-gray-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-gray-100">
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 6h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 0 1-2.25 2.25M16.5 7.5V18a2.25 2.25 0 0 0 2.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 0 0 2.25 2.25h13.5M6 7.5h3v3H6v-3Z" /></svg>
           </div>
           <h3 className="text-lg font-bold text-gray-900">No hay publicaciones</h3>
           <p className="text-sm text-gray-500 mb-6">Comienza agregar noticias y artículos al blog.</p>
           <button onClick={openCreateModal} className="px-5 py-2.5 bg-[#531575] text-white font-semibold rounded-xl text-sm">Crear Artículo</button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50/80 border-b border-gray-100 uppercase tracking-wider text-xs font-bold text-gray-500">
              <tr>
                <th className="px-5 py-3">Publicación</th>
                <th className="px-5 py-3 text-center">Categoría</th>
                <th className="px-5 py-3 text-center">Tipo Autor</th>
                <th className="px-5 py-3 text-center">Fecha</th>
                <th className="px-5 py-3 text-center">Estado</th>
                <th className="px-5 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {posts.map((post) => (
                <tr key={post.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0 flex items-center justify-center">
                        {post.thumbnail_url ? (
                          <img src={post.thumbnail_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} className="w-5 h-5 text-gray-400 stroke-current"><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" /></svg>
                        )}
                      </div>
                      <div className="max-w-[200px]">
                        <p className="font-semibold text-gray-900 truncate" title={post.title}>{post.title}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <span className="inline-flex px-2 py-1 text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 rounded-md">{post.category || 'General'}</span>
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <span className="text-gray-500 font-medium capitalize">{post.author_type || 'admin'}</span>
                  </td>
                  <td className="px-5 py-3.5 text-center text-gray-500 font-mono">
                    {new Date(post.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3.5 text-center">
                     {post.is_published ? (
                       <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded border border-green-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Publico
                       </span>
                     ) : (
                       <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Oculto
                       </span>
                     )}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-2">
                       <button onClick={() => openEditModal(post)} className="p-2 rounded-lg text-gray-400 hover:text-[#531575] hover:bg-[#531575]/10 transition-colors">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" /></svg>
                       </button>
                       <button onClick={() => confirmDelete(post)} className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
                       </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Post Modal */}
      {modalOpen && (
        <PostModal post={editingPost} onSave={handleSave} onClose={closeModal} />
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <DeleteModal deleting={deleting} onConfirm={executeDelete} onCancel={cancelDelete} />
      )}
    </div>
  );
}

function PostModal({ post, onSave, onClose }) {
  const [form, setForm] = useState({
    title: post?.title || "",
    content: post?.content || "",
    thumbnail_url: post?.thumbnail_url || "",
    category: post?.category || "Noticias",
    is_published: post ? post.is_published : true,
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
           <h2 className="text-lg font-bold text-gray-900">{post ? "Editar Publicación" : "Crear Publicación"}</h2>
           <button onClick={onClose} className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18 18 6M6 6l12 12" /></svg></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-5">
           <div>
             <label className="block text-sm font-semibold text-gray-700 mb-1">Título de la Publicación *</label>
             <input required type="text" value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full px-4 py-2 border rounded-xl" placeholder="Ej: Avances en Resinas Compuestas..." />
           </div>
           
           <div className="grid grid-cols-2 gap-4">
              <div>
                 <label className="block text-sm font-semibold text-gray-700 mb-1">Categoría</label>
                 <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="w-full px-4 py-2 border rounded-xl">
                   <option value="Noticias">Noticias</option>
                   <option value="Casos Clínicos">Casos Clínicos</option>
                   <option value="Investigación">Investigación</option>
                   <option value="Entrevistas">Entrevistas</option>
                   <option value="Innovación">Innovación</option>
                 </select>
              </div>
              <div>
                 <label className="block text-sm font-semibold text-gray-700 mb-1">URL de Portada (Imagen)</label>
                 <input type="text" value={form.thumbnail_url} onChange={e => setForm({...form, thumbnail_url: e.target.value})} className="w-full px-4 py-2 border rounded-xl" placeholder="https://dominio.com/imagen.jpg" />
              </div>
           </div>

           <div>
             <label className="block text-sm font-semibold text-gray-700 mb-1">Contenido HTML (Artículo completo) *</label>
             <textarea required rows={10} value={form.content} onChange={e => setForm({...form, content: e.target.value})} className="w-full px-4 py-2 border rounded-xl font-mono text-sm" placeholder="Escribe el artículo aquí. Puedes usar etiquetas HTML como <p>, <h2>, <strong>..." />
             <p className="text-xs text-gray-500 mt-1">Soporta HTML nativo para aplicar formato.</p>
           </div>
           
           <div className="flex items-center gap-2">
             <input type="checkbox" id="publicado" checked={form.is_published} onChange={e => setForm({...form, is_published: e.target.checked})} className="w-5 h-5 text-[#531575] border-gray-300 rounded focus:ring-[#531575] cursor-pointer" />
             <label htmlFor="publicado" className="text-sm font-semibold text-gray-800 cursor-pointer">Activo y Público (Visible para usuarios en la sección Noticias)</label>
           </div>
           
           <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
              <button type="button" onClick={onClose} className="px-5 py-2 hover:bg-gray-100 rounded-xl font-medium">Cancelar</button>
              <button type="submit" disabled={saving} className="px-5 py-2 bg-[#531575] hover:bg-[#6b1e96] text-white rounded-xl font-medium disabled:opacity-50 transition-colors">
                {saving ? "Guardando..." : "Guardar Publicación"}
              </button>
           </div>
        </form>
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
           <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">¿Eliminar artículo?</h3>
        <p className="text-sm text-gray-500 mb-6">Esta acción es irreversible y eliminará la publicación permanentemente del blog.</p>
        <div className="flex items-center gap-3">
           <button onClick={onCancel} disabled={deleting} className="flex-1 py-2.5 rounded-xl font-semibold border text-gray-700 hover:bg-gray-50">Cancelar</button>
           <button onClick={onConfirm} disabled={deleting} className="flex-1 py-2.5 rounded-xl font-semibold bg-red-600 hover:bg-red-700 text-white disabled:opacity-50">
             {deleting ? "Eliminando..." : "Sí, Eliminar"}
           </button>
        </div>
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
};

DeleteModal.propTypes = {
  deleting: PropTypes.bool.isRequired,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};
