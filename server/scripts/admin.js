// Create the admin account, or reset its password, from the terminal.
//
//   npm run admin:create -- you@company.com            (prints a new random password)
//   npm run admin:create -- you@company.com "MyOwn-Passw0rd-123"
//   npm run admin:reset  -- you@company.com            (new random password, signs out every session)
//
// There is one admin account. "create" refuses to add a second one.
// The password is stored only as a scrypt hash; it is shown once here and never again.
import crypto from 'node:crypto';
import { config } from '../src/config/env.js';
import { pool, query } from '../src/db/pool.js';
import { hashPassword, passwordProblem } from '../src/lib/auth.js';

const [command, emailArg, passwordArg] = process.argv.slice(2);

function randomPassword() {
  // 18 characters from an unambiguous alphabet, ~100 bits.
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  let out = '';
  for (const b of crypto.randomBytes(18)) out += alphabet[b % alphabet.length];
  return `${out.slice(0, 6)}-${out.slice(6, 12)}-${out.slice(12)}9`;
}

async function main() {
  if (!['create', 'reset'].includes(command) || !emailArg) {
    console.log('Usage: npm run admin:create -- <email> [password]\n       npm run admin:reset  -- <email> [password]');
    process.exit(1);
  }
  const email = emailArg.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) throw new Error('That does not look like an email address.');
  const password = passwordArg || randomPassword();
  const problem = passwordProblem(password, email);
  if (problem) throw new Error(`Password rejected: ${problem}`);

  const hash = await hashPassword(password);
  const existing = await query('SELECT id, email FROM admin_users ORDER BY id LIMIT 2');

  if (command === 'create') {
    if (existing.length) throw new Error(`An admin already exists (${existing[0].email}). Use "npm run admin:reset" to change the password.`);
    await query('INSERT INTO admin_users (email, password_hash) VALUES (?, ?)', [email, hash]);
  } else {
    const [admin] = existing.filter((a) => a.email === email);
    if (!admin) throw new Error(`No admin with the email ${email}.`);
    await query('UPDATE admin_users SET password_hash = ? WHERE id = ?', [hash, admin.id]);
    await query('DELETE FROM admin_sessions WHERE admin_id = ?', [admin.id]);
  }

  console.log(`\nAdmin ${command === 'create' ? 'created' : 'password reset'}.`);
  console.log(`  Sign in at: ${config.publicUrl}/admin`);
  console.log(`  Email:      ${email}`);
  if (!passwordArg) console.log(`  Password:   ${password}`);
  console.log('\nChange the password after the first sign in (Account page).\n');
}

main()
  .catch((err) => {
    console.error(`\n${err.message}\n`);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
