import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  getMyTicketsAPI,
  createTicketAPI,
  getTicketDetailsAPI,
  addTicketMessageAPI,
  getMyOrders,
  getMyProducts,
} from "../../services/api";
import toast from "react-hot-toast";
import { socket } from "../../lib/socket";
import { useAuth } from "../../context/AuthContext";
import { AttachmentPicker, AttachmentList } from "../../components/support/TicketAttachments";
import TicketContext from "../../components/support/TicketContext";
import { subirAdjuntos } from "../../lib/ticketAttachments";
import {
  CATEGORIAS,
  categoriasPara,
  etiquetaCategoria,
  etiquetaSubtipo,
  ESTADOS_TICKET as STATUSES,
  ESTADO_PAGO,
} from "../../lib/supportCategorias";

const infoDelDispositivo = () => ({
  ua: navigator.userAgent,
  screen: `${window.screen?.width || 0}x${window.screen?.height || 0}`,
  viewport: `${window.innerWidth}x${window.innerHeight}`,
  path: window.location.pathname,
  lang: navigator.language,
  tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
});

const corto = (id) => (id ? String(id).substring(0, 8).toUpperCase() : "");
const INPUT =
  "w-full pl-4 pr-4 py-3 rounded-xl text-sm font-medium outline-none transition-all duration-200 focus:ring-2 focus:ring-[#6b1e96]/30 bg-slate-50 border border-slate-100 focus:border-[#6b1e96]";
const LABEL = "block text-[11px] font-semibold uppercase tracking-wider mb-2";

// Pedidos del autor normalizados para el selector: el comprador ve sus pedidos; la tienda ve los
// pedidos en los que vendió algo (la API devuelve sus artículos, aquí se agrupan por pedido).
const normalizarPedidos = (rows, esTienda) => {
  if (!Array.isArray(rows)) return [];
  if (!esTienda) {
    return rows.map((o) => ({
      id: o.id,
      code: corto(o.order_group_id || o.id),
      total: Number(o.total_usd ?? o.total ?? 0),
      date: o.created_at,
      payment_status: o.payment_status,
      products: (o.order_items || []).map((i) => i.products).filter(Boolean),
    }));
  }
  const porPedido = new Map();
  for (const item of rows) {
    const o = item.orders;
    if (!o?.id) continue;
    if (!porPedido.has(o.id)) {
      porPedido.set(o.id, {
        id: o.id,
        code: corto(o.order_group_id || o.id),
        total: 0,
        date: o.created_at,
        payment_status: o.payment_status,
        products: [],
      });
    }
    const p = porPedido.get(o.id);
    p.total += Number(item.unit_price || 0) * Number(item.quantity || 1);
    if (item.products) p.products.push(item.products);
  }
  return [...porPedido.values()].sort((a, b) => new Date(b.date) - new Date(a.date));
};

