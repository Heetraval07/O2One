import { useEffect, useRef } from 'react';
import styles from './CustomCursor.module.css';

// Elements where the normal cursor is kept: text fields (the I-beam matters), the map, and the side drawers
// (a <dialog> is drawn above everything on the page, including this cursor).
const NATIVE = 'input, textarea, select, iframe, dialog, [contenteditable="true"]';
const CLICKABLE = 'a, button, summary, label, [role="button"], [role="tab"], input[type="submit"], .btn';

/**
 * A small orange dot that follows the mouse exactly, inside a soft ring that trails a little behind and grows
 * over anything clickable. Only on devices with a real mouse; touch screens keep things as they are.
 */
export default function CustomCursor() {
  const dot = useRef(null);
  const ring = useRef(null);

  useEffect(() => {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return undefined;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const html = document.documentElement;
    const dotEl = dot.current;
    const ringEl = ring.current;

    let x = -100;
    let y = -100;
    let rx = x;
    let ry = y;
    let raf = 0;
    let seen = false;

    const frame = () => {
      raf = 0;
      // The ring eases toward the dot; with reduced motion it stays glued to it.
      rx = reduced ? x : rx + (x - rx) * 0.18;
      ry = reduced ? y : ry + (y - ry) * 0.18;
      ringEl.style.transform = `translate3d(${rx}px, ${ry}px, 0) translate(-50%, -50%)`;
      if (Math.abs(x - rx) > 0.1 || Math.abs(y - ry) > 0.1) raf = requestAnimationFrame(frame);
    };
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(frame);
    };

    const onMove = (e) => {
      x = e.clientX;
      y = e.clientY;
      dotEl.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
      if (!seen) {
        seen = true;
        rx = x;
        ry = y;
        html.classList.add('o2-cursor');
      }
      const target = e.target instanceof Element ? e.target : null;
      const native = Boolean(target?.closest(NATIVE));
      html.classList.toggle('o2-native', native);
      dotEl.dataset.hidden = native;
      ringEl.dataset.hidden = native;
      ringEl.dataset.hover = Boolean(!native && target?.closest(CLICKABLE));
      kick();
    };
    const onDown = () => (ringEl.dataset.down = 'true');
    const onUp = () => (ringEl.dataset.down = 'false');
    const onLeave = () => {
      dotEl.dataset.hidden = 'true';
      ringEl.dataset.hidden = 'true';
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('mousedown', onDown);
    window.addEventListener('mouseup', onUp);
    document.addEventListener('mouseleave', onLeave);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('mouseup', onUp);
      document.removeEventListener('mouseleave', onLeave);
      if (raf) cancelAnimationFrame(raf);
      html.classList.remove('o2-cursor', 'o2-native');
    };
  }, []);

  return (
    <>
      <span ref={ring} className={styles.ring} data-hidden="true" aria-hidden="true" />
      <span ref={dot} className={styles.dot} data-hidden="true" aria-hidden="true" />
    </>
  );
}
