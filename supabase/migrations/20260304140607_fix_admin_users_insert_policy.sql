/*
  # Fix Admin Users Insert Policy

  1. Problem
    - Current RLS policies prevent new admin users from being created during signup
    - Only super admins can insert, but there's no super admin during first signup
  
  2. Changes
    - Add policy allowing authenticated users to insert their own admin_users record
    - This policy checks that the user_id matches auth.uid()
    - Ensures users can only create admin records for themselves
  
  3. Security
    - Policy is restrictive: users can only insert records where user_id = auth.uid()
    - Prevents users from creating admin records for other users
    - Existing super admin policy remains for managing other admin users
*/

-- Drop existing policies if they exist to recreate them cleanly
DROP POLICY IF EXISTS "Users can create own admin profile" ON admin_users;

-- Allow authenticated users to create their own admin profile during signup
CREATE POLICY "Users can create own admin profile"
  ON admin_users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
