/**
 * Vocabulario único del sistema de sanciones.
 *
 * Antes cada panel tenía el suyo: el admin y la tienda pintaban etiquetas distintas para el
 * mismo estado ("En Revisión" frente a "Pendiente"), colores distintos para el mismo tipo, y
 * —lo peor— DOS parseadores diferentes del mismo campo `reason`: uno con expresiones
 * regulares y otro partiendo el texto a mano. Cualquier cambio en el formato del motivo
 * rompía uno de los dos en silencio, y solo se notaba mirando la pantalla equivocada.
 */

export const PENALTY_TYPES = {
  warning: {
    label: "Amonestación",
    short: "Amonestación",
    icon: "⚠️",
    dot: "bg-amber-500",
    text: "text-amber-700",
    chip: "bg-amber-50 border-amber-200 text-amber-800",
  },
  fine: {
    label: "Multa",
    short: "Multa",
    icon: "💸",
    dot: "bg-orange-500",
    text: "text-orange-700",
    chip: "bg-orange-50 border-orange-200 text-orange-800",
  },
  suspension: {
    label: "Suspensión",
    short: "Suspensión",
    icon: "🚨",
    dot: "bg-rose-500",
    text: "text-rose-700",
    chip: "bg-rose-50 border-rose-200 text-rose-800",
  },
  cancellation: {
    label: "Cancelación",
    short: "Cancelación",
    icon: "🚫",
    dot: "bg-slate-500",
    text: "text-slate-700",
    chip: "bg-slate-50 border-slate-200 text-slate-800",
  },
};

export const PENALTY_STATUSES = {
  pending_review: {
    label: "Pendiente de revisión",
    chip: "bg-amber-100/70 text-amber-800 border-amber-200",
    hint: "Esperando que un administrador la aplique o la descarte.",
  },
  applied: {
    label: "Aplicada",
    chip: "bg-rose-100/70 text-rose-800 border-rose-200",
    hint: "La sanción está en vigor y su efecto ya se ejecutó.",
  },
  dismissed: {
    label: "Descartada",
    chip: "bg-emerald-100/70 text-emerald-800 border-emerald-200",
    hint: "Anulada por un administrador: no tiene ninguna consecuencia.",
  },
};

export const typeOf = (t) => PENALTY_TYPES[t] || PENALTY_TYPES.warning;
export const statusOf = (s) => PENALTY_STATUSES[s] || PENALTY_STATUSES.pending_review;

const APPEAL_PREFIX = "📝 Apelación de tienda:";
const ADMIN_PREFIX = "Resuelto por Admin:";

/**
 * Separa las tres voces que `store_penalties.reason` acumula con " | ":
 * el motivo del sistema, la apelación de la tienda y la resolución del administrador.
 *
 * Todo segmento sin prefijo conocido se trata como motivo del sistema, para que un formato
 * inesperado se vea en pantalla en vez de desaparecer.
 */
export const parseReason = (raw) => {
  const out = { system: "", appeal: "", resolution: "" };
  String(raw || "")
    .split(/\s*\|\s*/)
    .forEach((seg) => {
      const s = seg.trim();
      if (!s) return;
      if (s.startsWith(APPEAL_PREFIX)) out.appeal = s.slice(APPEAL_PREFIX.length).trim();
      else if (s.startsWith(ADMIN_PREFIX)) out.resolution = s.slice(ADMIN_PREFIX.length).trim();
      else out.system = out.system ? `${out.system} | ${s}` : s;
    });
  return out;
};

export const hasAppeal = (p) =>
  Boolean(p?.has_appeal ?? String(p?.reason || "").includes("Apelaci"));

/**
 * Detecta las sanciones cuyo motivo original se perdió.
 *
 * Antes de la migración 063, reactivar una tienda SUSTITUÍA el `reason` entero en vez de
 * añadir la resolución. Seis filas quedaron diciendo solo "Descartada por reactivación
 * manual del administrador": eso es la resolución ocupando el sitio del motivo, así que
 * quien las lee cree estar viendo por qué se sancionó cuando no es así. El retraso sí se
 * recuperó (migración 066), el texto no.
 */
export const hasLostReason = (p) =>
  /^Descartada por reactivaci[oó]n manual del administrador/.test(String(p?.reason || "").trim());

/**
 * Una sanción está esperando algo de la TIENDA cuando no la ha archivado, no está
 * descartada, no la ha apelado y ningún admin la ha resuelto todavía.
 */
export const needsStoreAction = (p) =>
  !p?.is_acknowledged && p?.status !== "dismissed" && !hasAppeal(p) && !p?.resolved_by;

/** La tienda solo puede apelar lo que aún está en juego. */
export const canAppeal = (p) =>
  p?.status === "pending_review" ||
  ((p?.type === "suspension" || p?.type === "cancellation") && p?.status === "applied");

/**
 * Qué hace REALMENTE "aplicar" según el tipo, para que el botón no prometa de más.
 */
export const applyAction = (p) => {
  const monto = Number(p?.amount || 0).toFixed(2);
  switch (p?.type) {
    case "fine":
      return {
        label: `Cobrar $${monto}`,
        hint: "Descuenta el monto del saldo disponible de la tienda. Si no alcanza, el resto queda como deuda y se cobra de sus próximas ventas.",
        toast: `Multa de $${monto} cobrada a la tienda`,
      };
    case "suspension":
      return {
        label: "Suspender tienda",
        hint: "Bloquea la operación de la tienda hasta que se levante la suspensión.",
        toast: "Suspensión aplicada: la tienda queda bloqueada",
      };
    default:
      return {
        label: "Aplicar",
        hint: "Deja la sanción registrada como ejecutada en el historial de la tienda.",
        toast: "Sanción aplicada",
      };
  }
};

/**
 * Qué significa descartar, que NO es lo mismo en cada tipo. El texto genérico de antes
 * ("la tienda no sufrirá ninguna consecuencia") era falso para una cancelación, donde el
 * pedido ya está anulado y el reembolso abierto.
 */
export const dismissAction = (p) => {
  switch (p?.type) {
    case "fine":
      return p?.status === "applied"
        ? {
            title: "Anular multa cobrada",
            blurb: `La multa de $${Number(p.amount || 0).toFixed(2)} se devolverá a la tienda: primero se cancela la deuda que hubiera generado y el resto vuelve a su saldo disponible.`,
          }
        : {
            title: "Descartar multa",
            blurb: "La multa queda anulada y no se cobrará nada a la tienda.",
          };
    case "suspension":
      return {
        title: "Levantar suspensión",
        blurb: "La tienda vuelve a operar si no le queda ninguna otra suspensión activa.",
      };
    case "cancellation":
      return {
        title: "Descartar cancelación",
        blurb: "Limpia la sanción del historial de la tienda. OJO: el pedido ya fue cancelado y su reembolso ya está abierto — esto no los deshace.",
      };
    default:
      return {
        title: "Descartar amonestación",
        blurb: "La amonestación deja de contar en el historial de la tienda.",
      };
  }
};

/** Horas de retraso en algo que se pueda leer de un vistazo. */
export const formatDelay = (horas) => {
  const h = Number(horas);
  if (!Number.isFinite(h) || h <= 0) return null;
  if (h < 48) return `${Math.round(h)} h`;
  const dias = Math.floor(h / 24);
  const resto = Math.round(h % 24);
  return resto ? `${dias} d ${resto} h` : `${dias} d`;
};
