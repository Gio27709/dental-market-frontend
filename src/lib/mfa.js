import { supabase } from "./supabaseClient";

// Verificación en dos pasos (TOTP) con Supabase Auth. Obligatoria para admin y owner: el
// backend rechaza las rutas de administración si la sesión no está en nivel aal2.
// Flujo: enroll() → el usuario escanea el QR → verifyCode(factorId, código) → la sesión
// sube a aal2. En cada inicio de sesión posterior: challenge + verifyCode.

/** { currentLevel: "aal1"|"aal2", nextLevel, hasVerifiedFactor } */
export async function getMfaState() {
  const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (error) throw error;
  const { data: factors, error: fErr } = await supabase.auth.mfa.listFactors();
  if (fErr) throw fErr;
  const verified = (factors?.totp || []).filter((f) => f.status === "verified");
  return {
    currentLevel: data.currentLevel,
    nextLevel: data.nextLevel,
    hasVerifiedFactor: verified.length > 0,
    factorId: verified[0]?.id || null,
    unverified: (factors?.totp || []).filter((f) => f.status !== "verified"),
  };
}

/** Inicia la vinculación: devuelve { factorId, qrCode (data URL), secret }. */
export async function enrollTotp() {
  // Limpia intentos abandonados para que Supabase no acumule factores sin verificar.
  const { data: factors } = await supabase.auth.mfa.listFactors();
  for (const f of (factors?.totp || []).filter((x) => x.status !== "verified")) {
    await supabase.auth.mfa.unenroll({ factorId: f.id });
  }
  const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: "Forcepx" });
  if (error) throw error;
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
