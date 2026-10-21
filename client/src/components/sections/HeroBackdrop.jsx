import { useEffect, useRef } from 'react';
import styles from './HeroBackdrop.module.css';

const INK = [26, 26, 26]; // --ink
const CHARCOAL = [60, 60, 60];
const GREY = [95, 95, 95]; // --grey

const rand = (a, b) => a + Math.random() * (b - a);
const pick = (list) => list[Math.floor(Math.random() * list.length)];
const rgba = ([r, g, b], a) => `rgba(${r},${g},${b},${a})`;

/** One circle, drawn once into its own small canvas (glow included) and then just stamped each frame. */
function sprite(kind, radius, color, alpha) {
  const pad = kind === 'orb' ? 0 : kind === 'ring' ? 8 : radius * 2.2; // room for the glow
  const size = Math.ceil((radius + pad) * 2) + 2;
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const g = c.getContext('2d');
  const m = size / 2;

  if (kind === 'orb') {
    const grd = g.createRadialGradient(m, m, 0, m, m, radius);
    grd.addColorStop(0, rgba(color, alpha));
    grd.addColorStop(0.5, rgba(color, alpha * 0.4));
    grd.addColorStop(1, rgba(color, 0));
    g.fillStyle = grd;
    g.beginPath();
    g.arc(m, m, radius, 0, Math.PI * 2);
    g.fill();
  } else if (kind === 'ring') {
    g.shadowColor = rgba(color, 0.25);
    g.shadowBlur = 8;
    g.strokeStyle = rgba(color, alpha);
    g.lineWidth = 1.5;
    g.beginPath();
    g.arc(m, m, radius, 0, Math.PI * 2);
    g.stroke();
  } else {
    if (kind === 'glow') {
      const halo = g.createRadialGradient(m, m, radius * 0.6, m, m, radius + pad);
      halo.addColorStop(0, rgba(color, alpha * 0.25));
      halo.addColorStop(1, rgba(color, 0));
      g.fillStyle = halo;
      g.fillRect(0, 0, size, size);
    }
    g.fillStyle = rgba(color, alpha);
    g.beginPath();
    g.arc(m, m, radius, 0, Math.PI * 2);
    g.fill();
  }
  return c;
}

/** A natural mix: mostly small dots, some with a soft halo, a few rings, a couple of large soft orbs, a few light-grey specks. */
function makeParticle(w, h) {
  const roll = Math.random();
  let p;
  // Black and charcoal read much stronger than orange did on white, so opacities are lower to keep it calm.
  if (roll < 0.06) p = { kind: 'orb', r: rand(30, 52), color: INK, a: rand(0.06, 0.09) };
  else if (roll < 0.22) p = { kind: 'ring', r: rand(6, 13), color: pick([INK, CHARCOAL]), a: rand(0.35, 0.55) };
  else if (roll < 0.5) p = { kind: 'glow', r: rand(3, 6), color: pick([INK, CHARCOAL]), a: rand(0.55, 0.8) };
  else if (roll < 0.9) p = { kind: 'dot', r: rand(2.2, 4.4), color: pick([INK, CHARCOAL, GREY]), a: rand(0.35, 0.7) };
  else p = { kind: 'dot', r: rand(1.8, 3), color: GREY, a: rand(0.2, 0.32) };

  const angle = rand(0, Math.PI * 2);
  const speed = p.kind === 'orb' ? rand(4, 9) : rand(8, 22); // px per second
  return {
    ...p,
    img: sprite(p.kind, p.r, p.color, p.a),
    x: rand(0, w),
    y: rand(0, h),
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    wob: rand(4, 12), // gentle sideways sway on top of the drift
    wobT: rand(4, 9),
    tw: rand(5, 11), // slow twinkle period
    ph: rand(0, Math.PI * 2),
  };
}

/**
 * Floating circles drifting freely across the whole home hero, drawn on one canvas. Each has its own size,
 * colour, opacity, direction and speed, sways a little as it travels, slowly twinkles, and wraps around the
 * edges so the field never empties. Pauses when the hero is off screen or the tab is hidden; stays still for
 * people who ask for reduced motion.
 */
export default function HeroBackdrop() {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas.getContext('2d');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let w = 0;
    let h = 0;
    let particles = [];
    let raf = 0;
    let last = 0;
    let visible = true;

    const resize = () => {
      const box = canvas.parentElement.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = box.width;
      h = box.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // About one circle per 14,000 px²: ~65 on a desktop hero, ~35 on a phone.
      const target = Math.max(26, Math.min(76, Math.round((w * h) / 14000)));
      while (particles.length < target) particles.push(makeParticle(w, h));
      particles.length = target;
      particles.forEach((p) => {
        p.x %= w;
        p.y %= h;
      });
    };

    const draw = (t) => {
      ctx.clearRect(0, 0, w, h);
      const s = t / 1000;
      for (const p of particles) {
        const sway = Math.sin(s * ((Math.PI * 2) / p.wobT) + p.ph) * p.wob;
        const twinkle = reduced ? 1 : 0.78 + 0.22 * Math.sin(s * ((Math.PI * 2) / p.tw) + p.ph);
        ctx.globalAlpha = twinkle;
        ctx.drawImage(p.img, p.x + sway - p.img.width / 2, p.y - p.img.height / 2);
      }
      ctx.globalAlpha = 1;
    };

    const step = (t) => {
      raf = 0;
      const dt = Math.min(0.05, last ? (t - last) / 1000 : 0); // clamp after a pause, so nothing leaps
      last = t;
      const edge = 60;
      for (const p of particles) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (p.x < -edge) p.x = w + edge;
        else if (p.x > w + edge) p.x = -edge;
        if (p.y < -edge) p.y = h + edge;
        else if (p.y > h + edge) p.y = -edge;
      }
      draw(t);
      if (visible && !document.hidden) raf = requestAnimationFrame(step);
    };

    const start = () => {
      if (reduced || raf || !visible || document.hidden) return;
      last = 0;
      raf = requestAnimationFrame(step);
    };
    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };

    resize();
    draw(0);
    start();

    const ro = new ResizeObserver(() => {
      resize();
      draw(performance.now());
    });
    ro.observe(canvas.parentElement);
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) start();
      else stop();
    });
    io.observe(canvas);
    const onVis = () => (document.hidden ? stop() : start());
    document.addEventListener('visibilitychange', onVis);

    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  return (
    <div className={styles.backdrop} aria-hidden="true">
      <canvas ref={ref} className={styles.canvas} />
    </div>
  );
}
