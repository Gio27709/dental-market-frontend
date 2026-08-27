import { useState, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import { getProductSalesDetailAPI } from "../../../services/api";
import usePaymentMethods from "../../../hooks/usePaymentMethods";
import ModalOverlay from "./ModalOverlay";

export default function ProductSalesDrilldownModal({ isOpen, onClose, productId, period = "30d", fromDate, toDate }) {
  const navigate = useNavigate();
  const { etiquetaDe } = usePaymentMethods();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchProductSales = useCallback(async () => {
    setLoading(true);
    try {
      const params = { product_id: productId, period };
      if (fromDate) params.from = fromDate;
      if (toDate) params.to = toDate;

      const res = await getProductSalesDetailAPI(params);
      if (res.data?.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error("Error cargando ventas del producto:", err);
    } finally {
      setLoading(false);
    }
  }, [productId, period, fromDate, toDate]);

  useEffect(() => {
    if (isOpen && productId) {
      fetchProductSales();
    }
  }, [isOpen, productId, fetchProductSales]);

  if (!isOpen) return null;

  const sales = data?.sales || [];
  const productName = data?.productName || "Producto Insumo";
  const imageUrl = data?.imageUrl;
  const storeName = data?.storeName || "Comercio";
  const categoryName = data?.categoryName || "Sin Categoría";
  const totalRevenue = parseFloat(data?.totalRevenueUsd || 0);
  const totalUnits = parseInt(data?.totalUnitsSold || 0, 10);
  const rating = parseFloat(data?.rating || 0);

  const filteredSales = sales.filter((s) => {
    const term = searchTerm.toLowerCase();
    const orderId = (s.order_id || "").toLowerCase();
    const clientName = (s.client_name || "").toLowerCase();
    const clientEmail = (s.client_email || "").toLowerCase();
    return orderId.includes(term) || clientName.includes(term) || clientEmail.includes(term);
  });

  return (
    <ModalOverlay>
      <div className="bg-fx-panel border border-fx-line-strong rounded-xl p-6 max-w-5xl w-full max-h-[90vh] overflow-y-auto relative">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-fx-line mb-5 gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-950 border border-fx-line-strong overflow-hidden flex items-center justify-center text-fx-faint text-xl font-bold flex-shrink-0">
              {imageUrl ? (
                <img src={imageUrl} alt={productName} className="w-full h-full object-cover" />
              ) : (
                "📦"
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                <h3 className="text-lg font-bold text-fx-text tracking-tight">{productName}</h3>
                <span className="text-[10px] font-semibold uppercase bg-purple-950 text-fx-faint px-2 py-0.5 rounded-full border border-fx-line-strong">
                  🏪 {storeName}
                </span>
                <span className="text-[10px] font-semibold uppercase bg-fx-pos/10 text-fx-pos px-2 py-0.5 rounded-full border border-fx-pos/20">
                  {categoryName}
                </span>
                {rating > 0 && (
                  <span className="text-fx-warn font-bold text-xs">★ {rating.toFixed(1)}</span>
                )}
              </div>
              <p className="text-fx-muted text-xs">
                Desglose analítico granular de ventas y compradores del insumo
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Buscar comprador u orden..."
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
            Consultando registros granulares de ventas para {productName}...
          </div>
        ) : (
          <div className="space-y-6">
            {/* Top KPI Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-fx-inset border border-fx-line rounded-2xl p-4">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-fx-faint block mb-1">Unidades Despachadas</span>
                <span className="text-2xl font-semibold text-fx-text">{totalUnits} unidades</span>
              </div>
              <div className="bg-fx-inset border border-fx-line rounded-2xl p-4">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-fx-faint block mb-1">Facturación Total USD</span>
                <span className="text-2xl font-semibold text-fx-accent">${totalRevenue.toFixed(2)}</span>
              </div>
              <div className="bg-fx-inset border border-fx-line rounded-2xl p-4">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-fx-faint block mb-1">Precio Unitario Promedio</span>
                <span className="text-2xl font-semibold text-fx-muted">${totalUnits > 0 ? (totalRevenue / totalUnits).toFixed(2) : "0.00"}</span>
              </div>
            </div>

            {/* Sales Table */}
            {filteredSales.length === 0 ? (
              <div className="py-16 text-center text-fx-muted text-xs">
                No se encontraron ventas para este producto en el período seleccionado.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-fx-line text-fx-faint uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-3">ID Orden</th>
                      <th className="py-3 px-3">Fecha / Hora</th>
                      <th className="py-3 px-3">Cliente / Odontólogo</th>
                      <th className="py-3 px-3 text-center">Unidades</th>
                      <th className="py-3 px-3 text-right">Precio Un. ($)</th>
                      <th className="py-3 px-3 text-right">Subtotal ($ USD)</th>
                      <th className="py-3 px-3 text-center">Método Pago</th>
                      <th className="py-3 px-3 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-purple-500/10 text-fx-muted">
                    {filteredSales.map((s) => (
                      <tr key={s.order_id} className="hover:bg-purple-900/30 transition-colors">
                        <td className="py-3 px-3 font-mono font-bold text-fx-accent">
                          #{s.order_id.slice(0, 8).toUpperCase()}
                        </td>
                        <td className="py-3 px-3 text-fx-muted">
                          {new Date(s.created_at).toLocaleString("es-VE")}
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-bold text-fx-text block">{s.client_name}</span>
                          <span className="text-[10px] text-fx-muted font-mono">{s.client_email}</span>
                        </td>
                        <td className="py-3 px-3 text-center font-semibold text-fx-text">
                          {s.quantity} un.
                        </td>
                        <td className="py-3 px-3 text-right text-fx-muted">
                          ${parseFloat(s.unit_price || 0).toFixed(2)}
                        </td>
                        <td className="py-3 px-3 text-right font-semibold text-fx-accent">
                          ${parseFloat(s.subtotal_usd || 0).toFixed(2)}
                        </td>
                        <td className="py-3 px-3 text-center font-semibold text-fx-faint uppercase">
                          {etiquetaDe(s.payment_method)}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => {
                              onClose();
                              navigate(`/admin/orders/${s.order_id}`);
                            }}
                            className="text-[11px] font-semibold text-fx-faint hover:text-fx-accent transition-colors"
                          >
                            Ver pedido completo →
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

ProductSalesDrilldownModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  productId: PropTypes.string,
  period: PropTypes.string,
  fromDate: PropTypes.string,
  toDate: PropTypes.string
};
