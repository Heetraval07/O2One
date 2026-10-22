import { useState } from 'react';
import { stagger } from '../lib/motion';
import { Link, useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { useApi, useMeta } from '../lib/hooks';
import { services, serviceBySlug } from '../content/services';
import { solutionDetails, solutionImages, solutionOrder } from '../content/solutionDetails';
import { site } from '../content/site';
import Reveal from '../components/ui/Reveal';
import PageHero from '../components/sections/PageHero';
import ServiceVisual from '../components/sections/ServiceVisual';
import HeroReportCard from '../components/sections/HeroReportCard';
import ServiceHeroArt, { hasServiceHeroArt } from '../components/sections/ServiceHeroArt';
import { StoryCard } from '../components/sections/Cards';
import CtaBand from '../components/ui/CtaBand';
import { CheckupButton, TextLink } from '../components/ui/Buttons';
import { ArrowRight } from '../components/ui/Icons';
import { DetailCard, DetailGrid } from '../components/ui/DetailCard';
import ConsultationCards from '../components/sections/ConsultationCards';
import DetailDrawer, { DrawerBlock, DrawerCta, DrawerList, DrawerTags } from '../components/sections/DetailDrawer';
import NotFound from './NotFound';
import styles from './ServiceDetail.module.css';

// Supplied hero pictures (transparent PNGs in /public/services) that replace the drawn hero on these detail pages.
const HERO_IMAGES = {
  'odoo-services': '/services/02-odoo-services-hero-removebg-preview.png',
  'custom-industry-solutions': '/services/03-custom-industry-solutions-hero-removebg-preview.png',
  'ai-automation': '/services/04-ai-automation-hero-removebg-preview.png',
};

export default function ServiceDetail() {
  const { slug } = useParams();
  const svc = serviceBySlug[slug];
  const index = services.findIndex((s) => s.slug === slug);
  useMeta(svc ? `${svc.name} | O2One Consultants` : 'Page not found | O2One', svc?.tagline);
  const { data: stories } = useApi(svc ? `stories:service:${slug}` : null, (signal) =>
    api.stories({ service: slug }, { signal }),
  );

  const [openSolution, setOpenSolution] = useState(null);

  if (!svc) return <NotFound />;

  const items = svc.useSolutions ? solutionOrder.map((name) => ({ name })) : svc.items;
  // Four items sit best as 2 x 2; a 3 + 1 grid leaves a lone card on the second row.
  const colCount = svc.useSolutions ? 4 : items.length === 4 ? 2 : 3;
  const cols = `cols-${colCount}`;
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
            {svc.slug === 'business-consultation' ? (
              <HeroReportCard />
            ) : HERO_IMAGES[svc.slug] ? (
              <img
                src={HERO_IMAGES[svc.slug]}
                alt=""
                className={styles.heroImage}
                width="577"
                height="433"
                decoding="async"
              />
            ) : hasServiceHeroArt(svc.slug) ? (
              <ServiceHeroArt slug={svc.slug} />
            ) : (
              <ServiceVisual service={svc} variant={index} />
            )}
            {svc.partnerBadge && <span className="badge">{site.partnerLabel}</span>}
          </div>
        }
      >
        <CheckupButton label="Book free checkup" />
      </PageHero>

      <section className={`section ${svc.slug === 'business-consultation' ? 'section--grey' : ''}`} aria-labelledby="included-title">
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

          {svc.useSolutions ? (
            <DetailGrid>
              {items.map((it, i) =>
                solutionDetails[it.name] ? (
                  <DetailCard
                    key={it.name}
                    index={i}
                    columns={3}
                    image={solutionImages[it.name]}
                    iconZoom="185%"
                    title={it.name}
                    text={solutionDetails[it.name].description}
                    onOpen={() => setOpenSolution({ ...it, num: String(i + 1).padStart(2, '0') })}
                  />
                ) : null,
              )}
            </DetailGrid>
          ) : items.every((it) => it.image) ? (
            <ConsultationCards items={items} />
          ) : (
            <ul className={`line-grid ${cols} ${styles.items} `} role="list">
              {items.map((it, i) => {
                const num = String(i + 1).padStart(2, '0');
                return (
                  <Reveal as="li" key={it.name} delay={stagger(i, colCount)} className={`card-fx ${styles.item}`}>
                    <span className={`num fx-nudge ${styles.itemNum}`}>{num}</span>
                    <h3 className={styles.itemTitle}>{it.name}</h3>
                    {it.text && <p className="muted">{it.text}</p>}
                    {it.to && (
                      <TextLink to={it.to} className={styles.itemLink}>
                        See the page
                      </TextLink>
                    )}
                  </Reveal>
                );
              })}
            </ul>
          )}

          {svc.useSolutions && (
            <p className={styles.note}>
              <TextLink to="/industries">See the industries we serve</TextLink>
            </p>
          )}
        </div>
      </section>

      {svc.deliverables && (
        <section className="section" aria-labelledby="deliverables-title">
          <div className={`container ${styles.getGrid}`}>
            <Reveal>
              <span className="eyebrow">Deliverables</span>
              <h2 id="deliverables-title" className="h2">
                What You Get
              </h2>
            </Reveal>
            <Reveal delay={100}>
              <ol className={styles.deliverables} role="list">
                {svc.deliverables.map((d, i) => (
                  <li key={d}>
                    <span className={`num ${styles.deliverNum}`}>{String(i + 1).padStart(2, '0')}</span>
                    <span className={styles.deliverText}>{d}</span>
                  </li>
                ))}
              </ol>
            </Reveal>
          </div>
        </section>
      )}

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

      <DetailDrawer
        open={Boolean(openSolution)}
        onClose={() => setOpenSolution(null)}
        eyebrow={openSolution ? `${openSolution.num} · ${openSolution.name}` : ''}
        title={openSolution && solutionDetails[openSolution.name].headline}
        lede={openSolution && solutionDetails[openSolution.name].description}
      >
        {openSolution && (
          <>
            <DrawerBlock title="Sound familiar?">
              <DrawerList items={solutionDetails[openSolution.name].challenges} />
            </DrawerBlock>
            <DrawerBlock title="You will have">
              <DrawerTags items={solutionDetails[openSolution.name].features} />
            </DrawerBlock>
            <DrawerCta>
              <p>See what your business is missing.</p>
              <CheckupButton className="btn--block" />
            </DrawerCta>
          </>
        )}
      </DetailDrawer>
    </>
  );
}
