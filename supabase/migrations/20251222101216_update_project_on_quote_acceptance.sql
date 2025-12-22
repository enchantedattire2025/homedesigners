/*
  # Update Project Assignment on Quote Acceptance

  1. Changes
    - Create a trigger that automatically updates the customers table when a quote is accepted
    - When customer_accepted becomes true, update the project's assignment_status to 'assigned'
    - Ensure assigned_designer_id is set correctly

  2. Security
    - Uses SECURITY DEFINER to ensure proper permissions
    - Only updates when customer_accepted changes from false/null to true
*/

-- Create function to update project assignment status when quote is accepted
CREATE OR REPLACE FUNCTION update_project_on_quote_acceptance()
RETURNS TRIGGER AS $$
BEGIN
  -- When a quote is accepted (customer_accepted becomes true)
  IF NEW.customer_accepted = true AND (OLD.customer_accepted IS NULL OR OLD.customer_accepted = false) THEN
    -- Update the project's assignment_status to 'assigned' and ensure designer is assigned
    UPDATE customers
    SET 
      assignment_status = 'assigned',
      assigned_designer_id = NEW.designer_id,
      updated_at = now()
    WHERE id = NEW.project_id
      AND assignment_status = 'shared';  -- Only update if currently in 'shared' status
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS trigger_update_project_on_quote_acceptance ON designer_quotes;

-- Create trigger on designer_quotes table
CREATE TRIGGER trigger_update_project_on_quote_acceptance
  AFTER UPDATE ON designer_quotes
  FOR EACH ROW
  WHEN (NEW.customer_accepted = true AND (OLD.customer_accepted IS NULL OR OLD.customer_accepted = false))
  EXECUTE FUNCTION update_project_on_quote_acceptance();
