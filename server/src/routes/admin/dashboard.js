import { Router } from 'express';
import { query } from '../../db/pool.js';
import { asyncHandler } from '../../lib/http.js';

export const dashboardRouter = Router();

const BOOKING_COLUMNS = `id, reference, full_name AS fullName, company, source, status, meeting_mode AS meetingMode,
  slot_start AS slotStart, created_at AS createdAt`;

dashboardRouter.get('/', asyncHandler(async (_req, res) => {
  const [bookingCounts, upcoming, recent, subs, posts, stories, week] = await Promise.all([
    query('SELECT status, COUNT(*) AS n FROM checkup_bookings GROUP BY status'),
    query(
      `SELECT ${BOOKING_COLUMNS} FROM checkup_bookings
        WHERE status IN ('new','confirmed') AND slot_start >= UTC_TIMESTAMP() ORDER BY slot_start ASC LIMIT 5`,
    ),
    query(`SELECT ${BOOKING_COLUMNS} FROM checkup_bookings ORDER BY created_at DESC, id DESC LIMIT 5`),
    query('SELECT status, COUNT(*) AS n FROM newsletter_subscribers GROUP BY status'),
    query(
      `SELECT SUM(is_published = 1 AND published_at <= UTC_TIMESTAMP()) AS live,
              SUM(is_published = 1 AND published_at > UTC_TIMESTAMP()) AS scheduled,
              SUM(is_published = 0) AS draft FROM blog_posts`,
    ),
    query(
      `SELECT SUM(is_published = 1 AND published_at <= UTC_TIMESTAMP()) AS live,
              SUM(is_published = 0) AS draft, SUM(is_sample = 1) AS samples FROM customer_stories`,
    ),
    query(
      `SELECT COUNT(*) AS n FROM checkup_bookings WHERE created_at >= UTC_TIMESTAMP() - INTERVAL 7 DAY`,
    ),
  ]);
  const by = (rows, key) => Object.fromEntries(rows.map((r) => [r[key], Number(r.n)]));
  const num = (o) => Object.fromEntries(Object.entries(o || {}).map(([k, v]) => [k, Number(v || 0)]));
  res.json({
    bookings: { ...by(bookingCounts, 'status'), newThisWeek: Number(week[0].n) },
    upcoming,
    recent,
    subscribers: by(subs, 'status'),
    posts: num(posts[0]),
    stories: num(stories[0]),
  });
}));
