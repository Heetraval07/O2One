import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { useApi, useMeta } from '../lib/hooks';
import { formatDate } from '../lib/format';
import { serviceBySlug } from '../content/services';
import Markdown from '../components/ui/Markdown';
import CtaBand from '../components/ui/CtaBand';
import { PostCard } from '../components/sections/Cards';
import { ErrorState, SkeletonLines } from '../components/ui/States';
import { ArrowRight, Linkedin, Chat } from '../components/ui/Icons';
import NotFound from './NotFound';
import styles from './BlogPost.module.css';

const extraLinks = {
  'odoo-uae-vat-e-invoicing': { name: 'UAE VAT & E-invoicing', to: '/e-invoicing' },
};

function InlineCta() {
  return (
    <aside className={styles.inlineCta} aria-label="Free health checkup">
      <p>See what your business is missing.</p>
      <Link to="/contact" className="btn btn--sm">
        Book Checkup
      </Link>
    </aside>
  );
}

export default function BlogPost() {
  const { slug } = useParams();
  const [reload, setReload] = useState(0);
  const { data: post, error, loading } = useApi(`post:${slug}:${reload}`, (signal) => api.post(slug, { signal }));
  useMeta(post ? `${post.title} | O2One Blog` : 'Blog | O2One', post?.excerpt);
  const [copied, setCopied] = useState(false);

  if (error?.status === 404) return <NotFound />;

  const related = post?.relatedService && (serviceBySlug[post.relatedService]
    ? { name: serviceBySlug[post.relatedService].name, to: `/services/${post.relatedService}` }
    : extraLinks[post.relatedService]);
  const url = typeof window !== 'undefined' ? window.location.href : '';

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked: nothing to do */
    }
  };

  return (
    <>
      <header className={styles.hero}>
        <div className={styles.heroMedia} aria-hidden="true">
          {post?.coverImage ? <img src={post.coverImage} alt="" decoding="async" /> : <span>Photo · {post?.categoryName || 'article'}</span>}
        </div>
        <div className="container">
          <div className={styles.titleCard}>
            <p className={styles.meta}>
              <Link to={post ? `/blog?category=${post.categorySlug}` : '/blog'}>{post?.categoryName || 'Blog'}</Link>
            </p>
            <h1 className={styles.title}>{post?.title || (loading ? 'Loading…' : 'Article')}</h1>
            {post && (
              <p className={styles.byline}>
                {post.authorName}
                {post.authorRole ? `, ${post.authorRole}` : ''} · <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time> ·{' '}
                {post.readMinutes} minutes
              </p>
            )}
          </div>
        </div>
      </header>

      <section className={styles.body}>
        <div className="container">
          {loading && (
            <div className={styles.article}>
              <SkeletonLines rows={8} />
            </div>
          )}
          {error && <ErrorState error={error} onRetry={() => setReload((n) => n + 1)} />}
          {post && (
            <>
              <p className={`lead ${styles.article} ${styles.excerpt}`}>{post.excerpt}</p>
              <Markdown source={post.body} className={`${styles.article} ${styles.prose}`} insert={<InlineCta />} insertAfterHeading={1} />

              <div className={`${styles.article} ${styles.share}`}>
                <span>Share:</span>
                <a
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Share on LinkedIn (opens in a new tab)"
                >
                  <Linkedin size={20} />
                </a>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(`${post.title} ${url}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Share on WhatsApp (opens WhatsApp)"
                >
                  <Chat size={20} />
                </a>
                <button type="button" onClick={copy} className="text-link">
                  {copied ? 'Link copied' : 'Copy link'}
                </button>
              </div>
            </>
          )}
        </div>
      </section>

      {post && (related || post.story) && (
        <section className="section section--tight section--grey" aria-label="Related">
          <div className={`container ${styles.cards}`}>
            {related && (
              <Link to={related.to} className={`card-fx ${styles.card}`}>
                <span className="eyebrow">Related service</span>
                <span className={styles.cardTitle}>
                  {related.name} <ArrowRight size={18} />
                </span>
              </Link>
            )}
            {post.story && (
              <Link to={`/customer-stories/${post.story.slug}`} className={`card-fx ${styles.card}`}>
                <span className="eyebrow">Customer story</span>
                <span className={styles.cardTitle}>
                  {post.story.title} <ArrowRight size={18} />
                </span>
              </Link>
            )}
          </div>
        </section>
      )}

      {post?.related?.length > 0 && (
        <section className="section section--tight" aria-labelledby="related-title">
          <div className="container">
            <h2 id="related-title" className="h2" style={{ marginBottom: 'var(--s4)' }}>
              Keep reading
            </h2>
            <ul className={styles.relatedGrid} role="list">
              {post.related.map((p) => (
                <li key={p.slug}>
                  <PostCard post={p} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
      <CtaBand />
    </>
  );
}