export default function Support() {
  const { user } = useAuth();
  const esTienda = user?.role === "store";
  const [tickets, setTickets] = useState([]);
  const [orders, setOrders] = useState([]);
  const [storeProducts, setStoreProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTicket, setActiveTicket] = useState(null);
  const [ticketDetails, setTicketDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [replying, setReplying] = useState(false);

  // Formulario (N3)
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("other");
  const [subtype, setSubtype] = useState("");
  const [message, setMessage] = useState(""); // «¿Qué pasó?»
  const [expected, setExpected] = useState(""); // «¿Qué esperabas que pasara?»
  const [steps, setSteps] = useState("");
  const [orderId, setOrderId] = useState("");
  const [orderSearch, setOrderSearch] = useState("");
  const [productId, setProductId] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [files, setFiles] = useState([]);
  const [replyFiles, setReplyFiles] = useState([]);

  const chatContainerRef = useRef(null);
  const lastTicketIdRef = useRef(null);
  const lastMessagesLengthRef = useRef(0);

  const categoriasVisibles = useMemo(() => categoriasPara(user?.role), [user?.role]);
  const subtipos = CATEGORIAS[category]?.subtipos || {};
  const tieneSubtipos = Object.keys(subtipos).length > 0;

  const handleSelectTicket = useCallback(async (ticket) => {
    setActiveTicket(ticket);
    setShowCreateForm(false);
    setTickets((prev) =>
      prev.map((t) => (t.id === ticket.id ? { ...t, user_has_unread: false } : t))
    );
    try {
      setLoadingDetails(true);
      const res = await getTicketDetailsAPI(ticket.id);
      if (res.data && res.data.success) {
        setTicketDetails(res.data.data);
      }
    } catch (error) {
      console.error(error);
      toast.error("Error al cargar la conversación.");
    } finally {
      setLoadingDetails(false);
    }
  }, []);

  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getMyTicketsAPI();
      if (res.data && res.data.success) {
        const ticketList = res.data.data || [];
        setTickets(ticketList);

        // Auto-select ticket from URL if ticketId is present
        const params = new URLSearchParams(window.location.search);
        const ticketIdFromUrl = params.get("ticketId");
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
  }, [handleSelectTicket]);

  // Pedidos y (si es tienda) productos, para vincularlos al ticket. Se cargan una vez.
  const fetchRelacionables = useCallback(async () => {
    try {
      const res = await getMyOrders(esTienda ? { params: { as_store: "true" } } : {});
      if (res.data && res.data.success) setOrders(normalizarPedidos(res.data.data || [], esTienda));
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
    if (esTienda) {
      try {
        const res = await getMyProducts();
        if (res.data && res.data.success) {
          setStoreProducts((res.data.data || []).map((p) => ({ id: p.id, name: p.name, is_active: p.is_active })));
        }
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    }
  }, [esTienda]);

  useEffect(() => {
    fetchTickets();
    fetchRelacionables();
  }, [fetchTickets, fetchRelacionables]);

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
      setActiveTicket((prev) => {
        if (!prev) return prev;
        return { ...prev, status: updatedTicket.status, user_has_unread: false };
      });
      setTicketDetails((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          ticket: { ...prev.ticket, status: updatedTicket.status, user_has_unread: false },
        };
      });
      setTickets((prevList) =>
        prevList.map((t) => (t.id === activeTicket.id ? { ...t, status: updatedTicket.status, user_has_unread: false } : t))
      );
    };

    socket.on("support_message", handleNewMessage);
    socket.on("ticket_updated", handleTicketUpdated);

    return () => {
      socket.emit("leave_ticket", activeTicket.id);
      socket.off("support_message", handleNewMessage);
      socket.off("ticket_updated", handleTicketUpdated);
    };
  }, [activeTicket]);

  useEffect(() => {
    if (!user) return;

    const handleTicketCreated = (newTicket) => {
      setTickets((prev) => {
        if (prev.some((t) => t.id === newTicket.id)) return prev;
        return [newTicket, ...prev];
      });
    };

    const handleTicketUpdatedList = (updatedTicket) => {
      setTickets((prev) =>
        prev.map((t) => (t.id === updatedTicket.id ? { ...t, ...updatedTicket } : t))
      );
    };

    socket.on("ticket_created", handleTicketCreated);
    socket.on("ticket_updated", handleTicketUpdatedList);

    return () => {
      socket.off("ticket_created", handleTicketCreated);
      socket.off("ticket_updated", handleTicketUpdatedList);
    };
  }, [user]);

  // Cambiar de categoría limpia el subtipo (cada categoría tiene los suyos).
  const cambiarCategoria = (value) => {
    setCategory(value);
    setSubtype("");
  };

  // Productos vinculables: la tienda elige entre los suyos; el comprador entre los del pedido
  // elegido (o de todos sus pedidos si no eligió ninguno).
  const productosVinculables = useMemo(() => {
    if (esTienda) return storeProducts;
    const fuente = orderId ? orders.filter((o) => o.id === orderId) : orders;
    const vistos = new Map();
    for (const o of fuente) for (const p of o.products) if (p?.id && !vistos.has(p.id)) vistos.set(p.id, { id: p.id, name: p.name });
    return [...vistos.values()];
  }, [esTienda, storeProducts, orders, orderId]);

  const pedidosFiltrados = useMemo(() => {
    const q = orderSearch.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter(
      (o) =>
        o.code.toLowerCase().includes(q) ||
        o.products.some((p) => p?.name?.toLowerCase().includes(q)) ||
        String(o.total.toFixed(2)).includes(q),
    );
  }, [orders, orderSearch]);

  const productosFiltrados = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    if (!q) return productosVinculables;
    return productosVinculables.filter((p) => p.name?.toLowerCase().includes(q));
  }, [productosVinculables, productSearch]);

  const limpiarFormulario = () => {
    setSubject("");
    setCategory("other");
    setSubtype("");
    setMessage("");
    setExpected("");
    setSteps("");
    setOrderId("");
    setOrderSearch("");
    setProductId("");
    setProductSearch("");
    setFiles([]);
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    if (!subject.trim()) return toast.error("El asunto es requerido.");
    if (!message.trim()) return toast.error("Cuéntanos qué pasó.");
    if (tieneSubtipos && !subtype) return toast.error("Elige el tipo de problema.");

    try {
      setSubmitting(true);
      const attachments = files.length ? await subirAdjuntos(files) : [];
      const context = {};
      if (subtype) context.subtype = subtype;
      if (expected.trim()) context.expected = expected.trim();
      if (steps.trim()) context.steps = steps.trim();
      const payload = {
        subject: subject.trim(),
        category,
        message: message.trim(),
        order_id: orderId || null,
        product_id: productId || null,
        attachments,
        context: Object.keys(context).length ? context : null,
        device_info: infoDelDispositivo(),
      };

      const res = await createTicketAPI(payload);
      if (res.data && res.data.success) {
        toast.success("Ticket de soporte creado correctamente.");
        limpiarFormulario();
        setShowCreateForm(false);
        fetchTickets();
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.error || error.message || "Error al crear el ticket.");
    } finally {
      setSubmitting(false);
    }
  };

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
        }
        fetchTickets();
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.error || "Error al enviar el mensaje.");
    } finally {
      setReplying(false);
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

  const formatFecha = (dateStr) =>
    dateStr ? new Date(dateStr).toLocaleDateString("es-VE", { day: "2-digit", month: "short", year: "2-digit" }) : "";

  return (
    <div className="space-y-8 animate-fade-in pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "#191c23" }}>
            Soporte Técnico
          </h1>
          <p className="text-sm mt-1" style={{ color: "#727785" }}>
            Crea y haz seguimiento a tus solicitudes de soporte con nuestro equipo.
          </p>
        </div>
        <div>
          {!showCreateForm && !activeTicket && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold text-white transition-all shadow-sm hover:shadow-md cursor-pointer"
              style={{ background: "#6b1e96" }}
            >
              <span className="material-symbols-outlined text-[18px]">add_comment</span>
              Nuevo Ticket
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column: Tickets List */}
        <div className={`lg:col-span-1 space-y-4 ${activeTicket || showCreateForm ? "hidden lg:block" : ""}`}>
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-400 mb-2">Mis Solicitudes</h2>

          {loading ? (
            <div className="space-y-4">
              {[1, 2].map((n) => (
                <div key={n} className="h-24 rounded-2xl bg-white border border-slate-100 p-4 animate-pulse">
                  <div className="h-4 w-3/4 bg-slate-200 rounded mb-2" />
                  <div className="h-3 w-1/2 bg-slate-200 rounded" />
                </div>
              ))}
            </div>
          ) : tickets.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 border border-slate-100 text-center">
              <span className="material-symbols-outlined text-[36px] text-purple-200 mb-2">forum</span>
              <p className="text-sm font-bold text-slate-700">No tienes tickets de soporte</p>
              <p className="text-xs text-slate-400 mt-1">Si tienes algún problema con un pedido o producto, abre un ticket.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tickets.map((t) => {
                const status = STATUSES[t.status] || { label: t.status, color: "#9ca3af", bg: "#f3f4f6" };
                const isActive = activeTicket?.id === t.id;
                const sub = etiquetaSubtipo(t.category, t.context?.subtype);

                return (
                  <button
                    key={t.id}
                    onClick={() => handleSelectTicket(t)}
                    className="w-full text-left rounded-2xl p-4 border transition-all duration-200 flex flex-col justify-between hover:border-[#6b1e96]/40 hover:bg-slate-50 cursor-pointer"
                    style={{
                      background: isActive ? "#fdfaff" : "#ffffff",
                      borderColor: isActive ? "#6b1e96" : "rgba(0,0,0,0.06)",
                      boxShadow: isActive ? "0 4px 12px rgba(107,30,150,0.04)" : "none",
                    }}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5 gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-mono text-slate-400">
                            #{corto(t.id)}
                          </span>
                          {t.user_has_unread && (
                            <span
                              className="w-2 h-2 rounded-full bg-green-500 animate-pulse"
                              title="Respuesta nueva"
                            />
                          )}
                        </div>
                        <div className="flex items-center gap-1.5">
                          {t.user_has_unread && (
                            <span className="text-[9px] font-extrabold text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
                              NUEVA RESPUESTA
                            </span>
                          )}
                          <span
                            className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full"
                            style={{ background: status.bg, color: status.color }}
                          >
                            {status.label}
                          </span>
                        </div>
                      </div>
                      <h3 className="font-extrabold text-sm text-slate-900 leading-tight line-clamp-1">
                        {t.subject}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">
                        {etiquetaCategoria(t.category)}
                        {sub ? <span className="text-slate-300"> · {sub}</span> : null}
                      </p>
                    </div>
                    <div className="mt-4 pt-2 border-t border-slate-100 flex items-center justify-between w-full">
                      <span className="text-[10px] text-slate-400">
                        {formatDate(t.updated_at)}
                      </span>
                      <span className="material-symbols-outlined text-[16px] text-slate-300">
                        chevron_right
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Ticket Details or Create Form */}
        <div className="lg:col-span-2">
          {showCreateForm ? (
            /* --- CREATE TICKET FORM (N3) --- */
            <div className="bg-white rounded-2xl p-6 md:p-8 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                <h2 className="text-lg font-bold text-slate-900">Crear Ticket de Soporte</h2>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="text-xs font-bold hover:underline cursor-pointer"
                  style={{ color: "#6b1e96" }}
                >
                  Volver a mis solicitudes
                </button>
              </div>

              <form onSubmit={handleCreateTicket} className="space-y-5">
                {/* Categoría (tarjetas) */}
                <div>
                  <label className={LABEL} style={{ color: "#727785" }}>
                    ¿Sobre qué es tu solicitud? *
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {categoriasVisibles.map(([k, c]) => {
                      const activa = category === k;
                      return (
                        <button
                          type="button"
                          key={k}
                          onClick={() => cambiarCategoria(k)}
                          className="rounded-xl border p-3 text-left transition-all cursor-pointer hover:border-[#6b1e96]/40"
                          style={{
                            background: activa ? "#fdfaff" : "#f8fafc",
                            borderColor: activa ? "#6b1e96" : "rgba(0,0,0,0.06)",
                          }}
                          title={c.hint}
                        >
                          <span
                            className="material-symbols-outlined text-[20px] block mb-1"
                            style={{ color: activa ? "#6b1e96" : "#94a3b8" }}
                          >
                            {c.icon}
                          </span>
                          <span className="text-[11px] font-bold leading-tight block" style={{ color: activa ? "#6b1e96" : "#334155" }}>
                            {c.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  {CATEGORIAS[category]?.hint && (
                    <p className="text-[11px] text-slate-400 mt-2">{CATEGORIAS[category].hint}</p>
                  )}
                </div>

                {/* Subtipo */}
                {tieneSubtipos && (
                  <div>
                    <label className={LABEL} style={{ color: "#727785" }}>
                      ¿Qué tipo de problema? *
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(subtipos).map(([k, v]) => {
                        const activo = subtype === k;
                        return (
                          <button
                            type="button"
                            key={k}
                            onClick={() => setSubtype(k)}
                            className="px-3 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer"
                            style={{
                              background: activo ? "#6b1e96" : "#ffffff",
                              color: activo ? "#ffffff" : "#475569",
                              borderColor: activo ? "#6b1e96" : "rgba(0,0,0,0.1)",
                            }}
                          >
                            {v}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Asunto */}
                <div>
                  <label className={LABEL} style={{ color: "#727785" }}>
                    Asunto Breve *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={200}
                    placeholder="Ej: Retraso en entrega, duda sobre un pago..."
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className={INPUT}
                  />
                </div>

                {/* Pedido y producto relacionados */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={LABEL} style={{ color: "#727785" }}>
                      Pedido relacionado (opcional)
                    </label>
                    {orders.length === 0 ? (
                      <p className="text-xs text-slate-400 py-3">
                        {esTienda ? "Aún no tienes pedidos recibidos." : "Aún no tienes pedidos."}
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {orders.length > 5 && (
                          <input
                            type="text"
                            placeholder="Buscar por número, producto o monto…"
                            value={orderSearch}
                            onChange={(e) => setOrderSearch(e.target.value)}
                            className={`${INPUT} py-2 text-xs`}
                          />
                        )}
                        <select
                          value={orderId}
                          onChange={(e) => {
                            setOrderId(e.target.value);
                            setProductId("");
                          }}
                          className={INPUT}
                        >
                          <option value="">Ninguno</option>
                          {pedidosFiltrados.map((o) => (
                            <option key={o.id} value={o.id}>
                              #{o.code} · {formatFecha(o.date)} · ${o.total.toFixed(2)}
                              {o.payment_status && ESTADO_PAGO[o.payment_status] ? ` · ${ESTADO_PAGO[o.payment_status]}` : ""}
                            </option>
                          ))}
                        </select>
                        {orderId && (
                          <p className="text-[10px] text-slate-400 truncate">
                            {orders
                              .find((o) => o.id === orderId)
                              ?.products.map((p) => p?.name)
                              .filter(Boolean)
                              .join(", ")}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className={LABEL} style={{ color: "#727785" }}>
                      Producto relacionado (opcional)
                    </label>
                    {productosVinculables.length === 0 ? (
                      <p className="text-xs text-slate-400 py-3">
                        {esTienda ? "Aún no tienes productos publicados." : "Elige un pedido para ver sus productos."}
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {productosVinculables.length > 5 && (
                          <input
                            type="text"
                            placeholder="Buscar producto por nombre…"
                            value={productSearch}
                            onChange={(e) => setProductSearch(e.target.value)}
                            className={`${INPUT} py-2 text-xs`}
                          />
                        )}
                        <select value={productId} onChange={(e) => setProductId(e.target.value)} className={INPUT}>
                          <option value="">Ninguno</option>
                          {productosFiltrados.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                              {p.is_active === false ? " (inactivo)" : ""}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </div>

                {/* ¿Qué pasó? */}
                <div>
                  <label className={LABEL} style={{ color: "#727785" }}>
                    ¿Qué pasó? *
                  </label>
                  <textarea
                    required
                    rows="4"
                    placeholder="Cuéntanos con detalle lo que ocurrió: qué hiciste, qué viste en pantalla, fechas, montos…"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className={`${INPUT} resize-none`}
                  />
                </div>

                {/* ¿Qué esperabas? */}
                <div>
                  <label className={LABEL} style={{ color: "#727785" }}>
                    ¿Qué esperabas que pasara? (opcional)
                  </label>
                  <textarea
                    rows="2"
                    maxLength={1000}
                    placeholder="Ej: que el pago se aprobara y el pedido pasara a «en preparación»."
                    value={expected}
                    onChange={(e) => setExpected(e.target.value)}
                    className={`${INPUT} resize-none`}
                  />
                </div>

                {/* Pasos para reproducir */}
                <div>
                  <label className={LABEL} style={{ color: "#727785" }}>
                    Pasos para que podamos repetirlo (opcional)
                  </label>
                  <textarea
                    rows="3"
                    maxLength={2000}
                    placeholder={"1. Entré a…\n2. Pulsé…\n3. Apareció…"}
                    value={steps}
                    onChange={(e) => setSteps(e.target.value)}
                    className={`${INPUT} resize-none`}
                  />
                </div>

                {/* Adjuntos */}
                <div>
                  <label className={LABEL} style={{ color: "#727785" }}>
                    Capturas o documentos (opcional)
                  </label>
                  <AttachmentPicker files={files} onChange={setFiles} disabled={submitting} />
                  <p className="text-[10px] text-slate-400 mt-1.5">
                    Una captura de pantalla del problema nos ayuda a resolverlo mucho más rápido. Guardamos también tu
                    navegador y la pantalla desde la que abres el ticket.
                  </p>
                </div>

                <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all shadow-sm hover:shadow-md disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
                    style={{ background: "#6b1e96" }}
                  >
                    {submitting ? "Creando..." : "Crear Solicitud"}
                  </button>
                </div>
              </form>
            </div>
          ) : activeTicket ? (
            /* --- CONVERSATION VIEW --- */
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col h-[600px] overflow-hidden">
              {/* Conversation Header */}
              <div className="p-4 border-b border-gray-100 bg-slate-50/50 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setActiveTicket(null);
                      setTicketDetails(null);
                    }}
                    className="lg:hidden w-8 h-8 rounded-full flex items-center justify-center bg-slate-100 text-slate-500 hover:text-slate-700"
                  >
                    <span className="material-symbols-outlined text-[20px]">arrow_back</span>
                  </button>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-sm md:text-base leading-tight">
                      {activeTicket.subject}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {etiquetaCategoria(activeTicket.category)}
                      {etiquetaSubtipo(activeTicket.category, activeTicket.context?.subtype)
                        ? ` · ${etiquetaSubtipo(activeTicket.category, activeTicket.context?.subtype)}`
                        : ""}
                    </p>
                  </div>
                </div>
                <div>
                  <span
                    className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full shadow-2xs"
                    style={{
                      background: (STATUSES[activeTicket.status] || {}).bg || "#f3f4f6",
                      color: (STATUSES[activeTicket.status] || {}).color || "#4b5563",
                    }}
                  >
                    {(STATUSES[activeTicket.status] || {}).label || activeTicket.status}
                  </span>
                </div>
              </div>

              {/* Chat Messages Pane */}
              <div ref={chatContainerRef} className="flex-1 p-6 overflow-y-auto space-y-4 bg-[#f9f9ff]">
                {loadingDetails ? (
                  <div className="flex flex-col items-center justify-center h-full">
                    <div className="w-8 h-8 border-3 border-slate-200 border-t-[#6b1e96] rounded-full animate-spin mb-2" />
                    <p className="text-xs text-slate-400">Cargando conversación...</p>
                  </div>
                ) : ticketDetails ? (
                  <>
                    {/* Contexto del ticket: subtipo, pedido, producto, qué esperaba, pasos */}
                    <TicketContext ticket={ticketDetails.ticket} />

                    {ticketDetails.messages.map((m) => {
                      const isMe = m.sender_id === ticketDetails.ticket.user_id;
                      const isSupport = ["admin", "owner"].includes(m.sender_role);

                      return (
                        <div
                          key={m.id}
                          className={`flex flex-col max-w-[85%] ${isMe ? "ml-auto items-end" : "mr-auto items-start"}`}
                        >
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mb-1">
                            <span className="font-bold">
                              {isMe ? "Tú" : m.sender_name}
                            </span>
                            {isSupport && (
                              <span className="px-1.5 py-0.2 text-[8px] font-black uppercase rounded bg-[#6b1e96] text-white">
                                Soporte
                              </span>
                            )}
                          </div>
                          <div
                            className={`rounded-2xl p-4 text-xs md:text-sm leading-relaxed ${
                              isMe
                                ? "bg-[#6b1e96] text-white rounded-tr-none shadow-sm shadow-[#6b1e96]/10"
                                : "bg-white text-slate-800 rounded-tl-none border border-slate-100 shadow-3xs"
                            }`}
                          >
                            {m.message ? <p className="whitespace-pre-line">{m.message}</p> : null}
                            <AttachmentList items={m.attachments} onDark={isMe} />
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

              {/* Chat Input Bar */}
              {activeTicket.status !== "closed" ? (
                <form onSubmit={handleSendReply} className="p-4 border-t border-gray-100 bg-white">
                  <div className="flex gap-3 items-end">
                    <AttachmentPicker files={replyFiles} onChange={setReplyFiles} disabled={replying} compact />
                    <textarea
                      rows="2"
                      placeholder="Escribe tu respuesta aquí..."
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
                  <p className="text-[10px] text-slate-400 mt-2 italic">Shift + Enter para salto de línea. Presiona Enter para enviar.</p>
                </form>
              ) : (
                <div className="p-4 border-t border-gray-100 bg-slate-100 text-center text-xs text-slate-500 font-bold">
                  🔐 Este ticket ha sido cerrado definitivamente. No es posible enviar respuestas.
                </div>
              )}
            </div>
          ) : (
            /* --- DEFAULT NO TICKET SELECTED PLACEHOLDER --- */
            <div className="hidden lg:flex flex-col items-center justify-center bg-white border border-slate-100 rounded-2xl h-[600px] p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-purple-50 flex items-center justify-center text-purple-400 mb-4">
                <span className="material-symbols-outlined text-[32px]">question_answer</span>
              </div>
              <h3 className="text-base font-bold text-slate-800">Visualizar Conversaciones</h3>
              <p className="text-xs text-slate-400 mt-1.5 max-w-xs mx-auto">
                Selecciona una de tus solicitudes activas desde la lista izquierda para ver el historial y chatear con nuestro personal técnico.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
