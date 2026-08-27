import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useCurrency } from "../context/CurrencyContext";
import { useLocationContext } from "../hooks/useLocationContext";
import CartDrawer from "./cart/CartDrawer";
import LocationModal from "./LocationModal";
import NotificationBell from "./notifications/NotificationBell";
import useHomeSections from "../hooks/useHomeSections";
import { getCategoriesAPI } from "../services/api";

// FALLBACKS: Static config used while useHomeSections() is loading or if API fails
const HEADER_TOP_BAR = {
  promo_text: "Envío gratis en pedidos profesionales de más de $500.",
  promo_link_text: "Comprar esenciales de clínica",
  promo_link_url: "/store-catalog"
};
const HEADER_BRAND_NAME = "Forcepx";
const HEADER_NAV_LINKS = [
  { text: "Inicio", url: "/" },
  { text: "Tienda", url: "/store-catalog" },
  { text: "Promociones", url: "/promociones" },
  { text: "Estudios y Cursos", url: "/courses" },
  { text: "Publicaciones y Noticias", url: "/news" },
  { text: "Contacto", url: "/contacto" },
  { text: "Afíliate con nosotros", url: "/afiliate" }
];

const FALLBACK_CATEGORIES = [
  { id: "all", name: "Instrumentos", icon: "home_repair_service" },
  { id: "all", name: "Materiales de Impresión", icon: "layers" },
  { id: "all", name: "Ortodoncia", icon: "grid_view" },
  { id: "all", name: "Equipos de Rayos X", icon: "radiology" },
  { id: "all", name: "Desechables", icon: "delete" },
  { id: "all", name: "Mobiliario Dental", icon: "chair" },
  { id: "all", name: "Higiene Oral", icon: "mop" }
];

const getCategoryIcon = (name) => {
  if (!name) return "category";
  const lowerName = name.toLowerCase();
  if (lowerName.includes("resina") || lowerName.includes("composite")) return "science";
  if (lowerName.includes("instrument") || lowerName.includes("herramienta") || lowerName.includes("quirurgico")) return "handyman";
  if (lowerName.includes("anestesia")) return "vaccines";
  if (lowerName.includes("descartable") || lowerName.includes("desechable")) return "medication";
  if (lowerName.includes("ortodoncia")) return "airline_seat_flat_angled";
  if (lowerName.includes("rayos") || lowerName.includes("x-ray") || lowerName.includes("radiologia")) return "radiology";
  if (lowerName.includes("equipo") || lowerName.includes("mayor")) return "devices_other";
  if (lowerName.includes("biomaterial") || lowerName.includes("hueso")) return "biotech";
  if (lowerName.includes("mobiliario") || lowerName.includes("silla") || lowerName.includes("sillón")) return "chair";
  if (lowerName.includes("higiene") || lowerName.includes("oral") || lowerName.includes("limpieza")) return "mop";
  if (lowerName.includes("impresion") || lowerName.includes("impresión") || lowerName.includes("silicona")) return "layers";
  return "category";
};

