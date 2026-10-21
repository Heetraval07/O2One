import { useEffect, useRef } from 'react';
import styles from './FlowVisual.module.css';

const NS = 'http://www.w3.org/2000/svg';
const HUB = { x: 426, y: 306 };
const COLORS = ['#ff7a3d', '#9a9a9a', '#c4501f', '#bdbdbd', '#ff7a3d', '#9a9a9a'];
const TILE_NAMES = ['Sales', 'Inventory', 'Accounting', 'CRM', 'HR & Payroll', 'Reports'];

const person = (
  <svg viewBox="0 0 24 24">
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21a8 8 0 0 1 16 0z" />
  </svg>
);
const lineIcon = { fill: 'none', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' };

/**
 * "Tally / Excel / WhatsApp" animation: scattered tools send labelled data packets into one O2One dashboard.
 * A fixed 900x560 stage scaled to fit; the motion is driven by a requestAnimationFrame loop that only runs
 * while the visual is on screen.
 */
export default function FlowVisual() {
  const rootRef = useRef(null);

  useEffect(() => {
    const root = rootRef.current;
    const stage = root.querySelector('[data-stage]');
    const svg = root.querySelector('[data-flow]');
    const tiles = [...root.querySelectorAll('[data-tile-el]')];
    const bars = [...root.querySelectorAll('[data-bar]')];
    const navs = [...root.querySelectorAll('[data-nav]')];
    const charts = [...root.querySelectorAll('[data-chart]')];
    const segs = [...root.querySelectorAll('[data-seg]')];
    const toast = root.querySelector('[data-toast]');
    const toastTxt = root.querySelector('[data-toast-txt]');
    const made = []; // nodes created here, removed on cleanup
    const timers = [];

    let scale = 1;
    const fit = () => {
      scale = root.clientWidth / 900;
      stage.style.transform = `scale(${scale})`;
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(root);

    /* one flow per tool card: dashed path, a trailing dot, a labelled data packet, a problem badge */
    const flows = [...root.querySelectorAll('[data-src]')].map((c, i) => {
      const x = c.offsetLeft + c.offsetWidth;
      const y = c.offsetTop + c.offsetHeight / 2;
      const ey = HUB.y + (i - 2.5) * 3;
      const p = document.createElementNS(NS, 'path');
      p.setAttribute('d', `M${x} ${y} C ${x + 110} ${y}, ${HUB.x - 130} ${ey}, ${HUB.x} ${ey}`);
      p.setAttribute('class', styles.ln);
      p.setAttribute('stroke', COLORS[i]);
      p.style.animationDelay = `${0.6 + i * 0.08}s,0s`;
      svg.appendChild(p);
      const dot = document.createElementNS(NS, 'circle');
      dot.setAttribute('r', '3');
      dot.setAttribute('fill', '#ff7a3d');
      dot.setAttribute('class', styles.pt);
      dot.style.opacity = 0;
      svg.appendChild(dot);
      const pk = document.createElement('span');
      pk.className = styles.pkt;
      stage.appendChild(pk);
      const badge = document.createElement('span');
      badge.className = styles.alert;
      badge.textContent = c.dataset.n;
      c.appendChild(badge);
      made.push(p, dot, pk, badge);
      return {
        card: c,
        p,
        len: p.getTotalLength(),
        dot,
        pk,
        badge,
        labels: c.dataset.pk.split('|'),
        tile: +c.dataset.tile,
        total: +c.dataset.n,
        dur: 3000 + Math.random() * 900,
        start: 1400 + i * 520,
        n: 0,
        li: 0,
        t0: 0,
      };
    });

    const setBars = () => bars.forEach((b, i) => (b.style.height = `${25 + Math.random() * 45 + i * 5}%`));
    const setDonut = () => {
      const C = 176;
      const a = 0.38 + Math.random() * 0.12;
      const b = 0.22 + Math.random() * 0.1;
      const c = 0.14 + Math.random() * 0.1;
      const s = [[a, 0], [b, a], [c, a + b]];
      segs.forEach((e, i) => {
        e.setAttribute('stroke-dasharray', `${s[i][0] * C - 2} ${C}`);
        e.setAttribute('stroke-dashoffset', -s[i][1] * C);
      });
    };

    let allDoneAt = 0;
    const reset = (now) => {
      flows.forEach((f) => {
        f.n = f.total;
        f.li = 0;
        f.t0 = now + f.start;
        f.badge.textContent = f.n;
        f.badge.classList.remove(styles.done);
        f.card.classList.remove(styles.calm);
        f.pk.textContent = f.labels[0];
      });
      tiles.forEach((t) => t.classList.remove(styles.glow));
      allDoneAt = 0;
    };

    const arrive = (f) => {
      tiles.forEach((t) => t.classList.remove(styles.glow));
      tiles[f.tile]?.classList.add(styles.glow);
      toastTxt.textContent = '';
      toastTxt.append(`${f.labels[f.li % f.labels.length]} → `);
      const b = document.createElement('b');
      b.textContent = TILE_NAMES[f.tile];
      toastTxt.append(b);
      toast.classList.add(styles.on);
      clearTimeout(toast._t);
      toast._t = setTimeout(() => toast.classList.remove(styles.on), 1500);
      setBars();
      setDonut();
      f.n--;
      f.li++;
      f.badge.classList.remove(styles.bump);
      void f.badge.offsetWidth;
      f.badge.classList.add(styles.bump);
      if (f.n <= 0) {
        f.badge.textContent = '✓';
        f.badge.classList.add(styles.done);
        f.card.classList.add(styles.calm);
      } else f.badge.textContent = f.n;
      f.pk.textContent = f.labels[f.li % f.labels.length];
    };

    let running = false;
    let started = false;
    let raf;
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
          f.t0 = now + 500 + Math.random() * 700;
          f.dot.style.opacity = 0;
          f.pk.style.opacity = 0;
          return;
        }
        const e = prog < 0.5 ? 2 * prog * prog : 1 - Math.pow(-2 * prog + 2, 2) / 2;
        const a = f.p.getPointAtLength(e * f.len);
        const fade = Math.min(1, prog * 6) * (prog > 0.9 ? (1 - prog) * 10 : 1);
        f.pk.style.transform = `translate(${a.x}px,${a.y}px) translate(-50%,-140%) scale(${1 - e * 0.25})`;
        f.pk.style.opacity = fade;
        f.dot.setAttribute('cx', a.x);
        f.dot.setAttribute('cy', a.y);
        f.dot.style.opacity = fade;
      });
      if (!busy) {
        if (!allDoneAt) allDoneAt = now;
        else if (now - allDoneAt > 3200) reset(now);
      }
      if (running) raf = requestAnimationFrame(tick);
    };

    let built = false;
    let navTimer;
    const build = () => {
      if (built) return;
      built = true;
      tiles.forEach((t, i) => timers.push(setTimeout(() => t.classList.add(styles.on), 1700 + i * 110)));
      timers.push(setTimeout(() => charts.forEach((c) => c.classList.add(styles.on)), 2300));
      timers.push(setTimeout(() => { setBars(); setDonut(); }, 2600));
      let ni = 0;
      navTimer = setInterval(() => {
        if (!running) return;
        navs.forEach((n) => n.classList.remove(styles.on));
        navs[++ni % navs.length].classList.add(styles.on);
      }, 3200);
    };

    const start = () => {
      if (running) return;
      running = true;
      build();
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };
    const io = new IntersectionObserver((e) => (e[0].isIntersecting ? start() : stop()), { threshold: 0.25 });
    io.observe(root);

    return () => {
      stop();
      io.disconnect();
      ro.disconnect();
      clearInterval(navTimer);
      clearTimeout(toast._t);
      timers.forEach(clearTimeout);
      made.forEach((n) => n.remove());
      tiles.forEach((t) => t.classList.remove(styles.on, styles.glow));
      charts.forEach((c) => c.classList.remove(styles.on));
      bars.forEach((b) => (b.style.height = ''));
      toast.classList.remove(styles.on);
    };
  }, []);

  return (
    <div
      ref={rootRef}
      className={styles.root}
      role="img"
      aria-label="Orders on WhatsApp, stock in Excel, invoices in Tally and leads in email all flowing into one connected O2One system."
    >
      <div className={styles.stage} data-stage aria-hidden="true">
        <span className={`${styles.blob} ${styles.blobB}`} />
        <span className={`${styles.blob} ${styles.blobC}`} />
        <span className={styles.dots} />

        <svg className={styles.flow} viewBox="0 0 900 560" data-flow>
          <defs>
            <filter id="o2hGlow" x="-200%" y="-200%" width="500%" height="500%">
              <feGaussianBlur stdDeviation="2.2" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
        </svg>

        <span className={styles.stageLbl} style={{ left: 46, top: 18 }}>
          <i className={styles.lbDot} />
          Scattered tools
        </span>
        <span className={styles.stageLbl} style={{ left: 500, top: 90 }}>
          <i className={`${styles.lbDot} ${styles.on}`} />
          One O2One system
        </span>

        {/* Each card: data-n = open problems, data-tile = module it feeds, data-pk = data labels it sends */}
        {/* Tally */}
        <div className={styles.card} data-src data-n="3" data-tile="2" data-pk="Inv #1042|Ledger entry|Receipt AED 15,000" style={{ left: 70, top: 46, width: 156, animationDelay: '.05s' }}>
          <div className={styles.cardBob}>
            <div className={styles.wdots}><i /><i /><i /></div>
            <div className={styles.crow}>
              <div className={styles.ico}>
                <svg viewBox="0 0 24 24" {...lineIcon}><path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z" /><path d="M5 17a3 3 0 0 1 3-3h11M9 8h6M9 11h4" /></svg>
              </div>
              <div className={styles.grow}>
                <div className={styles.lbl}>Tally</div>
                <div className={styles.dl}><b className={styles.red} /><span className={styles.sk} /></div>
                <div className={styles.dl}><b className={styles.red} /><span className={styles.sk} /></div>
                <div className={styles.dl}><b /><span className={styles.sk} style={{ width: '60%', flex: 'none' }} /></div>
              </div>
            </div>
          </div>
        </div>

        {/* Excel */}
        <div className={styles.card} data-src data-n="2" data-tile="1" data-pk="Stock · 120|Item A rate" style={{ left: 262, top: 86, width: 132, animationDelay: '.15s' }}>
          <div className={styles.cardBob} style={{ animationDelay: '-1.5s' }}>
            <div className={styles.crow}>
              <div className={styles.ico}>
                <svg viewBox="0 0 24 24" {...lineIcon}><rect x="4" y="4" width="16" height="16" rx="1" /><path d="M4 10h16M4 15h16M10 4v16" /></svg>
              </div>
              <div className={styles.grow}>
                <div className={styles.lbl}>Excel</div>
                <div className={styles.sk} />
                <div className={styles.sk} style={{ width: '60%' }} />
              </div>
            </div>
            <div className={styles.miniGrid}>
              <i className={styles.gray} /><i /><i /><i className={styles.gray} /><i /><i className={styles.gray} /><i /><i />
            </div>
          </div>
        </div>

        {/* WhatsApp */}
        <div className={styles.card} data-src data-n="3" data-tile="0" data-pk="Order · 40 pcs|Delivery update|Payment in" style={{ left: 128, top: 180, width: 156, animationDelay: '.25s' }}>
          <div className={styles.cardBob} style={{ animationDelay: '-3s' }}>
            <div className={styles.wdots}><i /><i /><i /></div>
            <div className={styles.crow}>
              <div className={styles.ico}>
                <svg viewBox="0 0 24 24" {...lineIcon}><path d="M20 12a8 8 0 0 1-11.6 7.1L4 20l1-4.2A8 8 0 1 1 20 12z" /><path d="M9 12h.01M12 12h.01M15 12h.01" /></svg>
              </div>
              <div className={styles.grow}>
                <div className={styles.lbl}>WhatsApp</div>
                <div className={styles.bubl} />
                <div className={`${styles.bubl} ${styles.reply}`} />
                <div className={styles.bubl} style={{ width: '50%' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Email */}
        <div className={styles.card} data-src data-n="2" data-tile="3" data-pk="Lead · Al Noor|Quote request" style={{ left: 46, top: 306, width: 146, animationDelay: '.35s' }}>
          <div className={styles.cardBob} style={{ animationDelay: '-2s' }}>
            <div className={styles.wdots}><i /><i /><i /></div>
            <div className={styles.crow}>
              <div className={styles.ico}>
                <svg viewBox="0 0 24 24" {...lineIcon}><rect x="3" y="5" width="18" height="14" rx="1" /><path d="m3 7 9 6 9-6" /></svg>
              </div>
              <div className={styles.grow}>
                <div className={styles.lbl}>Email</div>
                <div className={styles.sk} />
                <div className={styles.sk} style={{ width: '75%' }} />
                <div className={styles.sk} style={{ width: '50%' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Invoices */}
        <div className={styles.card} data-src data-n="3" data-tile="2" data-pk="AED 48,200|VAT invoice|Credit note" style={{ left: 232, top: 352, width: 138, animationDelay: '.45s' }}>
          <div className={styles.cardBob} style={{ animationDelay: '-4s' }}>
            <div className={styles.crow}>
              <div className={styles.ico}>
                <svg viewBox="0 0 24 24" {...lineIcon}><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5M9 13h6M9 17h4" /></svg>
              </div>
              <div className={styles.grow}>
                <div className={styles.lbl}>Invoices</div>
                <div className={styles.sk} />
                <div className={styles.sk} style={{ width: '65%' }} />
              </div>
            </div>
            <div className={styles.dl} style={{ marginTop: 7 }}><b className={styles.red} /><span className={styles.sk} /><b /><span className={styles.sk} /></div>
          </div>
        </div>

        {/* Notebooks */}
        <div className={styles.card} data-src data-n="2" data-tile="4" data-pk="Attendance|Overtime hours" style={{ left: 94, top: 440, width: 150, animationDelay: '.55s' }}>
          <div className={styles.cardBob} style={{ animationDelay: '-1s' }}>
            <div className={styles.wdots}><i /><i /><i /></div>
            <div className={styles.crow}>
              <div className={styles.ico}>
                <svg viewBox="0 0 24 24" {...lineIcon}><rect x="5" y="3" width="14" height="18" rx="1" /><path d="M9 3v18M12 8h4M12 12h4" /></svg>
              </div>
              <div className={styles.grow}>
                <div className={styles.lbl}>Notebooks</div>
                <div className={styles.sk} />
                <div className={styles.sk} style={{ width: '55%' }} />
              </div>
            </div>
          </div>
        </div>

        {/* people */}
        <span className={styles.av} style={{ left: 20, top: 226, animationDelay: '.6s,0s' }}>{person}</span>
        <span className={styles.av} style={{ left: 330, top: 212, animationDelay: '.7s,-1s' }}>{person}</span>
        <span className={styles.av} style={{ left: 312, top: 296, animationDelay: '.8s,-2s' }}>{person}</span>
        <span className={styles.av} style={{ left: 330, top: 478, animationDelay: '.9s,-3s' }}>{person}</span>

        {/* hub: O2One logo mark */}
        <div className={styles.hub}>
          <svg viewBox="0 0 100 100">
            <path d="M50 0V100M0 50H100" stroke="#a6a6a6" strokeWidth="1.2" strokeDasharray="4 5" />
            <circle cx="50" cy="50" r="36" fill="none" stroke="#1a1a1a" strokeWidth="8" />
            <circle cx="50" cy="50" r="20" fill="#ff7a3d" />
          </svg>
        </div>

        {/* O2One dashboard */}
        <div className={styles.dash}>
          <div className={styles.side}>
            <div className={styles.logo}>
              <svg viewBox="0 0 100 100">
                <path d="M50 0V100M0 50H100" stroke="#a6a6a6" strokeWidth="2" strokeDasharray="4 5" />
                <circle cx="50" cy="50" r="36" fill="none" stroke="#ffffff" strokeWidth="8" />
                <circle cx="50" cy="50" r="20" fill="#ff7a3d" />
              </svg>
            </div>
            <div className={`${styles.nav} ${styles.on}`} data-nav><svg viewBox="0 0 24 24"><rect x="4" y="4" width="6" height="6" rx="1" /><rect x="14" y="4" width="6" height="6" rx="1" /><rect x="4" y="14" width="6" height="6" rx="1" /><rect x="14" y="14" width="6" height="6" rx="1" /></svg></div>
            <div className={styles.nav} data-nav><svg viewBox="0 0 24 24"><path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" /></svg></div>
            <div className={styles.nav} data-nav><svg viewBox="0 0 24 24"><path d="M5 20v-6M10 20V10M15 20V6M20 20V3" /></svg></div>
            <div className={styles.nav} data-nav><svg viewBox="0 0 24 24"><path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4zM10 21h4" /></svg></div>
            <div className={styles.nav} data-nav><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9 7 7M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1" /></svg></div>
          </div>
          <div className={styles.main}>
            <div className={styles.top}>
              <div>
                <div className={styles.wordmark}>Al Nahda Trading LLC</div>
                <div className={styles.sub}>One connected system</div>
              </div>
              <span className={styles.live}><i />Live</span>
            </div>
            <div className={styles.tiles}>
              <div className={styles.tile} data-tile-el><span className={styles.ti}><svg viewBox="0 0 24 24"><circle cx="9" cy="20" r="1.4" /><circle cx="17" cy="20" r="1.4" /><path d="M3 4h2l2.4 11h10.2L20 8H6.2" /></svg></span>Sales</div>
              <div className={styles.tile} data-tile-el><span className={styles.ti}><svg viewBox="0 0 24 24"><path d="M12 3 3 7.5v9L12 21l9-4.5v-9z" /><path d="m3 7.5 9 4.5 9-4.5M12 12v9" /></svg></span>Inventory</div>
              <div className={styles.tile} data-tile-el><span className={styles.ti}><svg viewBox="0 0 24 24"><rect x="5" y="3" width="14" height="18" rx="1" /><path d="M8 7h8M8 11h2M12 11h2M8 15h2M12 15h2M8 18h2M12 18h4" /></svg></span>Accounting</div>
              <div className={styles.tile} data-tile-el><span className={styles.ti}><svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6 6 0 0 1 3.5 6" /></svg></span>CRM</div>
              <div className={styles.tile} data-tile-el><span className={styles.ti}><svg viewBox="0 0 24 24"><rect x="3" y="6" width="18" height="14" rx="1" /><circle cx="9" cy="12" r="2" /><path d="M6 17a3 3 0 0 1 6 0M15 11h3M15 14h3M9 6V4h6v2" /></svg></span>HR &amp; Payroll</div>
              <div className={styles.tile} data-tile-el><span className={styles.ti}><svg viewBox="0 0 24 24"><path d="M4 20V4M4 20h16M8 16l4-5 3 3 5-6" /></svg></span>Reports</div>
            </div>
            <div className={styles.charts}>
              <div className={styles.ch} data-chart>
                <div className={styles.chT}>Sales this week</div>
                <div className={styles.bars}>
                  <i data-bar /><i data-bar /><i data-bar /><i data-bar /><i data-bar /><i data-bar />
                </div>
              </div>
              <div className={styles.ch} data-chart>
                <div className={styles.chT}>Stock by location</div>
                <div className={styles.donut}>
                  <svg viewBox="0 0 80 80">
                    <circle cx="40" cy="40" r="28" stroke="#f6f6f6" />
                    <circle className={styles.seg} data-seg cx="40" cy="40" r="28" stroke="#ff7a3d" strokeDasharray="0 176" />
                    <circle className={styles.seg} data-seg cx="40" cy="40" r="28" stroke="#1a1a1a" strokeDasharray="0 176" />
                    <circle className={styles.seg} data-seg cx="40" cy="40" r="28" stroke="#bdbdbd" strokeDasharray="0 176" />
                  </svg>
                  <div className={styles.legend}>
                    <div className={styles.dl}><b style={{ background: '#ff7a3d' }} /><span className={styles.sk} /></div>
                    <div className={styles.dl}><b style={{ background: '#1a1a1a' }} /><span className={styles.sk} /></div>
                    <div className={styles.dl}><b style={{ background: '#bdbdbd' }} /><span className={styles.sk} /></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className={styles.toast} data-toast>
            <em>✓</em>
            <span data-toast-txt />
          </div>
        </div>
      </div>
    </div>
  );
}
