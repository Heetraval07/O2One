import { Router } from 'express';
import { query } from '../db/pool.js';
import { asyncHandler } from '../lib/http.js';
import { validate } from '../lib/validate.js';

export const newsletterRouter = Router();

newsletterRouter.post('/', asyncHandler(async (req, res) => {
  const data = validate(req.body, {
    email: { label: 'Email', required: true, max: 190, format: 'email' },
    website: { label: 'Website' }, // honeypot
  });
  if (!data.website) {
    // Re-subscribing is fine and never reveals whether the address was already on the list.
    await query(
      `INSERT INTO newsletter_subscribers (email, status, source) VALUES (?, 'subscribed', 'blog')
       ON DUPLICATE KEY UPDATE status = 'subscribed'`,
      [data.email],
    );
  }
  res.status(201).json({ ok: true });
}));
