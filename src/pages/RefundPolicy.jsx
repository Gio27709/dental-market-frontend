import { useState } from "react";
import { RefreshCw, PackageOpen, ChevronDown, ChevronUp, AlertCircle, ShieldCheck, HelpCircle as HelpIcon } from "lucide-react";
import { Link } from "react-router-dom";

export default function RefundPolicy() {
  const [openFaq, setOpenFaq] = useState(null);

  const steps = [
    {
      num: "01",
      title: "Recepción e Inspección",
      desc: "Tienes un plazo de 48 horas desde la entrega física para revisar que el pedido esté completo y correcto.",
      icon: PackageOpen,
    },
    {
      num: "02",
      title: "Apertura de Disputa",
      desc: "Si el producto está dañado o no es el correcto, abre una solicitud desde el panel de soporte del pedido.",
      icon: AlertCircle,
    },
    {
      num: "03",
      title: "Mediación de Soporte",
      desc: "El vendedor evalúa tu caso. Si no hay acuerdo en 24 horas, un administrador de Dental Market interviene.",
      icon: RefreshCw,
    },
    {
      num: "04",
      title: "Reembolso Directo",
      desc: "Una vez autorizada la disputa, procesamos tu reembolso de forma inmediata a tu método original de pago.",
      icon: ShieldCheck,
    },
  ];

  const eligibility = [
    {
      type: "valid",
      title: "Casos Aceptados para Devolución",
      items: [
        "Insumos que presenten defectos de fábrica evidentes al abrir.",
        "Equipos mayores que no enciendan o presenten fallas mecánicas de origen.",
        "Envío de productos incorrectos (marcas, modelos o variaciones distintas a las ordenadas).",
        "Productos con fecha de vencimiento menor a 3 meses al momento de la entrega.",
      ],
    },
    {
      type: "invalid",
      title: "Casos Excluidos (No Retornables)",
      items: [
        "Insumos clínicos desechables cuyo empaque sellado de fábrica haya sido abierto (por normativas de bioseguridad).",
        "Productos dañados por maltrato, caída o uso indebido por parte del odontólogo.",
        "Solicitudes realizadas fuera del plazo mandatorio de 48 horas desde la recepción.",
        "Materiales sensibles a la temperatura que no hayan sido almacenados según las indicaciones oficiales.",
      ],
    },
  ];

  const faqs = [
    {
      q: "¿Cómo se maneja el envío de retorno de un producto?",
      a: "Si la devolución es imputable a un error de la tienda (producto incorrecto o defectuoso), la tienda o el rider asignado de Dental Market recogerá el producto en tu consultorio sin ningún costo. Si es por arrepentimiento de compra (y el empaque no se ha abierto), el comprador asume el costo logístico de retorno.",
    },
    {
      q: "¿Cuánto tiempo tarda en reflejarse el dinero en mi cuenta?",
      a: "Una vez que el administrador o la tienda aprueban el reembolso, la liberación en la wallet o la orden de transferencia bancaria/Zelle se realiza en un plazo máximo de 24 a 48 horas hábiles.",
    },
    {
      q: "¿Qué pasa si expira el plazo de 48 horas y no reporté el problema?",
      a: "Transcurridas las 48 horas de la entrega, el sistema asume conformidad implícita y realiza la auto-confirmación, liberando los fondos de forma irrevocable al vendedor. Por ello, te recomendamos inspeccionar tus insumos el mismo día que los recibas.",
    },
  ];

  return (
    <div className="bg-[#f9f9ff] min-h-screen py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute top-0 left-0 w-full h-[360px] bg-gradient-to-br from-[#4f0077] to-[#6b1e96] z-0">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#c3ff00_1px,transparent_1px)] [background-size:16px_16px]"></div>
      </div>

      <div className="max-w-6xl mx-auto relative z-10 mt-10">
        {/* Title Header */}
        <div className="text-center text-white mb-16">
          <span className="bg-white/10 text-[#c3ff00] text-xs font-semibold tracking-widest uppercase px-3 py-1.5 rounded-full border border-white/10">
            Garantías & Reembolsos
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mt-4 mb-2 font-manrope">
            Política de Devoluciones
          </h1>
          <p className="text-[#e6b4ff] font-inter max-w-xl mx-auto text-sm sm:text-base">
            Última actualización: 10 de Junio de 2026. Entiende cómo opera el sistema de protección al comprador Escrow.
          </p>
        </div>

        {/* Info Escrow Banner */}
        <div className="bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 shadow-sm flex flex-col md:flex-row items-center gap-6 mb-16">
          <div className="bg-[#6b1e96]/5 p-5 rounded-2xl flex-shrink-0">
            <ShieldCheck className="w-10 h-10 text-[#6b1e96]" />
          </div>
          <div className="space-y-2 text-center md:text-left">
            <h3 className="text-xl font-bold text-gray-900 font-manrope">Tu compra está 100% protegida</h3>
            <p className="text-gray-500 font-inter text-sm leading-relaxed">
              En Dental Market tu dinero no va directamente al vendedor. Permanece en custodia segura hasta que confirmas la conformidad del pedido. Si algo sale mal, estamos listos para intervenir y reembolsarte.
            </p>
          </div>
        </div>

        {/* Stepper Workflow section */}
        <div className="mb-16">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-extrabold text-gray-900 font-manrope">El Proceso de Devolución</h2>
            <p className="text-gray-500 font-inter mt-1 text-sm sm:text-base">Un flujo claro de 4 pasos para resolver cualquier eventualidad.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, idx) => {
              const Icon = step.icon;
              return (
                <div key={idx} className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm relative space-y-6">
                  {/* Step number badge */}
                  <span className="absolute top-4 right-6 text-4xl font-black text-gray-100 font-manrope block select-none">
                    {step.num}
                  </span>
                  <div className="bg-[#6b1e96]/5 p-3 rounded-2xl w-fit">
                    <Icon className="w-6 h-6 text-[#6b1e96]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-2 font-manrope text-base">{step.title}</h3>
                    <p className="text-gray-500 font-inter text-xs leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Eligibility Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          {eligibility.map((el, idx) => (
            <div key={idx} className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm space-y-6">
              <h3
                className={`text-xl font-bold font-manrope border-l-4 pl-3 ${
                  el.type === "valid" ? "border-green-500 text-gray-900" : "border-red-500 text-gray-900"
                }`}
              >
                {el.title}
              </h3>
              <ul className="space-y-4">
                {el.items.map((item, itemIdx) => (
                  <li key={itemIdx} className="flex items-start gap-3 text-sm font-inter text-gray-600">
                    <span
                      className={`inline-block w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                        el.type === "valid" ? "bg-green-500" : "bg-red-500"
                      }`}
                    ></span>
                    <span className="leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Refund FAQ accordion */}
        <div className="bg-white rounded-3xl shadow-[0_20px_40px_rgba(25,28,32,0.03)] border border-gray-100 p-8 sm:p-12 mb-16">
          <h2 className="text-2xl font-extrabold text-[#30004a] font-manrope mb-8 flex items-center gap-2">
            <HelpIcon className="w-6 h-6 text-[#6b1e96]" />
            <span>Preguntas Frecuentes de Devoluciones</span>
          </h2>
          <div className="space-y-4">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div key={idx} className="border border-gray-100 rounded-2xl overflow-hidden">
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full flex items-center justify-between p-5 text-left font-semibold text-gray-900 hover:bg-gray-50 transition-colors text-sm sm:text-base cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? (
                      <ChevronUp className="w-5 h-5 text-[#6b1e96] flex-shrink-0 ml-2" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0 ml-2" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 text-gray-500 text-sm leading-relaxed border-t border-gray-50 pt-3 bg-gray-50/50">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Support Banner */}
        <div className="bg-gradient-to-br from-[#4f0077] to-[#6b1e96] rounded-3xl p-10 text-white flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <h3 className="text-2xl font-bold font-manrope">¿Necesitas reportar un problema ahora?</h3>
            <p className="text-sm text-[#e6b4ff] max-w-lg font-inter">
              Dirígete a tu historial de pedidos, selecciona la compra en cuestión y abre un ticket para que nuestro equipo te asista de inmediato.
            </p>
          </div>
          <div className="flex gap-4">
            <Link
              to="/account/orders"
              className="bg-[#c3ff00] hover:bg-[#bcf600] text-[#151f00] font-bold py-3.5 px-6 rounded-xl transition-all shadow-md active:transform active:scale-95 font-inter text-sm whitespace-nowrap cursor-pointer"
            >
              Mis Pedidos
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
