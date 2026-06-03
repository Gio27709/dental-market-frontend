import { useEffect, useState, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import { useStore } from "../../context/StoreContext";
import BulkImportWizard from "../../components/store/BulkImportWizard";
import { getCategoriesAPI, getBrandsAPI, restockVariationAPI } from "../../services/api";
import { formatCurrencyUSD } from "../../utils/formatters";
import toast from "react-hot-toast";

const PAGE_OPTIONS = [10, 20, 30];

export default function StoreProducts() {
  const { myProducts, loading, error, fetchMyProducts, deleteProduct, updateProduct } = useStore();

  // Filters state
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [perPage, setPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [stockFilter, setStockFilter] = useState("all");

  // Categories & Brands lists
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);

  // Image preview modal
  const [previewProduct, setPreviewProduct] = useState(null);

  // Expanded rows for variations (Phase 3)
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // ── Reponer Inventario (Restock) States & Handler ──
  const [restockProduct, setRestockProduct] = useState(null);
  const [restockForm, setRestockForm] = useState({ variation_id: "", quantity: "", notes: "" });
  const [restockLoading, setRestockLoading] = useState(false);

  const parseVariationLabel = (v) => {
    if (!v) return "—";
    try {
      const obj = typeof v.attribute_value === "string" ? JSON.parse(v.attribute_value) : v.attribute_value;
      if (obj && obj._default) return "Producto Simple";
      return Object.values(obj).join(" / ");
    } catch {
      return v.attribute_value || "—";
    }
  };

  const handleRestockSubmit = async (e) => {
    e.preventDefault();
    if (!restockForm.variation_id || !restockForm.quantity) {
      return toast.error("Completa todos los campos");
    }
    setRestockLoading(true);
    try {
      await restockVariationAPI(restockProduct.id, {
        variation_id: restockForm.variation_id,
        quantity: parseInt(restockForm.quantity, 10),
        notes: restockForm.notes,
      });
      toast.success("Inventario repuesto exitosamente");
      setRestockProduct(null);
      setRestockForm({ variation_id: "", quantity: "", notes: "" });
      fetchMyProducts();
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || "Error al reponer inventario");
    } finally {
      setRestockLoading(false);
    }
  };

  useEffect(() => {
    fetchMyProducts();
  }, [fetchMyProducts]);

  // Fetch categories and brands for filter dropdowns
  useEffect(() => {
    const loadFilters = async () => {
      try {
        const [catRes, brandRes] = await Promise.all([
          getCategoriesAPI(),
          getBrandsAPI(),
        ]);
        // Categories may come as tree, flatten them
        const flattenCats = (cats, result = []) => {
          cats.forEach((c) => {
            result.push({ id: c.id, name: c.name });
            if (c.children?.length) flattenCats(c.children, result);
          });
          return result;
        };
        setCategories(flattenCats(catRes.data?.data || []));
        setBrands(brandRes.data?.data || []);
      } catch {
        // Non-blocking — filters just won't populate
      }
    };
    loadFilters();
  }, []);

  // Filtered + paginated products
  const filtered = useMemo(() => {
    let result = [...myProducts];

    // Search by name
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter((p) => p.name.toLowerCase().includes(term));
    }

    // Filter by category
    if (selectedCategory) {
      result = result.filter((p) => p.category_id === selectedCategory);
    }

    // Filter by brand
    if (selectedBrand) {
      result = result.filter((p) => p.brand_id === selectedBrand);
    }

    // Filter by stock/status
    if (stockFilter !== "all") {
      result = result.filter((p) => {
        const totalStock = p.product_variations?.reduce((acc, v) => acc + (v.stock || 0), 0) || 0;
        if (stockFilter === "no_image") return !p.images || p.images.length === 0;
        if (stockFilter === "out_of_stock") return totalStock === 0 && p.is_active;
        if (stockFilter === "low_stock") return totalStock > 0 && totalStock < 5 && p.is_active;
        if (stockFilter === "inactive") return !p.is_active;
        return true;
      });
    }

    return result;
  }, [myProducts, searchTerm, selectedCategory, selectedBrand, stockFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * perPage;
    return filtered.slice(start, start + perPage);
  }, [filtered, currentPage, perPage]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, selectedBrand, stockFilter, perPage]);

  const handleDelete = useCallback(
    async (id, name) => {
      if (!window.confirm(`¿Estás seguro de eliminar "${name}"?`)) return;
      const result = await deleteProduct(id);
      if (result.success) {
        toast.success("Producto eliminado");
      } else {
        toast.error(result.error);
      }
    },
    [deleteProduct],
  );

  const handleToggleActive = async (e, product) => {
    e.stopPropagation();
    try {
      if (!product.is_active && (!product.images || product.images.length === 0)) {
        toast.error("No puedes activar un producto sin imágenes. Por favor, edita el producto y añade al menos una imagen.");
        return;
      }

      const payload = {
        name: product.name,
        description: product.description || "Sin descripción",
        category_id: product.category_id,
        price: product.price,
        images: product.images || [],
        variations: (product.product_variations || []).map(v => ({
          id: v.id,
          attribute_name: v.attribute_name,
          attribute_value: v.attribute_value,
          stock: v.stock,
          price_modifier: v.price_modifier,
          sku: v.sku
        })),
        status: !product.is_active ? "Activo" : "Borrador",
        brand_id: product.brand_id,
        compare_at_price: product.compare_at_price,
        cost_price: product.cost_price,
        delivery_fee: product.delivery_fee,
      };

      if (!payload.variations || payload.variations.length === 0) {
        toast.error("El producto no tiene variaciones válidas.");
        return;
      }

      const res = await updateProduct(product.id, payload);
      if (res.success) {
        toast.success(product.is_active ? "Producto pausado" : "Producto activado");
      } else {
        toast.error(res.error || "Error al actualizar estado");
      }
    } catch {
      toast.error("Error al actualizar estado");
    }
  };

  const toggleRow = (id) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCategory("");
    setSelectedBrand("");
    setStockFilter("all");
    setPerPage(10);
    setCurrentPage(1);
  };

  const hasActiveFilters = searchTerm || selectedCategory || selectedBrand || stockFilter !== "all";

  return (
    <div style={{ minHeight: "100%" }}>
      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
        <div>
          <h2 style={{ fontSize: "22px", fontWeight: 800, color: "#1a0a2e", margin: 0, letterSpacing: "-0.02em" }}>
            Mis Productos
          </h2>
          <p style={{ fontSize: "13px", color: "#9ca3af", margin: "4px 0 0 0" }}>
            Gestiona el catálogo de tu tienda
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button
            onClick={() => setIsImportModalOpen(true)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 20px",
              background: "rgba(107,30,150,0.06)",
              color: "#6b1e96",
              fontWeight: 700,
              borderRadius: "12px",
              fontSize: "13px",
              border: "1px solid rgba(107,30,150,0.1)",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(107,30,150,0.12)"; e.currentTarget.style.borderColor = "rgba(107,30,150,0.2)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(107,30,150,0.06)"; e.currentTarget.style.borderColor = "rgba(107,30,150,0.1)"; }}
          >
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            Importar Excel
          </button>
          <Link
            to="/store/products/new"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 20px",
              background: "linear-gradient(135deg, #531575, #6b1e96)",
              color: "#c3ff00",
              fontWeight: 700,
              borderRadius: "12px",
              textDecoration: "none",
              fontSize: "13px",
              border: "none",
              cursor: "pointer",
              transition: "all 0.2s",
              boxShadow: "0 4px 15px rgba(107,30,150,0.3)",
            }}
          >
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Nuevo Producto
          </Link>
        </div>
      </div>
 
      {/* ── Search & Filters Bar ── */}
      <div
        style={{
          background: "#fff",
          borderRadius: "16px",
          border: "1px solid #f0f0f0",
          padding: "16px 20px",
          marginBottom: "16px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        }}
      >
        {/* ── Quick Filters (Pills) ── */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "16px", overflowX: "auto", paddingBottom: "4px" }}>
          {(() => {
            let outOfStock = 0; let lowStock = 0; let inactive = 0; let noImage = 0;
            myProducts.forEach(p => {
              const totalStock = p.product_variations?.reduce((acc, v) => acc + (v.stock || 0), 0) || 0;
              if (!p.images || p.images.length === 0) noImage++;
              if (!p.is_active) inactive++;
              else if (totalStock === 0) outOfStock++;
              else if (totalStock < 5) lowStock++;
            });
 
            const pills = [
              { id: "all", label: `📦 Todos (${myProducts.length})`, color: "#6b1e96", bg: "rgba(107,30,150,0.06)", activeBg: "linear-gradient(135deg, #531575, #6b1e96)", activeText: "#c3ff00" },
              { id: "no_image", label: `📷 Sin imagen (${noImage})`, color: "#4f46e5", bg: "rgba(79,70,229,0.06)", activeBg: "linear-gradient(135deg, #6366f1, #4f46e5)", activeText: "#fff" },
              { id: "out_of_stock", label: `🔴 Agotados (${outOfStock})`, color: "#dc2626", bg: "rgba(239,68,68,0.06)", activeBg: "linear-gradient(135deg, #ef4444, #dc2626)", activeText: "#fff" },
              { id: "low_stock", label: `🟠 Poco Stock (${lowStock})`, color: "#d97706", bg: "rgba(245,158,11,0.06)", activeBg: "linear-gradient(135deg, #f59e0b, #d97706)", activeText: "#fff" },
              { id: "inactive", label: `⚪ Inactivos (${inactive})`, color: "#4b5563", bg: "rgba(107,114,128,0.06)", activeBg: "linear-gradient(135deg, #6b7280, #4b5563)", activeText: "#fff" },
            ];
 
            return pills.map(pill => (
              <button
                key={pill.id}
                onClick={() => setStockFilter(pill.id)}
                style={{
                  padding: "8px 16px",
                  borderRadius: "20px",
                  fontSize: "12px",
                  fontWeight: 600,
                  border: "none",
                  background: stockFilter === pill.id ? pill.activeBg : pill.bg,
                  color: stockFilter === pill.id ? pill.activeText : pill.color,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  transition: "all 0.2s",
                  boxShadow: stockFilter === pill.id ? "0 4px 10px " + pill.bg.replace("0.06", "0.2") : "none"
                }}
              >
                {pill.label}
              </button>
            ));
          })()}
        </div>

        {/* Search */}
        <div style={{ position: "relative", marginBottom: "12px" }}>
          <svg
            width="18"
            height="18"
            fill="none"
            viewBox="0 0 24 24"
            stroke="#9ca3af"
            strokeWidth={2}
            style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input
            type="text"
            placeholder="Buscar por nombre de producto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: "100%",
              padding: "11px 14px 11px 44px",
              borderRadius: "10px",
              border: "1.5px solid #e5e7eb",
              fontSize: "13px",
              outline: "none",
              transition: "border-color 0.2s, box-shadow 0.2s",
              background: "#fafafa",
              color: "#1f2937",
              boxSizing: "border-box",
            }}
            onFocus={(e) => {
              e.target.style.borderColor = "#6b1e96";
              e.target.style.boxShadow = "0 0 0 3px rgba(107,30,150,0.08)";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "#e5e7eb";
              e.target.style.boxShadow = "none";
            }}
          />
        </div>

        {/* Filter Row */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center" }}>
          {/* Category filter */}
          <div style={{ flex: "1 1 180px", minWidth: "150px" }}>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{
                width: "100%",
                padding: "9px 12px",
                borderRadius: "8px",
                border: "1.5px solid #e5e7eb",
                fontSize: "12px",
                color: selectedCategory ? "#1f2937" : "#9ca3af",
                background: "#fafafa",
                cursor: "pointer",
                outline: "none",
              }}
            >
              <option value="">Todas las categorías</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Brand filter */}
          <div style={{ flex: "1 1 180px", minWidth: "150px" }}>
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              style={{
                width: "100%",
                padding: "9px 12px",
                borderRadius: "8px",
                border: "1.5px solid #e5e7eb",
                fontSize: "12px",
                color: selectedBrand ? "#1f2937" : "#9ca3af",
                background: "#fafafa",
                cursor: "pointer",
                outline: "none",
              }}
            >
              <option value="">Todas las marcas</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          {/* Per page selector */}
          <div style={{ flex: "0 0 auto" }}>
            <select
              value={perPage}
              onChange={(e) => setPerPage(Number(e.target.value))}
              style={{
                padding: "9px 12px",
                borderRadius: "8px",
                border: "1.5px solid #e5e7eb",
                fontSize: "12px",
                color: "#1f2937",
                background: "#fafafa",
                cursor: "pointer",
                outline: "none",
              }}
            >
              {PAGE_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n} por página
                </option>
              ))}
            </select>
          </div>

          {/* Clear filters */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              style={{
                flex: "0 0 auto",
                padding: "9px 16px",
                borderRadius: "8px",
                border: "1.5px solid rgba(107,30,150,0.15)",
                background: "rgba(107,30,150,0.05)",
                color: "#6b1e96",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              ✕ Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {/* ── Content ── */}
      {error ? (
        <div
          style={{
            background: "#fff",
            borderRadius: "16px",
            border: "1px solid rgba(239,68,68,0.2)",
            padding: "48px 24px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>⚠️</div>
          <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#dc2626", marginBottom: "8px" }}>
            Error al cargar productos
          </h3>
          <p style={{ color: "#9ca3af", fontSize: "13px", marginBottom: "24px", maxWidth: "400px", margin: "0 auto 24px" }}>
            {error}
          </p>
          <button
            onClick={() => fetchMyProducts()}
            style={{
              padding: "10px 24px",
              background: "linear-gradient(135deg, #531575, #6b1e96)",
              color: "#fff",
              borderRadius: "10px",
              border: "none",
              fontWeight: 600,
              fontSize: "13px",
              cursor: "pointer",
            }}
          >
            Reintentar
          </button>
        </div>
      ) : loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              style={{
                background: "#fff",
                borderRadius: "12px",
                border: "1px solid #f0f0f0",
                padding: "16px 20px",
                display: "flex",
                alignItems: "center",
                gap: "16px",
                animation: "pulse 1.5s ease-in-out infinite",
              }}
            >
              <div style={{ width: "56px", height: "56px", borderRadius: "10px", background: "#f3f4f6" }} />
              <div style={{ flex: 1 }}>
                <div style={{ width: "160px", height: "14px", background: "#f3f4f6", borderRadius: "4px", marginBottom: "8px" }} />
                <div style={{ width: "90px", height: "10px", background: "#f9fafb", borderRadius: "4px" }} />
              </div>
            </div>
          ))}
        </div>
      ) : myProducts.length === 0 ? (
        <div
          style={{
            background: "#fff",
            borderRadius: "16px",
            border: "1px solid #f0f0f0",
            padding: "64px 24px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "56px", marginBottom: "16px" }}>📦</div>
          <h3 style={{ fontSize: "17px", fontWeight: 700, color: "#1a0a2e", marginBottom: "8px" }}>
            No tienes productos aún
          </h3>
          <p style={{ color: "#9ca3af", fontSize: "13px", marginBottom: "24px" }}>
            Crea tu primer producto para empezar a vender.
          </p>
          <Link
            to="/store/products/new"
            style={{
              display: "inline-block",
              padding: "10px 24px",
              background: "linear-gradient(135deg, #531575, #6b1e96)",
              color: "#c3ff00",
              borderRadius: "10px",
              fontWeight: 700,
              fontSize: "13px",
              textDecoration: "none",
            }}
          >
            Crear mi primer producto
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        <div
          style={{
            background: "#fff",
            borderRadius: "16px",
            border: "1px solid #f0f0f0",
            padding: "48px 24px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>🔍</div>
          <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#374151", marginBottom: "8px" }}>
            Sin resultados
          </h3>
          <p style={{ color: "#9ca3af", fontSize: "13px", marginBottom: "20px" }}>
            No se encontraron productos con los filtros aplicados.
          </p>
          <button
            onClick={clearFilters}
            style={{
              padding: "9px 20px",
              background: "rgba(107,30,150,0.08)",
              color: "#6b1e96",
              borderRadius: "8px",
              border: "1.5px solid rgba(107,30,150,0.15)",
              fontWeight: 600,
              fontSize: "12px",
              cursor: "pointer",
            }}
          >
            Limpiar filtros
          </button>
        </div>
      ) : (
        <>
          {/* ── Product Table ── */}
          <div
            style={{
              background: "#fff",
              borderRadius: "16px",
              border: "1px solid #f0f0f0",
              overflow: "hidden",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            }}
          >
            {/* Table Header */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "56px 1fr 110px 100px 120px 80px 180px",
                gap: "12px",
                padding: "12px 20px",
                background: "linear-gradient(135deg, #1a0a2e, #2d1248)",
                alignItems: "center",
                fontSize: "11px",
                fontWeight: 700,
                color: "rgba(195,255,0,0.8)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              <span />
              <span>Producto</span>
              <span>Categoría</span>
              <span>Marca</span>
              <span>Inventario</span>
              <span>Estado</span>
              <span style={{ textAlign: "right" }}>Acciones</span>
            </div>

            {/* Product Rows */}
            {paginated.map((product, idx) => {
              const imageUrl = product.images?.[0];
              const variationCount = product.product_variations?.length || 0;
              const categoryName = product.categories?.name || "—";
              const brandName = product.brands?.name || "—";
              const totalStock = product.product_variations?.reduce((acc, v) => acc + (v.stock || 0), 0) || 0;
              const isExpanded = expandedRows.has(product.id);

              return (
                <div key={product.id} style={{ borderBottom: idx < paginated.length - 1 ? "1px solid #f5f5f5" : "none" }}>
                  {/* Main Row */}
                  <div
                    onClick={() => toggleRow(product.id)}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "56px 1fr 110px 100px 120px 80px 180px",
                      gap: "12px",
                      padding: "14px 20px",
                      alignItems: "center",
                      borderBottom: idx < paginated.length - 1 ? "1px solid #f5f5f5" : "none",
                      transition: "background 0.15s",
                      cursor: "pointer",
                    }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#faf5ff")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  {/* Thumbnail */}
                  <div
                    onClick={() => setPreviewProduct(product)}
                    style={{
                      width: "56px",
                      height: "56px",
                      borderRadius: "10px",
                      overflow: "hidden",
                      background: "#f9fafb",
                      border: "1px solid #f0f0f0",
                      cursor: "zoom-in",
                      flexShrink: 0,
                      position: "relative",
                    }}
                  >
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={product.name}
                        loading="lazy"
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    ) : (
                      <div
                        style={{
                          width: "100%",
                          height: "100%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "22px",
                          color: "#ef4444",
                          background: "#fee2e2",
                          border: "1px solid #fca5a5"
                        }}
                        title="Necesita imagen"
                      >
                        📷
                      </div>
                    )}
                    {/* Zoom indicator */}
                    {imageUrl && (
                      <div
                        style={{
                          position: "absolute",
                          bottom: "2px",
                          right: "2px",
                          width: "18px",
                          height: "18px",
                          borderRadius: "4px",
                          background: "rgba(26,10,46,0.6)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="#c3ff00" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607ZM10.5 7.5v6m3-3h-6" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div style={{ minWidth: 0 }}>
                    <h3
                      style={{
                        fontWeight: 700,
                        color: "#1a0a2e",
                        fontSize: "13px",
                        margin: 0,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px"
                      }}
                    >
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{product.name}</span>
                      {(!product.images || product.images.length === 0) && (
                        <span style={{
                          fontSize: "9px",
                          fontWeight: 700,
                          background: "#fee2e2",
                          color: "#ef4444",
                          padding: "2px 6px",
                          borderRadius: "4px",
                          border: "1px solid #fca5a5",
                          textTransform: "uppercase",
                          flexShrink: 0
                        }}>
                          Necesita imagen
                        </span>
                      )}
                    </h3>
                    <p style={{ fontSize: "11px", color: "#9ca3af", margin: "3px 0 0 0" }}>
                      {formatCurrencyUSD(product.price)} · {variationCount}{" "}
                      variación{variationCount !== 1 ? "es" : ""}
                    </p>
                  </div>

                  {/* Category */}
                  <span
                    style={{
                      fontSize: "11px",
                      color: "#6b7280",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                    title={categoryName}
                  >
                    {categoryName}
                  </span>

                  {/* Brand */}
                  <span
                    style={{
                      fontSize: "11px",
                      color: "#6b7280",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                    title={brandName}
                  >
                    {brandName}
                  </span>

                  {/* Inventario */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                    <span style={{ fontSize: "13px", fontWeight: 700, color: "#1a0a2e" }}>
                      {totalStock} <span style={{ fontSize: "10px", fontWeight: 500, color: "#9ca3af" }}>uds</span>
                    </span>
                    {totalStock === 0 ? (
                      <span style={{ fontSize: "10px", color: "#dc2626", fontWeight: 700 }}>🔴 Agotado</span>
                    ) : totalStock < 5 ? (
                      <span style={{ fontSize: "10px", color: "#d97706", fontWeight: 700 }}>🟠 Poco Stock</span>
                    ) : (
                      <span style={{ fontSize: "10px", color: "#059669", fontWeight: 700 }}>🟢 En Stock</span>
                    )}
                  </div>

                  {/* Status Toggle */}
                  <div
                    onClick={(e) => handleToggleActive(e, product)}
                    style={{
                      width: "40px",
                      height: "22px",
                      borderRadius: "12px",
                      background: product.is_active ? "#10b981" : "#e5e7eb",
                      position: "relative",
                      cursor: "pointer",
                      transition: "background 0.3s ease",
                      border: "2px solid transparent",
                    }}
                    title={product.is_active ? "Ocultar producto (Pausar)" : "Publicar producto (Activar)"}
                  >
                    <div
                      style={{
                        width: "18px",
                        height: "18px",
                        borderRadius: "50%",
                        background: "#fff",
                        position: "absolute",
                        top: "0",
                        left: product.is_active ? "18px" : "0",
                        transition: "left 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                        boxShadow: "0 1px 2px rgba(0,0,0,0.2)",
                      }}
                    />
                  </div>

                  {/* Actions */}
                  <div 
                    onClick={(e) => e.stopPropagation()} 
                    style={{ 
                      display: "flex", 
                      alignItems: "center", 
                      gap: "6px", 
                      justifyContent: "flex-end" 
                    }}
                  >
                    {/* Reponer Inventario Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setRestockProduct(product);
                        setRestockForm({ variation_id: "", quantity: "", notes: "" });
                      }}
                      title="Reponer Inventario"
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "50%",
                        background: "rgba(16, 185, 129, 0.04)",
                        color: "#10b981",
                        border: "1px solid rgba(16, 185, 129, 0.15)",
                        cursor: "pointer",
                        transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 2px 5px rgba(0,0,0,0.02)",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "linear-gradient(135deg, #10b981, #059669)";
                        e.currentTarget.style.color = "#ffffff";
                        e.currentTarget.style.borderColor = "#10b981";
                        e.currentTarget.style.transform = "translateY(-2px) scale(1.08)";
                        e.currentTarget.style.boxShadow = "0 6px 16px rgba(16, 185, 129, 0.35)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "rgba(16, 185, 129, 0.04)";
                        e.currentTarget.style.color = "#10b981";
                        e.currentTarget.style.borderColor = "rgba(16, 185, 129, 0.15)";
                        e.currentTarget.style.transform = "none";
                        e.currentTarget.style.boxShadow = "0 2px 5px rgba(0,0,0,0.02)";
                      }}
                    >
                      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4 4m0 0L8 8m4 4V3" />
                      </svg>
                    </button>

                    {/* Stats Button */}
                    <Link
                      to={`/store/products/${product.id}/stats`}
                      onClick={(e) => e.stopPropagation()}
                      title="Estadísticas de Producto"
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "50%",
                        background: "rgba(99, 102, 241, 0.04)",
                        color: "#6366f1",
                        border: "1px solid rgba(99, 102, 241, 0.15)",
                        transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 2px 5px rgba(0,0,0,0.02)",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "linear-gradient(135deg, #818cf8, #6366f1)";
                        e.currentTarget.style.color = "#ffffff";
                        e.currentTarget.style.borderColor = "#6366f1";
                        e.currentTarget.style.transform = "translateY(-2px) scale(1.08)";
                        e.currentTarget.style.boxShadow = "0 6px 16px rgba(99, 102, 241, 0.35)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "rgba(99, 102, 241, 0.04)";
                        e.currentTarget.style.color = "#6366f1";
                        e.currentTarget.style.borderColor = "rgba(99, 102, 241, 0.15)";
                        e.currentTarget.style.transform = "none";
                        e.currentTarget.style.boxShadow = "0 2px 5px rgba(0,0,0,0.02)";
                      }}
                    >
                      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v18h18M7 17v-4m4 4V9m4 8v-6m4 6V5" />
                      </svg>
                    </Link>

                    {/* Editar Button */}
                    <Link
                      to={`/store/products/edit/${product.id}`}
                      onClick={(e) => e.stopPropagation()}
                      title="Editar Producto"
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "50%",
                        background: "rgba(139, 92, 246, 0.04)",
                        color: "#8b5cf6",
                        border: "1px solid rgba(139, 92, 246, 0.15)",
                        transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 2px 5px rgba(0,0,0,0.02)",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "linear-gradient(135deg, #a78bfa, #8b5cf6)";
                        e.currentTarget.style.color = "#ffffff";
                        e.currentTarget.style.borderColor = "#8b5cf6";
                        e.currentTarget.style.transform = "translateY(-2px) scale(1.08)";
                        e.currentTarget.style.boxShadow = "0 6px 16px rgba(139, 92, 246, 0.35)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "rgba(139, 92, 246, 0.04)";
                        e.currentTarget.style.color = "#8b5cf6";
                        e.currentTarget.style.borderColor = "rgba(139, 92, 246, 0.15)";
                        e.currentTarget.style.transform = "none";
                        e.currentTarget.style.boxShadow = "0 2px 5px rgba(0,0,0,0.02)";
                      }}
                    >
                      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                      </svg>
                    </Link>

                    {/* Eliminar Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(product.id, product.name);
                      }}
                      title="Eliminar Producto"
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "50%",
                        background: "rgba(239, 68, 68, 0.04)",
                        color: "#ef4444",
                        border: "1px solid rgba(239, 68, 68, 0.15)",
                        cursor: "pointer",
                        transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 2px 5px rgba(0,0,0,0.02)",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "linear-gradient(135deg, #f87171, #ef4444)";
                        e.currentTarget.style.color = "#ffffff";
                        e.currentTarget.style.borderColor = "#ef4444";
                        e.currentTarget.style.transform = "translateY(-2px) scale(1.08)";
                        e.currentTarget.style.boxShadow = "0 6px 16px rgba(239, 68, 68, 0.35)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "rgba(239, 68, 68, 0.04)";
                        e.currentTarget.style.color = "#ef4444";
                        e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.15)";
                        e.currentTarget.style.transform = "none";
                        e.currentTarget.style.boxShadow = "0 2px 5px rgba(0,0,0,0.02)";
                      }}
                    >
                      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                  </div>
                  
                  {/* Expanded Variations Panel */}
                  {isExpanded && (
                    <div
                      style={{
                        padding: "16px 20px",
                        background: "#fafafa",
                        borderTop: "1px dashed #e5e7eb",
                        boxShadow: "inset 0 4px 6px -4px rgba(0,0,0,0.02)",
                      }}
                    >
                      <h4 style={{ margin: "0 0 12px 0", fontSize: "11px", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700 }}>
                        Desglose de Variaciones
                      </h4>
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {product.product_variations?.map(v => {
                          let vName = "—";
                          try {
                            const obj = typeof v.attribute_value === "string" ? JSON.parse(v.attribute_value) : v.attribute_value;
                            vName = Object.values(obj).join(" / ");
                          } catch {
                            vName = v.attribute_value || "—";
                          }
                          const price = product.price + (v.price_modifier || 0);

                          return (
                            <div key={v.id} style={{ display: "grid", gridTemplateColumns: "1fr 100px 100px 100px", background: "#fff", padding: "12px 16px", borderRadius: "8px", border: "1px solid #f0f0f0", alignItems: "center", boxShadow: "0 1px 2px rgba(0,0,0,0.01)" }}>
                              <span style={{ fontSize: "13px", fontWeight: 600, color: "#1f2937" }}>{vName}</span>
                              <span style={{ fontSize: "12px", color: "#6b7280" }}>SKU: {v.sku || "—"}</span>
                              <span style={{ fontSize: "12px", fontWeight: 700, color: "#10b981" }}>{formatCurrencyUSD(price)}</span>
                              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <span style={{ fontSize: "12px", fontWeight: 700, color: v.stock === 0 ? "#dc2626" : (v.stock < 5 ? "#d97706" : "#059669") }}>
                                  {v.stock || 0} uds
                                </span>
                              </div>
                            </div>
                          );
                        })}
                        {(!product.product_variations || product.product_variations.length === 0) && (
                          <div style={{ fontSize: "13px", color: "#9ca3af", fontStyle: "italic", padding: "8px 0" }}>Este producto no tiene variaciones registradas.</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* ── Footer: Count + Pagination ── */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: "14px",
              padding: "14px 20px",
              background: "#fff",
              borderRadius: "12px",
              border: "1px solid #f0f0f0",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            }}
          >
            {/* Product Count */}
            <div style={{ fontSize: "12px", color: "#6b7280" }}>
              Mostrando{" "}
              <span style={{ fontWeight: 700, color: "#1a0a2e" }}>
                {Math.min((currentPage - 1) * perPage + 1, filtered.length)}–
                {Math.min(currentPage * perPage, filtered.length)}
              </span>{" "}
              de{" "}
              <span style={{ fontWeight: 700, color: "#1a0a2e" }}>
                {filtered.length}
              </span>{" "}
              producto{filtered.length !== 1 ? "s" : ""}
              {hasActiveFilters && (
                <span style={{ color: "#9ca3af" }}>
                  {" "}(total: {myProducts.length})
                </span>
              )}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "8px",
                    border: "1px solid #e5e7eb",
                    background: currentPage === 1 ? "#f9fafb" : "#fff",
                    color: currentPage === 1 ? "#d1d5db" : "#374151",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: currentPage === 1 ? "not-allowed" : "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                  </svg>
                </button>

                {/* Page numbers */}
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => {
                    // Show: first, last, current, and neighbors
                    return p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1;
                  })
                  .reduce((acc, p, i, arr) => {
                    if (i > 0 && p - arr[i - 1] > 1) {
                      acc.push("...");
                    }
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p, i) =>
                    p === "..." ? (
                      <span key={`dots-${i}`} style={{ fontSize: "12px", color: "#9ca3af", padding: "0 2px" }}>
                        ⋯
                      </span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => setCurrentPage(p)}
                        style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "8px",
                          border: p === currentPage ? "1.5px solid #6b1e96" : "1px solid #e5e7eb",
                          background: p === currentPage ? "linear-gradient(135deg, #531575, #6b1e96)" : "#fff",
                          color: p === currentPage ? "#c3ff00" : "#374151",
                          fontSize: "12px",
                          fontWeight: p === currentPage ? 700 : 500,
                          cursor: "pointer",
                          transition: "all 0.15s",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {p}
                      </button>
                    ),
                  )}

                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "8px",
                    border: "1px solid #e5e7eb",
                    background: currentPage === totalPages ? "#f9fafb" : "#fff",
                    color: currentPage === totalPages ? "#d1d5db" : "#374151",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── Image Preview Modal ── */}
      {previewProduct && (
        <div
          onClick={() => setPreviewProduct(null)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(10,5,20,0.85)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
            animation: "fadeIn 0.2s ease-out",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff",
              borderRadius: "20px",
              maxWidth: "520px",
              width: "100%",
              overflow: "hidden",
              boxShadow: "0 25px 60px rgba(0,0,0,0.4)",
              animation: "scaleIn 0.25s ease-out",
            }}
          >
            {/* Modal Image */}
            <div
              style={{
                width: "100%",
                aspectRatio: "1 / 1",
                background: "#f9fafb",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
              }}
            >
              {previewProduct.images?.[0] ? (
                <img
                  src={previewProduct.images[0]}
                  alt={previewProduct.name}
                  style={{ width: "100%", height: "100%", objectFit: "contain" }}
                />
              ) : (
                <div style={{ fontSize: "80px", color: "#e5e7eb" }}>🦷</div>
              )}
            </div>

            {/* Modal Info */}
            <div style={{ padding: "20px 24px" }}>
              <h3
                style={{
                  fontSize: "16px",
                  fontWeight: 800,
                  color: "#1a0a2e",
                  margin: "0 0 6px 0",
                }}
              >
                {previewProduct.name}
              </h3>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                <span style={{ fontSize: "18px", fontWeight: 800, color: "#6b1e96" }}>
                  {formatCurrencyUSD(previewProduct.price)}
                </span>
                <span
                  style={{
                    fontSize: "11px",
                    color: "#9ca3af",
                    background: "#f3f4f6",
                    padding: "3px 10px",
                    borderRadius: "20px",
                  }}
                >
                  {previewProduct.product_variations?.length || 0} variaciones
                </span>
                {previewProduct.brands?.name && (
                  <span
                    style={{
                      fontSize: "11px",
                      color: "#6b1e96",
                      background: "rgba(107,30,150,0.06)",
                      padding: "3px 10px",
                      borderRadius: "20px",
                      fontWeight: 600,
                    }}
                  >
                    {previewProduct.brands.name}
                  </span>
                )}
              </div>

              {/* Multiple images gallery */}
              {previewProduct.images?.length > 1 && (
                <div style={{ display: "flex", gap: "8px", marginTop: "16px", overflowX: "auto", paddingBottom: "4px" }}>
                  {previewProduct.images.map((img, i) => (
                    <img
                      key={i}
                      src={img}
                      alt={`${previewProduct.name} ${i + 1}`}
                      style={{
                        width: "64px",
                        height: "64px",
                        borderRadius: "8px",
                        objectFit: "cover",
                        border: "2px solid #f0f0f0",
                        cursor: "pointer",
                        flexShrink: 0,
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div
              style={{
                padding: "12px 24px 20px",
                display: "flex",
                gap: "10px",
              }}
            >
              <Link
                to={`/store/products/edit/${previewProduct.id}`}
                style={{
                  flex: 1,
                  padding: "10px",
                  textAlign: "center",
                  background: "linear-gradient(135deg, #531575, #6b1e96)",
                  color: "#c3ff00",
                  borderRadius: "10px",
                  fontWeight: 700,
                  fontSize: "13px",
                  textDecoration: "none",
                  transition: "opacity 0.15s",
                }}
              >
                Editar Producto
              </Link>
              <button
                onClick={() => setPreviewProduct(null)}
                style={{
                  padding: "10px 20px",
                  background: "#f3f4f6",
                  color: "#6b7280",
                  borderRadius: "10px",
                  border: "none",
                  fontWeight: 600,
                  fontSize: "13px",
                  cursor: "pointer",
                }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Reponer Inventario (Restock) Modal ── */}
      {restockProduct && (
        <div
          onClick={() => !restockLoading && setRestockProduct(null)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(10, 5, 20, 0.65)",
            backdropFilter: "blur(16px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
            animation: "fadeIn 0.2s ease-out",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "rgba(255, 255, 255, 0.95)",
              backdropFilter: "blur(20px)",
              borderRadius: "28px",
              maxWidth: "480px",
              width: "100%",
              padding: "36px",
              boxShadow: "0 30px 60px rgba(10, 5, 20, 0.15), 0 10px 20px rgba(10, 5, 20, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.6)",
              display: "flex",
              flexDirection: "column",
              gap: "24px",
              animation: "scaleIn 0.25s ease-out",
            }}
          >
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", gap: "14px", borderBottom: "1px solid #f1f5f9", paddingBottom: "20px" }}>
              <div 
                style={{ 
                  width: "44px", 
                  height: "44px", 
                  borderRadius: "14px", 
                  background: "linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(5, 150, 105, 0.25))", 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center", 
                  fontSize: "22px",
                  boxShadow: "0 4px 10px rgba(16, 185, 129, 0.1)"
                }}
              >
                📦
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 800, color: "#1e293b", letterSpacing: "-0.01em" }}>Reponer Inventario</h3>
                <p style={{ margin: "3px 0 0 0", fontSize: "12px", color: "#64748b" }}>Agrega existencias directamente a una variación del producto</p>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleRestockSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div>
                <label style={{ display: "block", fontSize: "10px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "6px" }}>Producto</label>
                <p style={{ margin: 0, fontSize: "14px", fontWeight: 800, color: "#1e293b" }}>{restockProduct.name}</p>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "10px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "6px" }}>Variación *</label>
                <select
                  value={restockForm.variation_id}
                  onChange={(e) => setRestockForm(p => ({ ...p, variation_id: e.target.value }))}
                  required
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    border: "1.5px solid #cbd5e1",
                    borderRadius: "12px",
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "#334155",
                    background: "#ffffff",
                    outline: "none",
                    transition: "border-color 0.2s, box-shadow 0.2s",
                    cursor: "pointer",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#6b1e96";
                    e.target.style.boxShadow = "0 0 0 3px rgba(107,30,150,0.1)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#cbd5e1";
                    e.target.style.boxShadow = "none";
                  }}
                >
                  <option value="">Seleccionar variación</option>
                  {(restockProduct.product_variations || []).map((v) => (
                    <option key={v.id} value={v.id}>
                      {parseVariationLabel(v)} (Stock actual: {v.stock})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "10px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "6px" }}>Cantidad a Agregar *</label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  required
                  value={restockForm.quantity}
                  onChange={(e) => setRestockForm(p => ({ ...p, quantity: e.target.value }))}
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    border: "1.5px solid #cbd5e1",
                    borderRadius: "12px",
                    fontSize: "13px",
                    fontWeight: 800,
                    color: "#334155",
                    outline: "none",
                    transition: "border-color 0.2s, box-shadow 0.2s",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#6b1e96";
                    e.target.style.boxShadow = "0 0 0 3px rgba(107,30,150,0.1)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#cbd5e1";
                    e.target.style.boxShadow = "none";
                  }}
                  placeholder="Ej: 50"
                />
                
                {/* Quick Add Pills */}
                <div style={{ display: "flex", gap: "6px", marginTop: "10px", flexWrap: "wrap" }}>
                  {[5, 10, 20, 50, 100].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => {
                        setRestockForm(p => {
                          const currentVal = parseInt(p.quantity || 0, 10);
                          const nextVal = currentVal + val;
                          return { ...p, quantity: nextVal > 0 ? nextVal.toString() : "" };
                        });
                      }}
                      style={{
                        padding: "5px 12px",
                        borderRadius: "20px",
                        background: "rgba(107, 30, 150, 0.05)",
                        color: "#6b1e96",
                        border: "1px solid rgba(107, 30, 150, 0.15)",
                        fontSize: "11px",
                        fontWeight: 700,
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "rgba(107, 30, 150, 0.12)";
                        e.currentTarget.style.transform = "scale(1.05)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "rgba(107, 30, 150, 0.05)";
                        e.currentTarget.style.transform = "none";
                      }}
                    >
                      +{val}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setRestockForm(p => ({ ...p, quantity: "" }))}
                    style={{
                      padding: "5px 12px",
                      borderRadius: "20px",
                      background: "#f1f5f9",
                      color: "#64748b",
                      border: "1px solid #e2e8f0",
                      fontSize: "11px",
                      fontWeight: 700,
                      cursor: "pointer",
                      marginLeft: "auto",
                      transition: "all 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#e2e8f0";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "#f1f5f9";
                    }}
                  >
                    Limpiar
                  </button>
                </div>
              </div>

              {/* Live Stock Transaction Visualizer */}
              {restockForm.variation_id && (
                (() => {
                  const selectedVariation = (restockProduct.product_variations || []).find(v => v.id === restockForm.variation_id);
                  const currentStock = selectedVariation ? (selectedVariation.stock || 0) : 0;
                  const addedQty = parseInt(restockForm.quantity || 0, 10);
                  const finalStock = currentStock + (isNaN(addedQty) ? 0 : addedQty);
                  const isPositive = addedQty > 0;

                  return (
                    <div 
                      style={{ 
                        background: "linear-gradient(135deg, rgba(16, 185, 129, 0.03), rgba(5, 150, 105, 0.08))",
                        border: "1.5px dashed rgba(16, 185, 129, 0.25)",
                        borderRadius: "16px",
                        padding: "14px 18px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginTop: "4px",
                        boxShadow: "0 4px 15px rgba(16, 185, 129, 0.02)"
                      }}
                    >
                      <div style={{ textAlign: "center", flex: 1 }}>
                        <span style={{ display: "block", fontSize: "10px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.03em" }}>Actual</span>
                        <span style={{ fontSize: "16px", fontWeight: 800, color: "#475569" }}>{currentStock} uds</span>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px", padding: "0 10px" }}>
                        <span style={{ fontSize: "12px", color: "#10b981", fontWeight: 700 }}>
                          {isPositive ? `+${addedQty}` : "—"}
                        </span>
                        <svg width="22" height="14" fill="none" viewBox="0 0 24 24" stroke="#10b981" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                        </svg>
                      </div>
                      <div style={{ textAlign: "center", flex: 1 }}>
                        <span style={{ display: "block", fontSize: "10px", fontWeight: 700, color: "#059669", textTransform: "uppercase", letterSpacing: "0.03em" }}>Proyectado</span>
                        <span style={{ fontSize: "17px", fontWeight: 800, color: "#059669", textShadow: "0 0 10px rgba(5, 150, 105, 0.1)" }}>{finalStock} uds</span>
                      </div>
                    </div>
                  );
                })()
              )}

              <div>
                <label style={{ display: "block", fontSize: "10px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "6px" }}>Nota / Comentario (Opcional)</label>
                <input
                  type="text"
                  value={restockForm.notes}
                  onChange={(e) => setRestockForm(p => ({ ...p, notes: e.target.value }))}
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    border: "1.5px solid #cbd5e1",
                    borderRadius: "12px",
                    fontSize: "13px",
                    color: "#334155",
                    outline: "none",
                    transition: "border-color 0.2s",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#6b1e96";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#cbd5e1";
                  }}
                  placeholder="Ej: Reposición lote de proveedor"
                />
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", gap: "12px", marginTop: "10px" }}>
                <button
                  type="button"
                  onClick={() => setRestockProduct(null)}
                  disabled={restockLoading}
                  style={{
                    flex: 1,
                    padding: "14px",
                    borderRadius: "12px",
                    fontSize: "13px",
                    fontWeight: 700,
                    backgroundColor: "#f1f5f9",
                    color: "#475569",
                    border: "none",
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#e2e8f0";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#f1f5f9";
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={restockLoading}
                  style={{
                    flex: 1,
                    padding: "14px",
                    borderRadius: "12px",
                    fontSize: "13px",
                    fontWeight: 700,
                    background: "linear-gradient(135deg, #10b981, #059669)",
                    color: "#fff",
                    border: "none",
                    cursor: "pointer",
                    boxShadow: "0 4px 12px rgba(16, 185, 129, 0.25)",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = "0 6px 20px rgba(16, 185, 129, 0.35)";
                    e.currentTarget.style.transform = "translateY(-1px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(16, 185, 129, 0.25)";
                    e.currentTarget.style.transform = "none";
                  }}
                >
                  {restockLoading ? "Procesando..." : "Confirmar Reposición"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Import Wizard */}
      <BulkImportWizard
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={() => {
          fetchMyProducts();
        }}
        onGoToMissingImages={() => {
          setStockFilter("no_image");
        }}
      />

      {/* Keyframe animations */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}
