import { useState } from 'react';
import { ShoppingCart, Clock, Tag } from 'lucide-react';
import { Link } from 'react-router-dom';

const filterCategories = ['Todos', 'Equipos', 'Instrumental', 'Desechables', 'Materiales'];

const promotionalProducts = [
  {
    id: 1,
    name: 'Autoclave Clase B 18L Premium',
    brand: 'SurgiLine',
    originalPrice: 1250.00,
    discountedPrice: 875.00,
    discountPercent: 30,
    image: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?q=80&w=600&auto=format&fit=crop',
    category: 'Equipos',
    isFlashSale: true
  },
  {
    id: 2,
    name: 'Kit de Resinas Compuestas Pro',
    brand: 'DentalCore',
    originalPrice: 180.00,
    discountedPrice: 144.00,
    discountPercent: 20,
    image: 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?q=80&w=600&auto=format&fit=crop',
    category: 'Materiales',
    isFlashSale: false
  },
  {
    id: 3,
    name: 'Micromotor Clínico de Alta Precisión',
    brand: 'AeroDent',
    originalPrice: 450.00,
    discountedPrice: 382.50,
    discountPercent: 15,
    image: 'https://images.unsplash.com/photo-1598256989800-fea5f95b5fff?q=80&w=600&auto=format&fit=crop',
    category: 'Equipos',
    isFlashSale: false
  },
  {
    id: 4,
    name: 'Cajas de Guantes de Nitrilo (100uds)',
    brand: 'SafeTouch',
    originalPrice: 15.00,
    discountedPrice: 9.00,
    discountPercent: 40,
    image: 'https://images.unsplash.com/photo-1584820927498-cafe2c118128?q=80&w=600&auto=format&fit=crop',
    category: 'Desechables',
    isFlashSale: true
  },
  {
    id: 5,
    name: 'Set de Fórceps Quirúrgicos 10pz',
    brand: 'SteelMax',
    originalPrice: 220.00,
    discountedPrice: 165.00,
    discountPercent: 25,
    image: 'https://images.unsplash.com/photo-1509813685-e6ed9e96e003?q=80&w=600&auto=format&fit=crop',
    category: 'Instrumental',
    isFlashSale: false
  },
  {
    id: 6,
    name: 'Lámpara de Fotocurado Inalámbrica',
    brand: 'LuminaTech',
    originalPrice: 195.00,
    discountedPrice: 156.00,
    discountPercent: 20,
    image: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?q=80&w=600&auto=format&fit=crop',
    category: 'Equipos',
    isFlashSale: false
  }
];

