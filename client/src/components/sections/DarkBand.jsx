import Reveal from '../ui/Reveal';
import { phases } from '../../content/approach';
import styles from './DarkBand.module.css';

/** Ink promise band: the pledge on the left, the three phases that back it up on the right. Max one per page. */
export default function DarkBand({ title, text, children }) {
  return (
    <section className={styles.band}>
      <div className={`container ${styles.grid}`}>
        <Reveal className={styles.text}>
          <span className={styles.eyebrow}>Our promise</span>
          <h2 className={styles.title}>{title}</h2>
          {text && <p className={styles.sub}>{text}</p>}
          {children && <div className={styles.actions}>{children}</div>}
        </Reveal>

        <Reveal variant="right" delay={100}>
          <p className={styles.panelLabel}>One partner, three phases</p>
          <ol className={styles.phases} role="list">
            {phases.map((p) => (
              <li key={p.id} className={styles.phase}>
                <span className={`num ${styles.phaseNum}`}>{p.number}</span>
                <div>
                  <p className={styles.phaseName}>{p.name}</p>
                  <p className={styles.phaseText}>{p.tagline}</p>
                </div>
              </li>
            ))}
          </ol>
        </Reveal>
      </div>
    </section>
  );
}
