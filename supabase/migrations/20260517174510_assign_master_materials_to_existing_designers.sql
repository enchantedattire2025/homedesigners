/*
  # Assign Master Materials to Existing Designers

  ## Summary
  Designers who registered before the material pricing master system was created
  have no materials in their designer_material_prices table. This migration copies
  the active master materials to any designer who currently has zero materials.

  ## Changes
  - Inserts master materials into designer_material_prices for designers with empty catalogs
  - Only affects designers who have 0 materials currently
  - Uses the same logic as the auto-assign trigger

  ## Important Notes
  - This is a one-time data backfill for existing designers
  - New designers will continue to receive materials via the existing trigger
  - Designers who already have materials are not affected
*/

INSERT INTO designer_material_prices (
  designer_id,
  category,
  name,
  description,
  unit,
  base_price,
  discount_price,
  is_discounted,
  brand,
  quality_grade,
  is_available
)
SELECT
  d.id,
  mpm.category,
  mpm.name,
  mpm.description,
  mpm.unit,
  mpm.base_price,
  NULL,
  false,
  mpm.brand,
  mpm.quality_grade,
  true
FROM designers d
CROSS JOIN material_pricing_master mpm
WHERE mpm.is_active = true
AND NOT EXISTS (
  SELECT 1 FROM designer_material_prices dmp
  WHERE dmp.designer_id = d.id
  LIMIT 1
);