import { Link } from "react-router-dom";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-white mt-auto border-t border-gray-100 flex flex-col">
      {/* ────────────────────────────────────────────────────────
          FRANJA SUPERIOR: NEWSLETTER (Color Corporativo Principal)
          ──────────────────────────────────────────────────────── */}
      <div className="bg-[#6b1e96]">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-5 flex flex-col md:flex-row items-center justify-between gap-4 md:gap-8">
          {/* Textos Izquierda */}
          <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3 text-white text-center sm:text-left">
            <h3 className="text-xl md:text-2xl font-bold tracking-wide">
              Suscríbete a nuestro Boletín
            </h3>
            <span className="text-[13px] md:text-sm font-light text-purple-200">
              ...y recibe un 10% de descuento en tu primera compra
            </span>
          </div>

          {/* Input Derecha */}
          <div className="w-full max-w-md flex items-stretch">
            <input
              type="email"
              placeholder="Ingresa tu correo electrónico"
              className="w-full flex-1 px-4 py-2.5 text-sm text-gray-900 bg-white border border-transparent outline-none focus:ring-2 focus:ring-[#c3ff00] placeholder-gray-400"
            />
            <button
              type="button"
              className="bg-[#c3ff00] hover:bg-[#aee600] text-[#531575] px-6 transition-colors border-none flex items-center justify-center outline-none"
              aria-label="Suscribirse"
            >
              <span className="material-symbols-rounded text-xl">send</span>
            </button>
          </div>
        </div>
      </div>

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
            <div className="h-6 w-10 bg-gray-100 border border-gray-200 rounded flex items-center justify-center text-[9px] font-bold text-blue-900">
              VISA
            </div>
            <div className="h-6 w-10 bg-gray-100 border border-gray-200 rounded flex items-center justify-center text-[9px] font-bold text-blue-500 italic">
              PayPal
            </div>
            <div className="h-6 w-10 bg-gray-100 border border-gray-200 rounded flex items-center justify-center text-[9px] font-bold text-blue-400">
              AMEX
            </div>
            <div className="h-6 w-10 bg-gray-100 border border-gray-200 rounded flex items-center justify-center text-[9px] font-bold text-green-600">
              WePay
            </div>
            <div className="h-6 w-10 bg-gray-100 border border-gray-200 rounded flex items-center justify-center text-[9px] font-bold text-purple-600">
              Skrill
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
                to="/catalogo"
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
                to="/ofertas"
                className="hover:text-[#6b1e96] transition-colors"
              >
                Descuentos
              </Link>
            </li>
            <li>
              <Link
                to="/catalogo"
                className="hover:text-[#6b1e96] transition-colors"
              >
                Últimos Productos
              </Link>
            </li>
            <li>
              <Link
                to="/catalogo"
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
            <li>
              <Link
                to="/catalogo?categoria=instrumental"
                className="hover:text-[#6b1e96] transition-colors"
              >
                Instrumental Quirúrgico
              </Link>
            </li>
            <li>
              <Link
                to="/catalogo?categoria=biomateriales"
                className="hover:text-[#6b1e96] transition-colors"
              >
                Biomateriales
              </Link>
            </li>
            <li>
              <Link
                to="/catalogo?categoria=equipos"
                className="hover:text-[#6b1e96] transition-colors"
              >
                Equipos Mayores
              </Link>
            </li>
            <li>
              <Link
                to="/catalogo?categoria=ortodoncia"
                className="hover:text-[#6b1e96] transition-colors"
              >
                Ortodoncia
              </Link>
            </li>
            <li>
              <Link
                to="/catalogo?categoria=desechables"
                className="hover:text-[#6b1e96] transition-colors"
              >
                Insumos Desechables
              </Link>
            </li>
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
