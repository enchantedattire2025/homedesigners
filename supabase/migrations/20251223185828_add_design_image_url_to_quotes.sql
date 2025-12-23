/*
  # Add 2D Design Image Support to Designer Quotes

  1. Changes
    - Add `design_image_url` column to `designer_quotes` table
      - Stores URL to 2D design tool canvas image
      - Allows designers to attach visual floor plans/designs to quotes
      - Helps customers visualize the proposed design

  2. Security
    - Existing RLS policies cover this new field
    - Images stored in quotation-attachments bucket with path: {quote_id}/design/{filename}
*/

-- Add design image URL column
ALTER TABLE designer_quotes 
ADD COLUMN IF NOT EXISTS design_image_url text;

-- Add helpful comment
COMMENT ON COLUMN designer_quotes.design_image_url IS 'URL to the 2D design tool canvas image created by the designer for this quote';
