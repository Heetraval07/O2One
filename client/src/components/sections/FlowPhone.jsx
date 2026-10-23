import { useEffect, useRef } from 'react';
import styles from './FlowPhone.module.css';

/**
 * The phone version of the "Tally, Excel, and WhatsApp" animation, ported from the supplied file
 * "Option B - Light with effects-mobile.html" (its .o2m part). Six scattered tools take turns flying into the O2One mark
 * and come out as a tidy grid of connected tools, with a counter, a lit-up channel and a closing message; then it plays again.
 * It is authored on a fixed 400 x 640 stage that is scaled to its box. The markup is static JSX; the sequence is the same
 * as the original, driven imperatively inside one effect that cleans up every timer, animation and observer. Elements are
 * found by data-o inside this component's own root (no document-wide ids). With reduced motion it shows the finished state.
 */
const STAGE_W = 400;
const JX = 200; // where the tools meet, above the mark
const JY = 292;
const NS = 'http://www.w3.org/2000/svg';

// Drawings, as the original has them (also used for the copies that fly out under the mark)
const IC = {
  tally: '<path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z"/><path d="M5 17a3 3 0 0 1 3-3h11M9 8h6M9 11h4"/>',
  excel: '<rect x="4" y="4" width="16" height="16" rx="1"/><path d="M4 10h16M4 15h16M10 4v16"/>',
  wa: '<path d="M20 12a8 8 0 0 1-11.6 7.1L4 20l1-4.2A8 8 0 1 1 20 12z"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="1"/><path d="m3 7 9 6 9-6"/>',
  inv: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6"/>',
  book: '<rect x="5" y="3" width="14" height="18" rx="1"/><path d="M9 3v18M12 8h4M12 12h4"/>',
};

// name, problem, open items, icon, pile position x / y, tilt
const TOOLS = [
  ['Tally', 'Stock mismatch', 3, 'tally', 22, 44, -6],
  ['Excel', 'Which file is final?', 2, 'excel', 222, 34, 5],
  ['WhatsApp', 'Missed orders', 3, 'wa', 120, 104, -3],
  ['Email', 'Missed follow-up', 2, 'mail', 232, 156, 6],
  ['Invoices', 'Payment overdue', 3, 'inv', 12, 164, 4],
  ['Notebooks', 'Lost records', 2, 'book', 124, 212, -5],
];

const Icon = ({ name }) => <svg viewBox="0 0 24 24" dangerouslySetInnerHTML={{ __html: IC[name] }} />;

