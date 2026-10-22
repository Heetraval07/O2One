import { useLayoutEffect, useRef, useState } from 'react';
import styles from './LiveDashboard.module.css';

/**
 * The supplied "Live dashboard" animation (Meridian Trading, Q3 2026), built as a self-contained component.
 * It is authored on a 1600 x 1000 stage. The artwork (x 72-1351, y 80-990) is scaled to the width of whatever box it
 * sits in and centred vertically, so nothing is clipped or distorted at any size.
 * All styles live in LiveDashboard.module.css; the animation pauses while off screen.
 */
const STAGE_W = 1600;
const STAGE_H = 1000;
const CROP_X = 30; // stage x shown at the box's left edge (the window sits at 72)
const CROP_W = 1340; // stage width shown across the box; the artwork ends at 1351, shadows fade out by the edge
const MID_Y = 535; // vertical middle of the artwork
const CROP_H = 960; // stage height shown (y 55-1015)

const DIGITS = '0\n1\n2\n3\n4\n5\n6\n7\n8\n9';

// Odometer digits: `d` is the digit it settles on, `delay` the stagger of its roll.
const kpis = [
  {
    label: 'Revenue',
    parts: [{ d: 4 }, '.', { d: 8 }, { d: 2 }, 'M'],
    note: (
      <>
        <b className={styles.up}>▲ 12.4%</b> vs last year
      </>
    ),
  },
  {
    label: 'Cash in bank',
    dark: true,
    parts: [{ d: 2 }, '.', { d: 1 }, { d: 4 }, 'M'],
    note: '3 months of costs covered',
  },
  {
    label: 'Gross margin',
    parts: [{ d: 3 }, { d: 1 }, '.', { d: 6 }, '%'],
    note: (
      <>
        <b className={styles.up}>▲ 1.8 pts</b> vs last year
      </>
    ),
  },
];

// Revenue by month: [x, y, height]; the last three are the highlighted quarter.
const BARS = [
  [12, 99.2, 170.8],
  [72, 89.3, 180.7],
  [132, 73.8, 196.2],
  [192, 107.6, 162.4],
  [252, 94.9, 175.1],
  [312, 78, 192],
  [372, 69.5, 200.5],
  [432, 75.2, 194.8],
  [492, 63.9, 206.1],
];
const RECENT = [
  [552, 54, 216],
  [612, 42.7, 227.3],
  [672, 32.8, 237.2],
];

const customers = [
  ['Al Safa Hospitality', '612K', 100],
  ['Gulfline Logistics', '548K', 90],
  ['Noor Medical', '471K', 77],
  ['Desert Rose Interiors', '395K', 65],
];

const iconProps = { width: 24, height: 24, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2.2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true };

const notices = [
  {
    title: 'Payment received',
    sub: 'AED 48,200 · Al Safa Hospitality',
    ping: true,
    icon: <path d="M20 6L9 17l-5-5" />,
  },
  {
    title: 'Invoice sent on WhatsApp',
    sub: 'INV-2291 · Harbour View Hotels',
    icon: <path d="M21 12a8.5 8.5 0 0 1-12.6 7.4L3 21l1.6-5.4A8.5 8.5 0 1 1 21 12z" />,
  },
  {
    title: 'Reorder raised automatically',
    sub: 'PO-0418 · Nitrile gloves, 1,200 boxes',
    icon: (
      <>
        <circle cx="9" cy="20" r="1.5" />
        <circle cx="18" cy="20" r="1.5" />
        <path d="M2 3h3l2.5 12h12L22 7H6" />
      </>
    ),
  },
];

