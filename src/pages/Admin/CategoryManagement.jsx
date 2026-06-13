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

// Categorías de íconos comunes para el selector visual
const ICON_CATEGORIES = [
  {
    title: "Odontología y Dental",
    icons: ["dentistry", "chair_alt", "face", "diamond", "build"]
  },
  {
    title: "Médico y Clínico",
    icons: ["vaccines", "stethoscope", "local_pharmacy", "pill", "medication", "emergency", "medical_services", "prescriptions", "healing"]
  },
  {
    title: "Laboratorio y Ciencia",
    icons: ["science", "biotech", "lab_research", "microbiology"]
  },
  {
    title: "Higiene y Protección",
    icons: ["masks", "clean_hands", "sanitizer"]
  },
  {
    title: "Generales y Gestión",
    icons: ["category", "label", "inventory_2", "storefront", "shopping_bag"]
  }
];

// ─────────────────────────────────────────────────────────────
// Componente Principal
// ─────────────────────────────────────────────────────────────
export default function CategoryManagement() {
  const [activeTab, setActiveTab] = useState("categories");

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("grid"); // "grid" | "table"

  // Slide-Over state
  const [slideOverOpen, setSlideOverOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [defaultParentId, setDefaultParentId] = useState(null);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

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

  const openCreateSlideOver = (parentId = null) => {
    setEditingCategory(null);
    setDefaultParentId(parentId);
    setSlideOverOpen(true);
  };

  const openEditSlideOver = (category) => {
    setEditingCategory(category);
    setDefaultParentId(category.parent_id || null);
    setSlideOverOpen(true);
  };

  const closeSlideOver = () => {
    setSlideOverOpen(false);
    setEditingCategory(null);
    setDefaultParentId(null);
  };

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

  const handleSave = async (formData) => {
    try {
      if (editingCategory) {
        await updateCategoryAPI(editingCategory.id, formData);
        toast.success("Categoría actualizada");
      } else {
        await createCategoryAPI(formData);
        toast.success("Categoría creada exitosamente");
      }
      closeSlideOver();
      await loadCategories();
    } catch (err) {
      toast.error(err.response?.data?.error || "Error al guardar");
    }
  };

  const totalCount = categories.length + categories.reduce((acc, c) => acc + (c.children?.length || 0), 0);

  return (
    <div className="max-w-6xl mx-auto pb-12">
      {/* ═══ Tabs ═══ */}
      <div className="flex items-center gap-1 mb-8 bg-gray-100 rounded-xl p-1 w-fit shadow-inner">
        <button
          onClick={() => setActiveTab("categories")}
          className={`px-6 py-2.5 text-sm font-bold rounded-lg transition-all ${
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
          className={`px-6 py-2.5 text-sm font-bold rounded-lg transition-all ${
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

      {activeTab === "brands" ? (
        <BrandsTab />
      ) : (
        <>
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                Gestión de Categorías
              </h1>
              <p className="text-sm text-gray-500 mt-2">
                Administra las categorías y subcategorías de la plataforma.
                {!loading && (
                  <span className="font-semibold text-gray-700 ml-1">
                    ({totalCount} categorías)
                  </span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* Toggle Vista */}
              <div className="hidden sm:flex bg-gray-100 p-1 rounded-xl border border-gray-200/50">
                <button 
                  onClick={() => setViewMode("grid")} 
                  className={`p-2 rounded-lg flex items-center justify-center transition-all ${viewMode === "grid" ? "bg-white shadow-sm text-blue-600" : "text-gray-400 hover:text-gray-600"}`}
                  title="Vista de Cuadrícula"
                >
                  <span className="material-symbols-outlined text-[20px]">grid_view</span>
                </button>
                <button 
                  onClick={() => setViewMode("table")} 
                  className={`p-2 rounded-lg flex items-center justify-center transition-all ${viewMode === "table" ? "bg-white shadow-sm text-blue-600" : "text-gray-400 hover:text-gray-600"}`}
                  title="Vista de Tabla"
                >
                  <span className="material-symbols-outlined text-[20px]">view_list</span>
                </button>
              </div>

              <button
                onClick={() => openCreateSlideOver()}
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#111] hover:bg-black text-white font-bold rounded-xl shadow-lg transition-all text-sm"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Nueva Categoría
              </button>
            </div>
          </div>

          {/* Content */}
          {loading ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
              <div className="space-y-4 animate-pulse">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gray-100 rounded-xl" />
                    <div className="h-4 bg-gray-100 rounded w-48" />
                  </div>
                ))}
              </div>
            </div>
          ) : categories.length === 0 ? (
            <div className="bg-white rounded-3xl border border-gray-200 p-16 text-center shadow-sm">
              <div className="w-20 h-20 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="material-symbols-outlined text-4xl text-primary-300">account_tree</span>
              </div>
              <h3 className="text-xl font-extrabold text-gray-900 mb-2">Aún no hay categorías</h3>
              <p className="text-gray-500 mb-8 max-w-md mx-auto">
                Las categorías son esenciales para organizar los productos. Crea tu primera categoría para empezar.
              </p>
              <button
                onClick={() => openCreateSlideOver()}
                className="px-8 py-3 bg-[#111] hover:bg-black text-white font-bold rounded-xl shadow-lg transition-all"
              >
                Crear Categoría Principal
              </button>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map((cat) => (
                <div key={cat.id} className="bg-white rounded-3xl border border-gray-200 shadow-sm hover:shadow-lg transition-shadow overflow-hidden flex flex-col">
                  {/* Card Header (Categoría Principal) */}
                  <div className="p-6 border-b border-gray-100 bg-[#fafafa] flex items-start justify-between group">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center border border-blue-100 shadow-sm">
                        <span className="material-symbols-outlined text-3xl">{cat.icon || "folder"}</span>
                      </div>
                      <div>
                        <h3 className="text-xl font-extrabold text-gray-900">{cat.name}</h3>
                        <p className="text-xs text-gray-400 font-mono mt-0.5">/{cat.slug}</p>
                      </div>
                    </div>
                    {/* Acciones de Categoría Principal */}
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEditSlideOver(cat)} title="Editar Categoría Principal" className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" /></svg>
                      </button>
                      <button onClick={() => confirmDelete(cat)} title="Eliminar Categoría Principal" className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
                      </button>
                    </div>
                  </div>

                  {/* Body: Subcategorías */}
                  <div className="p-6 flex-1 bg-white">
                    <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center justify-between">
                      Subcategorías
                      <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md">{cat.children?.length || 0}</span>
                    </h4>
                    
                    {cat.children && cat.children.length > 0 ? (
                      <div className="flex flex-wrap gap-2.5">
                        {cat.children.map(child => (
                          <div key={child.id} className="group/pill inline-flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:border-primary-300 hover:bg-primary-50 transition-colors shadow-sm">
                            <span className="material-symbols-outlined text-[16px] text-gray-400 group-hover/pill:text-primary-500">{child.icon || "label"}</span>
                            {child.name}
                            
                            {/* Acciones de Subcategoría */}
                            <div className="flex items-center ml-1 border-l border-gray-200 pl-1.5 opacity-0 group-hover/pill:opacity-100 transition-opacity">
                              <button onClick={() => openEditSlideOver(child)} title="Editar Subcategoría" className="text-gray-400 hover:text-amber-600 px-1 hover:scale-110 transition-transform">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="m2.695 14.762-1.262 3.155a.5.5 0 0 0 .65.65l3.155-1.262a4 4 0 0 0 1.343-.886L17.5 5.501a2.121 2.121 0 0 0-3-3L3.58 13.419a4 4 0 0 0-.885 1.343Z" /></svg>
                              </button>
                              <button onClick={() => confirmDelete(child)} title="Eliminar Subcategoría" className="text-gray-400 hover:text-red-600 px-1 hover:scale-110 transition-transform">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" /></svg>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 border-2 border-dashed border-gray-100 rounded-2xl bg-gray-50/50">
                        <p className="text-sm font-medium text-gray-400">Sin subcategorías</p>
                      </div>
                    )}
                  </div>

                  {/* Footer: Botón de añadir subcategoría */}
                  <div className="p-4 bg-gray-50 border-t border-gray-100">
                    <button 
                      onClick={() => openCreateSlideOver(cat.id)} 
                      className="w-full flex items-center justify-center gap-2 py-3 bg-white border border-gray-200 hover:border-primary-300 hover:text-primary-700 text-gray-600 font-bold rounded-xl text-sm shadow-sm transition-all"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                      Añadir Subcategoría a {cat.name}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#fafafa] border-b border-gray-100 text-xs font-bold text-gray-400 uppercase tracking-wider">
                      <th className="px-6 py-4 font-bold">Categoría Principal</th>
                      <th className="px-6 py-4 font-bold">Subcategorías (Etiquetas)</th>
                      <th className="px-6 py-4 font-bold text-center w-24">Posición</th>
                      <th className="px-6 py-4 font-bold text-right w-32">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {categories.map((cat) => (
                      <tr key={cat.id} className="hover:bg-gray-50/50 transition-colors group">
                        {/* MAIN CATEGORY CELL */}
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center border border-blue-100 shadow-sm flex-shrink-0">
                              <span className="material-symbols-outlined text-xl">{cat.icon || "folder"}</span>
                            </div>
                            <div>
                              <p className="font-extrabold text-gray-900 text-sm">{cat.name}</p>
                              <p className="text-[11px] text-gray-400 font-mono mt-0.5">/{cat.slug}</p>
                            </div>
                          </div>
                        </td>

                        {/* SUBCATEGORIES CELL */}
                        <td className="px-6 py-5">
                          <div className="flex flex-wrap items-center gap-2">
                            {cat.children && cat.children.length > 0 ? (
                              cat.children.map(child => (
                                <div key={child.id} className="group/pill inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-600 hover:border-primary-300 hover:bg-primary-50 transition-colors shadow-sm">
                                  {child.name}
                                  <div className="flex items-center ml-1 border-l border-gray-200 pl-1 opacity-0 group-hover/pill:opacity-100 transition-opacity">
                                    <button onClick={() => openEditSlideOver(child)} title="Editar" className="text-gray-400 hover:text-amber-600 px-0.5"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5"><path d="m2.695 14.762-1.262 3.155a.5.5 0 0 0 .65.65l3.155-1.262a4 4 0 0 0 1.343-.886L17.5 5.501a2.121 2.121 0 0 0-3-3L3.58 13.419a4 4 0 0 0-.885 1.343Z" /></svg></button>
                                    <button onClick={() => confirmDelete(child)} title="Eliminar" className="text-gray-400 hover:text-red-600 px-0.5"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5"><path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" /></svg></button>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <span className="text-xs text-gray-400 italic">Ninguna</span>
                            )}
                            <button onClick={() => openCreateSlideOver(cat.id)} className="inline-flex items-center justify-center w-6 h-6 rounded-full border border-dashed border-gray-300 text-gray-400 hover:text-blue-600 hover:border-blue-300 transition-colors bg-gray-50 hover:bg-blue-50" title="Añadir Subcategoría">
                              <span className="material-symbols-outlined text-[14px]">add</span>
                            </button>
                          </div>
                        </td>

                        {/* SORT ORDER CELL */}
                        <td className="px-6 py-5 text-center text-sm font-semibold text-gray-400">
                          #{cat.sort_order}
                        </td>

                        {/* ACTIONS CELL */}
                        <td className="px-6 py-5 text-right">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => openEditSlideOver(cat)} title="Editar" className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors">
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" /></svg>
                            </button>
                            <button onClick={() => confirmDelete(cat)} title="Eliminar" className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Slide-Over Editor */}
          <CategorySlideOver
            open={slideOverOpen}
            category={editingCategory}
            parentCategories={categories}
            defaultParentId={defaultParentId}
            onSave={handleSave}
            onClose={closeSlideOver}
          />

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
// CategorySlideOver — Drawer Lateral para Creación/Edición
// ─────────────────────────────────────────────────────────────
function CategorySlideOver({
  open,
  category,
  parentCategories,
  defaultParentId,
  onSave,
  onClose,
}) {
  const isEditing = Boolean(category);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "",
    description: "",
    icon: "category",
    parent_id: "",
    sort_order: 0,
  });

  // Reset form when modal opens/changes
  useEffect(() => {
    if (open) {
      setForm({
        name: category?.name || "",
        description: category?.description || "",
        icon: category?.icon || "category",
        parent_id: category?.parent_id || defaultParentId || "",
        sort_order: category?.sort_order ?? 0,
      });
    }
  }, [open, category, defaultParentId]);

  if (!open) return null;

  const slugPreview = form.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.name.trim().length < 2) return toast.error("El nombre debe tener al menos 2 caracteres");
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
    <div className="fixed inset-0 z-[200] flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity" onClick={onClose} />

      {/* Drawer */}
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col transform transition-transform duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-[#fafafa]">
          <div>
            <h2 className="text-xl font-extrabold text-gray-900">
              {isEditing ? "Editar Categoría" : "Nueva Categoría"}
            </h2>
            <p className="text-sm text-gray-500 mt-1">Configura la información de la categoría.</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full bg-white border border-gray-200 hover:bg-gray-100 text-gray-500 transition-colors shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Scrollable Form */}
        <div className="flex-1 overflow-y-auto">
          <form id="category-form" onSubmit={handleSubmit} className="p-6 space-y-6">
            
            {/* Jerarquía */}
            <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
              <label className="block text-sm font-bold text-gray-800 mb-2">Nivel de Categoría</label>
              <select
                name="parent_id"
                value={form.parent_id}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">🌟 Categoría Principal</option>
                <optgroup label="Hacer subcategoría de:">
                  {parentCategories.filter((c) => c.id !== category?.id).map((c) => (
                    <option key={c.id} value={c.id}>↳ {c.name}</option>
                  ))}
                </optgroup>
              </select>
            </div>

            {/* Nombre */}
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-2">Nombre de Categoría <span className="text-red-500">*</span></label>
              <input
                type="text" name="name" value={form.name} onChange={handleChange} required minLength={2}
                placeholder="Ej: Fresas Diamantadas"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:bg-white transition-all"
              />
              {slugPreview && (
                <p className="text-[11px] text-gray-400 mt-2 flex items-center gap-1 font-mono">
                  URL: /categoria/<span className="text-primary-600 font-bold">{slugPreview}</span>
                </p>
              )}
            </div>

            {/* Icon Picker */}
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-2">Ícono Visual</label>
              <div className="p-4 border border-gray-200 rounded-2xl bg-gray-50/50 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-gray-200 flex items-center justify-center text-primary-600 flex-shrink-0">
                    <span className="material-symbols-outlined text-2xl">{form.icon}</span>
                  </div>
                  <div className="flex-1">
                    <input
                      type="text" name="icon" value={form.icon} onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-primary-500"
                      placeholder="Nombre del ícono..."
                    />
                    <p className="text-[10px] text-gray-400 mt-1 font-medium">Escribe un nombre de Google Material Symbols.</p>
                  </div>
                </div>

                {/* Categorías de íconos */}
                <div className="space-y-4 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
                  {ICON_CATEGORIES.map(categoryGroup => (
                    <div key={categoryGroup.title} className="space-y-1.5">
                      <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">{categoryGroup.title}</h5>
                      <div className="grid grid-cols-5 gap-2">
                        {categoryGroup.icons.map(ic => (
                          <button
                            key={ic} type="button" onClick={() => setForm(p => ({...p, icon: ic}))}
                            title={ic}
                            className={`h-10 rounded-lg flex items-center justify-center border transition-all hover:scale-105 active:scale-95 ${
                              form.icon === ic 
                                ? "bg-primary-100 border-primary-300 text-primary-700 shadow-sm font-bold" 
                                : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                            }`}
                          >
                            <span className="material-symbols-outlined text-lg">{ic}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Orden */}
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-2">Posición (Orden)</label>
              <input
                type="number" name="sort_order" value={form.sort_order} onChange={handleChange} min={0}
                className="w-full sm:w-32 px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
              <p className="text-xs text-gray-500 mt-1.5">Los números más bajos aparecen primero (0 = Primera posición).</p>
            </div>
            
            {/* Descripción */}
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-2">Descripción (Opcional)</label>
              <textarea
                name="description" value={form.description} onChange={handleChange} rows={2}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                placeholder="Opcional..."
              />
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 bg-white">
          <button
            type="submit" form="category-form" disabled={saving}
            className="w-full py-3.5 bg-[#111] hover:bg-black disabled:bg-gray-300 text-white font-bold rounded-xl shadow-lg transition-all text-sm flex justify-center items-center gap-2"
          >
            {saving ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (
              isEditing ? "Guardar Cambios" : "Crear Categoría"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

CategorySlideOver.propTypes = {
  open: PropTypes.bool.isRequired,
  category: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    description: PropTypes.string,
    slug: PropTypes.string,
    icon: PropTypes.string,
    parent_id: PropTypes.string,
    sort_order: PropTypes.number,
    children: PropTypes.array,
  }),
  parentCategories: PropTypes.array.isRequired,
  defaultParentId: PropTypes.string,
  onSave: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};

// ─────────────────────────────────────────────────────────────
// BrandsTab — Pestaña de Marcas en forma de Grid Premium
// ─────────────────────────────────────────────────────────────
function BrandsTab() {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [slideOverOpen, setSlideOverOpen] = useState(false);
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

  useEffect(() => { loadBrands(); }, [loadBrands]);

  const openCreateSlideOver = () => { setEditingBrand(null); setSlideOverOpen(true); };
  const openEditSlideOver = (b) => { setEditingBrand(b); setSlideOverOpen(true); };
  const closeSlideOver = () => { setSlideOverOpen(false); setEditingBrand(null); };

  const handleSave = async (name) => {
    try {
      if (editingBrand) {
        await updateBrandAPI(editingBrand.id, { name });
        toast.success("Marca actualizada");
      } else {
        await createBrandAPI({ name });
        toast.success("Marca creada exitosamente");
      }
      closeSlideOver();
      await loadBrands();
    } catch (err) {
      toast.error(err.response?.data?.error || "Error al guardar");
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
      toast.error(err.response?.data?.error || "Error al eliminar");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Gestión de Marcas</h1>
          <p className="text-sm text-gray-500 mt-2">Administra el catálogo de marcas disponibles para los productos.</p>
        </div>
        <button
          onClick={openCreateSlideOver}
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#111] hover:bg-black text-white font-bold rounded-xl shadow-lg transition-all text-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
          Nueva Marca
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5 animate-pulse">
          {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-36 bg-gray-100 rounded-3xl" />)}
        </div>
      ) : brands.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-200 p-16 text-center shadow-sm">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="material-symbols-outlined text-4xl text-gray-300">workspace_premium</span>
          </div>
          <h3 className="text-xl font-extrabold text-gray-900 mb-2">No hay marcas registradas</h3>
          <p className="text-gray-500 mb-8 max-w-md mx-auto">Agrega marcas para que los vendedores puedan asociarlas a sus productos, aumentando el nivel de confianza.</p>
          <button onClick={openCreateSlideOver} className="px-8 py-3 bg-[#111] hover:bg-black text-white font-bold rounded-xl shadow-lg transition-all">
            Crear Primera Marca
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
          {brands.map((brand) => (
            <div key={brand.id} className="group relative bg-white border border-gray-200 rounded-3xl p-6 hover:border-blue-400 hover:shadow-xl hover:shadow-blue-500/10 transition-all flex flex-col items-center justify-center min-h-[140px] text-center">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-xl">workspace_premium</span>
              </div>
              <h3 className="font-extrabold text-gray-900 text-sm">{brand.name}</h3>
              <p className="text-[10px] text-gray-400 font-mono mt-1 opacity-0 group-hover:opacity-100 transition-opacity">/{brand.slug}</p>
              
              {/* Acciones flotantes */}
              <div className="absolute top-3 right-3 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0">
                <button onClick={() => openEditSlideOver(brand)} className="w-7 h-7 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-400 hover:text-amber-600 shadow-sm hover:border-amber-200 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" /></svg>
                </button>
                <button onClick={() => setDeleteTarget(brand)} className="w-7 h-7 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-400 hover:text-red-600 shadow-sm hover:border-red-200 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <BrandSlideOver open={slideOverOpen} brand={editingBrand} onSave={handleSave} onClose={closeSlideOver} />
      {deleteTarget && <DeleteConfirmation category={deleteTarget} deleting={deleting} onConfirm={executeDelete} onCancel={() => setDeleteTarget(null)} isBrand />}
    </>
  );
}

function BrandSlideOver({ open, brand, onSave, onClose }) {
  const isEditing = Boolean(brand);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (open) setName(brand?.name || ""); }, [open, brand]);
  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (name.trim().length < 1) return toast.error("El nombre es requerido");
    setSaving(true);
    try { await onSave(name.trim()); } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-[200] flex justify-end">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-white h-full shadow-2xl flex flex-col transform transition-transform duration-300">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-[#fafafa]">
          <h2 className="text-xl font-extrabold text-gray-900">{isEditing ? "Editar Marca" : "Nueva Marca"}</h2>
          <button onClick={onClose} className="p-2 rounded-full bg-white border border-gray-200 hover:bg-gray-100 transition-colors shadow-sm"><span className="material-symbols-outlined text-lg">close</span></button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          <form id="brand-form" onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-2">Nombre Oficial de la Marca</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} required minLength={1} className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Ej: 3M, Dentsply..." />
            </div>
          </form>
        </div>
        <div className="p-6 border-t border-gray-100 bg-white">
          <button type="submit" form="brand-form" disabled={saving} className="w-full py-3.5 bg-[#111] hover:bg-black disabled:bg-gray-300 text-white font-bold rounded-xl shadow-lg transition-all text-sm flex justify-center items-center">
            {saving ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : (isEditing ? "Actualizar" : "Guardar Marca")}
          </button>
        </div>
      </div>
    </div>
  );
}
BrandSlideOver.propTypes = { open: PropTypes.bool.isRequired, brand: PropTypes.object, onSave: PropTypes.func.isRequired, onClose: PropTypes.func.isRequired };

// ─────────────────────────────────────────────────────────────
// Universal Delete Confirmation
// ─────────────────────────────────────────────────────────────
function DeleteConfirmation({ category, deleting, onConfirm, onCancel, isBrand = false }) {
  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 text-center">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-5 border-[4px] border-white shadow-sm">
          <span className="material-symbols-outlined text-3xl text-red-500">warning</span>
        </div>
        <h3 className="text-xl font-extrabold text-gray-900 mb-2">¿Confirmas la eliminación?</h3>
        <p className="text-sm text-gray-500 mb-8 leading-relaxed">
          Estás a punto de eliminar {isBrand ? "la marca" : "la categoría"} <span className="font-bold text-gray-800">&quot;{category.name}&quot;</span>. Esta acción no se puede deshacer de forma fácil.
        </p>
        <div className="flex items-center gap-3 justify-center">
          <button onClick={onCancel} className="px-6 py-3 text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">Cancelar</button>
          <button onClick={onConfirm} disabled={deleting} className="px-6 py-3 text-sm font-bold text-white bg-red-600 hover:bg-red-700 disabled:bg-red-400 rounded-xl transition-colors shadow-lg shadow-red-500/30">
            {deleting ? "Borrando..." : "Sí, Eliminar"}
          </button>
        </div>
      </div>
    </div>
  );
}
DeleteConfirmation.propTypes = { category: PropTypes.object.isRequired, deleting: PropTypes.bool.isRequired, onConfirm: PropTypes.func.isRequired, onCancel: PropTypes.func.isRequired, isBrand: PropTypes.bool };
