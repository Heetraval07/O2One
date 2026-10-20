import { stagger } from '../lib/motion';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useApi, useMeta } from '../lib/hooks';
import { services, serviceBySlug } from '../content/services';
import Reveal from '../components/ui/Reveal';
import PageHero from '../components/sections/PageHero';
import CtaBand from '../components/ui/CtaBand';
import { SampleBadge, StoryCard } from '../components/sections/Cards';
import { EmptyState, ErrorState, SkeletonLines } from '../components/ui/States';
import { ArrowRight } from '../components/ui/Icons';
import styles from './Stories.module.css';

export default function Stories() {
  useMeta(
    'Customer Stories | O2One Consultants',
    'Businesses that stopped fixing problems and started growing, with Odoo, custom solutions and automation from O2One.',
  );
  const [reload, setReload] = useState(0);
  const { data, error, loading } = useApi(`stories:all:${reload}`, (signal) => api.stories({}, { signal }));
  const [industry, setIndustry] = useState('all');
  const [service, setService] = useState('all');

  const all = data || [];
  const featured = all.find((s) => s.isFeatured) || all[0];
  const industries = useMemo(() => [...new Set(all.map((s) => s.industry))], [all]);
  const filtering = industry !== 'all' || service !== 'all';
  // Unfiltered: the featured story sits on top, the rest below. Filtered: every match in the grid.
  const list = filtering
    ? all.filter((s) => (industry === 'all' || s.industry === industry) && (service === 'all' || s.serviceSlug === service))
    : all.filter((s) => s !== featured);

  return (
    <>
      <PageHero
        crumbs={[{ label: 'Home', to: '/' }, { label: 'Customer stories' }]}
        eyebrow="Customer stories"
        title="Businesses that stopped fixing and started growing."
      />

      <section className="section">
        <div className="container">
          {loading && <SkeletonLines rows={4} />}
          {error && <ErrorState error={error} onRetry={() => setReload((n) => n + 1)} />}

          {!loading && !error && all.length === 0 && (
            <EmptyState title="Stories are on their way.">We are writing up our first client stories. Check back soon.</EmptyState>
          )}

          {featured && !filtering && (
            <Reveal className={styles.featured}>
              <div className={styles.featuredMedia} aria-hidden="true">
                <span>Photo · {featured.clientName}</span>
              </div>
              <div className={styles.featuredBody}>
                <p className={styles.meta}>
                  Featured · {featured.industry}
                  {featured.isSample && <SampleBadge />}
                </p>
                <h2 className="phase-title">{featured.title}</h2>
                <p className="lead">{featured.summary}</p>
                <Link to={`/customer-stories/${featured.slug}`} className="btn">
                  Read story <ArrowRight size={18} />
                </Link>
              </div>
            </Reveal>
          )}

          {all.length > 0 && (
            <div className={styles.filters} role="group" aria-label="Filter stories">
              <div className={styles.chips}>
                {['all', ...industries].map((ind) => (
                  <button
                    key={ind}
                    type="button"
                    className={`${styles.chip} ${industry === ind ? styles.chipOn : ''}`}
                    aria-pressed={industry === ind}
                    onClick={() => setIndustry(ind)}
                  >
                    {ind === 'all' ? 'All industries' : ind}
                  </button>
                ))}
              </div>
              <label className={styles.select}>
                <span className="sr-only">Service</span>
                <select className="input" value={service} onChange={(e) => setService(e.target.value)}>
                  <option value="all">All services</option>
                  {services.map((s) => (
                    <option key={s.slug} value={s.slug}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}

          {all.length > 0 && (
            <>
              <p className="sr-only" aria-live="polite">
                {list.length} {list.length === 1 ? 'story' : 'stories'} shown
              </p>
              {list.length ? (
                <ul className={styles.grid} role="list">
                  {list.map((s, i) => (
                    <Reveal as="li" key={s.slug} delay={stagger(i)}>
                      <StoryCard story={s} />
                    </Reveal>
                  ))}
                </ul>
              ) : (
                <EmptyState title="No stories match yet.">
                  Try another industry or service, or{' '}
                  <button type="button" className="text-link" onClick={() => { setIndustry('all'); setService('all'); }}>
                    clear the filters
                  </button>
                  .{service !== 'all' && <> Or read about <Link to={`/services/${service}`}>{serviceBySlug[service]?.name}</Link>.</>}
                </EmptyState>
              )}
            </>
          )}
        </div>
      </section>

      <CtaBand />
    </>
  );
}
