/* eslint-disable react-refresh/only-export-components */
import PropTypes from "prop-types";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getMyClinicMembershipAPI } from "../services/api";

/**
 * Estado de la membresía del panel de Gestión Clínica, compartido por el layout (badge de
 * días restantes), el candado de rutas (`ClinicMembershipGate`) y la página de pago.
 *
 * Una sola petición a `/clinic-membership/me` por carga del panel; `refresh()` la repite
 * después de enviar un comprobante. El veredicto (`acceso.ok`) lo da el backend: aquí no
 * se recalcula nada, solo se refleja.
 */
const ClinicMembershipContext = createContext(null);

export function ClinicMembershipProvider({ children }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    try {
      setError(null);
      const res = await getMyClinicMembershipAPI();
      setData(res.data?.data || null);
    } catch (err) {
      console.error("[ClinicMembership] No se pudo cargar la membresía:", err);
      setError(err.response?.data?.error || "No se pudo consultar tu membresía.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({
      loading,
      error,
      membership: data,
      acceso: data?.acceso || null,
      tieneAcceso: data?.acceso?.ok === true,
      refresh,
    }),
    [data, loading, error, refresh]
  );

  return <ClinicMembershipContext.Provider value={value}>{children}</ClinicMembershipContext.Provider>;
}

ClinicMembershipProvider.propTypes = { children: PropTypes.node.isRequired };

export const useClinicMembership = () => {
  const ctx = useContext(ClinicMembershipContext);
  if (!ctx) throw new Error("useClinicMembership debe usarse dentro de ClinicMembershipProvider");
  return ctx;
};
