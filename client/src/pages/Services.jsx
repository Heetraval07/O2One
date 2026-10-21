import { stagger } from '../lib/motion';
import { Link } from 'react-router-dom';
import { useMeta } from '../lib/hooks';
import { services, servicesIntro } from '../content/services';
import { solutions, solutionShort } from '../content/industries';
import { phases } from '../content/approach';
import Reveal from '../components/ui/Reveal';
import PageHero from '../components/sections/PageHero';
import ServiceVisual from '../components/sections/ServiceVisual';
import HeroReportCard from '../components/sections/HeroReportCard';
import ServiceHeroArt, { hasServiceHeroArt } from '../components/sections/ServiceHeroArt';
import CtaBand from '../components/ui/CtaBand';
import { ArrowRight } from '../components/ui/Icons';
import styles from './Services.module.css';

const chips = (s) => (s.useSolutions ? solutions.slice(0, 6).map(solutionShort) : s.items.map((i) => i.name));

export default function Services() {
  useMeta(
    'Services | Business Consultation, Odoo, Custom Solutions, AI | O2One',
    'Business consultation, Odoo implementation and support, custom industry solutions, and practical AI and automation, from one accountable partner.',
  );

  return (
    <>
      <PageHero crumbs={[{ label: 'Home', to: '/' }, { label: 'Services' }]} eyebrow="Services" title={servicesIntro} />

      <section className="section">
        <div className={`container ${styles.rows}`}>
          {services.map((s, i) => (
            <article key={s.slug} className={`${styles.row} ${i % 2 ? styles.flip : ''}`} aria-labelledby={`svc-${s.slug}`}>
              <Reveal className={styles.media}>
                {s.slug === 'business-consultation' ? (
                  <HeroReportCard />
                ) : hasServiceHeroArt(s.slug) ? (
                  <ServiceHeroArt slug={s.slug} />
                ) : (
                  <ServiceVisual service={s} variant={i} />
                )}
              </Reveal>
              <Reveal delay={80} className={styles.text}>
                <span className={`num ${styles.num}`}>{s.number}</span>
                <h2 id={`svc-${s.slug}`} className="phase-title">
                  {s.name}
                </h2>
                <p className={styles.tagline}>{s.tagline}</p>
                <p className="muted">{s.description}</p>
                <ul className="tag-list" role="list">
                  {chips(s).map((c) => (
                    <li key={c} className="badge">
                      {c}
                    </li>
                  ))}
                  {s.useSolutions && <li className="badge badge--line">+{solutions.length - 6} more</li>}
                </ul>
                <Link to={`/services/${s.slug}`} className="btn">
                  Explore {s.name} <ArrowRight size={18} />
                </Link>
              </Reveal>
            </article>
          ))}
        </div>
      </section>

      <section className="section section--grey" aria-labelledby="deliver-title">
        <div className="container">
          <Reveal className={styles.deliverHead}>
            <div>
              <span className="eyebrow">How we deliver</span>
              <h2 id="deliver-title" className="h2">
                Every service follows the same three phases.
              </h2>
            </div>
            <Link to="/#approach" className="btn btn--secondary btn--sm">
              Our approach <ArrowRight size={16} />
            </Link>
          </Reveal>
          <ol className={`line-grid cols-3 ${styles.phases}`} role="list">
            {phases.map((p, i) => (
              <Reveal as="li" key={p.id} delay={stagger(i)} className={`card-fx ${styles.phase}`}>
                <span className={`num fx-nudge ${styles.phaseNum}`}>{p.number}</span>
                <h3 className="h3">{p.name}</h3>
                <p className="muted">{p.tagline}</p>
                <p className={styles.steps}>{p.steps.map((st) => st.title).join(' · ')}</p>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
