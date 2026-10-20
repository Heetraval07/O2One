import { useEffect, useState } from 'react';
import { useInView } from '../../lib/hooks';

/**
 * Brings its content into place the first time it scrolls into view.
 * variant: 'up' (default) | 'fade' | 'left' | 'right' | 'zoom'
 * The stagger delay is dropped once the reveal has played, so later hover transitions respond instantly.
 */
export default function Reveal({ as: Tag = 'div', variant = 'up', delay = 0, className = '', children, style, ...rest }) {
  const [ref, inView] = useInView();
  const [settled, setSettled] = useState(false);
  useEffect(() => {
    if (!inView) return undefined;
    const t = setTimeout(() => setSettled(true), delay + 900);
    return () => clearTimeout(t);
  }, [inView, delay]);
  return (
    <Tag
      ref={ref}
      className={`reveal ${variant !== 'up' ? `reveal--${variant}` : ''} ${inView ? 'is-visible' : ''} ${className}`}
      style={delay && !settled ? { ...style, '--reveal-delay': `${delay}ms` } : style}
      {...rest}
    >
      {children}
    </Tag>
  );
}
