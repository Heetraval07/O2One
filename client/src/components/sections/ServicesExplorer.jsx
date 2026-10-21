import { useState } from 'react';
import { Link } from 'react-router-dom';
import { services } from '../../content/services';
import { solutions, solutionShort } from '../../content/industries';
import { api } from '../../lib/api';
import { useApi } from '../../lib/hooks';
import { ArrowRight, Minus, Plus } from '../ui/Icons';
import ServiceArt from './ServiceArt';
import styles from './ServicesExplorer.module.css';

const included = (s) => (s.useSolutions ? solutions.slice(0, 8).map(solutionShort) : s.items.map((i) => i.name));

function StoryTeaser({ stories, slug }) {
  const story = stories?.find((s) => s.serviceSlug === slug) || stories?.find((s) => s.isFeatured);
  if (!story) return null;
  return (
    <Link to={`/customer-stories/${story.slug}`} className={`card-fx ${styles.story}`}>
      <span className="eyebrow">Customer story</span>
      <span className={styles.storyTitle}>{story.title}</span>
      <span className="text-link">
        Read <ArrowRight size={16} />
      </span>
    </Link>
  );
}

function Panel({ svc, stories, inline = false }) {
  return (
    <div className={`${styles.panel} ${inline ? styles.inline : ''}`} key={svc.slug}>
      <div className={styles.panelMain}>
        <span className="eyebrow">
          {svc.number} · {svc.name}
        </span>
        <p className={styles.panelHeading}>{svc.panelHeading}</p>
        <p className={styles.included}>What&rsquo;s included</p>
        <ul className="tag-list" role="list">
          {included(svc).map((n) => (
            <li key={n} className="badge">
              {n}
            </li>
          ))}
        </ul>
        <Link to={`/services/${svc.slug}`} className="btn">
          Explore {svc.name} <ArrowRight size={18} />
        </Link>
      </div>
      {!inline && (
        <div className={styles.panelSide}>
          <div className={styles.art}>
            <ServiceArt service={svc} />
          </div>
          <StoryTeaser stories={stories} slug={svc.slug} />
        </div>
      )}
    </div>
  );
}

/** Home services: list on the left switches the panel on the right; an accordion on phones. */
export default function ServicesExplorer() {
  const [active, setActive] = useState('odoo-services');
  const { data: stories } = useApi('stories:all', (signal) => api.stories({}, { signal }));
  const svc = services.find((s) => s.slug === active);

  return (
    <div className={styles.wrap}>
      <ul className={styles.list} role="list">
        {services.map((s) => {
          const isActive = s.slug === active;
          return (
            <li key={s.slug}>
              <button
                type="button"
                className={`${styles.item} ${isActive ? styles.itemActive : ''}`}
                aria-expanded={isActive}
                aria-controls="service-panel"
                onClick={() => setActive(s.slug)}
                onMouseEnter={() => window.matchMedia('(hover: hover) and (min-width: 820px)').matches && setActive(s.slug)}
              >
                <span className={`num ${styles.num}`}>{s.number}</span>
                <span className={styles.name}>{s.name}</span>
                <span className={styles.toggle} aria-hidden="true">
                  {isActive ? <Minus size={16} /> : <Plus size={16} />}
                </span>
              </button>
              {isActive && (
                <div className={styles.mobileOnly}>
                  <Panel svc={s} stories={stories} inline />
                </div>
              )}
            </li>
          );
        })}
      </ul>
      <div id="service-panel" className={styles.desktopOnly} aria-live="polite">
        <Panel svc={svc} stories={stories} />
      </div>
    </div>
  );
}
