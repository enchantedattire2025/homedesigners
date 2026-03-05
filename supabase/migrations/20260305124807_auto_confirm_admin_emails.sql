/*
  # Auto-confirm Admin User Emails

  1. Purpose
    - Automatically confirm email addresses for admin users upon creation
    - Eliminates the need for manual email confirmation for admin accounts
    - Ensures admins can log in immediately after signup

  2. Implementation
    - Create a function that confirms the email in auth.users
    - Create a trigger that runs after admin_users insert
    - Updates email_confirmed_at timestamp automatically

  3. Security
    - Only triggers for admin_users table
    - Does not affect regular customer/designer email confirmation flow
    - Maintains security for non-admin accounts
*/

-- Function to auto-confirm admin email
CREATE OR REPLACE FUNCTION confirm_admin_email()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the auth.users table to confirm the email
  UPDATE auth.users
  SET email_confirmed_at = NOW()
  WHERE id = NEW.user_id
  AND email_confirmed_at IS NULL;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS auto_confirm_admin_email ON admin_users;

-- Create trigger to auto-confirm admin email after insert
CREATE TRIGGER auto_confirm_admin_email
  AFTER INSERT ON admin_users
  FOR EACH ROW
  EXECUTE FUNCTION confirm_admin_email();
