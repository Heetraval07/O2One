import { useLocation } from 'react-router-dom';
import { useMeta } from '../lib/hooks';
import { site, telHref } from '../content/site';
import { checkupBenefits } from '../content/company';
import Reveal from '../components/ui/Reveal';
import BookingForm from '../features/booking/BookingForm';
import { ArrowRight, Chat, Check, Mail, Phone, Pin, WhatsApp } from '../components/ui/Icons';
import styles from './Contact.module.css';

export default function Contact() {
  useMeta(
    'Contact & Free Business Health Checkup | O2One',
    'Two hours. One conversation. On us. Book a free Business Health Checkup with O2One in Dubai or online.',
  );
  const { state } = useLocation();
  const source = state?.source === 'vat_readiness' ? 'vat_readiness' : 'checkup';
  const readinessItems = Array.isArray(state?.readinessItems) ? state.readinessItems : [];
  const office = site.offices[0]; // Dubai, UAE: the only office shown
  const mapQuery = encodeURIComponent(office.address);

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
            <Reveal as="li" className={`edge-hover ${styles.mapCard}`}>
              <div className={styles.map}>
                <iframe
                  title={`Map showing the O2One office in ${office.city}, ${office.country}`}
                  src={`https://www.google.com/maps?q=${mapQuery}&output=embed`}
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
              <div className={styles.mapCaption}>
                <div>
                  <h3 className="h3">
                    {office.city}, {office.country}
                  </h3>
                  <p className={styles.address}>
                    <Pin size={18} /> {office.address}
                  </p>
                </div>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`}
                  className="text-link"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open in Google Maps <ArrowRight size={16} />
                </a>
              </div>
            </Reveal>
            <Reveal as="li" delay={100} className={`card-fx ${styles.reach}`}>
              <div className={styles.reachHead}>
                <Chat size={22} className="fx-icon" />
                <h3 className="h3">WhatsApp · email · phone</h3>
                <p className="muted">Talk to us directly. We reply fast.</p>
              </div>
              <ul className={styles.reachList} role="list">
                <li>
                  <a href={site.whatsappUrl} target="_blank" rel="noopener noreferrer">
                    <WhatsApp size={20} />
                    <span>
                      <small>WhatsApp</small>
                      <strong>Chat with us</strong>
                    </span>
                    <ArrowRight size={16} />
                  </a>
                </li>
                <li>
                  <a href={`mailto:${site.email}`}>
                    <Mail size={20} />
                    <span>
                      <small>Email</small>
                      <strong>{site.email}</strong>
                    </span>
                    <ArrowRight size={16} />
                  </a>
                </li>
                <li>
                  <a href={telHref}>
                    <Phone size={20} />
                    <span>
                      <small>Phone</small>
                      <strong>{site.phone}</strong>
                    </span>
                    <ArrowRight size={16} />
                  </a>
                </li>
              </ul>
            </Reveal>
          </ul>
        </div>
      </section>
    </>
  );
}
