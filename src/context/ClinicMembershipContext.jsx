/* eslint-disable react-refresh/only-export-components */
import PropTypes from "prop-types";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getMyClinicMembershipAPI } from "../services/api";
import { socket } from "../lib/socket";

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

  // M8: cuando el admin aprueba, rechaza o revoca, llega un aviso `clinic_membership_*` por el
  // socket; se vuelve a consultar /me y el candado se abre (o se cierra) sin recargar.
  useEffect(() => {
    const onNotification = (n) => {
      if (typeof n?.type === "string" && n.type.startsWith("clinic_membership_")) refresh();
    };
    socket.on("notification", onNotification);
    return () => socket.off("notification", onNotification);
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
