import { useState, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import { getCategoryProductsDetailAPI } from "../../../services/api";
import ModalOverlay from "./ModalOverlay";

export default function CategorySalesDrilldownModal({ isOpen, onClose, categoryName, period = "30d", fromDate, toDate, onSelectProduct }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchCategoryProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = { category_name: categoryName, period };
      if (fromDate) params.from = fromDate;
      if (toDate) params.to = toDate;

      const res = await getCategoryProductsDetailAPI(params);
      if (res.data?.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error("Error cargando productos de la categoría:", err);
    } finally {
      setLoading(false);
    }
  }, [categoryName, period, fromDate, toDate]);

  useEffect(() => {
    if (isOpen && categoryName) {
      fetchCategoryProducts();
    }
  }, [isOpen, categoryName, fetchCategoryProducts]);

  if (!isOpen) return null;

  const products = data?.products || [];
  const totalRevenue = parseFloat(data?.totalRevenueUsd || 0);
  const totalUnits = parseInt(data?.totalUnitsSold || 0, 10);

  const filteredProducts = products.filter((p) => {
    const term = searchTerm.toLowerCase();
    const pName = (p.product_name || "").toLowerCase();
    const stName = (p.store_name || "").toLowerCase();
    return pName.includes(term) || stName.includes(term);
  });

  return (
    <ModalOverlay>
      <div className="bg-fx-panel border border-fx-line-strong rounded-xl p-6 max-w-5xl w-full max-h-[90vh] overflow-y-auto relative">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-fx-line mb-5 gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-fx-pos/10 border border-fx-pos/30 flex items-center justify-center text-fx-pos text-xl font-bold">
              🏷️
            </div>
            <div>
              <h3 className="text-lg font-bold text-fx-text tracking-tight">Desglose de Categoría: {categoryName}</h3>
              <p className="text-fx-muted text-xs">
                {products.length} insumos comercializados en esta categoría durante el período
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Buscar producto o tienda..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-purple-950/80 border border-fx-line-strong rounded-xl px-3 py-1.5 text-xs text-fx-text outline-none w-56 placeholder-gray-400"
            />
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-fx-inset hover:bg-fx-raised border border-fx-line-strong flex items-center justify-center text-fx-muted font-bold transition-all"
            >
              ✕
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center text-fx-faint text-sm font-semibold animate-pulse">
            Consultando registros granulares de insumos para {categoryName}...
          </div>
        ) : (
          <div className="space-y-6">
            {/* KPI Banner */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-fx-inset border border-fx-line rounded-2xl p-4">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-fx-faint block mb-1">Insumos Diferentes</span>
                <span className="text-2xl font-semibold text-fx-text">{products.length} productos</span>
              </div>
              <div className="bg-fx-inset border border-fx-line rounded-2xl p-4">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-fx-faint block mb-1">Unidades Vendidas</span>
                <span className="text-2xl font-semibold text-fx-text">{totalUnits} unidades</span>
              </div>
              <div className="bg-fx-inset border border-fx-line rounded-2xl p-4">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-fx-faint block mb-1">Facturación Total USD</span>
                <span className="text-2xl font-semibold text-fx-accent">${totalRevenue.toFixed(2)}</span>
              </div>
            </div>

            {/* Products Table */}
            {filteredProducts.length === 0 ? (
              <div className="py-16 text-center text-fx-muted text-xs">
                No se encontraron productos para esta categoría en el período seleccionado.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-fx-line text-fx-faint uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-3">Producto / Insumo</th>
                      <th className="py-3 px-3">Comercio Vendedor</th>
                      <th className="py-3 px-3 text-center">Unidades</th>
                      <th className="py-3 px-3 text-center">Órdenes</th>
                      <th className="py-3 px-3 text-right">Facturación ($ USD)</th>
                      <th className="py-3 px-3 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-purple-500/10 text-fx-muted">
                    {filteredProducts.map((p) => (
                      <tr key={p.product_id} className="hover:bg-purple-900/30 transition-colors">
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-purple-950 border border-fx-line-strong overflow-hidden flex items-center justify-center text-fx-faint text-base font-bold flex-shrink-0">
                              {p.image_url ? (
                                <img src={p.image_url} alt={p.product_name} className="w-full h-full object-cover" />
                              ) : (
                                "📦"
                              )}
                            </div>
                            <span className="font-bold text-fx-text block">{p.product_name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <span className="text-xs font-semibold text-fx-faint bg-purple-950 px-2.5 py-1 rounded-lg border border-fx-line inline-block">
                            🏪 {p.store_name}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center font-semibold text-fx-text">
                          {p.total_units_sold} un.
                        </td>
                        <td className="py-3 px-3 text-center text-fx-muted font-semibold">
                          {p.orders_count} pedidos
                        </td>
                        <td className="py-3 px-3 text-right font-semibold text-fx-accent">
                          ${parseFloat(p.total_revenue_usd || 0).toFixed(2)}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => {
                              onClose();
                              if (onSelectProduct) onSelectProduct(p.product_id);
                            }}
                            className="px-3 py-1 rounded-xl bg-[#6b1e96]/10 hover:bg-[#6b1e96]/20 text-fx-accent font-semibold text-[11px] transition-all border border-fx-accent/30 shadow-md"
                          >
                            🔍 Ver Compradores →
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="pt-4 mt-4 border-t border-fx-line text-right">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#6b1e96] hover:bg-[#531575] text-white rounded-xl text-xs font-bold transition-all shadow-lg"
          >
            Cerrar Desglose
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
}

CategorySalesDrilldownModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  categoryName: PropTypes.string,
  period: PropTypes.string,
  fromDate: PropTypes.string,
  toDate: PropTypes.string,
  onSelectProduct: PropTypes.func
};
