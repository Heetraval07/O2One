import { Router } from 'express';
import { query } from '../../db/pool.js';
import { asyncHandler, HttpError } from '../../lib/http.js';
import { intParam, likeEscape, validate } from '../../lib/validate.js';

export const blogAdminRouter = Router();

const slugRule = { label: 'Web address', required: true, max: 160, format: 'slug' };

const postSchema = {
  title: { label: 'Title', required: true, max: 200 },
  slug: slugRule,
  excerpt: { label: 'Summary', required: true, max: 400 },
  body: { label: 'Article', required: true, max: 120000, multiline: true },
  categoryId: { label: 'Category', required: true },
  authorName: { label: 'Author', max: 120, default: 'O2One team' },
  authorRole: { label: 'Author role', max: 120 },
  coverImage: { label: 'Cover image', max: 255 },
  readMinutes: { label: 'Reading time' },
  relatedService: { label: 'Related service', max: 60 },
  relatedStoryId: { label: 'Related story' },
  isPublished: { type: 'boolean' },
  publishedAt: { label: 'Publish date', format: 'datetime' },
};

const POST_LIST = `p.id, p.slug, p.title, p.is_published AS isPublished, p.published_at AS publishedAt,
  p.updated_at AS updatedAt, c.name AS categoryName, c.id AS categoryId,
  CASE WHEN p.is_published = 0 THEN 'draft' WHEN p.published_at > UTC_TIMESTAMP() THEN 'scheduled' ELSE 'live' END AS status`;

const dupSlug = (err) => {
  if (err.code === 'ER_DUP_ENTRY') {
    throw new HttpError(422, 'That web address is already used by another post.', { slug: 'That web address is already used by another post.' });
  }
  throw err;
};

/** Turn the form into column values. Reading time defaults to ~200 words a minute. */
async function cleanPost(body) {
  const d = validate(body, postSchema);
  const categoryId = Number.parseInt(d.categoryId, 10);
  const [cat] = await query('SELECT id FROM blog_categories WHERE id = ?', [categoryId]);
  if (!cat) throw new HttpError(422, 'Please choose a category.', { categoryId: 'Please choose a category.' });
  let relatedStoryId = null;
  if (d.relatedStoryId) {
    relatedStoryId = Number.parseInt(d.relatedStoryId, 10);
    const [s] = await query('SELECT id FROM customer_stories WHERE id = ?', [relatedStoryId]);
    if (!s) throw new HttpError(422, 'That story no longer exists.', { relatedStoryId: 'That story no longer exists.' });
  }
  const words = d.body.split(/\s+/).filter(Boolean).length;
  const read = Number.parseInt(d.readMinutes, 10);
  return {
    ...d,
    categoryId,
    relatedStoryId,
    readMinutes: Number.isFinite(read) ? Math.min(60, Math.max(1, read)) : Math.min(60, Math.max(1, Math.round(words / 200))),
    publishedAt: d.publishedAt || new Date(),
  };
}

// ---- Categories (declared first so "categories" is never read as an id) ----------------
blogAdminRouter.get('/categories', asyncHandler(async (_req, res) => {
  const rows = await query(
    `SELECT c.id, c.slug, c.name, c.sort_order AS sortOrder, COUNT(p.id) AS postCount
       FROM blog_categories c LEFT JOIN blog_posts p ON p.category_id = c.id
      GROUP BY c.id ORDER BY c.sort_order, c.name`,
  );
  res.json(rows.map((r) => ({ ...r, postCount: Number(r.postCount) })));
}));

const categorySchema = {
  name: { label: 'Name', required: true, max: 80 },
  slug: { label: 'Web address', required: true, max: 60, format: 'slug' },
  sortOrder: { label: 'Order' },
};

blogAdminRouter.post('/categories', asyncHandler(async (req, res) => {
  const d = validate(req.body, categorySchema);
  try {
    const r = await query('INSERT INTO blog_categories (slug, name, sort_order) VALUES (?, ?, ?)', [d.slug, d.name, Number.parseInt(d.sortOrder, 10) || 0]);
    res.status(201).json({ id: r.insertId });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') throw new HttpError(422, 'That web address is already used.', { slug: 'That web address is already used.' });
    throw err;
  }
}));

blogAdminRouter.put('/categories/:id', asyncHandler(async (req, res) => {
  const d = validate(req.body, categorySchema);
  try {
    const r = await query('UPDATE blog_categories SET slug = ?, name = ?, sort_order = ? WHERE id = ?', [d.slug, d.name, Number.parseInt(d.sortOrder, 10) || 0, Number(req.params.id) || 0]);
    if (!r.affectedRows) throw new HttpError(404, 'Category not found.');
    res.json({ ok: true });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') throw new HttpError(422, 'That web address is already used.', { slug: 'That web address is already used.' });
    throw err;
  }
}));