export default function Header() {
  const { itemCount, total_usd, toggleDrawer } = useCart();
  const { user } = useAuth();
  const { buyerState, shouldShowPrompt, locationMethod } = useLocationContext();
  const navigate = useNavigate();
  const location = useLocation();
  const pathname = location.pathname;

  // Estados visuales mapeados (Fase 2)
  const { currency, setCurrency } = useCurrency();
  const [langOpen, setLangOpen] = useState(false);
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [categoriesDrawerOpen, setCategoriesDrawerOpen] = useState(false);
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [categoriesData, setCategoriesData] = useState([]);
  const [expandedCategories, setExpandedCategories] = useState({});

  // Cargar categorías con caché en localStorage
  useEffect(() => {
    const cached = localStorage.getItem("dental_categories_cache");
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Date.now() - parsed.timestamp < 5 * 60 * 1000) {
          setCategoriesData(parsed.data);
          return;
        }
      } catch (err) {
        console.warn("Error parsing cached categories in Header:", err);
      }
    }
    getCategoriesAPI()
      .then((res) => {
        const data = res.data?.data || [];
        setCategoriesData(data);
        localStorage.setItem("dental_categories_cache", JSON.stringify({ data, timestamp: Date.now() }));
      })
      .catch((err) => {
        console.error("Error loading categories in Header:", err);
      });
  }, []);

  const categoriesList = categoriesData.length > 0 ? categoriesData : FALLBACK_CATEGORIES;

  const toggleCategoryExpand = (id) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleCategoryClick = (id) => {
    setCategoriesDrawerOpen(false);
    setMobileMenuOpen(false);
    if (id === "all") {
      navigate("/store-catalog");
    } else {
      navigate(`/store-catalog?category=${id}`);
    }
  };

  // ─── Auto-abrir modal de ubicación en primera visita ───
  useEffect(() => {
    if (shouldShowPrompt && !locationModalOpen) {
      setLocationModalOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldShowPrompt]);

  // Búsqueda global → navega al catálogo con el query
  const handleGlobalSearch = (e) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    navigate(`/store-catalog?search=${encodeURIComponent(q)}`);
    setSearchQuery("");
    setMobileMenuOpen(false);
  };

  const { sections } = useHomeSections();
  const headerSection = sections?.header || {};

  const topBar = {
    promo_text: headerSection.top_bar?.promo_text || HEADER_TOP_BAR.promo_text,
    promo_link_text: headerSection.top_bar?.promo_link_text || HEADER_TOP_BAR.promo_link_text,
    promo_link_url: headerSection.top_bar?.promo_link_url || HEADER_TOP_BAR.promo_link_url
  };
  const brandName = headerSection.brand_name || HEADER_BRAND_NAME;
  const navLinks = Array.isArray(headerSection.nav_links) ? headerSection.nav_links : HEADER_NAV_LINKS;


  const cartCount = itemCount;

  // Helper para cerrar dropdowns de forma genérica
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(".dropdown-wrapper")) {
        setLangOpen(false);
        setCurrencyOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="w-full bg-white shadow-sm sticky top-0 z-50">
      {/* --- Top Bar --- */}
      <div className="bg-[#222222] border-b border-[#333333] hidden md:block text-[13px] md:text-[12px] text-gray-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[40px] md:h-[32px] flex justify-between items-center">
          <div className="top-left">
            <p className="m-0 text-white">
              {topBar.promo_text}{" "}
              <Link
                to={topBar.promo_link_url}
                className="text-gray-300 underline hover:text-white transition-colors"
              >
                {topBar.promo_link_text}
              </Link>
            </p>
          </div>
          <div className="top-right">
            <ul className="flex items-center space-x-4 m-0 p-0 list-none">
              <li>
                <button
                  onClick={() => {
                    if (user) {
                      navigate("/account/orders");
                    } else {
                      navigate("/login?redirect=/account/orders");
                    }
                  }}
                  className="hover:text-white transition-colors cursor-pointer bg-transparent border-none p-0 text-inherit font-inherit"
                >
                  Rastreo de pedido
                </button>
              </li>
              <li className="w-px h-3 bg-gray-500"></li>

              {/* Dropdown Idioma */}
              <li className="relative dropdown-wrapper text-white">
                <button
                  onClick={() => {
                    setLangOpen(!langOpen);
                    setCurrencyOpen(false);
                  }}
                  className="flex items-center gap-1 hover:text-gray-300 transition-colors cursor-pointer"
                >
                  <span>Español</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className={`w-3 h-3 transition-transform duration-200 ${langOpen ? "rotate-180" : ""}`}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m19.5 8.25-7.5 7.5-7.5-7.5"
                    />
                  </svg>
                </button>
                {langOpen && (
                  <ul className="absolute top-full right-0 mt-2 w-32 bg-white border border-gray-200 text-gray-800 shadow-md py-1 z-50">
                    <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer">
                      Inglés
                    </li>
                    <li className="px-4 py-2 bg-gray-100 text-[#531575] font-medium cursor-pointer">
                      Español
                    </li>
                  </ul>
                )}
              </li>
              <li className="w-px h-3 bg-gray-500"></li>

              {/* Dropdown Moneda */}
              <li className="relative dropdown-wrapper text-white">
                <button
                  onClick={() => {
                    setCurrencyOpen(!currencyOpen);
                    setLangOpen(false);
                  }}
                  className="flex items-center gap-1 hover:text-gray-300 transition-colors cursor-pointer"
                >
                  <span>{currency}</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className={`w-3 h-3 transition-transform duration-200 ${currencyOpen ? "rotate-180" : ""}`}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m19.5 8.25-7.5 7.5-7.5-7.5"
                    />
                  </svg>
                </button>
                {currencyOpen && (
                  <ul className="absolute top-full right-0 mt-2 w-24 bg-white border border-gray-200 text-gray-800 shadow-md py-1 z-50">
                    <li
                      onClick={() => setCurrency("USD")}
                      className={`px-4 py-2 hover:bg-gray-100 cursor-pointer ${currency === "USD" ? "bg-gray-100 text-[#531575] font-medium" : ""}`}
                    >
                      USD
                    </li>
                    <li
                      onClick={() => setCurrency("VES")}
                      className={`px-4 py-2 hover:bg-gray-100 cursor-pointer ${currency === "VES" ? "bg-gray-100 text-[#531575] font-medium" : ""}`}
                    >
                      VES
                    </li>
                  </ul>
                )}
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* --- Middle Bar (Main) --- */}
      <div className="py-4 md:py-3 bg-[#6b1e96]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center gap-4">
          {/* Mobile Hamburger (Temporal) */}
          <button
            className="md:hidden p-2 text-white hover:text-gray-200"
            onClick={() => setMobileMenuOpen(true)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
              />
            </svg>
          </button>

          {/* Logo Forcepx */}
          <div className="flex-shrink-0 flex items-center gap-2">
            <Link to="/" className="flex items-center gap-3">
              {headerSection.brand_logo ? (
                <div className="w-8 h-8 md:w-7 md:h-7 flex items-center justify-center">
                  <img
                    src={headerSection.brand_logo}
                    alt="Logo"
                    loading="eager"
                    fetchPriority="high"
                    className="w-full h-full object-contain rounded-md"
                    onError={(e) => {
                      e.target.style.display = "none";
                      const sibling = e.target.nextSibling;
                      if (sibling) sibling.style.display = "flex";
                    }}
                  />
                  <div className="hidden w-full h-full rounded-md bg-[#c3ff00] items-center justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="w-5 h-5 md:w-4 md:h-4 text-[#531575]"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 4.5v15m7.5-7.5h-15"
                      />
                    </svg>
                  </div>
                </div>
              ) : (
                <div className="w-8 h-8 md:w-7 md:h-7 rounded-md bg-[#c3ff00] flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-5 h-5 md:w-4 md:h-4 text-[#531575]"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 4.5v15m7.5-7.5h-15"
                    />
                  </svg>
                </div>
              )}
              <span className="text-lg sm:text-xl md:text-2xl font-bold tracking-widest text-white uppercase">
                {brandName}
              </span>
            </Link>

            {/* Header Location Widget (Desktop) */}
            <div 
              className="hidden md:flex flex-col justify-center items-start cursor-pointer hover:outline hover:outline-1 hover:outline-white p-1.5 rounded-sm text-white ml-2 transition-all"
              onClick={() => setLocationModalOpen(true)}
            >
              <span className="text-[10px] text-gray-300 ml-4 font-normal tracking-wide">
                Enviar a
              </span>
              <div className="flex items-center gap-0.5 font-bold text-sm leading-tight">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-white">
                  <path fillRule="evenodd" d="m11.54 22.351.07.04.028.016a.76.76 0 0 0 .723 0l.028-.015.071-.041a16.975 16.975 0 0 0 1.144-.742 19.58 19.58 0 0 0 2.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 0 0-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 0 0 2.682 2.282 16.975 16.975 0 0 0 1.145.742ZM12 13.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" clipRule="evenodd" />
                </svg>
                <span className="whitespace-nowrap truncate max-w-[120px]">
                  {buyerState || "Venezuela"}
                </span>
                {locationMethod === "auto" && buyerState && (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3 text-[#c3ff00] flex-shrink-0" title="Ubicación detectada por GPS">
                    <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="hidden md:flex flex-1 max-w-3xl px-8 ml-8">
            <form
              onSubmit={handleGlobalSearch}
              className="w-full relative shadow-sm rounded-full overflow-hidden bg-white"
            >
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar autoclaves, piezas de mano, instrumental..."
                className="w-full px-6 py-2 border-none focus:outline-none text-gray-800 rounded-full text-sm"
              />
              <button
                type="submit"
                className="absolute right-1 top-1 bottom-1 bg-[#c3ff00] hover:bg-[#aee600] text-[#531575] w-14 rounded-full transition duration-200 flex items-center justify-center shadow-sm"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2.5}
                  stroke="currentColor"
                  className="w-4 h-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                  />
                </svg>
              </button>
            </form>
          </div>

          {/* User Actions (Avatar y Carrito) */}
          <div className="flex items-center space-x-3 sm:space-x-4 md:space-x-6 text-white">
            {/* Action Item: Avatar / Login */}
            <div className="relative group cursor-pointer hover:text-gray-200 transition-colors">
              <button
                onClick={() => navigate("/account")}
                className="relative flex items-center gap-2 justify-center outline-none bg-transparent border-none p-0"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-6 h-6 md:w-5 md:h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
                  />
                </svg>
                <span className="font-medium text-xs hidden lg:block tracking-wide">
                  Cuenta
                </span>
              </button>
            </div>

            {/* Action Item: Rider Dashboard (Delivery role only) */}
            {user?.role === "delivery" && (
              <button
                onClick={() => navigate("/delivery")}
                className="relative flex items-center gap-1 lg:gap-2 justify-center outline-none bg-transparent border-none p-0 cursor-pointer hover:text-gray-200 transition-colors group"
                title="Mis Entregas"
              >
                <span className="material-symbols-outlined text-[22px] md:text-[20px] text-[#c3ff00] group-hover:text-white transition-colors">two_wheeler</span>
                <span className="font-medium text-xs hidden lg:block tracking-wide text-[#c3ff00] group-hover:text-white transition-colors">
                  Mis Entregas
                </span>
              </button>
            )}

            {/* Action Item: Store Dashboard (Store role only) */}
            {user?.role === "store" && (
              <button
                onClick={() => navigate("/store")}
                className="relative flex items-center gap-1 lg:gap-2 justify-center outline-none bg-transparent border-none p-0 cursor-pointer hover:text-gray-200 transition-colors group"
                title="Mi Tienda"
              >
                <span className="material-symbols-outlined text-[22px] md:text-[20px] text-[#c3ff00] group-hover:text-white transition-colors">storefront</span>
                <span className="font-medium text-xs hidden lg:block tracking-wide text-[#c3ff00] group-hover:text-white transition-colors">
                  Mi Tienda
                </span>
              </button>
            )}

            {/* Action Item: Admin Dashboard (Admin or Owner role) */}
            {(user?.role === "admin" || user?.role === "owner") && (
              <button
                onClick={() => navigate("/admin")}
                className="relative flex items-center gap-1 lg:gap-2 justify-center outline-none bg-transparent border-none p-0 cursor-pointer hover:text-gray-200 transition-colors group"
                title="Panel Admin"
              >
                <span className="material-symbols-outlined text-[22px] md:text-[20px] text-[#c3ff00] group-hover:text-white transition-colors">admin_panel_settings</span>
                <span className="font-medium text-xs hidden lg:block tracking-wide text-[#c3ff00] group-hover:text-white transition-colors">
                  Panel Admin
                </span>
              </button>
            )}

            {/* Action Item: Gestión Clínica B2B (solo odontólogos/clínicas) */}
            {(user?.role === "professional" || user?.role === "student") && (
              <button
                onClick={() => navigate("/clinic")}
                className="relative flex items-center gap-1 lg:gap-2 justify-center outline-none bg-transparent border-none p-0 cursor-pointer hover:text-gray-200 transition-colors group"
                title="Gestión Clínica B2B"
              >
                <span className="material-symbols-outlined text-[22px] md:text-[20px] text-[#c3ff00] group-hover:text-white transition-colors">local_hospital</span>
                <span className="font-medium text-xs hidden lg:block tracking-wide text-[#c3ff00] group-hover:text-white transition-colors">
                  Gestión Clínica
                </span>
              </button>
            )}

            {/* Action Item: Notification Bell */}
            <NotificationBell />

            {/* Action Item: Cart */}
            <div
              className="relative cursor-pointer hover:text-gray-200 transition-colors flex items-center gap-2"
              onClick={toggleDrawer}
            >
              <div className="relative">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-6 h-6 md:w-5 md:h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"
                  />
                </svg>
                {cartCount > 0 && (
                  <span className="absolute -top-[10px] -right-[12px] md:-top-[8px] md:-right-[8px] bg-[#ff6b00] text-white text-[10px] md:text-[9px] font-bold rounded-full h-5 w-5 md:h-4 md:w-4 flex items-center justify-center shadow-sm">
                    {cartCount}
                  </span>
                )}
              </div>
              <span className="font-medium text-xs hidden lg:block tracking-wide">
                Carrito{" "}
                <span className="opacity-90 font-normal">
                  (${total_usd.toFixed(2)})
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* --- Bottom Bar (Nav) --- */}
      <div className="hidden md:block bg-[#531575] shadow-sm h-[40px]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center">
          {/* Categorias Especial Boton (Integrado) */}
          <div 
            onClick={() => setCategoriesDrawerOpen(true)}
            className="bg-[#6b1e96] hover:bg-[#7e25b0] text-white cursor-pointer px-6 h-full flex items-center gap-2 font-semibold tracking-wide transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-4 h-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
              />
            </svg>
            <span className="text-[12px] uppercase">Todas las Categorías</span>
          </div>

          <nav className="flex-1 ml-10 h-full">
            <ul className="flex items-center space-x-6 text-[12px] font-bold tracking-wide text-white uppercase h-full">
              {navLinks.map((link, idx) => {
                const isActive = link.url === "/" ? pathname === "/" : pathname.startsWith(link.url);
                return (
                  <li key={idx} className="relative h-full flex items-center group py-2">
                    <Link
                      to={link.url}
                      className={`transition-colors duration-200 ${
                        isActive ? "text-[#c3ff00]" : "text-white hover:text-[#c3ff00]"
                      }`}
                    >
                      {link.text}
                    </Link>
                    {/* Barra de acento inferior animada */}
                    <span
                      className={`absolute bottom-0 left-0 h-[3px] bg-[#c3ff00] rounded-t-full transition-all duration-300 origin-left ${
                        isActive ? "w-full" : "w-0 group-hover:w-full"
                      }`}
                    />
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </div>

      {/* --- MOBILE NAV DRAWER --- */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[200] md:hidden">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          {/* Drawer Panel */}
          <div className="absolute left-0 top-0 h-full w-[280px] bg-white shadow-2xl flex flex-col animate-in slide-in-from-left duration-200">
            {/* Drawer Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-[#6b1e96]">
              <Link to="/" className="flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
                {headerSection.brand_logo ? (
                  <div className="w-7 h-7 flex items-center justify-center">
                    <img
                      src={headerSection.brand_logo}
                      alt="Logo"
                      loading="eager"
                      className="w-full h-full object-contain rounded-md"
                      onError={(e) => {
                        e.target.style.display = "none";
                        const sibling = e.target.nextSibling;
                        if (sibling) sibling.style.display = "flex";
                      }}
                    />
                    <div className="hidden w-full h-full rounded-md bg-[#c3ff00] items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-[#531575]">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                      </svg>
                    </div>
                  </div>
                ) : (
                  <div className="w-7 h-7 rounded-md bg-[#c3ff00] flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-[#531575]">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                  </div>
                )}
                <span className="text-lg font-bold tracking-widest text-white uppercase">{brandName}</span>
              </Link>
              <button onClick={() => setMobileMenuOpen(false)} className="p-1.5 rounded-lg hover:bg-white/10 text-white">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Mobile Search */}
            <div className="px-4 py-3 border-b border-gray-100">
              <form onSubmit={handleGlobalSearch} className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar productos..."
                  className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#6b1e96]/30 focus:border-[#6b1e96]"
                />
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="absolute left-3 top-3 w-4 h-4 text-gray-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                </svg>
              </form>
            </div>

            {/* Mobile Location Selector */}
            <div className="px-4 py-3 border-b border-gray-100">
              <button
                onClick={() => {
                  setLocationModalOpen(true);
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-gray-50 text-gray-700 text-sm font-semibold hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-gray-400">
                    <path fillRule="evenodd" d="m11.54 22.351.07.04.028.016a.76.76 0 0 0 .723 0l.028-.015.071-.041a16.975 16.975 0 0 0 1.144-.742 19.58 19.58 0 0 0 2.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 0 0-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 0 0 2.682 2.282 16.975 16.975 0 0 0 1.145.742ZM12 13.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-600">Enviar a: <span className="font-bold text-[#6b1e96]">{buyerState || "Venezuela"}</span></span>
                </div>
                <span className="material-symbols-outlined text-gray-400" style={{ fontSize: '18px' }}>
                  edit
                </span>
              </button>
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 overflow-y-auto py-2">
              <div className="px-3 space-y-0.5">
                {navLinks.map((link, idx) => {
                  const isActive = link.url === "/" ? pathname === "/" : pathname.startsWith(link.url);
                  return (
                    <Link
                      key={idx}
                      to={link.url}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-200 ${
                        isActive
                          ? "bg-[#6b1e96]/10 text-[#6b1e96] border-l-4 border-[#6b1e96] pl-3"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <span
                        className={`material-symbols-outlined transition-colors ${
                          isActive ? "text-[#6b1e96]" : "text-gray-400"
                        }`}
                        style={{ fontSize: "20px" }}
                      >
                        {idx === 0 ? "home" : idx === navLinks.length - 1 ? "storefront" : "label"}
                      </span>
                      {link.text}
                    </Link>
                  );
                })}
              </div>

              {/* Divider + Categories */}
              <div className="mx-4 my-3 border-t border-gray-100" />
              <p className="px-6 text-[10px] font-bold uppercase text-[#6b1e96] tracking-widest mb-2">Categorías</p>
              
              <div className="px-3 space-y-1.5">
                {/* Opción de Ver todo el catálogo en móvil */}
                <button
                  onClick={() => handleCategoryClick("all")}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-slate-700 hover:bg-purple-50 hover:text-[#6b1e96] font-bold text-sm text-left transition-colors border border-transparent hover:border-purple-100"
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-slate-400" style={{ fontSize: '20px' }}>
                      grid_view
                    </span>
                    <span>Ver todo el catálogo</span>
                  </div>
                </button>

                {categoriesList.map((cat) => {
                  const hasChildren = cat.children && cat.children.length > 0;
                  const isExpanded = !!expandedCategories[cat.id];
                  const iconName = cat.icon || getCategoryIcon(cat.name);

                  return (
                    <div key={cat.id} className="flex flex-col">
                      {hasChildren ? (
                        <button
                          onClick={() => toggleCategoryExpand(cat.id)}
                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-slate-700 font-semibold text-sm text-left transition-colors ${
                            isExpanded ? 'bg-purple-50 text-[#6b1e96] font-bold' : 'hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className={`material-symbols-outlined ${isExpanded ? 'text-[#6b1e96]' : 'text-slate-400'}`} style={{ fontSize: '20px' }}>
                              {iconName}
                            </span>
                            <span>{cat.name}</span>
                          </div>
                          <span className={`material-symbols-outlined text-slate-400 transition-transform duration-300 ${isExpanded ? 'rotate-90 text-[#6b1e96]' : ''}`} style={{ fontSize: '18px' }}>
                            chevron_right
                          </span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleCategoryClick(cat.id)}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-700 hover:bg-gray-50 text-sm font-semibold text-left transition-colors"
                        >
                          <span className="material-symbols-outlined text-slate-400" style={{ fontSize: '20px' }}>
                            {iconName}
                          </span>
                          <span>{cat.name}</span>
                        </button>
                      )}

                      {hasChildren && isExpanded && (
                        <div className="pl-5 pr-1 py-1 space-y-1 border-l-2 border-purple-100 ml-5 mt-1 animate-in fade-in duration-200">
                          <button
                            onClick={() => handleCategoryClick(cat.id)}
                            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[#6b1e96] hover:bg-purple-50/40 text-xs font-bold text-left transition-colors"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-[#c3ff00] border border-[#6b1e96]"></span>
                            <span>Ver todo en {cat.name}</span>
                          </button>
                          {cat.children.map((sub) => (
                            <button
                              key={sub.id}
                              onClick={() => handleCategoryClick(sub.id)}
                              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-slate-500 hover:bg-gray-50 text-xs font-medium text-left transition-colors"
                            >
                              <span className="material-symbols-outlined text-slate-300" style={{ fontSize: '14px' }}>
                                subdirectory_arrow_right
                              </span>
                              <span>{sub.name}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </nav>

            {/* Drawer Footer */}
            <div className="border-t border-gray-100 p-4">
              {user ? (
                <div className="space-y-2">
                  {user?.role === "delivery" && (
                    <Link to="/delivery" onClick={() => setMobileMenuOpen(false)} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[#f3e8ff] text-[#6b1e96] text-sm font-bold hover:bg-[#e9d5ff] transition-colors">
                      <span className="material-symbols-outlined text-[20px]">two_wheeler</span>
                      Mis Entregas
                    </Link>
                  )}
                  {user?.role === "store" && (
                    <Link to="/store" onClick={() => setMobileMenuOpen(false)} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[#e0f2fe] text-[#0369a1] text-sm font-bold hover:bg-[#bae6fd] transition-colors">
                      <span className="material-symbols-outlined text-[20px]">storefront</span>
                      Mi Tienda
                    </Link>
                  )}
                  {(user?.role === "admin" || user?.role === "owner") && (
                    <Link to="/admin" onClick={() => setMobileMenuOpen(false)} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[#fee2e2] text-[#b91c1c] text-sm font-bold hover:bg-[#fecaca] transition-colors">
                      <span className="material-symbols-outlined text-[20px]">admin_panel_settings</span>
                      Panel Admin
                    </Link>
                  )}
                  {(user?.role === "professional" || user?.role === "student") && (
                    <Link to="/clinic" onClick={() => setMobileMenuOpen(false)} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[#f3e8ff] text-[#6b1e96] text-sm font-bold hover:bg-[#e9d5ff] transition-colors">
                      <span className="material-symbols-outlined text-[20px]">local_hospital</span>
                      Gestión Clínica B2B
                    </Link>
                  )}
                  <Link to="/account" onClick={() => setMobileMenuOpen(false)} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gray-50 text-gray-700 text-sm font-medium hover:bg-gray-100 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-400">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                    </svg>
                    Mi Cuenta
                  </Link>
                </div>
              ) : (
                <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#6b1e96] text-white rounded-xl font-medium text-sm hover:bg-[#531575] transition-colors shadow-sm">
                  Iniciar Sesión
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- DESKTOP CATEGORIES DRAWER (YouTube Style) --- */}
      {categoriesDrawerOpen && (
        <div className="fixed inset-0 z-[200]">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
            onClick={() => setCategoriesDrawerOpen(false)}
          />
          {/* Drawer Panel */}
          <div className="absolute left-0 top-0 h-full w-[320px] bg-white shadow-2xl flex flex-col animate-in slide-in-from-left duration-200">
            {/* Drawer Header */}
            <div className="flex items-center justify-between px-5 py-5 border-b border-gray-100 bg-gradient-to-r from-[#531575] via-[#6b1e96] to-[#531575] relative overflow-hidden">
              <div className="absolute -left-10 -top-10 w-24 h-24 bg-[#c3ff00]/10 rounded-full blur-xl"></div>
              <div className="flex items-center gap-2.5 relative z-10">
                {headerSection.brand_logo ? (
                  <div className="w-8 h-8 flex items-center justify-center">
                    <img
                      src={headerSection.brand_logo}
                      alt="Logo"
                      loading="eager"
                      className="w-full h-full object-contain rounded-lg"
                      onError={(e) => {
                        e.target.style.display = "none";
                        const sibling = e.target.nextSibling;
                        if (sibling) sibling.style.display = "flex";
                      }}
                    />
                    <div className="hidden w-full h-full rounded-lg bg-[#c3ff00] items-center justify-center shadow-sm">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-[#531575]">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                      </svg>
                    </div>
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-[#c3ff00] flex items-center justify-center shadow-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-[#531575]">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                  </div>
                )}
                <div className="flex flex-col">
                  <span className="text-lg font-extrabold tracking-widest text-white uppercase leading-none">{brandName}</span>
                  <span className="text-[10px] text-purple-200 font-semibold tracking-wider mt-0.5">Categorías</span>
                </div>
              </div>
              <button 
                onClick={() => setCategoriesDrawerOpen(false)} 
                className="p-1.5 rounded-lg hover:bg-white/10 text-white transition-colors relative z-10 cursor-pointer"
                aria-label="Cerrar menú"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Contexto del Drawer */}
            <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5" style={{ scrollbarWidth: "thin" }}>
              {/* Opción de Ver Todo el Catálogo */}
              <button
                onClick={() => handleCategoryClick("all")}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-slate-700 hover:bg-purple-50 hover:text-[#6b1e96] font-bold text-sm transition-all duration-200 text-left border border-transparent hover:border-purple-100 group shadow-sm bg-slate-50/50"
              >
                <div className="flex items-center gap-3.5">
                  <span className="material-symbols-outlined text-slate-400 group-hover:text-[#6b1e96] transition-colors" style={{ fontSize: '22px' }}>
                    grid_view
                  </span>
                  <span>Ver todo el catálogo</span>
                </div>
                <span className="material-symbols-outlined text-slate-300 group-hover:text-[#6b1e96] transition-transform duration-200 group-hover:translate-x-1" style={{ fontSize: '18px' }}>
                  arrow_forward
                </span>
              </button>

              <div className="h-px bg-slate-100 my-2"></div>

              {categoriesList.map((cat) => {
                const hasChildren = cat.children && cat.children.length > 0;
                const isExpanded = !!expandedCategories[cat.id];
                const iconName = cat.icon || getCategoryIcon(cat.name);

                return (
                  <div key={cat.id} className="flex flex-col">
                    {hasChildren ? (
                      /* Category button with children (interactive expand/collapse) */
                      <button
                        onClick={() => toggleCategoryExpand(cat.id)}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-slate-700 font-semibold text-sm transition-all duration-200 text-left border ${
                          isExpanded 
                            ? 'bg-purple-50/70 text-[#6b1e96] border-purple-100/60 font-bold' 
                            : 'border-transparent hover:bg-slate-50 hover:text-slate-900'
                        }`}
                      >
                        <div className="flex items-center gap-3.5">
                          <span className={`material-symbols-outlined ${isExpanded ? 'text-[#6b1e96]' : 'text-slate-400'} transition-colors`} style={{ fontSize: '22px' }}>
                            {iconName}
                          </span>
                          <span>{cat.name}</span>
                        </div>
                        <span 
                          className={`material-symbols-outlined text-slate-400 transition-transform duration-300 ${isExpanded ? 'rotate-90 text-[#6b1e96]' : ''}`} 
                          style={{ fontSize: '20px' }}
                        >
                          chevron_right
                        </span>
                      </button>
                    ) : (
                      /* Category button without children (direct navigation) */
                      <button
                        onClick={() => handleCategoryClick(cat.id)}
                        className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-slate-700 hover:bg-slate-50 hover:text-slate-900 font-semibold text-sm transition-all duration-200 text-left border border-transparent"
                      >
                        <div className="flex items-center gap-3.5">
                          <span className="material-symbols-outlined text-slate-400" style={{ fontSize: '22px' }}>
                            {iconName}
                          </span>
                          <span>{cat.name}</span>
                        </div>
                      </button>
                    )}

                    {/* Subcategories (Children) List with smooth height transition */}
                    {hasChildren && isExpanded && (
                      <div className="pl-6 pr-2 py-1.5 space-y-1 border-l-2 border-purple-100 ml-6 mt-1.5 mb-2 animate-in fade-in duration-200">
                        {/* Option to view all under this category */}
                        <button
                          onClick={() => handleCategoryClick(cat.id)}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[#6b1e96]/80 hover:text-[#6b1e96] hover:bg-purple-50/40 text-xs font-bold text-left transition-colors"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-[#c3ff00] border border-[#6b1e96]"></span>
                          <span>Ver todo en {cat.name}</span>
                        </button>

                        {cat.children.map((sub) => (
                          <button
                            key={sub.id}
                            onClick={() => handleCategoryClick(sub.id)}
                            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-slate-500 hover:text-[#6b1e96] hover:bg-purple-50/40 text-xs font-medium text-left transition-colors"
                          >
                            <span className="material-symbols-outlined text-slate-300" style={{ fontSize: '14px' }}>
                              subdirectory_arrow_right
                            </span>
                            <span>{sub.name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>
          </div>
        </div>
      )}

      {/* --- CART DRAWER OVERLAY --- FASE 3 --- */}
      <CartDrawer />

      {/* --- LOCATION MODAL --- */}
      <LocationModal 
        isOpen={locationModalOpen} 
        onClose={() => setLocationModalOpen(false)} 
      />
    </header>
  );
}
