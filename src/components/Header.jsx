import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useLocationContext } from "../hooks/useLocationContext";
import CartDrawer from "./cart/CartDrawer";
import LocationModal from "./LocationModal";

export default function Header() {
  const { items, total_usd, toggleDrawer } = useCart();
  const { user } = useAuth();
  const { buyerState } = useLocationContext();
  const navigate = useNavigate();

  // Estados visuales mapeados (Fase 2)
  const [langOpen, setLangOpen] = useState(false);
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [currency, setCurrency] = useState("USD");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [categoriesDrawerOpen, setCategoriesDrawerOpen] = useState(false);
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Búsqueda global → navega al catálogo con el query
  const handleGlobalSearch = (e) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    navigate(`/store-catalog?search=${encodeURIComponent(q)}`);
    setSearchQuery("");
    setMobileMenuOpen(false);
  };

  // LOGOUT (Fase 4: lo re-integraremos en el Sidebar)
  // const handleLogout = async () => { ... }

  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);

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
              Envío gratis en pedidos profesionales de más de $500.{" "}
              <Link
                to="#"
                className="text-gray-300 underline hover:text-white transition-colors"
              >
                Comprar esenciales de clínica
              </Link>
            </p>
          </div>
          <div className="top-right">
            <ul className="flex items-center space-x-4 m-0 p-0 list-none">
              <li>
                <Link to="#" className="hover:text-white transition-colors">
                  Rastreo de pedido
                </Link>
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

          {/* Logo Dentix */}
          <div className="flex-shrink-0 flex items-center gap-2">
            <Link to="/" className="flex items-center gap-3">
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
              <span className="text-2xl md:text-xl font-bold tracking-widest text-white uppercase">
                Dentix
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
          <div className="flex items-center space-x-6 text-white">
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

          <nav className="flex-1 ml-10">
            <ul className="flex items-center space-x-6 text-[12px] font-bold tracking-wide text-white uppercase">
              <li>
                <Link to="/" className="hover:text-[#c3ff00] transition-colors">
                  Inicio
                </Link>
              </li>
              <li>
                <Link to="/store-catalog" className="hover:text-[#c3ff00] transition-colors">
                  Tienda
                </Link>
              </li>
              <li>
                <Link to="#" className="hover:text-[#c3ff00] transition-colors">
                  Ortodoncia
                </Link>
              </li>
              <li>
                <Link to="#" className="hover:text-[#c3ff00] transition-colors">
                  Esterilización
                </Link>
              </li>
              <li>
                <Link to="#" className="hover:text-[#c3ff00] transition-colors">
                  Contacto
                </Link>
              </li>
              <li>
                <Link to="/afiliate" className="hover:text-[#c3ff00] transition-colors">
                  Afíliate con nosotros
                </Link>
              </li>
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
                <div className="w-7 h-7 rounded-md bg-[#c3ff00] flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-[#531575]">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                </div>
                <span className="text-lg font-bold tracking-widest text-white uppercase">Dentix</span>
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

            {/* Navigation Links */}
            <nav className="flex-1 overflow-y-auto py-2">
              <div className="px-3 space-y-0.5">
                <Link to="/" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-3 rounded-xl text-gray-700 hover:bg-gray-50 font-medium text-sm transition-colors">
                  <span className="material-symbols-outlined text-gray-400" style={{fontSize: '20px'}}>home</span>
                  Inicio
                </Link>
                <Link to="/store-catalog" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-3 rounded-xl text-gray-700 hover:bg-gray-50 font-medium text-sm transition-colors">
                  <span className="material-symbols-outlined text-gray-400" style={{fontSize: '20px'}}>storefront</span>
                  Tienda
                </Link>
                <Link to="#" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-3 rounded-xl text-gray-700 hover:bg-gray-50 font-medium text-sm transition-colors">
                  <span className="material-symbols-outlined text-gray-400" style={{fontSize: '20px'}}>grid_view</span>
                  Ortodoncia
                </Link>
                <Link to="#" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-3 rounded-xl text-gray-700 hover:bg-gray-50 font-medium text-sm transition-colors">
                  <span className="material-symbols-outlined text-gray-400" style={{fontSize: '20px'}}>clean_hands</span>
                  Esterilización
                </Link>
                <Link to="#" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-3 rounded-xl text-gray-700 hover:bg-gray-50 font-medium text-sm transition-colors">
                  <span className="material-symbols-outlined text-gray-400" style={{fontSize: '20px'}}>call</span>
                  Contacto
                </Link>
                <Link to="/afiliate" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-3 rounded-xl text-[#6b1e96] bg-[#6b1e96]/5 hover:bg-[#6b1e96]/10 font-semibold text-sm transition-colors">
                  <span className="material-symbols-outlined text-[#6b1e96]" style={{fontSize: '20px'}}>storefront</span>
                  Afíliate con nosotros
                </Link>
              </div>

              {/* Divider + Categories */}
              <div className="mx-4 my-3 border-t border-gray-100" />
              <p className="px-6 text-[10px] font-bold uppercase text-gray-400 tracking-widest mb-1">Categorías</p>
              <div className="px-3 space-y-0.5">
                <Link to="#" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-600 hover:bg-gray-50 text-sm transition-colors">
                  <span className="material-symbols-outlined text-gray-400" style={{fontSize: '18px'}}>home_repair_service</span>
                  Instrumentos
                </Link>
                <Link to="#" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-600 hover:bg-gray-50 text-sm transition-colors">
                  <span className="material-symbols-outlined text-gray-400" style={{fontSize: '18px'}}>layers</span>
                  Materiales de Impresión
                </Link>
                <Link to="#" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-600 hover:bg-gray-50 text-sm transition-colors">
                  <span className="material-symbols-outlined text-gray-400" style={{fontSize: '18px'}}>radiology</span>
                  Equipos de Rayos X
                </Link>
                <Link to="#" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-600 hover:bg-gray-50 text-sm transition-colors">
                  <span className="material-symbols-outlined text-gray-400" style={{fontSize: '18px'}}>delete</span>
                  Desechables
                </Link>
              </div>
            </nav>

            {/* Drawer Footer */}
            <div className="border-t border-gray-100 p-4">
              {user ? (
                <div className="space-y-2">
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
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setCategoriesDrawerOpen(false)}
          />
          {/* Drawer Panel */}
          <div className="absolute left-0 top-0 h-full w-[280px] bg-white shadow-2xl flex flex-col animate-in slide-in-from-left duration-200">
            {/* Drawer Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-[#6b1e96]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-md bg-[#c3ff00] flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-[#531575]">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                </div>
                <span className="text-lg font-bold tracking-widest text-white uppercase">Dentix</span>
              </div>
              <button onClick={() => setCategoriesDrawerOpen(false)} className="p-1.5 rounded-lg hover:bg-white/10 text-white">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Contexto del Drawer (Minimalista) */}
            <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-1">
              <Link to="#" onClick={() => setCategoriesDrawerOpen(false)} className="flex items-center gap-4 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors group">
                <span className="material-symbols-outlined text-gray-500 group-hover:text-[#6b1e96]" style={{fontSize: '24px'}}>home_repair_service</span>
                <span className="text-sm font-medium tracking-wide">Instrumentos</span>
              </Link>
              <Link to="#" onClick={() => setCategoriesDrawerOpen(false)} className="flex items-center gap-4 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors group">
                <span className="material-symbols-outlined text-gray-500 group-hover:text-[#6b1e96]" style={{fontSize: '24px'}}>layers</span>
                <span className="text-sm font-medium tracking-wide">Materiales de Impresión</span>
              </Link>
              <Link to="#" onClick={() => setCategoriesDrawerOpen(false)} className="flex items-center gap-4 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors group">
                <span className="material-symbols-outlined text-gray-500 group-hover:text-[#6b1e96]" style={{fontSize: '24px'}}>grid_view</span>
                <span className="text-sm font-medium tracking-wide">Ortodoncia</span>
              </Link>
              <Link to="#" onClick={() => setCategoriesDrawerOpen(false)} className="flex items-center gap-4 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors group">
                <span className="material-symbols-outlined text-gray-500 group-hover:text-[#6b1e96]" style={{fontSize: '24px'}}>radiology</span>
                <span className="text-sm font-medium tracking-wide">Equipos de Rayos X</span>
              </Link>
              <Link to="#" onClick={() => setCategoriesDrawerOpen(false)} className="flex items-center gap-4 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors group">
                <span className="material-symbols-outlined text-gray-500 group-hover:text-[#6b1e96]" style={{fontSize: '24px'}}>delete</span>
                <span className="text-sm font-medium tracking-wide">Desechables</span>
              </Link>
              <Link to="#" onClick={() => setCategoriesDrawerOpen(false)} className="flex items-center gap-4 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors group">
                <span className="material-symbols-outlined text-gray-500 group-hover:text-[#6b1e96]" style={{fontSize: '24px'}}>chair</span>
                <span className="text-sm font-medium tracking-wide">Mobiliario Dental</span>
              </Link>
              <Link to="#" onClick={() => setCategoriesDrawerOpen(false)} className="flex items-center gap-4 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors group">
                <span className="material-symbols-outlined text-gray-500 group-hover:text-[#6b1e96]" style={{fontSize: '24px'}}>mop</span>
                <span className="text-sm font-medium tracking-wide">Higiene Oral</span>
              </Link>
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
