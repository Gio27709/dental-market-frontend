import { useState, useEffect, useCallback } from "react";
import api from "../../services/api";
import { toast } from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import { socket } from "../../lib/socket";

// "hace 3 min" a partir de un ISO. Para la lista de conectados, donde lo único que
// importa es cuánto llevan dentro.
const timeConnected = (iso) => {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "recién llegó";
  if (mins < 60) return `hace ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `hace ${hours} h`;
  return `hace ${Math.floor(hours / 24)} d`;
};

const PERMISSIONS_LIST = [
  { key: "manage_users", label: "Gestión de Usuarios", desc: "Crear cuentas, asignar roles y modificar permisos de usuarios." },
  { key: "manage_products", label: "Moderar Productos", desc: "Aprobar, rechazar y moderar productos de tiendas." },
  { key: "manage_orders", label: "Gestión de Pedidos", desc: "Monitorear, reembolsar y actualizar envíos globales." },
  { key: "manage_payouts", label: "Gestión de Retiros", desc: "Aprobar y transferir retiros solicitados por tiendas." },
  { key: "manage_support", label: "Tickets de Soporte", desc: "Responder y resolver solicitudes de ayuda y reclamos." },
  { key: "manage_settings", label: "Ajustes del Sistema", desc: "Modificar variables y configuraciones de la plataforma." },
  { key: "manage_content", label: "Gestión de Contenido", desc: "Administrar cursos, blog, categorías y marcas de productos." },
];

const PAGE_OPTIONS = [10, 25, 50];

const ROLE_OPTIONS = [
  { value: "", label: "Todos los Roles" },
  { value: "user", label: "Usuario (Comprador)" },
  { value: "professional", label: "Profesional Dental" },
  { value: "delivery", label: "Delivery (Repartidor)" },
  { value: "store", label: "Store (Tienda)" },
  { value: "admin", label: "Admin (Staff)" },
  { value: "owner", label: "Owner (Dueño)" },
];

const ROLE_BADGES = {
  user:     { label: "User",     color: "#6b7280", bg: "rgba(107,114,128,0.10)" },
  professional: { label: "Professional", color: "#0ea5e9", bg: "rgba(14,165,233,0.10)" },
  delivery: { label: "Delivery", color: "#7c3aed", bg: "rgba(124,58,237,0.10)" },
  store:    { label: "Store",    color: "#2563eb", bg: "rgba(37,99,235,0.10)" },
  admin:    { label: "Admin",    color: "#059669", bg: "rgba(16,185,129,0.10)" },
  owner:    { label: "Owner",    color: "#c3ff00", bg: "rgba(83,21,117,0.90)" },
};

const ROLE_SELECT_OPTIONS_ALL = [
  { value: "user", label: "Usuario (Comprador)" },
  { value: "professional", label: "Profesional Dental" },
  { value: "delivery", label: "Delivery (Repartidor)" },
  { value: "store", label: "Store (Tienda)" },
  { value: "admin", label: "Admin (Staff)" },
  { value: "owner", label: "Owner (Dueño)" },
];

// Admins can only assign these roles (no admin/owner - privilege escalation prevention)
const ROLE_SELECT_OPTIONS_ADMIN = [
  { value: "user", label: "Usuario (Comprador)" },
  { value: "professional", label: "Profesional Dental" },
  { value: "delivery", label: "Delivery (Repartidor)" },
  { value: "store", label: "Store (Tienda)" },
];

export default function AdminUsers() {
  const { user: currentUser } = useAuth();
  const isOwner = currentUser?.role === "owner";
  
  // Owners see all role options, admins only see non-privileged roles
  const ROLE_SELECT_OPTIONS = isOwner ? ROLE_SELECT_OPTIONS_ALL : ROLE_SELECT_OPTIONS_ADMIN;

  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [perPage, setPerPage] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);

  // Presencia en vivo (sockets abiertos ahora mismo)
  const [online, setOnline] = useState({ count: 0, users: [] });
  const [onlinePanelOpen, setOnlinePanelOpen] = useState(false);

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [permissionsModalOpen, setPermissionsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Forms state
  const [createForm, setCreateForm] = useState({ email: "", password: "", fullName: "", role: "user", permissions: {} });
  const [permissionsForm, setPermissionsForm] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const handleOpenPermissionsModal = (user) => {
    setSelectedUser(user);
    const initialPerms = {};
    // El comodín "*" es acceso total declarado explícitamente. Un admin sin permisos
    // ya NO tiene acceso a nada (el backend denega por defecto), así que la casilla
    // vacía refleja la realidad en lugar de marcarlo todo por retrocompatibilidad.
    const hasWildcard = user.permissions?.["*"] === true;

    PERMISSIONS_LIST.forEach(p => {
      initialPerms[p.key] = user.role === "owner" || hasWildcard || user.permissions?.[p.key] === true;
    });
    setPermissionsForm(initialPerms);
    setPermissionsModalOpen(true);
  };

  const handlePermissionToggle = (key) => {
    setPermissionsForm(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleUpdatePermissions = async () => {
    if (!selectedUser) return;
    try {
      setSubmitting(true);
      const res = await api.put(`/admin/users/${selectedUser.id}/permissions`, { permissions: permissionsForm });
      if (res.data?.success) {
        toast.success("Permisos actualizados exitosamente.");
        setUsers(prev => prev.map(u => u.id === selectedUser.id ? { ...u, permissions: permissionsForm } : u));
        setPermissionsModalOpen(false);
      }
    } catch (error) {
      console.error("Error updating permissions:", error);
      toast.error(error.response?.data?.error || "Error al actualizar los permisos.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!createForm.email || !createForm.password || !createForm.fullName || !createForm.role) {
      toast.error("Por favor completa todos los campos.");
      return;
    }

    // Explicitly define all permissions as true or false to prevent legacy fallback on backend
    const finalPermissions = {};
    PERMISSIONS_LIST.forEach(p => {
      finalPermissions[p.key] = createForm.permissions[p.key] === true;
    });

    try {
      setSubmitting(true);
      const res = await api.post("/admin/users", {
        email: createForm.email,
        password: createForm.password,
        full_name: createForm.fullName,
        role: createForm.role,
        permissions: finalPermissions,
      });
      if (res.data?.success) {
        toast.success("Usuario creado exitosamente.");
        // Reload users list
        fetchUsers({ page: currentPage, limit: perPage, search: searchTerm, role: roleFilter });
        // Reset form and close modal
        setCreateForm({ email: "", password: "", fullName: "", role: "user", permissions: {} });
        setCreateModalOpen(false);
      }
    } catch (error) {
      console.error("Error creating user:", error);
      toast.error(error.response?.data?.error || "Error al crear la cuenta.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreatePermissionToggle = (key) => {
    setCreateForm(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [key]: !prev.permissions[key]
      }
    }));
  };

  const fetchUsers = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      const res = await api.get("/admin/users", { params });
      const payload = res.data;
      setUsers(payload.data || []);
      if (payload.pagination) {
        setPagination(payload.pagination);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      if (error.response?.status === 403) {
        toast.error("No tienes permisos para acceder a esta sección.");
      } else {
        toast.error("Fallo al cargar la lista de usuarios.");
      }
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchOnline = useCallback(async () => {
    try {
      const res = await api.get("/admin/users/online");
      setOnline({ count: res.data?.count ?? 0, users: res.data?.data || [] });
    } catch {
      // La presencia es accesoria: si falla, la página sigue siendo usable.
    }
  }, []);

  // El backend avisa a la sala "admins" cada vez que alguien entra o sale, así que
  // no hace falta preguntar cada X segundos: solo al montar y cuando algo cambia.
  useEffect(() => {
    fetchOnline();
    socket.on("presence_update", fetchOnline);
    return () => socket.off("presence_update", fetchOnline);
  }, [fetchOnline]);

  // Debounced fetch
  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchUsers({
        page: currentPage,
        limit: perPage,
        search: searchTerm || undefined,
        role: roleFilter || undefined,
      });
    }, searchTerm ? 400 : 0);
    return () => clearTimeout(timeout);
  }, [currentPage, perPage, searchTerm, roleFilter, fetchUsers]);

  // Reset page on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, roleFilter, perPage]);

  const clearFilters = () => {
    setSearchTerm("");
    setRoleFilter("");
    setPerPage(25);
    setCurrentPage(1);
  };

  const hasActiveFilters = searchTerm || roleFilter;

  const handleRoleChange = async (userId, newRole, userEmail) => {
    const roleName = ROLE_SELECT_OPTIONS_ALL.find(r => r.value === newRole)?.label || newRole;
    const confirmed = window.confirm(
      `¿Estás seguro de cambiar el rol de "${userEmail}" a "${roleName}"?\n\nEsta acción es inmediata y afecta los permisos del usuario.`
    );
    if (!confirmed) return;

    try {
      setUpdatingId(userId);
      const res = await api.put(`/admin/users/${userId}/role`, { role: newRole });
      if (res.data?.success) {
        toast.success(res.data.message || `Rol cambiado a ${newRole}`);
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
      }
    } catch (error) {
      console.error("Error changing role:", error);
      toast.error(error.response?.data?.error || "Fallo al cambiar el rol.");
    } finally {
      setUpdatingId(null);
    }
  };

  const thStyle = {
    padding: "12px 14px", fontSize: "11px", fontWeight: 600,
    color: "rgba(195,255,0,0.8)", textTransform: "uppercase",
    letterSpacing: "0.05em", whiteSpace: "nowrap",
  };

  const inputFocusHandlers = {
    onFocus: (e) => { e.target.style.borderColor = "#6b1e96"; e.target.style.background = "#fff"; e.target.style.boxShadow = "0 0 0 3px rgba(107,30,150,0.08)"; },
    onBlur: (e) => { e.target.style.borderColor = "#e5e7eb"; e.target.style.background = "#fafafa"; e.target.style.boxShadow = "none"; },
  };

  return (
    <div className="w-full mx-auto animate-fade-in-up" style={{ minHeight: "100%" }}>
      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap", justifyContent: "space-between", marginBottom: "24px" }}>
        <div>
          <h2 style={{ fontSize: "22px", fontWeight: 800, color: "#1a0a2e", margin: 0, letterSpacing: "-0.02em", display: "flex", alignItems: "center", gap: "10px" }}>
            <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="#6b1e96" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
            </svg>
            Gestión de Usuarios
          </h2>
          <p style={{ fontSize: "13px", color: "#9ca3af", margin: "4px 0 0 0" }}>
            Administra privilegios, roles y permisos de todos los usuarios de la plataforma.
          </p>
        </div>

        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
          {/* CREATE ACCOUNT BUTTON */}
          <button
            onClick={() => setCreateModalOpen(true)}
            style={{
              padding: "8px 16px",
              borderRadius: "8px",
              background: "linear-gradient(135deg, #531575 0%, #6b1e96 100%)",
              border: "none",
              color: "#c3ff00",
              fontSize: "12px",
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              boxShadow: "0 4px 6px rgba(107,30,150,0.2)",
              transition: "all 0.2s"
            }}
          >
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0zM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
            </svg>
            Crear Cuenta
          </button>

          <button
            onClick={() => fetchUsers({ page: currentPage, limit: perPage, search: searchTerm, role: roleFilter })}
            disabled={loading}
            style={{ padding: "8px 16px", borderRadius: "8px", background: "#fff", border: "1px solid #e5e7eb", color: "#374151", fontSize: "12px", fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1, transition: "all 0.2s" }}
          >
            Refrescar
          </button>
        </div>
      </div>

      {/* ── Conectados ahora (presencia en vivo por socket) ── */}
      <div style={{ background: "#fff", borderRadius: "16px", border: "1px solid #f0f0f0", marginBottom: "16px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", overflow: "hidden" }}>
        <button
          onClick={() => setOnlinePanelOpen((o) => !o)}
          disabled={online.count === 0}
          style={{
            width: "100%", display: "flex", alignItems: "center", gap: "16px",
            padding: "16px 20px", background: "transparent", border: "none",
            textAlign: "left", cursor: online.count === 0 ? "default" : "pointer",
          }}
        >
          <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: online.count > 0 ? "rgba(16,185,129,0.10)" : "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <span
              className={online.count > 0 ? "animate-pulse" : ""}
              style={{ width: "10px", height: "10px", borderRadius: "50%", background: online.count > 0 ? "#10b981" : "#d1d5db", display: "block" }}
            />
          </div>

          <div style={{ minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: "11px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#9ca3af" }}>
              Conectados ahora
            </p>
            <p style={{ margin: "2px 0 0 0", fontSize: "26px", lineHeight: 1.1, fontWeight: 800, color: "#1a0a2e", fontVariantNumeric: "tabular-nums" }}>
              {online.count}
            </p>
          </div>

          <p style={{ margin: "0 0 0 auto", fontSize: "12px", color: "#9ca3af", display: "flex", alignItems: "center", gap: "6px" }}>
            {online.count === 0
              ? "Nadie tiene la app abierta"
              : onlinePanelOpen ? "Ocultar la lista" : "Ver quiénes son"}
            {online.count > 0 && (
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} style={{ transform: onlinePanelOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
              </svg>
            )}
          </p>
        </button>

        {onlinePanelOpen && online.count > 0 && (
          <div style={{ borderTop: "1px solid #f0f0f0", maxHeight: "320px", overflowY: "auto" }}>
            {online.users.map((u) => {
              const badge = ROLE_BADGES[u.role] || ROLE_BADGES.user;
              const name = u.full_name || u.email;
              return (
                <div key={u.user_id} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 20px", borderBottom: "1px solid #fafafa" }}>
                  <div style={{ position: "relative", flexShrink: 0 }}>
                    <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "linear-gradient(135deg, #531575 0%, #6b1e96 100%)", color: "#c3ff00", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 700 }}>
                      {String(name).charAt(0).toUpperCase()}
                    </div>
                    <span style={{ position: "absolute", right: "-1px", bottom: "-1px", width: "10px", height: "10px", borderRadius: "50%", background: "#10b981", border: "2px solid #fff" }} />
                  </div>

                  <div style={{ minWidth: 0, flex: 1 }}>
                    <p style={{ margin: 0, fontSize: "13px", fontWeight: 600, color: "#1f2937", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</p>
                    {u.full_name && (
                      <p style={{ margin: 0, fontSize: "11px", color: "#9ca3af", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.email}</p>
                    )}
                  </div>

                  <span style={{ fontSize: "10px", fontWeight: 700, padding: "3px 8px", borderRadius: "6px", color: badge.color, background: badge.bg, whiteSpace: "nowrap" }}>
                    {badge.label}
                  </span>

                  <span style={{ fontSize: "11px", color: "#9ca3af", whiteSpace: "nowrap", minWidth: "78px", textAlign: "right" }}>
                    {timeConnected(u.connected_at)}
                    {u.connections > 1 && ` · ${u.connections} pestañas`}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Search & Filters ── */}
      <div style={{ background: "#fff", borderRadius: "16px", border: "1px solid #f0f0f0", padding: "16px 20px", marginBottom: "16px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
        <div style={{ position: "relative", marginBottom: "16px" }}>
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#9ca3af" strokeWidth={2} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input
            type="text"
            placeholder="Buscar por email o nombre del usuario..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: "100%", padding: "12px 14px 12px 42px", borderRadius: "10px", border: "1.5px solid #e5e7eb", fontSize: "13px", outline: "none", transition: "border-color 0.2s, box-shadow 0.2s", background: "#fafafa", color: "#1f2937", boxSizing: "border-box" }}
            {...inputFocusHandlers}
          />
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center" }}>
          <div style={{ flex: "1 1 180px", minWidth: "160px" }}>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1.5px solid #e5e7eb", fontSize: "12px", color: roleFilter ? "#1f2937" : "#9ca3af", background: "#f8fafc", cursor: "pointer", outline: "none" }}
            >
              {ROLE_OPTIONS.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          <div style={{ flex: "0 0 auto" }}>
            <select
              value={perPage}
              onChange={(e) => setPerPage(Number(e.target.value))}
              style={{ padding: "10px 12px", borderRadius: "8px", border: "1.5px solid #e5e7eb", fontSize: "12px", color: "#1f2937", background: "#f8fafc", cursor: "pointer", outline: "none" }}
            >
              {PAGE_OPTIONS.map((n) => (
                <option key={n} value={n}>{n} por página</option>
              ))}
            </select>
          </div>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              style={{ flex: "0 0 auto", display: "flex", alignItems: "center", gap: "6px", padding: "10px 16px", borderRadius: "8px", border: "1.5px solid rgba(107,30,150,0.15)", background: "rgba(107,30,150,0.04)", color: "#6b1e96", fontSize: "12px", fontWeight: 600, cursor: "pointer", transition: "all 0.2s" }}
            >
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
              Limpiar
            </button>
          )}
        </div>
      </div>

      {/* ── Content ── */}
      {loading && (!users || users.length === 0) ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {[...Array(5)].map((_, i) => (
            <div key={i} style={{ background: "#fff", borderRadius: "12px", border: "1px solid #f0f0f0", padding: "20px", display: "flex", alignItems: "center", gap: "16px", animation: "pulse 1.5s ease-in-out infinite" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "#f3f4f6" }} />
              <div style={{ flex: 1 }}>
                <div style={{ width: "180px", height: "14px", background: "#f3f4f6", borderRadius: "4px", marginBottom: "8px" }} />
                <div style={{ width: "120px", height: "10px", background: "#f9fafb", borderRadius: "4px" }} />
              </div>
              <div style={{ width: "80px", height: "24px", background: "#f3f4f6", borderRadius: "12px" }} />
            </div>
          ))}
        </div>
      ) : users.length === 0 ? (
        <div style={{ background: "#fff", borderRadius: "16px", border: "1px solid #f0f0f0", padding: "48px 24px", textAlign: "center" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>👤</div>
          <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#374151", marginBottom: "8px" }}>Sin resultados</h3>
          <p style={{ color: "#9ca3af", fontSize: "13px", marginBottom: "20px" }}>No se encontraron usuarios con ese criterio.</p>
          <button onClick={clearFilters} style={{ padding: "9px 20px", background: "rgba(107,30,150,0.08)", color: "#6b1e96", borderRadius: "8px", border: "1.5px solid rgba(107,30,150,0.15)", fontWeight: 600, fontSize: "12px", cursor: "pointer" }}>Limpiar filtros</button>
        </div>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="md:hidden" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {users.map((user) => {
              const badge = ROLE_BADGES[user.role] || ROLE_BADGES.user;
              const isTargetOwner = user.role === "owner";
              const isUpdating = updatingId === user.id;
              const permissionsDisabled = (isTargetOwner && !isOwner) || user.id === currentUser?.id;

              const createdDate = user.created_at ? new Date(user.created_at).toLocaleDateString("es-VE", { day: "2-digit", month: "short", year: "numeric" }) : "—";
              const lastLogin = user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString("es-VE", { day: "2-digit", month: "short", year: "numeric" }) : "Nunca";

              const displayName = user.full_name
                || [user.user_metadata?.first_name, user.user_metadata?.last_name].filter(Boolean).join(" ")
                || "Sin nombre";

              return (
                <div key={user.id} style={{ background: "#fff", borderRadius: "14px", border: "1px solid #f0f0f0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", padding: "14px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "linear-gradient(135deg, #e9d5ff, #f3e8ff)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: "1px solid rgba(107,30,150,0.1)" }}>
                      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#6b1e96" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                      </svg>
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: "13px", fontWeight: 600, color: "#1f2937", lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{displayName}</div>
                      <div style={{ fontSize: "11px", color: "#9ca3af", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.email}</div>
                    </div>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "4px 9px", borderRadius: "16px", background: badge.bg, color: badge.color, fontSize: "10px", fontWeight: 700, whiteSpace: "nowrap", textTransform: "uppercase", letterSpacing: "0.04em", flexShrink: 0 }}>
                      {isTargetOwner && <span style={{ fontSize: "11px" }}>👑</span>}
                      {badge.label}
                    </span>
                  </div>

                  <div style={{ display: "flex", gap: "16px", marginTop: "12px", paddingTop: "12px", borderTop: "1px solid #f3f4f6", fontSize: "11px", color: "#6b7280" }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: "9px", fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.04em" }}>Registro</div>
                      <div>{createdDate}</div>
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: "9px", fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.04em" }}>Último acceso</div>
                      <div style={{ color: lastLogin === "Nunca" ? "#d1d5db" : "#6b7280" }}>{lastLogin}</div>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "8px", marginTop: "12px", alignItems: "center" }}>
                    <select
                      disabled={isTargetOwner || isUpdating}
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.id, e.target.value, user.email)}
                      style={{ flex: 1, minWidth: 0, padding: "9px 10px", borderRadius: "8px", border: "1.5px solid #e5e7eb", fontSize: "12px", fontWeight: 600, color: "#1f2937", background: isTargetOwner ? "#f9fafb" : "#fff", cursor: isTargetOwner || isUpdating ? "not-allowed" : "pointer", outline: "none", opacity: isTargetOwner || isUpdating ? 0.5 : 1 }}
                    >
                      {ROLE_SELECT_OPTIONS.map((r) => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </select>
                    <button
                      disabled={permissionsDisabled}
                      onClick={() => handleOpenPermissionsModal(user)}
                      style={{ flexShrink: 0, padding: "9px 14px", borderRadius: "8px", border: "1.5px solid rgba(107,30,150,0.15)", background: "rgba(107,30,150,0.04)", color: "#6b1e96", fontSize: "12px", fontWeight: 600, cursor: permissionsDisabled ? "not-allowed" : "pointer", opacity: permissionsDisabled ? 0.4 : 1, display: "inline-flex", alignItems: "center", gap: "5px" }}
                    >
                      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z" />
                      </svg>
                      Permisos
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Table */}
          <div className="hidden md:block" style={{ background: "#fff", borderRadius: "16px", border: "1px solid #f0f0f0", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)", overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", minWidth: "720px" }}>
                <thead>
                  <tr style={{ background: "linear-gradient(135deg, #1a0a2e, #2d1248)" }}>
                    <th style={thStyle}>Usuario</th>
                    <th style={thStyle}>Fecha Registro</th>
                    <th style={thStyle}>Último Acceso</th>
                    <th style={thStyle}>Rol Actual</th>
                    <th style={{ ...thStyle, textAlign: "center" }}>Cambiar Rol</th>
                    <th style={{ ...thStyle, textAlign: "center" }}>Permisos</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user, idx) => {
                    const badge = ROLE_BADGES[user.role] || ROLE_BADGES.user;
                    const isTargetOwner = user.role === "owner";
                    const isUpdating = updatingId === user.id;
                    const borderBottom = idx !== users.length - 1 ? "1px solid #f3f4f6" : "none";

                    const createdDate = user.created_at ? new Date(user.created_at).toLocaleDateString("es-VE", { day: "2-digit", month: "short", year: "numeric" }) : "—";
                    const lastLogin = user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString("es-VE", { day: "2-digit", month: "short", year: "numeric" }) : "Nunca";

                    const displayName = user.full_name
                      || [user.user_metadata?.first_name, user.user_metadata?.last_name].filter(Boolean).join(" ")
                      || "Sin nombre";

                    return (
                      <tr
                        key={user.id}
                        style={{ borderBottom, transition: "background 0.15s", background: "#fff" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#faf5ff")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}
                      >
                        {/* USER */}
                        <td style={{ padding: "10px 14px", verticalAlign: "middle" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "linear-gradient(135deg, #e9d5ff, #f3e8ff)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: "1px solid rgba(107,30,150,0.1)" }}>
                              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#6b1e96" strokeWidth={1.8}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                              </svg>
                            </div>
                            <div>
                              <div style={{ fontSize: "12px", fontWeight: 600, color: "#1f2937", lineHeight: 1.3 }}>
                                {displayName}
                              </div>
                              <div style={{ fontSize: "10px", color: "#9ca3af", marginTop: "1px" }}>
                                {user.email}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* CREATED */}
                        <td style={{ padding: "10px 14px", verticalAlign: "middle" }}>
                          <span style={{ fontSize: "11px", color: "#6b7280", fontWeight: 500 }}>{createdDate}</span>
                        </td>

                        {/* LAST LOGIN */}
                        <td style={{ padding: "10px 14px", verticalAlign: "middle" }}>
                          <span style={{ fontSize: "11px", color: lastLogin === "Nunca" ? "#d1d5db" : "#6b7280", fontWeight: 500 }}>{lastLogin}</span>
                        </td>

                        {/* ROLE BADGE */}
                        <td style={{ padding: "10px 14px", verticalAlign: "middle" }}>
                          <div style={{
                            display: "inline-flex", alignItems: "center", gap: "5px",
                            padding: "4px 10px", borderRadius: "16px",
                            background: badge.bg, color: badge.color,
                            fontSize: "10px", fontWeight: 700, whiteSpace: "nowrap",
                            textTransform: "uppercase", letterSpacing: "0.04em",
                          }}>
                            {isTargetOwner && <span style={{ fontSize: "11px" }}>👑</span>}
                            {badge.label}
                          </div>
                        </td>

                        {/* ROLE SELECT */}
                        <td style={{ padding: "10px 14px", verticalAlign: "middle", textAlign: "center" }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                            {isTargetOwner && (
                              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#d1d5db" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                              </svg>
                            )}
                            <select
                              disabled={isTargetOwner || isUpdating}
                              value={user.role}
                              onChange={(e) => handleRoleChange(user.id, e.target.value, user.email)}
                              style={{
                                padding: "6px 10px", borderRadius: "8px",
                                border: "1.5px solid #e5e7eb", fontSize: "11px", fontWeight: 600,
                                color: "#1f2937", background: isTargetOwner ? "#f9fafb" : "#fff",
                                cursor: isTargetOwner || isUpdating ? "not-allowed" : "pointer",
                                outline: "none", opacity: isTargetOwner || isUpdating ? 0.5 : 1,
                                minWidth: "140px", transition: "all 0.2s",
                              }}
                            >
                              {ROLE_SELECT_OPTIONS.map((r) => (
                                  <option key={r.value} value={r.value}>{r.label}</option>
                              ))}
                            </select>
                          </div>
                        </td>

                        {/* PERMISSIONS BUTTON */}
                        <td style={{ padding: "10px 14px", verticalAlign: "middle", textAlign: "center" }}>
                          <button
                            disabled={(isTargetOwner && !isOwner) || (user.id === currentUser?.id)}
                            onClick={() => handleOpenPermissionsModal(user)}
                            style={{
                              padding: "6px 12px", borderRadius: "8px",
                              border: "1.5px solid rgba(107,30,150,0.15)",
                              background: "rgba(107,30,150,0.04)",
                              color: "#6b1e96",
                              fontSize: "11px", fontWeight: 600,
                              cursor: ((isTargetOwner && !isOwner) || (user.id === currentUser?.id)) ? "not-allowed" : "pointer",
                              opacity: ((isTargetOwner && !isOwner) || (user.id === currentUser?.id)) ? 0.4 : 1,
                              display: "inline-flex", alignItems: "center", gap: "4px",
                              transition: "all 0.2s"
                            }}
                          >
                            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z" />
                            </svg>
                            Permisos
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Footer: Count + Pagination ── */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", marginTop: "16px", padding: "14px 20px", background: "#fff", borderRadius: "12px", border: "1px solid #f0f0f0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
            <div style={{ fontSize: "12px", color: "#6b7280" }}>
              Mostrando{" "}
              <span style={{ fontWeight: 700, color: "#1a0a2e" }}>
                {Math.min((pagination.page - 1) * pagination.limit + 1, pagination.total)}–
                {Math.min(pagination.page * pagination.limit, pagination.total)}
              </span>{" "}
              de{" "}
              <span style={{ fontWeight: 700, color: "#1a0a2e" }}>{pagination.total}</span>{" "}
              usuario{pagination.total !== 1 ? "s" : ""}
            </div>

            {pagination.totalPages > 1 && (
              <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "6px" }}>
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={pagination.page === 1}
                  style={{ width: "32px", height: "32px", borderRadius: "8px", border: "1px solid #e5e7eb", background: pagination.page === 1 ? "#f9fafb" : "#fff", color: pagination.page === 1 ? "#d1d5db" : "#374151", display: "flex", alignItems: "center", justifyContent: "center", cursor: pagination.page === 1 ? "not-allowed" : "pointer", transition: "all 0.15s" }}
                >
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                  </svg>
                </button>

                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === pagination.totalPages || Math.abs(p - pagination.page) <= 1)
                  .reduce((acc, p, i, arr) => {
                    if (i > 0 && p - arr[i - 1] > 1) acc.push("...");
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p, i) =>
                    p === "..." ? (
                      <span key={`dots-${i}`} style={{ fontSize: "12px", color: "#9ca3af", padding: "0 2px" }}>⋯</span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => setCurrentPage(p)}
                        style={{
                          width: "32px", height: "32px", borderRadius: "8px",
                          border: p === pagination.page ? "1.5px solid #6b1e96" : "1px solid #e5e7eb",
                          background: p === pagination.page ? "linear-gradient(135deg, #531575, #6b1e96)" : "#fff",
                          color: p === pagination.page ? "#c3ff00" : "#374151",
                          fontSize: "12px", fontWeight: p === pagination.page ? 700 : 500,
                          cursor: "pointer", transition: "all 0.15s",
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}
                      >
                        {p}
                      </button>
                    )
                  )}

                <button
                  onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={pagination.page === pagination.totalPages}
                  style={{ width: "32px", height: "32px", borderRadius: "8px", border: "1px solid #e5e7eb", background: pagination.page === pagination.totalPages ? "#f9fafb" : "#fff", color: pagination.page === pagination.totalPages ? "#d1d5db" : "#374151", display: "flex", alignItems: "center", justifyContent: "center", cursor: pagination.page === pagination.totalPages ? "not-allowed" : "pointer", transition: "all 0.15s" }}
                >
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── Modal: Crear Cuenta ── */}
      {createModalOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px", background: "rgba(26,10,46,0.6)", backdropFilter: "blur(4px)" }}>
          <div style={{ background: "#fff", borderRadius: "20px", width: "100%", maxWidth: "520px", maxHeight: "90vh", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.15)", overflowY: "auto", border: "1px solid rgba(107,30,150,0.1)", display: "flex", flexDirection: "column" }}>
            <div style={{ background: "linear-gradient(135deg, #1a0a2e, #2d1248)", padding: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#fff" }}>Crear Nueva Cuenta</h3>
              <button onClick={() => setCreateModalOpen(false)} style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.6)", cursor: "pointer", fontSize: "22px", fontWeight: 300, lineHeight: 1 }}>&times;</button>
            </div>
            <form onSubmit={handleCreateUser} style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#374151", textTransform: "uppercase", marginBottom: "6px" }}>Nombre Completo</label>
                <input
                  type="text"
                  required
                  value={createForm.fullName}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, fullName: e.target.value }))}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1.5px solid #e5e7eb", fontSize: "13px", outline: "none", boxSizing: "border-box" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#374151", textTransform: "uppercase", marginBottom: "6px" }}>Correo Electrónico</label>
                <input
                  type="email"
                  required
                  value={createForm.email}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, email: e.target.value }))}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1.5px solid #e5e7eb", fontSize: "13px", outline: "none", boxSizing: "border-box" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#374151", textTransform: "uppercase", marginBottom: "6px" }}>Contraseña</label>
                <input
                  type="password"
                  required
                  value={createForm.password}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, password: e.target.value }))}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1.5px solid #e5e7eb", fontSize: "13px", outline: "none", boxSizing: "border-box" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#374151", textTransform: "uppercase", marginBottom: "6px" }}>Rol / Rango</label>
                <select
                  value={createForm.role}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, role: e.target.value }))}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1.5px solid #e5e7eb", fontSize: "13px", outline: "none", background: "#fff", cursor: "pointer" }}
                >
                  {ROLE_SELECT_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#374151", textTransform: "uppercase", marginBottom: "8px" }}>Permisos Específicos</label>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "180px", overflowY: "auto", border: "1.5px solid #e5e7eb", borderRadius: "8px", padding: "12px", background: "#f9fafb" }}>
                  {PERMISSIONS_LIST.map(p => (
                    <label key={p.key} style={{ display: "flex", alignItems: "start", gap: "8px", cursor: "pointer", fontSize: "12px", color: "#374151" }}>
                      <input
                        type="checkbox"
                        checked={createForm.permissions[p.key] === true}
                        onChange={() => handleCreatePermissionToggle(p.key)}
                        style={{ marginTop: "2px" }}
                      />
                      <div>
                        <span style={{ fontWeight: 600 }}>{p.label}</span>
                        <div style={{ fontSize: "10px", color: "#6b7280" }}>{p.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "end", gap: "10px", marginTop: "8px" }}>
                <button type="button" onClick={() => setCreateModalOpen(false)} style={{ padding: "10px 16px", borderRadius: "8px", border: "1px solid #e5e7eb", background: "#fff", color: "#374151", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>Cancelar</button>
                <button type="submit" disabled={submitting} style={{ padding: "10px 20px", borderRadius: "8px", border: "none", background: "linear-gradient(135deg, #531575 0%, #6b1e96 100%)", color: "#c3ff00", fontSize: "12px", fontWeight: 700, cursor: submitting ? "not-allowed" : "pointer", opacity: submitting ? 0.7 : 1 }}>
                  {submitting ? "Creando..." : "Crear Usuario"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Gestionar Permisos ── */}
      {permissionsModalOpen && selectedUser && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px", background: "rgba(26,10,46,0.6)", backdropFilter: "blur(4px)" }}>
          <div style={{ background: "#fff", borderRadius: "20px", width: "100%", maxWidth: "520px", maxHeight: "90vh", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.15)", overflowY: "auto", border: "1px solid rgba(107,30,150,0.1)", display: "flex", flexDirection: "column" }}>
            <div style={{ background: "linear-gradient(135deg, #1a0a2e, #2d1248)", padding: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#fff" }}>Gestionar Permisos Granulares</h3>
                <p style={{ margin: "4px 0 0 0", fontSize: "11px", color: "rgba(255,255,255,0.6)" }}>{selectedUser.full_name || selectedUser.email} ({selectedUser.role?.toUpperCase()})</p>
              </div>
              <button onClick={() => setPermissionsModalOpen(false)} style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.6)", cursor: "pointer", fontSize: "22px", fontWeight: 300, lineHeight: 1 }}>&times;</button>
            </div>
            <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", border: "1.5px solid #e5e7eb", borderRadius: "8px", padding: "16px", background: "#f9fafb" }}>
                {PERMISSIONS_LIST.map(p => (
                  <label key={p.key} style={{ display: "flex", alignItems: "start", gap: "8px", cursor: "pointer", fontSize: "12px", color: "#374151" }}>
                    <input
                      type="checkbox"
                      checked={permissionsForm[p.key] === true}
                      onChange={() => handlePermissionToggle(p.key)}
                      style={{ marginTop: "2px" }}
                    />
                    <div>
                      <span style={{ fontWeight: 600 }}>{p.label}</span>
                      <div style={{ fontSize: "10px", color: "#6b7280" }}>{p.desc}</div>
                    </div>
                  </label>
                ))}
              </div>

              <div style={{ display: "flex", justifyContent: "end", gap: "10px" }}>
                <button type="button" onClick={() => setPermissionsModalOpen(false)} style={{ padding: "10px 16px", borderRadius: "8px", border: "1px solid #e5e7eb", background: "#fff", color: "#374151", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>Cancelar</button>
                <button onClick={handleUpdatePermissions} disabled={submitting} style={{ padding: "10px 20px", borderRadius: "8px", border: "none", background: "linear-gradient(135deg, #531575 0%, #6b1e96 100%)", color: "#c3ff00", fontSize: "12px", fontWeight: 700, cursor: submitting ? "not-allowed" : "pointer", opacity: submitting ? 0.7 : 1 }}>
                  {submitting ? "Guardando..." : "Guardar Cambios"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
