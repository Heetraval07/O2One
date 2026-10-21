import { stagger } from '../lib/motion';
import { useState } from 'react';
import { useMeta } from '../lib/hooks';
import { vatTopBar } from '../content/site';
import {
  vatMeta, vatHero, vatChanges, vatDeadlines, vatCheck, vatWhatWeDo, vatHonesty, vatFaq, vatCta,
} from '../content/vat';
import Reveal from '../components/ui/Reveal';
import Accordion from '../components/ui/Accordion';
import CtaBand from '../components/ui/CtaBand';
import ServiceHeroArt from '../components/sections/ServiceHeroArt';
import { ArrowDown, ArrowRight, Check } from '../components/ui/Icons';
import styles from './VatEInvoicing.module.css';

export default function VatEInvoicing() {
  useMeta(vatMeta.title, vatMeta.description);
  const [ticked, setTicked] = useState([]);
  const toggle = (item) => setTicked((t) => (t.includes(item) ? t.filter((x) => x !== item) : [...t, item]));
  const bookingState = { source: 'vat_readiness', readinessItems: ticked };

  return (
    <>
      {/* 1. Hero */}
      <section className={styles.hero}>
        <div className={`container ${styles.heroGrid}`}>
          <Reveal className={styles.heroText}>
            <span className="eyebrow">{vatHero.label}</span>
            <h1 className="h1">{vatHero.title}</h1>
            <p className="lead">
              <span className={styles.wide}>{vatHero.body}</span>
              <span className={styles.narrow}>{vatHero.bodyShort}</span>
            </p>
            <div className={`btn-row ${styles.heroActions}`}>
              <a href="#cta" className="btn">
                {vatHero.button}
              </a>
              <a href="#check" className="text-link">
                {vatHero.link} <ArrowRight size={16} />
              </a>
            </div>
            <dl className={styles.stats}>
              {vatHero.stats.map((s) => (
                <div key={s.label}>
                  <dt>{s.label}</dt>
                  <dd className="num">{s.value}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
          <Reveal delay={160} className={styles.heroArt}>
            <ServiceHeroArt slug="e-invoicing" />
          </Reveal>
        </div>
      </section>

      {/* 2. What changes */}
      <section className="section section--grey" aria-labelledby="changes-title">
        <div className="container">
          <Reveal className="section-head">
            <span className="eyebrow">{vatChanges.label}</span>
            <h2 id="changes-title" className="h2">{vatChanges.title}</h2>
            <p className="lead">{vatChanges.body}</p>
          </Reveal>
          <ol className={styles.flow} role="list">
            {vatChanges.flow.map((f, i) => (
              <Reveal as="li" key={f.n} delay={i * 90} className={styles.flowItem}>
                <div className={`card-fx ${styles.flowBox}`}>
                  <span className={`num ${styles.flowNum}`}>{f.n}</span>
                  <span className={styles.flowText}>
                    <strong className={styles.flowTitle}>{f.title}</strong>
                    <span className="muted">{f.text}</span>
                  </span>
                </div>
                {i < vatChanges.flow.length - 1 && (
                  <span className={styles.flowArrow} aria-hidden="true">
                    <ArrowRight size={18} className={styles.arrowRight} />
                    <ArrowDown size={18} className={styles.arrowDown} />
                  </span>
                )}
              </Reveal>
            ))}
          </ol>
          <p className={styles.note}>{vatChanges.note}</p>
        </div>
      </section>

      {/* 3. Deadlines */}
      <section id="deadlines" className="section" aria-labelledby="deadlines-title">
        <div className="container">
          <Reveal className="section-head">
            <span className="eyebrow">{vatDeadlines.label}</span>
            <h2 id="deadlines-title" className="h2">{vatDeadlines.title}</h2>
            <p className="lead">{vatDeadlines.body}</p>
          </Reveal>
          <ol className={styles.deadlines} role="list">
            {vatDeadlines.rows.map((r, i) => {
              const hl = r.highlight && vatTopBar.highlightLargeBusiness;
              return (
                <Reveal as="li" key={r.who} delay={stagger(i)} className={`card-fx ${styles.deadline} ${hl ? styles.deadlineHl : ''}`}>
                  <span className={styles.timelineDot} aria-hidden="true" />
                  <span className={styles.who}>{r.who}</span>
                  <span className={styles.headline}>{r.headline}</span>
                  <dl className={styles.dates}>
                    {r.appoint && (
                      <div>
                        <dt>
                          <span className={styles.wide}>Appoint </span>ASP by
                        </dt>
                        <dd>{r.appoint}</dd>
                      </div>
                    )}
                    <div className={styles.wide}><dt>Go live</dt><dd>{r.live}</dd></div>
                  </dl>
                </Reveal>
              );
            })}
          </ol>
          <ul className={`tag-list ${styles.tags} ${styles.wide}`} role="list">
            {vatDeadlines.tags.map((t) => (
              <li key={t} className="badge">{t}</li>
            ))}
          </ul>
          <p className={`${styles.smallPrint} ${styles.wide}`}>{vatDeadlines.smallPrint}</p>
        </div>
      </section>

      {/* 4. Self-check */}
      <section id="check" className="section section--grey" aria-labelledby="check-title">
        <div className={`container ${styles.check}`}>
          <Reveal>
            <span className="eyebrow">{vatCheck.label}</span>
            <h2 id="check-title" className="h2">{vatCheck.title}</h2>
            <p className={`lead ${styles.wide}`}>{vatCheck.body}</p>
          </Reveal>
          <Reveal delay={80} className={`card-fx ${styles.checkCard}`}>
            <fieldset className={styles.fieldset}>
              <legend className="sr-only">{vatCheck.title}</legend>
              {vatCheck.items.map((item, i) => {
                const on = ticked.includes(item);
                return (
                  <label key={item} className={`${styles.checkRow} ${on ? styles.checkOn : ''}`}>
                    <input type="checkbox" checked={on} onChange={() => toggle(item)} />
                    <span className={styles.box} aria-hidden="true">
                      {on && <Check size={16} />}
                    </span>
                    <span>
                      <span className={styles.wide}>{item}</span>
                      <span className={styles.narrow}>{vatCheck.itemsShort[i]}</span>
                    </span>
                  </label>
                );
              })}
            </fieldset>
            <div className={styles.counterRow}>
              <p className={styles.counter} aria-live="polite">
                <span className="num">{ticked.length}</span> of {vatCheck.items.length} ready
              </p>
              <a href="#cta" className="btn">
                {vatCheck.button}
              </a>
            </div>
            <div className={styles.meter} aria-hidden="true">
              <span style={{ width: `${(ticked.length / vatCheck.items.length) * 100}%` }} />
            </div>
          </Reveal>
        </div>
      </section>

      {/* 5. What we do */}
      <section className="section" aria-labelledby="wwd-title">
        <div className="container">
          <Reveal className="section-head">
            <span className="eyebrow">{vatWhatWeDo.label}</span>
            <h2 id="wwd-title" className="h2">{vatWhatWeDo.title}</h2>
            <p className="lead">{vatWhatWeDo.body}</p>
          </Reveal>
          <ul className={styles.cards} role="list">
            {vatWhatWeDo.cards.map((c, i) => (
              <Reveal as="li" key={c.label} delay={stagger(i)} className={`card-fx ${c.dark ? 'card-fx--dark' : ''} ${styles.card} ${c.dark ? styles.cardDark : ''}`}>
                <span className="eyebrow">{c.label}</span>
                <h3 className="h3">{c.title}</h3>
                <p>{c.text}</p>
              </Reveal>
            ))}
          </ul>
          <ol className={`${styles.steps} ${styles.wide}`} role="list">
            {vatWhatWeDo.steps.map((s, i) => (
              <Reveal as="li" key={s.n} delay={stagger(i, 4)}>
                <span className={`num ${styles.stepNum}`}>{s.n}</span>
                <strong>{s.title}</strong>
                <span className="muted">{s.text}</span>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* 6. Honesty band */}
      <section className={styles.honesty}>
        <Reveal className="container">
          <h2 className="h2">{vatHonesty.title}</h2>
          <p>
            <span className={styles.wide}>{vatHonesty.body}</span>
            <span className={styles.narrow}>{vatHonesty.bodyShort}</span>
          </p>
        </Reveal>
      </section>

      {/* 7. FAQ */}
      <section className="section" aria-labelledby="vfaq-title">
        <div className={`container split ${styles.faq}`}>
          <Reveal>
            <span className="eyebrow">{vatFaq.label}</span>
            <h2 id="vfaq-title" className="h2">{vatFaq.title}</h2>
          </Reveal>
          <Reveal delay={80}>
            <div className={styles.faqAccordion}>
              <Accordion items={vatFaq.items} />
            </div>
          </Reveal>
        </div>
      </section>

      {/* 8. Closing CTA */}
      <div className={styles.cta}>
        <CtaBand
          id="cta"
          eyebrow={vatCta.label}
          title={vatCta.title}
          text={null}
          tags={vatCta.tags}
          buttonLabel={vatCta.button}
          buttonState={bookingState}
        />
      </div>
    </>
  );
}
