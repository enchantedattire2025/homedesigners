/*
  # Add missing designer UPDATE policy and has_accepted_quote helper on customers

  ## Problem
  Designers cannot see assigned/shared projects in the shared section because:
  1. The "Designers can update assigned projects" UPDATE policy is missing —
     designers can read (via is_assigned_designer) but cannot update project
     status, which some flows require.
  2. The has_accepted_quote() helper function is missing, so the customer
     UPDATE policy that prevents edits after quote acceptance cannot work.

  ## Fix
  1. Recreate has_accepted_quote() as a SECURITY DEFINER function.
  2. Replace the customer UPDATE policy with the quote-acceptance-aware version.
  3. Add the designer UPDATE policy for assigned projects.
*/

-- Helper function: does this project have an accepted quote? (bypasses RLS)
CREATE OR REPLACE FUNCTION has_accepted_quote(p_project_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  v_has_quote boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM designer_quotes
    WHERE project_id = p_project_id
      AND customer_accepted = true
      AND status = 'accepted'
  ) INTO v_has_quote;

  RETURN v_has_quote;
END;
$$;
GRANT EXECUTE ON FUNCTION has_accepted_quote(uuid) TO authenticated;

-- Replace customer UPDATE policy with quote-acceptance-aware version
DROP POLICY IF EXISTS "Customers can update own projects" ON customers;
DROP POLICY IF EXISTS "Customers can update own projects before quote acceptance" ON customers;
CREATE POLICY "Customers can update own projects before quote acceptance"
  ON customers FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id
    AND NOT has_accepted_quote(id)
  )
  WITH CHECK (
    auth.uid() = user_id
    AND NOT has_accepted_quote(id)
  );

-- Add designer UPDATE policy for assigned projects
DROP POLICY IF EXISTS "Designers can update assigned projects" ON customers;
DROP POLICY IF EXISTS "Designers can update assigned project status" ON customers;
CREATE POLICY "Designers can update assigned projects"
  ON customers FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM designers
      WHERE designers.user_id = auth.uid()
        AND designers.id = customers.assigned_designer_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM designers
      WHERE designers.user_id = auth.uid()
        AND designers.id = customers.assigned_designer_id
    )
  );

-- Index for faster accepted-quote lookups
CREATE INDEX IF NOT EXISTS idx_designer_quotes_project_accepted
  ON designer_quotes(project_id, customer_accepted, status)
  WHERE customer_accepted = true;
