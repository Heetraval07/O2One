import { useRef } from 'react';
import { useInView, useParallax } from '../../lib/hooks';
import styles from './PhotoSlot.module.css';

/**
 * A photo, or — until real photography is supplied — a quiet placeholder that says what belongs there.
 * The design guide asks for real photos of people and places, never stock or AI imagery.
 * The image wipes in on first view, drifts slightly as you scroll, and zooms gently on hover;
 * the decorative blocks move at a different speed for depth.
 */
export default function PhotoSlot({ src, alt, label, ratio = '4 / 3', accent, className = '', priority = false }) {
  const frameRef = useRef(null);
  const [viewRef, inView] = useInView({ threshold: 0.2 });
  useParallax(frameRef);
  const setRefs = (el) => {
    frameRef.current = el;
    viewRef.current = el;
  };
  return (
    <figure
      ref={setRefs}
      className={`${styles.frame} ${accent ? styles[`accent-${accent}`] : ''} ${className}`}
      style={{ '--ratio': ratio }}
    >
      <div className={`${styles.media} ${priority || inView ? styles.revealed : ''}`}>
        {src ? (
          <div className={styles.zoom}>
            <img src={src} alt={alt} loading={priority ? 'eager' : 'lazy'} decoding="async" className={styles.img} />
          </div>
        ) : (
          <div className={styles.placeholder} role="img" aria-label={alt || label}>
            <span className={styles.caption}>Photo · {label}</span>
          </div>
        )}
      </div>
    </figure>
  );
}
