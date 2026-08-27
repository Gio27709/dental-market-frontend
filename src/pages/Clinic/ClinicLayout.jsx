import { Outlet, NavLink, Link } from "react-router-dom";
import { ClinicMembershipProvider, useClinicMembership } from "../../context/ClinicMembershipContext";

/**
 * Enlace "Mi membresía" con el estado al lado: días restantes, "en revisión", "vencida".
 * Lee el contexto que el propio layout provee más abajo.
 */
function MembershipNavLink() {
  const { loading, membership } = useClinicMembership();
  let pill = null;
  if (!loading && membership) {
    const { acceso, vigente } = membership;
    if (acceso.ok && vigente) {
      const d = vigente.dias_restantes;
      pill = { text: `${d} ${d === 1 ? "día" : "días"}`, cls: d <= 7 ? "bg-amber-100 text-amber-800" : "bg-[#6bfe9c]/50 text-[#005228]" };
    } else if (acceso.motivo === "cobro_desactivado") {
      pill = { text: "incluida", cls: "bg-[#6bfe9c]/50 text-[#005228]" };
    } else if (acceso.motivo === "en_revision") {
      pill = { text: "en revisión", cls: "bg-amber-100 text-amber-800" };
    } else {
      pill = { text: "activar", cls: "bg-red-100 text-red-700" };
    }
  }
  return (
    <NavLink
      to="/clinic/membership"
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium text-sm transition-all duration-200 ${
          isActive
            ? "bg-[#541a97]/10 text-[#541a97] font-bold shadow-xs"
            : "text-[#4b4452] hover:bg-[#f0f3ff] hover:text-[#111c2c]"
        }`
      }
    >
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
  );
}

export default function ClinicLayout() {
  return (
    <ClinicMembershipProvider>
    <div className="min-h-screen font-sans" style={{ backgroundColor: "#f9f9ff", color: "#111c2c" }}>
      <div className="max-w-[1440px] mx-auto flex min-h-screen relative">
        
        {/* ── SideNavBar (Stitch Clinical Precision Design) ── */}
        <aside className="w-64 flex-shrink-0 bg-[#f9f9ff] border-r border-[#cdc3d4]/30 flex flex-col py-4 gap-2 z-20">
          
          {/* Brand / Header */}
          <div className="px-6 py-6 border-b border-[#cdc3d4]/20 mb-2">
            <div className="bg-[#541a97]/5 rounded-2xl p-4 flex flex-col gap-2 shadow-xs border border-[#541a97]/10">
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
            <NavLink
              to="/clinic"
              end
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium text-sm transition-all duration-200 ${
                  isActive
                    ? "bg-[#541a97]/10 text-[#541a97] font-bold shadow-xs"
                    : "text-[#4b4452] hover:bg-[#f0f3ff] hover:text-[#111c2c]"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}>
                    dashboard
                  </span>
                  <span>Resumen Ejecutivo</span>
                </>
              )}
            </NavLink>

            <NavLink
              to="/clinic/inventory"
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium text-sm transition-all duration-200 ${
                  isActive
                    ? "bg-[#541a97]/10 text-[#541a97] font-bold shadow-xs"
                    : "text-[#4b4452] hover:bg-[#f0f3ff] hover:text-[#111c2c]"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}>
                    inventory_2
                  </span>
                  <span>Mi Inventario Clínico</span>
                </>
              )}
            </NavLink>

            <NavLink
              to="/clinic/subscriptions"
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium text-sm transition-all duration-200 ${
                  isActive
                    ? "bg-[#541a97]/10 text-[#541a97] font-bold shadow-xs"
                    : "text-[#4b4452] hover:bg-[#f0f3ff] hover:text-[#111c2c]"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}>
                    sync
                  </span>
                  <span>Suscripciones Recurrentes</span>
                </>
              )}
            </NavLink>

            <NavLink
              to="/clinic/profitability"
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium text-sm transition-all duration-200 ${
                  isActive
                    ? "bg-[#541a97]/10 text-[#541a97] font-bold shadow-xs"
                    : "text-[#4b4452] hover:bg-[#f0f3ff] hover:text-[#111c2c]"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}>
                    payments
                  </span>
                  <span>Rentabilidad &amp; Gastos</span>
                </>
              )}
            </NavLink>

            <div className="pt-2 mt-2 border-t border-[#cdc3d4]/20">
              <MembershipNavLink />
            </div>
          </nav>

          {/* Footer Actions */}
          <div className="px-4 py-4 mt-auto border-t border-[#cdc3d4]/20 space-y-1">
            <Link
              to="/account"
              className="flex items-center gap-3 px-4 py-3 text-[#4b4452] hover:bg-[#f0f3ff] hover:text-[#111c2c] transition-all duration-200 rounded-xl text-sm font-medium"
            >
              <span className="material-symbols-outlined text-[20px]">arrow_back</span>
              <span>Volver a Mi Cuenta</span>
            </Link>
          </div>
        </aside>

        {/* ── Main Content Canvas ── */}
        <main className="flex-1 p-6 md:p-8 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
    </ClinicMembershipProvider>
  );
}
