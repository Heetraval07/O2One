import nodemailer from 'nodemailer';
import { config } from '../config/env.js';

let transport = null;
if (config.mail.host) {
  transport = nodemailer.createTransport({
    host: config.mail.host,
    port: config.mail.port,
    secure: config.mail.secure,
    auth: config.mail.user ? { user: config.mail.user, pass: config.mail.password } : undefined,
    // fail fast, so a visitor is told something went wrong instead of waiting on a stuck connection
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
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

const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

/** Thrown when an enquiry cannot be emailed because no SMTP server or recipient is set up. */
export class MailNotConfiguredError extends Error {}

/** True when enquiries can be emailed: an SMTP server and a recipient are both configured. */
export const enquiryMailReady = () => Boolean(transport && config.mail.notify);

/**
 * Email a website enquiry (contact form) to the O2One team. Replying to the email answers the visitor.
 * Unlike the notification helpers above, this throws when the message could not be sent, so the visitor can be told.
 */
export async function sendEnquiryEmail(enquiry) {
  if (!enquiryMailReady()) throw new MailNotConfiguredError('SMTP_HOST and ENQUIRY_NOTIFY_EMAIL are not both set');

  const mode = enquiry.meetingMode === 'in_person' ? 'In person' : 'Online';
  const source = enquiry.source === 'vat_readiness' ? 'UAE VAT & e-invoicing readiness check' : 'Free Business Health Checkup';
  const dubai = new Date(Date.now() + config.booking.utcOffsetMinutes * 60_000)
    .toISOString().replace('T', ' ').slice(0, 16);
  const rows = [
    ['Name', enquiry.fullName],
    ['Company', enquiry.company],
    ['Email', enquiry.email],
    ['Phone / WhatsApp', enquiry.phone],
    ['Industry', enquiry.industry],
    ['Country', enquiry.country || '—'],
    ['Preferred meeting', mode],
    ['Form', source],
  ];
  if (enquiry.readinessItems?.length) {
    rows.push(['Ready today', `${enquiry.readinessItems.length} of 5: ${enquiry.readinessItems.join('; ')}`]);
  }
  rows.push(['Received', `${dubai} ${config.booking.timezoneLabel}`]);
  const message = enquiry.message || '—';

  const text = [
    'A new enquiry came in through the O2One website contact form.',
    '',
    ...rows.map(([k, v]) => `${k}: ${v}`),
    '',
    'Message:',
    message,
  ].join('\n');

  const html = `<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#1a1a1a;line-height:1.5">
<p>A new enquiry came in through the O2One website contact form.</p>
<table cellpadding="6" cellspacing="0" style="border-collapse:collapse">
${rows.map(([k, v]) => `<tr><td style="color:#5f5f5f;vertical-align:top;white-space:nowrap">${esc(k)}</td><td><strong>${esc(v)}</strong></td></tr>`).join('\n')}
</table>
<p style="margin:16px 0 4px;color:#5f5f5f">Message</p>
<p style="margin:0;white-space:pre-wrap">${esc(message)}</p>
<p style="margin-top:20px;color:#5f5f5f">Reply to this email to answer ${esc(enquiry.fullName)} directly.</p>
</div>`;

  await transport.sendMail({
    from: config.mail.from,
    to: config.mail.notify,
    replyTo: { name: enquiry.fullName.replace(/[\r\n"<>]/g, ' '), address: enquiry.email },
    subject: 'New Website Enquiry – O2One Consultants',
    text,
    html,
  });
}
