import { useEffect, useId, useRef, useState } from 'react';
import { api, ApiError } from '../../lib/api';
import { industryNames } from '../../content/industries';
import { site } from '../../content/site';
import { ArrowRight, Check, Users, Video } from '../../components/ui/Icons';
import styles from './ContactForm.module.css';

const COUNTRIES = ['United Arab Emirates', 'Saudi Arabia', 'Oman', 'Qatar', 'Bahrain', 'Kuwait', 'India', 'Other'];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^\+?[0-9][0-9\s\-().]{6,24}$/;

const empty = {
  fullName: '', company: '', email: '', phone: '', industry: '', country: 'United Arab Emirates',
  meetingMode: 'online', message: '', website: '',
};

function validateDetails(v) {
  const e = {};
  if (v.fullName.trim().length < 2) e.fullName = 'Please enter your full name.';
  if (v.company.trim().length < 2) e.company = 'Please enter your company name.';
  if (!EMAIL_RE.test(v.email.trim())) e.email = 'Enter a full email address, like name@company.com.';
  if (!PHONE_RE.test(v.phone.trim())) e.phone = 'Enter a phone number with country code, like +971 50 123 4567.';
  if (!v.industry) e.industry = 'Please choose your industry.';
  return e;
}

function Field({ id, label, error, optional, hint, children }) {
  return (
    <div className="field">
      <label htmlFor={id}>
        {label} {optional && <span className="optional">(optional)</span>}
      </label>
      {children}
      {hint && !error && (
        <span id={`${id}-hint`} className="field-hint">
          {hint}
        </span>
      )}
      {error && (
        <span id={`${id}-err`} className="field-error">
          {error}
        </span>
      )}
    </div>
  );
}

// One id per form on screen. The server uses it to recognise a double click or a retry and email the team only once.
const newSubmissionId = () =>
  globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;

export default function ContactForm({ source = 'checkup', readinessItems = [] }) {
  const uid = useId();
  const [values, setValues] = useState(empty);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [sent, setSent] = useState(false);
  const headingRef = useRef(null);
  const submissionId = useRef(newSubmissionId());
  const inFlight = useRef(false);

  const id = (name) => `${uid}-${name}`;
  const set = (name) => (e) => {
    setValues((v) => ({ ...v, [name]: e.target.value }));
    if (errors[name]) setErrors((er) => ({ ...er, [name]: undefined }));
  };
  const aria = (name) => ({
    id: id(name),
    'aria-invalid': Boolean(errors[name]),
    'aria-describedby': errors[name] ? `${id(name)}-err` : undefined,
  });

  // Move focus to the confirmation when the form has been sent.
  useEffect(() => {
    if (sent) headingRef.current?.focus();
  }, [sent]);

  const submit = async (e) => {
    e.preventDefault();
    if (inFlight.current) return; // a second click while the first is still being sent
    const found = validateDetails(values);
    setErrors(found);
    if (Object.keys(found).length) {
      setFormError('');
      document.getElementById(id(Object.keys(found)[0]))?.focus();
      return;
    }
    inFlight.current = true;
    setSubmitting(true);
    setFormError('');
    try {
      await api.contact({
        ...values,
        submissionId: submissionId.current,
        source,
        readinessItems: source === 'vat_readiness' ? readinessItems : [],
      });
      setSent(true);
    } catch (err) {
      // Everything the visitor typed stays in the form, so they can simply try again.
      if (err instanceof ApiError && Object.keys(err.fields || {}).length) {
        setErrors(err.fields);
        setFormError(err.message);
      } else {
        setFormError(err.message || 'Something went wrong. Please try again.');
      }
    } finally {
      inFlight.current = false;
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.card}>
      {source === 'vat_readiness' && !sent && (
        <p className={styles.context}>
          <strong>Free readiness check.</strong> You ticked {readinessItems.length} of 5 on the self-check. We&rsquo;ll bring
          a plan for the rest.
        </p>
      )}

      {!sent && (
        <form onSubmit={submit} noValidate>
          <h2 className={styles.stepTitle}>Your details</h2>
          {formError && <p className="alert" role="alert">{formError}</p>}
          <div className="form-grid">
            <Field id={id('fullName')} label="Full name" error={errors.fullName}>
              <input className="input" autoComplete="name" value={values.fullName} onChange={set('fullName')} {...aria('fullName')} />
            </Field>
            <Field id={id('company')} label="Company" error={errors.company}>
              <input className="input" autoComplete="organization" value={values.company} onChange={set('company')} {...aria('company')} />
            </Field>
            <Field id={id('email')} label="Email" error={errors.email}>
              <input className="input" type="email" autoComplete="email" inputMode="email" value={values.email} onChange={set('email')} {...aria('email')} />
            </Field>
            <Field id={id('phone')} label="Phone / WhatsApp" error={errors.phone}>
              <input className="input" type="tel" autoComplete="tel" inputMode="tel" placeholder="+971 50 123 4567" value={values.phone} onChange={set('phone')} {...aria('phone')} />
            </Field>
            <Field id={id('industry')} label="Industry" error={errors.industry}>
              <select className="input" value={values.industry} onChange={set('industry')} {...aria('industry')}>
                <option value="">Choose your industry</option>
                {industryNames.map((n) => (
                  <option key={n}>{n}</option>
                ))}
                <option>Other</option>
              </select>
            </Field>
            <Field id={id('country')} label="Country" error={errors.country}>
              <select className="input" value={values.country} onChange={set('country')} {...aria('country')}>
                {COUNTRIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </Field>

            <fieldset className={`span-2 ${styles.modes}`}>
              <legend className="label">How would you like to meet?</legend>
              {[
                { v: 'online', label: 'Online', Icon: Video },
                { v: 'in_person', label: 'In person', Icon: Users },
              ].map(({ v, label, Icon }) => (
                <label key={v} className={`${styles.mode} ${values.meetingMode === v ? styles.modeOn : ''}`}>
                  <input type="radio" name={id('mode')} value={v} checked={values.meetingMode === v} onChange={set('meetingMode')} />
                  <Icon size={20} />
                  {label}
                </label>
              ))}
            </fieldset>

            <div className="span-2">
              <Field id={id('message')} label="What's slowing you down?" optional>
                <textarea className="input" rows={3} maxLength={2000} value={values.message} onChange={set('message')} id={id('message')} />
              </Field>
            </div>
          </div>
          <div className="hp" aria-hidden="true">
            <label>
              Website
              <input tabIndex={-1} autoComplete="off" value={values.website} onChange={set('website')} />
            </label>
          </div>
          <button type="submit" className={`btn btn--block ${styles.primary}`} disabled={submitting}>
            {submitting && <span className="spinner" aria-hidden="true" />}
            {submitting ? 'Sending…' : (
              <>
                Send enquiry <ArrowRight size={18} />
              </>
            )}
          </button>
          <p className={styles.fine}>No obligation. We use your details only to reply to your enquiry.</p>
        </form>
      )}

      {sent && (
        <div className={styles.done} role="status" aria-live="polite">
          <span className={styles.doneIcon} aria-hidden="true">
            <Check size={28} />
          </span>
          <h2 ref={headingRef} tabIndex={-1} className={styles.stepTitle}>
            Thank you for contacting O2One Consultants.
          </h2>
          <p className="muted">Your enquiry has been submitted successfully. Our team will get back to you soon.</p>
          <div className={styles.actions}>
            <a href={site.whatsappUrl} target="_blank" rel="noopener noreferrer" className="btn">
              Message us on WhatsApp
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
