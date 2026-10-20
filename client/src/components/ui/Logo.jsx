import { Link } from 'react-router-dom';
import styles from './Logo.module.css';

/** Wordmark: "O2One" in Cormorant 600 + "CONSULTANTS" letter-spaced. Swap for the logo file when supplied. */
export default function Logo({ onInk = false, onClick }) {
  return (
    <Link to="/" className={`${styles.logo} ${onInk ? styles.onInk : ''}`} onClick={onClick} aria-label="O2One Consultants, home">
      <span className={styles.word} aria-hidden="true">
        O<span className={styles.two}>2</span>One
      </span>
      <span className={styles.sub} aria-hidden="true">
        Consultants
      </span>
    </Link>
  );
}
