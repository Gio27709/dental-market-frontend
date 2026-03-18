import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useStore } from "../../context/StoreContext";
import { useProducts } from "../../context/ProductContext";
import { getCategoriesAPI } from "../../services/api";
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
    price: "",
    compare_at_price: "",
    cost_price: "",
    images: [],
    variations: [],
    status: "Activo",
  });

  const [options, setOptions] = useState([{ name: "Size", values: [] }]);
  const [uploading, setUploading] = useState(false);
  const [fetchingProduct, setFetchingProduct] = useState(isEditing);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetchProfile();
    // Load real categories from DB
    getCategoriesAPI()
      .then((res) => setCategories(res.data.data || []))
      .catch(() => toast.error("Error al cargar categorías"));

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
            price: product.price || "",
            compare_at_price: product.compare_at_price || "",
            cost_price: product.cost_price || "",
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
      price: parseFloat(form.price),
      compare_at_price: form.compare_at_price ? parseFloat(form.compare_at_price) : "",
      cost_price: form.cost_price ? parseFloat(form.cost_price) : "",
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
      <div className="p-8 text-center text-gray-500">
        Cargando datos del producto...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-1">
        {isEditing ? "Editar Producto" : "Nuevo Producto"}
      </h2>
      <p className="text-sm text-gray-500 mb-6">
        {isEditing
          ? "Modifica los detalles, estado y variaciones matrix de tu producto."
          : "Completa los datos de tu producto para publicarlo o guardarlo como borrador."}
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info & Availability */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-3 bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h3 className="font-semibold text-gray-900">1. Información Básica</h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre *
            </label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500/20 text-sm"
              placeholder="Ej: Kit de Blanqueamiento Dental"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descripción *
            </label>
            <div className="bg-white rounded-lg">
              <ReactQuill
                theme="snow"
                value={form.description}
                onChange={handleDescriptionChange}
                modules={quillModules}
                placeholder="Describe los beneficios, características y componentes principales de tu producto..."
                className="h-48 mb-12" // mb-12 para compensar la altura de la toolbar de quill y su caja inferior
              />
            </div>
            {/* Validacion invisible si el campo esta 'vacio' (solo tags p) */}
            <input type="hidden" required value={form.description.replace(/<[^>]*>?/gm, '').trim() || ""} />
          </div>

        </div>
          
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-5 h-fit">
            <h3 className="font-semibold text-gray-900 mb-4">Disponibilidad</h3>
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500/20 text-sm font-medium
                ${form.status === 'Activo' ? 'text-green-700 bg-green-50' : form.status === 'Borrador' ? 'text-gray-700 bg-gray-50' : 'text-red-700 bg-red-50'}`}
            >
              <option value="Borrador">Borrador</option>
              <option value="Activo">Activo</option>
              <option value="Sin stock">Sin stock</option>
            </select>
            <p className="text-xs text-gray-500 mt-3 leading-relaxed">
              {form.status === "Borrador" && "El producto no será visible para los clientes."}
              {form.status === "Activo" && "El producto estará publicado y visible en la tienda."}
              {form.status === "Sin stock" && "El producto se mostrará como agotado y no podrá comprarse."}
            </p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5 h-fit">
            <h3 className="font-semibold text-gray-900 mb-4">Clasificación</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categoría Principal *
                </label>
                <select
                  name="category_id"
                  value={form.category_id}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500/20"
                >
                  <option value="">Seleccionar categoría...</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

        {/* Financial Prices Block */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h3 className="font-semibold text-gray-900">2. Precios e Inventario Financiero</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Precio USD (Venta) *
              </label>
              <div className="relative w-full">
                <input
                  type="number"
                  name="price"
                  value={form.price}
                  onChange={handleChange}
                  required
                  min="0.01"
                  step="0.01"
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 border-l-4 border-l-primary-500 rounded-lg text-sm focus:ring-2 focus:ring-primary-500/20"
                  placeholder="25.00"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Precio de Comparación
              </label>
              <div className="relative w-full">
                <input
                  type="number"
                  name="compare_at_price"
                  value={form.compare_at_price}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500/20"
                  placeholder="Ej. 35.00"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Se muestra tachado (descuento).</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Costo por Artículo
              </label>
              <div className="relative w-full">
                <input
                  type="number"
                  name="cost_price"
                  value={form.cost_price}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500/20"
                  placeholder="Ej. 15.00"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Privado. Solo para tus métricas.</p>
            </div>
          </div>
        </div>

        {/* Images */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h3 className="font-semibold text-gray-900">3. Imágenes Galería</h3>

          {form.images.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {form.images.map((url, i) => (
                <div
                  key={i}
                  className="relative w-20 h-20 rounded-lg overflow-hidden border group"
                >
                  <img
                    src={url}
                    alt={`Img ${i + 1}`}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute inset-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-xs font-bold"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          <label className="inline-flex items-center gap-2 px-4 py-2 border border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:border-primary-400 hover:text-primary-600 transition cursor-pointer bg-gray-50">
            {uploading ? "Subiendo..." : "📷 Añadir Imagen"}
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              disabled={uploading}
              className="hidden"
            />
          </label>
        </div>
        {/* Toggle Variations */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="hasVariations"
              checked={form.hasVariations}
              onChange={(e) => setForm(prev => ({ ...prev, hasVariations: e.target.checked }))}
              className="w-5 h-5 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
            />
            <span className="font-semibold text-gray-900">
              Este producto tiene múltiples opciones (Ej. Tallas, Colores, Sabores)
            </span>
          </label>
        </div>

        {form.hasVariations ? (
          <>
            {/* Option Matrix Builder */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4 relative z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-900">
                    4. Opciones de Variación
                  </h3>

                  {/* Tooltip */}
                  <div className="relative group flex items-center">
                    <div className="w-5 h-5 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center text-xs font-bold cursor-help hover:bg-primary-100 hover:text-primary-600 transition-colors">
                      ?
                    </div>
                    {/* TOOLTIP CONTENT */}
                    <div className="absolute left-1/2 bottom-full mb-2 -translate-x-1/2 w-72 p-3.5 bg-gray-900 text-white text-xs rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 pointer-events-none">
                      <p className="font-semibold mb-2 text-primary-400">
                        Cómo usar las Variaciones Avanzadas:
                      </p>
                      <ul className="space-y-1.5 text-gray-300 list-disc pl-4">
                        <li>
                          Crea opciones de la misma categoría (Ej.{" "}
                          <strong>Talla</strong> o <strong>Presentación</strong>).
                        </li>
                        <li>
                          Agrega todos los valores en el mismo campo,{" "}
                          <strong>separados por comas</strong> (Ej.{" "}
                          <span className="text-white">Blanco, Negro, Azul</span>).
                        </li>
                        <li>
                          Usa el botón abajo y el sistema cruzará todo
                          matemáticamente por ti.
                        </li>
                      </ul>
                      <div className="absolute left-1/2 bottom-0 shadow-lg -translate-x-1/2 translate-y-full border-[6px] border-transparent border-t-gray-900"></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {options.map((opt, i) => (
                  <div key={i} className="border border-gray-200 rounded-lg p-4 bg-white">
                    <div className="flex justify-between items-center mb-4">
                      <div className="w-1/3 mr-4">
                        <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">Opción {i + 1}</label>
                        <input
                          type="text"
                          value={opt.name}
                          onChange={(e) => handleOptionChange(i, "name", e.target.value)}
                          placeholder="Ej. Tamaño o Color"
                          className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-primary-500"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeOption(i)}
                        className="text-sm text-gray-500 hover:text-primary-600 font-medium transition-colors"
                      >
                        Eliminar
                      </button>
                    </div>
                    
                    <div>
                      <div className="w-full flex flex-wrap items-center gap-2 p-1.5 border border-gray-300 rounded-md bg-white focus-within:ring-1 focus-within:ring-primary-500">
                        {opt.values.map((val, vIdx) => (
                          <span key={vIdx} className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 border border-gray-200 text-gray-700 text-sm rounded-md shadow-sm">
                            {val}
                            <button
                              type="button"
                              onClick={() => {
                                 const newValues = opt.values.filter((_, idx) => idx !== vIdx);
                                 handleOptionChange(i, "values", newValues);
                              }}
                              className="text-gray-400 hover:text-gray-700 font-medium focus:outline-none"
                            >
                              ✕
                            </button>
                          </span>
                        ))}
                        <input
                          type="text"
                          placeholder={opt.values.length === 0 ? "Escribe y presiona Enter o Coma" : "Agregar..."}
                          className="flex-1 min-w-[150px] px-2 py-1 outline-none text-sm bg-transparent placeholder-gray-400"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ',') {
                              e.preventDefault();
                              const val = e.target.value.trim().replace(/,$/, '');
                              if (val && !opt.values.includes(val)) {
                                handleOptionChange(i, "values", [...opt.values, val]);
                              }
                              e.target.value = "";
                            }
                          }}
                          onBlur={(e) => {
                              const val = e.target.value.trim().replace(/,$/, '');
                              if (val && !opt.values.includes(val)) {
                                handleOptionChange(i, "values", [...opt.values, val]);
                              }
                              e.target.value = "";
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2">
                 <button
                   type="button"
                   onClick={addOption}
                   className="text-sm text-gray-700 font-medium hover:text-gray-900 border border-gray-300 bg-white px-4 py-2 rounded-lg shadow-sm hover:bg-gray-50 transition-colors inline-block"
                 >
                   Agregar otra opción
                 </button>
              </div>
            </div>

            {/* Matrix Result Table */}
            {form.variations.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 mt-6 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-200 bg-gray-50/50">
                    <h3 className="font-semibold text-gray-800 text-sm tracking-wide uppercase">VISTA PREVIA</h3>
                </div>
                <div className="overflow-x-auto p-4">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="text-gray-500 border-b border-gray-100">
                      <tr>
                        <th className="font-medium pb-3 pr-4">variante</th>
                        <th className="font-medium pb-3 px-3 w-36">Precio</th>
                        <th className="font-medium pb-3 px-3 w-32">Cantidad</th>
                        <th className="font-medium pb-3 pl-3 w-40">Código SKU</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {form.variations.map((v, i) => {
                        let parsedCombo = {};
                        let label = v.attribute_value;
                        try {
                          parsedCombo = JSON.parse(v.attribute_value);
                          label = Object.entries(parsedCombo)
                            .map(([, val]) => `${val}`)
                            .join(" / ");
                        } catch {
                          // Silently fall back to raw value for legacy records
                        }

                        return (
                          <tr key={i} className="hover:bg-gray-50 transition-colors">
                            <td className="py-3 pr-4 font-medium text-gray-900 border-l-2 border-transparent">
                                <div className="flex items-center gap-3">
                                   <div className="w-9 h-9 flex-shrink-0 rounded border border-gray-200 bg-gray-50 flex items-center justify-center text-gray-400 text-xs overflow-hidden shadow-sm">
                                      {form.images.length > 0 ? (
                                        <img src={form.images[0]} alt="Variante" loading="lazy" className="w-full h-full object-cover" />
                                      ) : '📷'}
                                   </div>
                                   {label}
                                </div>
                            </td>
                            <td className="py-3 px-3">
                              <div className="relative">
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                                  <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={v.v_price ?? (parseFloat(form.price) + parseFloat(v.price_modifier || 0))}
                                    onChange={(e) =>
                                      handleVariationFieldChange(i, "v_price", e.target.value)
                                    }
                                    className="w-full pl-7 pr-2 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
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
                                className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                              />
                            </td>
                            <td className="py-3 pl-3 border-r-2 border-transparent">
                              <input
                                type="text"
                                value={v.sku}
                                onChange={(e) =>
                                  handleVariationFieldChange(i, "sku", e.target.value)
                                }
                                placeholder="Ej. REF01"
                                className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                              />
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
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            {/* Simple Inventory */}
            <h3 className="font-semibold text-gray-900">4. Inventario</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stock Disponible *</label>
                <input
                  type="number"
                  name="simpleStock"
                  value={form.simpleStock}
                  onChange={handleChange}
                  min="0"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500/20 text-sm"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">SKU (Opcional)</label>
                <input
                  type="text"
                  name="simpleSku"
                  value={form.simpleSku}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500/20 text-sm"
                  placeholder="Ej: KIT-001"
                />
              </div>
            </div>
          </div>
        )}

        {/* Submit */}
        <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
          <button
            type="submit"
            disabled={loading || uploading || (form.hasVariations && form.variations.length === 0)}
            className="px-6 py-2.5 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition disabled:opacity-50 text-sm"
          >
            {loading
              ? "Guardando..."
              : isEditing
                ? "Guardar Cambios"
                : "Crear Producto"}
          </button>
          <button
            type="button"
            onClick={() => navigate("/store/products")}
            className="px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm"
          >
            Cancelar
          </button>
          {form.hasVariations && form.variations.length === 0 && (
            <span className="text-xs text-red-500 ml-auto">
              Genera al menos 1 variación para continuar.
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
