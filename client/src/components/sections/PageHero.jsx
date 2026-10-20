import SplitText from '../ui/SplitText';
import { Link } from 'react-router-dom';
import Reveal from '../ui/Reveal';
import styles from './PageHero.module.css';

/** Inner-page header on light grey: breadcrumb, eyebrow, H1, lead, optional actions and side content. */
export default function PageHero({ crumbs, eyebrow, title, lead, children, aside, tone = 'grey' }) {
  return (
    <section className={`${styles.hero} ${tone === 'white' ? styles.white : ''}`}>
      <div className={`container ${aside ? styles.withAside : ''}`}>
        <Reveal className={styles.text}>
          {crumbs && (
            <nav aria-label="Breadcrumb" className={styles.crumbs}>
              <ol role="list">
                {crumbs.map((c, i) => (
                  <li key={c.label}>
                    {c.to && i < crumbs.length - 1 ? <Link to={c.to}>{c.label}</Link> : <span aria-current="page">{c.label}</span>}
                  </li>
                ))}
              </ol>
            </nav>
          )}
          {eyebrow && <span className="eyebrow">{eyebrow}</span>}
          <SplitText text={title} className="h1" delay={80} />
          {lead && <p className={`lead ${styles.lead}`}>{lead}</p>}
          {children && <div className={styles.actions}>{children}</div>}
        </Reveal>
        {aside && (
          <Reveal delay={120} className={styles.aside}>
            {aside}
          </Reveal>
        )}
      </div>
    </section>
  );
}
