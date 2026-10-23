# O2One Consultants — website

React (Vite) frontend, Node.js + Express API, SQLite database (a single file). Built from the approved wireframes
("O2One Wireframes – Selected"), the final copy documents and the O2One Website Design Guide.

```
o2one-website/
├── client/                 React app (Vite, React Router, CSS modules)
│   └── src/
│       ├── content/        All site copy and settings (services, industries, approach, VAT page…)
│       ├── components/     layout/ (header, footer), ui/ (buttons, cards…), sections/ (page blocks)
│       ├── features/contact/  Contact / Health Checkup enquiry form (one step, sent by email)
│       ├── pages/          One file per route
│       ├── lib/            API client, hooks, formatting
│       └── styles/         Design tokens + global primitives
├── server/                 Express API
│   ├── src/
│   │   ├── routes/         contact (enquiry email), newsletter, blog, stories
│   │   ├── lib/            validation, errors
│   │   ├── services/       enquiry email (SMTP)
│   │   └── app.js          security headers, rate limits, static hosting of the React build
│   ├── scripts/            db-init.js (schema + optional seed), seed-data.js
│   └── test/               unit tests (node --test)
├── database/schema.sql     SQLite schema
└── .env.example            every setting, no real credentials
```

## Requirements

- Node.js 20+
- Nothing else: the database is one SQLite file (`data/o2one.sqlite`), created by the setup step below

## Setup

```bash
# 1. Install dependencies
npm run setup

# 2. Configure
cp .env.example .env        # then set the contact details and the SMTP settings for the contact form

# 3. Create the database file and its tables (and load the starter blog posts + sample stories)
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

## What's dynamic (and stored in SQLite)

| Feature | Endpoint | Table |
| --- | --- | --- |
| Contact form / free Health Checkup enquiry (Contact page, every "Book" button) | `POST /api/contact` | — (emailed to the team, not stored) |
| VAT page "Book a free readiness check" (carries the self-check ticks) | same, `source = vat_readiness` | — |
| Newsletter (blog sidebar) | `POST /api/newsletter` | `newsletter_subscribers` |
| Blog listing, search, categories, load more, post pages | `GET /api/blog/categories`, `/api/blog/posts`, `/api/blog/posts/:slug` | `blog_posts`, `blog_categories` |
| Customer stories (list, filters, detail, teasers on Home and services) | `GET /api/stories`, `/api/stories/:slug` | `customer_stories` |
| Health check | `GET /api/health` | — |

Services, industries, approach steps and page copy are static content in `client/src/content/` —
they change rarely and don't need a database.

**Enquiries** from the contact form are validated on the server and emailed to the team (subject
"New Website Enquiry – O2One Consultants", reply-to set to the visitor). Nothing is stored. The form
needs `SMTP_HOST` and `ENQUIRY_NOTIFY_EMAIL` (plus `SMTP_USER`, `SMTP_PASSWORD`, `MAIL_FROM` for most
providers). Without them the visitor sees a friendly "couldn't send, try again" message and the
reason is written to the server log. There is no calendar or booking step any more; the
`checkup_bookings` table and the admin Bookings page remain only for bookings made before this change.

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

You can still edit blog posts and stories directly in the SQLite file (e.g. with DB Browser for SQLite or DBeaver):

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
- [ ] SMTP settings and `ENQUIRY_NOTIFY_EMAIL` so contact-form enquiries reach the team (set as environment variables, never in code).
- [ ] Problem-card descriptions on Home (`client/src/content/company.js`) are supporting lines added for the build; replace if the client has its own.

## Database: one SQLite file

All data (blog, stories, subscribers, admin account, uploaded images, old bookings) lives in `data/o2one.sqlite`
(change the place with `DB_FILE` in `.env`). It is created by `npm run db:init` / `npm run db:seed`, which are safe
to run again. The file is not in git.

- **Backups:** copy the file. For a copy while the site is running, use `sqlite3 data/o2one.sqlite ".backup backup.sqlite"`
  (or stop the app first). The files ending `-wal` and `-shm` next to it are part of the live database; leave them.
- **One server only:** SQLite needs a disk that stays between runs and one machine to run on, which suits a VPS. It does
  not suit serverless hosts such as Vercel, where the file would vanish: the contact form works there (it needs no
  database), but the blog, stories and admin need a VPS.
- **Moving old MariaDB data in (one time):**
  ```bash
  npm install --prefix server --no-save mysql2   # the old driver, only for this step
  npm run db:init
  npm run db:import-mariadb                      # reads MARIADB_* or the old DB_* settings; only reads MariaDB, never changes it
  ```