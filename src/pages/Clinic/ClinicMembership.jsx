import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import PropTypes from "prop-types";
import toast from "react-hot-toast";
import { useClinicMembership } from "../../context/ClinicMembershipContext";
import { requestClinicMembershipAPI } from "../../services/api";
import usePaymentMethods from "../../hooks/usePaymentMethods";
import PaymentInstructions from "../../components/orders/PaymentInstructions";
import { validateFile } from "../../utils/validators";

/**
 * Mi membresía: estado del acceso al panel clínico, precio, y el formulario para pagar o
 * renovar subiendo el comprobante. Mismo flujo que el comprobante de un pedido: el admin
 * aprueba y la membresía se activa.
 */

const fecha = (iso) =>
  iso ? new Date(iso).toLocaleDateString("es-VE", { timeZone: "America/Caracas", day: "numeric", month: "long", year: "numeric" }) : "—";

const usd = (n) => `$${Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const ESTADO = {
  under_review: { label: "En revisión", bg: "#fef9c3", color: "#854d0e" },
  active: { label: "Activa", bg: "#dcfce7", color: "#166534" },
  rejected: { label: "Rechazada", bg: "#fee2e2", color: "#991b1b" },
  expired: { label: "Vencida", bg: "#f1f5f9", color: "#475569" },
  cancelled: { label: "Revocada", bg: "#fee2e2", color: "#991b1b" },
};

function Badge({ status }) {
  const c = ESTADO[status] || ESTADO.expired;
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold" style={{ background: c.bg, color: c.color }}>
      {c.label}
    </span>
  );
}
Badge.propTypes = { status: PropTypes.string };

const BENEFICIOS = [
  { icon: "dashboard", texto: "Resumen ejecutivo de tu consultorio" },
  { icon: "inventory_2", texto: "Inventario clínico con alertas de stock crítico" },
  { icon: "sync", texto: "Suscripciones recurrentes de insumos" },
  { icon: "payments", texto: "Rentabilidad, gastos y proyecciones financieras" },
  { icon: "download", texto: "Exportación a Excel y ofertas inteligentes" },
];

// ── Tarjeta de estado ───────────────────────────────────────────────────────

function EstadoCard({ membership }) {
  const { acceso, vigente, proxima, en_revision: enRevision, historial, configuracion, cubierto_hasta: cubiertoHasta } = membership;
  const ultima = historial?.[0];

  let icon = "lock";
  let titulo = "Sin membresía activa";
  let detalle = "Activa tu membresía para entrar al panel de Gestión Clínica.";
  let tono = { bg: "#541a97", fg: "#ffffff" };

  if (acceso.motivo === "cobro_desactivado") {
    icon = "lock_open";
    titulo = "Acceso incluido";
    detalle = "El panel clínico no requiere pago en este momento. Puedes entrar cuando quieras.";
    tono = { bg: "#166534", fg: "#ffffff" };
  } else if (acceso.ok && vigente) {
    icon = "verified";
    titulo = `Membresía activa · ${vigente.dias_restantes} ${vigente.dias_restantes === 1 ? "día" : "días"} restantes`;
    detalle = proxima
      ? `Vigente hasta el ${fecha(vigente.ends_at)}. Tu renovación ya está aprobada y cubre hasta el ${fecha(cubiertoHasta)}.`
      : `Vigente hasta el ${fecha(vigente.ends_at)}.`;
    tono = vigente.dias_restantes <= 7 ? { bg: "#9a6a10", fg: "#ffffff" } : { bg: "#166534", fg: "#ffffff" };
  } else if (acceso.motivo === "en_revision" && enRevision) {
    icon = "hourglass_top";
    titulo = "Comprobante en revisión";
    detalle = `Recibimos tu comprobante el ${fecha(enRevision.created_at)}. Un administrador lo revisará y activará tu membresía.`;
    tono = { bg: "#854d0e", fg: "#ffffff" };
  } else if (acceso.motivo === "rechazada" && ultima) {
    icon = "error";
    titulo = "Comprobante rechazado";
    detalle = `Motivo: ${ultima.review_reason || "no indicado"}. Revisa los datos y vuelve a enviarlo.`;
    tono = { bg: "#991b1b", fg: "#ffffff" };
  } else if (acceso.motivo === "cancelada" && ultima) {
    icon = "block";
    titulo = "Membresía revocada";
    detalle = `Motivo: ${ultima.review_reason || "no indicado"}. Si crees que es un error, contacta a soporte.`;
    tono = { bg: "#991b1b", fg: "#ffffff" };
  } else if (acceso.motivo === "vencida" && ultima) {
    icon = "event_busy";
    titulo = "Membresía vencida";
    detalle = `Tu acceso terminó el ${fecha(ultima.ends_at)}. Renueva para volver a entrar.`;
    tono = { bg: "#475569", fg: "#ffffff" };
  }

  return (
    <div className="rounded-3xl p-6 md:p-8 shadow-md" style={{ background: tono.bg, color: tono.fg }}>
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center flex-shrink-0">
          <span className="material-symbols-outlined text-[26px]" style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-widest opacity-70">Mi membresía</p>
          <h2 className="text-xl md:text-2xl font-black mt-1 leading-tight">{titulo}</h2>
          <p className="text-sm mt-2 opacity-90">{detalle}</p>
          {acceso.ok && (
            <Link to="/clinic" className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-sm font-bold transition-colors">
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              Ir al panel
            </Link>
          )}
        </div>
      </div>
      {configuracion?.enabled && (
        <div className="mt-6 pt-5 border-t border-white/15 flex flex-wrap gap-6 text-sm">
          <div>
            <p className="opacity-70 text-[11px] font-bold uppercase tracking-widest">Precio</p>
            <p className="text-lg font-black">{usd(configuracion.price_usd)} <span className="text-xs font-bold opacity-70">/ {configuracion.duration_days} días</span></p>
          </div>
          {cubiertoHasta && (
            <div>
              <p className="opacity-70 text-[11px] font-bold uppercase tracking-widest">Cubierto hasta</p>
              <p className="text-lg font-black">{fecha(cubiertoHasta)}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
EstadoCard.propTypes = { membership: PropTypes.object.isRequired };

// ── Formulario de pago ──────────────────────────────────────────────────────

function FormularioPago({ configuracion, onEnviado, esRenovacion }) {
  const { activos, byKey } = usePaymentMethods();
  const fileInputRef = useRef(null);

  const [pm, setPm] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [payerName, setPayerName] = useState("");
  const [payerPhone, setPayerPhone] = useState("");
  const [cedulaType, setCedulaType] = useState("V");
  const [cedulaNumber, setCedulaNumber] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [payerEmail, setPayerEmail] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const [errors, setErrors] = useState({});
  const [sending, setSending] = useState(false);

  const metodo = pm ? byKey[pm] : null;
  const formulario = metodo?.formulario || "banco";
  const isBank = formulario === "banco";
  const isWallet = formulario === "billetera";

  const inputCls = (key) =>
    `w-full p-3 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all ${
      errors[key]
        ? "border-red-300 bg-red-50/30 focus:ring-red-100 focus:border-red-400"
        : "border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-[#541a97]/15 focus:border-[#541a97]"
    }`;

  const Err = ({ k }) => errors[k] ? (
    <p className="text-red-500 text-xs font-bold mt-1.5 flex items-center gap-1">
      <span className="material-symbols-outlined text-sm">error</span>{errors[k]}
    </p>
  ) : null;
  Err.propTypes = { k: PropTypes.string.isRequired };

  const clear = (k) => errors[k] && setErrors((p) => ({ ...p, [k]: null }));

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const v = validateFile(f, 5, ["image/jpeg", "image/png", "image/webp", "application/pdf"]);
    if (!v.valid) {
      toast.error(v.error);
      return;
    }
    setFile(f);
    clear("file");
    if (f.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(f);
    } else {
      setPreview(null);
    }
  };

  const validate = () => {
    const e = {};
    if (!pm) e.pm = "Elige el método con el que pagaste.";
    if (!payerName.trim()) e.payerName = "El nombre del titular es obligatorio.";
    if (!referenceNumber.trim()) e.referenceNumber = "El número de referencia es obligatorio.";
    if (pm && isBank) {
      if (!payerPhone.trim()) e.payerPhone = "El teléfono del pagador es obligatorio.";
      if (!cedulaNumber.trim()) e.payerCedula = "El número de documento es obligatorio.";
      else if (!/^[VEJGP]-\d{6,10}(-\d)?$/i.test(`${cedulaType}-${cedulaNumber.trim()}`)) e.payerCedula = "Formato inválido. Solo números (ej: 12345678).";
    }
    if (pm && isWallet) {
      if (!payerEmail.trim()) e.payerEmail = "El correo es obligatorio para este método.";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payerEmail.trim())) e.payerEmail = "El correo no tiene un formato válido.";
      if (!paymentDate) e.paymentDate = "La fecha de la transacción es obligatoria.";
    }
    if (!file) e.file = "Adjunta la captura del comprobante.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const enviar = async () => {
    if (!validate()) {
      toast.error("Corrige los campos marcados antes de continuar.");
      return;
    }
    const fd = new FormData();
    fd.append("proof", file);
    fd.append("payment_method", pm);
    fd.append("payer_name", payerName.trim());
    fd.append("reference_number", referenceNumber.trim());
    if (isBank) {
      fd.append("payer_phone", payerPhone.trim());
      fd.append("payer_cedula", `${cedulaType}-${cedulaNumber.trim()}`.toUpperCase());
    }
    if (isWallet) {
      fd.append("payer_email", payerEmail.trim().toLowerCase());
      fd.append("payment_date", paymentDate);
    }
    try {
      setSending(true);
      const res = await requestClinicMembershipAPI(fd);
      toast.success(res.data?.message || "Comprobante enviado.");
      onEnviado();
    } catch (err) {
      toast.error(err.response?.data?.error || "No se pudo enviar el comprobante.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-[#cdc3d4]/20 shadow-xs p-6 md:p-8">
      <div className="flex items-start gap-3.5 mb-6 pb-5 border-b border-slate-100">
        <div className="w-10 h-10 rounded-xl bg-[#541a97]/5 flex items-center justify-center text-[#541a97]">
          <span className="material-symbols-outlined text-[22px]">receipt_long</span>
        </div>
        <div>
          <h3 className="text-base font-black text-slate-900">{esRenovacion ? "Renovar membresía" : "Pagar membresía"}</h3>
          <p className="text-xs font-semibold text-slate-400 mt-0.5">
            Paga {usd(configuracion.price_usd)} por cualquiera de los métodos y sube el comprobante.
            {esRenovacion && " Los días que te quedan no se pierden: la renovación empieza cuando termine la actual."}
          </p>
        </div>
      </div>

      {/* Paso 1: método */}
      <p className="text-[11px] font-extrabold text-[#541a97] uppercase tracking-wider mb-2">1. ¿Por dónde pagaste?</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-2">
        {activos.map((m) => (
          <button
            key={m.key}
            type="button"
            onClick={() => { setPm(m.key); clear("pm"); setErrors({}); }}
            className={`flex items-center gap-2.5 p-3 rounded-2xl border text-left text-sm font-bold transition-all ${
              pm === m.key ? "border-[#541a97] bg-[#541a97]/5 ring-1 ring-[#541a97] text-[#541a97]" : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
            }`}
          >
            <span className="text-xl">{m.icon}</span>
            <span className="truncate">{m.label}</span>
          </button>
        ))}
      </div>
      <Err k="pm" />
      {pm && <PaymentInstructions paymentMethod={pm} />}

      {pm && (
        <>
          <p className="text-[11px] font-extrabold text-[#541a97] uppercase tracking-wider mt-8 mb-3">2. Datos del pago</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-extrabold text-slate-600 uppercase tracking-wider mb-1.5">Nombre del titular <span className="text-red-500">*</span></label>
              <input type="text" value={payerName} onChange={(e) => { setPayerName(e.target.value); clear("payerName"); }} placeholder="Ej: Ana Pérez" className={inputCls("payerName")} disabled={sending} />
              <Err k="payerName" />
            </div>

            {isBank && (
              <>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-extrabold text-slate-600 uppercase tracking-wider mb-1.5">Cédula / RIF <span className="text-red-500">*</span></label>
                  <div className="flex gap-2">
                    <select value={cedulaType} onChange={(e) => setCedulaType(e.target.value)} className="w-1/3 p-3 border border-slate-200 rounded-xl text-sm bg-white" disabled={sending}>
                      {["V", "J", "E", "P", "G"].map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <input type="text" value={cedulaNumber} onChange={(e) => { setCedulaNumber(e.target.value); clear("payerCedula"); }} placeholder="12345678" className={`w-2/3 ${inputCls("payerCedula")}`} disabled={sending} />
                  </div>
                  <Err k="payerCedula" />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-extrabold text-slate-600 uppercase tracking-wider mb-1.5">Teléfono del pagador <span className="text-red-500">*</span></label>
                  <input type="text" value={payerPhone} onChange={(e) => { setPayerPhone(e.target.value); clear("payerPhone"); }} placeholder="0412-1234567" className={inputCls("payerPhone")} disabled={sending} />
                  <Err k="payerPhone" />
                </div>
              </>
            )}

            {isWallet && (
              <>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-extrabold text-slate-600 uppercase tracking-wider mb-1.5">Correo del titular <span className="text-red-500">*</span></label>
                  <input type="email" value={payerEmail} onChange={(e) => { setPayerEmail(e.target.value); clear("payerEmail"); }} placeholder="ejemplo@correo.com" className={inputCls("payerEmail")} disabled={sending} />
                  <Err k="payerEmail" />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-extrabold text-slate-600 uppercase tracking-wider mb-1.5">Fecha de la transacción <span className="text-red-500">*</span></label>
                  <input type="date" value={paymentDate} max={new Date().toISOString().split("T")[0]} onChange={(e) => { setPaymentDate(e.target.value); clear("paymentDate"); }} className={inputCls("paymentDate")} disabled={sending} />
                  <Err k="paymentDate" />
                </div>
              </>
            )}

            <div className="col-span-2">
              <label className="block text-xs font-extrabold text-slate-600 uppercase tracking-wider mb-1.5">Número de referencia <span className="text-red-500">*</span></label>
              <input type="text" value={referenceNumber} onChange={(e) => { setReferenceNumber(e.target.value); clear("referenceNumber"); }} placeholder="Ej: 20260827143022" className={inputCls("referenceNumber")} disabled={sending} />
              <Err k="referenceNumber" />
            </div>

            <div className="col-span-2 border-t border-slate-100 pt-3 mt-1">
              <p className="text-[11px] font-extrabold text-[#541a97] uppercase tracking-wider mb-2">3. Captura del comprobante <span className="text-red-500">*</span></p>
            </div>
            <label className={`col-span-2 flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-xl cursor-pointer transition-all ${errors.file ? "border-red-300 bg-red-50/30" : "border-slate-200 bg-slate-50/50 hover:bg-[#541a97]/5 hover:border-[#541a97]"}`}>
              <div className="flex flex-col items-center justify-center py-2 px-4 text-center">
                <span className="material-symbols-outlined text-[24px] text-slate-400 mb-1">cloud_upload</span>
                <p className="text-xs text-slate-700 font-bold">{file ? "Cambiar comprobante" : "Haz clic para seleccionar archivo"}</p>
                <p className="text-[10px] text-slate-400 font-bold">{file ? file.name : "PNG, JPG, WEBP o PDF (máx. 5MB)"}</p>
              </div>
              <input type="file" ref={fileInputRef} onChange={handleFile} accept="image/jpeg,image/png,image/webp,application/pdf" className="hidden" disabled={sending} />
            </label>
            <div className="col-span-2"><Err k="file" /></div>
            {preview && (
              <div className="col-span-2 p-2 bg-slate-50 border border-slate-100 rounded-xl flex justify-center">
                <img src={preview} alt="Vista previa del comprobante" className="max-h-40 object-contain rounded-lg" />
              </div>
            )}

            <div className="col-span-2 mt-2">
              <button
                type="button"
                onClick={enviar}
                disabled={sending}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-6 text-sm font-black rounded-2xl text-white bg-[#541a97] hover:bg-[#6c38b0] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md cursor-pointer"
              >
                {sending ? "Enviando comprobante..." : `Enviar comprobante de ${usd(configuracion.price_usd)}`}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
FormularioPago.propTypes = {
  configuracion: PropTypes.object.isRequired,
  onEnviado: PropTypes.func.isRequired,
  esRenovacion: PropTypes.bool,
};

// ── Página ──────────────────────────────────────────────────────────────────

export default function ClinicMembership() {
  const { loading, error, membership, refresh } = useClinicMembership();
  const [mostrarRenovar, setMostrarRenovar] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-10 h-10 border-4 border-[#541a97]/20 border-t-[#541a97] rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !membership) {
    return (
      <div className="bg-white rounded-3xl border border-red-100 p-8 text-center">
        <p className="text-red-600 font-bold">{error || "No se pudo cargar tu membresía."}</p>
        <button onClick={refresh} className="mt-4 px-4 py-2 rounded-xl bg-[#541a97] text-white text-sm font-bold">Reintentar</button>
      </div>
    );
  }

  const { configuracion, vigente, proxima, en_revision: enRevision, historial } = membership;
  const cobroActivo = configuracion.enabled;
  const puedePedir = cobroActivo && !enRevision && !proxima;
  const esRenovacion = !!vigente;
  const mostrarFormulario = puedePedir && (!esRenovacion || mostrarRenovar || vigente.dias_restantes <= 7);

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl md:text-3xl font-black text-[#111c2c] tracking-tight">Mi membresía</h1>
        <p className="text-sm text-[#4b4452] mt-1">Acceso al panel de Gestión Clínica para odontólogos y estudiantes.</p>
      </div>

      <EstadoCard membership={membership} />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
        <div className="lg:col-span-3 space-y-6">
          {mostrarFormulario && (
            <FormularioPago configuracion={configuracion} esRenovacion={esRenovacion} onEnviado={() => { setMostrarRenovar(false); refresh(); }} />
          )}

          {puedePedir && esRenovacion && !mostrarFormulario && (
            <div className="bg-white rounded-3xl border border-[#cdc3d4]/20 shadow-xs p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-black text-slate-900">¿Quieres adelantar la renovación?</h3>
                <p className="text-xs text-slate-500 mt-1">Puedes pagar el siguiente período ahora. Empezará cuando termine el actual.</p>
              </div>
              <button onClick={() => setMostrarRenovar(true)} className="px-5 py-3 rounded-2xl bg-[#541a97] text-white text-sm font-bold hover:bg-[#6c38b0] transition-colors whitespace-nowrap">
                Renovar ahora
              </button>
            </div>
          )}

          {enRevision && (
            <div className="bg-white rounded-3xl border border-[#cdc3d4]/20 shadow-xs p-6">
              <h3 className="font-black text-slate-900 mb-3">Comprobante enviado</h3>
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <dt className="text-slate-500">Método</dt><dd className="font-bold text-slate-800">{enRevision.payment_method}</dd>
                <dt className="text-slate-500">Referencia</dt><dd className="font-bold text-slate-800">{enRevision.reference_number}</dd>
                <dt className="text-slate-500">Monto</dt><dd className="font-bold text-slate-800">{usd(enRevision.price_usd)}</dd>
                <dt className="text-slate-500">Enviado</dt><dd className="font-bold text-slate-800">{fecha(enRevision.created_at)}</dd>
              </dl>
              <a href={enRevision.payment_proof_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 mt-4 text-xs font-bold text-[#541a97] hover:underline">
                <span className="material-symbols-outlined text-[16px]">open_in_new</span>Ver comprobante
              </a>
            </div>
          )}

          {historial?.length > 0 && (
            <div className="bg-white rounded-3xl border border-[#cdc3d4]/20 shadow-xs overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100">
                <h3 className="font-black text-slate-900">Historial</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="text-left px-6 py-3 font-bold">Estado</th>
                      <th className="text-left px-4 py-3 font-bold">Vigencia</th>
                      <th className="text-left px-4 py-3 font-bold">Método</th>
                      <th className="text-right px-6 py-3 font-bold">Monto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {historial.map((m) => (
                      <tr key={m.id}>
                        <td className="px-6 py-3"><Badge status={m.status} />{m.review_reason && <p className="text-[11px] text-slate-500 mt-1">{m.review_reason}</p>}</td>
                        <td className="px-4 py-3 text-slate-700 whitespace-nowrap">{m.starts_at ? `${fecha(m.starts_at)} → ${fecha(m.ends_at)}` : `Enviado ${fecha(m.created_at)}`}</td>
                        <td className="px-4 py-3 text-slate-700">{m.payment_method}</td>
                        <td className="px-6 py-3 text-right font-bold text-slate-800">{usd(m.price_usd)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <aside className="lg:col-span-2 bg-white rounded-3xl border border-[#cdc3d4]/20 shadow-xs p-6">
          <p className="text-[11px] font-bold text-[#541a97]/80 tracking-widest uppercase">Qué incluye</p>
          <h3 className="text-lg font-black text-slate-900 mt-1">Gestión Clínica</h3>
          {cobroActivo ? (
            <p className="text-3xl font-black text-[#541a97] mt-3">{usd(configuracion.price_usd)} <span className="text-sm font-bold text-slate-400">/ {configuracion.duration_days} días</span></p>
          ) : (
            <p className="text-sm font-bold text-emerald-700 mt-3">Incluido sin costo por ahora</p>
          )}
          <ul className="mt-5 space-y-3">
            {BENEFICIOS.map((b) => (
              <li key={b.icon} className="flex items-start gap-3 text-sm text-slate-700">
                <span className="material-symbols-outlined text-[20px] text-[#541a97]">{b.icon}</span>
                <span>{b.texto}</span>
              </li>
            ))}
          </ul>
          <p className="text-[11px] text-slate-400 mt-5 leading-relaxed">
            Tu membresía se activa cuando un administrador valida el comprobante. Si vence, tus datos se conservan y vuelves a verlos al renovar.
          </p>
        </aside>
      </div>
    </div>
  );
}
