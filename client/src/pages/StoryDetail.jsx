import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { useApi, useMeta } from '../lib/hooks';
import { serviceBySlug } from '../content/services';
import { phases } from '../content/approach';
import Reveal from '../components/ui/Reveal';
import PageHero from '../components/sections/PageHero';
import CtaBand from '../components/ui/CtaBand';
import { SampleBadge, StoryCard } from '../components/sections/Cards';
import { CheckupButton } from '../components/ui/Buttons';
import { ErrorState, SkeletonLines } from '../components/ui/States';
import NotFound from './NotFound';
import styles from './StoryDetail.module.css';

const allSteps = phases.flatMap((p) => p.steps.map((s) => s.title));

export default function StoryDetail() {
  const { slug } = useParams();
  const [reload, setReload] = useState(0);
  const { data: story, error, loading } = useApi(`story:${slug}:${reload}`, (signal) => api.story(slug, { signal }));
  useMeta(story ? `${story.title} | Customer Stories | O2One` : 'Customer story | O2One', story?.summary);

  if (error?.status === 404) return <NotFound />;

  const service = story && serviceBySlug[story.serviceSlug];

  return (
    <>
      <PageHero
        crumbs={[{ label: 'Home', to: '/' }, { label: 'Customer stories', to: '/customer-stories' }, { label: story?.clientName || 'Story' }]}
        eyebrow={story ? `Stories · ${story.clientName}` : 'Customer story'}
        title={story?.title || (loading ? 'Loading story…' : 'Customer story')}
        lead={story?.summary}
      />

      <section className="section">
        <div className="container">
          {loading && <SkeletonLines rows={5} />}
          {error && <ErrorState error={error} onRetry={() => setReload((n) => n + 1)} />}

          {story && (
            <div className={styles.layout}>
              <article className={styles.main}>
                {story.isSample && (
                  <p className={`alert alert--ok ${styles.sampleNote}`}>
                    <SampleBadge /> This is sample content to show the layout. It will be replaced with an approved client story.
                  </p>
                )}
                <div className={styles.media} aria-hidden="true">
                  {story.coverImage ? <img src={story.coverImage} alt="" loading="lazy" decoding="async" /> : <span>Photo · {story.clientName}</span>}
                </div>

                <Reveal as="section" className={styles.block} aria-labelledby="challenge">
                  <h2 id="challenge" className="h2">The challenge</h2>
                  <p className="lead">{story.challenge}</p>
                </Reveal>

                <Reveal as="section" className={styles.block} aria-labelledby="approach">
                  <h2 id="approach" className="h2">Our approach</h2>
                  <ol className={styles.steps} role="list">
                    {story.approach.map((step) => (
                      <li key={step}>
                        <span className={`num ${styles.stepNum}`}>{allSteps.indexOf(step) + 1 || '·'}</span>
                        {step}
                      </li>
                    ))}
                  </ol>
                  <Link to="/#approach" className="text-link">How our 9 steps work →</Link>
                </Reveal>

                {story.results.length > 0 && (
                  <Reveal as="section" className={styles.block} aria-labelledby="results">
                    <h2 id="results" className="h2">Results</h2>
                    <dl className={styles.results}>
                      {story.results.map((r) => (
                        <div key={r.label}>
                          <dt>{r.label}</dt>
                          <dd className="num">{r.value}</dd>
                        </div>
                      ))}
                    </dl>
                  </Reveal>
                )}

                {story.quote && (
                  <Reveal as="figure" className={styles.quote}>
                    <blockquote>&ldquo;{story.quote}&rdquo;</blockquote>
                    {story.quoteAuthor && <figcaption>{story.quoteAuthor}</figcaption>}
                  </Reveal>
                )}
              </article>

              <aside className={styles.side} aria-label="Story facts">
                <dl className={styles.facts}>
                  <div><dt>Industry</dt><dd>{story.industry}</dd></div>
                  <div><dt>Country</dt><dd>{story.country}</dd></div>
                  <div>
                    <dt>Services</dt>
                    <dd>{service ? <Link to={`/services/${service.slug}`}>{service.name}</Link> : story.serviceSlug}</dd>
                  </div>
                  {story.apps && <div><dt>Apps</dt><dd>{story.apps}</dd></div>}
                </dl>
                <div className={styles.sideCta}>
                  <p className="h3">Get the same checkup</p>
                  <p className="small muted">Two hours. One conversation. On us.</p>
                  <CheckupButton label="Book free checkup" className="btn--block" />
                </div>
              </aside>
            </div>
          )}
        </div>
      </section>

      {story?.more?.length > 0 && (
        <section className="section section--grey" aria-labelledby="more-title">
          <div className="container">
            <h2 id="more-title" className="h2" style={{ marginBottom: 'var(--s4)' }}>
              More stories
            </h2>
            <ul className={styles.more} role="list">
              {story.more.map((s) => (
                <li key={s.slug}>
                  <StoryCard story={s} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <CtaBand />
    </>
  );
}
