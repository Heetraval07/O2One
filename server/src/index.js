import { createApp } from './app.js';
import { config } from './config/env.js';
import { pool, ping } from './db/pool.js';
import { mailEnabled } from './services/mailer.js';

const app = createApp();

// On Vercel the platform runs the app itself (it just needs the exported app below), so we only
// open a port ourselves when running on a normal machine or server.
if (!process.env.VERCEL) {
  const server = app.listen(config.port, async () => {
    console.log(`O2One API listening on http://localhost:${config.port} (${config.env})`);
    try {
      await ping();
      console.log(`MariaDB connected: ${config.db.user}@${config.db.host}:${config.db.port}/${config.db.database}`);
    } catch (err) {
      console.error(`MariaDB is not reachable (${err.code || err.message}). Check DB_* in .env and run "npm run db:init".`);
    }
    if (!mailEnabled) console.log('SMTP not configured: booking emails are off (bookings are still saved).');
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
