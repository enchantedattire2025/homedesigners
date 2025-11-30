/*
  # Fix Public Projects Policy to Use Assignment Status

  ## Overview
  The previous policy checked for `status = 'completed'`, but the application
  uses `assignment_status = 'completed'` to track project completion.
  This migration updates the policy to use the correct field.

  ## Changes
  1. Drop the incorrect policy
  2. Create a new policy checking `assignment_status = 'completed'`

  ## Security
  - Only projects with assignment_status = 'completed' are visible to public
  - Projects with other assignment_status values remain private
*/

-- Drop the old policy
DROP POLICY IF EXISTS "Anyone can view completed projects" ON customers;

-- Create the corrected policy
CREATE POLICY "Anyone can view completed projects"
  ON customers FOR SELECT
  TO anon, authenticated
  USING (assignment_status = 'completed');
