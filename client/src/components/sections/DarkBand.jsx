import Reveal from '../ui/Reveal';
import styles from './DarkBand.module.css';

/** Ink promise band, split 1.2 : 1 with an orange decorative panel. Max one per page. */
export default function DarkBand({ title, text, children }) {
  return (
    <section className={styles.band}>
      <div className={styles.grid}>
        <Reveal className={styles.text}>
          <h2 className={styles.title}>{title}</h2>
          {text && <p className={styles.sub}>{text}</p>}
          {children && <div className={styles.actions}>{children}</div>}
        </Reveal>
        <div className={styles.deco} aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      </div>
    </section>
  );
}
