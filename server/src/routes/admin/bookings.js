import { Router } from 'express';
import { query } from '../../db/pool.js';
import { config } from '../../config/env.js';
import { asyncHandler, HttpError } from '../../lib/http.js';
import { intParam, likeEscape, validate } from '../../lib/validate.js';
import { toCsv } from '../../lib/csv.js';

export const bookingsRouter = Router();

const STATUSES = ['new', 'confirmed', 'completed', 'cancelled'];
const SOURCES = ['checkup', 'vat_readiness'];

const COLUMNS = `
  id, reference, full_name AS fullName, company, email, phone, industry, country, message,
  meeting_mode AS meetingMode, slot_start AS slotStart, source, readiness_items AS readinessItems,
  status, admin_notes AS adminNotes, created_at AS createdAt`;

function parseItems(text) {
  if (Array.isArray(text)) return text;
  try {
    return JSON.parse(text) || [];
  } catch {
    return [];
  }
}
const shape = (r) => ({ ...r, readinessItems: parseItems(r.readinessItems) });

/** Filters shared by the list and the CSV export. Dates are Dubai-local days (YYYY-MM-DD). */
function filters(q) {
  const where = [];
  const params = [];
  if (STATUSES.includes(q.status)) {
    where.push('status = ?');
    params.push(q.status);
  }
  if (SOURCES.includes(q.source)) {
    where.push('source = ?');
    params.push(q.source);
  }
  const offsetMs = config.booking.utcOffsetMinutes * 60_000;
  const day = (s) => (/^\d{4}-\d{2}-\d{2}$/.test(s || '') ? Date.parse(`${s}T00:00:00Z`) - offsetMs : null);
  const from = day(q.from);
  const to = day(q.to);
  if (from != null) {
    where.push('slot_start >= ?');
    params.push(new Date(from));
  }
  if (to != null) {
    where.push('slot_start < ?');
    params.push(new Date(to + 86_400_000));
  }
  const text = typeof q.q === 'string' ? q.q.trim().slice(0, 80) : '';
  if (text) {
    const like = `%${likeEscape(text)}%`;
    where.push('(full_name LIKE ? OR company LIKE ? OR email LIKE ? OR phone LIKE ? OR reference LIKE ?)');
    params.push(like, like, like, like, like);
  }
  return { sql: where.length ? `WHERE ${where.join(' AND ')}` : '', params };
}

bookingsRouter.get('/', asyncHandler(async (req, res) => {
  const limit = intParam(req.query.limit, { min: 1, max: 100, fallback: 20 });
  const page = intParam(req.query.page, { min: 1, max: 10000, fallback: 1 });
  const order = req.query.order === 'slot_desc' ? 'slot_start DESC' : req.query.order === 'slot_asc' ? 'slot_start ASC' : 'created_at DESC';
  // Counts per status ignore the status filter itself, so the tabs always show every status.
  const { status: _status, ...rest } = req.query;
  const tabs = filters(rest);
  const counts = await query(`SELECT status, COUNT(*) AS n FROM checkup_bookings ${tabs.sql} GROUP BY status`, tabs.params);

  const f = filters(req.query);
  const [{ total }] = await query(`SELECT COUNT(*) AS total FROM checkup_bookings ${f.sql}`, f.params);
  const rows = await query(
    `SELECT ${COLUMNS} FROM checkup_bookings ${f.sql} ORDER BY ${order}, id DESC LIMIT ${limit} OFFSET ${(page - 1) * limit}`,
    f.params,
  );
  res.json({
    bookings: rows.map(shape),
    page,
    limit,
    total: Number(total),
    counts: Object.fromEntries(STATUSES.map((s) => [s, Number(counts.find((c) => c.status === s)?.n || 0)])),
  });
}));

bookingsRouter.get('/export.csv', asyncHandler(async (req, res) => {
  const f = filters(req.query);
  const rows = await query(`SELECT ${COLUMNS} FROM checkup_bookings ${f.sql} ORDER BY slot_start DESC, id DESC LIMIT 20000`, f.params);
  const offsetMs = config.booking.utcOffsetMinutes * 60_000;
  const local = (d) => new Date(new Date(d).getTime() + offsetMs).toISOString().slice(0, 16).replace('T', ' ');
  const csv = toCsv([
    ['Reference', 'Status', 'Session (Dubai time)', 'Format', 'Source', 'Name', 'Company', 'Email', 'Phone', 'Industry', 'Country', 'Message', 'Ready today', 'Notes', 'Booked at (UTC)'],
    ...rows.map((r) => [
      r.reference, r.status, local(r.slotStart), r.meetingMode === 'in_person' ? 'In person' : 'Online',
      r.source === 'vat_readiness' ? 'VAT readiness' : 'Health checkup', r.fullName, r.company, r.email, r.phone,
      r.industry, r.country, r.message, parseItems(r.readinessItems).join('; '), r.adminNotes, r.createdAt,
    ]),
  ]);
  res.set({ 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="o2one-bookings.csv"' });
  res.send(csv);
}));

bookingsRouter.get('/:id', asyncHandler(async (req, res) => {
  const [row] = await query(`SELECT ${COLUMNS} FROM checkup_bookings WHERE id = ?`, [Number(req.params.id) || 0]);
  if (!row) throw new HttpError(404, 'Booking not found.');
  res.json(shape(row));
}));

/** Change the status and/or the private notes. Cancelling frees the time slot automatically. */
bookingsRouter.patch('/:id', asyncHandler(async (req, res) => {
  const id = Number(req.params.id) || 0;
  const data = validate(req.body, {
    status: { label: 'Status', oneOf: STATUSES },
    adminNotes: { label: 'Notes', max: 4000, multiline: true },
  });
  const sets = [];
  const params = [];
  if (req.body?.status !== undefined) {
    sets.push('status = ?');
    params.push(data.status);
  }
  if (req.body?.adminNotes !== undefined) {
    sets.push('admin_notes = ?');
    params.push(data.adminNotes);
  }
  if (!sets.length) throw new HttpError(400, 'Nothing to change.');
  try {
    const result = await query(`UPDATE checkup_bookings SET ${sets.join(', ')} WHERE id = ?`, [...params, id]);
    if (!result.affectedRows) throw new HttpError(404, 'Booking not found.');
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') throw new HttpError(409, 'That time slot has since been booked by someone else, so this booking cannot be reopened.');
    throw err;
  }
  const [row] = await query(`SELECT ${COLUMNS} FROM checkup_bookings WHERE id = ?`, [id]);
  res.json(shape(row));
}));

bookingsRouter.delete('/:id', asyncHandler(async (req, res) => {
  const result = await query('DELETE FROM checkup_bookings WHERE id = ?', [Number(req.params.id) || 0]);
  if (!result.affectedRows) throw new HttpError(404, 'Booking not found.');
  res.json({ ok: true });
}));
