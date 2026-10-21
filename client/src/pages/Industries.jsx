import { stagger } from '../lib/motion';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMeta } from '../lib/hooks';
import { industries, industryImages, solutions, solutionShort } from '../content/industries';
import Reveal from '../components/ui/Reveal';
import PageHero from '../components/sections/PageHero';
import CtaBand from '../components/ui/CtaBand';
import { CheckupButton } from '../components/ui/Buttons';
import { ArrowRight, Plus } from '../components/ui/Icons';
import DetailDrawer, { DrawerBlock, DrawerCta, DrawerLinks, DrawerList, DrawerText } from '../components/sections/DetailDrawer';
import styles from './Industries.module.css';

// Only the first six industries are shown; the rest stay in the content file but are not listed here.
const SHOWN = 6;

function IndustryDrawer({ industry, onClose }) {
  return (
    <DetailDrawer open={Boolean(industry)} onClose={onClose} eyebrow="Industry" title={industry?.name}>
      {industry && (
        <>
          <DrawerBlock title="Industry description">
            <DrawerText>{industry.text}</DrawerText>
          </DrawerBlock>

          {industry.challenges?.length > 0 && (
            <DrawerBlock title="Common challenges">
              <DrawerList items={industry.challenges} />
            </DrawerBlock>
          )}

          {industry.solutions.length > 0 && (
            <DrawerBlock title="Ready-made solutions">
              <ul className="tag-list" role="list">
                {industry.solutions.map((s) => (
                  <li key={s} className="badge">
                    {s}
                  </li>
                ))}
              </ul>
            </DrawerBlock>
          )}

          <DrawerBlock title="Typical services">
            <DrawerLinks>
              <li><Link to="/services/odoo-services" onClick={onClose}>Odoo implementation <ArrowRight size={16} /></Link></li>
              <li><Link to="/services/business-consultation" onClick={onClose}>Business consultation <ArrowRight size={16} /></Link></li>
              <li><Link to="/services/ai-automation" onClick={onClose}>Workflow automation <ArrowRight size={16} /></Link></li>
            </DrawerLinks>
          </DrawerBlock>

          <DrawerCta>
            <p>See what your business is missing.</p>
            <CheckupButton className="btn--block" />
          </DrawerCta>
        </>
      )}
    </DetailDrawer>
  );
}

export default function Industries() {
  useMeta(
    'Industries We Serve | O2One Consultants',
    'Odoo and custom systems for trading, manufacturing, retail, real estate, hospitality and more, plus ready-made industry solutions.',
  );
  const [open, setOpen] = useState(null);

  return (
    <>
      <PageHero
        crumbs={[{ label: 'Home', to: '/' }, { label: 'Industries' }]}
        eyebrow="Industries"
        title="Built for how your industry actually works."
        lead="Six industries we know well, and ready-made solutions for the businesses that need something more specific."
      />

      <section className="section" aria-label="Industries">
        <div className="container">
          <ul className={styles.grid} role="list">
            {industries.slice(0, SHOWN).map((ind, i) => (
              <Reveal as="li" key={ind.name} delay={stagger(i, 4)}>
                <button type="button" className={`card-fx ${styles.card}`} onClick={() => setOpen(ind)} aria-haspopup="dialog">
                  <span className={`fx-zoom ${styles.photo}`} aria-hidden="true">
                    <img src={industryImages[ind.name]} alt="" width="640" height="400" loading="lazy" decoding="async" />
                  </span>
                  <span className={styles.body}>
                    <span className={styles.name}>{ind.name}</span>
                    <span className={styles.short}>{ind.short}</span>
                    <span className={styles.more}>
                      Details <Plus size={16} />
                    </span>
                  </span>
                </button>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      <section id="solutions" className="section section--grey" aria-labelledby="solutions-title">
        <div className={`container ${styles.solutions}`}>
          <Reveal>
            <span className="eyebrow">Part of Custom Industry Solutions</span>
            <h2 id="solutions-title" className="h2">
              Ready-made industry solutions
            </h2>
            <p className="lead">When off-the-shelf doesn&rsquo;t fit, we build. These are solutions we already have ready to shape around you.</p>
            <Link to="/services/custom-industry-solutions" className="text-link">
              Custom Industry Solutions <ArrowRight size={16} />
            </Link>
          </Reveal>
          <Reveal delay={100}>
            <ul className={styles.chips} role="list">
              {solutions.map((s) => (
                <li key={s}>
                  <Link to="/custom-industry-solutions">{solutionShort(s)}</Link>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      <CtaBand />
      <IndustryDrawer industry={open} onClose={() => setOpen(null)} />
    </>
  );
}
