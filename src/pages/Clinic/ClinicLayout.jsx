import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { Outlet, NavLink, Link, useLocation } from "react-router-dom";
import { ClinicMembershipProvider, useClinicMembership } from "../../context/ClinicMembershipContext";
import { AutoTour, useTour, TOUR_IDS } from "../../components/tour";

const NAV_ITEMS = [
  { to: "/clinic", end: true, icon: "dashboard", label: "Resumen Ejecutivo" },
  { to: "/clinic/inventory", icon: "inventory_2", label: "Mi Inventario Clínico" },
  { to: "/clinic/subscriptions", icon: "sync", label: "Suscripciones Recurrentes" },
  { to: "/clinic/profitability", icon: "payments", label: "Rentabilidad & Gastos" },
];

const navLinkCls = ({ isActive }) =>
  `flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium text-sm transition-all duration-200 ${
    isActive
      ? "bg-[#541a97]/10 text-[#541a97] font-bold shadow-xs"
      : "text-[#4b4452] hover:bg-[#f0f3ff] hover:text-[#111c2c]"
  }`;

/** Estado de la membresía resumido en una píldora: días restantes, "en revisión", "vencida". */
function useMembershipPill() {
  const { loading, membership } = useClinicMembership();
  if (loading || !membership) return null;
  const { acceso, vigente } = membership;
  if (acceso.ok && vigente) {
    const d = vigente.dias_restantes;
    return { text: `${d} ${d === 1 ? "día" : "días"}`, cls: d <= 7 ? "bg-amber-100 text-amber-800" : "bg-[#6bfe9c]/50 text-[#005228]" };
  }
  if (acceso.motivo === "cobro_desactivado") return { text: "incluida", cls: "bg-[#6bfe9c]/50 text-[#005228]" };
  if (acceso.motivo === "en_revision") return { text: "en revisión", cls: "bg-amber-100 text-amber-800" };
  return { text: "activar", cls: "bg-red-100 text-red-700" };
}

/**
 * Marca, enlaces y acciones del panel. Se usa en la barra lateral de escritorio y en el
 * cajón del móvil; `onNavigate` cierra el cajón al elegir una opción.
 */
function SidebarContent({ onNavigate, onStartTour }) {
  const pill = useMembershipPill();
  return (
    <>
      {/* Brand / Header */}
      <div className="px-6 py-6 border-b border-[#cdc3d4]/20 mb-2">
        <div data-tour="clinic-brand" className="bg-[#541a97]/5 rounded-2xl p-4 flex flex-col gap-2 shadow-xs border border-[#541a97]/10">
          <div className="flex items-center gap-3">
            <div className="bg-white p-2 rounded-xl border border-[#541a97]/10 shadow-xs">
              <span className="material-symbols-outlined text-[#541a97] text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                medical_services
              </span>
            </div>
            <h1 className="font-bold text-[17px] text-[#541a97] tracking-tight">Gestión Clínica</h1>
          </div>
          <div className="mt-1">
            <span className="bg-[#6bfe9c]/50 text-[#005228] text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              B2B Proactivo
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 space-y-1">
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end} data-tour={`clinic-nav-${item.to}`} onClick={onNavigate} className={navLinkCls}>
            {({ isActive }) => (
              <>
                <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}

        <div className="pt-2 mt-2 border-t border-[#cdc3d4]/20">
          <NavLink to="/clinic/membership" data-tour="clinic-nav-/clinic/membership" onClick={onNavigate} className={navLinkCls}>
            {({ isActive }) => (
              <>
                <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}>
                  workspace_premium
                </span>
                <span className="flex-1">Mi Membresía</span>
                {pill && <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${pill.cls}`}>{pill.text}</span>}
              </>
            )}
          </NavLink>
        </div>
      </nav>

      {/* Footer Actions */}
      <div className="px-4 py-4 mt-auto border-t border-[#cdc3d4]/20 space-y-1">
        <button
          type="button"
          onClick={onStartTour}
          className="w-full flex items-center gap-3 px-4 py-3 text-[#4b4452] hover:bg-[#f0f3ff] hover:text-[#111c2c] transition-all duration-200 rounded-xl text-sm font-medium"
        >
          <span className="material-symbols-outlined text-[20px]">help</span>
          <span>Ver guía del panel</span>
        </button>
        <Link
          to="/account"
          data-tour="clinic-back-account"
          onClick={onNavigate}
          className="flex items-center gap-3 px-4 py-3 text-[#4b4452] hover:bg-[#f0f3ff] hover:text-[#111c2c] transition-all duration-200 rounded-xl text-sm font-medium"
        >
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          <span>Volver a Mi Cuenta</span>
        </Link>
      </div>
    </>
  );
}
SidebarContent.propTypes = { onNavigate: PropTypes.func, onStartTour: PropTypes.func.isRequired };

/** Barra superior del móvil: menú ☰, marca y acceso directo a la membresía con su estado. */
function MobileTopBar({ onOpenMenu }) {
  const pill = useMembershipPill();
  return (
    <div className="fixed top-0 inset-x-0 z-[90] md:hidden h-14 bg-white/95 backdrop-blur border-b border-[#cdc3d4]/30 flex items-center justify-between gap-2 px-2 shadow-xs">
      <button
        type="button"
        data-tour="clinic-menu"
        aria-label="Abrir menú del panel"
        onClick={onOpenMenu}
        className="p-2.5 rounded-xl text-[#541a97] hover:bg-[#541a97]/5 transition-colors"
      >
        <span className="material-symbols-outlined text-[24px]">menu</span>
      </button>
      <div className="flex items-center gap-2 min-w-0">
        <span className="material-symbols-outlined text-[#541a97] text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
          medical_services
        </span>
        <span className="font-bold text-[15px] text-[#541a97] tracking-tight truncate">Gestión Clínica</span>
      </div>
      <Link
        to="/clinic/membership"
        data-tour="clinic-mobile-membership"
        aria-label="Mi membresía"
        className="flex items-center gap-1 p-2 rounded-xl text-[#541a97] hover:bg-[#541a97]/5 transition-colors"
      >
        <span className="material-symbols-outlined text-[22px]">workspace_premium</span>
        {pill && <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${pill.cls}`}>{pill.text}</span>}
      </Link>
    </div>
  );
}
MobileTopBar.propTypes = { onOpenMenu: PropTypes.func.isRequired };