export default function FlowPhone() {
  const rootRef = useRef(null);

  useEffect(() => {
    const root = rootRef.current;
    const o = (name) => root.querySelector(`[data-o="${name}"]`);
    const all = (name) => [...root.querySelectorAll(`[data-o="${name}"]`)];
    const stage = o('stage');
    const svg = o('svg');
    const tools = all('tool');
    const slots = all('slot');
    const chOn = o('chOn');
    const ch2On = o('ch2On');
    const jn = o('jn');
    const mN = o('count');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let alive = true;
    let timers = [];
    const anims = [];
    const loose = new Set(); // flying copies, sparks and ripples that are in the DOM right now
    let count = 0;
    const at = (ms, fn) => {
      timers.push(
        setTimeout(() => {
          if (alive) fn();
        }, ms),
      );
    };

    const fit = () => {
      stage.style.transform = `scale(${root.clientWidth / STAGE_W})`;
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(root);

    const setChannel = () => {
      const L = 44;
      chOn.style.strokeDasharray = `${L} ${L}`;
      chOn.style.strokeDashoffset = L * (1 - count / 6);
      const L2 = 54;
      ch2On.style.strokeDasharray = `${L2} ${L2}`;
      ch2On.style.strokeDashoffset = L2 * (1 - count / 6);
    };

    // a tidy copy of the tool drops out under the logo and slides into its slot
    const emerge = (i, done) => {
      const col = i % 3;
      const row = Math.floor(i / 3);
      const tx = 18 + col * (116 + 8);
      const ty = 480 + row * (50 + 8);
      const fl = document.createElement('div');
      fl.className = styles.fly;
      fl.innerHTML = `<svg viewBox="0 0 24 24">${IC[TOOLS[i][3]]}</svg>${TOOLS[i][0]}`;
      stage.appendChild(fl);
      loose.add(fl);
      const a = fl.animate(
        [
          { transform: 'translate(142px,384px) scale(.3)', opacity: 0 },
          { transform: 'translate(142px,424px) scale(.7)', opacity: 1, offset: 0.35 },
          { transform: `translate(${tx}px,${ty}px) scale(1)`, opacity: 1 },
        ],
        { duration: 700, easing: 'cubic-bezier(.3,.9,.4,1)' },
      );
      a.onfinish = () => {
        fl.remove();
        loose.delete(fl);
        if (alive) done();
      };
    };

    const ripple = () => {
      const c = document.createElementNS(NS, 'circle');
      c.setAttribute('cx', JX);
      c.setAttribute('cy', JY);
      c.setAttribute('r', '5');
      c.setAttribute('class', styles.rip);
      svg.insertBefore(c, jn);
      loose.add(c);
      at(850, () => {
        c.remove();
        loose.delete(c);
      });
    };

    // a few sparks trail behind each flying tool
    const sparks = (x0, y0) => {
      for (let k = 0; k < 5; k += 1) {
        const c = document.createElementNS(NS, 'circle');
        c.setAttribute('r', 2.6 - k * 0.35);
        c.setAttribute('class', styles.spark);
        svg.appendChild(c);
        loose.add(c);
        const a = c.animate(
          [
            { transform: `translate(${x0}px,${y0}px)`, opacity: 0 },
            { transform: `translate(${(x0 + JX) / 2 + (x0 < JX ? -24 : 24)}px,${(y0 + JY) / 2}px)`, opacity: 0.9, offset: 0.5 },
            { transform: `translate(${JX}px,${JY}px)`, opacity: 0 },
          ],
          { duration: 820, delay: 60 + k * 55, easing: 'cubic-bezier(.5,0,.6,1)' },
        );
        a.onfinish = () => {
          c.remove();
          loose.delete(c);
        };
      }
    };

    const absorb = (i) => {
      const d = tools[i];
      d.classList.add(styles.go);
      d.querySelector(`.${styles.p}`).textContent = 'Syncing…';
      const b = d.querySelector(`.${styles.b}`);
      const n = TOOLS[i][2];
      for (let k = 1; k <= n; k += 1) {
        at(k * 170, () => {
          const v = n - k;
          b.textContent = v > 0 ? v : '✓';
          b.classList.remove(styles.tick);
          void b.offsetWidth;
          b.classList.add(styles.tick);
        });
      }
      at(n * 170 + 220, () => {
        const cx = d.offsetLeft + d.offsetWidth / 2;
        const cy = d.offsetTop + d.offsetHeight / 2;
        const dx = JX - cx;
        const dy = JY - cy;
        d.style.zIndex = 4;
        sparks(cx, cy);
        const a = d.animate(
          [
            { transform: 'translate(0,0) scale(1)', opacity: 1 },
            { transform: `translate(${dx * 0.45 + (dx > 0 ? -18 : 18)}px,${dy * 0.5}px) scale(.75)`, opacity: 1, offset: 0.5 },
            { transform: `translate(${dx}px,${dy}px) scale(.12)`, opacity: 0 },
          ],
          { duration: 820, easing: 'cubic-bezier(.55,0,.7,1)', fill: 'forwards' },
        );
        anims[i] = a;
        a.onfinish = () => {
          if (!alive) return;
          ripple();
          emerge(i, () => {
            count += 1;
            mN.textContent = count;
            setChannel();
            slots[i].classList.add(styles.on);
            slots[i].querySelector(`.${styles.ss}`).textContent = `${TOOLS[i][2]} synced`;
            if (count === 6) {
              root.classList.add(styles.complete);
              at(2800, reset);
            }
          });
        };
      });
    };

    function reset() {
      timers.forEach(clearTimeout);
      timers = [];
      count = 0;
      mN.textContent = '0';
      setChannel();
      root.classList.remove(styles.complete);
      slots.forEach((s) => {
        s.classList.remove(styles.on);
        s.querySelector(`.${styles.ss}`).textContent = 'Waiting';
      });
      tools.forEach((d, i) => {
        if (anims[i]) anims[i].cancel();
        anims[i] = null;
        d.classList.remove(styles.go);
        d.querySelector(`.${styles.p}`).textContent = TOOLS[i][1];
        d.style.zIndex = '';
        d.querySelector(`.${styles.b}`).textContent = TOOLS[i][2];
        d.animate(
          [
            { opacity: 0, transform: 'scale(.85)' },
            { opacity: 1, transform: 'scale(1)' },
          ],
          { duration: 500, delay: i * 90, easing: 'cubic-bezier(.3,1.5,.5,1)', fill: 'backwards' },
        );
      });
      // bottom of the pile leaves first
      [5, 3, 4, 2, 1, 0].forEach((i, k) => at(1600 + k * 1500, () => absorb(i)));
    }

    let started = false;
    let io;
    if (reduced) {
      // no movement: show the finished picture
      tools.forEach((d) => {
        d.style.animation = 'none';
        d.style.opacity = 0;
      });
      count = 6;
      mN.textContent = '6';
      setChannel();
      slots.forEach((s, i) => {
        s.classList.add(styles.on);
        s.querySelector(`.${styles.ss}`).textContent = `${TOOLS[i][2]} synced`;
      });
      root.classList.add(styles.complete);
    } else {
      io = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && !started) {
            started = true;
            reset();
          }
        },
        { threshold: 0.25 },
      );
      io.observe(root);
    }

    return () => {
      alive = false;
      io?.disconnect();
      ro.disconnect();
      timers.forEach(clearTimeout);
      anims.forEach((a) => a?.cancel());
      loose.forEach((n) => n.remove());
      loose.clear();
      // back to the starting picture, so a remount (StrictMode) starts clean
      root.classList.remove(styles.complete);
      mN.textContent = '0';
      slots.forEach((s) => {
        s.classList.remove(styles.on);
        s.querySelector(`.${styles.ss}`).textContent = 'Waiting';
      });
      tools.forEach((d, i) => {
        d.classList.remove(styles.go);
        d.style.zIndex = '';
        d.style.animation = '';
        d.style.opacity = '';
        d.querySelector(`.${styles.p}`).textContent = TOOLS[i][1];
        d.querySelector(`.${styles.b}`).textContent = TOOLS[i][2];
      });
    };
  }, []);

  return (
    <div
      ref={rootRef}
      className={styles.root}
      role="img"
      aria-label="Orders on WhatsApp, stock in Excel, invoices in Tally, leads in email and attendance in notebooks all flowing into one connected O2One system."
    >
      <div className={styles.stage} data-o="stage" aria-hidden="true">
        <div className={`${styles.lbl} ${styles.before}`} style={{ top: 12 }}>
          <i />
          <b>Before</b>&nbsp;Scattered tools
          <i />
        </div>
        <svg className={styles.svg} data-o="svg" viewBox="0 0 400 640">
          <path className={styles.ch} d="M200 266 L200 336" />
          <path className={styles.chOn} data-o="chOn" d="M200 292 L200 336" />
          <path className={styles.ch2} d="M200 420 L200 474" />
          <path className={styles.ch2On} data-o="ch2On" d="M200 420 L200 474" />
          <circle className={styles.jn} data-o="jn" cx="200" cy="292" r="4.5" />
        </svg>
        <div>
          {TOOLS.map(([name, problem, n, icon, x, y, tilt]) => (
            <div key={name} className={styles.tool} data-o="tool" style={{ left: x, top: y, rotate: `${tilt}deg` }}>
              <div className={styles.ico}>
                <Icon name={icon} />
              </div>
              <div className={styles.n}>{name}</div>
              <div className={styles.p}>{problem}</div>
              <span className={styles.b}>{n}</span>
            </div>
          ))}
        </div>
        <div className={styles.mark}>
          <svg viewBox="0 0 100 100">
            <path d="M50 0V100M0 50H100" stroke="#a6a6a6" strokeWidth="1.4" strokeDasharray="4 5" />
            <circle cx="50" cy="50" r="36" fill="none" stroke="#1a1a1a" strokeWidth="8" />
            <circle cx="50" cy="50" r="20" fill="#ff7a3d" />
          </svg>
        </div>
        <div className={`${styles.lbl} ${styles.after}`} style={{ top: 450, justifyContent: 'flex-start', left: 212, right: 'auto' }}>
          <i />
          <b>After</b>&nbsp;One system
        </div>
        <div className={styles.grid}>
          {TOOLS.map(([name, , , icon]) => (
            <div key={name} className={styles.slot} data-o="slot">
              <div className={styles.si}>
                <Icon name={icon} />
              </div>
              <div>
                <div className={styles.sn}>{name}</div>
                <div className={styles.ss}>Waiting</div>
              </div>
              <em />
            </div>
          ))}
        </div>
        <div className={styles.count}>
          <b data-o="count">0</b>of 6 tools connected
        </div>
        <div className={styles.done}>
          <em>✓</em>Every tool connected. One source of truth.
        </div>
      </div>
    </div>
  );
}
