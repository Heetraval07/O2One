import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { query } from '../../db/pool.js';
import { config } from '../../config/env.js';
import { asyncHandler, HttpError } from '../../lib/http.js';
import { validate } from '../../lib/validate.js';
import { hashPassword, newToken, parseCookies, passwordProblem, sha256, verifyPassword } from '../../lib/auth.js';
import { sendSystemEmail, mailEnabled } from '../../services/mailer.js';
import { COOKIE, endCookie, purgeExpired, requireAdmin, startSession } from './session.js';

export const authRouter = Router();

const tooMany = { error: 'Too many attempts. Please wait a few minutes and try again.' };
const limiter = (limit, extra = {}) =>
  rateLimit({ windowMs: 15 * 60_000, limit, standardHeaders: 'draft-8', legacyHeaders: false, message: tooMany, ...extra });
const loginLimiter = limiter(10, { skipSuccessfulRequests: true });
const mailLimiter = limiter(5);
const tokenLimiter = limiter(15);

const emailRule = { label: 'Email', required: true, max: 190, format: 'email' };
const passwordRule = (label) => ({ label, required: true, max: 200, collapse: false });
const LINK_MINUTES = 60;

// A real hash to compare against when the email is unknown, so response time doesn't reveal which emails exist.
let dummyHash;
const getDummyHash = async () => (dummyHash ??= await hashPassword('not-a-real-password'));

async function createLink(adminId, kind, newEmail = null) {
  const token = newToken();
  await query('DELETE FROM admin_tokens WHERE admin_id = ? AND kind = ?', [adminId, kind]);
  await query(
    'INSERT INTO admin_tokens (token_hash, admin_id, kind, new_email, expires_at) VALUES (?, ?, ?, ?, UTC_TIMESTAMP() + INTERVAL ? MINUTE)',
    [sha256(token), adminId, kind, newEmail, LINK_MINUTES],
  );
  return token;
}

async function takeLink(token, kind) {
  if (typeof token !== 'string' || token.length < 20 || token.length > 100) throw new HttpError(400, 'This link is not valid.');
  const [row] = await query(
    `SELECT t.token_hash, t.admin_id AS adminId, t.new_email AS newEmail, a.email
       FROM admin_tokens t JOIN admin_users a ON a.id = t.admin_id
      WHERE t.token_hash = ? AND t.kind = ? AND t.used_at IS NULL AND t.expires_at > UTC_TIMESTAMP()`,
    [sha256(token), kind],
  );
  if (!row) throw new HttpError(400, 'This link has expired or was already used. Please request a new one.');
  await query('UPDATE admin_tokens SET used_at = UTC_TIMESTAMP() WHERE token_hash = ?', [row.token_hash]);
  return row;
}

// ---- Sign in / out -------------------------------------------------------------
authRouter.post('/login', loginLimiter, asyncHandler(async (req, res) => {
  const data = validate(req.body, { email: emailRule, password: passwordRule('Password') });
  const [admin] = await query('SELECT id, email, password_hash AS hash FROM admin_users WHERE email = ?', [data.email]);
  const ok = await verifyPassword(data.password, admin ? admin.hash : await getDummyHash());
  if (!admin || !ok) throw new HttpError(401, 'Email or password is incorrect.');

  await query('UPDATE admin_users SET last_login_at = UTC_TIMESTAMP() WHERE id = ?', [admin.id]);
  await startSession(res, admin.id);
  purgeExpired();
  res.json({ email: admin.email, mailEnabled });
}));

authRouter.post('/logout', asyncHandler(async (req, res) => {
  const token = parseCookies(req.headers.cookie)[COOKIE];
  if (token) await query('DELETE FROM admin_sessions WHERE id = ?', [sha256(token)]);
  endCookie(res);
  res.json({ ok: true });
}));

authRouter.get('/me', requireAdmin, (req, res) => res.json({ email: req.admin.email, mailEnabled }));

// ---- Forgot / reset password (by email) -------------------------------------------
authRouter.post('/forgot', mailLimiter, asyncHandler(async (req, res) => {
  const data = validate(req.body, { email: emailRule });
  const [admin] = await query('SELECT id, email FROM admin_users WHERE email = ?', [data.email]);
  if (admin) {
    const token = await createLink(admin.id, 'password');
    await sendSystemEmail({
      to: admin.email,
      subject: 'Reset your O2One admin password',
      text: [
        'Someone asked to reset the password for the O2One admin area.',
        '',
        `Choose a new password here (valid for ${LINK_MINUTES} minutes, works once):`,
        `${config.publicUrl}/admin/reset?token=${token}`,
        '',
        'If this was not you, ignore this email. Your password stays the same.',
      ].join('\n'),
    }).catch((err) => console.error('[mail] reset email failed:', err.message));
  }
  // Same answer whether or not the address exists.
  res.json({ ok: true });
}));

