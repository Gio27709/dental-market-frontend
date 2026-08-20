import { useState, useEffect } from "react";
import { Outlet, Link, useLocation, Navigate } from "react-router-dom";
import StoreSidebar from "./StoreSidebar";
import NotificationBell from "../../notifications/NotificationBell";
import PanelNotificationBell from "../../notifications/PanelNotificationBell";
import toast from "react-hot-toast";
import { useStore } from "../../../context/StoreContext";
import { useAuth } from "../../../context/AuthContext";

export default function StoreLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const location = useLocation();
  const { storeProfile, fetchProfile, storeStats, fetchStoreStats } = useStore();
  const { user } = useAuth();

  // Solo hacer fetch cuando el usuario de auth esté disponible
  // Esto evita el race condition donde fetchProfile se ejecuta antes
  // de que la sesión de Supabase esté lista (causando 401)
  useEffect(() => {
    if (user) {
      fetchProfile().finally(() => setInitialLoad(false));
      fetchStoreStats();
    }
  }, [user, fetchProfile, fetchStoreStats]);

  // Refresh store stats on pathname change
  useEffect(() => {
    if (user) {
      fetchStoreStats();
    }
  }, [location.pathname, user, fetchStoreStats]);

  const getLinkNotificationCount = (path) => {
    if (!storeStats) return 0;
    switch (path) {
      case "/store/orders":
        return storeStats.pendingOrders;
      case "/store/penalties":
        return storeStats.pendingPenalties;
      default:
        return 0;
    }
  };


  const isProfileComplete = () => {
    if (!storeProfile) return false;
    
    const rif = storeProfile.rif || "";
    const phone = storeProfile.business_phone || "";
    const address = storeProfile.business_address || "";
    const state = storeProfile.state || "";

    return Boolean(
      rif.trim() !== "" && 
      phone.trim() !== "" && 
      address.trim() !== "" && 
      state.trim() !== ""
    );
  };

  const isComplete = storeProfile ? isProfileComplete() : false;

  const renderContent = () => {
    // Si el usuario es owner, mostrar la vista especial
    if (user?.role === "owner") {
      return (
        <div className="flex flex-col items-center justify-center h-[70vh] text-center px-4 animate-in fade-in zoom-in duration-300">
          <div className="w-24 h-24 bg-[#c3ff00]/10 rounded-full flex items-center justify-center mb-6 border-8 border-white shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-[#6b1e96]">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
            </svg>
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 mb-3 tracking-tight">Acceso de Propietario</h2>
          <p className="text-gray-500 max-w-md mx-auto text-lg mb-8 leading-relaxed">
            Las funciones operativas de la tienda están deshabilitadas para tu rol de <span className="font-semibold text-[#6b1e96]">Owner</span>. Para administrar la plataforma, dirígete al panel administrativo.
          </p>
          <Link
            to="/admin"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#6b1e96] hover:bg-[#531575] text-white font-bold rounded-xl shadow-lg shadow-[#6b1e96]/30 transition-all duration-200"
          >
            Ir al Panel Administrativo
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </div>
      );
    }

    // Solo mostrar spinner en la carga inicial — nunca más después
    if (initialLoad) {
      return (
        <div className="flex flex-col items-center justify-center h-64">
          <div className="w-10 h-10 border-4 border-[#6b1e96] border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-sm text-gray-500">Cargando datos de la tienda...</p>
        </div>
      );
    }

    // Si el fetch falló y no hay datos de perfil, mostrar error con botón de reintento
    if (!storeProfile) {
      return (
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'rgba(220,38,38,0.08)' }}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="#dc2626" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
            </svg>
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-gray-800">No se pudo cargar tu perfil</p>
            <p className="text-xs text-gray-500 mt-1">Verifica tu conexión a internet e intenta de nuevo.</p>
          </div>
          <button
            onClick={() => { setInitialLoad(true); fetchProfile().finally(() => setInitialLoad(false)); }}
            className="px-5 py-2 text-xs font-bold rounded-lg transition-all duration-200"
            style={{ background: 'linear-gradient(135deg, #531575, #6b1e96)', color: '#c3ff00' }}
          >
            Reintentar
          </button>
        </div>
      );
    }
    
    return (
      <>
        {!isComplete && (
          <div className="mb-6 p-4 rounded-xl flex items-start gap-4 shadow-sm" style={{ background: 'linear-gradient(135deg, #fffbeb, #fef3c7)', border: '1px solid #fde68a' }}>
            <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-amber-900 text-sm md:text-base">Acción Requerida: Completa tu Perfil</h3>
              <p className="text-xs md:text-sm text-amber-800 mt-1">
                Para poder subir productos, recibir órdenes y operar tu tienda libremente, primero debes completar los datos obligatorios de tu perfil (RIF, Teléfono y Dirección).
              </p>
            </div>
          </div>
        )}
        
        {/* Guard Navigation */}
        {!isComplete && location.pathname !== '/store/profile' ? (
          <Navigate to="/store/profile" replace />
        ) : (
          <Outlet />
        )}
      </>
    );
  };

  const isActive = (path) => {
    if (path === '/store') return location.pathname === '/store';
    return location.pathname.startsWith(path);
  };

  const handleComingSoon = (e) => {
    e.preventDefault();
    toast('Próximamente', { icon: '🚧' });
    setMobileOpen(false);
  };

  const navGroups = [
    {
      label: 'Principal',
      links: [
        { name: 'Resumen', path: '/store', icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" /></svg> },
        { name: 'Productos', path: '/store/products', icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H2.25c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" /></svg> },
        { name: 'Órdenes', path: '/store/orders', icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" /></svg> },
        { name: 'Mi Billetera', path: '/store/wallet', icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18-3a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6" /></svg> },
      ]
    },
    {
      label: 'Logística',
      links: [
        { name: 'Repartidores', path: '/store/riders', icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" /></svg> },
        { name: 'Sanciones', path: '/store/penalties', icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" /></svg> },
        { name: 'Mi Perfil', path: '/store/profile', icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" /></svg> },
      ]
    },
  ];

  const soonLinks = [
    { name: 'Clientes', icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg> },
    { name: 'Reportes', icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg> },
    { name: 'Descuentos', icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6Z" /></svg> },
    { name: 'Configuración', icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 0 1 0 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 0 1 0-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg> },
  ];

  return (
    <div className="flex min-h-screen relative" style={{ background: '#f1ecf6' }}>
      {/* Desktop Sidebar */}
      <StoreSidebar isProfileComplete={isComplete} />

      {/* Mobile Top Bar */}
      <div
        className="fixed top-0 left-0 right-0 z-[90] md:hidden text-white h-14 flex items-center justify-between px-4 shadow-lg"
        style={{ background: 'linear-gradient(135deg, #531575 0%, #6b1e96 100%)' }}
      >
        <button onClick={() => setMobileOpen(true)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </button>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-[#c3ff00] flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 text-[#531575]">
              <path d="M5.223 2.25h13.554a.75.75 0 0 1 .724.95l-.965 3.57a1.5 1.5 0 0 1-1.448 1.105H6.912a1.5 1.5 0 0 1-1.448-1.105l-.965-3.57a.75.75 0 0 1 .724-.95Z" />
              <path fillRule="evenodd" d="M3.087 9h17.826a.75.75 0 0 1 .743.858l-1.53 11.25a1.5 1.5 0 0 1-1.486 1.142H5.36a1.5 1.5 0 0 1-1.486-1.142L2.344 9.858A.75.75 0 0 1 3.087 9Z" clipRule="evenodd" />
            </svg>
          </div>
          <span className="font-bold text-sm tracking-widest uppercase flex items-center gap-1.5">
            Forcepx 
            <span className="font-normal text-[#c3ff00]/70 text-[10px] tracking-[0.15em]">Store</span>
            {storeProfile && (
              <span className={`w-1.5 h-1.5 rounded-full ${storeProfile.is_open ? "bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse" : "bg-red-500"}`} title={storeProfile.is_open ? "Tienda Abierta" : "Tienda Cerrada"} />
            )}
          </span>
        </div>
        <div className="flex items-center gap-3">
        <NotificationBell />
        <Link to="/" className="p-2 hover:bg-white/10 rounded-lg transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
          </svg>
        </Link>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[200] md:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div
            className="absolute left-0 top-0 h-full w-[280px] shadow-2xl flex flex-col"
            style={{ background: 'linear-gradient(180deg, #1a0a2e 0%, #2d1452 50%, #1a0a2e 100%)' }}
          >
            {/* Drawer Header */}
            <div className="h-14 flex items-center justify-between px-5" style={{ background: 'rgba(0,0,0,0.2)' }}>
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#c3ff00] flex items-center justify-center shadow-lg shadow-[#c3ff00]/20">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-[#531575]">
                    <path d="M5.223 2.25h13.554a.75.75 0 0 1 .724.95l-.965 3.57a1.5 1.5 0 0 1-1.448 1.105H6.912a1.5 1.5 0 0 1-1.448-1.105l-.965-3.57a.75.75 0 0 1 .724-.95Z" />
                    <path fillRule="evenodd" d="M3.087 9h17.826a.75.75 0 0 1 .743.858l-1.53 11.25a1.5 1.5 0 0 1-1.486 1.142H5.36a1.5 1.5 0 0 1-1.486-1.142L2.344 9.858A.75.75 0 0 1 3.087 9Z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold tracking-widest text-white uppercase leading-tight">Forcepx</span>
                  <span className="text-[9px] font-medium tracking-[0.15em] text-[#c3ff00]/60 uppercase flex items-center gap-1.5">
                    Store Panel
                    {storeProfile && (
                      <span className={`inline-flex items-center gap-1 text-[8px] font-bold px-1.5 py-0.2 rounded ${storeProfile.is_open ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-red-500/20 text-red-400 border border-red-500/30"}`}>
                        <span className={`w-1 h-1 rounded-full ${storeProfile.is_open ? "bg-emerald-400 animate-pulse" : "bg-red-400"}`} />
                        {storeProfile.is_open ? "Activo" : "Cerrado"}
                      </span>
                    )}
                  </span>
                </div>
              </div>
              <button onClick={() => setMobileOpen(false)} className="p-1.5 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mx-4 border-t border-white/[0.06]" />

            {/* Navigation (Grouped) */}
            <nav className="flex-1 overflow-y-auto py-3 px-2 admin-scrollbar">
              {navGroups.map((group, groupIndex) => (
                <div key={group.label}>
                  {groupIndex > 0 && (
                    <div className="mx-2 border-t border-white/[0.06] my-2" />
                  )}
                  <p className="px-4 pt-1 pb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white/25">
                    {group.label}
                  </p>
                  {group.links.map((link) => {
                    const active = isActive(link.path);
                    const pendingCount = getLinkNotificationCount(link.path);
                    return (
                      <Link
                        key={link.path}
                        to={!isComplete && link.path !== '/store/profile' ? '#' : link.path}
                        onClick={(e) => {
                          if (!isComplete && link.path !== '/store/profile') {
                            e.preventDefault();
                            toast.error("Debes completar tu perfil primero");
                            return;
                          }
                          setMobileOpen(false);
                        }}
                        className={`flex items-center justify-between gap-3 mx-1 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${!isComplete && link.path !== '/store/profile' ? 'opacity-50 cursor-not-allowed' : ''}`}
                        style={{
                          background: active
                            ? 'linear-gradient(135deg, rgba(195,255,0,0.12) 0%, rgba(107,30,150,0.2) 100%)'
                            : 'transparent',
                          color: active ? '#ffffff' : 'rgba(255,255,255,0.5)',
                          borderLeft: active ? '3px solid #c3ff00' : '3px solid transparent',
                        }}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex-shrink-0" style={{ color: active ? '#c3ff00' : 'rgba(255,255,255,0.3)' }}>
                            {link.icon}
                          </div>
                          <span className="truncate">{link.name}</span>
                        </div>

                        {/* Mobile Badge flame */}
                        {pendingCount > 0 && (
                          <span
                            className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black text-white border border-white/20 select-none z-10"
                            style={{
                              background: 'linear-gradient(135deg, #ff0055 0%, #ff5500 50%, #ffcc00 100%)',
                              boxShadow: '0 0 10px rgba(255, 69, 0, 0.85), inset 0 1px 2px rgba(255, 255, 255, 0.45)',
                              textShadow: '0 1px 1px rgba(0,0,0,0.6)',
                            }}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                              className="w-3 h-3 text-yellow-300 animate-bounce flex-shrink-0"
                            >
                              <path
                                fillRule="evenodd"
                                d="M12.969 2.138a1.5 1.5 0 0 0-1.938 0c-3.125 2.766-5.031 6.032-5.031 9.424 0 4.196 3.09 7.438 7.031 7.438s7.031-3.242 7.031-7.438c0-3.392-1.906-6.658-5.031-9.424ZM12 5.25c.342 0 .668.033.985.097a4.5 4.5 0 0 1 3.515 4.403c0 2.203-1.42 4.25-3.5 4.25s-3.5-2.047-3.5-4.25A4.5 4.5 0 0 1 12.015 5.25Z"
                                clipRule="evenodd"
                              />
                            </svg>
                            <span>{pendingCount}</span>
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              ))}

              {/* Próximamente */}
              <div className="mx-2 border-t border-white/[0.06] my-2" />
              <p className="px-4 pt-1 pb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white/20">
                Próximamente
              </p>
              {soonLinks.map((link) => (
                <a
                  key={link.name}
                  href="#"
                  onClick={handleComingSoon}
                  className="flex items-center gap-3 mx-1 px-4 py-2.5 rounded-xl text-sm transition-all duration-200 opacity-40 hover:opacity-60"
                  style={{ color: 'rgba(255,255,255,0.4)' }}
                >
                  <div className="flex-shrink-0" style={{ color: 'rgba(255,255,255,0.2)' }}>
                    {link.icon}
                  </div>
                  {link.name}
                  <span className="ml-auto text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-white/[0.06] text-white/30">
                    Soon
                  </span>
                </a>
              ))}
            </nav>

            {/* Back to Inicio */}
            <div className="border-t border-white/[0.06] p-3">
              <Link
                to="/"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-200"
                style={{ color: 'rgba(255,255,255,0.45)' }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 flex-shrink-0" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                </svg>
                Volver a Inicio
              </Link>
            </div>
          </div>
        </div>
      )}
      
      {/* Main Content */}
      {/* `min-w-0`: sin él, el min-width:auto del item flex deja que el contenido
          ancho (tablas) estire la página entera y anula los `overflow-x-auto`. */}
      <div className="flex-1 min-w-0 pt-14 md:pt-6 p-4 md:p-8" style={{ background: '#f1ecf6' }}>
        <div className="max-w-6xl mx-auto">
          {/* En escritorio no hay barra superior: la campana va sobre el contenido */}
          <PanelNotificationBell className="hidden md:flex mb-4" />
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
