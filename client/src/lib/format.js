export function formatDate(iso, opts = { day: 'numeric', month: 'short', year: 'numeric' }) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-GB', opts);
}

const MIN = 60_000;

/** Show a UTC instant in the booking timezone (fixed offset, e.g. Dubai +240). */
export function slotParts(isoUtc, offsetMinutes) {
  const local = new Date(new Date(isoUtc).getTime() + offsetMinutes * MIN);
  const opts = { timeZone: 'UTC' };
  return {
    weekday: local.toLocaleDateString('en-GB', { ...opts, weekday: 'short' }),
    weekdayLong: local.toLocaleDateString('en-GB', { ...opts, weekday: 'long' }),
    day: local.toLocaleDateString('en-GB', { ...opts, day: 'numeric' }),
    month: local.toLocaleDateString('en-GB', { ...opts, month: 'short' }),
    monthLong: local.toLocaleDateString('en-GB', { ...opts, month: 'long' }),
    year: local.getUTCFullYear(),
    time: local.toLocaleTimeString('en-GB', { ...opts, hour: '2-digit', minute: '2-digit' }),
  };
}

export function slotLabel(isoUtc, offsetMinutes) {
  const p = slotParts(isoUtc, offsetMinutes);
  return `${p.weekdayLong} ${p.day} ${p.monthLong} ${p.year}, ${p.time}`;
}

/** Endpoint time of a slot. */
export function addMinutesIso(iso, minutes) {
  return new Date(new Date(iso).getTime() + minutes * MIN).toISOString();
}

/** Build and download an .ics calendar file for the booked checkup. */
export function downloadIcs({ start, durationMinutes = 120, title, description, location }) {
  const fmt = (iso) => iso.replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const esc = (s) => String(s).replace(/[\\,;]/g, (c) => `\\${c}`).replace(/\n/g, '\\n');
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//O2One Consultants//Health Checkup//EN',
    'BEGIN:VEVENT',
    `UID:${Date.now()}@o2one`,
    `DTSTAMP:${fmt(new Date().toISOString())}`,
    `DTSTART:${fmt(start)}`,
    `DTEND:${fmt(addMinutesIso(start, durationMinutes))}`,
    `SUMMARY:${esc(title)}`,
    `DESCRIPTION:${esc(description)}`,
    `LOCATION:${esc(location)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
  const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = 'o2one-health-checkup.ics';
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
