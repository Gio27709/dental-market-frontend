import PropTypes from "prop-types";
import ProductCard from "../ProductCard";

export default function CatalogSection({ products, searchTerm, setSearchTerm }) {
  return (
    <section>
      {/* Título de Catálogo y Búsqueda */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Nuestros Productos
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Explora el inventario completo.
          </p>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar por nombre..."
              className="w-full sm:w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <svg
              className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {products.length === 0 ? (
          <div className="col-span-full py-16 flex flex-col items-center justify-center bg-gray-50 rounded-xl border border-dashed border-gray-300">
            <svg
              className="w-12 h-12 text-gray-400 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
              />
            </svg>
            <p className="text-gray-500 font-medium">
              No se encontraron productos coincidentes.
            </p>
            <button
              onClick={() => setSearchTerm("")}
              className="mt-2 text-primary-600 hover:text-primary-700 text-sm"
            >
              Limpiar búsqueda
            </button>
          </div>
        ) : (
          products.map((product) => (
            <ProductCard key={product.id || product._id} product={product} />
          ))
        )}
      </div>
    </section>
  );
}

CatalogSection.propTypes = {
  products: PropTypes.array.isRequired,
  searchTerm: PropTypes.string.isRequired,
  setSearchTerm: PropTypes.func.isRequired,
};
