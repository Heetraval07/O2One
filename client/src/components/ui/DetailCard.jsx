import Reveal from './Reveal';
import { Plus } from './Icons';
import { stagger } from '../../lib/motion';
import styles from './DetailCard.module.css';

/**
 * The approved card design for the Industries, Custom Industry Solutions and Business Consultation pages: white,
 * softly rounded, a small icon tile at the top left, serif title, grey description.
 *
 * With `onOpen` the whole card is one button with an orange "Details +" link that opens that item's detail panel.
 * Without it the card is plain content (the consultation steps).
 *
 * `step` is a small orange number above the title, `sub` a bold supporting line under it, `accent` an orange line
 * along the top edge on hover (top edge only), `iconZoom` how large the illustration is drawn inside its tile (the
 * artwork sits small in some files). `compact` (on the grid) makes phones two columns with `short` as the text.
 */
export function DetailGrid({ children, compact = false, columns = 3 }) {
  return (
    <ul className={styles.grid} data-compact={compact} data-cols={columns} role="list">
      {children}
    </ul>
  );
}

export function DetailCard({ index = 0, columns = 3, image, step, title, sub, text, short, iconZoom, accent = true, onOpen }) {
  const body = (
    <>
      <span className={styles.icon} aria-hidden="true" style={iconZoom ? { '--icon-zoom': iconZoom } : undefined}>
        <img src={image} alt="" width="640" height="400" loading="lazy" decoding="async" />
      </span>
      {step && <span className={styles.step}>{step}</span>}
      <span className={styles.title}>{title}</span>
      {sub && <span className={styles.sub}>{sub}</span>}
      <span className={`${styles.text} ${styles.long}`} data-has-short={Boolean(short)}>
        {text}
      </span>
      {short && <span className={`${styles.text} ${styles.short}`}>{short}</span>}
      {onOpen && (
        <span className={styles.more}>
          Details <Plus size={16} />
        </span>
      )}
    </>
  );
  const cls = `${styles.card} ${accent ? styles.accent : ''}`;
  return (
    <Reveal as="li" delay={stagger(index, columns)}>
      {onOpen ? (
        <button type="button" className={cls} onClick={onOpen} aria-haspopup="dialog">
          {body}
        </button>
      ) : (
        <div className={`${cls} ${styles.plain}`}>{body}</div>
      )}
    </Reveal>
  );
}
