import { useState } from "react";
import PropTypes from "prop-types";
import { CARRIER_ICONS } from "../../utils/constants";

export default function TrackingInfo({ tracking_code, shipping_carrier }) {
  const [copied, setCopied] = useState(false);

  const carrier =
    CARRIER_ICONS[shipping_carrier?.toLowerCase()] || CARRIER_ICONS.default;

  const handleCopy = async () => {
    if (!tracking_code) return;
    try {
      await navigator.clipboard.writeText(tracking_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = tracking_code;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 sm:p-5">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">{carrier.icon}</span>
        <h4 className="font-bold text-blue-900 text-sm">{carrier.label}</h4>
        <span className="ml-auto text-xs text-blue-600 font-medium">
          🚚 En camino
        </span>
      </div>

      {tracking_code && (
        <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border border-blue-100">
          <span className="text-sm font-mono text-gray-900 flex-1 truncate">
            {tracking_code}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleCopy();
            }}
            className="text-xs font-medium px-2.5 py-1 rounded-md bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors whitespace-nowrap"
          >
            {copied ? "✓ Copiado" : "Copiar"}
          </button>
        </div>
      )}

      <p className="text-xs text-blue-700 mt-3">
        Tu producto está en camino. Recibirás una actualización cuando llegue a
        su destino.
      </p>
    </div>
  );
}

TrackingInfo.propTypes = {
  tracking_code: PropTypes.string,
  shipping_carrier: PropTypes.string,
};
