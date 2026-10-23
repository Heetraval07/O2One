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
    // Our API sends { error: 'text' }. A hosting error can send { error: { code, message } }, which must never reach a visitor as-is.
    const message = typeof data?.error === 'string' && data.error ? data.error : 'Something went wrong. Please try again.';
    throw new ApiError(message, res.status, data?.fields);
  }
  return data;
}

export const api = {
  contact: (body) => request('/contact', { method: 'POST', body }),
  subscribe: (email, website = '') => request('/newsletter', { method: 'POST', body: { email, website } }),
  categories: (opts) => request('/blog/categories', opts),
  posts: (params, opts) => request(`/blog/posts?${new URLSearchParams(params)}`, opts),
  post: (slug, opts) => request(`/blog/posts/${encodeURIComponent(slug)}`, opts),
  stories: (params = {}, opts) => request(`/stories?${new URLSearchParams(params)}`, opts),
  story: (slug, opts) => request(`/stories/${encodeURIComponent(slug)}`, opts),
};
