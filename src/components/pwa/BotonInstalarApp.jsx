import PropTypes from "prop-types";
import useAccionInstalar from "./useAccionInstalar";

// Botón reutilizable «Instalar app» (menú móvil, pie de página). No se pinta si la app ya está
// instalada o si el navegador no permite instalarla.

export default function BotonInstalarApp({ className, children, onDespues }) {
  const { disponible, accion, dialogo } = useAccionInstalar();
  if (!disponible) return dialogo;
  return (
    <>
      <button
        type="button"
        className={className}
        onClick={async () => {
          const resultado = await accion();
          // En iPhone se abre el diálogo con los pasos, que vive dentro de este botón: si el
          // contenedor (p. ej. el menú móvil) se cerrara ahora, el diálogo desaparecería.
          if (resultado !== "ios") onDespues?.();
        }}
      >
        {children}
      </button>
      {dialogo}
    </>
  );
}

BotonInstalarApp.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node.isRequired,
  onDespues: PropTypes.func,
};
