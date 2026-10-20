import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Markdown from '../../components/ui/Markdown';
import { admin } from '../api';
import { DeleteButton, ErrorNote, Field, Loading, PageHead, fromLocalInput, slugify, toLocalInput, useLoad, useToast } from '../ui';

const SERVICES = [
  ['business-consultation', 'Business Consultation'],
  ['odoo-services', 'Odoo Services'],
  ['custom-industry-solutions', 'Custom Industry Solutions'],
  ['ai-automation', 'AI & Automation'],
  ['odoo-uae-vat-e-invoicing', 'UAE VAT & E-invoicing'],
];

const EMPTY = {
  title: '', slug: '', excerpt: '', body: '', categoryId: '', authorName: 'O2One team', authorRole: '', coverImage: '',
  readMinutes: '', relatedService: '', relatedStoryId: '', isPublished: false, publishedAt: '',
};

const TOOLS = [
  { label: 'Heading', hint: '## ', block: true },
  { label: 'Bold', wrap: '**' },
  { label: 'List', hint: '- ', block: true },
];

export default function PostEditor() {
  const { id } = useParams();
  const editing = id && id !== 'new';
  const navigate = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState(EMPTY);
  const [slugTouched, setSlugTouched] = useState(false);
  const [loaded, setLoaded] = useState(!editing);
  const [loadError, setLoadError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [preview, setPreview] = useState(false);
  const bodyRef = useRef(null);

  const cats = useLoad((signal) => admin.categories({ signal }), []);
  const stories = useLoad((signal) => admin.stories({ limit: 100 }, { signal }), []);

  useEffect(() => {
    if (!editing) return undefined;
    const ctrl = new AbortController();
    admin
      .post(id, { signal: ctrl.signal })
      .then((p) => {
        setForm({ ...EMPTY, ...p, categoryId: String(p.categoryId), relatedStoryId: p.relatedStoryId ? String(p.relatedStoryId) : '', relatedService: p.relatedService || '', authorRole: p.authorRole || '', coverImage: p.coverImage || '', readMinutes: String(p.readMinutes || ''), publishedAt: toLocalInput(p.publishedAt) });
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

  // A new post starts with the first category selected.
  useEffect(() => {
    if (!editing && cats.data?.length && !form.categoryId) setForm((f) => ({ ...f, categoryId: String(cats.data[0].id) }));
  }, [cats.data, editing, form.categoryId]);

  const set = (patch) => {
    setForm((f) => ({ ...f, ...patch }));
    setDirty(true);
  };

  const apply = (tool) => {
    const el = bodyRef.current;
    if (!el) return;
    const { selectionStart: a, selectionEnd: b, value } = el;
    let next;
    let caret;
    if (tool.wrap) {
      const sel = value.slice(a, b) || 'bold text';
      next = `${value.slice(0, a)}${tool.wrap}${sel}${tool.wrap}${value.slice(b)}`;
      caret = a + tool.wrap.length + sel.length + tool.wrap.length;
    } else {
      const lineStart = value.lastIndexOf('\n', a - 1) + 1;
      const lead = lineStart === 0 || value[lineStart - 1] === '\n' ? '' : '';
      next = `${value.slice(0, lineStart)}${lead}${tool.hint}${value.slice(lineStart)}`;
      caret = b + tool.hint.length;
    }
    set({ body: next });
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(caret, caret);
    });
  };

  const save = async (override = {}) => {
    setBusy(true);
    setError(null);
    const data = { ...form, ...override, publishedAt: fromLocalInput(override.publishedAt ?? form.publishedAt) };
    try {
      if (editing) {
        await admin.savePost(id, data);
        toast('Saved');
        setForm((f) => ({ ...f, ...override }));
        setDirty(false);
      } else {
        const r = await admin.createPost(data);
        setDirty(false);
        toast('Post created');
        navigate(`/admin/blog/${r.id}`, { replace: true });
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
  const future = form.isPublished && form.publishedAt && new Date(form.publishedAt) > new Date();

  return (
    <>
      <PageHead title={editing ? 'Edit post' : 'New post'} sub={editing ? `/blog/${form.slug}` : 'Write an article for the blog.'}>
        <Link to="/admin/blog" className="adm-btn adm-btn--ghost">← Posts</Link>
        {editing && form.isPublished && !future && <a className="adm-btn adm-btn--ghost" href={`/blog/${form.slug}`} target="_blank" rel="noopener noreferrer">View live</a>}
      </PageHead>

      <form className="adm-editor" onSubmit={(e) => { e.preventDefault(); save(); }} noValidate>
        <div className="adm-editor-main">
          <Field label="Title" error={f.title}>
            {(p) => <input {...p} className="adm-input adm-input--lg" value={form.title} maxLength={200} onChange={(e) => set({ title: e.target.value, ...(slugTouched ? {} : { slug: slugify(e.target.value) }) })} required />}
          </Field>
          <Field label="Summary" error={f.excerpt} hint={`${form.excerpt.length}/400 · shown on the blog list and in search results`}>
            {(p) => <textarea {...p} className="adm-input" rows={3} maxLength={400} value={form.excerpt} onChange={(e) => set({ excerpt: e.target.value })} required />}
          </Field>

          <div className="adm-field">
            <div className="adm-editor-bar">
              <label htmlFor="post-body">Article</label>
              <div className="adm-toolbar-mini" role="toolbar" aria-label="Formatting">
                {TOOLS.map((t) => (
                  <button key={t.label} type="button" className="adm-btn adm-btn--ghost adm-btn--sm" onClick={() => apply(t)} disabled={preview}>{t.label}</button>
                ))}
                <button type="button" className="adm-btn adm-btn--sm adm-btn--ghost" aria-pressed={preview} onClick={() => setPreview((v) => !v)}>
                  {preview ? 'Edit' : 'Preview'}
                </button>
              </div>
            </div>
            {preview ? (
              <div className="adm-preview">
                <h1>{form.title || 'Untitled'}</h1>
                <Markdown source={form.body || '_Nothing written yet._'} />
              </div>
            ) : (
              <textarea id="post-body" ref={bodyRef} className="adm-input adm-body" rows={22} value={form.body} onChange={(e) => set({ body: e.target.value })} aria-invalid={f.body ? 'true' : undefined} spellCheck />
            )}
            {f.body ? <p className="adm-error">{f.body}</p> : <p className="adm-hint">Use <code>## Heading</code>, blank lines between paragraphs, <code>- </code> for lists and <code>**bold**</code>.</p>}
          </div>
        </div>

        <aside className="adm-editor-side">
          <section className="adm-card">
            <h2>Publish</h2>
            <Field label="Status">
              {(p) => (
                <select {...p} className="adm-input" value={form.isPublished ? 'published' : 'draft'} onChange={(e) => set({ isPublished: e.target.value === 'published', publishedAt: form.publishedAt || toLocalInput() })}>
                  <option value="draft">Draft (hidden)</option>
                  <option value="published">Published</option>
                </select>
              )}
            </Field>
            <Field label="Publish date and time" error={f.publishedAt} hint={future ? 'In the future: goes live then.' : 'Leave as is to publish now. Pick a later time to schedule.'}>
              {(p) => <input {...p} className="adm-input" type="datetime-local" value={form.publishedAt} onChange={(e) => set({ publishedAt: e.target.value })} />}
            </Field>
            <div className="adm-actions">
              <button className="adm-btn adm-btn--primary" disabled={busy}>{busy ? 'Saving…' : editing ? 'Save changes' : form.isPublished ? 'Create & publish' : 'Create draft'}</button>
            </div>
            {editing && (
              <div className="adm-actions">
                <DeleteButton label="Delete post" onDelete={async () => {
                  await admin.deletePost(id);
                  setDirty(false);
                  toast('Post deleted');
                  navigate('/admin/blog');
                }} />
              </div>
            )}
          </section>

          <section className="adm-card">
            <h2>Details</h2>
            <Field label="Web address" error={f.slug} hint={`/blog/${form.slug || "…"}`}>
              {(p) => <input {...p} className="adm-input" value={form.slug} maxLength={160} onChange={(e) => { setSlugTouched(true); set({ slug: slugify(e.target.value) }); }} required />}
            </Field>
            <Field label="Category" error={f.categoryId}>
              {(p) => (
                <select {...p} className="adm-input" value={form.categoryId} onChange={(e) => set({ categoryId: e.target.value })}>
                  {(cats.data || []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              )}
            </Field>
            <Field label="Author" error={f.authorName}>
              {(p) => <input {...p} className="adm-input" value={form.authorName} maxLength={120} onChange={(e) => set({ authorName: e.target.value })} />}
            </Field>
            <Field label="Author role (optional)">
              {(p) => <input {...p} className="adm-input" value={form.authorRole} maxLength={120} onChange={(e) => set({ authorRole: e.target.value })} />}
            </Field>
            <Field label="Reading time (minutes)" hint="Leave empty to work it out from the length.">
              {(p) => <input {...p} className="adm-input" type="number" min="1" max="60" value={form.readMinutes} onChange={(e) => set({ readMinutes: e.target.value })} />}
            </Field>
            <Field label="Cover image address (optional)" error={f.coverImage}>
              {(p) => <input {...p} className="adm-input" value={form.coverImage} maxLength={255} placeholder="https://…" onChange={(e) => set({ coverImage: e.target.value })} />}
            </Field>
          </section>

          <section className="adm-card">
            <h2>Related</h2>
            <Field label="Related service card" hint="Shown at the end of the article.">
              {(p) => (
                <select {...p} className="adm-input" value={form.relatedService} onChange={(e) => set({ relatedService: e.target.value })}>
                  <option value="">None</option>
                  {SERVICES.map(([slug, name]) => <option key={slug} value={slug}>{name}</option>)}
                </select>
              )}
            </Field>
            <Field label="Related customer story" error={f.relatedStoryId}>
              {(p) => (
                <select {...p} className="adm-input" value={form.relatedStoryId} onChange={(e) => set({ relatedStoryId: e.target.value })}>
                  <option value="">None</option>
                  {(stories.data || []).map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
                </select>
              )}
            </Field>
          </section>
        </aside>
      </form>
    </>
  );
}
