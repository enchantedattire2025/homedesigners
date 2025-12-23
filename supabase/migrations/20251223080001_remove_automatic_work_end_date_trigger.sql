/*
  # Remove Automatic Work End Date Trigger

  1. Changes
    - Drop the trigger that automatically sets work_end_date when status is finalized
    - Drop the associated function
    
  2. Reason
    - Designer should manually enter work_end_date, not automatic
*/

-- Drop the trigger
DROP TRIGGER IF EXISTS trigger_set_work_end_date ON customers;

-- Drop the function
DROP FUNCTION IF EXISTS set_work_end_date_on_finalized();

-- Update column comment
COMMENT ON COLUMN customers.work_end_date IS 'Date when work ends, manually set by designer';
