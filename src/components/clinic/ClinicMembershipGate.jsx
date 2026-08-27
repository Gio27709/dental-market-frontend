import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useClinicMembership } from "../../context/ClinicMembershipContext";

/**
 * Candado de las páginas del panel clínico: sin membresía vigente, todo redirige a
 * /clinic/membership. Es solo comodidad de navegación — el candado real está en el backend
 * (`requireClinicAccess`), que devuelve 403 aunque alguien salte esta pantalla.
 */
export default function ClinicMembershipGate() {
  const { loading, tieneAcceso } = useClinicMembership();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-10 h-10 border-4 border-[#541a97]/20 border-t-[#541a97] rounded-full animate-spin" />
      </div>
    );
  }

  if (!tieneAcceso) {
    return <Navigate to="/clinic/membership" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
