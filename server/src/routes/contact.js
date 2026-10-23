import crypto from 'node:crypto';
import { Router } from 'express';
import { asyncHandler } from '../lib/http.js';
import { validate } from '../lib/validate.js';
import { enquiryMailReady, sendEnquiryEmail } from '../services/mailer.js';

export const READINESS_ITEMS = [
  'Every customer and supplier has a correct TRN',
  'Tax codes match your VAT return',
  'Credit notes are made in Odoo, not by hand',
  'You know your deadline',
  "You've chosen an ASP",
];

const enquirySchema = {
  fullName: { label: 'Full name', required: true, min: 2, max: 120 },
  company: { label: 'Company', required: true, min: 2, max: 160 },
  email: { label: 'Email', required: true, max: 190, format: 'email' },
  phone: { label: 'Phone / WhatsApp', required: true, max: 40, format: 'phone' },
  industry: { label: 'Industry', required: true, max: 100 },
  country: { label: 'Country', max: 80 },
  message: { label: 'Message', max: 2000, multiline: true },
  meetingMode: { label: 'Meeting format', oneOf: ['online', 'in_person'], default: 'online' },
  source: { label: 'Source', oneOf: ['checkup', 'vat_readiness'], default: 'checkup' },
  readinessItems: { type: 'stringArray', label: 'Readiness items', items: READINESS_ITEMS, max: 5 },
  submissionId: { label: 'Submission', max: 64 }, // one per form on screen, so a retry or double click is recognised
  website: { label: 'Website' }, // honeypot: real visitors never see or fill it
};

const FRIENDLY_FAILURE = "We couldn't send your enquiry just now. Your details are still here, so please try again in a moment.";

// Enquiries handled recently, so a double click, a retry after a lost reply or a repeated send does not email twice.
// Kept in memory: it protects within one running server, which covers the realistic cases.
const WINDOW_MS = 10 * 60_000;
const recent = new Map(); // key -> { at, done: Promise }

function remember(key, done) {
  const now = Date.now();
  for (const [k, v] of recent) if (now - v.at > WINDOW_MS) recent.delete(k);
  recent.set(key, { at: now, done });
}

function fingerprint(data) {
  return crypto
    .createHash('sha256')
    .update([data.email, data.phone, data.company, data.message || ''].join('\u0000'))
    .digest('hex');
}

export const contactRouter = Router();

/** A visitor sends the contact form: validate it, email the team, tell the visitor how it went. */
contactRouter.post('/', asyncHandler(async (req, res) => {
  const data = validate(req.body, enquirySchema);

  // Honeypot filled in: pretend success so bots learn nothing, send nothing.
  if (data.website) return res.status(201).json({ ok: true });

  const enquiry = {
    ...data,
    readinessItems: data.source === 'vat_readiness' ? data.readinessItems : [],
  };

  const keys = [`f:${fingerprint(data)}`];
  if (data.submissionId) keys.unshift(`s:${data.submissionId}`);
  const seen = keys.map((k) => recent.get(k)).find(Boolean);
  // The visitor always gets this plain message on a failure; the real reason is only written to the server log.
  const failed = (status) => res.status(status).json({ error: FRIENDLY_FAILURE });

  if (seen) {
    // Already sent (or still being sent): wait for that attempt instead of sending again.
    try {
      await seen.done;
    } catch {
      return failed(502);
    }
    return res.status(200).json({ ok: true });
  }

  if (!enquiryMailReady()) {
    console.error('[contact] enquiry not sent: set SMTP_HOST and ENQUIRY_NOTIFY_EMAIL (see .env.example)');
    return failed(503);
  }

  const done = sendEnquiryEmail(enquiry);
  keys.forEach((k) => remember(k, done));
  try {
    await done;
  } catch (err) {
    keys.forEach((k) => recent.delete(k)); // a failed send must be retryable
    console.error('[contact] enquiry email failed:', err?.message || err);
    return failed(502);
  }
  res.status(201).json({ ok: true });
}));