blogAdminRouter.delete('/categories/:id', asyncHandler(async (req, res) => {
  const id = Number(req.params.id) || 0;
  const [{ n }] = await query('SELECT COUNT(*) AS n FROM blog_posts WHERE category_id = ?', [id]);
  if (Number(n) > 0) throw new HttpError(409, `This category still has ${n} post${Number(n) === 1 ? '' : 's'}. Move or delete them first.`);
  const r = await query('DELETE FROM blog_categories WHERE id = ?', [id]);
  if (!r.affectedRows) throw new HttpError(404, 'Category not found.');
  res.json({ ok: true });
}));

// ---- Posts --------------------------------------------------------------------------------
blogAdminRouter.get('/posts', asyncHandler(async (req, res) => {
  const limit = intParam(req.query.limit, { min: 1, max: 100, fallback: 20 });
  const page = intParam(req.query.page, { min: 1, max: 10000, fallback: 1 });
  const where = [];
  const params = [];
  const status = req.query.status;
  if (status === 'draft') where.push('p.is_published = 0');
  if (status === 'scheduled') where.push('p.is_published = 1 AND p.published_at > UTC_TIMESTAMP()');
  if (status === 'live') where.push('p.is_published = 1 AND p.published_at <= UTC_TIMESTAMP()');
  const cat = Number.parseInt(req.query.category, 10);
  if (Number.isFinite(cat)) {
    where.push('p.category_id = ?');
    params.push(cat);
  }
  const q = typeof req.query.q === 'string' ? req.query.q.trim().slice(0, 80) : '';
  if (q) {
    where.push('(p.title LIKE ? OR p.slug LIKE ?)');
    params.push(`%${likeEscape(q)}%`, `%${likeEscape(q)}%`);
  }
  const sql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const [{ total }] = await query(`SELECT COUNT(*) AS total FROM blog_posts p ${sql}`, params);
  const posts = await query(
    `SELECT ${POST_LIST} FROM blog_posts p JOIN blog_categories c ON c.id = p.category_id ${sql}
      ORDER BY p.published_at DESC, p.id DESC LIMIT ${limit} OFFSET ${(page - 1) * limit}`,
    params,
  );
  res.json({ posts, page, limit, total: Number(total) });
}));

blogAdminRouter.get('/posts/:id', asyncHandler(async (req, res) => {
  const [post] = await query(
    `SELECT id, slug, title, excerpt, body, category_id AS categoryId, author_name AS authorName, author_role AS authorRole,
            cover_image AS coverImage, read_minutes AS readMinutes, related_service AS relatedService,
            related_story_id AS relatedStoryId, is_published AS isPublished, published_at AS publishedAt
       FROM blog_posts WHERE id = ?`,
    [Number(req.params.id) || 0],
  );
  if (!post) throw new HttpError(404, 'Post not found.');
  res.json({ ...post, isPublished: Boolean(post.isPublished) });
}));

blogAdminRouter.post('/posts', asyncHandler(async (req, res) => {
  const d = await cleanPost(req.body);
  try {
    const r = await query(
      `INSERT INTO blog_posts (slug, title, excerpt, body, category_id, author_name, author_role, cover_image, read_minutes,
                               related_service, related_story_id, is_published, published_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [d.slug, d.title, d.excerpt, d.body, d.categoryId, d.authorName, d.authorRole, d.coverImage, d.readMinutes,
        d.relatedService, d.relatedStoryId, d.isPublished ? 1 : 0, d.publishedAt],
    );
    res.status(201).json({ id: r.insertId });
  } catch (err) {
    dupSlug(err);
  }
}));

blogAdminRouter.put('/posts/:id', asyncHandler(async (req, res) => {
  const d = await cleanPost(req.body);
  try {
    const r = await query(
      `UPDATE blog_posts SET slug = ?, title = ?, excerpt = ?, body = ?, category_id = ?, author_name = ?, author_role = ?,
              cover_image = ?, read_minutes = ?, related_service = ?, related_story_id = ?, is_published = ?, published_at = ?
        WHERE id = ?`,
      [d.slug, d.title, d.excerpt, d.body, d.categoryId, d.authorName, d.authorRole, d.coverImage, d.readMinutes,
        d.relatedService, d.relatedStoryId, d.isPublished ? 1 : 0, d.publishedAt, Number(req.params.id) || 0],
    );
    if (!r.affectedRows) throw new HttpError(404, 'Post not found.');
    res.json({ ok: true });
  } catch (err) {
    dupSlug(err);
  }
}));

/** Quick publish / unpublish from the list. */
blogAdminRouter.patch('/posts/:id', asyncHandler(async (req, res) => {
  const d = validate(req.body, { isPublished: { type: 'boolean' } });
  const r = await query('UPDATE blog_posts SET is_published = ? WHERE id = ?', [d.isPublished ? 1 : 0, Number(req.params.id) || 0]);
  if (!r.affectedRows) throw new HttpError(404, 'Post not found.');
  res.json({ ok: true });
}));

blogAdminRouter.delete('/posts/:id', asyncHandler(async (req, res) => {
  const r = await query('DELETE FROM blog_posts WHERE id = ?', [Number(req.params.id) || 0]);
  if (!r.affectedRows) throw new HttpError(404, 'Post not found.');
  res.json({ ok: true });
}));
