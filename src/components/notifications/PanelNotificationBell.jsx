import PropTypes from "prop-types";
import NotificationBell from "./NotificationBell";

/**
 * Campana para los paneles internos (admin, tienda, repartidor), que no tienen el
 * Header público. En escritorio no hay barra superior, así que va como píldora
 * oscura alineada a la derecha sobre el contenido; el dropdown se ancla a ella.
 * NotificationBell pinta el icono en blanco, por eso el fondo oscuro.
 */
export default function PanelNotificationBell({ className = "" }) {
  return (
    <div className={`flex justify-end ${className}`}>
      <div
        className="flex items-center justify-center w-10 h-10 rounded-full shadow-md"
        style={{ background: "linear-gradient(135deg, #2d1452 0%, #531575 100%)" }}
      >
        <NotificationBell />
      </div>
    </div>
  );
}

PanelNotificationBell.propTypes = {
  className: PropTypes.string,
};
