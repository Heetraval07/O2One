import { stagger } from '../lib/motion';
import { useMeta } from '../lib/hooks';
import { site } from '../content/site';
import { aboutIntro, originStory, originQuote, values, teamStats } from '../content/company';
import { phases } from '../content/approach';
import Reveal from '../components/ui/Reveal';
import PhotoSlot from '../components/ui/PhotoSlot';
import { StatRow } from '../components/ui/Stats';
import { TextLink } from '../components/ui/Buttons';
import { Pin } from '../components/ui/Icons';
import CtaBand from '../components/ui/CtaBand';
import { ValueGrid } from '../components/sections/Cards';
import styles from './About.module.css';

export default function About() {
  useMeta(
    'About O2One | Odoo Partner in Dubai & Mumbai',
    'O2One is a digital transformation company in Dubai and Mumbai, serving the GCC and MENA. Built by people who watched the problem up close.',
  );

  return (
    <>
      <section className={styles.hero}>
        <div className="container">
          <Reveal className={styles.heroText}>
            <span className="eyebrow">About O2One</span>
            <h1 className="h1">Built by people who watched the problem up close.</h1>
            <ul className={styles.facts} role="list">
              <li>Dubai</li>
              <li>Mumbai</li>
              <li>GCC &amp; MENA</li>
              <li>Official Odoo partner</li>
            </ul>
          </Reveal>
          <Reveal delay={120} className={styles.heroPhoto}>
            <PhotoSlot label="the O2One team" alt="The O2One team" ratio="21 / 9" priority />
          </Reveal>
        </div>
      </section>

      <section className="section">
        <div className="container split">
          <Reveal>
            <span className="eyebrow">Who we are</span>
            <h2 className="h2">One technology partner. Complete accountability.</h2>
          </Reveal>
          <Reveal delay={100}>
            <p className="lead">{aboutIntro}</p>
          </Reveal>
        </div>
      </section>

      <section className="section section--grey" aria-labelledby="story-title">
        <div className={`container ${styles.story}`}>
          <Reveal variant="left" className={styles.storyPhoto}>
            <PhotoSlot label="founder + father's shop (archival)" alt="The founder's father's shop in Sudan" ratio="4 / 5" accent="about" />
          </Reveal>
          <Reveal variant="right" delay={100} className={styles.storyText}>
            <span className="eyebrow">Where it all started</span>
            <h2 id="story-title" className="h2">
              A wholesale shop, a retail store, a factory — all run by hand.
            </h2>
            {originStory.map((p) => (
              <p key={p.slice(0, 24)} className={styles.para}>
                {p}
              </p>
            ))}
            <blockquote className={styles.quote}>{originQuote}</blockquote>
          </Reveal>
        </div>
      </section>

      <section className="section" aria-labelledby="values-title">
        <div className="container">
          <Reveal className="section-head">
            <span className="eyebrow">Our values</span>
            <h2 id="values-title" className="h2">
              What we stand for
            </h2>
          </Reveal>
          <ValueGrid items={values} />
        </div>
      </section>

      <section className="section section--grey" aria-labelledby="team-title">
        <div className={`container ${styles.team}`}>
          <Reveal>
            <span className="eyebrow">Our team</span>
            <h2 id="team-title" className="h2">
              Led by the founder. Delivered by certified experts.
            </h2>
            <p className="lead">
              A network of 20+ consultants and developers, including Odoo-certified experts, working from two offices.
            </p>
          </Reveal>
          <Reveal delay={100} className={styles.teamRight}>
            <StatRow stats={teamStats} />
            <span className="badge badge--line">{site.partnerLabel}</span>
          </Reveal>
        </div>

        <div className={`container ${styles.offices}`}>
          {site.offices.map((o, i) => (
            <Reveal key={o.city} delay={stagger(i, 2)} className={`card-fx ${styles.office}`}>
              <PhotoSlot label={`${o.city} office`} alt={`O2One office in ${o.city}`} ratio="16 / 9" />
              <div className={styles.officeBody}>
                <h3 className="h3">
                  {o.city}, {o.country}
                </h3>
                <p className={styles.address}>
                  <Pin size={18} /> {o.address}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="section" aria-labelledby="how-title">
        <div className={`container ${styles.how}`}>
          <Reveal>
            <span className="eyebrow">How we work</span>
            <h2 id="how-title" className="h2">
              Plan → Build → Launch.
            </h2>
            <p className="lead">9 steps, one accountable partner.</p>
          </Reveal>
          <Reveal delay={100} className={styles.phaseList}>
            <ol role="list">
              {phases.map((p) => (
                <li key={p.id}>
                  <span className="num">{p.number}</span>
                  <div>
                    <strong>{p.name}</strong>
                    <span className="muted">{p.tagline}</span>
                  </div>
                </li>
              ))}
            </ol>
            <TextLink to="/our-approach">See our approach</TextLink>
          </Reveal>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
