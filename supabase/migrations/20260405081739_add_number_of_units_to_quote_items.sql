/*
  # Add Number of Units Field to Quote Items

  1. Changes
    - Add `number_of_units` column to quote_items table (numeric, default 1)
    - This field represents the count/quantity of items
    - The existing `quantity` field will represent total square footage

  2. Purpose
    - Separate item count from area measurement
    - Example: 5 pieces of material, each covering 10 sq ft = number_of_units: 5, quantity: 50
    - Provides clearer breakdown for quotations

  3. Notes
    - Default value of 1 for backward compatibility
    - Numeric type allows decimal values if needed
    - Both fields will be used together for accurate pricing
*/

-- Add number_of_units column to quote_items table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quote_items' AND column_name = 'number_of_units'
  ) THEN
    ALTER TABLE quote_items ADD COLUMN number_of_units numeric(10,2) DEFAULT 1 NOT NULL;
  END IF;
END $$;