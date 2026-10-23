import { Router } from 'express';
import { query } from '../db/pool.js';
import { asyncHandler, HttpError } from '../lib/http.js';
import { intParam, likeEscape } from '../lib/validate.js';

export const blogRouter = Router();

const LIST_COLUMNS = `
  p.slug, p.title, p.excerpt, p.cover_image AS coverImage, p.read_minutes AS readMinutes,
  p.published_at AS publishedAt, c.slug AS categorySlug, c.name AS categoryName`;

blogRouter.get('/categories', asyncHandler(async (_req, res) => {
  const rows = await query(
    `SELECT c.slug, c.name, COUNT(p.id) AS postCount
       FROM blog_categories c
       LEFT JOIN blog_posts p ON p.category_id = c.id AND p.is_published = 1 AND p.published_at <= UTC_TIMESTAMP()
      GROUP BY c.id
      ORDER BY c.sort_order, c.name`,
  );
  res.set('Cache-Control', 'public, max-age=300');
  res.json(rows.map((r) => ({ ...r, postCount: Number(r.postCount) })));
}));

/** GET /api/blog/posts?category=odoo&q=tally&page=1&limit=6 */
blogRouter.get('/posts', asyncHandler(async (req, res) => {
  const limit = intParam(req.query.limit, { min: 1, max: 24, fallback: 6 });
  const page = intParam(req.query.page, { min: 1, max: 1000, fallback: 1 });
  const where = ['p.is_published = 1', 'p.published_at <= UTC_TIMESTAMP()'];
  const params = [];

  const category = typeof req.query.category === 'string' ? req.query.category.trim() : '';
  if (category && category !== 'all') {
    where.push('c.slug = ?');
    params.push(category.slice(0, 60));
  }
  const q = typeof req.query.q === 'string' ? req.query.q.trim().slice(0, 80) : '';
  if (q) {
    const like = `%${likeEscape(q)}%`;
    where.push('(p.title LIKE ? OR p.excerpt LIKE ? OR p.body LIKE ?)');
    params.push(like, like, like);
  }

  const whereSql = where.join(' AND ');
  const [{ total }] = await query(
    `SELECT COUNT(*) AS total FROM blog_posts p JOIN blog_categories c ON c.id = p.category_id WHERE ${whereSql}`,
    params,
  );
  // LIMIT/OFFSET are validated integers, so they are safe to inline.
  const posts = await query(
    `SELECT ${LIST_COLUMNS}
       FROM blog_posts p JOIN blog_categories c ON c.id = p.category_id
      WHERE ${whereSql}
      ORDER BY p.published_at DESC, p.id DESC
      LIMIT ${limit} OFFSET ${(page - 1) * limit}`,
    params,
  );

  res.json({ posts, page, limit, total: Number(total), hasMore: page * limit < Number(total) });
}));

blogRouter.get('/posts/:slug', asyncHandler(async (req, res) => {
  const [post] = await query(
    `SELECT ${LIST_COLUMNS}, p.body, p.author_name AS authorName, p.author_role AS authorRole,
            p.related_service AS relatedService,
            s.slug AS storySlug, s.title AS storyTitle
       FROM blog_posts p
       JOIN blog_categories c ON c.id = p.category_id
       LEFT JOIN customer_stories s ON s.id = p.related_story_id AND s.is_published = 1
      WHERE p.slug = ? AND p.is_published = 1 AND p.published_at <= UTC_TIMESTAMP()`,
    [String(req.params.slug).slice(0, 160)],
  );
  if (!post) throw new HttpError(404, 'We could not find that article.');

  const related = await query(
    `SELECT ${LIST_COLUMNS}
       FROM blog_posts p JOIN blog_categories c ON c.id = p.category_id
      WHERE p.is_published = 1 AND p.published_at <= UTC_TIMESTAMP() AND p.slug <> ?
      ORDER BY (c.slug = ?) DESC, p.published_at DESC
      LIMIT 3`,
    [post.slug, post.categorySlug],
  );

  const { storySlug, storyTitle, ...rest } = post;
  res.json({ ...rest, story: storySlug ? { slug: storySlug, title: storyTitle } : null, related });
}));
