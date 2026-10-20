import { Router } from 'express';
import { query } from '../../db/pool.js';
import { asyncHandler, HttpError } from '../../lib/http.js';
import { intParam, likeEscape, validate } from '../../lib/validate.js';
import { toCsv } from '../../lib/csv.js';

export const newsletterAdminRouter = Router();

function filters(q) {
  const where = [];
  const params = [];
  if (['subscribed', 'unsubscribed'].includes(q.status)) {
    where.push('status = ?');
    params.push(q.status);
  }
  const text = typeof q.q === 'string' ? q.q.trim().slice(0, 80) : '';
  if (text) {
    where.push('email LIKE ?');
    params.push(`%${likeEscape(text)}%`);
  }
  return { sql: where.length ? `WHERE ${where.join(' AND ')}` : '', params };
}

newsletterAdminRouter.get('/', asyncHandler(async (req, res) => {
  const limit = intParam(req.query.limit, { min: 1, max: 100, fallback: 25 });
  const page = intParam(req.query.page, { min: 1, max: 10000, fallback: 1 });
  const f = filters(req.query);
  const [{ total }] = await query(`SELECT COUNT(*) AS total FROM newsletter_subscribers ${f.sql}`, f.params);
  const rows = await query(
    `SELECT id, email, status, source, created_at AS createdAt FROM newsletter_subscribers ${f.sql}
      ORDER BY created_at DESC, id DESC LIMIT ${limit} OFFSET ${(page - 1) * limit}`,
    f.params,
  );
  const counts = await query('SELECT status, COUNT(*) AS n FROM newsletter_subscribers GROUP BY status');
  res.json({
    subscribers: rows,
    page,
    limit,
    total: Number(total),
    counts: {
      subscribed: Number(counts.find((c) => c.status === 'subscribed')?.n || 0),
      unsubscribed: Number(counts.find((c) => c.status === 'unsubscribed')?.n || 0),
    },
  });
}));

newsletterAdminRouter.get('/export.csv', asyncHandler(async (req, res) => {
  const f = filters(req.query);
  const rows = await query(
    `SELECT email, status, source, created_at AS createdAt FROM newsletter_subscribers ${f.sql} ORDER BY created_at DESC LIMIT 50000`,
    f.params,
  );
  res.set({ 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="o2one-subscribers.csv"' });
  res.send(toCsv([['Email', 'Status', 'Source', 'Signed up (UTC)'], ...rows.map((r) => [r.email, r.status, r.source, r.createdAt])]));
}));

newsletterAdminRouter.patch('/:id', asyncHandler(async (req, res) => {
  const data = validate(req.body, { status: { label: 'Status', required: true, oneOf: ['subscribed', 'unsubscribed'] } });
  const result = await query('UPDATE newsletter_subscribers SET status = ? WHERE id = ?', [data.status, Number(req.params.id) || 0]);
  if (!result.affectedRows) throw new HttpError(404, 'Subscriber not found.');
  res.json({ ok: true });
}));

newsletterAdminRouter.delete('/:id', asyncHandler(async (req, res) => {
  const result = await query('DELETE FROM newsletter_subscribers WHERE id = ?', [Number(req.params.id) || 0]);
  if (!result.affectedRows) throw new HttpError(404, 'Subscriber not found.');
  res.json({ ok: true });
}));
