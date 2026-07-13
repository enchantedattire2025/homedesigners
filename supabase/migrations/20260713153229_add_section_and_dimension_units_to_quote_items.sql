/*
  # Add Section + Per-Dimension Units to quote_items

  ## Summary
  Extends quote_items to support two distinct sections in a quotation:
  - "On-Site Work" — existing behavior (materials selected from material list).
  - "Modular Work" — custom items (e.g. kitchen lower cabinets) described by
    width x height x depth, each in a chosen unit (mm / inch / feet), and
    priced per square foot. The final amount is computed by converting the
    dimensions to feet, calculating the area in sq ft, and multiplying by the
    per-sq-ft rate.

  ## New Columns on quote_items

  1. section text NOT NULL DEFAULT 'on_site'
     - Values: 'on_site' | 'modular'
     - Groups items into the two sections of the quotation.

  2. width_unit text NULL
     - Unit the width was entered in: 'mm' | 'inch' | 'feet'.
     - NULL for on-site items.

  3. height_unit text NULL
     - Unit the height was entered in: 'mm' | 'inch' | 'feet'.
     - NULL for on-site items.

  4. depth_unit text NULL
     - Unit the depth was entered in: 'mm' | 'inch' | 'feet'.
     - NULL for on-site items.

  5. area_sqft numeric(12,2) NULL
     - Area converted to square feet (width_ft * height_ft).
     - Stored for modular items so the viewer can show it without recomputing.

  6. per_sqft_rate numeric(12,2) NULL
     - Price per square foot entered at the top of the Modular Work section.
     - For modular items only.

  ## Notes
  - All new columns are nullable (except section, which defaults to 'on_site')
    so existing on-site rows remain valid without changes.
  - No existing columns are dropped or type-changed — no data loss.
  - Existing rows default to section = 'on_site', preserving current behavior.
*/

ALTER TABLE quote_items
  ADD COLUMN IF NOT EXISTS section text NOT NULL DEFAULT 'on_site';

ALTER TABLE quote_items
  ADD COLUMN IF NOT EXISTS width_unit text;

ALTER TABLE quote_items
  ADD COLUMN IF NOT EXISTS height_unit text;

ALTER TABLE quote_items
  ADD COLUMN IF NOT EXISTS depth_unit text;

ALTER TABLE quote_items
  ADD COLUMN IF NOT EXISTS area_sqft numeric(12,2);

ALTER TABLE quote_items
  ADD COLUMN IF NOT EXISTS per_sqft_rate numeric(12,2);
