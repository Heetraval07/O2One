# O2One Consultants — website

React (Vite) frontend, Node.js + Express API, MariaDB database. Built from the approved wireframes
("O2One Wireframes – Selected"), the final copy documents and the O2One Website Design Guide.

```
o2one-website/
├── client/                 React app (Vite, React Router, CSS modules)
│   └── src/
│       ├── content/        All site copy and settings (services, industries, approach, VAT page…)
│       ├── components/     layout/ (header, footer), ui/ (buttons, cards…), sections/ (page blocks)
│       ├── features/booking/  3-step Health Checkup booking form
│       ├── pages/          One file per route
│       ├── lib/            API client, hooks, formatting
│       └── styles/         Design tokens + global primitives
├── server/                 Express API
│   ├── src/
│   │   ├── routes/         checkup (slots + bookings), newsletter, blog, stories
│   │   ├── lib/            validation, slot generation, errors
│   │   ├── services/       optional booking emails (SMTP)
│   │   └── app.js          security headers, rate limits, static hosting of the React build
│   ├── scripts/            db-init.js (schema + optional seed), seed-data.js
│   └── test/               unit tests (node --test)
├── database/schema.sql     MariaDB schema
└── .env.example            every setting, no real credentials
```

## Requirements

- Node.js 20+
- MariaDB 10.6+ (tested on 10.11)

## Setup

```bash
# 1. Install dependencies
npm run setup

# 2. Create a database user (once), e.g. in the MariaDB shell:
#    CREATE DATABASE o2one_website CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
#    CREATE USER 'o2one'@'localhost' IDENTIFIED BY 'a-strong-password';
#    GRANT ALL ON o2one_website.* TO 'o2one'@'localhost';

# 3. Configure
cp .env.example .env        # then set DB_PASSWORD, contact details, SMTP (optional)

# 4. Create the tables (and load the starter blog posts + sample stories)
npm run db:seed             # or `npm run db:init` for empty tables
```

## Run in development

Two terminals:

```bash
npm run dev:api     # API on http://localhost:4000 (restarts on change)
npm run dev:web     # site on http://localhost:5173 (proxies /api to the API)
```

## Run in production

```bash
npm run build       # builds client/dist
NODE_ENV=production npm start
```

The Express server serves both the API (`/api/*`) and the built site on `PORT` (default 4000), with
client-side routing fallback, long-cache hashed assets and gzip. Behind Nginx or a load balancer set
`TRUST_PROXY=1` so rate limits see real client IPs. Run it under a process manager (pm2, systemd).

## Tests

```bash
npm test            # slot generation + validation unit tests
```

## What's dynamic (and stored in MariaDB)

| Feature | Endpoint | Table |
| --- | --- | --- |
| Health Checkup booking (Contact page, every "Book" button) | `GET /api/checkup/slots`, `POST /api/checkup/bookings` | `checkup_bookings` |
| VAT page "Book a free readiness check" (carries the self-check ticks) | same, `source = vat_readiness` | `checkup_bookings.readiness_items` |
| Newsletter (blog sidebar) | `POST /api/newsletter` | `newsletter_subscribers` |
| Blog listing, search, categories, load more, post pages | `GET /api/blog/categories`, `/api/blog/posts`, `/api/blog/posts/:slug` | `blog_posts`, `blog_categories` |
| Customer stories (list, filters, detail, teasers on Home and services) | `GET /api/stories`, `/api/stories/:slug` | `customer_stories` |
| Health check | `GET /api/health` | — |

Services, industries, approach steps and page copy are static content in `client/src/content/` —
they change rarely and don't need a database.

**Booking slots** are generated from `BOOKING_*` settings (working days, start times, lead time,
window, blocked dates). Each checkup is two hours. A unique index on active bookings makes
double-booking impossible, even with two people clicking at once; cancelling a booking
(`UPDATE checkup_bookings SET status='cancelled' …`) frees the slot.

**Emails** are optional: set `SMTP_*` and `BOOKING_NOTIFY_EMAIL` to send the team a notification and
the visitor a confirmation. Bookings are saved whether or not email is configured.

**Security**: parameterised queries only, server-side validation of every field, honeypot spam
traps, rate limits on form posts (10 per 15 min per IP), 20 KB body limit, Helmet security headers
with a strict Content Security Policy, and no database access from the browser.

## Admin area (`/admin`)

Sign in at `/admin` to manage everything the API stores: bookings (status, private notes, CSV export), blog
posts and categories (Markdown editor with preview, drafts and scheduling), customer stories, and newsletter
subscribers (CSV export). There is one admin account.

```bash
npm run db:init                       # adds the admin tables if you are upgrading
npm run admin:create -- you@company.com    # creates the admin and prints a random password once
npm run admin:reset  -- you@company.com    # emergency reset from the terminal
```

- **Change the credentials** on the Account page: password (needs the current one) and login email.
- **Forgot the password?** "Forgot your password?" on the sign-in page emails a one-time link (valid 1 hour).
  Set `PUBLIC_URL` and the `SMTP_*` values in `.env` so emails are actually sent. Without SMTP, the link is printed
  in the API console instead, and an email change applies immediately after the password check.
- **Security:** passwords are stored as scrypt hashes; sessions are `HttpOnly`, `SameSite=Strict` cookies (12 hours
  idle, 7 days at most); every change needs an `X-Requested-With` header; sign-in is rate-limited; the admin pages
  are `noindex`. Serve the site over HTTPS in production (cookies are `Secure` when `NODE_ENV=production`).

## Managing content without the admin

You can still edit blog posts and stories directly in MariaDB (e.g. with HeidiSQL, DBeaver or phpMyAdmin):

- `blog_posts.body` uses simple Markdown: `## Heading`, blank-line paragraphs, `- ` lists, `**bold**`.
- Set `is_published = 0` to hide a post or story; future `published_at` dates schedule them.
- `customer_stories.approach` is a JSON list of step names; `results` is a JSON list of
  `{"value": "10 weeks", "label": "to go live"}`.

## Before launch — checklist

- [ ] Real contact details in `.env` (`VITE_CONTACT_EMAIL`, `VITE_CONTACT_PHONE`, `VITE_WHATSAPP_NUMBER`, office addresses), then rebuild.
- [ ] Replace the three **sample** customer stories (they show a "Sample" badge) with approved client stories, then delete the samples.
- [ ] Review the six starter blog posts (written from the site copy) and their dates.
- [ ] Real photography: every `PhotoSlot` placeholder says what belongs there. Pass `src` and `alt` to swap in images (WebP, compressed).
- [ ] Logo file: `client/src/components/ui/Logo.jsx` currently renders the text wordmark from the design guide.
- [ ] Odoo partner badge artwork, if O2One wants the official badge image instead of the text badge.
- [ ] UAE VAT page: confirm the 30 Oct 2026 date and all penalties against the MoF/FTA. After 30 Oct 2026 update `vatTopBar` in `client/src/content/site.js` (instructions are in the file).
- [ ] Booking hours (`BOOKING_*`) and public holidays (`BOOKING_BLOCKED_DATES`).
- [ ] SMTP settings for booking emails.
- [ ] Problem-card descriptions on Home (`client/src/content/company.js`) are supporting lines added for the build; replace if the client has its own.
