import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import PriceDisplay from "./PriceDisplay";
import { useProducts } from "../../context/ProductContext";

export default function ComparePricesModal({ isOpen, onClose, baseProduct }) {
  const navigate = useNavigate();
  const { fetchSimilarProducts } = useProducts();
  const [isRendered, setIsRendered] = useState(false);
  const [comparisons, setComparisons] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    if (isOpen) {
      setIsRendered(true);
      document.body.style.overflow = "hidden";
      
      if (baseProduct?.id) {
        setLoading(true);
        fetchSimilarProducts(baseProduct.id).then((res) => {
          if (active) {
            setComparisons(res || []);
            setLoading(false);
          }
        });
      }
    } else {
      setTimeout(() => {
        if (active) {
          setIsRendered(false);
          setComparisons([]); // Clear on close
        }
      }, 300);
      document.body.style.overflow = "unset";
    }
    return () => {
      active = false;
      document.body.style.overflow = "unset";
    };
  }, [isOpen, baseProduct?.id, fetchSimilarProducts]);

  if (!isRendered && !isOpen) return null;

  const minPrice = comparisons.length > 0 ? Math.min(...comparisons.map((c) => c.price)) : 0;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 transition-all duration-300 ${
        isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div
        className={`relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transition-all duration-300 transform ${
          isOpen ? "scale-100 translate-y-0" : "scale-95 translate-y-4"
        }`}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-start justify-between bg-gray-50/50">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 font-serif">
              Opciones de Compra
            </h2>
            <p className="text-gray-500 mt-1 text-sm">
              Comparando alternativas para: <span className="font-semibold text-gray-700">{baseProduct?.name}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50/30">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-10 h-10 border-4 border-gray-200 border-t-[#6b1e96] rounded-full animate-spin"></div>
              <p className="mt-4 text-gray-500 font-medium">Buscando los mejores precios...</p>
            </div>
          ) : comparisons.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">Parece que es una pieza muy exclusiva.</p>
              <p className="text-gray-400 mt-2">No hemos encontrado otras tiendas ofreciendo este producto actualmente.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Add current product at the top for reference */}
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row items-center gap-4 relative">
                <div className="absolute top-0 left-0 w-1 h-full bg-gray-300 rounded-l-xl"></div>
                <div className="w-16 h-16 bg-gray-100 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden">
                  {baseProduct?.images?.[0] ? (
                    <img src={baseProduct.images[0]} alt="" className="w-full h-full object-contain p-1" />
                  ) : (
                     <span className="text-gray-400 text-xs">Sin foto</span>
                  )}
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Tu selección actual</span>
                  <h4 className="font-semibold text-gray-900 mt-0.5">{baseProduct?.store?.business_name || "Tienda Actual"}</h4>
                  <p className="text-sm text-gray-500 flex items-center justify-center sm:justify-start gap-1">
                    <span className="w-2 h-2 rounded-full bg-[#c3ff00]"></span>
                    Stock: {baseProduct?.stock ?? "Varía"}
                  </p>
                </div>
                <div className="flex flex-col items-center sm:items-end w-full sm:w-auto mt-2 sm:mt-0">
                  <PriceDisplay amountUSD={baseProduct?.price || 0} priceClassName="text-xl font-bold text-gray-900" hideSwitcher={true} />
                  <button onClick={onClose} className="mt-2 text-sm text-[#6b1e96] font-medium hover:underline">
                    Mantener este
                  </button>
                </div>
              </div>

              <div className="text-center py-2">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Otras alternativas</span>
              </div>

              {/* Comparisons List */}
              {comparisons.map((c) => {
                const isBestPrice = c.price === minPrice;
                return (
                  <div
                    key={c.id}
                    className={`bg-white p-4 rounded-xl border-2 transition-all shadow-sm flex flex-col sm:flex-row items-center gap-4 relative hover:shadow-md ${
                      isBestPrice ? "border-[#c3ff00]" : "border-gray-100 hover:border-gray-300"
                    }`}
                  >
                    {isBestPrice && (
                      <div className="absolute -top-3 left-1/2 sm:left-6 -translate-x-1/2 sm:translate-x-0 bg-[#c3ff00] text-blue-900 text-xs font-bold px-3 py-1 rounded-full shadow-sm flex items-center gap-1 z-10">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                        El Mejor Precio
                      </div>
                    )}

                    <div className="w-16 h-16 bg-gray-50 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden border border-gray-100">
                      {c.images?.[0] ? (
                        <img src={c.images[0]} alt="" className="w-full h-full object-contain p-1" />
                      ) : (
                        <span className="text-gray-400 text-xs">Sin foto</span>
                      )}
                    </div>

                    <div className="flex-1 text-center sm:text-left mt-2 sm:mt-0">
                      <h4 className="font-semibold text-gray-900 group-hover:text-[#2563eb] transition-colors line-clamp-1">{c.name}</h4>
                      <p className="text-sm text-gray-500 mb-1">{c.store?.business_name}</p>
                      
                      <div className="flex items-center justify-center sm:justify-start gap-3 mt-1 text-xs">
                        <span className="flex items-center gap-1 text-gray-500">
                          <span className={`w-2 h-2 rounded-full ${c.stock > 0 || c.stock_status !== "Sin stock" ? "bg-green-500" : "bg-red-500"}`}></span>
                          {c.stock_status}
                        </span>
                        <span className="text-gray-300">|</span>
                        <span className="flex items-center gap-1 text-gray-500">
                          <svg className="w-3 h-3 text-[#facc15]" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                          {c.store?.rating_avg || "Nuevo"}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col items-center sm:items-end w-full sm:w-[140px] mt-3 sm:mt-0 gap-2 shrink-0">
                       <PriceDisplay amountUSD={c.price} priceClassName="text-[22px] font-bold text-[#2563eb] leading-none" hideSwitcher={true} />
                       
                       <button
                         onClick={() => {
                            onClose();
                            navigate(`/product/${c.id}`);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                         }}
                         className={`w-full py-2 px-4 rounded-xl text-sm font-bold transition-all ${
                            isBestPrice 
                            ? "bg-[#6b1e96] text-white hover:bg-[#531575] shadow-md hover:shadow-lg"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                         }`}
                       >
                         Ver Producto
                       </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

ComparePricesModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  baseProduct: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    name: PropTypes.string,
    price: PropTypes.number,
    images: PropTypes.arrayOf(PropTypes.string),
    stock: PropTypes.number,
    store: PropTypes.shape({
      business_name: PropTypes.string,
    }),
  }),
};
