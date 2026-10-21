import { Link } from 'react-router-dom';
import { useMeta } from '../lib/hooks';
import { CheckupButton } from '../components/ui/Buttons';
import styles from './NotFound.module.css';

export default function NotFound() {
  useMeta('Page not found | O2One Consultants');
  return (
    <section className={styles.wrap}>
      <div className="container">
        <span className={`num ${styles.code}`}>404</span>
        <h1 className="h2">We couldn&rsquo;t find that page.</h1>
        <p className="lead">It may have moved. Here are good places to start.</p>
        <ul className={styles.links} role="list">
          <li><Link to="/">Home</Link></li>
          <li><Link to="/services">Services</Link></li>
          <li><Link to="/#approach">Our approach</Link></li>
          <li><Link to="/blog">Blog</Link></li>
        </ul>
        <CheckupButton />
      </div>
    </section>
  );
}
