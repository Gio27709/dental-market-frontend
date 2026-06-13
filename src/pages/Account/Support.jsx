import { useState, useEffect, useRef, useCallback } from "react";
import {
  getMyTicketsAPI,
  createTicketAPI,
  getTicketDetailsAPI,
  addTicketMessageAPI,
  getMyOrders,
} from "../../services/api";
import toast from "react-hot-toast";
import { socket } from "../../lib/socket";
import { useAuth } from "../../context/AuthContext";

const CATEGORIES = {
  order_issue: "Problema con un Pedido",
  product_issue: "Problema con un Producto",
  account: "Mi Cuenta",
  payment: "Pagos o Facturación",
  other: "Otro Asunto",
};

const STATUSES = {
  open: { label: "Abierto", color: "#2563eb", bg: "#dbeafe" },
  in_progress: { label: "En Proceso", color: "#d97706", bg: "#fef3c7" },
  resolved: { label: "Resuelto", color: "#16a34a", bg: "#dcfce7" },
  closed: { label: "Cerrado", color: "#4b5563", bg: "#f3f4f6" },
};

export default function Support() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTicket, setActiveTicket] = useState(null);
  const [ticketDetails, setTicketDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [replying, setReplying] = useState(false);

  // Form states
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("other");
  const [message, setMessage] = useState("");
  const [orderId, setOrderId] = useState("");

  const chatContainerRef = useRef(null);
  const lastTicketIdRef = useRef(null);
  const lastMessagesLengthRef = useRef(0);

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

  const fetchUserOrders = useCallback(async () => {
    try {
      const res = await getMyOrders();
      if (res.data && res.data.success) {
        setOrders(res.data.data || []);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  }, []);

  useEffect(() => {
    fetchTickets();
    fetchUserOrders();
  }, [fetchTickets, fetchUserOrders]);

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

    // Join the ticket's room on connection / activeTicket mount
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

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    if (!subject.trim()) return toast.error("El asunto es requerido.");
    if (!message.trim()) return toast.error("El mensaje es requerido.");

    try {
      setSubmitting(true);
      const payload = {
        subject: subject.trim(),
        category,
        message: message.trim(),
        order_id: orderId || null,
      };

      const res = await createTicketAPI(payload);
      if (res.data && res.data.success) {
        toast.success("Ticket de soporte creado correctamente.");
        setSubject("");
        setCategory("other");
        setMessage("");
        setOrderId("");
        setShowCreateForm(false);
        fetchTickets();
      }
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Error al crear el ticket.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !activeTicket) return;

    try {
      setReplying(true);
      const res = await addTicketMessageAPI(activeTicket.id, { message: replyText.trim() });
      if (res.data && res.data.success) {
        setReplyText("");
        // Refresh details
        const detailsRes = await getTicketDetailsAPI(activeTicket.id);
        if (detailsRes.data && detailsRes.data.success) {
          setTicketDetails(detailsRes.data.data);
        }
        // Refresh ticket list to update last update timestamp
        fetchTickets();
      }
    } catch (error) {
      console.error(error);
      toast.error("Error al enviar el mensaje.");
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
                            #{t.id.substring(0, 8).toUpperCase()}
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
                        {CATEGORIES[t.category]}
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
            /* --- CREATE TICKET FORM --- */
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

              <form onSubmit={handleCreateTicket} className="space-y-4">
                {/* Category */}
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: "#727785" }}>
                    Categoría del Problema *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full pl-4 pr-4 py-3 rounded-xl text-sm font-medium outline-none transition-all duration-200 focus:ring-2 focus:ring-[#6b1e96]/30 bg-slate-50 border border-slate-100 focus:border-[#6b1e96]"
                  >
                    {Object.entries(CATEGORIES).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Subject */}
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: "#727785" }}>
                    Asunto Breve *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Retraso en entrega, Duda sobre un pago..."
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full pl-4 pr-4 py-3 rounded-xl text-sm font-medium outline-none transition-all duration-200 focus:ring-2 focus:ring-[#6b1e96]/30 bg-slate-50 border border-slate-100 focus:border-[#6b1e96]"
                  />
                </div>

                {/* Associated Order (Optional) */}
                {category === "order_issue" && orders.length > 0 && (
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: "#727785" }}>
                      Vincular a un Pedido (Opcional)
                    </label>
                    <select
                      value={orderId}
                      onChange={(e) => setOrderId(e.target.value)}
                      className="w-full pl-4 pr-4 py-3 rounded-xl text-sm font-medium outline-none transition-all duration-200 focus:ring-2 focus:ring-[#6b1e96]/30 bg-slate-50 border border-slate-100 focus:border-[#6b1e96]"
                    >
                      <option value="">Ninguno</option>
                      {orders.map((o) => (
                        <option key={o.id} value={o.id}>
                          Pedido #{o.order_group_id?.substring(0, 8).toUpperCase() || o.id.substring(0, 8).toUpperCase()} - ${Number(o.total_amount || 0).toFixed(2)}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Message */}
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: "#727785" }}>
                    Descripción Detallada *
                  </label>
                  <textarea
                    required
                    rows="5"
                    placeholder="Explícanos tu problema o duda con la mayor cantidad de detalles posible..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full pl-4 pr-4 py-3 rounded-xl text-sm font-medium outline-none transition-all duration-200 focus:ring-2 focus:ring-[#6b1e96]/30 bg-slate-50 border border-slate-100 focus:border-[#6b1e96] resize-none"
                  />
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
                      Categoría: {CATEGORIES[activeTicket.category]}
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
                    {/* Associated Order Banner */}
                    {ticketDetails.ticket.order_id && (
                      <div className="p-3 bg-purple-50/50 border border-[#6b1e96]/10 rounded-xl text-xs text-[#6b1e96] font-semibold flex items-center justify-between">
                        <span>Vincular a Pedido #{ticketDetails.ticket.orders?.order_group_id?.substring(0, 8).toUpperCase() || ticketDetails.ticket.order_id.substring(0, 8).toUpperCase()}</span>
                        <a href={`/account/orders/${ticketDetails.ticket.order_id}`} className="hover:underline flex items-center gap-0.5">
                          Ver Pedido <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                        </a>
                      </div>
                    )}

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
                            <p className="whitespace-pre-line">{m.message}</p>
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
                    <textarea
                      rows="2"
                      required
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
                      disabled={replying || !replyText.trim()}
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
