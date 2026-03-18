import PropTypes from "prop-types";
import { BANK_DATA } from "../../utils/constants";
import toast from "react-hot-toast";

export default function PaymentInstructions({ paymentMethod }) {
  if (!paymentMethod) return null;

  const handleCopy = (text, label) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success(`${label} copiado al portapapeles`);
    });
  };

  const renderInstructionContent = () => {
    switch (paymentMethod) {
      case "transferencia": {
        const transData = BANK_DATA.transferencia;
        return (
          <div className="space-y-3">
            <p className="text-sm text-gray-700">
              Transfiera el monto exacto a la siguiente cuenta:
            </p>
            <div className="bg-white p-4 rounded border border-gray-200 text-sm">
              <div className="grid grid-cols-3 gap-2">
                <span className="text-gray-500 font-medium">Banco:</span>
                <span className="col-span-2 font-mono flex justify-between items-center">
                  {transData.bank}
                  <button
                    onClick={() => handleCopy(transData.bank, "Banco")}
                    className="text-primary-600 hover:text-primary-800 text-xs"
                  >
                    Copiar
                  </button>
                </span>

                <span className="text-gray-500 font-medium">Cuenta:</span>
                <span className="col-span-2 font-mono flex justify-between items-center">
                  {transData.account}
                  <button
                    onClick={() => handleCopy(transData.account, "Cuenta")}
                    className="text-primary-600 hover:text-primary-800 text-xs"
                  >
                    Copiar
                  </button>
                </span>

                <span className="text-gray-500 font-medium">RIF:</span>
                <span className="col-span-2 font-mono flex justify-between items-center">
                  {transData.rif}
                  <button
                    onClick={() => handleCopy(transData.rif, "RIF")}
                    className="text-primary-600 hover:text-primary-800 text-xs"
                  >
                    Copiar
                  </button>
                </span>

                <span className="text-gray-500 font-medium">Titular:</span>
                <span className="col-span-2 font-mono">{transData.name}</span>
              </div>
            </div>
          </div>
        );
      }

      case "pago_movil": {
        const pmData = BANK_DATA.pago_movil;
        return (
          <div className="space-y-3">
            <p className="text-sm text-gray-700">
              Realice su Pago Móvil con los siguientes datos:
            </p>
            <div className="bg-white p-4 rounded border border-gray-200 text-sm">
              <div className="grid grid-cols-3 gap-2">
                <span className="text-gray-500 font-medium">Banco:</span>
                <span className="col-span-2 font-mono flex justify-between items-center">
                  {pmData.bank}
                  <button
                    onClick={() => handleCopy(pmData.bank, "Banco")}
                    className="text-primary-600 hover:text-primary-800 text-xs"
                  >
                    Copiar
                  </button>
                </span>

                <span className="text-gray-500 font-medium">Teléfono:</span>
                <span className="col-span-2 font-mono flex justify-between items-center">
                  {pmData.phone}
                  <button
                    onClick={() => handleCopy(pmData.phone, "Teléfono")}
                    className="text-primary-600 hover:text-primary-800 text-xs"
                  >
                    Copiar
                  </button>
                </span>

                <span className="text-gray-500 font-medium">RIF:</span>
                <span className="col-span-2 font-mono flex justify-between items-center">
                  {pmData.rif}
                  <button
                    onClick={() => handleCopy(pmData.rif, "RIF")}
                    className="text-primary-600 hover:text-primary-800 text-xs"
                  >
                    Copiar
                  </button>
                </span>
              </div>
            </div>
          </div>
        );
      }

      case "zelle": {
        const zelleData = BANK_DATA.zelle;
        return (
          <div className="space-y-3">
            <p className="text-sm text-gray-700">
              Envíe el pago exacto en dólares (USD) al siguiente correo:
            </p>
            <div className="bg-white p-4 rounded border border-gray-200 text-sm">
              <div className="grid grid-cols-3 gap-2">
                <span className="text-gray-500 font-medium">Email:</span>
                <span className="col-span-2 font-mono flex justify-between items-center">
                  {zelleData.email}
                  <button
                    onClick={() => handleCopy(zelleData.email, "Email Zelle")}
                    className="text-primary-600 hover:text-primary-800 text-xs"
                  >
                    Copiar
                  </button>
                </span>

                <span className="text-gray-500 font-medium">Nombre:</span>
                <span className="col-span-2 font-mono">{zelleData.name}</span>
              </div>
            </div>
          </div>
        );
      }

      case "efectivo":
        return (
          <div className="bg-white p-4 rounded border border-gray-200 text-sm">
            <p className="text-gray-800 font-medium mb-1">
              Pago Efectivo / Contra Entrega
            </p>
            <p className="text-gray-600">
              Por favor, tenga preparado el monto exacto al momento de recibir
              su pedido en nuestro local o mediante el repartidor.
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="mt-6 bg-blue-50 border border-blue-100 rounded-lg p-5 shadow-sm">
      <h4 className="text-blue-900 font-semibold mb-4 flex items-center gap-2">
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        Instrucciones de Pago
      </h4>
      {renderInstructionContent()}

      {paymentMethod !== "efectivo" && (
        <div className="mt-4 pt-4 border-t border-blue-200">
          <p className="text-xs text-blue-800 font-medium bg-blue-100 p-2 rounded">
            ⚠️ Importante: Conserve una captura de pantalla de su comprobante,
            se la pediremos en el siguiente paso para confirmar su orden.
          </p>
        </div>
      )}
    </div>
  );
}

PaymentInstructions.propTypes = {
  paymentMethod: PropTypes.string,
};
