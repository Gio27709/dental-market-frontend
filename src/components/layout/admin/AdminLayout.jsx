import { useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";
import { navGroups, backToStoreIcon } from "../../../config/adminNavConfig";
import { AdminStatsProvider, useAdminStats } from "../../../context/AdminStatsContext";
import useHomeSections from "../../../hooks/useHomeSections";

function AdminLayoutContent() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { stats } = useAdminStats();
  const { sections } = useHomeSections();
  const headerSection = sections?.header || {};
  const brandName = headerSection.brand_name || "Forcepx";
  const brandLogo = headerSection.brand_logo || "";

  const isActive = (path) => {
    if (path === '/admin') return location.pathname === '/admin';
    return location.pathname.startsWith(path);
  };

  const isWideRoute = location.pathname.startsWith('/admin/analytics');

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
      case "/admin/support":
        return stats.pendingTickets;
      case "/admin/promotions":
        return stats.pendingDiscounts;
      case "/admin/penalties":
        return stats.pendingPenalties;
      default:
        return 0;
    }
  };

  return (
    <div className="flex min-h-screen relative" style={{ background: '#f1ecf6' }}>
      {/* Desktop Sidebar */}
      <AdminSidebar />

      {/* Mobile Top Bar */}
      <div
        className="fixed top-0 left-0 right-0 z-[90] md:hidden text-white h-14 flex items-center justify-between px-4 shadow-lg"
        style={{ background: 'linear-gradient(135deg, #531575 0%, #6b1e96 100%)' }}
      >
        <button onClick={() => setMobileOpen(true)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </button>
        <div className="flex items-center gap-2">
          {brandLogo ? (
            <div className="w-6 h-6 flex items-center justify-center">
              <img
                src={brandLogo}
                alt="Logo"
                className="w-full h-full object-contain rounded-md"
                onError={(e) => {
                  e.target.style.display = "none";
                  const sibling = e.target.nextSibling;
                  if (sibling) sibling.style.display = "flex";
                }}
              />
              <div className="hidden w-full h-full rounded-md bg-[#c3ff00] items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 text-[#531575]">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </div>
            </div>
          ) : (
            <div className="w-6 h-6 rounded-md bg-[#c3ff00] flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 text-[#531575]">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </div>
          )}
          <span className="font-bold text-sm tracking-widest uppercase">{brandName} <span className="font-normal text-[#c3ff00]/70 text-[10px] tracking-[0.15em]">Admin</span></span>
        </div>
        <Link to="/" className="p-2 hover:bg-white/10 rounded-lg transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
          </svg>
        </Link>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[200] md:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div
            className="absolute left-0 top-0 h-full w-[280px] shadow-2xl flex flex-col"
            style={{ background: 'linear-gradient(180deg, #1a0a2e 0%, #2d1452 50%, #1a0a2e 100%)' }}
          >
            {/* Drawer Header */}
            <div className="h-14 flex items-center justify-between px-5" style={{ background: 'rgba(0,0,0,0.2)' }}>
              <div className="flex items-center gap-2.5">
                {brandLogo ? (
                  <div className="w-7 h-7 flex items-center justify-center shadow-lg shadow-[#c3ff00]/10">
                    <img
                      src={brandLogo}
                      alt="Logo"
                      className="w-full h-full object-contain rounded-lg"
                      onError={(e) => {
                        e.target.style.display = "none";
                        const sibling = e.target.nextSibling;
                        if (sibling) sibling.style.display = "flex";
                      }}
                    />
                    <div className="hidden w-full h-full rounded-lg bg-[#c3ff00] items-center justify-center shadow-lg shadow-[#c3ff00]/20">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-[#531575]">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                      </svg>
                    </div>
                  </div>
                ) : (
                  <div className="w-7 h-7 rounded-lg bg-[#c3ff00] flex items-center justify-center shadow-lg shadow-[#c3ff00]/20">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-[#531575]">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                  </div>
                )}
                <div className="flex flex-col">
                  <span className="text-sm font-bold tracking-widest text-white uppercase leading-tight">{brandName}</span>
                  <span className="text-[9px] font-medium tracking-[0.15em] text-[#c3ff00]/60 uppercase">Admin Panel</span>
                </div>
              </div>
              <button onClick={() => setMobileOpen(false)} className="p-1.5 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Divider */}
            <div className="mx-4 border-t border-white/[0.06]" />

            {/* Navigation (Grouped ─ same source as desktop sidebar) */}
            <nav className="flex-1 overflow-y-auto py-3 px-2 admin-scrollbar">
              {navGroups.map((group, groupIndex) => (
                <div key={group.label}>
                  {/* Group divider (between groups) */}
                  {groupIndex > 0 && (
                    <div className="mx-2 border-t border-white/[0.06] my-2" />
                  )}
                  {/* Group label */}
                  <p className="px-4 pt-1 pb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white/25">
                    {group.label}
                  </p>
                  {/* Group links */}
                  {group.links.map((link) => {
                    const active = isActive(link.path);
                    const pendingCount = getLinkNotificationCount(link.path);
                    return (
                      <Link
                        key={link.path}
                        to={link.path}
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center justify-between gap-2 mx-1 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200"
                        style={{
                          background: active
                            ? 'linear-gradient(135deg, rgba(195,255,0,0.12) 0%, rgba(107,30,150,0.2) 100%)'
                            : 'transparent',
                          color: active ? '#ffffff' : 'rgba(255,255,255,0.5)',
                          borderLeft: active ? '3px solid #c3ff00' : '3px solid transparent',
                        }}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div
                            className="flex-shrink-0"
                            style={{
                              color: active ? '#c3ff00' : 'rgba(255,255,255,0.3)',
                            }}
                          >
                            {link.icon}
                          </div>
                          <span className="truncate">{link.name}</span>
                        </div>
                        {pendingCount > 0 && (
                          <span
                            className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black text-white transition-all duration-300 border border-white/20 select-none"
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
                    );
                  })}
                </div>
              ))}
            </nav>

            {/* Back to Store */}
            <div className="border-t border-white/[0.06] p-3">
              <Link
                to="/"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-200"
                style={{ color: 'rgba(255,255,255,0.45)' }}
              >
                <div className="flex-shrink-0" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  {backToStoreIcon}
                </div>
                Volver a Tienda
              </Link>
            </div>
          </div>
        </div>
      )}
      
      {/* Main Content */}
      <div className="flex-1 pt-16 md:pt-6 p-4 md:p-8" style={{ background: '#f1ecf6' }}>
        {/* Analíticas trae su propio rail de áreas y rejillas de 4 columnas:
            con max-w-6xl las tablas y gráficas quedan estranguladas. */}
        <div className={isWideRoute ? 'max-w-[1720px] mx-auto' : 'max-w-6xl mx-auto'}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default function AdminLayout() {
  return (
    <AdminStatsProvider>
      <AdminLayoutContent />
    </AdminStatsProvider>
  );
}
