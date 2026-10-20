import { stagger } from '../lib/motion';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMeta } from '../lib/hooks';
import { industries, solutions, solutionShort } from '../content/industries';
import Reveal from '../components/ui/Reveal';
import PageHero from '../components/sections/PageHero';
import CtaBand from '../components/ui/CtaBand';
import { CheckupButton } from '../components/ui/Buttons';
import { ArrowRight, Close, Plus } from '../components/ui/Icons';
import styles from './Industries.module.css';

/** Side drawer built on <dialog>, so focus trapping and Escape come for free. */
function IndustryDrawer({ industry, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    const d = ref.current;
    if (industry && d && !d.open) d.showModal();
    if (!industry && d?.open) d.close();
  }, [industry]);

  return (
    <dialog
      ref={ref}
      className={styles.drawer}
      aria-labelledby="industry-title"
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
    >
      {industry && (
        <div className={styles.drawerInner}>
          <button type="button" className={styles.close} onClick={onClose} aria-label="Close">
            <Close size={22} />
          </button>
          <span className="eyebrow">Industry</span>
          <h2 id="industry-title" className="phase-title">
            {industry.name}
          </h2>
          <p className="lead">{industry.text}</p>

          {industry.solutions.length > 0 && (
            <div className={styles.block}>
              <h3 className={styles.blockTitle}>Ready-made solutions</h3>
              <ul className="tag-list" role="list">
                {industry.solutions.map((s) => (
                  <li key={s} className="badge">
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className={styles.block}>
            <h3 className={styles.blockTitle}>Typical services</h3>
            <ul className={styles.links} role="list">
              <li><Link to="/services/odoo-services" onClick={onClose}>Odoo implementation <ArrowRight size={16} /></Link></li>
              <li><Link to="/services/business-consultation" onClick={onClose}>Business consultation <ArrowRight size={16} /></Link></li>
              <li><Link to="/services/ai-automation" onClick={onClose}>Workflow automation <ArrowRight size={16} /></Link></li>
            </ul>
          </div>

          <div className={styles.drawerCta}>
            <p>See what your business is missing.</p>
            <CheckupButton className="btn--block" />
          </div>
        </div>
      )}
    </dialog>
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
        lead="Twelve industries we know well, and ready-made solutions for the businesses that need something more specific."
      />

      <section className="section" aria-label="Industries">
        <div className="container">
          <ul className={styles.grid} role="list">
            {industries.map((ind, i) => (
              <Reveal as="li" key={ind.name} delay={stagger(i, 4)}>
                <button type="button" className={`card-fx ${styles.card}`} onClick={() => setOpen(ind)} aria-haspopup="dialog">
                  <span className={`fx-zoom ${styles.photo}`} aria-hidden="true">
                    <span>Photo · {ind.name}</span>
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
                <li key={s}>{solutionShort(s)}</li>
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
