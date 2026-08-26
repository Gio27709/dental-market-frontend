import { useEffect, useState } from "react";

/**
 * Cuenta atrás viva hasta `endsAt` (ISO o Date).
 *
 * Devuelve `{ label, expired }`:
 *  - `label` es "" mientras no haya fecha, "3d 4h 12m" si falta más de un día
 *    y "04:31:09" en el último día, para que las últimas horas se sientan urgentes.
 *  - `expired` distingue "sin fecha" de "ya terminó", que es lo que decide si un
 *    banner promocional debe seguir mostrándose.
 *
 * El intervalo es de 1s solo cuando falta menos de un día; por encima basta con
 * refrescar cada minuto y así una pestaña abierta no gasta un render por segundo.
 */
export default function useCountdown(endsAt) {
  const [state, setState] = useState({ label: "", expired: false });

  useEffect(() => {
    if (!endsAt) {
      setState({ label: "", expired: false });
      return;
    }

    const target = new Date(endsAt).getTime();
    if (Number.isNaN(target)) {
      setState({ label: "", expired: false });
      return;
    }

    let interval;

    const tick = () => {
      const diff = target - Date.now();

      if (diff <= 0) {
        setState({ label: "Finalizado", expired: true });
        clearInterval(interval);
        return;
      }

      const days = Math.floor(diff / 86400000);
      const hours = Math.floor((diff % 86400000) / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      const pad = (n) => String(n).padStart(2, "0");

      setState({
        label: days > 0 ? `${days}d ${hours}h ${minutes}m` : `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`,
        expired: false,
      });
    };

    tick();
    const lastDay = target - Date.now() < 86400000;
    interval = setInterval(tick, lastDay ? 1000 : 60000);
    return () => clearInterval(interval);
  }, [endsAt]);

  return state;
}
