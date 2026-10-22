import { Link } from 'react-router-dom';
import styles from './Logo.module.css';

/**
 * The O2One Consultants logo, shown exactly as supplied (public/logo.png is the original file, untouched).
 * `onInk` (the dark footer) uses the supplied white-lettering, transparent-background version, public/footer-logo.png, as is.
 */
export default function Logo({ onInk = false, onClick }) {
  return (
    <Link to="/" className={`${styles.logo} ${onInk ? styles.footer : ''}`} onClick={onClick} aria-label="O2One Consultants, home">
      {onInk ? (
        <img src="/footer-logo.png" alt="O2One Consultants" className={styles.img} width="855" height="292" />
      ) : (
        <img src="/logo.png" alt="O2One Consultants" className={styles.img} width="4800" height="1640" />
      )}
    </Link>
  );
}
