import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { getStoreEscrowAPI } from "../../services/api";

/**
 * Escrow de una tienda: cuánto le guardamos, cuánto puede reclamar ya y qué se le ha ido
 * liberando.
 *
 * Lee el endpoint que consulta `v_escrow_items` (migración 055), la misma vista que
 * alimenta la tarjeta de Finanzas, así que este bloque y el panel no pueden discrepar.
 *
 * Tema claro a propósito: esta ficha vive en el admin de tiendas, no en el panel de
 * analíticas, y allí los componentes `fx-*` de tema oscuro desentonan.
 */

const money = (v) => {
  const n = parseFloat(v || 0);
  const s = Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${n < 0 ? "-" : ""}$${s}`;
};

const fecha = (v) =>
  v ? new Date(v).toLocaleDateString("es-VE", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—";

const EVENTO = {
  released: { label: "Liberado", clase: "bg-green-50 text-green-600" },
  held: { label: "Retenido", clase: "bg-amber-50 text-amber-600" },
  legacy: { label: "Legado", clase: "bg-gray-100 text-gray-500" }
};

const SITUACION = {
  claimable: { label: "Exigible", clase: "text-amber-600 font-semibold" },
  in_transit: { label: "En tránsito", clase: "text-gray-500" },
  legacy: { label: "Legado", clase: "text-gray-400" }
};

export default function StoreEscrowPanel({ storeId, walletPending }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!storeId) return undefined;
    let vigente = true;
    setLoading(true);
    setError(null);

    getStoreEscrowAPI(storeId)
      .then((res) => {
        if (vigente && res.data?.success) setData(res.data.data);
      })
      .catch((err) => {
        if (vigente) setError(err.response?.data?.error || "No se pudo cargar el escrow.");
      })
      .finally(() => {
        if (vigente) setLoading(false);
      });

    // La ficha puede cambiar de tienda antes de que responda la petición anterior.
    return () => {
      vigente = false;
    };
  }, [storeId]);

  if (loading) {
    return (
      <div className="space-y-2">
        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Escrow</h4>
        <div className="bg-gray-50 rounded-xl p-4 text-center">
          <p className="text-xs text-gray-400 animate-pulse">Consultando el escrow…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-2">
        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Escrow</h4>
        <div className="bg-red-50 border border-red-100 rounded-xl p-3">
          <p className="text-xs text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const sinNada = data.retainedUsd === 0 && data.legacyUsd === 0 && data.releasedUsd === 0;

  // La billetera solo se actualiza cuando un admin la reconcilia a mano: si dice otra cosa
  // que lo retenido de verdad, lleva tiempo sin cuadrarse.
  const descuadre =
    walletPending !== undefined && Number(walletPending || 0) !== Number(data.retainedUsd);

  return (
    <div className="space-y-2">
      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Escrow</h4>

      {sinNada ? (
        <div className="bg-gray-50 rounded-xl p-4 text-center">
          <p className="text-xs text-gray-500">Sin dinero en custodia ni liberaciones registradas.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] text-gray-500 font-medium">Retenido ahora</p>
                <p className="text-xl font-bold text-[#6b1e96]">{money(data.retainedUsd)}</p>
                <p className="text-[10px] text-gray-500">
                  {data.liveItems} ítem{data.liveItems === 1 ? "" : "s"}
                  {data.oldestDays > 0 && ` · el más viejo, ${data.oldestDays} días`}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-gray-500 font-medium">Ya exigible</p>
                <p className={`text-xl font-bold ${data.claimableUsd > 0 ? "text-amber-600" : "text-gray-400"}`}>
                  {money(data.claimableUsd)}
                </p>
                <p className="text-[10px] text-gray-500">entregado sin liberar</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-200">
              <div>
                <p className="text-[10px] text-gray-500 font-medium">Liberado histórico</p>
                <p className="text-sm font-bold text-gray-900">{money(data.releasedUsd)}</p>
                <p className="text-[10px] text-gray-400">
                  {data.releasedItems} ítems · último {fecha(data.lastReleaseAt)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-gray-500 font-medium">Legado pre-escrow</p>
                <p className="text-sm font-bold text-gray-600">{money(data.legacyUsd)}</p>
                <p className="text-[10px] text-gray-400">{data.legacyItems} ítems · fuera del sistema</p>
              </div>
            </div>
          </div>

          {descuadre && (
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
              <p className="text-xs text-amber-700">
                Su billetera dice <strong>{money(walletPending)}</strong> pendiente, pero lo retenido de
                verdad son <strong>{money(data.retainedUsd)}</strong>. El saldo pendiente solo se
                actualiza al reconciliar la billetera a mano.
              </p>
            </div>
          )}

          {data.items.length > 0 && (
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-[10px] text-gray-500 font-medium mb-2">Qué le estamos guardando</p>
              <div className="space-y-1.5">
                {data.items.map((it) => {
                  const sit = SITUACION[it.escrow_class] || SITUACION.in_transit;
                  return (
                    <div key={it.item_id} className="flex items-center justify-between gap-2 text-xs">
                      <span className="text-gray-900 truncate flex-1">{it.product_name}</span>
                      <span className={`shrink-0 text-[10px] ${sit.clase}`}>{sit.label}</span>
                      <span className="font-semibold text-gray-900 shrink-0 tabular-nums">
                        {money(it.amount_usd)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {data.history.length > 0 && (
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-[10px] text-gray-500 font-medium mb-2">Historial</p>
              <div className="space-y-1 max-h-56 overflow-y-auto">
                {data.history.map((h, i) => {
                  const ev = EVENTO[h.evento] || EVENTO.held;
                  return (
                    <div
                      key={`${h.fecha}-${i}`}
                      className="flex items-center gap-2 text-xs py-1 border-b border-gray-200 last:border-0"
                    >
                      <span className="text-gray-400 tabular-nums shrink-0 text-[10px]">{fecha(h.fecha)}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0 ${ev.clase}`}>
                        {ev.label}
                      </span>
                      <span className="text-gray-700 truncate flex-1">{h.product_name}</span>
                      <span className="font-semibold text-gray-900 shrink-0 tabular-nums">
                        {money(h.amount_usd)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

StoreEscrowPanel.propTypes = {
  storeId: PropTypes.string.isRequired,
  walletPending: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
};
