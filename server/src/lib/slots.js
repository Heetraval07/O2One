import { config } from '../config/env.js';

const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;

const pad = (n) => String(n).padStart(2, '0');

/** YYYY-MM-DD for a UTC timestamp shifted into booking-local time. */
function localDateKey(ms, offsetMin) {
  const d = new Date(ms + offsetMin * MINUTE);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

/**
 * Every bookable slot in the booking window, ignoring existing bookings.
 * Returns [{ date: 'YYYY-MM-DD', slots: [{ start: Date, time: 'HH:MM' }] }]
 */
export function generateSlots(now = new Date(), opts = config.booking) {
  const { utcOffsetMinutes: off, days, startTimes, leadDays, windowDays, blockedDates } = opts;
  const blocked = new Set(blockedDates);
  const earliest = now.getTime() + leadDays * DAY;

  // Midnight today in booking-local time, expressed as a UTC timestamp.
  const todayKey = localDateKey(now.getTime(), off);
  const todayMidnightUtc = Date.parse(`${todayKey}T00:00:00Z`) - off * MINUTE;

  const out = [];
  for (let i = 0; i <= windowDays; i += 1) {
    const dayStartUtc = todayMidnightUtc + i * DAY;
    const key = localDateKey(dayStartUtc, off);
    const isoWeekday = ((new Date(Date.parse(`${key}T00:00:00Z`)).getUTCDay() + 6) % 7) + 1;
    if (!days.includes(isoWeekday) || blocked.has(key)) continue;

    const slots = [];
    for (const time of startTimes) {
      const [h, m] = time.split(':').map(Number);
      const start = dayStartUtc + (h * 60 + (m || 0)) * MINUTE;
      if (start >= earliest) slots.push({ start: new Date(start), time: `${pad(h)}:${pad(m || 0)}` });
    }
    if (slots.length) out.push({ date: key, slots });
  }
  return out;
}

/** True when `date` is exactly one of the generated slot start times. */
export function isBookableSlot(date, now = new Date()) {
  const t = date.getTime();
  return generateSlots(now).some((d) => d.slots.some((s) => s.start.getTime() === t));
}
