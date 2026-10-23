import { useEffect, useRef } from 'react';
import styles from './HeroDashboard.module.css';

/**
 * The supplied "Hero dashboard animation" (Al Nahda Trading), ported from the standalone HTML file into a component.
 * It is authored on a fixed 1200 x 720 stage that is scaled to the width of its box. The markup is static JSX; the
 * numbers, chart, activity feed and notifications are driven by the same sequence as the original, imperatively, inside
 * one effect that cleans up every timer, frame and observer. Elements are found by data-o within this component's own
 * root, so there are no document-wide ids. All styles live in HeroDashboard.module.css.
 */
const STAGE_W = 1200;

const MONTHS = ['Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'];
const THIS_YEAR = [720, 780, 760, 840, 910, 880, 960, 1010, 990, 1080, 1150, 1248]; // AED thousands
const LAST_YEAR = [610, 650, 640, 700, 720, 710, 760, 790, 770, 820, 860, 905];

// Drawings for the feed rows, which are created outside React
const ICON_PATHS = {
  wa: '<path d="M20 12a8 8 0 0 1-11.6 7.1L4 20l1-4.2A8 8 0 1 1 20 12z"/>',
  pay: '<rect x="3" y="6" width="18" height="12" rx="1"/><path d="M3 10h18M7 15h3"/>',
  stock: '<path d="M12 3 3 7.5v9L12 21l9-4.5v-9z"/><path d="m3 7.5 9 4.5 9-4.5M12 12v9"/>',
  inv: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/>',
  hr: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/>',
  vat: '<path d="M4 20V4M4 20h16M8 16l4-5 3 3 5-6"/>',
};

const EVENTS = [
  { ic: 'wa', t: 'New order <b>SO-2291</b>', m: 'Al Noor Trading · 40 pcs', amt: 'AED 18,600', ord: 1, src: 'WhatsApp', br: 0, brv: 18600 },
  { ic: 'pay', t: 'Payment in · <b>INV-1042</b>', m: 'Gulf Horizon Distribution', amt: '+ AED 48,200', pos: 1, pay: 48200, toast: ['Payment received', 'Gulf Horizon · INV-1042', 'AED 48,200'] },
  { ic: 'stock', t: 'Stock updated · <b>Item A</b>', m: 'Dubai warehouse · 120 units', amt: 'Synced', stk: 1 },
  { ic: 'inv', t: 'VAT invoice <b>INV-1043</b> sent', m: 'Sent by email and WhatsApp', amt: 'AED 26,750' },
  { ic: 'wa', t: 'New order <b>SO-2292</b>', m: 'Al Safa Stores · 12 pcs', amt: 'AED 7,940', ord: 1, src: 'WhatsApp', br: 2, brv: 7940 },
  { ic: 'pay', t: 'Payment in · <b>INV-1038</b>', m: 'Al Safa General Trading', amt: '+ AED 31,500', pos: 1, pay: 31500, toast: ['Payment received', 'Al Safa · INV-1038', 'AED 31,500'] },
  { ic: 'hr', t: 'Payroll ready for <b>42 staff</b>', m: 'Attendance and overtime included', amt: 'Approved' },
  { ic: 'vat', t: 'VAT return <b>Q3 2026</b> ready', m: 'Figures pulled from all branches', amt: 'Ready' },
];

const svgIcon = { viewBox: '0 0 24 24' };

