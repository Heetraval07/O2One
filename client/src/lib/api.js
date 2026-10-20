export class ApiError extends Error {
  constructor(message, status, fields) {
    super(message);
    this.status = status;
    this.fields = fields || {};
  }
}

async function request(path, { method = 'GET', body, signal } = {}) {
  let res;
  try {
    res = await fetch(`/api${path}`, {
      method,
      signal,
      headers: body ? { 'Content-Type': 'application/json', Accept: 'application/json' } : { Accept: 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    throw new ApiError("We couldn't reach the server. Check your connection and try again.", 0);
  }

  let data = null;
  try {
    data = await res.json();
  } catch {
    /* empty or non-JSON body */
  }
  if (!res.ok) {
    throw new ApiError(data?.error || 'Something went wrong. Please try again.', res.status, data?.fields);
  }
  return data;
}

export const api = {
  slots: (opts) => request('/checkup/slots', opts),
  book: (body) => request('/checkup/bookings', { method: 'POST', body }),
  subscribe: (email, website = '') => request('/newsletter', { method: 'POST', body: { email, website } }),
  categories: (opts) => request('/blog/categories', opts),
  posts: (params, opts) => request(`/blog/posts?${new URLSearchParams(params)}`, opts),
  post: (slug, opts) => request(`/blog/posts/${encodeURIComponent(slug)}`, opts),
  stories: (params = {}, opts) => request(`/stories?${new URLSearchParams(params)}`, opts),
  story: (slug, opts) => request(`/stories/${encodeURIComponent(slug)}`, opts),
};
