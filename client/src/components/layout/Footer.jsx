import { Link } from 'react-router-dom';
import Logo from '../ui/Logo';
import { site, telHref } from '../../content/site';
import { services } from '../../content/services';
import styles from './Footer.module.css';

export default function Footer({ note }) {
  const year = new Date().getFullYear();
  return (
    <footer className={styles.footer}>
      {note && (
        <div className={styles.note}>
          <div className="container">
            <p>{note}</p>
          </div>
        </div>
      )}
      <div className={`container ${styles.grid}`}>
        <div className={styles.brand}>
          <Logo onInk />
          <p>{site.tagline}</p>
          <p className={styles.offices}>Dubai, UAE</p>
        </div>

        <nav aria-labelledby="f-company">
          <h2 id="f-company" className={styles.label}>
            Company
          </h2>
          <ul role="list">
            <li><Link to="/about">About</Link></li>
            <li><Link to="/#approach">Our approach</Link></li>
            <li><Link to="/services">Services</Link></li>
            <li><Link to="/industries">Industries</Link></li>
            <li><Link to="/e-invoicing">UAE VAT &amp; E-invoicing</Link></li>
          </ul>
        </nav>

        <nav aria-labelledby="f-resources">
          <h2 id="f-resources" className={styles.label}>
            Resources
          </h2>
          <ul role="list">
            <li><Link to="/customer-stories">Customer stories</Link></li>
            <li><Link to="/blog">Blog</Link></li>
            {services.map((s) => (
              <li key={s.slug} className={styles.minor}>
                <Link to={`/services/${s.slug}`}>{s.name}</Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h2 className={styles.label}>Contact</h2>
          <ul role="list" className={styles.contact}>
            <li>Dubai, UAE</li>
            <li><a href={`mailto:${site.email}`}>{site.email}</a></li>
            <li><a href={telHref}>{site.phone}</a></li>
            <li><Link to="/contact">Book a free health checkup</Link></li>
          </ul>
        </div>
      </div>

      <div className={styles.bottom}>
        <div className="container">
          <p>© {year} O2One Consultants. All rights reserved.</p>
          <p>{site.partnerLabel}</p>
        </div>
      </div>
    </footer>
  );
}
