import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateSlots } from '../src/lib/slots.js';
import { validate } from '../src/lib/validate.js';

const opts = {
  utcOffsetMinutes: 240,
  days: [1, 2, 3, 4, 5],
  startTimes: ['10:00', '14:00'],
  leadDays: 1,
  windowDays: 7,
  blockedDates: ['2026-10-14'],
};

test('slots fall on working days, in local time, after the lead time', () => {
  // Saturday 10 Oct 2026, 12:00 Dubai
  const now = new Date('2026-10-10T08:00:00Z');
  const days = generateSlots(now, opts);
  const dates = days.map((d) => d.date);
  assert.deepEqual(dates, ['2026-10-12', '2026-10-13', '2026-10-15', '2026-10-16']);
  // 10:00 Dubai = 06:00 UTC
  assert.equal(days[0].slots[0].start.toISOString(), '2026-10-12T06:00:00.000Z');
  assert.equal(days[0].slots[0].time, '10:00');
});

test('lead time removes slots that are too soon', () => {
  // Sunday 11 Oct, 11:00 Dubai: Monday 10:00 is less than 24h away
  const now = new Date('2026-10-11T07:00:00Z');
  const [first] = generateSlots(now, opts);
  assert.equal(first.date, '2026-10-12');
  assert.deepEqual(first.slots.map((s) => s.time), ['14:00']);
});

test('validate cleans input and reports field errors', () => {
  const ok = validate({ email: ' Name@Company.COM ', name: '  A   B ' }, {
    email: { required: true, format: 'email' },
    name: { required: true },
  });
  assert.deepEqual(ok, { email: 'name@company.com', name: 'A B' });

  assert.throws(() => validate({ email: 'nope' }, { email: { required: true, format: 'email' } }), (err) => {
    assert.equal(err.status, 422);
    assert.ok(err.details.email);
    return true;
  });
});
