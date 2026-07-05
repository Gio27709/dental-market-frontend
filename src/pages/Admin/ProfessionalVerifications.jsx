import { useState, useEffect, useMemo } from "react";
import toast from "react-hot-toast";
import { getAdminProfessionalLicensesAPI, verifyProfessionalLicenseAPI } from "../../services/api";

const getInitials = (name) => {
  if (!name) return "DP";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return parts[0][0].toUpperCase();
};

const getAvatarGradient = (userId) => {
  const gradients = [
    "from-purple-500 to-indigo-600",
    "from-blue-500 to-sky-600",
    "from-emerald-500 to-teal-600",
    "from-pink-500 to-rose-600",
    "from-amber-500 to-orange-600",
  ];
  let hash = 0;
  if (userId) {
    for (let i = 0; i < userId.length; i++) {
      hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    }
  }
  const index = Math.abs(hash) % gradients.length;
  return gradients[index];
};

export default function ProfessionalVerifications() {
  const [licenses, setLicenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all"); // all, pending, verified, rejected, no_document
  
  // Filtros Avanzados
  const [emailFilter, setEmailFilter] = useState("");
  const [licenseFilter, setLicenseFilter] = useState("");
  const [specialtyFilter, setSpecialtyFilter] = useState("all");
  
  const [stats, setStats] = useState({ total: 0, pending: 0, verified: 0, rejected: 0 });
  
  // Modales
  const [previewDoc, setPreviewDoc] = useState(null); // Contiene el perfil con signed_url a previsualizar
  const [approveModal, setApproveModal] = useState({ open: false, id: null, name: "" });
  const [rejectModal, setRejectModal] = useState({ open: false, id: null, name: "", notes: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchLicenses();
  }, []);

  const fetchLicenses = async () => {
    try {
      setLoading(true);
      const res = await getAdminProfessionalLicensesAPI();
      if (res.data && res.data.success) {
        setLicenses(res.data.data || []);
        if (res.data.stats) {
          setStats(res.data.stats);
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Error al cargar las solicitudes de profesionales dentales.");
    } finally {
      setLoading(false);
    }
  };

  const filteredLicenses = useMemo(() => {
    return licenses.filter((item) => {
      // 1. Filtro por búsqueda de texto global
      const term = searchTerm.toLowerCase();
      const name = (item.full_name || "").toLowerCase();
      const email = (item.email || "").toLowerCase();
      const licenseNum = (item.license_number || "").toLowerCase();
      const specialty = (item.specialty || "").toLowerCase();
      
      const matchesSearch = !searchTerm || 
        name.includes(term) || 
        email.includes(term) || 
        licenseNum.includes(term) || 
        specialty.includes(term);

      // 2. Filtro Avanzado por Correo Electrónico
      const matchesEmail = !emailFilter || email.includes(emailFilter.toLowerCase());

      // 3. Filtro Avanzado por Matrícula
      const matchesLicense = !licenseFilter || licenseNum.includes(licenseFilter.toLowerCase());

      // 4. Filtro por Especialidad / Profesión en la industria
      const matchesSpecialty = specialtyFilter === "all" || item.specialty === specialtyFilter;

      // 5. Filtro por Estado (Tab activa)
      let matchesTab = true;
      const hasDoc = !!item.license_image_url;
      const isVerified = item.is_verified === true;
      const isPending = item.is_verified === false && hasDoc && !item.license_reviewed_at;
      const isRejected = item.is_verified === false && hasDoc && !!item.license_reviewed_at;
      const noDoc = !hasDoc;

      if (activeTab === "pending") matchesTab = isPending;
      else if (activeTab === "verified") matchesTab = isVerified;
      else if (activeTab === "rejected") matchesTab = isRejected;
      else if (activeTab === "no_document") matchesTab = noDoc;

      return matchesSearch && matchesEmail && matchesLicense && matchesSpecialty && matchesTab;
    });
  }, [licenses, searchTerm, emailFilter, licenseFilter, specialtyFilter, activeTab]);

  const handleApprove = (id, name) => {
    setApproveModal({ open: true, id, name });
  };

  const confirmApprove = async () => {
    try {
      setSubmitting(true);
      const res = await verifyProfessionalLicenseAPI(approveModal.id, {
        is_verified: true,
      });

      if (res.data && res.data.success) {
        toast.success(`Odontólogo ${approveModal.name} verificado con éxito.`);
        setApproveModal({ open: false, id: null, name: "" });
        fetchLicenses();
      }
    } catch (err) {
      console.error(err);
      toast.error("Error al aprobar la verificación.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = (id, name) => {
    setRejectModal({ open: true, id, name, notes: "" });
  };

  const confirmReject = async () => {
    if (!rejectModal.notes.trim()) {
      toast.error("Debes ingresar un motivo para el rechazo.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await verifyProfessionalLicenseAPI(rejectModal.id, {
        is_verified: false,
        notes: rejectModal.notes,
      });

      if (res.data && res.data.success) {
        toast.success(`Solicitud de ${rejectModal.name} rechazada correctamente.`);
        setRejectModal({ open: false, id: null, name: "", notes: "" });
        fetchLicenses();
      }
    } catch (err) {
      console.error(err);
      toast.error("Error al rechazar la solicitud.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* ── ENCABEZADO ── */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Directorio de Profesionales Dentales</h1>
          <p className="text-gray-500 text-sm mt-0.5">Administra y valida los accesos de odontólogos en la plataforma.</p>
        </div>
      </div>

      {/* 📊 TARJETAS DE ESTADÍSTICAS PREMIUM */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Total */}
        <div 
          className="relative overflow-hidden rounded-2xl p-6 text-white shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
          style={{ background: 'linear-gradient(135deg, #531575 0%, #6b1e96 100%)' }}
        >
          <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-10 pointer-events-none" style={{ background: 'radial-gradient(circle, #c3ff00 0%, transparent 70%)', transform: 'translate(20%, -20%)' }} />
          <div className="relative z-10 flex items-start justify-between">
            <div className="space-y-1.5">
              <p className="text-xs font-bold text-white/70 uppercase tracking-wider">Total Registrados</p>
              <h3 className="text-4xl font-extrabold tracking-tight">{stats.total}</h3>
              <p className="text-[11px] text-white/50">Odontólogos en el sistema</p>
            </div>
            <div className="p-3 bg-white/10 text-[#c3ff00] rounded-xl shadow-inner backdrop-blur-sm">
              <span className="material-symbols-outlined text-[24px] block">groups</span>
            </div>
          </div>
        </div>

        {/* Card 2: Pendientes */}
        <div 
          className="relative overflow-hidden rounded-2xl p-6 text-white shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
          style={{ background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)' }}
        >
          <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-10 pointer-events-none" style={{ background: 'radial-gradient(circle, #ffffff 0%, transparent 70%)', transform: 'translate(20%, -20%)' }} />
          <div className="relative z-10 flex items-start justify-between">
            <div className="space-y-1.5">
              <p className="text-xs font-bold text-white/70 uppercase tracking-wider">Pendientes de Revisión</p>
              <div className="flex items-center gap-2">
                <h3 className="text-4xl font-extrabold tracking-tight">{stats.pending}</h3>
                {stats.pending > 0 && (
                  <span className="flex h-2.5 w-2.5 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                  </span>
                )}
              </div>
              <p className="text-[11px] text-white/50">Documentos por validar</p>
            </div>
            <div className="p-3 bg-white/10 text-blue-200 rounded-xl shadow-inner backdrop-blur-sm">
              <span className="material-symbols-outlined text-[24px] block">pending_actions</span>
            </div>
          </div>
        </div>

        {/* Card 3: Verificados */}
        <div 
          className="relative overflow-hidden rounded-2xl p-6 text-white shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
          style={{ background: 'linear-gradient(135deg, #0d5e3a 0%, #10b981 100%)' }}
        >
          <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-10 pointer-events-none" style={{ background: 'radial-gradient(circle, #c3ff00 0%, transparent 70%)', transform: 'translate(20%, -20%)' }} />
          <div className="relative z-10 flex items-start justify-between">
            <div className="space-y-1.5">
              <p className="text-xs font-bold text-white/70 uppercase tracking-wider">Verificados</p>
              <h3 className="text-4xl font-extrabold tracking-tight">{stats.verified}</h3>
              <p className="text-[11px] text-white/50">Cuentas con rol profesional</p>
            </div>
            <div className="p-3 bg-white/10 text-green-300 rounded-xl shadow-inner backdrop-blur-sm">
              <span className="material-symbols-outlined text-[24px] block">verified</span>
            </div>
          </div>
        </div>

        {/* Card 4: Rechazados */}
        <div 
          className="relative overflow-hidden rounded-2xl p-6 text-white shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
          style={{ background: 'linear-gradient(135deg, #9f1239 0%, #e11d48 100%)' }}
        >
          <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-10 pointer-events-none" style={{ background: 'radial-gradient(circle, #ffffff 0%, transparent 70%)', transform: 'translate(20%, -20%)' }} />
          <div className="relative z-10 flex items-start justify-between">
            <div className="space-y-1.5">
              <p className="text-xs font-bold text-white/70 uppercase tracking-wider">Rechazados</p>
              <h3 className="text-4xl font-extrabold tracking-tight">{stats.rejected}</h3>
              <p className="text-[11px] text-white/50">Correcciones solicitadas</p>
            </div>
            <div className="p-3 bg-white/10 text-rose-300 rounded-xl shadow-inner backdrop-blur-sm">
              <span className="material-symbols-outlined text-[24px] block">cancel</span>
            </div>
          </div>
        </div>
      </div>

      {/* 🔍 PANEL DE BÚSQUEDA Y FILTRADO PREMIUM */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-gray-50">
          <span className="material-symbols-outlined text-primary-600 font-semibold text-[22px]">search</span>
          <h3 className="font-bold text-gray-900 text-sm">Filtros de Búsqueda</h3>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Buscador Rápido (Nombre) */}
          <div className="relative">
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Nombre / Búsqueda</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-gray-400 text-[20px]">person</span>
              <input
                type="text"
                placeholder="Buscar por nombre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm text-gray-900 bg-gray-50/20"
              />
            </div>
          </div>

          {/* Campo Correo */}
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Correo Electrónico</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-gray-400 text-[20px]">mail</span>
              <input
                type="text"
                placeholder="ejemplo@correo.com"
                value={emailFilter}
                onChange={(e) => setEmailFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm text-gray-900 bg-gray-50/20"
              />
            </div>
          </div>

          {/* Campo Matrícula */}
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Matrícula / Licencia</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-gray-400 text-[20px]">badge</span>
              <input
                type="text"
                placeholder="Ej. 23432423"
                value={licenseFilter}
                onChange={(e) => setLicenseFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm text-gray-900 bg-gray-50/20"
              />
            </div>
          </div>

          {/* Campo Especialidad / Profesión */}
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Especialidad / Profesión</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-gray-400 text-[20px]">medical_services</span>
              <select
                value={specialtyFilter}
                onChange={(e) => setSpecialtyFilter(e.target.value)}
                className="w-full pl-10 pr-10 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm text-gray-900 bg-gray-50/20 appearance-none cursor-pointer"
              >
                <option value="all">Todas las Profesiones</option>
                <option value="Odontología General">Odontología General</option>
                <option value="Ortodoncia">Ortodoncia</option>
                <option value="Endodoncia">Endodoncia</option>
                <option value="Periodoncia">Periodoncia</option>
                <option value="Odontopediatría">Odontopediatría</option>
                <option value="Cirugía Maxilofacial">Cirugía Maxilofacial</option>
                <option value="Rehabilitación Oral">Rehabilitación Oral</option>
              </select>
              <span className="material-symbols-outlined absolute right-3 top-2.5 text-gray-400 pointer-events-none text-[20px]">keyboard_arrow_down</span>
            </div>
          </div>
        </div>

        {/* Limpiar Filtros */}
        {(searchTerm || emailFilter || licenseFilter || specialtyFilter !== "all") && (
          <div className="flex justify-end pt-1">
            <button
              onClick={() => {
                setSearchTerm("");
                setEmailFilter("");
                setLicenseFilter("");
                setSpecialtyFilter("all");
              }}
              className="text-xs font-bold text-primary-600 hover:text-primary-800 transition-colors flex items-center gap-1 hover:underline"
            >
              <span className="material-symbols-outlined text-[16px]">restart_alt</span>
              Limpiar Filtros Activos
            </button>
          </div>
        )}
      </div>

      {/* ── TABS DE ESTADOS DE VERIFICACIÓN (Control Segmentado) ── */}
      <div className="flex justify-start pt-2">
        <div className="bg-gray-100/80 p-1.5 rounded-2xl flex flex-wrap gap-1 border border-gray-200/50 backdrop-blur-sm shadow-inner">
          {[
            { key: "all", label: "Todos", count: stats.total },
            { key: "pending", label: "Pendientes", count: stats.pending, dot: stats.pending > 0 },
            { key: "verified", label: "Verificados", count: stats.verified },
            { key: "rejected", label: "Rechazados", count: stats.rejected },
            { key: "no_document", label: "Sin Licencia", count: stats.total - (stats.pending + stats.verified + stats.rejected) }
          ].map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all relative select-none ${
                  isActive
                    ? "bg-white text-primary-700 shadow-sm border border-gray-200/10"
                    : "text-gray-500 hover:text-gray-800 hover:bg-white/40 border border-transparent"
                }`}
              >
                <span>{tab.label}</span>
                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black transition-all ${
                  isActive 
                    ? "bg-primary-100 text-primary-800" 
                    : "bg-gray-200/60 text-gray-600"
                }`}>
                  {tab.count}
                </span>
                {tab.dot && (
                  <span className="absolute -top-1 -right-1 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── TABLA DE ODONTÓLOGOS (Card con Sombra Suave y Blur) ── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] bg-white border border-gray-100 rounded-2xl shadow-sm">
          <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-500 text-sm">Cargando profesionales...</p>
        </div>
      ) : filteredLicenses.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] bg-white border border-gray-100 rounded-2xl shadow-sm p-8 text-center">
          <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-4 text-gray-400">
            <span className="material-symbols-outlined text-[36px]">filter_list</span>
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">Sin coincidencias</h3>
          <p className="text-gray-500 text-sm max-w-sm">No se encontraron profesionales dentales con los filtros activos seleccionados.</p>
        </div>
      ) : (
        <div className="bg-white/90 backdrop-blur-md border border-gray-200/60 rounded-2xl shadow-md shadow-gray-100/40 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100 text-xs font-bold text-gray-400 uppercase tracking-wider">
                  <th className="px-6 py-4">Profesional</th>
                  <th className="px-6 py-4">Especialidad</th>
                  <th className="px-6 py-4">Matrícula</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4">Documento</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm text-gray-700 bg-white">
                {filteredLicenses.map((item) => {
                  const hasDoc = !!item.license_image_url;
                  const isVerified = item.is_verified === true;
                  const isPending = item.is_verified === false && hasDoc && !item.license_reviewed_at;
                  const isRejected = item.is_verified === false && hasDoc && !!item.license_reviewed_at;
                  const noDoc = !hasDoc;

                  return (
                    <tr key={item.id} className="hover:bg-primary-50/5 transition-colors">
                      {/* Avatar y Profesional */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${getAvatarGradient(item.id)} flex items-center justify-center text-white font-bold text-xs shadow-sm flex-shrink-0`}>
                            {getInitials(item.full_name)}
                          </div>
                          <div>
                            <div className="font-bold text-gray-900 text-sm tracking-tight">{item.full_name || "Sin nombre"}</div>
                            <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-1 font-medium">
                              <span className="material-symbols-outlined text-[14px] text-gray-400">mail</span>
                              <span>{item.email}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      
                      {/* Especialidad / Profesión en la Industria (Tag Premium) */}
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-indigo-50/50 text-indigo-700 border border-indigo-100/40 shadow-sm">
                          <span className="material-symbols-outlined text-[14px]">medical_services</span>
                          <span>{item.specialty || "General"}</span>
                        </span>
                      </td>
                      
                      {/* Matrícula (Tag Monospaciado con Icono) */}
                      <td className="px-6 py-4">
                        {item.license_number ? (
                          <span className="inline-flex items-center gap-1 font-mono font-bold text-xs bg-slate-50 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200/60 shadow-sm">
                            <span className="material-symbols-outlined text-[13px] text-slate-400">badge</span>
                            {item.license_number}
                          </span>
                        ) : (
                          <span className="text-gray-400 italic text-xs">No registrada</span>
                        )}
                      </td>

                      {/* Estado (Glow Badge) */}
                      <td className="px-6 py-4">
                        {isVerified && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-bold border border-green-200/60 shadow-sm shadow-green-100/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                            <span>Verificado</span>
                          </span>
                        )}
                        {isPending && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold border border-blue-200/60 shadow-sm shadow-blue-100/20 animate-pulse">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                            <span>Por Revisar</span>
                          </span>
                        )}
                        {isRejected && (
                          <span
                            title={item.license_review_notes ? `Motivo: ${item.license_review_notes}` : ""}
                            className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-700 rounded-full text-xs font-bold border border-red-200/60 shadow-sm shadow-red-100/20 cursor-help"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                            <span>Rechazado</span>
                          </span>
                        )}
                        {noDoc && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-50 text-gray-500 rounded-full text-xs font-bold border border-gray-200/60 shadow-sm shadow-gray-100/10">
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                            <span>Sin Licencia</span>
                          </span>
                        )}
                      </td>

                      {/* Documento (Boton Premium Glassmorphic) */}
                      <td className="px-6 py-4">
                        {item.signed_url ? (
                          <button
                            onClick={() => setPreviewDoc(item)}
                            className="inline-flex items-center gap-1.5 bg-primary-50 hover:bg-primary-600 text-primary-700 hover:text-white rounded-xl px-3 py-1.5 transition-all text-xs font-extrabold border border-primary-100/50 hover:border-transparent shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.98]"
                          >
                            <span className="material-symbols-outlined text-[16px]">visibility</span>
                            <span>Visualizar</span>
                          </button>
                        ) : (
                          <span className="text-gray-400 text-xs italic">Ninguno</span>
                        )}
                      </td>

                      {/* Acciones (Stripe Style) */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Botón de Aprobar */}
                          {!isVerified && (
                            <button
                              onClick={() => handleApprove(item.id, item.full_name)}
                              title="Aprobar Verificación"
                              className="w-9 h-9 rounded-xl bg-green-50 hover:bg-green-600 text-green-600 hover:text-white flex items-center justify-center transition-all duration-200 border border-green-100 hover:border-transparent shadow-sm hover:scale-105 active:scale-95 hover:shadow-green-200/50"
                            >
                              <span className="material-symbols-outlined text-[18px] font-bold">check</span>
                            </button>
                          )}

                          {/* Botón de Rechazar/Revocar */}
                          {(isVerified || isPending) && (
                            <button
                              onClick={() => handleReject(item.id, item.full_name)}
                              title={isVerified ? "Revocar Verificación" : "Rechazar Solicitud"}
                              className="w-9 h-9 rounded-xl bg-red-50 hover:bg-red-600 text-red-500 hover:text-white flex items-center justify-center transition-all duration-200 border border-red-100 hover:border-transparent shadow-sm hover:scale-105 active:scale-95 hover:shadow-red-200/50"
                            >
                              <span className="material-symbols-outlined text-[18px] font-bold">
                                {isVerified ? "remove_moderator" : "close"}
                              </span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── VISOR DE LICENCIAS MODAL (LIGHTBOX) ── */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col h-[85vh]">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-150 flex justify-between items-center bg-gray-50">
              <div>
                <h3 className="font-bold text-gray-900 text-base">Visualizando Licencia</h3>
                <p className="text-xs text-gray-500 mt-0.5">{previewDoc.full_name} | Matrícula: {previewDoc.license_number}</p>
              </div>
              <button
                onClick={() => setPreviewDoc(null)}
                className="p-1 hover:bg-gray-200 rounded-full text-gray-500 hover:text-gray-700 transition-colors"
              >
                <span className="material-symbols-outlined text-[24px]">close</span>
              </button>
            </div>

            {/* Viewer Content */}
            <div className="flex-1 bg-gray-100 p-4 flex items-center justify-center overflow-hidden">
              {previewDoc.license_image_url && previewDoc.license_image_url.toLowerCase().endsWith(".pdf") ? (
                <iframe
                  src={previewDoc.signed_url}
                  className="w-full h-full rounded-xl border border-gray-200"
                  title="Licencia PDF"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center overflow-auto p-2">
                  <img
                    src={previewDoc.signed_url}
                    alt="Documento Licencia"
                    className="max-w-full max-h-full object-contain rounded-lg shadow"
                  />
                </div>
              )}
            </div>

            {/* Footer con acciones adaptativas según el estado real */}
            <div className="px-6 py-4 border-t border-gray-150 flex justify-between items-center bg-gray-50">
              {/* Lado izquierdo: Descripción del estado actual */}
              <div>
                {previewDoc.is_verified === true ? (
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    <span className="text-xs font-bold text-green-700">Este profesional ya se encuentra verificado</span>
                  </div>
                ) : previewDoc.license_reviewed_at ? (
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500"></span>
                    <span className="text-xs font-bold text-red-700">Esta solicitud fue rechazada anteriormente</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                    <span className="text-xs font-bold text-blue-700">Solicitud pendiente de revisión</span>
                  </div>
                )}
              </div>

              {/* Lado derecho: Botones contextuales */}
              <div className="flex gap-2">
                {/* Botón de Rechazar/Revocar (solo si está verificado o pendiente) */}
                {(previewDoc.is_verified === true || (!previewDoc.is_verified && !previewDoc.license_reviewed_at)) && (
                  <button
                    onClick={() => {
                      handleReject(previewDoc.id, previewDoc.full_name);
                      setPreviewDoc(null);
                    }}
                    className="px-4 py-2 border border-red-200 hover:bg-red-50 text-red-700 font-semibold rounded-xl text-sm transition-colors"
                  >
                    {previewDoc.is_verified === true ? "Revocar Verificación" : "Rechazar"}
                  </button>
                )}

                {/* Botón de Aprobar (solo si NO está verificado) */}
                {previewDoc.is_verified !== true && (
                  <button
                    onClick={() => {
                      handleApprove(previewDoc.id, previewDoc.full_name);
                      setPreviewDoc(null);
                    }}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl text-sm transition-colors shadow-sm"
                  >
                    Aprobar
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL APROBACIÓN ── */}
      {approveModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Aprobar Verificación</h3>
            <p className="text-sm text-gray-600 mb-6">
              ¿Estás seguro de que deseas aprobar la matrícula profesional de <strong>{approveModal.name}</strong>? 
              Esto habilitará su perfil como odontólogo certificado en la plataforma de manera inmediata.
            </p>
            <div className="flex justify-end gap-3">
              <button
                disabled={submitting}
                onClick={() => setApproveModal({ open: false, id: null, name: "" })}
                className="px-4 py-2 text-sm font-semibold text-gray-500 hover:bg-gray-50 rounded-xl transition-colors border border-gray-200"
              >
                Cancelar
              </button>
              <button
                disabled={submitting}
                onClick={confirmApprove}
                className="px-4 py-2 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 rounded-xl shadow-sm transition-colors disabled:opacity-75"
              >
                {submitting ? "Aprobando..." : "Confirmar Aprobación"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL RECHAZO (Con notas obligatorias) ── */}
      {rejectModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Rechazar Verificación</h3>
            <p className="text-sm text-gray-600 mb-4">
              Por favor indica los motivos del rechazo para <strong>{rejectModal.name}</strong>. 
              Este mensaje será visible para el usuario para que pueda corregir el envío.
            </p>

            <textarea
              rows={4}
              value={rejectModal.notes}
              onChange={(e) => setRejectModal((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder="Ej. La imagen de la credencial no es legible, o el número de matrícula no coincide con el registro oficial..."
              className="w-full p-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-gray-900 bg-white mb-6 resize-none"
              required
            ></textarea>

            <div className="flex justify-end gap-3">
              <button
                disabled={submitting}
                onClick={() => setRejectModal({ open: false, id: null, name: "", notes: "" })}
                className="px-4 py-2 text-sm font-semibold text-gray-500 hover:bg-gray-50 rounded-xl transition-colors border border-gray-200"
              >
                Cancelar
              </button>
              <button
                disabled={submitting}
                onClick={confirmReject}
                className="px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-sm transition-colors disabled:opacity-75"
              >
                {submitting ? "Rechazando..." : "Confirmar Rechazo"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
