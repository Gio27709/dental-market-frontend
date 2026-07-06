import { Outlet, Link, useLocation } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { useCart } from "../../../context/CartContext";

export default function AccountLayout() {
  const { user, logout } = useAuth();
  const { wipeLocalCartOnly } = useCart();
  const location = useLocation();

  if (!user) return null;

  const isActive = (path) => {
    if (path === "/account" && location.pathname === "/account") return true;
    if (path !== "/account" && location.pathname.startsWith(path)) return true;
    return false;
  };

  const baseMenuItems = [
    {
      name: "Mi Perfil",
      path: "/account",
      icon: "person",
    },
    {
      name: "Mis Pedidos",
      path: "/account/orders",
      icon: "shopping_bag",
    },
    {
      name: "Descargas",
      path: "/account/downloads",
      icon: "download",
    },
    {
      name: "Favoritos",
      path: "/account/favorites",
      icon: "favorite",
    },
    {
      name: "Notificaciones",
      path: "/account/notifications",
      icon: "notifications",
    },
    {
      name: "Direcciones",
      path: "/account/addresses",
      icon: "location_on",
    },
    {
      name: "Métodos de Pago",
      path: "/account/payment-methods",
      icon: "credit_card",
    },
    {
      name: "Reseñas",
      path: "/account/reviews",
      icon: "star_rate",
    },
    {
      name: "Mis Publicaciones",
      path: "/account/posts",
      icon: "article",
    },
    {
      name: "Contraseña",
      path: "/account/password",
      icon: "lock",
    },
    {
      name: "Soporte",
      path: "/account/support",
      icon: "help",
    },
  ];

  // Filtrar baseMenuItems para mostrar Métodos de Pago sólo a roles con billetera (tiendas, admin, repartidores)
  const isWalletRole = ["store", "store/owner", "delivery", "admin", "owner"].includes(user.role);
  const filteredBaseMenuItems = baseMenuItems.filter(item => {
    if (item.path === "/account/payment-methods") {
      return isWalletRole;
    }
    return true;
  });

  // Inyectar dinámicamente la pestaña de verificación para Odontólogos
  const menuItems = [...filteredBaseMenuItems];
  if (user.role === "professional") {
    menuItems.splice(1, 0, {
      name: "Verificación Profesional",
      path: "/account/professional-verification",
      icon: "verified",
    });
  }

  return (
    <div className="min-h-screen" style={{ background: "#f1ecf6" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row gap-8">
        {/* ── Sidebar Premium ── */}
        <aside className="w-full md:w-64 flex-shrink-0">
          <div className="rounded-2xl overflow-hidden" style={{ background: "#ffffff", boxShadow: "0 4px 24px rgba(107,30,150,0.06)" }}>
            {/* User Header */}
            <div className="px-6 py-5" style={{ background: "linear-gradient(135deg, #6b1e96 0%, #531575 100%)" }}>
              <div className="flex items-center gap-3">
                {user.avatarUrl ? (
                  <>
                    <img 
                      src={user.avatarUrl} 
                      alt="Avatar" 
                      className="w-12 h-12 flex-shrink-0 rounded-full object-cover" 
                      style={{ border: "2px solid rgba(195,255,0,0.4)" }} 
                      onError={(e) => {
                        e.target.style.display = 'none';
                        if (e.target.nextSibling) {
                          e.target.nextSibling.style.display = 'flex';
                        }
                      }}
                    />
                    <div className="w-12 h-12 flex-shrink-0 rounded-full items-center justify-center text-lg font-bold" style={{ background: "#c3ff00", color: "#531575", display: "none" }}>
                      {user.firstName ? user.firstName.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                    </div>
                  </>
                ) : (
                  <div className="w-12 h-12 flex-shrink-0 rounded-full flex items-center justify-center text-lg font-bold" style={{ background: "#c3ff00", color: "#531575" }}>
                    {user.firstName ? user.firstName.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h2 className="text-base font-bold text-white leading-tight truncate">
                    {user.firstName ? `${user.firstName} ${user.lastName || ""}` : "Usuario"}
                  </h2>
                  <p className="text-xs text-white/70 mt-0.5">
                    {user.role === 'user' ? 'Usuario' : user.role === 'delivery' ? 'Repartidor 🛵' : user.role === 'admin' ? 'Administrador' : user.role === 'owner' ? 'Owner 👑' : user.role === 'professional' ? 'Odontólogo 🦷' : (user.role === 'store' || user.role === 'store/owner') ? 'Tienda' : user.role}
                  </p>
                </div>
              </div>

              {/* Logout Button inside header */}
              <button
                onClick={async () => {
                  await logout();
                  wipeLocalCartOnly();
                  localStorage.removeItem("forcepx_cart");
                  window.location.href = "/login";
                }}
                className="mt-5 w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer"
                style={{ background: "#ef4444", color: "#ffffff" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#dc2626";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#ef4444";
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>logout</span>
                Cerrar Sesión
              </button>
            </div>

            {/* Navigation */}
            <nav className="p-3 space-y-1">
              
              {/* Rutas Store / Owner (Very Top Priority) */}
              {(user.role === "store" || user.role === "store/owner") && (
                <>
                  <div className="pb-1 mx-4">
                    <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#727785" }}>
                      Mi Tienda
                    </span>
                  </div>
                  <Link
                    to="/store"
                    className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl text-sm font-bold text-white shadow-lg shadow-[#6b1e96]/30 hover:shadow-[#6b1e96]/40 transition-all duration-300 transform hover:-translate-y-0.5 mb-2"
                    style={{ background: "linear-gradient(135deg, #6b1e96 0%, #531575 100%)" }}
                  >
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined" style={{ fontSize: "20px", color: "#c3ff00" }}>
                        storefront
                      </span>
                      Panel Tienda
                    </div>
                    <span className="material-symbols-outlined text-[16px] text-white/50">open_in_new</span>
                  </Link>
                </>
              )}

              {/* Rutas Delivery (Rider App) */}
              {user.role === "delivery" && (
                <>
                  <div className="pb-1 mx-4">
                    <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#727785" }}>
                      App Rider
                    </span>
                  </div>
                  <Link
                    to="/delivery"
                    className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl text-sm font-bold text-white shadow-lg shadow-[#6b1e96]/30 hover:shadow-[#6b1e96]/40 transition-all duration-300 transform hover:-translate-y-0.5 mb-2"
                    style={{ background: "linear-gradient(135deg, #6b1e96 0%, #531575 100%)" }}
                  >
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined" style={{ fontSize: "20px", color: "#c3ff00" }}>
                        two_wheeler
                      </span>
                      Panel Repartidor
                    </div>
                    <span className="material-symbols-outlined text-[16px] text-white/50">open_in_new</span>
                  </Link>
                </>
              )}

              {/* Rutas Admin (Very Top Priority) */}
              {(user.role === "admin" || user.role === "owner") && (
                <>
                  <div className="pb-1 mx-4">
                    <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#727785" }}>
                      Administración
                    </span>
                  </div>
                  <Link
                    to="/admin"
                    className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl text-sm font-bold text-white shadow-lg shadow-[#6b1e96]/30 hover:shadow-[#6b1e96]/40 transition-all duration-300 transform hover:-translate-y-0.5 mb-2"
                    style={{ background: "linear-gradient(135deg, #6b1e96 0%, #531575 100%)" }}
                  >
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined" style={{ fontSize: "20px", color: "#c3ff00" }}>
                        admin_panel_settings
                      </span>
                      Panel Admin
                    </div>
                    <span className="material-symbols-outlined text-[16px] text-white/50">open_in_new</span>
                  </Link>
                </>
              )}

              {/* Separator for regular account items if special roles exist */}
              {(user.role === "store" || user.role === "owner" || user.role === "store/owner" || user.role === "admin") && (
                <div className="pt-3 pb-1 mx-4 border-t border-dashed border-[rgba(207,194,213,0.3)]">
                  <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#727785" }}>
                    Mi Cuenta
                  </span>
                </div>
              )}

              {/* Primary Active Items */}
              {menuItems.filter((item) => !item.disabled).map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium ${
                    isActive(item.path)
                      ? "text-[#6b1e96] font-semibold"
                      : "text-gray-600 hover:text-[#6b1e96] hover:bg-gray-50"
                  }`}
                  style={isActive(item.path) ? { background: "#f3e8ff" } : {}}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: "20px", color: isActive(item.path) ? "#6b1e96" : "#9ca3af" }}
                  >
                    {item.icon}
                  </span>
                  {item.name}
                </Link>
              ))}



              {/* Logout removed from here, now in header */}
            </nav>
          </div>
        </aside>

        {/* ── Main Content Area ── */}
        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
