/*
  # Add business type fields to designers table

  ## Summary
  Adds two new optional columns to the `designers` table to capture how a designer operates:

  ## New Columns
  - `business_type` (text): Whether the designer has a physical "google_location" or operates as "virtual". Nullable — existing records unaffected.
  - `google_location_url` (text): The Google Maps URL or business name/address for designers with a physical location. Nullable.

  ## Notes
  - Both columns are optional and nullable to avoid breaking existing records
  - No RLS changes needed — existing policies on `designers` already cover these columns
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'designers' AND column_name = 'business_type'
  ) THEN
    ALTER TABLE designers ADD COLUMN business_type text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'designers' AND column_name = 'google_location_url'
  ) THEN
    ALTER TABLE designers ADD COLUMN google_location_url text;
  END IF;
END $$;
