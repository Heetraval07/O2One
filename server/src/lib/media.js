import { query } from '../db/pool.js';

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const MEDIA_PREFIX = '/api/media/';

/** Check the file's own first bytes, not just the type the browser claimed. */
export function sniffImage(buf) {
  if (!Buffer.isBuffer(buf) || buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
  if (buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') return 'image/webp';
  return null;
}

const idFromUrl = (url) => {
  const m = typeof url === 'string' && url.startsWith(MEDIA_PREFIX) ? url.slice(MEDIA_PREFIX.length) : '';
  return /^[a-f0-9]{32}$/.test(m) ? m : null;
};

const UNUSED = `NOT EXISTS (SELECT 1 FROM blog_posts WHERE cover_image = CONCAT('${MEDIA_PREFIX}', media.id))
            AND NOT EXISTS (SELECT 1 FROM customer_stories WHERE cover_image = CONCAT('${MEDIA_PREFIX}', media.id))`;

/** After a cover is replaced, removed, or its post deleted: drop the old upload if nothing uses it any more. */
export async function releaseMedia(url) {
  const id = idFromUrl(url);
  if (id) await query(`DELETE FROM media WHERE id = ? AND ${UNUSED}`, [id]);
}

/** Uploads that were never saved onto a post or story (the form was abandoned) are cleared after a day. */
export async function purgeAbandonedMedia() {
  await query(`DELETE FROM media WHERE created_at < NOW() - INTERVAL 1 DAY AND ${UNUSED}`);
}
