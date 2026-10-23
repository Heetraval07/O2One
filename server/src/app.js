import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import helmet from 'helmet';
import compression from 'compression';
import { rateLimit } from 'express-rate-limit';
import { config, ROOT_DIR } from './config/env.js';
import { ping } from './db/pool.js';
import { asyncHandler, errorHandler, notFound } from './lib/http.js';
import { contactRouter } from './routes/contact.js';
import { newsletterRouter } from './routes/newsletter.js';
import { blogRouter } from './routes/blog.js';
import { storiesRouter } from './routes/stories.js';
import { adminRouter } from './routes/admin/index.js';
import { mediaRouter } from './routes/media.js';

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  if (config.trustProxy) app.set('trust proxy', config.trustProxy);

  app.use(helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        'img-src': ["'self'", 'data:', 'https:'],
        'frame-src': ["'self'", 'https://www.google.com'], // the Google Map on the Contact page
        'style-src': ["'self'", "'unsafe-inline'"],
        'connect-src': ["'self'"],
        'upgrade-insecure-requests': null, // let the proxy/TLS layer handle HTTPS redirects
      },
    },
    crossOriginEmbedderPolicy: false,
  }));
  app.use(compression());

  // ---- API -----------------------------------------------------------------
  const api = express.Router();

  // Admin area first: it takes larger bodies (blog articles) than the public forms, and has its own sign-in.
  api.use('/admin', express.json({ limit: '400kb' }), adminRouter);

  // Uploaded images: public, immutable and cacheable, so they sit outside the per-minute read limit.
  api.use('/media', mediaRouter);

  api.use(express.json({ limit: '20kb' }));

  const readLimiter = rateLimit({ windowMs: 60_000, limit: 120, standardHeaders: 'draft-8', legacyHeaders: false });
  const writeLimiter = rateLimit({
    windowMs: 15 * 60_000,
    limit: 10,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { error: 'Too many attempts. Please wait a few minutes and try again.' },
  });
  api.use(readLimiter);

  api.get('/health', asyncHandler(async (_req, res) => {
    await ping();
    res.json({ ok: true, db: 'up' });
  }));

  api.post('/contact', writeLimiter);
  api.post('/newsletter', writeLimiter);
  api.use('/contact', contactRouter);
  api.use('/newsletter', newsletterRouter);
  api.use('/blog', blogRouter);
  api.use('/stories', storiesRouter);
  api.use(notFound);

  app.use('/api', api);

  // ---- React build (production) --------------------------------------------
  const dist = path.join(ROOT_DIR, 'client', 'dist');
  if (fs.existsSync(path.join(dist, 'index.html'))) {
    app.use('/assets', express.static(path.join(dist, 'assets'), { immutable: true, maxAge: '1y' }));
    app.use(express.static(dist, { index: false, maxAge: '1h' }));
    // Client-side routing: any other GET returns the app shell.
    app.get('*', (req, res) => {
      res.set('Cache-Control', 'no-cache');
      if (req.path === '/admin' || req.path.startsWith('/admin/')) res.set('X-Robots-Tag', 'noindex, nofollow');
      res.sendFile(path.join(dist, 'index.html'));
    });
  }

  app.use(errorHandler);
  return app;
}
