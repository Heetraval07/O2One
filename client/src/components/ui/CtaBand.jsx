import { CheckupButton } from './Buttons';
import Reveal from './Reveal';
import styles from './CtaBand.module.css';

/** Full-width soft orange band. Always the last section before the footer. */
export default function CtaBand({
  id,
  eyebrow,
  title = 'Two hours. One conversation. On us.',
  text = 'Let us do a Health Checkup for your business.',
  tags,
  buttonLabel,
  buttonState,
}) {
  return (
    <section id={id} className={styles.band} aria-labelledby={id ? `${id}-title` : 'cta-title'}>
      <Reveal className={`container ${styles.inner}`}>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h2 id={id ? `${id}-title` : 'cta-title'} className="h2">
          {title}
        </h2>
        {text && <p className={styles.text}>{text}</p>}
        {tags && (
          <ul className={`tag-list ${styles.tags}`}>
            {tags.map((t) => (
              <li key={t} className="badge badge--line">
                {t}
              </li>
            ))}
          </ul>
        )}
        <CheckupButton label={buttonLabel} state={buttonState} />
      </Reveal>
    </section>
  );
}
