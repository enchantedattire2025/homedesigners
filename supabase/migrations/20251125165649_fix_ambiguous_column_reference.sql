/*
  # Fix Ambiguous Column Reference in Helper Functions

  1. Problem
    - Functions is_assigned_designer() and has_project_share_access() have ambiguous column references
    - The parameter name "customer_id" conflicts with potential column names in queries

  2. Solution
    - Explicitly qualify all column references in the functions
    - Use proper aliasing to avoid ambiguity
*/

-- Recreate helper function with explicit column qualification
CREATE OR REPLACE FUNCTION is_assigned_designer(customer_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  designer_id_val uuid;
BEGIN
  -- Get the designer ID for the current user without triggering RLS
  SELECT d.id INTO designer_id_val
  FROM designers d
  WHERE d.user_id = auth.uid()
  LIMIT 1;
  
  IF designer_id_val IS NULL THEN
    RETURN false;
  END IF;
  
  -- Check if this designer is assigned to the customer project
  RETURN EXISTS (
    SELECT 1 FROM customers c
    WHERE c.id = is_assigned_designer.customer_id
    AND c.assigned_designer_id = designer_id_val
  );
END;
$$;

-- Recreate helper function with explicit column qualification
CREATE OR REPLACE FUNCTION has_project_share_access(customer_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  designer_email_val text;
BEGIN
  -- Get the designer email for the current user without triggering RLS
  SELECT d.email INTO designer_email_val
  FROM designers d
  WHERE d.user_id = auth.uid()
  LIMIT 1;
  
  IF designer_email_val IS NULL THEN
    RETURN false;
  END IF;
  
  -- Check if there's a project share for this designer
  RETURN EXISTS (
    SELECT 1 FROM project_shares ps
    WHERE ps.project_id = has_project_share_access.customer_id
    AND ps.designer_email = designer_email_val
  );
END;
$$;
