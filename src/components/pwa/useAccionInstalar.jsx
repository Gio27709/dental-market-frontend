import { useCallback, useState } from "react";
import toast from "react-hot-toast";
import { useInstalarApp } from "./instalarApp";
import InstalarAppDialogo from "./InstalarAppDialogo";

/**
 * Acción «instalar la app» para cualquier botón: abre el aviso nativo del navegador o, en iPhone,
 * el diálogo con los pasos. Devuelve `dialogo`, que el componente debe pintar.
 * Resultado de `accion()`: "accepted" | "dismissed" | "ios" | "no-disponible".
 */
export default function useAccionInstalar() {
  const { disponible, puedeInstalar, ios, instalar } = useInstalarApp();
  const [dialogoIOS, setDialogoIOS] = useState(false);

  const accion = useCallback(async () => {
    if (puedeInstalar) {
      const resultado = await instalar();
      if (resultado === "accepted") toast.success("¡Listo! Forcepx se está instalando en tu dispositivo.");
      return resultado;
    }
    if (ios) {
      setDialogoIOS(true);
      return "ios";
    }
    return "no-disponible";
  }, [puedeInstalar, ios, instalar]);

  const dialogo = <InstalarAppDialogo abierto={dialogoIOS} onCerrar={() => setDialogoIOS(false)} />;
  return { disponible, accion, dialogo };
}
