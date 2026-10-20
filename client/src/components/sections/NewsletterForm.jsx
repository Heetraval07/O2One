import { useId, useState } from 'react';
import { api } from '../../lib/api';
import styles from './NewsletterForm.module.css';

export default function NewsletterForm({ compact = false }) {
  const uid = useId();
  const [email, setEmail] = useState('');
  const [hp, setHp] = useState('');
  const [status, setStatus] = useState('idle'); // idle | sending | done | error
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S{2,}$/.test(email.trim())) {
      setStatus('error');
      setError('Enter a full email address, like name@company.com.');
      return;
    }
    setStatus('sending');
    setError('');
    try {
      await api.subscribe(email.trim(), hp);
      setStatus('done');
    } catch (err) {
      setStatus('error');
      setError(err.fields?.email || err.message);
    }
  };

  return (
    <div className={`${styles.box} ${compact ? styles.compact : ''}`}>
      <h2 className={styles.title} id={`${uid}-t`}>
        Newsletter
      </h2>
      {status === 'done' ? (
        <p className="alert alert--ok" role="status">
          You&rsquo;re subscribed. We&rsquo;ll send new articles to {email.trim()}.
        </p>
      ) : (
        <form onSubmit={submit} noValidate aria-labelledby={`${uid}-t`}>
          <p className={styles.text}>Practical notes on Odoo, automation and running a tidy business. No spam.</p>
          <div className="field">
            <label htmlFor={`${uid}-e`} className="sr-only">
              Email
            </label>
            <input
              id={`${uid}-e`}
              type="email"
              className="input"
              placeholder="you@company.com"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={status === 'error'}
              aria-describedby={status === 'error' ? `${uid}-err` : undefined}
            />
            {status === 'error' && (
              <span id={`${uid}-err`} className="field-error" role="alert">
                {error}
              </span>
            )}
          </div>
          <div className="hp" aria-hidden="true">
            <label>
              Website
              <input tabIndex={-1} autoComplete="off" value={hp} onChange={(e) => setHp(e.target.value)} />
            </label>
          </div>
          <button type="submit" className="btn btn--secondary btn--block" disabled={status === 'sending'}>
            {status === 'sending' ? <span className="spinner" aria-hidden="true" /> : null}
            {status === 'sending' ? 'Subscribing…' : 'Subscribe'}
          </button>
        </form>
      )}
    </div>
  );
}
