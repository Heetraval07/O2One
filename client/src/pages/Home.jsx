import SplitText from '../components/ui/SplitText';
import { Link } from 'react-router-dom';
import { useMeta } from '../lib/hooks';
import { site, CHECKUP_LABEL } from '../content/site';
import { trustStats, problems, values } from '../content/company';
import Reveal from '../components/ui/Reveal';
import PhotoSlot from '../components/ui/PhotoSlot';
import { TrustBar } from '../components/ui/Stats';
import { CheckupButton } from '../components/ui/Buttons';
import { ArrowRight } from '../components/ui/Icons';
import CtaBand from '../components/ui/CtaBand';
import { NumberedGrid, ValueGrid } from '../components/sections/Cards';
import ApproachTabs from '../components/sections/ApproachTabs';
import ServicesExplorer from '../components/sections/ServicesExplorer';
import FlowVisual from '../components/sections/FlowVisual';
import DarkBand from '../components/sections/DarkBand';
import HeroBackdrop from '../components/sections/HeroBackdrop';
import styles from './Home.module.css';

export default function Home() {
  useMeta(
    'O2One Consultants | Odoo Partner in Dubai, UAE',
    'We build systems that actually work for your business. Official Odoo partner in the UAE. Book a free Business Health Checkup.',
  );

  return (
    <>
      {/* Hero */}
      <section className={styles.hero}>
        <HeroBackdrop />
        <div className={`container ${styles.heroGrid}`}>
          <div className={styles.heroText}>
            <span className={`badge ${styles.rise}`}>{site.partnerLabel}</span>
            <SplitText text="We Build Systems That Actually Work for Your Business." className="h1" delay={120} />
            <p className={`lead ${styles.rise}`} style={{ '--d': '520ms' }}>
              One technology partner for your systems, from the first conversation to long after go-live.
            </p>
            <div className={`btn-row ${styles.rise}`} style={{ '--d': '680ms' }}>
              <CheckupButton />
            </div>
          </div>
          <div className={`${styles.heroMedia} ${styles.rise}`} style={{ '--d': '150ms' }}>
            <PhotoSlot label="team / founder at work" alt="The O2One team working with a client" ratio="5 / 4" accent="hero" priority />
          </div>
        </div>
      </section>

      <TrustBar stats={trustStats} />

      {/* Problems */}
      <section className="section section--grey" aria-labelledby="problems-title">
        <div className="container">
          <Reveal className="section-head section-head--center">
            <h2 id="problems-title" className="h2">
              Sound familiar?
            </h2>
          </Reveal>
          <NumberedGrid items={problems} />
        </div>
      </section>

      {/* Tally / Excel / WhatsApp */}
      <section className="section" aria-labelledby="chaos-title">
        <div className={`container ${styles.chaos}`}>
          <Reveal>
            <FlowVisual />
          </Reveal>
          <Reveal delay={100} className={styles.chaosText}>
            <h2 id="chaos-title" className="h2">
              Running your business on Tally, Excel, and WhatsApp?
            </h2>
            <p className="lead">
              You depend on your team to keep track of operations. They spend hours on screens, and you spend your days
              fixing problems instead of growing your business.
            </p>
            <blockquote className={styles.pull}>
              At O2One Consultants, we help you see the growth you&rsquo;re leaving behind.
            </blockquote>
          </Reveal>
        </div>
      </section>

      <DarkBand
        title="One Technology Partner. Complete Accountability."
        text="You focus on your business. We'll manage the software."
      >
        <p className={styles.bandLine}>See what your business is missing.</p>
        <CheckupButton label={CHECKUP_LABEL} arrow />
      </DarkBand>

      {/* Approach */}
      <section className="section" id="approach" aria-labelledby="approach-title">
        <div className="container">
          <Reveal className={styles.headRow}>
            <div>
              <span className="eyebrow">Our approach</span>
              <h2 id="approach-title" className="h2">
                One partner, from first conversation to long after go-live.
              </h2>
            </div>
          </Reveal>
          <Reveal>
            <ApproachTabs />
          </Reveal>
        </div>
      </section>

      {/* Services */}
      <section className="section section--grey" aria-labelledby="services-title">
        <div className="container">
          <Reveal className={styles.headRow}>
            <div>
              <span className="eyebrow">Services</span>
              <h2 id="services-title" className="h2">
                Everything your business systems need, from one partner.
              </h2>
            </div>
            <Link to="/services" className="btn btn--secondary btn--sm">
              All services <ArrowRight size={16} />
            </Link>
          </Reveal>
          <Reveal>
            <ServicesExplorer />
          </Reveal>
        </div>
      </section>

      <section className={`section section--grey ${styles.values}`} aria-labelledby="values-title">
        <div className="container">
          <Reveal className={`section-head ${styles.valuesHead}`}>
            <span className="eyebrow">Our values</span>
            <h2 id="values-title" className="h2">
              What we stand for
            </h2>
          </Reveal>
          <ValueGrid items={values} />
        </div>
      </section>

      <CtaBand />
    </>
  );
}
