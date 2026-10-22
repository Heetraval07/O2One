import { useEffect, useRef, useState } from 'react';
import styles from './FlowVisual.module.css';

const NS = 'http://www.w3.org/2000/svg';
const TILT = [-3, 2.5, -2, 3, -2.5, 2];
const MODULES = ['Sales', 'Inventory', 'Accounting', 'CRM', 'HR & Payroll'];

// The six tools. `wide` and `tight` are each card's position on the wide stage (1440 x 560) and on the stacked
// stage used on narrow screens (390 x 840). `mod` is the module it feeds, `n` its open problems, `pk` the data it sends.
const TOOLS = [
  {
    key: 'tally', label: 'Tally', meta: 'Day Book · 3 unposted', pain: 'Stock mismatch', mod: 2, n: 3,
    pk: 'Inv #1042|Ledger entry|Receipt AED 15,000', wide: [80, 52, '.05s'], tight: [12, 40], bob: null,
    icon: <><path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z" /><path d="M5 17a3 3 0 0 1 3-3h11M9 8h6M9 11h4" /></>,
    body: <><div className={styles.sk} /><div className={styles.sk} style={{ width: '70%' }} /></>,
  },
  {
    key: 'excel', label: 'Excel', meta: 'Stock_FINAL_v8.xlsx', pain: 'Which file is final?', mod: 1, n: 2,
    pk: 'Stock · 120|Item A rate', wide: [430, 130, '.15s'], tight: [206, 74], bob: '-1.5s',
    icon: <><rect x="4" y="4" width="16" height="16" rx="1" /><path d="M4 10h16M4 15h16M10 4v16" /></>,
    body: (
      <div className={styles.miniGrid}>
        <i /><i /><i className={styles.r} /><i /><i /><i /><i /><i className={styles.r} />
      </div>
    ),
  },
  {
    key: 'whatsapp', label: 'WhatsApp', meta: 'Ops group · 34 unread', pain: 'Missed orders', mod: 0, n: 3,
    pk: 'Order · 40 pcs|Delivery update|Payment in', wide: [140, 206, '.25s'], tight: [12, 170], bob: '-3s',
    icon: <><path d="M20 12a8 8 0 0 1-11.6 7.1L4 20l1-4.2A8 8 0 1 1 20 12z" /><path d="M9 12h.01M12 12h.01M15 12h.01" /></>,
    body: <><div className={styles.bubl} /><div className={`${styles.bubl} ${styles.me}`} /></>,
  },
  {
    key: 'email', label: 'Email', meta: 'Inbox · 12 unread', pain: 'Missed follow-up', mod: 3, n: 2,
    pk: 'Lead · Al Noor|Quote request', wide: [470, 300, '.35s'], tight: [206, 204], bob: '-2s',
    icon: <><rect x="3" y="5" width="18" height="14" rx="1" /><path d="m3 7 9 6 9-6" /></>,
    body: <><div className={styles.sk} /><div className={styles.sk} style={{ width: '60%' }} /></>,
  },
  {
    key: 'invoices', label: 'Invoices', meta: 'PDFs · 3 pending', pain: 'Payment overdue', mod: 2, n: 3,
    pk: 'AED 48,200|VAT invoice|Credit note', wide: [100, 372, '.45s'], tight: [12, 300], bob: '-4s',
    icon: <><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5M9 13h6M9 17h4" /></>,
    body: <><div className={styles.sk} /><div className={styles.sk} style={{ width: '75%' }} /></>,
  },
  {
    key: 'notebooks', label: 'Notebooks', meta: 'Attendance register', pain: 'Lost records', mod: 4, n: 2,
    pk: 'Attendance|Overtime hours', wide: [450, 452, '.55s'], tight: [206, 334], bob: '-1s',
    icon: <><rect x="5" y="3" width="14" height="18" rx="1" /><path d="M9 3v18M12 8h4M12 12h4" /></>,
    body: <div className={styles.sk} style={{ width: '80%' }} />,
  },
];

const NARROW = '(max-width: 899px)';

/**
 * "Tally / Excel / WhatsApp" animation, option B: six scattered tools send labelled updates along dashed lines into
 * one connected O2One system. Each tool resolves (its red problem badge counts down to a tick and its pain point turns
 * into "Synced"), a counter and the five modules light up, then it plays again. The motion runs on a requestAnimationFrame
 * loop that only works while the visual is on screen. A fixed stage is scaled to fit: wide on large screens, stacked on
 * narrow ones so the text stays readable. With reduced motion it shows the finished state and does not move.
 */
