import { useState } from "react";
import { Shield, Eye, Lock, Database, UserCheck, Mail, ChevronDown, ChevronUp } from "lucide-react";

export default function PrivacyPolicy() {
  const [activeTab, setActiveTab] = useState("recopilacion");
  const [openFaq, setOpenFaq] = useState(null);

  const sections = [
    {
      id: "recopilacion",
      title: "1. Información que Recopilamos",
      icon: Database,
      content: (
        <div className="space-y-4">
          <p>
            En <strong>Forcepx</strong>, recopilamos información para proporcionar mejores servicios a todos nuestros usuarios. Esto incluye:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-gray-600">
            <li>
              <strong>Información de la Cuenta:</strong> Nombre completo, correo electrónico, dirección, teléfono y credenciales de acceso cuando te registras.
            </li>
            <li>
              <strong>Documentación Profesional:</strong> Licencias y credenciales de odontólogo necesarias para validar las compras de insumos clínicos regulados.
            </li>
            <li>
              <strong>Ubicación Geográfica:</strong> Coordenadas GPS y estado de residencia para calcular costos de delivery y priorizar productos de tiendas cercanas.
            </li>
            <li>
              <strong>Detalles de Transacciones:</strong> Comprobantes de transferencias, Zelle o Pago Móvil cargados para validación del modelo Escrow.
            </li>
          </ul>
        </div>
      ),
    },
    {
      id: "uso",
      title: "2. Uso de la Información",
      icon: Eye,
      content: (
        <div className="space-y-4">
          <p>
            Utilizamos la información recopilada para operar, mantener y mejorar nuestra plataforma de E-Commerce. Específicamente para:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-gray-600">
            <li>Procesar pedidos y facilitar el flujo de pago en custodia (Escrow).</li>
            <li>Validar tu perfil profesional para el acceso a insumos de uso clínico exclusivo.</li>
            <li>
              Calcular tarifas de envío personalizadas y clasificar las tiendas según la cercanía (BFS Proximity Scoring).
            </li>
            <li>Enviar notificaciones importantes de transacciones, ofertas y actualizaciones de seguridad.</li>
          </ul>
        </div>
      ),
    },
    {
      id: "seguridad",
      title: "3. Protección y Seguridad",
      icon: Lock,
      content: (
        <div className="space-y-4">
          <p>
            La seguridad de tus datos es nuestra prioridad fundamental. Hemos implementado medidas robustas para mitigar riesgos:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-gray-600">
            <li>
              <strong>Encriptación:</strong> Todo el tráfico de datos viaja mediante protocolos seguros HTTPS/TLS.
            </li>
            <li>
              <strong>Seguridad en Base de Datos:</strong> Reglas de Seguridad a Nivel de Fila (RLS) estrictas en Supabase para impedir accesos no autorizados.
            </li>
            <li>
              <strong>Control de Accesos:</strong> Acceso restringido al personal administrativo mediante tokens JWT firmados y con roles de seguridad específicos.
            </li>
          </ul>
        </div>
      ),
    },
    {
      id: "derechos",
      title: "4. Tus Derechos",
      icon: UserCheck,
      content: (
        <div className="space-y-4">
          <p>
            Tienes control total sobre tus datos personales. De acuerdo con las regulaciones de privacidad vigentes, puedes:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-gray-600">
            <li>Acceder, rectificar o actualizar los detalles de tu perfil en cualquier momento desde tu panel de cuenta.</li>
            <li>Solicitar la baja temporal o la eliminación total de tus registros en nuestra plataforma.</li>
            <li>Configurar tus preferencias de notificaciones para dejar de recibir comunicaciones no transaccionales.</li>
          </ul>
        </div>
      ),
    },
  ];

  const faqs = [
    {
      q: "¿Forcepx comparte mis métodos de pago con los vendedores?",
      a: "No. Todas las transacciones se realizan mediante nuestro sistema Escrow. El vendedor solo recibe los fondos liberados una vez confirmada la entrega exitosa del pedido. Tus comprobantes de pago solo son visibles para los administradores del sistema.",
    },
    {
      q: "¿Para qué recopilan mi ubicación en segundo plano?",
      a: "Recopilamos tu geolocalización solo bajo tu consentimiento para priorizar productos de tiendas que estén en tu mismo estado o municipio, reduciendo costos de envío y tiempos de entrega.",
    },
    {
      q: "¿Es seguro cargar mi licencia profesional?",
      a: "Sí. Tu licencia se almacena de forma encriptada en un bucket privado de Supabase Storage. Solo es visible para los administradores que validan el registro inicial para certificar que eres un profesional de la salud oral.",
    },
  ];

  const scrollToSection = (id) => {
    setActiveTab(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  return (
    <div className="bg-[#f9f9ff] min-h-screen py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative header gradient background */}
      <div className="absolute top-0 left-0 w-full h-[360px] bg-gradient-to-br from-[#4f0077] to-[#6b1e96] z-0">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#c3ff00_1px,transparent_1px)] [background-size:16px_16px]"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10 mt-10">
        {/* Page Title */}
        <div className="text-center text-white mb-16">
          <span className="bg-white/10 text-[#c3ff00] text-xs font-semibold tracking-widest uppercase px-3 py-1.5 rounded-full border border-white/10">
            Privacidad & Seguridad
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mt-4 mb-2 font-manrope">
            Política de Privacidad
          </h1>
          <p className="text-[#e6b4ff] font-inter max-w-xl mx-auto text-sm sm:text-base">
            Última actualización: 10 de Junio de 2026. Tu confianza es nuestro activo más valioso. Conoce cómo cuidamos tus datos.
          </p>
        </div>

        {/* Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Sidebar Navigation (Desktop only) */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="sticky top-24 bg-white rounded-2xl shadow-[0_4px_20px_rgba(25,28,32,0.03)] border border-gray-100 p-4">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-3 mb-4">
                Secciones
              </h3>
              <nav className="space-y-1">
                {sections.map((section) => {
                  const Icon = section.icon;
                  const isActive = activeTab === section.id;
                  return (
                    <button
                      key={section.id}
                      onClick={() => scrollToSection(section.id)}
                      className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left text-sm font-semibold transition-all cursor-pointer ${
                        isActive
                          ? "bg-[#6b1e96]/10 text-[#6b1e96] shadow-sm border-l-4 border-[#6b1e96]"
                          : "text-gray-500 hover:bg-gray-50 hover:text-gray-900 border-l-4 border-transparent"
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? "text-[#6b1e96]" : "text-gray-400"}`} />
                      <span>{section.title.split(". ")[1]}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Right Column: Policies Content */}
          <div className="lg:col-span-3 space-y-8">
            {/* Guarantee Cards Banner */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-purple-50 rounded-xl">
                  <Shield className="w-6 h-6 text-[#6b1e96]" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-sm">Datos Encriptados</h4>
                  <p className="text-xs text-gray-500">HTTPS & SSL activo</p>
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-purple-50 rounded-xl">
                  <Lock className="w-6 h-6 text-[#6b1e96]" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-sm">Cero Race Conditions</h4>
                  <p className="text-xs text-gray-500">Transacciones seguras</p>
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-purple-50 rounded-xl">
                  <UserCheck className="w-6 h-6 text-[#6b1e96]" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-sm">Control de Datos</h4>
                  <p className="text-xs text-gray-500">Derechos ARCO</p>
                </div>
              </div>
            </div>

            {/* Core Content Panels */}
            <div className="bg-white rounded-3xl shadow-[0_20px_40px_rgba(25,28,32,0.03)] border border-gray-100 p-6 sm:p-10 space-y-12">
              {sections.map((section) => {
                const Icon = section.icon;
                return (
                  <div
                    key={section.id}
                    id={section.id}
                    className="scroll-mt-24 transition-opacity duration-300 border-b border-gray-100 pb-10 last:border-0 last:pb-0"
                  >
                    <div className="flex items-center gap-4 mb-6">
                      <div className="p-3 bg-[#6b1e96]/5 rounded-2xl">
                        <Icon className="w-6 h-6 text-[#6b1e96]" />
                      </div>
                      <h2 className="text-2xl font-bold text-gray-900 font-manrope">
                        {section.title}
                      </h2>
                    </div>
                    <div className="text-gray-600 font-inter text-sm sm:text-base leading-relaxed pl-2">
                      {section.content}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Privacy FAQs Accordion */}
            <div className="bg-white rounded-3xl shadow-[0_20px_40px_rgba(25,28,32,0.03)] border border-gray-100 p-6 sm:p-10">
              <h3 className="text-2xl font-extrabold text-gray-900 font-manrope mb-6 flex items-center gap-2">
                <span>Preguntas Frecuentes sobre Privacidad</span>
              </h3>
              <div className="space-y-4">
                {faqs.map((faq, idx) => {
                  const isOpen = openFaq === idx;
                  return (
                    <div
                      key={idx}
                      className="border border-gray-100 rounded-2xl overflow-hidden transition-all duration-200"
                    >
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

            {/* Privacy Contact Footer Banner */}
            <div className="bg-gradient-to-br from-[#4f0077] to-[#6b1e96] rounded-3xl p-8 sm:p-10 text-white flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-2 text-center md:text-left">
                <h3 className="text-xl sm:text-2xl font-bold font-manrope">¿Tienes dudas adicionales?</h3>
                <p className="text-xs sm:text-sm text-[#e6b4ff] max-w-md">
                  Nuestro Oficial de Protección de Datos está a tu disposición para aclarar cualquier inquietud técnica o legal.
                </p>
              </div>
              <a
                href="mailto:privacidad@forcepx.com"
                className="flex items-center gap-2 bg-[#c3ff00] hover:bg-[#bcf600] text-[#151f00] font-bold py-3.5 px-6 rounded-xl transition-all shadow-md active:transform active:scale-95 font-inter text-sm whitespace-nowrap"
              >
                <Mail className="w-4 h-4" />
                <span>Escribir a Privacidad</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
