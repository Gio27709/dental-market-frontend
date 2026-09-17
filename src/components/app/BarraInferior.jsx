import { Link, useLocation } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";

// Barra de navegación fija abajo, estilo app, solo en teléfono (md: la oculta). Lleva lo más
// usado: inicio, catálogo, carrito, publicaciones y cuenta. Se esconde en el pago y en la pantalla de
// «pedido listo» para no competir con los botones de esas pantallas.

const OCULTA_EN = ["/checkout", "/order-success", "/login", "/register"];
// Alto: fila de 56 px + la franja de los botones del teléfono (safe-area-inset-bottom, que solo
// llega con viewport-fit=cover en index.html). El contenido reserva ese mismo espacio abajo con
// `pb-[calc(56px+env(safe-area-inset-bottom,0px))]` (ver App.jsx); si cambia el alto, cambiar los dos.

export default function BarraInferior() {
  const { pathname } = useLocation();
  const { itemCount } = useCart();
  const { user } = useAuth();

  if (OCULTA_EN.some((p) => pathname.startsWith(p))) return null;

  const entradas = [
    { ruta: "/inicio", icono: "home", texto: "Inicio", activa: pathname === "/" || pathname === "/inicio" },
    { ruta: "/store-catalog", icono: "storefront", texto: "Catálogo", activa: pathname.startsWith("/store-catalog") || pathname.startsWith("/product/") },
    { ruta: "/cart", icono: "shopping_cart", texto: "Carrito", activa: pathname.startsWith("/cart"), globo: itemCount },
    // «Publicaciones» no cabe en 1/5 de pantalla a 360 px: se acorta en el rótulo y va completo
    // en el aria-label. Los pedidos quedan en el acceso rápido del inicio y en el menú Cuenta.
    { ruta: "/news", icono: "newspaper", texto: "Publica.", nombre: "Publicaciones", activa: pathname.startsWith("/news") },
    { ruta: user ? "/account" : "/login", icono: "person", texto: "Cuenta", activa: pathname.startsWith("/account") },
  ];

  return (
    <nav
      aria-label="Navegación principal"
      className="md:hidden fixed inset-x-0 bottom-0 z-[95] border-t border-fx-line bg-white shadow-[0_-2px_12px_rgba(0,0,0,0.06)]"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <ul className="mx-auto flex max-w-lg items-stretch">
        {entradas.map((e) => (
          <li key={e.texto} className="flex-1">
            <Link
              to={e.ruta}
              aria-label={e.nombre || undefined}
              aria-current={e.activa ? "page" : undefined}
              className={`flex h-14 flex-col items-center justify-center gap-0.5 text-[10.5px] font-semibold leading-none transition-colors ${
                e.activa ? "text-[#6b1e96]" : "text-fx-muted"
              }`}
            >
              <span className="relative">
                <span
                  className="material-symbols-outlined text-[22px] leading-none"
                  style={{ fontVariationSettings: e.activa ? "'FILL' 1" : undefined }}
                  aria-hidden="true"
                >
                  {e.icono}
                </span>
                {e.globo > 0 && (
                  <span className="absolute -right-2.5 -top-1.5 min-w-[18px] rounded-full bg-[#c3ff00] px-1 text-center text-[10px] font-bold leading-[18px] text-[#531575]">
                    {e.globo > 99 ? "99+" : e.globo}
                  </span>
                )}
              </span>
              {e.texto}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
