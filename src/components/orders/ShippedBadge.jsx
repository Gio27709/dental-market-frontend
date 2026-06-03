import PropTypes from "prop-types";

/**
 * ShippedBadge - Componente premium animado para representar el estado "Enviado" (En Camino / Tránsito).
 * Diseñado con micro-animaciones SVG, balanceo de suspensión, rotación de ruedas en hover
 * y un resplandor pulsante elegante que atrae la vista del usuario de forma profesional.
 */
export default function ShippedBadge({ size = "md", label = "Enviado", showText = true }) {
  // Clases de tamaño para el contenedor
  const sizeClasses = {
    sm: "px-2 py-0.5 text-[9px] gap-1",
    md: "px-3 py-1.5 text-xs gap-1.5",
    lg: "px-4 py-2 text-sm gap-2"
  };

  // Clases de tamaño para el SVG
  const svgSizes = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5"
  };

  return (
    <span
      className={`dmt-shipped-badge inline-flex items-center font-extrabold rounded-full border transition-all duration-300 select-none ${sizeClasses[size]}`}
      style={{
        background: "linear-gradient(135deg, #f5f8ff 0%, #eef2ff 100%)",
        color: "#4f46e5",
        borderColor: "rgba(79, 70, 229, 0.25)",
        boxShadow: "0 0 12px rgba(79, 70, 229, 0.12)",
      }}
    >
      {/* Keyframes locales para evitar contaminar estilos globales */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes dmt-glow-pulse {
          0%, 100% {
            box-shadow: 0 0 10px rgba(79, 70, 229, 0.12);
            border-color: rgba(79, 70, 229, 0.25);
          }
          50% {
            box-shadow: 0 0 16px rgba(79, 70, 229, 0.28);
            border-color: rgba(79, 70, 229, 0.45);
          }
        }
        
        @keyframes dmt-truck-drive {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          20% {
            transform: translateY(-0.6px) rotate(0.4deg);
          }
          40% {
            transform: translateY(0.4px) rotate(-0.4deg);
          }
          60% {
            transform: translateY(-0.4px) rotate(0.3deg);
          }
          80% {
            transform: translateY(0.5px) rotate(-0.3deg);
          }
        }

        @keyframes dmt-wheel-spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes dmt-speed-flicker {
          0%, 100% {
            opacity: 0.15;
            transform: translateX(0px);
          }
          50% {
            opacity: 1;
            transform: translateX(-1.2px);
          }
        }

        .dmt-shipped-badge {
          animation: dmt-glow-pulse 2.5s ease-in-out infinite;
        }

        .dmt-shipped-badge:hover {
          animation: dmt-glow-pulse 1.2s ease-in-out infinite;
          background: linear-gradient(135deg, #eff3ff 0%, #e0e7ff 100%) !important;
          box-shadow: 0 0 20px rgba(79, 70, 229, 0.35) !important;
          border-color: rgba(79, 70, 229, 0.6) !important;
          transform: translateY(-1px);
        }

        .dmt-truck-chassis {
          animation: dmt-truck-drive 0.28s linear infinite;
        }

        .dmt-wheel {
          animation: dmt-wheel-spin 1.0s linear infinite;
        }

        .dmt-wl {
          stroke: #818cf8;
          stroke-dasharray: 2 1;
        }

        .dmt-wl-1 {
          animation: dmt-speed-flicker 0.6s ease-in-out infinite;
        }

        .dmt-wl-2 {
          animation: dmt-speed-flicker 0.5s ease-in-out infinite 0.15s;
        }

        .dmt-wl-3 {
          animation: dmt-speed-flicker 0.7s ease-in-out infinite 0.3s;
        }

        /* Aceleración en hover */
        .dmt-shipped-badge:hover .dmt-truck-chassis {
          animation-duration: 0.16s;
        }
        
        .dmt-shipped-badge:hover .dmt-wheel {
          animation-duration: 0.5s;
        }

        .dmt-shipped-badge:hover .dmt-wl-1 {
          animation-duration: 0.3s;
        }
        .dmt-shipped-badge:hover .dmt-wl-2 {
          animation-duration: 0.25s;
        }
        .dmt-shipped-badge:hover .dmt-wl-3 {
          animation-duration: 0.35s;
        }
      `}} />

      {/* SVG Truck */}
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`${svgSizes[size]} flex-shrink-0`}
      >
        {/* Líneas de velocidad */}
        <line className="dmt-wl dmt-wl-1" x1="1" y1="9" x2="3.5" y2="9" />
        <line className="dmt-wl dmt-wl-2" x1="0.5" y1="12" x2="4" y2="12" />
        <line className="dmt-wl dmt-wl-3" x1="1.5" y1="15" x2="3.5" y2="15" />
        
        {/* Cabina y contenedor (rebote activo) */}
        <g className="dmt-truck-chassis" style={{ transformOrigin: "12px 12px" }}>
          {/* Contenedor de Carga */}
          <rect x="5.5" y="6" width="8.5" height="10" rx="1.5" fill="none" />
          {/* Cabina */}
          <path d="M14 9h4l2.5 2.5V16h-6.5V9z" fill="none" />
          {/* Ventana */}
          <path d="M15 10.5h2.5l1.5 1.5H15v-1.5z" fill="none" opacity="0.8" strokeWidth="1.2" />
        </g>
        
        {/* Ruedas (rotación independiente) */}
        <g className="dmt-wheel dmt-w-1" style={{ transformOrigin: "7.5px 17.5px" }}>
          <circle cx="7.5" cy="17.5" r="2.2" fill="none" strokeWidth="1.8" />
          <line x1="7.5" y1="15.3" x2="7.5" y2="19.7" strokeWidth="1" />
        </g>
        <g className="dmt-wheel dmt-w-2" style={{ transformOrigin: "16.5px 17.5px" }}>
          <circle cx="16.5" cy="17.5" r="2.2" fill="none" strokeWidth="1.8" />
          <line x1="16.5" y1="15.3" x2="16.5" y2="19.7" strokeWidth="1" />
        </g>
      </svg>

      {showText && <span>{label}</span>}
    </span>
  );
}

ShippedBadge.propTypes = {
  size: PropTypes.oneOf(["sm", "md", "lg"]),
  label: PropTypes.string,
  showText: PropTypes.bool,
};
