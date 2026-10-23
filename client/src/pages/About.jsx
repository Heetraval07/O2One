import { useMeta } from '../lib/hooks';
import { site, telHref } from '../content/site';
import { originStory, originQuote, values, teamStats } from '../content/company';
import { phases } from '../content/approach';
import Reveal from '../components/ui/Reveal';
import PhotoSlot from '../components/ui/PhotoSlot';
import { StatPanel } from '../components/ui/Stats';
import { TextLink } from '../components/ui/Buttons';
import { ArrowRight, Mail, Phone, Pin } from '../components/ui/Icons';
import CtaBand from '../components/ui/CtaBand';
import { ValueGrid } from '../components/sections/Cards';
import styles from './About.module.css';

export default function About() {
  const office = site.offices[0]; // Dubai, UAE
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(office.address)}`;
  useMeta(
    'About O2One | Odoo Partner in Dubai, UAE',
    'O2One is a digital transformation company in Dubai, serving the GCC and MENA. Built by people who watched the problem up close.',
  );

  return (
    <>
      <section className="section">
        <div className="container">
          <Reveal>
            <h1 className={`h2 ${styles.whoTitle}`}>One Technology Partner. Complete Accountability.</h1>
          </Reveal>
        </div>
      </section>

      <section className="section section--grey" aria-labelledby="story-title">
        <div className={`container ${styles.story}`}>
          <Reveal variant="left" className={styles.storyPhoto}>
            <PhotoSlot
              src="/about/founder-shop.jpeg"
              position="50% 50%"
              label="founder + father's shop (archival)"
              alt="The founder's father's shop in Sudan"
              ratio="4 / 5"
              accent="about"
            />
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
        <div className="container">
          <Reveal className={styles.teamHead}>
            <div>
              <span className="eyebrow">Our team</span>
              <h2 id="team-title" className="h2">
                Led by the founder. Delivered by certified experts.
              </h2>
            </div>
            <p className="lead">
              A network of 10+ consultants and developers, including Odoo-certified experts, working together as one team.
            </p>
          </Reveal>
          <Reveal delay={100} className={styles.teamStats}>
            <StatPanel stats={teamStats}>
              <span className="badge badge--line">{site.partnerLabel}</span>
            </StatPanel>
          </Reveal>

          <Reveal as="section" delay={150} className={`edge-hover ${styles.location}`} aria-labelledby="location-title">
            <div className={styles.locationMain}>
              <span className="eyebrow">Our location</span>
              <h3 id="location-title" className="h2">
                {office.city}, {office.country}
              </h3>
              <p className={styles.address}>
                <Pin size={18} /> {office.address}
              </p>
              <a href={mapsUrl} className="text-link" target="_blank" rel="noopener noreferrer">
                Open in Google Maps <ArrowRight size={16} />
              </a>
            </div>
            <dl className={styles.contact}>
              <div>
                <dt>
                  <Phone size={16} /> Call us
                </dt>
                <dd>
                  <a href={telHref}>{site.phone}</a>
                </dd>
              </div>
              <div>
                <dt>
                  <Mail size={16} /> Email us
                </dt>
                <dd>
                  <a href={`mailto:${site.email}`}>{site.email}</a>
                </dd>
              </div>
            </dl>
          </Reveal>
        </div>
      </section>

      <section className="section" aria-labelledby="how-title">
        <div className={`container ${styles.how}`}>
          <Reveal>
            <span className="eyebrow">Our approach</span>
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
            <TextLink to="/#approach">See our approach</TextLink>
          </Reveal>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
