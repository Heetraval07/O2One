import { useEffect, useRef } from 'react';
import { Close } from '../ui/Icons';
import styles from './DetailDrawer.module.css';

/**
 * Side drawer built on <dialog>, so focus trapping and Escape come for free.
 * `open` is whether to show it; `children` is rendered inside under the eyebrow and title.
 */
export default function DetailDrawer({ open, onClose, eyebrow, title, lede, children }) {
  const ref = useRef(null);
  useEffect(() => {
    const d = ref.current;
    if (open && d && !d.open) d.showModal();
    if (!open && d?.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className={styles.drawer}
      aria-labelledby="detail-drawer-title"
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
    >
      {open && (
        <div className={styles.drawerInner}>
          <button type="button" className={styles.close} onClick={onClose} aria-label="Close">
            <Close size={22} />
          </button>
          <span className="eyebrow">{eyebrow}</span>
          <h2 id="detail-drawer-title" className="phase-title">
            {title}
          </h2>
          {lede && <p className={styles.lede}>{lede}</p>}
          {children}
        </div>
      )}
    </dialog>
  );
}

export function DrawerBlock({ title, children }) {
  return (
    <div className={styles.block}>
      <h3 className={styles.blockTitle}>{title}</h3>
      {children}
    </div>
  );
}

/** Orange-dotted list (challenges). */
export function DrawerList({ items }) {
  return (
    <ul className={styles.challenges} role="list">
      {items.map((c) => (
        <li key={c}>{c}</li>
      ))}
    </ul>
  );
}

/** Subtle pill tags (solutions, features). */
export function DrawerTags({ items }) {
  return (
    <ul className={styles.chipsList} role="list">
      {items.map((t) => (
        <li key={t} className={styles.chip}>
          {t}
        </li>
      ))}
    </ul>
  );
}

export function DrawerLinks({ children }) {
  return (
    <ul className={styles.links} role="list">
      {children}
    </ul>
  );
}

export function DrawerCta({ children }) {
  return <div className={styles.drawerCta}>{children}</div>;
}

export function DrawerText({ children }) {
  return <p className={styles.description}>{children}</p>;
}
