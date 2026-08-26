import { Link } from "react-router-dom";
import useHomeSections from "../../hooks/useHomeSections";
import { useAuth } from "../../context/AuthContext";

const DEFAULT_FEATURES = [
  { icon: "support_agent", title: "Soporte 24/7", description: "Asistencia especializada", link: "/account/support" },
  { icon: "payments", title: "Pago Seguro", description: "Transacciones protegidas", link: "/terminos#pago-escrow" },
  { icon: "local_shipping", title: "Envío Gratis", description: "En pedidos mayores a $500", link: "/terminos#envios" },
  { icon: "assignment_return", title: "Garantía FORCEPX", description: "30 días de satisfacción", link: "/devoluciones" }
];

// Fallback para las barras ya guardadas en BD antes de que existiera el campo `link`.
const normalize = (t) =>
  (t || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

const FALLBACK_LINKS = DEFAULT_FEATURES.reduce((acc, f) => {
  acc[normalize(f.title)] = f.link;
  return acc;
}, {});

export default function FeaturesBar() {
  const { sections } = useHomeSections();
  const { user } = useAuth();
  const data = sections?.features_bar || {};

  const features = data.features || DEFAULT_FEATURES;

  // Las rutas de /account exigen sesión: sin usuario, soporte cae en /contacto y el resto en /login.
  const resolveLink = (link) => {
    if (!link || user || !link.startsWith("/account")) return link;
    return link.startsWith("/account/support") ? "/contacto" : "/login";
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-brand overflow-hidden mb-12">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-gray-200">

        {features.map((feature, idx) => {
          // Vacío (guardado antes de que existiera el campo) o "#" (el marcador del editor
          // viejo, que no navega a ninguna parte) valen como "sin destino": manda el default.
          const configured = (feature.link || "").trim();
          const useFallback = !configured || configured === "#";
          const to = resolveLink(useFallback ? FALLBACK_LINKS[normalize(feature.title)] : configured);
          const inner = (
            <>
              <div className="flex-shrink-0 text-primary-600">
                <span className="material-symbols-outlined text-4xl">{feature.icon}</span>
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-gray-900 text-sm md:text-base uppercase tracking-wide">
                  {feature.title}
                </h3>
                <p className="text-gray-500 text-xs md:text-sm mt-0.5">{feature.description}</p>
              </div>
              {to && (
                <span className="material-symbols-outlined text-gray-300 group-hover:text-primary-600 group-hover:translate-x-0.5 transition-all ml-auto text-xl">
                  chevron_right
                </span>
              )}
            </>
          );

          const baseClass = "flex items-center gap-4 p-6 transition-colors";

          if (!to) {
            return (
              <div key={idx} className={`${baseClass} hover:bg-slate-50 cursor-default`}>
                {inner}
              </div>
            );
          }

          if (/^https?:\/\//i.test(to)) {
            return (
              <a
                key={idx}
                href={to}
                target="_blank"
                rel="noopener noreferrer"
                className={`${baseClass} group hover:bg-slate-50 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-inset`}
              >
                {inner}
              </a>
            );
          }

          return (
            <Link
              key={idx}
              to={to}
              className={`${baseClass} group hover:bg-slate-50 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-inset`}
            >
              {inner}
            </Link>
          );
        })}

      </div>
    </div>
  );
}
