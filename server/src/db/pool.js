import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { config } from '../config/env.js';

/**
 * The database is one SQLite file (DB_FILE, default data/o2one.sqlite). Nothing to install or run besides the app.
 *
 * Times are stored as UTC text in the same shape JavaScript uses (2026-10-23T10:00:00.000Z), so they sort and compare
 * correctly as text and reach the browser exactly as before. UTC_TIMESTAMP() and utc_shift(seconds) are SQL functions
 * registered below, so queries can say "now" and "now plus/minus N seconds" without caring about the format.
 *
 * The file is opened on first use, not when the app starts, so a server that cannot keep a database file (for example a
 * serverless host) still starts and can serve the pages that do not need one, such as the contact form.
 */
const require = createRequire(import.meta.url);
let handle = null;
let closed = false;

function open() {
  if (handle) return handle;
  if (closed) throw new Error('The database is closed.');
  const Database = require('better-sqlite3');
  if (config.db.file !== ':memory:') fs.mkdirSync(path.dirname(config.db.file), { recursive: true });
  const d = new Database(config.db.file);
  d.pragma('journal_mode = WAL'); // readers do not block the writer, and a crash cannot corrupt the file
  d.pragma('foreign_keys = ON');
  d.pragma('busy_timeout = 5000'); // wait up to 5 s if another request is writing
  const iso = (ms = Date.now()) => new Date(ms).toISOString();
  d.function('utc_timestamp', () => iso());
  d.function('utc_shift', (seconds) => iso(Date.now() + Number(seconds) * 1000));
  handle = d;
  return d;
}

/** The raw better-sqlite3 connection (prepare, exec, transaction, pragma, close), opened on first use. */
export const db = new Proxy({}, {
  get(_target, prop) {
    const d = open();
    const v = d[prop];
    return typeof v === 'function' ? v.bind(d) : v;
  },
});

// Values the driver cannot take as they are
const bind = (v) => (v instanceof Date ? v.toISOString() : typeof v === 'boolean' ? Number(v) : v === undefined ? null : v);

// A LIKE pattern built with likeEscape() escapes with a backslash (the default elsewhere); SQLite needs to be told.
const LIKE_ESCAPE = /\bLIKE\s+\?(?!\s*ESCAPE)/gi;

// A few statements are reused thousands of times; the cache is capped because list queries inline their paging numbers.
const statements = new Map();
function prepare(sql) {
  let s = statements.get(sql);
  if (!s) {
    if (statements.size > 300) statements.clear();
    s = open().prepare(sql.replace(LIKE_ESCAPE, "LIKE ? ESCAPE '\\'"));
    statements.set(sql, s);
  }
  return s;
}

/** Duplicate keys keep the error code the routes already check for. */
function mapError(err) {
  if (typeof err?.code === 'string' && /^SQLITE_CONSTRAINT_(UNIQUE|PRIMARYKEY)$/.test(err.code)) {
    err.code = 'ER_DUP_ENTRY';
    err.sqlMessage = err.message;
  }
  return err;
}

/**
 * Run one statement with ? placeholders. A SELECT returns its rows; anything else returns
 * { insertId, affectedRows }. (Async only so callers can keep using await.)
 */
export async function query(sql, params = []) {
  try {
    const stmt = prepare(sql);
    const args = params.map(bind);
    if (stmt.reader) return stmt.all(...args);
    const r = stmt.run(...args);
    return { insertId: Number(r.lastInsertRowid), affectedRows: r.changes };
  } catch (err) {
    throw mapError(err);
  }
}

export async function ping() {
  open().prepare('SELECT 1').get();
}

/** Same shape the old connection pool had, so shutdown code is unchanged. */
export const pool = {
  async end() {
    if (handle?.open) handle.close();
    handle = null;
    closed = true;
    statements.clear();
  },
};
