import { Link, useLocation } from 'react-router-dom';
import { navGroups, backToStoreIcon } from '../../../config/adminNavConfig';
import { useAdminStats } from '../../../context/AdminStatsContext';

export default function AdminSidebar() {
  const location = useLocation();
  const { stats } = useAdminStats();

  // Helper para determinar si la ruta actual coincide (y aplicar la forma "pill")
  const isActive = (path) => {
    if (path === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname.startsWith(path);
  };

  const getLinkNotificationCount = (path) => {
    if (!stats) return 0;
    switch (path) {
      case "/admin/payment-approvals":
        return stats.pendingPayments;
      case "/admin/payouts":
        return stats.pendingPayouts;
      case "/admin/refunds":
        return stats.processingRefunds;
      case "/admin/product-moderation":
        return stats.pendingProducts;
      case "/admin/store-applications":
        return stats.pendingStores;
      case "/admin/rider-applications":
        return stats.pendingRiders;
      default:
        return 0;
    }
  };

  return (
    <aside
      className="w-[270px] flex-shrink-0 sticky top-[80px] md:top-[96px] h-[calc(100vh-80px)] md:h-[calc(100vh-96px)] flex-col hidden md:flex relative overflow-hidden"
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
        <Link to="/admin" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-lg bg-[#c3ff00] flex items-center justify-center shadow-lg shadow-[#c3ff00]/20 group-hover:shadow-[#c3ff00]/40 transition-shadow duration-300">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-5 h-5 text-[#531575]"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold tracking-widest text-white uppercase leading-tight">
              Dentix
            </span>
            <span className="text-[10px] font-medium tracking-[0.2em] text-[#c3ff00]/70 uppercase">
              Admin Panel
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
            {/* Group divider (between groups) */}
            {groupIndex > 0 && (
              <div className="mx-2 border-t border-white/[0.06] my-2" />
            )}
            {/* Group label */}
            <div className="px-4 pt-2 pb-1.5">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">
                {group.label}
              </p>
            </div>
            {/* Group links */}
            <ul className="space-y-0.5">
              {group.links.map((link) => {
                const active = isActive(link.path);
                const pendingCount = getLinkNotificationCount(link.path);
                return (
                  <li key={link.path}>
                    <Link
                      to={link.path}
                      className="flex items-center justify-between gap-3 px-4 py-2.5 text-[13px] font-medium rounded-xl transition-all duration-200 group relative"
                      style={{
                        background: active
                          ? 'linear-gradient(135deg, rgba(195,255,0,0.12) 0%, rgba(107,30,150,0.2) 100%)'
                          : 'transparent',
                        color: active ? '#ffffff' : 'rgba(255,255,255,0.55)',
                        borderLeft: active ? '3px solid #c3ff00' : '3px solid transparent',
                      }}
                      onMouseEnter={(e) => {
                        if (!active) {
                          e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                          e.currentTarget.style.color = 'rgba(255,255,255,0.9)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!active) {
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
          {backToStoreIcon}
          Volver a Tienda
        </Link>
      </div>
    </aside>
  );
}
