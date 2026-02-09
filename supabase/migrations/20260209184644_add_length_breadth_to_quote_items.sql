/*
  # Add Length and Breadth Fields to Quote Items
  
  1. Changes
    - Add `length` column to quote_items table (numeric, nullable)
    - Add `breadth` column to quote_items table (numeric, nullable)
  
  2. Purpose
    - Allow designers to specify material dimensions when creating quotations
    - Useful for materials like quartz, tiles, flooring where size matters
    - Example: Quartz countertop with length 10 ft and breadth 5 ft
  
  3. Notes
    - Fields are optional (nullable) as not all items require dimensions
    - Numeric type allows decimal values (e.g., 10.5 ft)
*/

-- Add length column to quote_items table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quote_items' AND column_name = 'length'
  ) THEN
    ALTER TABLE quote_items ADD COLUMN length numeric(10,2);
  END IF;
END $$;

-- Add breadth column to quote_items table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quote_items' AND column_name = 'breadth'
  ) THEN
    ALTER TABLE quote_items ADD COLUMN breadth numeric(10,2);
  END IF;
END $$;