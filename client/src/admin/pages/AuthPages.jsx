import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { admin } from '../api';
import { useAuth } from '../auth';
import { Field } from '../ui';

function Card({ title, sub, children }) {
  return (
    <div className="adm-auth">
      <div className="adm-auth-card">
        <p className="adm-auth-logo">
          <strong>O2One</strong> <span>Admin</span>
        </p>
        <h1>{title}</h1>
        {sub && <p className="adm-auth-sub">{sub}</p>}
        {children}
      </div>
      <p className="adm-auth-foot">
        <a href="/">← Back to the website</a>
      </p>
    </div>
  );
}

/** Shared submit wrapper: busy state and error handling in one place. */
function useSubmit(fn) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const run = async (e) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  };
  return { busy, error, run };
}

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { busy, error, run } = useSubmit(async () => {
    await login(email, password);
    const from = location.state?.from;
    navigate(from && from.startsWith('/admin') && !from.includes('login') ? from : '/admin', { replace: true });
  });
  return (
    <Card title="Sign in" sub="Manage bookings, the blog, customer stories and subscribers.">
      <form onSubmit={run} noValidate className="adm-form">
        {error && <p className="adm-alert adm-alert--error" role="alert">{error.message}</p>}
        <Field label="Email" error={error?.fields?.email}>
          {(p) => <input {...p} className="adm-input" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />}
        </Field>
        <Field label="Password" error={error?.fields?.password}>
          {(p) => <input {...p} className="adm-input" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />}
        </Field>
        <button className="adm-btn adm-btn--primary adm-btn--block" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
        <p className="adm-auth-links">
          <Link to="/admin/forgot">Forgot your password?</Link>
        </p>
      </form>
    </Card>
  );
}

export function Forgot() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const { busy, error, run } = useSubmit(async () => {
    await admin.forgot(email);
    setSent(true);
  });
  if (sent) {
    return (
      <Card title="Check your email" sub="If that address belongs to the admin account, a link to choose a new password is on its way. It works once and expires in an hour.">
        <p className="adm-auth-links"><Link to="/admin/login">Back to sign in</Link></p>
      </Card>
    );
  }
  return (
    <Card title="Reset your password" sub="Enter the admin email and we'll send you a link.">
      <form onSubmit={run} noValidate className="adm-form">
        {error && <p className="adm-alert adm-alert--error" role="alert">{error.message}</p>}
        <Field label="Email" error={error?.fields?.email}>
          {(p) => <input {...p} className="adm-input" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />}
        </Field>
        <button className="adm-btn adm-btn--primary adm-btn--block" disabled={busy}>
          {busy ? 'Sending…' : 'Send reset link'}
        </button>
        <p className="adm-auth-links"><Link to="/admin/login">Back to sign in</Link></p>
      </form>
    </Card>
  );
}

export function Reset() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const [password, setPassword] = useState('');
  const [again, setAgain] = useState('');
  const [done, setDone] = useState(false);
  const { busy, error, run } = useSubmit(async () => {
    if (password !== again) {
      const e = new Error('The two passwords do not match.');
      e.fields = { again: e.message };
      throw e;
    }
    await admin.reset(token, password);
    setDone(true);
  });
  if (!token) return <Card title="This link is not valid" sub="Request a new one from the sign-in page."><p className="adm-auth-links"><Link to="/admin/forgot">Send a new link</Link></p></Card>;
  if (done) return <Card title="Password changed" sub="You have been signed out everywhere. Sign in with your new password."><p className="adm-auth-links"><Link className="adm-btn adm-btn--primary adm-btn--block" to="/admin/login">Sign in</Link></p></Card>;
  return (
    <Card title="Choose a new password" sub="At least 8 characters, with letters and numbers.">
      <form onSubmit={run} noValidate className="adm-form">
        {error && !error.fields?.password && !error.fields?.again && <p className="adm-alert adm-alert--error" role="alert">{error.message}</p>}
        <Field label="New password" error={error?.fields?.password}>
          {(p) => <input {...p} className="adm-input" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} required autoFocus />}
        </Field>
        <Field label="Repeat the password" error={error?.fields?.again}>
          {(p) => <input {...p} className="adm-input" type="password" autoComplete="new-password" value={again} onChange={(e) => setAgain(e.target.value)} required />}
        </Field>
        <button className="adm-btn adm-btn--primary adm-btn--block" disabled={busy}>
          {busy ? 'Saving…' : 'Save new password'}
        </button>
      </form>
    </Card>
  );
}

/** Opened from the link emailed to a new address: confirms it straight away. */
export function ConfirmEmail() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const [state, setState] = useState({ status: token ? 'working' : 'error', message: 'This link is not valid.' });
  const once = useRef(false);
  const { setEmail } = useAuth();
  useEffect(() => {
    if (!token || once.current) return;
    once.current = true; // one-time link: never send twice (React StrictMode runs effects twice in development)
    admin
      .confirmEmail(token)
      .then((r) => {
        setEmail(r.email);
        setState({ status: 'ok', message: r.email });
      })
      .catch((err) => setState({ status: 'error', message: err.message }));
  }, [token, setEmail]);

  if (state.status === 'working') return <Card title="Confirming…" />;
  if (state.status === 'error') return <Card title="Could not confirm" sub={state.message}><p className="adm-auth-links"><Link to="/admin/login">Back to sign in</Link></p></Card>;
  return (
    <Card title="Email confirmed" sub={`Your admin login email is now ${state.message}.`}>
      <p className="adm-auth-links"><Link className="adm-btn adm-btn--primary adm-btn--block" to="/admin/login">Continue</Link></p>
    </Card>
  );
}
