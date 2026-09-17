import { Link, useLocation } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";

// Barra de navegación fija abajo, estilo app, solo en teléfono (md: la oculta). Lleva lo más
// usado: inicio, catálogo, carrito, pedidos y cuenta. Se esconde en el pago y en la pantalla de
// «pedido listo» para no competir con los botones de esas pantallas.

const OCULTA_EN = ["/checkout", "/order-success", "/login", "/register"];
export const ALTO_BARRA = 64; // px; el layout deja este espacio abajo

export default function BarraInferior() {
  const { pathname } = useLocation();
  const { itemCount } = useCart();
  const { user } = useAuth();

  if (OCULTA_EN.some((p) => pathname.startsWith(p))) return null;

  const entradas = [
    { ruta: "/inicio", icono: "home", texto: "Inicio", activa: pathname === "/" || pathname === "/inicio" },
    { ruta: "/store-catalog", icono: "storefront", texto: "Catálogo", activa: pathname.startsWith("/store-catalog") || pathname.startsWith("/product/") },
    { ruta: "/cart", icono: "shopping_cart", texto: "Carrito", activa: pathname.startsWith("/cart"), globo: itemCount },
    { ruta: user ? "/account/orders" : "/login?redirect=/account/orders", icono: "local_shipping", texto: "Pedidos", activa: pathname.startsWith("/account/orders") },
    { ruta: user ? "/account" : "/login", icono: "person", texto: "Cuenta", activa: pathname === "/account" || (pathname.startsWith("/account") && !pathname.startsWith("/account/orders")) },
  ];

  return (
    <nav
      aria-label="Navegación principal"
      className="md:hidden fixed inset-x-0 bottom-0 z-[95] border-t border-fx-line bg-white/95 backdrop-blur"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="mx-auto flex max-w-lg items-stretch">
        {entradas.map((e) => (
          <li key={e.texto} className="flex-1">
            <Link
              to={e.ruta}
              aria-current={e.activa ? "page" : undefined}
              className={`flex h-16 flex-col items-center justify-center gap-0.5 text-[11px] font-semibold transition-colors ${
                e.activa ? "text-[#6b1e96]" : "text-fx-muted"
              }`}
            >
              <span className="relative">
                <span
                  className="material-symbols-outlined text-[24px] leading-none"
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
