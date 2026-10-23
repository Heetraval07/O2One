import test from 'node:test';
import assert from 'node:assert/strict';

// A throw-away in-memory SQLite database: the real schema, the real starter content, the real routes.
process.env.DB_FILE = ':memory:';
const { initDatabase } = await import('../scripts/db-init.js');
const { createApp } = await import('../src/app.js');
const { pool, query } = await import('../src/db/pool.js');
const { hashPassword } = await import('../src/lib/auth.js');
await initDatabase({ seed: true });

const server = createApp().listen(0, '127.0.0.1');
await new Promise((r) => server.once('listening', r));
const base = `http://127.0.0.1:${server.address().port}/api`;

test.after(async () => {
  server.close();
  await pool.end();
});

const call = async (path, { method = 'GET', body, cookie, headers } = {}) => {
  const res = await fetch(base + path, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(cookie ? { Cookie: cookie, 'X-Requested-With': 'o2one-admin' } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try {
    data = await res.json();
  } catch {
    /* no body */
  }
  return { status: res.status, data, res };
};

test('the schema and starter content are in place, and the health check reaches the database', async () => {
  const health = await call('/health');
  assert.deepEqual([health.status, health.data], [200, { ok: true, db: 'up' }]);
  const [{ n: posts }] = await query('SELECT COUNT(*) AS n FROM blog_posts');
  const [{ n: stories }] = await query('SELECT COUNT(*) AS n FROM customer_stories');
  assert.ok(posts >= 4 && stories >= 1);
  // running the setup again changes nothing
  await initDatabase({ seed: true });
  const [{ n: again }] = await query('SELECT COUNT(*) AS n FROM blog_posts');
  assert.equal(again, posts);
});

test('blog: categories, paging, search and a single post', async () => {
  const cats = await call('/blog/categories');
  assert.equal(cats.status, 200);
  assert.ok(cats.data.length >= 4 && cats.data.every((c) => typeof c.postCount === 'number'));
  assert.ok(cats.data.reduce((a, c) => a + c.postCount, 0) > 0);

  const page1 = await call('/blog/posts?limit=2&page=1');
  assert.equal(page1.data.posts.length, 2);
  assert.equal(page1.data.hasMore, true);
  // dates reach the browser as ISO text with a Z, exactly as before
  assert.match(page1.data.posts[0].publishedAt, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  const dates = page1.data.posts.map((p) => p.publishedAt);
  assert.deepEqual([...dates].sort().reverse(), dates, 'newest first');

  const one = await call(`/blog/posts/${page1.data.posts[0].slug}`);
  assert.equal(one.status, 200);
  assert.ok(one.data.body.length > 50 && one.data.related.length <= 3);

  assert.equal((await call('/blog/posts/no-such-post')).status, 404);
  const hit = await call('/blog/posts?q=odoo');
  assert.ok(hit.data.total > 0);
  // % and _ in a search are plain characters, not wildcards
  assert.equal((await call('/blog/posts?q=%25')).data.total, 0);
  assert.equal((await call('/blog/posts?q=zzzz_no_match')).data.total, 0);
});

test('customer stories: list, filter and detail with its JSON fields', async () => {
  const list = await call('/stories');
  assert.equal(list.status, 200);
  assert.ok(list.data.length >= 1);
  assert.equal(typeof list.data[0].isSample, 'boolean');
  const detail = await call(`/stories/${list.data[0].slug}`);
  assert.ok(Array.isArray(detail.data.approach) && Array.isArray(detail.data.results));
  assert.equal((await call('/stories?industry=Nothing')).data.length, 0);
});

test('newsletter: signing up twice keeps one row, and a returning subscriber is subscribed again', async () => {
  const email = 'reader@example.com';
  assert.equal((await call('/newsletter', { method: 'POST', body: { email } })).status, 201);
  await query("UPDATE newsletter_subscribers SET status = 'unsubscribed' WHERE email = ?", [email]);
  assert.equal((await call('/newsletter', { method: 'POST', body: { email } })).status, 201);
  const rows = await query('SELECT status FROM newsletter_subscribers WHERE email = ?', [email]);
  assert.deepEqual(rows, [{ status: 'subscribed' }]);
});

test('admin: sign in, dashboard, write a post, duplicate web address, schedule, delete, sign out', async () => {
  await query('INSERT INTO admin_users (email, password_hash) VALUES (?, ?)', ['boss@example.com', await hashPassword('Correct-Horse-Battery-9')]);

  const bad = await call('/admin/auth/login', { method: 'POST', body: { email: 'boss@example.com', password: 'wrong-password-1' } });
  assert.equal(bad.status, 401);
  const login = await call('/admin/auth/login', { method: 'POST', body: { email: 'boss@example.com', password: 'Correct-Horse-Battery-9' } });
  assert.equal(login.status, 200);
  const cookie = login.res.headers.get('set-cookie').split(';')[0];

  assert.equal((await call('/admin/dashboard')).status, 401, 'no cookie, no access');
  const dash = await call('/admin/dashboard', { cookie });
  assert.equal(dash.status, 200);
  assert.ok(dash.data.posts.live >= 4);

  // the session was stored with an expiry in the future and is extended on use
  const [s1] = await query('SELECT expires_at FROM admin_sessions');
  assert.ok(Date.parse(s1.expires_at) > Date.now() + 11 * 3_600_000);

  const [cat] = await query('SELECT id FROM blog_categories ORDER BY id LIMIT 1');
  const post = (slug, extra = {}) => ({
    slug, title: `Title ${slug}`, excerpt: 'A short summary of the post.', body: '## Heading\n\nSome words here.',
    categoryId: cat.id, authorName: 'O2One team', isPublished: true, ...extra,
  });
  const made = await call('/admin/blog/posts', { method: 'POST', cookie, body: post('first-post') });
  assert.equal(made.status, 201);
  assert.ok(Number.isInteger(made.data.id) && made.data.id > 0);

  const dup = await call('/admin/blog/posts', { method: 'POST', cookie, body: post('first-post') });
  assert.equal(dup.status, 422);
  assert.match(dup.data.fields.slug, /already used/);

  const future = new Date(Date.now() + 7 * 86_400_000).toISOString();
  await call('/admin/blog/posts', { method: 'POST', cookie, body: post('later-post', { publishedAt: future }) });
  const scheduled = await call('/admin/blog/posts?status=scheduled', { cookie });
  assert.deepEqual(scheduled.data.posts.map((p) => p.slug), ['later-post']);
  assert.equal((await call('/blog/posts/later-post')).status, 404, 'a scheduled post is not public yet');

  // editing stamps "last changed" through the trigger
  const [before] = await query('SELECT updated_at FROM blog_posts WHERE id = ?', [made.data.id]);
  await new Promise((r) => setTimeout(r, 15));
  await call(`/admin/blog/posts/${made.data.id}`, { method: 'PATCH', cookie, body: { isPublished: false } });
  const [after] = await query('SELECT updated_at, is_published FROM blog_posts WHERE id = ?', [made.data.id]);
  assert.equal(after.is_published, 0);
  assert.ok(after.updated_at > before.updated_at);

  assert.equal((await call(`/admin/blog/posts/${made.data.id}`, { method: 'DELETE', cookie })).status, 200);
  assert.equal((await call('/admin/auth/logout', { method: 'POST', cookie })).status, 200);
});

test('admin: a password-reset link works once and expires', async () => {
  const [admin] = await query('SELECT id FROM admin_users');
  const { newToken, sha256 } = await import('../src/lib/auth.js');
  const token = newToken();
  await query('INSERT INTO admin_tokens (token_hash, admin_id, kind, expires_at) VALUES (?, ?, ?, utc_shift(? * 60))', [sha256(token), admin.id, 'password', 30]);
  const reset = await call('/admin/auth/reset', { method: 'POST', body: { token, password: 'Another-Strong-Pass-77' } });
  assert.equal(reset.status, 200);
  const again = await call('/admin/auth/reset', { method: 'POST', body: { token, password: 'Another-Strong-Pass-78' } });
  assert.equal(again.status, 400, 'a used link is refused');

  const old = newToken();
  await query('INSERT INTO admin_tokens (token_hash, admin_id, kind, expires_at) VALUES (?, ?, ?, utc_shift(-60))', [sha256(old), admin.id, 'password']);
  assert.equal((await call('/admin/auth/reset', { method: 'POST', body: { token: old, password: 'Another-Strong-Pass-79' } })).status, 400);
});

test('old bookings still open in the admin list, and a cancelled one frees its slot', async () => {
  const slot = new Date(Date.now() + 3 * 86_400_000).toISOString();
  const mk = (ref) => query(
    `INSERT INTO checkup_bookings (reference, full_name, company, email, phone, industry, slot_start, readiness_items)
     VALUES (?, 'A B', 'Co', 'a@b.example', '+971 50 000 0000', 'Other', ?, ?)`,
    [ref, slot, JSON.stringify(['You know your deadline'])],
  );
  await mk('O2-AAAAAAA');
  await assert.rejects(mk('O2-BBBBBBB'), (e) => e.code === 'ER_DUP_ENTRY', 'two active bookings cannot share a slot');
  await query("UPDATE checkup_bookings SET status = 'cancelled' WHERE reference = 'O2-AAAAAAA'");
  await mk('O2-BBBBBBB'); // the slot is free again

  const { newToken } = await import('../src/lib/auth.js');
  void newToken;
  const login = await call('/admin/auth/login', { method: 'POST', body: { email: 'boss@example.com', password: 'Another-Strong-Pass-77' } });
  const cookie = login.res.headers.get('set-cookie').split(';')[0];
  const list = await call('/admin/bookings?q=Co', { cookie });
  assert.equal(list.status, 200);
  assert.equal(list.data.total, 2);
  assert.deepEqual(list.data.bookings[0].readinessItems, ['You know your deadline']);
});
