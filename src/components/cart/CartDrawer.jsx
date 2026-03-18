import { Link } from "react-router-dom";
import { useCart } from "../../context/CartContext";

export default function CartDrawer() {
  const {
    isDrawerOpen,
    toggleDrawer,
    items,
    removeFromCart,
    updateQuantity,
    total_usd,
  } = useCart();

  return (
    <>
      {/* Overlay: Fondo Oscuro para aislar el Drawer */}
      <div
        className={`fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[1000] transition-opacity duration-300 ease-in-out ${
          isDrawerOpen ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
        onClick={toggleDrawer}
      />

      {/* Side Drawer: Panel Deslizante Lateral */}
      <aside
        className={`fixed top-0 right-0 w-full max-w-[380px] h-screen bg-white z-[1001] shadow-[-5px_0_25px_rgba(0,0,0,0.1)] flex flex-col transition-transform duration-400 ease-[cubic-bezier(0.25,1,0.5,1)] ${
          isDrawerOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header del Carrito */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800 m-0">
            Carrito de Compras
          </h2>
          <button
            className="bg-transparent border-none cursor-pointer text-gray-500 p-2 flex items-center justify-center transition-colors hover:text-primary-600 focus:outline-none"
            onClick={toggleDrawer}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Cuerpo (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
          {items.length === 0 ? (
            /* Estado Vacío / Empty Cart */
            <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-16 h-16 mb-6 text-gray-300"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
                />
              </svg>
              <p className="mb-8 text-base">Tu carrito está vacío.</p>
              <button
                className="bg-primary-600 text-white border-none py-3 px-8 rounded font-semibold cursor-pointer transition-colors hover:bg-primary-700"
                onClick={toggleDrawer}
              >
                Continuar Comprando
              </button>
            </div>
          ) : (
            /* Lista de Items Activos */
            <ul className="list-none p-0 m-0">
              {items.map((item) => (
                <li
                  key={item.id}
                  className="flex gap-4 pb-6 mb-6 border-b border-gray-100 last:border-b-0 last:mb-0 last:pb-0"
                >
                  {/* Item Imagen */}
                  <div className="w-20 h-20 rounded overflow-hidden bg-gray-50 shrink-0">
                    <img
                      src={
                        Array.isArray(item.product?.images)
                          ? item.product.images[0]
                          : item.product?.images || item.image || "https://placehold.co/100" // Fallback con la nueva lógica del MVP (item.image)
                      }
                      alt={item.name || item.product?.title}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Detalles del Item */}
                  <div className="flex-1 flex flex-col justify-between">
                    <h4 className="text-[15px] font-medium text-gray-800 m-0 mb-2 leading-tight line-clamp-2">
                      {item.name || item.product?.title}
                    </h4>
                    
                    {/* Variación Seleccionada (Si existe en MVP) */}
                    {item.variation && (
                      <span className="text-xs text-gray-500 mb-1 border border-gray-200 w-fit px-1.5 py-0.5 rounded">
                        Variación: {item.variation.name || "Default"}
                      </span>
                    )}

                    <span className="font-semibold text-primary-600 mb-2 block">
                      ${Number(item.price_usd).toFixed(2)}
                    </span>

                    {/* Controles de Cantidad */}
                    <div className="flex items-center border border-gray-300 rounded w-fit">
                      <button
                        className="bg-transparent border-none px-2.5 py-1 text-lg cursor-pointer text-gray-500 hover:text-primary-600 transition-colors focus:outline-none"
                        onClick={() =>
                          updateQuantity(item.id, Number(item.quantity) - 1)
                        }
                      >
                        -
                      </button>
                      <span className="text-[15px] font-medium min-w-[20px] text-center select-none">
                        {item.quantity}
                      </span>
                      <button
                        className="bg-transparent border-none px-2.5 py-1 text-lg cursor-pointer text-gray-500 hover:text-primary-600 transition-colors focus:outline-none"
                        onClick={() =>
                          updateQuantity(item.id, Number(item.quantity) + 1)
                        }
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Botón Borrar Item */}
                  <button
                    className="bg-transparent border-none p-2 cursor-pointer text-red-500 self-start transition-transform hover:scale-110 -ml-2 focus:outline-none"
                    onClick={() => removeFromCart(item.id)}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      className="w-5 h-5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer (Subtotal & CTAs) */}
        {items.length > 0 && (
          <div className="p-6 border-t border-gray-200 bg-gray-50">
            <div className="flex justify-between items-center mb-6 text-lg">
              <span className="font-medium text-gray-500">Subtotal</span>
              <span className="font-bold text-gray-800 text-xl">
                ${Number(total_usd).toFixed(2)}
              </span>
            </div>
            <div className="flex flex-col gap-3">
              <Link
                to="/cart"
                className="text-center py-3 px-6 rounded font-semibold no-underline transition-colors bg-transparent text-primary-600 border border-primary-600 hover:bg-primary-50"
                onClick={toggleDrawer}
              >
                Ver Carrito Completo
              </Link>
              <Link
                to="/checkout"
                className="text-center py-3 px-6 rounded font-semibold no-underline transition-colors bg-primary-600 text-white hover:bg-primary-700"
                onClick={toggleDrawer}
              >
                Finalizar Compra
              </Link>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
