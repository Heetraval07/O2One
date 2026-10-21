import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Home from './pages/Home';

// Every page except Home is split into its own chunk.
const About = lazy(() => import('./pages/About'));
const Services = lazy(() => import('./pages/Services'));
const ServiceDetail = lazy(() => import('./pages/ServiceDetail'));
const VatEInvoicing = lazy(() => import('./pages/VatEInvoicing'));
const Industries = lazy(() => import('./pages/Industries'));
const Stories = lazy(() => import('./pages/Stories'));
const StoryDetail = lazy(() => import('./pages/StoryDetail'));
const Blog = lazy(() => import('./pages/Blog'));
const BlogPost = lazy(() => import('./pages/BlogPost'));
const Contact = lazy(() => import('./pages/Contact'));
const NotFound = lazy(() => import('./pages/NotFound'));
const AdminApp = lazy(() => import('./admin/AdminApp'));

export default function App() {
  return (
    <Routes>
      {/* The admin area has its own screens: no public header, footer or WhatsApp button */}
      <Route path="admin/*" element={<Suspense fallback={null}><AdminApp /></Suspense>} />
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="about" element={<About />} />
        <Route path="services" element={<Services />} />
        <Route path="services/:slug" element={<ServiceDetail />} />
        <Route path="e-invoicing" element={<VatEInvoicing />} />
        {/* Old address of the e-invoicing page: keep existing links and bookmarks working */}
        <Route path="odoo-uae-vat-e-invoicing" element={<Navigate to="/e-invoicing" replace />} />
        {/* Short address for the custom industry solutions service page */}
        <Route path="custom-industry-solutions" element={<Navigate to="/services/custom-industry-solutions" replace />} />
        <Route path="industries" element={<Industries />} />
        <Route path="customer-stories" element={<Stories />} />
        <Route path="customer-stories/:slug" element={<StoryDetail />} />
        <Route path="blog" element={<Blog />} />
        <Route path="blog/:slug" element={<BlogPost />} />
        <Route path="contact" element={<Contact />} />
        <Route path="health-checkup" element={<Navigate to="/contact" replace />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
