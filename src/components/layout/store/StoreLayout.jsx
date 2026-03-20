import { useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import StoreSidebar from "./StoreSidebar";
import toast from "react-hot-toast";

export default function StoreLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const isActive = (path) => {
    if (path === '/store') return location.pathname === '/store';
    return location.pathname.startsWith(path);
  };

  const handleComingSoon = (e) => {
    e.preventDefault();
    toast('Próximamente', { icon: '🚧' });
    setMobileOpen(false);
  };

  const storeLinks = [
    { name: 'Resumen', path: '/store', icon: 'dashboard' },
    { name: 'Productos', path: '/store/products', icon: 'inventory_2' },
    { name: 'Órdenes', path: '/store/orders', icon: 'shopping_bag' },
    { name: 'Mi Perfil', path: '/store/profile', icon: 'person' },
  ];

  const soonLinks = [
    { name: 'Clientes', icon: 'group' },
    { name: 'Reportes', icon: 'description' },
    { name: 'Descuentos', icon: 'sell' },
    { name: 'Configuración', icon: 'settings' },
  ];

  return (
    <div className="flex bg-gray-50 min-h-screen">
      {/* Desktop Sidebar */}
      <StoreSidebar />

      {/* Mobile Top Bar */}
      <div className="fixed top-0 left-0 right-0 z-[90] md:hidden bg-[#6b1e96] text-white h-14 flex items-center justify-between px-4 shadow-lg">
        <button onClick={() => setMobileOpen(true)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </button>
        <span className="font-semibold text-sm tracking-wide">DentalMarket <span className="font-light opacity-70">Store</span></span>
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
            <div className="h-14 flex items-center justify-between px-5 bg-[#6b1e96] text-white">
              <span className="font-semibold text-sm">Panel Tienda</span>
              <button onClick={() => setMobileOpen(false)} className="p-1.5 hover:bg-white/10 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto py-3">
              {storeLinks.map((link) => {
                const active = isActive(link.path);
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 mx-2 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                      active ? 'bg-purple-50 text-[#6b1e96]' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <span className={`material-symbols-outlined ${active ? 'text-[#6b1e96]' : 'text-gray-400'}`} style={{fontSize: '20px'}}>{link.icon}</span>
                    {link.name}
                  </Link>
                );
              })}

              <div className="mx-4 my-3 border-t border-gray-100" />
              <p className="px-6 text-[10px] font-bold uppercase text-gray-400 tracking-widest mb-1">Próximamente</p>
              {soonLinks.map((link) => (
                <a
                  key={link.name}
                  href="#"
                  onClick={handleComingSoon}
                  className="flex items-center gap-3 mx-2 px-4 py-2.5 rounded-xl text-sm text-gray-500 hover:bg-gray-50 transition-colors opacity-70"
                >
                  <span className="material-symbols-outlined text-gray-400" style={{fontSize: '18px'}}>{link.icon}</span>
                  {link.name}
                  <span className="ml-auto bg-gray-200 text-gray-500 text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-md">Pronto</span>
                </a>
              ))}
            </nav>
            <div className="border-t border-gray-100 p-3">
              <Link to="/" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 rounded-xl transition-colors">
                <span className="material-symbols-outlined text-gray-400" style={{fontSize: '20px'}}>arrow_back</span>
                Volver a Inicio
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
