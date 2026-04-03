import { useState, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import {
  getCategoriesAPI,
  createCategoryAPI,
  updateCategoryAPI,
  deleteCategoryAPI,
  getBrandsAPI,
  createBrandAPI,
  updateBrandAPI,
  deleteBrandAPI,
} from "../../services/api";
import toast from "react-hot-toast";

// ─────────────────────────────────────────────────────────────
// Componente Principal
// ─────────────────────────────────────────────────────────────
export default function CategoryManagement() {
  // Tab state
  const [activeTab, setActiveTab] = useState("categories");

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState(new Set());

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [defaultParentId, setDefaultParentId] = useState(null);

  // Delete confirmation state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // ─── Data Loading ─────────────────────────────────────────
  const loadCategories = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getCategoriesAPI();
      setCategories(res.data.data || []);
    } catch {
      toast.error("Error al cargar categorías");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  // ─── Expand/Collapse ─────────────────────────────────────
  const toggleExpand = (id) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // ─── Modal Handlers ───────────────────────────────────────
  const openCreateModal = (parentId = null) => {
    setEditingCategory(null);
    setDefaultParentId(parentId);
    setModalOpen(true);
  };

  const openEditModal = (category) => {
    setEditingCategory(category);
    setDefaultParentId(category.parent_id || null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingCategory(null);
    setDefaultParentId(null);
  };

  // ─── Delete Handlers ──────────────────────────────────────
  const confirmDelete = (category) => setDeleteTarget(category);
  const cancelDelete = () => setDeleteTarget(null);

  const executeDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await deleteCategoryAPI(deleteTarget.id);
      toast.success(res.data.message || "Categoría eliminada");
      setDeleteTarget(null);
      await loadCategories();
    } catch (err) {
      toast.error(err.response?.data?.error || "Error al eliminar");
    } finally {
      setDeleting(false);
    }
  };

  // ─── Save Handler (Create or Update) ──────────────────────
  const handleSave = async (formData) => {
    try {
      if (editingCategory) {
        await updateCategoryAPI(editingCategory.id, formData);
        toast.success("Categoría actualizada");
      } else {
        await createCategoryAPI(formData);
        toast.success("Categoría creada exitosamente");
      }
      closeModal();
      await loadCategories();
    } catch (err) {
      toast.error(err.response?.data?.error || "Error al guardar");
    }
  };

  // ─── Conteo total ─────────────────────────────────────────
  const totalCount =
    categories.length +
    categories.reduce((acc, c) => acc + (c.children?.length || 0), 0);

  // ─── Render ───────────────────────────────────────────────
  return (
    <div className="max-w-5xl">
      {/* ═══ Tabs: Categorías | Marcas ═══ */}
      <div className="flex items-center gap-1 mb-6 bg-gray-100 rounded-xl p-1 w-fit">
        <button
          onClick={() => setActiveTab("categories")}
          className={`px-5 py-2 text-sm font-semibold rounded-lg transition-all ${
            activeTab === "categories"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <span className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6Z" />
            </svg>
            Categorías
          </span>
        </button>
        <button
          onClick={() => setActiveTab("brands")}
          className={`px-5 py-2 text-sm font-semibold rounded-lg transition-all ${
            activeTab === "brands"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <span className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
            </svg>
            Marcas
          </span>
        </button>
      </div>

      {/* ═══ Tab Content ═══ */}
      {activeTab === "brands" ? (
        <BrandsTab />
      ) : (
      <>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Gestión de Categorías
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Administra las categorías y subcategorías del marketplace.
            {!loading && (
              <span className="text-gray-400 ml-1">
                ({totalCount} en total)
              </span>
            )}
          </p>
        </div>
        <button
          onClick={() => openCreateModal()}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl shadow-sm transition-colors text-sm"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-4 h-4"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4.5v15m7.5-7.5h-15"
            />
          </svg>
          Nueva Categoría
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8">
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-8 h-8 bg-gray-100 rounded-lg" />
                <div className="h-4 bg-gray-100 rounded w-48" />
                <div className="h-4 bg-gray-100 rounded w-20 ml-auto" />
              </div>
            ))}
          </div>
        </div>
      ) : categories.length === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-gray-100">
            <svg
              className="w-8 h-8 text-gray-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M6 6h.008v.008H6V6Z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">
            No hay categorías aún
          </h3>
          <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
            Crea tu primera categoría para organizar los productos del
            marketplace.
          </p>
          <button
            onClick={() => openCreateModal()}
            className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl shadow-sm transition-colors text-sm"
          >
            Crear Primera Categoría
          </button>
        </div>
      ) : (
        /* Category Table */
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-[1fr_120px_100px_140px] gap-4 px-5 py-3 bg-gray-50/80 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
            <span>Categoría</span>
            <span className="text-center">Tipo</span>
            <span className="text-center">Orden</span>
            <span className="text-right">Acciones</span>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-gray-100">
            {categories.map((cat) => (
              <CategoryRow
                key={cat.id}
                category={cat}
                isExpanded={expandedIds.has(cat.id)}
                onToggle={() => toggleExpand(cat.id)}
                onEdit={() => openEditModal(cat)}
                onDelete={() => confirmDelete(cat)}
                onAddChild={() => openCreateModal(cat.id)}
                onEditChild={(child) => openEditModal(child)}
                onDeleteChild={(child) => confirmDelete(child)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {modalOpen && (
        <CategoryModal
          category={editingCategory}
          parentCategories={categories}
          defaultParentId={defaultParentId}
          onSave={handleSave}
          onClose={closeModal}
        />
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <DeleteConfirmation
          category={deleteTarget}
          deleting={deleting}
          onConfirm={executeDelete}
          onCancel={cancelDelete}
        />
      )}
      </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// CategoryRow — Fila de categoría padre con hijos expandibles
// ─────────────────────────────────────────────────────────────
function CategoryRow({
  category,
  isExpanded,
  onToggle,
  onEdit,
  onDelete,
  onAddChild,
  onEditChild,
  onDeleteChild,
}) {
  const hasChildren = category.children && category.children.length > 0;

  return (
    <div>
      {/* Parent Row */}
      <div className="grid grid-cols-[1fr_120px_100px_140px] gap-4 items-center px-5 py-3.5 hover:bg-gray-50/50 transition-colors group">
        {/* Name + Icon + Expand */}
        <div className="flex items-center gap-3 min-w-0">
          {/* Expand button */}
          <button
            onClick={onToggle}
            className={`w-6 h-6 flex-shrink-0 flex items-center justify-center rounded-md transition-colors ${
              hasChildren
                ? "text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                : "text-transparent cursor-default"
            }`}
            disabled={!hasChildren}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className={`w-3.5 h-3.5 transition-transform duration-200 ${
                isExpanded ? "rotate-90" : ""
              }`}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m8.25 4.5 7.5 7.5-7.5 7.5"
              />
            </svg>
          </button>

          {/* Icon */}
          <div className="w-9 h-9 flex-shrink-0 bg-primary-50 rounded-lg flex items-center justify-center border border-primary-100">
            <span className="material-symbols-outlined text-primary-600 text-lg">
              {category.icon || "category"}
            </span>
          </div>

          {/* Name + Slug */}
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 text-sm truncate">
              {category.name}
            </p>
            <p className="text-xs text-gray-400 truncate">{category.slug}</p>
          </div>

          {/* Children count badge */}
          {hasChildren && (
            <span className="flex-shrink-0 text-[10px] font-bold text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full border border-primary-100">
              {category.children.length} sub
            </span>
          )}
        </div>

        {/* Type Badge */}
        <div className="text-center">
          <span className="inline-flex px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 rounded-md border border-blue-100">
            Principal
          </span>
        </div>

        {/* Sort Order */}
        <p className="text-center text-sm text-gray-500 font-mono">
          {category.sort_order}
        </p>

        {/* Actions */}
        <div className="flex items-center justify-end gap-1">
          {/* Add Subcategory */}
          <button
            onClick={onAddChild}
            title="Agregar subcategoría"
            className="p-2 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-4 h-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4.5v15m7.5-7.5h-15"
              />
            </svg>
          </button>
          {/* Edit */}
          <button
            onClick={onEdit}
            title="Editar categoría"
            className="p-2 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-4 h-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
              />
            </svg>
          </button>
          {/* Delete */}
          <button
            onClick={onDelete}
            title="Eliminar categoría"
            className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-4 h-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Expanded Children */}
      {isExpanded && hasChildren && (
        <div className="bg-gray-50/30 border-t border-gray-100">
          {category.children.map((child) => (
            <div
              key={child.id}
              className="grid grid-cols-[1fr_120px_100px_140px] gap-4 items-center pl-14 pr-5 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-b-0"
            >
              {/* Child Name + Icon */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-1 h-7 bg-primary-200 rounded-full flex-shrink-0" />
                <div className="w-8 h-8 flex-shrink-0 bg-white rounded-lg flex items-center justify-center border border-gray-200 shadow-sm">
                  <span className="material-symbols-outlined text-gray-500 text-base">
                    {child.icon || "label"}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-gray-800 text-sm truncate">
                    {child.name}
                  </p>
                  <p className="text-xs text-gray-400 truncate">{child.slug}</p>
                </div>
              </div>

              {/* Type Badge */}
              <div className="text-center">
                <span className="inline-flex px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-600 rounded-md border border-gray-200">
                  Sub
                </span>
              </div>

              {/* Sort Order */}
              <p className="text-center text-sm text-gray-500 font-mono">
                {child.sort_order}
              </p>

              {/* Actions */}
              <div className="flex items-center justify-end gap-1">
                <button
                  onClick={() => onEditChild(child)}
                  title="Editar subcategoría"
                  className="p-2 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                  </svg>
                </button>
                <button
                  onClick={() => onDeleteChild(child)}
                  title="Eliminar subcategoría"
                  className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const categoryShape = PropTypes.shape({
  id: PropTypes.string,
  name: PropTypes.string,
  slug: PropTypes.string,
  description: PropTypes.string,
  icon: PropTypes.string,
  parent_id: PropTypes.string,
  sort_order: PropTypes.number,
  is_active: PropTypes.bool,
  children: PropTypes.array,
});

CategoryRow.propTypes = {
  category: categoryShape.isRequired,
  isExpanded: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onAddChild: PropTypes.func.isRequired,
  onEditChild: PropTypes.func.isRequired,
  onDeleteChild: PropTypes.func.isRequired,
};

// ─────────────────────────────────────────────────────────────
// CategoryModal — Modal de Creación / Edición
// ─────────────────────────────────────────────────────────────
function CategoryModal({
  category,
  parentCategories,
  defaultParentId,
  onSave,
  onClose,
}) {
  const isEditing = Boolean(category);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: category?.name || "",
    description: category?.description || "",
    icon: category?.icon || "",
    parent_id: category?.parent_id || defaultParentId || "",
    sort_order: category?.sort_order ?? 0,
  });

  // Auto-generate slug preview
  const slugPreview = form.name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.name.trim().length < 2) {
      return toast.error("El nombre debe tener al menos 2 caracteres");
    }
    setSaving(true);
    try {
      await onSave({
        name: form.name.trim(),
        description: form.description.trim() || null,
        icon: form.icon.trim() || null,
        parent_id: form.parent_id || null,
        sort_order: parseInt(form.sort_order) || 0,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">
            {isEditing ? "Editar Categoría" : "Nueva Categoría"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Nombre *
            </label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              minLength={2}
              maxLength={100}
              placeholder="Ej: Consumibles, Ortodoncia..."
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors"
            />
            {slugPreview && (
              <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
                <span className="text-gray-500 font-medium">Slug:</span>
                <code className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">
                  {slugPreview}
                </code>
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Descripción
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={2}
              placeholder="Descripción breve de la categoría..."
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 resize-none transition-colors"
            />
          </div>

          {/* Parent + Icon (Row) */}
          <div className="grid grid-cols-2 gap-4">
            {/* Parent Category */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Categoría Padre
              </label>
              <select
                name="parent_id"
                value={form.parent_id}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors"
              >
                <option value="">— Principal (raíz) —</option>
                {parentCategories
                  .filter((c) => c.id !== category?.id) // No puede ser padre de sí misma
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </select>
              <p className="text-xs text-gray-400 mt-1">
                Vacío = categoría principal
              </p>
            </div>

            {/* Icon */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Ícono
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  name="icon"
                  value={form.icon}
                  onChange={handleChange}
                  placeholder="Ej: category"
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors"
                />
                {form.icon && (
                  <div className="w-10 h-10 flex-shrink-0 bg-primary-50 rounded-lg flex items-center justify-center border border-primary-100">
                    <span className="material-symbols-outlined text-primary-600 text-lg">
                      {form.icon}
                    </span>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-1">
                <a
                  href="https://fonts.google.com/icons"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-500 hover:underline"
                >
                  Material Symbols ↗
                </a>
              </p>
            </div>
          </div>

          {/* Sort Order */}
          <div className="w-32">
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Orden
            </label>
            <input
              type="number"
              name="sort_order"
              value={form.sort_order}
              onChange={handleChange}
              min={0}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors"
            />
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 rounded-xl transition-colors shadow-sm"
            >
              {saving
                ? "Guardando..."
                : isEditing
                  ? "Actualizar"
                  : "Crear Categoría"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

CategoryModal.propTypes = {
  category: categoryShape,
  parentCategories: PropTypes.arrayOf(categoryShape).isRequired,
  defaultParentId: PropTypes.string,
  onSave: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};

// ─────────────────────────────────────────────────────────────
// DeleteConfirmation — Diálogo de confirmación de eliminación
// ─────────────────────────────────────────────────────────────
function DeleteConfirmation({ category, deleting, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onCancel}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
        {/* Warning Icon */}
        <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-100">
          <svg
            className="w-7 h-7 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
            />
          </svg>
        </div>

        <h3 className="text-lg font-bold text-gray-900 mb-2">
          ¿Eliminar categoría?
        </h3>
        <p className="text-sm text-gray-500 mb-6">
          Estás a punto de eliminar{" "}
          <span className="font-semibold text-gray-700">
            &quot;{category.name}&quot;
          </span>
          . Esta acción puede ser revertida reactivando la categoría.
        </p>

        <div className="flex items-center gap-3 justify-center">
          <button
            onClick={onCancel}
            className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="px-5 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 disabled:bg-red-400 rounded-xl transition-colors shadow-sm"
          >
            {deleting ? "Eliminando..." : "Sí, Eliminar"}
          </button>
        </div>
      </div>
    </div>
  );
}

DeleteConfirmation.propTypes = {
  category: categoryShape.isRequired,
  deleting: PropTypes.bool.isRequired,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};

// ─────────────────────────────────────────────────────────────
// BrandsTab — Pestaña completa de gestión de marcas
// ─────────────────────────────────────────────────────────────
function BrandsTab() {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadBrands = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getBrandsAPI();
      setBrands(res.data.data || []);
    } catch {
      toast.error("Error al cargar marcas");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBrands();
  }, [loadBrands]);

  const openCreateModal = () => {
    setEditingBrand(null);
    setModalOpen(true);
  };

  const openEditModal = (brand) => {
    setEditingBrand(brand);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingBrand(null);
  };

  const handleSave = async (name) => {
    try {
      if (editingBrand) {
        await updateBrandAPI(editingBrand.id, { name });
        toast.success("Marca actualizada");
      } else {
        await createBrandAPI({ name });
        toast.success("Marca creada exitosamente");
      }
      closeModal();
      await loadBrands();
    } catch (err) {
      toast.error(err.response?.data?.error || "Error al guardar marca");
    }
  };

  const executeDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteBrandAPI(deleteTarget.id);
      toast.success("Marca eliminada");
      setDeleteTarget(null);
      await loadBrands();
    } catch (err) {
      toast.error(err.response?.data?.error || "Error al eliminar marca");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Gestión de Marcas
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Administra las marcas (fabricantes) de los productos.
            {!loading && (
              <span className="text-gray-400 ml-1">
                ({brands.length} en total)
              </span>
            )}
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl shadow-sm transition-colors text-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Nueva Marca
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8">
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-8 h-8 bg-gray-100 rounded-lg" />
                <div className="h-4 bg-gray-100 rounded w-48" />
                <div className="h-4 bg-gray-100 rounded w-20 ml-auto" />
              </div>
            ))}
          </div>
        </div>
      ) : brands.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-gray-100">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-gray-300">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">
            No hay marcas aún
          </h3>
          <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
            Crea tu primera marca para que los vendedores puedan asignarlas a sus productos.
          </p>
          <button
            onClick={openCreateModal}
            className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl shadow-sm transition-colors text-sm"
          >
            Crear Primera Marca
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-[1fr_180px_140px] gap-4 px-5 py-3 bg-gray-50/80 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
            <span>Marca</span>
            <span className="text-center">Slug</span>
            <span className="text-right">Acciones</span>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-gray-100">
            {brands.map((brand) => (
              <div
                key={brand.id}
                className="grid grid-cols-[1fr_180px_140px] gap-4 items-center px-5 py-3.5 hover:bg-gray-50/50 transition-colors group"
              >
                {/* Name */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 flex-shrink-0 bg-blue-50 rounded-lg flex items-center justify-center border border-blue-100">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-blue-600">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
                    </svg>
                  </div>
                  <p className="font-semibold text-gray-900 text-sm truncate">{brand.name}</p>
                </div>

                {/* Slug */}
                <p className="text-center text-xs text-gray-400 font-mono truncate">
                  {brand.slug}
                </p>

                {/* Actions */}
                <div className="flex items-center justify-end gap-1">
                  <button
                    onClick={() => openEditModal(brand)}
                    title="Editar marca"
                    className="p-2 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setDeleteTarget(brand)}
                    title="Eliminar marca"
                    className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Brand Modal */}
      {modalOpen && (
        <BrandModal
          brand={editingBrand}
          onSave={handleSave}
          onClose={closeModal}
        />
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <BrandDeleteConfirmation
          brand={deleteTarget}
          deleting={deleting}
          onConfirm={executeDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// BrandModal — Modal de Creación / Edición de Marca
// ─────────────────────────────────────────────────────────────
function BrandModal({ brand, onSave, onClose }) {
  const isEditing = Boolean(brand);
  const [name, setName] = useState(brand?.name || "");
  const [saving, setSaving] = useState(false);

  const slugPreview = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (name.trim().length < 1) {
      return toast.error("El nombre es requerido");
    }
    setSaving(true);
    try {
      await onSave(name.trim());
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">
            {isEditing ? "Editar Marca" : "Nueva Marca"}
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Nombre de la Marca *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              minLength={1}
              maxLength={100}
              placeholder="Ej: 3M, Kerr, Dentsply Sirona..."
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors"
            />
            {slugPreview && (
              <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
                <span className="text-gray-500 font-medium">Slug:</span>
                <code className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">
                  {slugPreview}
                </code>
              </p>
            )}
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 rounded-xl transition-colors shadow-sm"
            >
              {saving ? "Guardando..." : isEditing ? "Actualizar" : "Crear Marca"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

BrandModal.propTypes = {
  brand: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
  }),
  onSave: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};

// ─────────────────────────────────────────────────────────────
// BrandDeleteConfirmation
// ─────────────────────────────────────────────────────────────
function BrandDeleteConfirmation({ brand, deleting, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
        <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-100">
          <svg className="w-7 h-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">¿Eliminar marca?</h3>
        <p className="text-sm text-gray-500 mb-6">
          Estás a punto de eliminar{" "}
          <span className="font-semibold text-gray-700">&quot;{brand.name}&quot;</span>.
          Los productos que la tengan asignada quedarán sin marca.
        </p>
        <div className="flex items-center gap-3 justify-center">
          <button
            onClick={onCancel}
            className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="px-5 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 disabled:bg-red-400 rounded-xl transition-colors shadow-sm"
          >
            {deleting ? "Eliminando..." : "Sí, Eliminar"}
          </button>
        </div>
      </div>
    </div>
  );
}

BrandDeleteConfirmation.propTypes = {
  brand: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
  }).isRequired,
  deleting: PropTypes.bool.isRequired,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};
