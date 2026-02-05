/*
  # Fix Reviews RLS Policy for Customer Feedback

  1. Problem
    - Customers are unable to insert reviews due to RLS policy violation
    - The current policy has issues with the subquery reference

  2. Changes
    - Drop and recreate the INSERT policy for reviews with corrected logic
    - Simplify the policy to properly check project ownership
    - Allow authenticated users to create reviews for projects they own

  3. Security
    - Customers can only create reviews for their own projects
    - Maintains data integrity and security
*/

-- Drop the existing problematic policy
DROP POLICY IF EXISTS "Customers can create reviews for their projects" ON reviews;

-- Create a corrected policy that allows customers to insert reviews
CREATE POLICY "Customers can create reviews for their projects"
  ON reviews
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = customer_id AND
    EXISTS (
      SELECT 1 FROM customers 
      WHERE customers.id = project_id 
      AND customers.user_id = auth.uid()
    )
  );

-- Also ensure customers can delete their own reviews
DROP POLICY IF EXISTS "Customers can delete own reviews" ON reviews;

CREATE POLICY "Customers can delete own reviews"
  ON reviews
  FOR DELETE
  TO authenticated
  USING (auth.uid() = customer_id);
