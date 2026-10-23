import app from './app.js';
import { config } from './config/env.js';
import { pool, ping, query } from './db/pool.js';
import { mailEnabled } from './services/mailer.js';

// On Vercel the platform runs the app itself (it just needs the exported app below), so we only
// open a port ourselves when running on a normal machine or server.
if (!process.env.VERCEL) {
  const server = app.listen(config.port, async () => {
    console.log(`O2One API listening on http://localhost:${config.port} (${config.env})`);
    try {
      await ping();
      const [{ n }] = await query("SELECT COUNT(*) AS n FROM sqlite_master WHERE type = 'table' AND name = 'blog_posts'");
      console.log(`SQLite database: ${config.db.file}`);
      if (!n) console.error('The database has no tables yet. Run "npm run db:init" (or "npm run db:seed" for starter content).');
    } catch (err) {
      console.error(`The database could not be opened (${err.code || err.message}). Check DB_FILE in .env.`);
    }
    if (!mailEnabled) console.log('SMTP not configured: enquiry emails are off, so the contact form will report a send failure.');
  });

  function shutdown(signal) {
    console.log(`${signal} received, shutting down…`);
    server.close(() => pool.end().finally(() => process.exit(0)));
    setTimeout(() => process.exit(1), 10_000).unref();
  }
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

export default app;
