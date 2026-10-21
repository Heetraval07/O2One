import { Router } from 'express';
import { query } from '../../db/pool.js';
import { asyncHandler, HttpError } from '../../lib/http.js';
import { intParam, likeEscape, validate } from '../../lib/validate.js';
import { releaseMedia } from '../../lib/media.js';

export const storiesAdminRouter = Router();

const SERVICES = ['business-consultation', 'odoo-services', 'custom-industry-solutions', 'ai-automation'];

const schema = {
  title: { label: 'Title', required: true, max: 200 },
  slug: { label: 'Web address', required: true, max: 160, format: 'slug' },
  clientName: { label: 'Client', required: true, max: 160 },
  industry: { label: 'Industry', required: true, max: 100 },
  country: { label: 'Country', required: true, max: 80 },
  serviceSlug: { label: 'Service', required: true, oneOf: SERVICES },
  apps: { label: 'Odoo apps', max: 255 },
  summary: { label: 'Summary', required: true, max: 400 },
  challenge: { label: 'Challenge', required: true, max: 8000, multiline: true },
  approach: { type: 'stringArray', label: 'Approach steps', max: 12 },
  quote: { label: 'Quote', max: 500 },
  quoteAuthor: { label: 'Quote author', max: 160 },
  coverImage: { label: 'Cover image', max: 255 },
  isFeatured: { type: 'boolean' },
  isSample: { type: 'boolean' },
  isPublished: { type: 'boolean' },
  publishedAt: { label: 'Publish date', format: 'datetime' },
};

/** Results are a list of { value, label } pairs, e.g. { value: "10 weeks", label: "to go live" }. */
function cleanResults(raw) {
  if (raw == null) return [];
  if (!Array.isArray(raw) || raw.length > 8) {
    throw new HttpError(422, 'Results must be a short list.', { results: 'Results must be a short list.' });
  }
  return raw
    .map((r) => ({ value: String(r?.value ?? '').trim().slice(0, 40), label: String(r?.label ?? '').trim().slice(0, 80) }))
    .filter((r) => r.value || r.label)
    .map((r) => {
      if (!r.value || !r.label) {
        throw new HttpError(422, 'Each result needs both a number and a label.', { results: 'Each result needs both a number and a label.' });
      }
      return r;
    });
}

function clean(body) {
  const d = validate(body, schema);
  return { ...d, results: cleanResults(body?.results), publishedAt: d.publishedAt || new Date() };
}

const dupSlug = (err) => {
  if (err.code === 'ER_DUP_ENTRY') {
    throw new HttpError(422, 'That web address is already used by another story.', { slug: 'That web address is already used by another story.' });
  }
  throw err;
};

const parseJson = (text, fallback) => {
  if (text && typeof text === 'object') return text;
  try {
    return JSON.parse(text);
  } catch {
    return fallback;
  }
};

storiesAdminRouter.get('/', asyncHandler(async (req, res) => {
  const limit = intParam(req.query.limit, { min: 1, max: 100, fallback: 50 });
  const where = [];
  const params = [];
  if (req.query.status === 'draft') where.push('is_published = 0');
  if (req.query.status === 'live') where.push('is_published = 1 AND published_at <= UTC_TIMESTAMP()');
  if (req.query.status === 'scheduled') where.push('is_published = 1 AND published_at > UTC_TIMESTAMP()');
  const q = typeof req.query.q === 'string' ? req.query.q.trim().slice(0, 80) : '';
  if (q) {
    where.push('(title LIKE ? OR client_name LIKE ?)');
    params.push(`%${likeEscape(q)}%`, `%${likeEscape(q)}%`);
  }
  const rows = await query(
    `SELECT id, slug, title, client_name AS clientName, industry, service_slug AS serviceSlug, is_featured AS isFeatured,
            is_sample AS isSample, is_published AS isPublished, published_at AS publishedAt,
            CASE WHEN is_published = 0 THEN 'draft' WHEN published_at > UTC_TIMESTAMP() THEN 'scheduled' ELSE 'live' END AS status
       FROM customer_stories ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
      ORDER BY published_at DESC, id DESC LIMIT ${limit}`,
    params,
  );
  res.json(rows.map((r) => ({ ...r, isFeatured: Boolean(r.isFeatured), isSample: Boolean(r.isSample), isPublished: Boolean(r.isPublished) })));
}));

