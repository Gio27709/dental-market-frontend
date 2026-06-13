import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import {
  getStoreDiscountsAPI,
  createDiscountAPI,
  updateDiscountAPI,
  toggleDiscountAPI,
  deleteDiscountAPI,
  getMyProducts,
  getCategoriesAPI,
} from "../../services/api";
import { useProducts } from "../../context/ProductContext";

const SCOPE_OPTIONS = [
  { value: "product", label: "Productos Específicos", icon: "inventory_2" },
  { value: "category", label: "Por Categoría", icon: "category" },
  { value: "store_wide", label: "Toda la Tienda", icon: "storefront" },
];

const TYPE_OPTIONS = [
  { value: "percentage", label: "Porcentaje (%)", icon: "percent" },
  { value: "fixed_amount", label: "Monto Fijo ($)", icon: "attach_money" },
];

const EMPTY_FORM = {
  name: "",
  discount_type: "percentage",
  discount_value: "",
  scope: "product",
  product_ids: [],
  category_ids: [],
  starts_at: "",
  ends_at: "",
  min_purchase_amount: "",
  max_uses: "",
};

const formatDateLocal = (date) => {
  const pad = (num) => String(num).padStart(2, '0');
  const yyyy = date.getFullYear();
  const mm = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());
  const hh = pad(date.getHours());
  const min = pad(date.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
};

