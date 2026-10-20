/**
 * Headline whose words rise out of a mask, one after another, on first paint.
 * Falls back to a plain heading when the title isn't a string.
 */
export default function SplitText({ as: Tag = 'h1', text, className = '', delay = 0, ...rest }) {
  if (typeof text !== 'string') return <Tag className={className} {...rest}>{text}</Tag>;
  const words = text.split(' ');
  return (
    <Tag className={className} aria-label={text} {...rest}>
      {words.map((w, i) => (
        <span key={i} aria-hidden="true">
          <span className="split-word">
            <span className="split-inner" style={{ '--i': i, '--base': `${delay}ms` }}>
              {w}
            </span>
          </span>
          {i < words.length - 1 ? ' ' : null}
        </span>
      ))}
    </Tag>
  );
}
