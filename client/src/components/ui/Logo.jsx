import { Link } from 'react-router-dom';
import styles from './Logo.module.css';

/** The O2One Consultants logo. `onInk` swaps in the light version for dark backgrounds. */
export default function Logo({ onInk = false, onClick }) {
  return (
    <Link to="/" className={styles.logo} onClick={onClick} aria-label="O2One Consultants, home">
      <img src={onInk ? '/logo-light.png' : '/logo.png'} alt="O2One Consultants" className={styles.img} width="1400" height="435" />
    </Link>
  );
}
