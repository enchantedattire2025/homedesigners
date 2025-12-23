/*
  # Allow Designers to View Their Own Quotations

  ## Overview
  This migration adds a missing RLS policy that allows designers to view quotations they created.
  Without this policy, designers cannot see their own draft/sent quotes when trying to attach designs.

  ## Changes
  
  1. New Policy
    - Policy Name: "Designers can view their own quotes"
    - Allows designers to SELECT quotes where designer_id matches their own designer record
  
  ## Security
  - Policy is restrictive - designers can only see their own quotes
  - Uses authenticated user check via auth.uid()
  - Verifies designer ownership through designers table
*/

-- Drop the policy if it exists (in case of re-run)
DO $$
BEGIN
  DROP POLICY IF EXISTS "Designers can view their own quotes" ON designer_quotes;
END $$;

-- Policy: Allow designers to view their own quotes
CREATE POLICY "Designers can view their own quotes"
ON designer_quotes
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM designers
    WHERE designers.id = designer_quotes.designer_id
    AND designers.user_id = auth.uid()
  )
);
