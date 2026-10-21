import { useId, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { phases } from '../../content/approach';
import { ArrowRight } from '../ui/Icons';
import styles from './ApproachTabs.module.css';

/** Home approach summary: pick a phase, see its three steps; a 9-step bar ties them together. */
export default function ApproachTabs() {
  const [active, setActive] = useState(0);
  const [dir, setDir] = useState(1); // which way the panel slides in
  const uid = useId();
  const tabRefs = useRef([]);
  const phase = phases[active];
  const next = phases[active + 1];

  const select = (i) => {
    setDir(i >= active ? 1 : -1);
    setActive(i);
  };

  const onKeyDown = (e) => {
    const dir = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
    if (!dir) return;
    e.preventDefault();
    const i = (active + dir + phases.length) % phases.length;
    select(i);
    tabRefs.current[i]?.focus();
  };

  return (
    <div>
      <div className={styles.tabs} role="tablist" aria-label="Approach phases" onKeyDown={onKeyDown} style={{ '--active': active }}>
        {phases.map((p, i) => (
          <button
            key={p.id}
            ref={(el) => (tabRefs.current[i] = el)}
            id={`${uid}-tab-${p.id}`}
            role="tab"
            type="button"
            aria-selected={i === active}
            aria-controls={`${uid}-panel`}
            tabIndex={i === active ? 0 : -1}
            className={styles.tab}
            onClick={() => select(i)}
          >
            <span className="num">{p.number}</span> · {p.name}
          </button>
        ))}
      </div>

      <ol className={styles.progress} aria-hidden="true">
        {phases.flatMap((p, pi) =>
          p.steps.map((s) => <li key={s.n} className={pi <= active ? styles.filled : ''} data-current={pi === active} />),
        )}
      </ol>

      <div
        id={`${uid}-panel`}
        role="tabpanel"
        aria-labelledby={`${uid}-tab-${phase.id}`}
        className={styles.panel}
        data-dir={dir}
        key={phase.id}
      >
        <h3 className={`phase-title ${styles.tagline}`}>{phase.tagline}</h3>
        <ol className={styles.steps} role="list">
          {phase.steps.map((s, i) => (
            <li key={s.n} className={`card-fx ${s.ongoing ? 'card-fx--dark' : ''} ${styles.step} ${s.ongoing ? styles.ongoing : ''}`} style={{ '--i': i }}>
              <span className={`num fx-icon ${styles.circle}`}>{s.n}</span>
              <span className={styles.stepLabel}>Step {s.n}</span>
              <h4 className={`fx-nudge ${styles.stepTitle}`}>{s.title}</h4>
              <p className={styles.stepText}>{s.text}</p>
            </li>
          ))}
        </ol>
        <div className={styles.foot}>
          <p className={styles.callout}>&ldquo;{phase.callout}&rdquo;</p>
          {next && (
            <button type="button" className="btn btn--secondary btn--sm" onClick={() => select(active + 1)}>
              Next: {next.name} <ArrowRight size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
