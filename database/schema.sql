-- O2One Consultants website — MariaDB schema
-- Requires MariaDB 10.6+ (utf8mb4, generated columns, JSON_VALID).
-- Safe to re-run: tables are created only if they don't exist.

SET NAMES utf8mb4;

-- ---------------------------------------------------------------------------
-- Free Business Health Checkup bookings
-- Source: "Book Free Checkup" (header, every CTA band), the Contact page,
-- and the "Book a free readiness check" buttons on the UAE VAT page.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS checkup_bookings (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  reference       CHAR(10)     NOT NULL,                 -- shown to the visitor, e.g. O2-7KQ4MX
  full_name       VARCHAR(120) NOT NULL,
  company         VARCHAR(160) NOT NULL,
  email           VARCHAR(190) NOT NULL,
  phone           VARCHAR(40)  NOT NULL,                 -- phone / WhatsApp
  industry        VARCHAR(100) NOT NULL,
  country         VARCHAR(80)  NULL,
  message         TEXT         NULL,                     -- "What's slowing you down?" (optional)
  meeting_mode    ENUM('online','in_person') NOT NULL DEFAULT 'online',
  slot_start      DATETIME     NOT NULL,                 -- UTC
  source          ENUM('checkup','vat_readiness') NOT NULL DEFAULT 'checkup',
  readiness_items LONGTEXT     NULL CHECK (readiness_items IS NULL OR JSON_VALID(readiness_items)),
  status          ENUM('new','confirmed','completed','cancelled') NOT NULL DEFAULT 'new',
  -- One active booking per slot. Cancelled bookings release the slot.
  slot_lock       DATETIME AS (IF(status = 'cancelled', NULL, slot_start)) PERSISTENT,
  created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_bookings_reference (reference),
  UNIQUE KEY uq_bookings_slot_lock (slot_lock),
  KEY idx_bookings_status_slot (status, slot_start),
  KEY idx_bookings_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Newsletter sign-ups (Blog sidebar)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  email       VARCHAR(190) NOT NULL,
  status      ENUM('subscribed','unsubscribed') NOT NULL DEFAULT 'subscribed',
  source      VARCHAR(40)  NOT NULL DEFAULT 'blog',
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_newsletter_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Customer stories (Resources → Customer stories; teasers on Home, blog posts)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS customer_stories (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  slug          VARCHAR(160) NOT NULL,
  title         VARCHAR(200) NOT NULL,
  client_name   VARCHAR(160) NOT NULL,
  industry      VARCHAR(100) NOT NULL,                  -- matches an industry name on the Industries page
  country       VARCHAR(80)  NOT NULL,
  service_slug  VARCHAR(60)  NOT NULL,                  -- business-consultation | odoo-services | custom-industry-solutions | ai-automation
  apps          VARCHAR(255) NULL,                      -- e.g. "Sales, Inventory, Accounting"
  summary       VARCHAR(400) NOT NULL,
  challenge     TEXT         NOT NULL,
  approach      LONGTEXT     NOT NULL CHECK (JSON_VALID(approach)),  -- ["Business Health Checkup", ...]
  results       LONGTEXT     NOT NULL CHECK (JSON_VALID(results)),   -- [{"value":"10 weeks","label":"to go live"}, ...]
  quote         VARCHAR(500) NULL,
  quote_author  VARCHAR(160) NULL,
  cover_image   VARCHAR(255) NULL,
  is_featured   TINYINT(1)   NOT NULL DEFAULT 0,
  is_sample     TINYINT(1)   NOT NULL DEFAULT 0,        -- placeholder content; shows a "Sample" badge
  is_published  TINYINT(1)   NOT NULL DEFAULT 1,
  published_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_stories_slug (slug),
  KEY idx_stories_published (is_published, published_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Blog
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS blog_categories (
  id          SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  slug        VARCHAR(60)  NOT NULL,
  name        VARCHAR(80)  NOT NULL,
  sort_order  SMALLINT     NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  UNIQUE KEY uq_blog_categories_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS blog_posts (
  id                INT UNSIGNED NOT NULL AUTO_INCREMENT,
  slug              VARCHAR(160) NOT NULL,
  title             VARCHAR(200) NOT NULL,
  excerpt           VARCHAR(400) NOT NULL,
  body              MEDIUMTEXT   NOT NULL,              -- simple Markdown: ## headings, paragraphs, - lists, **bold**
  category_id       SMALLINT UNSIGNED NOT NULL,
  author_name       VARCHAR(120) NOT NULL DEFAULT 'O2One team',
  author_role       VARCHAR(120) NULL,
  cover_image       VARCHAR(255) NULL,
  read_minutes      TINYINT UNSIGNED NOT NULL DEFAULT 5,
  related_service   VARCHAR(60)  NULL,                  -- service slug for the "Related service" card
  related_story_id  INT UNSIGNED NULL,
  is_published      TINYINT(1)   NOT NULL DEFAULT 1,
  published_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_blog_posts_slug (slug),
  KEY idx_blog_posts_published (is_published, published_at),
  KEY idx_blog_posts_category (category_id),
  CONSTRAINT fk_blog_posts_category FOREIGN KEY (category_id) REFERENCES blog_categories (id),
  CONSTRAINT fk_blog_posts_story FOREIGN KEY (related_story_id) REFERENCES customer_stories (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Admin area (/admin)
-- ---------------------------------------------------------------------------
-- Private notes the team keeps on a booking.
ALTER TABLE checkup_bookings ADD COLUMN IF NOT EXISTS admin_notes TEXT NULL;

CREATE TABLE IF NOT EXISTS admin_users (
  id             INT UNSIGNED NOT NULL AUTO_INCREMENT,
  email          VARCHAR(190) NOT NULL,
  password_hash  VARCHAR(255) NOT NULL,                 -- scrypt$salt$hash, never the password itself
  last_login_at  DATETIME     NULL,
  created_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_admin_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Login sessions. Only a SHA-256 of the cookie token is stored.
CREATE TABLE IF NOT EXISTS admin_sessions (
  id          CHAR(64)     NOT NULL,
  admin_id    INT UNSIGNED NOT NULL,
  created_at  DATETIME     NOT NULL DEFAULT UTC_TIMESTAMP(),
  expires_at  DATETIME     NOT NULL,
  PRIMARY KEY (id),
  KEY idx_admin_sessions_admin (admin_id),
  CONSTRAINT fk_admin_sessions_admin FOREIGN KEY (admin_id) REFERENCES admin_users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- One-time links sent by email: password reset and email-address change.
CREATE TABLE IF NOT EXISTS admin_tokens (
  token_hash  CHAR(64)     NOT NULL,
  admin_id    INT UNSIGNED NOT NULL,
  kind        ENUM('password','email') NOT NULL,
  new_email   VARCHAR(190) NULL,
  expires_at  DATETIME     NOT NULL,
  used_at     DATETIME     NULL,
  PRIMARY KEY (token_hash),
  KEY idx_admin_tokens_admin (admin_id),
  CONSTRAINT fk_admin_tokens_admin FOREIGN KEY (admin_id) REFERENCES admin_users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Uploaded images (blog and story covers). Kept in the database so they persist wherever the app is
-- hosted (including serverless hosts with no permanent disk) and are included in the usual DB backups.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS media (
  id          CHAR(32)     NOT NULL,                    -- random, so one address cannot be guessed from another
  mime        VARCHAR(30)  NOT NULL,                    -- image/jpeg | image/png | image/webp
  size_bytes  INT UNSIGNED NOT NULL,
  data        MEDIUMBLOB   NOT NULL,
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
