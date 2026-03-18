import { useEffect, useState } from "react";
import LoadingSkeleton from "../../components/LoadingSkeleton";
import { getPendingProductsAPI, moderateProductAPI } from "../../services/api";
import { formatCurrencyUSD } from "../../utils/formatters";
import toast from "react-hot-toast";

export default function ProductModeration() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPending = async () => {
    setLoading(true);
    try {
      const response = await getPendingProductsAPI();
      setProducts(response.data.data || []);
    } catch {
      toast.error("Error al cargar productos pendientes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleModerate = async (id, action, name) => {
    const label = action === "approve" ? "aprobar" : "rechazar";
    if (!window.confirm(`¿Seguro que quieres ${label} "${name}"?`)) return;

    try {
      await moderateProductAPI(id, action);
      toast.success(
        action === "approve"
          ? `"${name}" aprobado y publicado`
          : `"${name}" rechazado`,
      );
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      toast.error(err.response?.data?.error || "Error al moderar producto");
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">
        Moderación de Productos
      </h1>
      <p className="text-sm text-gray-500 mb-6">
        {products.length} producto{products.length !== 1 ? "s" : ""} pendiente
        {products.length !== 1 ? "s" : ""} de revisión
      </p>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <LoadingSkeleton variant="product-card" count={2} />
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="text-5xl mb-4">✅</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Todo al día
          </h3>
          <p className="text-gray-500 text-sm">
            No hay productos pendientes de moderación.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {products.map((product) => {
            const storeName =
              product.store_profiles?.business_name || "Tienda desconocida";
            const variationCount = product.product_variations?.length || 0;

            return (
              <div
                key={product.id}
                className="bg-white rounded-xl border border-gray-200 p-5"
              >
                <div className="flex items-start gap-4">
                  {/* Images */}
                  <div className="flex gap-1 flex-shrink-0">
                    {(product.images || []).slice(0, 2).map((url, i) => (
                      <div
                        key={i}
                        className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100"
                      >
                        <img
                          src={url}
                          alt=""
                          loading="lazy"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                    {(!product.images || product.images.length === 0) && (
                      <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center text-2xl text-gray-300">
                        🦷
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 text-sm">
                      {product.name}
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      por <span className="font-medium">{storeName}</span>
                    </p>
                    <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                      {product.description}
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-sm font-bold text-primary-600">
                        {formatCurrencyUSD(product.price)}
                      </span>
                      <span className="text-xs text-gray-400">
                        {variationCount} variación
                        {variationCount !== 1 ? "es" : ""}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <button
                      onClick={() =>
                        handleModerate(product.id, "approve", product.name)
                      }
                      className="px-4 py-2 bg-green-600 text-white text-xs font-semibold rounded-lg hover:bg-green-700 transition"
                    >
                      ✓ Aprobar
                    </button>
                    <button
                      onClick={() =>
                        handleModerate(product.id, "reject", product.name)
                      }
                      className="px-4 py-2 border border-red-300 text-red-600 text-xs font-semibold rounded-lg hover:bg-red-50 transition"
                    >
                      ✕ Rechazar
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
