import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import PropTypes from "prop-types";
import toast from "react-hot-toast";
import {
  getAdminStoreApplicationsAPI,
  approveStoreApplicationAPI,
  rejectStoreApplicationAPI,
  deleteStoreApplicationAPI,
  bulkDeleteStoreApplicationsAPI,
  getStoreDetailsAPI,
  suspendStoreAPI,
  reactivateStoreAPI,
  revokeStoreAPI,
} from "../../services/api";
import StoreDetailSlideOver from "../../components/admin/StoreDetailSlideOver";
import ApplicationReviewSlideOver from "../../components/admin/ApplicationReviewSlideOver";
import { useAdminStats } from "../../context/AdminStatsContext";

const PAGE_SIZES = [10, 25, 50, 100];

// El backend rechaza los lotes de más de 100 (bulkDeleteApplications). Se avisa
// aquí antes de enviar, en vez de dejar que devuelva un 400.
const MAX_BULK = 100;

const TABS = [
  { key: "all", label: "Todas" },
  { key: "pending", label: "Pendientes" },
  { key: "approved", label: "Operativas" },
  { key: "rejected", label: "Rechazadas" },
];

// `store_profiles` no tiene columna `id`: su clave primaria es `user_id`. Sin esto,
// en la pestaña Operativas todas las filas valen `undefined` y el menú de acciones
// se abre en todas a la vez (undefined === undefined).
const rowKey = (row) => row.id || row.user_id;

const fmtDate = (iso) =>
  new Date(iso).toLocaleDateString("es-VE", { day: "2-digit", month: "short", year: "numeric" });

const Pill = ({ tone, children }) => (
  <span
    className={`inline-flex items-center gap-1.5 text-xs font-medium whitespace-nowrap ${tone.cls}`}
  >
    <span className={`w-1.5 h-1.5 rounded-full ${tone.dot}`} />
    {children}
  </span>
);

Pill.propTypes = {
  tone: PropTypes.shape({ cls: PropTypes.string, dot: PropTypes.string }).isRequired,
  children: PropTypes.node.isRequired,
};

const TONES = {
  pending: { cls: "text-amber-700", dot: "bg-amber-500" },
  active: { cls: "text-emerald-700", dot: "bg-emerald-500" },
  suspended: { cls: "text-amber-700", dot: "bg-amber-500" },
  rejected: { cls: "text-slate-400", dot: "bg-slate-300" },
};

// Paleta estable por nombre: la misma tienda conserva siempre su color.
const AVATAR_TINTS = [
  "bg-violet-100 text-violet-700",
  "bg-sky-100 text-sky-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
  "bg-indigo-100 text-indigo-700",
];

const Avatar = ({ name, src }) => {
  const label = (name || "?").trim().charAt(0).toUpperCase();
  const tint = AVATAR_TINTS[(name || "").length % AVATAR_TINTS.length];
  return src ? (
    <img
      src={src}
      alt=""
      className="w-9 h-9 shrink-0 rounded-full object-cover ring-1 ring-slate-900/5"
    />
  ) : (
    <span
      className={`w-9 h-9 shrink-0 rounded-full flex items-center justify-center text-sm font-semibold ${tint}`}
    >
      {label}
    </span>
  );
};

Avatar.propTypes = {
  name: PropTypes.string,
  src: PropTypes.string,
};

