import { useEffect, useState } from "react";

// ¿Pantalla de teléfono? Mismo corte que `md:` de Tailwind (768 px). Se usa para enseñar el
// inicio en versión app y la barra inferior sin duplicar el trabajo del escritorio.
const CONSULTA = "(max-width: 767px)";

export default function useEsMovil() {
  const [esMovil, setEsMovil] = useState(() =>
    typeof window === "undefined" ? false : window.matchMedia(CONSULTA).matches,
  );

  useEffect(() => {
    const media = window.matchMedia(CONSULTA);
    const alCambiar = (e) => setEsMovil(e.matches);
    media.addEventListener("change", alCambiar);
    setEsMovil(media.matches);
    return () => media.removeEventListener("change", alCambiar);
  }, []);

  return esMovil;
}
