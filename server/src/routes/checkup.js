import crypto from 'node:crypto';
import { Router } from 'express';
import { query } from '../db/pool.js';
import { asyncHandler, HttpError } from '../lib/http.js';
import { validate } from '../lib/validate.js';
import { generateSlots, isBookableSlot } from '../lib/slots.js';
import { config } from '../config/env.js';
import { sendBookingEmails } from '../services/mailer.js';

export const READINESS_ITEMS = [
  'Every customer and supplier has a correct TRN',
  'Tax codes match your VAT return',
  'Credit notes are made in Odoo, not by hand',
  'You know your deadline',
  "You've chosen an ASP",
];

const bookingSchema = {
  fullName: { label: 'Full name', required: true, min: 2, max: 120 },
  company: { label: 'Company', required: true, min: 2, max: 160 },
  email: { label: 'Email', required: true, max: 190, format: 'email' },
  phone: { label: 'Phone / WhatsApp', required: true, max: 40, format: 'phone' },
  industry: { label: 'Industry', required: true, max: 100 },
  country: { label: 'Country', max: 80 },
  message: { label: 'Message', max: 2000, multiline: true },
  meetingMode: { label: 'Meeting format', oneOf: ['online', 'in_person'], default: 'online' },
  slotStart: { label: 'Time slot', required: true, format: 'datetime' },
  source: { label: 'Source', oneOf: ['checkup', 'vat_readiness'], default: 'checkup' },
  readinessItems: { type: 'stringArray', label: 'Readiness items', items: READINESS_ITEMS, max: 5 },
  website: { label: 'Website' }, // honeypot — real visitors never see or fill it
};

const REF_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function newReference() {
  const bytes = crypto.randomBytes(6);
  let s = 'O2-';
  for (const b of bytes) s += REF_ALPHABET[b % REF_ALPHABET.length];
  return s.slice(0, 9);
}

async function bookedStarts(from, to) {
  const rows = await query(
    `SELECT slot_start FROM checkup_bookings
      WHERE status <> 'cancelled' AND slot_start BETWEEN ? AND ?`,
    [from, to],
  );
  return new Set(rows.map((r) => new Date(r.slot_start).getTime()));
}

export const checkupRouter = Router();

/** Bookable slots for the next few weeks, with taken ones marked. */
checkupRouter.get('/slots', asyncHandler(async (_req, res) => {
  const days = generateSlots();
  if (!days.length) return res.json({ timezone: config.booking.timezoneLabel, days: [] });

  const first = days[0].slots[0].start;
  const lastDay = days[days.length - 1];
  const last = lastDay.slots[lastDay.slots.length - 1].start;
  const taken = await bookedStarts(first, last);

  res.set('Cache-Control', 'no-store');
  res.json({
    timezone: config.booking.timezoneLabel,
    utcOffsetMinutes: config.booking.utcOffsetMinutes,
    durationMinutes: 120,
    days: days.map((d) => ({
      date: d.date,
      slots: d.slots.map((s) => ({
        start: s.start.toISOString(),
        time: s.time,
        available: !taken.has(s.start.getTime()),
      })),
    })),
  });
}));

/** Create a booking. One active booking per slot is enforced by a unique index. */
checkupRouter.post('/bookings', asyncHandler(async (req, res) => {
  const data = validate(req.body, bookingSchema);

  // Honeypot filled in: pretend success so bots learn nothing, store nothing.
  if (data.website) {
    return res.status(201).json({ reference: 'O2-RECEIVED', slotStart: data.slotStart.toISOString() });
  }
  if (!isBookableSlot(data.slotStart)) {
    throw new HttpError(422, 'That time is no longer available. Please pick another slot.', {
      slotStart: 'Please pick one of the listed times.',
    });
  }

  const booking = {
    ...data,
    readinessItems: data.source === 'vat_readiness' ? data.readinessItems : [],
  };

  for (let attempt = 0; attempt < 3; attempt += 1) {
    booking.reference = newReference();
    try {
      await query(
        `INSERT INTO checkup_bookings
           (reference, full_name, company, email, phone, industry, country, message,
            meeting_mode, slot_start, source, readiness_items)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          booking.reference, booking.fullName, booking.company, booking.email, booking.phone,
          booking.industry, booking.country, booking.message, booking.meetingMode,
          booking.slotStart, booking.source,
          booking.readinessItems.length ? JSON.stringify(booking.readinessItems) : null,
        ],
      );
      break;
    } catch (err) {
      if (err.code !== 'ER_DUP_ENTRY') throw err;
      if (String(err.sqlMessage).includes('slot_lock')) {
        throw new HttpError(409, 'Someone just booked that time. Please pick another slot.', {
          slotStart: 'This slot was just taken.',
        });
      }
      if (attempt === 2) throw err; // reference collision three times: give up
    }
  }

  sendBookingEmails({ ...booking, slotStart: booking.slotStart }).catch(() => {});

  res.status(201).json({
    reference: booking.reference,
    slotStart: booking.slotStart.toISOString(),
    meetingMode: booking.meetingMode,
  });
}));
