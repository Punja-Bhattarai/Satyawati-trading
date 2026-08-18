-- ============================================================
-- Satyawati Trading & Paints Suppliers
-- Supabase setup: paste this whole file into the Supabase
-- SQL Editor (Dashboard -> SQL Editor -> New query -> Run)
-- ============================================================

-- Users (customer accounts)
CREATE TABLE IF NOT EXISTS users (
  id            BIGSERIAL PRIMARY KEY,
  name          TEXT NOT NULL,
  phone         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Products (seed catalogue)
CREATE TABLE IF NOT EXISTS products (
  id       BIGSERIAL PRIMARY KEY,
  name     TEXT NOT NULL,
  category TEXT,
  price    NUMERIC,
  unit     TEXT,
  kind     TEXT,
  color    TEXT,
  tag      TEXT,
  img      TEXT
);

-- Orders (cart checkouts)
CREATE TABLE IF NOT EXISTS orders (
  id             BIGSERIAL PRIMARY KEY,
  customer_name  TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  total          NUMERIC,
  items_json     TEXT,
  user_id        BIGINT REFERENCES users(id),
  status         TEXT NOT NULL DEFAULT 'new',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enquiries (contact form)
CREATE TABLE IF NOT EXISTS messages (
  id         BIGSERIAL PRIMARY KEY,
  name       TEXT NOT NULL,
  phone      TEXT,
  subject    TEXT,
  message    TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS designs (
  id             BIGSERIAL PRIMARY KEY,
  user_id        BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name           TEXT NOT NULL DEFAULT 'My Design',
  original_image TEXT,
  final_image    TEXT,
  shades         JSONB NOT NULL DEFAULT '[]',
  regions        JSONB NOT NULL DEFAULT '[]',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed products (only when the table is empty)
INSERT INTO products (id, name, category, price, unit, kind, color, tag, img)
SELECT * FROM (VALUES
  (1,  'Royale Luxury Emulsion',     'interior', 450, 'L',  NULL, NULL, NULL, 'royale-luxury.png'),
  (2,  'Royale Shyne',               'interior', 620, 'L',  NULL, NULL, NULL, 'royale-shyne.png'),
  (3,  'Royale Aspira',              'interior', 520, 'L',  NULL, NULL, NULL, 'royale-aspira.png'),
  (4,  'Royale Blynn',               'interior', 470, 'L',  NULL, NULL, NULL, 'royale-blynn.png'),
  (5,  'Apcolite Premium Emulsion',  'interior', 310, 'L',  NULL, NULL, NULL, 'apcolite-premium.png'),
  (6,  'Tractor Shine Emulsion',     'interior', 220, 'L',  NULL, NULL, NULL, 'tractor-shine.png'),
  (7,  'Tractor Emulsion',           'interior', 185, 'L',  NULL, NULL, NULL, 'tractor-emulsion.png'),
  (8,  'Apex Ultima',                'exterior', 480, 'L',  NULL, NULL, NULL, 'apex-ultima.png'),
  (9,  'Apex Ultima Protek Shyne',   'exterior', 650, 'L',  NULL, NULL, NULL, 'apex-ultima-protek-shyne.png'),
  (10, 'Apex Ultima Protek',         'exterior', 560, 'L',  NULL, NULL, NULL, 'apex-ultima-protek.png'),
  (11, 'Apex Weatherproof Emulsion', 'exterior', 390, 'L',  NULL, NULL, NULL, 'apex-weatherproof.png'),
  (12, 'Ace',                        'exterior', 330, 'L',  NULL, NULL, NULL, 'ace.png'),
  (13, 'Ace Shyne',                  'exterior', 430, 'L',  NULL, NULL, NULL, 'ace-shyne.png'),
  (14, 'Interior Wall Primer',       'primer',   180, 'L',  'drum',  '#e8e4da', NULL, NULL),
  (15, 'Exterior Wall Primer',       'primer',   210, 'L',  'drum',  '#d8d2c0', NULL, NULL),
  (16, 'Paint Brush 1"',             'brush',    60,  'pc', 'brush',  NULL, '1 inch', NULL),
  (17, 'Paint Brush 1.5"',           'brush',    80,  'pc', 'brush',  NULL, '1.5 inch', NULL),
  (18, 'Paint Brush 2"',             'brush',    100, 'pc', 'brush',  NULL, '2 inch', NULL),
  (19, 'Paint Brush 2.5"',           'brush',    120, 'pc', 'brush',  NULL, '2.5 inch', NULL),
  (20, 'Paint Brush 3"',             'brush',    150, 'pc', 'brush',  NULL, '3 inch', NULL),
  (21, 'Roller 4"',                  'roller',   90,  'pc', 'roller', NULL, '4 inch', NULL),
  (22, 'Roller 7"',                  'roller',   130, 'pc', 'roller', NULL, '7 inch', NULL),
  (23, 'Roller 9"',                  'roller',   160, 'pc', 'roller', NULL, '9 inch', NULL),
  (24, 'Roller Tray & Set',          'roller',   250, 'pc', 'roller', NULL, 'complete set', NULL),
  (25, 'SmartCare Damp Proof',       'waterproofing', 350, 'L', 'drum', '#cfe6f5', NULL, NULL),
  (26, 'SmartCare Hydroloc Xtreme',  'waterproofing', 650, 'L', 'drum', '#dfeef7', NULL, NULL),
  (27, 'Metal Primer',               'enamel',   220, 'L', 'drum', '#8f9296', NULL, NULL),
  (28, 'Wood Primer (Pink)',         'enamel',   250, 'L', 'drum', '#f2b6c0', NULL, NULL),
  (29, 'Wood Primer (White)',        'enamel',   250, 'L', 'drum', '#f4f2ed', NULL, NULL),
  (30, 'Premium Gloss Enamel — Blaze White',    'enamel', 380, 'L', 'drum', '#ffffff', NULL, NULL),
  (31, 'Premium Gloss Enamel — PGE Brown',      'enamel', 380, 'L', 'drum', '#6b4423', NULL, NULL),
  (32, 'Premium Gloss Enamel — Golden Yellow',  'enamel', 380, 'L', 'drum', '#f5c518', NULL, NULL),
  (33, 'Premium Gloss Enamel — Black',          'enamel', 380, 'L', 'drum', '#1a1a1a', NULL, NULL),
  (34, 'Premium Gloss Enamel — Smokey Grey',    'enamel', 380, 'L', 'drum', '#6e7275', NULL, NULL),
  (35, 'WoodTech GP Thinner (Turpentine)',      'enamel', 160, 'L', 'drum', '#f7f3e6', NULL, NULL)
) AS v(id, name, category, price, unit, kind, color, tag, img)
WHERE NOT EXISTS (SELECT 1 FROM products);

-- Reset the sequence so new products keep numbering after the seeded ids
SELECT setval('products_id_seq', (SELECT COALESCE(MAX(id), 0) FROM products));