import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  getInventoryAlertsAPI,
  upsertInventoryAlertAPI,
  updateInventoryAlertAPI,
  deleteInventoryAlertAPI,
  preloadRestockCartAPI,
  getProducts,
} from "../../services/api";

export default function ClinicInventory() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [catalogProducts, setCatalogProducts] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [editItem, setEditItem] = useState(null);

  // Form states
  const [criticalThreshold, setCriticalThreshold] = useState(5);
  const [currentEstimatedStock, setCurrentEstimatedStock] = useState(10);
  const [unitType, setUnitType] = useState("cajas");

  const navigate = useNavigate();

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const res = await getInventoryAlertsAPI();
      if (res.data.success) {
        setItems(res.data.data);
      }
    } catch (err) {
      console.error("Error al cargar inventario:", err);
      toast.error("Error al obtener inventario de la clínica.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchCatalog = async (query) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setCatalogProducts([]);
      return;
    }

    try {
      // El catálogo responde en `data`, no en `products`.
      const res = await getProducts({ search: query, limit: 6 });
      setCatalogProducts(res.data?.data || []);
    } catch (err) {
      console.error("Error buscando en catálogo:", err);
    }
  };

  const handleSaveAlert = async () => {
    if (!selectedProduct) {
      toast.error("Selecciona un producto del catálogo");
      return;
    }

    try {
      const res = await upsertInventoryAlertAPI({
        productId: selectedProduct.id,
        criticalThreshold,
        currentEstimatedStock,
        unitType,
      });

      if (res.data.success) {
        toast.success(res.data.message);
        setIsAddModalOpen(false);
        setSelectedProduct(null);
        setSearchQuery("");
        setCatalogProducts([]);
        fetchInventory();
      }
    } catch (err) {
      console.error("Error guardando alerta:", err);
      toast.error("No se pudo guardar la alerta de inventario.");
    }
  };

  const handleUpdateAlert = async () => {
    if (!editItem) return;

    try {
      const res = await updateInventoryAlertAPI(editItem.id, {
        criticalThreshold,
        currentEstimatedStock,
        unitType,
      });

      if (res.data.success) {
        toast.success("Stock actualizado correctamente.");
        setIsEditModalOpen(false);
        setEditItem(null);
        fetchInventory();
      }
    } catch (err) {
      console.error("Error actualizando alerta:", err);
      toast.error("No se pudo actualizar el insumo.");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("¿Deseas remover este insumo del monitoreo de inventario de tu clínica?")) return;

    try {
      const res = await deleteInventoryAlertAPI(id);
      if (res.data.success) {
        toast.success(res.data.message);
        fetchInventory();
      }
    } catch (err) {
      console.error("Error al eliminar item:", err);
      toast.error("Error al eliminar.");
    }
  };

  const handleRestockSingle = async (item) => {
    try {
      const qty = Math.max(item.criticalThreshold * 2, 2);
      const res = await preloadRestockCartAPI([
        { productId: item.productId, quantity: qty },
      ]);

      if (res.data.success) {
        toast.success(`"${item.productName}" cargado en tu carrito.`);
        navigate("/cart");
      }
    } catch (err) {
      console.error("Error al reponer:", err);
      toast.error("No se pudo reponer el insumo.");
    }
  };

  const openEditModal = (item) => {
    setEditItem(item);
    setCriticalThreshold(item.criticalThreshold);
    setCurrentEstimatedStock(item.currentEstimatedStock);
    setUnitType(item.unitType);
    setIsEditModalOpen(true);
  };

  return (
    <div className="space-y-8">
      {/* ── Header (Stitch Style) ── */}
      <div className="bg-white p-8 rounded-3xl border border-[#cdc3d4]/20 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#541a97]"></span>
            <span className="text-xs font-bold text-[#541a97]/80 tracking-widest uppercase">
              Inventario Clínico
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-[#111c2c] tracking-tight flex items-center gap-3">
            <span className="material-symbols-outlined text-[32px] text-[#541a97]" style={{ fontVariationSettings: "'FILL' 1" }}>
              inventory_2
            </span>
            Mi Inventario Clínico
          </h1>
          <p className="text-base text-[#4b4452] mt-1 max-w-xl">
            Gestiona los insumos de tu clínica y configura los umbrales de stock crítico para recompra automática.
          </p>
        </div>

        <button
          onClick={() => {
            setSelectedProduct(null);
            setCriticalThreshold(5);
            setCurrentEstimatedStock(10);
            setUnitType("cajas");
            setIsAddModalOpen(true);
          }}
          className="flex items-center justify-center gap-2 px-6 py-3.5 bg-[#541a97] hover:bg-[#6c38b0] text-white rounded-2xl font-bold text-sm shadow-md transition-all cursor-pointer"
        >
          <span className="material-symbols-outlined text-[20px]">add_box</span>
          <span>Monitorear Nuevo Insumo</span>
        </button>
      </div>

      {/* ── TABLA DE INVENTARIO ── */}
      <div className="bg-white rounded-3xl border border-[#cdc3d4]/20 overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 text-center text-[#4b4452] font-medium">Cargando inventario de la clínica...</div>
        ) : items.length === 0 ? (
          <div className="p-16 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-[#541a97]/5 border border-[#541a97]/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-[32px] text-[#541a97]">
                inventory_2
              </span>
            </div>
            <h3 className="text-lg font-bold text-[#111c2c]">No hay insumos registrados</h3>
            <p className="text-sm text-[#4b4452] max-w-md mx-auto">
              Presiona el botón &quot;Monitorear Nuevo Insumo&quot; para seleccionar los productos que utilizas en tu consultorio y fijar tus alertas.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#f0f3ff] border-b border-[#cdc3d4]/20 text-xs font-bold text-[#111c2c] uppercase tracking-wider">
                  <th className="p-5">Insumo / Producto</th>
                  <th className="p-5">Tienda Proveedora</th>
                  <th className="p-5">Estado de Stock</th>
                  <th className="p-5">Stock Estimado</th>
                  <th className="p-5">Umbral Crítico</th>
                  <th className="p-5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#cdc3d4]/20 text-sm">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-[#f0f3ff]/40 transition-colors">
                    <td className="p-5">
                      <div className="flex items-center gap-3">
                        <img
                          src={item.productImage || "/placeholder.png"}
                          alt={item.productName}
                          className="w-12 h-12 object-cover rounded-xl border border-[#cdc3d4]/30"
                        />
                        <div>
                          <p className="font-bold text-[#111c2c]">{item.productName}</p>
                          <p className="text-xs text-[#4b4452]">${item.productPrice.toFixed(2)} / unidad</p>
                        </div>
                      </div>
                    </td>

                    <td className="p-5 text-[#4b4452]">
                      <div className="flex items-center gap-1.5 text-xs font-medium">
                        <span className="material-symbols-outlined text-[16px] text-[#4b4452]">storefront</span>
                        <span>{item.storeName || "Tienda Registrada"}</span>
                      </div>
                    </td>

                    <td className="p-5">
                      {item.stockStatus === "CRITICAL" && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-[#ba1a1a]/10 text-[#ba1a1a] border border-[#ba1a1a]/30">
                          <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>error</span>
                          <span>🚨 Stock Crítico</span>
                        </span>
                      )}
                      {item.stockStatus === "WARNING" && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-[#ffddb9]/40 text-[#7a4b00] border border-[#ffb961]/40">
                          <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>info</span>
                          <span>⚠️ Advertencia</span>
                        </span>
                      )}
                      {item.stockStatus === "HEALTHY" && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-[#006d37]/10 text-[#006d37] border border-[#006d37]/30">
                          <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                          <span>🟢 Saludable</span>
                        </span>
                      )}
                    </td>

                    <td className="p-5 font-bold text-[#111c2c]">
                      {item.currentEstimatedStock} {item.unitType}
                    </td>

                    <td className="p-5 text-[#4b4452] font-semibold">
                      ≤ {item.criticalThreshold} {item.unitType}
                    </td>

                    <td className="p-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleRestockSingle(item)}
                          className="px-4 py-2 bg-[#541a97] hover:bg-[#6c38b0] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                          title="Reponer insumo en el carrito"
                        >
                          <span className="material-symbols-outlined text-[16px]">shopping_cart</span>
                          <span>Reponer</span>
                        </button>

                        <button
                          onClick={() => openEditModal(item)}
                          className="p-2 text-[#4b4452] hover:text-[#541a97] hover:bg-[#f0f3ff] rounded-xl transition-colors cursor-pointer"
                          title="Editar"
                        >
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>

                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-2 text-[#ba1a1a] hover:bg-[#ba1a1a]/10 rounded-xl transition-colors cursor-pointer"
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
          </div>
        )}
      </div>

      {/* ── MODAL MONITOREAR NUEVO INSUMO ── */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-[#cdc3d4]/30">
            <div className="flex items-center justify-between border-b border-[#cdc3d4]/20 pb-4">
              <h3 className="text-lg font-bold text-[#111c2c] flex items-center gap-2">
                <span className="material-symbols-outlined text-[#541a97]">add_box</span>
                Monitorear Insumo Clínico
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-[#4b4452] hover:text-[#111c2c]">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Buscador */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#111c2c]">
                Buscar Insumo en el Catálogo de FORCEPX
              </label>
              <div className="relative">
                <span className="material-symbols-outlined text-[#4b4452] absolute left-3.5 top-3 text-[20px]">search</span>
                <input
                  type="text"
                  placeholder="Ej. Resina Filtek, Anestésico 2%..."
                  value={searchQuery}
                  onChange={(e) => handleSearchCatalog(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-[#f9f9ff] border border-[#cdc3d4]/40 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#541a97]/30 focus:border-[#541a97]"
                />
              </div>

              {catalogProducts.length > 0 && (
                <div className="max-h-40 overflow-y-auto border border-[#cdc3d4]/30 rounded-2xl divide-y divide-[#cdc3d4]/20 bg-white">
                  {catalogProducts.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => {
                        setSelectedProduct(p);
                        setCatalogProducts([]);
                        setSearchQuery(p.name);
                      }}
                      className={`p-3 flex items-center gap-3 cursor-pointer hover:bg-[#f0f3ff] ${
                        selectedProduct?.id === p.id ? "bg-[#f0f3ff] font-bold" : ""
                      }`}
                    >
                      <img src={p.images?.[0] || "/placeholder.png"} alt={p.name} className="w-9 h-9 rounded-lg object-cover" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-[#111c2c] truncate">{p.name}</p>
                        <p className="text-[10px] text-[#4b4452]">${p.price?.toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Valores de umbral */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-[#111c2c]">Stock Actual Estimado</label>
                <input
                  type="number"
                  min="0"
                  value={currentEstimatedStock}
                  onChange={(e) => setCurrentEstimatedStock(e.target.value)}
                  className="w-full mt-1.5 px-3 py-2.5 bg-[#f9f9ff] border border-[#cdc3d4]/40 rounded-2xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#541a97]/30"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#111c2c]">Umbral Crítico de Alerta</label>
                <input
                  type="number"
                  min="0"
                  value={criticalThreshold}
                  onChange={(e) => setCriticalThreshold(e.target.value)}
                  className="w-full mt-1.5 px-3 py-2.5 bg-[#f9f9ff] border border-[#cdc3d4]/40 rounded-2xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#541a97]/30"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-[#111c2c]">Tipo de Unidad</label>
              <select
                value={unitType}
                onChange={(e) => setUnitType(e.target.value)}
                className="w-full mt-1.5 px-3 py-2.5 bg-[#f9f9ff] border border-[#cdc3d4]/40 rounded-2xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#541a97]/30"
              >
                <option value="cajas">Cajas</option>
                <option value="unidades">Unidades</option>
                <option value="frascos">Frascos</option>
                <option value="paquetes">Paquetes</option>
                <option value="jeringas">Jeringas</option>
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-3">
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="px-5 py-2.5 border border-[#cdc3d4]/40 rounded-2xl text-xs font-bold text-[#4b4452] hover:bg-[#f0f3ff]"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveAlert}
                className="px-6 py-2.5 bg-[#541a97] hover:bg-[#6c38b0] text-white rounded-2xl text-xs font-bold shadow-md cursor-pointer"
              >
                Guardar Insumo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL EDITAR STOCK ── */}
      {isEditModalOpen && editItem && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-[#cdc3d4]/30">
            <div className="flex items-center justify-between border-b border-[#cdc3d4]/20 pb-3">
              <h3 className="text-base font-bold text-[#111c2c]">Editar Stock: {editItem.productName}</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-[#4b4452] hover:text-[#111c2c]">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-[#111c2c]">Stock Actual Estimado</label>
                <input
                  type="number"
                  min="0"
                  value={currentEstimatedStock}
                  onChange={(e) => setCurrentEstimatedStock(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-[#f9f9ff] border border-[#cdc3d4]/40 rounded-2xl text-sm font-semibold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#111c2c]">Umbral Crítico</label>
                <input
                  type="number"
                  min="0"
                  value={criticalThreshold}
                  onChange={(e) => setCriticalThreshold(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-[#f9f9ff] border border-[#cdc3d4]/40 rounded-2xl text-sm font-semibold"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 border border-[#cdc3d4]/40 rounded-2xl text-xs font-bold text-[#4b4452]"
              >
                Cancelar
              </button>
              <button
                onClick={handleUpdateAlert}
                className="px-5 py-2 bg-[#541a97] hover:bg-[#6c38b0] text-white rounded-2xl text-xs font-bold shadow-md cursor-pointer"
              >
                Actualizar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
