import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { admin } from '../api';
import {
  DeleteButton, Empty, ErrorNote, Loading, Modal, PageHead, Pager, StatusBadge, Tabs,
  fmtDateTime, useDebounced, useLoad, useToast,
} from '../ui';

const LIMIT = 20;
const STATUS_TABS = ['new', 'confirmed', 'completed', 'cancelled'];

function Detail({ id, onClose, onChanged }) {
  const toast = useToast();
  const [booking, setBooking] = useState(null);
  const [error, setError] = useState(null);
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const ctrl = new AbortController();
    admin
      .booking(id, { signal: ctrl.signal })
      .then((row) => {
        setBooking(row);
        setNotes(row.adminNotes || '');
      })
      .catch((err) => err.name !== 'AbortError' && setError(err));
    return () => ctrl.abort();
  }, [id]);

  const save = async (patch, message) => {
    setBusy(true);
    try {
      const row = await admin.updateBooking(id, patch);
      setBooking(row);
      setNotes(row.adminNotes || '');
      toast(message);
      onChanged();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title={booking ? `${booking.fullName} · ${booking.reference}` : 'Booking'} onClose={onClose} wide>
      {error && <ErrorNote error={error} />}
      {!booking ? (
        <Loading />
      ) : (
        <>
          <dl className="adm-dl">
            <div><dt>Session</dt><dd>{fmtDateTime(booking.slotStart)} Dubai time · {booking.meetingMode === 'in_person' ? 'In person' : 'Online'}</dd></div>
            <div><dt>Status</dt><dd><StatusBadge status={booking.status} /></dd></div>
            <div><dt>Company</dt><dd>{booking.company} · {booking.industry}{booking.country ? ` · ${booking.country}` : ''}</dd></div>
            <div><dt>Email</dt><dd><a href={`mailto:${booking.email}`}>{booking.email}</a></dd></div>
            <div>
              <dt>Phone</dt>
              <dd>
                <a href={`tel:${booking.phone.replace(/[^+\d]/g, '')}`}>{booking.phone}</a>{' · '}
                <a href={`https://wa.me/${booking.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer">WhatsApp</a>
              </dd>
            </div>
            <div><dt>Source</dt><dd>{booking.source === 'vat_readiness' ? 'UAE VAT readiness check' : 'Health checkup'}</dd></div>
            {booking.readinessItems.length > 0 && (
              <div>
                <dt>Ready today</dt>
                <dd><ul className="adm-plain">{booking.readinessItems.map((i) => <li key={i}>✓ {i}</li>)}</ul></dd>
              </div>
            )}
            {booking.message && <div><dt>What is slowing them down</dt><dd className="adm-prewrap">{booking.message}</dd></div>}
            <div><dt>Booked</dt><dd>{fmtDateTime(booking.createdAt)}</dd></div>
          </dl>

          <h3 className="adm-sub">Change status</h3>
          <div className="adm-actions">
            {STATUS_TABS.map((s) => (
              <button key={s} type="button" className={`adm-btn ${booking.status === s ? 'adm-btn--primary' : 'adm-btn--ghost'}`} disabled={busy || booking.status === s} onClick={() => save({ status: s }, `Marked ${s}`)}>
                {s[0].toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
          <p className="adm-hint">Cancelling frees the time slot so someone else can book it.</p>

          <h3 className="adm-sub">Private notes</h3>
          <textarea className="adm-input" rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} aria-label="Private notes" placeholder="Only the team sees this." />
          <div className="adm-actions adm-spread">
            <button type="button" className="adm-btn adm-btn--primary" disabled={busy || notes === (booking.adminNotes || '')} onClick={() => save({ adminNotes: notes }, 'Notes saved')}>
              Save notes
            </button>
            <DeleteButton label="Delete booking" onDelete={async () => {
              await admin.deleteBooking(id);
              toast('Booking deleted');
              onChanged();
              onClose();
            }} />
          </div>
        </>
      )}
    </Modal>
  );
}

export default function Bookings() {
  const [params, setParams] = useSearchParams();
  const set = (patch) =>
    setParams((p) => {
      const next = new URLSearchParams(p);
      for (const [k, v] of Object.entries(patch)) (v === '' || v == null ? next.delete(k) : next.set(k, v));
      if (!('page' in patch)) next.delete('page');
      return next;
    }, { replace: true });

  const status = params.get('status') || 'all';
  const source = params.get('source') || 'all';
  const from = params.get('from') || '';
  const to = params.get('to') || '';
  const page = Number(params.get('page')) || 1;
  const open = Number(params.get('open')) || null;
  const [search, setSearch] = useState(params.get('q') || '');
  const q = useDebounced(search);
  useEffect(() => {
    if (q !== (params.get('q') || '')) set({ q });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const filters = { status, source, from, to, q: params.get('q') || '' };
  const { data, error, loading, reload } = useLoad((signal) => admin.bookings({ ...filters, page, limit: LIMIT }, { signal }), [status, source, from, to, params.get('q'), page]);
  const toast = useToast();

  return (
    <>
      <PageHead title="Bookings" sub="Free Business Health Checkups and UAE VAT readiness checks.">
        <button type="button" className="adm-btn adm-btn--ghost" onClick={() => admin.exportBookings(filters).catch((e) => toast(e.message, 'error'))}>
          Export CSV
        </button>
      </PageHead>

      <div className="adm-toolbar">
        <Tabs
          label="Status"
          value={status}
          onChange={(v) => set({ status: v })}
          items={[
            { value: 'all', label: 'All', count: data ? Object.values(data.counts).reduce((a, b) => a + b, 0) : null },
            ...STATUS_TABS.map((s) => ({ value: s, label: s[0].toUpperCase() + s.slice(1), count: data?.counts[s] })),
          ]}
        />
        <div className="adm-filters">
          <input className="adm-input" type="search" placeholder="Search name, company, email, reference…" aria-label="Search bookings" value={search} onChange={(e) => setSearch(e.target.value)} />
          <select className="adm-input" aria-label="Source" value={source} onChange={(e) => set({ source: e.target.value })}>
            <option value="all">All sources</option>
            <option value="checkup">Health checkup</option>
            <option value="vat_readiness">VAT readiness</option>
          </select>
          <label className="adm-inline">From <input className="adm-input" type="date" value={from} onChange={(e) => set({ from: e.target.value })} /></label>
          <label className="adm-inline">To <input className="adm-input" type="date" value={to} onChange={(e) => set({ to: e.target.value })} /></label>
        </div>
      </div>

      <ErrorNote error={error} />
      {!data ? (
        !error && <Loading />
      ) : data.bookings.length === 0 ? (
        <Empty>No bookings match these filters.</Empty>
      ) : (
        <div className="adm-table-wrap" aria-busy={loading}>
          <table className="adm-table">
            <thead>
              <tr><th>Session (Dubai)</th><th>Name</th><th>Company</th><th>Source</th><th>Status</th><th><span className="adm-sr">Open</span></th></tr>
            </thead>
            <tbody>
              {data.bookings.map((b) => (
                <tr key={b.id}>
                  <td data-label="Session">{fmtDateTime(b.slotStart)}</td>
                  <td data-label="Name"><strong>{b.fullName}</strong><br /><span className="adm-muted">{b.reference}</span></td>
                  <td data-label="Company">{b.company}<br /><span className="adm-muted">{b.industry}</span></td>
                  <td data-label="Source">{b.source === 'vat_readiness' ? 'VAT readiness' : 'Checkup'}</td>
                  <td data-label="Status"><StatusBadge status={b.status} /></td>
                  <td><button type="button" className="adm-btn adm-btn--ghost adm-btn--sm" onClick={() => set({ open: b.id, page })}>View</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {data && <Pager page={page} limit={LIMIT} total={data.total} onPage={(p) => set({ page: p })} />}
      {open && <Detail id={open} onClose={() => set({ open: '', page })} onChanged={reload} />}
    </>
  );
}
