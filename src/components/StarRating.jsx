import PropTypes from "prop-types";
import { useState, useEffect, useCallback, useRef } from "react";
import { useRatings } from "../context/RatingContext";

const TAMANOS = {
  xs: { icono: 13, texto: "text-[9px]" },
  sm: { icono: 15, texto: "text-[10px]" },
  md: { icono: 18, texto: "text-[11px]" },
};

/**
 * Estrellas de producto. En reposo se ve igual que una fila de estrellas normal;
 * si la persona puede calificar, crecen al pasar el mouse y un clic guarda la nota.
 *
 * Muestra el promedio de todos, salvo que esta persona ya haya calificado: en ese
 * caso muestra SU nota y lo dice, para que no se confundan las dos cosas.
 */
export default function StarRating({
  productId,
  average = 0,
  count = 0,
  size = "xs",
  interactive = false,
  disabled = false,
  showCount = true,
  className = "",
}) {
  const { ratings, requestRating, rateProduct, isLogged } = useRatings() || {};
  const [hovered, setHovered] = useState(0);
  const [guardado, setGuardado] = useState(false);
  const [error, setError] = useState("");
  const temporizador = useRef(null);

  const puedeCalificar = interactive && isLogged && !disabled && !!productId;
  const mio = productId ? ratings?.[productId] : null;
  const miNota = mio?.rating || 0;
  const bloqueadoPorModo = puedeCalificar && mio && mio.can_review === false;

  // Pide la nota propia; el contexto junta las de todas las tarjetas en una petición.
  useEffect(() => {
    if (interactive && isLogged && productId) requestRating?.(productId);
  }, [interactive, isLogged, productId, requestRating]);

  useEffect(() => () => temporizador.current && clearTimeout(temporizador.current), []);

  const handleRate = useCallback(
    async (e, nota) => {
      e.preventDefault();
      e.stopPropagation();
      if (!puedeCalificar || bloqueadoPorModo || nota === miNota) return;

      setError("");
      const res = await rateProduct(productId, nota);
      if (res === true) {
        setGuardado(true);
        if (temporizador.current) clearTimeout(temporizador.current);
        temporizador.current = setTimeout(() => setGuardado(false), 2200);
      } else {
        setError(res?.error || "No se pudo guardar");
        if (temporizador.current) clearTimeout(temporizador.current);
        temporizador.current = setTimeout(() => setError(""), 3000);
      }
    },
    [puedeCalificar, bloqueadoPorModo, miNota, rateProduct, productId]
  );

  const { icono, texto } = TAMANOS[size] || TAMANOS.xs;
  const activo = hovered || miNota || Math.round(Number(average) || 0);
  const interactuable = puedeCalificar && !bloqueadoPorModo;
  const creciendo = interactuable && hovered > 0;

  // Al crecer, el grupo de estrellas se agranda con transform, que NO ocupa lugar en
  // el flujo: sin compensar, las estrellas se montan encima del texto de al lado.
  // Se aparta el texto exactamente lo que el grupo gana de ancho, con transición.
  const ESCALA = 1.3;
  const anchoEstrellas = 5 * (icono + 2);
  const separacion = creciendo ? Math.round(anchoEstrellas * (ESCALA - 1)) + 8 : 6;

  const leyenda = () => {
    if (error) return <span className="text-red-500 font-semibold">{error}</span>;
    if (guardado) return <span className="text-emerald-600 font-bold">¡Gracias!</span>;
    if (hovered) return <span className="text-[#6b1e96] font-bold">Calificar {hovered} ★</span>;
    if (miNota) return <span className="text-[#6b1e96] font-bold">Tu nota</span>;
    if (interactuable && !count)
      return <span className="text-slate-400 font-medium">Sé el primero</span>;
    return <span className="text-slate-400 font-medium">{count || 0} valoraciones</span>;
  };

  return (
    <div className={`flex items-center min-h-[20px] ${className}`}>
      <div
        className={`flex items-center origin-left transition-transform duration-200 ${
          interactuable ? "cursor-pointer" : ""
        }`}
        style={{ transform: creciendo ? `scale(${ESCALA})` : "scale(1)" }}
        onMouseLeave={() => setHovered(0)}
      >
        {[1, 2, 3, 4, 5].map((n) => {
          const encendida = n <= activo;
          const contenido = (
            <span
              className={`material-symbols-outlined leading-none transition-colors duration-150 ${
                encendida ? "text-[#facc15]" : "text-slate-200"
              }`}
              style={{
                fontSize: `${icono}px`,
                fontVariationSettings: encendida ? "'FILL' 1" : "'FILL' 0",
              }}
            >
              star
            </span>
          );

          if (!interactuable) {
            return (
              <span key={n} className="p-[1px] flex">
                {contenido}
              </span>
            );
          }

          return (
            <button
              key={n}
              type="button"
              // El padding agranda el área para el dedo sin cambiar el alto de la fila.
              className="p-[1px] flex focus:outline-none focus-visible:ring-1 focus-visible:ring-[#6b1e96] rounded-sm"
              onMouseEnter={() => setHovered(n)}
              onFocus={() => setHovered(n)}
              onBlur={() => setHovered(0)}
              onClick={(e) => handleRate(e, n)}
              aria-label={`Calificar con ${n} ${n === 1 ? "estrella" : "estrellas"}`}
            >
              {contenido}
            </button>
          );
        })}
      </div>

      {showCount && (
        <span
          className={`${texto} whitespace-nowrap transition-[margin] duration-200`}
          style={{ marginLeft: `${separacion}px` }}
        >
          {leyenda()}
        </span>
      )}
    </div>
  );
}

StarRating.propTypes = {
  productId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  average: PropTypes.number,
  count: PropTypes.number,
  size: PropTypes.oneOf(["xs", "sm", "md"]),
  interactive: PropTypes.bool,
  disabled: PropTypes.bool,
  showCount: PropTypes.bool,
  className: PropTypes.string,
};
