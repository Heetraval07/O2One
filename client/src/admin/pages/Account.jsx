import { useState } from 'react';
import { admin } from '../api';
import { useAuth } from '../auth';
import { Field, PageHead, useToast } from '../ui';

function useForm(submitFn, onDone) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const run = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const result = await submitFn();
      onDone(result);
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  };
  return { busy, error, run };
}

function PasswordForm() {
  const toast = useToast();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [again, setAgain] = useState('');
  const { busy, error, run } = useForm(
    async () => {
      if (next !== again) {
        const err = new Error('The two passwords do not match.');
        err.fields = { again: err.message };
        throw err;
      }
      return admin.changePassword(current, next);
    },
    () => {
      toast('Password changed. Other devices were signed out.');
      setCurrent('');
      setNext('');
      setAgain('');
    },
  );
  return (
    <form className="adm-card adm-form" onSubmit={run} noValidate>
      <h2>Change password</h2>
      {error && !error.fields && <p className="adm-alert adm-alert--error" role="alert">{error.message}</p>}
      <Field label="Current password" error={error?.fields?.currentPassword}>
        {(p) => <input {...p} className="adm-input" type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} required />}
      </Field>
      <Field label="New password" error={error?.fields?.newPassword} hint="At least 8 characters, with letters and numbers.">
        {(p) => <input {...p} className="adm-input" type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} required />}
      </Field>
      <Field label="Repeat the new password" error={error?.fields?.again}>
        {(p) => <input {...p} className="adm-input" type="password" autoComplete="new-password" value={again} onChange={(e) => setAgain(e.target.value)} required />}
      </Field>
      <button className="adm-btn adm-btn--primary" disabled={busy}>{busy ? 'Saving…' : 'Change password'}</button>
    </form>
  );
}

function EmailForm() {
  const toast = useToast();
  const { email, mailEnabled, setEmail } = useAuth();
  const [newEmail, setNewEmail] = useState('');
  const [password, setPassword] = useState('');
  const [sentTo, setSentTo] = useState('');
  const { busy, error, run } = useForm(
    () => admin.changeEmail(newEmail, password),
    (r) => {
      if (r.applied) {
        setEmail(r.email);
        toast('Login email changed.');
      } else {
        setSentTo(newEmail);
      }
      setNewEmail('');
      setPassword('');
    },
  );
  return (
    <form className="adm-card adm-form" onSubmit={run} noValidate>
      <h2>Change login email</h2>
      <p className="adm-hint">
        Signed in as <strong>{email}</strong>. This is also where password-reset links are sent.
        {mailEnabled ? ' We email a confirmation link to the new address first.' : ' Email sending is not set up yet, so the change applies straight away.'}
      </p>
      {sentTo && <p className="adm-alert adm-alert--ok" role="status">We sent a confirmation link to {sentTo}. Your login email changes once you open it.</p>}
      {error && !error.fields && <p className="adm-alert adm-alert--error" role="alert">{error.message}</p>}
      <Field label="New email" error={error?.fields?.newEmail}>
        {(p) => <input {...p} className="adm-input" type="email" autoComplete="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} required />}
      </Field>
      <Field label="Current password" error={error?.fields?.currentPassword}>
        {(p) => <input {...p} className="adm-input" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />}
      </Field>
      <button className="adm-btn adm-btn--primary" disabled={busy}>{busy ? 'Saving…' : mailEnabled ? 'Send confirmation link' : 'Change email'}</button>
    </form>
  );
}

export default function Account() {
  const { mailEnabled } = useAuth();
  return (
    <>
      <PageHead title="Account" sub="Your sign-in details." />
      {!mailEnabled && (
        <p className="adm-alert adm-alert--warn" role="note">
          Email sending is not set up. Password-reset and confirmation links are printed in the server console until you add the SMTP_* settings to the .env file.
        </p>
      )}
      <div className="adm-cols">
        <PasswordForm />
        <EmailForm />
      </div>
      <section className="adm-card">
        <h2>Forgot the password?</h2>
        <p className="adm-hint">
          On the sign-in page, choose "Forgot your password?" and a reset link is emailed to the login address. If email is unavailable, run{' '}
          <code>npm run admin:reset -- your@email.com</code> on the server to set a new one.
        </p>
      </section>
    </>
  );
}
