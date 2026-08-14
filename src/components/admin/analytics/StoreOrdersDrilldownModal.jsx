import { useState, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import { getStoreOrdersDetailAPI } from "../../../services/api";

export default function StoreOrdersDrilldownModal({ isOpen, onClose, storeId, period = "30d", fromDate, toDate }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchStoreOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = { store_id: storeId, period };
      if (fromDate) params.from = fromDate;
      if (toDate) params.to = toDate;

      const res = await getStoreOrdersDetailAPI(params);
      if (res.data?.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error("Error cargando órdenes de la tienda:", err);
    } finally {
      setLoading(false);
    }
  }, [storeId, period, fromDate, toDate]);

  useEffect(() => {
    if (isOpen && storeId) {
      fetchStoreOrders();
    }
  }, [isOpen, storeId, fetchStoreOrders]);

  if (!isOpen) return null;

  const orders = data?.orders || [];
  const storeName = data?.storeName || "Comercio";

  const filteredOrders = orders.filter((ord) => {
    const term = searchTerm.toLowerCase();
    const orderId = (ord.order_id || "").toLowerCase();
    const clientName = (ord.client_name || "").toLowerCase();
    const clientEmail = (ord.client_email || "").toLowerCase();
    return orderId.includes(term) || clientName.includes(term) || clientEmail.includes(term);
  });

  const renderStatusBadge = (statusStr) => {
    const st = (statusStr || "").toLowerCase();
    if (st === "approved" || st === "paid" || st === "completed" || st === "delivered") {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm">
          ✓ {statusStr}
        </span>
      );
    }
    if (st === "under_review" || st === "pending" || st === "processing") {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm">
          ⏳ {statusStr}
        </span>
      );
    }
    return (
      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm">
        ✕ {statusStr}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/85 animate-fadeIn">
      <div className="bg-fx-panel border border-fx-line-strong rounded-xl p-6 max-w-5xl w-full max-h-[90vh] overflow-y-auto relative">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-fx-line mb-5 gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#c3ff00]/10 border border-fx-accent/30 flex items-center justify-center text-fx-accent text-xl font-bold">
              🏪
            </div>
            <div>
              <h3 className="text-lg font-bold text-fx-text">Desglose de Órdenes de {storeName}</h3>
              <p className="text-fx-muted text-xs">
                {orders.length} historial de intentos y pedidos en el período seleccionado
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Buscar por ID u odontólogo..."
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
            Consultando registros granulares de órdenes para {storeName}...
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-16 text-center text-fx-muted text-xs">
            No se encontraron pedidos correspondientes a los criterios introducidos.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-fx-line text-fx-faint uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-3">ID Orden</th>
                  <th className="py-3 px-3">Fecha / Hora</th>
                  <th className="py-3 px-3">Cliente / Odontólogo</th>
                  <th className="py-3 px-3">Método Pago</th>
                  <th className="py-3 px-3 text-right">Monto ($ USD)</th>
                  <th className="py-3 px-3 text-center">Estado Pago</th>
                  <th className="py-3 px-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-500/10 text-fx-muted">
                {filteredOrders.map((ord) => (
                  <tr key={ord.order_id} className="hover:bg-purple-900/30 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-fx-accent">
                      #{ord.order_id.slice(0, 8).toUpperCase()}
                    </td>
                    <td className="py-3 px-3 text-fx-muted">
                      {new Date(ord.created_at).toLocaleString("es-VE")}
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-bold text-fx-text block">{ord.client_name}</span>
                      <span className="text-[10px] text-fx-muted font-mono">{ord.client_email}</span>
                    </td>
                    <td className="py-3 px-3 font-semibold text-fx-faint uppercase">
                      {ord.payment_method}
                    </td>
                    <td className="py-3 px-3 text-right font-semibold text-fx-text">
                      ${parseFloat(ord.store_total_usd || 0).toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {renderStatusBadge(ord.payment_status)}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => {
                          onClose();
                          navigate(`/admin/orders/${ord.order_id}`);
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

        {/* Footer */}
        <div className="pt-4 mt-4 border-t border-fx-line text-right">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-fx-text rounded-xl text-xs font-bold transition-all shadow-lg"
          >
            Cerrar Desglose
          </button>
        </div>
      </div>
    </div>
  );
}

StoreOrdersDrilldownModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  storeId: PropTypes.string,
  period: PropTypes.string,
  fromDate: PropTypes.string,
  toDate: PropTypes.string
};
