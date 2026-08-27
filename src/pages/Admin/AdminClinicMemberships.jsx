import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import PropTypes from "prop-types";
import toast from "react-hot-toast";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import {
  getAdminClinicMembershipsAPI,
  getAdminClinicMembershipStatsAPI,
  approveClinicMembershipAPI,
  rejectClinicMembershipAPI,
  revokeClinicMembershipAPI,
  updateClinicMembershipSettingsAPI,
} from "../../services/api";
import { useAdminStats } from "../../context/AdminStatsContext";
import usePaymentMethods from "../../hooks/usePaymentMethods";
import Pagination from "../../components/admin/Pagination";

/**
 * Membresías del panel de Gestión Clínica: configuración del precio, estadísticas del
 * módulo, cola de comprobantes por revisar y listado por estado.
 *
 * Las estadísticas salen de `clinic_memberships` con el precio congelado en cada fila;
 * subir el precio hoy no reescribe lo cobrado ayer. Están pensadas para crecer: el
 * endpoint `/stats` ya devuelve la serie mensual y el desglose por método.
 */

const fecha = (iso) =>
  iso ? new Date(iso).toLocaleDateString("es-VE", { timeZone: "America/Caracas", day: "2-digit", month: "short", year: "numeric" }) : "—";
const fechaHora = (iso) =>
  iso ? new Date(iso).toLocaleString("es-VE", { timeZone: "America/Caracas", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—";
const usd = (n) => `$${Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const TABS = [
  { id: "under_review", label: "Por revisar" },
  { id: "active", label: "Activas" },
  { id: "expired", label: "Vencidas" },
  { id: "rejected", label: "Rechazadas" },
  { id: "cancelled", label: "Revocadas" },
];

const BADGES = {
  under_review: { label: "En revisión", bg: "#fef9c3", color: "#854d0e", dot: "#eab308" },
  active: { label: "Activa", bg: "#dcfce7", color: "#166534", dot: "#22c55e" },
  rejected: { label: "Rechazada", bg: "#fee2e2", color: "#991b1b", dot: "#ef4444" },
  expired: { label: "Vencida", bg: "#f1f5f9", color: "#475569", dot: "#94a3b8" },
  cancelled: { label: "Revocada", bg: "#fee2e2", color: "#991b1b", dot: "#ef4444" },
};

const ROL = { professional: "Odontólogo", student: "Estudiante", user: "Usuario" };

function StatusBadge({ status }) {
  const c = BADGES[status] || BADGES.expired;
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: c.bg, color: c.color }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: c.dot }} />
      {c.label}
    </span>
  );
}
StatusBadge.propTypes = { status: PropTypes.string.isRequired };

// ── KPIs ────────────────────────────────────────────────────────────────────

function Kpi({ label, value, sub, tone = "default" }) {
  const tones = {
    default: { bg: "#ffffff", color: "#33243d", border: "#ece5f7" },
    accent: { bg: "linear-gradient(135deg, #531575 0%, #6b1e96 100%)", color: "#ffffff", border: "transparent" },
    warn: { bg: "#fffbeb", color: "#9a6a10", border: "#fde68a" },
  };
  const t = tones[tone];
  return (
    <div className="rounded-2xl p-5" style={{ background: t.bg, color: t.color, border: `1px solid ${t.border}` }}>
      <p className="text-[11px] font-bold uppercase tracking-wider opacity-70">{label}</p>
      <p className="text-2xl font-black mt-1 leading-none">{value}</p>
      {sub && <p className="text-[11px] mt-2 opacity-70">{sub}</p>}
    </div>
  );
}
Kpi.propTypes = { label: PropTypes.string.isRequired, value: PropTypes.node.isRequired, sub: PropTypes.node, tone: PropTypes.string };

function ChartTooltip({ active, payload, label, money }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl px-3 py-2 shadow-lg border bg-white" style={{ borderColor: "#dcd2ec" }}>
      <p className="text-[10px] font-bold uppercase tracking-wider text-[#877f92] mb-1">{label}</p>
      <p className="text-sm font-black text-[#33243d]">{money ? usd(payload[0].value) : payload[0].value}</p>
    </div>
  );
}
ChartTooltip.propTypes = { active: PropTypes.bool, payload: PropTypes.array, label: PropTypes.string, money: PropTypes.bool };

function Serie({ titulo, data, dataKey, money }) {
  return (
    <div className="bg-white rounded-2xl p-5" style={{ border: "1px solid #ece5f7" }}>
      <p className="text-sm font-black text-[#33243d] mb-3">{titulo}</p>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid stroke="#ece5f7" vertical={false} />
            <XAxis dataKey="mes" tick={{ fontSize: 11, fill: "#877f92" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#877f92" }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip content={<ChartTooltip money={money} />} cursor={{ fill: "rgba(107,30,150,0.06)" }} />
            <Bar dataKey={dataKey} fill="#6b1e96" radius={[4, 4, 0, 0]} maxBarSize={36} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
Serie.propTypes = { titulo: PropTypes.string.isRequired, data: PropTypes.array.isRequired, dataKey: PropTypes.string.isRequired, money: PropTypes.bool };

function Estadisticas({ stats, loading, byKey }) {
  if (loading || !stats) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="h-24 rounded-2xl animate-pulse" style={{ background: "rgba(107,30,150,0.08)" }} />)}
      </div>
    );
  }
  const k = stats.kpis;
  const delta = k.ingresos_mes_anterior_usd > 0
    ? Math.round(((k.ingresos_mes_usd - k.ingresos_mes_anterior_usd) / k.ingresos_mes_anterior_usd) * 100)
    : null;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <Kpi tone="accent" label="Activas" value={k.activas} sub={`${k.conversion_pct}% de ${k.elegibles} elegibles`} />
        <Kpi tone={k.por_revisar > 0 ? "warn" : "default"} label="Por revisar" value={k.por_revisar} sub="comprobantes pendientes" />
        <Kpi label="Vencen en 7 días" value={k.vencen_7_dias} sub={`${k.vencidas_30_dias} vencidas últ. 30 días`} />
        <Kpi label="Ingresos del mes" value={usd(k.ingresos_mes_usd)} sub={delta === null ? `mes anterior ${usd(k.ingresos_mes_anterior_usd)}` : `${delta >= 0 ? "+" : ""}${delta}% vs mes anterior`} />
        <Kpi label="Ingresos totales" value={usd(k.ingresos_totales_usd)} sub={`${k.pagos_totales} pagos aprobados`} />
        <Kpi label="Rechazadas 30 días" value={k.rechazadas_30_dias} sub={`${k.usuarios_que_pidieron} personas han solicitado`} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Serie titulo="Membresías aprobadas por mes" data={stats.serie_mensual} dataKey="aprobadas" />
        <Serie titulo="Ingresos por mes (USD)" data={stats.serie_mensual} dataKey="ingresos_usd" money />
        <div className="bg-white rounded-2xl p-5" style={{ border: "1px solid #ece5f7" }}>
          <p className="text-sm font-black text-[#33243d] mb-3">Pagos por método</p>
          {stats.por_metodo.length === 0 ? (
            <p className="text-xs text-[#877f92]">Aún no hay pagos aprobados.</p>
          ) : (
            <ul className="space-y-2">
              {stats.por_metodo.map((m) => (
                <li key={m.payment_method} className="flex items-center justify-between text-sm">
                  <span className="text-[#33243d] font-semibold">{byKey[m.payment_method]?.icon} {byKey[m.payment_method]?.label || m.payment_method}</span>
                  <span className="text-[#5c5268]">{m.cantidad} · {usd(m.ingresos_usd)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
Estadisticas.propTypes = { stats: PropTypes.object, loading: PropTypes.bool, byKey: PropTypes.object.isRequired };

// ── Configuración ───────────────────────────────────────────────────────────

function Configuracion({ configuracion, onSaved }) {
  const [price, setPrice] = useState("");
  const [days, setDays] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!configuracion) return;
    setPrice(String(configuracion.price_usd));
    setDays(String(configuracion.duration_days));
    setEnabled(configuracion.enabled !== false);
  }, [configuracion]);

  const dirty = configuracion && (Number(price) !== configuracion.price_usd || Number(days) !== configuracion.duration_days || enabled !== configuracion.enabled);

  const guardar = async () => {
    const p = Number(price);
    const d = Number(days);
    if (!Number.isFinite(p) || p < 0) return toast.error("Precio inválido.");
    if (!Number.isInteger(d) || d < 1) return toast.error("La duración debe ser un entero de días.");
    if (!window.confirm(`¿Guardar la membresía a ${usd(p)} por ${d} días${enabled ? "" : " (cobro DESACTIVADO: el panel queda gratis)"}? Las membresías ya pagadas no cambian.`)) return;
    try {
      setSaving(true);
      await updateClinicMembershipSettingsAPI({ price_usd: p, duration_days: d, enabled });
      toast.success("Configuración guardada.");
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.error || "No se pudo guardar.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-5" style={{ border: "1px solid #ece5f7" }}>
      <div className="flex flex-col md:flex-row md:items-end gap-4">
        <div className="flex-1">
          <p className="text-sm font-black text-[#33243d]">Precio de la membresía</p>
          <p className="text-xs text-[#877f92] mt-0.5">Aplica a quien pague a partir de ahora. Lo ya cobrado queda como estaba.</p>
        </div>
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-[#877f92] mb-1">USD</label>
          <input type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} className="w-28 p-2.5 border rounded-xl text-sm font-bold text-[#33243d]" style={{ borderColor: "#dcd2ec" }} />
        </div>
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-[#877f92] mb-1">Días</label>
          <input type="number" min="1" step="1" value={days} onChange={(e) => setDays(e.target.value)} className="w-24 p-2.5 border rounded-xl text-sm font-bold text-[#33243d]" style={{ borderColor: "#dcd2ec" }} />
        </div>
        <label className="flex items-center gap-2 cursor-pointer select-none pb-2">
          <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} className="w-4 h-4 accent-[#6b1e96]" />
          <span className="text-sm font-bold text-[#33243d]">Cobro activo</span>
        </label>
        <button onClick={guardar} disabled={!dirty || saving} className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-[#6b1e96] hover:bg-[#531575] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
          {saving ? "Guardando..." : "Guardar"}
        </button>
      </div>
      {!enabled && <p className="text-xs font-bold text-[#9a6a10] mt-3">Con el cobro desactivado, odontólogos y estudiantes entran al panel sin pagar.</p>}
    </div>
  );
}
Configuracion.propTypes = { configuracion: PropTypes.object, onSaved: PropTypes.func.isRequired };

// ── Revisión (slide-over) ───────────────────────────────────────────────────

function Revision({ m, byKey, onClose, onApprove, onReject, onRevoke }) {
  const [modo, setModo] = useState(null); // 'reject' | 'revoke'
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [zoom, setZoom] = useState(false);
  const esPdf = /\.pdf($|\?)/i.test(m.payment_proof_url || "");
  const metodo = byKey[m.payment_method];

  const run = async (fn) => {
    setBusy(true);
    try { await fn(); } finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[#33243d]/45 backdrop-blur-sm flex justify-end" onClick={(e) => e.target === e.currentTarget && !busy && onClose()} role="dialog" aria-modal="true">
      <div className="w-full max-w-4xl h-full bg-gray-50 shadow-2xl flex flex-col sm:flex-row animate-slide-in-right relative">
        <div className="w-full sm:w-3/5 h-56 sm:h-full bg-black flex items-center justify-center border-r border-gray-200 relative">
          {esPdf ? (
            <a href={m.payment_proof_url} target="_blank" rel="noreferrer" className="text-white text-sm font-bold underline">Abrir comprobante PDF</a>
          ) : (
            <img src={m.payment_proof_url} alt="Comprobante" onClick={() => setZoom(!zoom)} className={`cursor-zoom-in transition-all ${zoom ? "max-w-none w-auto h-auto" : "max-w-full max-h-full object-contain"}`} />
          )}
          <a href={m.payment_proof_url} target="_blank" rel="noreferrer" className="absolute top-3 left-3 bg-white/90 text-xs font-bold px-3 py-1.5 rounded-lg text-gray-700">Abrir original</a>
        </div>
        <div className="flex-1 flex flex-col overflow-y-auto">
          <div className="p-6 border-b border-gray-200 flex items-start justify-between">
            <div>
              <StatusBadge status={m.status} />
              <h3 className="text-lg font-black text-gray-900 mt-2">{m.user?.full_name || "Sin nombre"}</h3>
              <p className="text-xs text-gray-500">{m.user?.email} · {ROL[m.user?.role] || m.user?.role}</p>
            </div>
            <button onClick={onClose} disabled={busy} className="p-2 rounded-full hover:bg-gray-200 text-gray-500">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
          <div className="p-6 space-y-4 text-sm flex-1">
            <div className="grid grid-cols-2 gap-3">
              <div><p className="text-[10px] uppercase font-bold text-gray-400">Monto</p><p className="font-black text-gray-900 text-lg">{usd(m.price_usd)}</p></div>
              <div><p className="text-[10px] uppercase font-bold text-gray-400">Duración</p><p className="font-bold text-gray-800">{m.duration_days} días</p></div>
              <div><p className="text-[10px] uppercase font-bold text-gray-400">Método</p><p className="font-bold text-gray-800">{metodo?.icon} {metodo?.label || m.payment_method}</p></div>
              <div><p className="text-[10px] uppercase font-bold text-gray-400">Referencia</p><p className="font-bold text-gray-800 break-all">{m.reference_number}</p></div>
              <div><p className="text-[10px] uppercase font-bold text-gray-400">Titular</p><p className="font-bold text-gray-800">{m.payer_name}</p></div>
              {m.payer_cedula && <div><p className="text-[10px] uppercase font-bold text-gray-400">Cédula</p><p className="font-bold text-gray-800">{m.payer_cedula}</p></div>}
              {m.payer_phone && <div><p className="text-[10px] uppercase font-bold text-gray-400">Teléfono</p><p className="font-bold text-gray-800">{m.payer_phone}</p></div>}
              {m.payer_email && <div><p className="text-[10px] uppercase font-bold text-gray-400">Correo</p><p className="font-bold text-gray-800 break-all">{m.payer_email}</p></div>}
              {m.payment_date && <div><p className="text-[10px] uppercase font-bold text-gray-400">Fecha del pago</p><p className="font-bold text-gray-800">{m.payment_date}</p></div>}
              <div><p className="text-[10px] uppercase font-bold text-gray-400">Enviado</p><p className="font-bold text-gray-800">{fechaHora(m.created_at)}</p></div>
              {m.starts_at && <div className="col-span-2"><p className="text-[10px] uppercase font-bold text-gray-400">Vigencia</p><p className="font-bold text-gray-800">{fecha(m.starts_at)} → {fecha(m.ends_at)}</p></div>}
              {m.review_reason && <div className="col-span-2"><p className="text-[10px] uppercase font-bold text-gray-400">Motivo</p><p className="text-gray-700">{m.review_reason}</p></div>}
            </div>
            {metodo?.campos?.length > 0 && (
              <div className="rounded-xl bg-[#6b1e96]/5 border border-[#6b1e96]/10 p-3">
                <p className="text-[10px] uppercase font-bold text-[#6b1e96] mb-1.5">Cuenta donde debió llegar</p>
                {metodo.campos.map((c) => <p key={c.etiqueta} className="text-xs text-gray-700"><span className="text-gray-400">{c.etiqueta}:</span> {c.valor}</p>)}
              </div>
            )}
            {modo && (
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Motivo ({modo === "reject" ? "rechazo" : "revocación"}) — el usuario lo verá</label>
                <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} className="w-full p-3 border border-gray-300 rounded-xl text-sm" placeholder="Ej: la referencia no aparece en la cuenta" />
              </div>
            )}
          </div>
          <div className="p-6 border-t border-gray-200 bg-white flex gap-3">
            {m.status === "under_review" && !modo && (
              <>
                <button disabled={busy} onClick={() => run(() => onApprove(m.id))} className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm disabled:opacity-50">
                  {busy ? "Procesando..." : "Aprobar y activar"}
                </button>
                <button disabled={busy} onClick={() => setModo("reject")} className="flex-1 py-3 rounded-xl bg-white border border-red-200 text-red-700 hover:bg-red-50 font-bold text-sm">Rechazar</button>
              </>
            )}
            {m.status === "active" && !modo && (
              <button disabled={busy} onClick={() => setModo("revoke")} className="flex-1 py-3 rounded-xl bg-white border border-red-200 text-red-700 hover:bg-red-50 font-bold text-sm">Revocar membresía</button>
            )}
            {modo && (
              <>
                <button disabled={busy || reason.trim().length < 5} onClick={() => run(() => (modo === "reject" ? onReject(m.id, reason) : onRevoke(m.id, reason)))} className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm disabled:opacity-50">
                  {busy ? "Procesando..." : modo === "reject" ? "Confirmar rechazo" : "Confirmar revocación"}
                </button>
                <button disabled={busy} onClick={() => { setModo(null); setReason(""); }} className="px-5 py-3 rounded-xl bg-gray-100 text-gray-700 font-bold text-sm">Cancelar</button>
              </>
            )}
            {!modo && m.status !== "under_review" && m.status !== "active" && (
              <button onClick={onClose} className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-700 font-bold text-sm">Cerrar</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
Revision.propTypes = {
  m: PropTypes.object.isRequired,
  byKey: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired,
  onApprove: PropTypes.func.isRequired,
  onReject: PropTypes.func.isRequired,
  onRevoke: PropTypes.func.isRequired,
};

// ── Página ──────────────────────────────────────────────────────────────────

const PER_PAGE = 15;

export default function AdminClinicMemberships() {
  const { refreshStats } = useAdminStats();
  const { byKey } = usePaymentMethods();
  const [searchParams, setSearchParams] = useSearchParams();

  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [tab, setTab] = useState("under_review");
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [activa, setActiva] = useState(null);

  const cargarStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const res = await getAdminClinicMembershipStatsAPI();
      setStats(res.data?.data || null);
    } catch (err) {
      toast.error(err.response?.data?.error || "No se pudieron cargar las estadísticas.");
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const cargarLista = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getAdminClinicMembershipsAPI({ status: tab, search: search || undefined, page, limit: PER_PAGE });
      setRows(res.data?.data || []);
      setTotal(res.data?.total || 0);
    } catch (err) {
      toast.error(err.response?.data?.error || "No se pudo cargar el listado.");
    } finally {
      setLoading(false);
    }
  }, [tab, search, page]);

  useEffect(() => { cargarStats(); }, [cargarStats]);
  useEffect(() => { cargarLista(); }, [cargarLista]);

  // Deep link desde la notificación: ?id=<membresía> abre la ficha y limpia la URL.
  useEffect(() => {
    const id = searchParams.get("id");
    if (!id) return;
    (async () => {
      try {
        const res = await getAdminClinicMembershipsAPI({ id });
        const m = res.data?.data?.[0];
        if (m) { setActiva(m); setTab(m.status); } else toast.error("Membresía no encontrada.");
      } catch { toast.error("Membresía no encontrada."); }
      const next = new URLSearchParams(searchParams);
      next.delete("id");
      setSearchParams(next, { replace: true });
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const despues = (msg) => {
    toast.success(msg);
    setActiva(null);
    cargarLista();
    cargarStats();
    refreshStats();
  };
  const errorDe = (err) => toast.error(err.response?.data?.error || "No se pudo completar la acción.");

  const aprobar = async (id) => { try { const r = await approveClinicMembershipAPI(id); despues(r.data?.message || "Aprobada."); } catch (e) { errorDe(e); } };
  const rechazar = async (id, reason) => { try { const r = await rejectClinicMembershipAPI(id, reason); despues(r.data?.message || "Rechazada."); } catch (e) { errorDe(e); } };
  const revocar = async (id, reason) => { try { const r = await revokeClinicMembershipAPI(id, reason); despues(r.data?.message || "Revocada."); } catch (e) { errorDe(e); } };

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
  const conteos = useMemo(() => ({ under_review: stats?.kpis?.por_revisar }), [stats]);

  return (
    <div className="space-y-6" style={{ color: "#33243d" }}>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black">Membresías clínicas</h1>
          <p className="text-sm text-[#5c5268] mt-1">Acceso de pago al panel de Gestión Clínica (odontólogos y estudiantes).</p>
        </div>
        <button onClick={() => { cargarStats(); cargarLista(); }} className="inline-flex items-center gap-1.5 text-xs font-bold text-[#6b1e96] hover:underline">
          <span className="material-symbols-outlined text-[16px]">refresh</span>Actualizar
        </button>
      </div>

      <Configuracion configuracion={stats?.configuracion} onSaved={cargarStats} />
      <Estadisticas stats={stats} loading={statsLoading} byKey={byKey} />

      <div className="bg-white rounded-2xl overflow-hidden" style={{ border: "1px solid #ece5f7" }}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 border-b" style={{ borderColor: "#ece5f7" }}>
          <div className="flex gap-1 overflow-x-auto">
            {TABS.map((t) => (
              <button key={t.id} onClick={() => { setTab(t.id); setPage(1); }} className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${tab === t.id ? "bg-[#6b1e96] text-white" : "text-[#5c5268] hover:bg-[#f1ebf9]"}`}>
                {t.label}{conteos[t.id] > 0 && <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-white/20 text-[10px]">{conteos[t.id]}</span>}
              </button>
            ))}
          </div>
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Buscar por nombre o correo" className="w-full md:w-64 p-2.5 border rounded-xl text-sm" style={{ borderColor: "#dcd2ec" }} />
        </div>

        {loading ? (
          <div className="p-10 text-center text-sm text-[#877f92]">Cargando...</div>
        ) : rows.length === 0 ? (
          <div className="p-12 text-center">
            <span className="material-symbols-outlined text-[36px] text-[#cebfe6]">inbox</span>
            <p className="text-sm text-[#877f92] mt-2">No hay membresías en este estado.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-[11px] uppercase tracking-wider text-[#877f92]" style={{ background: "#f7f4fc" }}>
                <tr>
                  <th className="text-left px-5 py-3 font-bold">Titular</th>
                  <th className="text-left px-4 py-3 font-bold">Pago</th>
                  <th className="text-left px-4 py-3 font-bold">Vigencia</th>
                  <th className="text-left px-4 py-3 font-bold">Enviado</th>
                  <th className="text-right px-5 py-3 font-bold"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((m) => (
                  <tr key={m.id} className="border-t hover:bg-[#f7f4fc] cursor-pointer" style={{ borderColor: "#ece5f7" }} onClick={() => setActiva(m)}>
                    <td className="px-5 py-3">
                      <p className="font-bold">{m.user?.full_name || "Sin nombre"}</p>
                      <p className="text-[11px] text-[#877f92]">{m.user?.email} · {ROL[m.user?.role] || m.user?.role || "—"}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-bold">{usd(m.price_usd)} <span className="font-normal text-[#5c5268]">· {byKey[m.payment_method]?.label || m.payment_method}</span></p>
                      <p className="text-[11px] text-[#877f92]">Ref. {m.reference_number}</p>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {m.starts_at ? <>{fecha(m.starts_at)} → {fecha(m.ends_at)}</> : <span className="text-[#877f92]">—</span>}
                      {m.status === "active" && new Date(m.starts_at) > new Date() && <p className="text-[10px] font-bold text-[#3f7794]">Empieza al vencer la actual</p>}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-[#5c5268]">{fechaHora(m.created_at)}</td>
                    <td className="px-5 py-3 text-right"><StatusBadge status={m.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {totalPages > 1 && (
          <div className="p-4 border-t" style={{ borderColor: "#ece5f7" }}>
            <Pagination page={page} totalPages={totalPages} total={total} limit={PER_PAGE} onPageChange={setPage} />
          </div>
        )}
      </div>

      {activa && <Revision m={activa} byKey={byKey} onClose={() => setActiva(null)} onApprove={aprobar} onReject={rechazar} onRevoke={revocar} />}
    </div>
  );
}
