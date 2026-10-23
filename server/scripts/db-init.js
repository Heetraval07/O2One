// Creates the database file and its tables (and, with --seed, the starter blog content and sample stories).
//   npm run db:init      -> schema only
//   npm run db:seed      -> schema + starter content (existing rows with the same slug are left alone)
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config, ROOT_DIR } from '../src/config/env.js';
import { db } from '../src/db/pool.js';
import { categories, posts, stories } from './seed-data.js';

const daysAgo = (n) => new Date(Date.now() - n * 86_400_000).toISOString();

/** Create the tables, and optionally add the starter content. Safe to run again. */
export async function initDatabase({ seed = false } = {}) {
  const schema = await fs.readFile(path.join(ROOT_DIR, 'database', 'schema.sql'), 'utf8');
  db.exec(schema);
  if (!seed) return;

  const addCategory = db.prepare('INSERT OR IGNORE INTO blog_categories (slug, name, sort_order) VALUES (?, ?, ?)');
  const addStory = db.prepare(
    `INSERT OR IGNORE INTO customer_stories
       (slug, title, client_name, industry, country, service_slug, apps, summary, challenge,
        approach, results, is_featured, is_sample, published_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`,
  );
  const addPost = db.prepare(
    `INSERT OR IGNORE INTO blog_posts
       (slug, title, excerpt, body, category_id, read_minutes, related_service, related_story_id, published_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );

  db.transaction(() => {
    for (const c of categories) addCategory.run(c.slug, c.name, c.sort_order);
    for (const [i, s] of stories.entries()) {
      addStory.run(
        s.slug, s.title, s.client_name, s.industry, s.country, s.service_slug, s.apps, s.summary, s.challenge,
        JSON.stringify(s.approach), JSON.stringify(s.results), s.is_featured ? 1 : 0, daysAgo(30 + i * 10),
      );
    }
    const catId = Object.fromEntries(db.prepare('SELECT id, slug FROM blog_categories').all().map((c) => [c.slug, c.id]));
    const storyId = Object.fromEntries(db.prepare('SELECT id, slug FROM customer_stories').all().map((s) => [s.slug, s.id]));

    // Stagger publish dates so the listing has a natural order.
    for (const [i, p] of posts.entries()) {
      addPost.run(
        p.slug, p.title, p.excerpt, p.body, catId[p.category], p.read_minutes, p.related_service,
        p.story ? storyId[p.story] ?? null : null, daysAgo((i + 1) * 6),
      );
    }
  })();
}

// Run from the command line (npm run db:init / db:seed), not when imported by the tests.
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const seed = process.argv.includes('--seed');
  initDatabase({ seed })
    .then(() => {
      console.log(`Schema ready in ${config.db.file}`);
      if (seed) console.log(`Seeded ${categories.length} categories, ${posts.length} posts, ${stories.length} sample stories.`);
      db.close();
    })
    .catch((err) => {
      console.error('Database setup failed:', err.code || '', err.message);
      process.exit(1);
    });
}
