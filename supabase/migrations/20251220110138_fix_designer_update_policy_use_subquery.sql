/*
  # Fix Designer Update Policy to Use Proper ID Matching

  1. Changes
    - Drop the incorrect policy that compared designer table ID to auth.uid()
    - Create new policy that properly checks if the logged-in user is the assigned designer
    - Uses a subquery to match auth.uid() with the designer's user_id from the designers table
    
  2. Security
    - Policy allows designers to update projects where they are assigned
    - Properly handles the relationship between auth users and designer profiles
    - Ensures only the assigned designer can update their projects
*/

-- Drop the incorrect policy
DROP POLICY IF EXISTS "Designers can update assigned project status" ON customers;

-- Create correct policy that checks designer assignment through the designers table
CREATE POLICY "Designers can update assigned project status"
  ON customers
  FOR UPDATE
  TO authenticated
  USING (
    assigned_designer_id IN (
      SELECT id FROM designers WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    assigned_designer_id IN (
      SELECT id FROM designers WHERE user_id = auth.uid()
    )
  );