export default function FlowVisual() {
  const rootRef = useRef(null);
  const [tight, setTight] = useState(() => typeof window !== 'undefined' && window.matchMedia(NARROW).matches);

  useEffect(() => {
    const mq = window.matchMedia(NARROW);
    const on = () => setTight(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    const stage = root.querySelector('[data-stage]');
    const svg = root.querySelector('[data-flow]');
    const brand = root.querySelector('[data-brand]');
    const mark = brand.querySelector('[data-mark]');
    const syncN = root.querySelector('[data-sync]');
    const mods = [...root.querySelectorAll('[data-mod-chip]')];
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const W = tight ? 390 : 1440;
    const made = [];
    const timers = [];

    let scale = 1;
    const fit = () => {
      scale = root.clientWidth / W;
      stage.style.transform = `scale(${scale})`;
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(root);

    // Where every line meets, and the short solid line from there into the O2One mark
    const cx = brand.offsetLeft;
    let JOIN;
    let EDGE;
    if (tight) {
      JOIN = { x: cx, y: brand.offsetTop - 44 };
      EDGE = { x: cx, y: brand.offsetTop + 1 };
    } else {
      const cy = brand.offsetTop + mark.offsetHeight / 2;
      const r = mark.offsetWidth / 2;
      JOIN = { x: cx - r - 70, y: cy };
      EDGE = { x: cx - r + 1, y: cy };
    }
    const mk = (tag, attrs) => {
      const e = document.createElementNS(NS, tag);
      Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v));
      made.push(e);
      return e;
    };
    const trunkD = `M${JOIN.x} ${JOIN.y} L${EDGE.x} ${EDGE.y}`;
    const trunk = mk('path', { d: trunkD, class: styles.trunk });
    svg.appendChild(trunk);
    const sweep = mk('path', { d: trunkD, class: styles.sweep });
    sweep.style.strokeDasharray = '24 400';

    // One line per tool, plus its trail, a glowing dot, a labelled packet and a problem badge
    const flows = [...root.querySelectorAll('[data-src]')].map((c, i) => {
      const inner = c.querySelector('[data-inner]');
      inner.style.rotate = `${TILT[i]}deg`;
      const left = c.offsetLeft;
      const right = c.offsetLeft + c.offsetWidth;
      const y = c.offsetTop + inner.offsetHeight / 2;
      let d;
      if (tight) {
        // out of the card's inner side, along the gutter between the two columns, down to the meeting point
        const fromLeft = left < W / 2;
        const x = fromLeft ? right : left;
        const gx = JOIN.x;
        const s = fromLeft ? 1 : -1;
        d = `M${x} ${y} L${gx - s * 14} ${y} Q${gx} ${y} ${gx} ${y + 14} L${gx} ${JOIN.y}`;
      } else {
        const BEND = 670;
        d = `M${right} ${y} L${BEND} ${y} C ${BEND + 140} ${y}, ${JOIN.x - 120} ${JOIN.y}, ${JOIN.x} ${JOIN.y}`;
      }
      const p = mk('path', { d, class: styles.ln });
      p.style.animationDelay = `${0.6 + i * 0.08}s,0s`;
      svg.insertBefore(p, trunk);
      const trail = mk('path', { d, class: styles.trail });
      svg.appendChild(trail);
      const dot = mk('circle', { r: '3', fill: '#ff7a3d', class: styles.pt });
      dot.style.opacity = 0;
      svg.appendChild(dot);
      const pk = document.createElement('span');
      pk.className = styles.pkt;
      stage.appendChild(pk);
      made.push(pk);
      const badge = document.createElement('span');
      badge.className = styles.alert;
      inner.appendChild(badge);
      made.push(badge);
      const pain = inner.querySelector('[data-pain]');
      pain.dataset.txt = pain.textContent;
      badge.textContent = c.dataset.n;
      return {
        i, card: c, inner, p, trail, pain, len: p.getTotalLength(), dot, pk, badge,
        labels: c.dataset.pk.split('|'), mod: +c.dataset.mod, total: +c.dataset.n,
        dur: 3100 + Math.random() * 800, start: 1600 + i * 480, n: 0, li: 0, t0: 0,
      };
    });
    svg.appendChild(sweep);
    const jdot = mk('circle', { cx: JOIN.x, cy: JOIN.y, r: '4', class: styles.join });
    svg.appendChild(jdot);

    let synced = 0;
    let allDoneAt = 0;
    const setSynced = (v) => {
      synced = v;
      syncN.textContent = v;
    };

    const reset = (now) => {
      setSynced(0);
      flows.forEach((f) => {
        f.n = f.total;
        f.li = 0;
        f.t0 = now + f.start;
        f.badge.textContent = f.n;
        f.badge.classList.remove(styles.done);
        f.card.classList.remove(styles.calm);
        f.inner.style.rotate = `${TILT[f.i]}deg`;
        f.p.classList.remove(styles.done);
        f.pk.textContent = f.labels[0];
        f.pain.textContent = f.pain.dataset.txt;
        f.trail.style.opacity = 0;
      });
      mods.forEach((m) => m.classList.remove(styles.on, styles.hit));
      root.classList.remove(styles.complete);
      allDoneAt = 0;
    };

    const ripple = () => {
      const c = mk('circle', { cx: JOIN.x, cy: JOIN.y, r: '4', class: styles.rip });
      svg.insertBefore(c, jdot);
      timers.push(setTimeout(() => c.remove(), 950));
      sweep.classList.remove(styles.go);
      void sweep.getBoundingClientRect();
      sweep.classList.add(styles.go);
    };

    const resolve = (f) => {
      f.badge.textContent = '✓';
      f.badge.classList.add(styles.done);
      f.card.classList.add(styles.calm);
      f.inner.style.rotate = '0deg';
      f.p.classList.add(styles.done);
    };

    const arrive = (f) => {
      ripple();
      setSynced(synced + 1);
      syncN.classList.remove(styles.pop);
      void syncN.offsetWidth;
      syncN.classList.add(styles.pop);
      const m = mods[f.mod];
      if (m) {
        m.classList.add(styles.on, styles.hit);
        clearTimeout(m._t);
        m._t = setTimeout(() => m.classList.remove(styles.hit), 700);
      }
      f.n--;
      f.li++;
      f.badge.classList.remove(styles.bump);
      void f.badge.offsetWidth;
      f.badge.classList.add(styles.bump);
      if (f.n <= 0) {
        resolve(f);
        f.inner.classList.add(styles.flash);
        timers.push(setTimeout(() => f.inner.classList.remove(styles.flash), 700));
        f.pain.classList.remove(styles.swap);
        void f.pain.offsetWidth;
        f.pain.classList.add(styles.swap);
        timers.push(setTimeout(() => (f.pain.textContent = 'Synced'), 180));
      } else f.badge.textContent = f.n;
      f.pk.textContent = f.labels[f.li % f.labels.length];
    };

    const SEG = 80;
    const drawTrail = (f, e, op) => {
      f.trail.style.strokeDasharray = `${SEG} ${f.len * 2}`;
      f.trail.style.strokeDashoffset = SEG - e * f.len;
      f.trail.style.opacity = op;
    };

    let running = false;
    let started = false;
    let raf = 0;
    const tick = (now) => {
      if (!started) {
        started = true;
        reset(now);
      }
      let busy = false;
      flows.forEach((f) => {
        if (f.n <= 0) {
          f.dot.style.opacity = 0;
          f.pk.style.opacity = 0;
          // finale: a soft light keeps running along every connected line, all in step
          if (allDoneAt) {
            const ph = ((now - allDoneAt) % 1800) / 1800;
            drawTrail(f, ph, 0.55 * Math.sin(ph * Math.PI));
          } else f.trail.style.opacity = 0;
          return;
        }
        busy = true;
        const el = now - f.t0;
        if (el < 0) {
          f.dot.style.opacity = 0;
          f.pk.style.opacity = 0;
          return;
        }
        const prog = el / f.dur;
        if (prog >= 1) {
          arrive(f);
          f.t0 = now + 600 + Math.random() * 700;
          f.dot.style.opacity = 0;
          f.pk.style.opacity = 0;
          return;
        }
        const e = prog < 0.5 ? 2 * prog * prog : 1 - Math.pow(-2 * prog + 2, 2) / 2;
        const a = f.p.getPointAtLength(e * f.len);
        // the label shows once clear of its card and fades before the join, so nothing crowds the cards or the logo
        const tagFade = prog < 0.12 ? 0 : prog < 0.24 ? (prog - 0.12) / 0.12 : prog < 0.62 ? 1 : Math.max(0, (0.78 - prog) / 0.16);
        const dotFade = Math.min(1, prog * 8) * (prog > 0.92 ? (1 - prog) * 12.5 : 1);
        f.pk.style.transform = `translate(${a.x}px,${a.y}px) translate(-50%,-50%)`;
        f.pk.style.opacity = tagFade;
        f.dot.setAttribute('cx', a.x);
        f.dot.setAttribute('cy', a.y);
        f.dot.style.opacity = dotFade;
        drawTrail(f, e, dotFade);
      });
      if (!busy) {
        if (!allDoneAt) {
          allDoneAt = now;
          root.classList.add(styles.complete);
        } else if (now - allDoneAt > 5400) reset(now);
      }
      if (running) raf = requestAnimationFrame(tick);
    };

    let io;
    if (reduced) {
      // no movement: show the finished picture
      flows.forEach((f) => {
        f.n = 0;
        resolve(f);
        f.pain.textContent = 'Synced';
      });
      setSynced(flows.reduce((a, f) => a + f.total, 0));
      mods.forEach((m) => m.classList.add(styles.on));
      root.classList.add(styles.complete);
    } else {
      const start = () => {
        if (running) return;
        running = true;
        raf = requestAnimationFrame(tick);
      };
      const stop = () => {
        running = false;
        cancelAnimationFrame(raf);
      };
      io = new IntersectionObserver((e) => (e[0].isIntersecting ? start() : stop()), { threshold: 0.25 });
      io.observe(root);
    }

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      io?.disconnect();
      ro.disconnect();
      timers.forEach(clearTimeout);
      mods.forEach((m) => {
        clearTimeout(m._t);
        m.classList.remove(styles.on, styles.hit);
      });
      made.forEach((n) => n.remove());
      root.classList.remove(styles.complete);
      root.querySelectorAll('[data-src]').forEach((c) => {
        c.classList.remove(styles.calm);
        c.querySelector('[data-pain]').textContent = c.querySelector('[data-pain]').dataset.txt || c.querySelector('[data-pain]').textContent;
      });
      syncN.textContent = '0';
    };
  }, [tight]);

  return (
    <div
      ref={rootRef}
      className={styles.root}
      data-layout={tight ? 'tight' : 'wide'}
      role="img"
      aria-label="Orders on WhatsApp, stock in Excel, invoices in Tally, leads in email and attendance in notebooks all flowing into one connected O2One system."
    >
      <div className={styles.stage} data-stage aria-hidden="true">
        <svg className={styles.flow} viewBox={tight ? '0 0 390 840' : '0 0 1440 560'} data-flow>
          <defs>
            <filter id="o2hGlowB" x="-200%" y="-200%" width="500%" height="500%">
              <feGaussianBlur stdDeviation="2.2" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
        </svg>

        <span className={styles.sideLbl} style={tight ? { left: 12, top: 8 } : { left: 80 }}>
          <i />
          <b>Before</b>&nbsp;Scattered tools
        </span>
        <span className={`${styles.sideLbl} ${styles.after}`}>
          <i />
          <b>After</b>&nbsp;One system
          <i />
        </span>

        {TOOLS.map((t) => {
          const [wx, wy, delay] = t.wide;
          const [tx, ty] = t.tight;
          return (
            <div
              key={t.key}
              className={styles.card}
              data-src
              data-mod={t.mod}
              data-n={t.n}
              data-pk={t.pk}
              style={{ left: tight ? tx : wx, top: tight ? ty : wy, animationDelay: delay }}
            >
              <div className={styles.cardIn} data-inner style={t.bob ? { animationDelay: t.bob } : undefined}>
                <div className={styles.head}>
                  <div className={styles.ico}>
                    <svg viewBox="0 0 24 24">{t.icon}</svg>
                  </div>
                  <div>
                    <div className={styles.lbl}>{t.label}</div>
                    <div className={styles.meta}>{t.meta}</div>
                  </div>
                </div>
                {t.body}
                <span className={styles.pain} data-pain>
                  {t.pain}
                </span>
              </div>
            </div>
          );
        })}

        <div className={styles.brand} data-brand>
          <div className={styles.mark} data-mark>
            <svg viewBox="0 0 100 100">
              <path d="M50 0V100M0 50H100" stroke="#a6a6a6" strokeWidth="1.4" strokeDasharray="4 5" />
              <circle cx="50" cy="50" r="36" fill="none" stroke="#1a1a1a" strokeWidth="8" />
              <circle cx="50" cy="50" r="20" fill="#ff7a3d" />
            </svg>
          </div>
          <div className={styles.brandSub}>One connected system</div>
          <div className={styles.sync}>
            <b data-sync>0</b>updates synced
          </div>
          <div className={styles.mods}>
            {MODULES.map((m) => (
              <span key={m} className={styles.mod} data-mod-chip>
                {m}
              </span>
            ))}
          </div>
          <div className={styles.allset}>
            <em>✓</em>Every tool connected. One source of truth.
          </div>
        </div>
      </div>
    </div>
  );
}
