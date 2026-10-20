import { useState } from 'react';
import { Link } from 'react-router-dom';
import { admin } from '../api';
import { DeleteButton, Empty, ErrorNote, Loading, PageHead, StatusBadge, Tabs, fmtDate, useDebounced, useLoad, useToast } from '../ui';

export default function StoriesList() {
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  const q = useDebounced(search);
  const toast = useToast();
  const { data, error, loading, reload } = useLoad((signal) => admin.stories({ status, q, limit: 100 }, { signal }), [status, q]);

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
      <PageHead title="Customer stories" sub="Case studies shown on the website.">
        <Link to="/admin/stories/new" className="adm-btn adm-btn--primary">New story</Link>
      </PageHead>
      <div className="adm-toolbar">
        <Tabs label="Status" value={status} onChange={setStatus} items={[{ value: 'all', label: 'All' }, { value: 'live', label: 'Live' }, { value: 'scheduled', label: 'Scheduled' }, { value: 'draft', label: 'Drafts' }]} />
        <div className="adm-filters">
          <input className="adm-input" type="search" placeholder="Search title or client…" aria-label="Search stories" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>
      <ErrorNote error={error} />
      {!data ? (
        !error && <Loading />
      ) : data.length === 0 ? (
        <Empty>No stories match.</Empty>
      ) : (
        <div className="adm-table-wrap" aria-busy={loading}>
          <table className="adm-table">
            <thead><tr><th>Story</th><th>Industry</th><th>Status</th><th>Date</th><th><span className="adm-sr">Actions</span></th></tr></thead>
            <tbody>
              {data.map((s) => (
                <tr key={s.id}>
                  <td data-label="Story">
                    <Link to={`/admin/stories/${s.id}`}><strong>{s.title}</strong></Link>
                    <br />
                    <span className="adm-muted">{s.clientName}</span>
                    {s.isSample && <span className="adm-tag">Sample</span>}
                    {s.isFeatured && <span className="adm-tag adm-tag--accent">Featured</span>}
                  </td>
                  <td data-label="Industry">{s.industry}</td>
                  <td data-label="Status"><StatusBadge status={s.status} /></td>
                  <td data-label="Date">{fmtDate(s.publishedAt)}</td>
                  <td className="adm-row-actions">
                    {s.status === 'live' && <a className="adm-btn adm-btn--ghost adm-btn--sm" href={`/customer-stories/${s.slug}`} target="_blank" rel="noopener noreferrer">View</a>}
                    <Link className="adm-btn adm-btn--ghost adm-btn--sm" to={`/admin/stories/${s.id}`}>Edit</Link>
                    <button type="button" className="adm-btn adm-btn--ghost adm-btn--sm" onClick={() => act(() => admin.publishStory(s.id, s.status === 'draft'), s.status === 'draft' ? 'Published' : 'Moved to drafts')}>
                      {s.status === 'draft' ? 'Publish' : 'Unpublish'}
                    </button>
                    <DeleteButton small onDelete={() => act(() => admin.deleteStory(s.id), 'Story deleted')} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
