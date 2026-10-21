import { Suspense, useEffect, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import { ChevronUp, Mail, Phone, WhatsApp } from '../ui/Icons';
import { Loading } from '../ui/States';
import CustomCursor from '../ui/CustomCursor';
import { site, telHref, vatTopBar } from '../../content/site';
import styles from './Layout.module.css';

const VAT_PATH = '/e-invoicing';

/** Scroll to the top on page change, or to the #anchor when there is one. */
function ScrollManager() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      const id = decodeURIComponent(hash.slice(1));
      // Wait a frame so the new page has rendered its anchors.
      const t = setTimeout(() => document.getElementById(id)?.scrollIntoView(), 60);
      return () => clearTimeout(t);
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    return undefined;
  }, [pathname, hash]);
  return null;
}

/** Appears once the page has been scrolled a little; returns to the top. */
function BackToTop() {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const onScroll = () => setShown(window.scrollY > 320);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  const toTop = () => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, left: 0, behavior: reduced ? 'auto' : 'smooth' });
  };
  return (
    <button type="button" className={styles.toTop} data-shown={shown} onClick={toTop} aria-label="Back to top" tabIndex={shown ? 0 : -1}>
      <ChevronUp size={22} />
    </button>
  );
}

/** Phones only: back-to-top above call, email and WhatsApp, stacked down the right edge (the single WhatsApp button covers larger screens). */
function ContactDock() {
  return (
    <div className={styles.dock}>
      <BackToTop />
      <nav className={styles.dockList} aria-label="Contact us">
        <a href={telHref} className={`${styles.dockBtn} ${styles.dockPhone}`} aria-label={`Call us on ${site.phone}`}>
          <Phone size={22} />
        </a>
        <a href={`mailto:${site.email}`} className={`${styles.dockBtn} ${styles.dockMail}`} aria-label={`Email ${site.email}`}>
          <Mail size={22} />
        </a>
        <a
          href={site.whatsappUrl}
          className={`${styles.dockBtn} ${styles.dockWa}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Chat with O2One on WhatsApp (opens WhatsApp)"
        >
          <WhatsApp size={24} />
        </a>
      </nav>
    </div>
  );
}

function TopBar() {
  return (
    <div className={styles.topBar}>
      <div className="container">
        <p>
          <span className={styles.long}>{vatTopBar.text}</span>
          <span className={styles.short}>{vatTopBar.shortText}</span>{' '}
          <Link to="#deadlines">{vatTopBar.link} →</Link>
        </p>
      </div>
    </div>
  );
}

export default function Layout() {
  const { pathname } = useLocation();
  const isVat = pathname === VAT_PATH;

  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <ScrollManager />
      <CustomCursor />
      {isVat && <TopBar />}
      <Header />
      <main id="main" tabIndex={-1} className={styles.main}>
        <div key={pathname} className={styles.page}>
          <Suspense fallback={<div className="container"><Loading /></div>}>
            <Outlet />
          </Suspense>
        </div>
      </main>
      <Footer note={isVat ? 'A plain-language guide, not tax advice. Check with the FTA or your adviser.' : null} />
      <a
        href={site.whatsappUrl}
        className={styles.waFloat}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with O2One on WhatsApp (opens WhatsApp)"
      >
        <WhatsApp size={30} />
      </a>
      <ContactDock />
    </>
  );
}
