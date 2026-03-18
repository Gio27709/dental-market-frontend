import { Link, useLocation } from 'react-router-dom';

export default function AdminSidebar() {
  const location = useLocation();

  // Helper para determinar si la ruta actual coincide (y aplicar la forma "pill")
  const isActive = (path) => {
    if (path === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname.startsWith(path);
  };

  const navLinks = [
    {
      name: 'Dashboard General',
      path: '/admin',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
        </svg>
      )
    },
    {
      name: 'Aprobar Pagos',
      path: '/admin/payment-approvals',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
      )
    },
    {
      name: 'Todos los Pedidos',
      path: '/admin/orders',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
        </svg>
      )
    },
    {
      name: 'Moderar Productos',
      path: '/admin/product-moderation',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H2.25c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
        </svg>
      )
    }
  ];

  return (
    <aside className="w-[260px] flex-shrink-0 bg-[#f8f9fa] border-r border-gray-200 h-full flex flex-col hidden md:flex">
      
      {/* Branding / Logo Area */}
      <div className="h-[60px] flex items-center px-6 mb-4 mt-2">
        <Link to="/admin" className="text-xl font-medium tracking-tight text-gray-800 flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-primary-600 flex items-center justify-center">
            <span className="text-white text-xs font-bold">D</span>
          </div>
          <span className="font-semibold">DentalMarket<span className="font-light text-gray-500 text-sm ml-1">Admin</span></span>
        </Link>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 pr-3 overflow-y-auto">
        <ul className="space-y-1">
          {navLinks.map((link) => {
            const active = isActive(link.path);
            return (
              <li key={link.path}>
                <Link
                  to={link.path}
                  className={`flex items-center gap-3 px-6 py-2.5 text-[14px] font-medium transition-colors rounded-r-full
                    ${active 
                      ? 'bg-blue-100/50 text-blue-700' 
                      : 'text-gray-600 hover:bg-gray-100/80 hover:text-gray-900'
                    }
                  `}
                >
                  <div className={`${active ? 'text-blue-600' : 'text-gray-400'}`}>
                    {link.icon}
                  </div>
                  {link.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom Area: Back to Store */}
      <div className="p-4 border-t border-gray-200/60 pr-3">
        <Link 
          to="/" 
          className="flex items-center gap-3 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100/80 rounded-r-full transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-400">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
          Volver a Tienda
        </Link>
      </div>
    </aside>
  );
}
