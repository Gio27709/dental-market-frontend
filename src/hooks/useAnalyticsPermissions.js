import { useAuth } from "../context/AuthContext";
import { ROLE_PERMISSIONS_MAP } from "../config/rolesPermissions.js";

/**
 * Hook de React para evaluar permisos del módulo analítico en el frontend
 */
export default function useAnalyticsPermissions() {
  const { user } = useAuth() || {};
  const rawRole = (user?.role || "").toLowerCase();
  
  // Normalizar nombres de roles administrativos (super_admin, administrator, owner, admin)
  const normRole = (rawRole === "super_admin" || rawRole === "administrator" || rawRole === "owner" || rawRole === "admin") 
    ? "admin" 
    : rawRole;

  const userPermissions = ROLE_PERMISSIONS_MAP[normRole] || [];

  /**
   * Verifica si el usuario actual tiene acceso a una pestaña o departamento analítico
   * @param {string} tabKey - Clave de la pestaña ('executive', 'financials', 'sales', 'logistics', 'growth', 'support', 'audience', 'funnel', 'content')
   * @returns {boolean}
   */
  const canViewTab = (tabKey) => {
    if (userPermissions.includes("*") || normRole === "admin" || normRole === "owner") return true;

    const tabPermissionMap = {
      executive: "analytics:overview:view",
      financials: "analytics:financials:view",
      sales: "analytics:sales:view",
      logistics: "analytics:logistics:view",
      // Misma área departamental que `logistics`: cambia la profundidad, no el derecho.
      logisticsDeep: "analytics:logistics:view",
      growth: "analytics:growth:view",
      support: "analytics:support:view",
      // Misma área departamental que `support`: cambia la profundidad, no el derecho.
      supportDeep: "analytics:support:view",
      audience: "analytics:audience:view",
      funnel: "analytics:funnel:view",
      content: "analytics:content:view",
      notifications: "analytics:notifications:view",
      reputation: "analytics:reputation:view",
      demand: "analytics:demand:view",
      catalog: "analytics:catalog:view",
      treasury: "analytics:treasury:view",
      onboarding: "analytics:onboarding:view",
      promotions: "analytics:promotions:view",
      b2b: "analytics:b2b:view",
    };

    const requiredPerm = tabPermissionMap[tabKey];
    return requiredPerm ? userPermissions.includes(requiredPerm) : false;
  };

  /**
   * Verifica si el usuario tiene permiso para exportar reportes en CSV o Excel
   * @returns {boolean}
   */
  const canExport = () => {
    if (userPermissions.includes("*") || normRole === "admin" || normRole === "owner") return true;
    return (
      userPermissions.includes("analytics:export:csv") ||
      userPermissions.includes("analytics:export:excel")
    );
  };

  return {
    role: normRole,
    userPermissions,
    canViewTab,
    canExport,
    isFullAdmin: userPermissions.includes("*") || normRole === "admin"
  };
}
