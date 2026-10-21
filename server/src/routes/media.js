import crypto from 'node:crypto';
import express, { Router } from 'express';
import { query } from '../db/pool.js';
import { asyncHandler, HttpError } from '../lib/http.js';
import { IMAGE_TYPES, MAX_IMAGE_BYTES, MEDIA_PREFIX, purgeAbandonedMedia, sniffImage } from '../lib/media.js';

/** Public: GET /api/media/:id serves an uploaded image. Addresses are random and never reused, so they cache for good. */
export const mediaRouter = Router();

mediaRouter.get('/:id', asyncHandler(async (req, res) => {
  const id = String(req.params.id);
  if (!/^[a-f0-9]{32}$/.test(id)) throw new HttpError(404, 'Not found');
  const [row] = await query('SELECT mime, data FROM media WHERE id = ?', [id]);
  if (!row) throw new HttpError(404, 'Not found');
  res.set({
    'Content-Type': row.mime,
    'Content-Length': row.data.length,
    'Cache-Control': 'public, max-age=31536000, immutable',
    'X-Content-Type-Options': 'nosniff',
  });
  res.end(row.data);
}));

/** Admin: POST /api/admin/media with the image file itself as the request body. Returns { url }. */
export const mediaAdminRouter = Router();

const tooBig = `That image is larger than ${MAX_IMAGE_BYTES / 1024 / 1024} MB. Please choose a smaller one.`;
const wrongType = 'Please choose a JPG, PNG or WebP image.';

// Read the body only for the allowed image types, and turn the library's size error into a plain message.
mediaAdminRouter.use((req, res, next) =>
  express.raw({ type: IMAGE_TYPES, limit: MAX_IMAGE_BYTES })(req, res, (err) => {
    if (err?.type === 'entity.too.large') return next(new HttpError(413, tooBig));
    return next(err);
  }),
);

mediaAdminRouter.post('/', asyncHandler(async (req, res) => {
  const buf = req.body;
  if (!Buffer.isBuffer(buf) || buf.length === 0) throw new HttpError(415, wrongType);
  if (buf.length > MAX_IMAGE_BYTES) throw new HttpError(413, tooBig);
  const mime = sniffImage(buf);
  if (!mime || mime !== req.get('content-type')?.split(';')[0].trim()) {
    throw new HttpError(415, 'That file is not a valid JPG, PNG or WebP image.');
  }
  const id = crypto.randomBytes(16).toString('hex');
  await query('INSERT INTO media (id, mime, size_bytes, data) VALUES (?, ?, ?, ?)', [id, mime, buf.length, buf]);
  purgeAbandonedMedia().catch(() => {}); // housekeeping; never blocks or fails the upload
  res.status(201).json({ url: `${MEDIA_PREFIX}${id}` });
}));
