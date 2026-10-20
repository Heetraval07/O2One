// Creates the database tables (and, with --seed, the starter blog content and sample stories).
//   npm run db:init      -> schema only
//   npm run db:seed      -> schema + starter content (existing rows with the same slug are left alone)
import fs from 'node:fs/promises';
import path from 'node:path';
import mysql from 'mysql2/promise';
import { config, ROOT_DIR } from '../src/config/env.js';
import { categories, posts, stories } from './seed-data.js';

const withSeed = process.argv.includes('--seed');

async function main() {
  const { database, ...conn } = config.db;
  const db = await mysql.createConnection({ ...conn, multipleStatements: true, charset: 'utf8mb4', timezone: 'Z' });

  try {
    await db.query(`CREATE DATABASE IF NOT EXISTS \`${database.replace(/`/g, '')}\`
                    CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  } catch (err) {
    console.warn(`Could not create database "${database}" (${err.code}); assuming it already exists.`);
  }
  await db.changeUser({ database });
  await db.query("SET time_zone = '+00:00'"); // after changeUser, which resets the session

  const schema = await fs.readFile(path.join(ROOT_DIR, 'database', 'schema.sql'), 'utf8');
  await db.query(schema);
  console.log('Schema ready.');

  if (withSeed) {
    for (const c of categories) {
      await db.execute(
        'INSERT IGNORE INTO blog_categories (slug, name, sort_order) VALUES (?, ?, ?)',
        [c.slug, c.name, c.sort_order],
      );
    }
    for (const [i, s] of stories.entries()) {
      await db.execute(
        `INSERT IGNORE INTO customer_stories
           (slug, title, client_name, industry, country, service_slug, apps, summary, challenge,
            approach, results, is_featured, is_sample, published_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, UTC_TIMESTAMP() - INTERVAL ? DAY)`,
        [s.slug, s.title, s.client_name, s.industry, s.country, s.service_slug, s.apps, s.summary,
          s.challenge, JSON.stringify(s.approach), JSON.stringify(s.results), s.is_featured, 30 + i * 10],
      );
    }
    const [cats] = await db.query('SELECT id, slug FROM blog_categories');
    const catId = Object.fromEntries(cats.map((c) => [c.slug, c.id]));
    const [storyRows] = await db.query('SELECT id, slug FROM customer_stories');
    const storyId = Object.fromEntries(storyRows.map((s) => [s.slug, s.id]));

    // Stagger publish dates so the listing has a natural order.
    const now = Date.now();
    for (const [i, p] of posts.entries()) {
      await db.execute(
        `INSERT IGNORE INTO blog_posts
           (slug, title, excerpt, body, category_id, read_minutes, related_service, related_story_id, published_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [p.slug, p.title, p.excerpt, p.body, catId[p.category], p.read_minutes, p.related_service,
          p.story ? storyId[p.story] ?? null : null, new Date(now - (i + 1) * 6 * 86_400_000)],
      );
    }
    console.log(`Seeded ${categories.length} categories, ${posts.length} posts, ${stories.length} sample stories.`);
  }

  await db.end();
}

main().catch((err) => {
  console.error('Database setup failed:', err.code || '', err.message);
  process.exit(1);
});
