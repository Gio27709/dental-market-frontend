import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  getAllTicketsAdminAPI,
  getTicketDetailsAPI,
  addTicketMessageAPI,
  updateTicketStatusAdminAPI,
} from "../../services/api";
import { useAdminStats } from "../../context/AdminStatsContext";
import toast from "react-hot-toast";
import { socket } from "../../lib/socket";

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

export default function AdminSupport() {
  const { refreshStats } = useAdminStats();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTicket, setActiveTicket] = useState(null);
  const [ticketDetails, setTicketDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [replying, setReplying] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Filters
  const [filterStatus, setFilterStatus] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const chatContainerRef = useRef(null);
  const lastTicketIdRef = useRef(null);
  const lastMessagesLengthRef = useRef(0);

  const handleSelectTicket = useCallback(async (ticket) => {
    setActiveTicket(ticket);
    setTickets((prev) =>
      prev.map((t) => (t.id === ticket.id ? { ...t, admin_has_unread: false } : t))
    );
    try {
      setLoadingDetails(true);
      const res = await getTicketDetailsAPI(ticket.id);
      if (res.data && res.data.success) {
        setTicketDetails(res.data.data);
      }
    } catch (error) {
      console.error(error);
      toast.error("Error al cargar el detalle del ticket.");
    } finally {
      setLoadingDetails(false);
    }
  }, []);

  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterStatus) params.status = filterStatus;
      if (filterCategory) params.category = filterCategory;

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
  }, [filterStatus, filterCategory, handleSelectTicket]);

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
        return { ...prev, status: updatedTicket.status, admin_has_unread: false };
      });
      setTicketDetails((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          ticket: { ...prev.ticket, status: updatedTicket.status, admin_has_unread: false },
        };
      });
      setTickets((prevList) =>
        prevList.map((t) => (t.id === activeTicket.id ? { ...t, status: updatedTicket.status, admin_has_unread: false } : t))
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
    const handleTicketCreated = () => {
      fetchTickets();
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
  }, [fetchTickets]);

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
          // If status was open, it automatically becomes in_progress in backend
          if (activeTicket.status === "open") {
            setActiveTicket((prev) => ({ ...prev, status: "in_progress" }));
          }
        }
        // Refresh ticket list and global badges
        fetchTickets();
        refreshStats();
      }
    } catch (error) {
      console.error(error);
      toast.error("Error al enviar la respuesta.");
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
        
        // Refresh detailed view
        const detailsRes = await getTicketDetailsAPI(activeTicket.id);
        if (detailsRes.data && detailsRes.data.success) {
          setTicketDetails(detailsRes.data.data);
        }
        
        // Refresh ticket list and global stats
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

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleString("es-VE", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Client side search filtering
  const filteredTickets = tickets.filter((t) => {
    const subjectMatch = t.subject?.toLowerCase().includes(searchTerm.toLowerCase());
    const ticketIdMatch = t.id?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // User or guest name matching
    let nameMatch = false;
    if (t.users?.full_name) {
      nameMatch = t.users.full_name.toLowerCase().includes(searchTerm.toLowerCase());
    } else if (t.guest_name) {
      nameMatch = t.guest_name.toLowerCase().includes(searchTerm.toLowerCase());
    }

    return subjectMatch || ticketIdMatch || nameMatch;
  });

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
            Atiende consultas técnicas, problemas con pedidos y aclara dudas de clientes y visitantes.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Tickets Sidebar */}
        <div className={`lg:col-span-1 space-y-4 bg-white rounded-2xl p-4 border border-slate-100 shadow-sm ${activeTicket ? "hidden lg:block" : ""}`}>
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-1">Listado de Tickets</h2>

          {/* Search bar */}
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span>
            <input
              type="text"
              placeholder="Buscar por cliente, asunto, ID..."
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
                {Object.entries(CATEGORIES).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
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

                return (
                  <button
                    key={t.id}
                    onClick={() => handleSelectTicket(t)}
                    className="w-full text-left rounded-xl p-3 border transition-all duration-200 flex flex-col justify-between hover:border-[#6b1e96]/30 hover:bg-slate-50 cursor-pointer"
                    style={{
                      background: isActive ? "#fdfaff" : "#ffffff",
                      borderColor: isActive ? "#6b1e96" : "rgba(0,0,0,0.06)",
                    }}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1 gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] font-mono text-slate-400">
                            #{t.id.substring(0, 8).toUpperCase()}
                          </span>
                          {t.admin_has_unread && (
                            <span 
                              className="w-2 h-2 rounded-full bg-red-500 animate-pulse" 
                              title="Sin leer / Pendiente"
                            />
                          )}
                        </div>
                        <div className="flex items-center gap-1.5">
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
                        ) : t.users?.role === "store" ? (
                          <span className="px-1.5 py-0.2 text-[8px] font-black uppercase rounded bg-purple-100 text-purple-700">Tienda</span>
                        ) : (
                          <span className="px-1.5 py-0.2 text-[8px] font-black uppercase rounded bg-green-100 text-green-700">Comprador</span>
                        )}
                      </div>
                    </div>
                    <div className="mt-3 pt-1.5 border-t border-slate-100 flex items-center justify-between w-full text-[9px] text-slate-400">
                      <span>{CATEGORIES[t.category]}</span>
                      <span>{formatDate(t.updated_at)}</span>
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
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col h-[600px] overflow-hidden">
              {/* Detailed Header */}
              <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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
                    <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-500">
                      <span>ID: <span className="font-mono font-bold">#{activeTicket.id.toUpperCase()}</span></span>
                      <span>•</span>
                      <span>Categoría: <span className="font-bold">{CATEGORIES[activeTicket.category]}</span></span>
                    </div>
                  </div>
                </div>

                {/* Status Dropdown selector */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase hidden sm:inline">Estado:</span>
                  <select
                    value={activeTicket.status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    disabled={updatingStatus}
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
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-slate-400 uppercase text-[9px]">Remitente:</span>
                  <span className="font-extrabold text-slate-700">
                    {ticketDetails?.ticket.users?.full_name || ticketDetails?.ticket.guest_name || "Invitado"}
                  </span>
                  <span className="text-slate-300">|</span>
                  <span className="text-slate-500">
                    {ticketDetails?.ticket.users?.email || ticketDetails?.ticket.guest_email || "-"}
                  </span>
                  {!ticketDetails?.ticket.user_id && (
                    <span className="px-1.5 py-0.2 text-[8px] font-black uppercase rounded bg-[#dbeafe] text-[#2563eb]">Visitante Invitado</span>
                  )}
                </div>
                {ticketDetails?.ticket.order_id && (
                  <Link
                    to={`/admin/orders/${ticketDetails.ticket.order_id}`}
                    className="text-[#6b1e96] hover:underline font-bold flex items-center gap-1 text-[11px]"
                  >
                    <span className="material-symbols-outlined text-[14px]">shopping_bag</span>
                    Pedido Vinculado
                    <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                  </Link>
                )}
              </div>

              {/* Chat Thread */}
              <div ref={chatContainerRef} className="flex-1 p-5 overflow-y-auto space-y-4 bg-[#fbfbfe] admin-scrollbar">
                {loadingDetails ? (
                  <div className="flex flex-col items-center justify-center h-full">
                    <div className="w-8 h-8 border-3 border-slate-200 border-t-[#6b1e96] rounded-full animate-spin mb-2" />
                    <p className="text-xs text-slate-400">Cargando conversación...</p>
                  </div>
                ) : ticketDetails ? (
                  <>
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

              {/* Chat Input */}
              {activeTicket.status !== "closed" ? (
                <form onSubmit={handleSendReply} className="p-4 border-t border-slate-100 bg-white">
                  <div className="flex gap-3 items-end">
                    <textarea
                      rows="2"
                      required
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
                      disabled={replying || !replyText.trim()}
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
            <div className="hidden lg:flex flex-col items-center justify-center bg-white border border-slate-100 rounded-2xl h-[600px] p-8 text-center shadow-xs">
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
