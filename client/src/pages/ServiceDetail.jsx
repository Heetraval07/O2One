import { stagger } from '../lib/motion';
import { Link, useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { useApi, useMeta } from '../lib/hooks';
import { services, serviceBySlug } from '../content/services';
import { problems } from '../content/company';
import { solutions } from '../content/industries';
import { site } from '../content/site';
import Reveal from '../components/ui/Reveal';
import PageHero from '../components/sections/PageHero';
import ServiceVisual from '../components/sections/ServiceVisual';
import { NumberedGrid, StoryCard } from '../components/sections/Cards';
import Accordion from '../components/ui/Accordion';
import CtaBand from '../components/ui/CtaBand';
import { CheckupButton, TextLink } from '../components/ui/Buttons';
import { ArrowRight } from '../components/ui/Icons';
import NotFound from './NotFound';
import styles from './ServiceDetail.module.css';

export default function ServiceDetail() {
  const { slug } = useParams();
  const svc = serviceBySlug[slug];
  const index = services.findIndex((s) => s.slug === slug);
  useMeta(svc ? `${svc.name} | O2One Consultants` : 'Page not found | O2One', svc?.tagline);
  const { data: stories } = useApi(svc ? `stories:service:${slug}` : null, (signal) =>
    api.stories({ service: slug }, { signal }),
  );

  if (!svc) return <NotFound />;

  const items = svc.useSolutions ? solutions.map((name) => ({ name })) : svc.items;
  const others = services.filter((s) => s.slug !== slug);
  const story = stories?.[0];

  return (
    <>
      <PageHero
        crumbs={[{ label: 'Home', to: '/' }, { label: 'Services', to: '/services' }, { label: svc.name }]}
        eyebrow={`${svc.number} · ${svc.name}`}
        title={svc.tagline}
        lead={svc.description}
        aside={
          <div className={styles.aside}>
            <ServiceVisual service={svc} variant={index} />
            {svc.partnerBadge && <span className="badge">{site.partnerLabel}</span>}
          </div>
        }
      >
        <CheckupButton label="Book free checkup" />
      </PageHero>

      {svc.showProblems && (
        <section className="section" aria-labelledby="problems-title">
          <div className="container">
            <Reveal className="section-head">
              <span className="eyebrow">If this sounds like you…</span>
              <h2 id="problems-title" className="h2">
                …here&rsquo;s where we start.
              </h2>
            </Reveal>
            <NumberedGrid items={problems.slice(0, 3)} />
          </div>
        </section>
      )}

      <section className={`section ${svc.showProblems ? 'section--grey' : ''}`} aria-labelledby="included-title">
        <div className="container">
          <Reveal className="section-head">
            <span className="eyebrow">What&rsquo;s included</span>
            <h2 id="included-title" className="h2">
              {svc.useSolutions ? 'Ready-made industry solutions, built on Odoo.' : `What ${svc.name} covers.`}
            </h2>
            {svc.useSolutions && (
              <p className="lead">Start from a proven base, then shape it around the way your business works.</p>
            )}
          </Reveal>

          <ul className={`line-grid ${svc.useSolutions ? 'cols-4' : 'cols-3'} ${styles.items}`} role="list">
            {items.map((it, i) => (
              <Reveal as="li" key={it.name} delay={stagger(i, svc.useSolutions ? 4 : 3)} className={`card-fx ${styles.item}`}>
                <span className={`num fx-nudge ${styles.itemNum}`}>{String(i + 1).padStart(2, '0')}</span>
                <h3 className={styles.itemTitle}>{it.name}</h3>
                {it.text && <p className="muted">{it.text}</p>}
                {it.to && (
                  <TextLink to={it.to} className={styles.itemLink}>
                    See the page
                  </TextLink>
                )}
              </Reveal>
            ))}
          </ul>

          {svc.useSolutions && (
            <p className={styles.note}>
              <TextLink to="/industries">See the industries we serve</TextLink>
            </p>
          )}
        </div>
      </section>

      {svc.callout && (
        <section className="section section--tight" aria-label={svc.callout.title}>
          <div className="container">
            <Reveal className={styles.callout}>
              <div>
                <h2 className="h3">{svc.callout.title}</h2>
                <p className="muted">{svc.callout.text}</p>
              </div>
              <TextLink to="/blog/moving-from-tally-to-odoo">How migration works</TextLink>
            </Reveal>
          </div>
        </section>
      )}

      {story && (
        <section className="section section--grey" aria-labelledby="story-title">
          <div className={`container ${styles.storyRow}`}>
            <Reveal>
              <span className="eyebrow">Customer story</span>
              <h2 id="story-title" className="h2">
                What it looks like in practice.
              </h2>
              <p className="lead">Real businesses, real problems, and what changed.</p>
              <TextLink to="/customer-stories">All customer stories</TextLink>
            </Reveal>
            <Reveal delay={100}>
              <StoryCard story={story} />
            </Reveal>
          </div>
        </section>
      )}

      <section className="section" aria-labelledby="faq-title">
        <div className="container split">
          <Reveal>
            <span className="eyebrow">Questions</span>
            <h2 id="faq-title" className="h2">
              Short answers.
            </h2>
          </Reveal>
          <Reveal delay={80}>
            <Accordion items={svc.faqs} defaultOpen={0} />
          </Reveal>
        </div>
      </section>

      <section className="section section--tight section--grey" aria-labelledby="related-title">
        <div className="container">
          <h2 id="related-title" className="eyebrow">
            Related services
          </h2>
          <ul className={styles.related} role="list">
            {others.map((o) => (
              <li key={o.slug}>
                <Link to={`/services/${o.slug}`} className={styles.relatedLink}>
                  <span className={`num fx-nudge ${styles.itemNum}`}>{o.number}</span>
                  <span className={styles.relatedName}>{o.name}</span>
                  <ArrowRight size={18} />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
