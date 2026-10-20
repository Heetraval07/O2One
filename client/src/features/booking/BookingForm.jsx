import { useEffect, useId, useRef, useState } from 'react';
import { api, ApiError } from '../../lib/api';
import { downloadIcs, slotLabel, slotParts } from '../../lib/format';
import { industryNames } from '../../content/industries';
import { site } from '../../content/site';
import { ArrowLeft, ArrowRight, Calendar, Check, Download, Users, Video } from '../../components/ui/Icons';
import { Loading } from '../../components/ui/States';
import styles from './BookingForm.module.css';

const COUNTRIES = ['United Arab Emirates', 'Saudi Arabia', 'Oman', 'Qatar', 'Bahrain', 'Kuwait', 'India', 'Other'];
const STEPS = ['Details', 'Pick a slot', 'Done'];
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

export default function BookingForm({ source = 'checkup', readinessItems = [] }) {
  const uid = useId();
  const [step, setStep] = useState(0);
  const [values, setValues] = useState(empty);
  const [errors, setErrors] = useState({});
  const [slots, setSlots] = useState(null); // { timezone, utcOffsetMinutes, durationMinutes, days }
  const [slotsError, setSlotsError] = useState(null);
  const [day, setDay] = useState(null);
  const [slot, setSlot] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [result, setResult] = useState(null);
  const headingRef = useRef(null);
  const firstRender = useRef(true);

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

  // Move focus to the step heading when the step changes (not on first load).
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    headingRef.current?.focus();
  }, [step]);

  const loadSlots = async () => {
    setSlotsError(null);
    try {
      const data = await api.slots();
      setSlots(data);
      const firstOpen = data.days.find((d) => d.slots.some((s) => s.available));
      setDay((cur) => (cur && data.days.some((d) => d.date === cur) ? cur : firstOpen?.date || null));
      setSlot((cur) => (cur && data.days.some((d) => d.slots.some((s) => s.start === cur && s.available)) ? cur : null));
    } catch (err) {
      setSlotsError(err);
    }
  };

  // Load slots early so step 2 is instant.
  useEffect(() => {
    loadSlots();
  }, []);

  const toStep2 = (e) => {
    e.preventDefault();
    const e2 = validateDetails(values);
    setErrors(e2);
    if (Object.keys(e2).length) {
      const first = Object.keys(e2)[0];
      document.getElementById(id(first))?.focus();
      return;
    }
    setStep(1);
  };

  const submit = async () => {
    if (!slot) {
      setFormError('Please pick a time.');
      return;
    }
    setSubmitting(true);
    setFormError('');
    try {
      const res = await api.book({
        ...values,
        slotStart: slot,
        source,
        readinessItems: source === 'vat_readiness' ? readinessItems : [],
      });
      setResult(res);
      setStep(2);
    } catch (err) {
      if (err instanceof ApiError && err.fields?.slotStart) {
        setFormError(err.message);
        setSlot(null);
        loadSlots();
      } else if (err instanceof ApiError && Object.keys(err.fields || {}).length) {
        setErrors(err.fields);
        setFormError(err.message);
        setStep(0);
      } else {
        setFormError(err.message || 'Something went wrong. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const currentDay = slots?.days.find((d) => d.date === day);
  const off = slots?.utcOffsetMinutes ?? 240;

  return (
    <div className={styles.card}>
      <ol className={styles.stepper} aria-label="Booking steps">
        {STEPS.map((s, i) => (
          <li key={s} className={i === step ? styles.stepOn : i < step ? styles.stepDone : ''} aria-current={i === step ? 'step' : undefined}>
            <span className={`num ${styles.stepNum}`}>{i < step ? <Check size={14} /> : i + 1}</span>
            {s}
          </li>
        ))}
      </ol>

      {source === 'vat_readiness' && step < 2 && (
        <p className={styles.context}>
          <strong>Free readiness check.</strong> You ticked {readinessItems.length} of 5 on the self-check. We&rsquo;ll bring
          a plan for the rest.
        </p>
      )}

      {/* Step 1: details */}
      {step === 0 && (
        <form onSubmit={toStep2} noValidate>
          <h2 ref={headingRef} tabIndex={-1} className={styles.stepTitle}>
            Your details
          </h2>
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
          <button type="submit" className={`btn btn--block ${styles.primary}`}>
            Continue <ArrowRight size={18} />
          </button>
          <p className={styles.fine}>No obligation. We use your details only to arrange your checkup.</p>
        </form>
      )}

      {/* Step 2: slot */}
      {step === 1 && (
        <div>
          <h2 ref={headingRef} tabIndex={-1} className={styles.stepTitle}>
            Pick a time
          </h2>
          <p className={styles.tz}>
            <Calendar size={16} /> Two-hour sessions · times in {slots?.timezone || 'Dubai time'}
          </p>
          {formError && <p className="alert" role="alert">{formError}</p>}

          {!slots && !slotsError && <Loading label="Finding open times" />}
          {slotsError && (
            <div className="alert" role="alert">
              We couldn&rsquo;t load the calendar. {slotsError.message}{' '}
              <button type="button" className="text-link" onClick={loadSlots}>
                Try again
              </button>
            </div>
          )}

          {slots && slots.days.length === 0 && (
            <p className="alert">
              No times are open right now. Message us on{' '}
              <a href={site.whatsappUrl} target="_blank" rel="noopener noreferrer">WhatsApp</a> and we&rsquo;ll find one.
            </p>
          )}

          {slots && slots.days.length > 0 && (
            <>
              <div className={styles.days} role="radiogroup" aria-label="Day">
                {slots.days.map((d) => {
                  const p = slotParts(d.slots[0].start, off);
                  const open = d.slots.some((s) => s.available);
                  return (
                    <button
                      key={d.date}
                      type="button"
                      role="radio"
                      aria-checked={day === d.date}
                      disabled={!open}
                      className={`${styles.day} ${day === d.date ? styles.dayOn : ''}`}
                      onClick={() => {
                        setDay(d.date);
                        setSlot(null);
                      }}
                    >
                      <span>{p.weekday}</span>
                      <strong className="num">{p.day}</strong>
                      <span>{p.month}</span>
                    </button>
                  );
                })}
              </div>

              {currentDay && (
                <div className={styles.times} role="radiogroup" aria-label="Time">
                  {currentDay.slots.map((s) => (
                    <button
                      key={s.start}
                      type="button"
                      role="radio"
                      aria-checked={slot === s.start}
                      disabled={!s.available}
                      className={`${styles.time} ${slot === s.start ? styles.timeOn : ''}`}
                      onClick={() => {
                        setSlot(s.start);
                        setFormError('');
                      }}
                    >
                      {s.time}
                      {!s.available && <span className={styles.taken}>Booked</span>}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          {slot && (
            <p className={styles.chosen} aria-live="polite">
              {slotLabel(slot, off)} · {values.meetingMode === 'in_person' ? 'In person' : 'Online'}
            </p>
          )}

          <div className={styles.actions}>
            <button type="button" className="btn btn--secondary" onClick={() => setStep(0)}>
              <ArrowLeft size={18} /> Back
            </button>
            <button type="button" className="btn" onClick={submit} disabled={submitting || !slot}>
              {submitting && <span className="spinner" aria-hidden="true" />}
              {submitting ? 'Booking…' : 'Book my free checkup'}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: done */}
      {step === 2 && result && (
        <div className={styles.done} aria-live="polite">
          <span className={styles.doneIcon} aria-hidden="true">
            <Check size={28} />
          </span>
          <h2 ref={headingRef} tabIndex={-1} className={styles.stepTitle}>
            You&rsquo;re booked, {values.fullName.split(' ')[0]}.
          </h2>
          <p className={styles.when}>{slotLabel(result.slotStart, off)}</p>
          <p className="muted">
            {result.meetingMode === 'in_person' ? 'In person' : 'Online'} · two hours · reference <strong>{result.reference}</strong>
          </p>
          <p className="muted small">
            We&rsquo;ll confirm the details with you at {values.email}. If the time stops working, message us and we&rsquo;ll move it.
          </p>
          <div className={styles.actions}>
            <button
              type="button"
              className="btn btn--secondary"
              onClick={() =>
                downloadIcs({
                  start: result.slotStart,
                  durationMinutes: slots?.durationMinutes || 120,
                  title: 'O2One Business Health Checkup',
                  description: `Free Business Health Checkup with O2One Consultants. Reference ${result.reference}.`,
                  location: result.meetingMode === 'in_person' ? 'O2One Consultants' : 'Online (link to follow)',
                })
              }
            >
              <Download size={18} /> Add to calendar
            </button>
            <a href={site.whatsappUrl} target="_blank" rel="noopener noreferrer" className="btn">
              Message us on WhatsApp
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
