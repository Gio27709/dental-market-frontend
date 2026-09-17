import { useState } from "react";
import PropTypes from "prop-types";

// Logo de Forcepx: solo el símbolo (muela, flecha y cruz), sin el texto y sin fondo. Sale de
// LOGOForcepx.jpeg procesado con scratch/logo-forcepx-procesar.mjs (public/logo-forcepx-*.png).
//
// - `placa`: sobre fondos morados u oscuros la muela morada se pierde; va sobre una placa blanca.
// - `src`: logo subido desde el admin (Contenido de la home → Encabezado → Logo de la marca). Si
//   existe tiene prioridad; si no carga, se vuelve al logo oficial.

const OFICIAL = "/logo-forcepx-96.png";
const OFICIAL_SRCSET = "/logo-forcepx-96.png 1x, /logo-forcepx-192.png 2x";

export default function LogoMarca({ className = "w-8 h-8", placa = false, src = "", alt = "Forcepx", prioridad = false }) {
  const [fallo, setFallo] = useState(false);
  const propio = Boolean(src) && !fallo;

  const imagen = (
    <img
      src={propio ? src : OFICIAL}
      srcSet={propio ? undefined : OFICIAL_SRCSET}
      alt={alt}
      width={96}
      height={96}
      loading={prioridad ? "eager" : "lazy"}
      fetchPriority={prioridad ? "high" : undefined}
      decoding="async"
      onError={() => setFallo(true)}
      className="h-full w-full object-contain"
    />
  );

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center ${placa ? "rounded-lg bg-white p-[3px] shadow-sm" : ""} ${className}`}
    >
      {imagen}
    </span>
  );
}

LogoMarca.propTypes = {
  className: PropTypes.string,
  placa: PropTypes.bool,
  src: PropTypes.string,
  alt: PropTypes.string,
  prioridad: PropTypes.bool,
};
