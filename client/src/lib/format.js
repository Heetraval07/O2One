export function formatDate(iso, opts = { day: 'numeric', month: 'short', year: 'numeric' }) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-GB', opts);
}
