import test from 'node:test';
import assert from 'node:assert/strict';
import { hashPassword, verifyPassword, passwordProblem, parseCookies, sha256 } from '../src/lib/auth.js';
import { toCsv } from '../src/lib/csv.js';

test('passwords are hashed with a random salt and verify correctly', async () => {
  const a = await hashPassword('Correct-Horse-Battery-9');
  const b = await hashPassword('Correct-Horse-Battery-9');
  assert.notEqual(a, b); // different salts
  assert.ok(!a.includes('Correct-Horse'));
  assert.equal(await verifyPassword('Correct-Horse-Battery-9', a), true);
  assert.equal(await verifyPassword('correct-horse-battery-9', a), false);
  assert.equal(await verifyPassword('anything', 'not-a-hash'), false);
});

test('weak passwords are rejected', () => {
  assert.ok(passwordProblem('short1'));
  assert.equal(passwordProblem('Pass1234'), null); // 8 characters is enough
  assert.ok(passwordProblem('onlyletterslongenough'));
  assert.ok(passwordProblem('123456789012345'));
  assert.ok(passwordProblem('priya-secret-1234', 'priya@o2one.com'));
  assert.equal(passwordProblem('Correct-Horse-Battery-9', 'admin@o2one.com'), null);
});

test('cookies are parsed and tokens hash to a fixed length', () => {
  assert.deepEqual(parseCookies('a=1; o2one_admin=abc%2Bdef; b=2'), { a: '1', o2one_admin: 'abc+def', b: '2' });
  assert.equal(sha256('x').length, 64);
});

test('CSV escapes quotes and commas and neutralises spreadsheet formulas', () => {
  const csv = toCsv([['name', 'note'], ['A, B', 'say "hi"'], ['=SUM(A1)', '+971 50 123 4567']]);
  assert.ok(csv.includes('"A, B","say ""hi"""'));
  assert.ok(csv.includes("'=SUM(A1)")); // formula is defused
  assert.ok(csv.includes(',+971 50 123 4567')); // phone numbers are left alone
});
