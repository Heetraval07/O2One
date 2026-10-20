import nodemailer from 'nodemailer';
import { config } from '../config/env.js';

let transport = null;
if (config.mail.host) {
  transport = nodemailer.createTransport({
    host: config.mail.host,
    port: config.mail.port,
    secure: config.mail.secure,
    auth: config.mail.user ? { user: config.mail.user, pass: config.mail.password } : undefined,
  });
}

export const mailEnabled = Boolean(transport);

/**
 * Send a system email (admin password reset, email change). Without SMTP settings the message is
 * printed to the server console instead, so the links can still be used while developing.
 */
export async function sendSystemEmail({ to, subject, text }) {
  if (!transport) {
    console.log(`
[mail not configured] To: ${to}
Subject: ${subject}
${text}
`);
    return { sent: false };
  }
  await transport.sendMail({ from: config.mail.from, to, subject, text });
  return { sent: true };
}

function formatSlot(date) {
  const local = new Date(date.getTime() + config.booking.utcOffsetMinutes * 60_000);
  return `${local.toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
  })}, ${local.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })} ${config.booking.timezoneLabel}`;
}

/**
 * Tell the O2One team about a new booking and confirm it to the visitor.
 * Never throws: a mail failure must not lose a booking that is already saved.
 */
export async function sendBookingEmails(booking) {
  if (!transport) return;
  const when = formatSlot(booking.slotStart);
  const mode = booking.meetingMode === 'in_person' ? 'In person' : 'Online';
  const jobs = [];

  if (config.mail.notify) {
    jobs.push(transport.sendMail({
      from: config.mail.from,
      to: config.mail.notify,
      replyTo: booking.email,
      subject: `New health checkup ${booking.reference}: ${booking.company}`,
      text: [
        `Reference: ${booking.reference}`,
        `When: ${when} (${mode})`,
        `Source: ${booking.source === 'vat_readiness' ? 'UAE VAT readiness check' : 'Health checkup'}`,
        '',
        `Name: ${booking.fullName}`,
        `Company: ${booking.company}`,
        `Email: ${booking.email}`,
        `Phone / WhatsApp: ${booking.phone}`,
        `Industry: ${booking.industry}`,
        `Country: ${booking.country || '—'}`,
        booking.readinessItems?.length ? `Ready today: ${booking.readinessItems.join('; ')}` : '',
        '',
        booking.message ? `What's slowing them down:\n${booking.message}` : '',
      ].filter((l) => l !== null).join('\n'),
    }));
  }

  jobs.push(transport.sendMail({
    from: config.mail.from,
    to: booking.email,
    subject: `Your free health checkup is booked (${booking.reference})`,
    text: [
      `Hi ${booking.fullName.split(' ')[0]},`,
      '',
      `Thanks for booking a free Business Health Checkup with O2One.`,
      `When: ${when}`,
      `Format: ${mode}`,
      `Reference: ${booking.reference}`,
      '',
      'We will confirm the details with you before the session. If the time no longer works, just reply to this email.',
      '',
      'O2One Consultants',
    ].join('\n'),
  }));

  const results = await Promise.allSettled(jobs);
  for (const r of results) {
    if (r.status === 'rejected') console.error('[mail] booking email failed:', r.reason?.message);
  }
}
