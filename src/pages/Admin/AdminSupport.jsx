import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import PropTypes from "prop-types";
import {
  getAllTicketsAdminAPI,
  getTicketDetailsAPI,
  addTicketMessageAPI,
  updateTicketStatusAdminAPI,
  updateTicketPriorityAdminAPI,
  getTicketContextAdminAPI,
} from "../../services/api";
import { useAdminStats } from "../../context/AdminStatsContext";
import toast from "react-hot-toast";
import { socket } from "../../lib/socket";
import { AttachmentPicker, AttachmentList } from "../../components/support/TicketAttachments";
import TicketContext from "../../components/support/TicketContext";
import { subirAdjuntos } from "../../lib/ticketAttachments";
import {
  CATEGORIAS,
  etiquetaCategoria,
  etiquetaSubtipo,
  PRIORIDADES,
  ESTADOS_TICKET as STATUSES,
  ROLES_LEGIBLES as ROLE_LABELS,
  ESTADO_PAGO,
  ESTADO_PEDIDO,
  ESTADO_ENTREGA,
} from "../../lib/supportCategorias";

const PESO_PRIORIDAD = { urgent: 0, high: 1, normal: 2, low: 3 };
const corto = (id) => (id ? `#${String(id).substring(0, 8).toUpperCase()}` : "");
const usd = (n) => `$${Number(n || 0).toFixed(2)}`;
const fechaCorta = (d) =>
  d ? new Date(d).toLocaleDateString("es-VE", { day: "2-digit", month: "short", year: "2-digit" }) : "—";

function PriorityBadge({ priority, small = false }) {
  const p = PRIORIDADES[priority] || PRIORIDADES.normal;
  if (priority === "normal" || !priority) return null;
  return (
    <span
      className={`${small ? "text-[8px] px-1.5" : "text-[9px] px-2"} py-0.5 font-black uppercase rounded-full`}
      style={{ background: p.bg, color: p.color }}
      title={`Prioridad ${p.label.toLowerCase()}`}
    >
      {p.label}
    </span>
  );
}

PriorityBadge.propTypes = { priority: PropTypes.string, small: PropTypes.bool };

// Enlace a la tienda en el panel Tiendas (misma búsqueda que usa esa pantalla).
const enlaceTienda = (store) =>
  `/admin/store-applications?tab=approved&search=${encodeURIComponent(store?.store_code || store?.business_name || "")}`;

function Dato({ label, children, mono = false }) {
  return (
    <div className="min-w-0">
      <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">{label}</p>
      <p className={`text-xs text-slate-700 font-semibold truncate ${mono ? "font-mono" : ""}`}>{children ?? "—"}</p>
    </div>
  );
}

Dato.propTypes = { label: PropTypes.string.isRequired, children: PropTypes.node, mono: PropTypes.bool };

