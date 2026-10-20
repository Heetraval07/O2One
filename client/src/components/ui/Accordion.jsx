import { useId, useState } from 'react';
import { Minus, Plus } from './Icons';
import styles from './Accordion.module.css';

/** FAQ list. Each question is a real button that expands its answer. */
export default function Accordion({ items, defaultOpen = -1 }) {
  const [open, setOpen] = useState(defaultOpen);
  const uid = useId();
  return (
    <div className={styles.list}>
      {items.map((item, i) => {
        const isOpen = open === i;
        const btnId = `${uid}-q${i}`;
        const panelId = `${uid}-a${i}`;
        return (
          <div key={item.q} className={styles.item}>
            <h3 className={styles.heading}>
              <button
                id={btnId}
                type="button"
                className={styles.button}
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpen(isOpen ? -1 : i)}
              >
                <span>{item.q}</span>
                {isOpen ? <Minus size={18} /> : <Plus size={18} />}
              </button>
            </h3>
            <div id={panelId} role="region" aria-labelledby={btnId} className={styles.panel} data-open={isOpen}>
              <div className={styles.panelInner}>
                <p>{item.a}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
