import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { useState } from "react";
import ComparePricesModal from "./products/ComparePricesModal";
import PriceDisplay from "./products/PriceDisplay";
import { useCart } from "../context/CartContext";
import { useFavorites } from "../context/FavoriteContext";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const { toggleFavorite, favoriteIds } = useFavorites();
  const { user } = useAuth();
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const isOwnProduct = user?.id === product.store_id;

  const handleAddToCart = () => {
    if (isOwnProduct) return;
    // Agrega la variación por defecto si existe, de lo contrario null
    addToCart(product, product.variations?.[0] || null, 1);
    toast.success("Agregado a la bolsa");
  };

  const handleFavorite = (e) => {
    e.preventDefault();
    toggleFavorite(product.id);
  };

  const isFavorite = favoriteIds?.has(product.id);

  const storeName = product.store?.business_name || product.store_profiles?.business_name || "TIENDA OFICIAL";
  const hasImage = product.images && product.images.length > 0;
  // Determine availability: does ANY variation have stock > 0?
  const isAvailable = (() => {
    if (product?.stock_status === "Sin stock") return false;

    const variations = product?.variations || [];
    if (variations.length > 0) {
      return variations.some(v => v.stock > 0);
    }
    // No variations at all — fallback to product-level stock (legacy)
    return product?.stock !== 0 && product?.stock !== null && product?.stock !== undefined;
  })();

  return (
    <>
      <article className="w-full max-w-[342px] mx-auto sm:mx-0 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col group hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
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
            className={`p-2 bg-white/90 backdrop-blur-sm border rounded-full shadow-sm transition-colors ${
              isFavorite 
                ? "border-rose-200 bg-rose-50 text-rose-500" 
                : "border-slate-100 hover:bg-rose-50 hover:text-rose-500 hover:border-rose-100 text-slate-400"
            }`}
            title={isFavorite ? "Quitar de favoritos" : "Agregar a favoritos"}
          >
            <svg 
              className={`h-4 w-4 transition-all duration-300 ${isFavorite ? "fill-current scale-110" : "fill-none scale-100"}`} 
              stroke="currentColor" 
              viewBox="0 0 24 24" 
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
            </svg>
          </button>
          
          {!isOwnProduct && (
            <button
              onClick={(e) => {
                e.preventDefault();
                setIsCompareOpen(true);
              }}
              className="p-2 bg-white/90 backdrop-blur-sm border border-slate-100 rounded-full shadow-sm text-slate-400 hover:text-[#2563eb] hover:border-[#2563eb]/30 hover:bg-blue-50 transition-colors"
              title="Comparar Precios"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0022.5 16l-3-9m-3-1l-3 1m0 0l3 9" />
              </svg>
            </button>
          )}
        </div>

        {/* Badge Vendedor Superior Izquierdo */}
        <div className="absolute top-4 left-4 z-10 max-w-[70%]">
          <Link 
            to={`/store/${product.store_id}`}
            onClick={(e) => e.stopPropagation()}
            className="px-2 py-1 text-[9px] font-bold tracking-wider uppercase bg-[#6b1e96]/10 backdrop-blur-sm text-[#6b1e96] shadow-sm border border-[#6b1e96]/20 rounded-md block whitespace-nowrap overflow-hidden text-ellipsis hover:bg-[#6b1e96] hover:text-white transition-colors"
          >
            {storeName}
          </Link>
        </div>
      </div>

      {/* Sección de Contenido Inferior */}
      <div className="p-5 flex flex-col flex-grow bg-white">
        
        {/* Indicador de Disponibilidad */}
        <div className="mb-2 flex items-center gap-1.5">
          <div className={`h-1.5 w-1.5 rounded-full ${isAvailable ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
          <span className={`text-[11px] font-medium tracking-wide uppercase ${isAvailable ? 'text-emerald-600' : 'text-amber-600'}`}>
            {isAvailable ? 'Disponible' : 'Sin Stock'}
          </span>
        </div>

        {/* Título de Producto linkeado */}
        <Link to={`/product/${product.id}`}>
          <h2
            className="text-[16px] font-medium text-slate-900 leading-tight mb-2 hover:text-[#6b1e96] cursor-pointer transition-colors line-clamp-2"
            title={product.name}
          >
            {product.name}
          </h2>
        </Link>

        {/* Product Rating */}
        <div className="flex items-center mb-4 text-[#facc15] gap-0.5">
          {[...Array(5)].map((_, i) => (
             <span key={i} className={`material-symbols-outlined text-[14px] ${i < Math.round(product.rating_avg || 0) ? 'text-[#facc15]' : 'text-slate-200'}`}>star</span>
          ))}
          <span className="ml-2 text-[10px] font-medium text-slate-400">
            {product.review_count || 0} valoraciones
          </span>
        </div>

        {/* Precio (Apalancado con el componente PriceDisplay original) */}
        <div className="mb-4">
          <PriceDisplay amountUSD={product.price} />
        </div>

        {/* Botón de Agregar al carrito */}
        <div className="mt-auto">
          {!isAvailable ? (
            <button
              disabled
              className="w-full bg-gray-100 text-gray-400 font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 cursor-not-allowed text-sm uppercase tracking-wider"
              title="Agotado"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Agotado
            </button>
          ) : isOwnProduct ? (
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
              className="w-full bg-[#6b1e96] hover:bg-[#531575] active:bg-[#43105e] text-white font-medium py-2 px-4 rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 group text-sm"
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

      <ComparePricesModal
        isOpen={isCompareOpen}
        onClose={() => setIsCompareOpen(false)}
        baseProduct={product}
      />
    </>
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
    stock_status: PropTypes.string,
    store: PropTypes.shape({
      business_name: PropTypes.string,
    }),
    store_profiles: PropTypes.shape({
      business_name: PropTypes.string,
    }),
    rating_avg: PropTypes.number,
    review_count: PropTypes.number,
    variations: PropTypes.array,
  }).isRequired,
};
