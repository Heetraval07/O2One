import mysql from 'mysql2/promise';
import { config } from '../config/env.js';

export const pool = mysql.createPool({
  ...config.db,
  waitForConnections: true,
  queueLimit: 0,
  charset: 'utf8mb4',
  timezone: 'Z', // all DATETIME values are stored and read as UTC
  dateStrings: false,
  supportBigNumbers: true,
});

// Keep the session clock in UTC too, so NOW()/CURRENT_TIMESTAMP defaults match the stored values
// whatever time zone the database server itself runs in.
pool.pool.on('connection', (conn) => {
  conn.query("SET time_zone = '+00:00'");
});

export async function query(sql, params = []) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}

export async function ping() {
  const conn = await pool.getConnection();
  try {
    await conn.ping();
  } finally {
    conn.release();
  }
}
