import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api, { getTrendingAPI, subscribeNewsletterAPI } from "../../services/api";
import toast from "react-hot-toast";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const [categories, setCategories] = useState([]);
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [discountPercent, setDiscountPercent] = useState(10);
  const [newsletterEnabled, setNewsletterEnabled] = useState(true);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email || !email.trim()) {
      toast.error("Por favor, ingresa tu correo electrónico.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      toast.error("Por favor, ingresa un correo electrónico válido.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await subscribeNewsletterAPI(email.trim());
      if (res.data?.success) {
        if (res.data?.alreadySubscribed) {
          toast.success(res.data.message || "Ya estás suscrito al boletín.");
        } else {
          toast.success(res.data.message || "¡Suscripción exitosa!");
          setEmail("");
        }
      } else {
        toast.error("Error al suscribirse. Inténtalo de nuevo.");
      }
    } catch (err) {
      console.error("Error al suscribirse al boletín:", err);
      toast.error(err.message || "Ocurrió un error al procesar tu solicitud.");
    } finally {
      setSubmitting(false);
    }
  };

  // Fallback de categorías en caso de que la API falle o no existan suficientes en la DB
  const FALLBACK_CATEGORIES = [
    { id: "all", name: "Instrumental Quirúrgico" },
    { id: "all", name: "Biomateriales" },
    { id: "all", name: "Equipos Mayores" },
    { id: "all", name: "Ortodoncia" },
    { id: "all", name: "Insumos Desechables" },
  ];

  useEffect(() => {
    let isMounted = true;
    getTrendingAPI({ cat_limit: 5 })
      .then((res) => {
        if (isMounted && res.data?.success) {
          // Tomar categorías destacadas de la respuesta
          const fetchedCats = res.data.data?.trending_categories || [];
          setCategories(fetchedCats);
        }
      })
      .catch((err) => {
        console.error("Error al cargar categorías destacadas en el Footer:", err);
      })
      .finally(() => {
        // Finally block kept for future loading indicators if needed
      });

    // Cargar la configuración del boletín (descuento y visibilidad) configurados dinámicamente
    api.get("/admin/settings")
      .then((res) => {
        if (isMounted && res.data?.success) {
          const discountVal = res.data.data?.newsletter_discount;
          if (discountVal?.percentage !== undefined) {
            setDiscountPercent(Number(discountVal.percentage));
          }
          const enabledVal = res.data.data?.newsletter_enabled;
          if (enabledVal?.enabled !== undefined) {
            setNewsletterEnabled(Boolean(enabledVal.enabled));
          }
        }
      })
      .catch((err) => {
        console.error("Error al cargar configuraciones del boletín en Footer:", err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const displayCategories = categories.length > 0 ? categories : FALLBACK_CATEGORIES;

  return (
    <footer className="w-full bg-white mt-auto border-t border-gray-100 flex flex-col">
      {/* ────────────────────────────────────────────────────────
          FRANJA SUPERIOR: NEWSLETTER (Color Corporativo Principal)
          ──────────────────────────────────────────────────────── */}
      {newsletterEnabled && (
        <div className="bg-gradient-to-r from-[#531575] via-[#6b1e96] to-[#531575] relative overflow-hidden border-b border-white/5 py-6 md:py-8 shadow-inner">
          {/* Glowing background details */}
          <div className="absolute -left-16 -top-16 w-32 h-32 bg-[#c3ff00]/10 rounded-full blur-2xl"></div>
          <div className="absolute -right-16 -bottom-16 w-32 h-32 bg-[#c3ff00]/10 rounded-full blur-2xl"></div>
          
          <div className="max-w-7xl mx-auto px-4 md:px-8 flex flex-col lg:flex-row items-center justify-between gap-6 relative z-10">
            {/* Textos Izquierda */}
            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 text-center lg:text-left">
              <div className="flex items-center justify-center lg:justify-start gap-3">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-[#c3ff00] shadow-sm backdrop-blur-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                  </svg>
                </div>
                <h3 className="text-xl md:text-2xl font-extrabold tracking-tight text-white font-['Manrope']">
                  Suscríbete a nuestro Boletín
                </h3>
              </div>
              <span className="text-sm font-medium text-purple-200 bg-white/5 border border-white/10 px-3 py-1 rounded-full backdrop-blur-sm self-center">
                ¡Recibe un <span className="text-[#c3ff00] font-bold">{discountPercent}% de descuento</span> en tu primera compra!
              </span>
            </div>

            {/* Input Derecha */}
            <form onSubmit={handleSubscribe} className="w-full max-w-md bg-white rounded-full p-1 pl-4 flex items-center shadow-lg border border-transparent focus-within:border-[#c3ff00]/40 transition-all">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={submitting}
                placeholder="Ingresa tu correo electrónico"
                className="w-full flex-1 bg-transparent border-none outline-none text-sm text-gray-800 placeholder-gray-400 focus:ring-0 focus:outline-none py-2"
                required
              />
              <button
                type="submit"
                disabled={submitting}
                className="bg-[#c3ff00] hover:bg-[#aee600] active:scale-95 text-[#531575] w-10 h-10 rounded-full flex items-center justify-center transition-all select-none shadow-md border-none outline-none shrink-0 disabled:bg-gray-300 disabled:text-gray-500 disabled:scale-100 disabled:shadow-none"
                aria-label="Suscribirse"
              >
                {submitting ? (
                  <div className="w-4 h-4 border-2 border-[#531575] border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4.5 h-4.5 transform rotate-45 -translate-x-0.5 translate-y-0.5 transition-transform duration-300 hover:translate-x-0 hover:-translate-y-0">
                    <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
                  </svg>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────
          CUERPO PRINCIPAL: ENLACES Y LOGO (Fondo Blanco)
          ──────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-x-8 gap-y-10">
        {/* COLUMNA 1: Marca y Redes (lg:col-span-2) */}
        <div className="lg:col-span-2 flex flex-col">
          {/* Logo Dentix Oficial */}
          <Link to="/" className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-md bg-[#c3ff00] flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-5 h-5 text-[#531575]"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4.5v15m7.5-7.5h-15"
                />
              </svg>
            </div>
            <span className="text-2xl font-bold tracking-widest text-[#531575] uppercase">
              Dentix
            </span>
          </Link>

          <h4 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wider">
            Métodos de Pago
          </h4>

          {/* Logos de Pago */}
          <div className="flex items-center flex-wrap gap-2 mb-8">
            <div className="h-6 px-2.5 bg-gray-100 border border-gray-200 rounded flex items-center justify-center text-[9px] font-bold text-gray-700">
              Transferencia
            </div>
            <div className="h-6 px-2.5 bg-gray-100 border border-gray-200 rounded flex items-center justify-center text-[9px] font-bold text-[#6b1e96]">
              Pago Móvil
            </div>
            <div className="h-6 px-2.5 bg-gray-100 border border-gray-200 rounded flex items-center justify-center text-[9px] font-bold text-blue-600 italic">
              PayPal
            </div>
            <div className="h-6 px-2.5 bg-gray-100 border border-gray-200 rounded flex items-center justify-center text-[9px] font-bold text-yellow-600">
              Binance
            </div>
            <div className="h-6 px-2.5 bg-gray-100 border border-gray-200 rounded flex items-center justify-center text-[9px] font-bold text-purple-600">
              Zelle
            </div>
          </div>

          {/* Redes Sociales */}
          <div className="flex items-center gap-4 text-gray-600">
            <a href="#" className="hover:text-[#6b1e96] transition-colors">
              <i className="fa-brands fa-instagram text-lg"></i>
            </a>
            <a href="#" className="hover:text-[#6b1e96] transition-colors">
              <i className="fa-brands fa-facebook text-lg"></i>
            </a>
            <a href="#" className="hover:text-[#6b1e96] transition-colors">
              <i className="fa-brands fa-x-twitter text-lg"></i>
            </a>
            <a href="#" className="hover:text-[#6b1e96] transition-colors">
              <i className="fa-brands fa-linkedin-in text-lg"></i>
            </a>
          </div>
        </div>

        {/* COLUMNA 2: Información */}
        <div className="flex flex-col">
          <h4 className="text-base font-bold text-[#531575] mb-5">
            Información
          </h4>
          <ul className="space-y-3 text-[14px] text-gray-500 font-medium">
            <li>
              <Link
                to="/acerca"
                className="hover:text-[#6b1e96] transition-colors"
              >
                Acerca de Nosotros
              </Link>
            </li>
            <li>
              <Link
                to="/privacidad"
                className="hover:text-[#6b1e96] transition-colors"
              >
                Política de Privacidad
              </Link>
            </li>
            <li>
              <Link
                to="/devoluciones"
                className="hover:text-[#6b1e96] transition-colors"
              >
                Política de Devoluciones
              </Link>
            </li>
            <li>
              <Link
                to="/terminos"
                className="hover:text-[#6b1e96] transition-colors"
              >
                Términos y Condiciones
              </Link>
            </li>
            <li>
              <Link
                to="/contacto"
                className="hover:text-[#6b1e96] transition-colors"
              >
                Contáctanos
              </Link>
            </li>
          </ul>
        </div>

        {/* COLUMNA 3: Mi Cuenta */}
        <div className="flex flex-col">
          <h4 className="text-base font-bold text-[#531575] mb-5">Mi Cuenta</h4>
          <ul className="space-y-3 text-[14px] text-gray-500 font-medium">
            <li>
              <Link
                to="/account"
                className="hover:text-[#6b1e96] transition-colors"
              >
                Mi Perfil
              </Link>
            </li>
            <li>
              <Link
                to="/account/orders"
                className="hover:text-[#6b1e96] transition-colors"
              >
                Mis Pedidos
              </Link>
            </li>
            <li>
              <Link
                to="/cart"
                className="hover:text-[#6b1e96] transition-colors"
              >
                Carrito de Compras
              </Link>
            </li>
            <li>
              <Link
                to="/account"
                className="hover:text-[#6b1e96] transition-colors"
              >
                Detalles de Cuenta
              </Link>
            </li>
            <li>
              <Link
                to="/account/orders"
                className="hover:text-[#6b1e96] transition-colors"
              >
                Seguimiento de Orden
              </Link>
            </li>
          </ul>
        </div>

        {/* COLUMNA 4: Enlaces Rápidos (Tienda) */}
        <div className="flex flex-col">
          <h4 className="text-base font-bold text-[#531575] mb-5">Tienda</h4>
          <ul className="space-y-3 text-[14px] text-gray-500 font-medium">
            <li>
              <Link
                to="/store-catalog"
                className="hover:text-[#6b1e96] transition-colors"
              >
                Catálogo Completo
              </Link>
            </li>
            <li>
              <Link
                to="/afiliate"
                className="hover:text-[#6b1e96] transition-colors"
              >
                Afíliate como Vendedor
              </Link>
            </li>
            <li>
              <Link
                to="/promociones"
                className="hover:text-[#6b1e96] transition-colors"
              >
                Descuentos
              </Link>
            </li>
            <li>
              <Link
                to="/store-catalog"
                className="hover:text-[#6b1e96] transition-colors"
              >
                Últimos Productos
              </Link>
            </li>
            <li>
              <Link
                to="/store-catalog"
                className="hover:text-[#6b1e96] transition-colors"
              >
                Ofertas Destacadas
              </Link>
            </li>
          </ul>
        </div>

        {/* COLUMNA 5: Categorías */}
        <div className="flex flex-col">
          <h4 className="text-base font-bold text-[#531575] mb-5">
            Categorías
          </h4>
          <ul className="space-y-3 text-[14px] text-gray-500 font-medium">
            {displayCategories.map((cat, idx) => (
              <li key={cat.id === "all" ? `fallback-${idx}` : cat.id}>
                <Link
                  to={cat.id === "all" ? "/store-catalog" : `/store-catalog?category=${cat.id}`}
                  className="hover:text-[#6b1e96] transition-colors"
                >
                  {cat.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────
          LÍNEA FINAL: COPYRIGHT
          ──────────────────────────────────────────────────────── */}
      <div className="border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-5">
          <p className="text-center text-gray-400 font-medium text-[13px]">
            Copyright {currentYear} &copy; All right reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
