/*
  # Fix Quote Acceptance Trigger

  1. Changes
    - Fix the track_quote_acceptance() function to handle cases where user_type cannot be determined
    - Add better error handling for the changed_by_type field
    - Ensure the trigger doesn't fail when user type is ambiguous
  
  2. Security
    - Maintains existing RLS policies
    - Ensures history tracking continues to work properly
*/

-- Recreate the function with better error handling
CREATE OR REPLACE FUNCTION track_quote_acceptance()
RETURNS TRIGGER AS $$
DECLARE
  user_type_val TEXT;
  current_user_id UUID;
BEGIN
  -- Get current user ID
  current_user_id := auth.uid();
  
  -- Determine user type with fallback
  IF current_user_id IS NULL THEN
    user_type_val := 'system';
  ELSIF EXISTS (SELECT 1 FROM designers WHERE user_id = current_user_id) THEN
    user_type_val := 'designer';
  ELSIF EXISTS (SELECT 1 FROM customers WHERE user_id = current_user_id) THEN
    user_type_val := 'customer';
  ELSE
    -- Fallback: check which table owns the project to determine the user type
    IF EXISTS (SELECT 1 FROM customers WHERE id = NEW.project_id) THEN
      user_type_val := 'customer';
    ELSE
      user_type_val := 'system';
    END IF;
  END IF;

  -- Set acceptance date if newly accepted
  IF NEW.customer_accepted = true AND (OLD.customer_accepted IS NULL OR OLD.customer_accepted = false) THEN
    NEW.acceptance_date := now();
    
    -- Update status to 'accepted' if customer accepted
    IF user_type_val = 'customer' THEN
      NEW.status := 'accepted';
    END IF;
  END IF;
  
  -- If customer rejected, update status
  IF NEW.customer_accepted = false AND OLD.customer_accepted = true AND user_type_val = 'customer' THEN
    NEW.status := 'rejected';
  END IF;
  
  -- Record the change in history if status changed
  IF OLD.status IS DISTINCT FROM NEW.status OR OLD.customer_accepted IS DISTINCT FROM NEW.customer_accepted THEN
    INSERT INTO quote_acceptance_history (
      quote_id,
      previous_status,
      new_status,
      changed_by,
      changed_by_type,
      feedback,
      created_at
    ) VALUES (
      NEW.id,
      OLD.status,
      NEW.status,
      current_user_id,
      user_type_val,
      NEW.customer_feedback,
      now()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;