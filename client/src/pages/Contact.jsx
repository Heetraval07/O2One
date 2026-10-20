import { stagger } from '../lib/motion';
import { useLocation } from 'react-router-dom';
import { useMeta } from '../lib/hooks';
import { site, telHref } from '../content/site';
import { checkupBenefits } from '../content/company';
import Reveal from '../components/ui/Reveal';
import BookingForm from '../features/booking/BookingForm';
import { Chat, Check, Mail, Phone, Pin } from '../components/ui/Icons';
import styles from './Contact.module.css';

export default function Contact() {
  useMeta(
    'Contact & Free Business Health Checkup | O2One',
    'Two hours. One conversation. On us. Book a free Business Health Checkup with O2One in Dubai, Mumbai or online.',
  );
  const { state } = useLocation();
  const source = state?.source === 'vat_readiness' ? 'vat_readiness' : 'checkup';
  const readinessItems = Array.isArray(state?.readinessItems) ? state.readinessItems : [];

  return (
    <>
      <section className={styles.hero}>
        <div className={`container ${styles.grid}`}>
          <Reveal className={styles.intro}>
            <span className="eyebrow">{source === 'vat_readiness' ? 'Free readiness check' : 'Free Business Health Checkup'}</span>
            <h1 className="h1">Two hours. One conversation. On us.</h1>
            <p className="lead">Let us do a Health Checkup for your business.</p>
            <div>
              <h2 className={styles.subhead}>What you&rsquo;ll walk away with</h2>
              <ul className={styles.benefits} role="list">
                {checkupBenefits.map((b) => (
                  <li key={b}>
                    <Check size={18} /> {b}
                  </li>
                ))}
              </ul>
            </div>
            <p className={styles.terms}>No obligation · in person or online</p>
          </Reveal>
          <Reveal delay={100}>
            <BookingForm source={source} readinessItems={readinessItems} />
          </Reveal>
        </div>
      </section>

      <section className="section section--grey" aria-labelledby="reach-title">
        <div className="container">
          <h2 id="reach-title" className="h2" style={{ marginBottom: 'var(--s5)' }}>
            Other ways to reach us
          </h2>
          <ul className={styles.cards} role="list">
            {site.offices.map((o, i) => (
              <Reveal as="li" key={o.city} delay={stagger(i)} className={`card-fx ${styles.card}`}>
                <Pin size={22} className="fx-icon" />
                <h3 className="h3">
                  {o.city}, {o.country}
                </h3>
                <p className="muted">{o.address}</p>
              </Reveal>
            ))}
            <Reveal as="li" delay={stagger(site.offices.length)} className={`card-fx ${styles.card}`}>
              <Chat size={22} className="fx-icon" />
              <h3 className="h3">WhatsApp · email · phone</h3>
              <ul className={styles.channels} role="list">
                <li>
                  <Mail size={16} /> <a href={`mailto:${site.email}`}>{site.email}</a>
                </li>
                <li>
                  <Phone size={16} /> <a href={telHref}>{site.phone}</a>
                </li>
              </ul>
            </Reveal>
          </ul>
        </div>
      </section>
    </>
  );
}