export default function LiveDashboard() {
  const rootRef = useRef(null);
  const [inView, setInView] = useState(true);
  const [fit, setFit] = useState({ k: 0, x: 0, y: 0 });

  useLayoutEffect(() => {
    const el = rootRef.current;
    if (!el) return undefined;
    const measure = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (!w || !h) return;
      const k = Math.min(w / CROP_W, h / CROP_H);
      setFit({ k, x: (w - CROP_W * k) / 2 - CROP_X * k, y: h / 2 - MID_Y * k });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting));
    io.observe(el);
    return () => {
      ro.disconnect();
      io.disconnect();
    };
  }, []);

  return (
    <div
      ref={rootRef}
      className={`${styles.root} ${inView ? '' : styles.paused}`}
      role="img"
      aria-label="Live business dashboard: quarterly revenue, cash in bank, gross margin, revenue by month and top customers, updating from Odoo."
    >
      <div
        className={styles.stage}
        aria-hidden="true"
        style={{ width: STAGE_W, height: STAGE_H, transform: `translate(${fit.x}px, ${fit.y}px) scale(${fit.k})`, visibility: fit.k ? 'visible' : 'hidden' }}
      >
        {/* App window */}
        <div className={styles.window}>
          <div className={styles.topbar}>
            <div className={styles.brand}>
              <span className={styles.mark}>M</span>
              <span className={styles.brandName}>Meridian Trading</span>
            </div>
            <nav className={styles.tabs}>
              <span className={`${styles.tab} ${styles.tabOn}`}>
                Overview<span className={styles.underline} />
              </span>
              <span className={styles.tab}>Sales</span>
              <span className={styles.tab}>Accounting</span>
              <span className={styles.tab}>Inventory</span>
            </nav>
            <span className={styles.live}>
              <span className={styles.dot} />
              <strong>Live</strong> from Odoo
            </span>
          </div>

          <div className={styles.main}>
            <div className={styles.titleRow}>
              <span className={styles.title}>Q3 2026 at a glance</span>
              <span className={styles.currency}>All figures in AED</span>
            </div>

            <div className={styles.kpis}>
              {kpis.map((k) => (
                <div key={k.label} className={`${styles.kpi} ${k.dark ? styles.kpiDark : ''}`}>
                  <div className={styles.kpiLabel}>{k.label}</div>
                  <div className={styles.num}>
                    {k.parts.map((p, i) =>
                      typeof p === 'string' ? (
                        <span key={i} className={styles.ch}>
                          {p}
                        </span>
                      ) : (
                        <span key={i} className={styles.dg}>
                          <span className={styles.strip} style={{ '--d': p.d }}>
                            {DIGITS}
                          </span>
                        </span>
                      ),
                    )}
                  </div>
                  <div className={styles.kpiNote}>{k.note}</div>
                </div>
              ))}
            </div>

            <div className={styles.panels}>
              <div className={styles.panel}>
                <div className={styles.panelHead}>
                  <span className={styles.panelTitle}>Revenue by month</span>
                  <span className={styles.record}>▲ Record month · Sep</span>
                </div>
                <svg viewBox="0 0 720 300" width="100%" className={styles.chart} aria-hidden="true">
                  <g fill="#f3d3c2">
                    {BARS.map(([x, y, h]) => (
                      <rect key={x} x={x} y={y} width="36" height={h} />
                    ))}
                  </g>
                  <g fill="#c4501f">
                    {RECENT.map(([x, y, h]) => (
                      <rect key={x} className={x === 672 ? styles.tick : undefined} x={x} y={y} width="36" height={h} />
                    ))}
                  </g>
                  <defs>
                    <linearGradient id="o2d-sweep-fill" x1="0" x2="1" y1="0" y2="0">
                      <stop offset="0" stopColor="#ffffff" stopOpacity="0" />
                      <stop offset="0.5" stopColor="#ffffff" stopOpacity="0.55" />
                      <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <rect className={styles.sweep} x="-120" y="0" width="120" height="270" fill="url(#o2d-sweep-fill)" />
                  <line x1="0" y1="270" x2="720" y2="270" stroke="#1a1a1a" strokeWidth="1.5" />
                  <g fontFamily="Inter, Arial, sans-serif" fontSize="16" fontWeight="600" fill="#1a1a1a" textAnchor="middle">
                    <text x="570" y="44">1.53M</text>
                    <text x="630" y="33">1.61M</text>
                    <text x="690" y="23">1.68M</text>
                  </g>
                  <g fontFamily="Inter, Arial, sans-serif" fontSize="15" fill="#5f5f5f" textAnchor="middle">
                    <text x="30" y="294">Oct</text>
                    <text x="150" y="294">Dec</text>
                    <text x="270" y="294">Feb</text>
                    <text x="390" y="294">Apr</text>
                    <text x="510" y="294">Jun</text>
                    <text x="570" y="294" fill="#1a1a1a" fontWeight="600">Jul</text>
                    <text x="630" y="294" fill="#1a1a1a" fontWeight="600">Aug</text>
                    <text x="690" y="294" fill="#1a1a1a" fontWeight="600">Sep</text>
                  </g>
                </svg>
              </div>

              <div className={`${styles.panel} ${styles.customers}`}>
                <span className={styles.panelTitle}>Top customers</span>
                <div className={styles.custList}>
                  {customers.map(([name, value, pct]) => (
                    <div key={name} className={styles.cust}>
                      <div className={styles.custRow}>
                        <span>{name}</span>
                        <span>{value}</span>
                      </div>
                      <div className={styles.track}>
                        <div className={styles.fill} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Floating: live notifications, one every 3 seconds */}
        <div className={styles.notices}>
          {notices.map((n, i) => (
            <div key={n.title} className={styles.notice} style={{ animationDelay: `${i * 3}s` }}>
              <div className={styles.noticeIcon}>
                {n.ping && <span className={styles.ping} />}
                <div className={styles.noticeDisc}>
                  <svg {...iconProps}>{n.icon}</svg>
                </div>
              </div>
              <div className={styles.noticeText}>
                <div className={styles.noticeTitle}>{n.title}</div>
                <div className={styles.noticeSub}>{n.sub}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Floating: outcome */}
        <div className={styles.outcome}>
          <div className={styles.outcomeCard}>
            <div className={styles.outcomeLabel}>Month-end close</div>
            <span className={styles.outcomeValue}>2 days</span>
            <div className={styles.outcomeNote}>Down from 9 days before Odoo</div>
          </div>
        </div>
      </div>
    </div>
  );
}
