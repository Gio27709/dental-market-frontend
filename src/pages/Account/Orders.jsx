import { useEffect } from "react";
import LoadingSkeleton from "../../components/LoadingSkeleton";
import { Link } from "react-router-dom";
import { useOrder } from "../../context/OrderContext";
import OrderCard from "../../components/orders/OrderCard";

export default function Orders() {
  const { orders, loading, error, fetchOrders } = useOrder();

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-[32px] font-bold tracking-tight" style={{ color: "#191c23" }}>
          Mis Órdenes
        </h1>
        <p className="text-sm mt-1" style={{ color: "#727785" }}>
          Rastrea tus suministros dentales, gestiona reórdenes y descarga facturas para tu clínica.
        </p>
      </div>

      {/* Content - Horizontal List */}
      <div className="space-y-4">
        {loading ? (
          <div className="space-y-4">
            {/* Usamos el skeleton original pero iterado horizontalmente si es posible. A modo simple, renderizamos múltiples */}
            <LoadingSkeleton variant="order-card" />
            <LoadingSkeleton variant="order-card" />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-[#dc2626] mb-4 font-medium">{error}</p>
            <button
              onClick={() => fetchOrders()}
              className="text-[#6b1e96] hover:text-[#531575] font-bold"
            >
              Reintentar
            </button>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl" style={{ boxShadow: "0 4px 24px rgba(107,30,150,0.04)" }}>
            <div className="text-5xl mb-5 opacity-80">📦</div>
            <h3 className="text-lg font-bold mb-2" style={{ color: "#191c23" }}>
              Aún no has realizado compras
            </h3>
            <p className="text-sm mb-8" style={{ color: "#727785" }}>
              Cuando realices tu primera orden, aparecerá aquí.
            </p>
            <Link
              to="/"
              className="inline-flex items-center px-6 py-3 text-[#191c23] font-bold rounded-xl transition-all duration-200"
              style={{ background: "#c3ff00" }}
            >
              Explorar Catálogo
            </Link>
          </div>
        ) : (
          orders.map((order) => <OrderCard key={order.id} order={order} />)
        )}
      </div>

      {/* Bottom promotional cards (Fast-Track & Support) */}
      {!loading && !error && orders.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
          {/* Fast-Track Card */}
          <div className="md:col-span-2 rounded-2xl p-8 flex flex-col justify-center items-start relative overflow-hidden" style={{ background: "linear-gradient(135deg, #6b1e96 0%, #531575 100%)" }}>
            <span className="material-symbols-outlined absolute right-[-20px] bottom-[-20px] text-white/5" style={{ fontSize: "200px" }}>package_2</span>
            
            <div className="relative z-10 w-full">
              <h3 className="text-2xl font-bold text-white mb-3">Reordena tu Inventario Frecuente</h3>
              <p className="text-white/80 text-sm max-w-sm mb-6">
                Reabastece los esenciales de tu clínica en un clic basado en tus compras anteriores.
              </p>
              <button className="px-5 py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider transition-opacity hover:opacity-90" style={{ background: "#c3ff00", color: "#191c23" }}>
                Reordenar Favoritos
              </button>
            </div>
          </div>

          {/* Assistance Card */}
          <div className="rounded-2xl p-8 flex flex-col items-center justify-center text-center shadow-sm" style={{ background: "#f2f3fd" }}>
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm">
              <span className="material-symbols-outlined text-[#6b1e96]">support_agent</span>
            </div>
            <h4 className="font-bold text-[#191c23] mb-2">¿Necesitas Asistencia?</h4>
            <p className="text-xs text-[#727785] mb-4">
              Nuestros expertos están listos para ayudarte con tus compras.
            </p>
            <Link to="#" className="text-sm font-bold underline" style={{ color: "#6b1e96" }}>
              Contactar Soporte
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
