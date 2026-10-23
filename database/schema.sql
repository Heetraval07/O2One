-- O2One Consultants website — SQLite schema
-- Safe to re-run: tables, indexes and triggers are created only if they don't exist.
--
-- Times are UTC text like 2026-10-23T10:00:00.000Z (the format JavaScript uses), so they sort correctly as text.
-- Yes/no columns are 0 or 1.

PRAGMA foreign_keys = ON;

-- ---------------------------------------------------------------------------
-- Free Business Health Checkup bookings
-- The booking calendar has been removed; enquiries from the contact form are emailed and not stored here.
-- This table (and the admin Bookings page) only keeps bookings made before that change.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS checkup_bookings (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  reference       TEXT NOT NULL UNIQUE,                 -- shown to the visitor, e.g. O2-7KQ4MX
  full_name       TEXT NOT NULL,
  company         TEXT NOT NULL,
  email           TEXT NOT NULL,
  phone           TEXT NOT NULL,                        -- phone / WhatsApp
  industry        TEXT NOT NULL,
  country         TEXT,
  message         TEXT,                                 -- "What's slowing you down?" (optional)
  meeting_mode    TEXT NOT NULL DEFAULT 'online' CHECK (meeting_mode IN ('online','in_person')),
  slot_start      TEXT NOT NULL,                        -- UTC
  source          TEXT NOT NULL DEFAULT 'checkup' CHECK (source IN ('checkup','vat_readiness')),
  readiness_items TEXT CHECK (readiness_items IS NULL OR json_valid(readiness_items)),
  status          TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new','confirmed','completed','cancelled')),
  admin_notes     TEXT,                                 -- private notes the team keeps on a booking
  created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
-- One active booking per slot. Cancelled bookings release the slot.
CREATE UNIQUE INDEX IF NOT EXISTS uq_bookings_slot ON checkup_bookings (slot_start) WHERE status <> 'cancelled';
CREATE INDEX IF NOT EXISTS idx_bookings_status_slot ON checkup_bookings (status, slot_start);
CREATE INDEX IF NOT EXISTS idx_bookings_email ON checkup_bookings (email);

-- ---------------------------------------------------------------------------
-- Newsletter sign-ups (Blog sidebar)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  email       TEXT NOT NULL UNIQUE,
  status      TEXT NOT NULL DEFAULT 'subscribed' CHECK (status IN ('subscribed','unsubscribed')),
  source      TEXT NOT NULL DEFAULT 'blog',
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

-- ---------------------------------------------------------------------------
-- Customer stories (Resources → Customer stories; teasers on Home, blog posts)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS customer_stories (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  slug          TEXT NOT NULL UNIQUE,
  title         TEXT NOT NULL,
  client_name   TEXT NOT NULL,
  industry      TEXT NOT NULL,                          -- matches an industry name on the Industries page
  country       TEXT NOT NULL,
  service_slug  TEXT NOT NULL,                          -- business-consultation | odoo-services | custom-industry-solutions | ai-automation
  apps          TEXT,                                   -- e.g. "Sales, Inventory, Accounting"
  summary       TEXT NOT NULL,
  challenge     TEXT NOT NULL,
  approach      TEXT NOT NULL CHECK (json_valid(approach)),  -- ["Business Health Checkup", ...]
  results       TEXT NOT NULL CHECK (json_valid(results)),   -- [{"value":"10 weeks","label":"to go live"}, ...]
  quote         TEXT,
  quote_author  TEXT,
  cover_image   TEXT,
  is_featured   INTEGER NOT NULL DEFAULT 0,
  is_sample     INTEGER NOT NULL DEFAULT 0,             -- placeholder content; shows a "Sample" badge
  is_published  INTEGER NOT NULL DEFAULT 1,
  published_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_stories_published ON customer_stories (is_published, published_at);

-- ---------------------------------------------------------------------------
-- Blog
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS blog_categories (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  slug        TEXT NOT NULL UNIQUE,
  name        TEXT NOT NULL,
  sort_order  INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS blog_posts (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  slug              TEXT NOT NULL UNIQUE,
  title             TEXT NOT NULL,
  excerpt           TEXT NOT NULL,
  body              TEXT NOT NULL,                      -- simple Markdown: ## headings, paragraphs, - lists, **bold**
  category_id       INTEGER NOT NULL REFERENCES blog_categories (id),
  author_name       TEXT NOT NULL DEFAULT 'O2One team',
  author_role       TEXT,
  cover_image       TEXT,
  read_minutes      INTEGER NOT NULL DEFAULT 5,
  related_service   TEXT,                               -- service slug for the "Related service" card
  related_story_id  INTEGER REFERENCES customer_stories (id) ON DELETE SET NULL,
  is_published      INTEGER NOT NULL DEFAULT 1,
  published_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  created_at        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON blog_posts (is_published, published_at);
CREATE INDEX IF NOT EXISTS idx_blog_posts_category ON blog_posts (category_id);

-- ---------------------------------------------------------------------------
-- Admin area (/admin)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS admin_users (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  email          TEXT NOT NULL UNIQUE,
  password_hash  TEXT NOT NULL,                         -- scrypt$salt$hash, never the password itself
  last_login_at  TEXT,
  created_at     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

-- Login sessions. Only a SHA-256 of the cookie token is stored.
CREATE TABLE IF NOT EXISTS admin_sessions (
  id          TEXT PRIMARY KEY,
  admin_id    INTEGER NOT NULL REFERENCES admin_users (id) ON DELETE CASCADE,
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  expires_at  TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_admin ON admin_sessions (admin_id);

-- One-time links sent by email: password reset and email-address change.
CREATE TABLE IF NOT EXISTS admin_tokens (
  token_hash  TEXT PRIMARY KEY,
  admin_id    INTEGER NOT NULL REFERENCES admin_users (id) ON DELETE CASCADE,
  kind        TEXT NOT NULL CHECK (kind IN ('password','email')),
  new_email   TEXT,
  expires_at  TEXT NOT NULL,
  used_at     TEXT
);
CREATE INDEX IF NOT EXISTS idx_admin_tokens_admin ON admin_tokens (admin_id);

-- ---------------------------------------------------------------------------
-- Uploaded images (blog and story covers). Kept in the database so they live in the same single file and its backups.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS media (
  id          TEXT PRIMARY KEY,                         -- random, so one address cannot be guessed from another
  mime        TEXT NOT NULL,                            -- image/jpeg | image/png | image/webp
  size_bytes  INTEGER NOT NULL,
  data        BLOB NOT NULL,
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

-- ---------------------------------------------------------------------------
-- "Last changed" stamps: MariaDB did this with ON UPDATE CURRENT_TIMESTAMP; SQLite needs a trigger.
-- ---------------------------------------------------------------------------
CREATE TRIGGER IF NOT EXISTS trg_checkup_bookings_updated AFTER UPDATE ON checkup_bookings
  WHEN NEW.updated_at IS OLD.updated_at
  BEGIN UPDATE checkup_bookings SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = NEW.id; END;

CREATE TRIGGER IF NOT EXISTS trg_newsletter_subscribers_updated AFTER UPDATE ON newsletter_subscribers
  WHEN NEW.updated_at IS OLD.updated_at
  BEGIN UPDATE newsletter_subscribers SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = NEW.id; END;

CREATE TRIGGER IF NOT EXISTS trg_customer_stories_updated AFTER UPDATE ON customer_stories
  WHEN NEW.updated_at IS OLD.updated_at
  BEGIN UPDATE customer_stories SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = NEW.id; END;

CREATE TRIGGER IF NOT EXISTS trg_blog_posts_updated AFTER UPDATE ON blog_posts
  WHEN NEW.updated_at IS OLD.updated_at
  BEGIN UPDATE blog_posts SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = NEW.id; END;

CREATE TRIGGER IF NOT EXISTS trg_admin_users_updated AFTER UPDATE ON admin_users
  WHEN NEW.updated_at IS OLD.updated_at
  BEGIN UPDATE admin_users SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = NEW.id; END;
