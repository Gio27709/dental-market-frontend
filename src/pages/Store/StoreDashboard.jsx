import { Link } from "react-router-dom";

export default function StoreDashboard() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-8 text-center max-w-3xl mx-auto mt-10">
      <div className="text-5xl mb-4">🏪</div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        Bienvenido a tu Panel de Tienda
      </h2>
      <p className="text-gray-500 mb-6">
        Aquí puedes gestionar tus productos, órdenes y perfil.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Link
          to="/store/products"
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition text-sm font-medium shadow-sm"
        >
          📦 Ver Productos
        </Link>
        <Link
          to="/store/orders"
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm font-medium"
        >
          🛒 Ver Órdenes
        </Link>
      </div>
    </div>
  );
}
