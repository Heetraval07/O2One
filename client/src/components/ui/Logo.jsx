import { Link } from 'react-router-dom';
import styles from './Logo.module.css';

/**
 * The O2One Consultants logo, shown exactly as supplied (public/logo.png is the original file, untouched).
 * On dark backgrounds it sits on its own white plate rather than being recoloured.
 */
export default function Logo({ onInk = false, onClick }) {
  return (
    <Link to="/" className={`${styles.logo} ${onInk ? styles.plate : ''}`} onClick={onClick} aria-label="O2One Consultants, home">
      <img src="/logo.png" alt="O2One Consultants" className={styles.img} width="4800" height="1640" />
    </Link>
  );
}