export default function StoreDiscounts() {
  const { refreshProducts } = useProducts();
  const [discounts, setDiscounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isReactivating, setIsReactivating] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState("all"); // all | active | expired | inactive
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [productSearch, setProductSearch] = useState("");

  const fetchDiscounts = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await getStoreDiscountsAPI();
      setDiscounts(data.data || []);
    } catch (err) {
      toast.error(err.message || "Error cargando descuentos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDiscounts();
  }, [fetchDiscounts]);

  // Lazy-load products and categories when form opens
  useEffect(() => {
    if (showForm && products.length === 0) {
      getMyProducts().then(({ data }) => setProducts(data.data || data || [])).catch(() => {});
      getCategoriesAPI().then(({ data }) => setCategories(data.data || data || [])).catch(() => {});
    }
  }, [showForm, products.length]);

  const handleOpenCreate = () => {
    setEditingId(null);
    setIsReactivating(false);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const handleEdit = (discount) => {
    setEditingId(discount.id);
    setIsReactivating(false);
    setForm({
      name: discount.name,
      discount_type: discount.discount_type,
      discount_value: discount.discount_value.toString(),
      scope: discount.scope,
      product_ids: discount.product_ids || [],
      category_ids: discount.category_ids || [],
      starts_at: discount.starts_at ? discount.starts_at.slice(0, 16) : "",
      ends_at: discount.ends_at ? discount.ends_at.slice(0, 16) : "",
      min_purchase_amount: discount.min_purchase_amount?.toString() || "",
      max_uses: discount.max_uses?.toString() || "",
    });
    setShowForm(true);
  };

  const handleReactivate = (discount) => {
    const now = new Date();
    const inOneWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    setEditingId(discount.id);
    setIsReactivating(true);
    setForm({
      name: discount.name,
      discount_type: discount.discount_type,
      discount_value: discount.discount_value.toString(),
      scope: discount.scope,
      product_ids: discount.product_ids || [],
      category_ids: discount.category_ids || [],
      starts_at: formatDateLocal(now),
      ends_at: formatDateLocal(inOneWeek),
      min_purchase_amount: discount.min_purchase_amount?.toString() || "",
      max_uses: discount.max_uses?.toString() || "",
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        discount_value: parseFloat(form.discount_value),
        starts_at: form.starts_at ? new Date(form.starts_at).toISOString() : undefined,
        ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null,
        min_purchase_amount: form.min_purchase_amount ? parseFloat(form.min_purchase_amount) : 0,
        max_uses: form.max_uses ? parseInt(form.max_uses) : null,
      };

      if (editingId) {
        await updateDiscountAPI(editingId, payload);
        toast.success("Descuento actualizado");
      } else {
        await createDiscountAPI(payload);
        toast.success("Descuento creado exitosamente");
      }
      refreshProducts();
      setShowForm(false);
      fetchDiscounts();
    } catch (err) {
      toast.error(err.message || "Error guardando descuento");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (id) => {
    try {
      await toggleDiscountAPI(id);
      refreshProducts();
      fetchDiscounts();
      toast.success("Estado actualizado");
    } catch (err) {
      toast.error(err.message || "Error actualizando estado");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Eliminar este descuento permanentemente?")) return;
    try {
      await deleteDiscountAPI(id);
      refreshProducts();
      fetchDiscounts();
      toast.success("Descuento eliminado");
    } catch (err) {
      toast.error(err.message || "Error eliminando descuento");
    }
  };

  const toggleProductId = (pid) => {
    setForm((prev) => ({
      ...prev,
      product_ids: prev.product_ids.includes(pid)
        ? prev.product_ids.filter((x) => x !== pid)
        : [...prev.product_ids, pid],
    }));
  };

  const toggleCategoryId = (cid) => {
    setForm((prev) => ({
      ...prev,
      category_ids: prev.category_ids.includes(cid)
        ? prev.category_ids.filter((x) => x !== cid)
        : [...prev.category_ids, cid],
    }));
  };

  // Filtered discounts
  const filtered = discounts.filter((d) => {
    if (filter === "active") return d.is_active && d.is_started && !d.is_expired;
    if (filter === "expired") return d.is_expired;
    if (filter === "inactive") return !d.is_active;
    return true;
  });

  const filteredProducts = products.filter(
    (p) => !productSearch || p.name?.toLowerCase().includes(productSearch.toLowerCase())
  );

  const activeCount = discounts.filter((d) => d.is_active && d.is_started && !d.is_expired).length;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <span className="material-symbols-outlined text-[#6b1e96]" style={{ fontSize: "28px" }}>
              sell
            </span>
            Descuentos
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Gestiona los descuentos de tu tienda. {activeCount > 0 && (
              <span className="font-bold text-emerald-600">{activeCount} activos</span>
            )}
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="px-5 py-2.5 bg-[#6b1e96] hover:bg-[#531575] text-white font-bold text-sm rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
        >
          <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>add</span>
          Nuevo Descuento
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 mb-6 p-1 bg-slate-100 rounded-xl w-fit">
        {[
          { key: "all", label: "Todos" },
          { key: "active", label: "Activos" },
          { key: "expired", label: "Expirados" },
          { key: "inactive", label: "Inactivos" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              filter === tab.key
                ? "bg-white text-[#6b1e96] shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Discounts List */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-3 border-[#6b1e96] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
          <span className="material-symbols-outlined text-slate-300 mb-4" style={{ fontSize: "48px" }}>
            sell
          </span>
          <h3 className="text-lg font-bold text-slate-700 mb-2">
            {filter === "all" ? "No hay descuentos" : `No hay descuentos ${filter === "active" ? "activos" : filter === "expired" ? "expirados" : "inactivos"}`}
          </h3>
          <p className="text-sm text-slate-500 mb-6">
            Crea descuentos para atraer más clientes a tu tienda.
          </p>
          {filter === "all" && (
            <button onClick={handleOpenCreate} className="px-5 py-2.5 bg-[#6b1e96] text-white font-bold text-sm rounded-xl">
              Crear primer descuento
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((d) => {
            const isActive = d.is_active && d.is_started && !d.is_expired;
            const scopeLabel = SCOPE_OPTIONS.find((s) => s.value === d.scope)?.label || d.scope;

            return (
              <div
                key={d.id}
                className={`bg-white rounded-2xl border p-5 transition-all hover:shadow-md ${
                  isActive ? "border-emerald-200 bg-white" : d.is_expired ? "border-amber-200 bg-slate-50/50" : "border-slate-200 bg-slate-50/20"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className={`flex-1 min-w-0 ${!isActive ? "opacity-75" : ""}`}>
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <h3 className="text-base font-bold text-slate-900 truncate">{d.name}</h3>
                      {/* Status badge */}
                      {isActive ? (
                        <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
                          Activo
                        </span>
                      ) : d.is_expired ? (
                        <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200 rounded-full">
                          Expirado
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-500 border border-slate-200 rounded-full">
                          Inactivo
                        </span>
                      )}

                      {/* Approval Status Badge */}
                      {d.approval_status === "pending" ? (
                        <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200 rounded-full flex items-center gap-1">
                          <span className="material-symbols-outlined text-[12px] animate-pulse">hourglass_empty</span>
                          Pendiente Aprobación
                        </span>
                      ) : d.approval_status === "rejected" ? (
                        <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-red-50 text-red-700 border border-red-200 rounded-full flex items-center gap-1">
                          <span className="material-symbols-outlined text-[12px]">cancel</span>
                          Rechazado por Admin
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full flex items-center gap-1" title="Aprobado por el Administrador">
                          <span className="material-symbols-outlined text-[12px]">verified</span>
                          Aprobado
                        </span>
                      )}
                      {/* Discount value badge */}
                      <span className="px-2.5 py-0.5 text-xs font-black bg-[#6b1e96]/10 text-[#6b1e96] rounded-full">
                        {d.discount_type === "percentage" ? `-${d.discount_value}%` : `-$${d.discount_value}`}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-[11px] text-slate-500 flex-wrap">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>category</span>
                        {scopeLabel}
                      </span>
                      {d.ends_at && (
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>schedule</span>
                          Hasta {new Date(d.ends_at).toLocaleDateString("es-VE")}
                        </span>
                      )}
                      {d.max_uses && (
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>confirmation_number</span>
                          {d.current_uses}/{d.max_uses} usos
                        </span>
                      )}
                      {d.products?.length > 0 && (
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>inventory_2</span>
                          {d.products.length} producto{d.products.length > 1 ? "s" : ""}
                        </span>
                      )}
                    </div>

                    {/* Product thumbnails */}
                    {d.products?.length > 0 && (
                      <div className="flex gap-2 mt-3 flex-wrap">
                        {d.products.slice(0, 5).map((p) => (
                          <div key={p.id} className="flex items-center gap-1.5 px-2 py-1 bg-slate-50 rounded-lg border border-slate-100">
                            {p.images?.[0] && (
                              <img src={p.images[0]} alt="" className="w-5 h-5 rounded object-cover" />
                            )}
                            <span className="text-[10px] font-medium text-slate-600 truncate max-w-[100px]">{p.name}</span>
                          </div>
                        ))}
                        {d.products.length > 5 && (
                          <span className="text-[10px] font-bold text-slate-400 self-center">+{d.products.length - 5} más</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Toggle */}
                    <button
                      onClick={() => handleToggle(d.id)}
                      className={`relative w-11 h-6 rounded-full transition-colors ${d.is_active ? "bg-emerald-500" : "bg-slate-300"}`}
                      title={d.is_active ? "Desactivar" : "Activar"}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${d.is_active ? "translate-x-5" : ""}`}
                      />
                    </button>
                    {d.is_expired && (
                      <button
                        onClick={() => handleReactivate(d)}
                        className="p-2 text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-all flex items-center justify-center group"
                        title="Reactivar (Extender fecha)"
                      >
                        <span className="material-symbols-outlined group-hover:rotate-180 transition-transform duration-500 ease-out" style={{ fontSize: "18px" }}>autorenew</span>
                      </button>
                    )}
                    <button onClick={() => handleEdit(d)} className="p-2 text-slate-400 hover:text-[#6b1e96] hover:bg-[#6b1e96]/10 rounded-lg transition-colors" title="Editar">
                      <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>edit</span>
                    </button>
                    <button onClick={() => handleDelete(d.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar">
                      <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>delete</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── CREATE/EDIT MODAL ── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <form onSubmit={handleSubmit}>
              {/* Modal Header */}
              <div className="sticky top-0 bg-white px-6 pt-6 pb-4 border-b border-slate-100 rounded-t-3xl z-10">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#6b1e96]">sell</span>
                    {editingId ? (isReactivating ? "Reactivar Descuento" : "Editar Descuento") : "Nuevo Descuento"}
                  </h2>
                  <button type="button" onClick={() => setShowForm(false)} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
                    <span className="material-symbols-outlined text-slate-400">close</span>
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-5">
                {isReactivating && (
                  <div className="bg-[#6b1e96]/5 border border-[#6b1e96]/15 text-[#6b1e96] p-4 rounded-2xl text-xs flex items-start gap-2.5 shadow-sm animate-[fadeIn_0.3s_ease-out]">
                    <span className="material-symbols-outlined text-[#6b1e96] mt-0.5" style={{ fontSize: "18px" }}>info</span>
                    <div className="leading-relaxed">
                      <p className="font-extrabold text-[#531575] mb-0.5">Reactivación de Descuento Expirado</p>
                      <p className="text-slate-600 font-medium">Hemos pre-configurado la fecha de inicio a la hora actual y la fecha de fin a 7 días en adelante para reactivar rápidamente este descuento. Puedes cambiarlas si lo deseas.</p>
                    </div>
                  </div>
                )}
                {/* Warning note about approval status */}
                <div className="bg-amber-50/50 border border-amber-200/60 text-amber-900 p-4 rounded-2xl text-xs flex items-start gap-2.5 shadow-sm">
                  <span className="material-symbols-outlined text-amber-600 mt-0.5" style={{ fontSize: "18px" }}>info</span>
                  <div className="leading-relaxed">
                    <p className="font-extrabold text-amber-950 mb-0.5">Moderación de Ofertas</p>
                    <p className="text-slate-600 font-medium">El descuento se aplicará a tus productos y en el carrito de compras de inmediato. Sin embargo, para que aparezca promocionado en la sección global de Promociones de la plataforma, requiere la aprobación de un administrador.</p>
                  </div>
                </div>
                {/* Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Nombre del Descuento *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="Ej: Oferta de Verano"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#6b1e96]/20 focus:border-[#6b1e96]"
                    required
                  />
                </div>

                {/* Type + Value */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Tipo</label>
                    <div className="flex gap-2">
                      {TYPE_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setForm((f) => ({ ...f, discount_type: opt.value }))}
                          className={`flex-1 px-3 py-2.5 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                            form.discount_type === opt.value
                              ? "bg-[#6b1e96] text-white border-[#6b1e96]"
                              : "bg-white text-slate-600 border-slate-200 hover:border-[#6b1e96]/30"
                          }`}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>{opt.icon}</span>
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Valor {form.discount_type === "percentage" ? "(%)" : "($)"}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      max={form.discount_type === "percentage" ? "100" : undefined}
                      value={form.discount_value}
                      onChange={(e) => setForm((f) => ({ ...f, discount_value: e.target.value }))}
                      placeholder={form.discount_type === "percentage" ? "15" : "5.00"}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#6b1e96]/20 focus:border-[#6b1e96]"
                      required
                    />
                  </div>
                </div>

                {/* Scope */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Alcance del Descuento</label>
                  <div className="grid grid-cols-3 gap-2">
                    {SCOPE_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, scope: opt.value }))}
                        className={`px-3 py-3 rounded-xl text-xs font-bold border transition-all flex flex-col items-center gap-1.5 ${
                          form.scope === opt.value
                            ? "bg-[#6b1e96] text-white border-[#6b1e96] shadow-md"
                            : "bg-white text-slate-600 border-slate-200 hover:border-[#6b1e96]/30"
                        }`}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>{opt.icon}</span>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Product Selector (scope=product) */}
                {form.scope === "product" && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Seleccionar Productos ({form.product_ids.length} seleccionados)
                    </label>
                    <input
                      type="text"
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      placeholder="Buscar producto..."
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-[#6b1e96]/20"
                    />
                    <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100">
                      {filteredProducts.length === 0 ? (
                        <p className="text-xs text-slate-400 p-4 text-center">No hay productos</p>
                      ) : (
                        filteredProducts.map((p) => (
                          <label key={p.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 cursor-pointer transition-colors">
                            <input
                              type="checkbox"
                              checked={form.product_ids.includes(p.id)}
                              onChange={() => toggleProductId(p.id)}
                              className="w-4 h-4 rounded border-slate-300 text-[#6b1e96] focus:ring-[#6b1e96]"
                            />
                            {p.images?.[0] && (
                              <img src={p.images[0]} alt="" className="w-8 h-8 rounded-lg object-cover border border-slate-100" />
                            )}
                            <span className="text-sm text-slate-700 truncate flex-1">{p.name}</span>
                            <span className="text-xs font-bold text-slate-500">${p.price}</span>
                          </label>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* Category Selector (scope=category) */}
                {form.scope === "category" && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Seleccionar Categorías ({form.category_ids.length} seleccionadas)
                    </label>
                    <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100">
                      {categories.length === 0 ? (
                        <p className="text-xs text-slate-400 p-4 text-center">No hay categorías</p>
                      ) : (
                        categories.map((c) => (
                          <label key={c.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={form.category_ids.includes(c.id)}
                              onChange={() => toggleCategoryId(c.id)}
                              className="w-4 h-4 rounded border-slate-300 text-[#6b1e96] focus:ring-[#6b1e96]"
                            />
                            <span className="text-sm text-slate-700">{c.name}</span>
                          </label>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Fecha de Inicio</label>
                    <input
                      type="datetime-local"
                      value={form.starts_at}
                      onChange={(e) => setForm((f) => ({ ...f, starts_at: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#6b1e96]/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Fecha de Fin (Opcional)</label>
                    <input
                      type="datetime-local"
                      value={form.ends_at}
                      onChange={(e) => setForm((f) => ({ ...f, ends_at: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#6b1e96]/20"
                    />
                  </div>
                </div>

                {/* Advanced */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Compra Mínima ($) (Opcional)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={form.min_purchase_amount}
                      onChange={(e) => setForm((f) => ({ ...f, min_purchase_amount: e.target.value }))}
                      placeholder="0.00"
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#6b1e96]/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Máx. Usos (Opcional)</label>
                    <input
                      type="number"
                      min="1"
                      value={form.max_uses}
                      onChange={(e) => setForm((f) => ({ ...f, max_uses: e.target.value }))}
                      placeholder="Ilimitado"
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#6b1e96]/20"
                    />
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="sticky bottom-0 bg-white px-6 py-4 border-t border-slate-100 rounded-b-3xl flex items-center justify-end gap-3">
                <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-[#6b1e96] hover:bg-[#531575] text-white font-bold text-sm rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                >
                  {submitting && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  {editingId ? (isReactivating ? "Reactivar y Solicitar" : "Guardar Cambios") : "Crear Descuento"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
