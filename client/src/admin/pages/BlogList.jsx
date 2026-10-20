import { useState } from 'react';
import { Link } from 'react-router-dom';
import { admin } from '../api';
import { DeleteButton, Empty, ErrorNote, Loading, PageHead, Pager, StatusBadge, Tabs, fmtDateTime, useDebounced, useLoad, useToast } from '../ui';

const LIMIT = 20;

export default function BlogList() {
  const [status, setStatus] = useState('all');
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const q = useDebounced(search);
  const toast = useToast();
  const cats = useLoad((signal) => admin.categories({ signal }), []);
  const { data, error, loading, reload } = useLoad((signal) => admin.posts({ status, category, q, page, limit: LIMIT }, { signal }), [status, category, q, page]);

  const act = async (fn, message) => {
    try {
      await fn();
      toast(message);
      reload();
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  return (
    <>
      <PageHead title="Blog" sub="Write, schedule and publish articles.">
        <Link to="/admin/blog/categories" className="adm-btn adm-btn--ghost">Categories</Link>
        <Link to="/admin/blog/new" className="adm-btn adm-btn--primary">New post</Link>
      </PageHead>
      <div className="adm-toolbar">
        <Tabs
          label="Status"
          value={status}
          onChange={(v) => { setStatus(v); setPage(1); }}
          items={[{ value: 'all', label: 'All' }, { value: 'live', label: 'Live' }, { value: 'scheduled', label: 'Scheduled' }, { value: 'draft', label: 'Drafts' }]}
        />
        <div className="adm-filters">
          <input className="adm-input" type="search" placeholder="Search title or address…" aria-label="Search posts" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
          <select className="adm-input" aria-label="Category" value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }}>
            <option value="all">All categories</option>
            {(cats.data || []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>
      <ErrorNote error={error} />
      {!data ? (
        !error && <Loading />
      ) : data.posts.length === 0 ? (
        <Empty>No posts match. <Link to="/admin/blog/new">Write the first one.</Link></Empty>
      ) : (
        <div className="adm-table-wrap" aria-busy={loading}>
          <table className="adm-table">
            <thead><tr><th>Title</th><th>Category</th><th>Status</th><th>Publish date</th><th><span className="adm-sr">Actions</span></th></tr></thead>
            <tbody>
              {data.posts.map((p) => (
                <tr key={p.id}>
                  <td data-label="Title"><Link to={`/admin/blog/${p.id}`}><strong>{p.title}</strong></Link><br /><span className="adm-muted">/blog/{p.slug}</span></td>
                  <td data-label="Category">{p.categoryName}</td>
                  <td data-label="Status"><StatusBadge status={p.status} /></td>
                  <td data-label="Publish date">{fmtDateTime(p.publishedAt)}</td>
                  <td className="adm-row-actions">
                    {p.status === 'live' && <a className="adm-btn adm-btn--ghost adm-btn--sm" href={`/blog/${p.slug}`} target="_blank" rel="noopener noreferrer">View</a>}
                    <Link className="adm-btn adm-btn--ghost adm-btn--sm" to={`/admin/blog/${p.id}`}>Edit</Link>
                    <button type="button" className="adm-btn adm-btn--ghost adm-btn--sm" onClick={() => act(() => admin.publishPost(p.id, p.status === 'draft'), p.status === 'draft' ? 'Published' : 'Moved to drafts')}>
                      {p.status === 'draft' ? 'Publish' : 'Unpublish'}
                    </button>
                    <DeleteButton small onDelete={() => act(() => admin.deletePost(p.id), 'Post deleted')} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {data && <Pager page={page} limit={LIMIT} total={data.total} onPage={setPage} />}
    </>
  );
}
