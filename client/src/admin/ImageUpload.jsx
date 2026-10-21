import { useEffect, useId, useRef, useState } from 'react';
import { admin } from './api';

const TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_BYTES = 5 * 1024 * 1024;

/**
 * "Attach image" field. Choosing a file uploads it straight away (so it is stored on the server, not just
 * previewed in the browser) and hands the stored address to `onChange`. The address is saved with the form.
 * `value` may also be an older external address; it previews the same way.
 */
export default function ImageUpload({ label, value, onChange, error, hint }) {
  const id = useId();
  const input = useRef(null);
  const [busy, setBusy] = useState(false);
  const [local, setLocal] = useState(''); // in-browser preview shown while the upload is in flight
  const [problem, setProblem] = useState('');

  useEffect(() => () => local && URL.revokeObjectURL(local), [local]);

  async function pick(e) {
    const file = e.target.files?.[0];
    e.target.value = ''; // lets the same file be chosen again
    if (!file) return;
    if (!TYPES.includes(file.type)) return setProblem('Please choose a JPG, PNG or WebP image.');
    if (file.size > MAX_BYTES) return setProblem(`That image is ${(file.size / 1024 / 1024).toFixed(1)} MB. The limit is 5 MB.`);
    setProblem('');
    setLocal(URL.createObjectURL(file));
    setBusy(true);
    try {
      const { url } = await admin.uploadImage(file);
      onChange(url);
    } catch (err) {
      setProblem(err.message);
    } finally {
      setBusy(false);
      setLocal('');
    }
  }

  const shown = local || value;
  const msg = problem || error;

  return (
    <div className="adm-field adm-wide">
      <span id={`${id}-l`} className="adm-label">{label}</span>
      <input ref={input} id={id} type="file" accept="image/jpeg,image/png,image/webp" className="adm-upload-input" onChange={pick} aria-labelledby={`${id}-l`} />
      {shown ? (
        <div className="adm-upload">
          <div className="adm-upload-preview" data-busy={busy}>
            <img src={shown} alt="" />
            {busy && <span className="adm-upload-status" role="status">Uploading…</span>}
          </div>
          <div className="adm-upload-actions">
            <button type="button" className="adm-btn adm-btn--ghost adm-btn--sm" onClick={() => input.current.click()} disabled={busy}>
              Replace image
            </button>
            <button type="button" className="adm-btn adm-btn--danger-ghost adm-btn--sm" onClick={() => { setProblem(''); onChange(''); }} disabled={busy}>
              Remove
            </button>
          </div>
        </div>
      ) : (
        <button type="button" className="adm-upload-drop" onClick={() => input.current.click()}>
          <span aria-hidden="true">＋</span>
          <strong>Attach image</strong>
          <small>JPG, PNG or WebP, up to 5 MB</small>
        </button>
      )}
      {(msg || hint) && <p className={msg ? 'adm-error' : 'adm-hint'} role={msg ? 'alert' : undefined}>{msg || hint}</p>}
    </div>
  );
}
