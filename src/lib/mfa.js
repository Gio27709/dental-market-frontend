import { supabase } from "./supabaseClient";

// Verificación en dos pasos (TOTP) con Supabase Auth. Obligatoria para admin y owner: el
// backend rechaza las rutas de administración si la sesión no está en nivel aal2.
// Flujo: enroll() → el usuario escanea el QR → verifyCode(factorId, código) → la sesión
// sube a aal2. En cada inicio de sesión posterior: challenge + verifyCode.

// Ojo: supabase-js solo mete en `factors.totp` los factores VERIFICADOS; los intentos a medias
// (el usuario cerró el QR sin confirmar) solo aparecen en `factors.all`. Filtrar por `.totp`
// hacía que nunca se limpiaran y el siguiente enroll fallara con «A factor with the friendly
// name "Forcepx" for this user already exists» (lo que les pasó a los admins el 07-09).
const totpFactors = (factors) => (factors?.all || []).filter((f) => f.factor_type === "totp");

async function removeUnverified() {
  const { data: factors, error } = await supabase.auth.mfa.listFactors();
  if (error) throw error;
  for (const f of totpFactors(factors).filter((x) => x.status !== "verified")) {
    const { error: uErr } = await supabase.auth.mfa.unenroll({ factorId: f.id });
    if (uErr) throw uErr;
  }
}

/** { currentLevel: "aal1"|"aal2", nextLevel, hasVerifiedFactor } */
export async function getMfaState() {
  const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (error) throw error;
  const { data: factors, error: fErr } = await supabase.auth.mfa.listFactors();
  if (fErr) throw fErr;
  const all = totpFactors(factors);
  const verified = all.filter((f) => f.status === "verified");
  return {
    currentLevel: data.currentLevel,
    nextLevel: data.nextLevel,
    hasVerifiedFactor: verified.length > 0,
    factorId: verified[0]?.id || null,
    unverified: all.filter((f) => f.status !== "verified"),
  };
}

/** Inicia la vinculación: devuelve { factorId, qrCode (data URL), secret }. */
export async function enrollTotp() {
  // Limpia intentos abandonados para que Supabase no acumule factores sin verificar.
  await removeUnverified();
  let res = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: "Forcepx" });
  if (res.error && /already exists/i.test(res.error.message)) {
    // Quedó alguno a medias que no vimos (p. ej. dos pestañas a la vez): limpiar y reintentar una vez.
    await removeUnverified();
    res = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: "Forcepx" });
  }
  if (res.error) throw res.error;
  const { data } = res;
  return { factorId: data.id, qrCode: data.totp.qr_code, secret: data.totp.secret };
}

/** Comprueba un código de 6 dígitos contra el factor; si es correcto, la sesión pasa a aal2. */
export async function verifyCode(factorId, code) {
  const { data: ch, error: chErr } = await supabase.auth.mfa.challenge({ factorId });
  if (chErr) throw chErr;
  const { data, error } = await supabase.auth.mfa.verify({ factorId, challengeId: ch.id, code: String(code).replace(/\s+/g, "") });
  if (error) throw error;
  return data;
}
