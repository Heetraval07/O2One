import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const here = path.dirname(fileURLToPath(import.meta.url));
export const ROOT_DIR = path.resolve(here, '../../..');

// One .env at the project root serves both the API and the build.
dotenv.config({ path: path.join(ROOT_DIR, '.env'), quiet: true });

function str(name, fallback) {
  const v = process.env[name];
  return v === undefined || v === '' ? fallback : v;
}
function int(name, fallback) {
  const v = Number.parseInt(process.env[name] ?? '', 10);
  return Number.isFinite(v) ? v : fallback;
}

const nodeEnv = str('NODE_ENV', 'development');

export const config = {
  env: nodeEnv,
  isProd: nodeEnv === 'production',
  port: int('PORT', 4000),
  trustProxy: int('TRUST_PROXY', 0), // number of proxy hops in front of the app (e.g. 1 behind Nginx)
  // Public address of the site; used in the links emailed to the admin (password reset, email change).
  publicUrl: str('PUBLIC_URL', 'http://localhost:5173').replace(/\/+$/, ''),

  db: {
    host: str('DB_HOST', '127.0.0.1'),
    port: int('DB_PORT', 3306),
    user: str('DB_USER', 'o2one'),
    password: str('DB_PASSWORD', ''),
    database: str('DB_NAME', 'o2one_website'),
    connectionLimit: int('DB_POOL_SIZE', 10),
  },

  // Time zone shown in enquiry emails and the admin booking list. Dubai has no daylight saving, so a fixed offset is exact.
  booking: {
    utcOffsetMinutes: int('BOOKING_UTC_OFFSET_MINUTES', 240),
    timezoneLabel: str('BOOKING_TIMEZONE_LABEL', 'Dubai time (GST)'),
  },

  mail: {
    host: str('SMTP_HOST', ''),
    port: int('SMTP_PORT', 587),
    secure: str('SMTP_SECURE', 'false') === 'true',
    user: str('SMTP_USER', ''),
    password: str('SMTP_PASSWORD', ''),
    from: str('MAIL_FROM', 'O2One Consultants <no-reply@example.com>'),
    // Who receives website enquiries (BOOKING_NOTIFY_EMAIL is the older name for the same setting)
    notify: str('ENQUIRY_NOTIFY_EMAIL', str('BOOKING_NOTIFY_EMAIL', '')),
  },
};
