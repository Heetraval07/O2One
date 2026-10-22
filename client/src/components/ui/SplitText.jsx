/**
 * Headline whose words rise out of a mask, one after another, on first paint.
 * A newline in `text` starts a new line on desktop (each line is its own block, so the break is explicit, not left
 * to wrapping); on tablets and phones the lines run on and wrap naturally.
 * Falls back to a plain heading when the title isn't a string.
 */
export default function SplitText({ as: Tag = 'h1', text, className = '', delay = 0, ...rest }) {
  if (typeof text !== 'string') return <Tag className={className} {...rest}>{text}</Tag>;
  const lines = text.split('\n');
  let n = 0; // running word number, so the stagger carries on across lines
  return (
    <Tag className={className} aria-label={text.replace(/\n/g, ' ')} {...rest}>
      {lines.map((line, li) => {
        const words = line.split(' ');
        return (
          <span key={li} className={lines.length > 1 ? 'split-line' : undefined} aria-hidden="true">
            {words.map((w, i) => {
              const k = n++;
              return (
                <span key={i}>
                  <span className="split-word">
                    <span className="split-inner" style={{ '--i': k, '--base': `${delay}ms` }}>
                      {w}
                    </span>
                  </span>
                  {i < words.length - 1 ? ' ' : null}
                </span>
              );
            })}
            {li < lines.length - 1 ? ' ' : null}
          </span>
        );
      })}
    </Tag>
  );
}
