import { Link } from 'react-router-dom';
import { CHECKUP_LABEL, CHECKUP_PATH } from '../../content/site';
import { ArrowRight } from './Icons';

/** The primary action on every page: book the free Business Health Checkup. */
export function CheckupButton({ label = CHECKUP_LABEL, state, className = '', size, arrow = false, to = CHECKUP_PATH }) {
  return (
    <Link to={to} state={state} className={`btn ${size === 'sm' ? 'btn--sm' : ''} ${className}`}>
      {label}
      {arrow && <ArrowRight size={18} />}
    </Link>
  );
}

export function TextLink({ to, children, className = '' }) {
  return (
    <Link to={to} className={`text-link ${className}`}>
      {children}
      <ArrowRight size={16} />
    </Link>
  );
}