storiesAdminRouter.get('/:id', asyncHandler(async (req, res) => {
  const [r] = await query(
    `SELECT id, slug, title, client_name AS clientName, industry, country, service_slug AS serviceSlug, apps, summary, challenge,
            approach, results, quote, quote_author AS quoteAuthor, cover_image AS coverImage, is_featured AS isFeatured,
            is_sample AS isSample, is_published AS isPublished, published_at AS publishedAt
       FROM customer_stories WHERE id = ?`,
    [Number(req.params.id) || 0],
  );
  if (!r) throw new HttpError(404, 'Story not found.');
  res.json({
    ...r,
    approach: parseJson(r.approach, []),
    results: parseJson(r.results, []),
    isFeatured: Boolean(r.isFeatured),
    isSample: Boolean(r.isSample),
    isPublished: Boolean(r.isPublished),
  });
}));

const columns = (d) => [
  d.slug, d.title, d.clientName, d.industry, d.country, d.serviceSlug, d.apps, d.summary, d.challenge,
  JSON.stringify(d.approach), JSON.stringify(d.results), d.quote, d.quoteAuthor, d.coverImage,
  d.isFeatured ? 1 : 0, d.isSample ? 1 : 0, d.isPublished ? 1 : 0, d.publishedAt,
];

storiesAdminRouter.post('/', asyncHandler(async (req, res) => {
  const d = clean(req.body);
  try {
    const r = await query(
      `INSERT INTO customer_stories (slug, title, client_name, industry, country, service_slug, apps, summary, challenge,
                                     approach, results, quote, quote_author, cover_image, is_featured, is_sample, is_published, published_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      columns(d),
    );
    res.status(201).json({ id: r.insertId });
  } catch (err) {
    dupSlug(err);
  }
}));

storiesAdminRouter.put('/:id', asyncHandler(async (req, res) => {
  const d = clean(req.body);
  const [before] = await query('SELECT cover_image AS coverImage FROM customer_stories WHERE id = ?', [Number(req.params.id) || 0]);
  try {
    const r = await query(
      `UPDATE customer_stories SET slug = ?, title = ?, client_name = ?, industry = ?, country = ?, service_slug = ?, apps = ?,
              summary = ?, challenge = ?, approach = ?, results = ?, quote = ?, quote_author = ?, cover_image = ?,
              is_featured = ?, is_sample = ?, is_published = ?, published_at = ?
        WHERE id = ?`,
      [...columns(d), Number(req.params.id) || 0],
    );
    if (!r.affectedRows) throw new HttpError(404, 'Story not found.');
    if (before?.coverImage && before.coverImage !== d.coverImage) await releaseMedia(before.coverImage);
    res.json({ ok: true });
  } catch (err) {
    dupSlug(err);
  }
}));

storiesAdminRouter.patch('/:id', asyncHandler(async (req, res) => {
  const d = validate(req.body, { isPublished: { type: 'boolean' } });
  const r = await query('UPDATE customer_stories SET is_published = ? WHERE id = ?', [d.isPublished ? 1 : 0, Number(req.params.id) || 0]);
  if (!r.affectedRows) throw new HttpError(404, 'Story not found.');
  res.json({ ok: true });
}));

storiesAdminRouter.delete('/:id', asyncHandler(async (req, res) => {
  const [before] = await query('SELECT cover_image AS coverImage FROM customer_stories WHERE id = ?', [Number(req.params.id) || 0]);
  const r = await query('DELETE FROM customer_stories WHERE id = ?', [Number(req.params.id) || 0]);
  if (!r.affectedRows) throw new HttpError(404, 'Story not found.');
  await releaseMedia(before?.coverImage);
  res.json({ ok: true });
}));
