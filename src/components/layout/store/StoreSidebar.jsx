import { Link, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import PropTypes from "prop-types";
import { useStore } from "../../../context/StoreContext";

export default function StoreSidebar({ isProfileComplete = true }) {
  const location = useLocation();
  const { storeStats } = useStore();

  const getLinkNotificationCount = (path) => {
    if (!storeStats) return 0;
    switch (path) {
      case "/store/orders":
        return storeStats.pendingOrders;
      case "/store/penalties":
        return storeStats.pendingPenalties;
      default:
        return 0;
    }
  };


  const handleComingSoon = (e) => {
    e.preventDefault();
    toast('Próximamente', { icon: '🚧' });
  };

  const isActive = (path) => {
    if (path === '/store') {
      return location.pathname === '/store';
    }
    return location.pathname.startsWith(path);
  };

  const navGroups = [
    {
      label: 'Principal',
      links: [
        {
          name: 'Resumen',
          path: '/store',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
            </svg>
          )
        },
        {
          name: 'Productos',
          path: '/store/products',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H2.25c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
            </svg>
          )
        },
        {
          name: 'Órdenes',
          path: '/store/orders',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
            </svg>
          )
        },
        {
          name: 'Mi Billetera',
          path: '/store/wallet',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18-3a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6" />
            </svg>
          )
        },
        {
          name: 'Estadísticas',
          path: '/store/analytics',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
            </svg>
          )
        },
        {
          name: 'Descuentos',
          path: '/store/discounts',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6Z" />
            </svg>
          )
        },
      ]
    },
    {
      label: 'Logística',
      links: [
        {
          name: 'Repartidores',
          path: '/store/riders',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
            </svg>
          )
        },
        {
          name: 'Sanciones',
          path: '/store/penalties',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
          )
        },
        {
          name: 'Mi Perfil',
          path: '/store/profile',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
            </svg>
          )
        },
      ]
    },
  ];

  const soonLinks = [
    { name: 'Clientes', icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg> },
    { name: 'Configuración', icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 0 1 0 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 0 1 0-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg> },
  ];

  return (
    <aside
      className="w-[270px] flex-shrink-0 sticky top-0 h-screen flex-col hidden md:flex relative overflow-y-auto"
      style={{
        background: 'linear-gradient(180deg, #1a0a2e 0%, #2d1452 50%, #1a0a2e 100%)',
      }}
    >
      {/* Decorative glow orb */}
      <div
        className="absolute -top-20 -right-20 w-60 h-60 rounded-full opacity-15 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #c3ff00 0%, transparent 70%)' }}
      />

      {/* ── Branding / Logo Area ── */}
      <div className="px-6 pt-6 pb-4 relative z-10">
        <Link to="/store" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-lg bg-[#c3ff00] flex items-center justify-center shadow-lg shadow-[#c3ff00]/20 group-hover:shadow-[#c3ff00]/40 transition-shadow duration-300">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-[#531575]">
              <path d="M5.223 2.25h13.554a.75.75 0 0 1 .724.95l-.965 3.57a1.5 1.5 0 0 1-1.448 1.105H6.912a1.5 1.5 0 0 1-1.448-1.105l-.965-3.57a.75.75 0 0 1 .724-.95Z" />
              <path fillRule="evenodd" d="M3.087 9h17.826a.75.75 0 0 1 .743.858l-1.53 11.25a1.5 1.5 0 0 1-1.486 1.142H5.36a1.5 1.5 0 0 1-1.486-1.142L2.344 9.858A.75.75 0 0 1 3.087 9Z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold tracking-widest text-white uppercase leading-tight">
              Forcepx
            </span>
            <span className="text-[10px] font-medium tracking-[0.2em] text-[#c3ff00]/70 uppercase">
              Store Panel
            </span>
          </div>
        </Link>
      </div>

      {/* Divider */}
      <div className="mx-5 border-t border-white/[0.06] mb-2" />

      {/* ── Navigation Menu (Grouped) ── */}
      <nav className="flex-1 px-3 overflow-y-auto relative z-10 admin-scrollbar" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.15) transparent' }}>
        {navGroups.map((group, groupIndex) => (
          <div key={group.label}>
            {groupIndex > 0 && (
              <div className="mx-2 border-t border-white/[0.06] my-2" />
            )}
            <div className="px-4 pt-2 pb-1.5">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">
                {group.label}
              </p>
            </div>
            <ul className="space-y-0.5">
              {group.links.map((link) => {
                const active = isActive(link.path);
                const disabled = !isProfileComplete && link.path !== '/store/profile';
                const pendingCount = getLinkNotificationCount(link.path);

                return (
                  <li key={link.path}>
                    <Link
                      to={disabled ? '#' : link.path}
                      onClick={(e) => {
                        if (disabled) {
                          e.preventDefault();
                          toast.error("Debes completar tu perfil primero");
                        }
                      }}
                      className={`flex items-center justify-between gap-3 px-4 py-2.5 text-[13px] font-medium rounded-xl transition-all duration-200 group relative ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                      style={{
                        background: active
                          ? 'linear-gradient(135deg, rgba(195,255,0,0.12) 0%, rgba(107,30,150,0.2) 100%)'
                          : 'transparent',
                        color: active ? '#ffffff' : 'rgba(255,255,255,0.55)',
                        borderLeft: active ? '3px solid #c3ff00' : '3px solid transparent',
                      }}
                      onMouseEnter={(e) => {
                        if (!active && !disabled) {
                          e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                          e.currentTarget.style.color = 'rgba(255,255,255,0.9)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!active && !disabled) {
                          e.currentTarget.style.background = 'transparent';
                          e.currentTarget.style.color = 'rgba(255,255,255,0.55)';
                        }
                      }}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="transition-colors duration-200 flex-shrink-0"
                          style={{ color: active ? '#c3ff00' : 'rgba(255,255,255,0.35)' }}
                        >
                          {link.icon}
                        </div>
                        <span className="truncate">{link.name}</span>
                      </div>

                      {/* Active indicator dot */}
                      {active && pendingCount === 0 && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#c3ff00] shadow-[0_0_8px_rgba(195,255,0,0.6)]" />
                      )}

                      {/* Badge flame */}
                      {pendingCount > 0 && (
                        <span
                          className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black text-white transition-all duration-300 border border-white/20 select-none z-10"
                          style={{
                            background: 'linear-gradient(135deg, #ff0055 0%, #ff5500 50%, #ffcc00 100%)',
                            boxShadow: '0 0 14px rgba(255, 69, 0, 0.85), inset 0 1px 2px rgba(255, 255, 255, 0.45)',
                            textShadow: '0 1px 2px rgba(0,0,0,0.6)',
                          }}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            className="w-3.5 h-3.5 text-yellow-300 animate-bounce flex-shrink-0"
                          >
                            <path
                              fillRule="evenodd"
                              d="M12.969 2.138a1.5 1.5 0 0 0-1.938 0c-3.125 2.766-5.031 6.032-5.031 9.424 0 4.196 3.09 7.438 7.031 7.438s7.031-3.242 7.031-7.438c0-3.392-1.906-6.658-5.031-9.424ZM12 5.25c.342 0 .668.033.985.097a4.5 4.5 0 0 1 3.515 4.403c0 2.203-1.42 4.25-3.5 4.25s-3.5-2.047-3.5-4.25A4.5 4.5 0 0 1 12.015 5.25Z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span>{pendingCount}</span>
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}

            </ul>
          </div>
        ))}

        {/* ── Próximamente Section ── */}
        <div className="mx-2 border-t border-white/[0.06] my-2" />
        <div className="px-4 pt-2 pb-1.5">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/20">
            Próximamente
          </p>
        </div>
        <ul className="space-y-0.5">
          {soonLinks.map((link) => (
            <li key={link.name}>
              <a
                href="#"
                onClick={handleComingSoon}
                className="flex items-center gap-3 px-4 py-2.5 text-[13px] font-medium rounded-xl transition-all duration-200 opacity-40 hover:opacity-60"
                style={{ color: 'rgba(255,255,255,0.4)' }}
              >
                <div className="flex-shrink-0" style={{ color: 'rgba(255,255,255,0.2)' }}>
                  {link.icon}
                </div>
                <span className="truncate">{link.name}</span>
                <span className="ml-auto text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-white/[0.06] text-white/30">
                  Soon
                </span>
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {/* Divider */}
      <div className="mx-5 border-t border-white/[0.06] mt-2" />

      {/* ── Bottom Area: Back to Store ── */}
      <div className="p-4 relative z-10">
        <Link
          to="/"
          className="flex items-center gap-3 px-4 py-2.5 text-[13px] font-medium rounded-xl transition-all duration-200 group"
          style={{ color: 'rgba(255,255,255,0.5)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(195,255,0,0.08)';
            e.currentTarget.style.color = '#c3ff00';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = 'rgba(255,255,255,0.5)';
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 flex-shrink-0">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
          Volver a Inicio
        </Link>
      </div>
    </aside>
  );
}

StoreSidebar.propTypes = {
  isProfileComplete: PropTypes.bool,
};
