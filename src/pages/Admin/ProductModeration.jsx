import { useEffect, useState, useRef, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { getAllAdminProductsAPI, moderateProductAPI, bulkModerateProductsAPI } from "../../services/api";
import { useAdminStats } from "../../context/AdminStatsContext";
import CatalogMatrix from "../../components/admin/CatalogMatrix";
import RejectProductModal from "../../components/admin/RejectProductModal";
import ProductAdminSlideOver from "../../components/admin/ProductAdminSlideOver";

/**
 * Centro de Catálogo (ruta histórica /admin/product-moderation).
 *
 * La página era una lista de cuatro columnas construida alrededor de la bandeja de
 * pendientes; cuando la cola estaba vacía —que es lo normal— no enseñaba nada. Ahora
 * la matriz vive en `CatalogMatrix` con sus cuatro vistas, y aquí solo queda lo que
 * es responsabilidad de la página: el deep link, la ficha lateral y moderar.
 *
 * La ruta NO cambia aunque el título sí: `notificationLinks` manda a
 * /admin/product-moderation?product=<id> y hay notificaciones ya emitidas con ese
 * destino guardado en su columna `link`.
 */
export default function ProductModeration() {
  const { refreshStats } = useAdminStats();
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [rejectModal, setRejectModal] = useState({ product: null, action: "reject" });
  // El lote reusa el mismo modal de motivo: `ids` distingue un lote de una fila suelta.
  const [bulk, setBulk] = useState({ ids: null, action: "reject" });
  // Cambia al moderar para que la matriz vuelva a pedir datos sin recargar la página.
  const [reloadKey, setReloadKey] = useState(0);

  // Deep link desde notificaciones: `?product=<uuid>`. Se pide ese producto concreto
  // y se abre su ficha, sin depender de qué esté mostrando la matriz.
  const [searchParams, setSearchParams] = useSearchParams();
  const deepLinkProduct = searchParams.get("product");
  const deepLinkHandled = useRef(false);

  useEffect(() => {
    if (deepLinkHandled.current || !deepLinkProduct) return;
    deepLinkHandled.current = true;
    setSearchParams({}, { replace: true });

    (async () => {
      try {
        const response = await getAllAdminProductsAPI({ id: deepLinkProduct, status: "all", page: 1, limit: 1 });
        const product = response.data?.data?.[0];
        if (product) setSelectedProduct(product);
        else toast.error("No se encontró el elemento indicado");
      } catch {
        toast.error("No se encontró el elemento indicado");
      }
    })();
  }, [deepLinkProduct, setSearchParams]);

  /**
   * Aprobar va directo; rechazar y banear abren el modal que recoge el motivo. El
   * backend responde 400 sin motivo, así que no hay atajo posible.
   */
  const handleModerate = useCallback(
    async (id, action, name, reason, note) => {
      if (action !== "approve" && !reason) {
        setRejectModal({ product: { id, name }, action });
        return;
      }
      if (action === "approve" && !window.confirm(`¿Seguro que quieres aprobar "${name}"?`)) return;

      try {
        await moderateProductAPI(id, action, reason, note);
        toast.success(
          action === "approve" ? `"${name}" aprobado y publicado`
          : action === "reject" ? `"${name}" rechazado`
          : `"${name}" baneado`
        );
        setRejectModal({ product: null, action: "reject" });
        setSelectedProduct(null);
        setReloadKey((n) => n + 1);
        refreshStats();
      } catch (err) {
        toast.error(err.response?.data?.error || "Error al moderar producto");
      }
    },
    [refreshStats]
  );

  /**
   * Aprobar en lote pide confirmación; rechazar en lote pasa por el modal, que exige
   * el mismo motivo para todos: si cada uno tuviera el suyo, no sería un lote.
   */
  const handleBulk = useCallback(
    async (action, ids, reason, note) => {
      if (action !== "approve" && !reason) {
        setBulk({ ids, action });
        return;
      }
      if (
        action === "approve" &&
        !window.confirm(`¿Aprobar y publicar ${ids.length} producto(s)?`)
      ) return;

      try {
        const res = await bulkModerateProductsAPI(ids, action, reason, note);
        const { moderated, failed = [], notFound = [] } = res.data || {};
        toast.success(res.data?.message || `${moderated} producto(s) moderados`);
        if (failed.length || notFound.length) {
          toast.error(`${failed.length + notFound.length} no se pudieron moderar`);
        }
        setBulk({ ids: null, action: "reject" });
        setReloadKey((n) => n + 1);
        refreshStats();
      } catch (err) {
        toast.error(err.response?.data?.error || "Error al moderar el lote");
      }
    },
    [refreshStats]
  );

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-5">
      <div>
        <h1 className="text-[22px] font-semibold text-slate-900 tracking-tight">Catálogo</h1>
        <p className="text-slate-500 mt-0.5 text-sm">
          Modera la cola, mide el rendimiento, detecta problemas y audita cada decisión.
        </p>
      </div>

      {/* `key` fuerza el remontaje tras moderar: la matriz recarga sin tocar la ruta. */}
      <CatalogMatrix
        key={reloadKey}
        onModerate={setSelectedProduct}
        onBulk={(action, ids) => handleBulk(action, ids)}
      />

      <ProductAdminSlideOver
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onModerate={handleModerate}
      />

      {bulk.ids && (
        <RejectProductModal
          product={{ id: "bulk", name: `${bulk.ids.length} producto(s) seleccionados` }}
          action={bulk.action}
          onCancel={() => setBulk({ ids: null, action: "reject" })}
          onConfirm={({ reason, note }) => handleBulk(bulk.action, bulk.ids, reason, note)}
        />
      )}

      {rejectModal.product && (
        <RejectProductModal
          product={rejectModal.product}
          action={rejectModal.action}
          onCancel={() => setRejectModal({ product: null, action: "reject" })}
          onConfirm={({ reason, note }) =>
            handleModerate(rejectModal.product.id, rejectModal.action, rejectModal.product.name, reason, note)
          }
        />
      )}
    </div>
  );
}
