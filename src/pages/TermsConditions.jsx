import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { FileText, Scale, CreditCard, Truck, AlertTriangle, Gavel, Users, Info } from "lucide-react";

export default function TermsConditions() {
  const [activeTab, setActiveTab] = useState("buyers");
  const { hash } = useLocation();
  const targetAnchor = hash ? hash.slice(1) : "";
  const [highlighted, setHighlighted] = useState("");
  const highlightTimer = useRef(null);

  const buyerTerms = [
    {
      title: "1. Registro y Habilitación Profesional",
      icon: Users,
      content: (
        <div className="space-y-3">
          <p>
            El acceso a la compra de insumos de uso clínico odontológico está restringido exclusivamente a profesionales de la salud oral calificados.
          </p>
          <ul className="list-disc pl-6 space-y-2 text-gray-600 text-sm">
            <li>
              Debes registrarte con datos reales y proporcionar una copia legible de tu licencia profesional odontológica durante el registro.
            </li>
            <li>
              Forcepx se reserva el derecho de rechazar temporal o definitivamente cuentas cuyas credenciales profesionales no puedan ser validadas.
            </li>
            <li>
              Eres el único responsable de mantener la confidencialidad de tu contraseña y de toda actividad realizada bajo tu perfil.
            </li>
          </ul>
        </div>
      ),
    },
    {
      title: "2. Flujo de Pago Escrow (Custodia Segura)",
      anchor: "pago-escrow",
      icon: CreditCard,
      content: (
        <div className="space-y-3">
          <p>
            Todos los pagos realizados a través de la plataforma se procesan mediante un modelo de custodia segura o Escrow.
          </p>
          <ul className="list-disc pl-6 space-y-2 text-gray-600 text-sm">
            <li>
              Al realizar una compra, el dinero se retiene en las cuentas de Forcepx y no se transfiere directamente al vendedor.
            </li>
            <li>
              Una vez que recibas el producto, tienes un plazo de <strong>48 horas</strong> para confirmar que todo está conforme y liberar los fondos a la tienda.
            </li>
            <li>
              Si no confirmas la entrega ni abres una disputa dentro de las 48 horas posteriores al reporte de entrega de la empresa de transporte, el sistema realizará la <strong>auto-confirmación y liberación automática de fondos</strong> a favor del vendedor.
            </li>
          </ul>
        </div>
      ),
    },
    {
      title: "3. Envíos y Tarifas",
      anchor: "envios",
      icon: Truck,
      content: (
        <div className="space-y-3">
          <p>
            Los envíos son gestionados directamente por las tiendas afiliadas o por repartidores (riders) independientes de la plataforma.
          </p>
          <ul className="list-disc pl-6 space-y-2 text-gray-600 text-sm">
            <li>
              Las tarifas de envío se calculan automáticamente según la distancia geográfica del vendedor respecto a tu ubicación.
            </li>
            <li>
              Los tiempos estimados de entrega son referenciales y Forcepx no se hace responsable por retrasos fortuitos o de fuerza mayor ajenos a su operación.
            </li>
          </ul>
        </div>
      ),
    },
  ];

  const sellerTerms = [
    {
      title: "1. Registro y Publicación de Productos",
      icon: Users,
      content: (
        <div className="space-y-3">
          <p>
            Las tiendas que vendan productos en Forcepx deben pasar por un proceso de aprobación riguroso.
          </p>
          <ul className="list-disc pl-6 space-y-2 text-gray-600 text-sm">
            <li>
              Debes proporcionar información fiscal real (RIF, registro de comercio) y crear un perfil formal.
            </li>
            <li>
              Todos los productos publicados deben contar con descripciones veraces, especificar marcas originales, precios reales y el stock disponible actual.
            </li>
            <li>
              Queda estrictamente prohibida la venta de insumos vencidos, muestras médicas gratuitas o productos sin registros sanitarios vigentes.
            </li>
          </ul>
        </div>
      ),
    },
    {
      title: "2. Esquema de Comisión Dual",
      icon: CreditCard,
      content: (
        <div className="space-y-3">
          <p>
            Para sostener y asegurar la operativa de la plataforma, cobramos una comisión dual por cada pedido exitoso:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-gray-600 text-sm">
            <li>
              <strong>Comisión de Tienda (Store Fee):</strong> Porcentaje descontado directamente de las ventas totales del pedido de la tienda al liberar el escrow.
            </li>
            <li>
              <strong>Comisión de Comprador (Buyer Fee):</strong> Cargo de gestión que se suma al total del carrito al momento del checkout del cliente.
            </li>
            <li>
              Los balances se acumulan en tu wallet virtual de la plataforma y puedes solicitar retiros que son procesados en un plazo de 24 a 48 horas hábiles.
            </li>
          </ul>
        </div>
      ),
    },
    {
      title: "3. Tiempos de Despacho (SLA) y Sanciones",
      icon: AlertTriangle,
      content: (
        <div className="space-y-3">
          <p>
            Las tiendas afiliadas deben mantener un alto estándar de servicio para evitar suspensiones en la plataforma.
          </p>
          <ul className="list-disc pl-6 space-y-2 text-gray-600 text-sm">
            <li>
              Las tiendas tienen un límite de <strong>24 horas hábiles</strong> para despachar los pedidos una vez que el pago ha sido aprobado por administración.
            </li>
            <li>
              Las demoras injustificadas que violen los Acuerdos de Nivel de Servicio (SLA) darán lugar a multas automáticas aplicadas en la wallet o la suspensión temporal del catálogo de la tienda.
            </li>
          </ul>
        </div>
      ),
    },
  ];

  const generalTerms = [
    {
      title: "Propiedad Intelectual",
      content:
        "Todo el diseño, código, logotipos, marcas comerciales y contenido CMS expuesto en Forcepx son propiedad de Forcepx o de sus respectivos licenciantes, protegidos por tratados de propiedad intelectual nacionales e internacionales.",
    },
    {
      title: "Limitación de Responsabilidad",
      content:
        "Forcepx actúa como un intermediario y agente escrow. No asumimos responsabilidad sobre la idoneidad clínica de los productos médicos vendidos por terceros ni por los daños derivados del uso inadecuado o impericia en la manipulación de insumos odontológicos.",
    },
    {
      title: "Modificación de Términos",
      content:
        "Nos reservamos el derecho de modificar estos términos en cualquier momento. Notificaremos a los usuarios mediante alertas en la plataforma antes de que los nuevos términos entren en vigor.",
    },
  ];

  // Deep link tipo /terminos#pago-escrow: abre la pestaña correcta, baja al apartado y lo resalta.
  useEffect(() => {
    if (!targetAnchor) return;
    const tab = sellerTerms.some((t) => t.anchor === targetAnchor) ? "sellers" : "buyers";
    setActiveTab(tab);

    const raf = requestAnimationFrame(() => {
      const el = document.getElementById(targetAnchor);
      if (!el) return;
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      setHighlighted(targetAnchor);
      clearTimeout(highlightTimer.current);
      highlightTimer.current = setTimeout(() => setHighlighted(""), 2500);
    });

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(highlightTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetAnchor]);

  return (
    <div className="bg-[#f9f9ff] min-h-screen py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative Header Banner */}
      <div className="absolute top-0 left-0 w-full h-[360px] bg-gradient-to-br from-[#4f0077] to-[#6b1e96] z-0">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#c3ff00_1px,transparent_1px)] [background-size:16px_16px]"></div>
      </div>

      <div className="max-w-5xl mx-auto relative z-10 mt-10">
        {/* Page Title */}
        <div className="text-center text-white mb-12">
          <span className="bg-white/10 text-[#c3ff00] text-xs font-semibold tracking-widest uppercase px-3 py-1.5 rounded-full border border-white/10">
            Regulaciones y Contratos
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mt-4 mb-2 font-manrope">
            Términos y Condiciones
          </h1>
          <p className="text-[#e6b4ff] font-inter max-w-xl mx-auto text-sm sm:text-base">
            Última actualización: 10 de Junio de 2026. Por favor, lee atentamente el acuerdo de uso de la plataforma.
          </p>
        </div>

        {/* Tab Selector */}
        <div className="bg-white p-2 rounded-2xl shadow-md flex mb-8 max-w-md mx-auto border border-gray-100">
          <button
            onClick={() => setActiveTab("buyers")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition-all cursor-pointer ${
              activeTab === "buyers"
                ? "bg-[#6b1e96] text-white shadow-sm"
                : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Compradores (Odontólogos)</span>
          </button>
          <button
            onClick={() => setActiveTab("sellers")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition-all cursor-pointer ${
              activeTab === "sellers"
                ? "bg-[#6b1e96] text-white shadow-sm"
                : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
            }`}
          >
            <Scale className="w-4 h-4" />
            <span>Vendedores (Tiendas)</span>
          </button>
        </div>

        {/* Active Tab Terms Content */}
        <div className="bg-white rounded-3xl shadow-[0_20px_40px_rgba(25,28,32,0.03)] border border-gray-100 p-6 sm:p-10 mb-8 space-y-10">
          <div className="flex items-center gap-3 border-b border-gray-100 pb-5">
            <Info className="w-6 h-6 text-[#6b1e96]" />
            <h2 className="text-2xl font-extrabold text-[#30004a] font-manrope">
              {activeTab === "buyers" ? "Acuerdo de Uso para Compradores" : "Términos del Servicio para Tiendas"}
            </h2>
          </div>

          <div className="space-y-8">
            {(activeTab === "buyers" ? buyerTerms : sellerTerms).map((term, index) => {
              const Icon = term.icon;
              return (
                <div
                  key={index}
                  id={term.anchor}
                  className={`flex gap-4 scroll-mt-28 rounded-2xl transition-colors duration-500 ${
                    term.anchor && highlighted === term.anchor ? "bg-[#c3ff00]/20 ring-2 ring-[#c3ff00] -m-3 p-3" : ""
                  }`}
                >
                  <div className="flex-shrink-0 bg-[#6b1e96]/5 p-3 rounded-2xl h-12 w-12 flex items-center justify-center">
                    <Icon className="w-6 h-6 text-[#6b1e96]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2 font-manrope">{term.title}</h3>
                    <div className="text-gray-600 font-inter text-sm sm:text-base leading-relaxed">
                      {term.content}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* General Terms Accordion/Section */}
        <div className="bg-white rounded-3xl shadow-[0_20px_40px_rgba(25,28,32,0.03)] border border-gray-100 p-6 sm:p-10">
          <div className="flex items-center gap-3 border-b border-gray-100 pb-5 mb-8">
            <Gavel className="w-6 h-6 text-[#6b1e96]" />
            <h2 className="text-2xl font-extrabold text-[#30004a] font-manrope">Cláusulas Generales</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {generalTerms.map((term, index) => (
              <div key={index} className="space-y-3">
                <h4 className="font-bold text-gray-900 font-manrope text-base border-l-3 border-[#c3ff00] pl-3">
                  {term.title}
                </h4>
                <p className="text-gray-500 font-inter text-sm leading-relaxed">{term.content}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Action Call Banner */}
        <div className="mt-8 bg-gray-900 rounded-3xl p-8 text-center text-white flex flex-col items-center justify-center gap-4 border border-gray-800 shadow-xl">
          <FileText className="w-10 h-10 text-[#c3ff00]" />
          <h3 className="text-2xl font-bold font-manrope">¿Entendido todo el acuerdo?</h3>
          <p className="text-gray-400 text-sm max-w-lg font-inter">
            Al continuar navegando y utilizando los servicios de Forcepx, aceptas implícitamente estos Términos y Condiciones.
          </p>
        </div>
      </div>
    </div>
  );
}