export default function ClinicLayout() {
  const { startTour } = useTour();
  const { pathname } = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Cualquier navegación (enlace del cajón, redirección de la puerta, tour) cierra el cajón.
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Con el cajón abierto: sin scroll de fondo y Esc lo cierra.
  useEffect(() => {
    if (!mobileOpen) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => e.key === "Escape" && setMobileOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [mobileOpen]);

  const iniciarGuia = () => {
    setMobileOpen(false);
    startTour(TOUR_IDS.CLINICA);
  };

  return (
    <ClinicMembershipProvider>
    <AutoTour id={TOUR_IDS.CLINICA} delay={1200} />
    <div className="min-h-screen font-sans" style={{ backgroundColor: "#f9f9ff", color: "#111c2c" }}>
      <MobileTopBar onOpenMenu={() => setMobileOpen(true)} />

      {/* ── Cajón del móvil ── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[200] md:hidden" role="dialog" aria-modal="true" aria-label="Menú del panel clínico">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-xs" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-[280px] max-w-[85vw] bg-[#f9f9ff] shadow-2xl flex flex-col overflow-y-auto pt-6">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              aria-label="Cerrar menú"
              className="absolute top-3 right-3 p-1.5 rounded-lg text-[#4b4452] hover:bg-[#f0f3ff] z-10"
            >
              <span className="material-symbols-outlined text-[22px]">close</span>
            </button>
            <SidebarContent onNavigate={() => setMobileOpen(false)} onStartTour={iniciarGuia} />
          </aside>
        </div>
      )}

      <div className="max-w-[1440px] mx-auto flex min-h-screen relative">

        {/* ── SideNavBar (Stitch Clinical Precision Design) — solo escritorio ── */}
        <aside className="hidden md:flex w-64 flex-shrink-0 bg-[#f9f9ff] border-r border-[#cdc3d4]/30 flex-col py-4 gap-2 z-20">
          <SidebarContent onStartTour={iniciarGuia} />
        </aside>

        {/* ── Main Content Canvas ── */}
        <main className="flex-1 min-w-0 px-4 pb-8 pt-[4.5rem] md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
    </ClinicMembershipProvider>
  );
}
