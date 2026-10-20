import { Router } from 'express';
import { query } from '../db/pool.js';
import { asyncHandler, HttpError } from '../lib/http.js';

export const storiesRouter = Router();

const LIST_COLUMNS = `
  slug, title, client_name AS clientName, industry, country, service_slug AS serviceSlug,
  summary, cover_image AS coverImage, is_featured AS isFeatured, is_sample AS isSample, published_at AS publishedAt`;

const toBool = (row) => ({ ...row, isFeatured: Boolean(row.isFeatured), isSample: Boolean(row.isSample) });

function parseJson(text, fallback) {
  if (text && typeof text === 'object') return text; // driver already parsed it
  try {
    return JSON.parse(text);
  } catch {
    return fallback;
  }
}

/** GET /api/stories?industry=Manufacturing&service=odoo-services */
storiesRouter.get('/', asyncHandler(async (req, res) => {
  const where = ['is_published = 1', 'published_at <= UTC_TIMESTAMP()'];
  const params = [];
  if (typeof req.query.industry === 'string' && req.query.industry && req.query.industry !== 'all') {
    where.push('industry = ?');
    params.push(req.query.industry.slice(0, 100));
  }
  if (typeof req.query.service === 'string' && req.query.service && req.query.service !== 'all') {
    where.push('service_slug = ?');
    params.push(req.query.service.slice(0, 60));
  }
  const rows = await query(
    `SELECT ${LIST_COLUMNS} FROM customer_stories
      WHERE ${where.join(' AND ')}
      ORDER BY is_featured DESC, published_at DESC, id DESC
      LIMIT 60`,
    params,
  );
  res.json(rows.map(toBool));
}));

storiesRouter.get('/:slug', asyncHandler(async (req, res) => {
  const [row] = await query(
    `SELECT ${LIST_COLUMNS}, apps, challenge, approach, results, quote, quote_author AS quoteAuthor
       FROM customer_stories
      WHERE slug = ? AND is_published = 1 AND published_at <= UTC_TIMESTAMP()`,
    [String(req.params.slug).slice(0, 160)],
  );
  if (!row) throw new HttpError(404, 'We could not find that story.');

  const more = await query(
    `SELECT ${LIST_COLUMNS} FROM customer_stories
      WHERE is_published = 1 AND published_at <= UTC_TIMESTAMP() AND slug <> ?
      ORDER BY (industry = ?) DESC, published_at DESC LIMIT 2`,
    [row.slug, row.industry],
  );

  res.json({
    ...toBool(row),
    approach: parseJson(row.approach, []),
    results: parseJson(row.results, []),
    more: more.map(toBool),
  });
}));
