import test from 'node:test';
import assert from 'node:assert/strict';
import { startSmtpSink } from './smtp-sink.js';

const sink = await startSmtpSink();
// Settings must be in place before the app is loaded, because the server reads them once at start-up.
Object.assign(process.env, {
  SMTP_HOST: '127.0.0.1',
  SMTP_PORT: String(sink.port),
  SMTP_SECURE: 'false',
  SMTP_USER: '',
  MAIL_FROM: 'O2One Consultants <no-reply@example.com>',
  ENQUIRY_NOTIFY_EMAIL: 'team@example.com',
});
const { createApp } = await import('../src/app.js');
const { pool } = await import('../src/db/pool.js');
const server = createApp().listen(0, '127.0.0.1');
await new Promise((r) => server.once('listening', r));
const base = `http://127.0.0.1:${server.address().port}/api/contact`;

test.after(async () => {
  server.close();
  await sink.close();
  await pool.end();
});

const good = (extra = {}) => ({
  fullName: 'Aisha Khan',
  company: 'Qamar Bay General Trading LLC',
  email: 'aisha@qamarbay.example',
  phone: '+971 50 123 4567',
  industry: 'Trading',
  country: 'United Arab Emirates',
  meetingMode: 'in_person',
  message: 'Orders are typed three times.\nPlease call after 4pm.',
  ...extra,
});
const post = (body) =>
  fetch(base, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(async (r) => ({
    status: r.status,
    body: await r.json(),
  }));
// undo quoted-printable line breaks and escapes, so the readable text can be checked
const decode = (raw) => raw.replace(/=\r?\n/g, '').replace(/=([0-9A-F]{2})/g, (_, h) => String.fromCharCode(parseInt(h, 16)));

test('a valid enquiry is emailed to the team with every field', async () => {
  const before = sink.messages.length;
  const res = await post(good({ submissionId: 'a-1' }));
  assert.equal(res.status, 201);
  assert.deepEqual(res.body, { ok: true });
  assert.equal(sink.messages.length, before + 1);
  const raw = sink.messages.at(-1);
  const mail = decode(raw);
  assert.match(raw, /To: team@example\.com/);
  assert.match(raw, /Reply-To: .*aisha@qamarbay\.example/);
  assert.match(raw, /Subject: (=\?UTF-8\?[QB]\?[^\r\n]*|New Website Enquiry)/);
  for (const piece of [
    'Aisha Khan',
    'Qamar Bay General Trading LLC',
    'aisha@qamarbay.example',
    '+971 50 123 4567',
    'Trading',
    'United Arab Emirates',
    'In person',
    'Orders are typed three times.',
    'Please call after 4pm.',
  ]) {
    assert.ok(mail.includes(piece), `the email should contain "${piece}"`);
  }
});

test('invalid details are rejected with field messages and nothing is sent', async () => {
  const before = sink.messages.length;
  const res = await post(good({ email: 'not-an-email', phone: 'abc', fullName: '', company: 'x', industry: '' }));
  assert.equal(res.status, 422);
  for (const f of ['email', 'phone', 'fullName', 'company', 'industry']) assert.ok(res.body.fields[f], `${f} should be flagged`);
  assert.equal(sink.messages.length, before);
});

test('a header-injection attempt in the name cannot add recipients', async () => {
  const before = sink.messages.length;
  const res = await post(good({ fullName: 'Eve\r\nBcc: attacker@example.com', submissionId: 'inj-1', email: 'eve@qamarbay.example' }));
  assert.equal(res.status, 201);
  assert.equal(sink.messages.length, before + 1);
  assert.doesNotMatch(sink.messages.at(-1), /^Bcc:/im);
});

test('sending the same enquiry again (double click, retry) emails only once', async () => {
  const before = sink.messages.length;
  const body = good({ submissionId: 'dup-1', email: 'dup@qamarbay.example' });
  const [a, b] = await Promise.all([post(body), post(body)]);
  const c = await post(good({ email: 'dup@qamarbay.example' })); // same details, no id
  assert.deepEqual([a.status < 300, b.status < 300, c.status < 300], [true, true, true]);
  assert.equal(sink.messages.length, before + 1);
});

test('a failed send gives a friendly error and can be retried', async () => {
  const before = sink.messages.length;
  sink.refuse = true;
  const body = good({ submissionId: 'retry-1', email: 'retry@qamarbay.example' });
  const failed = await post(body);
  assert.equal(failed.status, 502);
  assert.match(failed.body.error, /couldn't send your enquiry/i);
  assert.ok(!/smtp|550|mailbox/i.test(failed.body.error), 'no mail-server details are shown to the visitor');
  assert.equal(sink.messages.length, before);

  sink.refuse = false;
  const retried = await post(body);
  assert.equal(retried.status, 201);
  assert.equal(sink.messages.length, before + 1);
});

test('the hidden honeypot field makes a bot think it worked, without sending anything', async () => {
  const before = sink.messages.length;
  const res = await post(good({ website: 'http://spam.example', email: 'bot@spam.example' }));
  assert.equal(res.status, 201);
  assert.equal(sink.messages.length, before);
});
