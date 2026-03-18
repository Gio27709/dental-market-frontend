import { useAuth } from "../../context/AuthContext";

export default function AdminDashboard() {
  const { user } = useAuth();
  
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 max-w-4xl">
      <h1 className="text-3xl font-semibold text-gray-900 mb-2">Bienvenido, {user?.firstName || 'Administrador'}</h1>
      <p className="text-gray-500 mb-8">
        Desde este panel puedes gestionar todas las operaciones de DentalMarket. Selecciona una opción del menú lateral para comenzar.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Placeholder Stat Cards */}
        <div className="bg-blue-50/50 rounded-xl p-6 border border-blue-100">
          <h3 className="text-sm font-medium text-blue-600 mb-1">Pedidos Pendientes</h3>
          <p className="text-3xl font-bold text-gray-900">--</p>
        </div>
        
        <div className="bg-green-50/50 rounded-xl p-6 border border-green-100">
          <h3 className="text-sm font-medium text-green-600 mb-1">Pagos por Aprobar</h3>
          <p className="text-3xl font-bold text-gray-900">--</p>
        </div>
        
        <div className="bg-purple-50/50 rounded-xl p-6 border border-purple-100">
          <h3 className="text-sm font-medium text-purple-600 mb-1">Productos Nuevos</h3>
          <p className="text-3xl font-bold text-gray-900">--</p>
        </div>
      </div>
    </div>
  );
}
