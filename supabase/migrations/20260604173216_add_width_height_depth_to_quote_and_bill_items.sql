/*
  # Add width, height, depth to quote_items and bill_items

  ## Summary
  Renames the measurement dimension fields for clarity and adds a third dimension:
  - "length" is renamed/replaced by "width"
  - "breadth" is renamed/replaced by "height"
  - New "depth" field added for 3D measurements

  ## Changes

  ### quote_items table
  - Add `width` numeric(10,2) — replaces `length`
  - Add `height` numeric(10,2) — replaces `breadth`
  - Add `depth` numeric(10,2) — new third dimension
  - Copy existing data: length → width, breadth → height

  ### bill_items table
  - Add `width` numeric(10,2) — replaces `length`
  - Add `height` numeric(10,2) — replaces `breadth`
  - Add `depth` numeric(10,2) — new third dimension
  - Copy existing data: length → width, breadth → height

  ## Notes
  - Old `length` and `breadth` columns are kept for safety (backward compatibility)
  - All new columns are nullable to be non-breaking
  - Existing data is migrated into new columns
*/

-- quote_items: add new columns
ALTER TABLE quote_items ADD COLUMN IF NOT EXISTS width numeric(10,2);
ALTER TABLE quote_items ADD COLUMN IF NOT EXISTS height numeric(10,2);
ALTER TABLE quote_items ADD COLUMN IF NOT EXISTS depth numeric(10,2);

-- quote_items: copy existing data
UPDATE quote_items SET width = length WHERE width IS NULL AND length IS NOT NULL;
UPDATE quote_items SET height = breadth WHERE height IS NULL AND breadth IS NOT NULL;

-- bill_items: add new columns
ALTER TABLE bill_items ADD COLUMN IF NOT EXISTS width numeric(10,2);
ALTER TABLE bill_items ADD COLUMN IF NOT EXISTS height numeric(10,2);
ALTER TABLE bill_items ADD COLUMN IF NOT EXISTS depth numeric(10,2);

-- bill_items: copy existing data
UPDATE bill_items SET width = length WHERE width IS NULL AND length IS NOT NULL;
UPDATE bill_items SET height = breadth WHERE height IS NULL AND breadth IS NOT NULL;
