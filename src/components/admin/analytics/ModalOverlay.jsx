import PropTypes from "prop-types";
import { createPortal } from "react-dom";

/**
 * ModalOverlay — el fondo oscuro + centrado de los modales de analíticas,
 * colgado de <body> en vez de dejarlo dentro de la pestaña.
 *
 * Un `position: fixed` deja de medirse contra la ventana en cuanto un ancestro
 * tiene `transform` (o una animación que lo toque): pasa a medirse contra ese
 * ancestro. En /admin/analytics el contenido de cada área va envuelto en
 * `.fx-enter`, que anima `translateY`, así que los modales se centraban dentro
 * de la pestaña entera —o sea, por la mitad de una página larguísima— y había
 * que bajar con la rueda para encontrarlos. Sacándolos a <body> vuelven a
 * centrarse en la pantalla, que es lo que `fixed inset-0` promete.
 */
export default function ModalOverlay({ children, zIndexClass = "z-[250]" }) {
  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className={`fixed inset-0 ${zIndexClass} flex items-center justify-center p-4 bg-[#33243d]/45 animate-fadeIn`}
    >
      {children}
    </div>,
    document.body
  );
}

ModalOverlay.propTypes = {
  children: PropTypes.node,
  zIndexClass: PropTypes.string,
};
