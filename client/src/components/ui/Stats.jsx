import { useCountUp, useInView } from '../../lib/hooks';
import styles from './Stats.module.css';

function Stat({ index = 0, value, suffix, label, start, tone, panel }) {
  const n = useCountUp(value, start);
  return (
    <div className={`${styles.stat} ${panel ? styles.panelStat : ''}`} data-in={start ? "true" : "false"} style={{ "--i": index }}>
      <dt className={`${styles.label} ${tone === 'light' ? styles.labelLight : ''}`}>{label}</dt>
      <dd className={`num ${styles.value} ${tone === 'light' ? styles.valueLight : ''}`}>
        <span aria-hidden="true">
          {n}
          {suffix}
        </span>
        <span className="sr-only">
          {value}
          {suffix}
        </span>
      </dd>
    </div>
  );
}

/** Full-width ink trust bar: 5 equal columns, numbers in bright orange. */
export function TrustBar({ stats }) {
  const [ref, inView] = useInView({ threshold: 0.4 });
  return (
    <section className={styles.trust} aria-label="O2One in numbers">
      <div className="container">
        <dl ref={ref} className={styles.trustGrid}>
          {stats.map((s) => (
            <Stat key={s.label} index={stats.indexOf(s)} {...s} start={inView} />
          ))}
        </dl>
      </div>
    </section>
  );
}

/** Inline stat row on white (About section, team numbers). */
export function StatRow({ stats, children }) {
  const [ref, inView] = useInView({ threshold: 0.4 });
  return (
    <dl ref={ref} className={styles.row}>
      {stats.map((s) => (
        <Stat key={s.label} index={stats.indexOf(s)} {...s} start={inView} tone="light" />
      ))}
      {children}
    </dl>
  );
}

/**
 * Team numbers as one bordered panel: columns split by 1px lines, numbers in deep orange,
 * a short rule drawing under each as it counts. Optional aside (e.g. the partner badge) sits in the last cell.
 */
export function StatPanel({ stats, children }) {
  const [ref, inView] = useInView({ threshold: 0.35 });
  return (
    <div
      ref={ref}
      className={`edge-hover ${styles.panel}`}
      data-in={inView ? 'true' : 'false'}
      style={stats.length !== 3 ? { '--panel-cols': `${stats.length}fr`, '--stat-cols': stats.length } : undefined}
    >
      <dl className={styles.panelStats}>
        {stats.map((s, i) => (
          <Stat key={s.label} index={i} {...s} start={inView} tone="light" panel />
        ))}
      </dl>
      {children && <div className={styles.panelAside}>{children}</div>}
    </div>
  );
}
