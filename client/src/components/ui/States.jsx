import styles from './States.module.css';

export function ErrorState({ error, onRetry, title = "This didn't load." }) {
  return (
    <div className={styles.box} role="alert">
      <p className={styles.title}>{title}</p>
      <p className="muted small">{error?.message || 'Please try again in a moment.'}</p>
      {onRetry && (
        <button type="button" className="btn btn--secondary btn--sm" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}

export function EmptyState({ title, children }) {
  return (
    <div className={styles.box}>
      <p className={styles.title}>{title}</p>
      {children && <div className="muted small">{children}</div>}
    </div>
  );
}

export function SkeletonLines({ rows = 3 }) {
  return (
    <div className={styles.skeleton} aria-hidden="true">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className={`skeleton ${styles.line}`} style={{ width: `${90 - i * 18}%` }} />
      ))}
    </div>
  );
}

export function Loading({ label = 'Loading' }) {
  return (
    <div className={styles.loading} role="status">
      <span className="spinner" aria-hidden="true" />
      <span>{label}…</span>
    </div>
  );
}
