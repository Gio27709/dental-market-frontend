import { useState } from "react";
import PropTypes from "prop-types";
import { BANK_DATA } from "../../utils/constants";
import toast from "react-hot-toast";

export default function PaymentInstructions({ paymentMethod }) {
  const [copiedField, setCopiedField] = useState(null);

  if (!paymentMethod) return null;

  const handleCopy = (text, label, fieldId) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(fieldId);
      toast.success(`${label} copiado al portapapeles`);
      setTimeout(() => setCopiedField(null), 2000);
    });
  };

  const renderInstructionContent = () => {
    switch (paymentMethod) {
      case "transferencia": {
        const transData = BANK_DATA.transferencia;
        return (
          <div className="space-y-3">
            <p className="text-xs font-semibold text-slate-500">
              Transfiera el monto exacto a la siguiente cuenta:
            </p>
            <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4.5 text-xs">
              <div className="grid grid-cols-3 gap-3 items-center">
                <span className="text-slate-400 font-bold uppercase tracking-wider">Banco:</span>
                <span className="col-span-2 font-mono text-slate-800 font-black flex justify-between items-center bg-white border border-slate-100 px-3.5 py-2 rounded-xl shadow-2xs">
                  {transData.bank}
                  <button
                    type="button"
                    onClick={() => handleCopy(transData.bank, "Banco", "bank")}
                    className="text-[#6b1e96] hover:text-[#521475] font-extrabold text-[10px] uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    {copiedField === "bank" ? (
                      <span className="text-emerald-500 font-bold flex items-center gap-0.5">
                        <span className="material-symbols-outlined text-[13px] text-emerald-500">check_circle</span> Copiado
                      </span>
                    ) : (
                      "Copiar"
                    )}
                  </button>
                </span>

                <span className="text-slate-400 font-bold uppercase tracking-wider">Cuenta:</span>
                <span className="col-span-2 font-mono text-slate-800 font-black flex justify-between items-center bg-white border border-slate-100 px-3.5 py-2 rounded-xl shadow-2xs">
                  {transData.account}
                  <button
                    type="button"
                    onClick={() => handleCopy(transData.account, "Cuenta", "account")}
                    className="text-[#6b1e96] hover:text-[#521475] font-extrabold text-[10px] uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    {copiedField === "account" ? (
                      <span className="text-emerald-500 font-bold flex items-center gap-0.5">
                        <span className="material-symbols-outlined text-[13px] text-emerald-500">check_circle</span> Copiado
                      </span>
                    ) : (
                      "Copiar"
                    )}
                  </button>
                </span>

                <span className="text-slate-400 font-bold uppercase tracking-wider">RIF:</span>
                <span className="col-span-2 font-mono text-slate-800 font-black flex justify-between items-center bg-white border border-slate-100 px-3.5 py-2 rounded-xl shadow-2xs">
                  {transData.rif}
                  <button
                    type="button"
                    onClick={() => handleCopy(transData.rif, "RIF", "rif")}
                    className="text-[#6b1e96] hover:text-[#521475] font-extrabold text-[10px] uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    {copiedField === "rif" ? (
                      <span className="text-emerald-500 font-bold flex items-center gap-0.5">
                        <span className="material-symbols-outlined text-[13px] text-emerald-500">check_circle</span> Copiado
                      </span>
                    ) : (
                      "Copiar"
                    )}
                  </button>
                </span>

                <span className="text-slate-400 font-bold uppercase tracking-wider">Titular:</span>
                <span className="col-span-2 font-mono text-slate-800 font-black bg-white border border-slate-100 px-3.5 py-2.5 rounded-xl shadow-2xs">
                  {transData.name}
                </span>
              </div>
            </div>
          </div>
        );
      }

      case "pago_movil": {
        const pmData = BANK_DATA.pago_movil;
        return (
          <div className="space-y-3">
            <p className="text-xs font-semibold text-slate-500">
              Realice su Pago Móvil con los siguientes datos:
            </p>
            <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4.5 text-xs">
              <div className="grid grid-cols-3 gap-3 items-center">
                <span className="text-slate-400 font-bold uppercase tracking-wider">Banco:</span>
                <span className="col-span-2 font-mono text-slate-800 font-black flex justify-between items-center bg-white border border-slate-100 px-3.5 py-2 rounded-xl shadow-2xs">
                  {pmData.bank}
                  <button
                    type="button"
                    onClick={() => handleCopy(pmData.bank, "Banco", "pm_bank")}
                    className="text-[#6b1e96] hover:text-[#521475] font-extrabold text-[10px] uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    {copiedField === "pm_bank" ? (
                      <span className="text-emerald-500 font-bold flex items-center gap-0.5">
                        <span className="material-symbols-outlined text-[13px] text-emerald-500">check_circle</span> Copiado
                      </span>
                    ) : (
                      "Copiar"
                    )}
                  </button>
                </span>

                <span className="text-slate-400 font-bold uppercase tracking-wider">Teléfono:</span>
                <span className="col-span-2 font-mono text-slate-800 font-black flex justify-between items-center bg-white border border-slate-100 px-3.5 py-2 rounded-xl shadow-2xs">
                  {pmData.phone}
                  <button
                    type="button"
                    onClick={() => handleCopy(pmData.phone, "Teléfono", "pm_phone")}
                    className="text-[#6b1e96] hover:text-[#521475] font-extrabold text-[10px] uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    {copiedField === "pm_phone" ? (
                      <span className="text-emerald-500 font-bold flex items-center gap-0.5">
                        <span className="material-symbols-outlined text-[13px] text-emerald-500">check_circle</span> Copiado
                      </span>
                    ) : (
                      "Copiar"
                    )}
                  </button>
                </span>

                <span className="text-slate-400 font-bold uppercase tracking-wider">RIF:</span>
                <span className="col-span-2 font-mono text-slate-800 font-black flex justify-between items-center bg-white border border-slate-100 px-3.5 py-2 rounded-xl shadow-2xs">
                  {pmData.rif}
                  <button
                    type="button"
                    onClick={() => handleCopy(pmData.rif, "RIF", "pm_rif")}
                    className="text-[#6b1e96] hover:text-[#521475] font-extrabold text-[10px] uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    {copiedField === "pm_rif" ? (
                      <span className="text-emerald-500 font-bold flex items-center gap-0.5">
                        <span className="material-symbols-outlined text-[13px] text-emerald-500">check_circle</span> Copiado
                      </span>
                    ) : (
                      "Copiar"
                    )}
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
            <p className="text-xs font-semibold text-slate-500">
              Envíe el pago exacto en dólares (USD) al siguiente correo:
            </p>
            <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4.5 text-xs">
              <div className="grid grid-cols-3 gap-3 items-center">
                <span className="text-slate-400 font-bold uppercase tracking-wider">Email:</span>
                <span className="col-span-2 font-mono text-slate-800 font-black flex justify-between items-center bg-white border border-slate-100 px-3.5 py-2 rounded-xl shadow-2xs">
                  {zelleData.email}
                  <button
                    type="button"
                    onClick={() => handleCopy(zelleData.email, "Email Zelle", "zelle_email")}
                    className="text-[#6b1e96] hover:text-[#521475] font-extrabold text-[10px] uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    {copiedField === "zelle_email" ? (
                      <span className="text-emerald-500 font-bold flex items-center gap-0.5">
                        <span className="material-symbols-outlined text-[13px] text-emerald-500">check_circle</span> Copiado
                      </span>
                    ) : (
                      "Copiar"
                    )}
                  </button>
                </span>

                <span className="text-slate-400 font-bold uppercase tracking-wider">Nombre:</span>
                <span className="col-span-2 font-mono text-slate-800 font-black bg-white border border-slate-100 px-3.5 py-2.5 rounded-xl shadow-2xs">
                  {zelleData.name}
                </span>
              </div>
            </div>
          </div>
        );
      }

      case "paypal": {
        const paypalData = BANK_DATA.paypal;
        return (
          <div className="space-y-3">
            <p className="text-xs font-semibold text-slate-500">
              Envíe el pago en dólares (USD) a la siguiente cuenta de PayPal:
            </p>
            <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4.5 text-xs">
              <div className="grid grid-cols-3 gap-3 items-center">
                <span className="text-slate-400 font-bold uppercase tracking-wider">Email:</span>
                <span className="col-span-2 font-mono text-slate-800 font-black flex justify-between items-center bg-white border border-slate-100 px-3.5 py-2 rounded-xl shadow-2xs">
                  {paypalData.email}
                  <button
                    type="button"
                    onClick={() => handleCopy(paypalData.email, "Email PayPal", "paypal_email")}
                    className="text-[#6b1e96] hover:text-[#521475] font-extrabold text-[10px] uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    {copiedField === "paypal_email" ? (
                      <span className="text-emerald-500 font-bold flex items-center gap-0.5">
                        <span className="material-symbols-outlined text-[13px] text-emerald-500">check_circle</span> Copiado
                      </span>
                    ) : (
                      "Copiar"
                    )}
                  </button>
                </span>

                <span className="text-slate-400 font-bold uppercase tracking-wider">Titular:</span>
                <span className="col-span-2 font-mono text-slate-800 font-black bg-white border border-slate-100 px-3.5 py-2.5 rounded-xl shadow-2xs">
                  {paypalData.name}
                </span>
              </div>
            </div>
          </div>
        );
      }

      case "binance": {
        const binanceData = BANK_DATA.binance;
        return (
          <div className="space-y-3">
            <p className="text-xs font-semibold text-slate-500">
              Realice el envío de USDT a la siguiente cuenta de Binance (Binance Pay ID / Correo):
            </p>
            <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4.5 text-xs">
              <div className="grid grid-cols-3 gap-3 items-center">
                <span className="text-slate-400 font-bold uppercase tracking-wider">Pay ID:</span>
                <span className="col-span-2 font-mono text-slate-800 font-black flex justify-between items-center bg-white border border-slate-100 px-3.5 py-2 rounded-xl shadow-2xs">
                  {binanceData.pay_id}
                  <button
                    type="button"
                    onClick={() => handleCopy(binanceData.pay_id, "Binance Pay ID", "binance_payid")}
                    className="text-[#6b1e96] hover:text-[#521475] font-extrabold text-[10px] uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    {copiedField === "binance_payid" ? (
                      <span className="text-emerald-500 font-bold flex items-center gap-0.5">
                        <span className="material-symbols-outlined text-[13px] text-emerald-500">check_circle</span> Copiado
                      </span>
                    ) : (
                      "Copiar"
                    )}
                  </button>
                </span>

                <span className="text-slate-400 font-bold uppercase tracking-wider">Email:</span>
                <span className="col-span-2 font-mono text-slate-800 font-black flex justify-between items-center bg-white border border-slate-100 px-3.5 py-2 rounded-xl shadow-2xs">
                  {binanceData.email}
                  <button
                    type="button"
                    onClick={() => handleCopy(binanceData.email, "Email Binance", "binance_email")}
                    className="text-[#6b1e96] hover:text-[#521475] font-extrabold text-[10px] uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    {copiedField === "binance_email" ? (
                      <span className="text-emerald-500 font-bold flex items-center gap-0.5">
                        <span className="material-symbols-outlined text-[13px] text-emerald-500">check_circle</span> Copiado
                      </span>
                    ) : (
                      "Copiar"
                    )}
                  </button>
                </span>

                <span className="text-slate-400 font-bold uppercase tracking-wider">Titular:</span>
                <span className="col-span-2 font-mono text-slate-800 font-black bg-white border border-slate-100 px-3.5 py-2.5 rounded-xl shadow-2xs">
                  {binanceData.name}
                </span>
              </div>
            </div>
          </div>
        );
      }

      default:
        return null;
    }
  };

  return (
    <div className="mt-6 bg-[#6b1e96]/5 border border-[#6b1e96]/10 rounded-2xl p-5 shadow-2xs">
      <h4 className="text-slate-800 font-black mb-4 flex items-center gap-2 text-sm">
        <span className="material-symbols-outlined text-[#6b1e96] text-[18px]">info</span>
        Instrucciones de Pago
      </h4>
      {renderInstructionContent()}

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
