/*
  # Remove title and description from wallpapers_3d table

  1. Changes
    - Drop `title` column from wallpapers_3d table
    - Drop `description` column from wallpapers_3d table
    
  2. Reason
    - Wallpapers are now organized by category only
    - No need for individual titles and descriptions
    - Admin can upload multiple images per category
*/

-- Remove title and description columns
ALTER TABLE wallpapers_3d
DROP COLUMN IF EXISTS title,
DROP COLUMN IF EXISTS description;
