import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useCart } from "../context/CartContext";
import CartDrawer from "./cart/CartDrawer"; // FASE 3

export default function Header() {
  const { items, total_usd, toggleDrawer } = useCart(); // FASE 3
  const navigate = useNavigate();

  // Estados visuales mapeados (Fase 2)
  const [langOpen, setLangOpen] = useState(false);
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [currency, setCurrency] = useState("USD");
  
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
      <div className="bg-[#222222] border-b border-[#333333] hidden md:block text-[13px] text-gray-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[40px] flex justify-between items-center">
          <div className="top-left">
            <p className="m-0 text-white">
              Envío gratis en pedidos profesionales de más de $500.{" "}
              <Link to="#" className="text-gray-300 underline hover:text-white transition-colors">
                Comprar esenciales de clínica
              </Link>
            </p>
          </div>
          <div className="top-right">
            <ul className="flex items-center space-x-4 m-0 p-0 list-none">
              <li>
                <Link to="#" className="hover:text-white transition-colors">Rastreo de pedido</Link>
              </li>
              <li className="w-px h-3 bg-gray-500"></li>
              
              {/* Dropdown Idioma */}
              <li className="relative dropdown-wrapper text-white">
                <button 
                  onClick={() => {setLangOpen(!langOpen); setCurrencyOpen(false);}}
                  className="flex items-center gap-1 hover:text-gray-300 transition-colors cursor-pointer"
                >
                  <span>Español</span>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-3 h-3 transition-transform duration-200 ${langOpen ? 'rotate-180' : ''}`}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                  </svg>
                </button>
                {langOpen && (
                  <ul className="absolute top-full right-0 mt-2 w-32 bg-white border border-gray-200 text-gray-800 shadow-md py-1 z-50">
                    <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer">Inglés</li>
                    <li className="px-4 py-2 bg-gray-100 text-[#531575] font-medium cursor-pointer">Español</li>
                  </ul>
                )}
              </li>
              <li className="w-px h-3 bg-gray-500"></li>

              {/* Dropdown Moneda */}
              <li className="relative dropdown-wrapper text-white">
                <button 
                  onClick={() => {setCurrencyOpen(!currencyOpen); setLangOpen(false);}}
                  className="flex items-center gap-1 hover:text-gray-300 transition-colors cursor-pointer"
                >
                  <span>{currency}</span>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-3 h-3 transition-transform duration-200 ${currencyOpen ? 'rotate-180' : ''}`}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                  </svg>
                </button>
                {currencyOpen && (
                  <ul className="absolute top-full right-0 mt-2 w-24 bg-white border border-gray-200 text-gray-800 shadow-md py-1 z-50">
                    <li onClick={() => setCurrency('USD')} className={`px-4 py-2 hover:bg-gray-100 cursor-pointer ${currency === 'USD' ? 'bg-gray-100 text-[#531575] font-medium' : ''}`}>USD</li>
                    <li onClick={() => setCurrency('VES')} className={`px-4 py-2 hover:bg-gray-100 cursor-pointer ${currency === 'VES' ? 'bg-gray-100 text-[#531575] font-medium' : ''}`}>VES</li>
                  </ul>
                )}
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* --- Middle Bar (Main) --- */}
      <div className="py-4 md:py-6 bg-[#6b1e96]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center gap-4">
          
          {/* Mobile Hamburger (Temporal) */}
          <button className="md:hidden p-2 text-white hover:text-gray-200">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>

          {/* Logo Dentix */}
          <div className="flex-shrink-0 flex items-center gap-2">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-md bg-[#c3ff00] flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-[#531575]">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </div>
              <span className="text-2xl font-bold tracking-widest text-white uppercase">
                Dentix
              </span>
            </Link>
          </div>

          {/* Search Bar */}
          <div className="hidden md:flex flex-1 max-w-3xl px-8 ml-8">
            <form onSubmit={(e) => e.preventDefault()} className="w-full relative shadow-sm rounded-full overflow-hidden bg-white">
              <input 
                type="text" 
                placeholder="Buscar autoclaves, piezas de mano, instrumental..." 
                className="w-full px-6 py-3 border-none focus:outline-none text-gray-800 rounded-full"
              />
              <button 
                type="submit" 
                className="absolute right-1 top-1 bottom-1 bg-[#c3ff00] hover:bg-[#aee600] text-[#531575] w-20 rounded-full transition duration-200 flex items-center justify-center shadow-sm"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
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
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                </svg>
                <span className="font-medium text-sm hidden lg:block tracking-wide">Cuenta</span>
              </button>
            </div>

            {/* Action Item: Cart */}
            <div 
              className="relative cursor-pointer hover:text-gray-200 transition-colors flex items-center gap-2"
              onClick={toggleDrawer}
            >
              <div className="relative">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
                </svg>
                {cartCount > 0 && (
                  <span className="absolute -top-[10px] -right-[12px] bg-[#ff6b00] text-white text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center shadow-sm">
                    {cartCount}
                  </span>
                )}
              </div>
              <span className="font-medium text-sm hidden lg:block tracking-wide">
                Carrito <span className="opacity-90 font-normal">(${total_usd.toFixed(2)})</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* --- Bottom Bar (Nav) --- */}
      <div className="hidden md:block bg-[#531575] shadow-sm h-[50px]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center">
          
          {/* Categorias Especial Boton (Integrado) */}
          <div className="bg-[#6b1e96] hover:bg-[#7e25b0] text-white cursor-pointer px-6 h-full flex items-center gap-3 font-semibold tracking-wide transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
            <span className="text-[13px] uppercase">Todas las Categorías</span>
          </div>

          <nav className="flex-1 ml-10">
            <ul className="flex items-center space-x-8 text-[13px] font-bold tracking-wide text-white uppercase">
              <li><Link to="/" className="hover:text-[#c3ff00] transition-colors">Inicio</Link></li>
              <li><Link to="#" className="hover:text-[#c3ff00] transition-colors">Quirúrgico</Link></li>
              <li><Link to="#" className="hover:text-[#c3ff00] transition-colors">Ortodoncia</Link></li>
              <li><Link to="#" className="hover:text-[#c3ff00] transition-colors">Esterilización</Link></li>
              <li><Link to="#" className="hover:text-[#c3ff00] transition-colors">Consumibles</Link></li>
              <li><Link to="#" className="hover:text-[#c3ff00] transition-colors">Contacto</Link></li>
            </ul>
          </nav>
        </div>
      </div>
      
      {/* --- CART DRAWER OVERLAY --- FASE 3 --- */}
      <CartDrawer />
    </header>
  );
}
