/*
  # Add source_unit and target_unit to bill_items, deprecate discount_percent

  1. Changes to bill_items table
     - Add `source_unit` (text, nullable) — the unit in which length/breadth values are entered (e.g. mm, cm, inch, feet)
     - Add `target_unit` (text, nullable) — the unit for the final quantity (e.g. sq.ft, sq.m) after conversion
     - Keep `discount_percent` column but it will no longer be used in new UI (kept for backward compatibility with existing records)

  2. Notes
     - source_unit and target_unit are optional; if not set, no conversion is applied
     - Conversion happens client-side before storing the final quantity
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bill_items' AND column_name = 'source_unit'
  ) THEN
    ALTER TABLE bill_items ADD COLUMN source_unit text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bill_items' AND column_name = 'target_unit'
  ) THEN
    ALTER TABLE bill_items ADD COLUMN target_unit text;
  END IF;
END $$;
