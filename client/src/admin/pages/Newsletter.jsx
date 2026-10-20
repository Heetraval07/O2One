import { useState } from 'react';
import { admin } from '../api';
import { DeleteButton, Empty, ErrorNote, Loading, PageHead, Pager, StatusBadge, Tabs, fmtDate, useDebounced, useLoad, useToast } from '../ui';

const LIMIT = 25;

export default function Newsletter() {
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const q = useDebounced(search);
  const toast = useToast();
  const filters = { status, q };
  const { data, error, loading, reload } = useLoad((signal) => admin.subscribers({ ...filters, page, limit: LIMIT }, { signal }), [status, q, page]);

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
      <PageHead title="Newsletter" sub="People who signed up on the blog.">
        <button type="button" className="adm-btn adm-btn--ghost" onClick={() => admin.exportSubscribers(filters).catch((e) => toast(e.message, 'error'))}>
          Export CSV
        </button>
      </PageHead>
      <div className="adm-toolbar">
        <Tabs
          label="Status"
          value={status}
          onChange={(v) => { setStatus(v); setPage(1); }}
          items={[
            { value: 'all', label: 'All', count: data ? data.counts.subscribed + data.counts.unsubscribed : null },
            { value: 'subscribed', label: 'Subscribed', count: data?.counts.subscribed },
            { value: 'unsubscribed', label: 'Unsubscribed', count: data?.counts.unsubscribed },
          ]}
        />
        <div className="adm-filters">
          <input className="adm-input" type="search" placeholder="Search by email…" aria-label="Search subscribers" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
      </div>
      <ErrorNote error={error} />
      {!data ? (
        !error && <Loading />
      ) : data.subscribers.length === 0 ? (
        <Empty>No subscribers match.</Empty>
      ) : (
        <div className="adm-table-wrap" aria-busy={loading}>
          <table className="adm-table">
            <thead><tr><th>Email</th><th>Status</th><th>Signed up</th><th><span className="adm-sr">Actions</span></th></tr></thead>
            <tbody>
              {data.subscribers.map((s) => (
                <tr key={s.id}>
                  <td data-label="Email"><a href={`mailto:${s.email}`}>{s.email}</a></td>
                  <td data-label="Status"><StatusBadge status={s.status} /></td>
                  <td data-label="Signed up">{fmtDate(s.createdAt)}</td>
                  <td className="adm-row-actions">
                    <button
                      type="button"
                      className="adm-btn adm-btn--ghost adm-btn--sm"
                      onClick={() => act(() => admin.updateSubscriber(s.id, s.status === 'subscribed' ? 'unsubscribed' : 'subscribed'), 'Updated')}
                    >
                      {s.status === 'subscribed' ? 'Unsubscribe' : 'Resubscribe'}
                    </button>
                    <DeleteButton small onDelete={() => act(() => admin.deleteSubscriber(s.id), 'Subscriber deleted')} />
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
