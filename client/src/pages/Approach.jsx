import { stagger } from '../lib/motion';
import { useEffect, useState } from 'react';
import { useMeta } from '../lib/hooks';
import { phases } from '../content/approach';
import Reveal from '../components/ui/Reveal';
import PageHero from '../components/sections/PageHero';
import CtaBand from '../components/ui/CtaBand';
import { CheckupButton } from '../components/ui/Buttons';
import styles from './Approach.module.css';

/** Tracks which phase section is currently in the reading zone. */
function useActivePhase(ids) {
  const [active, setActive] = useState(ids[0]);
  useEffect(() => {
    const els = ids.map((id) => document.getElementById(id)).filter(Boolean);
    if (!('IntersectionObserver' in window) || !els.length) return undefined;
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: '-35% 0px -55% 0px' },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [ids]);
  return active;
}

const ids = phases.map((p) => `phase-${p.id}`);

export default function Approach() {
  useMeta(
    'Our Approach | Plan, Build, Launch & Support | O2One',
    'Nine steps in three phases: understand your business, build a system your team will use, then go live and never be left alone.',
  );
  const active = useActivePhase(ids);

  return (
    <>
      <PageHero
        eyebrow="Our approach"
        title="Plan. Build. Launch & Support."
        lead="One accountable partner, from the first conversation to long after go-live. Nine steps, three phases, no guesswork."
      />

      <section className="section">
        <div className={`container ${styles.layout}`}>
          <nav className={styles.rail} aria-label="Phases">
            <ol role="list">
              {phases.map((p) => (
                <li key={p.id}>
                  <a href={`#phase-${p.id}`} className={active === `phase-${p.id}` ? styles.railActive : undefined} aria-current={active === `phase-${p.id}` ? 'step' : undefined}>
                    <span className={styles.dot} aria-hidden="true" />
                    <span className="num">{p.number}</span> {p.name}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <div className={styles.phases}>
            {phases.map((p) => (
              <section key={p.id} id={`phase-${p.id}`} className={styles.phase} aria-labelledby={`phase-${p.id}-title`}>
                <Reveal className={styles.phaseHead}>
                  <span className="eyebrow">Phase {p.number}</span>
                  <h2 id={`phase-${p.id}-title`} className="phase-title">
                    {p.name}
                  </h2>
                  <p className="lead">{p.tagline}</p>
                </Reveal>
                <ol className={styles.timeline} role="list">
                  {p.steps.map((s, i) => (
                    <Reveal as="li" key={s.n} delay={stagger(i)} className={`${styles.step} ${s.ongoing ? styles.ongoing : ''}`}>
                      <span className={`num ${styles.node}`}>{s.n}</span>
                      <div className={`card-fx ${styles.card}`}>
                        <h3 className={styles.stepTitle}>{s.title}</h3>
                        <p>{s.text}</p>
                      </div>
                    </Reveal>
                  ))}
                </ol>
              </section>
            ))}

            <Reveal className={styles.start}>
              <p className="h3">Not sure where you stand today? Start with Phase 1.</p>
              <CheckupButton label="Book Your Free Business Health Checkup" />
            </Reveal>
          </div>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
