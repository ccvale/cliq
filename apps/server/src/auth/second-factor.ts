import type { Db } from '../db.js';
import { checkTotp, hashBackupCode, openSecret } from './totp.js';

/**
 * Accepts a current authenticator code (each one only once) or an unused backup code.
 * Returns false for anything else, including accounts without two-step verification.
 */
export async function checkSecondFactor(db: Db, userId: string, code: string) {
  const user = await db.one<{ totp_secret: string | null; totp_last_step: string | null }>(
    'SELECT totp_secret, totp_last_step FROM users WHERE id = $1 AND totp_enabled_at IS NOT NULL',
    [userId],
  );
  if (!user?.totp_secret) return false;
  const clean = code.replace(/\s/g, '');
  if (/^\d{6}$/.test(clean)) {
    const step = checkTotp(openSecret(user.totp_secret), clean);
    if (step === null || (user.totp_last_step !== null && step <= Number(user.totp_last_step))) return false;
    await db.query('UPDATE users SET totp_last_step = $2 WHERE id = $1', [userId, step]);
    return true;
  }
  const used = await db.one(
    'UPDATE backup_codes SET used_at = now() WHERE user_id = $1 AND code_hash = $2 AND used_at IS NULL RETURNING 1',
    [userId, hashBackupCode(clean)],
  );
  return !!used;
}
