/*
  # Add address column to customers table

  1. Changes
    - Add `address` column to `customers` table to support detailed address storage
    - This is needed for wallpaper orders which require full delivery address
    - The existing `location` column is kept for backward compatibility

  2. Notes
    - `address` is optional (nullable) to maintain compatibility with existing records
    - New wallpaper orders will populate this field with full address
*/

-- Add address column to customers table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers' AND column_name = 'address'
  ) THEN
    ALTER TABLE customers ADD COLUMN address text;
  END IF;
END $$;