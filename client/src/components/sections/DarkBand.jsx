import Reveal from '../ui/Reveal';
import styles from './DarkBand.module.css';

/** Ink promise band, full width: label, one-line heading on desktop, supporting text, then the call to action. Max one per page. */
export default function DarkBand({ title, text, children }) {
  return (
    <section className={styles.band}>
      <div className={`container ${styles.inner}`}>
        <Reveal className={styles.text}>
          <span className={styles.eyebrow}>Our promise</span>
          <h2 className={styles.title}>{title}</h2>
          {text && <p className={styles.sub}>{text}</p>}
          {children && <div className={styles.actions}>{children}</div>}
        </Reveal>
      </div>
    </section>
  );
}
