// One-time copy of everything from the old MariaDB database into the SQLite file.
//
//   npm install --no-save mysql2          (the app itself no longer needs it)
//   npm run db:init                       (creates the empty SQLite tables)
//   npm run db:import-mariadb             (copies the data across; the MariaDB database is only read, never changed)
//
// It reads the old connection from MARIADB_HOST, MARIADB_PORT, MARIADB_USER, MARIADB_PASSWORD and MARIADB_NAME, or from
// the old DB_HOST / DB_PORT / DB_USER / DB_PASSWORD / DB_NAME names still in your .env. It refuses to run if the SQLite
// tables already hold data, so it can never create duplicates. Login sessions and reset links are not copied (everyone
// signs in again); uploaded images, blog posts, stories, subscribers, old bookings and the admin account are.
import { config } from '../src/config/env.js';
import { db } from '../src/db/pool.js';

let mysql;
try {
  mysql = (await import('mysql2/promise')).default;
} catch {
  console.error('This script needs the old MariaDB driver. Run:  npm install --no-save mysql2');
  process.exit(1);
}

const env = (a, b, fallback) => process.env[`MARIADB_${a}`] || process.env[`DB_${b}`] || fallback;
const source = {
  host: env('HOST', 'HOST', '127.0.0.1'),
  port: Number(env('PORT', 'PORT', 3306)),
  user: env('USER', 'USER', 'o2one'),
  password: env('PASSWORD', 'PASSWORD', ''),
  database: env('NAME', 'NAME', 'o2one_website'),
};

// Parents before children, so the foreign keys are satisfied.
const TABLES = [
  'blog_categories', 'customer_stories', 'blog_posts', 'checkup_bookings', 'newsletter_subscribers', 'admin_users', 'media',
];
// MariaDB-only columns that have no counterpart in SQLite
const SKIP_COLUMNS = new Set(['slot_lock']);

// Values SQLite cannot take as they are: dates (stored as UTC text) and anything the driver parsed into an object (JSON).
const convert = (v) => {
  if (v instanceof Date) return v.toISOString();
  if (v && typeof v === 'object' && !Buffer.isBuffer(v)) return JSON.stringify(v);
  if (typeof v === 'boolean') return Number(v);
  return v;
};

const conn = await mysql.createConnection({ ...source, timezone: 'Z', dateStrings: false });
let copied = {};
try {
  for (const t of TABLES) {
    const [{ n }] = db.prepare(`SELECT COUNT(*) AS n FROM ${t}`).all();
    if (n) throw new Error(`The SQLite table ${t} already has ${n} rows. Import into an empty database (npm run db:init on a new DB_FILE).`);
  }
  db.pragma('foreign_keys = OFF'); // rows go in table by table; checked again at the end
  // read everything first (async), then write it in one synchronous transaction, all or nothing
  const data = {};
  for (const t of TABLES) {
    const [rows] = await conn.query(`SELECT * FROM \`${t}\``);
    data[t] = rows;
  }
  db.transaction(() => {
    for (const t of TABLES) {
      for (const row of data[t]) {
        const cols = Object.keys(row).filter((c) => !SKIP_COLUMNS.has(c));
        db.prepare(`INSERT INTO ${t} (${cols.join(', ')}) VALUES (${cols.map(() => '?').join(', ')})`).run(...cols.map((c) => convert(row[c])));
      }
      copied[t] = data[t].length;
    }
  })();
  const broken = db.pragma('foreign_key_check');
  if (broken.length) throw new Error(`Some rows point at rows that do not exist (${JSON.stringify(broken.slice(0, 3))}).`);
  db.pragma('foreign_keys = ON');
  console.log(`Copied from MariaDB ${source.user}@${source.host}:${source.port}/${source.database} into ${config.db.file}`);
  for (const t of TABLES) console.log(`  ${t.padEnd(24)} ${copied[t] ?? 0}`);
} catch (err) {
  console.error(`\nImport failed: ${err.message}\nNothing was copied.`);
  process.exitCode = 1;
} finally {
  await conn.end();
  db.close();
}
