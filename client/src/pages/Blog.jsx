import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';
import { useApi, useMeta } from '../lib/hooks';
import Reveal from '../components/ui/Reveal';
import CtaBand from '../components/ui/CtaBand';
import { PostRow } from '../components/sections/Cards';
import NewsletterForm from '../components/sections/NewsletterForm';
import { EmptyState, ErrorState, SkeletonLines } from '../components/ui/States';
import { Search } from '../components/ui/Icons';
import styles from './Blog.module.css';

const PAGE_SIZE = 6;

function CheckupCard() {
  return (
    <div className={styles.checkup}>
      <p className={styles.checkupTitle}>Free Health Checkup</p>
      <p className="small">Two hours. One conversation. On us.</p>
      <Link to="/contact" className="btn btn--block">
        Book
      </Link>
    </div>
  );
}

export default function Blog() {
  useMeta('Blog | O2One Consultants', 'Insights for owners running on spreadsheets: Odoo, AI and automation, UAE VAT and e-invoicing, and running a business on one system.');
  const [params, setParams] = useSearchParams();
  const category = params.get('category') || 'all';
  const q = params.get('q') || '';
  const [search, setSearch] = useState(q);
  const [state, setState] = useState({ posts: [], page: 0, total: 0, hasMore: false, loading: true, error: null });
  const [retry, setRetry] = useState(0);
  const { data: categories } = useApi('blog:categories', (signal) => api.categories({ signal }));
  const reqRef = useRef(0);

  const load = async (page, replace) => {
    const id = ++reqRef.current;
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const res = await api.posts({ category, q, page, limit: PAGE_SIZE });
      if (id !== reqRef.current) return; // a newer request has started
      setState((s) => ({
        posts: replace ? res.posts : [...s.posts, ...res.posts],
        page: res.page,
        total: res.total,
        hasMore: res.hasMore,
        loading: false,
        error: null,
      }));
    } catch (error) {
      if (id === reqRef.current) setState((s) => ({ ...s, loading: false, error }));
    }
  };

  useEffect(() => {
    load(1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, q, retry]);

  // Debounced search → URL
  useEffect(() => {
    if (search === q) return undefined;
    const t = setTimeout(() => {
      const next = new URLSearchParams(params);
      if (search.trim()) next.set('q', search.trim());
      else next.delete('q');
      setParams(next, { replace: true });
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const setCategory = (slug) => {
    const next = new URLSearchParams(params);
    if (slug === 'all') next.delete('category');
    else next.set('category', slug);
    setParams(next);
  };

  const cats = [{ slug: 'all', name: 'All' }, ...(categories || [])];

  const searchBox = (idSuffix) => (
    <div className={styles.search} role="search">
      <Search size={18} />
      <label htmlFor={`blog-search-${idSuffix}`} className="sr-only">
        Search articles
      </label>
      <input
        id={`blog-search-${idSuffix}`}
        type="search"
        className="input"
        placeholder="Search articles"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
    </div>
  );

  return (
    <>
      <section className={styles.head}>
        <div className="container">
          <Reveal>
            <span className="eyebrow">Resources</span>
            <h1 className="h1">Blog</h1>
            <p className="lead">Insights for owners running on spreadsheets.</p>
          </Reveal>
        </div>
      </section>

      <section className={styles.body}>
        <div className={`container ${styles.layout}`}>
          <div className={styles.mobileTools}>
            {searchBox('m')}
            <div className={styles.chips} role="group" aria-label="Categories">
              {cats.map((c) => (
                <button
                  key={c.slug}
                  type="button"
                  className={`${styles.chip} ${category === c.slug ? styles.chipOn : ''}`}
                  aria-pressed={category === c.slug}
                  onClick={() => setCategory(c.slug)}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.list}>
            <p className="sr-only" aria-live="polite">
              {!state.loading && `${state.total} ${state.total === 1 ? 'article' : 'articles'} found`}
            </p>
            {state.error && <ErrorState error={state.error} onRetry={() => setRetry((n) => n + 1)} />}
            {!state.error && state.posts.length === 0 && state.loading && <SkeletonLines rows={6} />}
            {!state.error && !state.loading && state.posts.length === 0 && (
              <EmptyState title="No articles found.">
                {q ? <>Nothing matches &ldquo;{q}&rdquo;. Try a different word or browse all articles.</> : 'No articles in this category yet.'}
              </EmptyState>
            )}

            {state.posts.map((p, i) => (
              <div key={p.slug}>
                <PostRow post={p} />
                {i === 2 && (
                  <div className={styles.inlineCta}>
                    <CheckupCard />
                  </div>
                )}
              </div>
            ))}

            {state.hasMore && (
              <button
                type="button"
                className={`btn btn--secondary btn--block ${styles.more}`}
                onClick={() => load(state.page + 1, false)}
                disabled={state.loading}
              >
                {state.loading ? <span className="spinner" aria-hidden="true" /> : null}
                {state.loading ? 'Loading…' : 'Load more'}
              </button>
            )}

            <div className={styles.inlineCta}>
              <NewsletterForm compact />
            </div>
          </div>

          <aside className={styles.sidebar} aria-label="Blog tools">
            {searchBox('d')}
            <nav aria-labelledby="cat-title" className={styles.cats}>
              <h2 id="cat-title" className={styles.sideTitle}>
                Categories
              </h2>
              <ul role="list">
                {cats.map((c) => (
                  <li key={c.slug}>
                    <button
                      type="button"
                      className={category === c.slug ? styles.catOn : undefined}
                      aria-pressed={category === c.slug}
                      onClick={() => setCategory(c.slug)}
                    >
                      {c.name}
                      {c.postCount != null && <span>{c.postCount}</span>}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
            <NewsletterForm />
            <CheckupCard />
          </aside>
        </div>
      </section>
      <CtaBand />
    </>
  );
}
