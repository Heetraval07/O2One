import { query } from '../../db/pool.js';
import { config } from '../../config/env.js';
import { HttpError } from '../../lib/http.js';
import { newToken, parseCookies, sha256 } from '../../lib/auth.js';

export const COOKIE = 'o2one_admin';
const IDLE_HOURS = 12; // signed out after this long without activity
const MAX_DAYS = 7; // and always after this long

const cookieOptions = (maxAgeMs) => ({
  httpOnly: true, // not readable by page scripts
  sameSite: 'strict', // never sent from other sites
  secure: config.isProd,
  path: '/api/admin',
  maxAge: maxAgeMs,
});

export async function startSession(res, adminId) {
  const token = newToken();
  await query(
    'INSERT INTO admin_sessions (id, admin_id, expires_at) VALUES (?, ?, UTC_TIMESTAMP() + INTERVAL ? HOUR)',
    [sha256(token), adminId, IDLE_HOURS],
  );
  res.cookie(COOKIE, token, cookieOptions(IDLE_HOURS * 3_600_000));
}

export function endCookie(res) {
  res.clearCookie(COOKIE, cookieOptions(0));
}

/** Gate for every admin route except login and the email-link endpoints. */
export async function requireAdmin(req, _res, next) {
  try {
    const token = parseCookies(req.headers.cookie)[COOKIE];
    if (!token) throw new HttpError(401, 'Please sign in.');

    // Changing anything needs this header. Browsers only allow it from our own pages (a cross-site request
    // would need a CORS pre-flight, which the API never grants), on top of the SameSite cookie.
    if (!['GET', 'HEAD'].includes(req.method) && req.get('x-requested-with') !== 'o2one-admin') {
      throw new HttpError(403, 'Request blocked.');
    }

    const [row] = await query(
      `SELECT s.id AS sessionId, a.id, a.email
         FROM admin_sessions s JOIN admin_users a ON a.id = s.admin_id
        WHERE s.id = ? AND s.expires_at > UTC_TIMESTAMP() AND s.created_at > UTC_TIMESTAMP() - INTERVAL ? DAY`,
      [sha256(token), MAX_DAYS],
    );
    if (!row) throw new HttpError(401, 'Your session has ended. Please sign in again.');

    await query('UPDATE admin_sessions SET expires_at = UTC_TIMESTAMP() + INTERVAL ? HOUR WHERE id = ?', [IDLE_HOURS, row.sessionId]);
    req.admin = { id: row.id, email: row.email, sessionId: row.sessionId };
    next();
  } catch (err) {
    next(err);
  }
}

/** Housekeeping: drop expired sessions and used or expired links. */
export function purgeExpired() {
  return Promise.all([
    query('DELETE FROM admin_sessions WHERE expires_at < UTC_TIMESTAMP()'),
    query('DELETE FROM admin_tokens WHERE expires_at < UTC_TIMESTAMP() OR used_at IS NOT NULL'),
  ]).catch(() => {});
}
