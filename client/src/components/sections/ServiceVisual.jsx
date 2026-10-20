import styles from './ServiceVisual.module.css';

/**
 * Brand-built visual for a service (number + name on ink with an orange block).
 * Used until service photography or product screenshots are supplied.
 */
export default function ServiceVisual({ service, variant = 0 }) {
  return (
    <div className={`${styles.visual} ${styles[`v${variant % 4}`]}`} aria-hidden="true">
      <span className={`num ${styles.num}`}>{service.number}</span>
      <span className={styles.name}>{service.name}</span>
      <span className={styles.block} />
    </div>
  );
}
