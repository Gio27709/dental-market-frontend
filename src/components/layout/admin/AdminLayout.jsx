import { useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";

export default function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const isActive = (path) => {
    if (path === '/admin') return location.pathname === '/admin';
    return location.pathname.startsWith(path);
  };

  const navLinks = [
    { name: 'Dashboard General', path: '/admin', icon: 'dashboard' },
    { name: 'Aprobar Pagos', path: '/admin/payment-approvals', icon: 'payments' },
    { name: 'Todos los Pedidos', path: '/admin/orders', icon: 'shopping_bag' },
    { name: 'Moderar Productos', path: '/admin/product-moderation', icon: 'inventory_2' },
    { name: 'Solicitudes de Tienda', path: '/admin/store-applications', icon: 'add_business' },
  ];

  return (
    <div className="flex bg-gray-50 min-h-screen">
      {/* Desktop Sidebar */}
      <AdminSidebar />

      {/* Mobile Top Bar */}
      <div className="fixed top-0 left-0 right-0 z-[90] md:hidden bg-[#163152] text-white h-14 flex items-center justify-between px-4 shadow-lg">
        <button onClick={() => setMobileOpen(true)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </button>
        <span className="font-semibold text-sm tracking-wide">DentalMarket <span className="font-light opacity-70">Admin</span></span>
        <Link to="/" className="p-2 hover:bg-white/10 rounded-lg transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
          </svg>
        </Link>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[200] md:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-[270px] bg-white shadow-2xl flex flex-col">
            <div className="h-14 flex items-center justify-between px-5 bg-[#163152] text-white">
              <span className="font-semibold text-sm">Panel Admin</span>
              <button onClick={() => setMobileOpen(false)} className="p-1.5 hover:bg-white/10 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto py-3">
              {navLinks.map((link) => {
                const active = isActive(link.path);
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 mx-2 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                      active ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <span className={`material-symbols-outlined ${active ? 'text-blue-600' : 'text-gray-400'}`} style={{fontSize: '20px'}}>{link.icon}</span>
                    {link.name}
                  </Link>
                );
              })}
            </nav>
            <div className="border-t border-gray-100 p-3">
              <Link to="/" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 rounded-xl transition-colors">
                <span className="material-symbols-outlined text-gray-400" style={{fontSize: '20px'}}>arrow_back</span>
                Volver a Tienda
              </Link>
            </div>
          </div>
        </div>
      )}
      
      {/* Main Content */}
      <div className="flex-1 overflow-y-auto bg-gray-50/50 pt-16 md:pt-0 p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
