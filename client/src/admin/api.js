import { ApiError } from '../lib/api';

let onSignedOut = () => {};
/** The auth provider registers itself here so any 401 drops the user back to the sign-in page. */
export const setSignedOutHandler = (fn) => {
  onSignedOut = fn;
};

async function request(path, { method = 'GET', body, blob, signal, raw } = {}) {
  let res;
  try {
    res = await fetch(`/api/admin${path}`, {
      method,
      signal,
      credentials: 'same-origin',
      headers: {
        Accept: raw ? '*/*' : 'application/json',
        'X-Requested-With': 'o2one-admin', // required by the API for every change (CSRF guard)
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(blob ? { 'Content-Type': blob.type } : {}),
      },
      body: blob || (body ? JSON.stringify(body) : undefined),
    });
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    throw new ApiError("Couldn't reach the server. Check the connection and try again.", 0);
  }
  if (raw && res.ok) return res;

  let data = null;
  try {
    data = await res.json();
  } catch {
    /* empty body */
  }
  if (!res.ok) {
    // A 401 on anything except the sign-in call itself means the session ended.
    if (res.status === 401 && !path.startsWith('/auth/login')) onSignedOut();
    throw new ApiError(data?.error || 'Something went wrong. Please try again.', res.status, data?.fields);
  }
  return data;
}

const qs = (params = {}) => {
  const clean = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v != null && v !== 'all'));
  const s = new URLSearchParams(clean).toString();
  return s ? `?${s}` : '';
};

/** Fetch a CSV (or other file) with the session cookie and hand it to the browser as a download. */
async function download(path, filename) {
  const res = await request(path, { raw: true });
  const url = URL.createObjectURL(await res.blob());
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export const admin = {
  // auth
  me: () => request('/auth/me'),
  login: (email, password) => request('/auth/login', { method: 'POST', body: { email, password } }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  forgot: (email) => request('/auth/forgot', { method: 'POST', body: { email } }),
  reset: (token, password) => request('/auth/reset', { method: 'POST', body: { token, password } }),
  confirmEmail: (token) => request('/auth/confirm-email', { method: 'POST', body: { token } }),
  changePassword: (currentPassword, newPassword) => request('/auth/account/password', { method: 'POST', body: { currentPassword, newPassword } }),
  changeEmail: (newEmail, currentPassword) => request('/auth/account/email', { method: 'POST', body: { newEmail, currentPassword } }),
  // images: the file itself is the request body; the reply is { url }
  uploadImage: (file) => request('/media', { method: 'POST', blob: file }),
  // data
  dashboard: (o) => request('/dashboard', o),
  bookings: (params, o) => request(`/bookings${qs(params)}`, o),
  booking: (id, o) => request(`/bookings/${id}`, o),
  updateBooking: (id, body) => request(`/bookings/${id}`, { method: 'PATCH', body }),
  deleteBooking: (id) => request(`/bookings/${id}`, { method: 'DELETE' }),
  exportBookings: (params) => download(`/bookings/export.csv${qs(params)}`, 'o2one-bookings.csv'),
  subscribers: (params, o) => request(`/newsletter${qs(params)}`, o),
  updateSubscriber: (id, status) => request(`/newsletter/${id}`, { method: 'PATCH', body: { status } }),
  deleteSubscriber: (id) => request(`/newsletter/${id}`, { method: 'DELETE' }),
  exportSubscribers: (params) => download(`/newsletter/export.csv${qs(params)}`, 'o2one-subscribers.csv'),
  posts: (params, o) => request(`/blog/posts${qs(params)}`, o),
  post: (id, o) => request(`/blog/posts/${id}`, o),
  createPost: (body) => request('/blog/posts', { method: 'POST', body }),
  savePost: (id, body) => request(`/blog/posts/${id}`, { method: 'PUT', body }),
  publishPost: (id, isPublished) => request(`/blog/posts/${id}`, { method: 'PATCH', body: { isPublished } }),
  deletePost: (id) => request(`/blog/posts/${id}`, { method: 'DELETE' }),
  categories: (o) => request('/blog/categories', o),
  createCategory: (body) => request('/blog/categories', { method: 'POST', body }),
  saveCategory: (id, body) => request(`/blog/categories/${id}`, { method: 'PUT', body }),
  deleteCategory: (id) => request(`/blog/categories/${id}`, { method: 'DELETE' }),
  stories: (params, o) => request(`/stories${qs(params)}`, o),
  story: (id, o) => request(`/stories/${id}`, o),
  createStory: (body) => request('/stories', { method: 'POST', body }),
  saveStory: (id, body) => request(`/stories/${id}`, { method: 'PUT', body }),
  publishStory: (id, isPublished) => request(`/stories/${id}`, { method: 'PATCH', body: { isPublished } }),
  deleteStory: (id) => request(`/stories/${id}`, { method: 'DELETE' }),
};
