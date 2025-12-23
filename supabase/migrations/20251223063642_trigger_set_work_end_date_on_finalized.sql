/*
  # Trigger to Set Work End Date When Project is Finalized

  1. Purpose
    - Automatically set work_end_date when assignment_status changes to 'finalized'
    - Only sets the date if it hasn't been set already

  2. Security
    - Uses SECURITY DEFINER for proper permissions
    - Only triggers when status actually changes to 'finalized'
*/

-- Create function to set work end date
CREATE OR REPLACE FUNCTION set_work_end_date_on_finalized()
RETURNS TRIGGER AS $$
BEGIN
  -- When project status changes to 'finalized' and work_end_date is not already set
  IF NEW.assignment_status = 'finalized' 
     AND (OLD.assignment_status IS NULL OR OLD.assignment_status != 'finalized')
     AND NEW.work_end_date IS NULL THEN
    NEW.work_end_date := now();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS trigger_set_work_end_date ON customers;

-- Create trigger on customers table
CREATE TRIGGER trigger_set_work_end_date
  BEFORE UPDATE ON customers
  FOR EACH ROW
  WHEN (NEW.assignment_status = 'finalized' AND (OLD.assignment_status IS NULL OR OLD.assignment_status != 'finalized'))
  EXECUTE FUNCTION set_work_end_date_on_finalized();