export default function StoreApplications() {
  const { refreshStats } = useAdminStats();

  // Deep link desde notificaciones: `?id=<solicitud>` o `?store=<user_id de la tienda>`.
  // El endpoint hace la búsqueda puntual y devuelve la fila con la forma del listado
  // (si la solicitud ya fue aprobada, devuelve la tienda operativa).
  const [searchParams, setSearchParams] = useSearchParams();
  const deepLinkId = searchParams.get("id");
  const deepLinkStore = searchParams.get("store");
  const deepLinkHandled = useRef(false);

  const latestRequest = useRef(0);
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [counts, setCounts] = useState({ all: 0, pending: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const [approveModal, setApproveModal] = useState({ open: false, id: null, name: "" });
  const [rejectModal, setRejectModal] = useState({ open: false, id: null, name: "" });
  const [deleteModal, setDeleteModal] = useState({ open: false, id: null, name: "" });
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkDeleteModal, setBulkDeleteModal] = useState(false);

  const [openDropdown, setOpenDropdown] = useState(null);
  // Posición del menú ⋯ en coordenadas de viewport: la tarjeta de la tabla tiene
  // overflow-hidden y un menú `absolute` se recorta cuando hay pocas filas.
  const [dropdownPos, setDropdownPos] = useState(null);
  const [slideOverStore, setSlideOverStore] = useState(null);
  const [reviewApp, setReviewApp] = useState(null);
  const [suspendModal, setSuspendModal] = useState({ open: false, store: null });
  const [reactivateModal, setReactivateModal] = useState({ open: false, store: null });
  const [revokeModal, setRevokeModal] = useState({ open: false, store: null });
  const [suspendReason, setSuspendReason] = useState("");
  const [revokeReason, setRevokeReason] = useState("");
  // Estado de la tienda leído justo antes de suspender o revocar: el backend
  // devuelve 409 si hay pedidos pendientes o saldo, así que se consulta primero.
  const [storeCheck, setStoreCheck] = useState({ loading: false, pendingItems: 0, balance: 0 });

  const hasFilters = Boolean(searchTerm || startDate || endDate);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm.trim()), 350);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const fetchData = useCallback(async () => {
    // Cada pestaña tarda distinto (Operativas ~1.2s, Pendientes ~0.8s). Sin este
    // contador, cambiar de pestaña rápido deja que la respuesta lenta pise a la
    // buena y acabas viendo las tiendas operativas bajo la pestaña de pendientes.
    const requestId = ++latestRequest.current;
    try {
      setLoading(true);
      const res = await getAdminStoreApplicationsAPI({
        tab: activeTab,
        search: debouncedSearch || undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        limit: perPage,
        offset: (page - 1) * perPage,
      });
      if (requestId !== latestRequest.current) return;
      setRows(res.data?.data || []);
      setTotal(res.data?.count || 0);
      setCounts(res.data?.counts || { all: 0, pending: 0, approved: 0, rejected: 0 });
    } catch (err) {
      if (requestId !== latestRequest.current) return;
      toast.error("Error cargando tiendas y solicitudes: " + (err.message || ""));
    } finally {
      if (requestId === latestRequest.current) setLoading(false);
    }
  }, [activeTab, debouncedSearch, startDate, endDate, page, perPage]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Cualquier cambio de filtro invalida la página en la que estabas.
  useEffect(() => {
    setPage(1);
  }, [activeTab, debouncedSearch, startDate, endDate, perPage]);

  // Las filas de la pestaña anterior no pueden seguir en pantalla mientras carga la
  // nueva: aunque la pastilla ya se pinta por fila (`row_status`), dejarlas visibles
  // mientras llega la pestaña nueva confunde sobre qué se está mirando.
  useEffect(() => {
    setRows([]);
    setTotal(0);
  }, [activeTab]);

  useEffect(() => {
    setSelectedIds(new Set());
  }, [activeTab]);

  // Se aplica una sola vez, cuando termina la primera carga; después se limpia el
  // param para que un refetch o un F5 no vuelvan a abrir el detalle.
  useEffect(() => {
    if (deepLinkHandled.current) return;
    if (!deepLinkId && !deepLinkStore) return;
    deepLinkHandled.current = true;
    setSearchParams({}, { replace: true });

    (async () => {
      try {
        const res = await getAdminStoreApplicationsAPI(
          deepLinkId ? { id: deepLinkId } : { store: deepLinkStore },
        );
        const row = res.data?.data?.[0];
        if (!row) toast.error("No se encontró el elemento indicado");
        else if (row.row_status === "approved") setSlideOverStore(row);
        else setReviewApp(row);
      } catch {
        toast.error("No se encontró el elemento indicado");
      }
    })();
  }, [deepLinkId, deepLinkStore, setSearchParams]);

  const totalPages = Math.max(1, Math.ceil(total / perPage));

  // ── Acciones sobre solicitudes ──
  const confirmApprove = async () => {
    try {
      setLoading(true);
      setApproveModal({ open: false, id: null, name: "" });
      setReviewApp(null);
      const res = await approveStoreApplicationAPI(approveModal.id);
      toast.success(res.data?.message || "Tienda aprobada con éxito");
      fetchData();
      refreshStats();
    } catch (err) {
      toast.error(err.response?.data?.error || "Error al aprobar");
      setLoading(false);
    }
  };

  const confirmReject = async () => {
    try {
      setLoading(true);
      setRejectModal({ open: false, id: null, name: "" });
      setReviewApp(null);
      await rejectStoreApplicationAPI(rejectModal.id);
      toast.success("Solicitud rechazada");
      fetchData();
      refreshStats();
    } catch (err) {
      toast.error(err.response?.data?.error || "Error al rechazar");
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    try {
      setLoading(true);
      await deleteStoreApplicationAPI(deleteModal.id);
      toast.success("Solicitud eliminada. El usuario podrá aplicar de nuevo.");
      setDeleteModal({ open: false, id: null, name: "" });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || "Error al eliminar");
      setLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    try {
      setLoading(true);
      setBulkDeleteModal(false);
      const res = await bulkDeleteStoreApplicationsAPI(Array.from(selectedIds));
      toast.success(res.data?.message || "Solicitudes eliminadas");
      setSelectedIds(new Set());
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || "Error al eliminar en masa");
      setLoading(false);
    }
  };

  // ── Moderación de tiendas ──
  const openStoreAction = async (kind, store) => {
    setOpenDropdown(null);
    if (kind === "suspend") setSuspendModal({ open: true, store });
    if (kind === "revoke") setRevokeModal({ open: true, store });
    setStoreCheck({ loading: true, pendingItems: 0, balance: 0 });
    try {
      const res = await getStoreDetailsAPI(store.user_id);
      const d = res.data?.data;
      setStoreCheck({
        loading: false,
        pendingItems: d?.metrics?.pendingOrderItems || 0,
        balance: (d?.wallet?.balance_available || 0) + (d?.wallet?.balance_pending || 0),
      });
    } catch {
      // Si no se puede comprobar, no se bloquea: el backend sigue siendo el que decide.
      setStoreCheck({ loading: false, pendingItems: 0, balance: 0 });
    }
  };

  const handleSuspend = async () => {
    try {
      setLoading(true);
      const store = suspendModal.store;
      setSuspendModal({ open: false, store: null });
      const res = await suspendStoreAPI(store.user_id, suspendReason);
      toast.success(res.data?.message || "Tienda suspendida");
      setSuspendReason("");
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || "Error al suspender");
      setLoading(false);
    }
  };

  const handleReactivate = async () => {
    try {
      setLoading(true);
      const store = reactivateModal.store;
      setReactivateModal({ open: false, store: null });
      const res = await reactivateStoreAPI(store.user_id);
      toast.success(res.data?.message || "Tienda reactivada");
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || "Error al reactivar");
      setLoading(false);
    }
  };

  const handleRevoke = async () => {
    try {
      setLoading(true);
      const store = revokeModal.store;
      setRevokeModal({ open: false, store: null });
      const res = await revokeStoreAPI(store.user_id, revokeReason);
      toast.success(res.data?.message || "Tienda revocada");
      setRevokeReason("");
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || "Error al revocar");
      setLoading(false);
    }
  };

  // ── Selección ──
  const toggleSelect = (id) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const pageAllSelected = rows.length > 0 && rows.every((r) => selectedIds.has(rowKey(r)));

  const toggleSelectPage = () =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      rows.forEach((r) => (pageAllSelected ? next.delete(rowKey(r)) : next.add(rowKey(r))));
      return next;
    });

  const clearFilters = () => {
    setSearchTerm("");
    setStartDate("");
    setEndDate("");
  };

  const rowActions = (app) => {
    if (app.row_status === "pending") {
      return (
        <div className="flex justify-end gap-1.5">
          <button
            onClick={() => setReviewApp(app)}
            className="px-2.5 py-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md text-[13px] font-medium transition-colors"
          >
            Revisar
          </button>
          <button
            onClick={() => setRejectModal({ open: true, id: app.id, name: app.business_name })}
            className="px-2.5 py-1 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-md text-[13px] font-medium transition-colors"
          >
            Rechazar
          </button>
          <button
            onClick={() => setApproveModal({ open: true, id: app.id, name: app.business_name })}
            className="px-2.5 py-1 text-white bg-slate-900 hover:bg-[#6b1e96] rounded-md text-[13px] font-medium transition-colors"
          >
            Aprobar
          </button>
        </div>
      );
    }

    return (
      <div className="flex justify-end">
        <div className="relative">
          <button
            onClick={(e) => {
              if (openDropdown === rowKey(app)) {
                setOpenDropdown(null);
                return;
              }
              const r = e.currentTarget.getBoundingClientRect();
              const spaceBelow = window.innerHeight - r.bottom;
              setDropdownPos(
                spaceBelow < 260
                  ? { bottom: window.innerHeight - r.top + 4, right: window.innerWidth - r.right }
                  : { top: r.bottom + 4, right: window.innerWidth - r.right },
              );
              setOpenDropdown(rowKey(app));
            }}
            aria-label="Acciones"
            className={`p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-all [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:focus-visible:opacity-100 ${
              openDropdown === rowKey(app) ? "[@media(hover:hover)]:opacity-100 bg-slate-100 text-slate-900" : ""
            }`}
          >
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 6.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 12.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 18.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Z"
              />
            </svg>
          </button>
          {openDropdown === rowKey(app) && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setOpenDropdown(null)}
                onWheel={() => setOpenDropdown(null)}
              />
              <div
                className="fixed z-50 w-52 bg-white rounded-xl shadow-lg shadow-slate-900/10 ring-1 ring-slate-900/5 py-1.5"
                style={dropdownPos || undefined}
              >
                {app.row_status === "approved" ? (
                  <>
                    <button
                      onClick={() => {
                        setOpenDropdown(null);
                        setSlideOverStore(app);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      Ver detalles
                    </button>
                    <a
                      href={`/store/${app.user_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setOpenDropdown(null)}
                      className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      Ver pública
                    </a>
                    <div className="border-t border-slate-100 my-1" />
                    {app.is_suspended ? (
                      <button
                        onClick={() => {
                          setOpenDropdown(null);
                          setReactivateModal({ open: true, store: app });
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-green-600 hover:bg-green-50 transition-colors"
                      >
                        Reactivar
                      </button>
                    ) : (
                      <button
                        onClick={() => openStoreAction("suspend", app)}
                        className="w-full text-left px-4 py-2 text-sm text-amber-600 hover:bg-amber-50 transition-colors"
                      >
                        Suspender
                      </button>
                    )}
                    <button
                      onClick={() => openStoreAction("revoke", app)}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      Revocar tienda
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        setOpenDropdown(null);
                        setReviewApp(app);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      Ver detalles
                    </button>
                    <button
                      onClick={() => {
                        setOpenDropdown(null);
                        setApproveModal({ open: true, id: app.id, name: app.business_name });
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-[#6b1e96] hover:bg-[#6b1e96]/5 font-medium transition-colors"
                    >
                      Aprobar (hacer tienda)
                    </button>
                    <div className="border-t border-slate-100 my-1" />
                    <button
                      onClick={() => {
                        setOpenDropdown(null);
                        setDeleteModal({ open: true, id: app.id, name: app.business_name });
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      Eliminar solicitud
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  // El estado sale de la propia fila (`row_status`, que pone el backend) y no de la
  // pestaña: en "Todas" conviven solicitudes y tiendas operativas en la misma tabla.
  const statusPill = (app) => {
    if (app.row_status === "pending") return <Pill tone={TONES.pending}>Pendiente</Pill>;
    if (app.row_status === "rejected") return <Pill tone={TONES.rejected}>Rechazada</Pill>;
    return app.is_suspended ? (
      <Pill tone={TONES.suspended}>Suspendida</Pill>
    ) : (
      <Pill tone={TONES.active}>Activa</Pill>
    );
  };

  return (
    <div className="p-4 md:p-6 space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-semibold text-slate-900 tracking-tight">Tiendas y solicitudes</h1>
          <p className="text-slate-500 mt-0.5 text-sm">
            Filtra, administra y audita el estado de todos los comercios afiliados a Forcepx.
          </p>
        </div>

        {/* Control segmentado: la pastilla activa flota sobre una pista gris. */}
        <div className="inline-flex items-center gap-0.5 p-0.5 rounded-lg bg-slate-100 overflow-x-auto hide-scrollbar">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`whitespace-nowrap px-3 py-1.5 rounded-[7px] text-[13px] font-medium transition-all ${
                activeTab === t.key
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {t.label}
              <span
                className={`ml-1.5 tabular-nums text-xs ${
                  activeTab === t.key ? "text-[#6b1e96]" : "text-slate-400"
                }`}
              >
                {counts[t.key]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Tabla, con su barra de filtros integrada en la misma tarjeta ── */}
      <div className="bg-white rounded-xl ring-1 ring-slate-900/[0.07] shadow-sm shadow-slate-900/[0.03] overflow-hidden relative">
        <div className="flex flex-wrap items-center gap-2 px-4 py-3">
          <div className="relative flex-1 min-w-[220px]">
            <svg
              className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
              />
            </svg>
            <input
              type="text"
              placeholder="Buscar por nombre, RIF o código…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 ring-1 ring-transparent focus:outline-none focus:bg-white focus:ring-slate-900/10 transition-colors"
            />
          </div>

          {[
            ["Desde", startDate, setStartDate],
            ["Hasta", endDate, setEndDate],
          ].map(([label, value, setter]) => (
            <div
              key={label}
              className="flex items-center gap-1.5 bg-slate-50 rounded-lg pl-2.5 pr-1 ring-1 ring-transparent focus-within:bg-white focus-within:ring-slate-900/10 transition-colors"
            >
              <span className="text-xs text-slate-400">{label}</span>
              <input
                type="date"
                value={value}
                onChange={(e) => setter(e.target.value)}
                className="text-sm py-1.5 pr-1 text-slate-700 bg-transparent border-0 focus:outline-none"
              />
            </div>
          ))}

          {hasFilters && (
            <button
              onClick={clearFilters}
              className="px-2.5 py-1.5 text-sm font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Limpiar
            </button>
          )}
        </div>

        {loading && (
          <div className="h-px bg-[#6b1e96]/10 overflow-hidden">
            <div className="h-full w-1/3 bg-[#6b1e96] animate-pulse" />
          </div>
        )}

        {loading && rows.length === 0 ? (
          <div className="py-20 flex justify-center">
            <div className="animate-spin rounded-full h-7 w-7 border-2 border-slate-200 border-t-[#6b1e96]" />
          </div>
        ) : rows.length === 0 ? (
          <div className="py-16 px-6 text-center border-t border-slate-100">
            <h3 className="text-sm font-semibold text-slate-900 mb-1">
              {hasFilters ? "Sin resultados" : "Nada por aquí"}
            </h3>
            <p className="text-slate-500 text-sm">
              {hasFilters
                ? "Ninguna tienda coincide con los filtros aplicados."
                : activeTab === "all"
                  ? "Todavía no hay tiendas ni solicitudes registradas."
                  : `No hay registros en "${TABS.find((t) => t.key === activeTab)?.label}".`}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse hidden md:table">
                <thead>
                  <tr className="border-y border-slate-100">
                    {activeTab === "rejected" && (
                      <th className="pl-4 pr-2 py-2 w-10">
                        <input
                          type="checkbox"
                          checked={pageAllSelected}
                          onChange={toggleSelectPage}
                          title="Seleccionar las solicitudes de esta página"
                          className="w-3.5 h-3.5 rounded border-slate-300 text-[#6b1e96] focus:ring-[#6b1e96]/30 cursor-pointer"
                        />
                      </th>
                    )}
                    {["Tienda", "Titular", "Registro", "Estado"].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-2 text-[11px] font-medium text-slate-400 uppercase tracking-wider"
                      >
                        {h}
                      </th>
                    ))}
                    <th className="px-4 py-2 w-px" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((app) => (
                    <tr
                      key={rowKey(app)}
                      className={`group transition-colors ${
                        selectedIds.has(rowKey(app)) ? "bg-[#6b1e96]/[0.04]" : "hover:bg-slate-50/70"
                      }`}
                    >
                      {activeTab === "rejected" && (
                        <td className="pl-4 pr-2 py-3 w-10">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(rowKey(app))}
                            onChange={() => toggleSelect(rowKey(app))}
                            className="w-3.5 h-3.5 rounded border-slate-300 text-[#6b1e96] focus:ring-[#6b1e96]/30 cursor-pointer"
                          />
                        </td>
                      )}
                      <td className="px-4 py-3 align-middle">
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar name={app.business_name} src={app.logo_url} />
                          <div className="min-w-0">
                            <span
                              className="block text-[13.5px] font-medium text-slate-900 truncate max-w-[280px]"
                              title={app.business_address || undefined}
                            >
                              {app.business_name}
                            </span>
                            <span className="block text-xs text-slate-400 truncate max-w-[280px]">
                              {app.store_code && (
                                <span className="text-[#6b1e96]/70 font-medium">#{app.store_code} · </span>
                              )}
                              {app.rif}
                              {app.business_phone && ` · ${app.business_phone}`}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <span className="block text-[13.5px] text-slate-700 truncate max-w-[200px]">
                          {app.users?.full_name || "N/A"}
                        </span>
                        <span className="block text-xs text-slate-400 truncate max-w-[200px]">
                          {app.users?.email || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 align-middle text-[13.5px] text-slate-500 whitespace-nowrap tabular-nums">
                        {fmtDate(app.created_at)}
                      </td>
                      <td className="px-4 py-3 align-middle">{statusPill(app)}</td>
                      <td className="px-4 py-3 align-middle">{rowActions(app)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Vista responsiva de tarjetas en móvil */}
              <div className="grid grid-cols-1 gap-3 p-4 md:hidden">
                {rows.map((app) => (
                  <div
                    key={rowKey(app)}
                    className={`rounded-xl ring-1 p-4 transition-all ${
                      selectedIds.has(rowKey(app))
                        ? "ring-[#6b1e96]/40 bg-[#6b1e96]/[0.03]"
                        : "ring-slate-900/[0.07]"
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {activeTab === "rejected" && (
                          <input
                            type="checkbox"
                            checked={selectedIds.has(rowKey(app))}
                            onChange={() => toggleSelect(rowKey(app))}
                            className="w-3.5 h-3.5 shrink-0 rounded border-slate-300 text-[#6b1e96] focus:ring-[#6b1e96]/30"
                          />
                        )}
                        <Avatar name={app.business_name} src={app.logo_url} />
                        <span className="font-medium text-slate-900 truncate">{app.business_name}</span>
                      </div>
                      {statusPill(app)}
                    </div>

                    <div className="mt-3 space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-3">
                      {[
                        ["Dirección", app.business_address || "Sin dirección"],
                        ["RIF / Tlf", `${app.rif} · ${app.business_phone || "—"}`],
                        ["Titular", app.users?.full_name || "N/A"],
                        ["Email", app.users?.email || "—"],
                        ["Registro", fmtDate(app.created_at)],
                      ].map(([label, val]) => (
                        <div key={label} className="flex gap-2">
                          <span className="text-slate-400 min-w-[70px] shrink-0">{label}</span>
                          <span className="min-w-0 break-words">{val}</span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-3 border-t border-slate-100 pt-3 flex items-center gap-2">
                      {app.row_status === "pending" && (
                        <>
                          <button
                            onClick={() => setReviewApp(app)}
                            className="flex-1 py-2 bg-slate-100 text-slate-700 rounded-lg text-xs font-medium"
                          >
                            Revisar
                          </button>
                          <button
                            onClick={() => setRejectModal({ open: true, id: app.id, name: app.business_name })}
                            className="flex-1 py-2 text-red-600 bg-red-50 rounded-lg text-xs font-medium"
                          >
                            Rechazar
                          </button>
                          <button
                            onClick={() => setApproveModal({ open: true, id: app.id, name: app.business_name })}
                            className="flex-1 py-2 text-white bg-slate-900 rounded-lg text-xs font-medium"
                          >
                            Aprobar
                          </button>
                        </>
                      )}
                      {app.row_status === "approved" && (
                        <>
                          <button
                            onClick={() => setSlideOverStore(app)}
                            className="flex-1 py-2 bg-slate-100 text-slate-700 rounded-lg text-xs font-medium"
                          >
                            Detalles
                          </button>
                          {app.is_suspended ? (
                            <button
                              onClick={() => setReactivateModal({ open: true, store: app })}
                              className="flex-1 py-2 text-emerald-600 bg-emerald-50 rounded-lg text-xs font-medium"
                            >
                              Reactivar
                            </button>
                          ) : (
                            <button
                              onClick={() => openStoreAction("suspend", app)}
                              className="flex-1 py-2 text-amber-600 bg-amber-50 rounded-lg text-xs font-medium"
                            >
                              Suspender
                            </button>
                          )}
                          <button
                            onClick={() => openStoreAction("revoke", app)}
                            className="flex-1 py-2 text-red-600 bg-red-50 rounded-lg text-xs font-medium"
                          >
                            Revocar
                          </button>
                        </>
                      )}
                      {app.row_status === "rejected" && (
                        <>
                          <button
                            onClick={() => setReviewApp(app)}
                            className="flex-1 py-2 bg-slate-100 text-slate-700 rounded-lg text-xs font-medium"
                          >
                            Detalles
                          </button>
                          <button
                            onClick={() => setApproveModal({ open: true, id: app.id, name: app.business_name })}
                            className="flex-1 py-2 text-[#6b1e96] bg-[#6b1e96]/10 rounded-lg text-xs font-medium"
                          >
                            Aprobar
                          </button>
                          <button
                            onClick={() => setDeleteModal({ open: true, id: app.id, name: app.business_name })}
                            className="flex-1 py-2 text-red-600 bg-red-50 rounded-lg text-xs font-medium"
                          >
                            Eliminar
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Paginación ── */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-2.5 border-t border-slate-100">
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-1.5 text-xs text-slate-400">
                  Mostrar
                  <select
                    value={perPage}
                    onChange={(e) => setPerPage(Number(e.target.value))}
                    className="bg-slate-50 rounded-md px-1.5 py-1 text-xs text-slate-700 ring-1 ring-transparent focus:outline-none focus:ring-slate-900/10 cursor-pointer"
                  >
                    {PAGE_SIZES.map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </label>
                <span className="text-xs text-slate-400 tabular-nums">
                  {(page - 1) * perPage + 1}–{Math.min(page * perPage, total)} de{" "}
                  <span className="font-medium text-slate-600">{total}</span>
                </span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(1)}
                  disabled={page === 1}
                  title="Primera página"
                  className="p-1.5 rounded-md text-slate-400 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  title="Anterior"
                  className="p-1.5 rounded-md text-slate-400 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <span className="px-3 text-xs font-medium text-slate-600 tabular-nums">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  title="Siguiente"
                  className="p-1.5 rounded-md text-slate-400 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                <button
                  onClick={() => setPage(totalPages)}
                  disabled={page >= totalPages}
                  title="Última página"
                  className="p-1.5 rounded-md text-slate-400 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Modales de confirmación ── */}
      {approveModal.open && (
        <ConfirmModal
          title="Aprobar Tienda"
          tone="lime"
          body={
            <>
              ¿Certificar a <b className="text-gray-800">{approveModal.name}</b>? Podrá comenzar a vender
              inmediatamente.
            </>
          }
          confirmLabel="Confirmar"
          onCancel={() => setApproveModal({ open: false, id: null, name: "" })}
          onConfirm={confirmApprove}
        />
      )}

      {rejectModal.open && (
        <ConfirmModal
          title="Rechazar Solicitud"
          tone="red"
          body={
            <>
              ¿Denegar el acceso a <b className="text-gray-800">{rejectModal.name}</b>? Solo se rechaza esta
              solicitud; el usuario podrá volver a aplicar.
            </>
          }
          confirmLabel="Rechazar"
          onCancel={() => setRejectModal({ open: false, id: null, name: "" })}
          onConfirm={confirmReject}
        />
      )}

      {deleteModal.open && (
        <ConfirmModal
          title="Eliminar Solicitud"
          tone="red"
          body={
            <>
              ¿Eliminar la solicitud rechazada de <b className="text-gray-800">{deleteModal.name}</b>? Esto
              permitirá al usuario enviar una nueva.
            </>
          }
          confirmLabel="Eliminar"
          onCancel={() => setDeleteModal({ open: false, id: null, name: "" })}
          onConfirm={confirmDelete}
        />
      )}

      {suspendModal.open && (
        <ConfirmModal
          title="Suspender Tienda"
          tone="amber"
          body={
            <>
              ¿Suspender a <b className="text-gray-800">{suspendModal.store?.business_name}</b>? Sus productos
              dejarán de aparecer en el catálogo público.
            </>
          }
          blocker={
            storeCheck.pendingItems > 0
              ? `El backend rechazará la suspensión: la tienda tiene ${storeCheck.pendingItems} pedido(s) pendiente(s) de entrega.`
              : null
          }
          checking={storeCheck.loading}
          confirmLabel="Suspender"
          confirmClass="bg-amber-500 hover:bg-amber-600 text-white"
          onCancel={() => {
            setSuspendModal({ open: false, store: null });
            setSuspendReason("");
          }}
          onConfirm={handleSuspend}
        >
          <textarea
            value={suspendReason}
            onChange={(e) => setSuspendReason(e.target.value)}
            placeholder="Motivo de la suspensión (opcional)…"
            className="w-full bg-slate-50 rounded-xl p-3 text-sm ring-1 ring-slate-900/5 focus:outline-none focus:bg-white focus:ring-amber-300 mb-4 resize-none h-20"
          />
        </ConfirmModal>
      )}

      {reactivateModal.open && (
        <ConfirmModal
          title="Reactivar Tienda"
          tone="green"
          body={
            <>
              ¿Reactivar a <b className="text-gray-800">{reactivateModal.store?.business_name}</b>? Sus productos
              volverán a ser visibles.
            </>
          }
          confirmLabel="Reactivar"
          confirmClass="bg-green-600 hover:bg-green-700 text-white"
          onCancel={() => setReactivateModal({ open: false, store: null })}
          onConfirm={handleReactivate}
        />
      )}

      {revokeModal.open && (
        <ConfirmModal
          title="Revocar Tienda"
          tone="red"
          body={
            <>
              ¿Revocar completamente a <b className="text-red-700">{revokeModal.store?.business_name}</b>? Se
              eliminará el perfil, se desactivarán sus productos y el usuario volverá a ser comprador. Es
              irreversible.
            </>
          }
          blocker={
            storeCheck.pendingItems > 0
              ? `El backend rechazará la revocación: la tienda tiene ${storeCheck.pendingItems} pedido(s) pendiente(s).`
              : storeCheck.balance > 0
                ? `El backend rechazará la revocación: la tienda tiene $${storeCheck.balance.toFixed(2)} de saldo. Debe ser $0.`
                : null
          }
          checking={storeCheck.loading}
          confirmLabel="Revocar"
          confirmClass="bg-red-600 hover:bg-red-700 text-white"
          onCancel={() => {
            setRevokeModal({ open: false, store: null });
            setRevokeReason("");
          }}
          onConfirm={handleRevoke}
        >
          <textarea
            value={revokeReason}
            onChange={(e) => setRevokeReason(e.target.value)}
            placeholder="Motivo de la revocación (opcional)…"
            className="w-full bg-slate-50 rounded-xl p-3 text-sm ring-1 ring-slate-900/5 focus:outline-none focus:bg-white focus:ring-red-300 mb-4 resize-none h-20"
          />
        </ConfirmModal>
      )}

      {bulkDeleteModal && (
        <ConfirmModal
          title="Eliminación Masiva"
          tone="red"
          body={
            <>
              ¿Eliminar <b className="text-red-600">{selectedIds.size}</b> solicitud
              {selectedIds.size > 1 ? "es" : ""} rechazada{selectedIds.size > 1 ? "s" : ""}? Los usuarios
              afectados podrán enviar nuevas solicitudes.
            </>
          }
          confirmLabel={`Eliminar ${selectedIds.size}`}
          confirmClass="bg-red-600 hover:bg-red-700 text-white"
          onCancel={() => setBulkDeleteModal(false)}
          onConfirm={handleBulkDelete}
        />
      )}

      {/* ── Barra flotante de selección ── */}
      {selectedIds.size > 0 && activeTab === "rejected" && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[90] bg-[#1e1e2e] text-white rounded-2xl shadow-2xl px-5 py-3 flex items-center gap-4 border border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#6b1e96] flex items-center justify-center text-sm font-bold">
              {selectedIds.size}
            </div>
            <span className="text-sm text-gray-300">
              seleccionada{selectedIds.size > 1 ? "s" : ""}
              {selectedIds.size > MAX_BULK && (
                <span className="block text-[11px] text-amber-400">Máximo {MAX_BULK} por operación</span>
              )}
            </span>
          </div>
          <div className="w-px h-6 bg-white/20" />
          <button
            onClick={() => setBulkDeleteModal(true)}
            disabled={selectedIds.size > MAX_BULK}
            className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300 rounded-xl text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Eliminar
          </button>
          <button
            onClick={() => setSelectedIds(new Set())}
            title="Deseleccionar todo"
            className="p-1.5 text-gray-500 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {slideOverStore && (
        <StoreDetailSlideOver store={slideOverStore} onClose={() => setSlideOverStore(null)} />
      )}

      {reviewApp && (
        <ApplicationReviewSlideOver
          application={reviewApp}
          onClose={() => setReviewApp(null)}
          onApprove={(a) => setApproveModal({ open: true, id: a.id, name: a.business_name })}
          onReject={(a) => setRejectModal({ open: true, id: a.id, name: a.business_name })}
        />
      )}
    </div>
  );
}

const TONE_ICON = {
  lime: "bg-[#c3ff00]/20 text-[#6b1e96]",
  red: "bg-red-50 text-red-600",
  amber: "bg-amber-50 text-amber-600",
  green: "bg-green-50 text-green-600",
};

function ConfirmModal({
  title,
  body,
  tone = "red",
  blocker = null,
  checking = false,
  confirmLabel,
  confirmClass = "bg-slate-900 text-white hover:bg-[#6b1e96]",
  onCancel,
  onConfirm,
  children,
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl shadow-slate-900/20 ring-1 ring-slate-900/5 w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6">
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${TONE_ICON[tone]}`}
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
              />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-center text-slate-900 mb-2">{title}</h3>
          <p className="text-slate-500 text-center text-sm mb-4">{body}</p>

          {checking && (
            <p className="text-xs text-slate-400 text-center mb-4">Comprobando el estado de la tienda…</p>
          )}
          {!checking && blocker && (
            <div className="bg-red-50 border border-red-100 rounded-xl p-3 mb-4">
              <p className="text-xs text-red-600 leading-relaxed">{blocker}</p>
            </div>
          )}

          {children}

          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 font-medium rounded-xl hover:bg-slate-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              disabled={checking || Boolean(blocker)}
              className={`flex-1 px-4 py-2.5 font-medium rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${confirmClass}`}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

ConfirmModal.propTypes = {
  title: PropTypes.string.isRequired,
  body: PropTypes.node.isRequired,
  tone: PropTypes.oneOf(["lime", "red", "amber", "green"]),
  blocker: PropTypes.string,
  checking: PropTypes.bool,
  confirmLabel: PropTypes.string.isRequired,
  confirmClass: PropTypes.string,
  onCancel: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  children: PropTypes.node,
};
