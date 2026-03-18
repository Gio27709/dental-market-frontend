import { Outlet, Link, useLocation } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { useCart } from "../../../context/CartContext";

export default function AccountLayout() {
  const { user, logout } = useAuth();
  const { wipeLocalCartOnly } = useCart();
  const location = useLocation();

  if (!user) return null;

  const isActive = (path) => {
    // Para rutas exactas o rutas hijas (como /account/orders/:id)
    if (path === "/account" && location.pathname === "/account") return true;
    if (path !== "/account" && location.pathname.startsWith(path)) return true;
    return false;
  };

  const menuItems = [
    {
      name: "Mi Perfil",
      path: "/account",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
        </svg>
      )
    },
    {
      name: "Mis Pedidos",
      path: "/account/orders",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
        </svg>
      )
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row gap-8">
      {/* Sidebar Fijo */}
      <aside className="w-full md:w-64 flex-shrink-0">
        <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-100">
          <div className="p-6 border-b border-gray-100 bg-gray-50">
            <h2 className="text-lg font-bold text-gray-900">Hola, {user.firstName || 'Usuario'}</h2>
            <p className="text-sm text-gray-500 capitalize">{user.role}</p>
          </div>
          
          <nav className="p-2 space-y-1">
            {menuItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${
                  isActive(item.path) 
                    ? "bg-primary-50 text-primary-700 font-medium" 
                    : "text-gray-700 hover:bg-gray-50 hover:text-primary-600"
                }`}
              >
                {item.icon}
                {item.name}
              </Link>
            ))}

            {/* Rutas Admin / Owner */}
            {user.role === 'admin' && (
              <>
                <div className="pt-4 pb-1 mx-4">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Administración</span>
                </div>
                <Link to="/admin" className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 hover:text-primary-600 rounded-md transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
                  </svg>
                  Dashboard General
                </Link>
                <Link to="/admin/orders" className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 hover:text-primary-600 rounded-md transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" />
                  </svg>
                  Todos los Pedidos
                </Link>
              </>
            )}

            {/* Rutas Store Owner */}
            {(user.role === 'store' || user.role === 'owner' || user.role === 'store/owner') && (
              <>
                <div className="pt-4 pb-1 mx-4">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Mi Tienda</span>
                </div>
                <Link to="/store" className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 hover:text-primary-600 rounded-md transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Z" />
                  </svg>
                  Panel Tienda
                </Link>
              </>
            )}
            
            <div className="pt-4 mt-2 border-t border-gray-100">
              <button 
                onClick={async () => {
                  await logout();
                  wipeLocalCartOnly();
                  localStorage.removeItem("dental_market_cart");
                  window.location.href = "/login"; // Force full reload navigation
                }}
                className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-600 px-4 py-2.5 rounded-md hover:bg-red-100 transition-colors font-medium text-sm"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
                </svg>
                Cerrar Sesión
              </button>
            </div>

          </nav>
        </div>
      </aside>

      {/* Main Content Area para las páginas (Perfil, Orders, etc) */}
      <main className="flex-1 min-w-0">
        <Outlet />
      </main>
    </div>
  );
}
