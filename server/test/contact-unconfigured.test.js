import test from 'node:test';
import assert from 'node:assert/strict';

// No SMTP settings at all: the visitor must be told, never shown a false "sent".
for (const k of ['SMTP_HOST', 'ENQUIRY_NOTIFY_EMAIL', 'BOOKING_NOTIFY_EMAIL']) process.env[k] = '';
const { createApp } = await import('../src/app.js');
const { pool } = await import('../src/db/pool.js');
const server = createApp().listen(0, '127.0.0.1');
await new Promise((r) => server.once('listening', r));

test.after(async () => {
  server.close();
  await pool.end();
});

test('without email settings the enquiry is refused with a friendly error', async () => {
  const res = await fetch(`http://127.0.0.1:${server.address().port}/api/contact`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fullName: 'Aisha Khan', company: 'Qamar Bay', email: 'aisha@qamarbay.example', phone: '+971 50 123 4567', industry: 'Trading' }),
  });
  const body = await res.json();
  assert.equal(res.status, 503);
  assert.match(body.error, /couldn't send your enquiry/i);
});
