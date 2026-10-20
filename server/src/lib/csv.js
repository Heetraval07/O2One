/** Rows (array of arrays) to CSV text. Cells starting with = + - @ are prefixed so spreadsheets don't run them as formulas. */
export function toCsv(rows) {
  const cell = (v) => {
    let s = v == null ? '' : v instanceof Date ? v.toISOString() : String(v);
    // Phone numbers like +971 50 123 4567 are fine as they are.
    if (/^[=+\-@\t\r]/.test(s) && !/^\+[\d\s()-]+$/.test(s)) s = `'${s}`;
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return `﻿${rows.map((r) => r.map(cell).join(',')).join('\r\n')}\r\n`;
}
