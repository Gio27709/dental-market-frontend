import { useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useLocationContext } from "../hooks/useLocationContext";
import { updateMyProfileAPI } from "../services/api";

/**
 * BuyerStateSync — mantiene el estado del comprador en dos sitios:
 * el navegador (localStorage, vía LocationContext) y el perfil (user_metadata).
 *
 * - Al iniciar sesión sin estado en el navegador, se toma el del perfil.
 * - Cada vez que el usuario cambia su estado, se guarda en el perfil.
 *
 * No renderiza nada. Va dentro de AuthProvider y de LocationProvider.
 */
export default function BuyerStateSync() {
  const { user } = useAuth();
  const { buyerState, setManualLocation } = useLocationContext();
  const lastSynced = useRef(null);
  const userId = user?.id || null;
  const profileState = user?.buyerState || "";

  // Perfil → navegador (una vez por inicio de sesión)
  useEffect(() => {
    if (!userId) {
      lastSynced.current = null;
      return;
    }
    if (!buyerState && profileState) {
      lastSynced.current = profileState;
      setManualLocation(profileState);
    } else {
      lastSynced.current = buyerState || profileState || "";
    }
    // Solo al cambiar de usuario: buyerState se sincroniza en el otro efecto
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // Navegador → perfil (cada cambio del estado elegido)
  useEffect(() => {
    if (!userId || lastSynced.current === null) return;
    const value = buyerState || "";
    if (value === lastSynced.current) return;
    lastSynced.current = value;
    updateMyProfileAPI({ buyer_state: value }).catch(() => {
      /* guardar el estado en el perfil es un extra: nunca molesta al usuario */
    });
  }, [buyerState, userId]);

  return null;
}