export default function Promotions() {
  const [activeFilter, setActiveFilter] = useState('Todos');

  const filteredProducts = activeFilter === 'Todos' 
    ? promotionalProducts 
    : promotionalProducts.filter(p => p.category === activeFilter);

  return (
    <div className="bg-[#f9f9ff] min-h-screen pb-20 font-sans">
      
      {/* Hero Section */}
      <div className="relative w-full overflow-hidden bg-[#191c20]">
        <style>{`
          .hero-clip {
            clip-path: polygon(0 0, 100% 0, 100% 90%, 0 100%);
          }
          @media (min-width: 1024px) {
            .hero-clip {
              clip-path: polygon(0 0, 100% 0, 100% 85%, 0 100%);
            }
          }
        `}</style>
        <div className="hero-clip relative w-full pt-20 pb-32 lg:pt-28 lg:pb-40 bg-gradient-to-r from-[#4f0077] to-[#6b1e96] px-4 sm:px-6 lg:px-8">
          
          {/* Decorative background elements */}
          <div className="absolute top-0 right-0 w-1/2 h-full bg-white opacity-5 mix-blend-overlay skew-x-12 transform translate-x-20"></div>

          <div className="max-w-7xl mx-auto relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="text-white">
              <div className="inline-flex items-center gap-2 bg-[#ffdad6] text-[#93000a] px-4 py-1.5 rounded-full text-sm font-bold tracking-wide font-inter mb-6 uppercase shadow-lg shadow-[#93000a]/10">
                <Clock className="w-4 h-4" />
                Oferta Relámpago
              </div>
              <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tighter mb-6 font-manrope leading-[1.1]">
                Semana de la <br/>
                <span className="text-[#c3ff00]">Endodoncia</span>
              </h1>
              <p className="text-lg lg:text-xl text-[#e6b4ff] font-inter mb-10 max-w-lg leading-relaxed">
                Equipa tu clínica con la más alta tecnología en instrumentación rotatoria y localizadores de ápice con hasta un <strong className="text-white">40% de descuento</strong>.
              </p>
              <button className="bg-[#c3ff00] hover:bg-[#bcf600] text-[#151f00] px-8 py-4 rounded-xl font-bold font-inter text-lg shadow-[0_10px_25px_rgba(195,255,0,0.25)] transition-all active:scale-95 flex items-center gap-3">
                Ver Ofertas Flash
                <Tag className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20">
        
        {/* Filter Pills */}
        <div className="flex overflow-x-auto pb-6 pt-2 hide-scrollbar gap-3 snap-x">
          {filterCategories.map(category => (
            <button
              key={category}
              onClick={() => setActiveFilter(category)}
              className={`whitespace-nowrap px-6 py-3 rounded-full font-inter text-sm font-semibold transition-all snap-start ${
                activeFilter === category
                  ? 'bg-[#4f0077] text-white shadow-lg'
                  : 'bg-white text-[#4d4351] hover:bg-[#ededf3] shadow-sm'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Header for grid */}
        <div className="flex justify-between items-end mt-10 mb-8">
          <h2 className="text-3xl font-bold font-manrope text-[#191c20]">
            Ofertas Destacadas
          </h2>
          <span className="text-[#7f7382] font-inter font-medium text-sm">
            {filteredProducts.length} productos
          </span>
        </div>

        {/* Promotions Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProducts.map(product => (
            <div 
              key={product.id} 
              className="bg-white rounded-[2rem] overflow-hidden shadow-[0_20px_40px_rgba(25,28,32,0.04)] hover:shadow-[0_20px_40px_rgba(25,28,32,0.08)] transition-all duration-300 group flex flex-col relative"
            >
              {/* Discount Badge */}
              <div className="absolute top-5 left-5 z-10 flex flex-col gap-2">
                <div className="bg-[#ef4444] text-white px-3 py-1.5 rounded-lg font-bold font-manrope text-sm shadow-lg">
                  -{product.discountPercent}%
                </div>
                {product.isFlashSale && (
                  <div className="bg-[#191c20] text-white px-3 py-1.5 rounded-lg font-bold font-inter text-xs shadow-lg uppercase tracking-wide flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Flash
                  </div>
                )}
              </div>

              {/* Image Container */}
              <div className="relative h-64 overflow-hidden bg-[#f3f3f9]">
                <img 
                  src={product.image} 
                  alt={product.name} 
                  className="w-full h-full object-cover mix-blend-multiply group-hover:scale-105 transition-transform duration-500"
                />
              </div>

              {/* Content */}
              <div className="p-8 flex-grow flex flex-col">
                <p className="text-xs font-bold text-[#853bb0] uppercase tracking-wider font-inter mb-2">
                  {product.brand}
                </p>
                <h3 className="text-lg font-bold font-manrope text-[#191c20] mb-4 leading-tight">
                  <Link to={`/product/${product.id}`} className="hover:text-[#6b1e96] transition-colors">
                    {product.name}
                  </Link>
                </h3>
                
                <div className="mt-auto pt-4 flex items-end justify-between">
                  <div>
                    <span className="text-sm text-[#7f7382] line-through font-inter font-medium block mb-0.5">
                      ${product.originalPrice.toFixed(2)}
                    </span>
                    <span className="text-2xl font-bold font-manrope text-[#ef4444]">
                      ${product.discountedPrice.toFixed(2)}
                    </span>
                  </div>
                  
                  <button className="w-12 h-12 rounded-xl bg-[#f3f3f9] text-[#191c20] flex items-center justify-center hover:bg-[#c3ff00] hover:text-[#151f00] transition-colors shadow-sm">
                    <ShoppingCart className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
