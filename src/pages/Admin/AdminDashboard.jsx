import { useAuth } from "../../context/AuthContext";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { getAdminStatsAPI } from "../../services/api";

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    pendingOrders: '--',
    pendingPayments: '--',
    totalProducts: '--',
    totalUsers: '--',
    activeStores: '--',
    monthlyRevenue: '--',
    completedOrders: '--',
    pendingTickets: '--',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await getAdminStatsAPI();
        if (response.data?.success) {
          setStats(response.data.data);
        }
      } catch (error) {
        console.error("Error fetching admin stats:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStats();
  }, []);

  // ── Primary Stat Cards (Row 1: Action-oriented) ──
  const primaryStatCards = [
    {
      title: 'Pedidos Pendientes',
      value: loading ? '...' : stats.pendingOrders,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
        </svg>
      ),
      gradient: 'linear-gradient(135deg, #531575 0%, #6b1e96 100%)',
      iconBg: 'rgba(195,255,0,0.15)',
      iconColor: '#c3ff00',
      link: '/admin/orders',
    },
    {
      title: 'Pagos por Aprobar',
      value: loading ? '...' : stats.pendingPayments,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
      ),
      gradient: 'linear-gradient(135deg, #0d5e3a 0%, #10b981 100%)',
      iconBg: 'rgba(195,255,0,0.2)',
      iconColor: '#c3ff00',
      link: '/admin/payment-approvals',
    },
    {
      title: 'Total de Productos',
      value: loading ? '...' : stats.totalProducts,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H2.25c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
        </svg>
      ),
      gradient: 'linear-gradient(135deg, #92400e 0%, #f59e0b 100%)',
      iconBg: 'rgba(255,255,255,0.2)',
      iconColor: '#ffffff',
      link: '/admin/product-moderation',
    },
    {
      title: 'Tickets de Soporte',
      value: loading ? '...' : stats.pendingTickets,
      icon: (
        <span className="material-symbols-outlined text-[24px]">support_agent</span>
      ),
      gradient: 'linear-gradient(135deg, #581c87 0%, #7c3aed 100%)',
      iconBg: 'rgba(255,255,255,0.2)',
      iconColor: '#ffffff',
      link: '/admin/support',
    },
  ];

  // ── Secondary Stat Cards (Row 2: Overview metrics) ──
  const secondaryStatCards = [
    {
      title: 'Total Usuarios',
      value: loading ? '...' : stats.totalUsers,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
        </svg>
      ),
      gradient: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
      iconBg: 'rgba(255,255,255,0.2)',
      iconColor: '#ffffff',
      link: '/admin/users',
    },
    {
      title: 'Tiendas Activas',
      value: loading ? '...' : stats.activeStores,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z" />
        </svg>
      ),
      gradient: 'linear-gradient(135deg, #4338ca 0%, #6366f1 100%)',
      iconBg: 'rgba(255,255,255,0.2)',
      iconColor: '#ffffff',
      link: '/admin/store-applications',
    },
    {
      title: 'Ingresos del Mes',
      value: loading ? '...' : `$${stats.monthlyRevenue}`,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" />
        </svg>
      ),
      gradient: 'linear-gradient(135deg, #065f46 0%, #10b981 100%)',
      iconBg: 'rgba(195,255,0,0.2)',
      iconColor: '#c3ff00',
      link: '/admin/payment-history',
    },
    {
      title: 'Pedidos Completados',
      value: loading ? '...' : stats.completedOrders,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
        </svg>
      ),
      gradient: 'linear-gradient(135deg, #1e293b 0%, #475569 100%)',
      iconBg: 'rgba(255,255,255,0.2)',
      iconColor: '#ffffff',
      link: '/admin/orders',
    },
  ];

  const quickActions = [
    {
      title: 'Aprobar Pagos',
      description: 'Revisar comprobantes pendientes',
      path: '/admin/payment-approvals',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
      ),
      color: '#10b981',
    },
    {
      title: 'Moderar Productos',
      description: 'Revisar productos pendientes',
      path: '/admin/product-moderation',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H2.25c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
        </svg>
      ),
      color: '#f59e0b',
    },
    {
      title: 'Gestión de Usuarios',
      description: 'Asignar roles y permisos',
      path: '/admin/users',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
        </svg>
      ),
      color: '#6b1e96',
    },
    {
      title: 'Tiendas y Solicitudes',
      description: 'Gestión y aprobaciones',
      path: '/admin/store-applications',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 16.875h3.375m0 0h3.375m-3.375 0V13.5m0 3.375v3.375M6 10.5h2.25a2.25 2.25 0 0 0 2.25-2.25V6a2.25 2.25 0 0 0-2.25-2.25H6A2.25 2.25 0 0 0 3.75 6v2.25A2.25 2.25 0 0 0 6 10.5Zm0 9.75h2.25A2.25 2.25 0 0 0 10.5 18v-2.25a2.25 2.25 0 0 0-2.25-2.25H6a2.25 2.25 0 0 0-2.25 2.25V18A2.25 2.25 0 0 0 6 20.25Zm9.75-9.75H18a2.25 2.25 0 0 0 2.25-2.25V6A2.25 2.25 0 0 0 18 3.75h-2.25A2.25 2.25 0 0 0 13.5 6v2.25a2.25 2.25 0 0 0 2.25 2.25Z" />
        </svg>
      ),
      color: '#8b5cf6',
    },
    {
      title: 'Soporte y Tickets',
      description: 'Atención a usuarios y soporte',
      path: '/admin/support',
      icon: (
        <span className="material-symbols-outlined text-[20px]">support_agent</span>
      ),
      color: '#7c3aed',
    },
    {
      title: 'Notificaciones',
      description: 'Enviar avisos a usuarios',
      path: '/admin/notifications',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
        </svg>
      ),
      color: '#3b82f6',
    },
    {
      title: 'Editar Home',
      description: 'Personalizar página principal',
      path: '/admin/home-content',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
        </svg>
      ),
      color: '#ec4899',
    },
    {
      title: 'Configuración',
      description: 'Ajustes de la plataforma',
      path: '/admin/settings',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.99l1.004.828c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
        </svg>
      ),
      color: '#64748b',
    },
  ];

  // Reusable stat card renderer
  const renderStatCard = (card, index) => (
    <Link
      key={index}
      to={card.link}
      className="group relative overflow-hidden rounded-2xl p-6 text-white transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
      style={{
        background: card.gradient,
        animationDelay: `${index * 100}ms`,
      }}
    >
      {/* Subtle shine effect */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%)' }} />

      <div className="relative z-10 flex items-start justify-between">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-white/70 mb-2">{card.title}</h3>
          <p className="text-4xl font-bold">{card.value}</p>
        </div>
        <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: card.iconBg, color: card.iconColor }}>
          {card.icon}
        </div>
      </div>

      {/* Bottom line accent */}
      <div className="absolute bottom-0 left-0 right-0 h-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: '#c3ff00' }} />
    </Link>
  );

  return (
    <div className="space-y-6">
      {/* ── Hero Welcome Card ── */}
      <div
        className="relative overflow-hidden rounded-2xl p-8 md:p-10"
        style={{ background: 'linear-gradient(135deg, #1a0a2e 0%, #531575 50%, #6b1e96 100%)' }}
      >
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-72 h-72 rounded-full opacity-10 pointer-events-none" style={{ background: 'radial-gradient(circle, #c3ff00 0%, transparent 70%)', transform: 'translate(30%, -30%)' }} />
        <div className="absolute bottom-0 left-1/2 w-40 h-40 rounded-full opacity-5 pointer-events-none" style={{ background: 'radial-gradient(circle, #c3ff00 0%, transparent 70%)', transform: 'translate(-50%, 50%)' }} />

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-[#c3ff00] shadow-[0_0_10px_rgba(195,255,0,0.5)]" />
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#c3ff00]/80">Panel Activo</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            Bienvenido, <span className="text-[#c3ff00]">{user?.firstName || 'Administrador'}</span>
          </h1>
          <p className="text-white/50 text-sm md:text-base max-w-lg leading-relaxed">
            Gestiona todas las operaciones de Forcepx desde aquí. Selecciona una opción del menú o usa los accesos rápidos.
          </p>
        </div>
      </div>

      {/* ── Primary Stat Cards (Action KPIs) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {primaryStatCards.map((card, index) => renderStatCard(card, index))}
      </div>

      {/* ── Secondary Stat Cards (Overview KPIs) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {secondaryStatCards.map((card, index) => renderStatCard(card, index + 3))}
      </div>

      {/* ── Quick Actions ── */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-lg font-bold text-gray-800">Accesos Rápidos</h2>
          <div className="flex-1 h-px bg-gray-200/80" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {quickActions.map((action, index) => (
            <Link
              key={index}
              to={action.path}
              className="group flex items-center gap-4 bg-white rounded-xl p-4 border border-gray-100 transition-all duration-200 hover:shadow-md hover:border-transparent hover:-translate-y-0.5"
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover:scale-110"
                style={{ background: `${action.color}15`, color: action.color }}
              >
                {action.icon}
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-gray-800 group-hover:text-gray-900">{action.title}</h3>
                <p className="text-xs text-gray-400 truncate">{action.description}</p>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-gray-300 ml-auto flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Platform Status ── */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.1)' }}>
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">Plataforma Operativa</p>
              <p className="text-[11px] text-gray-400">Todos los servicios funcionando correctamente</p>
            </div>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
            Online
          </span>
        </div>
      </div>
    </div>
  );
}
