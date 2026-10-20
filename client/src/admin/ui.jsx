import { createContext, useCallback, useContext, useEffect, useId, useRef, useState } from 'react';

// ---- Dates (always shown in Dubai time, the time the team works in) -----------------------
const TZ = 'Asia/Dubai';
export const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: TZ }) : '—';
export const fmtDateTime = (iso) =>
  iso
    ? `${fmtDate(iso)}, ${new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: TZ })}`
    : '—';

/** ISO string <-> the value of an <input type="datetime-local"> in the browser's own time zone. */
export const toLocalInput = (iso) => {
  const d = iso ? new Date(iso) : new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
export const fromLocalInput = (value) => (value ? new Date(value).toISOString() : '');

export const slugify = (text) =>
  text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100);

// ---- Small building blocks ------------------------------------------------------------------
export function PageHead({ title, sub, children }) {
  return (
    <header className="adm-head">
      <div>
        <h1>{title}</h1>
        {sub && <p>{sub}</p>}
      </div>
      {children && <div className="adm-head-actions">{children}</div>}
    </header>
  );
}

export function Field({ label, error, hint, children, wide }) {
  const id = useId();
  return (
    <div className={`adm-field ${wide ? 'adm-wide' : ''}`}>
      <label htmlFor={id}>{label}</label>
      {typeof children === 'function' ? children({ id, 'aria-invalid': error ? 'true' : undefined, 'aria-describedby': `${id}-m` }) : children}
      {(error || hint) && (
        <p id={`${id}-m`} className={error ? 'adm-error' : 'adm-hint'}>
          {error || hint}
        </p>
      )}
    </div>
  );
}

const STATUS_LABEL = {
  new: 'New', confirmed: 'Confirmed', completed: 'Completed', cancelled: 'Cancelled',
  live: 'Live', draft: 'Draft', scheduled: 'Scheduled', subscribed: 'Subscribed', unsubscribed: 'Unsubscribed',
};
export const StatusBadge = ({ status }) => <span className={`adm-badge adm-badge--${status}`}>{STATUS_LABEL[status] || status}</span>;

export function Tabs({ value, onChange, items, label }) {
  return (
    <div className="adm-tabs" role="group" aria-label={label}>
      {items.map((t) => (
        <button key={t.value} type="button" aria-pressed={value === t.value} onClick={() => onChange(t.value)}>
          {t.label}
          {t.count != null && <span>{t.count}</span>}
        </button>
      ))}
    </div>
  );
}

export function Pager({ page, limit, total, onPage }) {
  const pages = Math.max(1, Math.ceil(total / limit));
  if (total <= limit) return total ? <p className="adm-hint adm-pager">{total} in total</p> : null;
  return (
    <nav className="adm-pager" aria-label="Pages">
      <span>
        {(page - 1) * limit + 1}–{Math.min(total, page * limit)} of {total}
      </span>
      <button type="button" className="adm-btn adm-btn--ghost" disabled={page <= 1} onClick={() => onPage(page - 1)}>
        Previous
      </button>
      <button type="button" className="adm-btn adm-btn--ghost" disabled={page >= pages} onClick={() => onPage(page + 1)}>
        Next
      </button>
    </nav>
  );
}

export const Empty = ({ children }) => <p className="adm-empty">{children}</p>;
export const Loading = () => <p className="adm-empty" role="status">Loading…</p>;
export const ErrorNote = ({ error }) => (error ? <p className="adm-alert adm-alert--error" role="alert">{error.message || String(error)}</p> : null);

/** Delete button that asks "Sure?" in place instead of using a pop-up. */
export function DeleteButton({ onDelete, label = 'Delete', small }) {
  const [asking, setAsking] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!asking) return undefined;
    const t = setTimeout(() => setAsking(false), 6000);
    return () => clearTimeout(t);
  }, [asking]);
  if (!asking) {
    return (
      <button type="button" className={`adm-btn adm-btn--danger-ghost ${small ? 'adm-btn--sm' : ''}`} onClick={() => setAsking(true)}>
        {label}
      </button>
    );
  }
  return (
    <span className="adm-confirm" role="group" aria-label="Confirm delete">
      <button
        type="button"
        className={`adm-btn adm-btn--danger ${small ? 'adm-btn--sm' : ''}`}
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          try {
            await onDelete();
          } finally {
            setBusy(false);
            setAsking(false);
          }
        }}
      >
        {busy ? 'Deleting…' : 'Yes, delete'}
      </button>
      <button type="button" className={`adm-btn adm-btn--ghost ${small ? 'adm-btn--sm' : ''}`} onClick={() => setAsking(false)}>
        Keep
      </button>
    </span>
  );
}

/** Dialog with Esc to close, focus moved inside and returned afterwards. */
export function Modal({ title, onClose, children, wide }) {
  const ref = useRef(null);
  const titleId = useId();
  useEffect(() => {
    const prev = document.activeElement;
    ref.current?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
      prev?.focus?.();
    };
  }, [onClose]);
  return (
    <div className="adm-modal-back" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={ref} className={`adm-modal ${wide ? 'adm-modal--wide' : ''}`} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1}>
        <header>
          <h2 id={titleId}>{title}</h2>
          <button type="button" className="adm-icon-btn" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>
        <div className="adm-modal-body">{children}</div>
      </div>
    </div>
  );
}

// ---- Toasts ----------------------------------------------------------------------------------
const ToastContext = createContext(() => {});
export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);
  const push = useCallback((message, type = 'ok') => {
    const id = Math.random().toString(36).slice(2);
    setItems((l) => [...l, { id, message, type }]);
    setTimeout(() => setItems((l) => l.filter((t) => t.id !== id)), 4500);
  }, []);
  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="adm-toasts" role="status" aria-live="polite">
        {items.map((t) => (
          <div key={t.id} className={`adm-toast adm-toast--${t.type}`}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

/** Debounced copy of a value, for search boxes. */
export function useDebounced(value, ms = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

/** Load data whenever `deps` change; keeps the previous result on screen while the next one loads. */
export function useLoad(loader, deps) {
  const [state, setState] = useState({ data: null, error: null, loading: true });
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const ctrl = new AbortController();
    setState((s) => ({ ...s, loading: true, error: null }));
    loader(ctrl.signal)
      .then((data) => setState({ data, error: null, loading: false }))
      .catch((error) => error.name !== 'AbortError' && setState((s) => ({ ...s, error, loading: false })));
    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);
  return { ...state, reload: () => setTick((t) => t + 1) };
}
