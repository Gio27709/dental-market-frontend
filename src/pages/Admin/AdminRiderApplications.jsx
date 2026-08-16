import { useState, useEffect, useMemo } from "react";
import toast from "react-hot-toast";
import {
  getAdminRiderApplicationsAPI,
  approveRiderApplicationAPI,
  rejectRiderApplicationAPI,
  revokeRiderApplicationAPI,
} from "../../services/api";
import { useAdminStats } from "../../context/AdminStatsContext";
import {
  Bike,
  Car,
  Truck,
  MapPin,
  Phone,
  Mail,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Copy,
  Check,
  RotateCw,
  Eye,
  PhoneCall,
  Filter,
  Users,
  UserX,
  RotateCcw,
  AlertTriangle,
} from "lucide-react";

export default function AdminRiderApplications() {
  const { refreshStats } = useAdminStats();
  const [allApplications, setAllApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Tabs and Filters
  const [activeTab, setActiveTab] = useState("pending"); // "pending", "approved", "rejected", "all"
  const [searchTerm, setSearchTerm] = useState("");
  const [vehicleFilter, setVehicleFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  // Modals state
  const [approveModal, setApproveModal] = useState({ open: false, data: null });
  const [rejectModal, setRejectModal] = useState({ open: false, data: null });
  const [revokeModal, setRevokeModal] = useState({ open: false, data: null, reason: "" });
  const [detailModal, setDetailModal] = useState({ open: false, data: null });

  // Clipboard copy state
  const [copiedKey, setCopiedKey] = useState(null);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const res = await getAdminRiderApplicationsAPI();
      setAllApplications(res.data?.data || []);
    } catch (err) {
      toast.error("Error cargando solicitudes de repartidores: " + (err.message || ""));
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text, key) => {
    if (!text || text === "N/A" || text === "FALTAN DATOS") return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success("Copiado al portapapeles", { id: `copy-${key}`, duration: 1500 });
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleApprove = (app) => {
    setApproveModal({ open: true, data: app });
  };

  const confirmApprove = async () => {
    if (!approveModal.data) return;
    try {
      setActionLoading(true);
      const res = await approveRiderApplicationAPI(approveModal.data.id);
      toast.success(res.data?.message || "Repartidor certificado y aprobado con éxito");
      setApproveModal({ open: false, data: null });
      if (detailModal.open && detailModal.data?.id === approveModal.data.id) {
        setDetailModal({ open: false, data: null });
      }
      await fetchApplications();
      if (refreshStats) refreshStats();
    } catch (err) {
      toast.error("Error al aprobar repartidor: " + (err.message || ""));
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = (app) => {
    setRejectModal({ open: true, data: app });
  };

  const confirmReject = async () => {
    if (!rejectModal.data) return;
    try {
      setActionLoading(true);
      await rejectRiderApplicationAPI(rejectModal.data.id);
      toast.success("Solicitud rechazada correctamente");
      setRejectModal({ open: false, data: null });
      if (detailModal.open && detailModal.data?.id === rejectModal.data.id) {
        setDetailModal({ open: false, data: null });
      }
      await fetchApplications();
      if (refreshStats) refreshStats();
    } catch (err) {
      toast.error("Error al rechazar solicitud: " + (err.message || ""));
    } finally {
      setActionLoading(false);
    }
  };

  const handleRevoke = (app) => {
    setRevokeModal({ open: true, data: app, reason: "" });
  };

  const confirmRevoke = async () => {
    if (!revokeModal.data) return;
    try {
      setActionLoading(true);
      const res = await revokeRiderApplicationAPI(revokeModal.data.id, revokeModal.reason);
      toast.success(res.data?.message || "Rol de repartidor revocado exitosamente");
      setRevokeModal({ open: false, data: null, reason: "" });
      if (detailModal.open && detailModal.data?.id === revokeModal.data.id) {
        setDetailModal({ open: false, data: null });
      }
      await fetchApplications();
      if (refreshStats) refreshStats();
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || "Error al revocar repartidor");
    } finally {
      setActionLoading(false);
    }
  };

  // KPI Metrics Calculation
  const stats = useMemo(() => {
    const total = allApplications.length;
    const pending = allApplications.filter((a) => a.status === "pending").length;
    const approved = allApplications.filter((a) => a.status === "approved").length;
    const rejected = allApplications.filter((a) => a.status === "rejected").length;
    return { total, pending, approved, rejected };
  }, [allApplications]);

  // Filtering Logic
  const filteredData = useMemo(() => {
    return allApplications.filter((item) => {
      // Filter by Tab
      if (activeTab !== "all" && item.status !== activeTab) return false;

      // Filter by Vehicle Type
      if (vehicleFilter !== "all") {
        const v = (item.vehicle_type || "").toLowerCase();
        if (vehicleFilter === "moto" && !v.includes("moto")) return false;
        if (vehicleFilter === "carro" && !(v.includes("carro") || v.includes("auto"))) return false;
        if (vehicleFilter === "bici" && !v.includes("bici")) return false;
      }

      // Filter by Search Term (Name, Cedula, Email, Phone, City)
      if (searchTerm.trim()) {
        const lower = searchTerm.toLowerCase().trim();
        const nameMatch = item.full_name?.toLowerCase().includes(lower);
        const cedulaMatch = item.cedula?.toLowerCase().includes(lower);
        const emailMatch = item.users?.email?.toLowerCase().includes(lower);
        const phoneMatch =
          item.phone?.toLowerCase().includes(lower) ||
          item.contact_phone?.toLowerCase().includes(lower);
        const cityMatch = item.city?.toLowerCase().includes(lower);
        if (!nameMatch && !cedulaMatch && !emailMatch && !phoneMatch && !cityMatch) {
          return false;
        }
      }

      return true;
    });
  }, [allApplications, activeTab, vehicleFilter, searchTerm]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchTerm, vehicleFilter, perPage]);

  // Pagination Slice
  const totalPages = Math.max(1, Math.ceil(filteredData.length / perPage));
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * perPage;
    return filteredData.slice(start, start + perPage);
  }, [filteredData, currentPage, perPage]);

  // Helper: Avatar gradient based on id
  const getAvatarGradient = (id = "") => {
    const gradients = [
      "from-purple-600 to-indigo-600",
      "from-blue-600 to-cyan-600",
      "from-emerald-600 to-teal-600",
      "from-violet-600 to-fuchsia-600",
      "from-amber-600 to-orange-600",
      "from-rose-600 to-pink-600",
    ];
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    return gradients[Math.abs(hash) % gradients.length];
  };

  // Helper: Initials
  const getInitials = (name = "") => {
    if (!name) return "R";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Helper: Vehicle badge
  const getVehicleInfo = (vehicleType = "") => {
    const type = (vehicleType || "").toLowerCase();
    if (type.includes("moto") || type.includes("motocicleta")) {
      return {
        icon: Bike,
        label: "Moto",
        badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-200/60",
      };
    }
    if (type.includes("carro") || type.includes("auto") || type.includes("vehiculo") || type.includes("vehículo")) {
      return {
        icon: Car,
        label: "Carro",
        badgeColor: "bg-blue-50 text-blue-700 border-blue-200/60",
      };
    }
    if (type.includes("bici") || type.includes("bicicleta")) {
      return {
        icon: Bike,
        label: "Bicicleta",
        badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200/60",
      };
    }
    return {
      icon: Truck,
      label: vehicleType || "Vehículo",
      badgeColor: "bg-gray-100 text-gray-700 border-gray-200",
    };
  };

  // Helper: Date format
  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    try {
      return new Date(dateStr).toLocaleDateString("es-VE", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const hasActiveFilters = searchTerm !== "" || vehicleFilter !== "all";

  const clearFilters = () => {
    setSearchTerm("");
    setVehicleFilter("all");
  };

  return (
    <div className="space-y-6 pb-12">
      {/* ── Top Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-purple-100 text-purple-700 shadow-xs">
              <Bike className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">
              Gestión de Repartidores
            </h1>
          </div>
          <p className="text-gray-500 mt-1 text-sm">
            Controla y valida las solicitudes de ingreso de riders a la flota de entregas.
          </p>
        </div>

        <button
          onClick={fetchApplications}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 text-sm font-semibold rounded-xl border border-gray-200 shadow-xs transition-all hover:border-gray-300 active:scale-98 self-start sm:self-auto cursor-pointer"
        >
          <RotateCw className={`w-4 h-4 text-gray-500 ${loading ? "animate-spin" : ""}`} />
          <span>Actualizar</span>
        </button>
      </div>

      {/* ── KPI Metric Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total */}
        <div
          onClick={() => setActiveTab("all")}
          className={`relative overflow-hidden rounded-2xl p-5 text-white shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer ${
            activeTab === "all" ? "ring-2 ring-purple-600 ring-offset-2" : ""
          }`}
          style={{ background: "linear-gradient(135deg, #431407 0%, #6b1e96 100%)" }}
        >
          <div className="relative z-10 flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold text-white/70 uppercase tracking-wider">
                Total Solicitudes
              </p>
              <h3 className="text-3xl font-extrabold tracking-tight">{stats.total}</h3>
              <p className="text-[11px] text-white/60">Registros acumulados</p>
            </div>
            <div className="p-3 bg-white/10 text-white rounded-xl shadow-inner backdrop-blur-xs">
              <Users className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Card 2: Pendientes */}
        <div
          onClick={() => setActiveTab("pending")}
          className={`relative overflow-hidden rounded-2xl p-5 text-white shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer ${
            activeTab === "pending" ? "ring-2 ring-amber-500 ring-offset-2" : ""
          }`}
          style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)" }}
        >
          <div className="relative z-10 flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold text-white/70 uppercase tracking-wider">
                Por Evaluar
              </p>
              <div className="flex items-center gap-2">
                <h3 className="text-3xl font-extrabold tracking-tight">{stats.pending}</h3>
                {stats.pending > 0 && (
                  <span className="flex h-2.5 w-2.5 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-300"></span>
                  </span>
                )}
              </div>
              <p className="text-[11px] text-white/60">Requieren decisión</p>
            </div>
            <div className="p-3 bg-white/10 text-blue-200 rounded-xl shadow-inner backdrop-blur-xs">
              <Clock className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Card 3: Aprobados */}
        <div
          onClick={() => setActiveTab("approved")}
          className={`relative overflow-hidden rounded-2xl p-5 text-white shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer ${
            activeTab === "approved" ? "ring-2 ring-emerald-500 ring-offset-2" : ""
          }`}
          style={{ background: "linear-gradient(135deg, #065f46 0%, #10b981 100%)" }}
        >
          <div className="relative z-10 flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold text-white/70 uppercase tracking-wider">
                Riders Activos
              </p>
              <h3 className="text-3xl font-extrabold tracking-tight">{stats.approved}</h3>
              <p className="text-[11px] text-white/60">Flota certificada</p>
            </div>
            <div className="p-3 bg-white/10 text-emerald-200 rounded-xl shadow-inner backdrop-blur-xs">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Card 4: Rechazados */}
        <div
          onClick={() => setActiveTab("rejected")}
          className={`relative overflow-hidden rounded-2xl p-5 text-white shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer ${
            activeTab === "rejected" ? "ring-2 ring-rose-500 ring-offset-2" : ""
          }`}
          style={{ background: "linear-gradient(135deg, #881337 0%, #e11d48 100%)" }}
        >
          <div className="relative z-10 flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold text-white/70 uppercase tracking-wider">
                Rechazados
              </p>
              <h3 className="text-3xl font-extrabold tracking-tight">{stats.rejected}</h3>
              <p className="text-[11px] text-white/60">Solicitudes denegadas</p>
            </div>
            <div className="p-3 bg-white/10 text-rose-200 rounded-xl shadow-inner backdrop-blur-xs">
              <XCircle className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* ── Segmented Tabs Controls ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="bg-white/80 backdrop-blur-md p-1.5 rounded-2xl flex flex-wrap gap-1 border border-gray-200/80 shadow-xs">
          {[
            { key: "pending", label: "Pendientes", count: stats.pending, alert: stats.pending > 0 },
            { key: "approved", label: "Aprobados", count: stats.approved },
            { key: "rejected", label: "Rechazados", count: stats.rejected },
            { key: "all", label: "Todos", count: stats.total },
          ].map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all relative select-none cursor-pointer ${
                  isActive
                    ? "bg-purple-900 text-white shadow-sm"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100/70"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[11px] font-extrabold transition-all ${
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-gray-200/80 text-gray-700"
                  }`}
                >
                  {tab.count}
                </span>
                {tab.alert && (
                  <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* View density selector */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <span className="text-xs font-semibold text-gray-500">Mostrar:</span>
          <select
            value={perPage}
            onChange={(e) => setPerPage(Number(e.target.value))}
            className="text-xs font-medium border border-gray-200 rounded-xl px-3 py-1.5 text-gray-700 bg-white shadow-xs focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 cursor-pointer"
          >
            {[10, 25, 50, 100].map((n) => (
              <option key={n} value={n}>
                {n} filas
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Search and Advanced Filter Card ── */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-gray-200/70">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          {/* Main search bar */}
          <div className="sm:col-span-8 lg:col-span-8 relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por nombre, cédula, correo o teléfono..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 bg-gray-50/50 hover:bg-gray-50 focus:bg-white border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all shadow-inner"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                title="Limpiar búsqueda"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Vehicle Type Filter */}
          <div className="sm:col-span-4 lg:col-span-4 flex items-center gap-2">
            <div className="relative w-full">
              <Filter className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={vehicleFilter}
                onChange={(e) => setVehicleFilter(e.target.value)}
                className="w-full pl-9 pr-8 py-2.5 bg-gray-50/50 hover:bg-gray-50 focus:bg-white border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 cursor-pointer transition-all shadow-inner appearance-none"
              >
                <option value="all">Todos los vehículos</option>
                <option value="moto">🏍️ Moto</option>
                <option value="carro">🚗 Carro / Auto</option>
                <option value="bici">🚲 Bicicleta</option>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 text-xs">
                ▼
              </div>
            </div>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="px-3 py-2 text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl whitespace-nowrap transition-colors cursor-pointer"
                title="Restablecer filtros"
              >
                Limpiar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Data Table / Cards Content ── */}
      {loading ? (
        <div className="bg-white rounded-2xl p-8 border border-gray-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-gray-100 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/6"></div>
          </div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 py-3 animate-pulse">
              <div className="w-10 h-10 bg-gray-200 rounded-full flex-shrink-0"></div>
              <div className="flex-1 space-y-2">
                <div className="h-3.5 bg-gray-200 rounded w-1/3"></div>
                <div className="h-3 bg-gray-100 rounded w-1/4"></div>
              </div>
              <div className="h-4 bg-gray-200 rounded w-24"></div>
              <div className="h-4 bg-gray-200 rounded w-24"></div>
              <div className="h-8 bg-gray-200 rounded w-28"></div>
            </div>
          ))}
        </div>
      ) : filteredData.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-12 text-center">
          <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
            <Bike className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">Sin Solicitudes Encontradas</h3>
          <p className="text-gray-500 text-sm max-w-md mx-auto mb-4">
            {hasActiveFilters
              ? "No hay repartidores que coincidan con los filtros de búsqueda aplicados."
              : `No existen solicitudes en estado "${activeTab}" en este momento.`}
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-purple-100 hover:bg-purple-200 text-purple-800 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Limpiar Filtros de Búsqueda</span>
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
          {/* Desktop Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse hidden md:table">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-200/70 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  <th className="py-3.5 pl-6 pr-4">Repartidor</th>
                  <th className="py-3.5 px-4">Cédula & Contacto</th>
                  <th className="py-3.5 px-4">Ubicación & Vehículo</th>
                  <th className="py-3.5 px-4">Fecha Solicitud</th>
                  <th className="py-3.5 px-4">Estado</th>
                  <th className="py-3.5 pl-4 pr-6 text-right whitespace-nowrap">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm text-gray-700 bg-white">
                {paginatedData.map((app) => {
                  const vehicleInfo = getVehicleInfo(app.vehicle_type);
                  const VehicleIcon = vehicleInfo.icon;
                  const email = app.users?.email || "Sin correo";
                  const phone = app.phone || app.contact_phone || "Sin teléfono";

                  return (
                    <tr
                      key={app.id}
                      className="hover:bg-purple-50/20 transition-colors group"
                    >
                      {/* Repartidor Name & Avatar */}
                      <td className="py-3.5 pl-6 pr-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-xl bg-gradient-to-br ${getAvatarGradient(
                              app.id
                            )} flex items-center justify-center text-white font-bold text-xs shadow-xs flex-shrink-0`}
                          >
                            {getInitials(app.full_name)}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-gray-900 text-sm tracking-tight truncate flex items-center gap-1.5">
                              <span>{app.full_name || "Sin nombre"}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-0.5">
                              <Mail className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                              <span className="truncate max-w-[180px]">{email}</span>
                              {email !== "Sin correo" && (
                                <button
                                  onClick={() => handleCopy(email, `email-${app.id}`)}
                                  className="text-gray-400 hover:text-purple-600 p-0.5 rounded transition-colors cursor-pointer"
                                  title="Copiar correo"
                                >
                                  {copiedKey === `email-${app.id}` ? (
                                    <Check className="w-3 h-3 text-emerald-600" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Cédula & Teléfono */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-gray-100 text-gray-800 border border-gray-200">
                              {app.cedula || "N/A"}
                            </span>
                            {app.cedula && app.cedula !== "FALTAN DATOS" && (
                              <button
                                onClick={() => handleCopy(app.cedula, `cedula-${app.id}`)}
                                className="text-gray-400 hover:text-purple-600 p-0.5 rounded transition-colors cursor-pointer"
                                title="Copiar Cédula"
                              >
                                {copiedKey === `cedula-${app.id}` ? (
                                  <Check className="w-3 h-3 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-gray-500">
                            <Phone className="w-3.5 h-3.5 text-gray-400" />
                            <span>{phone}</span>
                            {phone !== "Sin teléfono" && phone !== "FALTAN DATOS" && (
                              <a
                                href={`tel:${phone}`}
                                className="text-purple-600 hover:text-purple-800 p-0.5 transition-colors"
                                title="Llamar"
                              >
                                <PhoneCall className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Ubicación & Vehículo */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-1 text-xs font-semibold text-gray-800">
                            <MapPin className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />
                            <span className="truncate max-w-[140px]">
                              {app.city || "No especificada"}
                            </span>
                          </div>
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-bold border ${vehicleInfo.badgeColor}`}
                          >
                            <VehicleIcon className="w-3 h-3" />
                            <span>{vehicleInfo.label}</span>
                          </span>
                        </div>
                      </td>

                      {/* Fecha de Registro */}
                      <td className="py-3.5 px-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          <span>{formatDate(app.created_at)}</span>
                        </div>
                      </td>

                      {/* Estado */}
                      <td className="py-3.5 px-4">
                        {app.status === "approved" ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Aprobado
                          </span>
                        ) : app.status === "rejected" ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            Rechazado
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                            Pendiente
                          </span>
                        )}
                      </td>

                      {/* Acciones Contextuales */}
                      <td className="py-3.5 pl-4 pr-6 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Ficha Button */}
                          <button
                            onClick={() => setDetailModal({ open: true, data: app })}
                            className="p-1.5 text-gray-400 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors cursor-pointer"
                            title="Ver Ficha Detallada"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* 1. Pendientes: Rechazar y Aprobar */}
                          {app.status === "pending" && (
                            <>
                              <button
                                onClick={() => handleReject(app)}
                                disabled={actionLoading}
                                className="px-3 py-1.5 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 hover:text-rose-700 rounded-xl border border-rose-200/60 transition-all active:scale-98 disabled:opacity-50 cursor-pointer"
                              >
                                Rechazar
                              </button>
                              <button
                                onClick={() => handleApprove(app)}
                                disabled={actionLoading}
                                className="px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs hover:shadow transition-all active:scale-98 disabled:opacity-50 flex items-center gap-1 cursor-pointer"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Aprobar</span>
                              </button>
                            </>
                          )}

                          {/* 2. Aprobados: Revocar Rider */}
                          {app.status === "approved" && (
                            <button
                              onClick={() => handleRevoke(app)}
                              disabled={actionLoading}
                              className="px-3 py-1.5 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 hover:text-rose-700 rounded-xl border border-rose-200/60 transition-all active:scale-98 disabled:opacity-50 flex items-center gap-1 cursor-pointer"
                              title="Revocar permisos de repartidor y devolver a usuario común"
                            >
                              <UserX className="w-3.5 h-3.5" />
                              <span>Revocar</span>
                            </button>
                          )}

                          {/* 3. Rechazados: Re-evaluar / Aprobar */}
                          {app.status === "rejected" && (
                            <button
                              onClick={() => handleApprove(app)}
                              disabled={actionLoading}
                              className="px-3 py-1.5 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-xl border border-purple-200/60 transition-all active:scale-98 disabled:opacity-50 flex items-center gap-1 cursor-pointer"
                              title="Re-evaluar y certificar como repartidor"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Re-aprobar</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Mobile Cards View */}
            <div className="grid grid-cols-1 gap-4 p-4 md:hidden">
              {paginatedData.map((app) => {
                const vehicleInfo = getVehicleInfo(app.vehicle_type);
                const VehicleIcon = vehicleInfo.icon;
                const email = app.users?.email || "Sin correo";
                const phone = app.phone || app.contact_phone || "Sin teléfono";

                return (
                  <div
                    key={app.id}
                    className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-xs space-y-3.5 relative"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-11 h-11 rounded-xl bg-gradient-to-br ${getAvatarGradient(
                            app.id
                          )} flex items-center justify-center text-white font-bold text-sm shadow-xs flex-shrink-0`}
                        >
                          {getInitials(app.full_name)}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-gray-900 text-sm truncate">
                            {app.full_name || "Sin nombre"}
                          </h4>
                          <p className="text-xs text-gray-500 truncate">{email}</p>
                        </div>
                      </div>

                      {/* Status badge */}
                      {app.status === "approved" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex-shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Aprobado
                        </span>
                      ) : app.status === "rejected" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 flex-shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                          Rechazado
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200 flex-shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                          Pendiente
                        </span>
                      )}
                    </div>

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-2 gap-2 text-xs bg-gray-50/70 p-3 rounded-xl border border-gray-100">
                      <div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase block">
                          Cédula
                        </span>
                        <span className="font-semibold text-gray-800">{app.cedula || "N/A"}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase block">
                          Teléfono
                        </span>
                        <span className="font-semibold text-gray-800">{phone}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase block">
                          Ubicación
                        </span>
                        <span className="font-semibold text-gray-800 truncate block">
                          {app.city || "N/A"}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase block">
                          Vehículo
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold border ${vehicleInfo.badgeColor}`}
                        >
                          <VehicleIcon className="w-3 h-3" />
                          {vehicleInfo.label}
                        </span>
                      </div>
                    </div>

                    {/* Mobile Actions */}
                    <div className="flex items-center justify-between gap-2 pt-1">
                      <button
                        onClick={() => setDetailModal({ open: true, data: app })}
                        className="px-3 py-2 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Ficha</span>
                      </button>

                      {app.status === "pending" && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleReject(app)}
                            disabled={actionLoading}
                            className="px-3 py-2 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl border border-rose-200/60 transition-colors disabled:opacity-50 cursor-pointer"
                          >
                            Rechazar
                          </button>
                          <button
                            onClick={() => handleApprove(app)}
                            disabled={actionLoading}
                            className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors disabled:opacity-50 flex items-center gap-1 cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Aprobar</span>
                          </button>
                        </div>
                      )}

                      {app.status === "approved" && (
                        <button
                          onClick={() => handleRevoke(app)}
                          disabled={actionLoading}
                          className="px-3 py-2 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl border border-rose-200/60 transition-colors disabled:opacity-50 flex items-center gap-1 cursor-pointer"
                        >
                          <UserX className="w-3.5 h-3.5" />
                          <span>Revocar Rider</span>
                        </button>
                      )}

                      {app.status === "rejected" && (
                        <button
                          onClick={() => handleApprove(app)}
                          disabled={actionLoading}
                          className="px-3 py-2 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-xl border border-purple-200/60 transition-colors disabled:opacity-50 flex items-center gap-1 cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Re-aprobar</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Pagination Bar ── */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 bg-gray-50/80 border-t border-gray-200/70">
            <span className="text-xs font-semibold text-gray-500">
              {filteredData.length === 0 ? (
                "0 resultados"
              ) : (
                <>
                  Mostrando{" "}
                  <span className="font-bold text-gray-800">
                    {(currentPage - 1) * perPage + 1}–
                    {Math.min(currentPage * perPage, filteredData.length)}
                  </span>{" "}
                  de <span className="font-bold text-gray-800">{filteredData.length}</span>{" "}
                  postulaciones
                </>
              )}
            </span>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-200/60 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                title="Primera página"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-200/60 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                title="Anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 py-1 text-xs font-bold text-gray-700 bg-white rounded-lg border border-gray-200 shadow-xs">
                Pág. {currentPage} de {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-200/60 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                title="Siguiente"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-200/60 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                title="Última página"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal de Aprobación de Repartidor ── */}
      {approveModal.open && approveModal.data && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100 transform transition-all">
            <div className="p-6">
              {/* Header Icon */}
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
                <CheckCircle2 className="w-7 h-7" />
              </div>

              <h3 className="text-xl font-extrabold text-center text-gray-900 mb-1">
                {approveModal.data.status === "rejected" ? "Re-aprobar Repartidor" : "Aprobar y Certificar Rider"}
              </h3>
              <p className="text-gray-500 text-center text-xs mb-5">
                Al confirmar, el usuario obtendrá permisos globales de Repartidor en la plataforma.
              </p>

              {/* Candidate Quick Dossier */}
              <div className="bg-emerald-50/60 border border-emerald-200/70 rounded-2xl p-4 mb-6 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-emerald-900">Postulante:</span>
                  <span className="font-bold text-gray-900">{approveModal.data.full_name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-emerald-900">Cédula:</span>
                  <span className="font-mono font-bold text-gray-800">{approveModal.data.cedula}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-emerald-900">Vehículo:</span>
                  <span className="font-bold text-gray-800 uppercase">{approveModal.data.vehicle_type}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-emerald-900">Ciudad:</span>
                  <span className="font-bold text-gray-800">{approveModal.data.city}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => setApproveModal({ open: false, data: null })}
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmApprove}
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {actionLoading ? (
                    <RotateCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  <span>Confirmar</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal de Rechazo de Solicitud ── */}
      {rejectModal.open && rejectModal.data && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100 transform transition-all">
            <div className="p-6">
              {/* Header Icon */}
              <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
                <XCircle className="w-7 h-7" />
              </div>

              <h3 className="text-xl font-extrabold text-center text-gray-900 mb-1">
                Rechazar Postulación
              </h3>
              <p className="text-gray-500 text-center text-xs mb-5">
                ¿Estás seguro que deseas denegar la postulación de este repartidor?
              </p>

              {/* Candidate Quick Dossier */}
              <div className="bg-rose-50/60 border border-rose-200/70 rounded-2xl p-4 mb-6 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-rose-900">Postulante:</span>
                  <span className="font-bold text-gray-900">{rejectModal.data.full_name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-rose-900">Cédula:</span>
                  <span className="font-mono font-bold text-gray-800">{rejectModal.data.cedula}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-rose-900">Ciudad:</span>
                  <span className="font-bold text-gray-800">{rejectModal.data.city}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => setRejectModal({ open: false, data: null })}
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmReject}
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {actionLoading ? (
                    <RotateCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <XCircle className="w-4 h-4" />
                  )}
                  <span>Rechazar</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal de Revocación de Repartidor ── */}
      {revokeModal.open && revokeModal.data && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100 transform transition-all">
            <div className="p-6">
              {/* Header Icon */}
              <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
                <AlertTriangle className="w-7 h-7" />
              </div>

              <h3 className="text-xl font-extrabold text-center text-gray-900 mb-1">
                Revocar Rol de Repartidor
              </h3>
              <p className="text-gray-500 text-center text-xs mb-5">
                Esta acción retirará de inmediato los permisos de repartidor y cancelará sus afiliaciones activas. El usuario volverá a ser un usuario común.
              </p>

              {/* Rider Info Preview */}
              <div className="bg-rose-50/60 border border-rose-200/70 rounded-2xl p-4 mb-4 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-rose-900">Repartidor:</span>
                  <span className="font-bold text-gray-900">{revokeModal.data.full_name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-rose-900">Correo:</span>
                  <span className="font-bold text-gray-800">{revokeModal.data.users?.email || "N/A"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-rose-900">Cédula:</span>
                  <span className="font-mono font-bold text-gray-800">{revokeModal.data.cedula}</span>
                </div>
              </div>

              {/* Optional Reason Field */}
              <div className="mb-5">
                <label className="block text-xs font-bold text-gray-600 mb-1.5">
                  Motivo de la Revocación (Opcional):
                </label>
                <textarea
                  rows={2}
                  placeholder="Ej. Incumplimiento de políticas, inactividad prolongada..."
                  value={revokeModal.reason}
                  onChange={(e) => setRevokeModal(prev => ({ ...prev, reason: e.target.value }))}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all bg-gray-50/50"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => setRevokeModal({ open: false, data: null, reason: "" })}
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmRevoke}
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {actionLoading ? (
                    <RotateCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <UserX className="w-4 h-4" />
                  )}
                  <span>Revocar</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal / Ficha Detallada del Postulante ── */}
      {detailModal.open && detailModal.data && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100 transform transition-all">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-purple-900/5 to-transparent">
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${getAvatarGradient(
                    detailModal.data.id
                  )} flex items-center justify-center text-white font-bold text-base shadow-sm`}
                >
                  {getInitials(detailModal.data.full_name)}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    {detailModal.data.full_name || "Sin nombre"}
                  </h3>
                  <p className="text-xs text-gray-500">Ficha de Postulación</p>
                </div>
              </div>
              <button
                onClick={() => setDetailModal({ open: false, data: null })}
                className="text-gray-400 hover:text-gray-600 p-2 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1">
                    Cédula / Documento
                  </span>
                  <div className="flex items-center justify-between font-bold text-gray-800">
                    <span>{detailModal.data.cedula || "N/A"}</span>
                    {detailModal.data.cedula && detailModal.data.cedula !== "FALTAN DATOS" && (
                      <button
                        onClick={() => handleCopy(detailModal.data.cedula, "m-cedula")}
                        className="text-gray-400 hover:text-purple-600"
                        title="Copiar"
                      >
                        {copiedKey === "m-cedula" ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1">
                    Teléfono
                  </span>
                  <div className="flex items-center justify-between font-bold text-gray-800">
                    <span>{detailModal.data.phone || detailModal.data.contact_phone || "N/A"}</span>
                    {detailModal.data.phone && detailModal.data.phone !== "FALTAN DATOS" && (
                      <a
                        href={`tel:${detailModal.data.phone}`}
                        className="text-purple-600 hover:text-purple-800"
                        title="Llamar"
                      >
                        <PhoneCall className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>

                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1">
                    Correo Electrónico
                  </span>
                  <div className="flex items-center justify-between font-bold text-gray-800 truncate">
                    <span className="truncate">{detailModal.data.users?.email || "N/A"}</span>
                    {detailModal.data.users?.email && (
                      <button
                        onClick={() => handleCopy(detailModal.data.users?.email, "m-email")}
                        className="text-gray-400 hover:text-purple-600 flex-shrink-0 ml-1"
                        title="Copiar"
                      >
                        {copiedKey === "m-email" ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1">
                    Ciudad / Ubicación
                  </span>
                  <span className="font-bold text-gray-800">{detailModal.data.city || "N/A"}</span>
                </div>

                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1">
                    Tipo de Vehículo
                  </span>
                  <span className="font-bold text-gray-800 uppercase">
                    {detailModal.data.vehicle_type || "N/A"}
                  </span>
                </div>

                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1">
                    Fecha de Registro
                  </span>
                  <span className="font-bold text-gray-800">
                    {formatDate(detailModal.data.created_at)}
                  </span>
                </div>
              </div>

              {/* Status Banner */}
              <div className="p-4 rounded-2xl border flex items-center justify-between bg-gray-50/80 border-gray-200/70">
                <span className="text-xs font-semibold text-gray-600">Estado Actual:</span>
                {detailModal.data.status === "approved" ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Aprobado (Rider Activo)
                  </span>
                ) : detailModal.data.status === "rejected" ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-extrabold bg-rose-50 text-rose-700 border border-rose-200">
                    <XCircle className="w-3.5 h-3.5" />
                    Rechazado / Revocado
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-extrabold bg-amber-50 text-amber-800 border border-amber-200">
                    <Clock className="w-3.5 h-3.5" />
                    Pendiente de Revisión
                  </span>
                )}
              </div>
            </div>

            {/* Modal Footer with Actions */}
            <div className="p-4 bg-gray-50/80 border-t border-gray-100 flex items-center justify-between gap-3">
              <button
                onClick={() => setDetailModal({ open: false, data: null })}
                className="px-4 py-2 text-xs font-bold text-gray-600 hover:text-gray-800 transition-colors cursor-pointer"
              >
                Cerrar
              </button>

              <div className="flex items-center gap-2">
                {detailModal.data.status === "pending" && (
                  <>
                    <button
                      onClick={() => {
                        const d = detailModal.data;
                        setDetailModal({ open: false, data: null });
                        handleReject(d);
                      }}
                      className="px-4 py-2 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors cursor-pointer"
                    >
                      Rechazar
                    </button>
                    <button
                      onClick={() => {
                        const d = detailModal.data;
                        setDetailModal({ open: false, data: null });
                        handleApprove(d);
                      }}
                      className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors shadow-xs flex items-center gap-1 cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Aprobar Rider</span>
                    </button>
                  </>
                )}

                {detailModal.data.status === "approved" && (
                  <button
                    onClick={() => {
                      const d = detailModal.data;
                      setDetailModal({ open: false, data: null });
                      handleRevoke(d);
                    }}
                    className="px-4 py-2 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <UserX className="w-3.5 h-3.5" />
                    <span>Revocar Repartidor</span>
                  </button>
                )}

                {detailModal.data.status === "rejected" && (
                  <button
                    onClick={() => {
                      const d = detailModal.data;
                      setDetailModal({ open: false, data: null });
                      handleApprove(d);
                    }}
                    className="px-4 py-2 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Re-aprobar Repartidor</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
