import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import PriceDisplay from "./products/PriceDisplay";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const { user } = useAuth();
  const isOwnProduct = user?.id === product.store_id;

  const handleAddToCart = () => {
    if (isOwnProduct) return;
    // Agrega la variación por defecto si existe, de lo contrario null
    addToCart(product, product.variations?.[0] || null, 1);
    toast.success("Agregado a la bolsa");
  };

  const handleFavorite = () => {
    // Función reservada para Favoritos (Heart Icon)
    console.log("Toggling favorite: ", product.id);
  };

  const storeName = product.store?.business_name || "TIENDA OFICIAL";
  const hasImage = product.images && product.images.length > 0;
  // Stock simulado basándonos en la lógica anterior o hardcodeado según su base de datos
  const isAvailable = product.stock !== 0; 
  // Nota: si el backend devuelve un booleano o count exacto se puede afinar, usaremos isAvailable = true por ahora si no existe product.stock

  return (
    <article className="w-full max-w-[342px] bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col group hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
      {/* Sección de la Imagen con Altura Fija Uniforme */}
      <div className="relative h-[220px] w-full bg-white border-b border-slate-50 overflow-hidden">
        <Link to={`/product/${product.id}`} className="block w-full h-full p-6 flex items-center justify-center">
          {hasImage ? (
            <img
              src={product.images[0]}
              alt={product.name}
              loading="lazy"
              className="max-w-full max-h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <span className="text-slate-300 italic text-sm">Sin Imagen</span>
          )}
        </Link>
        
        {/* Acciones Superiores Derechas (Favoritos) */}
        <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
          <button
            onClick={handleFavorite}
            className="p-2 bg-white/90 backdrop-blur-sm border border-slate-100 rounded-full shadow-sm hover:bg-rose-50 hover:text-rose-500 hover:border-rose-100 transition-colors text-slate-400"
            title="Agregar a favoritos"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
            </svg>
          </button>
        </div>

        {/* Badge Vendedor Superior Izquierdo */}
        <div className="absolute top-4 left-4 z-10 pointer-events-none max-w-[70%]">
          <span className="px-2 py-1 text-[9px] font-bold tracking-wider uppercase bg-sky-100/90 backdrop-blur-sm text-sky-700 shadow-sm rounded-md block whitespace-nowrap overflow-hidden text-ellipsis">
            {storeName}
          </span>
        </div>
      </div>

      {/* Sección de Contenido Inferior */}
      <div className="p-5 flex flex-col flex-grow bg-white">
        
        {/* Indicador de Disponibilidad */}
        <div className="mb-2 flex items-center gap-1.5">
          <div className={`h-1.5 w-1.5 rounded-full ${isAvailable ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
          <span className={`text-[11px] font-medium tracking-wide uppercase ${isAvailable ? 'text-emerald-600' : 'text-rose-600'}`}>
            {isAvailable ? 'Disponible' : 'Sin Stock'}
          </span>
        </div>

        {/* Título de Producto linkeado */}
        <Link to={`/product/${product.id}`}>
          <h2
            className="text-[16px] font-medium text-slate-900 leading-tight mb-2 hover:text-sky-600 cursor-pointer transition-colors line-clamp-2"
            title={product.name}
          >
            {product.name}
          </h2>
        </Link>

        {/* Estrellas UI Mock (Adaptable posteriormente si backend manda rating) */}
        <div className="flex items-center mb-4">
          <div className="flex text-amber-400 gap-0.5">
            {[1, 2, 3, 4].map(star => (
              <svg key={star} className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
            ))}
            <svg className="w-3.5 h-3.5 fill-slate-200" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
          </div>
          <span className="ml-2 text-[10px] font-medium text-slate-400">Ver valoraciones</span>
        </div>

        {/* Precio (Apalancado con el componente PriceDisplay original) */}
        <div className="mb-4">
          <PriceDisplay amountUSD={product.price} />
        </div>

        {/* Botón de Agregar al carrito */}
        <div className="mt-auto">
          {isOwnProduct ? (
            <button
              disabled
              className="w-full bg-slate-50 text-slate-400 border border-slate-200 font-medium py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 cursor-not-allowed text-sm"
              title="Este es tu producto"
            >
              Producto Propio
            </button>
          ) : (
            <button
              onClick={handleAddToCart}
              className="w-full bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white font-medium py-2 px-4 rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 group text-sm"
              title="Agregar al carrito"
            >
              <svg className="h-4 w-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path>
              </svg>
              Al Carrito
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

ProductCard.propTypes = {
  product: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    name: PropTypes.string.isRequired,
    price: PropTypes.number.isRequired,
    images: PropTypes.arrayOf(PropTypes.string),
    store_id: PropTypes.string,
    stock: PropTypes.number,
    store: PropTypes.shape({
      business_name: PropTypes.string,
    }),
    variations: PropTypes.array,
  }).isRequired,
};
