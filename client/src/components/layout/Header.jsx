import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import Logo from '../ui/Logo';
import { ArrowRight, ChevronDown, ChevronLeft, ChevronRight, Close, Menu, Minus, Plus } from '../ui/Icons';
import { CheckupButton } from '../ui/Buttons';
import { CHECKUP_SHORT, nav, site } from '../../content/site';
import { services } from '../../content/services';
import { solutions, solutionShort } from '../../content/industries';
import { useScrollLock, useScrollProgress } from '../../lib/hooks';
import styles from './Header.module.css';

const subItems = (s) => (s.useSolutions ? solutions.map((n) => ({ name: solutionShort(n) })) : s.items);

/* ---------------------------------------------------------------- Desktop mega-menu (two panes) */
function ServicesMega({ onNavigate }) {
  const [active, setActive] = useState(services[1].slug); // Odoo Services first, as in the wireframe
  const svc = services.find((s) => s.slug === active);
  const items = subItems(svc);
  return (
    <div className={styles.mega}>
      <div className={`container ${styles.megaInner}`}>
        <ul className={styles.megaList} role="list">
          {services.map((s) => (
            <li key={s.slug}>
              <Link
                to={`/services/${s.slug}`}
                className={`${styles.megaItem} ${s.slug === active ? styles.megaItemActive : ''}`}
                onMouseEnter={() => setActive(s.slug)}
                onFocus={() => setActive(s.slug)}
                onClick={onNavigate}
              >
                <span className={`num ${styles.megaNum}`}>{s.number}</span>
                <span>{s.name}</span>
                <ChevronRight size={16} />
              </Link>
            </li>
          ))}
          <li className={styles.megaAll}>
            <Link to="/services" className="text-link" onClick={onNavigate}>
              All services <ArrowRight size={16} />
            </Link>
          </li>
        </ul>

        <div className={styles.megaPanel} key={svc.slug}>
          <p className={styles.megaTitle}>{svc.name}</p>
          <p className="muted">{svc.tagline}</p>
          <ul className={styles.megaSubs} role="list">
            {items.slice(0, svc.useSolutions ? 9 : 8).map((it) => (
              <li key={it.name}>
                <Link to={it.to || `/services/${svc.slug}`} onClick={onNavigate}>
                  {it.name}
                </Link>
              </li>
            ))}
            {svc.useSolutions && (
              <li>
                <Link to="/industries#solutions" onClick={onNavigate}>
                  +{items.length - 9} more
                </Link>
              </li>
            )}
          </ul>
        </div>

        <div className={styles.megaAside}>
          {svc.partnerBadge ? (
            <span className="badge">{site.partnerLabel}</span>
          ) : (
            <span className="eyebrow">Service {svc.number}</span>
          )}
          <p className="small">{svc.partnerBadge ? 'Delivered by Odoo-certified experts.' : svc.description}</p>
          <Link to={`/services/${svc.slug}`} className="btn btn--secondary btn--sm" onClick={onNavigate}>
            {svc.name} page <ArrowRight size={16} />
          </Link>
        </div>
      </div>
      <div className={styles.megaStrip}>
        <div className="container">
          <span>Not sure what you need?</span>
          <Link to="/contact" className="text-link" onClick={onNavigate}>
            Book a free health checkup <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}

function ResourcesMenu({ items, onNavigate }) {
  return (
    <ul className={styles.dropdown} role="list">
      {items.map((c) => (
        <li key={c.to}>
          <NavLink to={c.to} className={({ isActive }) => (isActive ? styles.active : undefined)} onClick={onNavigate}>
            {c.label}
          </NavLink>
        </li>
      ))}
    </ul>
  );
}

/* ---------------------------------------------------------------- Mobile drawer */
function MobileNav({ open, onClose }) {
  const [panel, setPanel] = useState(null); // service slug shown in the slide-in panel
  const [section, setSection] = useState('services'); // which accordion is open
  useEffect(() => {
    if (!open) setPanel(null);
  }, [open]);
  const svc = services.find((s) => s.slug === panel);

  return (
    <div id="mobile-nav" className={styles.drawer} data-open={open} aria-hidden={!open} inert={open ? undefined : ''}>
      <div className={styles.drawerTrack} data-panel={Boolean(panel)}>
        {/* Level 1 */}
        <nav className={styles.drawerPane} aria-label="Main">
          <ul className={styles.mList} role="list">
            <li>
              <button
                type="button"
                className={styles.mTop}
                aria-expanded={section === 'services'}
                onClick={() => setSection(section === 'services' ? null : 'services')}
              >
                Services {section === 'services' ? <Minus size={18} /> : <Plus size={18} />}
              </button>
              {section === 'services' && (
                <ul className={styles.mSub} role="list">
                  <li className={styles.mHint}>Tap a service to see what&rsquo;s included</li>
                  {services.map((s) => (
                    <li key={s.slug}>
                      <button type="button" className={styles.mSubBtn} onClick={() => setPanel(s.slug)}>
                        {s.name} <ChevronRight size={16} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </li>
            {nav
              .filter((n) => !n.mega)
              .map((n) =>
                n.children ? (
                  <li key={n.label}>
                    <button
                      type="button"
                      className={styles.mTop}
                      aria-expanded={section === n.label}
                      onClick={() => setSection(section === n.label ? null : n.label)}
                    >
                      {n.label} {section === n.label ? <Minus size={18} /> : <Plus size={18} />}
                    </button>
                    {section === n.label && (
                      <ul className={styles.mSub} role="list">
                        {n.children.map((c) => (
                          <li key={c.to}>
                            <Link to={c.to} className={styles.mSubBtn} onClick={onClose}>
                              {c.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ) : (
                  <li key={n.to}>
                    <NavLink to={n.to} className={({ isActive }) => `${styles.mTop} ${isActive ? styles.active : ''}`} onClick={onClose}>
                      {n.label}
                    </NavLink>
                  </li>
                ),
              )}
          </ul>
          <div className={styles.mActions}>
            <CheckupButton className="btn--block" />
          </div>
        </nav>

        {/* Level 2: one service */}
        <div className={styles.drawerPane}>
          {svc && (
            <div className={styles.mPanel}>
              <button type="button" className={styles.mBack} onClick={() => setPanel(null)}>
                <ChevronLeft size={16} /> Back
              </button>
              <p className={styles.megaTitle}>{svc.name}</p>
              <p className="muted">{svc.tagline}</p>
              <ul className={styles.mChips} role="list">
                {subItems(svc)
                  .slice(0, 8)
                  .map((it) => (
                    <li key={it.name}>
                      <Link to={it.to || `/services/${svc.slug}`} onClick={onClose}>
                        {it.name}
                      </Link>
                    </li>
                  ))}
              </ul>
              <Link to={`/services/${svc.slug}`} className="btn btn--secondary btn--block" onClick={onClose}>
                {svc.name} page <ArrowRight size={16} />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- Header */
export default function Header() {
  const location = useLocation();
  const [menu, setMenu] = useState(null); // 'services' | 'Resources' | null
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const closeTimer = useRef();
  const headerRef = useRef(null);

  useScrollLock(mobileOpen);
  useScrollProgress(headerRef);

  // Close everything on navigation
  useEffect(() => {
    setMenu(null);
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setMenu(null);
        setMobileOpen(false);
      }
    };
    const onClick = (e) => {
      if (headerRef.current && !headerRef.current.contains(e.target)) setMenu(null);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClick);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClick);
    };
  }, []);

  const hoverOpen = (key) => {
    clearTimeout(closeTimer.current);
    setMenu(key);
  };
  const hoverClose = () => {
    clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setMenu(null), 180);
  };

  const sectionActive = (prefixes) => prefixes.some((p) => location.pathname.startsWith(p));

  return (
    <header ref={headerRef} className={`${styles.header} ${scrolled ? styles.scrolled : ''}`}>
      <div className={`container ${styles.bar}`}>
        <Logo />

        <nav className={styles.nav} aria-label="Main">
          <ul className={styles.navList} role="list">
            {nav.map((item) => {
              if (item.mega || item.children) {
                const key = item.mega || item.label;
                const isOpen = menu === key;
                const active = item.mega
                  ? sectionActive(['/services'])
                  : sectionActive(item.children.map((c) => c.to));
                return (
                  <li
                    key={item.label}
                    className={styles.navItem}
                    onMouseEnter={() => hoverOpen(key)}
                    onMouseLeave={hoverClose}
                  >
                    <button
                      type="button"
                      className={`${styles.navLink} ${active || isOpen ? styles.active : ''}`}
                      aria-expanded={isOpen}
                      aria-haspopup="true"
                      onClick={() => setMenu(isOpen ? null : key)}
                    >
                      {item.label}
                      <ChevronDown size={14} className={isOpen ? styles.chevOpen : styles.chev} />
                    </button>
                    {isOpen && item.children && <ResourcesMenu items={item.children} onNavigate={() => setMenu(null)} />}
                  </li>
                );
              }
              return (
                <li key={item.to} className={styles.navItem}>
                  <NavLink to={item.to} className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}>
                    {item.label}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className={styles.actions}>
          <CheckupButton label={CHECKUP_SHORT} size="sm" className={styles.cta} />
          <Link to="/contact" className={`btn btn--sm ${styles.ctaMobile}`}>
            Book checkup
          </Link>
          <button
            type="button"
            className={styles.burger}
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <Close size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      <span className={styles.progress} aria-hidden="true" />

      {menu === 'services' && (
        <div className={styles.megaWrap} onMouseEnter={() => hoverOpen('services')} onMouseLeave={hoverClose}>
          <ServicesMega onNavigate={() => setMenu(null)} />
        </div>
      )}
      {menu === 'services' && <div className={styles.scrim} aria-hidden="true" onClick={() => setMenu(null)} />}

      <MobileNav open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </header>
  );
}
