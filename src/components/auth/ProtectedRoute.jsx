import PropTypes from "prop-types";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function ProtectedRoute({
  children,
  redirectTo = "/login",
  requiredRole = [],
}) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-xl text-gray-600">Cargando perfil...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <Navigate
        to={`${redirectTo}?redirect=${encodeURIComponent(location.pathname)}`}
        replace
      />
    );
  }

  if (requiredRole && requiredRole.length > 0) {
    if (!requiredRole.includes(user.role)) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center p-8">
            <h2 className="text-2xl font-bold text-red-600 mb-2">
              403 - Acceso Denegado
            </h2>
            <p className="text-gray-600">
              No tienes permisos suficientes para ver esta página.
            </p>
          </div>
        </div>
      );
    }
  }

  return children;
}

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
  redirectTo: PropTypes.string,
  requiredRole: PropTypes.arrayOf(PropTypes.string),
};