export default function HeroDashboard() {
  const rootRef = useRef(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;

    const o = (name) => root.querySelector(`[data-o="${name}"]`);
    const all = (name) => root.querySelectorAll(`[data-o="${name}"]`);
    const stage = o('stage');
    const fmt = (n) => Math.round(n).toLocaleString('en-US');

    let alive = true;
    const timers = new Set();
    const frames = new Set();
    const later = (ms, fn) => {
      const id = setTimeout(() => {
        timers.delete(id);
        if (alive) fn();
      }, ms);
      timers.add(id);
      return id;
    };
    const frame = (fn) => {
      const id = requestAnimationFrame((t) => {
        frames.delete(id);
        if (alive) fn(t);
      });
      frames.add(id);
    };

    /* ---------- scale the 1200 x 720 stage to its box ---------- */
    const fit = () => {
      stage.style.transform = `scale(${root.clientWidth / STAGE_W})`;
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(root);

    /* ---------- state ---------- */
    const S = { rev: 1248500, rec: 312400, ord: 486, stk: 99.8 };
    const K = { rev: o('rev'), rec: o('rec'), ord: o('ord'), stk: o('stk') };
    const shown = { rev: 0, rec: 0, ord: 0, stk: 0 };
    const tween = (key, to, dur, dec) => {
      const from = shown[key];
      const t0 = performance.now();
      const f = (t) => {
        const k = Math.min(1, (t - t0) / dur);
        const e = 1 - (1 - k) ** 3;
        const v = from + (to - from) * e;
        shown[key] = v;
        K[key].textContent = dec ? v.toFixed(dec) : fmt(v);
        if (k < 1) frame(f);
      };
      f(t0);
    };
    const countEl = (el, to, dur, pre) => {
      const t0 = performance.now();
      const f = (t) => {
        const k = Math.min(1, (t - t0) / dur);
        const e = 1 - (1 - k) ** 3;
        el.textContent = (pre || '') + fmt(to * e);
        if (k < 1) frame(f);
      };
      f(t0);
    };

    /* ---------- revenue chart ---------- */
    const svg = o('chart');
    const plot = o('plot');
    const NS = 'http://www.w3.org/2000/svg';
    const pad = { l: 34, r: 8, t: 10, b: 20 };
    const min = 500;
    const max = 1300;
    let PW;
    let PH;
    const X = (i) => pad.l + (i * (PW - pad.l - pad.r)) / (MONTHS.length - 1);
    const Y = (v) => pad.t + (1 - (v - min) / (max - min)) * (PH - pad.t - pad.b);
    const el = (tag, attrs, parent) => {
      const e = document.createElementNS(NS, tag);
      Object.keys(attrs).forEach((k) => e.setAttribute(k, attrs[k]));
      (parent || svg).appendChild(e);
      return e;
    };
    const smooth = (arr) => {
      let d = '';
      arr.forEach((v, i) => {
        const x = X(i);
        const y = Y(v);
        if (!i) {
          d = `M${x} ${y}`;
          return;
        }
        const px = X(i - 1);
        const py = Y(arr[i - 1]);
        const cx = (px + x) / 2;
        d += ` C${cx} ${py} ${cx} ${y} ${x} ${y}`;
      });
      return d;
    };
    let lineA;
    let area;
    let cross;
    let hdot;
    const buildChart = () => {
      PW = plot.clientWidth;
      PH = plot.clientHeight;
      svg.setAttribute('viewBox', `0 0 ${PW} ${PH}`);
      svg.textContent = '';
      const g = el('g', { class: styles.gridl });
      const ax = el('g', { class: styles.axis });
      [600, 800, 1000, 1200].forEach((v) => {
        el('line', { x1: pad.l, x2: PW - pad.r, y1: Y(v), y2: Y(v) }, g);
        const t = el('text', { x: 0, y: Y(v) + 3 }, ax);
        t.textContent = `${(v / 1000).toFixed(1)}M`;
      });
      MONTHS.forEach((m, i) => {
        const t = el('text', { x: X(i), y: PH - 4, 'text-anchor': 'middle' }, ax);
        t.textContent = m;
      });
      el('path', { d: smooth(LAST_YEAR), class: styles.lineB });
      const dA = smooth(THIS_YEAR);
      area = el('path', { d: `${dA} L${X(11)} ${Y(min)} L${X(0)} ${Y(min)} Z`, class: styles.area });
      lineA = el('path', { d: dA, class: styles.lineA });
      const L = lineA.getTotalLength();
      lineA.style.strokeDasharray = L;
      lineA.style.strokeDashoffset = L;
      cross = el('line', { class: styles.cross, y1: pad.t, y2: PH - pad.b });
      hdot = el('circle', { class: styles.hdot, r: 5 });
    };
    const drawChart = () => {
      lineA.style.transition = 'none';
      const L = lineA.getTotalLength();
      lineA.style.strokeDashoffset = L;
      area.classList.remove(styles.on);
      void lineA.getBoundingClientRect();
      lineA.style.transition = 'stroke-dashoffset 1.8s cubic-bezier(.4,0,.2,1)';
      lineA.style.strokeDashoffset = 0;
      area.classList.add(styles.on);
    };
    /* crosshair glides across the months, like someone reading the chart */
    const tip = o('tip');
    const hover = (i) => {
      const x = X(i);
      const y = Y(THIS_YEAR[i]);
      cross.setAttribute('x1', x);
      cross.setAttribute('x2', x);
      cross.style.opacity = 0.35;
      hdot.setAttribute('cx', x);
      hdot.setAttribute('cy', y);
      hdot.style.opacity = 1;
      tip.style.left = `${x}px`;
      tip.style.top = `${y}px`;
      tip.style.opacity = 1;
      const strong = document.createElement('b');
      strong.textContent = `AED ${fmt(THIS_YEAR[i] * 1000)}`;
      tip.replaceChildren(`${MONTHS[i]}${i < 2 ? ' 2025' : ' 2026'}`, strong);
      tip.style.transform = i >= 9 ? 'translate(calc(-100% - 14px),-50%)' : 'translate(-50%,-120%)';
    };
    const unhover = () => {
      cross.style.opacity = 0;
      hdot.style.opacity = 0;
      tip.style.opacity = 0;
    };

    /* ---------- branches ---------- */
    const BR = [612300, 421800, 214400];
    const setBranches = (first) => {
      all('barfill').forEach((b) => {
        b.style.width = `${b.dataset.w}%`;
      });
      BR.forEach((v, i) => {
        if (first) countEl(o(`b${i}`), v, 1400, 'AED ');
        else o(`b${i}`).textContent = `AED ${fmt(v)}`;
      });
    };

    /* ---------- live activity ---------- */
    const list = o('list');
    const items = [];
    const ROW = 58;
    let ei = 0;
    const evEl = (e) => {
      const d = document.createElement('div');
      d.className = styles.ev;
      d.innerHTML =
        `<div class="${styles.ei}"><svg viewBox="0 0 24 24">${ICON_PATHS[e.ic]}</svg></div>` +
        `<div><div class="${styles.et}">${e.t}</div><div class="${styles.em}">${e.m}${e.src ? `<span class="${styles.src}">${e.src}</span>` : ''}</div></div>` +
        `<div class="${styles.amt}${e.pos ? ` ${styles.pos}` : ''}">${e.amt}</div>`;
      return d;
    };
    const layout = () => {
      items.forEach((d, i) => {
        d.style.transform = `translateY(${i * ROW}px)`;
        d.style.opacity = i > 5 ? 0 : 1;
      });
    };
    const bump = (name) => {
      const k = o(name);
      k.classList.remove(styles.bump);
      void k.offsetWidth;
      k.classList.add(styles.bump);
    };
    let toastTimer;
    const pushEvent = (e, quiet) => {
      const d = evEl(e);
      d.style.transform = `translateY(-${ROW}px)`;
      d.style.opacity = 0;
      list.prepend(d);
      items.unshift(d);
      void d.offsetWidth;
      if (!quiet) {
        d.classList.add(styles.new);
        later(1600, () => d.classList.remove(styles.new));
      }
      layout();
      if (items.length > 7) {
        const old = items.pop();
        later(600, () => old.remove());
      }
      if (quiet) return;
      /* the event moves the numbers */
      if (e.pay) {
        S.rec -= e.pay;
        tween('rec', S.rec, 900);
        bump('kRec');
      }
      if (e.ord) {
        S.ord += 1;
        tween('ord', S.ord, 600);
        bump('kOrd');
        S.rev += parseInt(e.amt.replace(/\D/g, ''), 10);
        tween('rev', S.rev, 900);
        bump('kRev');
      }
      if (e.br != null) {
        BR[e.br] += e.brv;
        setBranches(false);
      }
      if (e.stk) bump('kStk');
      if (e.toast) {
        o('tT1').textContent = e.toast[0];
        o('tT2').textContent = e.toast[1];
        o('tT3').textContent = e.toast[2];
        const toast = o('toast');
        toast.classList.add(styles.on);
        clearTimeout(toastTimer);
        timers.delete(toastTimer);
        toastTimer = later(2600, () => toast.classList.remove(styles.on));
      }
    };

    /* ---------- sequence ---------- */
    const navs = all('nav');
    let started = false;
    const intro = () => {
      buildChart();
      /* seed the feed with a few earlier events */
      [EVENTS[7], EVENTS[6], EVENTS[3], EVENTS[2]].forEach((e) => pushEvent(e, true));
      ['kRev', 'kRec', 'kOrd', 'kStk', 'pChart', 'pBr', 'pFeed'].forEach((name, i) => {
        later(500 + i * 110, () => o(name).classList.add(styles.on));
      });
      later(700, () => {
        tween('rev', S.rev, 1600);
        tween('rec', S.rec, 1600);
        tween('ord', S.ord, 1400);
        tween('stk', S.stk, 1600, 1);
        countEl(o('ytd'), THIS_YEAR.reduce((a, b) => a + b, 0) * 1000, 1800);
      });
      later(1100, drawChart);
      later(1400, () => setBranches(true));
      later(2400, () => o('chip').classList.add(styles.on));
      /* live loop */
      const step = () => {
        pushEvent(EVENTS[ei % EVENTS.length]);
        ei += 1;
        navs.forEach((n) => n.classList.remove(styles.on));
        navs[ei % navs.length].classList.add(styles.on);
        later(2700, step);
      };
      later(2800, step);
      /* chart reading */
      const sweep = () => {
        let i = 6;
        const h = () => {
          hover(i);
          i += 1;
          if (i < 12) {
            later(420, h);
          } else {
            later(1400, () => {
              unhover();
              later(5200, sweep);
            });
          }
        };
        h();
      };
      later(3600, sweep);
    };
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !started) {
          started = true;
          intro();
        }
      },
      { threshold: 0.2 },
    );
    io.observe(root);

    return () => {
      alive = false;
      io.disconnect();
      ro.disconnect();
      timers.forEach(clearTimeout);
      frames.forEach(cancelAnimationFrame);
      timers.clear();
      frames.clear();
      /* back to the pre-animation state, so a remount (StrictMode) starts clean */
      list.textContent = '';
      svg.textContent = '';
      tip.style.opacity = 0;
      root.querySelectorAll(`.${styles.panel}, .${styles.chip}, .${styles.toast}`).forEach((n) => n.classList.remove(styles.on, styles.bump));
      navs.forEach((n, i) => n.classList.toggle(styles.on, i === 0));
      all('barfill').forEach((b) => {
        b.style.width = '';
      });
      ['rev', 'rec', 'ord', 'stk', 'ytd'].forEach((name) => {
        o(name).textContent = '0';
      });
      [0, 1, 2].forEach((i) => {
        o(`b${i}`).textContent = 'AED 0';
      });
    };
  }, []);

  return (
    <div
      ref={rootRef}
      className={styles.root}
      role="img"
      aria-label="Business dashboard for a UAE company running live on one system: revenue, receivables, sales orders, stock accuracy, a revenue chart, branch sales and a live activity feed."
    >
      <div className={styles.stage} data-o="stage" aria-hidden="true">
        <div className={styles.win}>
          <div className={styles.chrome}>
            <i />
            <i />
            <i />
            <div className={styles.url}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#8a8a8a" strokeWidth="2.4">
                <rect x="5" y="11" width="14" height="10" rx="1" />
                <path d="M8 11V8a4 4 0 0 1 8 0v3" />
              </svg>
              Al Nahda Trading LLC · Dashboard
            </div>
          </div>
          <div className={styles.body}>
            <div className={styles.side}>
              <div className={styles.mono}>AN</div>
              <div className={`${styles.nav} ${styles.on}`} data-o="nav">
                <svg {...svgIcon}>
                  <rect x="4" y="4" width="6" height="6" rx="1" />
                  <rect x="14" y="4" width="6" height="6" rx="1" />
                  <rect x="4" y="14" width="6" height="6" rx="1" />
                  <rect x="14" y="14" width="6" height="6" rx="1" />
                </svg>
              </div>
              <div className={styles.nav} data-o="nav">
                <svg {...svgIcon}>
                  <circle cx="9" cy="20" r="1.4" />
                  <circle cx="17" cy="20" r="1.4" />
                  <path d="M3 4h2l2.4 11h10.2L20 8H6.2" />
                </svg>
              </div>
              <div className={styles.nav} data-o="nav">
                <svg {...svgIcon}>
                  <path d="M12 3 3 7.5v9L12 21l9-4.5v-9z" />
                  <path d="m3 7.5 9 4.5 9-4.5M12 12v9" />
                </svg>
              </div>
              <div className={styles.nav} data-o="nav">
                <svg {...svgIcon}>
                  <rect x="5" y="3" width="14" height="18" rx="1" />
                  <path d="M8 7h8M8 11h2M12 11h2M8 15h2M12 15h2" />
                </svg>
              </div>
              <div className={styles.nav} data-o="nav">
                <svg {...svgIcon}>
                  <circle cx="9" cy="8" r="3.5" />
                  <path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6 6 0 0 1 3.5 6" />
                </svg>
              </div>
              <div className={styles.nav} data-o="nav">
                <svg {...svgIcon}>
                  <path d="M4 20V4M4 20h16M8 16l4-5 3 3 5-6" />
                </svg>
              </div>
            </div>

            <div className={styles.main}>
              <div className={styles.top}>
                <div>
                  <div className={styles.hello}>Good morning, Faisal</div>
                  <div className={styles.sub}>Here’s how Al Nahda Trading is doing today</div>
                </div>
                <span className={styles.live}>
                  <i />
                  Live
                </span>
                <div className={styles.range}>
                  <span>Week</span>
                  <span className={styles.on}>Month</span>
                  <span>Year</span>
                </div>
              </div>

              <div className={styles.kpis}>
                <div className={`${styles.panel} ${styles.kpi}`} data-o="kRev">
                  <div className={styles.ptitle}>Revenue (MTD)</div>
                  <div className={styles.v}>
                    <small>AED</small>
                    <span data-o="rev">0</span>
                  </div>
                  <div className={styles.d}>
                    <b>▲ 18.4%</b>vs last month
                  </div>
                  <svg className={styles.spark} viewBox="0 0 64 24">
                    <path d="M1 20 9 17 17 18 25 12 33 14 41 8 49 10 57 5 63 3" />
                  </svg>
                </div>
                <div className={`${styles.panel} ${styles.kpi}`} data-o="kRec">
                  <div className={styles.ptitle}>Receivables</div>
                  <div className={styles.v}>
                    <small>AED</small>
                    <span data-o="rec">0</span>
                  </div>
                  <div className={styles.d}>
                    <b className={styles.down}>▼ 6.2%</b>collected faster
                  </div>
                  <svg className={styles.spark} viewBox="0 0 64 24">
                    <path d="M1 5 9 7 17 6 25 11 33 10 41 14 49 13 57 18 63 19" />
                  </svg>
                </div>
                <div className={`${styles.panel} ${styles.kpi}`} data-o="kOrd">
                  <div className={styles.ptitle}>Sales orders</div>
                  <div className={styles.v}>
                    <span data-o="ord">0</span>
                  </div>
                  <div className={styles.d}>
                    <b>▲ 32</b>this week
                  </div>
                  <svg className={styles.spark} viewBox="0 0 64 24">
                    <path d="M1 18 9 16 17 17 25 13 33 11 41 12 49 7 57 8 63 4" />
                  </svg>
                </div>
                <div className={`${styles.panel} ${styles.kpi}`} data-o="kStk">
                  <div className={styles.ptitle}>Stock accuracy</div>
                  <div className={styles.v}>
                    <span data-o="stk">0</span>%
                  </div>
                  <div className={styles.d}>
                    <b>All 3 branches</b>in sync
                  </div>
                  <svg className={styles.spark} viewBox="0 0 64 24">
                    <path d="M1 14 9 12 17 11 25 9 33 8 41 6 49 5 57 4 63 4" />
                  </svg>
                </div>
              </div>

              <div className={styles.grid}>
                <div className={styles.left}>
                  <div className={`${styles.panel} ${styles.chart}`} data-o="pChart">
                    <div className={styles.chead}>
                      <div className={styles.ptitle}>Revenue · last 12 months</div>
                      <div className={styles.big}>
                        AED <span data-o="ytd">0</span>
                      </div>
                    </div>
                    <div className={styles.legend}>
                      <span>
                        <i />
                        This year
                      </span>
                      <span>
                        <i className={styles.ly} />
                        Last year
                      </span>
                    </div>
                    <div className={styles.plot} data-o="plot">
                      <svg data-o="chart" preserveAspectRatio="none" />
                      <div className={styles.tip} data-o="tip" />
                    </div>
                  </div>
                  <div className={`${styles.panel} ${styles.branches}`} data-o="pBr">
                    {[
                      ['Dubai', 86],
                      ['Abu Dhabi', 62],
                      ['Sharjah', 44],
                    ].map(([name, w], i) => (
                      <div key={name} className={styles.br}>
                        <div className={styles.ptitle}>{name}</div>
                        <div className={styles.bn}>
                          Sales <span data-o={`b${i}`}>AED 0</span>
                        </div>
                        <div className={styles.bar}>
                          <i data-o="barfill" data-w={w} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={`${styles.panel} ${styles.feed}`} data-o="pFeed">
                  <div className={styles.ptitle}>
                    Live activity <span>Updated just now</span>
                  </div>
                  <div className={styles.list} data-o="list" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.chip} data-o="chip">
          <i />
          Sales, stock and accounts in one system
        </div>
        <div className={styles.toast} data-o="toast">
          <em>
            <svg {...svgIcon}>
              <path d="M5 12.5l4.5 4.5L19 7.5" />
            </svg>
          </em>
          <div>
            <div className={styles.t1} data-o="tT1">
              Payment received
            </div>
            <div className={styles.t2} data-o="tT2">
              Al Noor Trading · INV-1042
            </div>
          </div>
          <div className={styles.t3} data-o="tT3">
            AED 48,200
          </div>
        </div>
      </div>
    </div>
  );
}
