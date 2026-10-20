import { Link } from 'react-router-dom';
import { admin } from '../api';
import { fmtDateTime, ErrorNote, Empty, Loading, PageHead, StatusBadge, useLoad } from '../ui';

function Stat({ to, label, value, note }) {
  return (
    <Link to={to} className="adm-stat">
      <span className="adm-stat-label">{label}</span>
      <strong className="adm-stat-value">{value ?? 0}</strong>
      {note && <span className="adm-stat-note">{note}</span>}
    </Link>
  );
}

function BookingList({ rows, empty }) {
  if (!rows.length) return <Empty>{empty}</Empty>;
  return (
    <ul className="adm-list">
      {rows.map((b) => (
        <li key={b.id}>
          <Link to={`/admin/bookings?open=${b.id}`}>
            <span className="adm-list-main">
              <strong>{b.fullName}</strong>
              <span>{b.company}</span>
            </span>
            <span className="adm-list-side">
              <span>{fmtDateTime(b.slotStart)}</span>
              <StatusBadge status={b.status} />
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default function Dashboard() {
  const { data, error, loading } = useLoad((signal) => admin.dashboard({ signal }), []);
  if (!data) return error ? <ErrorNote error={error} /> : <Loading />;
  const { bookings, subscribers, posts, stories } = data;

  return (
    <>
      <PageHead title="Dashboard" sub="What needs attention today." />
      <ErrorNote error={error} />
      <section className="adm-stats" aria-label="Summary" aria-busy={loading}>
        <Stat to="/admin/bookings?status=new" label="New bookings" value={bookings.new} note={`${bookings.newThisWeek} in the last 7 days`} />
        <Stat to="/admin/bookings?status=confirmed" label="Confirmed sessions" value={bookings.confirmed} />
        <Stat to="/admin/newsletter" label="Newsletter subscribers" value={subscribers.subscribed} />
        <Stat to="/admin/blog" label="Blog posts live" value={posts.live} note={`${posts.draft} draft · ${posts.scheduled} scheduled`} />
        <Stat to="/admin/stories" label="Customer stories live" value={stories.live} note={stories.samples ? `${stories.samples} still marked Sample` : null} />
      </section>
      <div className="adm-cols">
        <section className="adm-card">
          <h2>Coming up</h2>
          <BookingList rows={data.upcoming} empty="No upcoming sessions." />
        </section>
        <section className="adm-card">
          <h2>Latest bookings</h2>
          <BookingList rows={data.recent} empty="No bookings yet." />
        </section>
      </div>
    </>
  );
}
