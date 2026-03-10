-- Inventory table for out-of-stock tracking
-- Populated by Cleo scraping order.toasttab.com/online/sunright-tea-studio-{city}
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS inventory (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  location    TEXT        NOT NULL,
  item_name   TEXT        NOT NULL,
  is_available BOOLEAN    DEFAULT true,
  checked_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups by location and availability
CREATE INDEX IF NOT EXISTS idx_inventory_location ON inventory (location);
CREATE INDEX IF NOT EXISTS idx_inventory_available ON inventory (is_available, checked_at DESC);

-- Enable Row Level Security
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;

-- anon can read
CREATE POLICY "anon read inventory"
  ON inventory FOR SELECT TO anon USING (true);

-- service_role can write
CREATE POLICY "service write inventory"
  ON inventory FOR ALL TO service_role USING (true);

-- Grant read to anon/authenticated
GRANT SELECT ON inventory TO anon, authenticated;

-- Comments
COMMENT ON TABLE inventory IS 'Per-location item availability, scraped from Toast Tab by Cleo';
COMMENT ON COLUMN inventory.location IS 'Store city name, e.g. Irvine, Koreatown';
COMMENT ON COLUMN inventory.item_name IS 'Menu item name as it appears on Toast Tab';
COMMENT ON COLUMN inventory.is_available IS 'false = out of stock / 86''d';
COMMENT ON COLUMN inventory.checked_at IS 'Timestamp of last scrape';
