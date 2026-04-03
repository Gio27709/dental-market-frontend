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

  // Helper for Amazon-style variation text
  const getVariationAttributes = (v) => {
    if (!v || v.attribute_name === "default" || v.attribute_value === '{"_default":"default"}') return [];
    try {
      const parsed = JSON.parse(v.attribute_value);
      if (parsed._default === "default") return [];
      return Object.entries(parsed).map(([key, val]) => {
        const cleanVal = typeof val === 'string' && val.includes('|') ? val.split('|')[0] : val;
        return { key, value: cleanVal };
      });
    } catch {
      let cleanVal = v.attribute_value;
      if (typeof cleanVal === 'string' && cleanVal.includes('|')) cleanVal = cleanVal.split('|')[0];
      const label = v.attribute_name && v.attribute_name !== "Matrix" ? v.attribute_name : "Variación";
      return [{ key: label, value: cleanVal }];
    }
  };

  // Calculate real item count
  const itemsCount = items.reduce((sum, item) => sum + item.quantity, 0);

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
        className={`fixed top-0 right-0 w-full max-w-[400px] h-screen bg-white z-[1001] shadow-2xl flex flex-col transition-transform duration-400 ease-[cubic-bezier(0.25,1,0.5,1)] ${
          isDrawerOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header del Carrito */}
        <div className="flex justify-between items-center px-5 py-4 border-b border-gray-200 bg-white">
          <h2 className="text-xl font-bold text-gray-900 m-0">
            Carrito de Compras
          </h2>
          <button
            className="text-gray-400 hover:text-gray-600 transition-colors focus:outline-none p-1"
            onClick={toggleDrawer}
            title="Cerrar Carrito"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Cuerpo (Scrollable) */}
        <div className="flex-1 overflow-y-auto px-5 py-2 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
          {items.length === 0 ? (
            /* Estado Vacío */
            <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 py-10">
              <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6 border border-gray-100">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-12 h-12 text-gray-300">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
                </svg>
              </div>
              <p className="mb-6 text-base font-medium text-gray-900">Tu carrito está vacío</p>
              <button
                className="bg-white border border-gray-300 text-gray-700 py-2 px-6 rounded-full font-medium transition-colors hover:bg-gray-50 active:scale-95 shadow-sm"
                onClick={toggleDrawer}
              >
                Seguir Comprando
              </button>
            </div>
          ) : (
            /* Lista de Items Activos */
            <div className="flex flex-col divide-y divide-gray-100">
              {items.map((item) => {
                const isAtMaxStock = item.quantity >= (item.variation?.stock || 999);
                const variationAttrs = getVariationAttributes(item.variation);
                
                return (
                  <div key={item.id} className="flex gap-4 py-5">
                    {/* Item Imagen */}
                    <Link
                      to={`/product/${item.product_id}`}
                      onClick={toggleDrawer}
                      className="w-[88px] h-[88px] rounded border border-gray-100 bg-white flex items-center justify-center shrink-0 p-1 group hover:border-[#6b1e96] transition-colors"
                    >
                      <img
                        src={
                          Array.isArray(item.product?.images)
                            ? item.product.images[0]
                            : item.product?.images || item.image || "https://placehold.co/100"
                        }
                        alt={item.name || item.product?.title}
                        loading="lazy"
                        className="w-full h-full object-contain"
                      />
                    </Link>

                    {/* Detalles del Item */}
                    <div className="flex-1 flex flex-col justify-start min-w-0">
                      <div className="flex justify-between items-start gap-2 mb-1">
                        <Link
                          to={`/product/${item.product_id}`}
                          onClick={toggleDrawer}
                          className="text-[14px] leading-snug font-medium text-gray-900 hover:text-[#6b1e96] transition-colors line-clamp-2"
                        >
                          {item.name || item.product?.title}
                        </Link>
                      </div>
                      
                      {/* Availability */}
                      <p className="text-[11px] text-green-600 font-medium mb-1">
                        Disponible {item.variation?.stock > 0 && <span className="text-gray-500 font-normal">({item.variation.stock} disponibles)</span>}
                      </p>
                      
                      {/* Precio */}
                      <span className="font-bold text-gray-900 mb-1 text-[15px]">
                        ${Number(item.price_usd).toFixed(2)}
                      </span>

                      {/* Variación Seleccionada */}
                      {variationAttrs.length > 0 && (
                        <div className="mt-0.5 space-y-0.5 mb-2">
                          {variationAttrs.map((attr, i) => (
                            <p key={i} className="text-[11px] text-gray-600">
                              <span className="font-semibold text-gray-700">{attr.key}:</span> {attr.value}
                            </p>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center justify-between mt-auto pt-2">
                        {/* Controles de Cantidad (Estilo Amazon) */}
                        <div className="flex items-center border border-amber-400 bg-white rounded-full overflow-hidden shadow-sm h-8">
                          {item.quantity <= 1 ? (
                            <button
                              className="w-8 h-full flex items-center justify-center text-gray-500 hover:text-red-500 hover:bg-red-50 transition-colors focus:outline-none"
                              onClick={() => removeFromCart(item.id)}
                              title="Eliminar"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                              </svg>
                            </button>
                          ) : (
                            <button
                              className="w-8 h-full flex items-center justify-center text-gray-600 hover:bg-amber-50 transition-colors focus:outline-none"
                              onClick={() => updateQuantity(item.id, Number(item.quantity) - 1)}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
                              </svg>
                            </button>
                          )}
                          <span className="w-8 text-center text-[13px] font-semibold text-gray-900 border-x border-amber-300 bg-amber-50/50 flex flex-col justify-center h-full select-none">
                            {item.quantity}
                          </span>
                          <button
                            className="w-8 h-full flex items-center justify-center text-gray-600 hover:bg-amber-50 disabled:opacity-30 disabled:hover:bg-transparent transition-colors focus:outline-none"
                            onClick={() => updateQuantity(item.id, Number(item.quantity) + 1)}
                            disabled={isAtMaxStock}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                            </svg>
                          </button>
                        </div>

                        {/* Botón Eliminar Textual */}
                        <button
                          className="text-[12px] text-[#6b1e96] hover:text-[#531575] hover:underline focus:outline-none transition-colors"
                          onClick={() => removeFromCart(item.id)}
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer (Subtotal & CTAs) */}
        {items.length > 0 && (
          <div className="p-5 border-t border-gray-200 bg-white shadow-[0_-4px_10px_-4px_rgba(0,0,0,0.05)]">
            <div className="flex justify-between items-baseline mb-4">
              <span className="text-[15px] text-gray-700">Subtotal ({itemsCount} {itemsCount === 1 ? 'producto' : 'productos'})</span>
              <span className="font-bold text-gray-900 text-xl">
                ${Number(total_usd).toFixed(2)}
              </span>
            </div>
            
            <div className="flex flex-col gap-2.5">
              {/* Primary Action */}
              <Link
                to="/checkout"
                className="w-full flex items-center justify-center py-3.5 px-6 rounded-full font-semibold transition-all bg-[#6b1e96] text-white hover:bg-[#531575] active:scale-[0.98] shadow-sm text-[15px]"
                onClick={toggleDrawer}
              >
                Proceder al pago
              </Link>
              
              {/* Secondary Action */}
              <Link
                to="/cart"
                className="w-full flex items-center justify-center py-3 px-6 rounded-full font-medium transition-all bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 active:scale-[0.98] text-[14px]"
                onClick={toggleDrawer}
              >
                Ir al carrito
              </Link>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
