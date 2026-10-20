import { useState } from 'react';
import { Link } from 'react-router-dom';
import { admin } from '../api';
import { DeleteButton, Empty, ErrorNote, Field, Loading, PageHead, slugify, useLoad, useToast } from '../ui';

function CategoryForm({ initial, onSaved, onCancel }) {
  const toast = useToast();
  const [form, setForm] = useState({ name: initial?.name || '', slug: initial?.slug || '', sortOrder: initial?.sortOrder ?? 0 });
  const [touchedSlug, setTouchedSlug] = useState(Boolean(initial));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await (initial ? admin.saveCategory(initial.id, form) : admin.createCategory(form));
      toast(initial ? 'Category saved' : 'Category added');
      onSaved();
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="adm-card adm-form adm-grid" onSubmit={submit} noValidate>
      <h2 className="adm-wide">{initial ? 'Edit category' : 'New category'}</h2>
      {error && !error.fields?.name && !error.fields?.slug && <p className="adm-alert adm-alert--error adm-wide" role="alert">{error.message}</p>}
      <Field label="Name" error={error?.fields?.name}>
        {(p) => <input {...p} className="adm-input" value={form.name} maxLength={80} onChange={(e) => set({ name: e.target.value, ...(touchedSlug ? {} : { slug: slugify(e.target.value) }) })} required />}
      </Field>
      <Field label="Web address" error={error?.fields?.slug} hint="Used in the blog filter, e.g. /blog?category=odoo">
        {(p) => <input {...p} className="adm-input" value={form.slug} maxLength={60} onChange={(e) => { setTouchedSlug(true); set({ slug: slugify(e.target.value) }); }} required />}
      </Field>
      <Field label="Order" hint="Smaller numbers come first.">
        {(p) => <input {...p} className="adm-input" type="number" value={form.sortOrder} onChange={(e) => set({ sortOrder: e.target.value })} />}
      </Field>
      <div className="adm-actions adm-wide">
        <button className="adm-btn adm-btn--primary" disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
        <button type="button" className="adm-btn adm-btn--ghost" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}

export default function Categories() {
  const { data, error, reload } = useLoad((signal) => admin.categories({ signal }), []);
  const [editing, setEditing] = useState(null); // category | 'new' | null
  const toast = useToast();

  return (
    <>
      <PageHead title="Blog categories" sub="Posts are grouped and filtered by category.">
        <Link to="/admin/blog" className="adm-btn adm-btn--ghost">← Posts</Link>
        <button type="button" className="adm-btn adm-btn--primary" onClick={() => setEditing('new')}>New category</button>
      </PageHead>
      <ErrorNote error={error} />
      {editing && (
        <CategoryForm key={editing === 'new' ? 'new' : editing.id} initial={editing === 'new' ? null : editing} onCancel={() => setEditing(null)} onSaved={() => { setEditing(null); reload(); }} />
      )}
      {!data ? (
        !error && <Loading />
      ) : data.length === 0 ? (
        <Empty>No categories yet.</Empty>
      ) : (
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead><tr><th>Name</th><th>Address</th><th>Posts</th><th>Order</th><th><span className="adm-sr">Actions</span></th></tr></thead>
            <tbody>
              {data.map((c) => (
                <tr key={c.id}>
                  <td data-label="Name"><strong>{c.name}</strong></td>
                  <td data-label="Address"><span className="adm-muted">{c.slug}</span></td>
                  <td data-label="Posts">{c.postCount}</td>
                  <td data-label="Order">{c.sortOrder}</td>
                  <td className="adm-row-actions">
                    <button type="button" className="adm-btn adm-btn--ghost adm-btn--sm" onClick={() => setEditing(c)}>Edit</button>
                    <DeleteButton small onDelete={async () => {
                      try {
                        await admin.deleteCategory(c.id);
                        toast('Category deleted');
                        reload();
                      } catch (err) {
                        toast(err.message, 'error');
                      }
                    }} />
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