authRouter.post('/reset', tokenLimiter, asyncHandler(async (req, res) => {
  const data = validate(req.body, { token: { label: 'Link', required: true, max: 100 }, password: passwordRule('Password') });
  const link = await takeLink(data.token, 'password');
  const problem = passwordProblem(data.password, link.email);
  if (problem) {
    // Let them try again with the same link.
    await query('UPDATE admin_tokens SET used_at = NULL WHERE token_hash = ?', [sha256(data.token)]);
    throw new HttpError(422, problem, { password: problem });
  }
  await query('UPDATE admin_users SET password_hash = ? WHERE id = ?', [await hashPassword(data.password), link.adminId]);
  await query('DELETE FROM admin_sessions WHERE admin_id = ?', [link.adminId]); // signs out everywhere
  res.json({ ok: true });
}));

// ---- Confirm a new email address (link sent to the new address) ----------------------
authRouter.post('/confirm-email', tokenLimiter, asyncHandler(async (req, res) => {
  const data = validate(req.body, { token: { label: 'Link', required: true, max: 100 } });
  const link = await takeLink(data.token, 'email');
  try {
    await query('UPDATE admin_users SET email = ? WHERE id = ?', [link.newEmail, link.adminId]);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') throw new HttpError(409, 'That email address is already in use.');
    throw err;
  }
  res.json({ ok: true, email: link.newEmail });
}));

// ---- Account (signed in) -----------------------------------------------------------------
async function checkCurrentPassword(adminId, password) {
  const [admin] = await query('SELECT password_hash AS hash FROM admin_users WHERE id = ?', [adminId]);
  if (!(await verifyPassword(password, admin.hash))) {
    const msg = 'Your current password is not correct.';
    throw new HttpError(422, msg, { currentPassword: msg });
  }
}

authRouter.post('/account/password', requireAdmin, mailLimiter, asyncHandler(async (req, res) => {
  const data = validate(req.body, { currentPassword: passwordRule('Current password'), newPassword: passwordRule('New password') });
  await checkCurrentPassword(req.admin.id, data.currentPassword);
  const problem = passwordProblem(data.newPassword, req.admin.email);
  if (problem) throw new HttpError(422, problem, { newPassword: problem });
  await query('UPDATE admin_users SET password_hash = ? WHERE id = ?', [await hashPassword(data.newPassword), req.admin.id]);
  await query('DELETE FROM admin_sessions WHERE admin_id = ? AND id <> ?', [req.admin.id, req.admin.sessionId]);
  res.json({ ok: true });
}));

authRouter.post('/account/email', requireAdmin, mailLimiter, asyncHandler(async (req, res) => {
  const data = validate(req.body, { newEmail: { ...emailRule, label: 'New email' }, currentPassword: passwordRule('Current password') });
  await checkCurrentPassword(req.admin.id, data.currentPassword);
  if (data.newEmail === req.admin.email) {
    throw new HttpError(422, 'That is already your email.', { newEmail: 'That is already your email.' });
  }
  const [taken] = await query('SELECT id FROM admin_users WHERE email = ?', [data.newEmail]);
  if (taken) throw new HttpError(422, 'That email address is already in use.', { newEmail: 'That email address is already in use.' });

  if (!mailEnabled) {
    // No mail server configured, so a confirmation email is impossible: apply it now (password already checked).
    await query('UPDATE admin_users SET email = ? WHERE id = ?', [data.newEmail, req.admin.id]);
    return res.json({ ok: true, applied: true, email: data.newEmail });
  }
  const token = await createLink(req.admin.id, 'email', data.newEmail);
  await sendSystemEmail({
    to: data.newEmail,
    subject: 'Confirm your new O2One admin email',
    text: [
      'Confirm this address as the login email for the O2One admin area:',
      `${config.publicUrl}/admin/confirm-email?token=${token}`,
      '',
      `The link works once and expires in ${LINK_MINUTES} minutes. If you did not ask for this, ignore this email.`,
    ].join('\n'),
  });
  res.json({ ok: true, applied: false });
}));
