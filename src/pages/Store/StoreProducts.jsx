import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useStore } from "../../context/StoreContext";
import { formatCurrencyUSD } from "../../utils/formatters";
import toast from "react-hot-toast";

const STATUS_BADGE = {
  Borrador: "bg-gray-100 text-gray-800 border border-gray-200",
  Activo: "bg-green-100 text-green-800 border border-green-200",
  "Sin stock": "bg-red-100 text-red-800 border border-red-200",
};

export default function StoreProducts() {
  const { myProducts, loading, fetchMyProducts, deleteProduct } = useStore();

  useEffect(() => {
    fetchMyProducts();
  }, [fetchMyProducts]);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`¿Estás seguro de eliminar "${name}"?`)) return;
    const result = await deleteProduct(id);
    if (result.success) {
      toast.success("Producto eliminado");
    } else {
      toast.error(result.error);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Mis Productos</h2>
          <p className="text-sm text-gray-500">
            {myProducts.length} producto{myProducts.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          to="/store/products/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition text-sm"
        >
          + Nuevo Producto
        </Link>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-lg border p-4 animate-pulse flex gap-4"
            >
              <div className="w-16 h-16 bg-gray-200 rounded" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-40 bg-gray-200 rounded" />
                <div className="h-3 w-20 bg-gray-100 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : myProducts.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="text-5xl mb-4">📦</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No tienes productos aún
          </h3>
          <p className="text-gray-500 text-sm mb-6">
            Crea tu primer producto para empezar a vender.
          </p>
          <Link
            to="/store/products/new"
            className="px-5 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-medium text-sm"
          >
            Crear mi primer producto
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {myProducts.map((product) => {
            const imageUrl = product.images?.[0];
            const displayStatus = product.stock_status || (product.is_active ? "Activo" : "Borrador");
            const badge = STATUS_BADGE[displayStatus] || STATUS_BADGE.Borrador;
            const variationCount = product.product_variations?.length || 0;

            return (
              <div
                key={product.id}
                className="bg-white rounded-lg border border-gray-200 p-4 flex items-center gap-4 hover:shadow-sm transition-shadow"
              >
                {/* Image */}
                <div className="w-16 h-16 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={product.name}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl text-gray-300">
                      🦷
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 text-sm truncate">
                    {product.name}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {formatCurrencyUSD(product.price)} · {variationCount}{" "}
                    variación{variationCount !== 1 ? "es" : ""}
                  </p>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold mt-1 ${badge}`}
                  >
                    {displayStatus}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-4 flex-shrink-0">
                  <Link
                    to={`/store/products/edit/${product.id}`}
                    className="text-primary-600 hover:text-primary-700 text-xs font-medium"
                  >
                    Editar
                  </Link>
                  <button
                    onClick={() => handleDelete(product.id, product.name)}
                    className="text-red-500 hover:text-red-700 text-xs font-medium"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
