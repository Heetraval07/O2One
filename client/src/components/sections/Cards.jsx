import { Link } from 'react-router-dom';
import Reveal from '../ui/Reveal';
import { ArrowRight, Award, Eye, Link2, ShieldCheck } from '../ui/Icons';

const VALUE_ICONS = [Award, ShieldCheck, Eye, Link2];
import { stagger } from '../../lib/motion';
import { formatDate } from '../../lib/format';
import { serviceBySlug } from '../../content/services';
import styles from './Cards.module.css';

/** 3-column numbered card grid with 1px line gaps (problems, steps). */
export function NumberedGrid({ items, cols = 3 }) {
  return (
    <ol className={`line-grid cols-${cols} ${styles.numbered}`} role="list">
      {items.map((it, i) => (
        <Reveal as="li" key={it.title} delay={stagger(i, cols)} className={`card-fx ${styles.numCard}`}>
          <span className={`num ${styles.num}`}>{String(i + 1).padStart(2, '0')}</span>
          <h3 className="h3">{it.title}</h3>
          {it.text && <p className="muted">{it.text}</p>}
        </Reveal>
      ))}
    </ol>
  );
}

/** Values: four across, numbered, each with a line icon. The card keeps its white background on hover. */
export function ValueGrid({ items }) {
  return (
    <ul className={styles.values} role="list">
      {items.map((v, i) => {
        const Icon = VALUE_ICONS[i % VALUE_ICONS.length];
        return (
          <Reveal as="li" key={v.title} delay={stagger(i, 4)} className={`card-fx card-fx--plain ${styles.value}`}>
            <div className={styles.valueTop}>
              <span className={`num ${styles.valueNum}`}>{String(i + 1).padStart(2, '0')}</span>
              <span className={`fx-icon ${styles.valueIcon}`}>
                <Icon size={22} />
              </span>
            </div>
            <h3 className="h3">{v.title}</h3>
            <p className="muted">{v.text}</p>
          </Reveal>
        );
      })}
    </ul>
  );
}

export function SampleBadge() {
  return (
    <span className={styles.sample} title="Placeholder content. Replace with an approved client story before launch.">
      Sample
    </span>
  );
}

export function StoryCard({ story, headingLevel: H = 'h3' }) {
  const service = serviceBySlug[story.serviceSlug];
  return (
    <article className={`card-fx ${styles.storyCard}`}>
      <div className={`fx-zoom ${styles.storyMedia}`} aria-hidden="true">
        {story.coverImage ? <img src={story.coverImage} alt="" loading="lazy" decoding="async" /> : <span>{story.industry}</span>}
      </div>
      <div className={styles.storyBody}>
        <p className={styles.meta}>
          {story.industry} · {service?.name || story.serviceSlug}
          {story.isSample && <SampleBadge />}
        </p>
        <H className={styles.storyTitle}>
          <Link to={`/customer-stories/${story.slug}`} className={styles.stretched}>
            {story.title}
          </Link>
        </H>
        <p className="muted small">{story.summary}</p>
        <span className={`text-link ${styles.more}`} aria-hidden="true">
          Read story <ArrowRight size={16} />
        </span>
      </div>
    </article>
  );
}

export function PostRow({ post }) {
  return (
    <article className={styles.postRow}>
      <div className={styles.postText}>
        <p className={styles.meta}>
          {post.categoryName} · <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time> · {post.readMinutes} min
        </p>
        <h3 className={styles.postTitle}>
          <Link to={`/blog/${post.slug}`} className={styles.stretched}>
            {post.title}
          </Link>
        </h3>
        <p className="muted small">{post.excerpt}</p>
      </div>
      <div className={styles.thumb} aria-hidden="true">
        {post.coverImage ? <img src={post.coverImage} alt="" loading="lazy" decoding="async" /> : <span>{post.categoryName}</span>}
      </div>
    </article>
  );
}

export function PostCard({ post }) {
  return (
    <article className={`card-fx ${styles.postCard}`}>
      <p className={styles.meta}>
        {post.categoryName} · {post.readMinutes} min
      </p>
      <h3 className={styles.postTitle}>
        <Link to={`/blog/${post.slug}`} className={styles.stretched}>
          {post.title}
        </Link>
      </h3>
      <span className={`text-link ${styles.more}`} aria-hidden="true">
        Read <ArrowRight size={16} />
      </span>
    </article>
  );
}
