import { Link } from 'react-router-dom';
import { services } from '../../content/services';
import Reveal from '../ui/Reveal';
import { stagger } from '../../lib/motion';
import { ArrowRight, Blocks, Compass, Layers, Sparkles } from '../ui/Icons';
import styles from './ServiceCards.module.css';

const ICONS = {
  'business-consultation': Compass,
  'odoo-services': Layers,
  'custom-industry-solutions': Blocks,
  'ai-automation': Sparkles,
};

/**
 * Home services: one card per service, straight from content/services.js. The core Odoo service (the one that
 * carries the partner badge in the data) is the dark featured card.
 */
export default function ServiceCards() {
  return (
    <ul className={styles.grid} role="list">
      {services.map((s, i) => {
        const Icon = ICONS[s.slug] || Compass;
        const featured = Boolean(s.partnerBadge);
        return (
          <Reveal
            as="li"
            key={s.slug}
            delay={stagger(i, 4)}
            className={`card-fx ${featured ? 'card-fx--dark' : ''} ${styles.card} ${featured ? styles.featured : ''}`}
          >
            <span className={`fx-icon ${styles.icon}`} aria-hidden="true">
              <Icon size={24} />
            </span>
            {featured && <span className={styles.badge}>Odoo Partner</span>}
            <h3 className={styles.title}>{s.name}</h3>
            <p className={styles.text}>{s.description}</p>
            <Link to={`/services/${s.slug}`} className={`text-link ${styles.cta}`} aria-label={`Learn more about ${s.name}`}>
              Learn more <ArrowRight size={16} />
            </Link>
          </Reveal>
        );
      })}
    </ul>
  );
}
