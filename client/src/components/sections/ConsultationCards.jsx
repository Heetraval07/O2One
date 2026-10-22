import { Link } from 'react-router-dom';
import Reveal from '../ui/Reveal';
import { stagger } from '../../lib/motion';
import { ArrowRight } from '../ui/Icons';
import { CHECKUP_PATH, CHECKUP_SHORT } from '../../content/site';
import styles from './ConsultationCards.module.css';

/**
 * Business Consultation: the four steps as compact 1 x 4 cards in the style of the home page's service cards
 * (same card system, padding, type and hover). The first step, the Business Health Checkup, is the dark featured
 * card with a "Start Here" pill and the one real action on the page for it: booking the checkup.
 */
export default function ConsultationCards({ items }) {
  return (
    <ul className={styles.grid} role="list">
      {items.map((it, i) => {
        const featured = i === 0;
        return (
          <Reveal
            as="li"
            key={it.name}
            delay={stagger(i, 4)}
            className={`card-fx ${featured ? 'card-fx--dark' : ''} ${styles.card} ${featured ? styles.featured : ''}`}
          >
            {featured && <span className={styles.badge}>Start Here</span>}
            <span className={`fx-nudge ${styles.step}`}>{String(i + 1).padStart(2, '0')}</span>
            <h3 className={styles.title}>{it.name}</h3>
            <p className={styles.sub}>{it.text}</p>
            <p className={styles.text}>{it.detail}</p>
            {featured && (
              <Link to={CHECKUP_PATH} className={`text-link ${styles.cta}`}>
                {CHECKUP_SHORT} <ArrowRight size={16} />
              </Link>
            )}
          </Reveal>
        );
      })}
    </ul>
  );
}
