import PropTypes from "prop-types";
import useAnalyticsPermissions from "../../../hooks/useAnalyticsPermissions";
import AccessDeniedView from "./AccessDeniedView";

/**
 * Componente Guardián de Permisos para Pestañas del Frontend
 * Envuelve cualquier vista o tab analítico. Si el usuario tiene acceso, renderiza los children;
 * si no tiene acceso, renderiza automáticamente la pantalla AccessDeniedView.
 */
export default function AnalyticsPermissionGuard({ tabKey, areaName, children }) {
  const { canViewTab } = useAnalyticsPermissions();

  if (!canViewTab(tabKey)) {
    return <AccessDeniedView requiredArea={areaName || tabKey} />;
  }

  return <>{children}</>;
}

AnalyticsPermissionGuard.propTypes = {
  tabKey: PropTypes.string.isRequired,
  areaName: PropTypes.string,
  children: PropTypes.node.isRequired
};
