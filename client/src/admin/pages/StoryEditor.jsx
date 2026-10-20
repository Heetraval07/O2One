import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { industries } from '../../content/industries';
import { admin } from '../api';
import { DeleteButton, ErrorNote, Field, Loading, PageHead, fromLocalInput, slugify, toLocalInput, useToast } from '../ui';

const SERVICES = [
  ['business-consultation', 'Business Consultation'],
  ['odoo-services', 'Odoo Services'],
  ['custom-industry-solutions', 'Custom Industry Solutions'],
  ['ai-automation', 'AI & Automation'],
];

const EMPTY = {
  title: '', slug: '', clientName: '', industry: industries[0].name, country: 'UAE', serviceSlug: 'odoo-services', apps: '',
  summary: '', challenge: '', approach: [''], results: [{ value: '', label: '' }], quote: '', quoteAuthor: '', coverImage: '',
  isFeatured: false, isSample: false, isPublished: false, publishedAt: '',
};

/** Editable list of text lines (the approach steps). */
function StepList({ items, onChange }) {
  const move = (i, d) => {
    const next = [...items];
    const j = i + d;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  return (
    <ol className="adm-rows">
      {items.map((text, i) => (
        <li key={i}>
          <span className="adm-row-num">{i + 1}</span>
          <input className="adm-input" aria-label={`Step ${i + 1}`} value={text} maxLength={120} onChange={(e) => onChange(items.map((t, k) => (k === i ? e.target.value : t)))} placeholder="e.g. Business Health Checkup" />
          <button type="button" className="adm-icon-btn" aria-label={`Move step ${i + 1} up`} disabled={i === 0} onClick={() => move(i, -1)}>↑</button>
          <button type="button" className="adm-icon-btn" aria-label={`Move step ${i + 1} down`} disabled={i === items.length - 1} onClick={() => move(i, 1)}>↓</button>
          <button type="button" className="adm-icon-btn" aria-label={`Remove step ${i + 1}`} onClick={() => onChange(items.filter((_, k) => k !== i))}>×</button>
        </li>
      ))}
      <li><button type="button" className="adm-btn adm-btn--ghost adm-btn--sm" disabled={items.length >= 12} onClick={() => onChange([...items, ''])}>Add a step</button></li>
    </ol>
  );
}

/** Editable list of { number, label } results, e.g. "10 weeks" / "to go live". */
function ResultList({ items, onChange }) {
  const edit = (i, patch) => onChange(items.map((r, k) => (k === i ? { ...r, ...patch } : r)));
  return (
    <ul className="adm-rows adm-rows--pairs">
      {items.map((r, i) => (
        <li key={i}>
          <input className="adm-input" aria-label={`Result ${i + 1} number`} value={r.value} maxLength={40} placeholder="10 weeks" onChange={(e) => edit(i, { value: e.target.value })} />
          <input className="adm-input" aria-label={`Result ${i + 1} label`} value={r.label} maxLength={80} placeholder="to go live" onChange={(e) => edit(i, { label: e.target.value })} />
          <button type="button" className="adm-icon-btn" aria-label={`Remove result ${i + 1}`} onClick={() => onChange(items.filter((_, k) => k !== i))}>×</button>
        </li>
      ))}
      <li><button type="button" className="adm-btn adm-btn--ghost adm-btn--sm" disabled={items.length >= 8} onClick={() => onChange([...items, { value: '', label: '' }])}>Add a result</button></li>
    </ul>
  );
}

export default function StoryEditor() {
  const { id } = useParams();
  const editing = id && id !== 'new';
  const navigate = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState({ ...EMPTY, publishedAt: toLocalInput() });
  const [slugTouched, setSlugTouched] = useState(false);
  const [loaded, setLoaded] = useState(!editing);
  const [loadError, setLoadError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!editing) return undefined;
    const ctrl = new AbortController();
    admin
      .story(id, { signal: ctrl.signal })
      .then((s) => {
        setForm({
          ...EMPTY, ...s, apps: s.apps || '', quote: s.quote || '', quoteAuthor: s.quoteAuthor || '', coverImage: s.coverImage || '',
          approach: s.approach.length ? s.approach : [''], results: s.results.length ? s.results : [{ value: '', label: '' }],
          publishedAt: toLocalInput(s.publishedAt),
        });
        setSlugTouched(true);
        setLoaded(true);
      })
      .catch((err) => err.name !== 'AbortError' && setLoadError(err));
    return () => ctrl.abort();
  }, [id, editing]);

  useEffect(() => {
    if (!dirty) return undefined;
    const warn = (e) => e.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const set = (patch) => {
    setForm((f) => ({ ...f, ...patch }));
    setDirty(true);
  };

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const data = {
      ...form,
      approach: form.approach.map((s) => s.trim()).filter(Boolean),
      results: form.results.filter((r) => r.value.trim() || r.label.trim()),
      publishedAt: fromLocalInput(form.publishedAt),
    };
    try {
      if (editing) {
        await admin.saveStory(id, data);
        toast('Saved');
        setDirty(false);
      } else {
        const r = await admin.createStory(data);
        setDirty(false);
        toast('Story created');
        navigate(`/admin/stories/${r.id}`, { replace: true });
      }
    } catch (err) {
      setError(err);
      toast(err.fields ? 'Please check the highlighted fields.' : err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  if (loadError) return <ErrorNote error={loadError} />;
  if (!loaded) return <Loading />;
  const f = error?.fields || {};
  const industryOptions = industries.some((i) => i.name === form.industry) ? industries.map((i) => i.name) : [form.industry, ...industries.map((i) => i.name)];

  return (
    <>
      <PageHead title={editing ? 'Edit story' : 'New story'} sub={editing ? `/customer-stories/${form.slug}` : 'Add a customer story to the website.'}>
        <Link to="/admin/stories" className="adm-btn adm-btn--ghost">← Stories</Link>
        {editing && form.isPublished && <a className="adm-btn adm-btn--ghost" href={`/customer-stories/${form.slug}`} target="_blank" rel="noopener noreferrer">View live</a>}
      </PageHead>

      <form className="adm-editor" onSubmit={save} noValidate>
        <div className="adm-editor-main">
          <section className="adm-card adm-form adm-grid">
            <Field label="Title" error={f.title} wide>
              {(p) => <input {...p} className="adm-input adm-input--lg" value={form.title} maxLength={200} onChange={(e) => set({ title: e.target.value, ...(slugTouched ? {} : { slug: slugify(e.target.value) }) })} required />}
            </Field>
            <Field label="Client name" error={f.clientName} hint="Use 'Sample …' for placeholder stories.">
              {(p) => <input {...p} className="adm-input" value={form.clientName} maxLength={160} onChange={(e) => set({ clientName: e.target.value })} required />}
            </Field>
            <Field label="Country" error={f.country}>
              {(p) => <input {...p} className="adm-input" value={form.country} maxLength={80} onChange={(e) => set({ country: e.target.value })} required />}
            </Field>
            <Field label="Industry" error={f.industry}>
              {(p) => <select {...p} className="adm-input" value={form.industry} onChange={(e) => set({ industry: e.target.value })}>{industryOptions.map((n) => <option key={n}>{n}</option>)}</select>}
            </Field>
            <Field label="Service" error={f.serviceSlug}>
              {(p) => <select {...p} className="adm-input" value={form.serviceSlug} onChange={(e) => set({ serviceSlug: e.target.value })}>{SERVICES.map(([s, n]) => <option key={s} value={s}>{n}</option>)}</select>}
            </Field>
            <Field label="Odoo apps (optional)" wide hint="e.g. Sales, Inventory, Accounting">
              {(p) => <input {...p} className="adm-input" value={form.apps} maxLength={255} onChange={(e) => set({ apps: e.target.value })} />}
            </Field>
            <Field label="Summary" error={f.summary} wide hint={`${form.summary.length}/400 · shown on story cards`}>
              {(p) => <textarea {...p} className="adm-input" rows={3} maxLength={400} value={form.summary} onChange={(e) => set({ summary: e.target.value })} required />}
            </Field>
            <Field label="The challenge" error={f.challenge} wide>
              {(p) => <textarea {...p} className="adm-input" rows={6} value={form.challenge} onChange={(e) => set({ challenge: e.target.value })} required />}
            </Field>
          </section>

          <section className="adm-card">
            <h2>Our approach</h2>
            <p className="adm-hint">The steps we took, in order.</p>
            <StepList items={form.approach} onChange={(approach) => set({ approach })} />
            {f.approach && <p className="adm-error">{f.approach}</p>}
          </section>

          <section className="adm-card">
            <h2>Results</h2>
            <p className="adm-hint">A number and what it means, e.g. "10 weeks" and "to go live".</p>
            <ResultList items={form.results} onChange={(results) => set({ results })} />
            {f.results && <p className="adm-error" role="alert">{f.results}</p>}
          </section>

          <section className="adm-card adm-form adm-grid">
            <h2 className="adm-wide">Client quote (optional)</h2>
            <Field label="Quote" error={f.quote} wide>
              {(p) => <textarea {...p} className="adm-input" rows={3} maxLength={500} value={form.quote} onChange={(e) => set({ quote: e.target.value })} />}
            </Field>
            <Field label="Who said it" error={f.quoteAuthor} wide>
              {(p) => <input {...p} className="adm-input" value={form.quoteAuthor} maxLength={160} placeholder="Name, role, company" onChange={(e) => set({ quoteAuthor: e.target.value })} />}
            </Field>
          </section>
        </div>

        <aside className="adm-editor-side">
          <section className="adm-card">
            <h2>Publish</h2>
            <Field label="Status">
              {(p) => (
                <select {...p} className="adm-input" value={form.isPublished ? 'published' : 'draft'} onChange={(e) => set({ isPublished: e.target.value === 'published' })}>
                  <option value="draft">Draft (hidden)</option>
                  <option value="published">Published</option>
                </select>
              )}
            </Field>
            <Field label="Publish date and time" error={f.publishedAt} hint="A later date schedules it.">
              {(p) => <input {...p} className="adm-input" type="datetime-local" value={form.publishedAt} onChange={(e) => set({ publishedAt: e.target.value })} />}
            </Field>
            <label className="adm-check"><input type="checkbox" checked={form.isFeatured} onChange={(e) => set({ isFeatured: e.target.checked })} /> Featured (shown first)</label>
            <label className="adm-check"><input type="checkbox" checked={form.isSample} onChange={(e) => set({ isSample: e.target.checked })} /> Sample story (shows a "Sample" badge)</label>
            <div className="adm-actions">
              <button className="adm-btn adm-btn--primary" disabled={busy}>{busy ? 'Saving…' : editing ? 'Save changes' : 'Create story'}</button>
            </div>
            {editing && (
              <div className="adm-actions">
                <DeleteButton label="Delete story" onDelete={async () => {
                  await admin.deleteStory(id);
                  setDirty(false);
                  toast('Story deleted');
                  navigate('/admin/stories');
                }} />
              </div>
            )}
          </section>
          <section className="adm-card">
            <h2>Details</h2>
            <Field label="Web address" error={f.slug} hint={`/customer-stories/${form.slug || '…'}`}>
              {(p) => <input {...p} className="adm-input" value={form.slug} maxLength={160} onChange={(e) => { setSlugTouched(true); set({ slug: slugify(e.target.value) }); }} required />}
            </Field>
            <Field label="Cover image address (optional)" error={f.coverImage}>
              {(p) => <input {...p} className="adm-input" value={form.coverImage} maxLength={255} placeholder="https://…" onChange={(e) => set({ coverImage: e.target.value })} />}
            </Field>
          </section>
        </aside>
      </form>
    </>
  );
}
