import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useStore } from "../../context/StoreContext";
import { useProducts } from "../../context/ProductContext";
import { getCategoriesAPI, getBrandsAPI } from "../../services/api";
import api from "../../services/api";
import toast from "react-hot-toast";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

export default function ProductForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);

  const { fetchProductById } = useProducts();
  const {
    createProduct,
    updateProduct,
    uploadImage,
    loading,
    fetchProfile,
    storeProfile,
  } = useStore();

  const [form, setForm] = useState({
    name: "",
    description: "",
    category_id: "",
    brand_id: "",
    compare_at_price: "",
    cost_price: "",
    delivery_fee: "",
    images: [],
    variations: [],
    status: "Activo",
  });

  const [options, setOptions] = useState([{ name: "Size", values: [] }]);
  const [uploading, setUploading] = useState(false);
  const [fetchingProduct, setFetchingProduct] = useState(isEditing);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  
  // State for the color picker
  const [pickerColors, setPickerColors] = useState({});

  // Store fee percentage (loaded from platform settings)
  const [storeFeePercentage, setStoreFeePercentage] = useState(null);

  useEffect(() => {
    fetchProfile();
    // Load real categories from DB
    getCategoriesAPI()
      .then((res) => setCategories(res.data.data || []))
      .catch(() => toast.error("Error al cargar categorías"));
    // Load brands from DB
    getBrandsAPI()
      .then((res) => setBrands(res.data.data || []))
      .catch(() => console.error("Error loading brands"));

    // Fetch platform store_fee for info banner
    api.get("/admin/settings")
      .then((res) => {
        const fee = res.data?.data?.store_fee?.percentage;
        if (fee !== undefined) setStoreFeePercentage(Number(fee));
      })
      .catch(() => console.error("Error loading platform fees"));

    if (isEditing) {
      setFetchingProduct(true);
      fetchProductById(id)
        .then((product) => {
          let isDefault = false;
          let parsedOptions = [{ name: "Size", values: [] }];
          let mappedVariations = [];
          
          if (product.variations && product.variations.length > 0) {
            // Filtrar variaciones basuras (_default) si existen variaciones reales conviviendo
            const validVars = product.variations.filter(v => 
               !(v.attribute_name === 'default' || v.attribute_value === '{"_default":"default"}' || v.attribute_value === 'default')
            );

            // Si filtrando nos quedamos sin nada, significa que era un producto Simple genuino
            const effectiveVariations = validVars.length > 0 ? validVars : product.variations;

            // Check if it's a default variation
            if (effectiveVariations.length === 1 && 
               (effectiveVariations[0].attribute_name === 'default' || 
                effectiveVariations[0].attribute_value === '{"_default":"default"}' || 
                !effectiveVariations[0].attribute_name)) {
                isDefault = true;
                mappedVariations = effectiveVariations;
            } else {
              try {
                // Try JSON parsing first variation
                const testObj = JSON.parse(effectiveVariations[0].attribute_value);
                if (typeof testObj === "object" && testObj !== null) {
                  const keys = Object.keys(testObj);
                  parsedOptions = keys.map((k) => {
                    const allVals = effectiveVariations.map((v) => {
                      try {
                        return JSON.parse(v.attribute_value)[k];
                      } catch {
                        return "";
                      }
                    });
                    return {
                      name: k,
                      values: [...new Set(allVals)].filter(Boolean),
                    };
                  });
                  // Inyectar v_price para la interfaz de Shopify usando el price_modifier
                  mappedVariations = effectiveVariations.map(v => ({
                    ...v,
                    v_price: (parseFloat(product.price) || 0) + (parseFloat(v.price_modifier) || 0)
                  }));
                } else {
                  throw new Error("Not matrix");
                }
              } catch {
                // Legacy flat variations -> Convert to Matrix
                const attrGroups = {};
                effectiveVariations.forEach((v) => {
                  const name = v.attribute_name || "Opción";
                  if (!attrGroups[name]) attrGroups[name] = [];
                  if (v.attribute_value) attrGroups[name].push(v.attribute_value);
                });
  
                parsedOptions = Object.keys(attrGroups).map((name) => ({
                  name,
                  values: [...new Set(attrGroups[name])],
                }));
  
                mappedVariations = effectiveVariations.map((v) => ({
                  ...v,
                  attribute_name: "Matrix",
                  attribute_value: JSON.stringify({
                    [v.attribute_name || "Opción"]: v.attribute_value,
                  }),
                  v_price: (parseFloat(product.price) || 0) + (parseFloat(v.price_modifier) || 0)
                }));
              }
            }
          } else {
            isDefault = true;
          }

          setOptions(parsedOptions);
          setForm({
            name: product.name || "",
            description: product.description || "",
            category_id: product.category_id || "",
            brand_id: product.brand_id || "",
            price: product.price || "",
            compare_at_price: product.compare_at_price || "",
            cost_price: product.cost_price || "",
            delivery_fee: product.delivery_fee || "",
            images: product.images || [],
            hasVariations: !isDefault,
            simpleStock: isDefault && product.variations?.length ? product.variations[0].stock : 0,
            simpleSku: isDefault && product.variations?.length ? product.variations[0].sku : "",
            variations: mappedVariations,
            status: product.stock_status === "Sin stock" 
              ? "Sin stock" 
              : (!product.is_active ? "Borrador" : "Activo"),
          });
        })
        .catch(() => {
          toast.error("Error al cargar producto para editar");
          navigate("/store/products");
        })
        .finally(() => setFetchingProduct(false));
    }
  }, [fetchProfile, fetchProductById, id, isEditing, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleOptionChange = (index, field, value) => {
    setOptions((prev) => {
      const newOpts = [...prev];
      newOpts[index] = { ...newOpts[index], [field]: value };
      return newOpts;
    });
  };

  const handleDescriptionChange = (content) => {
    setForm((prev) => ({ ...prev, description: content }));
  };

  // Setup de React Quill para un E-commerce
  const quillModules = {
    toolbar: [
      [{ header: [2, 3, false] }],
      ["bold", "italic", "underline", "strike"],
      [{ color: [] }, { background: [] }],
      [{ list: "ordered" }, { list: "bullet" }],
      ["link", "clean"],
    ],
  };

  const addOption = () => {
    setOptions((prev) => [...prev, { name: "", values: [] }]);
  };

  const removeOption = (index) => {
    setOptions((prev) => prev.filter((_, i) => i !== index));
  };

  // Autogeneración de Matriz Estilo Shopify
  useEffect(() => {
    if (!form.hasVariations || fetchingProduct) return;

    const validOptions = options.filter((o) => o.name.trim() && o.values.length > 0);
    if (validOptions.length === 0) {
      setForm((prev) => prev.variations.length > 0 ? { ...prev, variations: [] } : prev);
      return;
    }

    const combinations = validOptions.reduce(
      (acc, curr) => {
        const res = [];
        acc.forEach((a) => {
          curr.values.forEach((v) => {
            res.push({ ...a, [curr.name]: v });
          });
        });
        return res;
      },
      [{}]
    );

    const basePrice = parseFloat(form.price) || 0;

    setForm((prev) => {
      let changed = false;
      const newVariations = combinations.map((combo) => {
        const jsonVal = JSON.stringify(combo);
        const existing = prev.variations.find((v) => v.attribute_value === jsonVal);
        if (existing) {
          if (existing.v_price === undefined) {
            existing.v_price = basePrice + parseFloat(existing.price_modifier || 0);
          }
          return existing;
        }
        changed = true;
        return {
          attribute_name: "Matrix",
          attribute_value: jsonVal,
          stock: 0,
          v_price: basePrice, 
          price_modifier: 0,
          sku: "",
        };
      });

      // Avoid infinite loops
      if (changed || newVariations.length !== prev.variations.length) {
        return { ...prev, variations: newVariations };
      }
      return prev;
    });
  // Omitimos form.price intencionalmente para no regenerar/sobreescribir en cada reseteo de precio base a menos que cambien opciones
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options, form.hasVariations, fetchingProduct]);

  const handleVariationFieldChange = (index, field, value) => {
    setForm((prev) => {
      const newVars = [...prev.variations];
      newVars[index] = { ...newVars[index], [field]: value };
      return { ...prev, variations: newVars };
    });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const result = await uploadImage(file);
    setUploading(false);

    if (result.success) {
      setForm((prev) => ({
        ...prev,
        images: [...prev.images, result.url],
      }));
      toast.success("Imagen subida exitosamente");
    } else {
      toast.error(result.error);
    }
  };

  const removeImage = (index) => {
    setForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name || !form.description || !form.category_id || !form.price) {
      return toast.error("Completa todos los campos básicos");
    }

    if (!storeProfile?.business_name) {
      return toast.error("Primero debes configurar tu perfil de tienda");
    }

    const payload = {
      name: form.name,
      description: form.description,
      category_id: form.category_id,
      brand_id: form.brand_id || null,
      price: parseFloat(form.price),
      compare_at_price: form.compare_at_price ? parseFloat(form.compare_at_price) : "",
      cost_price: form.cost_price ? parseFloat(form.cost_price) : "",
      delivery_fee: form.delivery_fee ? parseFloat(form.delivery_fee) : 0,
      images: form.images,
      status: form.status,
      variations: form.hasVariations
        ? form.variations.map((v) => ({
            id: v.id,
            attribute_name: v.attribute_name,
            attribute_value: v.attribute_value,
            sku: v.sku || "",
            stock: parseInt(v.stock) || 0,
            price_modifier: v.v_price !== undefined ? parseFloat(v.v_price) - parseFloat(form.price) : 0,
          }))
        : [
            {
              id: form.variations?.[0]?.id,
              attribute_name: "default",
              attribute_value: '{"_default":"default"}',
              sku: form.simpleSku || "",
              stock: parseInt(form.simpleStock) || 0,
              price_modifier: 0,
            },
          ],
    };

    let result;
    if (isEditing) {
      result = await updateProduct(id, payload);
      if (result.success) {
        toast.success("Producto actualizado exitosamente");
        navigate("/store/products");
      } else {
        toast.error(result.error);
      }
    } else {
      result = await createProduct(payload);
      if (result.success) {
        toast.success("Producto creado exitosamente.");
        navigate("/store/products");
      } else {
        toast.error(result.error);
      }
    }
  };

  if (fetchingProduct) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
        <div className="w-12 h-12 border-4 border-purple-500/10 border-t-[#6b1e96] rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold text-gray-500 animate-pulse">Cargando datos del producto...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* ── HEADER BANNER ── */}
      <div className="relative overflow-hidden rounded-[24px] bg-gradient-to-r from-[#531575] via-[#6b1e96] to-[#8b5cf6] p-6 sm:p-8 text-white shadow-lg">
        {/* Decorative background glow */}
        <div className="absolute right-0 top-0 -mt-4 -mr-4 w-56 h-56 rounded-full bg-white/10 blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 -mb-8 w-44 h-44 rounded-full bg-white/5 blur-2xl pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <button
              onClick={() => navigate("/store/products")}
              className="inline-flex items-center gap-1.5 text-xs text-purple-200 hover:text-white font-semibold transition-colors mb-2 group"
            >
              <span className="transition-transform group-hover:-translate-x-1">←</span> Volver a Productos
            </button>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {isEditing ? "Editar Producto" : "Nuevo Producto"}
            </h2>
            <p className="text-sm text-purple-100 max-w-xl">
              {isEditing
                ? "Modifica y perfecciona los detalles, precios y variaciones de tu artículo en catálogo."
                : "Completa la ficha técnica para añadir un nuevo producto estrella a tu tienda."}
            </p>
          </div>
          {isEditing && (
            <div className={`px-4 py-2 rounded-xl text-sm font-bold shadow-sm self-start sm:self-center
              ${form.status === 'Activo' ? 'bg-[#c3ff00] text-[#1a0a2e]' : form.status === 'Borrador' ? 'bg-white/15 text-white backdrop-blur-md' : 'bg-red-500 text-white'}`}
            >
              ● {form.status}
            </div>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* COLUMNA PRINCIPAL (70% - izquierda) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card 1: Información Básica */}
          <div className="bg-white rounded-[20px] border border-slate-100 shadow-sm p-6 space-y-5">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-50">
              <span className="text-2xl">📝</span>
              <div>
                <h3 className="font-bold text-gray-900 text-base">1. Información Básica</h3>
                <p className="text-xs text-gray-400">Nombre comercial y descripción del producto</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  Nombre del Producto *
                </label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-purple-500/10 focus:border-[#6b1e96] text-sm transition-all placeholder:text-slate-400"
                  placeholder="Ej: Kit de Blanqueamiento Dental Pro"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  Descripción Detallada *
                </label>
                <div className="rounded-xl border border-slate-200 overflow-hidden focus-within:ring-4 focus-within:ring-purple-500/10 focus-within:border-[#6b1e96] transition-all">
                  <ReactQuill
                    theme="snow"
                    value={form.description}
                    onChange={handleDescriptionChange}
                    modules={quillModules}
                    placeholder="Describe los beneficios, características y componentes principales de tu producto..."
                    className="h-48"
                  />
                </div>
                {/* Spacer block to prevent quill toolbar overlap */}
                <div className="h-12" />
                <input type="hidden" required value={form.description.replace(/<[^>]*>?/gm, '').trim() || ""} />
              </div>
            </div>
          </div>

          {/* Card 2: Precios e Inventario */}
          <div className="bg-white rounded-[20px] border border-slate-100 shadow-sm p-6 space-y-5">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-50">
              <span className="text-2xl">💰</span>
              <div>
                <h3 className="font-bold text-gray-900 text-base">2. Precios e Inventario Financiero</h3>
                <p className="text-xs text-gray-400">Precios de venta, comparación y costos operativos</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  Precio Venta (USD) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-sm">$</span>
                  <input
                    type="number"
                    name="price"
                    value={form.price}
                    onChange={handleChange}
                    required
                    min="0.01"
                    step="0.01"
                    className="w-full pl-9 pr-4 py-3 border border-slate-200 border-l-4 border-l-purple-600 rounded-xl focus:ring-4 focus:ring-purple-500/10 focus:border-[#6b1e96] text-sm font-semibold transition-all placeholder:text-slate-400 text-gray-950"
                    placeholder="25.00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  Precio Comparación (USD)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-sm">$</span>
                  <input
                    type="number"
                    name="compare_at_price"
                    value={form.compare_at_price}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    className="w-full pl-9 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-purple-500/10 focus:border-[#6b1e96] text-sm font-semibold transition-all placeholder:text-slate-400 text-gray-800"
                    placeholder="Ej. 35.00"
                  />
                </div>
                <p className="text-[10px] text-gray-400 mt-1">Se muestra tachado (descuento).</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  Costo por Artículo (USD)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-sm">$</span>
                  <input
                    type="number"
                    name="cost_price"
                    value={form.cost_price}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    className="w-full pl-9 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-purple-500/10 focus:border-[#6b1e96] text-sm font-semibold transition-all placeholder:text-slate-400 text-gray-800"
                    placeholder="Ej. 15.00"
                  />
                </div>
                <p className="text-[10px] text-gray-400 mt-1">Privado. Solo para tus métricas.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  Tarifa Envío Local (USD)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-sm">$</span>
                  <input
                    type="number"
                    name="delivery_fee"
                    value={form.delivery_fee}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    className="w-full pl-9 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-purple-500/10 focus:border-[#6b1e96] text-sm font-semibold transition-all placeholder:text-slate-400 text-gray-800"
                    placeholder="Ej. 3.00 (opcional)"
                  />
                </div>
                <p className="text-[10px] text-gray-400 mt-1">Costo al ofrecer envío en tu ciudad.</p>
              </div>
            </div>

            {/* Store Fee Info Banner */}
            {storeFeePercentage !== null && storeFeePercentage > 0 && (
              <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-purple-50/50 border border-purple-100 mt-2">
                <span className="text-xl mt-0.5">ℹ️</span>
                <div>
                  <p className="text-xs font-bold text-[#6b1e96] uppercase tracking-wider">Comisión de la Plataforma ({storeFeePercentage}%)</p>
                  <p className="text-xs text-purple-950 mt-1 leading-relaxed">
                    Forcepx aplica una comisión del {storeFeePercentage}% sobre las ventas. 
                    {form.price && parseFloat(form.price) > 0 && (
                      <span> Si vendes a <strong>${parseFloat(form.price).toFixed(2)}</strong>, recibirás aproximadamente <strong>${(parseFloat(form.price) * (1 - storeFeePercentage / 100)).toFixed(2)}</strong>.</span>
                    )}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Card 3: Imágenes Galería */}
          <div className="bg-white rounded-[20px] border border-slate-100 shadow-sm p-6 space-y-5">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-50">
              <span className="text-2xl">📸</span>
              <div>
                <h3 className="font-bold text-gray-900 text-base">3. Imágenes Galería</h3>
                <p className="text-xs text-gray-400">Imágenes del producto. Se requiere al menos una imagen para activar el producto.</p>
              </div>
            </div>

            {/* Upload Area & Thumbnails Layout */}
            <div className="space-y-4">
              {form.images.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3.5">
                  {form.images.map((url, i) => (
                    <div
                      key={i}
                      className="relative aspect-square rounded-xl overflow-hidden border border-slate-100 group shadow-sm bg-slate-50"
                    >
                      <img
                        src={url}
                        alt={`Producto ${i + 1}`}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        className="absolute inset-0 bg-black/60 backdrop-blur-[1px] text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center text-sm font-bold"
                      >
                        <span className="px-2.5 py-1.5 bg-red-600 rounded-lg hover:bg-red-700 active:scale-95 transition-all shadow-md">
                          Eliminar
                        </span>
                      </button>
                      {i === 0 && (
                        <span className="absolute top-1.5 left-1.5 px-2 py-0.5 bg-[#6b1e96] text-white text-[9px] font-extrabold uppercase rounded shadow-sm">
                          Principal
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <label className={`w-full flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-200
                ${uploading ? 'border-purple-300 bg-purple-50/10' : 'border-slate-300 bg-slate-50/50 hover:border-purple-400 hover:bg-purple-50/20'}`}
              >
                <div className="flex flex-col items-center justify-center text-center space-y-2">
                  {uploading ? (
                    <>
                      <div className="w-8 h-8 border-2 border-purple-500/10 border-t-purple-600 rounded-full animate-spin" />
                      <span className="text-xs font-semibold text-purple-700">Subiendo imagen a la nube...</span>
                    </>
                  ) : (
                    <>
                      <span className="text-3xl">📤</span>
                      <span className="text-sm font-semibold text-gray-700">Añadir imagen a la galería</span>
                      <span className="text-[11px] text-gray-400">Recomendado: Formatos JPG, PNG o WebP en formato cuadrado</span>
                    </>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Card 4: Variaciones Switch Card */}
          <div className="bg-white rounded-[20px] border border-slate-100 shadow-sm p-6">
            <label className="flex items-start gap-4 cursor-pointer select-none group">
              <div className="flex items-center h-5 mt-1">
                <input
                  type="checkbox"
                  name="hasVariations"
                  checked={form.hasVariations}
                  onChange={(e) => setForm(prev => ({ ...prev, hasVariations: e.target.checked }))}
                  className="w-5 h-5 text-purple-600 rounded-lg border-slate-300 focus:ring-purple-500/20 focus:ring-4 transition-all"
                />
              </div>
              <div>
                <span className="block font-bold text-gray-900 text-sm group-hover:text-[#6b1e96] transition-colors">
                  Este producto tiene múltiples opciones
                </span>
                <span className="block text-xs text-gray-400 mt-0.5 leading-relaxed">
                  Actívalo si vendes variaciones de este artículo (ej. diferentes tonos de resinas, tallas de guantes, sabores o capacidades).
                </span>
              </div>
            </label>
          </div>

          {form.hasVariations ? (
            <>
              {/* Option Matrix Builder */}
              <div className="bg-white rounded-[20px] border border-slate-100 shadow-sm p-6 space-y-5 relative">
                <div className="flex items-center justify-between pb-3 border-b border-slate-50">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">⚙️</span>
                    <div>
                      <h3 className="font-bold text-gray-900 text-base">4. Opciones de Variación</h3>
                      <p className="text-xs text-gray-400">Define los atributos y genera la matriz Shopify-style</p>
                    </div>
                  </div>

                  {/* Tooltip */}
                  <div className="relative group">
                    <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-xs font-bold cursor-help hover:bg-purple-100 hover:text-purple-600 transition-all">
                      ?
                    </div>
                    {/* TOOLTIP CONTENT */}
                    <div className="absolute right-0 bottom-full mb-2 w-72 p-3.5 bg-gray-955 text-white text-xs rounded-2xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 pointer-events-none">
                      <p className="font-bold mb-1.5 text-purple-400">Cómo configurar variaciones:</p>
                      <ul className="space-y-1 text-gray-300 list-disc pl-4 leading-relaxed">
                        <li>Crea una categoría de opción (Ej. <strong>Tono</strong> o <strong>Capacidad</strong>).</li>
                        <li>Ingresa los valores y presiona <strong>Enter</strong> o <strong>Coma</strong> para guardarlos (Ej. <span className="text-white">A2, A3, B1</span>).</li>
                        <li>Las variaciones se cruzarán automáticamente.</li>
                      </ul>
                      <div className="absolute right-3.5 bottom-0 shadow-lg translate-y-full border-[6px] border-transparent border-t-gray-955"></div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {options.map((opt, i) => {
                    const isColorOption = opt.name.trim().toLowerCase() === "color" || opt.name.trim().toLowerCase() === "tono";
                    const currentColor = pickerColors[i] || "#000000";

                    return (
                      <div key={i} className="border border-slate-100 rounded-2xl p-4 bg-slate-50/30 space-y-3">
                        <div className="flex justify-between items-center">
                          <div className="w-1/2">
                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Nombre Opción {i + 1}</label>
                            <input
                              type="text"
                              value={opt.name}
                              onChange={(e) => handleOptionChange(i, "name", e.target.value)}
                              placeholder="Ej. Tono, Tamaño, Capacidad"
                              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-purple-500/10 focus:border-[#6b1e96] bg-white transition-all font-semibold"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => removeOption(i)}
                            className="text-xs text-red-500 hover:text-red-700 font-bold px-3 py-1.5 rounded-lg hover:bg-red-50 active:scale-95 transition-all mt-4"
                          >
                            Eliminar Opción
                          </button>
                        </div>
                        
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Valores de Opción</label>
                          <div className="w-full flex flex-wrap items-center gap-2 p-2 border border-slate-200 rounded-xl bg-white focus-within:ring-4 focus-within:ring-purple-500/10 focus-within:border-[#6b1e96] transition-all min-h-[46px]">
                            {opt.values.map((rawVal, vIdx) => {
                              const valName = rawVal.includes('|') ? rawVal.split('|')[0] : rawVal;
                              const valHex = rawVal.includes('|') ? rawVal.split('|')[1] : null;

                              return (
                                <span key={vIdx} className="flex items-center gap-1.5 px-2.5 py-1 bg-purple-50 border border-purple-100/50 text-purple-950 text-xs font-bold rounded-lg shadow-sm">
                                  {valHex && <span className="w-3 h-3 rounded-full border border-purple-200 shadow-sm" style={{ backgroundColor: valHex }}></span>}
                                  {valName}
                                  <button
                                    type="button"
                                    onClick={() => {
                                       const newValues = opt.values.filter((_, idx) => idx !== vIdx);
                                       handleOptionChange(i, "values", newValues);
                                    }}
                                    className="text-purple-400 hover:text-purple-700 font-bold ml-1 transition-colors"
                                  >
                                    ✕
                                  </button>
                                </span>
                              );
                            })}
                            
                            {isColorOption && (
                              <input 
                                type="color" 
                                title="Selecciona color visual (opcional)"
                                value={currentColor}
                                onChange={(e) => setPickerColors(prev => ({...prev, [i]: e.target.value}))}
                                className="w-6 h-6 p-0 border-0 rounded-md cursor-pointer bg-transparent"
                              />
                            )}

                            <input
                              type="text"
                              placeholder={opt.values.length === 0 ? "Escribe un valor y presiona Enter o Coma" : "+ Agregar..."}
                              className="flex-1 min-w-[150px] px-2 py-1 outline-none text-sm bg-transparent placeholder-gray-400"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ',') {
                                  e.preventDefault();
                                  const textVal = e.target.value.trim().replace(/,$/, '');
                                  if (textVal) {
                                    const finalVal = isColorOption ? `${textVal}|${currentColor}` : textVal;
                                    if (!opt.values.includes(finalVal)) {
                                      handleOptionChange(i, "values", [...opt.values, finalVal]);
                                    }
                                  }
                                  e.target.value = "";
                                }
                              }}
                              onBlur={(e) => {
                                  const textVal = e.target.value.trim().replace(/,$/, '');
                                  if (textVal) {
                                    const finalVal = isColorOption ? `${textVal}|${currentColor}` : textVal;
                                    if (!opt.values.includes(finalVal)) {
                                      handleOptionChange(i, "values", [...opt.values, finalVal]);
                                    }
                                  }
                                  e.target.value = "";
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    )})}
                </div>

                <div className="pt-2">
                   <button
                     type="button"
                     onClick={addOption}
                     className="text-xs font-bold text-gray-700 hover:text-[#6b1e96] border border-slate-200 bg-white px-4 py-2.5 rounded-xl shadow-sm hover:bg-slate-50 hover:border-slate-300 active:scale-95 transition-all inline-flex items-center gap-1.5"
                   >
                     <span>➕</span> Agregar otra opción (ej. Tamaño)
                   </button>
                </div>
              </div>

              {/* Matrix Result Table */}
              {form.variations.length > 0 && (
                <div className="bg-white rounded-[20px] border border-slate-100 shadow-sm overflow-hidden">
                  <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                    <h4 className="font-bold text-gray-800 text-xs tracking-wider uppercase">Matriz de Variaciones Autogenerada</h4>
                    <span className="px-2.5 py-0.5 bg-purple-100 text-purple-800 text-[10px] font-extrabold rounded-full uppercase">
                      {form.variations.length} Combinaciones
                    </span>
                  </div>
                  
                  {/* Vista en Tabla para Escritorio */}
                  <div className="overflow-x-auto hidden md:block">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                      <thead className="text-[10px] font-bold text-gray-400 bg-slate-50/30 uppercase tracking-wider border-b border-slate-100">
                        <tr>
                          <th className="py-3 px-4 font-semibold">Variación</th>
                          <th className="py-3 px-3 font-semibold w-40">Precio (USD)</th>
                          <th className="py-3 px-3 font-semibold w-32">Inventario</th>
                          <th className="py-3 px-4 font-semibold w-48">SKU Código</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-gray-800">
                        {form.variations.map((v, i) => {
                          let parsedCombo = {};
                          let label = v.attribute_value;
                          try {
                            parsedCombo = JSON.parse(v.attribute_value);
                            label = Object.entries(parsedCombo)
                              .map(([, val]) => typeof val === 'string' && val.includes('|') ? val.split('|')[0] : `${val}`)
                              .join(" / ");
                          } catch {
                            // Legacy values fallback
                          }

                          return (
                            <tr key={i} className="hover:bg-slate-50/40 transition-colors">
                              <td className="py-3.5 px-4 font-bold text-gray-900">
                                  <div className="flex items-center gap-3">
                                     <div className="w-10 h-10 flex-shrink-0 rounded-lg border border-slate-150 bg-slate-50 flex items-center justify-center text-gray-400 text-xs overflow-hidden shadow-inner">
                                        {form.images.length > 0 ? (
                                          <img src={form.images[0]} alt="Variante" loading="lazy" className="w-full h-full object-cover" />
                                        ) : '📷'}
                                     </div>
                                     <span className="text-gray-900 font-semibold">{label}</span>
                                  </div>
                              </td>
                              <td className="py-3 px-3">
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">$</span>
                                    <input
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      value={v.v_price ?? (parseFloat(form.price) + parseFloat(v.price_modifier || 0))}
                                      onChange={(e) =>
                                        handleVariationFieldChange(i, "v_price", e.target.value)
                                      }
                                      className="w-full pl-7 pr-2 py-2 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-4 focus:ring-purple-500/10 focus:border-[#6b1e96] bg-white transition-all"
                                    />
                                </div>
                              </td>
                              <td className="py-3 px-3">
                                <input
                                  type="number"
                                  min="0"
                                  value={v.stock}
                                  onChange={(e) =>
                                    handleVariationFieldChange(i, "stock", e.target.value)
                                  }
                                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-4 focus:ring-purple-500/10 focus:border-[#6b1e96] bg-white transition-all text-center"
                                />
                              </td>
                              <td className="py-3 px-4">
                                <input
                                  type="text"
                                  value={v.sku}
                                  onChange={(e) =>
                                    handleVariationFieldChange(i, "sku", e.target.value)
                                  }
                                  placeholder="Ej. SKU-A2"
                                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-purple-500/10 focus:border-[#6b1e96] bg-white transition-all font-mono font-semibold"
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Vista de variaciones responsiva en móvil (cards editables) */}
                  <div className="grid grid-cols-1 gap-4 p-4 md:hidden border-t border-slate-100 bg-slate-50/20">
                    {form.variations.map((v, i) => {
                      let parsedCombo = {};
                      let label = v.attribute_value;
                      try {
                        parsedCombo = JSON.parse(v.attribute_value);
                        label = Object.entries(parsedCombo)
                          .map(([, val]) => typeof val === 'string' && val.includes('|') ? val.split('|')[0] : `${val}`)
                          .join(" / ");
                      } catch {
                        // Fallback
                      }

                      return (
                        <div 
                          key={i} 
                          className="bg-white rounded-2xl border border-slate-150 p-4 shadow-sm space-y-4"
                        >
                          {/* Cabecera de la variante */}
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 flex-shrink-0 rounded-xl border border-slate-150 bg-slate-50 flex items-center justify-center text-gray-400 text-xs overflow-hidden shadow-inner">
                               {form.images.length > 0 ? (
                                 <img src={form.images[0]} alt="Variante" loading="lazy" className="w-full h-full object-cover" />
                               ) : '📷'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="text-gray-900 font-bold text-sm block truncate">{label}</span>
                              <span className="text-[10px] text-gray-400 font-semibold bg-gray-100 px-1.5 py-0.5 rounded w-fit block mt-1">Variación #{i + 1}</span>
                            </div>
                          </div>

                          {/* Campos de edición */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-gray-100">
                            <div>
                              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Precio (USD) *</label>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">$</span>
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={v.v_price ?? (parseFloat(form.price) + parseFloat(v.price_modifier || 0))}
                                  onChange={(e) => handleVariationFieldChange(i, "v_price", e.target.value)}
                                  className="w-full pl-7 pr-2 py-2 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-4 focus:ring-purple-500/10 focus:border-[#6b1e96] bg-white transition-all text-gray-950"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Inventario *</label>
                              <input
                                type="number"
                                min="0"
                                value={v.stock}
                                onChange={(e) => handleVariationFieldChange(i, "stock", e.target.value)}
                                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-purple-500/10 focus:border-[#6b1e96] bg-white transition-all text-center text-gray-950"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">SKU Código</label>
                              <input
                                type="text"
                                value={v.sku}
                                onChange={(e) => handleVariationFieldChange(i, "sku", e.target.value)}
                                placeholder="Ej. SKU-A2"
                                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-purple-500/10 focus:border-[#6b1e96] bg-white transition-all font-mono font-semibold text-gray-950"
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="bg-white rounded-[20px] border border-slate-100 shadow-sm p-6 space-y-5">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-50">
                <span className="text-2xl">📦</span>
                <div>
                  <h3 className="font-bold text-gray-900 text-base">4. Inventario Simple</h3>
                  <p className="text-xs text-gray-400">Stock y SKU para producto sin variaciones</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Stock Disponible *</label>
                  <input
                    type="number"
                    name="simpleStock"
                    value={form.simpleStock}
                    onChange={handleChange}
                    min="0"
                    required
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-purple-500/10 focus:border-[#6b1e96] text-sm font-semibold transition-all"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">SKU (Opcional)</label>
                  <input
                    type="text"
                    name="simpleSku"
                    value={form.simpleSku}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-purple-500/10 focus:border-[#6b1e96] text-sm font-semibold transition-all font-mono"
                    placeholder="Ej: KIT-001"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* COLUMNA LATERAL (30% - derecha - sticky) */}
        <div className="space-y-6">
          {/* Disponibilidad */}
          <div className="bg-white rounded-[20px] border border-slate-100 shadow-sm p-6 space-y-4 lg:sticky lg:top-6">
            <h3 className="font-bold text-gray-900 text-sm tracking-wide uppercase pb-3 border-b border-slate-50">Disponibilidad</h3>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Estado en Catálogo</label>
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                className={`w-full px-3 py-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-purple-500/10 focus:border-[#6b1e96] text-sm font-bold transition-all
                  ${form.status === 'Activo' ? 'text-green-700 bg-green-50/50 border-green-200' : form.status === 'Borrador' ? 'text-slate-700 bg-slate-50/80 border-slate-200' : 'text-red-700 bg-red-50/50 border-red-200'}`}
              >
                <option value="Borrador">📁 Borrador</option>
                <option value="Activo">🟢 Activo</option>
                <option value="Sin stock">🔴 Sin stock</option>
              </select>
              <p className="text-[11px] text-gray-400 mt-2.5 leading-relaxed">
                {form.status === "Borrador" && "El producto no se publicará y no será visible para los clientes. Úsalo para planificar."}
                {form.status === "Activo" && "El producto estará publicado, disponible para compra y visible en Forcepx."}
                {form.status === "Sin stock" && "El producto se mostrará como agotado para la compra pero seguirá visible."}
              </p>
            </div>
          </div>

          {/* Clasificación */}
          <div className="bg-white rounded-[20px] border border-slate-100 shadow-sm p-6 space-y-4 lg:sticky lg:top-[220px]">
            <h3 className="font-bold text-gray-900 text-sm tracking-wide uppercase pb-3 border-b border-slate-50">Clasificación</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                  Categoría Principal *
                </label>
                <select
                  name="category_id"
                  value={form.category_id}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-3 border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-purple-500/10 focus:border-[#6b1e96] bg-white transition-all font-semibold"
                >
                  <option value="">Seleccionar categoría...</option>
                  {categories.map((cat) => (
                    cat.children && cat.children.length > 0 ? (
                      <optgroup key={cat.id} label={cat.name}>
                        <option value={cat.id}>{cat.name} (General)</option>
                        {cat.children.map((sub) => (
                          <option key={sub.id} value={sub.id}>
                            {sub.name}
                          </option>
                        ))}
                      </optgroup>
                    ) : (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    )
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                  Marca
                </label>
                <select
                  name="brand_id"
                  value={form.brand_id}
                  onChange={handleChange}
                  className="w-full px-3 py-3 border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-purple-500/10 focus:border-[#6b1e96] bg-white transition-all font-semibold"
                >
                  <option value="">Sin marca asignada</option>
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
                <p className="text-[10px] text-gray-400 mt-1">Fabricante o laboratorio del producto.</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── BOTONES DE ACCIÓN FLOTANTES / BOTTOM ── */}
        <div className="lg:col-span-3 flex flex-col sm:flex-row items-center gap-3 pt-6 border-t border-slate-100 mt-4">
          <button
            type="submit"
            disabled={loading || uploading || (form.hasVariations && form.variations.length === 0)}
            className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-[#531575] to-[#6b1e96] text-[#c3ff00] font-extrabold rounded-xl hover:shadow-lg active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none text-sm uppercase tracking-wider"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Guardando...</span>
              </div>
            ) : isEditing ? (
              "Guardar Cambios"
            ) : (
              "Crear Producto"
            )}
          </button>
          <button
            type="button"
            onClick={() => navigate("/store/products")}
            className="w-full sm:w-auto px-6 py-3.5 bg-white border border-slate-200 text-gray-700 font-bold rounded-xl hover:bg-slate-50 active:scale-95 transition-all text-sm uppercase tracking-wider"
          >
            Cancelar
          </button>
          
          {form.hasVariations && form.variations.length === 0 && (
            <span className="text-xs text-red-500 ml-auto font-bold animate-pulse">
              ⚠️ Genera al menos 1 variación para habilitar el guardado.
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
