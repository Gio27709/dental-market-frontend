import { Link } from "react-router-dom";
import PropTypes from "prop-types";
import { etiquetaSubtipo, ESTADO_PAGO, navegadorLegible } from "../../lib/supportCategorias";

const corto = (id) => (id ? `#${String(id).substring(0, 8).toUpperCase()}` : "");

/**
 * Tarjeta con el contexto que el autor dejó al abrir el ticket (Fase N3): subtipo, qué esperaba,
 * pasos para reproducir, producto y pedido vinculados. La ven el autor y el admin encima del hilo.
 *
 * - `ticket`: fila de support_tickets con `context`, `product`, `orders`, `store`.
 * - `adminView`: cambia los enlaces (admin → /admin/orders/:id, usuario → /account/orders/:id)
 *   y muestra el dispositivo.
 */
export default function TicketContext({ ticket, adminView = false }) {
  if (!ticket) return null;
  const ctx = ticket.context || {};
  const subtipo = etiquetaSubtipo(ticket.category, ctx.subtype);
  const dev = ticket.device_info || null;
  const tieneAlgo = subtipo || ctx.expected || ctx.steps || ticket.product || ticket.order_id || (adminView && dev);
  if (!tieneAlgo) return null;

  const enlacePedido = adminView ? `/admin/orders/${ticket.order_id}` : `/account/orders/${ticket.order_id}`;

  return (
    <div className="rounded-xl border border-[#6b1e96]/10 bg-purple-50/40 p-3 text-xs space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        {subtipo && (
          <span className="px-2 py-0.5 rounded-md bg-white border border-[#6b1e96]/15 text-[#6b1e96] font-bold text-[10px]">
            {subtipo}
          </span>
        )}
        {ticket.order_id && (
          <Link
            to={enlacePedido}
            className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 font-semibold text-[10px] flex items-center gap-1 hover:border-[#6b1e96]/40"
          >
            <span className="material-symbols-outlined text-[13px]">shopping_bag</span>
            Pedido {corto(ticket.orders?.order_group_id || ticket.order_id)}
            {ticket.linked_order_status ? (
              <span className="text-slate-400">· {ESTADO_PAGO[ticket.linked_order_status] || ticket.linked_order_status}</span>
            ) : null}
          </Link>
        )}
        {ticket.product && (
          <Link
            to={`/product/${ticket.product.id}`}
            className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 font-semibold text-[10px] flex items-center gap-1 hover:border-[#6b1e96]/40 max-w-[240px]"
            title={ticket.product.name}
          >
            {ticket.product.image ? (
              <img src={ticket.product.image} alt="" className="w-4 h-4 rounded object-cover" />
            ) : (
              <span className="material-symbols-outlined text-[13px]">inventory_2</span>
            )}
            <span className="truncate">{ticket.product.name}</span>
            {ticket.product.is_active === false || (ticket.product.moderation_status && ticket.product.moderation_status !== "approved") ? (
              <span className="text-amber-600">· {ticket.product.is_active === false ? "inactivo" : ticket.product.moderation_status}</span>
            ) : null}
          </Link>
        )}
      </div>

      {ctx.expected && (
        <div>
          <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Qué esperaba que pasara</p>
          <p className="text-slate-700 whitespace-pre-line leading-relaxed">{ctx.expected}</p>
        </div>
      )}
      {ctx.steps && (
        <div>
          <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Pasos para reproducirlo</p>
          <p className="text-slate-700 whitespace-pre-line leading-relaxed">{ctx.steps}</p>
        </div>
      )}
      {adminView && dev && (
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-slate-500 pt-1 border-t border-[#6b1e96]/10">
          {navegadorLegible(dev.ua) && (
            <span className="flex items-center gap-1" title={dev.ua}>
              <span className="material-symbols-outlined text-[12px]">devices</span>
              {navegadorLegible(dev.ua)}
            </span>
          )}
          {dev.screen && (
            <span className="flex items-center gap-1" title={dev.viewport ? `Ventana ${dev.viewport}` : ""}>
              <span className="material-symbols-outlined text-[12px]">aspect_ratio</span>
              {dev.screen}
            </span>
          )}
          {dev.path && (
            <span className="flex items-center gap-1 font-mono" title="Ruta desde la que abrió el ticket">
              <span className="material-symbols-outlined text-[12px]">link</span>
              {dev.path}
            </span>
          )}
          {dev.tz && dev.tz !== "America/Caracas" && (
            <span className="flex items-center gap-1" title="Zona horaria del dispositivo">
              <span className="material-symbols-outlined text-[12px]">schedule</span>
              {dev.tz}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

TicketContext.propTypes = {
  ticket: PropTypes.object,
  adminView: PropTypes.bool,
};
