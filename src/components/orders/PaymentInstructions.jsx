import { useState, Fragment } from "react";
import PropTypes from "prop-types";
import toast from "react-hot-toast";
import usePaymentMethods from "../../hooks/usePaymentMethods";

/**
 * Instrucciones de pago del método elegido.
 *
 * Antes esto era un `switch` con un `case` por método y unas setenta líneas de JSX en cada
 * uno. Los seis casos pintaban exactamente lo mismo — una nota arriba y una rejilla de pares
 * etiqueta/valor con botón "Copiar" — cambiando solo los textos. Ahora esa forma se escribe
 * una vez y los textos vienen de la configuración (`global_settings.payment_methods`), así
 * que dar de alta un método nuevo desde el panel de admin no exige volver a pasar por aquí.
 */
export default function PaymentInstructions({ paymentMethod }) {
  const [copiedField, setCopiedField] = useState(null);
  const { byKey } = usePaymentMethods();

  if (!paymentMethod) return null;

  const metodo = byKey[paymentMethod];
  // Un método sin datos de cuenta no tiene nada que instruir. Se calla en vez de pintar una
  // caja vacía, que es lo mismo que hacía el `default: return null` de antes.
  if (!metodo || !metodo.campos?.length) return null;

  const handleCopy = (text, label, fieldId) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(fieldId);
      toast.success(`${label} copiado al portapapeles`);
      setTimeout(() => setCopiedField(null), 2000);
    });
  };

  return (
    <div className="mt-6 bg-[#6b1e96]/5 border border-[#6b1e96]/10 rounded-2xl p-5 shadow-2xs">
      <h4 className="text-slate-800 font-black mb-4 flex items-center gap-2 text-sm">
        <span className="material-symbols-outlined text-[#6b1e96] text-[18px]">info</span>
        Instrucciones de Pago
      </h4>

      <div className="space-y-3">
        {metodo.nota && (
          <p className="text-xs font-semibold text-slate-500">{metodo.nota}</p>
        )}

        <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4.5 text-xs">
          <div className="grid grid-cols-3 gap-3 items-center">
            {/* Cada campo aporta dos celdas hermanas a la rejilla de 3 columnas. Envolverlas
                en un <div> rompería el grid, de ahí el Fragment con key. */}
            {metodo.campos.map((campo, i) => {
              const fieldId = `${metodo.key}_${i}`;
              return (
                <Fragment key={fieldId}>
                  <span className="text-slate-400 font-bold uppercase tracking-wider">
                    {campo.etiqueta}:
                  </span>
                  <span
                    className={`col-span-2 font-mono text-slate-800 font-black bg-white border border-slate-100 rounded-xl shadow-2xs ${
                      campo.copiable
                        ? "flex justify-between items-center px-3.5 py-2"
                        : "block px-3.5 py-2.5"
                    }`}
                  >
                    <span className="break-all">{campo.valor}</span>
                    {campo.copiable && (
                      <button
                        type="button"
                        onClick={() => handleCopy(campo.valor, campo.etiqueta, fieldId)}
                        className="text-[#6b1e96] hover:text-[#521475] font-extrabold text-[10px] uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-colors flex-shrink-0 ml-2"
                      >
                        {copiedField === fieldId ? (
                          <span className="text-emerald-500 font-bold flex items-center gap-0.5">
                            <span className="material-symbols-outlined text-[13px] text-emerald-500">
                              check_circle
                            </span>{" "}
                            Copiado
                          </span>
                        ) : (
                          "Copiar"
                        )}
                      </button>
                    )}
                  </span>
                </Fragment>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-slate-200/60">
        <p className="text-[11px] leading-relaxed text-purple-900 font-bold bg-[#6b1e96]/10 p-3.5 rounded-xl border border-[#6b1e96]/10 flex items-start gap-2">
          <span className="material-symbols-outlined text-[16px] mt-0.5 text-[#6b1e96]">warning</span>
          <span>
            <strong>Importante:</strong> Conserve una captura de pantalla de su comprobante, se la pediremos en el siguiente paso para confirmar su orden.
          </span>
        </p>
      </div>
    </div>
  );
}

PaymentInstructions.propTypes = {
  paymentMethod: PropTypes.string,
};
