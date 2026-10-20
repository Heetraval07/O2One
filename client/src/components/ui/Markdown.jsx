import { Fragment } from 'react';

/**
 * Renders the small Markdown subset used in blog posts — "## " headings, paragraphs,
 * "- " lists and **bold** — as React elements. No HTML is injected, so content can't run scripts.
 * `insertAfterSection(n)` lets a page drop something (e.g. a CTA banner) after the n-th heading's section.
 */
function inline(text) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) =>
    p.startsWith('**') && p.endsWith('**') ? <strong key={i}>{p.slice(2, -2)}</strong> : <Fragment key={i}>{p}</Fragment>,
  );
}

export function parseBlocks(source) {
  const blocks = [];
  for (const chunk of source.replace(/\r\n/g, '\n').split(/\n{2,}/)) {
    const lines = chunk.split('\n').filter((l) => l.trim());
    if (!lines.length) continue;
    if (lines[0].startsWith('## ')) {
      blocks.push({ type: 'h2', text: lines[0].slice(3).trim() });
      if (lines.length > 1) blocks.push({ type: 'p', text: lines.slice(1).join(' ') });
    } else if (lines.every((l) => /^\s*-\s+/.test(l))) {
      blocks.push({ type: 'ul', items: lines.map((l) => l.replace(/^\s*-\s+/, '')) });
    } else {
      blocks.push({ type: 'p', text: lines.join(' ') });
    }
  }
  return blocks;
}

export default function Markdown({ source, className, insert, insertAfterHeading = 2 }) {
  const blocks = parseBlocks(source || '');
  let headings = 0;
  const out = [];
  blocks.forEach((b, i) => {
    if (b.type === 'h2') {
      headings += 1;
      if (insert && headings === insertAfterHeading + 1) out.push(<Fragment key="insert">{insert}</Fragment>);
      out.push(<h2 key={i}>{b.text}</h2>);
    } else if (b.type === 'ul') {
      out.push(
        <ul key={i}>
          {b.items.map((it, j) => (
            <li key={j}>{inline(it)}</li>
          ))}
        </ul>,
      );
    } else {
      out.push(<p key={i}>{inline(b.text)}</p>);
    }
  });
  if (insert && headings < insertAfterHeading + 1) out.push(<Fragment key="insert">{insert}</Fragment>);
  return <div className={className}>{out}</div>;
}
