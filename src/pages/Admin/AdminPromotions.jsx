import { useState, useEffect, useCallback, useMemo } from "react";
import PropTypes from "prop-types";
import {
  getAdminPromotionsAPI,
  createPromotionAPI,
  updatePromotionAPI,
  deletePromotionAPI,
  getCategoriesAPI,
  getAllAdminProductsAPI,
  uploadHomeSectionImageAPI,
  getAdminDiscountsAPI,
  moderateDiscountAPI,
} from "../../services/api";
import { formatCurrencyUSD } from "../../utils/formatters";
import toast from "react-hot-toast";

// Helper to convert ISO date from server to local datetime-local format
const toLocalDatetimeString = (isoString) => {
  if (!isoString) return "";
  const date = new Date(isoString);
  const tzOffset = date.getTimezoneOffset() * 60000; // in milliseconds
  const localISOTime = new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
  return localISOTime;
};

// Helper to convert local datetime string to ISO string for backend
const toISODateString = (localString) => {
  if (!localString) return null;
  return new Date(localString).toISOString();
};

export default function AdminPromotions() {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Tab State
  const [activeTab, setActiveTab] = useState("promotions"); // "promotions" | "discounts"

  // Store Discounts Moderation States
  const [discounts, setDiscounts] = useState([]);
  const [discountLoading, setDiscountLoading] = useState(false);
  const [discountFilter, setDiscountFilter] = useState("all"); // 'all' | 'pending' | 'approved' | 'rejected'
  const [moderatingId, setModeratingId] = useState(null);

  // Form states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState(null);

  // Delete states
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadPromotions = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getAdminPromotionsAPI();
      setPromotions(res.data.data || []);
    } catch (err) {
      toast.error("Error al cargar las promociones");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadDiscounts = useCallback(async () => {
    try {
      setDiscountLoading(true);
      const res = await getAdminDiscountsAPI();
      setDiscounts(res.data.data || []);
    } catch (err) {
      toast.error("Error al cargar los descuentos de tiendas");
      console.error(err);
    } finally {
      setDiscountLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPromotions();
    loadDiscounts();
  }, [loadPromotions, loadDiscounts]);

  const openCreateModal = () => {
    setEditingPromo(null);
    setModalOpen(true);
  };

  const openEditModal = (promo) => {
    setEditingPromo(promo);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingPromo(null);
  };

  const confirmDelete = (promo) => setDeleteTarget(promo);
  const cancelDelete = () => setDeleteTarget(null);

  const executeDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deletePromotionAPI(deleteTarget.id);
      toast.success("Promoción eliminada exitosamente");
      setDeleteTarget(null);
      await loadPromotions();
    } catch (err) {
      toast.error(err.response?.data?.error || "Error al eliminar la promoción");
    } finally {
      setDeleting(false);
    }
  };

  const handleSave = async (formData) => {
    try {
      if (editingPromo) {
        await updatePromotionAPI(editingPromo.id, formData);
        toast.success("Promoción actualizada con éxito");
      } else {
        await createPromotionAPI(formData);
        toast.success("Promoción creada con éxito");
      }
      closeModal();
      await loadPromotions();
    } catch (err) {
      toast.error(err.response?.data?.error || "Error al guardar la promoción");
    }
  };

  const handleModerateDiscount = async (id, action) => {
    try {
      setModeratingId(id);
      const res = await moderateDiscountAPI(id, action);
      toast.success(res.data.message || "Descuento moderado correctamente");
      await loadDiscounts();
    } catch (err) {
      toast.error(err.response?.data?.error || "Error al moderar el descuento");
    } finally {
      setModeratingId(null);
    }
  };

  // KPIs
  const stats = useMemo(() => {
    const now = new Date();
    const total = promotions.length;
    const active = promotions.filter(
      (p) =>
        p.is_active &&
        new Date(p.starts_at) <= now &&
        (!p.ends_at || new Date(p.ends_at) > now)
    ).length;
    const featured = promotions.filter((p) => p.is_featured).length;
    const totalViews = promotions.reduce((acc, p) => acc + (p.views_count || 0), 0);

    return { total, active, featured, totalViews };
  }, [promotions]);

  // Store discounts KPIs
  const discountStats = useMemo(() => {
    const total = discounts.length;
    const pending = discounts.filter((d) => d.approval_status === "pending").length;
    const approved = discounts.filter((d) => d.approval_status === "approved").length;
    const rejected = discounts.filter((d) => d.approval_status === "rejected").length;

    return { total, pending, approved, rejected };
  }, [discounts]);

  // Filtered store discounts for table
  const filteredDiscounts = useMemo(() => {
    if (discountFilter === "all") return discounts;
    return discounts.filter((d) => d.approval_status === discountFilter);
  }, [discounts, discountFilter]);

  return (
    <div className="max-w-6xl mx-auto pb-12 px-4 sm:px-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Gestión de Promociones
          </h1>
          <p className="text-sm text-gray-500 mt-2">
            Crea campañas globales y ofertas destacadas para incentivar las ventas en el marketplace.
          </p>
        </div>
        {activeTab === "promotions" && (
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#531575] hover:bg-[#6b1e96] text-white font-bold rounded-xl shadow-lg transition-all text-sm self-start sm:self-center"
          >
            <span className="material-symbols-outlined text-[20px]">campaign</span>
            Nueva Promoción
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200 pb-px">
        <button
          onClick={() => setActiveTab("promotions")}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-bold text-sm transition-all -mb-px ${
            activeTab === "promotions"
              ? "border-[#531575] text-[#531575]"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">campaign</span>
          Promociones Globales
        </button>
        <button
          onClick={() => setActiveTab("discounts")}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-bold text-sm transition-all -mb-px ${
            activeTab === "discounts"
              ? "border-[#531575] text-[#531575]"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">sell</span>
          Moderación de Ofertas
          {discountStats.pending > 0 && (
            <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full animate-bounce">
              {discountStats.pending}
            </span>
          )}
        </button>
      </div>

      {activeTab === "promotions" ? (
        <>
          {/* KPI Stats widgets */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-50 text-[#531575] rounded-xl flex items-center justify-center">
                  <span className="material-symbols-outlined">analytics</span>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Creadas</p>
                  <h3 className="text-2xl font-black text-gray-800">{stats.total}</h3>
                </div>
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                  <span className="material-symbols-outlined">check_circle</span>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Vigentes</p>
                  <h3 className="text-2xl font-black text-gray-800">{stats.active}</h3>
                </div>
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                  <span className="material-symbols-outlined">star</span>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Destacadas</p>
                  <h3 className="text-2xl font-black text-gray-800">{stats.featured}</h3>
                </div>
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                  <span className="material-symbols-outlined">visibility</span>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Visitas Totales</p>
                  <h3 className="text-2xl font-black text-gray-800">{stats.totalViews}</h3>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          {loading ? (
            <div className="bg-white rounded-3xl border border-gray-200 p-8 space-y-4 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-gray-100 rounded-2xl" />
              ))}
            </div>
          ) : promotions.length === 0 ? (
            <div className="bg-white rounded-3xl border border-gray-200 p-16 text-center shadow-sm">
              <div className="w-20 h-20 bg-purple-50 text-purple-300 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="material-symbols-outlined text-4xl">campaign</span>
              </div>
              <h3 className="text-xl font-extrabold text-gray-900 mb-2">No hay promociones globales</h3>
              <p className="text-gray-500 mb-8 max-w-md mx-auto">
                Las promociones permiten agrupar productos con descuento bajo un banner principal atractivo en la web.
              </p>
              <button
                onClick={openCreateModal}
                className="px-8 py-3 bg-[#531575] hover:bg-[#6b1e96] text-white font-bold rounded-xl shadow-lg transition-all"
              >
                Crear Primera Promoción
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
                      <th className="px-6 py-4 font-bold">Promoción</th>
                      <th className="px-6 py-4 font-bold text-center">Tipo Selección</th>
                      <th className="px-6 py-4 font-bold text-center">Vigencia</th>
                      <th className="px-6 py-4 font-bold text-center">Estado</th>
                      <th className="px-6 py-4 font-bold text-center">Visitas</th>
                      <th className="px-6 py-4 font-bold text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {promotions.map((promo) => {
                      const now = new Date();
                      const startDate = new Date(promo.starts_at);
                      const endDate = promo.ends_at ? new Date(promo.ends_at) : null;

                      const isExpired = endDate && endDate < now;
                      const isScheduled = startDate > now;
                      const isActive = promo.is_active && !isExpired && !isScheduled;

                      return (
                        <tr key={promo.id} className="hover:bg-gray-50/50 transition-colors group">
                          {/* Promo Image and Title */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-4">
                              <div className="w-16 h-10 bg-gray-100 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0 flex items-center justify-center">
                                {promo.hero_image_url ? (
                                  <img
                                    src={promo.hero_image_url}
                                    alt=""
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <span className="material-symbols-outlined text-gray-400 text-xl">
                                    image
                                  </span>
                                )}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-extrabold text-gray-900 leading-tight">
                                    {promo.title}
                                  </span>
                                  {promo.is_featured && (
                                    <span className="inline-flex px-1.5 py-0.5 text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200 rounded-md">
                                      Destacado
                                    </span>
                                  )}
                                </div>
                                {promo.subtitle && (
                                  <p className="text-xs text-gray-400 mt-1 line-clamp-1">
                                    {promo.subtitle}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Selection Type */}
                          <td className="px-6 py-4 text-center">
                            {promo.selection_type === "manual" && (
                              <span className="inline-flex px-2 py-1 text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-150 rounded-lg uppercase tracking-wider">
                                Manual ({promo.product_ids?.length || 0} prod)
                              </span>
                            )}
                            {promo.selection_type === "category" && (
                              <span className="inline-flex px-2 py-1 text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-150 rounded-lg uppercase tracking-wider">
                                Categoría ({promo.category_ids?.length || 0} cat)
                              </span>
                            )}
                            {promo.selection_type === "discount_min" && (
                              <span className="inline-flex px-2 py-1 text-[10px] font-bold bg-pink-50 text-pink-700 border border-pink-150 rounded-lg uppercase tracking-wider">
                                Mín Descuento ({promo.min_discount_percent}%)
                              </span>
                            )}
                          </td>

                          {/* Vigencia */}
                          <td className="px-6 py-4 text-center text-xs text-gray-500 font-medium">
                            <div className="flex flex-col gap-0.5 justify-center">
                              <span>{new Date(promo.starts_at).toLocaleDateString()}</span>
                              {promo.ends_at ? (
                                <span className="text-[10px] text-gray-400">
                                  al {new Date(promo.ends_at).toLocaleDateString()}
                                </span>
                              ) : (
                                <span className="text-[10px] text-emerald-600 font-bold uppercase">
                                  Indefinido
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Status */}
                          <td className="px-6 py-4 text-center">
                            {isExpired && (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500 bg-gray-50 px-2.5 py-1 rounded-full border border-gray-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span> Expirado
                              </span>
                            )}
                            {isScheduled && (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>{" "}
                                Programado
                              </span>
                            )}
                            {isActive && (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-600 bg-green-50 px-2.5 py-1 rounded-full border border-green-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Activa
                              </span>
                            )}
                            {!promo.is_active && !isExpired && (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-50 px-2.5 py-1 rounded-full border border-red-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> Desactivada
                              </span>
                            )}
                          </td>

                          {/* Views count */}
                          <td className="px-6 py-4 text-center font-mono text-xs text-gray-500">
                            {promo.views_count || 0}
                          </td>

                          {/* Actions */}
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => openEditModal(promo)}
                                className="p-2 rounded-lg text-gray-400 hover:text-[#531575] hover:bg-purple-50 transition-colors"
                                title="Editar Promoción"
                              >
                                <span className="material-symbols-outlined text-[18px]">edit</span>
                              </button>
                              <button
                                onClick={() => confirmDelete(promo)}
                                className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                title="Eliminar Promoción"
                              >
                                <span className="material-symbols-outlined text-[18px]">delete</span>
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
          )}
        </>
      ) : (
        <>
          {/* KPI Stats widgets for store discounts */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-50 text-[#531575] rounded-xl flex items-center justify-center">
                  <span className="material-symbols-outlined">sell</span>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Creados</p>
                  <h3 className="text-2xl font-black text-gray-800">{discountStats.total}</h3>
                </div>
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${discountStats.pending > 0 ? "bg-amber-50 text-amber-600 animate-pulse" : "bg-gray-50 text-gray-400"}`}>
                  <span className="material-symbols-outlined">hourglass_empty</span>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Pendientes</p>
                  <h3 className="text-2xl font-black text-gray-800">{discountStats.pending}</h3>
                </div>
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                  <span className="material-symbols-outlined">check_circle</span>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Aprobados</p>
                  <h3 className="text-2xl font-black text-gray-800">{discountStats.approved}</h3>
                </div>
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-50 text-red-600 rounded-xl flex items-center justify-center">
                  <span className="material-symbols-outlined">cancel</span>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Rechazados</p>
                  <h3 className="text-2xl font-black text-gray-800">{discountStats.rejected}</h3>
                </div>
              </div>
            </div>
          </div>

          {/* Discount Filter Tabs */}
          <div className="flex gap-1 mb-6 p-1 bg-gray-100 rounded-xl w-fit border border-gray-200 shadow-sm">
            {[
              { key: "all", label: "Todos" },
              { key: "pending", label: "Pendientes" },
              { key: "approved", label: "Aprobados" },
              { key: "rejected", label: "Rechazados" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setDiscountFilter(tab.key)}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                  discountFilter === tab.key
                    ? "bg-white text-[#531575] shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Discounts Content */}
          {discountLoading ? (
            <div className="bg-white rounded-3xl border border-gray-200 p-8 space-y-4 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-gray-100 rounded-2xl" />
              ))}
            </div>
          ) : filteredDiscounts.length === 0 ? (
            <div className="bg-white rounded-3xl border border-gray-200 p-16 text-center shadow-sm">
              <div className="w-20 h-20 bg-purple-50 text-purple-300 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="material-symbols-outlined text-4xl">sell</span>
              </div>
              <h3 className="text-xl font-extrabold text-gray-900 mb-2">No hay descuentos</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                No se encontraron descuentos creados por las tiendas para el filtro seleccionado.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
                      <th className="px-6 py-4 font-bold">Descuento / Tienda</th>
                      <th className="px-6 py-4 font-bold text-center">Tipo / Valor</th>
                      <th className="px-6 py-4 font-bold text-center">Alcance</th>
                      <th className="px-6 py-4 font-bold text-center">Vigencia</th>
                      <th className="px-6 py-4 font-bold text-center">Estado</th>
                      <th className="px-6 py-4 font-bold text-right">Acciones de Moderación</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {filteredDiscounts.map((d) => {
                      const isActive = d.is_active && d.is_started && !d.is_expired;
                      return (
                        <tr key={d.id} className="hover:bg-gray-50/50 transition-colors group">
                          {/* Discount Name & Store */}
                          <td className="px-6 py-4">
                            <div>
                              <div className="font-extrabold text-gray-900 leading-tight">
                                {d.name}
                              </div>
                              <div className="text-xs text-[#531575] font-bold mt-1 uppercase tracking-wider">
                                {d.store_profiles?.business_name || "Tienda"}
                              </div>
                            </div>
                          </td>

                          {/* Value */}
                          <td className="px-6 py-4 text-center">
                            <span className="inline-flex px-2.5 py-1 text-xs font-black bg-[#6b1e96]/10 text-[#6b1e96] rounded-full">
                              {d.discount_type === "percentage" ? `-${d.discount_value}%` : `-$${d.discount_value}`}
                            </span>
                          </td>

                          {/* Scope / Products list */}
                          <td className="px-6 py-4 text-center">
                            <div className="flex flex-col gap-1 items-center">
                              {d.scope === "product" && (
                                <span className="inline-flex px-2 py-0.5 text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-150 rounded-lg uppercase tracking-wider">
                                  Productos ({d.products?.length || 0})
                                </span>
                              )}
                              {d.scope === "category" && (
                                <span className="inline-flex px-2 py-0.5 text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-150 rounded-lg uppercase tracking-wider">
                                  Categorías ({d.categories?.length || 0})
                                </span>
                              )}
                              {d.scope === "store_wide" && (
                                <span className="inline-flex px-2 py-0.5 text-[10px] font-bold bg-pink-50 text-pink-700 border border-pink-150 rounded-lg uppercase tracking-wider">
                                  Toda la Tienda
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Validity */}
                          <td className="px-6 py-4 text-center text-xs text-gray-500 font-medium">
                            <div className="flex flex-col gap-0.5 justify-center">
                              <span>{new Date(d.starts_at).toLocaleDateString()}</span>
                              {d.ends_at ? (
                                <span className="text-[10px] text-gray-400">
                                  al {new Date(d.ends_at).toLocaleDateString()}
                                </span>
                              ) : (
                                <span className="text-[10px] text-emerald-600 font-bold uppercase">
                                  Indefinido
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Status */}
                          <td className="px-6 py-4 text-center">
                            {d.approval_status === "pending" && (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span> Pendiente
                              </span>
                            )}
                            {d.approval_status === "approved" && (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-600 bg-green-50 px-2.5 py-1 rounded-full border border-green-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Aprobado
                              </span>
                            )}
                            {d.approval_status === "rejected" && (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-50 px-2.5 py-1 rounded-full border border-red-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> Rechazado
                              </span>
                            )}
                            {d.approval_status === "approved" && !isActive && (
                              <span className="block text-[9px] text-gray-400 font-bold uppercase mt-1">
                                {d.is_expired ? "(Expirado)" : "(Programado o Inactivo)"}
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {/* Approve Button */}
                              <button
                                onClick={() => handleModerateDiscount(d.id, "approve")}
                                disabled={moderatingId === d.id || d.approval_status === "approved"}
                                className={`p-2 rounded-lg transition-colors border ${
                                  d.approval_status === "approved"
                                    ? "text-gray-300 border-gray-100 bg-gray-50 cursor-not-allowed"
                                    : "text-emerald-600 border-emerald-100 bg-emerald-50 hover:bg-emerald-100 hover:text-emerald-700 shadow-sm"
                                }`}
                                title="Aprobar Descuento"
                              >
                                <span className="material-symbols-outlined text-[18px]">check</span>
                              </button>
                              {/* Reject Button */}
                              <button
                                onClick={() => handleModerateDiscount(d.id, "reject")}
                                disabled={moderatingId === d.id || d.approval_status === "rejected"}
                                className={`p-2 rounded-lg transition-colors border ${
                                  d.approval_status === "rejected"
                                    ? "text-gray-300 border-gray-100 bg-gray-50 cursor-not-allowed"
                                    : "text-red-600 border-red-100 bg-red-50 hover:bg-red-100 hover:text-red-700 shadow-sm"
                                }`}
                                title="Rechazar Descuento"
                              >
                                <span className="material-symbols-outlined text-[18px]">close</span>
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
          )}
        </>
      )}

      {/* Editor Modal */}
      {modalOpen && (
        <PromotionFormModal
          promo={editingPromo}
          onSave={handleSave}
          onClose={closeModal}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <DeleteModal
          deleting={deleting}
          onConfirm={executeDelete}
          onCancel={cancelDelete}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PROMOTION FORM MODAL (Visual + Config)
// ─────────────────────────────────────────────────────────────
function PromotionFormModal({ promo, onSave, onClose }) {
  const isEditing = Boolean(promo);
  const [saving, setSaving] = useState(false);

  // Lists loaded for selection
  const [categoriesList, setCategoriesList] = useState([]);
  const [productsList, setProductsList] = useState([]);
  const [loadingSelections, setLoadingSelections] = useState(false);

  // Product search filter inside manual list
  const [productSearch, setProductSearch] = useState("");

  const [form, setForm] = useState({
    title: "",
    subtitle: "",
    description: "",
    hero_image_url: "",
    badge_text: "OFERTA",
    badge_color: "#ef4444",
    selection_type: "manual",
    product_ids: [],
    category_ids: [],
    min_discount_percent: 10,
    starts_at: "",
    ends_at: "",
    is_active: true,
    is_featured: false,
    sort_order: 0,
  });

  // Load Categories & Products on mount
  useEffect(() => {
    const loadSelectionData = async () => {
      try {
        setLoadingSelections(true);
        const [catsRes, prodsRes] = await Promise.all([
          getCategoriesAPI(),
          getAllAdminProductsAPI({ page: 1, limit: 150, status: "approved" }),
        ]);
        setCategoriesList(catsRes.data.data || []);
        setProductsList(prodsRes.data.data || []);
      } catch (err) {
        console.error("Error loading category/product selection lists:", err);
      } finally {
        setLoadingSelections(false);
      }
    };
    loadSelectionData();
  }, []);

  // Initialize form
  useEffect(() => {
    if (promo) {
      setForm({
        title: promo.title || "",
        subtitle: promo.subtitle || "",
        description: promo.description || "",
        hero_image_url: promo.hero_image_url || "",
        badge_text: promo.badge_text || "OFERTA",
        badge_color: promo.badge_color || "#ef4444",
        selection_type: promo.selection_type || "manual",
        product_ids: promo.product_ids || [],
        category_ids: promo.category_ids || [],
        min_discount_percent: promo.min_discount_percent || 10,
        starts_at: toLocalDatetimeString(promo.starts_at),
        ends_at: toLocalDatetimeString(promo.ends_at),
        is_active: promo.is_active !== false,
        is_featured: promo.is_featured || false,
        sort_order: promo.sort_order || 0,
      });
    } else {
      // Default dates: starts_at = now
      const now = new Date();
      const tzOffset = now.getTimezoneOffset() * 60000;
      const localNow = new Date(now.getTime() - tzOffset).toISOString().slice(0, 16);
      setForm((f) => ({ ...f, starts_at: localNow }));
    }
  }, [promo]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleCustomFieldChange = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Image Upload helper
  const [uploadingImage, setUploadingImage] = useState(false);
  const handleUploadImage = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      const formData = new FormData();
      formData.append("image", file);

      const { data } = await uploadHomeSectionImageAPI(formData);
      if (data && data.success && data.data?.url) {
        handleCustomFieldChange("hero_image_url", data.data.url);
        toast.success("Imagen de portada cargada con éxito");
      }
    } catch (err) {
      toast.error("Error al subir la imagen");
      console.error(err);
    } finally {
      setUploadingImage(false);
      e.target.value = null;
    }
  };

  // Checkbox handlers for selection lists
  const handleToggleProduct = (prodId) => {
    setForm((prev) => {
      const selected = prev.product_ids.includes(prodId)
        ? prev.product_ids.filter((id) => id !== prodId)
        : [...prev.product_ids, prodId];
      return { ...prev, product_ids: selected };
    });
  };

  const handleToggleCategory = (catId) => {
    setForm((prev) => {
      const selected = prev.category_ids.includes(catId)
        ? prev.category_ids.filter((id) => id !== catId)
        : [...prev.category_ids, catId];
      return { ...prev, category_ids: selected };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error("El título es obligatorio");

    setSaving(true);
    try {
      // Structure payload with converted UTC dates
      const payload = {
        ...form,
        title: form.title.trim(),
        subtitle: form.subtitle.trim() || null,
        description: form.description.trim() || null,
        hero_image_url: form.hero_image_url.trim() || null,
        badge_text: form.badge_text.trim() || "OFERTA",
        min_discount_percent:
          form.selection_type === "discount_min" ? parseFloat(form.min_discount_percent) : null,
        starts_at: toISODateString(form.starts_at),
        ends_at: toISODateString(form.ends_at),
        sort_order: parseInt(form.sort_order) || 0,
      };

      // Validation check
      if (payload.selection_type === "manual" && payload.product_ids.length === 0) {
        toast.error("Debes seleccionar al menos un producto para la promoción manual");
        setSaving(false);
        return;
      }
      if (payload.selection_type === "category" && payload.category_ids.length === 0) {
        toast.error("Debes seleccionar al menos una categoría para la promoción por categoría");
        setSaving(false);
        return;
      }

      await onSave(payload);
    } finally {
      setSaving(false);
    }
  };

  // Filter products list locally
  const filteredProducts = useMemo(() => {
    if (!productSearch.trim()) return productsList;
    const search = productSearch.toLowerCase();
    return productsList.filter(
      (p) =>
        p.name.toLowerCase().includes(search) ||
        (p.store_profiles?.business_name || "").toLowerCase().includes(search)
    );
  }, [productsList, productSearch]);

  const badgeColorPresets = ["#ef4444", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6", "#c3ff00"];

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={onClose} />

      {/* Drawer Panel */}
      <div className="relative w-full max-w-4xl bg-gray-50 h-full shadow-2xl flex flex-col transform transition-transform duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 bg-white">
          <div>
            <h2 className="text-xl font-extrabold text-gray-900">
              {isEditing ? "Editar Promoción Global" : "Nueva Promoción Global"}
            </h2>
            <p className="text-sm text-gray-500 mt-1">Configura el diseño banner y los productos vigentes.</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full border border-gray-200 hover:bg-gray-100 text-gray-500 transition-colors shadow-sm bg-white flex items-center justify-center"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Scrollable Form Content divided in Grid (Form + Live Preview) */}
        <div className="flex-1 overflow-y-auto flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-gray-200">
          
          {/* Main Form Fields */}
          <form
            id="promo-form"
            onSubmit={handleSubmit}
            className="flex-1 p-6 space-y-6 max-w-full md:max-w-[60%]"
          >
            {/* 1. General Content */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4">
              <h3 className="font-extrabold text-sm text-gray-800 border-b border-gray-100 pb-2">
                Información del Banner
              </h3>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Título de la Promoción *
                </label>
                <input
                  required
                  type="text"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="Ej: Semana de la Ortodoncia"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm font-semibold focus:bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Subtítulo / Eslogan
                </label>
                <input
                  type="text"
                  name="subtitle"
                  value={form.subtitle}
                  onChange={handleChange}
                  placeholder="Ej: Hasta 20% de descuento en brackets y alambres"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm font-semibold focus:bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Descripción Expandida
                </label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={2}
                  placeholder="Ej: Detalles sobre el alcance de la promoción, envío gratuito..."
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm font-semibold focus:bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all resize-none"
                />
              </div>
            </div>

            {/* 2. Visuals configuration (Hero image and Badges) */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4">
              <h3 className="font-extrabold text-sm text-gray-800 border-b border-gray-100 pb-2">
                Diseño Visual y Banner
              </h3>
              
              {/* Hero Image */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Imagen de Portada (Hero Banner)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    name="hero_image_url"
                    value={form.hero_image_url}
                    onChange={handleChange}
                    placeholder="https://..."
                    className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs font-mono focus:bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
                  />
                  <label
                    className={`bg-gray-100 hover:bg-gray-200 border border-gray-300 px-4 py-2 rounded-xl cursor-pointer flex items-center justify-center transition shadow-sm ${
                      uploadingImage ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    {uploadingImage ? (
                      <span className="material-symbols-outlined text-md animate-spin">sync</span>
                    ) : (
                      <span className="material-symbols-outlined text-md">cloud_upload</span>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleUploadImage}
                      disabled={uploadingImage}
                    />
                  </label>
                </div>
              </div>

              {/* Badge visual settings */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Texto del Badge
                  </label>
                  <input
                    type="text"
                    name="badge_text"
                    value={form.badge_text}
                    onChange={handleChange}
                    placeholder="OFERTA"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm font-semibold focus:bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Color del Badge
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      name="badge_color"
                      value={form.badge_color}
                      onChange={handleChange}
                      className="w-10 h-10 border-0 p-0 rounded-xl cursor-pointer bg-transparent"
                    />
                    <input
                      type="text"
                      name="badge_color"
                      value={form.badge_color}
                      onChange={handleChange}
                      className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs font-mono uppercase focus:bg-white focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
              </div>

              {/* Preset colors */}
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Colores sugeridos</p>
                <div className="flex gap-2.5 flex-wrap">
                  {badgeColorPresets.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => handleCustomFieldChange("badge_color", color)}
                      className={`w-6 h-6 rounded-full border border-gray-300 cursor-pointer hover:scale-110 active:scale-95 transition ${
                        form.badge_color === color ? "ring-2 ring-[#531575] ring-offset-2 scale-105" : ""
                      }`}
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* 3. Products/Selection Scope */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4">
              <h3 className="font-extrabold text-sm text-gray-800 border-b border-gray-100 pb-2 flex items-center gap-2">
                <span className="material-symbols-outlined text-md">grid_view</span>
                Criterio de Selección de Productos
              </h3>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Tipo de Selección *
                </label>
                <select
                  name="selection_type"
                  value={form.selection_type}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-sm font-semibold focus:bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                >
                  <option value="manual">🛍️ Seleccionar Productos Manualmente</option>
                  <option value="category">📂 Seleccionar Categorías Completas</option>
                  <option value="discount_min">🏷️ Productos con Descuento Mínimo</option>
                </select>
              </div>

              {/* Conditional sections based on selection_type */}
              {form.selection_type === "manual" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Selecciona los Productos ({form.product_ids.length} elegidos)
                    </label>
                    {form.product_ids.length > 0 && (
                      <button
                        type="button"
                        onClick={() => handleCustomFieldChange("product_ids", [])}
                        className="text-xs text-[#531575] hover:underline font-bold"
                      >
                        Limpiar todos
                      </button>
                    )}
                  </div>

                  {/* Search inner */}
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Buscar producto por nombre o tienda..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium focus:bg-white outline-none"
                    />
                    <span className="material-symbols-outlined text-gray-400 absolute left-3 top-2.5 text-[16px]">
                      search
                    </span>
                  </div>

                  {/* Products check-list box */}
                  <div className="border border-gray-200 rounded-xl bg-gray-50/50 max-h-[200px] overflow-y-auto p-3 space-y-2">
                    {loadingSelections ? (
                      <p className="text-xs text-gray-400 text-center py-4">Cargando catálogo...</p>
                    ) : filteredProducts.length === 0 ? (
                      <p className="text-xs text-gray-400 text-center py-4">Ningún producto coincide</p>
                    ) : (
                      filteredProducts.map((prod) => {
                        const isChecked = form.product_ids.includes(prod.id);
                        return (
                          <label
                            key={prod.id}
                            className={`flex items-start gap-3 p-2.5 rounded-lg border cursor-pointer hover:bg-white transition-all text-xs ${
                              isChecked
                                ? "bg-purple-50/30 border-purple-200 font-bold"
                                : "bg-white border-transparent"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleProduct(prod.id)}
                              className="w-4 h-4 mt-0.5 rounded text-[#531575] border-gray-300 focus:ring-[#531575]"
                            />
                            <div className="flex-1">
                              <p className="text-gray-800 line-clamp-1">{prod.name}</p>
                              <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-400 font-medium">
                                <span>{prod.store_profiles?.business_name || "Tienda"}</span>
                                <span>•</span>
                                <span className="text-primary-600 font-bold">
                                  {formatCurrencyUSD(prod.price)}
                                </span>
                              </div>
                            </div>
                          </label>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {form.selection_type === "category" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Selecciona las Categorías ({form.category_ids.length} elegidas)
                    </label>
                    {form.category_ids.length > 0 && (
                      <button
                        type="button"
                        onClick={() => handleCustomFieldChange("category_ids", [])}
                        className="text-xs text-[#531575] hover:underline font-bold"
                      >
                        Limpiar todas
                      </button>
                    )}
                  </div>

                  <div className="border border-gray-200 rounded-xl bg-gray-50/50 max-h-[180px] overflow-y-auto p-3 grid grid-cols-2 gap-2">
                    {loadingSelections ? (
                      <p className="col-span-2 text-xs text-gray-400 text-center py-4">Cargando categorías...</p>
                    ) : categoriesList.length === 0 ? (
                      <p className="col-span-2 text-xs text-gray-400 text-center py-4">Sin categorías registradas</p>
                    ) : (
                      categoriesList.map((cat) => {
                        const isChecked = form.category_ids.includes(cat.id);
                        return (
                          <label
                            key={cat.id}
                            className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer hover:bg-white transition-all text-xs ${
                              isChecked
                                ? "bg-purple-50/30 border-purple-200 font-bold"
                                : "bg-white border-transparent"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleCategory(cat.id)}
                              className="w-4 h-4 rounded text-[#531575] border-gray-300 focus:ring-[#531575]"
                            />
                            <span className="truncate text-gray-800" title={cat.name}>
                              {cat.name}
                            </span>
                          </label>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {form.selection_type === "discount_min" && (
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Porcentaje Mínimo de Descuento (%)
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      name="min_discount_percent"
                      value={form.min_discount_percent}
                      onChange={handleChange}
                      min={0}
                      max={100}
                      className="w-32 px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm font-semibold focus:bg-white focus:ring-2 focus:ring-purple-500"
                    />
                    <span className="text-xs text-gray-500 font-medium">
                      Mostrará automáticamente cualquier producto que tenga un descuento de tienda activo &ge; {form.min_discount_percent}%.
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* 4. Scheduling & Controls */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4">
              <h3 className="font-extrabold text-sm text-gray-800 border-b border-gray-100 pb-2">
                Programación y Ajustes
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Fecha de Inicio *
                  </label>
                  <input
                    required
                    type="datetime-local"
                    name="starts_at"
                    value={form.starts_at}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Fecha de Fin (Opcional)
                  </label>
                  <input
                    type="datetime-local"
                    name="ends_at"
                    value={form.ends_at}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 items-center">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Posición (Sort Order)
                  </label>
                  <input
                    type="number"
                    name="sort_order"
                    value={form.sort_order}
                    onChange={handleChange}
                    min={0}
                    className="w-28 px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm font-semibold focus:bg-white focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>
                <div className="space-y-3 pt-4">
                  {/* Switch is_active */}
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="is_active"
                      checked={form.is_active}
                      onChange={handleChange}
                      className="w-5 h-5 text-[#531575] border-gray-300 rounded focus:ring-[#531575]"
                    />
                    <span className="text-sm font-bold text-gray-800">Campaña Activa</span>
                  </label>

                  {/* Switch is_featured */}
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="is_featured"
                      checked={form.is_featured}
                      onChange={handleChange}
                      className="w-5 h-5 text-[#531575] border-gray-300 rounded focus:ring-[#531575]"
                    />
                    <span className="text-sm font-bold text-gray-800">Destacar (Featured)</span>
                  </label>
                </div>
              </div>
            </div>
          </form>

          {/* Sticky Live Preview Panel */}
          <div className="flex-1 p-6 bg-gray-100 flex flex-col justify-start space-y-6 md:sticky md:top-0">
            <div>
              <h3 className="font-extrabold text-sm text-gray-800 flex items-center gap-2 mb-1">
                <span className="material-symbols-outlined text-[#531575]">preview</span>
                Vista Previa del Banner Hero
              </h3>
              <p className="text-xs text-gray-500">
                Así se renderizará el encabezado de esta campaña en la landing pública `/promociones`.
              </p>
            </div>

            {/* Live mockup card matching public Promotions.jsx hero style */}
            <div
              className="w-full rounded-3xl overflow-hidden shadow-2xl relative min-h-[260px] flex items-center p-8 text-center md:text-left transition-all duration-300 border border-purple-900/10"
              style={{
                background: "linear-gradient(135deg, #1a0a2e 0%, #6b1e96 50%, #9333ea 100%)",
              }}
            >
              {/* Blurred background image if provided */}
              {form.hero_image_url && (
                <div className="absolute inset-0 z-0">
                  <img
                    src={form.hero_image_url}
                    alt=""
                    className="w-full h-full object-cover opacity-20 blur-[2px]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-[#1a0a2e]/90 to-[#6b1e96]/70" />
                </div>
              )}

              {/* Content mock */}
              <div className="relative z-10 w-full max-w-lg mx-auto md:mx-0">
                {form.badge_text && (
                  <span
                    className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-3.5 shadow-md text-white"
                    style={{ backgroundColor: form.badge_color || "#ef4444" }}
                  >
                    <span className="material-symbols-outlined text-[13px]">
                      local_fire_department
                    </span>
                    {form.badge_text}
                  </span>
                )}
                <h2 className="text-2xl md:text-3xl font-black text-white leading-tight mb-2.5 break-words">
                  {form.title || "Título de la Promoción"}
                </h2>
                {form.subtitle && (
                  <p className="text-xs md:text-sm text-white/80 font-medium break-words leading-relaxed mb-4">
                    {form.subtitle}
                  </p>
                )}
                <div className="flex items-center gap-2 justify-center md:justify-start">
                  <span className="material-symbols-outlined text-[#c3ff00] text-[18px]">timer</span>
                  <span className="text-[#c3ff00] font-bold text-xs uppercase tracking-wider">
                    Termina en: 5h 45m
                  </span>
                </div>
              </div>
            </div>

            {/* Recommendations information Box */}
            <div className="bg-white p-4 border border-gray-200 rounded-2xl space-y-1.5 text-xs">
              <div className="flex items-center gap-2 font-bold text-[#531575]">
                <span className="material-symbols-outlined text-base">info</span>
                Recomendación de Diseño:
              </div>
              <p className="leading-relaxed text-gray-500">
                La imagen del Hero Banner se utiliza como fondo detrás del texto. Es conveniente usar imágenes horizontales abstractas u oscuras (formato 4:1 o superior) para no comprometer la legibilidad del texto en color blanco.
              </p>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-6 border-t border-gray-200 bg-white flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 border border-gray-200 hover:bg-gray-100 rounded-xl font-bold transition-colors text-sm"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="promo-form"
            disabled={saving}
            className="px-8 py-3 bg-[#531575] hover:bg-[#6b1e96] text-white font-bold rounded-xl shadow-lg transition-all text-sm flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                <span>Guardando...</span>
              </>
            ) : (
              <span>Guardar Promoción</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PROMOTION DELETE MODAL (Confirm dialog)
// ─────────────────────────────────────────────────────────────
function DeleteModal({ deleting, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white rounded-3xl w-full max-w-sm p-6 text-center shadow-2xl border border-gray-200">
        <div className="w-14 h-14 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="material-symbols-outlined text-3xl">warning</span>
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">¿Eliminar Promoción?</h3>
        <p className="text-sm text-gray-500 mb-6 leading-relaxed">
          Esta acción es irreversible y eliminará la campaña global. Los productos dejarán de mostrarse agrupados en esta promoción.
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={onCancel}
            disabled={deleting}
            className="flex-1 py-2.5 rounded-xl font-bold border border-gray-200 text-gray-700 hover:bg-gray-50 transition"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="flex-1 py-2.5 rounded-xl font-bold bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 transition"
          >
            {deleting ? "Eliminando..." : "Sí, Eliminar"}
          </button>
        </div>
      </div>
    </div>
  );
}

// PropTypes definitions
PromotionFormModal.propTypes = {
  promo: PropTypes.shape({
    id: PropTypes.string,
    title: PropTypes.string,
    subtitle: PropTypes.string,
    description: PropTypes.string,
    hero_image_url: PropTypes.string,
    badge_text: PropTypes.string,
    badge_color: PropTypes.string,
    selection_type: PropTypes.string,
    product_ids: PropTypes.array,
    category_ids: PropTypes.array,
    min_discount_percent: PropTypes.number,
    starts_at: PropTypes.string,
    ends_at: PropTypes.string,
    is_active: PropTypes.bool,
    is_featured: PropTypes.bool,
    sort_order: PropTypes.number,
  }),
  onSave: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};

DeleteModal.propTypes = {
  deleting: PropTypes.bool.isRequired,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};
