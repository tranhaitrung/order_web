-- Schema for IT HOUSE ordering: product menu + orders.
-- Applied via `npm run db:migrate` (see scripts/migrate.mjs).

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS toppings (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price INTEGER NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS menu_items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price INTEGER NOT NULL,
  category_id TEXT NOT NULL REFERENCES categories (id),
  must_try BOOLEAN NOT NULL DEFAULT FALSE,
  image_src TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_sold_out BOOLEAN NOT NULL DEFAULT FALSE
);

ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS is_sold_out BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS menu_items_category_id_idx ON menu_items (category_id);

-- Optional per-item sizes (e.g. Nhỏ/Vừa/Lớn), each with its own price. An item with no rows here has no sizes.
CREATE TABLE IF NOT EXISTS menu_item_sizes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_item_id TEXT NOT NULL REFERENCES menu_items (id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  price INTEGER NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS menu_item_sizes_menu_item_id_idx ON menu_item_sizes (menu_item_id);

-- Latest known name/address per phone number, kept up to date on every order. Powers auto-fill
-- for return customers, including on a different browser/device than their last order.
CREATE TABLE IF NOT EXISTS customers (
  phone TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  delivery_address TEXT NOT NULL,
  delivery_date DATE NOT NULL,
  delivery_slot TEXT NOT NULL,
  total INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS orders_customer_phone_idx ON orders (customer_phone);

CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
  item_id TEXT NOT NULL,
  item_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  sugar_level TEXT NOT NULL,
  ice_level TEXT NOT NULL,
  note TEXT,
  toppings JSONB NOT NULL DEFAULT '[]',
  line_total INTEGER NOT NULL,
  size_id TEXT,
  size_label TEXT
);

ALTER TABLE order_items ADD COLUMN IF NOT EXISTS size_id TEXT;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS size_label TEXT;

CREATE INDEX IF NOT EXISTS order_items_order_id_idx ON order_items (order_id);

-- Single-row switch controlling whether the storefront currently accepts new orders.
CREATE TABLE IF NOT EXISTS store_status (
  id INTEGER PRIMARY KEY DEFAULT 1,
  is_closed BOOLEAN NOT NULL DEFAULT FALSE,
  closed_scope TEXT,
  closed_from TIMESTAMPTZ,
  closed_until TIMESTAMPTZ,
  closed_note TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT store_status_single_row CHECK (id = 1)
);

ALTER TABLE store_status ADD COLUMN IF NOT EXISTS closed_from TIMESTAMPTZ;

INSERT INTO store_status (id, is_closed) VALUES (1, FALSE) ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_name TEXT NOT NULL,
  amount INTEGER NOT NULL,
  note TEXT,
  purchased_at DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS expenses_purchased_at_idx ON expenses (purchased_at);

-- Manual revenue entries admins can add by hand (e.g. cash sales not placed through the ordering flow).
-- Included alongside `orders` when computing revenue stats.
CREATE TABLE IF NOT EXISTS manual_revenue_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  amount INTEGER NOT NULL,
  note TEXT,
  entry_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS manual_revenue_entries_entry_date_idx ON manual_revenue_entries (entry_date);
