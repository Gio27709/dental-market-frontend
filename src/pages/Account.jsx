import { useAuth } from "../context/AuthContext";

export default function Account() {
  const { user } = useAuth();

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden p-6 border border-gray-100">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Información Básica</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 block">
            Correo Electrónico
          </label>
          <div className="bg-gray-50 px-4 py-3 rounded-md border border-gray-100">
            <p className="font-medium text-gray-800">{user.email}</p>
          </div>
        </div>

        <div>
           <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 block">
            Rol en Dental Market
          </label>
          <div className="bg-gray-50 px-4 py-3 rounded-md border border-gray-100">
            <p className="font-medium text-primary-700 capitalize flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary-500"></span>
              {user.role}
            </p>
          </div>
        </div>
        
        {/* Placeholder para más información (ej: Nombre, Teléfono, etc.) */}
        <div>
           <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 block">
            Nombre Completo
          </label>
          <div className="bg-gray-50 px-4 py-3 rounded-md border border-gray-100 text-gray-500 italic text-sm">
            {user.firstName ? `${user.firstName} ${user.lastName}` : "No configurado"}
          </div>
        </div>
      </div>
    </div>
  );
}