/** Ficha del autor (N5): quién es, su tienda, sus pedidos, sus otros tickets y lo vinculado. */
function FichaAutor({ ctx, loading, onOpenTicket }) {
  if (loading) {
    return (
      <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/40 animate-pulse">
        <div className="h-3 w-1/3 bg-slate-200 rounded mb-2" />
        <div className="h-3 w-2/3 bg-slate-200 rounded" />
      </div>
    );
  }
  if (!ctx) return null;
  const { author, store, recent_orders = [], other_tickets = [], tickets_total = 0, linked_order, linked_product } = ctx;

  return (
    <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/40 text-xs space-y-3 max-h-[260px] overflow-y-auto admin-scrollbar">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Autor */}
        {author && (
          <div className="rounded-xl bg-white border border-slate-100 p-3 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[9px] font-black uppercase tracking-wider text-[#6b1e96]">Autor</p>
              <div className="flex items-center gap-1">
                <span className="px-1.5 py-0.2 text-[8px] font-black uppercase rounded bg-slate-100 text-slate-600">
                  {ROLE_LABELS[author.role] || author.role}
                </span>
                {author.is_active === false && (
                  <span className="px-1.5 py-0.2 text-[8px] font-black uppercase rounded bg-red-50 text-red-600">Inactivo</span>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Dato label="Nombre">{author.full_name || "—"}</Dato>
              <Dato label="Correo" mono>
                {author.email}
              </Dato>
              <Dato label="Registrado">{fechaCorta(author.created_at)}</Dato>
              <Dato label="Última vez">{author.last_seen_at ? fechaCorta(author.last_seen_at) : "—"}</Dato>
            </div>
            <p className="text-[10px] text-slate-400">
              {tickets_total} ticket{tickets_total === 1 ? "" : "s"} en total
              {author.is_verified ? " · cuenta verificada" : ""}
            </p>
          </div>
        )}

        {/* Tienda */}
        {store && (
          <div className="rounded-xl bg-white border border-purple-100 p-3 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[9px] font-black uppercase tracking-wider text-[#6b1e96]">
                {store.is_author ? "Su tienda" : "Tienda implicada"}
              </p>
              <div className="flex items-center gap-1 flex-wrap justify-end">
                {store.is_test && (
                  <span className="px-1.5 py-0.2 text-[8px] font-black uppercase rounded bg-amber-50 text-amber-700">Prueba</span>
                )}
                {store.is_suspended ? (
                  <span className="px-1.5 py-0.2 text-[8px] font-black uppercase rounded bg-red-50 text-red-600" title={store.suspension_reason || ""}>
                    Suspendida
                  </span>
                ) : (
                  <span className="px-1.5 py-0.2 text-[8px] font-black uppercase rounded bg-green-50 text-green-700">
                    {store.is_open === false ? "Cerrada" : "Activa"}
                  </span>
                )}
                {store.is_verified && (
                  <span className="px-1.5 py-0.2 text-[8px] font-black uppercase rounded bg-blue-50 text-blue-700">Verificada</span>
                )}
              </div>
            </div>
            <Link to={enlaceTienda(store)} className="font-extrabold text-slate-800 hover:text-[#6b1e96] flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">storefront</span>
              {store.business_name}
              {store.store_code ? <span className="text-slate-400 font-mono text-[10px]">#{store.store_code}</span> : null}
              <span className="material-symbols-outlined text-[12px] text-slate-300">open_in_new</span>
            </Link>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <Dato label="Estado">{store.state || "—"}</Dato>
              <Dato label="Disponible">{usd(store.balance_available)}</Dato>
              <Dato label="Retenido">{usd(store.balance_pending)}</Dato>
              <Dato label="Productos">{store.products_count}</Dato>
            </div>
            <p className="text-[10px] text-slate-400">
              {store.tickets_count} ticket{store.tickets_count === 1 ? "" : "s"} de esta tienda · desde {fechaCorta(store.created_at)}
              {store.business_phone ? ` · ${store.business_phone}` : ""}
            </p>
          </div>
        )}

        {/* Pedidos recientes (comprador) */}
        {recent_orders.length > 0 && (
          <div className="rounded-xl bg-white border border-slate-100 p-3 space-y-1.5">
            <p className="text-[9px] font-black uppercase tracking-wider text-[#6b1e96]">Pedidos recientes</p>
            {recent_orders.map((o) => (
              <Link
                key={o.id}
                to={`/admin/orders/${o.id}`}
                className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-50 border border-transparent hover:border-slate-100"
              >
                <div className="min-w-0">
                  <p className="font-bold text-slate-700 font-mono text-[10px]">
                    {corto(o.order_group_id || o.id)} <span className="text-slate-400 font-sans">· {fechaCorta(o.created_at)}</span>
                  </p>
                  <p className="text-[10px] text-slate-400 truncate">{o.stores.join(", ") || "—"}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-slate-700">{usd(o.total_usd)}</p>
                  <p className="text-[9px] text-slate-500">
                    {ESTADO_PAGO[o.payment_status] || o.payment_status}
                    {o.order_status === "cancelled"
                      ? " · cancelado"
                      : o.delivery_statuses.length
                        ? ` · ${o.delivery_statuses.map((d) => ESTADO_ENTREGA[d] || d).join("/")}`
                        : ""}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Otros tickets del autor */}
        {other_tickets.length > 0 && (
          <div className="rounded-xl bg-white border border-slate-100 p-3 space-y-1.5">
            <p className="text-[9px] font-black uppercase tracking-wider text-[#6b1e96]">Otros tickets del autor</p>
            {other_tickets.map((t) => {
              const st = STATUSES[t.status] || {};
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => onOpenTicket(t)}
                  className="w-full text-left flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-50 border border-transparent hover:border-slate-100 cursor-pointer"
                >
                  <div className="min-w-0">
                    <p className="font-bold text-slate-700 truncate">{t.subject}</p>
                    <p className="text-[10px] text-slate-400">
                      {etiquetaCategoria(t.category)} · {fechaCorta(t.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <PriorityBadge priority={t.priority} small />
                    <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full" style={{ background: st.bg, color: st.color }}>
                      {st.label || t.status}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Pedido vinculado con estado actual */}
        {linked_order && (
          <div className="rounded-xl bg-white border border-slate-100 p-3 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[9px] font-black uppercase tracking-wider text-[#6b1e96]">Pedido vinculado</p>
              <Link to={`/admin/orders/${linked_order.id}`} className="text-[10px] font-bold text-[#6b1e96] hover:underline flex items-center gap-0.5">
                Abrir <span className="material-symbols-outlined text-[12px]">open_in_new</span>
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <Dato label="Número" mono>
                {corto(linked_order.order_group_id || linked_order.id)}
              </Dato>
              <Dato label="Total">{usd(linked_order.total_usd)}</Dato>
              <Dato label="Pago">{ESTADO_PAGO[linked_order.payment_status] || linked_order.payment_status}</Dato>
              <Dato label="Pedido">
                {ESTADO_PEDIDO[linked_order.order_status] || linked_order.order_status}
                {linked_order.escrow_status ? ` · escrow ${linked_order.escrow_status}` : ""}
              </Dato>
            </div>
            <div className="space-y-1">
              {(linked_order.order_items || []).map((i) => (
                <div key={i.id} className="flex items-center justify-between gap-2 text-[10px]">
                  <span className="truncate text-slate-600">
                    {i.quantity}× {i.product_name || "Producto"} <span className="text-slate-400">· {i.store_name || "—"}</span>
                  </span>
                  <span className="shrink-0 font-bold text-slate-500">
                    {ESTADO_ENTREGA[i.delivery_status] || i.delivery_status}
                    {i.tracking_code ? ` · ${i.shipping_carrier || ""} ${i.tracking_code}` : ""}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Producto vinculado */}
        {linked_product && (
          <div className="rounded-xl bg-white border border-slate-100 p-3 flex items-center gap-3">
            {linked_product.image ? (
              <img src={linked_product.image} alt="" className="w-12 h-12 rounded-lg object-cover border border-slate-100" />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-slate-50 flex items-center justify-center text-slate-300">
                <span className="material-symbols-outlined">inventory_2</span>
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-[9px] font-black uppercase tracking-wider text-[#6b1e96]">Producto vinculado</p>
              <Link to={`/product/${linked_product.id}`} className="font-extrabold text-slate-800 hover:text-[#6b1e96] truncate block">
                {linked_product.name}
              </Link>
              <p className="text-[10px] text-slate-500">
                {usd(linked_product.price)} · {linked_product.store_name || "—"} ·{" "}
                {linked_product.is_active === false ? "inactivo" : linked_product.moderation_status || "—"}
                {linked_product.stock_status ? ` · ${linked_product.stock_status}` : ""}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

FichaAutor.propTypes = { ctx: PropTypes.object, loading: PropTypes.bool, onOpenTicket: PropTypes.func.isRequired };

export default function AdminSupport() {
  const { refreshStats } = useAdminStats();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTicket, setActiveTicket] = useState(null);
  const [ticketDetails, setTicketDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [contexto, setContexto] = useState(null);
  const [loadingContexto, setLoadingContexto] = useState(false);
  const [mostrarFicha, setMostrarFicha] = useState(true);
  const [replyText, setReplyText] = useState("");
  const [replying, setReplying] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [updatingPriority, setUpdatingPriority] = useState(false);
  const [replyFiles, setReplyFiles] = useState([]);

  // Filters
  const [filterStatus, setFilterStatus] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [filterAuthor, setFilterAuthor] = useState("");
  const [sortBy, setSortBy] = useState("activity"); // activity | priority
  const [searchTerm, setSearchTerm] = useState("");

  const chatContainerRef = useRef(null);
  const lastTicketIdRef = useRef(null);
  const lastMessagesLengthRef = useRef(0);

  const handleSelectTicket = useCallback(async (ticket) => {
    setActiveTicket(ticket);
    setTickets((prev) =>
      prev.map((t) => (t.id === ticket.id ? { ...t, admin_has_unread: false } : t))
    );
    setContexto(null);
    setLoadingDetails(true);
    setLoadingContexto(true);
    // Detalle y ficha del autor en paralelo; la ficha no bloquea el hilo.
    getTicketDetailsAPI(ticket.id)
      .then((res) => {
        if (res.data && res.data.success) {
          setTicketDetails(res.data.data);
          // Completa la fila de la lista con lo que trae el detalle (prioridad, categoría…).
          setActiveTicket((prev) => (prev && prev.id === ticket.id ? { ...res.data.data.ticket, ...prev, ...res.data.data.ticket } : prev));
        }
      })
      .catch((error) => {
        console.error(error);
        toast.error("Error al cargar el detalle del ticket.");
      })
      .finally(() => setLoadingDetails(false));
    getTicketContextAdminAPI(ticket.id)
      .then((res) => {
        if (res.data && res.data.success) setContexto(res.data.data);
      })
      .catch((error) => console.error("[AdminSupport] ficha del autor:", error))
      .finally(() => setLoadingContexto(false));
  }, []);

  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterStatus) params.status = filterStatus;
      if (filterCategory) params.category = filterCategory;
      if (filterPriority) params.priority = filterPriority;
      if (filterAuthor) params.author = filterAuthor;

      const res = await getAllTicketsAdminAPI(params);
      if (res.data && res.data.success) {
        const ticketList = res.data.data || [];
        setTickets(ticketList);

        // Auto-select ticket from URL if ticketId is present
        const urlParams = new URLSearchParams(window.location.search);
        const ticketIdFromUrl = urlParams.get("ticketId");
        if (ticketIdFromUrl) {
          const matchedTicket = ticketList.find((t) => t.id === ticketIdFromUrl);
          if (matchedTicket) {
            handleSelectTicket(matchedTicket);
          }
        }
      }
    } catch (error) {
      console.error(error);
      toast.error("Error al cargar los tickets de soporte.");
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterCategory, filterPriority, filterAuthor, handleSelectTicket]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  useEffect(() => {
    if (!ticketDetails || !chatContainerRef.current) return;

    const ticketId = ticketDetails.ticket.id;
    const messagesLength = ticketDetails.messages.length;
    const isNewTicket = lastTicketIdRef.current !== ticketId;

    if (isNewTicket) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    } else if (messagesLength > lastMessagesLengthRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }

    lastTicketIdRef.current = ticketId;
    lastMessagesLengthRef.current = messagesLength;
  }, [ticketDetails]);

  useEffect(() => {
    if (!activeTicket) return;

    socket.emit("join_ticket", activeTicket.id);

    const handleNewMessage = (message) => {
      setTicketDetails((prev) => {
        if (!prev) return prev;
        const exists = prev.messages.some((m) => m.id === message.id);
        if (exists) return prev;
        return {
          ...prev,
          messages: [...prev.messages, message],
        };
      });
    };

    const handleTicketUpdated = (updatedTicket) => {
      if (updatedTicket.id !== activeTicket.id) return;
      const cambios = { status: updatedTicket.status, priority: updatedTicket.priority, admin_has_unread: false };
      setActiveTicket((prev) => (prev ? { ...prev, ...cambios } : prev));
      setTicketDetails((prev) => (prev ? { ...prev, ticket: { ...prev.ticket, ...cambios } } : prev));
      setTickets((prevList) => prevList.map((t) => (t.id === activeTicket.id ? { ...t, ...cambios } : t)));
    };

    socket.on("support_message", handleNewMessage);
    socket.on("ticket_updated", handleTicketUpdated);

    return () => {
      socket.emit("leave_ticket", activeTicket.id);
      socket.off("support_message", handleNewMessage);
      socket.off("ticket_updated", handleTicketUpdated);
    };
  }, [activeTicket?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const handleTicketCreated = () => {
      fetchTickets();
    };

    const handleTicketUpdatedList = (updatedTicket) => {
      setTickets((prev) =>
        prev.map((t) => (t.id === updatedTicket.id ? { ...t, ...updatedTicket, users: t.users, store: t.store, attachments_count: t.attachments_count } : t))
      );
    };

    socket.on("ticket_created", handleTicketCreated);
    socket.on("ticket_updated", handleTicketUpdatedList);

    return () => {
      socket.off("ticket_created", handleTicketCreated);
      socket.off("ticket_updated", handleTicketUpdatedList);
    };
  }, [fetchTickets]);

  const handleSendReply = async (e) => {
    e.preventDefault();
    if ((!replyText.trim() && replyFiles.length === 0) || !activeTicket) return;

    try {
      setReplying(true);
      const attachments = replyFiles.length ? await subirAdjuntos(replyFiles) : [];
      const res = await addTicketMessageAPI(activeTicket.id, { message: replyText.trim(), attachments });
      if (res.data && res.data.success) {
        setReplyText("");
        setReplyFiles([]);
        const detailsRes = await getTicketDetailsAPI(activeTicket.id);
        if (detailsRes.data && detailsRes.data.success) {
          setTicketDetails(detailsRes.data.data);
          if (activeTicket.status === "open") {
            setActiveTicket((prev) => ({ ...prev, status: "in_progress" }));
          }
        }
        fetchTickets();
        refreshStats();
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.error || "Error al enviar la respuesta.");
    } finally {
      setReplying(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (!activeTicket || !newStatus) return;
    try {
      setUpdatingStatus(true);
      const res = await updateTicketStatusAdminAPI(activeTicket.id, newStatus);
      if (res.data && res.data.success) {
        toast.success(`Ticket marcado como "${STATUSES[newStatus].label}"`);
        setActiveTicket((prev) => ({ ...prev, status: newStatus }));
        const detailsRes = await getTicketDetailsAPI(activeTicket.id);
        if (detailsRes.data && detailsRes.data.success) {
          setTicketDetails(detailsRes.data.data);
        }
        fetchTickets();
        refreshStats();
      }
    } catch (error) {
      console.error(error);
      toast.error("Error al actualizar el estado del ticket.");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handlePriorityChange = async (priority) => {
    if (!activeTicket || !priority) return;
    try {
      setUpdatingPriority(true);
      const res = await updateTicketPriorityAdminAPI(activeTicket.id, priority);
      if (res.data && res.data.success) {
        toast.success(`Prioridad: ${PRIORIDADES[priority]?.label || priority}`);
        setActiveTicket((prev) => ({ ...prev, priority }));
        setTicketDetails((prev) => (prev ? { ...prev, ticket: { ...prev.ticket, priority } } : prev));
        setTickets((prev) => prev.map((t) => (t.id === activeTicket.id ? { ...t, priority } : t)));
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.error || "Error al cambiar la prioridad.");
    } finally {
      setUpdatingPriority(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleString("es-VE", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Búsqueda en cliente (asunto, id, nombre, correo, tienda) y orden.
  const filteredTickets = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    const lista = !q
      ? tickets
      : tickets.filter((t) => {
          return (
            t.subject?.toLowerCase().includes(q) ||
            t.id?.toLowerCase().includes(q) ||
            t.users?.full_name?.toLowerCase().includes(q) ||
            t.users?.email?.toLowerCase().includes(q) ||
            t.guest_name?.toLowerCase().includes(q) ||
            t.store?.business_name?.toLowerCase().includes(q) ||
            t.store?.store_code?.toLowerCase().includes(q)
          );
        });
    if (sortBy !== "priority") return lista;
    return [...lista].sort((a, b) => {
      const pa = PESO_PRIORIDAD[a.priority] ?? 2;
      const pb = PESO_PRIORIDAD[b.priority] ?? 2;
      if (pa !== pb) return pa - pb;
      return new Date(b.updated_at) - new Date(a.updated_at);
    });
  }, [tickets, searchTerm, sortBy]);

  const abrirOtroTicket = (t) => {
    const enLista = tickets.find((x) => x.id === t.id);
    handleSelectTicket(enLista || t);
  };

  const ticketActual = ticketDetails?.ticket;
  const subtipoActual = ticketActual ? etiquetaSubtipo(ticketActual.category, ticketActual.context?.subtype) : null;

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl p-6 md:p-8 text-white"
        style={{ background: 'linear-gradient(135deg, #1a0a2e 0%, #531575 50%, #6b1e96 100%)' }}>
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10 pointer-events-none" style={{ background: 'radial-gradient(circle, #c3ff00 0%, transparent 70%)', transform: 'translate(30%, -30%)' }} />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-[#c3ff00] text-[20px] animate-pulse">support_agent</span>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#c3ff00]/85">Atención al Cliente</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold">Tickets de Soporte</h1>
          <p className="text-white/60 text-xs md:text-sm mt-1 max-w-xl">
            Atiende consultas técnicas, problemas con pedidos y aclara dudas de compradores y tiendas.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Tickets Sidebar */}
        <div className={`lg:col-span-1 space-y-4 bg-white rounded-2xl p-4 border border-slate-100 shadow-sm ${activeTicket ? "hidden lg:block" : ""}`}>
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Listado de Tickets</h2>
            <span className="text-[10px] text-slate-400">{filteredTickets.length}</span>
          </div>

          {/* Search bar */}
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span>
            <input
              type="text"
              placeholder="Buscar por cliente, tienda, asunto, ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl text-xs outline-none bg-slate-50 border border-slate-100 focus:border-[#6b1e96] focus:bg-white transition-all duration-200"
            />
          </div>

          {/* Filters Grid */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[9px] font-semibold text-slate-400 uppercase mb-1">Estado</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-2 py-2 rounded-lg text-xs bg-slate-50 border border-slate-100 outline-none focus:border-[#6b1e96]"
              >
                <option value="">Todos</option>
                {Object.entries(STATUSES).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[9px] font-semibold text-slate-400 uppercase mb-1">Categoría</label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full px-2 py-2 rounded-lg text-xs bg-slate-50 border border-slate-100 outline-none focus:border-[#6b1e96]"
              >
                <option value="">Todas</option>
                {Object.entries(CATEGORIAS).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[9px] font-semibold text-slate-400 uppercase mb-1">Prioridad</label>
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="w-full px-2 py-2 rounded-lg text-xs bg-slate-50 border border-slate-100 outline-none focus:border-[#6b1e96]"
              >
                <option value="">Todas</option>
                {Object.entries(PRIORIDADES).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[9px] font-semibold text-slate-400 uppercase mb-1">Autor</label>
              <select
                value={filterAuthor}
                onChange={(e) => setFilterAuthor(e.target.value)}
                className="w-full px-2 py-2 rounded-lg text-xs bg-slate-50 border border-slate-100 outline-none focus:border-[#6b1e96]"
              >
                <option value="">Todos</option>
                <option value="store">Tiendas</option>
                <option value="buyer">Compradores</option>
              </select>
            </div>
          </div>
          <div className="flex items-center justify-end gap-1 text-[10px] text-slate-400">
            <span>Ordenar por</span>
            <button
              type="button"
              onClick={() => setSortBy("activity")}
              className={`px-2 py-0.5 rounded-md font-bold cursor-pointer ${sortBy === "activity" ? "bg-[#6b1e96] text-white" : "hover:bg-slate-100"}`}
            >
              actividad
            </button>
            <button
              type="button"
              onClick={() => setSortBy("priority")}
              className={`px-2 py-0.5 rounded-md font-bold cursor-pointer ${sortBy === "priority" ? "bg-[#6b1e96] text-white" : "hover:bg-slate-100"}`}
            >
              prioridad
            </button>
          </div>

          {/* Tickets List */}
          <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1 admin-scrollbar" style={{ scrollbarWidth: 'thin' }}>
            {loading ? (
              <div className="space-y-3 pt-2">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="h-24 rounded-xl bg-slate-50 border border-slate-100 p-3 animate-pulse">
                    <div className="h-3 w-1/3 bg-slate-200 rounded mb-2" />
                    <div className="h-4 w-3/4 bg-slate-200 rounded mb-2" />
                    <div className="h-3 w-1/2 bg-slate-200 rounded" />
                  </div>
                ))}
              </div>
            ) : filteredTickets.length === 0 ? (
              <div className="p-8 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                <span className="material-symbols-outlined text-[32px] text-slate-300 mb-1">sentiment_dissatisfied</span>
                <p className="text-xs font-semibold text-slate-500">Ningún ticket coincide</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Prueba cambiando los filtros de búsqueda.</p>
              </div>
            ) : (
              filteredTickets.map((t) => {
                const status = STATUSES[t.status] || { label: t.status, color: "#9ca3af", bg: "#f3f4f6" };
                const isActive = activeTicket?.id === t.id;
                const senderName = t.users?.full_name || t.guest_name || "Invitado";
                const sub = etiquetaSubtipo(t.category, t.context?.subtype);

                return (
                  <button
                    key={t.id}
                    onClick={() => handleSelectTicket(t)}
                    className="w-full text-left rounded-xl p-3 border transition-all duration-200 flex flex-col justify-between hover:border-[#6b1e96]/30 hover:bg-slate-50 cursor-pointer"
                    style={{
                      background: isActive ? "#fdfaff" : "#ffffff",
                      borderColor: isActive ? "#6b1e96" : t.priority === "urgent" ? "rgba(220,38,38,0.35)" : "rgba(0,0,0,0.06)",
                    }}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1 gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] font-mono text-slate-400">
                            {corto(t.id)}
                          </span>
                          {t.admin_has_unread && (
                            <span
                              className="w-2 h-2 rounded-full bg-red-500 animate-pulse"
                              title="Sin leer / Pendiente"
                            />
                          )}
                          <PriorityBadge priority={t.priority} small />
                        </div>
                        <div className="flex items-center gap-1.5">
                          {t.attachments_count > 0 && (
                            <span className="flex items-center text-[9px] text-slate-400" title={`${t.attachments_count} adjunto(s)`}>
                              <span className="material-symbols-outlined text-[12px]">attach_file</span>
                              {t.attachments_count}
                            </span>
                          )}
                          {t.admin_has_unread && (
                            <span className="text-[8px] font-extrabold text-red-600 bg-red-50 px-1.5 py-0.5 rounded animate-bounce">
                              NUEVO
                            </span>
                          )}
                          <span
                            className="text-[8px] font-extrabold uppercase px-2 py-0.5 rounded-full"
                            style={{ background: status.bg, color: status.color }}
                          >
                            {status.label}
                          </span>
                        </div>
                      </div>
                      <h3 className="font-extrabold text-xs text-slate-800 leading-tight line-clamp-1 mb-1">
                        {t.subject}
                      </h3>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-1">
                        <span className="font-bold truncate">{senderName}</span>
                        {!t.user_id ? (
                          <span className="px-1.5 py-0.2 text-[8px] font-black uppercase rounded bg-slate-100 text-slate-600">Invitado</span>
                        ) : (t.author_role || t.users?.role) === "store" ? (
                          <span className="px-1.5 py-0.2 text-[8px] font-black uppercase rounded bg-purple-100 text-purple-700 truncate max-w-[140px]" title={t.store?.business_name || "Tienda"}>
                            Tienda{t.store?.business_name ? ` · ${t.store.business_name}` : ""}
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.2 text-[8px] font-black uppercase rounded bg-green-100 text-green-700">
                            {ROLE_LABELS[t.author_role || t.users?.role] || "Comprador"}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="mt-3 pt-1.5 border-t border-slate-100 flex items-center justify-between w-full text-[9px] text-slate-400">
                      <span className="truncate">
                        {etiquetaCategoria(t.category)}
                        {sub ? ` · ${sub}` : ""}
                      </span>
                      <span className="shrink-0">{formatDate(t.updated_at)}</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Ticket Conversation Panel */}
        <div className="lg:col-span-2">
          {activeTicket ? (
            /* --- DETAILED VIEW --- */
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col h-[640px] overflow-hidden">
              {/* Detailed Header */}
              <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    onClick={() => {
                      setActiveTicket(null);
                      setTicketDetails(null);
                      setContexto(null);
                    }}
                    className="lg:hidden w-8 h-8 rounded-full flex items-center justify-center bg-slate-100 text-slate-500 hover:text-slate-700 shrink-0"
                  >
                    <span className="material-symbols-outlined text-[20px]">arrow_back</span>
                  </button>
                  <div className="min-w-0">
                    <h3 className="font-extrabold text-slate-900 text-sm md:text-base leading-tight truncate">
                      {activeTicket.subject}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-500">
                      <span>ID: <span className="font-mono font-bold">{corto(activeTicket.id)}</span></span>
                      <span>•</span>
                      <span>
                        <span className="font-bold">{etiquetaCategoria(activeTicket.category)}</span>
                        {subtipoActual ? <span className="text-slate-400"> · {subtipoActual}</span> : null}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Prioridad y estado */}
                <div className="flex items-center gap-2 shrink-0">
                  <select
                    value={activeTicket.priority || "normal"}
                    onChange={(e) => handlePriorityChange(e.target.value)}
                    disabled={updatingPriority}
                    title="Prioridad"
                    className="px-2.5 py-1.5 rounded-xl text-xs font-bold border outline-none disabled:opacity-50 cursor-pointer"
                    style={{
                      background: (PRIORIDADES[activeTicket.priority] || PRIORIDADES.normal).bg,
                      color: (PRIORIDADES[activeTicket.priority] || PRIORIDADES.normal).color,
                      borderColor: "transparent",
                    }}
                  >
                    {Object.entries(PRIORIDADES).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                  <select
                    value={activeTicket.status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    disabled={updatingStatus}
                    title="Estado"
                    className="px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-200 bg-white outline-none focus:border-[#6b1e96] disabled:opacity-50 cursor-pointer"
                  >
                    {Object.entries(STATUSES).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Sender Metadata Strip */}
              <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/20 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap min-w-0">
                  <span className="font-bold text-slate-400 uppercase text-[9px]">Remitente:</span>
                  <span className="font-extrabold text-slate-700">
                    {ticketActual?.users?.full_name || ticketActual?.guest_name || "Invitado"}
                  </span>
                  <span className="text-slate-300">|</span>
                  <span className="text-slate-500 truncate">
                    {ticketActual?.users?.email || ticketActual?.guest_email || "-"}
                  </span>
                  {ticketActual && !ticketActual.user_id && (
                    <span className="px-1.5 py-0.2 text-[8px] font-black uppercase rounded bg-[#dbeafe] text-[#2563eb]">Visitante Invitado</span>
                  )}
                  {ticketActual?.user_id && (
                    <span className="px-1.5 py-0.2 text-[8px] font-black uppercase rounded bg-slate-100 text-slate-600">
                      {ROLE_LABELS[ticketActual.author_role || ticketActual.users?.role] || ticketActual.author_role || "Usuario"}
                    </span>
                  )}
                  {ticketActual?.store && (
                    <Link
                      to={enlaceTienda(ticketActual.store)}
                      title="Abrir en Tiendas"
                      className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 font-bold text-[10px] flex items-center gap-1 hover:bg-purple-100"
                    >
                      <span className="material-symbols-outlined text-[13px]">storefront</span>
                      {ticketActual.store.business_name}
                      {ticketActual.store.store_code ? <span className="opacity-60">#{ticketActual.store.store_code}</span> : null}
                      {ticketActual.store.is_suspended ? <span className="text-red-600">· suspendida</span> : null}
                      {ticketActual.store.is_test ? <span className="text-amber-600">· prueba</span> : null}
                    </Link>
                  )}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {ticketActual?.order_id && (
                    <Link
                      to={`/admin/orders/${ticketActual.order_id}`}
                      className="text-[#6b1e96] hover:underline font-bold flex items-center gap-1 text-[11px]"
                    >
                      <span className="material-symbols-outlined text-[14px]">shopping_bag</span>
                      Pedido
                      <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={() => setMostrarFicha((v) => !v)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer border transition-colors ${
                      mostrarFicha ? "bg-[#6b1e96] text-white border-[#6b1e96]" : "bg-white text-slate-600 border-slate-200 hover:border-[#6b1e96]/40"
                    }`}
                    title="Ficha del autor: tienda, pedidos, otros tickets"
                  >
                    <span className="material-symbols-outlined text-[14px]">badge</span>
                    Ficha
                  </button>
                </div>
              </div>

              {/* Ficha del autor (N5) */}
              {mostrarFicha && <FichaAutor ctx={contexto} loading={loadingContexto && !contexto} onOpenTicket={abrirOtroTicket} />}

              {/* Chat Thread */}
              <div ref={chatContainerRef} className="flex-1 p-5 overflow-y-auto space-y-4 bg-[#fbfbfe] admin-scrollbar">
                {loadingDetails ? (
                  <div className="flex flex-col items-center justify-center h-full">
                    <div className="w-8 h-8 border-3 border-slate-200 border-t-[#6b1e96] rounded-full animate-spin mb-2" />
                    <p className="text-xs text-slate-400">Cargando conversación...</p>
                  </div>
                ) : ticketDetails ? (
                  <>
                    <TicketContext ticket={ticketDetails.ticket} adminView />

                    {ticketDetails.messages.map((m) => {
                      const isClient = !["admin", "owner"].includes(m.sender_role);

                      return (
                        <div
                          key={m.id}
                          className={`flex flex-col max-w-[85%] ${!isClient ? "ml-auto items-end" : "mr-auto items-start"}`}
                        >
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mb-1">
                            <span className="font-bold">
                              {isClient ? m.sender_name : `${m.sender_name} (Soporte)`}
                            </span>
                            {!isClient && (
                              <span className="px-1 py-0.2 text-[7px] font-black uppercase rounded bg-[#6b1e96] text-white">Admin</span>
                            )}
                          </div>
                          <div
                            className={`rounded-2xl p-3 text-xs md:text-sm leading-relaxed ${
                              !isClient
                                ? "bg-[#6b1e96] text-white rounded-tr-none shadow-sm shadow-[#6b1e96]/10"
                                : "bg-white text-slate-800 rounded-tl-none border border-slate-100 shadow-3xs"
                            }`}
                          >
                            {m.message ? <p className="whitespace-pre-line">{m.message}</p> : null}
                            <AttachmentList items={m.attachments} onDark={!isClient} />
                          </div>
                          <span className="text-[9px] text-slate-400 mt-1">
                            {formatDate(m.created_at)}
                          </span>
                        </div>
                      );
                    })}
                  </>
                ) : null}
              </div>

              {/* Chat Input */}
              {activeTicket.status !== "closed" ? (
                <form onSubmit={handleSendReply} className="p-4 border-t border-slate-100 bg-white">
                  <div className="flex gap-3 items-end">
                    <AttachmentPicker files={replyFiles} onChange={setReplyFiles} disabled={replying} compact />
                    <textarea
                      rows="2"
                      placeholder="Escribe tu respuesta técnica aquí..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendReply(e);
                        }
                      }}
                      className="flex-1 px-4 py-2.5 rounded-xl text-xs md:text-sm border border-slate-200 outline-none focus:border-[#6b1e96] bg-slate-50 focus:bg-white transition-all resize-none"
                    />
                    <button
                      type="submit"
                      disabled={replying || (!replyText.trim() && replyFiles.length === 0)}
                      className="px-5 py-3 rounded-xl text-white font-bold text-xs md:text-sm flex items-center gap-1.5 shadow-sm active:scale-98 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                      style={{ background: "#6b1e96" }}
                    >
                      <span>{replying ? "Enviando..." : "Responder"}</span>
                      <span className="material-symbols-outlined text-[16px]">send</span>
                    </button>
                  </div>
                  <p className="text-[9px] text-slate-400 mt-2 italic">Presiona Enter para enviar la respuesta. Shift + Enter para saltos de línea.</p>
                </form>
              ) : (
                <div className="p-4 border-t border-slate-100 bg-slate-100 text-center text-xs text-slate-500 font-bold">
                  🔐 Este ticket está cerrado. Cambia el estado en la parte superior si requieres reabrir la conversación.
                </div>
              )}
            </div>
          ) : (
            /* --- PLACEHOLDER VIEW --- */
            <div className="hidden lg:flex flex-col items-center justify-center bg-white border border-slate-100 rounded-2xl h-[640px] p-8 text-center shadow-xs">
              <div className="w-16 h-16 rounded-full bg-purple-50 flex items-center justify-center text-purple-400 mb-4 animate-bounce">
                <span className="material-symbols-outlined text-[32px]">question_answer</span>
              </div>
              <h3 className="text-base font-bold text-slate-800">Visualizar Tickets de Soporte</h3>
              <p className="text-xs text-slate-400 mt-1.5 max-w-xs mx-auto">
                Selecciona uno de los tickets de la columna izquierda para ver la conversación detallada y atender al cliente.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
