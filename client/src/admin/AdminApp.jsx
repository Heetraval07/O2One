import { lazy, Suspense, useEffect, useState } from 'react';
import { Link, NavLink, Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth';
import { ToastProvider } from './ui';
import { ConfirmEmail, Forgot, Login, Reset } from './pages/AuthPages';
import './admin.css';

// Each area loads only when opened.
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Bookings = lazy(() => import('./pages/Bookings'));
const Newsletter = lazy(() => import('./pages/Newsletter'));
const BlogList = lazy(() => import('./pages/BlogList'));
const PostEditor = lazy(() => import('./pages/PostEditor'));
const Categories = lazy(() => import('./pages/Categories'));
const StoriesList = lazy(() => import('./pages/StoriesList'));
const StoryEditor = lazy(() => import('./pages/StoryEditor'));
const Account = lazy(() => import('./pages/Account'));

const NAV = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/bookings', label: 'Bookings' },
  { to: '/admin/blog', label: 'Blog' },
  { to: '/admin/stories', label: 'Customer stories' },
  { to: '/admin/newsletter', label: 'Newsletter' },
  { to: '/admin/account', label: 'Account' },
];

/** Keep the admin out of search engines (the server also sends X-Robots-Tag). */
function useNoIndex() {
  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, nofollow';
    document.head.appendChild(meta);
    const prev = document.title;
    document.title = 'O2One admin';
    return () => {
      meta.remove();
      document.title = prev;
    };
  }, []);
}

function Shell() {
  const { status, email, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  useEffect(() => setOpen(false), [location.pathname]);

  if (status === 'loading') return <p className="adm-boot" role="status">Loading…</p>;
  if (status === 'out') return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;

  return (
    <div className="adm-shell">
      <a href="#adm-main" className="skip-link">Skip to content</a>
      <aside className="adm-side" data-open={open}>
        <div className="adm-brand">
          <Link to="/admin" aria-label="O2One admin home">
            <strong>O2One</strong>
            <span>Admin</span>
          </Link>
          <button type="button" className="adm-burger" aria-expanded={open} aria-controls="adm-nav" onClick={() => setOpen((o) => !o)}>
            {open ? 'Close' : 'Menu'}
          </button>
        </div>
        <nav id="adm-nav" aria-label="Admin">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end}>
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="adm-side-foot">
          <a href="/" target="_blank" rel="noopener noreferrer">View website ↗</a>
          <span title={email}>{email}</span>
          <button type="button" onClick={logout}>Sign out</button>
        </div>
      </aside>
      <main id="adm-main" className="adm-main" tabIndex={-1}>
        <Suspense fallback={<p className="adm-empty" role="status">Loading…</p>}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  );
}

function Public() {
  const { status } = useAuth();
  const location = useLocation();
  // Already signed in: go straight to the dashboard (but never bounce a password-reset link).
  if (status === 'in' && !location.pathname.includes('/reset') && !location.pathname.includes('/confirm-email')) {
    return <Navigate to="/admin" replace />;
  }
  return <Outlet />;
}

export default function AdminApp() {
  useNoIndex();
  return (
    <AuthProvider>
      <ToastProvider>
        <div className="adm">
          <Routes>
            <Route element={<Public />}>
              <Route path="login" element={<Login />} />
              <Route path="forgot" element={<Forgot />} />
              <Route path="reset" element={<Reset />} />
              <Route path="confirm-email" element={<ConfirmEmail />} />
            </Route>
            <Route element={<Shell />}>
              <Route index element={<Dashboard />} />
              <Route path="bookings" element={<Bookings />} />
              <Route path="newsletter" element={<Newsletter />} />
              <Route path="blog" element={<BlogList />} />
              <Route path="blog/new" element={<PostEditor />} />
              <Route path="blog/categories" element={<Categories />} />
              <Route path="blog/:id" element={<PostEditor />} />
              <Route path="stories" element={<StoriesList />} />
              <Route path="stories/new" element={<StoryEditor />} />
              <Route path="stories/:id" element={<StoryEditor />} />
              <Route path="account" element={<Account />} />
              <Route path="*" element={<Navigate to="/admin" replace />} />
            </Route>
          </Routes>
        </div>
      </ToastProvider>
    </AuthProvider>
  );
}
